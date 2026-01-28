---
title: 'JavaScript Map 和 Set 完全指南'
description: '掌握 ES6 集合类型 Map、Set、WeakMap、WeakSet 的使用方法和最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'js-map-set-guide'
---

ES6 引入的 Map 和 Set 提供了更强大的数据结构。本文详解这些集合类型的使用方法。

## Set 集合

### 基本操作

```javascript
// 创建 Set
const set = new Set();
const setFromArray = new Set([1, 2, 3, 3, 4]);  // 自动去重

// 添加元素
set.add(1);
set.add(2);
set.add(2);  // 忽略重复值
set.add('hello');
set.add({ name: 'Alice' });

// 链式调用
set.add(3).add(4).add(5);

// 检查存在
set.has(1);   // true
set.has(10);  // false

// 删除元素
set.delete(1);  // 返回 true/false

// 清空
set.clear();

// 大小
set.size;  // 0
```

### 遍历方法

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

// 迭代器方法
set.keys();    // SetIterator {'a', 'b', 'c'}
set.values();  // SetIterator {'a', 'b', 'c'}
set.entries(); // SetIterator {'a' => 'a', 'b' => 'b', 'c' => 'c'}

// 转为数组
const arr = [...set];
const arr2 = Array.from(set);
```

### 实用场景

```javascript
// 数组去重
const arr = [1, 2, 2, 3, 3, 3, 4];
const unique = [...new Set(arr)];  // [1, 2, 3, 4]

// 集合运算
const setA = new Set([1, 2, 3, 4]);
const setB = new Set([3, 4, 5, 6]);

// 并集
const union = new Set([...setA, ...setB]);
// Set {1, 2, 3, 4, 5, 6}

// 交集
const intersection = new Set(
  [...setA].filter(x => setB.has(x))
);
// Set {3, 4}

// 差集
const difference = new Set(
  [...setA].filter(x => !setB.has(x))
);
// Set {1, 2}

// 对称差集
const symmetricDiff = new Set(
  [...setA].filter(x => !setB.has(x)).concat(
    [...setB].filter(x => !setA.has(x))
  )
);
// Set {1, 2, 5, 6}
```

## Map 集合

### 基本操作

```javascript
// 创建 Map
const map = new Map();
const mapFromEntries = new Map([
  ['key1', 'value1'],
  ['key2', 'value2']
]);

// 设置键值对
map.set('name', 'Alice');
map.set(123, 'number key');
map.set({ id: 1 }, 'object key');

// 链式调用
map.set('a', 1).set('b', 2).set('c', 3);

// 获取值
map.get('name');  // 'Alice'
map.get('xxx');   // undefined

// 检查存在
map.has('name');  // true

// 删除
map.delete('name');  // 返回 true/false

// 清空
map.clear();

// 大小
map.size;
```

### 遍历方法

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

// 迭代器方法
map.keys();    // MapIterator {'a', 'b', 'c'}
map.values();  // MapIterator {1, 2, 3}
map.entries(); // MapIterator {'a' => 1, 'b' => 2, 'c' => 3}

// 转换
const arr = [...map];              // [['a', 1], ['b', 2], ['c', 3]]
const obj = Object.fromEntries(map);  // { a: 1, b: 2, c: 3 }
```

### Map vs Object

```
Map vs Object 对比：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   键类型                                            │
│   ├── Map: 任意类型（对象、函数等）                │
│   └── Object: 字符串或 Symbol                      │
│                                                     │
│   顺序                                              │
│   ├── Map: 保持插入顺序                            │
│   └── Object: 不保证顺序（整数键除外）             │
│                                                     │
│   大小                                              │
│   ├── Map: size 属性                               │
│   └── Object: 需要 Object.keys().length            │
│                                                     │
│   性能                                              │
│   ├── Map: 频繁增删性能更好                        │
│   └── Object: 静态结构查询更快                     │
│                                                     │
│   序列化                                            │
│   ├── Map: 不支持 JSON 直接序列化                  │
│   └── Object: 原生支持 JSON                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```javascript
// 对象作为键
const userRoles = new Map();
const user1 = { id: 1, name: 'Alice' };
const user2 = { id: 2, name: 'Bob' };

userRoles.set(user1, 'admin');
userRoles.set(user2, 'user');

userRoles.get(user1);  // 'admin'

// 使用对象就做不到这点
const objRoles = {};
objRoles[user1] = 'admin';  // 键变成 '[object Object]'
objRoles[user2] = 'user';   // 覆盖了上一个
```

## WeakSet

### 特点和用法

```javascript
// WeakSet 只能存储对象引用
const weakSet = new WeakSet();

const obj1 = { a: 1 };
const obj2 = { b: 2 };

weakSet.add(obj1);
weakSet.add(obj2);

weakSet.has(obj1);  // true
weakSet.delete(obj1);

// 不能添加原始值
// weakSet.add(1);  // TypeError

// 弱引用：对象没有其他引用时会被垃圾回收
let temp = { c: 3 };
weakSet.add(temp);
temp = null;  // 对象可能被回收

// 不可迭代
// weakSet.forEach(...)  // 不存在
// [...weakSet]          // 不支持
```

### 实用场景

```javascript
// 标记对象（如已处理过的DOM节点）
const processedNodes = new WeakSet();

function processNode(node) {
  if (processedNodes.has(node)) {
    return;  // 已处理过
  }

  // 处理节点
  doSomething(node);
  processedNodes.add(node);
}

// 私有数据
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

### 特点和用法

```javascript
// WeakMap 键必须是对象
const weakMap = new WeakMap();

const key1 = { id: 1 };
const key2 = { id: 2 };

weakMap.set(key1, 'value1');
weakMap.set(key2, 'value2');

weakMap.get(key1);   // 'value1'
weakMap.has(key2);   // true
weakMap.delete(key1);

// 不能使用原始值作为键
// weakMap.set('key', 'value');  // TypeError

// 弱引用键
let tempKey = { id: 3 };
weakMap.set(tempKey, 'value3');
tempKey = null;  // 键值对可能被回收
```

### 实用场景

```javascript
// 存储私有数据
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
// 无法从外部访问私有数据

// 缓存计算结果
const cache = new WeakMap();

function expensiveComputation(obj) {
  if (cache.has(obj)) {
    return cache.get(obj);
  }

  const result = /* 复杂计算 */ obj.value * 2;
  cache.set(obj, result);
  return result;
}

// 关联DOM元素数据
const elementData = new WeakMap();

function setElementData(element, data) {
  elementData.set(element, data);
}

function getElementData(element) {
  return elementData.get(element);
}

// 元素删除后，关联数据自动释放
```

## 性能对比

```javascript
// 大量数据操作性能测试
const size = 100000;

// 数组查找 O(n)
const arr = Array.from({ length: size }, (_, i) => i);
console.time('Array includes');
arr.includes(size - 1);
console.timeEnd('Array includes');

// Set 查找 O(1)
const set = new Set(arr);
console.time('Set has');
set.has(size - 1);
console.timeEnd('Set has');

// Object 查找 O(1)
const obj = Object.fromEntries(arr.map(i => [i, true]));
console.time('Object lookup');
obj[size - 1];
console.timeEnd('Object lookup');

// Map 查找 O(1)
const map = new Map(arr.map(i => [i, true]));
console.time('Map get');
map.get(size - 1);
console.timeEnd('Map get');
```

## 最佳实践总结

```
集合类型选择指南：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   使用 Set                                          │
│   ├── 需要存储唯一值                               │
│   ├── 快速检查元素存在                             │
│   └── 集合运算（交集、并集等）                     │
│                                                     │
│   使用 Map                                          │
│   ├── 键不是字符串                                 │
│   ├── 需要保持插入顺序                             │
│   └── 频繁增删键值对                               │
│                                                     │
│   使用 WeakSet/WeakMap                              │
│   ├── 避免内存泄漏                                 │
│   ├── 存储对象的关联数据                           │
│   └── 实现私有属性                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 类型 | 键类型 | 可迭代 | 弱引用 |
|------|--------|--------|--------|
| Set | - | 是 | 否 |
| Map | 任意 | 是 | 否 |
| WeakSet | 对象 | 否 | 是 |
| WeakMap | 对象 | 否 | 是 |

---

*合理使用集合类型，让数据管理更加高效。*
