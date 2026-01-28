---
title: 'TypeScript Utility Types Complete Guide: From Built-in to Custom'
description: 'Master Partial, Pick, Record and other built-in utility types plus custom advanced types'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'ts-utility-types'
---

TypeScript utility types make type manipulation simple and elegant. This article explores built-in utility types and custom type techniques.

## Basic Utility Types

### Partial and Required

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

// Partial: all properties become optional
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number; }

// Required: all properties become required
type RequiredUser = Required<User>;
// { id: number; name: string; email: string; age: number; }

// Practical use: update operations
function updateUser(id: number, updates: Partial<User>) {
  // Only pass fields that need updating
}

updateUser(1, { name: 'New Name' });
```

### Readonly and Mutable

```typescript
interface Config {
  apiUrl: string;
  timeout: number;
}

// Readonly: all properties become readonly
type ReadonlyConfig = Readonly<Config>;
// { readonly apiUrl: string; readonly timeout: number; }

const config: ReadonlyConfig = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

// config.apiUrl = 'xxx'; // Error: Cannot assign to readonly property

// Custom Mutable: remove readonly
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

type MutableConfig = Mutable<ReadonlyConfig>;
```

### Pick and Omit

```typescript
interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pick: select specific properties
type ArticlePreview = Pick<Article, 'id' | 'title' | 'author'>;
// { id: number; title: string; author: string; }

// Omit: exclude specific properties
type ArticleWithoutDates = Omit<Article, 'createdAt' | 'updatedAt'>;
// { id: number; title: string; content: string; author: string; }

// Practical use: no id needed when creating
type CreateArticle = Omit<Article, 'id' | 'createdAt' | 'updatedAt'>;
```

### Record

```typescript
// Record: create object types
type Status = 'pending' | 'approved' | 'rejected';

type StatusMessages = Record<Status, string>;
// { pending: string; approved: string; rejected: string; }

const messages: StatusMessages = {
  pending: 'Awaiting review',
  approved: 'Approved',
  rejected: 'Rejected'
};

// Object dictionary
type UserMap = Record<string, User>;

const users: UserMap = {
  'user-1': { id: 1, name: 'Alice', email: 'alice@example.com' },
  'user-2': { id: 2, name: 'Bob', email: 'bob@example.com' }
};
```

## Conditional and Mapped Types

### Exclude and Extract

```typescript
type AllTypes = string | number | boolean | null | undefined;

// Exclude: remove from union type
type NonNullable1 = Exclude<AllTypes, null | undefined>;
// string | number | boolean

// Extract: extract from union type
type Primitives = Extract<AllTypes, string | number>;
// string | number

// Practical use
type EventType = 'click' | 'scroll' | 'mousemove' | 'keydown' | 'keyup';
type MouseEvents = Extract<EventType, 'click' | 'scroll' | 'mousemove'>;
type KeyboardEvents = Exclude<EventType, MouseEvents>;
```

### NonNullable

```typescript
type MaybeString = string | null | undefined;

// NonNullable: exclude null and undefined
type DefiniteString = NonNullable<MaybeString>;
// string

// Practical use
function getValue<T>(value: T): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error('Value is null or undefined');
  }
  return value as NonNullable<T>;
}
```

### Mapped Types

```typescript
interface Person {
  name: string;
  age: number;
  email: string;
}

// Custom mapped type
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

type NullablePerson = Nullable<Person>;
// { name: string | null; age: number | null; email: string | null; }

// Add prefix
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number; getEmail: () => string; }
```

## Function Type Utilities

### Parameters and ReturnType

```typescript
function createUser(name: string, age: number): User {
  return { id: Date.now(), name, email: '', age };
}

// Parameters: get function parameter types
type CreateUserParams = Parameters<typeof createUser>;
// [string, number]

// ReturnType: get return type
type CreateUserReturn = ReturnType<typeof createUser>;
// User

// Practical use: wrapper functions
function wrapWithLogging<T extends (...args: any[]) => any>(fn: T) {
  return (...args: Parameters<T>): ReturnType<T> => {
    console.log('Calling with:', args);
    const result = fn(...args);
    console.log('Result:', result);
    return result;
  };
}
```

### ConstructorParameters and InstanceType

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

// ConstructorParameters: get constructor parameter types
type ApiClientParams = ConstructorParameters<typeof ApiClient>;
// [string, number]

// InstanceType: get instance type
type ApiClientInstance = InstanceType<typeof ApiClient>;
// ApiClient

// Factory function
function createInstance<T extends new (...args: any[]) => any>(
  Class: T,
  ...args: ConstructorParameters<T>
): InstanceType<T> {
  return new Class(...args);
}

const client = createInstance(ApiClient, 'https://api.example.com', 5000);
```

### ThisParameterType and OmitThisParameter

```typescript
function greet(this: { name: string }, greeting: string) {
  return `${greeting}, ${this.name}!`;
}

// ThisParameterType: get this parameter type
type GreetThis = ThisParameterType<typeof greet>;
// { name: string }

// OmitThisParameter: remove this parameter
type GreetWithoutThis = OmitThisParameter<typeof greet>;
// (greeting: string) => string

// Bind this
const boundGreet: GreetWithoutThis = greet.bind({ name: 'World' });
```

## String Manipulation Types

### Built-in String Types

```typescript
type EventName = 'click' | 'focus' | 'blur';

// Uppercase: convert to uppercase
type UpperEvent = Uppercase<EventName>;
// 'CLICK' | 'FOCUS' | 'BLUR'

// Lowercase: convert to lowercase
type LowerEvent = Lowercase<'CLICK' | 'FOCUS'>;
// 'click' | 'focus'

// Capitalize: capitalize first letter
type CapEvent = Capitalize<EventName>;
// 'Click' | 'Focus' | 'Blur'

// Uncapitalize: lowercase first letter
type UncapEvent = Uncapitalize<'Click' | 'Focus'>;
// 'click' | 'focus'
```

### Template Literal Types

```typescript
type Color = 'red' | 'green' | 'blue';
type Size = 'small' | 'medium' | 'large';

// Generate combined types
type ColorSize = `${Color}-${Size}`;
// 'red-small' | 'red-medium' | 'red-large' | 'green-small' | ...

// Event handler types
type EventHandlers<T extends string> = {
  [K in T as `on${Capitalize<K>}`]: (event: Event) => void;
};

type ClickHandlers = EventHandlers<'click' | 'focus' | 'blur'>;
// { onClick: (event: Event) => void; onFocus: ...; onBlur: ... }
```

## Custom Utility Types

### Deep Partial

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
// All nested properties become optional
```

### Deep Readonly

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

// config.server.ssl.enabled = false; // Error
```

### Path Types

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

### Function Overload Utilities

```typescript
// Get last overload
type LastOverload<T> = T extends {
  (...args: infer A1): infer R1;
  (...args: infer A2): infer R2;
}
  ? (...args: A2) => R2
  : T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : never;

// Merge interfaces
type Merge<T, U> = Omit<T, keyof U> & U;

interface Base {
  id: number;
  name: string;
}

interface Extended {
  name: string; // Override
  email: string; // New
}

type Merged = Merge<Base, Extended>;
// { id: number; name: string; email: string; }
```

## Advanced Conditional Types

### The infer Keyword

```typescript
// Extract array element type
type ArrayElement<T> = T extends (infer E)[] ? E : never;

type Numbers = ArrayElement<number[]>; // number
type Strings = ArrayElement<string[]>; // string

// Extract Promise value type
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type ResolvedType = Awaited<Promise<Promise<string>>>; // string

// Extract first function argument
type FirstArg<T> = T extends (first: infer F, ...args: any[]) => any
  ? F
  : never;

type First = FirstArg<(a: string, b: number) => void>; // string
```

### Distributive Conditional Types

```typescript
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<string | number>;
// string[] | number[] (distributive)

// Disable distribution
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type Result2 = ToArrayNonDist<string | number>;
// (string | number)[]
```

## Best Practices Summary

```
Utility Types Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Naming                                            │
│   ├── Use descriptive names                        │
│   ├── Maintain consistent naming conventions       │
│   └── Add type comments for documentation          │
│                                                     │
│   Type Design                                       │
│   ├── Prefer built-in utility types                │
│   ├── Compose rather than duplicate                │
│   ├── Keep types simple and readable               │
│   └── Avoid excessive nesting                      │
│                                                     │
│   Performance                                       │
│   ├── Avoid deeply recursive types                 │
│   ├── Use type caching                             │
│   └── Control union type size                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Utility Type | Purpose |
|--------------|---------|
| Partial | All properties optional |
| Required | All properties required |
| Pick | Select specific properties |
| Omit | Exclude specific properties |
| Record | Create object types |
| Parameters | Get function parameters |
| ReturnType | Get return type |

---

*Master utility types and let TypeScript's type system work for you.*
