---
title: 'Frontend Performance Optimization: Full-Stack Enhancement from Loading to Rendering'
description: 'Master Core Web Vitals, resource optimization, rendering performance, caching strategies and monitoring'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'frontend-performance-optimization'
---

Frontend performance directly impacts user experience and business conversion. This article explores core strategies and best practices for frontend performance optimization.

## Core Web Vitals

### Key Metrics

```
Core Web Vitals Metrics:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   LCP (Largest Contentful Paint)                   │
│   ├── Largest content paint time                   │
│   ├── Target: < 2.5s                               │
│   └── Affects: Images, fonts, large text blocks   │
│                                                     │
│   INP (Interaction to Next Paint)                  │
│   ├── Interaction to next paint                   │
│   ├── Target: < 200ms                              │
│   └── Affects: JS execution, event handling       │
│                                                     │
│   CLS (Cumulative Layout Shift)                    │
│   ├── Cumulative layout shift                     │
│   ├── Target: < 0.1                                │
│   └── Affects: Image size, dynamic content, fonts │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Measurement Methods

```typescript
// Using web-vitals library
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

  // Use sendBeacon to ensure data is sent
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

## Resource Loading Optimization

### Image Optimization

```typescript
// Modern image formats and responsive images
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

// Image preloading
function preloadCriticalImage(src: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = 'high';
  document.head.appendChild(link);
}
```

### Font Optimization

```css
/* Font display strategy */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* Use system font until custom font loads */
  unicode-range: U+0000-00FF; /* Only load needed characters */
}

/* Preload critical fonts */
<link
  rel="preload"
  href="/fonts/custom.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>

/* Font subsetting - reduce font file size */
/* Use fonttools or glyphhanger tools */
```

### Code Splitting

```typescript
// React lazy loading
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

// Route-level code splitting
const routes = [
  {
    path: '/dashboard',
    component: lazy(() => import('./pages/Dashboard')),
    preload: () => import('./pages/Dashboard'),
  },
];

// Prefetch next likely page
function prefetchRoute(path: string) {
  const route = routes.find(r => r.path === path);
  route?.preload();
}
```

### Resource Preloading

```html
<!-- DNS prefetch -->
<link rel="dns-prefetch" href="//api.example.com" />

<!-- Preconnect -->
<link rel="preconnect" href="https://api.example.com" crossorigin />

<!-- Preload critical resources -->
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/main.js" as="script" />

<!-- Prefetch next page resources -->
<link rel="prefetch" href="/next-page.js" />

<!-- Module preload -->
<link rel="modulepreload" href="/modules/app.js" />
```

## Rendering Performance

### Virtual List

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

### Avoid Layout Thrashing

```typescript
// ❌ Triggers multiple reflows
function badLayout() {
  const elements = document.querySelectorAll('.item');
  elements.forEach(el => {
    const height = el.offsetHeight; // Read
    el.style.height = height + 10 + 'px'; // Write
  });
}

// ✅ Batch reads then batch writes
function goodLayout() {
  const elements = document.querySelectorAll('.item');
  const heights: number[] = [];

  // Batch reads
  elements.forEach(el => {
    heights.push(el.offsetHeight);
  });

  // Batch writes
  elements.forEach((el, i) => {
    el.style.height = heights[i] + 10 + 'px';
  });
}

// ✅ Use requestAnimationFrame
function animateWithRAF() {
  requestAnimationFrame(() => {
    // Execute DOM updates in next frame
    element.style.transform = 'translateX(100px)';
  });
}
```

### React Rendering Optimization

```typescript
// Use memo to avoid unnecessary re-renders
const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  return <div>{/* Complex rendering logic */}</div>;
});

// useMemo to cache computed results
function DataTable({ items }: { items: Item[] }) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return <Table data={sortedItems} />;
}

// useCallback to cache callback functions
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return <Child onClick={handleClick} />;
}

// Use React.lazy and Suspense
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

## Caching Strategies

### Service Worker Caching

```typescript
// sw.js
const CACHE_NAME = 'app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
];

// Cache static assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Network-first strategy
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

### HTTP Caching

```typescript
// Express cache header setup
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

// Versioned asset URLs
const assetUrl = `/app.${hash}.js`;
```

### Browser Storage

```typescript
// IndexedDB for caching large data
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

## Network Optimization

### HTTP/2 and HTTP/3

```nginx
# Nginx HTTP/2 configuration
server {
    listen 443 ssl http2;

    # Server push
    location / {
        http2_push /styles.css;
        http2_push /app.js;
    }
}
```

### Compression

```typescript
// Express compression middleware
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

// Brotli compression (better ratio)
import shrinkRay from 'shrink-ray-current';

app.use(shrinkRay());
```

### Resource Hints

```typescript
// Dynamic resource hints
function addResourceHint(type: 'preload' | 'prefetch', url: string) {
  const link = document.createElement('link');
  link.rel = type;
  link.href = url;
  document.head.appendChild(link);
}

// Preload based on user behavior
function onHover(event: MouseEvent) {
  const link = (event.target as HTMLElement).closest('a');
  if (link?.href) {
    addResourceHint('prefetch', link.href);
  }
}
```

## Performance Monitoring

### Custom Performance Metrics

```typescript
// Custom performance marks
performance.mark('app-init-start');

await initializeApp();

performance.mark('app-init-end');
performance.measure('app-init', 'app-init-start', 'app-init-end');

// Get measurement results
const measures = performance.getEntriesByType('measure');
console.log('App init time:', measures[0].duration);

// Long task monitoring
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

### Error and Crash Monitoring

```typescript
// Global error capture
window.addEventListener('error', (event) => {
  reportError({
    type: 'uncaught',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Promise error capture
window.addEventListener('unhandledrejection', (event) => {
  reportError({
    type: 'unhandledrejection',
    reason: event.reason,
  });
});

// Memory monitoring
if ('memory' in performance) {
  setInterval(() => {
    const memory = (performance as any).memory;
    if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
      reportMemoryWarning(memory);
    }
  }, 30000);
}
```

## Build Optimization

```javascript
// Vite configuration optimization
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

## Best Practices Summary

```
Frontend Performance Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Loading Optimization                              │
│   ├── Code splitting and lazy loading             │
│   ├── Resource compression and optimization       │
│   ├── CDN distribution                            │
│   └── Preload critical resources                  │
│                                                     │
│   Rendering Optimization                           │
│   ├── Virtual list for large data                 │
│   ├── Avoid layout thrashing                      │
│   ├── CSS animations over JS                      │
│   └── Optimize React rendering                    │
│                                                     │
│   Caching Strategies                               │
│   ├── Service Worker caching                      │
│   ├── HTTP cache headers                          │
│   ├── Local storage caching                       │
│   └── API response caching                        │
│                                                     │
│   Monitoring System                                │
│   ├── Core Web Vitals                             │
│   ├── Custom performance metrics                  │
│   ├── Error monitoring                            │
│   └── User experience monitoring                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Metric | Target | Optimization Focus |
|--------|--------|-------------------|
| LCP | < 2.5s | Optimize first-screen resources |
| INP | < 200ms | Reduce JS execution |
| CLS | < 0.1 | Reserve space |
| FCP | < 1.8s | Reduce blocking resources |
| TTFB | < 800ms | Optimize server response |

Performance optimization is an ongoing process. Establish monitoring systems and continuously iterate to maintain great user experience.

---

*Performance is the foundation of user experience. Every millisecond matters for user retention.*
