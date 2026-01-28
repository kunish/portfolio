---
title: 'TypeScript 高级类型：从入门到精通'
description: '掌握 TypeScript 高级类型技巧，让类型系统成为你的开发利器'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'typescript-advanced-types'
---

TypeScript 的类型系统远比 `string`、`number`、`boolean` 强大得多。掌握高级类型技巧，你可以构建出既类型安全又灵活优雅的代码。本文将带你深入 TypeScript 类型系统的精髓。

## 类型推断的艺术

### as const 断言

```typescript
// 普通声明：类型被放宽
const config = {
  endpoint: '/api/users',
  method: 'GET'
};
// 类型: { endpoint: string; method: string }

// as const：类型被收窄为字面量
const config = {
  endpoint: '/api/users',
  method: 'GET'
} as const;
// 类型: { readonly endpoint: "/api/users"; readonly method: "GET" }
```

`as const` 在定义常量配置、枚举替代方案时非常有用：

```typescript
const HttpMethods = ['GET', 'POST', 'PUT', 'DELETE'] as const;
type HttpMethod = typeof HttpMethods[number];
// 类型: "GET" | "POST" | "PUT" | "DELETE"
```

### satisfies 操作符

TypeScript 4.9 引入的 `satisfies` 让你同时获得类型检查和精确推断：

```typescript
type Colors = Record<string, string | number[]>;

// 使用类型注解：丢失具体信息
const colors: Colors = {
  red: '#ff0000',
  green: [0, 255, 0]
};
colors.red.toUpperCase(); // ❌ 错误：可能是 number[]

// 使用 satisfies：保留具体类型
const colors = {
  red: '#ff0000',
  green: [0, 255, 0]
} satisfies Colors;
colors.red.toUpperCase();   // ✅ 正确：知道是 string
colors.green.map(n => n);   // ✅ 正确：知道是 number[]
```

## 条件类型

条件类型是 TypeScript 类型编程的核心：

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>;  // true
type B = IsString<42>;       // false
```

### infer 关键字

`infer` 让你在条件类型中提取类型：

```typescript
// 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn = () => Promise<string>;
type Result = ReturnType<Fn>;  // Promise<string>

// 提取 Promise 内部类型
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type A = Awaited<Promise<Promise<string>>>;  // string

// 提取数组元素类型
type ElementType<T> = T extends (infer E)[] ? E : never;

type E = ElementType<string[]>;  // string
```

### 实用条件类型

```typescript
// 提取对象中值为函数的键
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T];

interface User {
  name: string;
  age: number;
  greet(): void;
  update(data: Partial<User>): void;
}

type UserMethods = FunctionKeys<User>;  // "greet" | "update"
```

## 映射类型

映射类型让你基于现有类型创建新类型：

```typescript
// 基础映射
type Readonly<T> = {
  readonly [K in keyof T]: T[K]
};

type Partial<T> = {
  [K in keyof T]?: T[K]
};

type Required<T> = {
  [K in keyof T]-?: T[K]  // -? 移除可选标记
};
```

### 键重映射（Key Remapping）

TypeScript 4.1 引入了 `as` 子句进行键重映射：

```typescript
// 给所有键添加前缀
type Prefixed<T, P extends string> = {
  [K in keyof T as `${P}${Capitalize<string & K>}`]: T[K]
};

interface User {
  name: string;
  age: number;
}

type PrefixedUser = Prefixed<User, 'user'>;
// { userName: string; userAge: number }

// 过滤特定类型的键
type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
};

type StringProps = OnlyStrings<User>;
// { name: string }
```

### Getter/Setter 生成器

```typescript
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
};

type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }

type PersonSetters = Setters<Person>;
// { setName: (value: string) => void; setAge: (value: number) => void }
```

## 模板字面量类型

TypeScript 4.1 带来了强大的模板字面量类型：

```typescript
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = EventName<'click'>;  // "onClick"
type FocusEvent = EventName<'focus'>;  // "onFocus"

// 组合多个字面量
type Vertical = 'top' | 'bottom';
type Horizontal = 'left' | 'right';
type Position = `${Vertical}-${Horizontal}`;
// "top-left" | "top-right" | "bottom-left" | "bottom-right"
```

### 内置字符串操作类型

```typescript
type Upper = Uppercase<'hello'>;      // "HELLO"
type Lower = Lowercase<'HELLO'>;      // "hello"
type Cap = Capitalize<'hello'>;       // "Hello"
type Uncap = Uncapitalize<'Hello'>;   // "hello"
```

### 实战：类型安全的事件系统

```typescript
type EventMap = {
  click: { x: number; y: number };
  focus: { target: HTMLElement };
  submit: { data: FormData };
};

type EventHandler<T extends keyof EventMap> = (event: EventMap[T]) => void;

type EventHandlers = {
  [K in keyof EventMap as `on${Capitalize<K>}`]: EventHandler<K>
};

// 结果:
// {
//   onClick: (event: { x: number; y: number }) => void;
//   onFocus: (event: { target: HTMLElement }) => void;
//   onSubmit: (event: { data: FormData }) => void;
// }
```

## 递归类型

TypeScript 支持递归类型定义：

```typescript
// 深度只读
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K]
};

// 深度可选
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? DeepPartial<T[K]>
    : T[K]
};

// 展平嵌套对象路径
type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? `${K}` | `${K}.${Paths<T[K], Prev[D]>}`
          : never
      }[keyof T]
    : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface Config {
  server: {
    host: string;
    port: number;
  };
  database: {
    connection: {
      url: string;
    };
  };
}

type ConfigPaths = Paths<Config>;
// "server" | "server.host" | "server.port" | "database" | "database.connection" | "database.connection.url"
```

## 类型体操实战

### 1. 元组操作

```typescript
// 获取元组第一个元素
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

// 获取元组最后一个元素
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

// 移除第一个元素
type Shift<T extends any[]> = T extends [any, ...infer R] ? R : never;

// 移除最后一个元素
type Pop<T extends any[]> = T extends [...infer R, any] ? R : never;

// 反转元组
type Reverse<T extends any[]> = T extends [infer F, ...infer R]
  ? [...Reverse<R>, F]
  : [];

type Tuple = [1, 2, 3, 4, 5];
type FirstEl = First<Tuple>;     // 1
type LastEl = Last<Tuple>;       // 5
type Shifted = Shift<Tuple>;     // [2, 3, 4, 5]
type Popped = Pop<Tuple>;        // [1, 2, 3, 4]
type Reversed = Reverse<Tuple>;  // [5, 4, 3, 2, 1]
```

### 2. 联合类型转交叉类型

```typescript
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends
  (x: infer I) => void ? I : never;

type Union = { a: string } | { b: number } | { c: boolean };
type Intersection = UnionToIntersection<Union>;
// { a: string } & { b: number } & { c: boolean }
```

### 3. 严格的对象类型

```typescript
// 精确类型，不允许额外属性
type Exact<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never;

type User = { name: string; age: number };

function createUser<T extends User>(user: Exact<T, User>): User {
  return user;
}

createUser({ name: 'Alice', age: 30 });           // ✅
createUser({ name: 'Bob', age: 25, extra: 1 });   // ❌ 类型错误
```

## 实用工具类型

### 深度必需

```typescript
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object
    ? DeepRequired<T[K]>
    : T[K]
};
```

### 可空类型处理

```typescript
type NonNullableDeep<T> = {
  [K in keyof T]: NonNullable<T[K]> extends object
    ? NonNullableDeep<NonNullable<T[K]>>
    : NonNullable<T[K]>
};
```

### 选择性 Pick 和 Omit

```typescript
// 只选择特定类型的属性
type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K]
};

// 排除特定类型的属性
type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K]
};

interface Mixed {
  name: string;
  age: number;
  active: boolean;
  email: string;
}

type StringProps = PickByType<Mixed, string>;
// { name: string; email: string }

type NonBooleanProps = OmitByType<Mixed, boolean>;
// { name: string; age: number; email: string }
```

## 类型断言函数

```typescript
// 断言函数
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Not a string');
  }
}

function processValue(value: unknown) {
  assertIsString(value);
  // 此后 value 的类型是 string
  console.log(value.toUpperCase());
}

// 类型守卫
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'age' in obj
  );
}

function greet(input: unknown) {
  if (isUser(input)) {
    // input 的类型是 User
    console.log(`Hello, ${input.name}!`);
  }
}
```

## 最佳实践

### 1. 避免过度使用 any

```typescript
// ❌ 避免
function process(data: any): any {
  return data.value;
}

// ✅ 使用泛型
function process<T extends { value: unknown }>(data: T): T['value'] {
  return data.value;
}
```

### 2. 优先使用 unknown 而非 any

```typescript
// ❌ any 允许任何操作
function dangerous(value: any) {
  value.foo.bar.baz();  // 不会报错，但运行时可能崩溃
}

// ✅ unknown 强制类型检查
function safe(value: unknown) {
  if (typeof value === 'object' && value !== null && 'foo' in value) {
    // 安全访问
  }
}
```

### 3. 利用 const 泛型

```typescript
function createConfig<const T extends Record<string, unknown>>(config: T): T {
  return config;
}

const config = createConfig({
  api: '/api',
  timeout: 5000
});
// 类型: { readonly api: "/api"; readonly timeout: 5000 }
```

## 总结

TypeScript 高级类型是一把双刃剑：

| 场景 | 建议 |
|------|------|
| 库/框架开发 | 充分利用高级类型提供最佳 DX |
| 业务代码 | 适度使用，保持可读性 |
| 类型体操 | 学习原理，实战中谨慎使用 |

**关键收获**：

1. `as const` 和 `satisfies` 提升类型精度
2. 条件类型 + `infer` 是类型编程的核心
3. 映射类型 + 键重映射实现类型转换
4. 模板字面量类型处理字符串类型
5. 递归类型处理嵌套结构

掌握这些高级类型技巧，你的 TypeScript 代码将更加类型安全、表达力更强。记住：**类型系统是你的朋友，而非敌人**。

---

*类型即文档，类型即测试，类型即安全网。让 TypeScript 的类型系统为你的代码保驾护航。*
