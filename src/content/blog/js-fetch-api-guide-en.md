---
title: 'JavaScript Fetch API Complete Guide'
description: 'Master modern network requests: basic usage, request configuration, response handling, error handling, and advanced techniques'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'js-fetch-api-guide'
---

The Fetch API is the modern standard for making network requests in JavaScript. This article covers Fetch API usage and best practices.

## Basic Usage

### Simple Requests

```javascript
// Basic GET request
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// Full syntax
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Request Methods

```javascript
// GET request (default)
const getResponse = await fetch('/api/users');

// POST request
const postResponse = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});

// PUT request
const putResponse = await fetch('/api/users/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'Jane' })
});

// DELETE request
const deleteResponse = await fetch('/api/users/1', {
  method: 'DELETE'
});

// PATCH request
const patchResponse = await fetch('/api/users/1', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ status: 'active' })
});
```

## Request Configuration

### Full Configuration Options

```javascript
const response = await fetch(url, {
  // Request method
  method: 'POST',

  // Request headers
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123',
    'X-Custom-Header': 'value'
  },

  // Request body
  body: JSON.stringify(data),

  // Request mode
  mode: 'cors', // 'cors', 'no-cors', 'same-origin'

  // Credentials mode
  credentials: 'include', // 'omit', 'same-origin', 'include'

  // Cache mode
  cache: 'no-cache', // 'default', 'no-store', 'reload', 'no-cache', 'force-cache'

  // Redirect handling
  redirect: 'follow', // 'follow', 'error', 'manual'

  // Referrer policy
  referrerPolicy: 'no-referrer-when-downgrade',

  // Integrity check
  integrity: 'sha256-abc123...',

  // Keep alive
  keepalive: false,

  // Signal (for cancellation)
  signal: abortController.signal
});
```

### Headers Operations

```javascript
// Using Headers object
const headers = new Headers();
headers.append('Content-Type', 'application/json');
headers.append('Authorization', 'Bearer token');

// Or pass object directly
const headers2 = new Headers({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer token'
});

// Methods
headers.set('X-Custom', 'value');  // Set (overwrite)
headers.append('Accept', 'application/json'); // Append
headers.delete('X-Custom'); // Delete
headers.get('Content-Type'); // Get
headers.has('Authorization'); // Check

// Iterate
for (const [key, value] of headers) {
  console.log(`${key}: ${value}`);
}

// Use in request
await fetch(url, { headers });
```

### Request Body Formats

```javascript
// JSON data
await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
});

// Form data
const formData = new FormData();
formData.append('name', 'John');
formData.append('file', fileInput.files[0]);

await fetch(url, {
  method: 'POST',
  body: formData // No need to set Content-Type, browser handles it
});

// URL encoded data
const params = new URLSearchParams();
params.append('name', 'John');
params.append('age', '25');

await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: params
});

// Binary data
const buffer = new ArrayBuffer(8);
await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/octet-stream' },
  body: buffer
});

// Blob data
const blob = new Blob(['Hello'], { type: 'text/plain' });
await fetch(url, {
  method: 'POST',
  body: blob
});
```

## Response Handling

### Response Object

```javascript
const response = await fetch(url);

// Response status
console.log(response.status);       // Status code: 200, 404, 500...
console.log(response.statusText);   // Status text: OK, Not Found...
console.log(response.ok);           // Success (200-299)

// Response headers
console.log(response.headers.get('Content-Type'));
console.log(response.headers.get('Content-Length'));

// Response URL (may change after redirect)
console.log(response.url);

// Response type
console.log(response.type); // 'basic', 'cors', 'error', 'opaque'

// Redirected
console.log(response.redirected);
```

### Parsing Response Body

```javascript
const response = await fetch(url);

// JSON
const json = await response.json();

// Text
const text = await response.text();

// Blob (binary)
const blob = await response.blob();

// ArrayBuffer
const buffer = await response.arrayBuffer();

// FormData
const formData = await response.formData();

// Note: Body can only be read once
// Clone for multiple reads
const clone = response.clone();
const json1 = await response.json();
const json2 = await clone.json(); // Use clone
```

### Streaming Reads

```javascript
// Read large files or streaming data
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

    // Progress
    const progress = (receivedLength / contentLength * 100).toFixed(2);
    console.log(`Download progress: ${progress}%`);
  }

  // Merge data
  const allChunks = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }

  return allChunks;
}

// Read text stream
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

## Error Handling

### Complete Error Handling

```javascript
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);

    // Check HTTP status
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Cannot parse JSON
      }

      throw new HttpError(response.status, errorMessage);
    }

    return response;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    // Network error
    if (error.name === 'TypeError') {
      throw new NetworkError('Network connection failed');
    }

    // Request aborted
    if (error.name === 'AbortError') {
      throw new AbortError('Request was cancelled');
    }

    throw error;
  }
}

// Custom error classes
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

// Usage
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
      showError(`Server error: ${error.message}`);
    }
  } else if (error instanceof NetworkError) {
    showError('Network connection failed, please check your connection');
  } else if (error instanceof AbortError) {
    console.log('Request was cancelled');
  }
}
```

## Advanced Features

### Request Cancellation

```javascript
// Using AbortController
const controller = new AbortController();
const signal = controller.signal;

// Make request
const fetchPromise = fetch(url, { signal });

// Cancel request
controller.abort();

// Timeout cancellation
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
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Using AbortSignal.timeout() (newer API)
const response = await fetch(url, {
  signal: AbortSignal.timeout(5000)
});
```

### Request Retry

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      // Only retry on server errors
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Don't retry client errors
      return response;
    } catch (error) {
      lastError = error;

      // Don't wait on last attempt
      if (i < maxRetries - 1) {
        // Exponential backoff
        const delay = Math.pow(2, i) * 1000;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

// Advanced retry strategy
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

### Concurrency Control

```javascript
// Concurrency limiter
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

// Usage
const limiter = new ConcurrencyLimiter(3);

const urls = ['/api/1', '/api/2', '/api/3', '/api/4', '/api/5'];
const responses = await Promise.all(
  urls.map(url => limiter.fetch(url))
);
```

## HTTP Client Wrapper

### Complete Wrapper

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

  // Add request interceptor
  addRequestInterceptor(fn) {
    this.interceptors.request.push(fn);
  }

  // Add response interceptor
  addResponseInterceptor(fn) {
    this.interceptors.response.push(fn);
  }

  async request(endpoint, options = {}) {
    let url = this.baseURL + endpoint;
    let config = this.mergeOptions(options);

    // Execute request interceptors
    for (const interceptor of this.interceptors.request) {
      const result = await interceptor({ url, ...config });
      url = result.url || url;
      config = { ...config, ...result };
    }

    try {
      let response = await fetch(url, config);

      // Execute response interceptors
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

// Usage
const api = new HttpClient('https://api.example.com');

// Add auth interceptor
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

// Add response interceptor
api.addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    // Handle auth failure
    redirectToLogin();
  }
  return response;
});

// API calls
const users = await api.get('/users', { page: 1, limit: 10 });
const newUser = await api.post('/users', { name: 'John' });
```

## Best Practices Summary

```
Fetch API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Error Handling                                    │
│   ├── Check response.ok status                     │
│   ├── Handle network errors                        │
│   ├── Implement request timeouts                   │
│   └── Use appropriate retry strategies             │
│                                                     │
│   Performance                                       │
│   ├── Use concurrency control                      │
│   ├── Use caching appropriately                    │
│   ├── Cancel requests to avoid waste               │
│   └── Stream processing for large data             │
│                                                     │
│   Security                                          │
│   ├── Configure CORS properly                      │
│   ├── Use HTTPS                                    │
│   ├── Validate response data                       │
│   └── Protect sensitive information                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Config |
|----------|-------------------|
| Cross-origin | mode: 'cors', credentials: 'include' |
| Form upload | Don't set Content-Type, use FormData |
| Large files | Streaming + progress display |
| Sensitive requests | credentials: 'same-origin' |

---

*Master the Fetch API to build modern network request solutions.*
