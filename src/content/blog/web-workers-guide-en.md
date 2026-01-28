---
title: 'Web Workers Complete Guide: Unleashing Browser Multithreading'
description: 'Master Web Workers, Service Workers and Shared Workers usage scenarios and best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'web-workers-guide'
---

JavaScript is single-threaded, but Web Workers allow us to run code in background threads. This article explores various Worker usage methods.

## Why We Need Web Workers

### Main Thread Blocking Problem

```
Main Thread Blocking Illustration:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Without Worker:                                   │
│   ┌──────────────────────────────────────────┐     │
│   │ UI Render │ Heavy calc... │ UI Frozen │ Resp │ │
│   └──────────────────────────────────────────┘     │
│                                                     │
│   With Worker:                                      │
│   Main:  │ UI Render │ User Response │ Get Result │ │
│   Worker: │ Heavy calculation... │ Done │          │
│                                                     │
│   Result: UI stays smooth, calculation runs in BG   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Main Thread | Worker Processing |
|----------|-------------|-------------------|
| Big data processing | UI lag | Smooth response |
| Image processing | Page frozen | Background processing |
| Complex calculations | User waits | Instant feedback |

## Dedicated Worker

### Basic Usage

```typescript
// main.ts - Main thread
const worker = new Worker(
  new URL('./worker.ts', import.meta.url),
  { type: 'module' }
);

// Send message to Worker
worker.postMessage({ type: 'calculate', data: [1, 2, 3, 4, 5] });

// Receive Worker message
worker.onmessage = (event: MessageEvent) => {
  console.log('Result:', event.data);
};

// Error handling
worker.onerror = (error: ErrorEvent) => {
  console.error('Worker error:', error.message);
};

// Terminate Worker
worker.terminate();
```

```typescript
// worker.ts - Worker thread
self.onmessage = (event: MessageEvent) => {
  const { type, data } = event.data;

  switch (type) {
    case 'calculate':
      const result = data.reduce((sum: number, n: number) => sum + n, 0);
      self.postMessage({ type: 'result', value: result });
      break;
  }
};

// Can also import modules in Worker
import { heavyCalculation } from './utils';
```

### Transferring Large Data

```typescript
// Use Transferable Objects for large data
// Data becomes unusable after transfer, but extremely fast

// Main thread
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
const uint8Array = new Uint8Array(buffer);

// Fill data
for (let i = 0; i < uint8Array.length; i++) {
  uint8Array[i] = i % 256;
}

// Transfer (not copy)
worker.postMessage(buffer, [buffer]);
console.log(buffer.byteLength); // 0, data has been transferred

// Receiving in Worker
self.onmessage = (event: MessageEvent) => {
  const buffer = event.data as ArrayBuffer;
  const data = new Uint8Array(buffer);

  // Process data...

  // Transfer back to main thread
  self.postMessage(buffer, [buffer]);
};
```

### Practical Wrapper

```typescript
// workerWrapper.ts
type MessageHandler<T, R> = (data: T) => R | Promise<R>;

class TypedWorker<TInput, TOutput> {
  private worker: Worker;
  private pending = new Map<number, {
    resolve: (value: TOutput) => void;
    reject: (error: Error) => void;
  }>();
  private messageId = 0;

  constructor(workerUrl: URL) {
    this.worker = new Worker(workerUrl, { type: 'module' });
    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { id, result, error } = event.data;
    const pending = this.pending.get(id);

    if (pending) {
      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(result);
      }
      this.pending.delete(id);
    }
  }

  private handleError(error: ErrorEvent) {
    // Reject all pending Promises
    this.pending.forEach(({ reject }) => {
      reject(new Error(error.message));
    });
    this.pending.clear();
  }

  async execute(data: TInput): Promise<TOutput> {
    const id = this.messageId++;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, data });
    });
  }

  terminate() {
    this.worker.terminate();
    this.pending.clear();
  }
}

// Usage
interface CalcInput {
  numbers: number[];
  operation: 'sum' | 'average';
}

interface CalcOutput {
  result: number;
}

const calcWorker = new TypedWorker<CalcInput, CalcOutput>(
  new URL('./calc-worker.ts', import.meta.url)
);

const result = await calcWorker.execute({
  numbers: [1, 2, 3, 4, 5],
  operation: 'sum'
});
```

## Worker Pool

### Task Distribution

```typescript
// workerPool.ts
class WorkerPool<T, R> {
  private workers: Worker[] = [];
  private taskQueue: Array<{
    data: T;
    resolve: (value: R) => void;
    reject: (error: Error) => void;
  }> = [];
  private availableWorkers: Worker[] = [];

  constructor(
    private workerUrl: URL,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    this.initPool();
  }

  private initPool() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerUrl, { type: 'module' });
      worker.onmessage = (event) => this.handleComplete(worker, event);
      worker.onerror = (error) => this.handleError(worker, error);

      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  private handleComplete(worker: Worker, event: MessageEvent) {
    this.availableWorkers.push(worker);
    this.processQueue();
  }

  private handleError(worker: Worker, error: ErrorEvent) {
    console.error('Worker error:', error);
    // Restart Worker
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      worker.terminate();
      const newWorker = new Worker(this.workerUrl, { type: 'module' });
      newWorker.onmessage = (event) => this.handleComplete(newWorker, event);
      newWorker.onerror = (err) => this.handleError(newWorker, err);

      this.workers[index] = newWorker;
      this.availableWorkers.push(newWorker);
      this.processQueue();
    }
  }

  private processQueue() {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift()!;
      const worker = this.availableWorkers.pop()!;

      const handler = (event: MessageEvent) => {
        worker.removeEventListener('message', handler);
        task.resolve(event.data);
      };

      worker.addEventListener('message', handler);
      worker.postMessage(task.data);
    }
  }

  async execute(data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ data, resolve, reject });
      this.processQueue();
    });
  }

  // Batch execution
  async executeAll(items: T[]): Promise<R[]> {
    return Promise.all(items.map(item => this.execute(item)));
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
  }
}

// Usage
const pool = new WorkerPool<number[], number>(
  new URL('./sum-worker.ts', import.meta.url),
  4 // 4 Workers
);

// Process multiple tasks in parallel
const results = await pool.executeAll([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10, 11, 12]
]);
```

## Shared Worker

### Cross-Tab Communication

```typescript
// shared-worker.ts
const connections: MessagePort[] = [];

self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0];
  connections.push(port);

  port.onmessage = (e: MessageEvent) => {
    const { type, data } = e.data;

    switch (type) {
      case 'broadcast':
        // Broadcast to all connections
        connections.forEach(conn => {
          conn.postMessage({ type: 'broadcast', data });
        });
        break;

      case 'sync':
        // Sync state to new connection
        port.postMessage({ type: 'state', data: sharedState });
        break;
    }
  };

  port.start();
};

let sharedState = {};
```

```typescript
// main.ts - Using Shared Worker
const worker = new SharedWorker(
  new URL('./shared-worker.ts', import.meta.url),
  { type: 'module', name: 'app-shared' }
);

worker.port.onmessage = (event: MessageEvent) => {
  console.log('Received message:', event.data);
};

worker.port.start();

// Send message
worker.port.postMessage({ type: 'broadcast', data: 'Hello!' });
```

## Service Worker

### Offline Caching Strategy

```typescript
// service-worker.ts
const CACHE_NAME = 'app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/offline.html'
];

// Install
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Skip waiting, activate immediately
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch interception - Cache first strategy
self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then(response => {
        // Only cache successful responses
        if (!response || response.status !== 200) {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });

        return response;
      }).catch(() => {
        // Return offline page when offline
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Offline');
      });
    })
  );
});
```

### Register Service Worker

```typescript
// main.ts
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('SW registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New version available
            showUpdateNotification();
          }
        }
      });
    });
  } catch (error) {
    console.error('SW registration failed:', error);
  }
}

// Prompt user to update
function showUpdateNotification() {
  if (confirm('New version available. Refresh?')) {
    window.location.reload();
  }
}
```

## Practical Use Cases

### Image Processing

```typescript
// image-worker.ts
import { decode, encode } from 'some-image-lib';

self.onmessage = async (event: MessageEvent) => {
  const { imageData, filter } = event.data;

  const pixels = new Uint8ClampedArray(imageData.data);

  switch (filter) {
    case 'grayscale':
      for (let i = 0; i < pixels.length; i += 4) {
        const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        pixels[i] = avg;     // R
        pixels[i + 1] = avg; // G
        pixels[i + 2] = avg; // B
      }
      break;

    case 'blur':
      // Blur algorithm...
      break;
  }

  self.postMessage({
    imageData: new ImageData(pixels, imageData.width, imageData.height)
  });
};
```

### Big Data Sorting

```typescript
// sort-worker.ts
self.onmessage = (event: MessageEvent) => {
  const { data, algorithm } = event.data;

  let sorted: number[];
  const start = performance.now();

  switch (algorithm) {
    case 'quick':
      sorted = quickSort([...data]);
      break;
    case 'merge':
      sorted = mergeSort([...data]);
      break;
    default:
      sorted = [...data].sort((a, b) => a - b);
  }

  const duration = performance.now() - start;

  self.postMessage({ sorted, duration });
};

function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}

function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] < right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return [...result, ...left.slice(i), ...right.slice(j)];
}
```

## Best Practices Summary

```
Web Workers Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   When to Use Workers                               │
│   ├── CPU-intensive calculations                   │
│   ├── Big data processing and transformation       │
│   ├── Image/video processing                       │
│   └── Complex encryption/decryption               │
│                                                     │
│   Performance Optimization                          │
│   ├── Use Transferable Objects                     │
│   ├── Worker pool for concurrency                  │
│   ├── Avoid frequent create/destroy                │
│   └── Reasonable task granularity                  │
│                                                     │
│   Considerations                                    │
│   ├── Workers cannot access DOM                    │
│   ├── Same-origin restrictions                     │
│   ├── Debugging is harder                          │
│   └── Consider memory overhead                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Worker Type | Use Case |
|-------------|----------|
| Dedicated | Isolated background computation |
| Shared | Cross-tab shared state |
| Service | Offline caching/push notifications |

---

*Web Workers let JavaScript break through single-thread limitations for true parallel computing.*
