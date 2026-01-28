---
title: 'JavaScript 事件循环详解：理解异步执行机制'
description: '深入理解调用栈、任务队列、微任务和宏任务的执行顺序'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'event-loop-guide'
---

事件循环是 JavaScript 异步编程的核心。本文深入探讨其工作原理。

## 基础概念

### 运行时模型

```
JavaScript 运行时结构：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   堆 (Heap)                                         │
│   └── 对象分配的内存区域                           │
│                                                     │
│   调用栈 (Call Stack)                               │
│   └── 函数调用的执行上下文                         │
│                                                     │
│   Web APIs                                          │
│   ├── setTimeout / setInterval                     │
│   ├── fetch / XMLHttpRequest                       │
│   ├── DOM 事件监听                                 │
│   └── requestAnimationFrame                        │
│                                                     │
│   任务队列 (Task Queues)                            │
│   ├── 宏任务队列 (Macrotask)                       │
│   └── 微任务队列 (Microtask)                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 调用栈

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

// 调用栈变化：
// 1. first() 入栈
// 2. console.log('First') 入栈、执行、出栈
// 3. second() 入栈
// 4. console.log('Second') 入栈、执行、出栈
// 5. third() 入栈
// 6. console.log('Third') 入栈、执行、出栈
// 7. third() 出栈
// 8. console.log('Second End') 入栈、执行、出栈
// 9. second() 出栈
// 10. console.log('First End') 入栈、执行、出栈
// 11. first() 出栈
```

## 宏任务与微任务

### 任务类型

```
任务分类：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   宏任务 (Macrotask)                                │
│   ├── script（整体代码）                           │
│   ├── setTimeout / setInterval                     │
│   ├── setImmediate (Node.js)                       │
│   ├── I/O                                          │
│   ├── UI 渲染                                      │
│   └── requestAnimationFrame                        │
│                                                     │
│   微任务 (Microtask)                                │
│   ├── Promise.then / catch / finally               │
│   ├── async/await                                  │
│   ├── queueMicrotask()                             │
│   ├── MutationObserver                             │
│   └── process.nextTick (Node.js)                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 执行顺序

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

// 输出顺序：
// 1: Script Start
// 6: Script End
// 3: Promise 1
// 5: queueMicrotask
// 4: Promise 2
// 2: setTimeout

// 解释：
// 1. 同步代码先执行（1, 6）
// 2. 微任务队列清空（3, 5, 4）
// 3. 宏任务执行（2）
```

### 事件循环流程

```javascript
// 事件循环的一次迭代
while (true) {
  // 1. 从宏任务队列取出最老的任务
  const macrotask = macrotaskQueue.shift();
  if (macrotask) {
    runTask(macrotask);
  }

  // 2. 执行所有微任务
  while (microtaskQueue.length > 0) {
    const microtask = microtaskQueue.shift();
    runTask(microtask);
  }

  // 3. 如果需要，进行渲染
  if (needsRender()) {
    // 执行 requestAnimationFrame 回调
    runAnimationFrames();
    // 渲染
    render();
  }
}
```

## 经典面试题

### 题目一

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

// 输出：1, 6, 4, 2, 3, 5
```

### 题目二

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

// 输出：
// script start
// async1 start
// async2
// promise1
// script end
// async1 end
// promise2
// setTimeout
```

### 题目三

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

// 输出：promise1, promise3, promise4, promise2, promise5
// 注意：return Promise.resolve() 会产生额外的微任务
```

## Node.js 事件循环

### Node.js 阶段

```
Node.js 事件循环阶段：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ┌───────────────────────────────┐                │
│   │         timers               │                │
│   │   setTimeout / setInterval   │                │
│   └───────────────────────────────┘                │
│                 ↓                                   │
│   ┌───────────────────────────────┐                │
│   │     pending callbacks        │                │
│   │   系统操作的回调              │                │
│   └───────────────────────────────┘                │
│                 ↓                                   │
│   ┌───────────────────────────────┐                │
│   │      idle, prepare           │                │
│   │   内部使用                    │                │
│   └───────────────────────────────┘                │
│                 ↓                                   │
│   ┌───────────────────────────────┐                │
│   │          poll                │                │
│   │   I/O 回调、新的 I/O 事件     │                │
│   └───────────────────────────────┘                │
│                 ↓                                   │
│   ┌───────────────────────────────┐                │
│   │         check                │                │
│   │   setImmediate 回调          │                │
│   └───────────────────────────────┘                │
│                 ↓                                   │
│   ┌───────────────────────────────┐                │
│   │     close callbacks          │                │
│   │   关闭回调 (socket.close)    │                │
│   └───────────────────────────────┘                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### setTimeout vs setImmediate

```javascript
// 在 I/O 回调中，setImmediate 总是先执行
const fs = require('fs');

fs.readFile('file.txt', () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});

// 输出：immediate, timeout（在 I/O 回调中稳定）

// 在主模块中，顺序不确定
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
// 可能是 timeout, immediate 或 immediate, timeout
```

### process.nextTick

```javascript
// process.nextTick 优先级最高
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
setImmediate(() => console.log('immediate'));
setTimeout(() => console.log('timeout'), 0);

// 输出：nextTick, promise, timeout, immediate

// 注意：过多的 nextTick 会阻塞 I/O
function recursive() {
  process.nextTick(recursive); // 危险！会阻塞事件循环
}
```

## 实际应用

### 避免阻塞

```javascript
// 阻塞示例
function processLargeArray(array) {
  array.forEach(item => {
    // 耗时操作
    heavyComputation(item);
  });
}

// 非阻塞改进
async function processLargeArrayAsync(array) {
  for (let i = 0; i < array.length; i++) {
    heavyComputation(array[i]);

    // 每处理 100 项，让出控制权
    if (i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

// 使用 requestIdleCallback（浏览器）
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

### 批量 DOM 更新

```javascript
// 使用微任务批量更新
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

// 使用 requestAnimationFrame
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

## 最佳实践总结

```
事件循环最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   避免阻塞                                          │
│   ├── 长任务分片处理                               │
│   ├── 使用 Web Worker                              │
│   ├── 避免同步阻塞操作                             │
│   └── 使用 requestIdleCallback                     │
│                                                     │
│   任务调度                                          │
│   ├── 理解微任务和宏任务区别                       │
│   ├── 合理使用 setTimeout(fn, 0)                   │
│   ├── 动画使用 requestAnimationFrame               │
│   └── 批量更新使用微任务                           │
│                                                     │
│   性能优化                                          │
│   ├── 监控长任务                                   │
│   ├── 避免过深的 Promise 链                        │
│   └── 注意 nextTick/queueMicrotask 滥用            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 任务类型 | 执行时机 |
|----------|----------|
| 同步代码 | 立即执行 |
| 微任务 | 当前宏任务结束后 |
| 宏任务 | 下一轮事件循环 |
| requestAnimationFrame | 渲染前 |

---

*理解事件循环，是掌握 JavaScript 异步编程的关键。*
