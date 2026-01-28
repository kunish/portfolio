---
title: 'JavaScript Functions Complete Guide'
description: 'Master function declarations, arrow functions, higher-order functions, currying and more'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'js-function-guide'
---

Functions are first-class citizens in JavaScript. This article covers various function features and advanced usage patterns.

## Creating Functions

### Function Declaration

```javascript
// Function declaration (hoisted)
function greet(name) {
  return `Hello, ${name}!`;
}

// Call
greet('Alice');  // 'Hello, Alice!'

// Function declarations are hoisted
sayHi();  // Can call before declaration
function sayHi() {
  console.log('Hi!');
}
```

### Function Expression

```javascript
// Anonymous function expression
const greet = function(name) {
  return `Hello, ${name}!`;
};

// Named function expression (useful for recursion and debugging)
const factorial = function fact(n) {
  return n <= 1 ? 1 : n * fact(n - 1);
};

// Function expressions are not hoisted
// sayHi();  // ReferenceError
const sayHi = function() {
  console.log('Hi!');
};
```

### Arrow Functions

```javascript
// Basic syntax
const greet = (name) => `Hello, ${name}!`;

// Single parameter can omit parentheses
const double = n => n * 2;

// No parameters need parentheses
const getRandom = () => Math.random();

// Multiple statements need braces and return
const sum = (a, b) => {
  const result = a + b;
  return result;
};

// Returning objects need parentheses
const createUser = (name, age) => ({ name, age });
```

### Arrow vs Regular Functions

```javascript
// 1. this binding
const obj = {
  name: 'Alice',

  // Regular function: dynamic this
  regular() {
    console.log(this.name);
  },

  // Arrow function: lexical this (inherits from outer scope)
  arrow: () => {
    console.log(this.name);  // undefined (outer this)
  },

  // Callbacks in methods
  delayed() {
    // Regular function needs to save this
    const self = this;
    setTimeout(function() {
      console.log(self.name);
    }, 100);

    // Arrow function inherits this automatically
    setTimeout(() => {
      console.log(this.name);
    }, 100);
  }
};

// 2. No arguments object
function regular() {
  console.log(arguments);  // Available
}

const arrow = () => {
  // console.log(arguments);  // Error
};

// Use rest parameters instead
const arrow2 = (...args) => {
  console.log(args);
};

// 3. Cannot be used as constructor
const Arrow = () => {};
// new Arrow();  // TypeError

// 4. No prototype property
console.log(Arrow.prototype);  // undefined
```

## Parameter Handling

### Default Parameters

```javascript
// Default values
function greet(name = 'Guest', greeting = 'Hello') {
  return `${greeting}, ${name}!`;
}

greet();            // 'Hello, Guest!'
greet('Alice');     // 'Hello, Alice!'
greet('Bob', 'Hi'); // 'Hi, Bob!'

// Defaults can be expressions
function createId(prefix = 'id', num = Date.now()) {
  return `${prefix}_${num}`;
}

// Using earlier parameters
function rectangle(width, height = width) {
  return width * height;
}

rectangle(5);  // 25 (square)
```

### Rest Parameters

```javascript
// Collect remaining parameters
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}

sum(1, 2, 3);        // 6
sum(1, 2, 3, 4, 5);  // 15

// Combined with fixed parameters
function log(level, ...messages) {
  console.log(`[${level}]`, ...messages);
}

log('INFO', 'User', 'logged in');
// [INFO] User logged in

// Must be last parameter
// function invalid(...rest, last) {}  // SyntaxError
```

### Parameter Destructuring

```javascript
// Object destructuring
function createUser({ name, age, role = 'user' }) {
  return { name, age, role };
}

createUser({ name: 'Alice', age: 25 });

// With default values
function config({ host = 'localhost', port = 3000 } = {}) {
  return `${host}:${port}`;
}

config();                   // 'localhost:3000'
config({ port: 8080 });     // 'localhost:8080'

// Array destructuring
function getFirst([first, second]) {
  return first;
}

getFirst([1, 2, 3]);  // 1
```

## this Binding

### Implicit Binding

```javascript
const obj = {
  name: 'Alice',
  greet() {
    console.log(`Hello, ${this.name}`);
  }
};

obj.greet();  // 'Hello, Alice'

// Method assigned to variable loses this
const fn = obj.greet;
fn();  // 'Hello, undefined'
```

### Explicit Binding

```javascript
function greet(greeting, punctuation) {
  console.log(`${greeting}, ${this.name}${punctuation}`);
}

const user = { name: 'Alice' };

// call - immediate invocation, args one by one
greet.call(user, 'Hello', '!');  // 'Hello, Alice!'

// apply - immediate invocation, args as array
greet.apply(user, ['Hi', '?']);  // 'Hi, Alice?'

// bind - returns bound function
const boundGreet = greet.bind(user, 'Hey');
boundGreet('...');  // 'Hey, Alice...'

// Partial application
const sayHi = greet.bind(user, 'Hi', '!');
sayHi();  // 'Hi, Alice!'
```

### Hard Binding

```javascript
// Prevent this loss
class Button {
  constructor(label) {
    this.label = label;
    // Bind method
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    console.log(`Clicked: ${this.label}`);
  }
}

// Or use class field syntax
class Button2 {
  label = 'Button';

  // Arrow function auto-binds
  handleClick = () => {
    console.log(`Clicked: ${this.label}`);
  };
}
```

## Higher-Order Functions

### Functions as Arguments

```javascript
// Callback function
function doTwice(fn) {
  fn();
  fn();
}

doTwice(() => console.log('Hello'));
// Hello
// Hello

// Array methods
const numbers = [1, 2, 3, 4, 5];

// map
const doubled = numbers.map(n => n * 2);

// filter
const evens = numbers.filter(n => n % 2 === 0);

// reduce
const sum = numbers.reduce((acc, n) => acc + n, 0);

// Custom higher-order function
function times(n, fn) {
  for (let i = 0; i < n; i++) {
    fn(i);
  }
}

times(3, i => console.log(`Iteration ${i}`));
```

### Functions as Return Values

```javascript
// Returning functions
function multiplier(factor) {
  return n => n * factor;
}

const double = multiplier(2);
const triple = multiplier(3);

double(5);  // 10
triple(5);  // 15

// Configuration functions
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

## Currying

### Basic Concept

```javascript
// Non-curried
function add(a, b, c) {
  return a + b + c;
}
add(1, 2, 3);  // 6

// Curried
function curriedAdd(a) {
  return function(b) {
    return function(c) {
      return a + b + c;
    };
  };
}

curriedAdd(1)(2)(3);  // 6

// Arrow function version
const curriedAdd2 = a => b => c => a + b + c;

// Partial application
const add1 = curriedAdd(1);
const add1and2 = add1(2);
add1and2(3);  // 6
```

### Generic Curry Function

```javascript
// Curry function
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

// Usage
function sum(a, b, c) {
  return a + b + c;
}

const curriedSum = curry(sum);

curriedSum(1, 2, 3);    // 6
curriedSum(1)(2)(3);    // 6
curriedSum(1, 2)(3);    // 6
curriedSum(1)(2, 3);    // 6
```

## Function Composition

### Basic Composition

```javascript
// Compose two functions
const compose = (f, g) => x => f(g(x));

const double = x => x * 2;
const addOne = x => x + 1;

const doubleThenAddOne = compose(addOne, double);
doubleThenAddOne(5);  // 11 (5 * 2 + 1)

// Pipe (left to right)
const pipe = (f, g) => x => g(f(x));

const addOneThenDouble = pipe(addOne, double);
addOneThenDouble(5);  // 12 ((5 + 1) * 2)
```

### Multiple Function Composition

```javascript
// Compose multiple functions
const compose = (...fns) =>
  fns.reduce((f, g) => (...args) => f(g(...args)));

const pipe = (...fns) =>
  fns.reduce((f, g) => (...args) => g(f(...args)));

// Usage
const addOne = x => x + 1;
const double = x => x * 2;
const square = x => x * x;

const transform = pipe(addOne, double, square);
transform(2);  // 36 ((2 + 1) * 2)² = 36
```

## Memoization

### Basic Implementation

```javascript
// Simple memoization
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

// Usage
const slowFib = n => n <= 1 ? n : slowFib(n - 1) + slowFib(n - 2);
const fastFib = memoize(function fib(n) {
  return n <= 1 ? n : fastFib(n - 1) + fastFib(n - 2);
});

console.time('slow');
slowFib(35);  // Very slow
console.timeEnd('slow');

console.time('fast');
fastFib(35);  // Almost instant
console.timeEnd('fast');
```

### Cache with TTL

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

## Utility Functions

### Debounce

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

// Usage
const handleSearch = debounce((query) => {
  console.log('Searching:', query);
}, 300);
```

### Throttle

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

// Usage
const handleScroll = throttle(() => {
  console.log('Scrolling');
}, 100);
```

### Once

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
initialize();  // { ready: true } (no log)
```

## Best Practices Summary

```
Function Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Function Design                                   │
│   ├── Single responsibility principle              │
│   ├── Keep functions short                         │
│   ├── Avoid side effects                           │
│   └── Use descriptive naming                       │
│                                                     │
│   Arrow Function Usage                              │
│   ├── Prefer arrows for callbacks                  │
│   ├── Use regular functions for object methods     │
│   └── Consider this binding needs                  │
│                                                     │
│   Performance                                       │
│   ├── Use memoization for expensive computations   │
│   ├── Use debounce/throttle for frequent calls     │
│   └── Avoid unnecessary function creation          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Concept | Purpose | Example |
|---------|---------|---------|
| Currying | Parameter reuse | curry(fn)(a)(b) |
| Composition | Chain functions | compose(f, g)(x) |
| Memoization | Cache results | memoize(fn) |
| Debounce | Delay execution | debounce(fn, 300) |

---

*Master function features to write more elegant JavaScript code.*
