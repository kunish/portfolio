---
title: 'HTTP 缓存策略：提升 Web 应用性能'
description: '掌握浏览器缓存、CDN 缓存、Service Worker 缓存的最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'http-caching-guide'
---

缓存是 Web 性能优化的核心策略。本文探讨 HTTP 缓存机制和最佳实践。

## 缓存概述

### 缓存类型

```
缓存层级：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   浏览器缓存                                        │
│   └── 本地存储，响应最快                            │
│                                                     │
│   CDN 缓存                                          │
│   └── 边缘节点，地理位置近                          │
│                                                     │
│   服务端缓存                                        │
│   └── Redis/Memcached                              │
│                                                     │
│   源服务器                                          │
│   └── 生成原始响应                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 缓存类型 | 位置 | 特点 |
|----------|------|------|
| 强缓存 | 浏览器 | 不发请求 |
| 协商缓存 | 服务器 | 需验证 |
| CDN 缓存 | 边缘节点 | 地理分布 |

## 强缓存

### Cache-Control

```http
# 响应头设置
Cache-Control: max-age=31536000, immutable

# 常用指令
Cache-Control: max-age=3600      # 缓存 1 小时
Cache-Control: no-cache          # 每次验证
Cache-Control: no-store          # 不缓存
Cache-Control: private           # 仅浏览器缓存
Cache-Control: public            # 允许中间缓存
Cache-Control: immutable         # 内容不变
Cache-Control: stale-while-revalidate=60  # 过期后仍可用
```

### 配置示例

```nginx
# Nginx 配置
# 静态资源（带哈希）
location ~* \.(js|css|png|jpg|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# HTML 文件
location ~* \.html$ {
    add_header Cache-Control "no-cache, must-revalidate";
}

# API 响应
location /api/ {
    add_header Cache-Control "no-store";
}
```

### Expires 头

```http
# 旧版缓存控制（优先级低于 Cache-Control）
Expires: Wed, 21 Oct 2025 07:28:00 GMT
```

## 协商缓存

### ETag

```http
# 服务器响应
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"

# 浏览器请求
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"

# 服务器响应（未修改）
HTTP/1.1 304 Not Modified
```

### Last-Modified

```http
# 服务器响应
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT

# 浏览器请求
If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT

# 服务器响应（未修改）
HTTP/1.1 304 Not Modified
```

### Node.js 实现

```typescript
import { createHash } from 'crypto';
import { stat, readFile } from 'fs/promises';

async function handleRequest(req: Request, filePath: string): Promise<Response> {
  const stats = await stat(filePath);
  const content = await readFile(filePath);

  // 生成 ETag
  const etag = createHash('md5').update(content).digest('hex');
  const lastModified = stats.mtime.toUTCString();

  // 检查协商缓存
  const ifNoneMatch = req.headers.get('if-none-match');
  const ifModifiedSince = req.headers.get('if-modified-since');

  if (ifNoneMatch === etag) {
    return new Response(null, { status: 304 });
  }

  if (ifModifiedSince && new Date(ifModifiedSince) >= stats.mtime) {
    return new Response(null, { status: 304 });
  }

  return new Response(content, {
    headers: {
      'ETag': etag,
      'Last-Modified': lastModified,
      'Cache-Control': 'no-cache',
    },
  });
}
```

## 缓存策略

### 按资源类型

```typescript
// 缓存策略配置
const cacheStrategies = {
  // 静态资源（带内容哈希）
  staticAssets: {
    pattern: /\.(js|css|png|jpg|svg|woff2)$/,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },

  // HTML 文档
  html: {
    pattern: /\.html$/,
    headers: {
      'Cache-Control': 'no-cache',
    },
  },

  // API 响应（动态数据）
  api: {
    pattern: /^\/api\//,
    headers: {
      'Cache-Control': 'private, no-cache',
    },
  },

  // API 响应（可缓存）
  apiCacheable: {
    pattern: /^\/api\/static\//,
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
    },
  },
};
```

### Vary 头

```http
# 根据不同条件返回不同缓存
Vary: Accept-Encoding
Vary: Accept-Language
Vary: Cookie
Vary: Accept, Accept-Encoding
```

## CDN 缓存

### CDN 配置

```typescript
// Cloudflare Workers 缓存控制
async function handleRequest(request: Request): Promise<Response> {
  const cacheUrl = new URL(request.url);
  const cacheKey = new Request(cacheUrl.toString());
  const cache = caches.default;

  // 检查缓存
  let response = await cache.match(cacheKey);
  if (response) {
    return response;
  }

  // 获取源响应
  response = await fetch(request);

  // 克隆响应用于缓存
  const responseToCache = new Response(response.body, response);
  responseToCache.headers.set('Cache-Control', 'public, max-age=3600');

  // 存入缓存
  await cache.put(cacheKey, responseToCache.clone());

  return responseToCache;
}
```

### 缓存清除

```bash
# Cloudflare API 清除缓存
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://example.com/static/main.js"]}'

# 清除所有缓存
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Service Worker 缓存

### 缓存策略

```typescript
// Cache First（缓存优先）
async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  const cache = await caches.open('v1');
  cache.put(request, response.clone());
  return response;
}

// Network First（网络优先）
async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    const cache = await caches.open('v1');
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw new Error('No cached response');
  }
}

// Stale While Revalidate（过期可用）
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open('v1');
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    cache.put(request, response.clone());
    return response;
  });

  return cached || fetchPromise;
}
```

### Service Worker 实现

```typescript
// sw.ts
const CACHE_NAME = 'app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/styles.css',
];

// 安装时预缓存
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// 拦截请求
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 请求 - 网络优先
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 静态资源 - 缓存优先
  event.respondWith(cacheFirst(request));
});
```

## 框架集成

### Next.js

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### Astro

```typescript
// astro.config.mjs
export default {
  vite: {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]',
          chunkFileNames: 'chunks/[name].[hash].js',
          entryFileNames: 'entries/[name].[hash].js',
        },
      },
    },
  },
};
```

## 最佳实践总结

```
HTTP 缓存最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   静态资源                                          │
│   ├── 文件名包含内容哈希                            │
│   ├── 长期缓存（1年）                              │
│   ├── 使用 immutable                               │
│   └── CDN 分发                                      │
│                                                     │
│   HTML 页面                                         │
│   ├── no-cache（每次验证）                         │
│   ├── 使用 ETag                                    │
│   ├── 短期缓存或不缓存                              │
│   └── stale-while-revalidate                       │
│                                                     │
│   API 响应                                          │
│   ├── private（用户数据）                          │
│   ├── 合适的 max-age                               │
│   ├── 考虑 Vary 头                                 │
│   └── 缓存键设计                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 资源类型 | 推荐策略 |
|----------|----------|
| JS/CSS（哈希） | max-age=1y, immutable |
| HTML | no-cache + ETag |
| 图片 | max-age=1y |
| API 数据 | 按场景选择 |

---

*合理的缓存策略是性能优化的低垂果实。*
