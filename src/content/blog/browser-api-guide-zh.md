---
title: '浏览器 API 实战：现代 Web 开发必备技能'
description: '掌握 Storage、Intersection Observer、Web Workers、Geolocation 等核心浏览器 API'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'browser-api-guide'
---

浏览器提供了丰富的原生 API。本文探讨现代 Web 开发中最实用的浏览器 API。

## Storage API

### LocalStorage 和 SessionStorage

```typescript
// 封装 Storage 工具类
class StorageService {
  private storage: Storage;

  constructor(type: 'local' | 'session' = 'local') {
    this.storage = type === 'local' ? localStorage : sessionStorage;
  }

  // 设置值（支持对象）
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      this.storage.setItem(key, serialized);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }

  // 获取值（自动解析）
  get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = this.storage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  // 删除
  remove(key: string): void {
    this.storage.removeItem(key);
  }

  // 清空
  clear(): void {
    this.storage.clear();
  }

  // 带过期时间的存储
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

// 使用
const storage = new StorageService('local');
storage.set('user', { name: '张三', age: 25 });
storage.setWithExpiry('token', 'abc123', 3600000); // 1小时后过期
```

### IndexedDB

```typescript
// IndexedDB 封装
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

// 使用
const db = new IndexedDBService('myApp', 1);
await db.open([{ name: 'users', keyPath: 'id' }]);
await db.add('users', { id: 1, name: '张三' });
```

## Intersection Observer

### 懒加载图片

```typescript
// 图片懒加载
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
      rootMargin: '50px 0px', // 提前 50px 加载
      threshold: 0.01,
    }
  );

  images.forEach((img) => observer.observe(img));

  return () => observer.disconnect();
}
```

### 无限滚动

```typescript
// 无限滚动加载
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

// 使用
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

### 滚动动画

```typescript
// 滚动时淡入动画
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

### 基础 Worker

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
  // 模拟耗时计算
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

### Worker 管理器

```typescript
// 主线程
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

// 使用
const worker = new WorkerManager('/worker.js');
const result = await worker.send('HEAVY_CALCULATION', [1, 2, 3, 4, 5]);
```

## Geolocation API

```typescript
// 获取位置
async function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5分钟缓存
    });
  });
}

// 持续追踪位置
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
// 复制到剪贴板
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // 降级方案
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

// 读取剪贴板
async function readFromClipboard(): Promise<string> {
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    throw new Error('无法访问剪贴板');
  }
}

// 复制按钮组件
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
      {copied ? '已复制' : '复制'}
    </button>
  );
}
```

## Notification API

```typescript
// 请求通知权限
async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('浏览器不支持通知');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  return await Notification.requestPermission();
}

// 发送通知
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

// 使用
sendNotification('新消息', {
  body: '您有一条新的消息',
  tag: 'message',
  requireInteraction: true,
});
```

## ResizeObserver

```typescript
// 监听元素大小变化
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

// 响应式组件
function ResponsiveComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useResizeObserver(containerRef, (entry) => {
    const { width, height } = entry.contentRect;
    setSize({ width, height });
  });

  return (
    <div ref={containerRef}>
      <p>宽度: {size.width}px</p>
      <p>高度: {size.height}px</p>
    </div>
  );
}
```

## 最佳实践总结

```
浏览器 API 最佳实践：
┌─────────────────────────────────────────────────────┐
│   兼容性检查                                        │
│   ├── 使用前检测 API 支持                           │
│   ├── 提供降级方案                                  │
│   ├── 使用 Polyfill                                │
│   └── 渐进增强策略                                  │
│                                                     │
│   性能优化                                          │
│   ├── 使用 Worker 处理耗时任务                      │
│   ├── 合理使用 Observer API                        │
│   ├── 避免频繁存储操作                              │
│   └── 及时清理监听器                                │
│                                                     │
│   安全考虑                                          │
│   ├── 验证用户输入                                  │
│   ├── 处理权限请求                                  │
│   ├── 加密敏感数据                                  │
│   └── 遵循同源策略                                  │
└─────────────────────────────────────────────────────┘
```

| API | 适用场景 |
|-----|----------|
| LocalStorage | 小量持久化数据 |
| IndexedDB | 大量结构化数据 |
| Intersection Observer | 懒加载、无限滚动 |
| Web Workers | CPU 密集型任务 |
| Geolocation | 位置相关功能 |

---

*浏览器 API 是 Web 应用的基础设施。善用原生能力，减少对第三方库的依赖。*
