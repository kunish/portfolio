---
title: 'JavaScript Map and Set Complete Guide'
description: 'Master ES6 collection types Map, Set, WeakMap, WeakSet usage and best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'js-map-set-guide'
---

ES6 introduced Map and Set for more powerful data structures. This article covers how to use these collection types.

## Set Collection

### Basic Operations

```javascript
// Create Set
const set = new Set();
const setFromArray = new Set([1, 2, 3, 3, 4]);  // Auto deduplication

// Add elements
set.add(1);
set.add(2);
set.add(2);  // Duplicate ignored
set.add('hello');
set.add({ name: 'Alice' });

// Chaining
set.add(3).add(4).add(5);

// Check existence
set.has(1);   // true
set.has(10);  // false

// Delete element
set.delete(1);  // Returns true/false

// Clear all
set.clear();

// Size
set.size;  // 0
```

### Iteration Methods

```javascript
const set = new Set(['a', 'b', 'c']);

// forEach
set.forEach((value, valueAgain, set) => {
  console.log(value);  // 'a', 'b', 'c'
});

// for...of
for (const value of set) {
  console.log(value);
}

// Iterator methods
set.keys();    // SetIterator {'a', 'b', 'c'}
set.values();  // SetIterator {'a', 'b', 'c'}
set.entries(); // SetIterator {'a' => 'a', 'b' => 'b', 'c' => 'c'}

// Convert to array
const arr = [...set];
const arr2 = Array.from(set);
```

### Practical Use Cases

```javascript
// Array deduplication
const arr = [1, 2, 2, 3, 3, 3, 4];
const unique = [...new Set(arr)];  // [1, 2, 3, 4]

// Set operations
const setA = new Set([1, 2, 3, 4]);
const setB = new Set([3, 4, 5, 6]);

// Union
const union = new Set([...setA, ...setB]);
// Set {1, 2, 3, 4, 5, 6}

// Intersection
const intersection = new Set(
  [...setA].filter(x => setB.has(x))
);
// Set {3, 4}

// Difference
const difference = new Set(
  [...setA].filter(x => !setB.has(x))
);
// Set {1, 2}

// Symmetric difference
const symmetricDiff = new Set(
  [...setA].filter(x => !setB.has(x)).concat(
    [...setB].filter(x => !setA.has(x))
  )
);
// Set {1, 2, 5, 6}
```

## Map Collection

### Basic Operations

```javascript
// Create Map
const map = new Map();
const mapFromEntries = new Map([
  ['key1', 'value1'],
  ['key2', 'value2']
]);

// Set key-value pairs
map.set('name', 'Alice');
map.set(123, 'number key');
map.set({ id: 1 }, 'object key');

// Chaining
map.set('a', 1).set('b', 2).set('c', 3);

// Get value
map.get('name');  // 'Alice'
map.get('xxx');   // undefined

// Check existence
map.has('name');  // true

// Delete
map.delete('name');  // Returns true/false

// Clear all
map.clear();

// Size
map.size;
```

### Iteration Methods

```javascript
const map = new Map([
  ['a', 1],
  ['b', 2],
  ['c', 3]
]);

// forEach
map.forEach((value, key, map) => {
  console.log(`${key}: ${value}`);
});

// for...of
for (const [key, value] of map) {
  console.log(`${key}: ${value}`);
}

// Iterator methods
map.keys();    // MapIterator {'a', 'b', 'c'}
map.values();  // MapIterator {1, 2, 3}
map.entries(); // MapIterator {'a' => 1, 'b' => 2, 'c' => 3}

// Conversions
const arr = [...map];              // [['a', 1], ['b', 2], ['c', 3]]
const obj = Object.fromEntries(map);  // { a: 1, b: 2, c: 3 }
```

### Map vs Object

```
Map vs Object Comparison:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Key Types                                         │
│   ├── Map: Any type (objects, functions, etc.)     │
│   └── Object: Strings or Symbols only              │
│                                                     │
│   Order                                             │
│   ├── Map: Maintains insertion order               │
│   └── Object: No order guarantee (except integers) │
│                                                     │
│   Size                                              │
│   ├── Map: size property                           │
│   └── Object: Need Object.keys().length            │
│                                                     │
│   Performance                                       │
│   ├── Map: Better for frequent add/delete          │
│   └── Object: Faster for static lookups            │
│                                                     │
│   Serialization                                     │
│   ├── Map: No direct JSON support                  │
│   └── Object: Native JSON support                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```javascript
// Objects as keys
const userRoles = new Map();
const user1 = { id: 1, name: 'Alice' };
const user2 = { id: 2, name: 'Bob' };

userRoles.set(user1, 'admin');
userRoles.set(user2, 'user');

userRoles.get(user1);  // 'admin'

// Cannot do this with regular objects
const objRoles = {};
objRoles[user1] = 'admin';  // Key becomes '[object Object]'
objRoles[user2] = 'user';   // Overwrites the previous one
```

## WeakSet

### Features and Usage

```javascript
// WeakSet can only store object references
const weakSet = new WeakSet();

const obj1 = { a: 1 };
const obj2 = { b: 2 };

weakSet.add(obj1);
weakSet.add(obj2);

weakSet.has(obj1);  // true
weakSet.delete(obj1);

// Cannot add primitives
// weakSet.add(1);  // TypeError

// Weak reference: objects are garbage collected when no other references
let temp = { c: 3 };
weakSet.add(temp);
temp = null;  // Object may be garbage collected

// Not iterable
// weakSet.forEach(...)  // Does not exist
// [...weakSet]          // Not supported
```

### Practical Use Cases

```javascript
// Mark objects (e.g., processed DOM nodes)
const processedNodes = new WeakSet();

function processNode(node) {
  if (processedNodes.has(node)) {
    return;  // Already processed
  }

  // Process node
  doSomething(node);
  processedNodes.add(node);
}

// Private data
const privateData = new WeakSet();

class MyClass {
  constructor() {
    privateData.add(this);
  }

  isValid() {
    return privateData.has(this);
  }
}
```

## WeakMap

### Features and Usage

```javascript
// WeakMap keys must be objects
const weakMap = new WeakMap();

const key1 = { id: 1 };
const key2 = { id: 2 };

weakMap.set(key1, 'value1');
weakMap.set(key2, 'value2');

weakMap.get(key1);   // 'value1'
weakMap.has(key2);   // true
weakMap.delete(key1);

// Cannot use primitives as keys
// weakMap.set('key', 'value');  // TypeError

// Weak reference keys
let tempKey = { id: 3 };
weakMap.set(tempKey, 'value3');
tempKey = null;  // Key-value pair may be garbage collected
```

### Practical Use Cases

```javascript
// Store private data
const privateProps = new WeakMap();

class Person {
  constructor(name, age) {
    privateProps.set(this, { name, age });
  }

  getName() {
    return privateProps.get(this).name;
  }

  getAge() {
    return privateProps.get(this).age;
  }
}

const person = new Person('Alice', 25);
person.getName();  // 'Alice'
// Cannot access private data externally

// Cache computation results
const cache = new WeakMap();

function expensiveComputation(obj) {
  if (cache.has(obj)) {
    return cache.get(obj);
  }

  const result = /* complex calculation */ obj.value * 2;
  cache.set(obj, result);
  return result;
}

// Associate data with DOM elements
const elementData = new WeakMap();

function setElementData(element, data) {
  elementData.set(element, data);
}

function getElementData(element) {
  return elementData.get(element);
}

// When element is removed, associated data is automatically released
```

## Performance Comparison

```javascript
// Large data operation performance test
const size = 100000;

// Array lookup O(n)
const arr = Array.from({ length: size }, (_, i) => i);
console.time('Array includes');
arr.includes(size - 1);
console.timeEnd('Array includes');

// Set lookup O(1)
const set = new Set(arr);
console.time('Set has');
set.has(size - 1);
console.timeEnd('Set has');

// Object lookup O(1)
const obj = Object.fromEntries(arr.map(i => [i, true]));
console.time('Object lookup');
obj[size - 1];
console.timeEnd('Object lookup');

// Map lookup O(1)
const map = new Map(arr.map(i => [i, true]));
console.time('Map get');
map.get(size - 1);
console.timeEnd('Map get');
```

## Best Practices Summary

```
Collection Type Selection Guide:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Use Set                                           │
│   ├── Need to store unique values                  │
│   ├── Fast existence checking                      │
│   └── Set operations (intersection, union, etc.)   │
│                                                     │
│   Use Map                                           │
│   ├── Keys are not strings                         │
│   ├── Need to maintain insertion order             │
│   └── Frequent key-value add/delete                │
│                                                     │
│   Use WeakSet/WeakMap                               │
│   ├── Prevent memory leaks                         │
│   ├── Store associated data for objects            │
│   └── Implement private properties                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Type | Key Type | Iterable | Weak Reference |
|------|----------|----------|----------------|
| Set | - | Yes | No |
| Map | Any | Yes | No |
| WeakSet | Object | No | Yes |
| WeakMap | Object | No | Yes |

---

*Use collection types wisely for more efficient data management.*
