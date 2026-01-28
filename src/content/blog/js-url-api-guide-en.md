---
title: 'JavaScript URL API Complete Guide'
description: 'Master URL parsing, URLSearchParams, URL construction, and encoding techniques'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'js-url-api-guide'
---

The URL API is the modern way to handle URLs in JavaScript. This article covers various uses of URL and URLSearchParams.

## URL Object

### Creating URLs

```javascript
// Full URL
const url = new URL('https://example.com:8080/path/to/page?query=value#section');

// Relative URL + base URL
const relative = new URL('/api/users', 'https://example.com');
// https://example.com/api/users

// Parse failure throws error
try {
  new URL('invalid-url');  // TypeError
} catch (e) {
  console.log('Invalid URL');
}

// Validate URL
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
```

### URL Properties

```javascript
const url = new URL('https://user:pass@example.com:8080/path/page?q=1&b=2#hash');

// Protocol
url.protocol;    // 'https:'

// Host information
url.hostname;    // 'example.com'
url.port;        // '8080'
url.host;        // 'example.com:8080'

// Authentication
url.username;    // 'user'
url.password;    // 'pass'

// Path
url.pathname;    // '/path/page'

// Query string
url.search;      // '?q=1&b=2'

// Hash
url.hash;        // '#hash'

// Full origin
url.origin;      // 'https://example.com:8080'

// Full URL
url.href;        // Full URL string
url.toString();  // Same as above
```

### Modifying URLs

```javascript
const url = new URL('https://example.com/page');

// Modify parts
url.pathname = '/new-path';
url.search = '?key=value';
url.hash = '#section';

console.log(url.href);
// 'https://example.com/new-path?key=value#section'

// Modify host
url.hostname = 'api.example.com';
url.port = '3000';

// Modify protocol
url.protocol = 'http:';

// All modifications are auto-normalized
url.pathname = 'no-leading-slash';
url.pathname;  // '/no-leading-slash'
```

## URLSearchParams

### Creating and Parsing

```javascript
// From string
const params1 = new URLSearchParams('name=Alice&age=25');

// From object
const params2 = new URLSearchParams({
  name: 'Alice',
  age: 25
});

// From array (supports duplicate keys)
const params3 = new URLSearchParams([
  ['tag', 'javascript'],
  ['tag', 'web'],
  ['tag', 'frontend']
]);

// From URL
const url = new URL('https://example.com?key=value');
const params4 = url.searchParams;

// From form data
const form = document.querySelector('form');
const params5 = new URLSearchParams(new FormData(form));
```

### Reading Parameters

```javascript
const params = new URLSearchParams('name=Alice&age=25&tags=a&tags=b');

// Get single value
params.get('name');     // 'Alice'
params.get('missing');  // null

// Get all values
params.getAll('tags');  // ['a', 'b']

// Check existence
params.has('name');     // true
params.has('missing');  // false

// Get parameter count
params.size;  // 4 (ES2023)

// Convert to string
params.toString();  // 'name=Alice&age=25&tags=a&tags=b'
```

### Modifying Parameters

```javascript
const params = new URLSearchParams();

// Set parameter (overwrites existing)
params.set('name', 'Alice');
params.set('age', '25');

// Append parameter (allows duplicates)
params.append('tag', 'javascript');
params.append('tag', 'web');

// Delete parameter
params.delete('age');

// Delete parameter with specific value (ES2023)
params.delete('tag', 'web');

// Sort parameters
params.sort();

console.log(params.toString());
// 'name=Alice&tag=javascript'
```

### Iterating Parameters

```javascript
const params = new URLSearchParams('a=1&b=2&c=3');

// for...of iteration
for (const [key, value] of params) {
  console.log(`${key}: ${value}`);
}

// entries()
for (const [key, value] of params.entries()) {
  console.log(key, value);
}

// keys()
for (const key of params.keys()) {
  console.log(key);
}

// values()
for (const value of params.values()) {
  console.log(value);
}

// forEach
params.forEach((value, key) => {
  console.log(key, value);
});

// Convert to object
const obj = Object.fromEntries(params);
// { a: '1', b: '2', c: '3' }

// Note: duplicate keys keep only last value
const multi = new URLSearchParams('tag=a&tag=b');
Object.fromEntries(multi);  // { tag: 'b' }
```

## URL Encoding

### Automatic Encoding

```javascript
// URL object handles encoding automatically
const url = new URL('https://example.com/path');

// Special characters in path
url.pathname = '/files/document';
url.pathname;  // '/files/document'

// Query parameters auto-encode
url.searchParams.set('query', 'hello world');
url.search;  // '?query=hello+world'

// Auto-decode when reading
url.searchParams.get('query');  // 'hello world'
```

### Manual Encoding Functions

```javascript
// encodeURIComponent - encode component
encodeURIComponent('hello world');  // 'hello%20world'
encodeURIComponent('key=value&foo=bar');  // 'key%3Dvalue%26foo%3Dbar'
encodeURIComponent('中文');  // '%E4%B8%AD%E6%96%87'

// decodeURIComponent - decode component
decodeURIComponent('hello%20world');  // 'hello world'
decodeURIComponent('%E4%B8%AD%E6%96%87');  // '中文'

// encodeURI - encode full URI (preserves URL special chars)
encodeURI('https://example.com/path?query=hello world');
// 'https://example.com/path?query=hello%20world'

// decodeURI - decode full URI
decodeURI('https://example.com/path?query=hello%20world');
// 'https://example.com/path?query=hello world'

// Difference
const text = 'a=1&b=2';
encodeURIComponent(text);  // 'a%3D1%26b%3D2' (encodes = and &)
encodeURI(text);           // 'a=1&b=2' (preserves = and &)
```

### Base64 Encoding

```javascript
// String to Base64
function stringToBase64(str) {
  // Handle Unicode
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, byte =>
    String.fromCharCode(byte)
  ).join('');
  return btoa(binString);
}

// Base64 to string
function base64ToString(base64) {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, char =>
    char.charCodeAt(0)
  );
  return new TextDecoder().decode(bytes);
}

// Usage
const encoded = stringToBase64('Hello World');
const decoded = base64ToString(encoded);

// URL-safe Base64
function toBase64URL(base64) {
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64URL(base64url) {
  let base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
}
```

## Practical Applications

### Building API URLs

```javascript
function buildAPIUrl(endpoint, params = {}) {
  const url = new URL(endpoint, 'https://api.example.com');

  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, value);
      }
    }
  });

  return url.toString();
}

// Usage
buildAPIUrl('/users', { page: 1, limit: 10 });
// 'https://api.example.com/users?page=1&limit=10'

buildAPIUrl('/search', { q: 'keyword', tags: ['a', 'b'] });
// 'https://api.example.com/search?q=keyword&tags=a&tags=b'
```

### Parsing Current URL

```javascript
// Get current page URL parameters
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params);
}

// Get specific parameter
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Update URL parameters (without page reload)
function updateQueryParams(updates) {
  const url = new URL(window.location.href);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  window.history.replaceState({}, '', url.toString());
}

// Usage
updateQueryParams({ page: 2, filter: 'active' });
```

### URL Templates

```javascript
// URL template replacement
function resolveURLTemplate(template, params) {
  let result = template;

  // Replace path parameters
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, encodeURIComponent(value));
  });

  return result;
}

// Usage
resolveURLTemplate('/users/:id/posts/:postId', {
  id: 123,
  postId: 456
});
// '/users/123/posts/456'

// Version with query parameters
function buildURL(template, pathParams = {}, queryParams = {}) {
  let path = resolveURLTemplate(template, pathParams);
  const url = new URL(path, 'https://api.example.com');

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}
```

### Deep Link Parsing

```javascript
// Parse hash route
function parseHashRoute(hash) {
  // Format: #/path?query
  const hashUrl = new URL(hash.slice(1), 'http://dummy');
  return {
    path: hashUrl.pathname,
    params: Object.fromEntries(hashUrl.searchParams)
  };
}

// Usage
parseHashRoute('#/users?page=2&sort=name');
// { path: '/users', params: { page: '2', sort: 'name' } }

// Parse complex deep links
function parseDeepLink(url) {
  const parsed = new URL(url);
  return {
    scheme: parsed.protocol.replace(':', ''),
    host: parsed.hostname,
    path: parsed.pathname,
    query: Object.fromEntries(parsed.searchParams),
    fragment: parsed.hash.slice(1)
  };
}
```

### URL Validation and Normalization

```javascript
// Validate URL format
function validateURL(input, options = {}) {
  const { allowedProtocols = ['http:', 'https:'] } = options;

  try {
    const url = new URL(input);

    if (!allowedProtocols.includes(url.protocol)) {
      return { valid: false, error: 'Protocol not allowed' };
    }

    return { valid: true, url };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// Normalize URL
function normalizeURL(input) {
  const url = new URL(input);

  // Remove default ports
  if ((url.protocol === 'https:' && url.port === '443') ||
      (url.protocol === 'http:' && url.port === '80')) {
    url.port = '';
  }

  // Remove trailing slashes
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';

  // Sort query parameters
  url.searchParams.sort();

  // Remove empty hash
  if (url.hash === '#') {
    url.hash = '';
  }

  return url.toString();
}

// Compare two URLs
function isSameURL(url1, url2) {
  return normalizeURL(url1) === normalizeURL(url2);
}
```

### Safe URL Handling

```javascript
// Check if external link
function isExternalLink(url, baseHost = window.location.host) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.host !== baseHost;
  } catch {
    return false;
  }
}

// Extract domain
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

// Safe URL redirect
function safeRedirect(url, allowedHosts = []) {
  try {
    const parsed = new URL(url, window.location.href);

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    // Check host whitelist
    if (allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
```

### URL Shortening

```javascript
// Simple URL identifier generation
function generateShortId(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// URL mapping (simplified)
class URLShortener {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.urlMap = new Map();
  }

  shorten(longUrl) {
    // Check if already exists
    for (const [short, long] of this.urlMap) {
      if (long === longUrl) return this.baseUrl + short;
    }

    // Generate new short link
    let shortId;
    do {
      shortId = generateShortId();
    } while (this.urlMap.has(shortId));

    this.urlMap.set(shortId, longUrl);
    return this.baseUrl + shortId;
  }

  expand(shortUrl) {
    const url = new URL(shortUrl);
    const shortId = url.pathname.slice(1);
    return this.urlMap.get(shortId) || null;
  }
}
```

## Best Practices Summary

```
URL API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Use URL Object                                    │
│   ├── Avoid manual string concatenation            │
│   ├── Leverage auto-encoding features              │
│   └── Use properties to access parts               │
│                                                     │
│   Use URLSearchParams                               │
│   ├── Parse and build query strings                │
│   ├── Handle duplicates with getAll/append         │
│   └── Convert to object with Object.fromEntries    │
│                                                     │
│   Security                                          │
│   ├── Validate user-input URLs                     │
│   ├── Check protocol and host whitelists           │
│   └── Prevent open redirect vulnerabilities        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Method | Purpose | Example |
|--------|---------|---------|
| new URL() | Parse/build URL | new URL('/path', base) |
| url.searchParams | Access query params | url.searchParams.get() |
| URLSearchParams | Manipulate query string | new URLSearchParams(str) |
| encodeURIComponent | Encode URL component | encodeURIComponent(value) |

---

*Master the URL API to build robust URL handling logic.*
