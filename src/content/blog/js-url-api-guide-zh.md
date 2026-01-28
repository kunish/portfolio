---
title: 'JavaScript URL API 完全指南'
description: '掌握 URL 解析、URLSearchParams、URL 构建和编码处理技术'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'js-url-api-guide'
---

URL API 是 JavaScript 处理 URL 的现代方式。本文详解 URL 和 URLSearchParams 的各种用法。

## URL 对象

### 创建 URL

```javascript
// 完整 URL
const url = new URL('https://example.com:8080/path/to/page?query=value#section');

// 相对 URL + 基础 URL
const relative = new URL('/api/users', 'https://example.com');
// https://example.com/api/users

// 解析失败抛出错误
try {
  new URL('invalid-url');  // TypeError
} catch (e) {
  console.log('Invalid URL');
}

// 验证 URL
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
```

### URL 属性

```javascript
const url = new URL('https://user:pass@example.com:8080/path/page?q=1&b=2#hash');

// 协议
url.protocol;    // 'https:'

// 主机信息
url.hostname;    // 'example.com'
url.port;        // '8080'
url.host;        // 'example.com:8080'

// 认证信息
url.username;    // 'user'
url.password;    // 'pass'

// 路径
url.pathname;    // '/path/page'

// 查询字符串
url.search;      // '?q=1&b=2'

// 哈希
url.hash;        // '#hash'

// 完整来源
url.origin;      // 'https://example.com:8080'

// 完整 URL
url.href;        // 完整 URL 字符串
url.toString();  // 同上
```

### 修改 URL

```javascript
const url = new URL('https://example.com/page');

// 修改各部分
url.pathname = '/new-path';
url.search = '?key=value';
url.hash = '#section';

console.log(url.href);
// 'https://example.com/new-path?key=value#section'

// 修改主机
url.hostname = 'api.example.com';
url.port = '3000';

// 修改协议
url.protocol = 'http:';

// 所有修改会自动规范化
url.pathname = 'no-leading-slash';
url.pathname;  // '/no-leading-slash'
```

## URLSearchParams

### 创建和解析

```javascript
// 从字符串创建
const params1 = new URLSearchParams('name=Alice&age=25');

// 从对象创建
const params2 = new URLSearchParams({
  name: 'Alice',
  age: 25
});

// 从数组创建（支持重复键）
const params3 = new URLSearchParams([
  ['tag', 'javascript'],
  ['tag', 'web'],
  ['tag', 'frontend']
]);

// 从 URL 获取
const url = new URL('https://example.com?key=value');
const params4 = url.searchParams;

// 从表单数据创建
const form = document.querySelector('form');
const params5 = new URLSearchParams(new FormData(form));
```

### 读取参数

```javascript
const params = new URLSearchParams('name=Alice&age=25&tags=a&tags=b');

// 获取单个值
params.get('name');     // 'Alice'
params.get('missing');  // null

// 获取所有值
params.getAll('tags');  // ['a', 'b']

// 检查是否存在
params.has('name');     // true
params.has('missing');  // false

// 获取参数数量
params.size;  // 4（ES2023）

// 转换为字符串
params.toString();  // 'name=Alice&age=25&tags=a&tags=b'
```

### 修改参数

```javascript
const params = new URLSearchParams();

// 设置参数（覆盖已有）
params.set('name', 'Alice');
params.set('age', '25');

// 追加参数（允许重复）
params.append('tag', 'javascript');
params.append('tag', 'web');

// 删除参数
params.delete('age');

// 删除指定值的参数（ES2023）
params.delete('tag', 'web');

// 排序参数
params.sort();

console.log(params.toString());
// 'name=Alice&tag=javascript'
```

### 遍历参数

```javascript
const params = new URLSearchParams('a=1&b=2&c=3');

// for...of 遍历
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

// 转换为对象
const obj = Object.fromEntries(params);
// { a: '1', b: '2', c: '3' }

// 注意：重复键只保留最后一个值
const multi = new URLSearchParams('tag=a&tag=b');
Object.fromEntries(multi);  // { tag: 'b' }
```

## URL 编码

### 自动编码

```javascript
// URL 对象自动处理编码
const url = new URL('https://example.com/path');

// 路径中的特殊字符
url.pathname = '/文件/文档';
url.pathname;  // '/%E6%96%87%E4%BB%B6/%E6%96%87%E6%A1%A3'

// 查询参数自动编码
url.searchParams.set('query', '你好 世界');
url.search;  // '?query=%E4%BD%A0%E5%A5%BD+%E4%B8%96%E7%95%8C'

// 读取时自动解码
url.searchParams.get('query');  // '你好 世界'
```

### 手动编码函数

```javascript
// encodeURIComponent - 编码组件
encodeURIComponent('hello world');  // 'hello%20world'
encodeURIComponent('key=value&foo=bar');  // 'key%3Dvalue%26foo%3Dbar'
encodeURIComponent('中文');  // '%E4%B8%AD%E6%96%87'

// decodeURIComponent - 解码组件
decodeURIComponent('hello%20world');  // 'hello world'
decodeURIComponent('%E4%B8%AD%E6%96%87');  // '中文'

// encodeURI - 编码完整 URI（保留 URL 特殊字符）
encodeURI('https://example.com/path?query=hello world');
// 'https://example.com/path?query=hello%20world'

// decodeURI - 解码完整 URI
decodeURI('https://example.com/path?query=hello%20world');
// 'https://example.com/path?query=hello world'

// 区别
const text = 'a=1&b=2';
encodeURIComponent(text);  // 'a%3D1%26b%3D2'（编码 = 和 &）
encodeURI(text);           // 'a=1&b=2'（保留 = 和 &）
```

### Base64 编码

```javascript
// 字符串转 Base64
function stringToBase64(str) {
  // 处理 Unicode
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, byte =>
    String.fromCharCode(byte)
  ).join('');
  return btoa(binString);
}

// Base64 转字符串
function base64ToString(base64) {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, char =>
    char.charCodeAt(0)
  );
  return new TextDecoder().decode(bytes);
}

// 使用示例
const encoded = stringToBase64('你好世界');
const decoded = base64ToString(encoded);

// URL 安全的 Base64
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

## 实际应用场景

### 构建 API URL

```javascript
function buildAPIUrl(endpoint, params = {}) {
  const url = new URL(endpoint, 'https://api.example.com');

  // 添加查询参数
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

// 使用示例
buildAPIUrl('/users', { page: 1, limit: 10 });
// 'https://api.example.com/users?page=1&limit=10'

buildAPIUrl('/search', { q: '关键词', tags: ['a', 'b'] });
// 'https://api.example.com/search?q=%E5%85%B3%E9%94%AE%E8%AF%8D&tags=a&tags=b'
```

### 解析当前 URL

```javascript
// 获取当前页面 URL 参数
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params);
}

// 获取特定参数
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// 更新 URL 参数（不刷新页面）
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

// 使用示例
updateQueryParams({ page: 2, filter: 'active' });
```

### URL 模板

```javascript
// URL 模板替换
function resolveURLTemplate(template, params) {
  let result = template;

  // 替换路径参数
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, encodeURIComponent(value));
  });

  return result;
}

// 使用示例
resolveURLTemplate('/users/:id/posts/:postId', {
  id: 123,
  postId: 456
});
// '/users/123/posts/456'

// 带查询参数的版本
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

### 深度链接解析

```javascript
// 解析 hash 路由
function parseHashRoute(hash) {
  // 格式: #/path?query
  const hashUrl = new URL(hash.slice(1), 'http://dummy');
  return {
    path: hashUrl.pathname,
    params: Object.fromEntries(hashUrl.searchParams)
  };
}

// 使用示例
parseHashRoute('#/users?page=2&sort=name');
// { path: '/users', params: { page: '2', sort: 'name' } }

// 解析复杂的深度链接
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

### URL 验证和规范化

```javascript
// 验证 URL 格式
function validateURL(input, options = {}) {
  const { allowedProtocols = ['http:', 'https:'] } = options;

  try {
    const url = new URL(input);

    if (!allowedProtocols.includes(url.protocol)) {
      return { valid: false, error: '不允许的协议' };
    }

    return { valid: true, url };
  } catch {
    return { valid: false, error: '无效的 URL 格式' };
  }
}

// 规范化 URL
function normalizeURL(input) {
  const url = new URL(input);

  // 移除默认端口
  if ((url.protocol === 'https:' && url.port === '443') ||
      (url.protocol === 'http:' && url.port === '80')) {
    url.port = '';
  }

  // 移除尾部斜杠
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';

  // 排序查询参数
  url.searchParams.sort();

  // 移除空哈希
  if (url.hash === '#') {
    url.hash = '';
  }

  return url.toString();
}

// 比较两个 URL 是否相同
function isSameURL(url1, url2) {
  return normalizeURL(url1) === normalizeURL(url2);
}
```

### 安全的 URL 处理

```javascript
// 检查是否为外部链接
function isExternalLink(url, baseHost = window.location.host) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.host !== baseHost;
  } catch {
    return false;
  }
}

// 提取域名
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

// 安全的 URL 重定向
function safeRedirect(url, allowedHosts = []) {
  try {
    const parsed = new URL(url, window.location.href);

    // 只允许 http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    // 检查主机白名单
    if (allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
```

### URL 转短链接

```javascript
// 简单的 URL 标识符生成
function generateShortId(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// URL 映射（简化版）
class URLShortener {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.urlMap = new Map();
  }

  shorten(longUrl) {
    // 检查是否已存在
    for (const [short, long] of this.urlMap) {
      if (long === longUrl) return this.baseUrl + short;
    }

    // 生成新的短链接
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

## 最佳实践总结

```
URL API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   使用 URL 对象                                     │
│   ├── 避免手动字符串拼接                           │
│   ├── 利用自动编码特性                             │
│   └── 使用属性访问各部分                           │
│                                                     │
│   使用 URLSearchParams                              │
│   ├── 解析和构建查询字符串                         │
│   ├── 处理重复参数用 getAll/append                 │
│   └── 转换为对象用 Object.fromEntries              │
│                                                     │
│   安全考虑                                          │
│   ├── 验证用户输入的 URL                           │
│   ├── 检查协议和主机白名单                         │
│   └── 防止开放重定向漏洞                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 方法 | 用途 | 示例 |
|------|------|------|
| new URL() | 解析/构建 URL | new URL('/path', base) |
| url.searchParams | 访问查询参数 | url.searchParams.get() |
| URLSearchParams | 操作查询字符串 | new URLSearchParams(str) |
| encodeURIComponent | 编码 URL 组件 | encodeURIComponent(值) |

---

*掌握 URL API，构建健壮的 URL 处理逻辑。*
