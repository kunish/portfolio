---
title: 'Fetch API Complete Guide: Modern HTTP Requests Explained'
description: 'Master Fetch request configuration, response handling, interceptor patterns and error handling'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'fetch-api-guide'
---

The Fetch API is the standard HTTP request interface for modern browsers. This article explores various Fetch usage patterns and best practices.

## Basic Usage

### Simple Requests

```typescript
// GET request
const response = await fetch('https://api.example.com/users');
const data = await response.json();

// Check response status
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}

// POST request
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

### Request Configuration

```typescript
const response = await fetch(url, {
  // HTTP method
  method: 'POST', // GET, POST, PUT, DELETE, PATCH

  // Request headers
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123',
    'X-Custom-Header': 'value'
  },

  // Request body
  body: JSON.stringify(data),

  // Credentials mode
  credentials: 'include', // include, same-origin, omit

  // Cache mode
  cache: 'no-cache', // default, no-store, reload, no-cache, force-cache

  // Redirect mode
  redirect: 'follow', // follow, error, manual

  // Referrer policy
  referrerPolicy: 'no-referrer', // no-referrer, origin, same-origin, strict-origin

  // Request mode
  mode: 'cors', // cors, no-cors, same-origin

  // Signal (for cancellation)
  signal: abortController.signal
});
```

## Response Handling

### Response Object

```typescript
const response = await fetch(url);

// Response properties
console.log(response.ok);         // true for 200-299
console.log(response.status);     // HTTP status code
console.log(response.statusText); // Status text
console.log(response.url);        // Final URL
console.log(response.headers);    // Headers object
console.log(response.redirected); // Was redirected

// Read response headers
const contentType = response.headers.get('Content-Type');
const allHeaders = [...response.headers.entries()];
```

### Response Body Parsing

```typescript
// JSON
const jsonData = await response.json();

// Text
const textData = await response.text();

// Blob (binary)
const blobData = await response.blob();
const imageUrl = URL.createObjectURL(blobData);

// ArrayBuffer
const bufferData = await response.arrayBuffer();

// FormData
const formData = await response.formData();

// Note: body can only be read once
// Clone if needed multiple times
const clone = response.clone();
const data1 = await response.json();
const data2 = await clone.json();
```

### Streaming Read

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

## Request Cancellation

### AbortController

```typescript
const controller = new AbortController();

// Make request
const fetchPromise = fetch(url, {
  signal: controller.signal
});

// Cancel after timeout
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

### Timeout Wrapper

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

// Usage
try {
  const response = await fetchWithTimeout('/api/data', {}, 3000);
  const data = await response.json();
} catch (error) {
  if (error instanceof Error && error.name === 'AbortError') {
    console.log('Request timed out');
  }
}
```

## HTTP Client Wrapper

### Basic Wrapper

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

### Interceptor Pattern

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
    // Apply request interceptors
    let config: RequestInit = { ...options };
    for (const interceptor of this.interceptors.request) {
      config = await interceptor(config);
    }

    // Make request
    let response = await fetch(endpoint, config);

    // Apply response interceptors
    for (const interceptor of this.interceptors.response) {
      response = await interceptor(response);
    }

    const data = await response.json();
    return { data, status: response.status, headers: response.headers };
  }
}

// Using interceptors
const client = new HttpClientWithInterceptors('https://api.example.com');

// Add auth header
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

// Handle 401 errors
client.addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    // Refresh token or redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return response;
});
```

## Common Scenarios

### File Upload

```typescript
async function uploadFile(file: File, onProgress?: (percent: number) => void) {
  const formData = new FormData();
  formData.append('file', file);

  // Basic upload
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
    // Don't set Content-Type, browser handles it
  });

  return response.json();
}

// Multiple file upload
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

### File Download

```typescript
async function downloadFile(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();

  // Create download link
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup URL
  URL.revokeObjectURL(downloadUrl);
}

// Download with progress
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

### Concurrent Requests

```typescript
// Promise.all - all succeed or any fails
async function fetchAll<T>(urls: string[]): Promise<T[]> {
  const responses = await Promise.all(
    urls.map(url => fetch(url))
  );

  return Promise.all(
    responses.map(res => res.json())
  );
}

// Promise.allSettled - get all results
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

// Limit concurrency
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

## Best Practices Summary

```
Fetch API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Error Handling                                    │
│   ├── Check response.ok                            │
│   ├── Handle network errors                        │
│   ├── Handle timeouts                              │
│   └── Provide meaningful error messages            │
│                                                     │
│   Performance                                       │
│   ├── Use request cancellation                     │
│   ├── Implement request caching                    │
│   ├── Control concurrency                          │
│   └── Use keep-alive                               │
│                                                     │
│   Code Organization                                 │
│   ├── Wrap in HTTP client                          │
│   ├── Use interceptors                             │
│   ├── Ensure type safety                           │
│   └── Centralize error handling                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Method | Purpose |
|--------|---------|
| response.json() | Parse JSON |
| response.text() | Get text |
| response.blob() | Get binary |
| response.clone() | Clone response |

---

*Master the Fetch API for more elegant HTTP requests.*
