---
title: '浏览器存储完全指南：从 Cookie 到 IndexedDB'
description: '掌握 localStorage、sessionStorage、IndexedDB 和 Cookie 的使用场景与最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'browser-storage-guide'
---

浏览器提供了多种客户端存储方案。本文探讨各种存储 API 的特点和使用场景。

## 存储方案对比

### 容量与特性

```
浏览器存储对比：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Cookie                                            │
│   ├── 容量: ~4KB                                   │
│   ├── 随请求发送到服务器                           │
│   ├── 可设置过期时间                               │
│   └── 支持 HttpOnly、Secure                        │
│                                                     │
│   localStorage                                      │
│   ├── 容量: ~5-10MB                                │
│   ├── 永久存储，需手动清除                         │
│   ├── 同步 API                                     │
│   └── 同源共享                                     │
│                                                     │
│   sessionStorage                                    │
│   ├── 容量: ~5-10MB                                │
│   ├── 标签页关闭即清除                             │
│   ├── 同步 API                                     │
│   └── 仅当前标签页                                 │
│                                                     │
│   IndexedDB                                         │
│   ├── 容量: 无硬性限制                             │
│   ├── 异步 API，支持事务                           │
│   ├── 可存储结构化数据                             │
│   └── 支持索引查询                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 存储方式 | 容量 | 生命周期 | 适用场景 |
|----------|------|----------|----------|
| Cookie | 4KB | 可配置 | 认证、追踪 |
| localStorage | 5-10MB | 永久 | 用户偏好设置 |
| sessionStorage | 5-10MB | 会话 | 临时表单数据 |
| IndexedDB | 50MB+ | 永久 | 离线数据、大文件 |

## localStorage

### 基础使用

```typescript
// 存储数据
localStorage.setItem('username', 'alice');
localStorage.setItem('preferences', JSON.stringify({
  theme: 'dark',
  language: 'zh'
}));

// 读取数据
const username = localStorage.getItem('username');
const preferences = JSON.parse(localStorage.getItem('preferences') || '{}');

// 删除数据
localStorage.removeItem('username');

// 清空所有
localStorage.clear();

// 获取存储的键数量
console.log(localStorage.length);

// 通过索引获取键名
const firstKey = localStorage.key(0);
```

### 类型安全封装

```typescript
// storage.ts
interface StorageItem<T> {
  value: T;
  expiry?: number;
}

class TypedStorage {
  private prefix: string;

  constructor(prefix: string = 'app_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const item: StorageItem<T> = {
      value,
      expiry: ttlMs ? Date.now() + ttlMs : undefined
    };

    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('存储已满');
        this.cleanup();
      }
      throw error;
    }
  }

  get<T>(key: string): T | null {
    const raw = localStorage.getItem(this.getKey(key));
    if (!raw) return null;

    try {
      const item: StorageItem<T> = JSON.parse(raw);

      // 检查过期
      if (item.expiry && Date.now() > item.expiry) {
        this.remove(key);
        return null;
      }

      return item.value;
    } catch {
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // 清理过期数据
  cleanup(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const item = JSON.parse(raw);
            if (item.expiry && Date.now() > item.expiry) {
              keysToRemove.push(key);
            }
          } catch {
            // 无效数据，也清理
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// 使用
const storage = new TypedStorage('myapp_');

// 存储用户设置（1小时过期）
storage.set('userSettings', { theme: 'dark' }, 60 * 60 * 1000);

// 读取
const settings = storage.get<{ theme: string }>('userSettings');
```

### 监听存储变化

```typescript
// 监听其他标签页的存储变化
window.addEventListener('storage', (event: StorageEvent) => {
  console.log('存储变化:', {
    key: event.key,
    oldValue: event.oldValue,
    newValue: event.newValue,
    url: event.url
  });

  // 响应登出
  if (event.key === 'auth_token' && event.newValue === null) {
    window.location.href = '/login';
  }
});

// 同一标签页内的变化需要手动通知
class ObservableStorage extends TypedStorage {
  private listeners = new Map<string, Set<(value: any) => void>>();

  subscribe<T>(key: string, callback: (value: T | null) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // 立即调用一次
    callback(this.get(key));

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    super.set(key, value, ttlMs);
    this.notify(key, value);
  }

  private notify(key: string, value: any): void {
    this.listeners.get(key)?.forEach(cb => cb(value));
  }
}
```

## sessionStorage

### 表单数据暂存

```typescript
// 表单自动保存
class FormAutoSave {
  private formId: string;
  private saveInterval: number;
  private intervalId?: number;

  constructor(formId: string, saveIntervalMs: number = 5000) {
    this.formId = formId;
    this.saveInterval = saveIntervalMs;
    this.init();
  }

  private init() {
    const form = document.getElementById(this.formId) as HTMLFormElement;
    if (!form) return;

    // 恢复保存的数据
    this.restore(form);

    // 定时保存
    this.intervalId = window.setInterval(() => {
      this.save(form);
    }, this.saveInterval);

    // 表单提交时清除
    form.addEventListener('submit', () => {
      this.clear();
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    });
  }

  private save(form: HTMLFormElement) {
    const formData = new FormData(form);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        data[key] = value;
      }
    });

    sessionStorage.setItem(`form_${this.formId}`, JSON.stringify(data));
  }

  private restore(form: HTMLFormElement) {
    const saved = sessionStorage.getItem(`form_${this.formId}`);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      Object.entries(data).forEach(([key, value]) => {
        const input = form.elements.namedItem(key) as HTMLInputElement;
        if (input) {
          input.value = value as string;
        }
      });
    } catch {
      // 忽略解析错误
    }
  }

  private clear() {
    sessionStorage.removeItem(`form_${this.formId}`);
  }
}

// 使用
new FormAutoSave('checkout-form', 3000);
```

## Cookie

### 操作封装

```typescript
// cookie.ts
interface CookieOptions {
  expires?: Date | number; // 日期或天数
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

const CookieManager = {
  set(name: string, value: string, options: CookieOptions = {}): void {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires) {
      const expires = options.expires instanceof Date
        ? options.expires
        : new Date(Date.now() + options.expires * 24 * 60 * 60 * 1000);
      cookie += `; expires=${expires.toUTCString()}`;
    }

    if (options.path) {
      cookie += `; path=${options.path}`;
    }

    if (options.domain) {
      cookie += `; domain=${options.domain}`;
    }

    if (options.secure) {
      cookie += '; secure';
    }

    if (options.sameSite) {
      cookie += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookie;
  },

  get(name: string): string | null {
    const cookies = document.cookie.split('; ');
    const found = cookies.find(c => c.startsWith(`${encodeURIComponent(name)}=`));

    if (found) {
      return decodeURIComponent(found.split('=')[1]);
    }

    return null;
  },

  remove(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
    this.set(name, '', {
      ...options,
      expires: new Date(0)
    });
  },

  getAll(): Record<string, string> {
    const result: Record<string, string> = {};

    document.cookie.split('; ').forEach(cookie => {
      const [name, value] = cookie.split('=');
      result[decodeURIComponent(name)] = decodeURIComponent(value);
    });

    return result;
  }
};

// 使用
CookieManager.set('session_id', 'abc123', {
  expires: 7, // 7天
  path: '/',
  secure: true,
  sameSite: 'Lax'
});

const sessionId = CookieManager.get('session_id');
```

## IndexedDB

### 基础操作

```typescript
// indexeddb.ts
class Database {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private version: number;

  constructor(dbName: string, version: number = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.onUpgrade(db, event.oldVersion);
      };
    });
  }

  protected onUpgrade(db: IDBDatabase, oldVersion: number): void {
    // 子类实现
  }

  protected getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('数据库未打开');
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.add(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }
}
```

### 实际应用：待办事项

```typescript
// todoDb.ts
interface Todo {
  id?: number;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class TodoDatabase extends Database {
  private static STORE_NAME = 'todos';

  constructor() {
    super('TodoApp', 1);
  }

  protected onUpgrade(db: IDBDatabase, oldVersion: number): void {
    if (oldVersion < 1) {
      const store = db.createObjectStore(TodoDatabase.STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true
      });

      store.createIndex('completed', 'completed');
      store.createIndex('createdAt', 'createdAt');
    }
  }

  async addTodo(title: string): Promise<number> {
    const todo: Omit<Todo, 'id'> = {
      title,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.add(TodoDatabase.STORE_NAME, todo) as Promise<number>;
  }

  async getTodo(id: number): Promise<Todo | undefined> {
    return this.get(TodoDatabase.STORE_NAME, id);
  }

  async getAllTodos(): Promise<Todo[]> {
    return this.getAll(TodoDatabase.STORE_NAME);
  }

  async toggleTodo(id: number): Promise<void> {
    const todo = await this.getTodo(id);
    if (todo) {
      todo.completed = !todo.completed;
      todo.updatedAt = new Date();
      await this.put(TodoDatabase.STORE_NAME, todo);
    }
  }

  async deleteTodo(id: number): Promise<void> {
    return this.delete(TodoDatabase.STORE_NAME, id);
  }

  async getByStatus(completed: boolean): Promise<Todo[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(TodoDatabase.STORE_NAME, 'readonly');
      const index = store.index('completed');
      const request = index.getAll(completed);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

// 使用
const todoDb = new TodoDatabase();
await todoDb.open();

const id = await todoDb.addTodo('学习 IndexedDB');
const todos = await todoDb.getAllTodos();
await todoDb.toggleTodo(id);
```

## 存储策略

### 分层存储

```typescript
// storageStrategy.ts
interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

class MemoryStorage implements StorageAdapter {
  private cache = new Map<string, any>();

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get(key) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

class LocalStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

// 分层缓存
class TieredStorage {
  private layers: StorageAdapter[];

  constructor(layers: StorageAdapter[]) {
    this.layers = layers;
  }

  async get<T>(key: string): Promise<T | null> {
    for (let i = 0; i < this.layers.length; i++) {
      const value = await this.layers[i].get<T>(key);
      if (value !== null) {
        // 回填上层缓存
        for (let j = 0; j < i; j++) {
          await this.layers[j].set(key, value);
        }
        return value;
      }
    }
    return null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await Promise.all(
      this.layers.map(layer => layer.set(key, value))
    );
  }
}

// 使用
const storage = new TieredStorage([
  new MemoryStorage(),      // L1: 内存（最快）
  new LocalStorageAdapter() // L2: localStorage（持久）
]);
```

## 最佳实践总结

```
浏览器存储最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   选择存储方案                                      │
│   ├── 敏感数据 → Cookie + HttpOnly                 │
│   ├── 用户偏好 → localStorage                      │
│   ├── 临时数据 → sessionStorage                    │
│   └── 大量数据 → IndexedDB                         │
│                                                     │
│   安全考虑                                          │
│   ├── 不存储敏感信息在 localStorage               │
│   ├── Cookie 设置 Secure 和 HttpOnly              │
│   ├── 使用 SameSite 防止 CSRF                     │
│   └── 存储前后验证数据完整性                       │
│                                                     │
│   性能优化                                          │
│   ├── 避免存储大对象到 localStorage               │
│   ├── IndexedDB 批量操作使用事务                  │
│   ├── 实现过期清理机制                             │
│   └── 考虑使用内存缓存层                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 需求 | 推荐方案 |
|------|----------|
| 用户登录状态 | Cookie (HttpOnly) |
| 主题/语言设置 | localStorage |
| 购物车临时数据 | sessionStorage |
| 离线文章阅读 | IndexedDB |

---

*选择正确的存储方案，让应用既安全又高效。*
