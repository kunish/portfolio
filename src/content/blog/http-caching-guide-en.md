---
title: 'HTTP Caching Strategies: Boosting Web Application Performance'
description: 'Master browser caching, CDN caching, and Service Worker caching best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'http-caching-guide'
---

Caching is a core strategy for web performance optimization. This article explores HTTP caching mechanisms and best practices.

## Caching Overview

### Cache Types

```
Caching Layers:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Browser Cache                                     │
│   └── Local storage, fastest response              │
│                                                     │
│   CDN Cache                                         │
│   └── Edge nodes, geographically close             │
│                                                     │
│   Server Cache                                      │
│   └── Redis/Memcached                              │
│                                                     │
│   Origin Server                                     │
│   └── Generates original response                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Cache Type | Location | Characteristic |
|------------|----------|----------------|
| Strong Cache | Browser | No request sent |
| Negotiated Cache | Server | Requires validation |
| CDN Cache | Edge nodes | Geo-distributed |

## Strong Caching

### Cache-Control

```http
# Response header
Cache-Control: max-age=31536000, immutable

# Common directives
Cache-Control: max-age=3600      # Cache for 1 hour
Cache-Control: no-cache          # Validate each time
Cache-Control: no-store          # Don't cache
Cache-Control: private           # Browser only
Cache-Control: public            # Allow intermediary caches
Cache-Control: immutable         # Content won't change
Cache-Control: stale-while-revalidate=60  # Usable after expiry
```

### Configuration Examples

```nginx
# Nginx configuration
# Static assets (with hash)
location ~* \.(js|css|png|jpg|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# HTML files
location ~* \.html$ {
    add_header Cache-Control "no-cache, must-revalidate";
}

# API responses
location /api/ {
    add_header Cache-Control "no-store";
}
```

### Expires Header

```http
# Legacy cache control (lower priority than Cache-Control)
Expires: Wed, 21 Oct 2025 07:28:00 GMT
```

## Negotiated Caching

### ETag

```http
# Server response
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"

# Browser request
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"

# Server response (not modified)
HTTP/1.1 304 Not Modified
```

### Last-Modified

```http
# Server response
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT

# Browser request
If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT

# Server response (not modified)
HTTP/1.1 304 Not Modified
```

### Node.js Implementation

```typescript
import { createHash } from 'crypto';
import { stat, readFile } from 'fs/promises';

async function handleRequest(req: Request, filePath: string): Promise<Response> {
  const stats = await stat(filePath);
  const content = await readFile(filePath);

  // Generate ETag
  const etag = createHash('md5').update(content).digest('hex');
  const lastModified = stats.mtime.toUTCString();

  // Check negotiated cache
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

## Caching Strategies

### By Resource Type

```typescript
// Cache strategy configuration
const cacheStrategies = {
  // Static assets (with content hash)
  staticAssets: {
    pattern: /\.(js|css|png|jpg|svg|woff2)$/,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },

  // HTML documents
  html: {
    pattern: /\.html$/,
    headers: {
      'Cache-Control': 'no-cache',
    },
  },

  // API responses (dynamic data)
  api: {
    pattern: /^\/api\//,
    headers: {
      'Cache-Control': 'private, no-cache',
    },
  },

  // API responses (cacheable)
  apiCacheable: {
    pattern: /^\/api\/static\//,
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
    },
  },
};
```

### Vary Header

```http
# Return different cached versions based on conditions
Vary: Accept-Encoding
Vary: Accept-Language
Vary: Cookie
Vary: Accept, Accept-Encoding
```

## CDN Caching

### CDN Configuration

```typescript
// Cloudflare Workers cache control
async function handleRequest(request: Request): Promise<Response> {
  const cacheUrl = new URL(request.url);
  const cacheKey = new Request(cacheUrl.toString());
  const cache = caches.default;

  // Check cache
  let response = await cache.match(cacheKey);
  if (response) {
    return response;
  }

  // Fetch from origin
  response = await fetch(request);

  // Clone response for caching
  const responseToCache = new Response(response.body, response);
  responseToCache.headers.set('Cache-Control', 'public, max-age=3600');

  // Store in cache
  await cache.put(cacheKey, responseToCache.clone());

  return responseToCache;
}
```

### Cache Purging

```bash
# Cloudflare API purge cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://example.com/static/main.js"]}'

# Purge all cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Service Worker Caching

### Caching Strategies

```typescript
// Cache First
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

// Network First
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

// Stale While Revalidate
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

### Service Worker Implementation

```typescript
// sw.ts
const CACHE_NAME = 'app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/styles.css',
];

// Pre-cache on install
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Clean old caches on activate
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

// Intercept requests
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - Cache First
  event.respondWith(cacheFirst(request));
});
```

## Framework Integration

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

## Best Practices Summary

```
HTTP Caching Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Static Assets                                     │
│   ├── Include content hash in filename             │
│   ├── Long-term cache (1 year)                     │
│   ├── Use immutable                                │
│   └── CDN distribution                             │
│                                                     │
│   HTML Pages                                        │
│   ├── no-cache (validate each time)               │
│   ├── Use ETag                                     │
│   ├── Short-term or no caching                     │
│   └── stale-while-revalidate                       │
│                                                     │
│   API Responses                                     │
│   ├── private (user data)                          │
│   ├── Appropriate max-age                          │
│   ├── Consider Vary header                         │
│   └── Cache key design                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Resource Type | Recommended Strategy |
|---------------|---------------------|
| JS/CSS (hashed) | max-age=1y, immutable |
| HTML | no-cache + ETag |
| Images | max-age=1y |
| API data | Choose by scenario |

---

*Proper caching strategy is low-hanging fruit for performance optimization.*
