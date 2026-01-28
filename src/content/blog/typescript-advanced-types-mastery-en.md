---
title: 'TypeScript Advanced Types: From Beginner to Expert'
description: 'Master generics, conditional types, mapped types, type inference and utility types'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'typescript-advanced-types-mastery'
---

TypeScript's type system is its core advantage. This article explores advanced type techniques and practical patterns.

## Generics Basics

### Generic Functions and Classes

```typescript
// Generic function
function identity<T>(value: T): T {
  return value;
}

// Generic constraints
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Generic class
class Container<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  getValue(): T {
    return this.value;
  }

  map<U>(fn: (value: T) => U): Container<U> {
    return new Container(fn(this.value));
  }
}

// Usage
const numContainer = new Container(42);
const strContainer = numContainer.map(n => n.toString());
```

### Generic Interfaces

```typescript
// Generic interface
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Implementation
interface User {
  id: string;
  name: string;
  email: string;
}

class UserRepository implements Repository<User> {
  async findById(id: string): Promise<User | null> {
    return db.users.findUnique({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return db.users.findMany();
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    return db.users.create({ data });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return db.users.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await db.users.delete({ where: { id } });
  }
}
```

## Conditional Types

### Basic Conditional Types

```typescript
// Basic conditional type
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false

// Distributive conditional types
type NonNullable<T> = T extends null | undefined ? never : T;

type C = NonNullable<string | null | undefined>;  // string

// Extract and Exclude
type Extract<T, U> = T extends U ? T : never;
type Exclude<T, U> = T extends U ? never : T;

type D = Extract<'a' | 'b' | 'c', 'a' | 'b'>;  // 'a' | 'b'
type E = Exclude<'a' | 'b' | 'c', 'a'>;        // 'b' | 'c'
```

### Type Inference (infer)

```typescript
// Extract function return type
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function createUser() {
  return { id: '1', name: 'John' };
}

type User = ReturnType<typeof createUser>;  // { id: string; name: string }

// Extract function parameter types
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

type Params = Parameters<(a: string, b: number) => void>;  // [string, number]

// Extract Promise value type
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type F = Awaited<Promise<Promise<string>>>;  // string

// Extract array element type
type ElementType<T> = T extends (infer U)[] ? U : never;

type G = ElementType<string[]>;  // string

// Extract object property type
type PropertyType<T, K extends keyof T> = T[K];

interface Person {
  name: string;
  age: number;
}

type NameType = PropertyType<Person, 'name'>;  // string
```

## Mapped Types

### Built-in Mapped Types

```typescript
// Partial: all properties optional
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Required: all properties required
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Readonly: all properties readonly
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Record: key-value mapping
type Record<K extends keyof any, T> = {
  [P in K]: T;
};

// Pick: select specific properties
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit: exclude specific properties
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

### Custom Mapped Types

```typescript
// Deep Partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Deep Readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Nullable type
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

// Key remapping
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }

// Filter properties
type FilterByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

type StringProps = FilterByType<Person, string>;  // { name: string }
```

## Template Literal Types

```typescript
// Basic template literal
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = EventName<'click'>;  // 'onClick'

// Combining types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type ApiPath = '/users' | '/posts';

type ApiEndpoint = `${HttpMethod} ${ApiPath}`;
// 'GET /users' | 'GET /posts' | 'POST /users' | ...

// CSS units
type CSSValue = `${number}${'px' | 'rem' | 'em' | '%'}`;

const width: CSSValue = '100px';  // OK
const height: CSSValue = '50rem'; // OK

// Type-safe event handlers
type EventHandler<T extends string> = {
  [K in T as `on${Capitalize<K>}`]: (event: Event) => void;
};

type ButtonEvents = EventHandler<'click' | 'hover' | 'focus'>;
// { onClick: ...; onHover: ...; onFocus: ... }
```

## Practical Type Patterns

### Type Guards

```typescript
// Type predicates
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

// Usage
function processValue(value: unknown) {
  if (isString(value)) {
    console.log(value.toUpperCase()); // value is string
  }

  if (isUser(value)) {
    console.log(value.name); // value is User
  }
}

// Assertion functions
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Value is not a string');
  }
}

function processInput(input: unknown) {
  assertIsString(input);
  console.log(input.toUpperCase()); // input is string
}
```

### Branded Types

```typescript
// Branded types prevent type confusion
type Brand<T, B> = T & { __brand: B };

type UserId = Brand<string, 'UserId'>;
type PostId = Brand<string, 'PostId'>;

function getUser(id: UserId): User {
  // ...
}

function getPost(id: PostId): Post {
  // ...
}

const userId = 'user-123' as UserId;
const postId = 'post-456' as PostId;

getUser(userId);  // OK
getUser(postId);  // Error: type mismatch

// Factory functions for branded types
function createUserId(id: string): UserId {
  return id as UserId;
}

function createPostId(id: string): PostId {
  return id as PostId;
}
```

### Discriminated Unions

```typescript
// Discriminated union
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function parseJSON<T>(json: string): Result<T> {
  try {
    return { success: true, data: JSON.parse(json) };
  } catch (e) {
    return { success: false, error: e as Error };
  }
}

const result = parseJSON<{ name: string }>('{"name": "John"}');

if (result.success) {
  console.log(result.data.name); // Type-safe access
} else {
  console.error(result.error.message);
}

// State machine types
type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function renderState<T>(state: LoadingState<T>) {
  switch (state.status) {
    case 'idle':
      return 'Ready to load';
    case 'loading':
      return 'Loading...';
    case 'success':
      return `Data: ${JSON.stringify(state.data)}`;
    case 'error':
      return `Error: ${state.error.message}`;
  }
}
```

## Type Gymnastics in Practice

### Implementing Built-in Types

```typescript
// Implement Readonly
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

// Implement Pick
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Implement Exclude
type MyExclude<T, U> = T extends U ? never : T;

// Implement ReturnType
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never;

// Implement Awaited
type MyAwaited<T> =
  T extends Promise<infer U>
    ? U extends Promise<any>
      ? MyAwaited<U>
      : U
    : T;

// Implement TupleToUnion
type TupleToUnion<T extends readonly any[]> = T[number];

type H = TupleToUnion<['a', 'b', 'c']>;  // 'a' | 'b' | 'c'

// Implement First
type First<T extends any[]> = T extends [infer F, ...any] ? F : never;

type I = First<[1, 2, 3]>;  // 1

// Implement Last
type Last<T extends any[]> = T extends [...any, infer L] ? L : never;

type J = Last<[1, 2, 3]>;  // 3
```

### String Manipulation Types

```typescript
// Uppercase string
type Uppercase<S extends string> = intrinsic;

// Lowercase string
type Lowercase<S extends string> = intrinsic;

// Capitalize first letter
type Capitalize<S extends string> = intrinsic;

// Uncapitalize first letter
type Uncapitalize<S extends string> = intrinsic;

// Custom: camelCase to kebab-case
type CamelToKebab<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? Rest extends Uncapitalize<Rest>
      ? `${Lowercase<First>}${CamelToKebab<Rest>}`
      : `${Lowercase<First>}-${CamelToKebab<Rest>}`
    : S;

type K = CamelToKebab<'backgroundColor'>;  // 'background-color'
```

## Best Practices Summary

```
TypeScript Type Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Type Design                                       │
│   ├── Prefer type inference                        │
│   ├── Avoid using any                              │
│   ├── Use unknown instead of any                  │
│   └── Define precise type boundaries              │
│                                                     │
│   Generics Usage                                    │
│   ├── Use appropriate constraints                 │
│   ├── Avoid over-generalization                   │
│   ├── Leverage inference to reduce params         │
│   └── Use default generic parameters              │
│                                                     │
│   Type Organization                                 │
│   ├── Extract common utility types                │
│   ├── Use namespaces for related types           │
│   ├── Export reusable type definitions           │
│   └── Separate type files from implementation    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach |
|----------|---------------------|
| API Responses | Generics + Discriminated Unions |
| Config Objects | Partial + DeepPartial |
| Event Systems | Template Literals + Mapped Types |
| State Management | Discriminated Unions + Type Guards |
| ID Types | Branded Types |

TypeScript's type system is a language within a language. Master advanced types to make your code safer and more expressive.

---

*Types are the best documentation. Let the compiler be your most faithful code reviewer.*
