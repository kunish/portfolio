---
title: 'JSON Complete Guide: Data Format and Advanced Processing'
description: 'Master JSON syntax, parsing methods, Schema validation and performance optimization'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'json-guide'
---

JSON is the most widely used data exchange format in modern web development. This article explores advanced JSON usage.

## JSON Basics

### Syntax Rules

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

### Data Types

```
JSON Data Types:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Primitive Types                                   │
│   ├── String   "hello"                             │
│   ├── Number   42, 3.14, -1, 1e10                  │
│   ├── Boolean  true, false                         │
│   └── Null     null                                │
│                                                     │
│   Complex Types                                     │
│   ├── Object   {"key": "value"}                    │
│   └── Array    [1, 2, 3]                           │
│                                                     │
│   Not Supported                                     │
│   ├── undefined                                    │
│   ├── Function                                     │
│   ├── Symbol                                       │
│   ├── Date (must convert to string)               │
│   └── Comments                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Syntax Key Points

```javascript
// Correct JSON
{
  "name": "John",      // Keys must use double quotes
  "age": 30            // No trailing comma on last item
}

// Invalid examples
{
  name: "John",        // Error: unquoted key
  'age': 30,           // Error: single quotes
  "city": "NYC",       // Error: trailing comma
}
```

## JSON in JavaScript

### Parsing and Serialization

```typescript
// JSON.parse - string to object
const jsonString = '{"name":"John","age":30}';
const obj = JSON.parse(jsonString);
console.log(obj.name); // "John"

// JSON.stringify - object to string
const data = { name: 'John', age: 30 };
const str = JSON.stringify(data);
console.log(str); // '{"name":"John","age":30}'

// Formatted output
const formatted = JSON.stringify(data, null, 2);
console.log(formatted);
// {
//   "name": "John",
//   "age": 30
// }
```

### Advanced Options

```typescript
// replacer function - custom serialization
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

// replacer array - select fields
const partial = JSON.stringify(user, ['name', 'age']);
// '{"name":"John","age":30}'

// reviver function - custom parsing
const dateStr = '{"created":"2025-01-28T00:00:00.000Z"}';
const withDate = JSON.parse(dateStr, (key, value) => {
  if (key === 'created') return new Date(value);
  return value;
});
console.log(withDate.created instanceof Date); // true
```

### Deep Copy

```typescript
// Simple deep copy (with limitations)
const original = { a: 1, b: { c: 2 } };
const copy = JSON.parse(JSON.stringify(original));

// Limitations:
// - Cannot copy functions
// - Cannot copy undefined
// - Cannot copy circular references
// - Date becomes string
// - Map/Set become empty objects

// Better solution
const betterCopy = structuredClone(original);
```

## Type-Safe JSON

### TypeScript Types

```typescript
// Define data type
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

// Type-safe parsing
function parseUser(json: string): User {
  const data = JSON.parse(json);

  // Validate required fields
  if (typeof data.id !== 'number') {
    throw new Error('Invalid id');
  }
  if (typeof data.name !== 'string') {
    throw new Error('Invalid name');
  }

  return data as User;
}

// Using type guards
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
  console.log(parsed.name); // Type safe
}
```

### Zod Validation

```typescript
import { z } from 'zod';

// Define Schema
const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().optional(),
  role: z.enum(['admin', 'user']).default('user')
});

type User = z.infer<typeof UserSchema>;

// Safe parsing
function parseUserSafe(json: string): User {
  const data = JSON.parse(json);
  return UserSchema.parse(data);
}

// Or use safeParse
const result = UserSchema.safeParse(JSON.parse(json));
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## JSON Schema

### Defining Schema

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

### Validation with Ajv

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

## Large JSON Processing

### Streaming Parsing

```typescript
// For very large JSON files
import { createReadStream } from 'fs';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

async function processLargeJson(filePath: string) {
  const pipeline = createReadStream(filePath)
    .pipe(parser())
    .pipe(streamArray());

  for await (const { value } of pipeline) {
    // Process array elements one by one
    console.log(value);
  }
}
```

### Performance Optimization

```typescript
// Avoid repeated parsing
const cache = new Map<string, unknown>();

function parseWithCache(json: string): unknown {
  if (cache.has(json)) {
    return cache.get(json);
  }

  const result = JSON.parse(json);
  cache.set(json, result);
  return result;
}

// Lazy parsing
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

// Selective parsing
function extractField(json: string, field: string): string | null {
  // For simple cases, regex might be faster
  const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`)
  const match = json.match(regex);
  return match ? match[1] : null;
}
```

## JSON and APIs

### Request and Response

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

### Error Handling

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

// Usage
const config = safeJsonParse(
  localStorage.getItem('config') || '',
  { theme: 'light', fontSize: 14 }
);
```

## Best Practices Summary

```
JSON Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Security                                          │
│   ├── Always validate input data                   │
│   ├── Use Schema validation                        │
│   ├── Handle parse errors                          │
│   └── Avoid storing sensitive info                 │
│                                                     │
│   Performance                                       │
│   ├── Stream parse large files                     │
│   ├── Cache parsed results                         │
│   ├── Avoid repeated serialization                 │
│   └── Consider compressed transfer                 │
│                                                     │
│   Maintainability                                   │
│   ├── Define clear types                           │
│   ├── Document with Schema                         │
│   ├── Version API responses                        │
│   └── Provide clear error messages                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Method | Purpose |
|--------|---------|
| JSON.parse() | Parse JSON string |
| JSON.stringify() | Serialize to JSON |
| structuredClone() | Deep copy |
| Zod/Ajv | Schema validation |

---

*JSON is simple yet powerful - mastering it is fundamental to frontend development.*
