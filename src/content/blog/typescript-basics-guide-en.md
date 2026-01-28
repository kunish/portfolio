---
title: 'TypeScript Basics Tutorial'
description: 'Learn TypeScript type system, interfaces, generics, and core concepts from scratch'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'typescript-basics-guide'
---

TypeScript is a superset of JavaScript that adds static type checking. This article covers TypeScript fundamentals.

## Why Use TypeScript

### Key Benefits

```
TypeScript Benefits:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Developer Experience                              │
│   ├── Intelligent code completion                  │
│   ├── Real-time error detection                    │
│   └── Better refactoring support                   │
│                                                     │
│   Code Quality                                      │
│   ├── Catch runtime errors at compile time         │
│   ├── Code as documentation                        │
│   └── More maintainable large projects             │
│                                                     │
│   Team Collaboration                                │
│   ├── Clear interface definitions                  │
│   ├── Easier to understand others' code            │
│   └── Automatic API change detection               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Quick Start

```bash
# Install TypeScript
npm install -g typescript

# Compile TypeScript file
tsc hello.ts

# Initialize project
tsc --init

# Watch mode
tsc --watch
```

## Basic Types

### Primitive Types

```typescript
// Boolean
let isDone: boolean = false;

// Number
let count: number = 42;
let hex: number = 0xf00d;
let binary: number = 0b1010;

// String
let name: string = 'Alice';
let greeting: string = `Hello, ${name}`;

// null and undefined
let n: null = null;
let u: undefined = undefined;

// Symbol
let sym: symbol = Symbol('key');

// BigInt
let big: bigint = 100n;
```

### Arrays

```typescript
// Array types
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ['Alice', 'Bob'];

// Readonly arrays
let readonly: readonly number[] = [1, 2, 3];
let readonlyAlt: ReadonlyArray<number> = [1, 2, 3];

// Mixed type arrays
let mixed: (string | number)[] = [1, 'two', 3];
```

### Tuples

```typescript
// Tuple: fixed length and type array
let tuple: [string, number] = ['Alice', 25];

// Access elements
const name = tuple[0];  // string
const age = tuple[1];   // number

// Optional elements
let optional: [string, number?] = ['Alice'];

// Rest elements
let rest: [string, ...number[]] = ['sum', 1, 2, 3];

// Named tuples
let person: [name: string, age: number] = ['Alice', 25];
```

### Enums

```typescript
// Numeric enum
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right    // 3
}

// Custom starting value
enum Status {
  Pending = 1,
  Active,     // 2
  Completed   // 3
}

// String enum
enum Color {
  Red = '#FF0000',
  Green = '#00FF00',
  Blue = '#0000FF'
}

// Using enums
let dir: Direction = Direction.Up;

// Const enum (inlined at compile time)
const enum Size {
  Small = 1,
  Medium = 2,
  Large = 3
}
```

### Special Types

```typescript
// any - any type (avoid using)
let anything: any = 'hello';
anything = 42;
anything = true;

// unknown - safe any
let unknown: unknown = 'hello';
// unknown.toUpperCase();  // Error
if (typeof unknown === 'string') {
  unknown.toUpperCase();  // OK
}

// void - no return value
function log(message: string): void {
  console.log(message);
}

// never - never returns
function error(message: string): never {
  throw new Error(message);
}

function infinite(): never {
  while (true) {}
}

// object - non-primitive type
let obj: object = { name: 'Alice' };
```

## Type Annotations and Inference

### Type Annotations

```typescript
// Variable annotations
let name: string = 'Alice';
let age: number = 25;

// Function parameters and return
function add(a: number, b: number): number {
  return a + b;
}

// Optional parameters
function greet(name: string, greeting?: string): string {
  return `${greeting || 'Hello'}, ${name}`;
}

// Default parameters
function greet2(name: string, greeting: string = 'Hello'): string {
  return `${greeting}, ${name}`;
}

// Rest parameters
function sum(...numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}
```

### Type Inference

```typescript
// TypeScript infers types automatically
let name = 'Alice';      // Inferred as string
let age = 25;            // Inferred as number
let active = true;       // Inferred as boolean

// Array inference
let numbers = [1, 2, 3];        // number[]
let mixed = [1, 'two'];         // (string | number)[]

// Function return inference
function add(a: number, b: number) {
  return a + b;  // Inferred return number
}

// Contextual type inference
const names = ['Alice', 'Bob'];
names.forEach(name => {
  console.log(name.toUpperCase());  // name inferred as string
});
```

## Interfaces

### Basic Interfaces

```typescript
// Define interface
interface User {
  name: string;
  age: number;
}

// Use interface
const user: User = {
  name: 'Alice',
  age: 25
};

// Optional properties
interface Config {
  host: string;
  port?: number;
}

// Readonly properties
interface Point {
  readonly x: number;
  readonly y: number;
}

const point: Point = { x: 10, y: 20 };
// point.x = 20;  // Error
```

### Interface Extension

```typescript
// Interface inheritance
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

const dog: Dog = {
  name: 'Buddy',
  breed: 'Labrador'
};

// Multiple inheritance
interface Swimmer {
  swim(): void;
}

interface Runner {
  run(): void;
}

interface Athlete extends Swimmer, Runner {
  compete(): void;
}
```

### Function Interfaces

```typescript
// Function type interface
interface MathFunc {
  (a: number, b: number): number;
}

const add: MathFunc = (a, b) => a + b;
const multiply: MathFunc = (a, b) => a * b;

// Callable interface
interface Greeting {
  (name: string): string;
  language: string;
}

const greet: Greeting = (name) => `Hello, ${name}`;
greet.language = 'en';
```

### Index Signatures

```typescript
// String index
interface StringMap {
  [key: string]: string;
}

const colors: StringMap = {
  red: '#FF0000',
  green: '#00FF00'
};

// Number index
interface NumberArray {
  [index: number]: string;
}

const arr: NumberArray = ['a', 'b', 'c'];

// Mixed index
interface Dictionary {
  [key: string]: number | string;
  length: number;
  name: string;
}
```

## Type Aliases

### Basic Usage

```typescript
// Type alias
type ID = string | number;
type Name = string;

let userId: ID = 123;
userId = 'abc123';

// Object type
type User = {
  name: string;
  age: number;
};

// Function type
type Callback = (data: string) => void;

// Tuple type
type Point = [number, number];
```

### Type Alias vs Interface

```typescript
// Interface can extend
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}

// Type alias uses intersection
type Animal2 = {
  name: string;
};
type Dog2 = Animal2 & {
  breed: string;
};

// Interface can merge declarations
interface User {
  name: string;
}
interface User {
  age: number;
}
// User now has name and age

// Type alias cannot be redeclared
// type User = { name: string };
// type User = { age: number };  // Error
```

## Union and Intersection Types

### Union Types

```typescript
// Union type: can be one of multiple types
type ID = string | number;

function printId(id: ID) {
  if (typeof id === 'string') {
    console.log(id.toUpperCase());
  } else {
    console.log(id.toFixed(2));
  }
}

// Literal unions
type Direction = 'up' | 'down' | 'left' | 'right';
type Status = 'pending' | 'active' | 'completed';

function move(direction: Direction) {
  console.log(`Moving ${direction}`);
}

move('up');
// move('diagonal');  // Error
```

### Intersection Types

```typescript
// Intersection type: combine multiple types
type Person = {
  name: string;
  age: number;
};

type Employee = {
  employeeId: number;
  department: string;
};

type Staff = Person & Employee;

const staff: Staff = {
  name: 'Alice',
  age: 25,
  employeeId: 1001,
  department: 'Engineering'
};
```

### Type Narrowing

```typescript
// typeof narrowing
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value * 2;
}

// instanceof narrowing
function processDate(value: Date | string) {
  if (value instanceof Date) {
    return value.getTime();
  }
  return new Date(value).getTime();
}

// in operator narrowing
interface Cat { meow(): void; }
interface Dog { bark(): void; }

function speak(animal: Cat | Dog) {
  if ('meow' in animal) {
    animal.meow();
  } else {
    animal.bark();
  }
}

// Custom type guard
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process2(value: unknown) {
  if (isString(value)) {
    console.log(value.toUpperCase());
  }
}
```

## Generics

### Generic Functions

```typescript
// Generic function
function identity<T>(arg: T): T {
  return arg;
}

// Usage
identity<string>('hello');  // Explicit type
identity(42);               // Type inference

// Multiple type parameters
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

pair<string, number>('age', 25);
```

### Generic Interfaces

```typescript
// Generic interface
interface Container<T> {
  value: T;
  getValue(): T;
}

const numberContainer: Container<number> = {
  value: 42,
  getValue() { return this.value; }
};

// Generic array
interface List<T> {
  items: T[];
  add(item: T): void;
  get(index: number): T;
}
```

### Generic Constraints

```typescript
// Basic constraint
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}

getLength('hello');     // OK
getLength([1, 2, 3]);   // OK
// getLength(123);      // Error

// keyof constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'Alice', age: 25 };
getProperty(user, 'name');  // string
getProperty(user, 'age');   // number
// getProperty(user, 'email');  // Error

// Default type parameters
function createArray<T = string>(length: number, value: T): T[] {
  return Array(length).fill(value);
}
```

## Classes

### Basic Classes

```typescript
class Person {
  // Properties
  name: string;
  age: number;

  // Constructor
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // Method
  greet(): string {
    return `Hello, I'm ${this.name}`;
  }
}

const person = new Person('Alice', 25);
```

### Access Modifiers

```typescript
class Employee {
  public name: string;       // Public (default)
  private salary: number;    // Private
  protected id: number;      // Protected
  readonly department: string;  // Readonly

  constructor(
    name: string,
    salary: number,
    id: number,
    department: string
  ) {
    this.name = name;
    this.salary = salary;
    this.id = id;
    this.department = department;
  }
}

// Parameter properties shorthand
class User {
  constructor(
    public name: string,
    private email: string,
    readonly id: number
  ) {}
}
```

### Inheritance

```typescript
class Animal {
  constructor(public name: string) {}

  speak(): void {
    console.log(`${this.name} makes a sound`);
  }
}

class Dog extends Animal {
  constructor(name: string, public breed: string) {
    super(name);
  }

  speak(): void {
    console.log(`${this.name} barks`);
  }

  fetch(): void {
    console.log(`${this.name} fetches the ball`);
  }
}
```

### Abstract Classes

```typescript
abstract class Shape {
  abstract area(): number;
  abstract perimeter(): number;

  describe(): string {
    return `Area: ${this.area()}, Perimeter: ${this.perimeter()}`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }

  perimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}
```

### Implementing Interfaces

```typescript
interface Printable {
  print(): void;
}

interface Saveable {
  save(): void;
}

class Document implements Printable, Saveable {
  constructor(private content: string) {}

  print(): void {
    console.log(this.content);
  }

  save(): void {
    console.log('Saving document...');
  }
}
```

## Modules

### Exports

```typescript
// Named exports
export const PI = 3.14159;
export function add(a: number, b: number): number {
  return a + b;
}
export interface User {
  name: string;
}

// Default export
export default class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}

// Re-export
export { PI as PI_VALUE } from './constants';
export * from './helpers';
```

### Imports

```typescript
// Named imports
import { PI, add, User } from './math';

// Default import
import Calculator from './calculator';

// Mixed imports
import Calculator, { PI, add } from './math';

// Aliased imports
import { add as addNumbers } from './math';

// Namespace imports
import * as math from './math';
math.add(1, 2);

// Type imports
import type { User } from './types';
```

## Best Practices Summary

```
TypeScript Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Type Usage                                        │
│   ├── Avoid any, use unknown instead               │
│   ├── Prefer type inference                        │
│   ├── Use strict mode (strict: true)               │
│   └── Explicitly declare types for public APIs     │
│                                                     │
│   Interface vs Type Alias                           │
│   ├── Use interface for object shapes              │
│   ├── Use type alias for unions/tuples             │
│   └── Use interface when extension needed          │
│                                                     │
│   Code Organization                                 │
│   ├── Keep related types together                  │
│   ├── Organize code with modules                   │
│   └── Separate type definition files (.d.ts)       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Concept | Purpose | Example |
|---------|---------|---------|
| Interface | Define object shape | interface User { name: string } |
| Type Alias | Create type names | type ID = string \| number |
| Generics | Reusable type logic | function identity\<T\>(x: T): T |
| Union Type | Multiple options | string \| number |

---

*Master TypeScript basics to write more reliable JavaScript code.*
