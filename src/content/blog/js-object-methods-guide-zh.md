---
title: 'JavaScript 对象方法完全指南'
description: '掌握 Object 静态方法、属性操作、对象遍历及实用技巧'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'js-object-methods-guide'
---

对象是 JavaScript 的核心数据结构。本文详解对象操作的各种方法和技巧。

## 创建对象

### 基本方式

```javascript
// 字面量（最常用）
const obj = { name: 'Alice', age: 25 };

// 构造函数
const obj2 = new Object();
obj2.name = 'Bob';

// Object.create（指定原型）
const proto = { greet() { return `Hello, ${this.name}`; } };
const obj3 = Object.create(proto);
obj3.name = 'Charlie';
obj3.greet();  // 'Hello, Charlie'

// Object.create(null)（无原型对象）
const pureObj = Object.create(null);
// pureObj.toString  // undefined
```

### Object.assign

```javascript
// 合并对象
const target = { a: 1 };
const source = { b: 2, c: 3 };
Object.assign(target, source);
// target = { a: 1, b: 2, c: 3 }

// 合并多个对象
const merged = Object.assign({}, obj1, obj2, obj3);

// 浅拷贝
const copy = Object.assign({}, original);

// 后面的属性覆盖前面的
const defaults = { host: 'localhost', port: 3000 };
const options = { port: 8080 };
const config = Object.assign({}, defaults, options);
// { host: 'localhost', port: 8080 }

// 注意：只复制可枚举自身属性
```

### Object.fromEntries

```javascript
// 从键值对数组创建对象
const entries = [['name', 'Alice'], ['age', 25]];
const obj = Object.fromEntries(entries);
// { name: 'Alice', age: 25 }

// 从 Map 创建对象
const map = new Map([['a', 1], ['b', 2]]);
const fromMap = Object.fromEntries(map);
// { a: 1, b: 2 }

// 配合 Object.entries 转换对象
const original = { a: 1, b: 2, c: 3 };
const doubled = Object.fromEntries(
  Object.entries(original).map(([k, v]) => [k, v * 2])
);
// { a: 2, b: 4, c: 6 }
```

## 属性操作

### 属性访问

```javascript
const obj = { name: 'Alice', 'full-name': 'Alice Smith' };

// 点语法
obj.name;  // 'Alice'

// 方括号语法（支持动态键名）
obj['name'];           // 'Alice'
obj['full-name'];      // 'Alice Smith'

const key = 'name';
obj[key];              // 'Alice'

// 可选链
const user = { address: { city: 'NYC' } };
user?.address?.city;   // 'NYC'
user?.contact?.email;  // undefined（不报错）
```

### 属性检查

```javascript
const obj = { name: 'Alice', age: 25 };

// in 操作符（包含继承属性）
'name' in obj;       // true
'toString' in obj;   // true

// hasOwnProperty（仅自身属性）
obj.hasOwnProperty('name');     // true
obj.hasOwnProperty('toString'); // false

// Object.hasOwn（ES2022，推荐）
Object.hasOwn(obj, 'name');     // true
Object.hasOwn(obj, 'toString'); // false

// 检查属性值
obj.email !== undefined;  // 不可靠
'email' in obj;           // 可靠
```

### 属性定义

```javascript
const obj = {};

// Object.defineProperty（单个属性）
Object.defineProperty(obj, 'name', {
  value: 'Alice',
  writable: true,      // 可写
  enumerable: true,    // 可枚举
  configurable: true   // 可配置
});

// Object.defineProperties（多个属性）
Object.defineProperties(obj, {
  name: {
    value: 'Alice',
    writable: true
  },
  age: {
    value: 25,
    writable: false  // 只读
  }
});

// getter 和 setter
Object.defineProperty(obj, 'fullName', {
  get() {
    return `${this.firstName} ${this.lastName}`;
  },
  set(value) {
    [this.firstName, this.lastName] = value.split(' ');
  }
});
```

### 属性描述符

```javascript
const obj = { name: 'Alice' };

// 获取单个属性描述符
Object.getOwnPropertyDescriptor(obj, 'name');
// { value: 'Alice', writable: true, enumerable: true, configurable: true }

// 获取所有属性描述符
Object.getOwnPropertyDescriptors(obj);
// { name: { value: 'Alice', writable: true, ... } }

// 完整复制对象（包括描述符）
const clone = Object.defineProperties(
  {},
  Object.getOwnPropertyDescriptors(original)
);
```

## 对象遍历

### Object.keys / values / entries

```javascript
const obj = { a: 1, b: 2, c: 3 };

// 获取键数组
Object.keys(obj);    // ['a', 'b', 'c']

// 获取值数组
Object.values(obj);  // [1, 2, 3]

// 获取键值对数组
Object.entries(obj); // [['a', 1], ['b', 2], ['c', 3]]

// 遍历对象
Object.entries(obj).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

// 使用 for...of
for (const [key, value] of Object.entries(obj)) {
  console.log(`${key}: ${value}`);
}
```

### for...in 循环

```javascript
const obj = { a: 1, b: 2 };

// for...in 遍历（包含继承的可枚举属性）
for (const key in obj) {
  console.log(key, obj[key]);
}

// 仅遍历自身属性
for (const key in obj) {
  if (Object.hasOwn(obj, key)) {
    console.log(key, obj[key]);
  }
}
```

### 获取属性名

```javascript
const sym = Symbol('id');
const obj = {
  name: 'Alice',
  [sym]: 123
};

Object.defineProperty(obj, 'hidden', {
  value: 'secret',
  enumerable: false
});

// 可枚举自身属性
Object.keys(obj);                  // ['name']

// 所有自身属性（包含不可枚举）
Object.getOwnPropertyNames(obj);   // ['name', 'hidden']

// Symbol 属性
Object.getOwnPropertySymbols(obj); // [Symbol(id)]

// 所有自身属性（字符串 + Symbol）
Reflect.ownKeys(obj);              // ['name', 'hidden', Symbol(id)]
```

## 对象保护

### Object.freeze

```javascript
const obj = { name: 'Alice', address: { city: 'NYC' } };

// 冻结对象（不可修改、添加、删除属性）
Object.freeze(obj);

obj.name = 'Bob';     // 静默失败（严格模式报错）
obj.age = 25;         // 不会添加
delete obj.name;      // 不会删除

console.log(obj.name);  // 'Alice'

// 检查是否冻结
Object.isFrozen(obj);   // true

// 注意：浅冻结
obj.address.city = 'LA';  // 仍可修改
console.log(obj.address.city);  // 'LA'

// 深冻结函数
function deepFreeze(obj) {
  Object.freeze(obj);
  Object.values(obj).forEach(value => {
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  });
  return obj;
}
```

### Object.seal

```javascript
const obj = { name: 'Alice' };

// 密封对象（可修改，不可添加/删除）
Object.seal(obj);

obj.name = 'Bob';     // OK
obj.age = 25;         // 不会添加
delete obj.name;      // 不会删除

// 检查是否密封
Object.isSealed(obj);  // true
```

### Object.preventExtensions

```javascript
const obj = { name: 'Alice' };

// 禁止扩展（可修改/删除，不可添加）
Object.preventExtensions(obj);

obj.name = 'Bob';     // OK
delete obj.name;      // OK
obj.age = 25;         // 不会添加

// 检查是否可扩展
Object.isExtensible(obj);  // false
```

### 保护级别对比

```
对象保护级别：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   方法              添加  删除  修改  配置属性     │
│   ├── preventExtensions  ✗     ✓     ✓     ✓       │
│   ├── seal              ✗     ✗     ✓     ✗       │
│   └── freeze            ✗     ✗     ✗     ✗       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 对象比较

### 相等性判断

```javascript
// Object.is（严格相等，处理特殊情况）
Object.is(1, 1);              // true
Object.is(NaN, NaN);          // true（=== 为 false）
Object.is(0, -0);             // false（=== 为 true）

// === 严格相等
1 === 1;      // true
NaN === NaN;  // false
0 === -0;     // true

// 对象引用比较
const obj1 = { a: 1 };
const obj2 = { a: 1 };
obj1 === obj2;        // false（不同引用）

const obj3 = obj1;
obj1 === obj3;        // true（相同引用）
```

### 深度比较

```javascript
// 简单深度比较
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }

  if (obj1 === null || obj2 === null) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(key =>
    Object.hasOwn(obj2, key) && deepEqual(obj1[key], obj2[key])
  );
}

// 使用
deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } });  // true
```

## 实用技巧

### 对象解构

```javascript
const user = { name: 'Alice', age: 25, city: 'NYC' };

// 基本解构
const { name, age } = user;

// 重命名
const { name: userName } = user;

// 默认值
const { country = 'USA' } = user;

// 剩余属性
const { name, ...rest } = user;
// rest = { age: 25, city: 'NYC' }
```

### 条件属性

```javascript
const condition = true;

// 条件添加属性
const obj = {
  always: true,
  ...(condition && { sometimes: true })
};

// 或使用三元
const obj2 = {
  ...(condition ? { a: 1 } : { b: 2 })
};
```

### 动态键名

```javascript
const key = 'name';
const value = 'Alice';

// 计算属性名
const obj = {
  [key]: value,
  [`${key}Length`]: value.length
};
// { name: 'Alice', nameLength: 5 }
```

### 对象方法简写

```javascript
// ES6 方法简写
const obj = {
  name: 'Alice',

  // 方法简写
  greet() {
    return `Hello, ${this.name}`;
  },

  // getter/setter
  get upperName() {
    return this.name.toUpperCase();
  },

  set lowerName(value) {
    this.name = value.toLowerCase();
  }
};
```

### 移除属性

```javascript
const obj = { a: 1, b: 2, c: 3 };

// delete 操作符
delete obj.a;

// 解构方式（不修改原对象）
const { b, ...rest } = obj;
// rest = { a: 1, c: 3 }

// 过滤多个属性
const omit = (obj, keys) => Object.fromEntries(
  Object.entries(obj).filter(([k]) => !keys.includes(k))
);

omit(obj, ['a', 'b']);  // { c: 3 }
```

## 最佳实践总结

```
对象操作最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   创建与复制                                        │
│   ├── 优先使用字面量创建对象                       │
│   ├── 使用展开运算符浅拷贝                         │
│   └── 深拷贝使用 structuredClone 或库              │
│                                                     │
│   属性操作                                          │
│   ├── 使用 Object.hasOwn 检查自身属性              │
│   ├── 使用可选链安全访问嵌套属性                   │
│   └── 使用解构简化属性提取                         │
│                                                     │
│   遍历选择                                          │
│   ├── Object.keys/values/entries 最常用            │
│   ├── 避免 for...in（会遍历继承属性）              │
│   └── Reflect.ownKeys 获取所有键                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 方法 | 用途 | 返回值 |
|------|------|--------|
| Object.keys | 获取键 | 字符串数组 |
| Object.values | 获取值 | 值数组 |
| Object.entries | 获取键值对 | 二维数组 |
| Object.assign | 合并对象 | 目标对象 |

---

*掌握对象方法，高效操作 JavaScript 数据结构。*
