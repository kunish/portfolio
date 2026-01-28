---
title: 'JSON 完全指南：数据格式与高级处理技巧'
description: '掌握 JSON 语法、解析方法、Schema 验证和性能优化'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'json-guide'
---

JSON 是现代 Web 开发中最常用的数据交换格式。本文探讨 JSON 的深入用法。

## JSON 基础

### 语法规则

```json
{
  "string": "Hello World",
  "number": 42,
  "float": 3.14,
  "boolean": true,
  "null": null,
  "array": [1, 2, 3],
  "object": {
    "nested": "value"
  }
}
```

### 数据类型

```
JSON 数据类型：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   基本类型                                          │
│   ├── String   "hello"                             │
│   ├── Number   42, 3.14, -1, 1e10                  │
│   ├── Boolean  true, false                         │
│   └── Null     null                                │
│                                                     │
│   复合类型                                          │
│   ├── Object   {"key": "value"}                    │
│   └── Array    [1, 2, 3]                           │
│                                                     │
│   不支持                                            │
│   ├── undefined                                    │
│   ├── Function                                     │
│   ├── Symbol                                       │
│   ├── Date（需转为字符串）                          │
│   └── 注释                                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 语法要点

```javascript
// 正确的 JSON
{
  "name": "John",      // 键必须用双引号
  "age": 30            // 最后一项不能有逗号
}

// 错误示例
{
  name: "John",        // 错误：键没有引号
  'age': 30,           // 错误：单引号
  "city": "NYC",       // 错误：末尾逗号
}
```

## JavaScript 中的 JSON

### 解析和序列化

```typescript
// JSON.parse - 字符串转对象
const jsonString = '{"name":"John","age":30}';
const obj = JSON.parse(jsonString);
console.log(obj.name); // "John"

// JSON.stringify - 对象转字符串
const data = { name: 'John', age: 30 };
const str = JSON.stringify(data);
console.log(str); // '{"name":"John","age":30}'

// 格式化输出
const formatted = JSON.stringify(data, null, 2);
console.log(formatted);
// {
//   "name": "John",
//   "age": 30
// }
```

### 高级选项

```typescript
// replacer 函数 - 自定义序列化
const user = {
  name: 'John',
  password: 'secret',
  age: 30
};

const safe = JSON.stringify(user, (key, value) => {
  if (key === 'password') return undefined;
  return value;
});
// '{"name":"John","age":30}'

// replacer 数组 - 选择字段
const partial = JSON.stringify(user, ['name', 'age']);
// '{"name":"John","age":30}'

// reviver 函数 - 自定义解析
const dateStr = '{"created":"2025-01-28T00:00:00.000Z"}';
const withDate = JSON.parse(dateStr, (key, value) => {
  if (key === 'created') return new Date(value);
  return value;
});
console.log(withDate.created instanceof Date); // true
```

### 深拷贝

```typescript
// 简单深拷贝（有限制）
const original = { a: 1, b: { c: 2 } };
const copy = JSON.parse(JSON.stringify(original));

// 限制：
// - 不能拷贝函数
// - 不能拷贝 undefined
// - 不能拷贝循环引用
// - Date 变为字符串
// - Map/Set 变为空对象

// 更好的方案
const betterCopy = structuredClone(original);
```

## 类型安全的 JSON

### TypeScript 类型

```typescript
// 定义数据类型
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

// 类型安全的解析
function parseUser(json: string): User {
  const data = JSON.parse(json);

  // 验证必需字段
  if (typeof data.id !== 'number') {
    throw new Error('Invalid id');
  }
  if (typeof data.name !== 'string') {
    throw new Error('Invalid name');
  }

  return data as User;
}

// 使用类型守卫
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data
  );
}

const parsed = JSON.parse(jsonString);
if (isUser(parsed)) {
  console.log(parsed.name); // 类型安全
}
```

### Zod 验证

```typescript
import { z } from 'zod';

// 定义 Schema
const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().optional(),
  role: z.enum(['admin', 'user']).default('user')
});

type User = z.infer<typeof UserSchema>;

// 安全解析
function parseUserSafe(json: string): User {
  const data = JSON.parse(json);
  return UserSchema.parse(data);
}

// 或使用 safeParse
const result = UserSchema.safeParse(JSON.parse(json));
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## JSON Schema

### 定义 Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/user.schema.json",
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "minimum": 1
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "uniqueItems": true
    }
  },
  "required": ["id", "name", "email"],
  "additionalProperties": false
}
```

### 使用 Ajv 验证

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    age: { type: 'number', minimum: 0 }
  },
  required: ['name', 'email']
};

const validate = ajv.compile(schema);

const data = { name: 'John', email: 'john@example.com', age: 30 };

if (validate(data)) {
  console.log('Valid!');
} else {
  console.log('Errors:', validate.errors);
}
```

## 大型 JSON 处理

### 流式解析

```typescript
// 对于非常大的 JSON 文件
import { createReadStream } from 'fs';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

async function processLargeJson(filePath: string) {
  const pipeline = createReadStream(filePath)
    .pipe(parser())
    .pipe(streamArray());

  for await (const { value } of pipeline) {
    // 逐个处理数组元素
    console.log(value);
  }
}
```

### 性能优化

```typescript
// 避免重复解析
const cache = new Map<string, unknown>();

function parseWithCache(json: string): unknown {
  if (cache.has(json)) {
    return cache.get(json);
  }

  const result = JSON.parse(json);
  cache.set(json, result);
  return result;
}

// 延迟解析
class LazyJson<T> {
  private json: string;
  private parsed: T | null = null;

  constructor(json: string) {
    this.json = json;
  }

  get value(): T {
    if (this.parsed === null) {
      this.parsed = JSON.parse(this.json);
    }
    return this.parsed;
  }
}

// 选择性解析
function extractField(json: string, field: string): string | null {
  // 对于简单场景，使用正则可能更快
  const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`)
  const match = json.match(regex);
  return match ? match[1] : null;
}
```

## JSON 与 API

### 请求和响应

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function postJson<T, R>(url: string, data: T): Promise<R> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });

  return response.json();
}
```

### 错误处理

```typescript
function safeJsonParse<T>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// 使用
const config = safeJsonParse(
  localStorage.getItem('config') || '',
  { theme: 'light', fontSize: 14 }
);
```

## 最佳实践总结

```
JSON 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   安全性                                            │
│   ├── 始终验证输入数据                             │
│   ├── 使用 Schema 验证                             │
│   ├── 处理解析错误                                 │
│   └── 避免存储敏感信息                             │
│                                                     │
│   性能                                              │
│   ├── 大文件使用流式解析                           │
│   ├── 缓存解析结果                                 │
│   ├── 避免重复序列化                               │
│   └── 考虑压缩传输                                 │
│                                                     │
│   可维护性                                          │
│   ├── 定义清晰的类型                               │
│   ├── 使用 Schema 文档化                           │
│   ├── 版本化 API 响应                              │
│   └── 提供清晰的错误信息                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 方法 | 用途 |
|------|------|
| JSON.parse() | 解析 JSON 字符串 |
| JSON.stringify() | 序列化为 JSON |
| structuredClone() | 深拷贝 |
| Zod/Ajv | Schema 验证 |

---

*JSON 简单却强大，掌握它是前端开发的基础。*
