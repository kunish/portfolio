---
title: 'Browser APIs: Essential Skills for Modern Web Development'
description: 'Master Storage, Intersection Observer, Web Workers, Geolocation and other core browser APIs'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'browser-api-guide'
---

Browsers provide rich native APIs. This article explores the most practical browser APIs for modern web development.

## Storage API

### LocalStorage and SessionStorage

```typescript
// Storage utility class
class StorageService {
  private storage: Storage;

  constructor(type: 'local' | 'session' = 'local') {
    this.storage = type === 'local' ? localStorage : sessionStorage;
  }

  // Set value (supports objects)
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      this.storage.setItem(key, serialized);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }

  // Get value (auto-parse)
  get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = this.storage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  // Remove
  remove(key: string): void {
    this.storage.removeItem(key);
  }

  // Clear all
  clear(): void {
    this.storage.clear();
  }

  // Storage with expiry
  setWithExpiry<T>(key: string, value: T, ttlMs: number): void {
    const item = {
      value,
      expiry: Date.now() + ttlMs,
    };
    this.set(key, item);
  }

  getWithExpiry<T>(key: string): T | null {
    const item = this.get<{ value: T; expiry: number }>(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.remove(key);
      return null;
    }
    return item.value;
  }
}

// Usage
const storage = new StorageService('local');
storage.set('user', { name: 'John', age: 25 });
storage.setWithExpiry('token', 'abc123', 3600000); // Expires in 1 hour
```

### IndexedDB

```typescript
// IndexedDB wrapper
class IndexedDBService {
  private dbName: string;
  private version: number;
  private db: IDBDatabase | null = null;

  constructor(dbName: string, version = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  async open(stores: { name: string; keyPath: string }[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        stores.forEach(({ name, keyPath }) => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath });
          }
        });
      };
    });
  }

  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    return this.transaction(storeName, 'readwrite', (store) => {
      return store.add(data);
    });
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return this.transaction(storeName, 'readonly', (store) => {
      return store.get(key);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return this.transaction(storeName, 'readonly', (store) => {
      return store.getAll();
    });
  }

  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    return this.transaction(storeName, 'readwrite', (store) => {
      return store.put(data);
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    return this.transaction(storeName, 'readwrite', (store) => {
      return store.delete(key);
    });
  }

  private transaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Usage
const db = new IndexedDBService('myApp', 1);
await db.open([{ name: 'users', keyPath: 'id' }]);
await db.add('users', { id: 1, name: 'John' });
```

## Intersection Observer

### Lazy Loading Images

```typescript
// Image lazy loading
function lazyLoadImages() {
  const images = document.querySelectorAll<HTMLImageElement>('img[data-src]');

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.removeAttribute('data-src');
          obs.unobserve(img);
        }
      });
    },
    {
      rootMargin: '50px 0px', // Load 50px before visible
      threshold: 0.01,
    }
  );

  images.forEach((img) => observer.observe(img));

  return () => observer.disconnect();
}
```

### Infinite Scroll

```typescript
// Infinite scroll loading
function useInfiniteScroll(
  callback: () => Promise<void>,
  options?: IntersectionObserverInit
) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !isLoading) {
          setIsLoading(true);
          await callback();
          setIsLoading(false);
        }
      },
      { threshold: 0, ...options }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [callback, isLoading, options]);

  return { sentinelRef, isLoading };
}

// Usage
function PostList() {
  const [posts, setPosts] = useState([]);

  const loadMore = async () => {
    const newPosts = await fetchPosts(posts.length);
    setPosts((prev) => [...prev, ...newPosts]);
  };

  const { sentinelRef, isLoading } = useInfiniteScroll(loadMore);

  return (
    <div>
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
      <div ref={sentinelRef} />
      {isLoading && <Spinner />}
    </div>
  );
}
```

### Scroll Animations

```typescript
// Fade in on scroll
function scrollReveal() {
  const elements = document.querySelectorAll('[data-reveal]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    },
    { threshold: 0.1 }
  );

  elements.forEach((el) => observer.observe(el));
}

// CSS
// [data-reveal] { opacity: 0; transform: translateY(20px); transition: all 0.6s; }
// [data-reveal].revealed { opacity: 1; transform: translateY(0); }
```

## Web Workers

### Basic Worker

```typescript
// worker.ts
self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'HEAVY_CALCULATION':
      const result = heavyCalculation(payload);
      self.postMessage({ type: 'RESULT', payload: result });
      break;

    case 'PROCESS_DATA':
      const processed = processLargeData(payload);
      self.postMessage({ type: 'PROCESSED', payload: processed });
      break;
  }
};

function heavyCalculation(data: number[]): number {
  // Simulate expensive computation
  return data.reduce((acc, val) => acc + Math.sqrt(val), 0);
}

function processLargeData(data: any[]): any[] {
  return data.map((item) => ({
    ...item,
    processed: true,
    timestamp: Date.now(),
  }));
}
```

### Worker Manager

```typescript
// Main thread
class WorkerManager {
  private worker: Worker;
  private callbacks = new Map<string, (data: any) => void>();

  constructor(workerPath: string) {
    this.worker = new Worker(workerPath, { type: 'module' });
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type, payload } = event.data;
    const callback = this.callbacks.get(type);
    if (callback) {
      callback(payload);
      this.callbacks.delete(type);
    }
  }

  send<T>(type: string, payload: any): Promise<T> {
    return new Promise((resolve) => {
      this.callbacks.set(type.replace('_', '') + '_RESULT', resolve);
      this.worker.postMessage({ type, payload });
    });
  }

  terminate() {
    this.worker.terminate();
  }
}

// Usage
const worker = new WorkerManager('/worker.js');
const result = await worker.send('HEAVY_CALCULATION', [1, 2, 3, 4, 5]);
```

## Geolocation API

```typescript
// Get current position
async function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minute cache
    });
  });
}

// Watch position continuously
function watchPosition(
  onUpdate: (position: GeolocationPosition) => void,
  onError: (error: GeolocationPositionError) => void
): () => void {
  const watchId = navigator.geolocation.watchPosition(onUpdate, onError, {
    enableHighAccuracy: true,
  });

  return () => navigator.geolocation.clearWatch(watchId);
}

// React Hook
function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cleanup = watchPosition(setPosition, (err) => {
      setError(err.message);
    });
    return cleanup;
  }, []);

  return { position, error };
}
```

## Clipboard API

```typescript
// Copy to clipboard
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

// Read from clipboard
async function readFromClipboard(): Promise<string> {
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    throw new Error('Cannot access clipboard');
  }
}

// Copy button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
```

## Notification API

```typescript
// Request notification permission
async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  return await Notification.requestPermission();
}

// Send notification
async function sendNotification(
  title: string,
  options?: NotificationOptions
): Promise<Notification | null> {
  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    return null;
  }

  const notification = new Notification(title, {
    icon: '/icon.png',
    badge: '/badge.png',
    ...options,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
}

// Usage
sendNotification('New Message', {
  body: 'You have a new message',
  tag: 'message',
  requireInteraction: true,
});
```

## ResizeObserver

```typescript
// Watch element size changes
function useResizeObserver(
  ref: RefObject<HTMLElement>,
  callback: (entry: ResizeObserverEntry) => void
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      entries.forEach(callback);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, callback]);
}

// Responsive component
function ResponsiveComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useResizeObserver(containerRef, (entry) => {
    const { width, height } = entry.contentRect;
    setSize({ width, height });
  });

  return (
    <div ref={containerRef}>
      <p>Width: {size.width}px</p>
      <p>Height: {size.height}px</p>
    </div>
  );
}
```

## Best Practices Summary

```
Browser API Best Practices:
┌─────────────────────────────────────────────────────┐
│   Compatibility                                     │
│   ├── Check API support before use                 │
│   ├── Provide fallback solutions                   │
│   ├── Use polyfills when needed                    │
│   └── Progressive enhancement                      │
│                                                     │
│   Performance                                       │
│   ├── Use Workers for heavy tasks                  │
│   ├── Leverage Observer APIs wisely                │
│   ├── Avoid frequent storage operations            │
│   └── Clean up listeners promptly                  │
│                                                     │
│   Security                                          │
│   ├── Validate user input                          │
│   ├── Handle permission requests                   │
│   ├── Encrypt sensitive data                       │
│   └── Follow same-origin policy                    │
└─────────────────────────────────────────────────────┘
```

| API | Use Case |
|-----|----------|
| LocalStorage | Small persistent data |
| IndexedDB | Large structured data |
| Intersection Observer | Lazy loading, infinite scroll |
| Web Workers | CPU-intensive tasks |
| Geolocation | Location-based features |

---

*Browser APIs are the infrastructure of web applications. Leverage native capabilities to reduce third-party dependencies.*
