---
title: 'JavaScript Web Workers API Complete Guide'
description: 'Master multi-threaded programming: Worker types, message communication, SharedArrayBuffer, and practical applications'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'js-web-workers-guide'
---

The Web Workers API allows running JavaScript in background threads without blocking the main thread. This article covers Web Workers usage and best practices.

## Basic Concepts

### Worker Types

```javascript
// 1. Dedicated Worker
// Only accessible by the script that created it
const worker = new Worker('worker.js');

// 2. Shared Worker
// Can be shared by multiple scripts
const sharedWorker = new SharedWorker('shared-worker.js');

// 3. Service Worker
// Used for offline caching and push notifications
navigator.serviceWorker.register('sw.js');
```

### Creating Workers

```javascript
// Method 1: Create from file
const worker = new Worker('worker.js');

// Method 2: Create from Blob (inline Worker)
const workerCode = `
  self.onmessage = function(e) {
    const result = e.data * 2;
    self.postMessage(result);
  };
`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);
const inlineWorker = new Worker(workerUrl);

// Method 3: Module Worker
const moduleWorker = new Worker('worker.js', { type: 'module' });
```

### Basic Communication

```javascript
// main.js
const worker = new Worker('worker.js');

// Send message
worker.postMessage({ type: 'calculate', data: [1, 2, 3, 4, 5] });

// Receive message
worker.onmessage = (event) => {
  console.log('Received result:', event.data);
};

// Error handling
worker.onerror = (error) => {
  console.error('Worker error:', error.message);
};

// Terminate Worker
worker.terminate();
```

```javascript
// worker.js
self.onmessage = (event) => {
  const { type, data } = event.data;

  if (type === 'calculate') {
    const sum = data.reduce((a, b) => a + b, 0);
    self.postMessage({ type: 'result', sum });
  }
};

// Worker can also close itself
self.close();
```

## Advanced Communication

### Transferable Objects

```javascript
// Use Transferable objects for better performance
// Ownership transfer instead of copying

// main.js
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
console.log('Length before send:', buffer.byteLength); // 1048576

// Transfer buffer (ownership transfer)
worker.postMessage(buffer, [buffer]);
console.log('Length after send:', buffer.byteLength); // 0 (transferred)

// worker.js
self.onmessage = (event) => {
  const buffer = event.data;
  console.log('Received buffer:', buffer.byteLength);

  // Return after processing
  self.postMessage(buffer, [buffer]);
};
```

### SharedArrayBuffer

```javascript
// Shared memory (multiple Workers share the same memory)
// Note: Requires proper HTTP headers

// main.js
const sharedBuffer = new SharedArrayBuffer(1024);
const sharedArray = new Int32Array(sharedBuffer);

// Send to multiple Workers
worker1.postMessage({ buffer: sharedBuffer });
worker2.postMessage({ buffer: sharedBuffer });

// worker.js
self.onmessage = (event) => {
  const sharedArray = new Int32Array(event.data.buffer);

  // Use Atomics for atomic operations
  Atomics.add(sharedArray, 0, 1);
  Atomics.store(sharedArray, 1, 100);

  const value = Atomics.load(sharedArray, 0);
  console.log('Current value:', value);
};
```

### Message Channels

```javascript
// Use MessageChannel for bidirectional communication
const channel = new MessageChannel();

// Send port to Worker
worker.postMessage({ port: channel.port2 }, [channel.port2]);

// Communicate via port1
channel.port1.onmessage = (event) => {
  console.log('Received via channel:', event.data);
};

channel.port1.postMessage('Hello via channel');

// worker.js
self.onmessage = (event) => {
  const port = event.data.port;

  port.onmessage = (e) => {
    console.log('Worker received:', e.data);
    port.postMessage('Worker reply');
  };
};
```

## Worker Wrapper Classes

### Basic Wrapper

```javascript
class WorkerWrapper {
  constructor(workerUrl) {
    this.worker = new Worker(workerUrl);
    this.callbacks = new Map();
    this.messageId = 0;

    this.worker.onmessage = (event) => {
      const { id, result, error } = event.data;

      if (this.callbacks.has(id)) {
        const { resolve, reject } = this.callbacks.get(id);
        this.callbacks.delete(id);

        if (error) {
          reject(new Error(error));
        } else {
          resolve(result);
        }
      }
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
    };
  }

  // Promise-style calls
  call(method, ...args) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      this.callbacks.set(id, { resolve, reject });
      this.worker.postMessage({ id, method, args });
    });
  }

  terminate() {
    this.worker.terminate();
    this.callbacks.clear();
  }
}

// worker.js
const methods = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b,
  heavyTask: (data) => {
    // Heavy computation
    return data.map(x => x * x).reduce((a, b) => a + b);
  }
};

self.onmessage = async (event) => {
  const { id, method, args } = event.data;

  try {
    const result = await methods[method](...args);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};

// Usage
const worker = new WorkerWrapper('worker.js');
const sum = await worker.call('add', 1, 2);
console.log('Result:', sum); // 3
```

### Worker Pool

```javascript
class WorkerPool {
  constructor(workerUrl, poolSize = navigator.hardwareConcurrency || 4) {
    this.workers = [];
    this.queue = [];
    this.activeWorkers = new Set();

    for (let i = 0; i < poolSize; i++) {
      const worker = new WorkerWrapper(workerUrl);
      this.workers.push(worker);
    }
  }

  async execute(method, ...args) {
    // Find available Worker
    const availableWorker = this.workers.find(
      w => !this.activeWorkers.has(w)
    );

    if (availableWorker) {
      return this.runTask(availableWorker, method, args);
    }

    // No available Worker, add to queue
    return new Promise((resolve, reject) => {
      this.queue.push({ method, args, resolve, reject });
    });
  }

  async runTask(worker, method, args) {
    this.activeWorkers.add(worker);

    try {
      const result = await worker.call(method, ...args);
      return result;
    } finally {
      this.activeWorkers.delete(worker);
      this.processQueue();
    }
  }

  processQueue() {
    if (this.queue.length === 0) return;

    const availableWorker = this.workers.find(
      w => !this.activeWorkers.has(w)
    );

    if (availableWorker) {
      const { method, args, resolve, reject } = this.queue.shift();
      this.runTask(availableWorker, method, args)
        .then(resolve)
        .catch(reject);
    }
  }

  terminate() {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.queue = [];
  }
}

// Usage
const pool = new WorkerPool('worker.js', 4);

// Execute multiple tasks in parallel
const results = await Promise.all([
  pool.execute('heavyTask', [1, 2, 3]),
  pool.execute('heavyTask', [4, 5, 6]),
  pool.execute('heavyTask', [7, 8, 9]),
  pool.execute('heavyTask', [10, 11, 12])
]);
```

## Practical Applications

### Image Processing

```javascript
// main.js
class ImageProcessor {
  constructor() {
    this.worker = new Worker('image-worker.js');
  }

  async applyFilter(imageData, filter) {
    return new Promise((resolve) => {
      this.worker.onmessage = (e) => {
        resolve(e.data);
      };

      // Transfer ImageData's buffer
      this.worker.postMessage(
        { imageData, filter },
        [imageData.data.buffer]
      );
    });
  }

  async processImage(canvas, filter) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const processedData = await this.applyFilter(imageData, filter);

    ctx.putImageData(
      new ImageData(processedData.data, processedData.width, processedData.height),
      0, 0
    );
  }
}

// image-worker.js
const filters = {
  grayscale: (data) => {
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i + 1] = data[i + 2] = avg;
    }
    return data;
  },

  invert: (data) => {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    return data;
  },

  blur: (data, width, height) => {
    const output = new Uint8ClampedArray(data);
    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    const kernelSum = 16;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          output[(y * width + x) * 4 + c] = sum / kernelSum;
        }
      }
    }
    return output;
  }
};

self.onmessage = (event) => {
  const { imageData, filter } = event.data;
  const { data, width, height } = imageData;

  const processedData = filters[filter](data, width, height);

  self.postMessage(
    { data: processedData, width, height },
    [processedData.buffer]
  );
};

// Usage
const processor = new ImageProcessor();
await processor.processImage(canvas, 'grayscale');
```

### Large Data Sorting

```javascript
// main.js
async function parallelSort(array, workerCount = 4) {
  const chunkSize = Math.ceil(array.length / workerCount);
  const chunks = [];

  // Split array
  for (let i = 0; i < workerCount; i++) {
    chunks.push(array.slice(i * chunkSize, (i + 1) * chunkSize));
  }

  // Parallel sort
  const sortedChunks = await Promise.all(
    chunks.map(chunk => sortChunk(chunk))
  );

  // Merge sorted results
  return mergeArrays(sortedChunks);
}

function sortChunk(chunk) {
  return new Promise((resolve) => {
    const worker = new Worker('sort-worker.js');

    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };

    worker.postMessage(chunk);
  });
}

function mergeArrays(arrays) {
  while (arrays.length > 1) {
    const merged = [];
    for (let i = 0; i < arrays.length; i += 2) {
      if (i + 1 < arrays.length) {
        merged.push(mergeTwoArrays(arrays[i], arrays[i + 1]));
      } else {
        merged.push(arrays[i]);
      }
    }
    arrays = merged;
  }
  return arrays[0];
}

function mergeTwoArrays(a, b) {
  const result = [];
  let i = 0, j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) {
      result.push(a[i++]);
    } else {
      result.push(b[j++]);
    }
  }

  return result.concat(a.slice(i)).concat(b.slice(j));
}

// sort-worker.js
self.onmessage = (event) => {
  const array = event.data;
  array.sort((a, b) => a - b);
  self.postMessage(array);
};

// Usage
const largeArray = Array.from({ length: 1000000 }, () => Math.random());
const sorted = await parallelSort(largeArray);
```

### Background Data Sync

```javascript
// main.js
class BackgroundSync {
  constructor() {
    this.worker = new Worker('sync-worker.js');
    this.callbacks = new Map();

    this.worker.onmessage = (e) => {
      const { type, data, error } = e.data;

      if (type === 'sync-complete') {
        console.log('Sync complete:', data);
      } else if (type === 'sync-error') {
        console.error('Sync error:', error);
      } else if (type === 'progress') {
        this.onProgress?.(data);
      }
    };
  }

  startSync(items) {
    this.worker.postMessage({
      type: 'start-sync',
      items
    });
  }

  stopSync() {
    this.worker.postMessage({ type: 'stop-sync' });
  }

  onProgress(callback) {
    this.onProgress = callback;
  }
}

// sync-worker.js
let isSyncing = false;

self.onmessage = async (event) => {
  const { type, items } = event.data;

  if (type === 'start-sync') {
    isSyncing = true;
    await syncItems(items);
  } else if (type === 'stop-sync') {
    isSyncing = false;
  }
};

async function syncItems(items) {
  const total = items.length;

  for (let i = 0; i < items.length; i++) {
    if (!isSyncing) break;

    try {
      await syncItem(items[i]);

      self.postMessage({
        type: 'progress',
        data: { current: i + 1, total }
      });
    } catch (error) {
      self.postMessage({
        type: 'sync-error',
        error: error.message
      });
    }
  }

  if (isSyncing) {
    self.postMessage({
      type: 'sync-complete',
      data: { synced: items.length }
    });
  }
}

async function syncItem(item) {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });

  if (!response.ok) {
    throw new Error('Sync failed');
  }

  return response.json();
}

// Usage
const sync = new BackgroundSync();

sync.onProgress((progress) => {
  updateProgressBar(progress.current / progress.total * 100);
});

sync.startSync(pendingItems);
```

### Real-time Data Processing

```javascript
// main.js
class DataStreamProcessor {
  constructor() {
    this.worker = new Worker('stream-worker.js');
    this.listeners = new Map();

    this.worker.onmessage = (e) => {
      const { event, data } = e.data;
      const callbacks = this.listeners.get(event) || [];
      callbacks.forEach(cb => cb(data));
    };
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  processStream(data) {
    this.worker.postMessage({ type: 'process', data });
  }

  setConfig(config) {
    this.worker.postMessage({ type: 'config', config });
  }
}

// stream-worker.js
let config = {
  windowSize: 100,
  threshold: 0.5
};

const buffer = [];

self.onmessage = (event) => {
  const { type, data, config: newConfig } = event.data;

  if (type === 'config') {
    config = { ...config, ...newConfig };
  } else if (type === 'process') {
    processData(data);
  }
};

function processData(data) {
  buffer.push(data);

  // Maintain window size
  if (buffer.length > config.windowSize) {
    buffer.shift();
  }

  // Calculate statistics
  const stats = calculateStats(buffer);

  self.postMessage({ event: 'stats', data: stats });

  // Anomaly detection
  if (stats.latest > config.threshold) {
    self.postMessage({
      event: 'anomaly',
      data: { value: stats.latest, threshold: config.threshold }
    });
  }
}

function calculateStats(data) {
  const sum = data.reduce((a, b) => a + b, 0);
  const avg = sum / data.length;
  const max = Math.max(...data);
  const min = Math.min(...data);

  return {
    avg,
    max,
    min,
    latest: data[data.length - 1],
    count: data.length
  };
}

// Usage
const processor = new DataStreamProcessor();

processor.on('stats', (stats) => {
  updateDashboard(stats);
});

processor.on('anomaly', (data) => {
  showAlert(`Anomaly detected: ${data.value}`);
});

// Simulate data stream
setInterval(() => {
  processor.processStream(Math.random());
}, 100);
```

## Best Practices Summary

```
Web Workers Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Use Cases                                         │
│   ├── Heavy computation (sorting, crypto, images)  │
│   ├── Data processing and transformation           │
│   ├── Background sync and polling                  │
│   └── Real-time data analysis                      │
│                                                     │
│   Performance Optimization                          │
│   ├── Use Transferable objects for large data      │
│   ├── Use Worker pools appropriately               │
│   ├── Avoid frequent Worker creation/destruction   │
│   └── Batch messages to reduce communication       │
│                                                     │
│   Considerations                                    │
│   ├── Workers cannot access DOM                    │
│   ├── Same-origin policy restrictions              │
│   ├── Handle errors properly                       │
│   └── Terminate unused Workers promptly            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Worker Type | Purpose | Lifecycle |
|-------------|---------|-----------|
| Dedicated | Private computation | With page |
| Shared | Cross-page sharing | All connections close |
| Service | Offline/push | Independent of page |

---

*Master Web Workers to unlock JavaScript multi-threaded programming capabilities.*
