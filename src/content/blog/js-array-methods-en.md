---
title: 'JavaScript Array Methods Complete Guide'
description: 'Master array iteration, transformation, filtering, searching, sorting and best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'js-array-methods'
---

Arrays are the most commonly used data structure in JavaScript. This article covers all essential array methods.

## Iteration Methods

### forEach

```javascript
// Iterate array, no return value
const numbers = [1, 2, 3, 4, 5];

numbers.forEach((value, index, array) => {
  console.log(`Index ${index}: ${value}`);
});

// Note: Cannot break out of forEach
// Use for...of or regular for loop when needed
```

### map

```javascript
// Transform array, returns new array
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8, 10]

const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 }
];

const names = users.map(user => user.name);
// ['Alice', 'Bob']

// With index
const indexed = numbers.map((n, i) => `${i}: ${n}`);
// ['0: 1', '1: 2', '2: 3', '3: 4', '4: 5']
```

## Filtering Methods

### filter

```javascript
// Filter array, returns new array with matching elements
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const evens = numbers.filter(n => n % 2 === 0);
// [2, 4, 6, 8, 10]

const products = [
  { name: 'Phone', price: 800 },
  { name: 'Tablet', price: 400 },
  { name: 'Laptop', price: 1200 }
];

const expensive = products.filter(p => p.price > 500);
// [{ name: 'Phone', ... }, { name: 'Laptop', ... }]

// Filter falsy values
const mixed = [0, 1, '', 'hello', null, undefined, false, true];
const truthy = mixed.filter(Boolean);
// [1, 'hello', true]
```

### find and findIndex

```javascript
// find: Returns first element matching condition
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
];

const user = users.find(u => u.id === 2);
// { id: 2, name: 'Bob' }

const notFound = users.find(u => u.id === 999);
// undefined

// findIndex: Returns index
const index = users.findIndex(u => u.name === 'Bob');
// 1

// findLast and findLastIndex (ES2023)
const numbers = [1, 2, 3, 4, 5, 4, 3];
const lastFour = numbers.findLast(n => n === 4);
// 4 (the second 4)
const lastFourIndex = numbers.findLastIndex(n => n === 4);
// 5
```

## Testing Methods

### includes

```javascript
// Check if array contains value
const fruits = ['apple', 'banana', 'orange'];

fruits.includes('banana');  // true
fruits.includes('grape');   // false

// From specific index
fruits.includes('apple', 1);  // false (starts from index 1)

// Note: Object comparison is by reference
const obj = { a: 1 };
const arr = [obj];
arr.includes(obj);          // true
arr.includes({ a: 1 });     // false (different reference)
```

### some and every

```javascript
// some: At least one matches condition
const numbers = [1, 2, 3, 4, 5];

numbers.some(n => n > 4);   // true
numbers.some(n => n > 10);  // false

// every: All match condition
numbers.every(n => n > 0);  // true
numbers.every(n => n > 3);  // false

// Practical examples
const users = [
  { name: 'Alice', active: true },
  { name: 'Bob', active: true }
];

const allActive = users.every(u => u.active);  // true
const hasInactive = users.some(u => !u.active);  // false
```

## Reduction Methods

### reduce

```javascript
// Reduce array to single value
const numbers = [1, 2, 3, 4, 5];

// Sum
const sum = numbers.reduce((acc, curr) => acc + curr, 0);
// 15

// Maximum value
const max = numbers.reduce((a, b) => Math.max(a, b));
// 5

// Convert to object
const items = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' }
];

const byId = items.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});
// { 1: { id: 1, name: 'Apple' }, 2: { id: 2, name: 'Banana' } }

// Flatten array
const nested = [[1, 2], [3, 4], [5]];
const flat = nested.reduce((acc, arr) => acc.concat(arr), []);
// [1, 2, 3, 4, 5]

// Count occurrences
const fruits = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];
const count = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});
// { apple: 3, banana: 2, orange: 1 }
```

### reduceRight

```javascript
// Reduce from right to left
const numbers = [1, 2, 3, 4, 5];

const result = numbers.reduceRight((acc, curr) => {
  console.log(`${acc} - ${curr}`);
  return acc - curr;
}, 0);
// 0 - 5 = -5
// -5 - 4 = -9
// -9 - 3 = -12
// -12 - 2 = -14
// -14 - 1 = -15
```

## Sorting Methods

### sort

```javascript
// In-place sort (modifies original array)
const numbers = [3, 1, 4, 1, 5, 9, 2, 6];

// Default sorts as strings
numbers.sort();  // [1, 1, 2, 3, 4, 5, 6, 9]

// Numeric sort
numbers.sort((a, b) => a - b);  // Ascending
numbers.sort((a, b) => b - a);  // Descending

// Object sorting
const users = [
  { name: 'Charlie', age: 30 },
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 35 }
];

users.sort((a, b) => a.age - b.age);  // By age ascending
users.sort((a, b) => a.name.localeCompare(b.name));  // By name alphabetically

// toSorted (ES2023) - Does not modify original
const sorted = numbers.toSorted((a, b) => a - b);
```

### reverse

```javascript
// Reverse array (modifies original)
const arr = [1, 2, 3, 4, 5];
arr.reverse();  // [5, 4, 3, 2, 1]

// toReversed (ES2023) - Does not modify original
const reversed = [1, 2, 3].toReversed();  // [3, 2, 1]
```

## Add and Remove Methods

### push and pop

```javascript
// push: Add to end, returns new length
const arr = [1, 2, 3];
const len = arr.push(4);     // arr: [1,2,3,4], len: 4
arr.push(5, 6);              // arr: [1,2,3,4,5,6]

// pop: Remove from end, returns removed element
const last = arr.pop();      // arr: [1,2,3,4,5], last: 6
```

### unshift and shift

```javascript
// unshift: Add to beginning
const arr = [1, 2, 3];
arr.unshift(0);              // arr: [0,1,2,3]
arr.unshift(-2, -1);         // arr: [-2,-1,0,1,2,3]

// shift: Remove from beginning
const first = arr.shift();   // arr: [-1,0,1,2,3], first: -2
```

### splice

```javascript
// splice: Remove/replace/add elements (modifies original)
const arr = [1, 2, 3, 4, 5];

// Remove elements
const removed = arr.splice(2, 2);  // arr: [1,2,5], removed: [3,4]

// Insert elements
arr.splice(2, 0, 'a', 'b');  // arr: [1,2,'a','b',5]

// Replace elements
arr.splice(2, 2, 'x');       // arr: [1,2,'x',5]

// toSpliced (ES2023) - Does not modify original
const newArr = [1, 2, 3, 4].toSpliced(1, 2, 'a');
// [1, 'a', 4]
```

## Combining and Transforming

### concat

```javascript
// Merge arrays
const arr1 = [1, 2];
const arr2 = [3, 4];
const arr3 = [5, 6];

const merged = arr1.concat(arr2, arr3);
// [1, 2, 3, 4, 5, 6]

// Using spread operator
const spread = [...arr1, ...arr2, ...arr3];
// [1, 2, 3, 4, 5, 6]
```

### flat and flatMap

```javascript
// flat: Flatten array
const nested = [1, [2, 3], [4, [5, 6]]];

nested.flat();      // [1, 2, 3, 4, [5, 6]]
nested.flat(2);     // [1, 2, 3, 4, 5, 6]
nested.flat(Infinity);  // Completely flatten

// flatMap: map + flat(1)
const sentences = ['Hello World', 'Good Morning'];

const words = sentences.flatMap(s => s.split(' '));
// ['Hello', 'World', 'Good', 'Morning']
```

### slice

```javascript
// Extract subarray (does not modify original)
const arr = [1, 2, 3, 4, 5];

arr.slice(1, 3);    // [2, 3]
arr.slice(2);       // [3, 4, 5]
arr.slice(-2);      // [4, 5]
arr.slice(-3, -1);  // [3, 4]

// Copy array
const copy = arr.slice();
```

## Method Chaining

```javascript
// Chain calls
const users = [
  { name: 'Alice', age: 25, active: true },
  { name: 'Bob', age: 30, active: false },
  { name: 'Charlie', age: 35, active: true },
  { name: 'Diana', age: 28, active: true }
];

const result = users
  .filter(user => user.active)           // Filter active users
  .filter(user => user.age >= 25)        // Filter by age
  .map(user => user.name)                // Extract names
  .sort();                               // Sort

// ['Alice', 'Charlie', 'Diana']
```

## Best Practices Summary

```
Array Method Selection Guide:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Iteration Choice                                  │
│   ├── Need new array → map                         │
│   ├── Just iterate → forEach                       │
│   └── Need to break → for...of                     │
│                                                     │
│   Search Choice                                     │
│   ├── Find element → find                          │
│   ├── Find index → findIndex                       │
│   └── Check existence → includes / some            │
│                                                     │
│   Prefer Immutable                                  │
│   ├── Use map/filter over forEach+push             │
│   ├── Use toSorted over sort                       │
│   └── Use toSpliced over splice                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Method | Returns | Mutates Original |
|--------|---------|------------------|
| map | New array | No |
| filter | New array | No |
| reduce | Single value | No |
| sort | Original array | Yes |
| splice | Removed elements | Yes |

---

*Master array methods for elegant data manipulation.*
