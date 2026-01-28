---
title: 'TypeScript 工具类型完全指南：从内置到自定义'
description: '掌握 Partial、Pick、Record 等内置工具类型及自定义高级类型'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'ts-utility-types'
---

TypeScript 工具类型让类型操作变得简单优雅。本文探讨内置工具类型和自定义类型技巧。

## 基础工具类型

### Partial 和 Required

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

// Partial: 所有属性变为可选
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number; }

// Required: 所有属性变为必需
type RequiredUser = Required<User>;
// { id: number; name: string; email: string; age: number; }

// 实际应用：更新操作
function updateUser(id: number, updates: Partial<User>) {
  // 只传需要更新的字段
}

updateUser(1, { name: '新名字' });
```

### Readonly 和 Mutable

```typescript
interface Config {
  apiUrl: string;
  timeout: number;
}

// Readonly: 所有属性只读
type ReadonlyConfig = Readonly<Config>;
// { readonly apiUrl: string; readonly timeout: number; }

const config: ReadonlyConfig = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

// config.apiUrl = 'xxx'; // 错误：无法分配到只读属性

// 自定义 Mutable：移除 readonly
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

type MutableConfig = Mutable<ReadonlyConfig>;
```

### Pick 和 Omit

```typescript
interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pick: 选择部分属性
type ArticlePreview = Pick<Article, 'id' | 'title' | 'author'>;
// { id: number; title: string; author: string; }

// Omit: 排除部分属性
type ArticleWithoutDates = Omit<Article, 'createdAt' | 'updatedAt'>;
// { id: number; title: string; content: string; author: string; }

// 实际应用：创建时不需要 id
type CreateArticle = Omit<Article, 'id' | 'createdAt' | 'updatedAt'>;
```

### Record

```typescript
// Record: 创建对象类型
type Status = 'pending' | 'approved' | 'rejected';

type StatusMessages = Record<Status, string>;
// { pending: string; approved: string; rejected: string; }

const messages: StatusMessages = {
  pending: '等待审核',
  approved: '已通过',
  rejected: '已拒绝'
};

// 对象字典
type UserMap = Record<string, User>;

const users: UserMap = {
  'user-1': { id: 1, name: 'Alice', email: 'alice@example.com' },
  'user-2': { id: 2, name: 'Bob', email: 'bob@example.com' }
};
```

## 条件与映射

### Exclude 和 Extract

```typescript
type AllTypes = string | number | boolean | null | undefined;

// Exclude: 从联合类型中排除
type NonNullable1 = Exclude<AllTypes, null | undefined>;
// string | number | boolean

// Extract: 从联合类型中提取
type Primitives = Extract<AllTypes, string | number>;
// string | number

// 实际应用
type EventType = 'click' | 'scroll' | 'mousemove' | 'keydown' | 'keyup';
type MouseEvents = Extract<EventType, 'click' | 'scroll' | 'mousemove'>;
type KeyboardEvents = Exclude<EventType, MouseEvents>;
```

### NonNullable

```typescript
type MaybeString = string | null | undefined;

// NonNullable: 排除 null 和 undefined
type DefiniteString = NonNullable<MaybeString>;
// string

// 实际应用
function getValue<T>(value: T): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error('Value is null or undefined');
  }
  return value as NonNullable<T>;
}
```

### 映射类型

```typescript
interface Person {
  name: string;
  age: number;
  email: string;
}

// 自定义映射类型
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

type NullablePerson = Nullable<Person>;
// { name: string | null; age: number | null; email: string | null; }

// 添加前缀
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number; getEmail: () => string; }
```

## 函数类型工具

### Parameters 和 ReturnType

```typescript
function createUser(name: string, age: number): User {
  return { id: Date.now(), name, email: '', age };
}

// Parameters: 获取函数参数类型
type CreateUserParams = Parameters<typeof createUser>;
// [string, number]

// ReturnType: 获取返回值类型
type CreateUserReturn = ReturnType<typeof createUser>;
// User

// 实际应用：包装函数
function wrapWithLogging<T extends (...args: any[]) => any>(fn: T) {
  return (...args: Parameters<T>): ReturnType<T> => {
    console.log('Calling with:', args);
    const result = fn(...args);
    console.log('Result:', result);
    return result;
  };
}
```

### ConstructorParameters 和 InstanceType

```typescript
class ApiClient {
  constructor(
    private baseUrl: string,
    private timeout: number
  ) {}

  async fetch(endpoint: string) {
    // ...
  }
}

// ConstructorParameters: 获取构造函数参数
type ApiClientParams = ConstructorParameters<typeof ApiClient>;
// [string, number]

// InstanceType: 获取实例类型
type ApiClientInstance = InstanceType<typeof ApiClient>;
// ApiClient

// 工厂函数
function createInstance<T extends new (...args: any[]) => any>(
  Class: T,
  ...args: ConstructorParameters<T>
): InstanceType<T> {
  return new Class(...args);
}

const client = createInstance(ApiClient, 'https://api.example.com', 5000);
```

### ThisParameterType 和 OmitThisParameter

```typescript
function greet(this: { name: string }, greeting: string) {
  return `${greeting}, ${this.name}!`;
}

// ThisParameterType: 获取 this 参数类型
type GreetThis = ThisParameterType<typeof greet>;
// { name: string }

// OmitThisParameter: 移除 this 参数
type GreetWithoutThis = OmitThisParameter<typeof greet>;
// (greeting: string) => string

// 绑定 this
const boundGreet: GreetWithoutThis = greet.bind({ name: 'World' });
```

## 字符串操作类型

### 内置字符串类型

```typescript
type EventName = 'click' | 'focus' | 'blur';

// Uppercase: 转大写
type UpperEvent = Uppercase<EventName>;
// 'CLICK' | 'FOCUS' | 'BLUR'

// Lowercase: 转小写
type LowerEvent = Lowercase<'CLICK' | 'FOCUS'>;
// 'click' | 'focus'

// Capitalize: 首字母大写
type CapEvent = Capitalize<EventName>;
// 'Click' | 'Focus' | 'Blur'

// Uncapitalize: 首字母小写
type UncapEvent = Uncapitalize<'Click' | 'Focus'>;
// 'click' | 'focus'
```

### 模板字面量类型

```typescript
type Color = 'red' | 'green' | 'blue';
type Size = 'small' | 'medium' | 'large';

// 组合生成类型
type ColorSize = `${Color}-${Size}`;
// 'red-small' | 'red-medium' | 'red-large' | 'green-small' | ...

// 事件处理器类型
type EventHandlers<T extends string> = {
  [K in T as `on${Capitalize<K>}`]: (event: Event) => void;
};

type ClickHandlers = EventHandlers<'click' | 'focus' | 'blur'>;
// { onClick: (event: Event) => void; onFocus: ...; onBlur: ... }
```

## 自定义工具类型

### 深度 Partial

```typescript
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

interface NestedConfig {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert: string;
    };
  };
}

type PartialConfig = DeepPartial<NestedConfig>;
// 所有嵌套属性都变为可选
```

### 深度 Readonly

```typescript
type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

const config: DeepReadonly<NestedConfig> = {
  server: {
    host: 'localhost',
    port: 3000,
    ssl: {
      enabled: true,
      cert: 'cert.pem'
    }
  }
};

// config.server.ssl.enabled = false; // 错误
```

### 路径类型

```typescript
type PathKeys<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? PathKeys<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

interface Settings {
  theme: {
    primary: string;
    secondary: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
  };
}

type SettingsPath = PathKeys<Settings>;
// 'theme' | 'theme.primary' | 'theme.secondary' | 'notifications' | ...
```

### 函数重载工具

```typescript
// 获取最后一个重载
type LastOverload<T> = T extends {
  (...args: infer A1): infer R1;
  (...args: infer A2): infer R2;
}
  ? (...args: A2) => R2
  : T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : never;

// 合并接口
type Merge<T, U> = Omit<T, keyof U> & U;

interface Base {
  id: number;
  name: string;
}

interface Extended {
  name: string; // 覆盖
  email: string; // 新增
}

type Merged = Merge<Base, Extended>;
// { id: number; name: string; email: string; }
```

## 条件类型进阶

### infer 关键字

```typescript
// 提取数组元素类型
type ArrayElement<T> = T extends (infer E)[] ? E : never;

type Numbers = ArrayElement<number[]>; // number
type Strings = ArrayElement<string[]>; // string

// 提取 Promise 值类型
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type ResolvedType = Awaited<Promise<Promise<string>>>; // string

// 提取函数第一个参数
type FirstArg<T> = T extends (first: infer F, ...args: any[]) => any
  ? F
  : never;

type First = FirstArg<(a: string, b: number) => void>; // string
```

### 分布式条件类型

```typescript
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<string | number>;
// string[] | number[] (分布式)

// 禁用分布式
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type Result2 = ToArrayNonDist<string | number>;
// (string | number)[]
```

## 最佳实践总结

```
工具类型最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   类型命名                                          │
│   ├── 使用描述性名称                               │
│   ├── 保持一致的命名约定                           │
│   └── 添加类型注释说明用途                         │
│                                                     │
│   类型设计                                          │
│   ├── 优先使用内置工具类型                         │
│   ├── 组合而非重复定义                             │
│   ├── 保持类型简洁可读                             │
│   └── 避免过度嵌套                                 │
│                                                     │
│   性能考虑                                          │
│   ├── 避免递归类型过深                             │
│   ├── 使用类型缓存                                 │
│   └── 控制联合类型大小                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 工具类型 | 用途 |
|----------|------|
| Partial | 所有属性可选 |
| Required | 所有属性必需 |
| Pick | 选择部分属性 |
| Omit | 排除部分属性 |
| Record | 创建对象类型 |
| Parameters | 获取函数参数 |
| ReturnType | 获取返回类型 |

---

*掌握工具类型，让 TypeScript 类型系统为你所用。*
