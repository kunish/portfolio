---
title: 'JavaScript Closures and Scope Deep Dive'
description: 'Understanding lexical scope, closure principles, hoisting and common patterns'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'js-closure-scope'
---

Closures are one of JavaScript's most powerful yet misunderstood features. This article explains how they work.

## Scope Fundamentals

### Lexical Scope

```javascript
// Lexical scope: variable scope determined by code location
const globalVar = 'global';

function outer() {
  const outerVar = 'outer';

  function inner() {
    const innerVar = 'inner';
    // inner can access all outer variables
    console.log(globalVar);  // "global"
    console.log(outerVar);   // "outer"
    console.log(innerVar);   // "inner"
  }

  inner();
  // console.log(innerVar);  // ReferenceError
}

outer();
```

### Scope Chain

```
Scope Chain Lookup Process:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Variable lookup order:                            │
│                                                     │
│   1. Current scope → use if found                  │
│         ↓ not found                                 │
│   2. Outer scope → use if found                    │
│         ↓ not found                                 │
│   3. Continue outward → until global scope         │
│         ↓ not found                                 │
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
      // Scope chain: third → second → first → global
      console.log(a, b, c);  // 1 2 3
    }
    third();
  }
  second();
}
first();
```

## Variable Declarations

### var vs let vs const

```javascript
// var - function scope, hoisted
function varExample() {
  console.log(x);  // undefined (hoisted but not assigned)
  var x = 1;
  console.log(x);  // 1

  if (true) {
    var x = 2;  // Same variable
  }
  console.log(x);  // 2
}

// let - block scope, temporal dead zone
function letExample() {
  // console.log(y);  // ReferenceError: TDZ
  let y = 1;
  console.log(y);  // 1

  if (true) {
    let y = 2;  // New variable
    console.log(y);  // 2
  }
  console.log(y);  // 1
}

// const - block scope, no reassignment
function constExample() {
  const z = 1;
  // z = 2;  // TypeError: cannot reassign

  const obj = { a: 1 };
  obj.a = 2;  // OK: can modify object properties
  // obj = {};  // TypeError: cannot reassign
}
```

### Hoisting

```javascript
// Function declarations are fully hoisted
hoistedFunc();  // "works!"

function hoistedFunc() {
  console.log('works!');
}

// Function expressions are not fully hoisted
// notHoisted();  // TypeError: notHoisted is not a function
var notHoisted = function() {
  console.log('not hoisted');
};

// var declarations are hoisted, but not assignments
console.log(hoistedVar);  // undefined
var hoistedVar = 'value';

// let/const have temporal dead zone
// console.log(blockScoped);  // ReferenceError
let blockScoped = 'value';
```

## Closures Explained

### What is a Closure

```javascript
// Closure: a function that remembers and accesses
// its lexical scope even when executed outside of it

function createCounter() {
  let count = 0;  // Private variable

  return function() {
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter());  // 1
console.log(counter());  // 2
console.log(counter());  // 3

// count variable is "enclosed" in the closure
// Cannot be accessed directly from outside
```

### How Closures Work

```
Closure Memory Structure:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   After createCounter finishes:                     │
│                                                     │
│   ┌──────────────────────┐                         │
│   │ Closure scope        │                         │
│   │  count: 0            │ ←── Kept referenced     │
│   └──────────────────────┘                         │
│            ↑                                        │
│   ┌──────────────────────┐                         │
│   │ Returned function    │                         │
│   │  [[Scope]] ──────────┼───→ Closure scope       │
│   └──────────────────────┘                         │
│            ↓                                        │
│   const counter = returned function                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Multiple Closures Sharing

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

// Three methods share the same closure scope
```

## Common Patterns

### Module Pattern

```javascript
const Calculator = (function() {
  // Private variables
  let result = 0;

  // Private method
  function validate(n) {
    return typeof n === 'number' && !isNaN(n);
  }

  // Public API
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

### Function Factory

```javascript
// Create functions with preset configuration
function createMultiplier(multiplier) {
  return function(value) {
    return value * multiplier;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15

// Practical use: creating formatters
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

### Memoization

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

// Usage
const expensiveCalc = memoize((n) => {
  console.log('Computing...');
  return n * n;
});

expensiveCalc(5);  // Computing... 25
expensiveCalc(5);  // From cache 25
expensiveCalc(6);  // Computing... 36
```

### Debounce and Throttle

```javascript
// Debounce: wait until stopped triggering
function debounce(fn, delay) {
  let timeoutId = null;

  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// Throttle: execute at fixed intervals
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
const handleSearch = debounce((query) => {
  console.log('Searching:', query);
}, 300);

const handleScroll = throttle(() => {
  console.log('Scrolled at:', Date.now());
}, 100);
```

## Common Pitfalls

### Closures in Loops

```javascript
// Problem: all callbacks share the same i
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);  // 3, 3, 3
  }, 100);
}

// Solution 1: Use let
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);  // 0, 1, 2
  }, 100);
}

// Solution 2: Use IIFE
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => {
      console.log(j);  // 0, 1, 2
    }, 100);
  })(i);
}

// Solution 3: Use forEach
[0, 1, 2].forEach((i) => {
  setTimeout(() => {
    console.log(i);  // 0, 1, 2
  }, 100);
});
```

### Memory Leaks

```javascript
// Closure that may cause memory leak
function createLeak() {
  const largeData = new Array(1000000).fill('data');

  return function() {
    // Only uses a small part of largeData
    return largeData[0];
  };
}

const leak = createLeak();
// Entire largeData array is kept in memory

// Solution: only keep needed data
function noLeak() {
  const largeData = new Array(1000000).fill('data');
  const firstItem = largeData[0];

  return function() {
    return firstItem;
  };
}
```

## Best Practices Summary

```
Closure Guidelines:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Good Use Cases                                    │
│   ├── Data privacy (module pattern)                │
│   ├── Function factories                           │
│   ├── Callbacks and event handlers                 │
│   └── Partial application and currying             │
│                                                     │
│   Considerations                                    │
│   ├── Avoid unnecessary large object references    │
│   ├── Use let instead of var in loops              │
│   ├── Clean up unneeded closures promptly          │
│   └── Be aware of this binding issues              │
│                                                     │
│   Performance                                       │
│   ├── Closures use additional memory               │
│   ├── Overuse can affect performance               │
│   └── Use memoization appropriately                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Concept | Description |
|---------|-------------|
| Lexical Scope | Determined by code location |
| Closure | Function retains reference to outer scope |
| Hoisting | var and function declarations move to top |
| Temporal Dead Zone | let/const inaccessible before declaration |

---

*Understanding closures is key to mastering advanced JavaScript.*
