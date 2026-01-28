---
title: 'JavaScript 数组方法完全指南'
description: '掌握数组遍历、转换、过滤、查找、排序等常用方法及最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'js-array-methods'
---

数组是 JavaScript 中最常用的数据结构。本文详解所有常用数组方法。

## 遍历方法

### forEach

```javascript
// 遍历数组，无返回值
const numbers = [1, 2, 3, 4, 5];

numbers.forEach((value, index, array) => {
  console.log(`索引 ${index}: ${value}`);
});

// 注意：无法中断 forEach
// 需要中断时使用 for...of 或普通 for 循环
```

### map

```javascript
// 转换数组，返回新数组
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8, 10]

const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 }
];

const names = users.map(user => user.name);
// ['Alice', 'Bob']

// 带索引
const indexed = numbers.map((n, i) => `${i}: ${n}`);
// ['0: 1', '1: 2', '2: 3', '3: 4', '4: 5']
```

## 过滤方法

### filter

```javascript
// 过滤数组，返回满足条件的新数组
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

// 过滤假值
const mixed = [0, 1, '', 'hello', null, undefined, false, true];
const truthy = mixed.filter(Boolean);
// [1, 'hello', true]
```

### find 和 findIndex

```javascript
// find: 返回第一个满足条件的元素
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
];

const user = users.find(u => u.id === 2);
// { id: 2, name: 'Bob' }

const notFound = users.find(u => u.id === 999);
// undefined

// findIndex: 返回索引
const index = users.findIndex(u => u.name === 'Bob');
// 1

// findLast 和 findLastIndex (ES2023)
const numbers = [1, 2, 3, 4, 5, 4, 3];
const lastFour = numbers.findLast(n => n === 4);
// 4 (第二个4)
const lastFourIndex = numbers.findLastIndex(n => n === 4);
// 5
```

## 判断方法

### includes

```javascript
// 检查数组是否包含某值
const fruits = ['apple', 'banana', 'orange'];

fruits.includes('banana');  // true
fruits.includes('grape');   // false

// 从指定索引开始
fruits.includes('apple', 1);  // false (从索引1开始查)

// 注意：对象比较是引用比较
const obj = { a: 1 };
const arr = [obj];
arr.includes(obj);          // true
arr.includes({ a: 1 });     // false (不同引用)
```

### some 和 every

```javascript
// some: 至少有一个满足条件
const numbers = [1, 2, 3, 4, 5];

numbers.some(n => n > 4);   // true
numbers.some(n => n > 10);  // false

// every: 所有都满足条件
numbers.every(n => n > 0);  // true
numbers.every(n => n > 3);  // false

// 实用示例
const users = [
  { name: 'Alice', active: true },
  { name: 'Bob', active: true }
];

const allActive = users.every(u => u.active);  // true
const hasInactive = users.some(u => !u.active);  // false
```

## 归约方法

### reduce

```javascript
// 将数组归约为单个值
const numbers = [1, 2, 3, 4, 5];

// 求和
const sum = numbers.reduce((acc, curr) => acc + curr, 0);
// 15

// 求最大值
const max = numbers.reduce((a, b) => Math.max(a, b));
// 5

// 转换为对象
const items = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' }
];

const byId = items.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});
// { 1: { id: 1, name: 'Apple' }, 2: { id: 2, name: 'Banana' } }

// 扁平化数组
const nested = [[1, 2], [3, 4], [5]];
const flat = nested.reduce((acc, arr) => acc.concat(arr), []);
// [1, 2, 3, 4, 5]

// 计数
const fruits = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];
const count = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});
// { apple: 3, banana: 2, orange: 1 }
```

### reduceRight

```javascript
// 从右向左归约
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

## 排序方法

### sort

```javascript
// 原地排序（会修改原数组）
const numbers = [3, 1, 4, 1, 5, 9, 2, 6];

// 默认按字符串排序
numbers.sort();  // [1, 1, 2, 3, 4, 5, 6, 9]

// 数字排序
numbers.sort((a, b) => a - b);  // 升序
numbers.sort((a, b) => b - a);  // 降序

// 对象排序
const users = [
  { name: 'Charlie', age: 30 },
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 35 }
];

users.sort((a, b) => a.age - b.age);  // 按年龄升序
users.sort((a, b) => a.name.localeCompare(b.name));  // 按名字字母序

// toSorted (ES2023) - 不修改原数组
const sorted = numbers.toSorted((a, b) => a - b);
```

### reverse

```javascript
// 反转数组（修改原数组）
const arr = [1, 2, 3, 4, 5];
arr.reverse();  // [5, 4, 3, 2, 1]

// toReversed (ES2023) - 不修改原数组
const reversed = [1, 2, 3].toReversed();  // [3, 2, 1]
```

## 添加删除方法

### push 和 pop

```javascript
// push: 末尾添加，返回新长度
const arr = [1, 2, 3];
const len = arr.push(4);     // arr: [1,2,3,4], len: 4
arr.push(5, 6);              // arr: [1,2,3,4,5,6]

// pop: 删除末尾元素，返回删除的元素
const last = arr.pop();      // arr: [1,2,3,4,5], last: 6
```

### unshift 和 shift

```javascript
// unshift: 开头添加
const arr = [1, 2, 3];
arr.unshift(0);              // arr: [0,1,2,3]
arr.unshift(-2, -1);         // arr: [-2,-1,0,1,2,3]

// shift: 删除开头元素
const first = arr.shift();   // arr: [-1,0,1,2,3], first: -2
```

### splice

```javascript
// splice: 删除/替换/添加元素（修改原数组）
const arr = [1, 2, 3, 4, 5];

// 删除元素
const removed = arr.splice(2, 2);  // arr: [1,2,5], removed: [3,4]

// 插入元素
arr.splice(2, 0, 'a', 'b');  // arr: [1,2,'a','b',5]

// 替换元素
arr.splice(2, 2, 'x');       // arr: [1,2,'x',5]

// toSpliced (ES2023) - 不修改原数组
const newArr = [1, 2, 3, 4].toSpliced(1, 2, 'a');
// [1, 'a', 4]
```

## 合并与转换

### concat

```javascript
// 合并数组
const arr1 = [1, 2];
const arr2 = [3, 4];
const arr3 = [5, 6];

const merged = arr1.concat(arr2, arr3);
// [1, 2, 3, 4, 5, 6]

// 使用展开运算符
const spread = [...arr1, ...arr2, ...arr3];
// [1, 2, 3, 4, 5, 6]
```

### flat 和 flatMap

```javascript
// flat: 扁平化数组
const nested = [1, [2, 3], [4, [5, 6]]];

nested.flat();      // [1, 2, 3, 4, [5, 6]]
nested.flat(2);     // [1, 2, 3, 4, 5, 6]
nested.flat(Infinity);  // 完全扁平化

// flatMap: map + flat(1)
const sentences = ['Hello World', 'Good Morning'];

const words = sentences.flatMap(s => s.split(' '));
// ['Hello', 'World', 'Good', 'Morning']
```

### slice

```javascript
// 提取子数组（不修改原数组）
const arr = [1, 2, 3, 4, 5];

arr.slice(1, 3);    // [2, 3]
arr.slice(2);       // [3, 4, 5]
arr.slice(-2);      // [4, 5]
arr.slice(-3, -1);  // [3, 4]

// 复制数组
const copy = arr.slice();
```

## 方法链

```javascript
// 链式调用
const users = [
  { name: 'Alice', age: 25, active: true },
  { name: 'Bob', age: 30, active: false },
  { name: 'Charlie', age: 35, active: true },
  { name: 'Diana', age: 28, active: true }
];

const result = users
  .filter(user => user.active)           // 过滤活跃用户
  .filter(user => user.age >= 25)        // 过滤年龄
  .map(user => user.name)                // 提取名字
  .sort();                               // 排序

// ['Alice', 'Charlie', 'Diana']
```

## 最佳实践总结

```
数组方法选择指南：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   遍历选择                                          │
│   ├── 需要返回新数组 → map                         │
│   ├── 只需遍历 → forEach                           │
│   └── 需要中断 → for...of                          │
│                                                     │
│   查找选择                                          │
│   ├── 查找元素 → find                              │
│   ├── 查找索引 → findIndex                         │
│   └── 检查存在 → includes / some                   │
│                                                     │
│   不可变优先                                        │
│   ├── 使用 map/filter 代替 forEach+push            │
│   ├── 使用 toSorted 代替 sort                      │
│   └── 使用 toSpliced 代替 splice                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 方法 | 返回值 | 是否修改原数组 |
|------|--------|----------------|
| map | 新数组 | 否 |
| filter | 新数组 | 否 |
| reduce | 单个值 | 否 |
| sort | 原数组 | 是 |
| splice | 删除的元素 | 是 |

---

*熟练掌握数组方法，让数据处理更加优雅。*
