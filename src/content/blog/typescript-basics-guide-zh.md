---
title: 'TypeScript 入门基础教程'
description: '从零开始学习 TypeScript 类型系统、接口、泛型等核心概念'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'typescript-basics-guide'
---

TypeScript 是 JavaScript 的超集，添加了静态类型检查。本文详解 TypeScript 的基础知识。

## 为什么使用 TypeScript

### 主要优势

```
TypeScript 优势：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   开发体验                                          │
│   ├── 智能代码补全                                 │
│   ├── 实时错误检测                                 │
│   └── 更好的重构支持                               │
│                                                     │
│   代码质量                                          │
│   ├── 捕获运行时错误于编译期                       │
│   ├── 代码即文档                                   │
│   └── 更易维护的大型项目                           │
│                                                     │
│   团队协作                                          │
│   ├── 清晰的接口定义                               │
│   ├── 更容易理解他人代码                           │
│   └── API 变更自动检测                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 快速开始

```bash
# 安装 TypeScript
npm install -g typescript

# 编译 TypeScript 文件
tsc hello.ts

# 初始化项目
tsc --init

# 监视模式
tsc --watch
```

## 基本类型

### 原始类型

```typescript
// 布尔值
let isDone: boolean = false;

// 数字
let count: number = 42;
let hex: number = 0xf00d;
let binary: number = 0b1010;

// 字符串
let name: string = 'Alice';
let greeting: string = `Hello, ${name}`;

// null 和 undefined
let n: null = null;
let u: undefined = undefined;

// 符号
let sym: symbol = Symbol('key');

// 大整数
let big: bigint = 100n;
```

### 数组

```typescript
// 数组类型
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ['Alice', 'Bob'];

// 只读数组
let readonly: readonly number[] = [1, 2, 3];
let readonlyAlt: ReadonlyArray<number> = [1, 2, 3];

// 混合类型数组
let mixed: (string | number)[] = [1, 'two', 3];
```

### 元组

```typescript
// 元组：固定长度和类型的数组
let tuple: [string, number] = ['Alice', 25];

// 访问元素
const name = tuple[0];  // string
const age = tuple[1];   // number

// 可选元素
let optional: [string, number?] = ['Alice'];

// 剩余元素
let rest: [string, ...number[]] = ['sum', 1, 2, 3];

// 具名元组
let person: [name: string, age: number] = ['Alice', 25];
```

### 枚举

```typescript
// 数字枚举
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right    // 3
}

// 自定义起始值
enum Status {
  Pending = 1,
  Active,     // 2
  Completed   // 3
}

// 字符串枚举
enum Color {
  Red = '#FF0000',
  Green = '#00FF00',
  Blue = '#0000FF'
}

// 使用枚举
let dir: Direction = Direction.Up;

// 常量枚举（编译时内联）
const enum Size {
  Small = 1,
  Medium = 2,
  Large = 3
}
```

### 特殊类型

```typescript
// any - 任意类型（避免使用）
let anything: any = 'hello';
anything = 42;
anything = true;

// unknown - 安全的 any
let unknown: unknown = 'hello';
// unknown.toUpperCase();  // 错误
if (typeof unknown === 'string') {
  unknown.toUpperCase();  // OK
}

// void - 无返回值
function log(message: string): void {
  console.log(message);
}

// never - 永不返回
function error(message: string): never {
  throw new Error(message);
}

function infinite(): never {
  while (true) {}
}

// object - 非原始类型
let obj: object = { name: 'Alice' };
```

## 类型注解与推断

### 类型注解

```typescript
// 变量注解
let name: string = 'Alice';
let age: number = 25;

// 函数参数和返回值
function add(a: number, b: number): number {
  return a + b;
}

// 可选参数
function greet(name: string, greeting?: string): string {
  return `${greeting || 'Hello'}, ${name}`;
}

// 默认参数
function greet2(name: string, greeting: string = 'Hello'): string {
  return `${greeting}, ${name}`;
}

// 剩余参数
function sum(...numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}
```

### 类型推断

```typescript
// TypeScript 自动推断类型
let name = 'Alice';      // 推断为 string
let age = 25;            // 推断为 number
let active = true;       // 推断为 boolean

// 数组推断
let numbers = [1, 2, 3];        // number[]
let mixed = [1, 'two'];         // (string | number)[]

// 函数返回值推断
function add(a: number, b: number) {
  return a + b;  // 推断返回 number
}

// 上下文类型推断
const names = ['Alice', 'Bob'];
names.forEach(name => {
  console.log(name.toUpperCase());  // name 推断为 string
});
```

## 接口

### 基本接口

```typescript
// 定义接口
interface User {
  name: string;
  age: number;
}

// 使用接口
const user: User = {
  name: 'Alice',
  age: 25
};

// 可选属性
interface Config {
  host: string;
  port?: number;
}

// 只读属性
interface Point {
  readonly x: number;
  readonly y: number;
}

const point: Point = { x: 10, y: 20 };
// point.x = 20;  // 错误
```

### 接口扩展

```typescript
// 接口继承
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

// 多继承
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

### 函数接口

```typescript
// 函数类型接口
interface MathFunc {
  (a: number, b: number): number;
}

const add: MathFunc = (a, b) => a + b;
const multiply: MathFunc = (a, b) => a * b;

// 可调用接口
interface Greeting {
  (name: string): string;
  language: string;
}

const greet: Greeting = (name) => `Hello, ${name}`;
greet.language = 'en';
```

### 索引签名

```typescript
// 字符串索引
interface StringMap {
  [key: string]: string;
}

const colors: StringMap = {
  red: '#FF0000',
  green: '#00FF00'
};

// 数字索引
interface NumberArray {
  [index: number]: string;
}

const arr: NumberArray = ['a', 'b', 'c'];

// 混合索引
interface Dictionary {
  [key: string]: number | string;
  length: number;
  name: string;
}
```

## 类型别名

### 基本用法

```typescript
// 类型别名
type ID = string | number;
type Name = string;

let userId: ID = 123;
userId = 'abc123';

// 对象类型
type User = {
  name: string;
  age: number;
};

// 函数类型
type Callback = (data: string) => void;

// 元组类型
type Point = [number, number];
```

### 类型别名 vs 接口

```typescript
// 接口可以扩展
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}

// 类型别名用交叉类型
type Animal2 = {
  name: string;
};
type Dog2 = Animal2 & {
  breed: string;
};

// 接口可以合并声明
interface User {
  name: string;
}
interface User {
  age: number;
}
// User 现在有 name 和 age

// 类型别名不能重复声明
// type User = { name: string };
// type User = { age: number };  // 错误
```

## 联合类型与交叉类型

### 联合类型

```typescript
// 联合类型：可以是多种类型之一
type ID = string | number;

function printId(id: ID) {
  if (typeof id === 'string') {
    console.log(id.toUpperCase());
  } else {
    console.log(id.toFixed(2));
  }
}

// 字面量联合
type Direction = 'up' | 'down' | 'left' | 'right';
type Status = 'pending' | 'active' | 'completed';

function move(direction: Direction) {
  console.log(`Moving ${direction}`);
}

move('up');
// move('diagonal');  // 错误
```

### 交叉类型

```typescript
// 交叉类型：组合多个类型
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

### 类型收窄

```typescript
// typeof 收窄
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value * 2;
}

// instanceof 收窄
function processDate(value: Date | string) {
  if (value instanceof Date) {
    return value.getTime();
  }
  return new Date(value).getTime();
}

// in 操作符收窄
interface Cat { meow(): void; }
interface Dog { bark(): void; }

function speak(animal: Cat | Dog) {
  if ('meow' in animal) {
    animal.meow();
  } else {
    animal.bark();
  }
}

// 自定义类型守卫
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process2(value: unknown) {
  if (isString(value)) {
    console.log(value.toUpperCase());
  }
}
```

## 泛型

### 泛型函数

```typescript
// 泛型函数
function identity<T>(arg: T): T {
  return arg;
}

// 使用
identity<string>('hello');  // 显式指定
identity(42);               // 类型推断

// 多个类型参数
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

pair<string, number>('age', 25);
```

### 泛型接口

```typescript
// 泛型接口
interface Container<T> {
  value: T;
  getValue(): T;
}

const numberContainer: Container<number> = {
  value: 42,
  getValue() { return this.value; }
};

// 泛型数组
interface List<T> {
  items: T[];
  add(item: T): void;
  get(index: number): T;
}
```

### 泛型约束

```typescript
// 基本约束
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}

getLength('hello');     // OK
getLength([1, 2, 3]);   // OK
// getLength(123);      // 错误

// keyof 约束
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'Alice', age: 25 };
getProperty(user, 'name');  // string
getProperty(user, 'age');   // number
// getProperty(user, 'email');  // 错误

// 默认类型参数
function createArray<T = string>(length: number, value: T): T[] {
  return Array(length).fill(value);
}
```

## 类

### 基本类

```typescript
class Person {
  // 属性
  name: string;
  age: number;

  // 构造函数
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // 方法
  greet(): string {
    return `Hello, I'm ${this.name}`;
  }
}

const person = new Person('Alice', 25);
```

### 访问修饰符

```typescript
class Employee {
  public name: string;       // 公开（默认）
  private salary: number;    // 私有
  protected id: number;      // 受保护
  readonly department: string;  // 只读

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

  // 参数属性简写
}

// 参数属性
class User {
  constructor(
    public name: string,
    private email: string,
    readonly id: number
  ) {}
}
```

### 继承

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

### 抽象类

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

### 实现接口

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

## 模块

### 导出

```typescript
// 命名导出
export const PI = 3.14159;
export function add(a: number, b: number): number {
  return a + b;
}
export interface User {
  name: string;
}

// 默认导出
export default class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}

// 重新导出
export { PI as PI_VALUE } from './constants';
export * from './helpers';
```

### 导入

```typescript
// 命名导入
import { PI, add, User } from './math';

// 默认导入
import Calculator from './calculator';

// 混合导入
import Calculator, { PI, add } from './math';

// 别名导入
import { add as addNumbers } from './math';

// 命名空间导入
import * as math from './math';
math.add(1, 2);

// 类型导入
import type { User } from './types';
```

## 最佳实践总结

```
TypeScript 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   类型使用                                          │
│   ├── 尽量避免 any，使用 unknown 代替              │
│   ├── 优先使用类型推断                             │
│   ├── 使用严格模式（strict: true）                 │
│   └── 为公共 API 显式声明类型                      │
│                                                     │
│   接口 vs 类型别名                                  │
│   ├── 对象形状用接口                               │
│   ├── 联合/元组用类型别名                          │
│   └── 需要扩展时用接口                             │
│                                                     │
│   代码组织                                          │
│   ├── 相关类型放在一起                             │
│   ├── 使用模块化组织代码                           │
│   └── 分离类型定义文件（.d.ts）                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 概念 | 用途 | 示例 |
|------|------|------|
| 接口 | 定义对象形状 | interface User { name: string } |
| 类型别名 | 创建类型名称 | type ID = string \| number |
| 泛型 | 可重用类型逻辑 | function identity\<T\>(x: T): T |
| 联合类型 | 多选一 | string \| number |

---

*掌握 TypeScript 基础，写出更可靠的 JavaScript 代码。*
