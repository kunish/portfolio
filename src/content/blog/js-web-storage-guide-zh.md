---
title: 'JavaScript Web Storage API 完全指南'
description: '掌握浏览器存储：localStorage、sessionStorage、IndexedDB 的使用与最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'js-web-storage-guide'
---

Web Storage API 为浏览器提供了强大的本地存储能力。本文详解各种存储方案的用法和最佳实践。

## Storage API 基础

### localStorage

```javascript
// 存储数据
localStorage.setItem('username', '张三');
localStorage.setItem('preferences', JSON.stringify({
  theme: 'dark',
  language: 'zh'
}));

// 读取数据
const username = localStorage.getItem('username');
const preferences = JSON.parse(localStorage.getItem('preferences'));

// 删除数据
localStorage.removeItem('username');

// 清空所有数据
localStorage.clear();

// 获取存储项数量
console.log('存储项数量:', localStorage.length);

// 遍历所有存储项
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`${key}: ${value}`);
}
```

### sessionStorage

```javascript
// sessionStorage 用法与 localStorage 相同
// 区别：sessionStorage 在页面会话结束时清除

// 存储会话数据
sessionStorage.setItem('sessionId', 'abc123');
sessionStorage.setItem('formData', JSON.stringify({
  step: 1,
  data: {}
}));

// 读取会话数据
const sessionId = sessionStorage.getItem('sessionId');

// 页面关闭或标签页关闭时自动清除
```

### 存储事件

```javascript
// 监听存储变化（跨标签页通信）
window.addEventListener('storage', (event) => {
  console.log('存储变化:', {
    key: event.key,           // 变化的键
    oldValue: event.oldValue, // 旧值
    newValue: event.newValue, // 新值
    url: event.url,           // 触发变化的页面
    storageArea: event.storageArea // localStorage 或 sessionStorage
  });
});

// 注意：只在其他标签页触发，当前页面不会触发
```

## 封装存储类

### 基础存储封装

```javascript
class Storage {
  constructor(type = 'local') {
    this.storage = type === 'local' ? localStorage : sessionStorage;
  }

  // 设置值（自动序列化）
  set(key, value, expires = null) {
    const data = {
      value,
      timestamp: Date.now(),
      expires: expires ? Date.now() + expires : null
    };
    this.storage.setItem(key, JSON.stringify(data));
  }

  // 获取值（自动反序列化）
  get(key, defaultValue = null) {
    const item = this.storage.getItem(key);

    if (!item) return defaultValue;

    try {
      const data = JSON.parse(item);

      // 检查过期
      if (data.expires && Date.now() > data.expires) {
        this.remove(key);
        return defaultValue;
      }

      return data.value;
    } catch {
      return item; // 兼容非 JSON 数据
    }
  }

  // 删除
  remove(key) {
    this.storage.removeItem(key);
  }

  // 清空
  clear() {
    this.storage.clear();
  }

  // 检查键是否存在
  has(key) {
    return this.storage.getItem(key) !== null;
  }

  // 获取所有键
  keys() {
    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      keys.push(this.storage.key(i));
    }
    return keys;
  }

  // 获取存储大小（估算）
  size() {
    let total = 0;
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      const value = this.storage.getItem(key);
      total += key.length + value.length;
    }
    return total * 2; // UTF-16 编码
  }
}

// 使用
const storage = new Storage('local');
storage.set('user', { name: '张三', age: 25 }, 3600000); // 1小时过期
const user = storage.get('user');
```

### 带命名空间的存储

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

  // 清空当前命名空间
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

  // 获取当前命名空间所有数据
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

// 使用
const userStorage = new NamespacedStorage('user');
const cartStorage = new NamespacedStorage('cart');

userStorage.set('profile', { name: '张三' });
cartStorage.set('items', [{ id: 1, qty: 2 }]);
```

## IndexedDB

### 基础操作

```javascript
// 打开数据库
function openDatabase(name, version = 1) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 创建对象存储
      if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', {
          keyPath: 'id',
          autoIncrement: true
        });

        // 创建索引
        store.createIndex('email', 'email', { unique: true });
        store.createIndex('name', 'name', { unique: false });
      }
    };
  });
}

// 添加数据
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

// 获取数据
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

// 更新数据
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

// 删除数据
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

### IndexedDB 封装类

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

  // 使用索引查询
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

  // 范围查询
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

// 使用
const db = new IndexedDBHelper('myApp', 1);

await db.open((database, oldVersion) => {
  if (oldVersion < 1) {
    const store = database.createObjectStore('products', { keyPath: 'id' });
    store.createIndex('category', 'category');
    store.createIndex('price', 'price');
  }
});

await db.add('products', { id: 1, name: '手机', category: '电子', price: 999 });
const product = await db.get('products', 1);
const electronics = await db.getAllByIndex('products', 'category', '电子');
```

## 实际应用场景

### 用户偏好设置

```javascript
class UserPreferences {
  constructor() {
    this.storage = new Storage('local');
    this.key = 'userPreferences';
    this.defaults = {
      theme: 'light',
      language: 'zh',
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
    // 应用主题
    document.documentElement.dataset.theme = preferences.theme;

    // 应用字体大小
    document.documentElement.style.fontSize = `${preferences.fontSize}px`;

    // 触发自定义事件
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

// 使用
const prefs = new UserPreferences();
prefs.init();

// 更新偏好
prefs.set({ theme: 'dark', fontSize: 18 });
```

### 表单自动保存

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
    // 恢复保存的数据
    this.restore();

    // 定时保存
    this.timer = setInterval(() => this.save(), this.interval);

    // 表单变化时保存
    this.form.addEventListener('input', () => this.save());

    // 表单提交时清除
    this.form.addEventListener('submit', () => this.clear());

    // 页面关闭前保存
    window.addEventListener('beforeunload', () => this.save());
  }

  save() {
    const formData = new FormData(this.form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    this.storage.set(this.key, data);
    console.log('表单已自动保存');
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

    console.log('表单已恢复');
  }

  clear() {
    this.storage.remove(this.key);
    clearInterval(this.timer);
  }

  destroy() {
    clearInterval(this.timer);
  }
}

// 使用
const form = document.querySelector('#myForm');
new FormAutoSave(form, { interval: 3000 });
```

### 离线数据缓存

```javascript
class OfflineCache {
  constructor(dbName = 'offlineCache') {
    this.db = new IndexedDBHelper(dbName, 1);
    this.pendingSync = [];
  }

  async init() {
    await this.db.open((database) => {
      // 缓存存储
      if (!database.objectStoreNames.contains('cache')) {
        database.createObjectStore('cache', { keyPath: 'key' });
      }

      // 待同步队列
      if (!database.objectStoreNames.contains('syncQueue')) {
        const store = database.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp');
      }
    });
  }

  // 缓存数据
  async cache(key, data, ttl = 3600000) {
    await this.db.put('cache', {
      key,
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    });
  }

  // 获取缓存
  async get(key) {
    const item = await this.db.get('cache', key);

    if (!item) return null;

    // 检查过期
    if (Date.now() > item.expires) {
      await this.db.delete('cache', key);
      return null;
    }

    return item.data;
  }

  // 带网络回退的获取
  async getWithFallback(key, fetchFn) {
    // 先尝试缓存
    const cached = await this.get(key);
    if (cached) return cached;

    // 尝试网络请求
    if (navigator.onLine) {
      try {
        const data = await fetchFn();
        await this.cache(key, data);
        return data;
      } catch (error) {
        console.error('网络请求失败:', error);
      }
    }

    return null;
  }

  // 添加到同步队列
  async addToSyncQueue(action) {
    await this.db.add('syncQueue', {
      action,
      timestamp: Date.now()
    });
  }

  // 处理同步队列
  async processSyncQueue() {
    if (!navigator.onLine) return;

    const items = await this.db.getAll('syncQueue');

    for (const item of items) {
      try {
        await this.executeAction(item.action);
        await this.db.delete('syncQueue', item.id);
      } catch (error) {
        console.error('同步失败:', error);
      }
    }
  }

  async executeAction(action) {
    // 根据 action 类型执行相应操作
    const { type, url, method, data } = action;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}

// 使用
const cache = new OfflineCache();
await cache.init();

// 监听网络状态
window.addEventListener('online', () => {
  cache.processSyncQueue();
});

// 离线时添加到队列
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

### 购物车存储

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

// 使用
const cart = new ShoppingCart();

cart.addItem({ id: 1, name: '手机', price: 999 });
cart.updateQuantity(1, 2);

window.addEventListener('cartChange', (e) => {
  updateCartUI(e.detail);
});
```

## 最佳实践总结

```
Web Storage 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   存储选择                                          │
│   ├── localStorage: 持久化数据                     │
│   ├── sessionStorage: 会话数据                     │
│   └── IndexedDB: 大量/复杂数据                     │
│                                                     │
│   数据安全                                          │
│   ├── 不存储敏感信息（密码、token）                │
│   ├── 考虑数据加密                                 │
│   └── 注意存储配额限制                             │
│                                                     │
│   性能优化                                          │
│   ├── 避免频繁读写                                 │
│   ├── 批量操作优先                                 │
│   └── 合理设置过期时间                             │
│                                                     │
│   用户体验                                          │
│   ├── 提供清除数据选项                             │
│   ├── 优雅处理存储错误                             │
│   └── 跨标签页同步状态                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 存储类型 | 容量限制 | 生命周期 | 适用场景 |
|---------|---------|---------|---------|
| localStorage | ~5MB | 永久 | 用户设置、主题 |
| sessionStorage | ~5MB | 会话 | 表单数据、临时状态 |
| IndexedDB | 大容量 | 永久 | 离线数据、大文件 |
| Cookies | ~4KB | 可设置 | 认证、服务器通信 |

---

*掌握 Web Storage API，构建高效的前端数据存储方案。*
