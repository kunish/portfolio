---
title: 'JavaScript IndexedDB API Complete Guide'
description: 'Master client-side databases: storage structure, transactions, index queries, and performance optimization'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'js-indexeddb-api-guide'
---

IndexedDB is a large-scale client-side database in browsers. This article covers its usage and best practices.

## Basic Concepts

### Opening a Database

```javascript
// Open or create database
const request = indexedDB.open('MyDatabase', 1);

request.onerror = (event) => {
  console.error('Database open failed:', event.target.error);
};

request.onsuccess = (event) => {
  const db = event.target.result;
  console.log('Database opened successfully');
};

// Triggered when database version upgrade is needed
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  
  // Create object store
  if (!db.objectStoreNames.contains('users')) {
    const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
    
    // Create indexes
    store.createIndex('email', 'email', { unique: true });
    store.createIndex('name', 'name', { unique: false });
    store.createIndex('age', 'age', { unique: false });
  }
};
```

### Basic CRUD Operations

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
  
  // Add data
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Get data
  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Update data
  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Delete data
  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // Get all data
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Clear store
  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // Count records
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

// Usage
const store = new IndexedDBStore('MyApp', 1);

await store.open((db, oldVersion, newVersion) => {
  if (!db.objectStoreNames.contains('users')) {
    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
    userStore.createIndex('email', 'email', { unique: true });
  }
});

// CRUD operations
const userId = await store.add('users', { name: 'John', email: 'john@example.com' });
const user = await store.get('users', userId);
await store.put('users', { ...user, name: 'John Doe' });
const allUsers = await store.getAll('users');
```

## Index Queries

### Using Indexes

```javascript
class QueryBuilder {
  constructor(db, storeName) {
    this.db = db;
    this.storeName = storeName;
  }
  
  // Query by index
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
  
  // Find all matches
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
  
  // Range query
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
  
  // Cursor iteration
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
  
  // Pagination
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

// Usage
const query = new QueryBuilder(db, 'users');

// Find by email
const user = await query.findByIndex('email', 'john@example.com');

// Age range query
const adults = await query.findByRange('age', 18, 65);

// Pagination
const page1 = await query.paginate(1, 10, 'name');
```

### Compound Indexes

```javascript
// Create compound index
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  
  if (!db.objectStoreNames.contains('products')) {
    const store = db.createObjectStore('products', { keyPath: 'id' });
    
    // Compound indexes
    store.createIndex('category_price', ['category', 'price'], { unique: false });
    store.createIndex('brand_name', ['brand', 'name'], { unique: false });
  }
};

// Query using compound index
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

## Transaction Management

### Transaction Operations

```javascript
class TransactionManager {
  constructor(db) {
    this.db = db;
  }
  
  // Execute transaction
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
  
  // Batch write
  async batchWrite(storeName, items) {
    return this.execute(storeName, 'readwrite', (stores, results) => {
      const store = stores[storeName];
      
      items.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => results.push(request.result);
      });
    });
  }
  
  // Cross-store transaction
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

// Usage
const txManager = new TransactionManager(db);

// Batch write
await txManager.batchWrite('users', [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
]);

// Cross-store transfer
await txManager.transfer('cart', 'orders', cartId, (cart) => ({
  ...cart,
  orderId: generateOrderId(),
  orderDate: new Date()
}));
```

## Practical Applications

### Offline Data Cache

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
    
    // Check if expired
    if (entry.expires < Date.now()) {
      await this.store.delete('cache', url);
      return null;
    }
    
    return entry.data;
  }
  
  async fetch(url, options = {}) {
    // Try to get from cache
    const cached = await this.get(url);
    if (cached && !options.forceRefresh) {
      return cached;
    }
    
    // Fetch online
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // Store in cache
      await this.set(url, data, 'json', options.ttl);
      
      return data;
    } catch (error) {
      // Return cache when offline (even if expired)
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

// Usage
const cache = new OfflineCache();
await cache.init();

const users = await cache.fetch('/api/users', { ttl: 600000 }); // 10 minute cache
```

### File Storage

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

// Usage
const fileStorage = new FileStorage();
await fileStorage.init();

// Save file
const input = document.querySelector('input[type="file"]');
input.addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const id = await fileStorage.saveFile(file, '/documents');
    console.log('File saved:', id);
  }
});

// Get file
const file = await fileStorage.getFile(fileId);
const url = URL.createObjectURL(file);
```

### Sync Queue

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
    
    // Listen for online status
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
    
    // Process immediately if online
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
    // Update status
    await this.store.put('queue', { ...item, status: 'processing' });
    
    // Execute sync operation
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
      // Mark as failed
      await this.store.put('queue', {
        ...item,
        status: 'failed',
        error: error.message,
        retryCount
      });
    } else {
      // Wait for retry
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

// Usage
const syncQueue = new SyncQueue();
await syncQueue.init();

// Add sync tasks
await syncQueue.add('updateUser', { id: 1, name: 'John' });
await syncQueue.add('createOrder', { items: [...] });

// Check status
const status = await syncQueue.getQueueStatus();
console.log('Queue status:', status);
```

## Best Practices Summary

```
IndexedDB Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Database Design                                   │
│   ├── Plan version migrations properly             │
│   ├── Choose appropriate primary keys              │
│   ├── Create necessary indexes                     │
│   └── Avoid storing overly large data             │
│                                                     │
│   Performance Optimization                          │
│   ├── Use transactions for batch operations        │
│   ├── Leverage indexes for faster queries          │
│   ├── Use cursors for batch processing             │
│   └── Close database connections promptly          │
│                                                     │
│   Error Handling                                    │
│   ├── Handle version conflicts                     │
│   ├── Handle storage quota                         │
│   ├── Transaction failure rollback                 │
│   └── Graceful degradation                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Feature | Description |
|---------|-------------|
| Storage capacity | Usually 50% of available disk |
| Data types | Structured data, Blob, ArrayBuffer |
| Transactions | Read/write transactions supported |
| Indexes | Single and compound indexes |

---

*Master IndexedDB to build powerful offline applications.*
