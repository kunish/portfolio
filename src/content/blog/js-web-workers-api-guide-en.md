---
title: 'JavaScript Web Workers API Complete Guide'
description: 'Master multi-threading: Dedicated Workers, Shared Workers, message passing, and performance optimization'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'js-web-workers-api-guide'
---

Web Workers allow running JavaScript in background threads. This article covers their usage and best practices.

## Basic Concepts

### Creating Workers

```javascript
// Main thread
// Create Worker from external file
const worker = new Worker('worker.js');

// Create Worker from Blob
const code = `
  self.onmessage = function(e) {
    const result = e.data * 2;
    self.postMessage(result);
  };
`;
const blob = new Blob([code], { type: 'application/javascript' });
const worker2 = new Worker(URL.createObjectURL(blob));

// Module Worker (ES modules)
const moduleWorker = new Worker('worker.mjs', { type: 'module' });
```

### Message Passing

```javascript
// Main thread
const worker = new Worker('worker.js');

// Send message
worker.postMessage({ action: 'compute', data: [1, 2, 3, 4, 5] });

// Receive message
worker.onmessage = (event) => {
  console.log('Worker returned:', event.data);
};

// Error handling
worker.onerror = (error) => {
  console.error('Worker error:', error.message);
  console.error('File:', error.filename);
  console.error('Line:', error.lineno);
};

// Terminate Worker
worker.terminate();
```

```javascript
// worker.js
self.onmessage = (event) => {
  const { action, data } = event.data;
  
  if (action === 'compute') {
    const result = data.reduce((sum, n) => sum + n, 0);
    self.postMessage({ result });
  }
};

// Worker closes itself
self.close();
```

### Transferable Objects

```javascript
// Main thread - Transfer ArrayBuffer (zero-copy)
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
const uint8 = new Uint8Array(buffer);

// Fill data
for (let i = 0; i < uint8.length; i++) {
  uint8[i] = i % 256;
}

// Transfer instead of copy (buffer becomes unusable in main thread)
worker.postMessage({ buffer }, [buffer]);

console.log(buffer.byteLength); // 0 - transferred

// worker.js
self.onmessage = (event) => {
  const { buffer } = event.data;
  const uint8 = new Uint8Array(buffer);
  
  // Process data...
  
  // Transfer back to main thread
  self.postMessage({ buffer }, [buffer]);
};
```

## Advanced Usage

### Worker Wrapper Class

```javascript
class WorkerWrapper {
  constructor(workerPath) {
    this.worker = new Worker(workerPath);
    this.pendingTasks = new Map();
    this.taskId = 0;
    
    this.worker.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    
    this.worker.onerror = (error) => {
      this.handleError(error);
    };
  }
  
  // Async task execution
  execute(action, data) {
    return new Promise((resolve, reject) => {
      const id = this.taskId++;
      
      this.pendingTasks.set(id, { resolve, reject });
      
      this.worker.postMessage({
        id,
        action,
        data
      });
    });
  }
  
  handleMessage(message) {
    const { id, result, error } = message;
    
    const task = this.pendingTasks.get(id);
    if (task) {
      this.pendingTasks.delete(id);
      
      if (error) {
        task.reject(new Error(error));
      } else {
        task.resolve(result);
      }
    }
  }
  
  handleError(error) {
    // Reject all pending tasks
    for (const [id, task] of this.pendingTasks) {
      task.reject(error);
    }
    this.pendingTasks.clear();
  }
  
  terminate() {
    this.worker.terminate();
    
    // Reject all pending tasks
    for (const [id, task] of this.pendingTasks) {
      task.reject(new Error('Worker terminated'));
    }
    this.pendingTasks.clear();
  }
}

// Corresponding worker.js
self.onmessage = async (event) => {
  const { id, action, data } = event.data;
  
  try {
    let result;
    
    switch (action) {
      case 'fibonacci':
        result = fibonacci(data);
        break;
      case 'sort':
        result = data.slice().sort((a, b) => a - b);
        break;
      default:
        throw new Error('Unknown action');
    }
    
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

### Worker Pool

```javascript
class WorkerPool {
  constructor(workerPath, poolSize = navigator.hardwareConcurrency || 4) {
    this.workerPath = workerPath;
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    this.workerStatus = [];
    
    this.initPool();
  }
  
  initPool() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerPath);
      
      worker.onmessage = (event) => {
        this.handleWorkerMessage(i, event.data);
      };
      
      worker.onerror = (error) => {
        this.handleWorkerError(i, error);
      };
      
      this.workers.push(worker);
      this.workerStatus.push({ busy: false, currentTask: null });
    }
  }
  
  execute(action, data) {
    return new Promise((resolve, reject) => {
      const task = { action, data, resolve, reject };
      
      const availableWorkerIndex = this.findAvailableWorker();
      
      if (availableWorkerIndex !== -1) {
        this.assignTask(availableWorkerIndex, task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }
  
  findAvailableWorker() {
    return this.workerStatus.findIndex(status => !status.busy);
  }
  
  assignTask(workerIndex, task) {
    this.workerStatus[workerIndex] = {
      busy: true,
      currentTask: task
    };
    
    this.workers[workerIndex].postMessage({
      action: task.action,
      data: task.data
    });
  }
  
  handleWorkerMessage(workerIndex, result) {
    const status = this.workerStatus[workerIndex];
    
    if (status.currentTask) {
      status.currentTask.resolve(result);
    }
    
    this.workerStatus[workerIndex] = { busy: false, currentTask: null };
    
    // Process next task in queue
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift();
      this.assignTask(workerIndex, nextTask);
    }
  }
  
  handleWorkerError(workerIndex, error) {
    const status = this.workerStatus[workerIndex];
    
    if (status.currentTask) {
      status.currentTask.reject(error);
    }
    
    this.workerStatus[workerIndex] = { busy: false, currentTask: null };
    
    // Recreate Worker
    this.workers[workerIndex].terminate();
    this.workers[workerIndex] = new Worker(this.workerPath);
  }
  
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.workerStatus = [];
    
    // Reject all pending tasks
    this.taskQueue.forEach(task => {
      task.reject(new Error('Worker pool terminated'));
    });
    this.taskQueue = [];
  }
  
  getStats() {
    return {
      poolSize: this.poolSize,
      busyWorkers: this.workerStatus.filter(s => s.busy).length,
      queuedTasks: this.taskQueue.length
    };
  }
}

// Usage
const pool = new WorkerPool('compute-worker.js', 4);

// Execute multiple tasks in parallel
const results = await Promise.all([
  pool.execute('fibonacci', 40),
  pool.execute('fibonacci', 41),
  pool.execute('fibonacci', 42),
  pool.execute('fibonacci', 43)
]);

console.log('Results:', results);
console.log('Stats:', pool.getStats());
```

## Shared Workers

### Basic Usage

```javascript
// Main thread (can be shared across multiple pages)
const sharedWorker = new SharedWorker('shared-worker.js');
const port = sharedWorker.port;

// Must call start()
port.start();

// Send message
port.postMessage({ type: 'getData', key: 'user' });

// Receive message
port.onmessage = (event) => {
  console.log('Shared Worker returned:', event.data);
};

// Error handling
sharedWorker.onerror = (error) => {
  console.error('Shared Worker error:', error);
};
```

```javascript
// shared-worker.js
const connections = new Set();
const sharedData = new Map();

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.add(port);
  
  port.onmessage = (event) => {
    handleMessage(port, event.data);
  };
  
  port.start();
  
  // Notify connection count
  broadcastConnectionCount();
};

function handleMessage(port, message) {
  switch (message.type) {
    case 'setData':
      sharedData.set(message.key, message.value);
      // Broadcast update
      broadcast({ type: 'dataUpdated', key: message.key, value: message.value });
      break;
      
    case 'getData':
      port.postMessage({
        type: 'data',
        key: message.key,
        value: sharedData.get(message.key)
      });
      break;
      
    case 'broadcast':
      broadcast(message.data, port);
      break;
  }
}

function broadcast(message, excludePort = null) {
  connections.forEach(port => {
    if (port !== excludePort) {
      port.postMessage(message);
    }
  });
}

function broadcastConnectionCount() {
  broadcast({ type: 'connectionCount', count: connections.size });
}
```

### Cross-Tab Communication

```javascript
// shared-worker.js - Chat application example
const clients = new Map();
let clientId = 0;

self.onconnect = (event) => {
  const port = event.ports[0];
  const id = clientId++;
  
  clients.set(id, { port, username: null });
  
  port.onmessage = (event) => {
    handleMessage(id, event.data);
  };
  
  port.start();
  
  port.postMessage({ type: 'connected', clientId: id });
};

function handleMessage(clientId, message) {
  const client = clients.get(clientId);
  
  switch (message.type) {
    case 'setUsername':
      client.username = message.username;
      broadcastUserList();
      break;
      
    case 'sendMessage':
      broadcast({
        type: 'message',
        from: client.username,
        text: message.text,
        timestamp: Date.now()
      });
      break;
      
    case 'disconnect':
      clients.delete(clientId);
      broadcastUserList();
      break;
  }
}

function broadcast(message) {
  clients.forEach(client => {
    client.port.postMessage(message);
  });
}

function broadcastUserList() {
  const users = Array.from(clients.values())
    .filter(c => c.username)
    .map(c => c.username);
    
  broadcast({ type: 'userList', users });
}
```

## Practical Applications

### Image Processing

```javascript
// Main thread
class ImageProcessor {
  constructor() {
    this.worker = new Worker('image-worker.js');
    this.pending = new Map();
    this.taskId = 0;
    
    this.worker.onmessage = (event) => {
      const { id, imageData, error } = event.data;
      const task = this.pending.get(id);
      
      if (task) {
        this.pending.delete(id);
        
        if (error) {
          task.reject(new Error(error));
        } else {
          task.resolve(imageData);
        }
      }
    };
  }
  
  async process(imageData, filters) {
    return new Promise((resolve, reject) => {
      const id = this.taskId++;
      this.pending.set(id, { resolve, reject });
      
      // Transfer ImageData buffer
      this.worker.postMessage(
        { id, imageData, filters },
        [imageData.data.buffer]
      );
    });
  }
  
  async applyFilter(canvas, filterType) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const processed = await this.process(imageData, [filterType]);
    
    ctx.putImageData(processed, 0, 0);
  }
}

// image-worker.js
self.onmessage = (event) => {
  const { id, imageData, filters } = event.data;
  
  try {
    let data = new Uint8ClampedArray(imageData.data);
    
    filters.forEach(filter => {
      data = applyFilter(data, filter, imageData.width, imageData.height);
    });
    
    const result = new ImageData(data, imageData.width, imageData.height);
    
    self.postMessage(
      { id, imageData: result },
      [result.data.buffer]
    );
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};

function applyFilter(data, filter, width, height) {
  const result = new Uint8ClampedArray(data.length);
  
  switch (filter) {
    case 'grayscale':
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        result[i] = avg;
        result[i + 1] = avg;
        result[i + 2] = avg;
        result[i + 3] = data[i + 3];
      }
      break;
      
    case 'invert':
      for (let i = 0; i < data.length; i += 4) {
        result[i] = 255 - data[i];
        result[i + 1] = 255 - data[i + 1];
        result[i + 2] = 255 - data[i + 2];
        result[i + 3] = data[i + 3];
      }
      break;
      
    case 'blur':
      return applyBlur(data, width, height);
      
    default:
      return data;
  }
  
  return result;
}

function applyBlur(data, width, height) {
  const result = new Uint8ClampedArray(data.length);
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kernelSum = 16;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let k = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[k++];
          }
        }
        
        const idx = (y * width + x) * 4 + c;
        result[idx] = sum / kernelSum;
      }
      
      const idx = (y * width + x) * 4 + 3;
      result[idx] = data[idx];
    }
  }
  
  return result;
}
```

### Big Data Processing

```javascript
// Main thread
class DataProcessor {
  constructor() {
    this.pool = new WorkerPool('data-worker.js', 4);
  }
  
  async sortLargeArray(data) {
    // Chunk processing
    const chunkSize = Math.ceil(data.length / 4);
    const chunks = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    // Sort chunks in parallel
    const sortedChunks = await Promise.all(
      chunks.map(chunk => this.pool.execute('sort', chunk))
    );
    
    // Merge sorted chunks
    return this.mergeArrays(sortedChunks);
  }
  
  mergeArrays(arrays) {
    // K-way merge
    const result = [];
    const indices = arrays.map(() => 0);
    
    while (true) {
      let minVal = Infinity;
      let minIdx = -1;
      
      for (let i = 0; i < arrays.length; i++) {
        if (indices[i] < arrays[i].length && arrays[i][indices[i]] < minVal) {
          minVal = arrays[i][indices[i]];
          minIdx = i;
        }
      }
      
      if (minIdx === -1) break;
      
      result.push(minVal);
      indices[minIdx]++;
    }
    
    return result;
  }
  
  async aggregateData(data, groupBy, aggregations) {
    return this.pool.execute('aggregate', { data, groupBy, aggregations });
  }
}

// data-worker.js
self.onmessage = (event) => {
  const { action, data } = event.data;
  
  switch (action) {
    case 'sort':
      self.postMessage(data.slice().sort((a, b) => a - b));
      break;
      
    case 'aggregate':
      self.postMessage(aggregate(data.data, data.groupBy, data.aggregations));
      break;
      
    case 'filter':
      self.postMessage(data.array.filter(item => evalCondition(item, data.condition)));
      break;
  }
};

function aggregate(data, groupBy, aggregations) {
  const groups = new Map();
  
  data.forEach(item => {
    const key = item[groupBy];
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  });
  
  const result = [];
  
  groups.forEach((items, key) => {
    const row = { [groupBy]: key };
    
    aggregations.forEach(agg => {
      const values = items.map(item => item[agg.field]);
      
      switch (agg.type) {
        case 'sum':
          row[agg.alias] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          row[agg.alias] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'count':
          row[agg.alias] = values.length;
          break;
        case 'min':
          row[agg.alias] = Math.min(...values);
          break;
        case 'max':
          row[agg.alias] = Math.max(...values);
          break;
      }
    });
    
    result.push(row);
  });
  
  return result;
}
```

## Best Practices Summary

```
Web Workers Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   When to Use                                       │
│   ├── CPU-intensive computations                   │
│   ├── Large data processing                        │
│   ├── Image/video processing                       │
│   └── Complex algorithm execution                  │
│                                                     │
│   Performance Optimization                          │
│   ├── Use transferable objects to reduce copying   │
│   ├── Implement worker pool for concurrency        │
│   ├── Avoid frequent Worker creation/destruction   │
│   └── Choose appropriate task granularity          │
│                                                     │
│   Considerations                                    │
│   ├── Workers cannot access DOM                    │
│   ├── Communication has serialization overhead     │
│   ├── Debugging is more complex                    │
│   └── Mind memory management                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Worker Type | Characteristics | Use Case |
|-------------|-----------------|----------|
| Dedicated | Single page only | In-page computation |
| Shared | Shared across pages | Cross-tab communication |
| Service | Network proxy | Offline cache, push |

---

*Master Web Workers to unlock JavaScript's multi-threading potential.*
