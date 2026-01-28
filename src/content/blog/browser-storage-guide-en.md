---
title: 'Browser Storage Complete Guide: From Cookie to IndexedDB'
description: 'Master localStorage, sessionStorage, IndexedDB and Cookie usage scenarios and best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'browser-storage-guide'
---

Browsers provide multiple client-side storage solutions. This article explores the characteristics and use cases of various storage APIs.

## Storage Solutions Comparison

### Capacity and Features

```
Browser Storage Comparison:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Cookie                                            │
│   ├── Capacity: ~4KB                               │
│   ├── Sent with requests to server                 │
│   ├── Configurable expiration                      │
│   └── Supports HttpOnly, Secure                    │
│                                                     │
│   localStorage                                      │
│   ├── Capacity: ~5-10MB                            │
│   ├── Permanent, manual clearing needed            │
│   ├── Synchronous API                              │
│   └── Shared across same origin                    │
│                                                     │
│   sessionStorage                                    │
│   ├── Capacity: ~5-10MB                            │
│   ├── Cleared when tab closes                      │
│   ├── Synchronous API                              │
│   └── Current tab only                             │
│                                                     │
│   IndexedDB                                         │
│   ├── Capacity: No hard limit                      │
│   ├── Async API, supports transactions             │
│   ├── Can store structured data                    │
│   └── Supports indexed queries                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Storage Type | Capacity | Lifetime | Use Case |
|--------------|----------|----------|----------|
| Cookie | 4KB | Configurable | Auth, tracking |
| localStorage | 5-10MB | Permanent | User preferences |
| sessionStorage | 5-10MB | Session | Temp form data |
| IndexedDB | 50MB+ | Permanent | Offline data, large files |

## localStorage

### Basic Usage

```typescript
// Store data
localStorage.setItem('username', 'alice');
localStorage.setItem('preferences', JSON.stringify({
  theme: 'dark',
  language: 'en'
}));

// Read data
const username = localStorage.getItem('username');
const preferences = JSON.parse(localStorage.getItem('preferences') || '{}');

// Remove data
localStorage.removeItem('username');

// Clear all
localStorage.clear();

// Get number of stored keys
console.log(localStorage.length);

// Get key name by index
const firstKey = localStorage.key(0);
```

### Type-Safe Wrapper

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
        console.error('Storage full');
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

      // Check expiry
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

  // Clean up expired data
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
            // Invalid data, clean up too
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// Usage
const storage = new TypedStorage('myapp_');

// Store user settings (expires in 1 hour)
storage.set('userSettings', { theme: 'dark' }, 60 * 60 * 1000);

// Read
const settings = storage.get<{ theme: string }>('userSettings');
```

### Listening to Storage Changes

```typescript
// Listen to storage changes from other tabs
window.addEventListener('storage', (event: StorageEvent) => {
  console.log('Storage changed:', {
    key: event.key,
    oldValue: event.oldValue,
    newValue: event.newValue,
    url: event.url
  });

  // Respond to logout
  if (event.key === 'auth_token' && event.newValue === null) {
    window.location.href = '/login';
  }
});

// Changes within same tab need manual notification
class ObservableStorage extends TypedStorage {
  private listeners = new Map<string, Set<(value: any) => void>>();

  subscribe<T>(key: string, callback: (value: T | null) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Call immediately once
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

### Form Data Auto-Save

```typescript
// Form auto-save
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

    // Restore saved data
    this.restore(form);

    // Save periodically
    this.intervalId = window.setInterval(() => {
      this.save(form);
    }, this.saveInterval);

    // Clear on form submit
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
      // Ignore parse errors
    }
  }

  private clear() {
    sessionStorage.removeItem(`form_${this.formId}`);
  }
}

// Usage
new FormAutoSave('checkout-form', 3000);
```

## Cookie

### Operation Wrapper

```typescript
// cookie.ts
interface CookieOptions {
  expires?: Date | number; // Date or days
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

// Usage
CookieManager.set('session_id', 'abc123', {
  expires: 7, // 7 days
  path: '/',
  secure: true,
  sameSite: 'Lax'
});

const sessionId = CookieManager.get('session_id');
```

## IndexedDB

### Basic Operations

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
    // Subclass implementation
  }

  protected getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('Database not open');
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

### Practical Example: Todo List

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

// Usage
const todoDb = new TodoDatabase();
await todoDb.open();

const id = await todoDb.addTodo('Learn IndexedDB');
const todos = await todoDb.getAllTodos();
await todoDb.toggleTodo(id);
```

## Storage Strategy

### Tiered Storage

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

// Tiered cache
class TieredStorage {
  private layers: StorageAdapter[];

  constructor(layers: StorageAdapter[]) {
    this.layers = layers;
  }

  async get<T>(key: string): Promise<T | null> {
    for (let i = 0; i < this.layers.length; i++) {
      const value = await this.layers[i].get<T>(key);
      if (value !== null) {
        // Backfill upper layers
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

// Usage
const storage = new TieredStorage([
  new MemoryStorage(),      // L1: Memory (fastest)
  new LocalStorageAdapter() // L2: localStorage (persistent)
]);
```

## Best Practices Summary

```
Browser Storage Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Choosing Storage Solution                         │
│   ├── Sensitive data → Cookie + HttpOnly           │
│   ├── User preferences → localStorage              │
│   ├── Temporary data → sessionStorage              │
│   └── Large data → IndexedDB                       │
│                                                     │
│   Security Considerations                           │
│   ├── Don't store sensitive info in localStorage   │
│   ├── Set Secure and HttpOnly for Cookies          │
│   ├── Use SameSite to prevent CSRF                 │
│   └── Validate data integrity before/after storage │
│                                                     │
│   Performance Optimization                          │
│   ├── Avoid storing large objects in localStorage  │
│   ├── Use transactions for IndexedDB batch ops     │
│   ├── Implement expiry cleanup mechanism           │
│   └── Consider memory cache layer                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Requirement | Recommended Solution |
|-------------|---------------------|
| Login state | Cookie (HttpOnly) |
| Theme/language settings | localStorage |
| Shopping cart temp data | sessionStorage |
| Offline article reading | IndexedDB |

---

*Choose the right storage solution for both security and efficiency.*
