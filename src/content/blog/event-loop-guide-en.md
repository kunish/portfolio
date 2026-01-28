---
title: 'JavaScript Event Loop Explained: Understanding Async Execution'
description: 'Deep dive into call stack, task queues, microtasks and macrotasks execution order'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'event-loop-guide'
---

The event loop is the core of JavaScript asynchronous programming. This article explores how it works in depth.

## Basic Concepts

### Runtime Model

```
JavaScript Runtime Structure:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Heap                                              │
│   └── Memory region for object allocation          │
│                                                     │
│   Call Stack                                        │
│   └── Execution context for function calls         │
│                                                     │
│   Web APIs                                          │
│   ├── setTimeout / setInterval                     │
│   ├── fetch / XMLHttpRequest                       │
│   ├── DOM event listeners                          │
│   └── requestAnimationFrame                        │
│                                                     │
│   Task Queues                                       │
│   ├── Macrotask Queue                              │
│   └── Microtask Queue                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Call Stack

```javascript
function first() {
  console.log('First');
  second();
  console.log('First End');
}

function second() {
  console.log('Second');
  third();
  console.log('Second End');
}

function third() {
  console.log('Third');
}

first();

// Call stack changes:
// 1. first() pushed
// 2. console.log('First') pushed, runs, popped
// 3. second() pushed
// 4. console.log('Second') pushed, runs, popped
// 5. third() pushed
// 6. console.log('Third') pushed, runs, popped
// 7. third() popped
// 8. console.log('Second End') pushed, runs, popped
// 9. second() popped
// 10. console.log('First End') pushed, runs, popped
// 11. first() popped
```

## Macrotasks and Microtasks

### Task Types

```
Task Classification:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Macrotasks                                        │
│   ├── script (overall code)                        │
│   ├── setTimeout / setInterval                     │
│   ├── setImmediate (Node.js)                       │
│   ├── I/O                                          │
│   ├── UI rendering                                 │
│   └── requestAnimationFrame                        │
│                                                     │
│   Microtasks                                        │
│   ├── Promise.then / catch / finally               │
│   ├── async/await                                  │
│   ├── queueMicrotask()                             │
│   ├── MutationObserver                             │
│   └── process.nextTick (Node.js)                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Execution Order

```javascript
console.log('1: Script Start');

setTimeout(() => {
  console.log('2: setTimeout');
}, 0);

Promise.resolve()
  .then(() => console.log('3: Promise 1'))
  .then(() => console.log('4: Promise 2'));

queueMicrotask(() => {
  console.log('5: queueMicrotask');
});

console.log('6: Script End');

// Output order:
// 1: Script Start
// 6: Script End
// 3: Promise 1
// 5: queueMicrotask
// 4: Promise 2
// 2: setTimeout

// Explanation:
// 1. Synchronous code runs first (1, 6)
// 2. Microtask queue emptied (3, 5, 4)
// 3. Macrotask runs (2)
```

### Event Loop Flow

```javascript
// One iteration of the event loop
while (true) {
  // 1. Get oldest task from macrotask queue
  const macrotask = macrotaskQueue.shift();
  if (macrotask) {
    runTask(macrotask);
  }

  // 2. Run all microtasks
  while (microtaskQueue.length > 0) {
    const microtask = microtaskQueue.shift();
    runTask(microtask);
  }

  // 3. Render if needed
  if (needsRender()) {
    // Run requestAnimationFrame callbacks
    runAnimationFrames();
    // Render
    render();
  }
}
```

## Classic Interview Questions

### Question One

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
  Promise.resolve().then(() => console.log('3'));
}, 0);

Promise.resolve().then(() => {
  console.log('4');
  setTimeout(() => console.log('5'), 0);
});

console.log('6');

// Output: 1, 6, 4, 2, 3, 5
```

### Question Two

```javascript
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}

async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

async1();

new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => {
  console.log('promise2');
});

console.log('script end');

// Output:
// script start
// async1 start
// async2
// promise1
// script end
// async1 end
// promise2
// setTimeout
```

### Question Three

```javascript
Promise.resolve()
  .then(() => {
    console.log('promise1');
    return Promise.resolve('promise2');
  })
  .then((res) => {
    console.log(res);
  });

Promise.resolve()
  .then(() => {
    console.log('promise3');
  })
  .then(() => {
    console.log('promise4');
  })
  .then(() => {
    console.log('promise5');
  });

// Output: promise1, promise3, promise4, promise2, promise5
// Note: return Promise.resolve() creates extra microtasks
```

## Node.js Event Loop

### Node.js Phases

```
Node.js Event Loop Phases:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ┌───────────────────────────────┐                │
│   │         timers               │                │
│   │   setTimeout / setInterval   │                │
│   └───────────────────────────────┘                │
│                 ↓                                   │
│   ┌───────────────────────────────┐                │
│   │     pending callbacks        │                │
│   │   System operation callbacks │                │
│   └───────────────────────────────┘                │
│                 ↓                                   │
│   ┌───────────────────────────────┐                │
│   │      idle, prepare           │                │
│   │   Internal use               │                │
│   └───────────────────────────────┘                │
│                 ↓                                   │
│   ┌───────────────────────────────┐                │
│   │          poll                │                │
│   │   I/O callbacks, new events  │                │
│   └───────────────────────────────┘                │
│                 ↓                                   │
│   ┌───────────────────────────────┐                │
│   │         check                │                │
│   │   setImmediate callbacks     │                │
│   └───────────────────────────────┘                │
│                 ↓                                   │
│   ┌───────────────────────────────┐                │
│   │     close callbacks          │                │
│   │   Close handlers             │                │
│   └───────────────────────────────┘                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### setTimeout vs setImmediate

```javascript
// In I/O callbacks, setImmediate always runs first
const fs = require('fs');

fs.readFile('file.txt', () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});

// Output: immediate, timeout (stable in I/O callback)

// In main module, order is non-deterministic
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
// Could be timeout, immediate OR immediate, timeout
```

### process.nextTick

```javascript
// process.nextTick has highest priority
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
setImmediate(() => console.log('immediate'));
setTimeout(() => console.log('timeout'), 0);

// Output: nextTick, promise, timeout, immediate

// Warning: Too many nextTick calls can block I/O
function recursive() {
  process.nextTick(recursive); // Dangerous! Blocks event loop
}
```

## Practical Applications

### Avoiding Blocking

```javascript
// Blocking example
function processLargeArray(array) {
  array.forEach(item => {
    // Time-consuming operation
    heavyComputation(item);
  });
}

// Non-blocking improvement
async function processLargeArrayAsync(array) {
  for (let i = 0; i < array.length; i++) {
    heavyComputation(array[i]);

    // Yield control every 100 items
    if (i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

// Using requestIdleCallback (browser)
function processWhenIdle(items) {
  let index = 0;

  function process(deadline) {
    while (index < items.length && deadline.timeRemaining() > 0) {
      heavyComputation(items[index]);
      index++;
    }

    if (index < items.length) {
      requestIdleCallback(process);
    }
  }

  requestIdleCallback(process);
}
```

### Batched DOM Updates

```javascript
// Using microtasks for batched updates
let pending = false;
const updates = [];

function scheduleUpdate(update) {
  updates.push(update);

  if (!pending) {
    pending = true;
    queueMicrotask(() => {
      pending = false;
      flushUpdates();
    });
  }
}

function flushUpdates() {
  const batch = updates.splice(0);
  batch.forEach(update => update());
}

// Using requestAnimationFrame
let rafPending = false;
const rafUpdates = [];

function scheduleRafUpdate(update) {
  rafUpdates.push(update);

  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      rafUpdates.splice(0).forEach(fn => fn());
    });
  }
}
```

## Best Practices Summary

```
Event Loop Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Avoid Blocking                                    │
│   ├── Break long tasks into chunks                 │
│   ├── Use Web Workers                              │
│   ├── Avoid synchronous blocking operations        │
│   └── Use requestIdleCallback                      │
│                                                     │
│   Task Scheduling                                   │
│   ├── Understand micro vs macro task difference    │
│   ├── Use setTimeout(fn, 0) appropriately          │
│   ├── Use requestAnimationFrame for animations     │
│   └── Use microtasks for batched updates           │
│                                                     │
│   Performance                                       │
│   ├── Monitor long tasks                           │
│   ├── Avoid deep Promise chains                    │
│   └── Watch for nextTick/queueMicrotask abuse      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Task Type | When Executed |
|-----------|---------------|
| Synchronous | Immediately |
| Microtask | After current macrotask |
| Macrotask | Next event loop iteration |
| requestAnimationFrame | Before render |

---

*Understanding the event loop is key to mastering JavaScript async programming.*
