---
title: 'JavaScript 函数完全指南'
description: '掌握函数声明、箭头函数、高阶函数、柯里化等核心概念'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'js-function-guide'
---

函数是 JavaScript 的一等公民。本文详解函数的各种特性和高级用法。

## 函数创建

### 函数声明

```javascript
// 函数声明（会提升）
function greet(name) {
  return `Hello, ${name}!`;
}

// 调用
greet('Alice');  // 'Hello, Alice!'

// 函数声明会提升到作用域顶部
sayHi();  // 可以在声明前调用
function sayHi() {
  console.log('Hi!');
}
```

### 函数表达式

```javascript
// 匿名函数表达式
const greet = function(name) {
  return `Hello, ${name}!`;
};

// 命名函数表达式（便于递归和调试）
const factorial = function fact(n) {
  return n <= 1 ? 1 : n * fact(n - 1);
};

// 函数表达式不会提升
// sayHi();  // ReferenceError
const sayHi = function() {
  console.log('Hi!');
};
```

### 箭头函数

```javascript
// 基本语法
const greet = (name) => `Hello, ${name}!`;

// 单参数可省略括号
const double = n => n * 2;

// 无参数需要括号
const getRandom = () => Math.random();

// 多语句需要大括号和 return
const sum = (a, b) => {
  const result = a + b;
  return result;
};

// 返回对象需要括号
const createUser = (name, age) => ({ name, age });
```

### 箭头函数 vs 普通函数

```javascript
// 1. this 绑定
const obj = {
  name: 'Alice',

  // 普通函数：动态 this
  regular() {
    console.log(this.name);
  },

  // 箭头函数：词法 this（继承外层）
  arrow: () => {
    console.log(this.name);  // undefined（外层 this）
  },

  // 方法中的回调
  delayed() {
    // 普通函数需要保存 this
    const self = this;
    setTimeout(function() {
      console.log(self.name);
    }, 100);

    // 箭头函数自动继承 this
    setTimeout(() => {
      console.log(this.name);
    }, 100);
  }
};

// 2. 无 arguments 对象
function regular() {
  console.log(arguments);  // 可用
}

const arrow = () => {
  // console.log(arguments);  // 报错
};

// 使用剩余参数代替
const arrow2 = (...args) => {
  console.log(args);
};

// 3. 不能作为构造函数
const Arrow = () => {};
// new Arrow();  // TypeError

// 4. 无 prototype 属性
console.log(Arrow.prototype);  // undefined
```

## 参数处理

### 默认参数

```javascript
// 默认值
function greet(name = 'Guest', greeting = 'Hello') {
  return `${greeting}, ${name}!`;
}

greet();            // 'Hello, Guest!'
greet('Alice');     // 'Hello, Alice!'
greet('Bob', 'Hi'); // 'Hi, Bob!'

// 默认值可以是表达式
function createId(prefix = 'id', num = Date.now()) {
  return `${prefix}_${num}`;
}

// 使用前面的参数
function rectangle(width, height = width) {
  return width * height;
}

rectangle(5);  // 25（正方形）
```

### 剩余参数

```javascript
// 收集剩余参数
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}

sum(1, 2, 3);        // 6
sum(1, 2, 3, 4, 5);  // 15

// 与固定参数组合
function log(level, ...messages) {
  console.log(`[${level}]`, ...messages);
}

log('INFO', 'User', 'logged in');
// [INFO] User logged in

// 必须是最后一个参数
// function invalid(...rest, last) {}  // SyntaxError
```

### 参数解构

```javascript
// 对象解构
function createUser({ name, age, role = 'user' }) {
  return { name, age, role };
}

createUser({ name: 'Alice', age: 25 });

// 带默认值
function config({ host = 'localhost', port = 3000 } = {}) {
  return `${host}:${port}`;
}

config();                   // 'localhost:3000'
config({ port: 8080 });     // 'localhost:8080'

// 数组解构
function getFirst([first, second]) {
  return first;
}

getFirst([1, 2, 3]);  // 1
```

## this 绑定

### 隐式绑定

```javascript
const obj = {
  name: 'Alice',
  greet() {
    console.log(`Hello, ${this.name}`);
  }
};

obj.greet();  // 'Hello, Alice'

// 方法赋值给变量会丢失 this
const fn = obj.greet;
fn();  // 'Hello, undefined'
```

### 显式绑定

```javascript
function greet(greeting, punctuation) {
  console.log(`${greeting}, ${this.name}${punctuation}`);
}

const user = { name: 'Alice' };

// call - 立即调用，逐个传参
greet.call(user, 'Hello', '!');  // 'Hello, Alice!'

// apply - 立即调用，数组传参
greet.apply(user, ['Hi', '?']);  // 'Hi, Alice?'

// bind - 返回绑定函数
const boundGreet = greet.bind(user, 'Hey');
boundGreet('...');  // 'Hey, Alice...'

// 部分应用
const sayHi = greet.bind(user, 'Hi', '!');
sayHi();  // 'Hi, Alice!'
```

### 硬绑定

```javascript
// 防止 this 丢失
class Button {
  constructor(label) {
    this.label = label;
    // 绑定方法
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    console.log(`Clicked: ${this.label}`);
  }
}

// 或使用类字段语法
class Button2 {
  label = 'Button';

  // 箭头函数自动绑定
  handleClick = () => {
    console.log(`Clicked: ${this.label}`);
  };
}
```

## 高阶函数

### 函数作为参数

```javascript
// 回调函数
function doTwice(fn) {
  fn();
  fn();
}

doTwice(() => console.log('Hello'));
// Hello
// Hello

// 数组方法
const numbers = [1, 2, 3, 4, 5];

// map
const doubled = numbers.map(n => n * 2);

// filter
const evens = numbers.filter(n => n % 2 === 0);

// reduce
const sum = numbers.reduce((acc, n) => acc + n, 0);

// 自定义高阶函数
function times(n, fn) {
  for (let i = 0; i < n; i++) {
    fn(i);
  }
}

times(3, i => console.log(`Iteration ${i}`));
```

### 函数作为返回值

```javascript
// 返回函数
function multiplier(factor) {
  return n => n * factor;
}

const double = multiplier(2);
const triple = multiplier(3);

double(5);  // 10
triple(5);  // 15

// 配置函数
function createLogger(prefix) {
  return function(message) {
    console.log(`[${prefix}] ${message}`);
  };
}

const infoLog = createLogger('INFO');
const errorLog = createLogger('ERROR');

infoLog('Hello');   // [INFO] Hello
errorLog('Oops');   // [ERROR] Oops
```

## 柯里化

### 基本概念

```javascript
// 非柯里化
function add(a, b, c) {
  return a + b + c;
}
add(1, 2, 3);  // 6

// 柯里化
function curriedAdd(a) {
  return function(b) {
    return function(c) {
      return a + b + c;
    };
  };
}

curriedAdd(1)(2)(3);  // 6

// 箭头函数版
const curriedAdd2 = a => b => c => a + b + c;

// 部分应用
const add1 = curriedAdd(1);
const add1and2 = add1(2);
add1and2(3);  // 6
```

### 通用柯里化

```javascript
// 柯里化函数
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}

// 使用
function sum(a, b, c) {
  return a + b + c;
}

const curriedSum = curry(sum);

curriedSum(1, 2, 3);    // 6
curriedSum(1)(2)(3);    // 6
curriedSum(1, 2)(3);    // 6
curriedSum(1)(2, 3);    // 6
```

## 函数组合

### 基本组合

```javascript
// 组合两个函数
const compose = (f, g) => x => f(g(x));

const double = x => x * 2;
const addOne = x => x + 1;

const doubleThenAddOne = compose(addOne, double);
doubleThenAddOne(5);  // 11 (5 * 2 + 1)

// 管道（从左到右）
const pipe = (f, g) => x => g(f(x));

const addOneThenDouble = pipe(addOne, double);
addOneThenDouble(5);  // 12 ((5 + 1) * 2)
```

### 多函数组合

```javascript
// 组合多个函数
const compose = (...fns) =>
  fns.reduce((f, g) => (...args) => f(g(...args)));

const pipe = (...fns) =>
  fns.reduce((f, g) => (...args) => g(f(...args)));

// 使用
const addOne = x => x + 1;
const double = x => x * 2;
const square = x => x * x;

const transform = pipe(addOne, double, square);
transform(2);  // 36 ((2 + 1) * 2)² = 36
```

## 函数记忆化

### 基本实现

```javascript
// 简单记忆化
function memoize(fn) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// 使用
const slowFib = n => n <= 1 ? n : slowFib(n - 1) + slowFib(n - 2);
const fastFib = memoize(function fib(n) {
  return n <= 1 ? n : fastFib(n - 1) + fastFib(n - 2);
});

console.time('slow');
slowFib(35);  // 很慢
console.timeEnd('slow');

console.time('fast');
fastFib(35);  // 几乎瞬间
console.timeEnd('fast');
```

### 带过期的缓存

```javascript
function memoizeWithTTL(fn, ttl = 60000) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.time < ttl) {
      return cached.value;
    }

    const result = fn.apply(this, args);
    cache.set(key, { value: result, time: Date.now() });
    return result;
  };
}
```

## 实用工具函数

### 防抖

```javascript
function debounce(fn, delay) {
  let timer;

  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 使用
const handleSearch = debounce((query) => {
  console.log('Searching:', query);
}, 300);
```

### 节流

```javascript
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
const handleScroll = throttle(() => {
  console.log('Scrolling');
}, 100);
```

### 只执行一次

```javascript
function once(fn) {
  let called = false;
  let result;

  return function(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

const initialize = once(() => {
  console.log('Initialized');
  return { ready: true };
});

initialize();  // 'Initialized' { ready: true }
initialize();  // { ready: true }（不再打印）
```

## 最佳实践总结

```
函数最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   函数设计                                          │
│   ├── 单一职责原则                                 │
│   ├── 保持函数短小                                 │
│   ├── 避免副作用                                   │
│   └── 使用描述性命名                               │
│                                                     │
│   箭头函数使用                                      │
│   ├── 回调函数优先使用箭头函数                     │
│   ├── 对象方法使用普通函数                         │
│   └── 需要 this 时注意选择                         │
│                                                     │
│   性能优化                                          │
│   ├── 昂贵计算使用记忆化                           │
│   ├── 频繁调用使用防抖/节流                        │
│   └── 避免不必要的函数创建                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 概念 | 用途 | 示例 |
|------|------|------|
| 柯里化 | 参数复用 | curry(fn)(a)(b) |
| 组合 | 函数串联 | compose(f, g)(x) |
| 记忆化 | 缓存结果 | memoize(fn) |
| 防抖 | 延迟执行 | debounce(fn, 300) |

---

*掌握函数特性，写出更优雅的 JavaScript 代码。*
