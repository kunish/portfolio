---
title: '前端性能优化：从加载到渲染的全链路提升'
description: '掌握 Core Web Vitals、资源优化、渲染性能、缓存策略和监控体系'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'frontend-performance-optimization'
---

前端性能直接影响用户体验和业务转化。本文深入探讨前端性能优化的核心策略和最佳实践。

## Core Web Vitals

### 核心指标

```
Core Web Vitals 指标：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   LCP (Largest Contentful Paint)                   │
│   ├── 最大内容绘制时间                              │
│   ├── 目标：< 2.5s                                  │
│   └── 影响：图片、字体、大型文本块                  │
│                                                     │
│   INP (Interaction to Next Paint)                  │
│   ├── 交互到下一次绘制                              │
│   ├── 目标：< 200ms                                 │
│   └── 影响：JavaScript 执行、事件处理               │
│                                                     │
│   CLS (Cumulative Layout Shift)                    │
│   ├── 累积布局偏移                                  │
│   ├── 目标：< 0.1                                   │
│   └── 影响：图片尺寸、动态内容、字体加载            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 测量方法

```typescript
// 使用 web-vitals 库
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // 使用 sendBeacon 确保数据发送
  navigator.sendBeacon('/api/analytics', body);
}

onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onCLS(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);

// Performance Observer API
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.startTime}ms`);
  }
});

observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
```

## 资源加载优化

### 图片优化

```typescript
// 现代图片格式和响应式图片
function OptimizedImage({ src, alt }: { src: string; alt: string }) {
  return (
    <picture>
      <source
        srcSet={`${src}.avif 1x, ${src}@2x.avif 2x`}
        type="image/avif"
      />
      <source
        srcSet={`${src}.webp 1x, ${src}@2x.webp 2x`}
        type="image/webp"
      />
      <img
        src={`${src}.jpg`}
        srcSet={`${src}.jpg 1x, ${src}@2x.jpg 2x`}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={800}
        height={600}
      />
    </picture>
  );
}

// 图片预加载
function preloadCriticalImage(src: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = 'high';
  document.head.appendChild(link);
}
```

### 字体优化

```css
/* 字体显示策略 */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* 使用系统字体直到自定义字体加载完成 */
  unicode-range: U+0000-00FF; /* 仅加载需要的字符 */
}

/* 预加载关键字体 */
<link
  rel="preload"
  href="/fonts/custom.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>

/* 字体子集化 - 减少字体文件大小 */
/* 使用 fonttools 或 glyphhanger 工具 */
```

### 代码分割

```typescript
// React 懒加载
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

// 路由级代码分割
const routes = [
  {
    path: '/dashboard',
    component: lazy(() => import('./pages/Dashboard')),
    preload: () => import('./pages/Dashboard'),
  },
];

// 预加载下一个可能访问的页面
function prefetchRoute(path: string) {
  const route = routes.find(r => r.path === path);
  route?.preload();
}
```

### 资源预加载

```html
<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="//api.example.com" />

<!-- 预连接 -->
<link rel="preconnect" href="https://api.example.com" crossorigin />

<!-- 预加载关键资源 -->
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/main.js" as="script" />

<!-- 预获取下一页资源 -->
<link rel="prefetch" href="/next-page.js" />

<!-- 模块预加载 -->
<link rel="modulepreload" href="/modules/app.js" />
```

## 渲染性能

### 虚拟列表

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 避免布局抖动

```typescript
// ❌ 触发多次重排
function badLayout() {
  const elements = document.querySelectorAll('.item');
  elements.forEach(el => {
    const height = el.offsetHeight; // 读取
    el.style.height = height + 10 + 'px'; // 写入
  });
}

// ✅ 批量读取后批量写入
function goodLayout() {
  const elements = document.querySelectorAll('.item');
  const heights: number[] = [];

  // 批量读取
  elements.forEach(el => {
    heights.push(el.offsetHeight);
  });

  // 批量写入
  elements.forEach((el, i) => {
    el.style.height = heights[i] + 10 + 'px';
  });
}

// ✅ 使用 requestAnimationFrame
function animateWithRAF() {
  requestAnimationFrame(() => {
    // 在下一帧执行 DOM 更新
    element.style.transform = 'translateX(100px)';
  });
}
```

### React 渲染优化

```typescript
// 使用 memo 避免不必要的重渲染
const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  return <div>{/* 复杂渲染逻辑 */}</div>;
});

// useMemo 缓存计算结果
function DataTable({ items }: { items: Item[] }) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return <Table data={sortedItems} />;
}

// useCallback 缓存回调函数
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return <Child onClick={handleClick} />;
}

// 使用 React.lazy 和 Suspense
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

## 缓存策略

### Service Worker 缓存

```typescript
// sw.js
const CACHE_NAME = 'app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
];

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 网络优先策略
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}
```

### HTTP 缓存

```typescript
// Express 缓存头设置
app.use('/static', express.static('public', {
  maxAge: '1y',
  immutable: true,
}));

app.get('/api/data', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    'ETag': generateETag(data),
  });
  res.json(data);
});

// 版本化资源 URL
const assetUrl = `/app.${hash}.js`;
```

### 浏览器存储

```typescript
// IndexedDB 缓存大量数据
import { openDB } from 'idb';

const db = await openDB('app-cache', 1, {
  upgrade(db) {
    db.createObjectStore('api-cache', { keyPath: 'url' });
  },
});

async function cachedFetch(url: string): Promise<Response> {
  const cached = await db.get('api-cache', url);

  if (cached && Date.now() - cached.timestamp < 300000) {
    return new Response(JSON.stringify(cached.data));
  }

  const response = await fetch(url);
  const data = await response.json();

  await db.put('api-cache', {
    url,
    data,
    timestamp: Date.now(),
  });

  return new Response(JSON.stringify(data));
}
```

## 网络优化

### HTTP/2 和 HTTP/3

```nginx
# Nginx HTTP/2 配置
server {
    listen 443 ssl http2;

    # 服务器推送
    location / {
        http2_push /styles.css;
        http2_push /app.js;
    }
}
```

### 压缩

```typescript
// Express 压缩中间件
import compression from 'compression';

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// Brotli 压缩（更好的压缩率）
import shrinkRay from 'shrink-ray-current';

app.use(shrinkRay());
```

### 资源提示

```typescript
// 动态资源提示
function addResourceHint(type: 'preload' | 'prefetch', url: string) {
  const link = document.createElement('link');
  link.rel = type;
  link.href = url;
  document.head.appendChild(link);
}

// 基于用户行为预加载
function onHover(event: MouseEvent) {
  const link = (event.target as HTMLElement).closest('a');
  if (link?.href) {
    addResourceHint('prefetch', link.href);
  }
}
```

## 性能监控

### 自定义性能指标

```typescript
// 自定义性能标记
performance.mark('app-init-start');

await initializeApp();

performance.mark('app-init-end');
performance.measure('app-init', 'app-init-start', 'app-init-end');

// 获取测量结果
const measures = performance.getEntriesByType('measure');
console.log('App init time:', measures[0].duration);

// 长任务监控
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn('Long task detected:', entry);
      reportLongTask(entry);
    }
  }
});

observer.observe({ entryTypes: ['longtask'] });
```

### 错误和崩溃监控

```typescript
// 全局错误捕获
window.addEventListener('error', (event) => {
  reportError({
    type: 'uncaught',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Promise 错误捕获
window.addEventListener('unhandledrejection', (event) => {
  reportError({
    type: 'unhandledrejection',
    reason: event.reason,
  });
});

// 内存监控
if ('memory' in performance) {
  setInterval(() => {
    const memory = (performance as any).memory;
    if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
      reportMemoryWarning(memory);
    }
  }, 30000);
}
```

## 构建优化

```javascript
// Vite 配置优化
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash-es', 'date-fns'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

## 最佳实践总结

```
前端性能优化最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   加载优化                                          │
│   ├── 代码分割和懒加载                              │
│   ├── 资源压缩和优化                                │
│   ├── 使用 CDN 分发                                 │
│   └── 预加载关键资源                                │
│                                                     │
│   渲染优化                                          │
│   ├── 虚拟列表处理大数据                            │
│   ├── 避免布局抖动                                  │
│   ├── 使用 CSS 动画替代 JS                          │
│   └── 优化 React 渲染                               │
│                                                     │
│   缓存策略                                          │
│   ├── Service Worker 缓存                           │
│   ├── HTTP 缓存头                                   │
│   ├── 本地存储缓存                                  │
│   └── API 响应缓存                                  │
│                                                     │
│   监控体系                                          │
│   ├── Core Web Vitals                              │
│   ├── 自定义性能指标                                │
│   ├── 错误监控                                      │
│   └── 用户体验监控                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 指标 | 目标值 | 优化方向 |
|------|--------|----------|
| LCP | < 2.5s | 优化首屏资源 |
| INP | < 200ms | 减少 JS 执行 |
| CLS | < 0.1 | 预留空间 |
| FCP | < 1.8s | 减少阻塞资源 |
| TTFB | < 800ms | 优化服务器响应 |

性能优化是一个持续的过程。建立监控体系，持续迭代优化，才能保持良好的用户体验。

---

*性能是用户体验的基石。每毫秒都关乎用户的去留。*
