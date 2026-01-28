---
title: 'JavaScript Web Workers API 完全指南'
description: '掌握多线程编程：Worker 类型、消息通信、SharedArrayBuffer 与实际应用'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'js-web-workers-guide'
---

Web Workers API 允许在后台线程运行 JavaScript，不阻塞主线程。本文详解 Web Workers 的用法和最佳实践。

## 基础概念

### Worker 类型

```javascript
// 1. Dedicated Worker（专用 Worker）
// 只能被创建它的脚本访问
const worker = new Worker('worker.js');

// 2. Shared Worker（共享 Worker）
// 可被多个脚本共享
const sharedWorker = new SharedWorker('shared-worker.js');

// 3. Service Worker（服务 Worker）
// 用于离线缓存和推送通知
navigator.serviceWorker.register('sw.js');
```

### 创建 Worker

```javascript
// 方法 1：从文件创建
const worker = new Worker('worker.js');

// 方法 2：从 Blob 创建（内联 Worker）
const workerCode = `
  self.onmessage = function(e) {
    const result = e.data * 2;
    self.postMessage(result);
  };
`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);
const inlineWorker = new Worker(workerUrl);

// 方法 3：使用模块 Worker
const moduleWorker = new Worker('worker.js', { type: 'module' });
```

### 基本通信

```javascript
// main.js
const worker = new Worker('worker.js');

// 发送消息
worker.postMessage({ type: 'calculate', data: [1, 2, 3, 4, 5] });

// 接收消息
worker.onmessage = (event) => {
  console.log('收到结果:', event.data);
};

// 错误处理
worker.onerror = (error) => {
  console.error('Worker 错误:', error.message);
};

// 终止 Worker
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

// Worker 也可以主动关闭
self.close();
```

## 高级通信

### 传输可转移对象

```javascript
// 使用 Transferable 对象提高性能
// 数据所有权转移，而非复制

// main.js
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
console.log('发送前长度:', buffer.byteLength); // 1048576

// 传输 buffer（所有权转移）
worker.postMessage(buffer, [buffer]);
console.log('发送后长度:', buffer.byteLength); // 0（已转移）

// worker.js
self.onmessage = (event) => {
  const buffer = event.data;
  console.log('收到 buffer:', buffer.byteLength);

  // 处理后返回
  self.postMessage(buffer, [buffer]);
};
```

### SharedArrayBuffer

```javascript
// 共享内存（多个 Worker 共享同一块内存）
// 注意：需要设置正确的 HTTP 头

// main.js
const sharedBuffer = new SharedArrayBuffer(1024);
const sharedArray = new Int32Array(sharedBuffer);

// 发送给多个 Worker
worker1.postMessage({ buffer: sharedBuffer });
worker2.postMessage({ buffer: sharedBuffer });

// worker.js
self.onmessage = (event) => {
  const sharedArray = new Int32Array(event.data.buffer);

  // 使用 Atomics 进行原子操作
  Atomics.add(sharedArray, 0, 1);
  Atomics.store(sharedArray, 1, 100);

  const value = Atomics.load(sharedArray, 0);
  console.log('当前值:', value);
};
```

### 消息通道

```javascript
// 使用 MessageChannel 进行双向通信
const channel = new MessageChannel();

// 发送端口给 Worker
worker.postMessage({ port: channel.port2 }, [channel.port2]);

// 通过 port1 通信
channel.port1.onmessage = (event) => {
  console.log('通过通道收到:', event.data);
};

channel.port1.postMessage('Hello via channel');

// worker.js
self.onmessage = (event) => {
  const port = event.data.port;

  port.onmessage = (e) => {
    console.log('Worker 收到:', e.data);
    port.postMessage('Worker 回复');
  };
};
```

## Worker 封装类

### 基础封装

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

  // Promise 风格调用
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
    // 耗时计算
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

// 使用
const worker = new WorkerWrapper('worker.js');
const sum = await worker.call('add', 1, 2);
console.log('结果:', sum); // 3
```

### Worker 池

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
    // 查找空闲 Worker
    const availableWorker = this.workers.find(
      w => !this.activeWorkers.has(w)
    );

    if (availableWorker) {
      return this.runTask(availableWorker, method, args);
    }

    // 没有空闲 Worker，加入队列
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

// 使用
const pool = new WorkerPool('worker.js', 4);

// 并行执行多个任务
const results = await Promise.all([
  pool.execute('heavyTask', [1, 2, 3]),
  pool.execute('heavyTask', [4, 5, 6]),
  pool.execute('heavyTask', [7, 8, 9]),
  pool.execute('heavyTask', [10, 11, 12])
]);
```

## 实际应用场景

### 图像处理

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

      // 传输 ImageData 的 buffer
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

// 使用
const processor = new ImageProcessor();
await processor.processImage(canvas, 'grayscale');
```

### 大数据排序

```javascript
// main.js
async function parallelSort(array, workerCount = 4) {
  const chunkSize = Math.ceil(array.length / workerCount);
  const chunks = [];

  // 分割数组
  for (let i = 0; i < workerCount; i++) {
    chunks.push(array.slice(i * chunkSize, (i + 1) * chunkSize));
  }

  // 并行排序
  const sortedChunks = await Promise.all(
    chunks.map(chunk => sortChunk(chunk))
  );

  // 归并排序结果
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

// 使用
const largeArray = Array.from({ length: 1000000 }, () => Math.random());
const sorted = await parallelSort(largeArray);
```

### 后台数据同步

```javascript
// main.js
class BackgroundSync {
  constructor() {
    this.worker = new Worker('sync-worker.js');
    this.callbacks = new Map();

    this.worker.onmessage = (e) => {
      const { type, data, error } = e.data;

      if (type === 'sync-complete') {
        console.log('同步完成:', data);
      } else if (type === 'sync-error') {
        console.error('同步错误:', error);
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

// 使用
const sync = new BackgroundSync();

sync.onProgress((progress) => {
  updateProgressBar(progress.current / progress.total * 100);
});

sync.startSync(pendingItems);
```

### 实时数据处理

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

  // 保持窗口大小
  if (buffer.length > config.windowSize) {
    buffer.shift();
  }

  // 计算统计数据
  const stats = calculateStats(buffer);

  self.postMessage({ event: 'stats', data: stats });

  // 异常检测
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

// 使用
const processor = new DataStreamProcessor();

processor.on('stats', (stats) => {
  updateDashboard(stats);
});

processor.on('anomaly', (data) => {
  showAlert(`异常值检测: ${data.value}`);
});

// 模拟数据流
setInterval(() => {
  processor.processStream(Math.random());
}, 100);
```

## 最佳实践总结

```
Web Workers 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   适用场景                                          │
│   ├── 大量计算（排序、加密、图像处理）             │
│   ├── 数据处理和转换                               │
│   ├── 后台同步和轮询                               │
│   └── 实时数据分析                                 │
│                                                     │
│   性能优化                                          │
│   ├── 使用 Transferable 对象传输大数据             │
│   ├── 合理使用 Worker 池                           │
│   ├── 避免频繁创建/销毁 Worker                     │
│   └── 批量处理消息减少通信开销                     │
│                                                     │
│   注意事项                                          │
│   ├── Worker 无法访问 DOM                          │
│   ├── 同源策略限制                                 │
│   ├── 正确处理错误                                 │
│   └── 及时终止不需要的 Worker                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Worker 类型 | 用途 | 生命周期 |
|------------|------|---------|
| Dedicated | 专用计算 | 随页面 |
| Shared | 跨页面共享 | 所有连接关闭 |
| Service | 离线/推送 | 独立于页面 |

---

*掌握 Web Workers，解锁 JavaScript 多线程编程能力。*
