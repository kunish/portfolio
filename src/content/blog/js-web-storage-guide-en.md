---
title: 'JavaScript Web Storage API Complete Guide'
description: 'Master browser storage: localStorage, sessionStorage, IndexedDB usage and best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'js-web-storage-guide'
---

Web Storage API provides powerful local storage capabilities for browsers. This article covers various storage solutions and best practices.

## Storage API Basics

### localStorage

```javascript
// Store data
localStorage.setItem('username', 'John');
localStorage.setItem('preferences', JSON.stringify({
  theme: 'dark',
  language: 'en'
}));

// Read data
const username = localStorage.getItem('username');
const preferences = JSON.parse(localStorage.getItem('preferences'));

// Delete data
localStorage.removeItem('username');

// Clear all data
localStorage.clear();

// Get number of storage items
console.log('Storage items:', localStorage.length);

// Iterate all storage items
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`${key}: ${value}`);
}
```

### sessionStorage

```javascript
// sessionStorage usage is same as localStorage
// Difference: sessionStorage clears when page session ends

// Store session data
sessionStorage.setItem('sessionId', 'abc123');
sessionStorage.setItem('formData', JSON.stringify({
  step: 1,
  data: {}
}));

// Read session data
const sessionId = sessionStorage.getItem('sessionId');

// Auto-clears when page/tab closes
```

### Storage Events

```javascript
// Listen for storage changes (cross-tab communication)
window.addEventListener('storage', (event) => {
  console.log('Storage changed:', {
    key: event.key,           // Changed key
    oldValue: event.oldValue, // Old value
    newValue: event.newValue, // New value
    url: event.url,           // Page that triggered change
    storageArea: event.storageArea // localStorage or sessionStorage
  });
});

// Note: Only fires in other tabs, not current page
```

## Wrapped Storage Class

### Basic Storage Wrapper

```javascript
class Storage {
  constructor(type = 'local') {
    this.storage = type === 'local' ? localStorage : sessionStorage;
  }

  // Set value (auto-serialize)
  set(key, value, expires = null) {
    const data = {
      value,
      timestamp: Date.now(),
      expires: expires ? Date.now() + expires : null
    };
    this.storage.setItem(key, JSON.stringify(data));
  }

  // Get value (auto-deserialize)
  get(key, defaultValue = null) {
    const item = this.storage.getItem(key);

    if (!item) return defaultValue;

    try {
      const data = JSON.parse(item);

      // Check expiration
      if (data.expires && Date.now() > data.expires) {
        this.remove(key);
        return defaultValue;
      }

      return data.value;
    } catch {
      return item; // Compatible with non-JSON data
    }
  }

  // Remove
  remove(key) {
    this.storage.removeItem(key);
  }

  // Clear
  clear() {
    this.storage.clear();
  }

  // Check if key exists
  has(key) {
    return this.storage.getItem(key) !== null;
  }

  // Get all keys
  keys() {
    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      keys.push(this.storage.key(i));
    }
    return keys;
  }

  // Get storage size (estimate)
  size() {
    let total = 0;
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      const value = this.storage.getItem(key);
      total += key.length + value.length;
    }
    return total * 2; // UTF-16 encoding
  }
}

// Usage
const storage = new Storage('local');
storage.set('user', { name: 'John', age: 25 }, 3600000); // 1 hour expiry
const user = storage.get('user');
```

### Namespaced Storage

```javascript
class NamespacedStorage {
  constructor(namespace, type = 'local') {
    this.namespace = namespace;
    this.storage = type === 'local' ? localStorage : sessionStorage;
  }

  _getKey(key) {
    return `${this.namespace}:${key}`;
  }

  set(key, value) {
    this.storage.setItem(this._getKey(key), JSON.stringify(value));
  }

  get(key, defaultValue = null) {
    const item = this.storage.getItem(this._getKey(key));
    if (!item) return defaultValue;
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  }

  remove(key) {
    this.storage.removeItem(this._getKey(key));
  }

  // Clear current namespace
  clear() {
    const prefix = `${this.namespace}:`;
    const keysToRemove = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.storage.removeItem(key));
  }

  // Get all data in current namespace
  getAll() {
    const prefix = `${this.namespace}:`;
    const result = {};

    for (let i = 0; i < this.storage.length; i++) {
      const fullKey = this.storage.key(i);
      if (fullKey.startsWith(prefix)) {
        const key = fullKey.slice(prefix.length);
        result[key] = this.get(key);
      }
    }

    return result;
  }
}

// Usage
const userStorage = new NamespacedStorage('user');
const cartStorage = new NamespacedStorage('cart');

userStorage.set('profile', { name: 'John' });
cartStorage.set('items', [{ id: 1, qty: 2 }]);
```

## IndexedDB

### Basic Operations

```javascript
// Open database
function openDatabase(name, version = 1) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store
      if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', {
          keyPath: 'id',
          autoIncrement: true
        });

        // Create indexes
        store.createIndex('email', 'email', { unique: true });
        store.createIndex('name', 'name', { unique: false });
      }
    };
  });
}

// Add data
async function addUser(user) {
  const db = await openDatabase('myApp');

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.add(user);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get data
async function getUser(id) {
  const db = await openDatabase('myApp');

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Update data
async function updateUser(user) {
  const db = await openDatabase('myApp');

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.put(user);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Delete data
async function deleteUser(id) {
  const db = await openDatabase('myApp');

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
```

### IndexedDB Helper Class

```javascript
class IndexedDBHelper {
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
        if (upgradeCallback) {
          upgradeCallback(db, event.oldVersion, event.newVersion);
        }
      };
    });
  }

  async add(storeName, data) {
    return this._transaction(storeName, 'readwrite', store => store.add(data));
  }

  async put(storeName, data) {
    return this._transaction(storeName, 'readwrite', store => store.put(data));
  }

  async get(storeName, key) {
    return this._transaction(storeName, 'readonly', store => store.get(key));
  }

  async getAll(storeName) {
    return this._transaction(storeName, 'readonly', store => store.getAll());
  }

  async delete(storeName, key) {
    return this._transaction(storeName, 'readwrite', store => store.delete(key));
  }

  async clear(storeName) {
    return this._transaction(storeName, 'readwrite', store => store.clear());
  }

  async count(storeName) {
    return this._transaction(storeName, 'readonly', store => store.count());
  }

  // Query using index
  async getByIndex(storeName, indexName, value) {
    return this._transaction(storeName, 'readonly', store => {
      const index = store.index(indexName);
      return index.get(value);
    });
  }

  async getAllByIndex(storeName, indexName, value) {
    return this._transaction(storeName, 'readonly', store => {
      const index = store.index(indexName);
      return index.getAll(value);
    });
  }

  // Range query
  async getByRange(storeName, indexName, lower, upper) {
    return this._transaction(storeName, 'readonly', store => {
      const index = store.index(indexName);
      const range = IDBKeyRange.bound(lower, upper);
      return index.getAll(range);
    });
  }

  async _transaction(storeName, mode, callback) {
    if (!this.db) {
      throw new Error('Database not opened');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Usage
const db = new IndexedDBHelper('myApp', 1);

await db.open((database, oldVersion) => {
  if (oldVersion < 1) {
    const store = database.createObjectStore('products', { keyPath: 'id' });
    store.createIndex('category', 'category');
    store.createIndex('price', 'price');
  }
});

await db.add('products', { id: 1, name: 'Phone', category: 'Electronics', price: 999 });
const product = await db.get('products', 1);
const electronics = await db.getAllByIndex('products', 'category', 'Electronics');
```

## Practical Applications

### User Preferences

```javascript
class UserPreferences {
  constructor() {
    this.storage = new Storage('local');
    this.key = 'userPreferences';
    this.defaults = {
      theme: 'light',
      language: 'en',
      fontSize: 16,
      notifications: true,
      autoSave: true
    };
  }

  get() {
    return this.storage.get(this.key, this.defaults);
  }

  set(preferences) {
    const current = this.get();
    const updated = { ...current, ...preferences };
    this.storage.set(this.key, updated);
    this.apply(updated);
    return updated;
  }

  reset() {
    this.storage.set(this.key, this.defaults);
    this.apply(this.defaults);
    return this.defaults;
  }

  apply(preferences) {
    // Apply theme
    document.documentElement.dataset.theme = preferences.theme;

    // Apply font size
    document.documentElement.style.fontSize = `${preferences.fontSize}px`;

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('preferencesChange', {
      detail: preferences
    }));
  }

  init() {
    const preferences = this.get();
    this.apply(preferences);
    return preferences;
  }
}

// Usage
const prefs = new UserPreferences();
prefs.init();

// Update preferences
prefs.set({ theme: 'dark', fontSize: 18 });
```

### Form Auto-Save

```javascript
class FormAutoSave {
  constructor(form, options = {}) {
    this.form = form;
    this.key = options.key || `form_${form.id || 'default'}`;
    this.interval = options.interval || 5000;
    this.storage = new Storage('session');

    this.init();
  }

  init() {
    // Restore saved data
    this.restore();

    // Periodic save
    this.timer = setInterval(() => this.save(), this.interval);

    // Save on form change
    this.form.addEventListener('input', () => this.save());

    // Clear on submit
    this.form.addEventListener('submit', () => this.clear());

    // Save before page close
    window.addEventListener('beforeunload', () => this.save());
  }

  save() {
    const formData = new FormData(this.form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    this.storage.set(this.key, data);
    console.log('Form auto-saved');
  }

  restore() {
    const data = this.storage.get(this.key);

    if (!data) return;

    for (const [key, value] of Object.entries(data)) {
      const field = this.form.elements[key];
      if (field) {
        if (field.type === 'checkbox') {
          field.checked = value === 'on' || value === true;
        } else if (field.type === 'radio') {
          const radio = this.form.querySelector(`[name="${key}"][value="${value}"]`);
          if (radio) radio.checked = true;
        } else {
          field.value = value;
        }
      }
    }

    console.log('Form restored');
  }

  clear() {
    this.storage.remove(this.key);
    clearInterval(this.timer);
  }

  destroy() {
    clearInterval(this.timer);
  }
}

// Usage
const form = document.querySelector('#myForm');
new FormAutoSave(form, { interval: 3000 });
```

### Offline Data Cache

```javascript
class OfflineCache {
  constructor(dbName = 'offlineCache') {
    this.db = new IndexedDBHelper(dbName, 1);
    this.pendingSync = [];
  }

  async init() {
    await this.db.open((database) => {
      // Cache storage
      if (!database.objectStoreNames.contains('cache')) {
        database.createObjectStore('cache', { keyPath: 'key' });
      }

      // Pending sync queue
      if (!database.objectStoreNames.contains('syncQueue')) {
        const store = database.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp');
      }
    });
  }

  // Cache data
  async cache(key, data, ttl = 3600000) {
    await this.db.put('cache', {
      key,
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    });
  }

  // Get cache
  async get(key) {
    const item = await this.db.get('cache', key);

    if (!item) return null;

    // Check expiration
    if (Date.now() > item.expires) {
      await this.db.delete('cache', key);
      return null;
    }

    return item.data;
  }

  // Get with network fallback
  async getWithFallback(key, fetchFn) {
    // Try cache first
    const cached = await this.get(key);
    if (cached) return cached;

    // Try network request
    if (navigator.onLine) {
      try {
        const data = await fetchFn();
        await this.cache(key, data);
        return data;
      } catch (error) {
        console.error('Network request failed:', error);
      }
    }

    return null;
  }

  // Add to sync queue
  async addToSyncQueue(action) {
    await this.db.add('syncQueue', {
      action,
      timestamp: Date.now()
    });
  }

  // Process sync queue
  async processSyncQueue() {
    if (!navigator.onLine) return;

    const items = await this.db.getAll('syncQueue');

    for (const item of items) {
      try {
        await this.executeAction(item.action);
        await this.db.delete('syncQueue', item.id);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }

  async executeAction(action) {
    // Execute based on action type
    const { type, url, method, data } = action;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}

// Usage
const cache = new OfflineCache();
await cache.init();

// Listen for network status
window.addEventListener('online', () => {
  cache.processSyncQueue();
});

// Add to queue when offline
async function saveData(data) {
  if (navigator.onLine) {
    await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } else {
    await cache.addToSyncQueue({
      type: 'save',
      url: '/api/save',
      method: 'POST',
      data
    });
  }
}
```

### Shopping Cart Storage

```javascript
class ShoppingCart {
  constructor() {
    this.storage = new Storage('local');
    this.key = 'shoppingCart';
  }

  getItems() {
    return this.storage.get(this.key, []);
  }

  addItem(product, quantity = 1) {
    const items = this.getItems();
    const existingIndex = items.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity
      });
    }

    this.storage.set(this.key, items);
    this.notifyChange();
    return items;
  }

  updateQuantity(productId, quantity) {
    const items = this.getItems();
    const item = items.find(item => item.id === productId);

    if (item) {
      if (quantity <= 0) {
        return this.removeItem(productId);
      }
      item.quantity = quantity;
      this.storage.set(this.key, items);
      this.notifyChange();
    }

    return items;
  }

  removeItem(productId) {
    let items = this.getItems();
    items = items.filter(item => item.id !== productId);
    this.storage.set(this.key, items);
    this.notifyChange();
    return items;
  }

  clear() {
    this.storage.remove(this.key);
    this.notifyChange();
  }

  getTotal() {
    const items = this.getItems();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getCount() {
    const items = this.getItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  notifyChange() {
    window.dispatchEvent(new CustomEvent('cartChange', {
      detail: {
        items: this.getItems(),
        total: this.getTotal(),
        count: this.getCount()
      }
    }));
  }
}

// Usage
const cart = new ShoppingCart();

cart.addItem({ id: 1, name: 'Phone', price: 999 });
cart.updateQuantity(1, 2);

window.addEventListener('cartChange', (e) => {
  updateCartUI(e.detail);
});
```

## Best Practices Summary

```
Web Storage Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Storage Selection                                 │
│   ├── localStorage: Persistent data                │
│   ├── sessionStorage: Session data                 │
│   └── IndexedDB: Large/complex data                │
│                                                     │
│   Data Security                                     │
│   ├── Don't store sensitive info (passwords, tokens)│
│   ├── Consider data encryption                     │
│   └── Be aware of storage quota limits             │
│                                                     │
│   Performance                                       │
│   ├── Avoid frequent read/write operations         │
│   ├── Prefer batch operations                      │
│   └── Set reasonable expiration times              │
│                                                     │
│   User Experience                                   │
│   ├── Provide clear data option                    │
│   ├── Handle storage errors gracefully             │
│   └── Sync state across tabs                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Storage Type | Capacity | Lifetime | Use Cases |
|-------------|----------|----------|-----------|
| localStorage | ~5MB | Permanent | User settings, themes |
| sessionStorage | ~5MB | Session | Form data, temp state |
| IndexedDB | Large | Permanent | Offline data, large files |
| Cookies | ~4KB | Configurable | Auth, server communication |

---

*Master Web Storage API to build efficient frontend data storage solutions.*
