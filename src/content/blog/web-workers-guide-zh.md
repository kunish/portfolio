---
title: 'Web Workers 完全指南：释放浏览器多线程能力'
description: '掌握 Web Workers、Service Workers 和 Shared Workers 的使用场景与最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'web-workers-guide'
---

JavaScript 是单线程的，但 Web Workers 让我们能够在后台线程中运行代码。本文探讨各种 Worker 的使用方法。

## 为什么需要 Web Workers

### 主线程阻塞问题

```
主线程阻塞示意：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   无 Worker：                                       │
│   ┌──────────────────────────────────────────┐     │
│   │ UI 渲染 │ 耗时计算... │ UI 冻结 │ 响应  │     │
│   └──────────────────────────────────────────┘     │
│                                                     │
│   有 Worker：                                       │
│   主线程: │ UI 渲染 │ 响应用户 │ 接收结果 │        │
│   Worker:  │ 耗时计算... │ 完成 │                  │
│                                                     │
│   结果：UI 保持流畅，计算在后台进行                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 主线程处理 | Worker 处理 |
|------|------------|-------------|
| 大数据处理 | UI 卡顿 | 流畅响应 |
| 图像处理 | 页面冻结 | 后台处理 |
| 复杂计算 | 用户等待 | 即时反馈 |

## Dedicated Worker

### 基础使用

```typescript
// main.ts - 主线程
const worker = new Worker(
  new URL('./worker.ts', import.meta.url),
  { type: 'module' }
);

// 发送消息给 Worker
worker.postMessage({ type: 'calculate', data: [1, 2, 3, 4, 5] });

// 接收 Worker 消息
worker.onmessage = (event: MessageEvent) => {
  console.log('结果:', event.data);
};

// 错误处理
worker.onerror = (error: ErrorEvent) => {
  console.error('Worker 错误:', error.message);
};

// 终止 Worker
worker.terminate();
```

```typescript
// worker.ts - Worker 线程
self.onmessage = (event: MessageEvent) => {
  const { type, data } = event.data;

  switch (type) {
    case 'calculate':
      const result = data.reduce((sum: number, n: number) => sum + n, 0);
      self.postMessage({ type: 'result', value: result });
      break;
  }
};

// Worker 中也可以导入模块
import { heavyCalculation } from './utils';
```

### 传输大数据

```typescript
// 使用 Transferable Objects 传输大型数据
// 传输后原数据不可用，但速度极快

// 主线程
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
const uint8Array = new Uint8Array(buffer);

// 填充数据
for (let i = 0; i < uint8Array.length; i++) {
  uint8Array[i] = i % 256;
}

// 传输（不是复制）
worker.postMessage(buffer, [buffer]);
console.log(buffer.byteLength); // 0，数据已被转移

// Worker 中接收
self.onmessage = (event: MessageEvent) => {
  const buffer = event.data as ArrayBuffer;
  const data = new Uint8Array(buffer);

  // 处理数据...

  // 传回主线程
  self.postMessage(buffer, [buffer]);
};
```

### 实用封装

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
    // 拒绝所有待处理的 Promise
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

// 使用
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

## Worker 池

### 任务分发

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
    console.error('Worker 错误:', error);
    // 重启 Worker
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

  // 批量执行
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

// 使用
const pool = new WorkerPool<number[], number>(
  new URL('./sum-worker.ts', import.meta.url),
  4 // 4 个 Worker
);

// 并行处理多个任务
const results = await pool.executeAll([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10, 11, 12]
]);
```

## Shared Worker

### 跨标签页通信

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
        // 广播给所有连接
        connections.forEach(conn => {
          conn.postMessage({ type: 'broadcast', data });
        });
        break;

      case 'sync':
        // 同步状态给新连接
        port.postMessage({ type: 'state', data: sharedState });
        break;
    }
  };

  port.start();
};

let sharedState = {};
```

```typescript
// main.ts - 使用 Shared Worker
const worker = new SharedWorker(
  new URL('./shared-worker.ts', import.meta.url),
  { type: 'module', name: 'app-shared' }
);

worker.port.onmessage = (event: MessageEvent) => {
  console.log('收到消息:', event.data);
};

worker.port.start();

// 发送消息
worker.port.postMessage({ type: 'broadcast', data: 'Hello!' });
```

## Service Worker

### 离线缓存策略

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

// 安装
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // 跳过等待，立即激活
  self.skipWaiting();
});

// 激活
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
  // 立即控制所有客户端
  self.clients.claim();
});

// 请求拦截 - 缓存优先策略
self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then(response => {
        // 只缓存成功的响应
        if (!response || response.status !== 200) {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });

        return response;
      }).catch(() => {
        // 离线时返回离线页面
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Offline');
      });
    })
  );
});
```

### 注册 Service Worker

```typescript
// main.ts
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker 不支持');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('SW 注册成功:', registration.scope);

    // 检查更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // 有新版本可用
            showUpdateNotification();
          }
        }
      });
    });
  } catch (error) {
    console.error('SW 注册失败:', error);
  }
}

// 提示用户更新
function showUpdateNotification() {
  if (confirm('新版本可用，是否刷新？')) {
    window.location.reload();
  }
}
```

## 实际应用场景

### 图像处理

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
      // 模糊算法...
      break;
  }

  self.postMessage({
    imageData: new ImageData(pixels, imageData.width, imageData.height)
  });
};
```

### 大数据排序

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

## 最佳实践总结

```
Web Workers 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   何时使用 Worker                                   │
│   ├── CPU 密集型计算                               │
│   ├── 大数据处理和转换                             │
│   ├── 图像/视频处理                                │
│   └── 复杂加密/解密操作                            │
│                                                     │
│   性能优化                                          │
│   ├── 使用 Transferable Objects                   │
│   ├── Worker 池管理并发                            │
│   ├── 避免频繁创建销毁                             │
│   └── 合理拆分任务粒度                             │
│                                                     │
│   注意事项                                          │
│   ├── Worker 无法访问 DOM                          │
│   ├── 不同源限制                                   │
│   ├── 调试相对困难                                 │
│   └── 内存开销需考虑                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Worker 类型 | 适用场景 |
|-------------|----------|
| Dedicated | 独立后台计算 |
| Shared | 跨标签页共享状态 |
| Service | 离线缓存/推送通知 |

---

*Web Workers 让 JavaScript 突破单线程限制，实现真正的并行计算。*
