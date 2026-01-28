---
title: 'JavaScript IndexedDB API 完全指南'
description: '掌握客户端数据库：存储结构、事务操作、索引查询与性能优化'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'js-indexeddb-api-guide'
---

IndexedDB 是浏览器中的大型客户端数据库。本文详解其用法和最佳实践。

## 基础概念

### 打开数据库

```javascript
// 打开或创建数据库
const request = indexedDB.open('MyDatabase', 1);

request.onerror = (event) => {
  console.error('数据库打开失败:', event.target.error);
};

request.onsuccess = (event) => {
  const db = event.target.result;
  console.log('数据库打开成功');
};

// 数据库版本升级时触发
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  
  // 创建对象存储
  if (!db.objectStoreNames.contains('users')) {
    const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
    
    // 创建索引
    store.createIndex('email', 'email', { unique: true });
    store.createIndex('name', 'name', { unique: false });
    store.createIndex('age', 'age', { unique: false });
  }
};
```

### 基本 CRUD 操作

```javascript
class IndexedDBStore {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }
  
  async open(upgradeCallback) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        upgradeCallback?.(db, event.oldVersion, event.newVersion);
      };
    });
  }
  
  // 添加数据
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // 获取数据
  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // 更新数据
  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // 删除数据
  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // 获取所有数据
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // 清空存储
  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // 计数
  async count(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  close() {
    this.db?.close();
  }
}

// 使用
const store = new IndexedDBStore('MyApp', 1);

await store.open((db, oldVersion, newVersion) => {
  if (!db.objectStoreNames.contains('users')) {
    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
    userStore.createIndex('email', 'email', { unique: true });
  }
});

// CRUD 操作
const userId = await store.add('users', { name: 'John', email: 'john@example.com' });
const user = await store.get('users', userId);
await store.put('users', { ...user, name: 'John Doe' });
const allUsers = await store.getAll('users');
```

## 索引查询

### 使用索引

```javascript
class QueryBuilder {
  constructor(db, storeName) {
    this.db = db;
    this.storeName = storeName;
  }
  
  // 通过索引查询
  async findByIndex(indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index(indexName);
      const request = index.get(value);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // 查询所有匹配项
  async findAllByIndex(indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // 范围查询
  async findByRange(indexName, lowerBound, upperBound, options = {}) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index(indexName);
      
      let range;
      if (lowerBound !== undefined && upperBound !== undefined) {
        range = IDBKeyRange.bound(
          lowerBound, 
          upperBound,
          options.lowerOpen || false,
          options.upperOpen || false
        );
      } else if (lowerBound !== undefined) {
        range = IDBKeyRange.lowerBound(lowerBound, options.lowerOpen || false);
      } else if (upperBound !== undefined) {
        range = IDBKeyRange.upperBound(upperBound, options.upperOpen || false);
      }
      
      const request = index.getAll(range, options.limit);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // 游标遍历
  async forEach(callback, indexName = null, range = null, direction = 'next') {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const source = indexName ? store.index(indexName) : store;
      const request = source.openCursor(range, direction);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const shouldContinue = callback(cursor.value, cursor.key);
          if (shouldContinue !== false) {
            cursor.continue();
          }
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  // 分页查询
  async paginate(page, pageSize, indexName = null, direction = 'next') {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const source = indexName ? store.index(indexName) : store;
      
      const results = [];
      let skipped = 0;
      const skipCount = (page - 1) * pageSize;
      
      const request = source.openCursor(null, direction);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          if (skipped < skipCount) {
            skipped++;
            cursor.continue();
          } else if (results.length < pageSize) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

// 使用
const query = new QueryBuilder(db, 'users');

// 按邮箱查找
const user = await query.findByIndex('email', 'john@example.com');

// 年龄范围查询
const adults = await query.findByRange('age', 18, 65);

// 分页
const page1 = await query.paginate(1, 10, 'name');
```

### 复合索引

```javascript
// 创建复合索引
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  
  if (!db.objectStoreNames.contains('products')) {
    const store = db.createObjectStore('products', { keyPath: 'id' });
    
    // 复合索引
    store.createIndex('category_price', ['category', 'price'], { unique: false });
    store.createIndex('brand_name', ['brand', 'name'], { unique: false });
  }
};

// 使用复合索引查询
async function findProducts(category, minPrice, maxPrice) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('products', 'readonly');
    const store = transaction.objectStore('products');
    const index = store.index('category_price');
    
    const range = IDBKeyRange.bound(
      [category, minPrice],
      [category, maxPrice]
    );
    
    const request = index.getAll(range);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const electronics = await findProducts('electronics', 100, 500);
```

## 事务管理

### 事务操作

```javascript
class TransactionManager {
  constructor(db) {
    this.db = db;
  }
  
  // 执行事务
  async execute(storeNames, mode, operations) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeNames, mode);
      const results = [];
      
      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      try {
        const stores = {};
        (Array.isArray(storeNames) ? storeNames : [storeNames]).forEach(name => {
          stores[name] = transaction.objectStore(name);
        });
        
        operations(stores, results, transaction);
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    });
  }
  
  // 批量写入
  async batchWrite(storeName, items) {
    return this.execute(storeName, 'readwrite', (stores, results) => {
      const store = stores[storeName];
      
      items.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => results.push(request.result);
      });
    });
  }
  
  // 跨存储事务
  async transfer(fromStore, toStore, key, transform) {
    return this.execute([fromStore, toStore], 'readwrite', (stores, results) => {
      const from = stores[fromStore];
      const to = stores[toStore];
      
      const getRequest = from.get(key);
      
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          const transformed = transform(data);
          to.add(transformed);
          from.delete(key);
          results.push(transformed);
        }
      };
    });
  }
}

// 使用
const txManager = new TransactionManager(db);

// 批量写入
await txManager.batchWrite('users', [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
]);

// 跨存储转移
await txManager.transfer('cart', 'orders', cartId, (cart) => ({
  ...cart,
  orderId: generateOrderId(),
  orderDate: new Date()
}));
```

## 实际应用场景

### 离线数据缓存

```javascript
class OfflineCache {
  constructor(dbName = 'offline-cache') {
    this.store = new IndexedDBStore(dbName, 1);
  }
  
  async init() {
    await this.store.open((db) => {
      if (!db.objectStoreNames.contains('cache')) {
        const store = db.createObjectStore('cache', { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('type', 'type');
      }
    });
  }
  
  async set(url, data, type = 'json', ttl = 3600000) {
    const entry = {
      url,
      data,
      type,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    };
    
    await this.store.put('cache', entry);
  }
  
  async get(url) {
    const entry = await this.store.get('cache', url);
    
    if (!entry) return null;
    
    // 检查是否过期
    if (entry.expires < Date.now()) {
      await this.store.delete('cache', url);
      return null;
    }
    
    return entry.data;
  }
  
  async fetch(url, options = {}) {
    // 尝试从缓存获取
    const cached = await this.get(url);
    if (cached && !options.forceRefresh) {
      return cached;
    }
    
    // 在线获取
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // 存入缓存
      await this.set(url, data, 'json', options.ttl);
      
      return data;
    } catch (error) {
      // 离线时返回缓存（即使过期）
      const entry = await this.store.get('cache', url);
      if (entry) {
        return entry.data;
      }
      throw error;
    }
  }
  
  async clearExpired() {
    const now = Date.now();
    const transaction = this.store.db.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('timestamp');
    
    const request = index.openCursor();
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.expires < now) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }
}

// 使用
const cache = new OfflineCache();
await cache.init();

const users = await cache.fetch('/api/users', { ttl: 600000 }); // 10分钟缓存
```

### 文件存储

```javascript
class FileStorage {
  constructor() {
    this.store = new IndexedDBStore('file-storage', 1);
  }
  
  async init() {
    await this.store.open((db) => {
      if (!db.objectStoreNames.contains('files')) {
        const store = db.createObjectStore('files', { keyPath: 'id' });
        store.createIndex('name', 'name');
        store.createIndex('type', 'type');
        store.createIndex('folder', 'folder');
        store.createIndex('createdAt', 'createdAt');
      }
    });
  }
  
  async saveFile(file, folder = '/') {
    const id = crypto.randomUUID();
    const arrayBuffer = await file.arrayBuffer();
    
    const fileRecord = {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      folder,
      data: arrayBuffer,
      createdAt: Date.now(),
      lastModified: file.lastModified
    };
    
    await this.store.add('files', fileRecord);
    return id;
  }
  
  async getFile(id) {
    const record = await this.store.get('files', id);
    if (!record) return null;
    
    return new File([record.data], record.name, {
      type: record.type,
      lastModified: record.lastModified
    });
  }
  
  async listFolder(folder = '/') {
    const query = new QueryBuilder(this.store.db, 'files');
    return query.findAllByIndex('folder', folder);
  }
  
  async deleteFile(id) {
    await this.store.delete('files', id);
  }
  
  async getStorageUsage() {
    const files = await this.store.getAll('files');
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    return {
      fileCount: files.length,
      totalSize,
      formattedSize: this.formatSize(totalSize)
    };
  }
  
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let index = 0;
    let size = bytes;
    
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index++;
    }
    
    return `${size.toFixed(2)} ${units[index]}`;
  }
}

// 使用
const fileStorage = new FileStorage();
await fileStorage.init();

// 保存文件
const input = document.querySelector('input[type="file"]');
input.addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const id = await fileStorage.saveFile(file, '/documents');
    console.log('文件已保存:', id);
  }
});

// 获取文件
const file = await fileStorage.getFile(fileId);
const url = URL.createObjectURL(file);
```

### 同步队列

```javascript
class SyncQueue {
  constructor() {
    this.store = new IndexedDBStore('sync-queue', 1);
    this.processing = false;
  }
  
  async init() {
    await this.store.open((db) => {
      if (!db.objectStoreNames.contains('queue')) {
        const store = db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('status', 'status');
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('retryCount', 'retryCount');
      }
    });
    
    // 监听在线状态
    window.addEventListener('online', () => this.processQueue());
  }
  
  async add(action, data, options = {}) {
    const item = {
      action,
      data,
      status: 'pending',
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      createdAt: Date.now()
    };
    
    const id = await this.store.add('queue', item);
    
    // 如果在线，立即处理
    if (navigator.onLine) {
      this.processQueue();
    }
    
    return id;
  }
  
  async processQueue() {
    if (this.processing) return;
    this.processing = true;
    
    try {
      const query = new QueryBuilder(this.store.db, 'queue');
      const pending = await query.findAllByIndex('status', 'pending');
      
      for (const item of pending) {
        try {
          await this.processItem(item);
          await this.store.delete('queue', item.id);
        } catch (error) {
          await this.handleError(item, error);
        }
      }
    } finally {
      this.processing = false;
    }
  }
  
  async processItem(item) {
    // 更新状态
    await this.store.put('queue', { ...item, status: 'processing' });
    
    // 执行同步操作
    const response = await fetch(`/api/${item.action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  }
  
  async handleError(item, error) {
    const retryCount = item.retryCount + 1;
    
    if (retryCount >= item.maxRetries) {
      // 标记为失败
      await this.store.put('queue', {
        ...item,
        status: 'failed',
        error: error.message,
        retryCount
      });
    } else {
      // 等待重试
      await this.store.put('queue', {
        ...item,
        status: 'pending',
        retryCount
      });
    }
  }
  
  async getQueueStatus() {
    const all = await this.store.getAll('queue');
    
    return {
      total: all.length,
      pending: all.filter(i => i.status === 'pending').length,
      processing: all.filter(i => i.status === 'processing').length,
      failed: all.filter(i => i.status === 'failed').length
    };
  }
  
  async retryFailed() {
    const query = new QueryBuilder(this.store.db, 'queue');
    const failed = await query.findAllByIndex('status', 'failed');
    
    for (const item of failed) {
      await this.store.put('queue', {
        ...item,
        status: 'pending',
        retryCount: 0
      });
    }
    
    this.processQueue();
  }
}

// 使用
const syncQueue = new SyncQueue();
await syncQueue.init();

// 添加同步任务
await syncQueue.add('updateUser', { id: 1, name: 'John' });
await syncQueue.add('createOrder', { items: [...] });

// 检查状态
const status = await syncQueue.getQueueStatus();
console.log('队列状态:', status);
```

## 最佳实践总结

```
IndexedDB 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   数据库设计                                        │
│   ├── 合理规划版本迁移                             │
│   ├── 选择合适的主键                               │
│   ├── 创建必要的索引                               │
│   └── 避免存储过大数据                             │
│                                                     │
│   性能优化                                          │
│   ├── 批量操作使用事务                             │
│   ├── 利用索引加速查询                             │
│   ├── 使用游标分批处理                             │
│   └── 及时关闭数据库连接                           │
│                                                     │
│   错误处理                                          │
│   ├── 处理版本冲突                                 │
│   ├── 处理存储配额                                 │
│   ├── 事务失败回滚                                 │
│   └── 优雅降级方案                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 特性 | 说明 |
|------|------|
| 存储容量 | 通常为可用磁盘的 50% |
| 数据类型 | 结构化数据、Blob、ArrayBuffer |
| 事务 | 支持读写事务 |
| 索引 | 支持单列和复合索引 |

---

*掌握 IndexedDB，构建强大的离线应用。*
