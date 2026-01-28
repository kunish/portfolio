---
title: 'JavaScript Symbol and Iterator Complete Guide'
description: 'Master Symbol types, built-in symbols, iterator protocol, and generator functions'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'js-symbol-iterator-guide'
---

Symbol and iterators are important features introduced in ES6. This article covers the usage and applications of these concepts.

## Symbol Basics

### Creating Symbols

```javascript
// Basic creation
const sym1 = Symbol();
const sym2 = Symbol();
sym1 === sym2;  // false (each is unique)

// Symbol with description
const sym3 = Symbol('description');
const sym4 = Symbol('description');
sym3 === sym4;  // false (description doesn't affect uniqueness)

// Get description
sym3.description;  // 'description'

// Cannot use new
// new Symbol();  // TypeError
```

### Symbol as Property Key

```javascript
const id = Symbol('id');

const user = {
  name: 'Alice',
  [id]: 123
};

// Access
user[id];     // 123
user['id'];   // undefined

// Not included in regular enumeration
Object.keys(user);        // ['name']
Object.values(user);      // ['Alice']
JSON.stringify(user);     // '{"name":"Alice"}'

// Get Symbol properties
Object.getOwnPropertySymbols(user);  // [Symbol(id)]
Reflect.ownKeys(user);               // ['name', Symbol(id)]
```

### Symbol.for Global Registry

```javascript
// Global Symbol registry
const globalSym = Symbol.for('app.id');
const sameSym = Symbol.for('app.id');
globalSym === sameSym;  // true

// Get key of global Symbol
Symbol.keyFor(globalSym);  // 'app.id'

// Regular Symbol has no key
const localSym = Symbol('local');
Symbol.keyFor(localSym);   // undefined

// Shared across realms (iframe, worker)
// Symbol.for returns the same Symbol in different realms
```

### Practical Scenarios

```javascript
// 1. Private properties
const _private = Symbol('private');

class MyClass {
  constructor() {
    this[_private] = 'secret';
  }

  getPrivate() {
    return this[_private];
  }
}

// 2. Avoid property conflicts
const metadata = Symbol('metadata');

function addMetadata(obj, data) {
  obj[metadata] = data;
}

// 3. Define constants
const STATUS = {
  PENDING: Symbol('pending'),
  ACTIVE: Symbol('active'),
  COMPLETED: Symbol('completed')
};

// Use Symbol as constant values
function getStatus(status) {
  switch (status) {
    case STATUS.PENDING: return 'Waiting';
    case STATUS.ACTIVE: return 'Running';
    case STATUS.COMPLETED: return 'Done';
  }
}
```

## Built-in Symbols

### Symbol.iterator

```javascript
// Define iterable object
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

// Usage
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

### Other Built-in Symbols

```javascript
// Symbol.isConcatSpreadable
const arr = [1, 2, 3];
arr[Symbol.isConcatSpreadable] = false;
[0].concat(arr);  // [0, [1, 2, 3]]

// Symbol.species
class MyArray extends Array {
  static get [Symbol.species]() {
    return Array;  // map/filter return regular Array
  }
}

// Symbol.match, Symbol.replace, Symbol.search, Symbol.split
// Used to customize regex behavior

// Symbol.unscopables
// Controls with statement scope
```

## Iterator Protocol

### Iterator Interface

```javascript
// Iterator is an object with next() method
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

### Iterable Protocol

```javascript
// Iterable objects have [Symbol.iterator] method
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

// Can use for...of
for (const item of iterable) {
  console.log(item);
}

// Can spread
[...iterable];  // [1, 2, 3]

// Can destructure
const [first, second] = iterable;
```

### Built-in Iterables

```javascript
// Array
for (const item of [1, 2, 3]) {}

// String
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

### Custom Iterable Class

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

## Generators

### Basic Syntax

```javascript
// Generator function
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

// Generators automatically implement iterator protocol
for (const value of generator()) {
  console.log(value);  // 1, 2, 3
}

[...generator()];  // [1, 2, 3]
```

### yield Expression

```javascript
// yield is bidirectional
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
// Delegate to another generator
function* gen1() {
  yield 1;
  yield 2;
}

function* gen2() {
  yield* gen1();
  yield 3;
}

[...gen2()];  // [1, 2, 3]

// Delegate to any iterable
function* genFromArray() {
  yield* [1, 2, 3];
  yield* 'abc';
}

[...genFromArray()];  // [1, 2, 3, 'a', 'b', 'c']
```

### Generator Control

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

// Throw error
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

### Practical Scenarios

```javascript
// 1. Infinite sequences
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// Take first 10 Fibonacci numbers
function take(n, iterable) {
  const result = [];
  for (const item of iterable) {
    result.push(item);
    if (result.length >= n) break;
  }
  return result;
}

take(10, fibonacci());  // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

// 2. Async flow control
function* fetchFlow() {
  const user = yield fetch('/api/user').then(r => r.json());
  const posts = yield fetch(`/api/posts/${user.id}`).then(r => r.json());
  return { user, posts };
}

// 3. State machine
function* trafficLight() {
  while (true) {
    yield 'green';
    yield 'yellow';
    yield 'red';
  }
}
```

## Async Iteration

### Async Iterator

```javascript
const asyncIterable = {
  async *[Symbol.asyncIterator]() {
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 100));
      yield i;
    }
  }
};

// Use for await...of
async function process() {
  for await (const item of asyncIterable) {
    console.log(item);  // 0, 1, 2 (every 100ms)
  }
}
```

### Async Generator

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

## Best Practices Summary

```
Symbol and Iterator Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Symbol Usage                                      │
│   ├── Create unique identifiers                    │
│   ├── Implement private-like properties            │
│   ├── Use Symbol.for for cross-module sharing      │
│   └── Built-in Symbols customize object behavior   │
│                                                     │
│   Iterator Usage                                    │
│   ├── Implement [Symbol.iterator] for iterables    │
│   ├── Use generators to simplify implementation    │
│   ├── Use lazy iteration for large datasets        │
│   └── Use async iterator for async data            │
│                                                     │
│   Generator Usage                                   │
│   ├── Create lazy evaluated sequences              │
│   ├── Simplify complex iteration logic             │
│   ├── Implement coroutine patterns                 │
│   └── Combine with async/await for async flows     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Concept | Purpose | Syntax |
|---------|---------|--------|
| Symbol | Unique identifier | Symbol('desc') |
| Symbol.for | Global sharing | Symbol.for('key') |
| Iterator | Custom traversal | [Symbol.iterator]() |
| Generator | Lazy sequences | function* gen() |

---

*Master Symbol and iterators to unlock advanced JavaScript features.*
