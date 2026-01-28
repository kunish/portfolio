---
title: 'JavaScript 解构与展开运算符详解'
description: '掌握数组解构、对象解构、剩余参数、展开运算符的各种用法'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'js-destructuring-spread'
---

解构和展开运算符是 ES6 最实用的特性。本文详解它们的各种用法和技巧。

## 数组解构

### 基本用法

```javascript
// 基本解构
const [a, b, c] = [1, 2, 3];
console.log(a, b, c);  // 1 2 3

// 跳过元素
const [first, , third] = [1, 2, 3];
console.log(first, third);  // 1 3

// 剩余元素
const [head, ...tail] = [1, 2, 3, 4, 5];
console.log(head);  // 1
console.log(tail);  // [2, 3, 4, 5]

// 默认值
const [x = 10, y = 20] = [1];
console.log(x, y);  // 1 20

// 嵌套解构
const [a1, [b1, b2], c1] = [1, [2, 3], 4];
console.log(a1, b1, b2, c1);  // 1 2 3 4
```

### 实用技巧

```javascript
// 交换变量
let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b);  // 2 1

// 函数返回多个值
function getMinMax(arr) {
  return [Math.min(...arr), Math.max(...arr)];
}

const [min, max] = getMinMax([3, 1, 4, 1, 5]);
console.log(min, max);  // 1 5

// 解构函数参数
function processArray([first, second, ...rest]) {
  console.log(first);   // 1
  console.log(second);  // 2
  console.log(rest);    // [3, 4, 5]
}

processArray([1, 2, 3, 4, 5]);

// 配合正则表达式
const url = 'https://example.com:8080/path';
const [, protocol, host, port] = url.match(/^(\w+):\/\/([^:]+):(\d+)/);
console.log(protocol, host, port);  // 'https' 'example.com' '8080'
```

## 对象解构

### 基本用法

```javascript
// 基本解构
const user = { name: 'Alice', age: 25 };
const { name, age } = user;
console.log(name, age);  // 'Alice' 25

// 重命名
const { name: userName, age: userAge } = user;
console.log(userName, userAge);  // 'Alice' 25

// 默认值
const { name: n, city = 'Unknown' } = user;
console.log(n, city);  // 'Alice' 'Unknown'

// 重命名 + 默认值
const { name: n2, city: c = 'NYC' } = user;
console.log(n2, c);  // 'Alice' 'NYC'

// 嵌套解构
const person = {
  name: 'Bob',
  address: {
    city: 'Tokyo',
    country: 'Japan'
  }
};

const { address: { city, country } } = person;
console.log(city, country);  // 'Tokyo' 'Japan'
```

### 剩余属性

```javascript
// 提取部分属性，收集其余
const user = {
  id: 1,
  name: 'Alice',
  age: 25,
  email: 'alice@example.com'
};

const { id, ...rest } = user;
console.log(id);    // 1
console.log(rest);  // { name: 'Alice', age: 25, email: '...' }

// 实用：移除对象属性
function removeField(obj, field) {
  const { [field]: _, ...rest } = obj;
  return rest;
}

removeField(user, 'email');
// { id: 1, name: 'Alice', age: 25 }
```

### 函数参数解构

```javascript
// 解构参数
function greet({ name, age }) {
  console.log(`Hello ${name}, you are ${age}`);
}

greet({ name: 'Alice', age: 25 });

// 带默认值
function createUser({
  name = 'Anonymous',
  age = 0,
  role = 'user'
} = {}) {
  return { name, age, role };
}

createUser();  // { name: 'Anonymous', age: 0, role: 'user' }
createUser({ name: 'Bob' });  // { name: 'Bob', age: 0, role: 'user' }

// 复杂默认值
function configure({
  host = 'localhost',
  port = 3000,
  ssl: {
    enabled = false,
    cert = null
  } = {}
} = {}) {
  return { host, port, ssl: { enabled, cert } };
}
```

## 展开运算符

### 数组展开

```javascript
// 合并数组
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const merged = [...arr1, ...arr2];
// [1, 2, 3, 4, 5, 6]

// 复制数组（浅拷贝）
const original = [1, 2, 3];
const copy = [...original];

// 在中间插入
const inserted = [...arr1.slice(0, 2), 'new', ...arr1.slice(2)];
// [1, 2, 'new', 3]

// 转换可迭代对象
const str = 'hello';
const chars = [...str];  // ['h', 'e', 'l', 'l', 'o']

const set = new Set([1, 2, 3]);
const arrFromSet = [...set];  // [1, 2, 3]

// 函数调用
const numbers = [1, 5, 3, 9, 2];
Math.max(...numbers);  // 9
```

### 对象展开

```javascript
// 合并对象
const defaults = { host: 'localhost', port: 3000 };
const options = { port: 8080, ssl: true };
const config = { ...defaults, ...options };
// { host: 'localhost', port: 8080, ssl: true }

// 复制对象（浅拷贝）
const original = { a: 1, b: 2 };
const copy = { ...original };

// 添加/覆盖属性
const user = { name: 'Alice', age: 25 };
const updatedUser = { ...user, age: 26, city: 'NYC' };
// { name: 'Alice', age: 26, city: 'NYC' }

// 条件展开
const condition = true;
const obj = {
  always: true,
  ...(condition && { sometimes: true })
};
// { always: true, sometimes: true }

// 或使用三元
const obj2 = {
  ...baseObj,
  ...(isAdmin ? adminProps : userProps)
};
```

## 剩余参数

### 函数参数

```javascript
// 收集所有参数
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}

sum(1, 2, 3, 4, 5);  // 15

// 结合固定参数
function log(level, ...messages) {
  console.log(`[${level}]`, ...messages);
}

log('INFO', 'User logged in', 'at 10:00');
// [INFO] User logged in at 10:00

// 替代 arguments
// 旧方式
function oldWay() {
  const args = Array.prototype.slice.call(arguments);
  return args.join(' ');
}

// 新方式（推荐）
function newWay(...args) {
  return args.join(' ');
}
```

### 解构中的剩余

```javascript
// 数组解构
const [first, second, ...others] = [1, 2, 3, 4, 5];
console.log(others);  // [3, 4, 5]

// 对象解构
const { a, b, ...remaining } = { a: 1, b: 2, c: 3, d: 4 };
console.log(remaining);  // { c: 3, d: 4 }
```

## 高级模式

### 动态属性解构

```javascript
const key = 'name';
const obj = { name: 'Alice', age: 25 };

// 计算属性名解构
const { [key]: value } = obj;
console.log(value);  // 'Alice'

// 实用函数
function pick(obj, ...keys) {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

pick(obj, 'name');  // { name: 'Alice' }
```

### 深度合并

```javascript
// 浅合并（展开运算符）
const merged = { ...obj1, ...obj2 };  // 嵌套对象被覆盖

// 深度合并函数
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] !== null &&
      typeof target[key] === 'object'
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

const obj1 = { a: 1, nested: { x: 1, y: 2 } };
const obj2 = { b: 2, nested: { y: 3, z: 4 } };

deepMerge(obj1, obj2);
// { a: 1, b: 2, nested: { x: 1, y: 3, z: 4 } }
```

### React 中的应用

```javascript
// Props 传递
function ParentComponent() {
  const commonProps = { className: 'common', onClick: handleClick };

  return <ChildComponent {...commonProps} id="child1" />;
}

// 状态更新
const [state, setState] = useState({ name: '', age: 0 });

setState(prev => ({ ...prev, name: 'Alice' }));

// 解构 props
function UserCard({ name, age, ...rest }) {
  return (
    <div {...rest}>
      <h2>{name}</h2>
      <p>Age: {age}</p>
    </div>
  );
}
```

## 最佳实践总结

```
解构与展开最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   解构使用                                          │
│   ├── 提取需要的属性，保持代码简洁                 │
│   ├── 函数参数使用解构增加可读性                   │
│   ├── 提供合理的默认值                             │
│   └── 避免过深的嵌套解构                           │
│                                                     │
│   展开使用                                          │
│   ├── 合并对象/数组时保持不可变                    │
│   ├── 注意是浅拷贝                                 │
│   ├── 条件展开使用 && 或三元                       │
│   └── 后面的属性会覆盖前面的                       │
│                                                     │
│   性能考虑                                          │
│   ├── 大对象展开有性能开销                         │
│   ├── 频繁展开考虑其他方案                         │
│   └── 深层嵌套需要深度合并                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 操作 | 语法 | 用途 |
|------|------|------|
| 数组解构 | `[a, b] = arr` | 提取数组元素 |
| 对象解构 | `{a, b} = obj` | 提取对象属性 |
| 展开数组 | `[...arr]` | 合并/复制数组 |
| 展开对象 | `{...obj}` | 合并/复制对象 |
| 剩余参数 | `...rest` | 收集剩余元素 |

---

*熟练运用解构和展开，让代码更加简洁优雅。*
