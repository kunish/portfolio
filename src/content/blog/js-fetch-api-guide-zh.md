---
title: 'JavaScript Fetch API 完全指南'
description: '掌握现代网络请求：基础用法、请求配置、响应处理、错误处理与高级技巧'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'js-fetch-api-guide'
---

Fetch API 是现代 JavaScript 进行网络请求的标准方式。本文详解 Fetch API 的用法和最佳实践。

## 基础用法

### 简单请求

```javascript
// 基本 GET 请求
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// 完整写法
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### 请求方法

```javascript
// GET 请求（默认）
const getResponse = await fetch('/api/users');

// POST 请求
const postResponse = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: '张三', email: 'zhang@example.com' })
});

// PUT 请求
const putResponse = await fetch('/api/users/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: '李四' })
});

// DELETE 请求
const deleteResponse = await fetch('/api/users/1', {
  method: 'DELETE'
});

// PATCH 请求
const patchResponse = await fetch('/api/users/1', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ status: 'active' })
});
```

## 请求配置

### 完整配置选项

```javascript
const response = await fetch(url, {
  // 请求方法
  method: 'POST',

  // 请求头
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123',
    'X-Custom-Header': 'value'
  },

  // 请求体
  body: JSON.stringify(data),

  // 请求模式
  mode: 'cors', // 'cors', 'no-cors', 'same-origin'

  // 凭证模式
  credentials: 'include', // 'omit', 'same-origin', 'include'

  // 缓存模式
  cache: 'no-cache', // 'default', 'no-store', 'reload', 'no-cache', 'force-cache'

  // 重定向处理
  redirect: 'follow', // 'follow', 'error', 'manual'

  // 引用策略
  referrerPolicy: 'no-referrer-when-downgrade',

  // 完整性校验
  integrity: 'sha256-abc123...',

  // 保持连接
  keepalive: false,

  // 信号（用于取消请求）
  signal: abortController.signal
});
```

### 请求头操作

```javascript
// 使用 Headers 对象
const headers = new Headers();
headers.append('Content-Type', 'application/json');
headers.append('Authorization', 'Bearer token');

// 或直接传入对象
const headers2 = new Headers({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer token'
});

// 操作方法
headers.set('X-Custom', 'value');  // 设置（覆盖）
headers.append('Accept', 'application/json'); // 添加
headers.delete('X-Custom'); // 删除
headers.get('Content-Type'); // 获取
headers.has('Authorization'); // 检查

// 遍历
for (const [key, value] of headers) {
  console.log(`${key}: ${value}`);
}

// 在请求中使用
await fetch(url, { headers });
```

### 请求体格式

```javascript
// JSON 数据
await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
});

// 表单数据
const formData = new FormData();
formData.append('name', '张三');
formData.append('file', fileInput.files[0]);

await fetch(url, {
  method: 'POST',
  body: formData // 不需要设置 Content-Type，浏览器自动处理
});

// URL 编码数据
const params = new URLSearchParams();
params.append('name', '张三');
params.append('age', '25');

await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: params
});

// 二进制数据
const buffer = new ArrayBuffer(8);
await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/octet-stream' },
  body: buffer
});

// Blob 数据
const blob = new Blob(['Hello'], { type: 'text/plain' });
await fetch(url, {
  method: 'POST',
  body: blob
});
```

## 响应处理

### Response 对象

```javascript
const response = await fetch(url);

// 响应状态
console.log(response.status);       // 状态码：200, 404, 500...
console.log(response.statusText);   // 状态文本：OK, Not Found...
console.log(response.ok);           // 是否成功（200-299）

// 响应头
console.log(response.headers.get('Content-Type'));
console.log(response.headers.get('Content-Length'));

// 响应 URL（可能重定向后变化）
console.log(response.url);

// 响应类型
console.log(response.type); // 'basic', 'cors', 'error', 'opaque'

// 是否重定向
console.log(response.redirected);
```

### 解析响应体

```javascript
const response = await fetch(url);

// JSON
const json = await response.json();

// 文本
const text = await response.text();

// Blob（二进制）
const blob = await response.blob();

// ArrayBuffer
const buffer = await response.arrayBuffer();

// FormData
const formData = await response.formData();

// 注意：响应体只能读取一次
// 如需多次读取，先克隆
const clone = response.clone();
const json1 = await response.json();
const json2 = await clone.json(); // 使用克隆
```

### 流式读取

```javascript
// 读取大文件或流式数据
async function readStream(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const contentLength = +response.headers.get('Content-Length');

  let receivedLength = 0;
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    // 进度
    const progress = (receivedLength / contentLength * 100).toFixed(2);
    console.log(`下载进度: ${progress}%`);
  }

  // 合并数据
  const allChunks = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }

  return allChunks;
}

// 读取文本流
async function readTextStream(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result;
}
```

## 错误处理

### 完整错误处理

```javascript
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);

    // 检查 HTTP 状态
    if (!response.ok) {
      // 尝试解析错误响应
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // 无法解析 JSON
      }

      throw new HttpError(response.status, errorMessage);
    }

    return response;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    // 网络错误
    if (error.name === 'TypeError') {
      throw new NetworkError('网络连接失败');
    }

    // 请求被取消
    if (error.name === 'AbortError') {
      throw new AbortError('请求已取消');
    }

    throw error;
  }
}

// 自定义错误类
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

class AbortError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AbortError';
  }
}

// 使用
try {
  const response = await fetchWithErrorHandling('/api/data');
  const data = await response.json();
} catch (error) {
  if (error instanceof HttpError) {
    if (error.status === 401) {
      redirectToLogin();
    } else if (error.status === 404) {
      showNotFound();
    } else {
      showError(`服务器错误: ${error.message}`);
    }
  } else if (error instanceof NetworkError) {
    showError('网络连接失败，请检查网络');
  } else if (error instanceof AbortError) {
    console.log('请求已取消');
  }
}
```

## 高级功能

### 请求取消

```javascript
// 使用 AbortController
const controller = new AbortController();
const signal = controller.signal;

// 发起请求
const fetchPromise = fetch(url, { signal });

// 取消请求
controller.abort();

// 超时取消
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw error;
  }
}

// 使用 AbortSignal.timeout()（较新 API）
const response = await fetch(url, {
  signal: AbortSignal.timeout(5000)
});
```

### 请求重试

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      // 服务器错误才重试
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      // 客户端错误不重试
      return response;
    } catch (error) {
      lastError = error;

      // 最后一次尝试不等待
      if (i < maxRetries - 1) {
        // 指数退避
        const delay = Math.pow(2, i) * 1000;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

// 更完善的重试策略
async function fetchWithAdvancedRetry(url, options = {}) {
  const config = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryOn: [408, 429, 500, 502, 503, 504],
    ...options.retry
  };

  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(url, options);

      if (response.ok || !config.retryOn.includes(response.status)) {
        return response;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      attempt++;

      if (attempt >= config.maxRetries) {
        throw error;
      }

      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt - 1),
        config.maxDelay
      );

      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### 并发控制

```javascript
// 并发限制器
class ConcurrencyLimiter {
  constructor(limit = 5) {
    this.limit = limit;
    this.running = 0;
    this.queue = [];
  }

  async fetch(url, options) {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, options, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.running >= this.limit || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { url, options, resolve, reject } = this.queue.shift();

    try {
      const response = await fetch(url, options);
      resolve(response);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.processQueue();
    }
  }
}

// 使用
const limiter = new ConcurrencyLimiter(3);

const urls = ['/api/1', '/api/2', '/api/3', '/api/4', '/api/5'];
const responses = await Promise.all(
  urls.map(url => limiter.fetch(url))
);
```

## 封装 HTTP 客户端

### 完整封装

```javascript
class HttpClient {
  constructor(baseURL = '', defaultOptions = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      },
      ...defaultOptions
    };
    this.interceptors = {
      request: [],
      response: []
    };
  }

  // 添加请求拦截器
  addRequestInterceptor(fn) {
    this.interceptors.request.push(fn);
  }

  // 添加响应拦截器
  addResponseInterceptor(fn) {
    this.interceptors.response.push(fn);
  }

  async request(endpoint, options = {}) {
    let url = this.baseURL + endpoint;
    let config = this.mergeOptions(options);

    // 执行请求拦截器
    for (const interceptor of this.interceptors.request) {
      const result = await interceptor({ url, ...config });
      url = result.url || url;
      config = { ...config, ...result };
    }

    try {
      let response = await fetch(url, config);

      // 执行响应拦截器
      for (const interceptor of this.interceptors.response) {
        response = await interceptor(response);
      }

      if (!response.ok) {
        throw new HttpError(response.status, response.statusText);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  mergeOptions(options) {
    return {
      ...this.defaultOptions,
      ...options,
      headers: {
        ...this.defaultOptions.headers,
        ...options.headers
      }
    };
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    const response = await this.request(url);
    return response.json();
  }

  async post(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async put(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async delete(endpoint) {
    const response = await this.request(endpoint, {
      method: 'DELETE'
    });
    return response.json();
  }
}

// 使用
const api = new HttpClient('https://api.example.com');

// 添加认证拦截器
api.addRequestInterceptor(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return config;
});

// 添加响应拦截器
api.addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    // 处理认证失败
    redirectToLogin();
  }
  return response;
});

// API 调用
const users = await api.get('/users', { page: 1, limit: 10 });
const newUser = await api.post('/users', { name: '张三' });
```

## 最佳实践总结

```
Fetch API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   错误处理                                          │
│   ├── 检查 response.ok 状态                        │
│   ├── 处理网络错误                                 │
│   ├── 实现请求超时                                 │
│   └── 适当的重试策略                               │
│                                                     │
│   性能优化                                          │
│   ├── 使用并发控制                                 │
│   ├── 合理使用缓存                                 │
│   ├── 请求取消避免浪费                             │
│   └── 流式处理大数据                               │
│                                                     │
│   安全考虑                                          │
│   ├── 正确配置 CORS                                │
│   ├── 使用 HTTPS                                   │
│   ├── 验证响应数据                                 │
│   └── 保护敏感信息                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐配置 |
|------|---------|
| 跨域请求 | mode: 'cors', credentials: 'include' |
| 表单上传 | 不设置 Content-Type，使用 FormData |
| 大文件 | 流式读取 + 进度显示 |
| 敏感请求 | credentials: 'same-origin' |

---

*掌握 Fetch API，构建现代化的网络请求方案。*
