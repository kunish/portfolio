---
title: 'TypeScript 高级类型：从入门到精通'
description: '掌握泛型、条件类型、映射类型、类型推断和实用工具类型'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'typescript-advanced-types-mastery'
---

TypeScript 的类型系统是其核心优势。本文深入探讨高级类型技巧和实战模式。

## 泛型基础

### 泛型函数与类

```typescript
// 泛型函数
function identity<T>(value: T): T {
  return value;
}

// 泛型约束
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 泛型类
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

// 使用
const numContainer = new Container(42);
const strContainer = numContainer.map(n => n.toString());
```

### 泛型接口

```typescript
// 泛型接口
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// 实现
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

## 条件类型

### 基础条件类型

```typescript
// 条件类型基础
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false

// 分布式条件类型
type NonNullable<T> = T extends null | undefined ? never : T;

type C = NonNullable<string | null | undefined>;  // string

// 提取和排除
type Extract<T, U> = T extends U ? T : never;
type Exclude<T, U> = T extends U ? never : T;

type D = Extract<'a' | 'b' | 'c', 'a' | 'b'>;  // 'a' | 'b'
type E = Exclude<'a' | 'b' | 'c', 'a'>;        // 'b' | 'c'
```

### 类型推断 (infer)

```typescript
// 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function createUser() {
  return { id: '1', name: 'John' };
}

type User = ReturnType<typeof createUser>;  // { id: string; name: string }

// 提取函数参数类型
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

type Params = Parameters<(a: string, b: number) => void>;  // [string, number]

// 提取 Promise 值类型
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type F = Awaited<Promise<Promise<string>>>;  // string

// 提取数组元素类型
type ElementType<T> = T extends (infer U)[] ? U : never;

type G = ElementType<string[]>;  // string

// 提取对象属性类型
type PropertyType<T, K extends keyof T> = T[K];

interface Person {
  name: string;
  age: number;
}

type NameType = PropertyType<Person, 'name'>;  // string
```

## 映射类型

### 内置映射类型

```typescript
// Partial: 所有属性可选
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Required: 所有属性必填
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Readonly: 所有属性只读
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Record: 键值对映射
type Record<K extends keyof any, T> = {
  [P in K]: T;
};

// Pick: 选取部分属性
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit: 排除部分属性
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

### 自定义映射类型

```typescript
// 深度 Partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 深度 Readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 可空类型
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

// 属性重映射
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }

// 过滤属性
type FilterByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

type StringProps = FilterByType<Person, string>;  // { name: string }
```

## 模板字面量类型

```typescript
// 基础模板字面量
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = EventName<'click'>;  // 'onClick'

// 组合类型
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type ApiPath = '/users' | '/posts';

type ApiEndpoint = `${HttpMethod} ${ApiPath}`;
// 'GET /users' | 'GET /posts' | 'POST /users' | ...

// CSS 单位
type CSSValue = `${number}${'px' | 'rem' | 'em' | '%'}`;

const width: CSSValue = '100px';  // OK
const height: CSSValue = '50rem'; // OK

// 类型安全的事件处理
type EventHandler<T extends string> = {
  [K in T as `on${Capitalize<K>}`]: (event: Event) => void;
};

type ButtonEvents = EventHandler<'click' | 'hover' | 'focus'>;
// { onClick: ...; onHover: ...; onFocus: ... }
```

## 实用类型模式

### 类型守卫

```typescript
// 类型谓词
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

// 使用
function processValue(value: unknown) {
  if (isString(value)) {
    console.log(value.toUpperCase()); // value 是 string
  }

  if (isUser(value)) {
    console.log(value.name); // value 是 User
  }
}

// 断言函数
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Value is not a string');
  }
}

function processInput(input: unknown) {
  assertIsString(input);
  console.log(input.toUpperCase()); // input 是 string
}
```

### 品牌类型

```typescript
// 品牌类型防止类型混淆
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
getUser(postId);  // Error: 类型不匹配

// 创建品牌类型的工厂函数
function createUserId(id: string): UserId {
  return id as UserId;
}

function createPostId(id: string): PostId {
  return id as PostId;
}
```

### 判别联合类型

```typescript
// 判别联合
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
  console.log(result.data.name); // 类型安全访问
} else {
  console.error(result.error.message);
}

// 状态机类型
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

## 类型体操实战

### 实现内置类型

```typescript
// 实现 Readonly
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

// 实现 Pick
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// 实现 Exclude
type MyExclude<T, U> = T extends U ? never : T;

// 实现 ReturnType
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never;

// 实现 Awaited
type MyAwaited<T> =
  T extends Promise<infer U>
    ? U extends Promise<any>
      ? MyAwaited<U>
      : U
    : T;

// 实现 TupleToUnion
type TupleToUnion<T extends readonly any[]> = T[number];

type H = TupleToUnion<['a', 'b', 'c']>;  // 'a' | 'b' | 'c'

// 实现 First
type First<T extends any[]> = T extends [infer F, ...any] ? F : never;

type I = First<[1, 2, 3]>;  // 1

// 实现 Last
type Last<T extends any[]> = T extends [...any, infer L] ? L : never;

type J = Last<[1, 2, 3]>;  // 3
```

### 字符串操作类型

```typescript
// 字符串转大写
type Uppercase<S extends string> = intrinsic;

// 字符串转小写
type Lowercase<S extends string> = intrinsic;

// 首字母大写
type Capitalize<S extends string> = intrinsic;

// 首字母小写
type Uncapitalize<S extends string> = intrinsic;

// 自定义：驼峰转短横线
type CamelToKebab<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? Rest extends Uncapitalize<Rest>
      ? `${Lowercase<First>}${CamelToKebab<Rest>}`
      : `${Lowercase<First>}-${CamelToKebab<Rest>}`
    : S;

type K = CamelToKebab<'backgroundColor'>;  // 'background-color'
```

## 最佳实践总结

```
TypeScript 类型最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   类型设计                                          │
│   ├── 优先使用类型推断                              │
│   ├── 避免使用 any                                  │
│   ├── 使用 unknown 代替 any                        │
│   └── 精确定义类型边界                              │
│                                                     │
│   泛型使用                                          │
│   ├── 合理使用泛型约束                              │
│   ├── 避免过度泛化                                  │
│   ├── 利用类型推断减少泛型参数                      │
│   └── 使用默认泛型参数                              │
│                                                     │
│   类型组织                                          │
│   ├── 提取通用类型到工具类型                        │
│   ├── 使用 namespace 组织相关类型                  │
│   ├── 导出复用的类型定义                            │
│   └── 类型文件与实现分离                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐做法 |
|------|----------|
| API 响应 | 泛型 + 判别联合 |
| 配置对象 | Partial + DeepPartial |
| 事件系统 | 模板字面量 + 映射类型 |
| 状态管理 | 判别联合 + 类型守卫 |
| ID 类型 | 品牌类型 |

TypeScript 的类型系统是一门语言中的语言。掌握高级类型，让代码更安全、更具表达力。

---

*类型是最好的文档，让编译器成为你最忠实的代码审查者。*
