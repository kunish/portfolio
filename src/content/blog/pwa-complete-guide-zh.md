---
title: 'PWA 完全指南：构建像原生应用一样的 Web 应用'
description: '深入理解 Progressive Web Apps 的核心技术，掌握 Service Worker、缓存策略和离线体验的实现方法'
pubDate: 'Jan 28 2025'
heroImage: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80'
lang: 'zh'
translationKey: 'pwa-complete-guide'
---

Progressive Web Apps (PWA) 代表了 Web 应用的未来——它们结合了 Web 的开放性和原生应用的用户体验。本文将带你全面掌握 PWA 的核心技术。

## 什么是 PWA？

### PWA 的核心特性

```
PWA 的三大支柱：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   可靠 (Reliable)                                   │
│   ├─ 离线可用                                       │
│   ├─ 弱网络下依然工作                               │
│   └─ 资源缓存保证加载速度                           │
│                                                     │
│   快速 (Fast)                                       │
│   ├─ 秒级加载                                       │
│   ├─ 平滑的交互动画                                 │
│   └─ 即时响应用户操作                               │
│                                                     │
│   沉浸 (Engaging)                                   │
│   ├─ 可安装到主屏幕                                 │
│   ├─ 全屏运行                                       │
│   └─ 推送通知                                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### PWA vs 原生应用 vs 传统 Web

| 特性 | 传统 Web | PWA | 原生应用 |
|------|---------|-----|---------|
| 安装 | 无需安装 | 可选安装 | 必须安装 |
| 离线 | ❌ | ✅ | ✅ |
| 推送通知 | ❌ | ✅ | ✅ |
| 设备 API | 有限 | 部分 | 完全 |
| 更新 | 自动 | 自动 | 需下载 |
| 分发 | URL | URL | 应用商店 |
| 开发成本 | 低 | 低 | 高 |

## Web App Manifest

Manifest 是 PWA 的身份证，定义了应用的外观和行为。

### 基础配置

```json
// manifest.json
{
  "name": "My Progressive Web App",
  "short_name": "MyPWA",
  "description": "一个示例 PWA 应用",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 在 HTML 中引用

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Manifest -->
  <link rel="manifest" href="/manifest.json">

  <!-- iOS 支持 -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="MyPWA">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">

  <!-- 主题色 -->
  <meta name="theme-color" content="#3b82f6">
</head>
</html>
```

### Display 模式详解

```
display 属性的四种模式：
┌─────────────────────────────────────────────────────┐
│ fullscreen                                          │
│ └─ 完全全屏，隐藏所有浏览器 UI                       │
│                                                     │
│ standalone                                          │
│ └─ 像原生应用，有状态栏但无浏览器 UI                 │
│                                                     │
│ minimal-ui                                          │
│ └─ 有最小化的浏览器控件（如返回按钮）                │
│                                                     │
│ browser                                             │
│ └─ 普通浏览器标签页（默认）                          │
└─────────────────────────────────────────────────────┘
```

## Service Worker：PWA 的核心

Service Worker 是运行在浏览器后台的脚本，它是实现离线功能的关键。

### 生命周期

```
Service Worker 生命周期：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   注册 (Register)                                   │
│       ↓                                             │
│   安装 (Install) ──→ 预缓存资源                     │
│       ↓                                             │
│   等待 (Waiting) ──→ 等待旧 SW 释放控制             │
│       ↓                                             │
│   激活 (Activate) ──→ 清理旧缓存                    │
│       ↓                                             │
│   控制 (Controlling) ──→ 拦截网络请求               │
│       ↓                                             │
│   终止 (Terminated) ──→ 空闲时被浏览器回收          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 注册 Service Worker

```javascript
// main.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('SW registered:', registration.scope);

      // 检查更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // 新版本可用，提示用户刷新
              showUpdateNotification();
            }
          }
        });
      });
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  });
}
```

### Service Worker 基础结构

```javascript
// sw.js
const CACHE_NAME = 'my-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/icons/icon-192.png',
  '/offline.html'
];

// 安装事件：预缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())  // 立即激活
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())  // 立即控制页面
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

## 缓存策略

不同类型的资源需要不同的缓存策略。

### 常见策略对比

```
缓存策略矩阵：
┌────────────────────┬────────────────────────────────┐
│ 策略               │ 适用场景                       │
├────────────────────┼────────────────────────────────┤
│ Cache First        │ 静态资源、字体、图片            │
│ Network First      │ API 请求、实时数据              │
│ Stale While        │ 可接受短暂过期的内容            │
│ Revalidate         │                                │
│ Cache Only         │ 离线页面、应用 Shell            │
│ Network Only       │ 必须实时的数据（支付等）        │
└────────────────────┴────────────────────────────────┘
```

### Cache First（缓存优先）

```javascript
// 最适合静态资源
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        });
      })
    );
  }
});
```

### Network First（网络优先）

```javascript
// 最适合 API 请求
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    // 成功则更新缓存
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // 失败则使用缓存
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}
```

### Stale While Revalidate（过期重验证）

```javascript
// 最适合不需要即时更新的内容
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // 后台更新缓存
  const fetchPromise = fetch(request).then((networkResponse) => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });

  // 立即返回缓存（如果有）
  return cachedResponse || fetchPromise;
}
```

### 完整的路由策略

```javascript
// sw.js
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 请求：网络优先
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, 'api-cache'));
    return;
  }

  // 静态资源：缓存优先
  if (request.destination === 'image' ||
      request.destination === 'font' ||
      request.destination === 'style') {
    event.respondWith(cacheFirst(request, 'static-cache'));
    return;
  }

  // HTML 页面：SWR
  if (request.mode === 'navigate') {
    event.respondWith(
      staleWhileRevalidate(request, 'pages-cache')
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // 默认：网络优先
  event.respondWith(networkFirst(request, 'default-cache'));
});
```

## 离线体验

### 离线页面

```html
<!-- offline.html -->
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>离线 - MyPWA</title>
  <style>
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: system-ui;
      background: #f3f4f6;
    }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { color: #374151; margin-bottom: 0.5rem; }
    p { color: #6b7280; }
    button {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="icon">📡</div>
  <h1>您当前处于离线状态</h1>
  <p>请检查网络连接后重试</p>
  <button onclick="location.reload()">重试</button>
</body>
</html>
```

### 检测在线状态

```javascript
// 监听在线/离线状态变化
window.addEventListener('online', () => {
  showToast('网络已恢复');
  // 同步离线数据
  syncOfflineData();
});

window.addEventListener('offline', () => {
  showToast('您已离线，部分功能可能受限');
});

// 检查当前状态
function isOnline() {
  return navigator.onLine;
}
```

### 离线数据同步

```javascript
// 使用 Background Sync API
async function saveDataOffline(data) {
  // 存储到 IndexedDB
  await db.pendingRequests.add({
    url: '/api/data',
    method: 'POST',
    body: data,
    timestamp: Date.now()
  });

  // 注册后台同步
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-data');
  }
}

// sw.js 中处理同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  const db = await openDB();
  const requests = await db.pendingRequests.getAll();

  for (const request of requests) {
    try {
      await fetch(request.url, {
        method: request.method,
        body: JSON.stringify(request.body)
      });
      await db.pendingRequests.delete(request.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

## 推送通知

### 请求权限

```javascript
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('浏览器不支持通知');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}
```

### 订阅推送

```javascript
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;

  // 获取推送订阅
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    // 创建新订阅
    const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY';
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
  }

  // 发送订阅信息到服务器
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });

  return subscription;
}

// 辅助函数
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
```

### 处理推送消息

```javascript
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {
    title: '新消息',
    body: '您有一条新通知',
    icon: '/icons/icon-192.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: '/icons/badge.png',
      vibrate: [200, 100, 200],
      data: data.url,
      actions: [
        { action: 'open', title: '查看' },
        { action: 'close', title: '关闭' }
      ]
    })
  );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});
```

## 应用安装

### 检测安装状态

```javascript
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (event) => {
  // 阻止默认安装提示
  event.preventDefault();
  // 保存事件以便稍后使用
  deferredPrompt = event;
  // 显示自定义安装按钮
  showInstallButton();
});

window.addEventListener('appinstalled', () => {
  console.log('PWA 已安装');
  hideInstallButton();
  deferredPrompt = null;
});
```

### 触发安装

```javascript
async function installApp() {
  if (!deferredPrompt) {
    return;
  }

  // 显示安装提示
  deferredPrompt.prompt();

  // 等待用户响应
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    console.log('用户接受安装');
  } else {
    console.log('用户拒绝安装');
  }

  deferredPrompt = null;
}
```

### 自定义安装 UI

```html
<div id="install-prompt" class="install-prompt" hidden>
  <div class="install-content">
    <img src="/icons/icon-192.png" alt="App Icon" width="64">
    <div>
      <h3>安装 MyPWA</h3>
      <p>安装到主屏幕，获得更好体验</p>
    </div>
  </div>
  <div class="install-actions">
    <button onclick="dismissInstall()">稍后</button>
    <button onclick="installApp()" class="primary">安装</button>
  </div>
</div>
```

## 使用 Workbox

Workbox 是 Google 提供的 Service Worker 工具库，大大简化了 PWA 开发。

### 安装和配置

```bash
npm install workbox-webpack-plugin
# 或
npm install workbox-cli
```

### 使用 Workbox

```javascript
// sw.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// 预缓存（由构建工具注入）
precacheAndRoute(self.__WB_MANIFEST);

// 图片缓存策略
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60  // 30 天
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// API 缓存策略
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-responses',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60  // 5 分钟
      })
    ]
  })
);

// 页面缓存策略
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'pages'
  })
);
```

### Workbox 与 Vite

```javascript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'My PWA',
        short_name: 'MyPWA',
        theme_color: '#3b82f6',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24  // 24 小时
              }
            }
          }
        ]
      }
    })
  ]
};
```

## 性能优化

### App Shell 架构

```
App Shell 模式：
┌─────────────────────────────────────────────────────┐
│  Header (缓存)                                      │
├─────────────────────────────────────────────────────┤
│  Navigation (缓存)                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │                                             │   │
│   │        动态内容（网络请求）                   │   │
│   │                                             │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Footer (缓存)                                      │
└─────────────────────────────────────────────────────┘

首次加载：只需加载 Shell（很小）
后续访问：Shell 从缓存秒开，内容并行加载
```

### 预加载关键资源

```html
<head>
  <!-- 预加载关键资源 -->
  <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/styles/critical.css" as="style">
  <link rel="preload" href="/scripts/app.js" as="script">

  <!-- 预连接到 API 服务器 -->
  <link rel="preconnect" href="https://api.example.com">
  <link rel="dns-prefetch" href="https://api.example.com">
</head>
```

## 调试技巧

### Chrome DevTools

```
Application 面板功能：
┌─────────────────────────────────────────────────────┐
│ Service Workers                                     │
│ ├─ 查看注册的 SW                                    │
│ ├─ 更新、跳过等待、注销                             │
│ └─ 模拟离线状态                                     │
│                                                     │
│ Cache Storage                                       │
│ ├─ 查看所有缓存                                     │
│ ├─ 预览缓存内容                                     │
│ └─ 删除缓存                                         │
│                                                     │
│ Manifest                                            │
│ ├─ 验证 manifest 配置                               │
│ └─ 测试安装功能                                     │
└─────────────────────────────────────────────────────┘
```

### Lighthouse 审计

```bash
# 使用 Lighthouse CLI
npm install -g lighthouse
lighthouse https://your-pwa.com --only-categories=pwa

# 输出报告包含：
# - 可安装性检查
# - PWA 优化清单
# - Service Worker 验证
# - 离线功能测试
```

## 总结

PWA 让 Web 应用拥有原生体验：

| 技术 | 作用 |
|------|------|
| Manifest | 定义应用外观和安装行为 |
| Service Worker | 拦截请求、缓存资源、离线支持 |
| Cache API | 精细控制缓存策略 |
| Push API | 推送通知 |
| Background Sync | 离线数据同步 |
| Workbox | 简化 SW 开发 |

**关键收获**：

1. PWA 是渐进式的——可以逐步增强现有应用
2. Service Worker 是核心——掌握其生命周期至关重要
3. 缓存策略要因地制宜——不同资源用不同策略
4. 离线体验需要精心设计——不只是显示错误页面
5. Workbox 大大简化开发——推荐在生产中使用

PWA 不是要取代原生应用，而是让 Web 应用触达更多用户，提供更好体验。

---

*Web 的未来是渐进式的——PWA 让每个网站都能成为应用。*
