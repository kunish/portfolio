---
title: 'Web 性能优化：2025 实战指南'
description: '从 Core Web Vitals 到现代优化技术，全面掌握 Web 性能优化的艺术'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'web-performance-optimization'
---

网站性能直接影响用户体验、转化率和搜索引擎排名。Google 研究表明，页面加载时间每增加 1 秒，转化率下降 7%。本文将带你掌握现代 Web 性能优化的核心技术。

## Core Web Vitals：性能指标体系

Google 的 Core Web Vitals 是衡量用户体验的三大核心指标：

```
┌─────────────────────────────────────────────────────────┐
│                   Core Web Vitals                        │
├─────────────────┬─────────────────┬─────────────────────┤
│      LCP        │      INP        │        CLS          │
│  最大内容绘制    │   交互到下一帧    │    累积布局偏移      │
│                 │                 │                     │
│  ≤2.5s 良好     │  ≤200ms 良好    │   ≤0.1 良好         │
│  ≤4.0s 需改进   │  ≤500ms 需改进  │   ≤0.25 需改进      │
│  >4.0s 差       │  >500ms 差      │   >0.25 差          │
└─────────────────┴─────────────────┴─────────────────────┘
```

### LCP（Largest Contentful Paint）

最大内容绘制时间，衡量主要内容的加载速度。

**优化策略：**

```html
<!-- 1. 预加载关键资源 -->
<link rel="preload" href="hero.webp" as="image" fetchpriority="high">
<link rel="preload" href="critical.css" as="style">

<!-- 2. 使用现代图片格式 -->
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" alt="Hero" fetchpriority="high">
</picture>

<!-- 3. 内联关键 CSS -->
<style>
  /* 首屏关键样式直接内联 */
  .hero { ... }
</style>
```

### INP（Interaction to Next Paint）

交互到下一帧绘制的时间，取代了 FID 成为新的响应性指标。

**优化策略：**

```javascript
// 1. 使用 requestIdleCallback 处理非关键任务
requestIdleCallback(() => {
  // 非关键的初始化工作
  analytics.init();
  prefetchNextPage();
});

// 2. 使用 scheduler.yield() 让出主线程（新 API）
async function processLargeArray(items) {
  for (const item of items) {
    processItem(item);

    // 定期让出主线程，保持响应性
    if (scheduler.yield) {
      await scheduler.yield();
    }
  }
}

// 3. 使用 Web Worker 处理计算密集任务
const worker = new Worker('heavy-computation.js');
worker.postMessage(data);
worker.onmessage = (e) => updateUI(e.data);
```

### CLS（Cumulative Layout Shift）

累积布局偏移，衡量视觉稳定性。

**优化策略：**

```css
/* 1. 为图片和视频预留空间 */
img, video {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
}

/* 2. 使用 min-height 防止内容跳动 */
.dynamic-content {
  min-height: 200px;
}

/* 3. 避免在现有内容上方插入内容 */
.notification {
  position: fixed;  /* 不影响文档流 */
  top: 0;
}
```

```html
<!-- 4. 为字体加载设置 font-display -->
<style>
  @font-face {
    font-family: 'CustomFont';
    src: url('font.woff2') format('woff2');
    font-display: swap;  /* 或 optional */
  }
</style>
```

## 资源加载优化

### 1. 资源提示（Resource Hints）

```html
<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="//api.example.com">

<!-- 预连接（DNS + TCP + TLS）-->
<link rel="preconnect" href="https://fonts.googleapis.com">

<!-- 预加载关键资源 -->
<link rel="preload" href="critical.js" as="script">

<!-- 预获取下一页资源 -->
<link rel="prefetch" href="/next-page.html">

<!-- 预渲染整个页面（谨慎使用）-->
<link rel="prerender" href="/likely-next-page">
```

### 2. 现代脚本加载

```html
<!-- 模块脚本：自动 defer -->
<script type="module" src="app.js"></script>

<!-- 传统脚本降级 -->
<script nomodule src="app-legacy.js"></script>

<!-- 异步加载非关键脚本 -->
<script async src="analytics.js"></script>

<!-- 延迟加载可以等待的脚本 -->
<script defer src="features.js"></script>
```

### 3. 图片优化

```html
<!-- 响应式图片 -->
<img
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w
  "
  sizes="(max-width: 600px) 400px, 800px"
  loading="lazy"
  decoding="async"
  alt="Description"
>

<!-- 使用 AVIF/WebP -->
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Fallback">
</picture>
```

## JavaScript 性能优化

### 1. 代码分割

```javascript
// 路由级代码分割
const HomePage = lazy(() => import('./pages/Home'));
const AboutPage = lazy(() => import('./pages/About'));

// 组件级代码分割
const HeavyChart = lazy(() => import('./components/HeavyChart'));

// 条件加载
if (user.isPremium) {
  const PremiumFeatures = await import('./PremiumFeatures');
  PremiumFeatures.init();
}
```

### 2. Tree Shaking 优化

```javascript
// ❌ 导入整个库
import _ from 'lodash';
_.debounce(fn, 300);

// ✅ 只导入需要的函数
import debounce from 'lodash/debounce';
debounce(fn, 300);

// ✅ 使用支持 tree-shaking 的替代库
import { debounce } from 'lodash-es';
```

### 3. 避免主线程阻塞

```javascript
// ❌ 同步处理大数组
function processAll(items) {
  return items.map(heavyComputation);
}

// ✅ 分块处理，保持响应性
async function processInChunks(items, chunkSize = 100) {
  const results = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    results.push(...chunk.map(heavyComputation));

    // 让出主线程
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}
```

## CSS 性能优化

### 1. 关键 CSS 内联

```html
<head>
  <!-- 内联首屏关键 CSS -->
  <style>
    /* 只包含首屏需要的样式 */
    .header { ... }
    .hero { ... }
  </style>

  <!-- 异步加载完整 CSS -->
  <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="styles.css"></noscript>
</head>
```

### 2. 避免昂贵的 CSS

```css
/* ❌ 避免：通配符选择器 */
* { box-sizing: border-box; }

/* ✅ 推荐：继承 */
html { box-sizing: border-box; }
*, *::before, *::after { box-sizing: inherit; }

/* ❌ 避免：深层嵌套选择器 */
.nav ul li a span { ... }

/* ✅ 推荐：扁平化选择器 */
.nav-link-text { ... }

/* ❌ 避免：频繁触发重排的属性 */
.animate {
  width: 100px;
  height: 100px;
  top: 10px;
  left: 10px;
}

/* ✅ 推荐：使用 transform */
.animate {
  transform: translate(10px, 10px) scale(1.2);
}
```

### 3. 使用 CSS Containment

```css
/* 告诉浏览器这个元素的渲染是独立的 */
.card {
  contain: layout style paint;
}

/* 或者使用简写 */
.widget {
  contain: content;  /* 等同于 layout style paint */
}

/* 结合 content-visibility 实现虚拟滚动 */
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 100px;  /* 预估高度 */
}
```

## 缓存策略

### 1. HTTP 缓存

```nginx
# Nginx 配置示例
location /static/ {
    # 不可变资源（带 hash 的文件）
    add_header Cache-Control "public, max-age=31536000, immutable";
}

location /api/ {
    # API 响应
    add_header Cache-Control "private, no-cache, must-revalidate";
}

location / {
    # HTML 页面
    add_header Cache-Control "no-cache";
}
```

### 2. Service Worker 缓存

```javascript
// sw.js
const CACHE_NAME = 'app-v1';
const STATIC_ASSETS = [
  '/',
  '/styles.css',
  '/app.js',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // 缓存优先，同时更新缓存
        const fetchPromise = fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone));
          return response;
        });

        return cached || fetchPromise;
      })
  );
});
```

## 性能监控

### 1. Web Vitals 测量

```javascript
import { onLCP, onINP, onCLS } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });

  // 使用 sendBeacon 确保数据发送
  navigator.sendBeacon('/analytics', body);
}

onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onCLS(sendToAnalytics);
```

### 2. Performance Observer

```javascript
// 监控长任务
const longTaskObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Long Task detected:', entry.duration, 'ms');
    // 记录或报告
  }
});
longTaskObserver.observe({ type: 'longtask', buffered: true });

// 监控资源加载
const resourceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.transferSize === 0) {
      console.log('Cache hit:', entry.name);
    }
  }
});
resourceObserver.observe({ type: 'resource', buffered: true });
```

## 现代框架优化

### React

```jsx
// 1. 使用 React.memo 避免不必要的重渲染
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* 渲染逻辑 */}</div>;
});

// 2. 使用 useMemo 缓存计算结果
const sortedList = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// 3. 使用 useTransition 处理非紧急更新
const [isPending, startTransition] = useTransition();

function handleSearch(query) {
  startTransition(() => {
    setSearchResults(filterResults(query));
  });
}
```

### Vue

```vue
<script setup>
import { computed, shallowRef } from 'vue';

// 1. 使用 shallowRef 减少响应式开销
const largeData = shallowRef(initialData);

// 2. 使用 computed 缓存计算
const sortedItems = computed(() => {
  return [...items.value].sort((a, b) => a.id - b.id);
});

// 3. 使用 v-once 标记静态内容
</script>

<template>
  <div v-once>
    <!-- 这部分永远不会重新渲染 -->
    <h1>{{ staticTitle }}</h1>
  </div>

  <!-- 使用 v-memo 缓存列表项 -->
  <div v-for="item in list" :key="item.id" v-memo="[item.id, item.selected]">
    {{ item.name }}
  </div>
</template>
```

## 性能检查清单

```
□ 图片使用现代格式（AVIF/WebP）并设置正确尺寸
□ 关键资源使用 preload/preconnect
□ JavaScript 代码分割并延迟加载非关键代码
□ CSS 内联关键样式，异步加载其余部分
□ 使用 HTTP/2 或 HTTP/3
□ 配置适当的缓存策略
□ 启用 Gzip/Brotli 压缩
□ 为图片和嵌入内容预留空间（防止 CLS）
□ 使用 font-display: swap 处理字体加载
□ 监控 Core Web Vitals 并持续优化
```

## 总结

Web 性能优化是一个持续的过程：

| 优化领域 | 关键技术 |
|----------|----------|
| 加载性能 | 预加载、代码分割、懒加载 |
| 渲染性能 | CSS Containment、虚拟滚动 |
| 交互性能 | Web Worker、任务分块 |
| 缓存策略 | Service Worker、HTTP 缓存 |

**关键收获**：

1. Core Web Vitals 是性能优化的北极星
2. 预加载关键资源，延迟加载非关键资源
3. 避免主线程阻塞，保持交互响应性
4. 为动态内容预留空间，避免布局偏移
5. 持续监控，数据驱动优化决策

性能优化不是一次性的任务，而是需要持续关注的工程实践。从用户体验出发，用数据驱动决策，让你的网站快如闪电。

---

*速度就是用户体验，用户体验就是业务价值。让每一毫秒都有意义。*
