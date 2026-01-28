---
title: 'JavaScript Symbol 与迭代器完全指南'
description: '掌握 Symbol 类型、内置符号、迭代器协议、生成器函数等核心概念'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'js-symbol-iterator-guide'
---

Symbol 和迭代器是 ES6 引入的重要特性。本文详解这些概念的用法和应用场景。

## Symbol 基础

### 创建 Symbol

```javascript
// 基本创建
const sym1 = Symbol();
const sym2 = Symbol();
sym1 === sym2;  // false（每个都是唯一的）

// 带描述的 Symbol
const sym3 = Symbol('description');
const sym4 = Symbol('description');
sym3 === sym4;  // false（描述不影响唯一性）

// 获取描述
sym3.description;  // 'description'

// Symbol 不能用 new
// new Symbol();  // TypeError
```

### Symbol 作为属性键

```javascript
const id = Symbol('id');

const user = {
  name: 'Alice',
  [id]: 123
};

// 访问
user[id];     // 123
user['id'];   // undefined

// 不会出现在常规遍历中
Object.keys(user);        // ['name']
Object.values(user);      // ['Alice']
JSON.stringify(user);     // '{"name":"Alice"}'

// 获取 Symbol 属性
Object.getOwnPropertySymbols(user);  // [Symbol(id)]
Reflect.ownKeys(user);               // ['name', Symbol(id)]
```

### Symbol.for 全局注册

```javascript
// 全局 Symbol 注册表
const globalSym = Symbol.for('app.id');
const sameSym = Symbol.for('app.id');
globalSym === sameSym;  // true

// 获取全局 Symbol 的键
Symbol.keyFor(globalSym);  // 'app.id'

// 普通 Symbol 没有键
const localSym = Symbol('local');
Symbol.keyFor(localSym);   // undefined

// 跨 realm（iframe、worker）共享
// Symbol.for 在不同 realm 中返回相同 Symbol
```

### 实用场景

```javascript
// 1. 私有属性
const _private = Symbol('private');

class MyClass {
  constructor() {
    this[_private] = 'secret';
  }

  getPrivate() {
    return this[_private];
  }
}

// 2. 避免属性冲突
const metadata = Symbol('metadata');

function addMetadata(obj, data) {
  obj[metadata] = data;
}

// 3. 定义常量
const STATUS = {
  PENDING: Symbol('pending'),
  ACTIVE: Symbol('active'),
  COMPLETED: Symbol('completed')
};

// 使用 Symbol 作为常量值
function getStatus(status) {
  switch (status) {
    case STATUS.PENDING: return 'Waiting';
    case STATUS.ACTIVE: return 'Running';
    case STATUS.COMPLETED: return 'Done';
  }
}
```

## 内置 Symbol

### Symbol.iterator

```javascript
// 定义可迭代对象
const range = {
  start: 1,
  end: 5,

  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;

    return {
      next() {
        if (current <= end) {
          return { value: current++, done: false };
        }
        return { done: true };
      }
    };
  }
};

// 使用
for (const num of range) {
  console.log(num);  // 1, 2, 3, 4, 5
}

[...range];  // [1, 2, 3, 4, 5]
```

### Symbol.toStringTag

```javascript
class MyClass {
  get [Symbol.toStringTag]() {
    return 'MyClass';
  }
}

const obj = new MyClass();
Object.prototype.toString.call(obj);
// '[object MyClass]'
```

### Symbol.toPrimitive

```javascript
const obj = {
  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case 'number':
        return 42;
      case 'string':
        return 'hello';
      default:
        return 'default';
    }
  }
};

+obj;           // 42
`${obj}`;       // 'hello'
obj + '';       // 'default'
```

### Symbol.hasInstance

```javascript
class MyArray {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}

[] instanceof MyArray;    // true
{} instanceof MyArray;    // false
```

### 其他内置 Symbol

```javascript
// Symbol.isConcatSpreadable
const arr = [1, 2, 3];
arr[Symbol.isConcatSpreadable] = false;
[0].concat(arr);  // [0, [1, 2, 3]]

// Symbol.species
class MyArray extends Array {
  static get [Symbol.species]() {
    return Array;  // map/filter 返回普通 Array
  }
}

// Symbol.match, Symbol.replace, Symbol.search, Symbol.split
// 用于自定义正则表达式行为

// Symbol.unscopables
// 控制 with 语句的作用域
```

## 迭代器协议

### 迭代器接口

```javascript
// 迭代器是具有 next() 方法的对象
const iterator = {
  current: 0,

  next() {
    if (this.current < 3) {
      return { value: this.current++, done: false };
    }
    return { done: true };
  }
};

iterator.next();  // { value: 0, done: false }
iterator.next();  // { value: 1, done: false }
iterator.next();  // { value: 2, done: false }
iterator.next();  // { done: true }
```

### 可迭代协议

```javascript
// 可迭代对象有 [Symbol.iterator] 方法
const iterable = {
  data: [1, 2, 3],

  [Symbol.iterator]() {
    let index = 0;
    const data = this.data;

    return {
      next() {
        if (index < data.length) {
          return { value: data[index++], done: false };
        }
        return { done: true };
      }
    };
  }
};

// 可以使用 for...of
for (const item of iterable) {
  console.log(item);
}

// 可以展开
[...iterable];  // [1, 2, 3]

// 可以解构
const [first, second] = iterable;
```

### 内置可迭代对象

```javascript
// 数组
for (const item of [1, 2, 3]) {}

// 字符串
for (const char of 'hello') {}

// Map
for (const [key, value] of new Map([['a', 1]])) {}

// Set
for (const item of new Set([1, 2, 3])) {}

// arguments
function example() {
  for (const arg of arguments) {}
}

// NodeList
for (const node of document.querySelectorAll('div')) {}

// TypedArray
for (const byte of new Uint8Array([1, 2, 3])) {}
```

### 自定义可迭代类

```javascript
class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
  }

  add(value) {
    const node = { value, next: null };
    if (this.tail) {
      this.tail.next = node;
    } else {
      this.head = node;
    }
    this.tail = node;
  }

  *[Symbol.iterator]() {
    let current = this.head;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}

const list = new LinkedList();
list.add(1);
list.add(2);
list.add(3);

[...list];  // [1, 2, 3]
```

## 生成器

### 基本语法

```javascript
// 生成器函数
function* generator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = generator();
gen.next();  // { value: 1, done: false }
gen.next();  // { value: 2, done: false }
gen.next();  // { value: 3, done: false }
gen.next();  // { done: true }

// 生成器自动实现迭代器协议
for (const value of generator()) {
  console.log(value);  // 1, 2, 3
}

[...generator()];  // [1, 2, 3]
```

### yield 表达式

```javascript
// yield 是双向的
function* dialogue() {
  const name = yield 'What is your name?';
  const age = yield `Hello, ${name}! How old are you?`;
  return `${name} is ${age} years old.`;
}

const gen = dialogue();
console.log(gen.next().value);        // 'What is your name?'
console.log(gen.next('Alice').value); // 'Hello, Alice! How old are you?'
console.log(gen.next(25).value);      // 'Alice is 25 years old.'
```

### yield*

```javascript
// 委托给另一个生成器
function* gen1() {
  yield 1;
  yield 2;
}

function* gen2() {
  yield* gen1();
  yield 3;
}

[...gen2()];  // [1, 2, 3]

// 委托给任何可迭代对象
function* genFromArray() {
  yield* [1, 2, 3];
  yield* 'abc';
}

[...genFromArray()];  // [1, 2, 3, 'a', 'b', 'c']
```

### 生成器控制

```javascript
function* controlled() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } finally {
    console.log('Cleanup');
  }
}

const gen = controlled();
gen.next();     // { value: 1, done: false }
gen.return(99); // 'Cleanup', { value: 99, done: true }

// 抛出错误
function* withError() {
  try {
    yield 1;
    yield 2;
  } catch (e) {
    console.log('Caught:', e);
  }
}

const gen2 = withError();
gen2.next();           // { value: 1, done: false }
gen2.throw(new Error('Test'));  // 'Caught: Error: Test'
```

### 实用场景

```javascript
// 1. 无限序列
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// 取前 10 个斐波那契数
function take(n, iterable) {
  const result = [];
  for (const item of iterable) {
    result.push(item);
    if (result.length >= n) break;
  }
  return result;
}

take(10, fibonacci());  // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

// 2. 异步流程控制
function* fetchFlow() {
  const user = yield fetch('/api/user').then(r => r.json());
  const posts = yield fetch(`/api/posts/${user.id}`).then(r => r.json());
  return { user, posts };
}

// 3. 状态机
function* trafficLight() {
  while (true) {
    yield 'green';
    yield 'yellow';
    yield 'red';
  }
}
```

## 异步迭代

### 异步迭代器

```javascript
const asyncIterable = {
  async *[Symbol.asyncIterator]() {
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 100));
      yield i;
    }
  }
};

// 使用 for await...of
async function process() {
  for await (const item of asyncIterable) {
    console.log(item);  // 0, 1, 2（每隔 100ms）
  }
}
```

### 异步生成器

```javascript
async function* fetchPages(urls) {
  for (const url of urls) {
    const response = await fetch(url);
    yield await response.json();
  }
}

async function processPages() {
  const urls = ['/api/page/1', '/api/page/2', '/api/page/3'];

  for await (const page of fetchPages(urls)) {
    console.log(page);
  }
}
```

## 最佳实践总结

```
Symbol 与迭代器最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Symbol 使用                                       │
│   ├── 用于创建唯一标识符                           │
│   ├── 实现类似私有属性的效果                       │
│   ├── 跨模块共享使用 Symbol.for                    │
│   └── 内置 Symbol 自定义对象行为                   │
│                                                     │
│   迭代器使用                                        │
│   ├── 实现 [Symbol.iterator] 使对象可迭代          │
│   ├── 使用生成器简化迭代器实现                     │
│   ├── 处理大数据集使用惰性迭代                     │
│   └── 异步数据使用 async iterator                  │
│                                                     │
│   生成器使用                                        │
│   ├── 创建惰性求值序列                             │
│   ├── 简化复杂迭代逻辑                             │
│   ├── 实现协程模式                                 │
│   └── 配合 async/await 处理异步流                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 概念 | 用途 | 语法 |
|------|------|------|
| Symbol | 唯一标识符 | Symbol('desc') |
| Symbol.for | 全局共享 | Symbol.for('key') |
| 迭代器 | 自定义遍历 | [Symbol.iterator]() |
| 生成器 | 惰性序列 | function* gen() |

---

*掌握 Symbol 和迭代器，解锁 JavaScript 高级特性。*
