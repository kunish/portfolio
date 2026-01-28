---
title: 'JavaScript 闭包与作用域深度解析'
description: '理解词法作用域、闭包原理、变量提升和常见应用模式'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'js-closure-scope'
---

闭包是 JavaScript 最强大也最容易误解的特性之一。本文深入解析其工作原理。

## 作用域基础

### 词法作用域

```javascript
// 词法作用域：变量的作用域由代码书写位置决定
const globalVar = 'global';

function outer() {
  const outerVar = 'outer';

  function inner() {
    const innerVar = 'inner';
    // inner 可以访问所有外层变量
    console.log(globalVar);  // "global"
    console.log(outerVar);   // "outer"
    console.log(innerVar);   // "inner"
  }

  inner();
  // console.log(innerVar);  // ReferenceError
}

outer();
```

### 作用域链

```
作用域链查找过程：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   变量查找顺序：                                    │
│                                                     │
│   1. 当前作用域 → 找到则使用                       │
│         ↓ 未找到                                    │
│   2. 外层作用域 → 找到则使用                       │
│         ↓ 未找到                                    │
│   3. 继续向外 → 直到全局作用域                     │
│         ↓ 未找到                                    │
│   4. ReferenceError                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```javascript
const a = 1;

function first() {
  const b = 2;

  function second() {
    const c = 3;

    function third() {
      // 作用域链: third → second → first → global
      console.log(a, b, c);  // 1 2 3
    }
    third();
  }
  second();
}
first();
```

## 变量声明

### var vs let vs const

```javascript
// var - 函数作用域，有变量提升
function varExample() {
  console.log(x);  // undefined（已提升但未赋值）
  var x = 1;
  console.log(x);  // 1

  if (true) {
    var x = 2;  // 同一个变量
  }
  console.log(x);  // 2
}

// let - 块级作用域，暂时性死区
function letExample() {
  // console.log(y);  // ReferenceError: 暂时性死区
  let y = 1;
  console.log(y);  // 1

  if (true) {
    let y = 2;  // 新的变量
    console.log(y);  // 2
  }
  console.log(y);  // 1
}

// const - 块级作用域，不可重新赋值
function constExample() {
  const z = 1;
  // z = 2;  // TypeError: 不可重新赋值

  const obj = { a: 1 };
  obj.a = 2;  // OK：可以修改对象属性
  // obj = {};  // TypeError: 不可重新赋值
}
```

### 变量提升

```javascript
// 函数声明完全提升
hoistedFunc();  // "works!"

function hoistedFunc() {
  console.log('works!');
}

// 函数表达式不会完全提升
// notHoisted();  // TypeError: notHoisted is not a function
var notHoisted = function() {
  console.log('not hoisted');
};

// var 声明提升，但赋值不提升
console.log(hoistedVar);  // undefined
var hoistedVar = 'value';

// let/const 存在暂时性死区
// console.log(blockScoped);  // ReferenceError
let blockScoped = 'value';
```

## 闭包详解

### 什么是闭包

```javascript
// 闭包：函数能够记住并访问其词法作用域，
// 即使函数在其词法作用域之外执行

function createCounter() {
  let count = 0;  // 私有变量

  return function() {
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter());  // 1
console.log(counter());  // 2
console.log(counter());  // 3

// count 变量被"封闭"在闭包中
// 外部无法直接访问
```

### 闭包工作原理

```
闭包的内存结构：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   createCounter 执行完毕后：                        │
│                                                     │
│   ┌──────────────────────┐                         │
│   │ 闭包作用域           │                         │
│   │  count: 0            │ ←── 被保持引用          │
│   └──────────────────────┘                         │
│            ↑                                        │
│   ┌──────────────────────┐                         │
│   │ 返回的函数           │                         │
│   │  [[Scope]] ──────────┼───→ 闭包作用域          │
│   └──────────────────────┘                         │
│            ↓                                        │
│   const counter = 返回的函数                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 多个闭包共享

```javascript
function createPerson(name) {
  let age = 0;

  return {
    getName() {
      return name;
    },
    getAge() {
      return age;
    },
    birthday() {
      age++;
    }
  };
}

const person = createPerson('Alice');
console.log(person.getName());  // "Alice"
console.log(person.getAge());   // 0
person.birthday();
console.log(person.getAge());   // 1

// 三个方法共享同一个闭包作用域
```

## 常见应用模式

### 模块模式

```javascript
const Calculator = (function() {
  // 私有变量
  let result = 0;

  // 私有方法
  function validate(n) {
    return typeof n === 'number' && !isNaN(n);
  }

  // 公共 API
  return {
    add(n) {
      if (validate(n)) result += n;
      return this;
    },
    subtract(n) {
      if (validate(n)) result -= n;
      return this;
    },
    getResult() {
      return result;
    },
    reset() {
      result = 0;
      return this;
    }
  };
})();

Calculator.add(5).add(3).subtract(2);
console.log(Calculator.getResult());  // 6
```

### 函数工厂

```javascript
// 创建带有预设配置的函数
function createMultiplier(multiplier) {
  return function(value) {
    return value * multiplier;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15

// 实际应用：创建格式化函数
function createFormatter(prefix, suffix = '') {
  return function(value) {
    return `${prefix}${value}${suffix}`;
  };
}

const formatCurrency = createFormatter('$');
const formatPercent = createFormatter('', '%');

console.log(formatCurrency(100));  // "$100"
console.log(formatPercent(50));    // "50%"
```

### 记忆化 (Memoization)

```javascript
function memoize(fn) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log('From cache');
      return cache.get(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// 使用
const expensiveCalc = memoize((n) => {
  console.log('Computing...');
  return n * n;
});

expensiveCalc(5);  // Computing... 25
expensiveCalc(5);  // From cache 25
expensiveCalc(6);  // Computing... 36
```

### 防抖与节流

```javascript
// 防抖：等待停止触发后执行
function debounce(fn, delay) {
  let timeoutId = null;

  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 节流：固定间隔执行
function throttle(fn, interval) {
  let lastTime = 0;

  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// 使用
const handleSearch = debounce((query) => {
  console.log('Searching:', query);
}, 300);

const handleScroll = throttle(() => {
  console.log('Scrolled at:', Date.now());
}, 100);
```

## 常见陷阱

### 循环中的闭包

```javascript
// 问题：所有回调共享同一个 i
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);  // 3, 3, 3
  }, 100);
}

// 解决方案 1：使用 let
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);  // 0, 1, 2
  }, 100);
}

// 解决方案 2：使用 IIFE
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => {
      console.log(j);  // 0, 1, 2
    }, 100);
  })(i);
}

// 解决方案 3：使用 forEach
[0, 1, 2].forEach((i) => {
  setTimeout(() => {
    console.log(i);  // 0, 1, 2
  }, 100);
});
```

### 内存泄漏

```javascript
// 可能导致内存泄漏的闭包
function createLeak() {
  const largeData = new Array(1000000).fill('data');

  return function() {
    // 只使用 largeData 的一小部分
    return largeData[0];
  };
}

const leak = createLeak();
// largeData 整个数组都被保持在内存中

// 解决：只保留需要的数据
function noLeak() {
  const largeData = new Array(1000000).fill('data');
  const firstItem = largeData[0];

  return function() {
    return firstItem;
  };
}
```

## 最佳实践总结

```
闭包使用指南：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   适合使用闭包的场景                                │
│   ├── 数据私有化（模块模式）                       │
│   ├── 函数工厂                                     │
│   ├── 回调函数和事件处理                           │
│   └── 部分应用和柯里化                             │
│                                                     │
│   注意事项                                          │
│   ├── 避免不必要的大对象引用                       │
│   ├── 循环中使用 let 而非 var                      │
│   ├── 及时清理不再需要的闭包                       │
│   └── 注意 this 绑定问题                           │
│                                                     │
│   性能考虑                                          │
│   ├── 闭包会占用额外内存                           │
│   ├── 过度使用会影响性能                           │
│   └── 适当使用记忆化优化                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 概念 | 说明 |
|------|------|
| 词法作用域 | 由代码书写位置决定 |
| 闭包 | 函数保持对外部作用域的引用 |
| 变量提升 | var 和函数声明提升到作用域顶部 |
| 暂时性死区 | let/const 声明前不可访问 |

---

*理解闭包是掌握 JavaScript 高级编程的关键。*
