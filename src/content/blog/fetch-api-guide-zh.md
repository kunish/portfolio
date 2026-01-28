---
title: 'Fetch API 完全指南：现代 HTTP 请求详解'
description: '掌握 Fetch 请求配置、响应处理、拦截器封装和错误处理'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'fetch-api-guide'
---

Fetch API 是现代浏览器的标准 HTTP 请求接口。本文探讨 Fetch 的各种用法和最佳实践。

## 基础用法

### 简单请求

```typescript
// GET 请求
const response = await fetch('https://api.example.com/users');
const data = await response.json();

// 检查响应状态
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}

// POST 请求
const createUser = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John',
    email: 'john@example.com'
  })
});
```

### 请求配置

```typescript
const response = await fetch(url, {
  // HTTP 方法
  method: 'POST', // GET, POST, PUT, DELETE, PATCH

  // 请求头
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123',
    'X-Custom-Header': 'value'
  },

  // 请求体
  body: JSON.stringify(data),

  // 凭证模式
  credentials: 'include', // include, same-origin, omit

  // 缓存模式
  cache: 'no-cache', // default, no-store, reload, no-cache, force-cache

  // 重定向模式
  redirect: 'follow', // follow, error, manual

  // 引用策略
  referrerPolicy: 'no-referrer', // no-referrer, origin, same-origin, strict-origin

  // 请求模式
  mode: 'cors', // cors, no-cors, same-origin

  // 信号（用于取消请求）
  signal: abortController.signal
});
```

## 响应处理

### 响应对象

```typescript
const response = await fetch(url);

// 响应属性
console.log(response.ok);         // 200-299 为 true
console.log(response.status);     // HTTP 状态码
console.log(response.statusText); // 状态文本
console.log(response.url);        // 最终 URL
console.log(response.headers);    // Headers 对象
console.log(response.redirected); // 是否重定向

// 读取响应头
const contentType = response.headers.get('Content-Type');
const allHeaders = [...response.headers.entries()];
```

### 响应体解析

```typescript
// JSON
const jsonData = await response.json();

// 文本
const textData = await response.text();

// Blob（二进制）
const blobData = await response.blob();
const imageUrl = URL.createObjectURL(blobData);

// ArrayBuffer
const bufferData = await response.arrayBuffer();

// FormData
const formData = await response.formData();

// 注意：响应体只能读取一次
// 如需多次读取，先克隆
const clone = response.clone();
const data1 = await response.json();
const data2 = await clone.json();
```

### 流式读取

```typescript
const response = await fetch(url);
const reader = response.body?.getReader();

if (reader) {
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    result += decoder.decode(value, { stream: true });
    console.log('Received chunk:', result.length);
  }

  console.log('Complete:', result);
}
```

## 请求取消

### AbortController

```typescript
const controller = new AbortController();

// 发起请求
const fetchPromise = fetch(url, {
  signal: controller.signal
});

// 超时取消
const timeoutId = setTimeout(() => {
  controller.abort();
}, 5000);

try {
  const response = await fetchPromise;
  clearTimeout(timeoutId);
  return await response.json();
} catch (error) {
  if (error instanceof Error && error.name === 'AbortError') {
    console.log('Request was cancelled');
  } else {
    throw error;
  }
}
```

### 超时封装

```typescript
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// 使用
try {
  const response = await fetchWithTimeout('/api/data', {}, 3000);
  const data = await response.json();
} catch (error) {
  if (error instanceof Error && error.name === 'AbortError') {
    console.log('Request timed out');
  }
}
```

## 封装 HTTP 客户端

### 基础封装

```typescript
interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string>;
  data?: unknown;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

class HttpClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string, defaultHeaders: HeadersInit = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
  }

  private buildURL(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, data, timeout = 10000, ...init } = options;

    const url = this.buildURL(endpoint, params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...this.defaultHeaders,
          ...init.headers
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new HttpError(response.status, response.statusText);
      }

      const responseData = await response.json();

      return {
        data: responseData,
        status: response.status,
        headers: response.headers
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', data });
  }

  put<T>(endpoint: string, data: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', data });
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = 'HttpError';
  }
}
```

### 拦截器模式

```typescript
type Interceptor<T> = (value: T) => T | Promise<T>;

interface Interceptors {
  request: Interceptor<RequestInit>[];
  response: Interceptor<Response>[];
}

class HttpClientWithInterceptors extends HttpClient {
  private interceptors: Interceptors = {
    request: [],
    response: []
  };

  addRequestInterceptor(interceptor: Interceptor<RequestInit>) {
    this.interceptors.request.push(interceptor);
  }

  addResponseInterceptor(interceptor: Interceptor<Response>) {
    this.interceptors.response.push(interceptor);
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    // 应用请求拦截器
    let config: RequestInit = { ...options };
    for (const interceptor of this.interceptors.request) {
      config = await interceptor(config);
    }

    // 发起请求
    let response = await fetch(endpoint, config);

    // 应用响应拦截器
    for (const interceptor of this.interceptors.response) {
      response = await interceptor(response);
    }

    const data = await response.json();
    return { data, status: response.status, headers: response.headers };
  }
}

// 使用拦截器
const client = new HttpClientWithInterceptors('https://api.example.com');

// 添加认证头
client.addRequestInterceptor(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }
  return config;
});

// 处理 401 错误
client.addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    // 刷新 token 或跳转登录
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return response;
});
```

## 常见场景

### 文件上传

```typescript
async function uploadFile(file: File, onProgress?: (percent: number) => void) {
  const formData = new FormData();
  formData.append('file', file);

  // 基础上传
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
    // 不要设置 Content-Type，浏览器会自动处理
  });

  return response.json();
}

// 多文件上传
async function uploadMultiple(files: FileList) {
  const formData = new FormData();
  Array.from(files).forEach((file, index) => {
    formData.append(`file${index}`, file);
  });

  return fetch('/api/upload-multiple', {
    method: 'POST',
    body: formData
  });
}
```

### 下载文件

```typescript
async function downloadFile(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();

  // 创建下载链接
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 清理 URL
  URL.revokeObjectURL(downloadUrl);
}

// 带进度的下载
async function downloadWithProgress(
  url: string,
  onProgress: (percent: number) => void
) {
  const response = await fetch(url);
  const contentLength = response.headers.get('Content-Length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader available');

  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    received += value.length;

    if (total > 0) {
      onProgress((received / total) * 100);
    }
  }

  return new Blob(chunks);
}
```

### 并发请求

```typescript
// Promise.all - 全部成功或任一失败
async function fetchAll<T>(urls: string[]): Promise<T[]> {
  const responses = await Promise.all(
    urls.map(url => fetch(url))
  );

  return Promise.all(
    responses.map(res => res.json())
  );
}

// Promise.allSettled - 获取所有结果
async function fetchAllSettled<T>(urls: string[]) {
  const results = await Promise.allSettled(
    urls.map(async url => {
      const res = await fetch(url);
      return res.json();
    })
  );

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return { success: true, data: result.value };
    }
    return { success: false, error: result.reason };
  });
}

// 限制并发数
async function fetchWithConcurrency<T>(
  urls: string[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const url of urls) {
    const promise = fetch(url)
      .then(res => res.json())
      .then(data => { results.push(data); });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}
```

## 最佳实践总结

```
Fetch API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   错误处理                                          │
│   ├── 检查 response.ok                             │
│   ├── 处理网络错误                                 │
│   ├── 处理超时                                     │
│   └── 提供有意义的错误信息                         │
│                                                     │
│   性能优化                                          │
│   ├── 使用请求取消                                 │
│   ├── 实现请求缓存                                 │
│   ├── 控制并发数量                                 │
│   └── 使用 keep-alive                              │
│                                                     │
│   代码组织                                          │
│   ├── 封装 HTTP 客户端                             │
│   ├── 使用拦截器                                   │
│   ├── 类型安全                                     │
│   └── 统一错误处理                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 方法 | 用途 |
|------|------|
| response.json() | 解析 JSON |
| response.text() | 获取文本 |
| response.blob() | 获取二进制 |
| response.clone() | 克隆响应 |

---

*掌握 Fetch API，让 HTTP 请求更优雅。*
