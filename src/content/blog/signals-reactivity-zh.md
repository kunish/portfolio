---
title: 'Signals：前端响应式编程的未来'
description: '深入理解 Signals 响应式原语，探索为什么各大框架都在拥抱这一范式'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'signals-reactivity'
---

2023 年以来，前端框架领域掀起了一场 "Signals 革命"。Solid.js、Preact、Angular、Vue、Qwik，甚至 React 团队也在探索类似概念。**Signals** 正在成为现代前端响应式编程的新标准。这篇文章将带你深入理解这一范式。

## 什么是 Signals？

Signal（信号）是一个响应式原语（reactive primitive），本质上是一个**可被订阅的值容器**。当信号的值发生变化时，所有依赖它的计算和副作用都会自动更新。

```javascript
// 伪代码展示 Signal 的核心概念
const count = signal(0);        // 创建信号
console.log(count.value);       // 读取: 0

count.value = 1;                // 写入: 自动触发更新
```

与传统的状态管理不同，Signals 具有以下特点：

1. **细粒度更新**：只有真正依赖该信号的部分会重新执行
2. **自动依赖追踪**：无需手动声明依赖关系
3. **同步更新**：值变化立即反映，无需等待调度
4. **无需不可变性**：可以直接修改值

## 为什么 Signals 重要？

### React 的困境

React 使用虚拟 DOM 和组件级重渲染：

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  // 每次 count 变化，整个组件函数重新执行
  console.log('Component re-rendered');

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

问题在于：
- **过度渲染**：即使只有一个值变化，整个组件树可能重新渲染
- **手动优化**：需要 `useMemo`、`useCallback`、`React.memo` 等
- **闭包陷阱**：`useEffect` 依赖数组容易出错
- **规则约束**：Hooks 规则增加心智负担

### Signals 的解决方案

```jsx
// Solid.js 示例
function Counter() {
  const [count, setCount] = createSignal(0);

  // 这个 console.log 只执行一次！
  console.log('Component setup (runs once)');

  return (
    <div>
      {/* 只有这个文本节点会更新 */}
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

关键区别：
- 组件函数只执行一次（setup）
- 只有 `{count()}` 这个 DOM 节点会更新
- 无需 memo 或手动优化

## 核心概念

### 1. Signal（信号）

最基础的响应式单元：

```javascript
// Preact Signals
import { signal } from '@preact/signals';

const count = signal(0);

// 读取
console.log(count.value);  // 0

// 写入
count.value = 1;

// 或者使用 .peek() 读取但不建立依赖
console.log(count.peek());
```

### 2. Computed（计算信号）

派生自其他信号的只读值：

```javascript
import { signal, computed } from '@preact/signals';

const firstName = signal('张');
const lastName = signal('三');

// 自动追踪依赖
const fullName = computed(() => firstName.value + lastName.value);

console.log(fullName.value);  // '张三'

firstName.value = '李';
console.log(fullName.value);  // '李三' - 自动更新！
```

计算信号的特点：
- **惰性求值**：只有被访问时才计算
- **缓存结果**：依赖未变化时返回缓存值
- **自动依赖追踪**：无需手动声明

### 3. Effect（副作用）

响应信号变化执行的副作用：

```javascript
import { signal, effect } from '@preact/signals';

const count = signal(0);

// 当 count 变化时自动执行
effect(() => {
  console.log(`Count is now: ${count.value}`);
});

count.value = 1;  // 控制台: "Count is now: 1"
count.value = 2;  // 控制台: "Count is now: 2"
```

## 依赖追踪的魔法

Signals 如何知道哪些计算依赖哪些信号？答案是**运行时依赖收集**：

```
执行流程:
┌─────────────────────────────────────────────────────┐
│ 1. 开始执行 computed/effect                          │
│ 2. 设置当前 "订阅者" 上下文                            │
│ 3. 执行函数体                                         │
│    └─> 访问 signal.value 时自动注册依赖               │
│ 4. 清除上下文                                         │
│ 5. 信号变化时通知所有订阅者                            │
└─────────────────────────────────────────────────────┘
```

```javascript
// 简化的实现原理
let currentSubscriber = null;

function signal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  return {
    get value() {
      // 读取时收集依赖
      if (currentSubscriber) {
        subscribers.add(currentSubscriber);
      }
      return value;
    },
    set value(newValue) {
      value = newValue;
      // 写入时通知订阅者
      subscribers.forEach(fn => fn());
    }
  };
}

function effect(fn) {
  currentSubscriber = fn;
  fn();  // 首次执行，收集依赖
  currentSubscriber = null;
}
```

## 各框架的 Signals 实现

### Solid.js

Signals 的先驱和最佳实践：

```jsx
import { createSignal, createEffect, createMemo } from 'solid-js';

function App() {
  const [count, setCount] = createSignal(0);
  const doubled = createMemo(() => count() * 2);

  createEffect(() => {
    console.log('Count changed:', count());
  });

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count()} × 2 = {doubled()}
    </button>
  );
}
```

### Preact Signals

可独立使用，也可与 React 集成：

```jsx
import { signal, computed } from '@preact/signals';
// 或 '@preact/signals-react' 用于 React

const count = signal(0);
const doubled = computed(() => count.value * 2);

function App() {
  return (
    <button onClick={() => count.value++}>
      {count} × 2 = {doubled}
    </button>
  );
}
```

### Vue 3 Composition API

Vue 的 `ref` 和 `reactive` 本质上就是 Signals：

```vue
<script setup>
import { ref, computed, watchEffect } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);

watchEffect(() => {
  console.log('Count changed:', count.value);
});
</script>

<template>
  <button @click="count++">
    {{ count }} × 2 = {{ doubled }}
  </button>
</template>
```

### Angular Signals

Angular 16+ 引入了 Signals：

```typescript
import { signal, computed, effect } from '@angular/core';

@Component({
  template: `
    <button (click)="increment()">
      {{ count() }} × 2 = {{ doubled() }}
    </button>
  `
})
class AppComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  constructor() {
    effect(() => {
      console.log('Count changed:', this.count());
    });
  }

  increment() {
    this.count.update(c => c + 1);
  }
}
```

## 性能优势

### 1. 细粒度更新

```
传统虚拟 DOM:
┌─────────────────────────────────────┐
│ App 组件重渲染                        │
│ ├─ Header 重渲染                     │
│ ├─ Content 重渲染                    │
│ │   ├─ Article 重渲染                │
│ │   └─ Sidebar 重渲染                │
│ └─ Footer 重渲染                     │
└─────────────────────────────────────┘

Signals:
┌─────────────────────────────────────┐
│ App                                 │
│ ├─ Header                           │
│ ├─ Content                          │
│ │   ├─ Article                      │
│ │   │   └─ [只更新这个文本节点] ←────── │
│ │   └─ Sidebar                      │
│ └─ Footer                           │
└─────────────────────────────────────┘
```

### 2. 无需手动优化

```jsx
// React: 需要大量优化代码
const MemoizedChild = React.memo(Child);
const handleClick = useCallback(() => {...}, [deps]);
const expensiveValue = useMemo(() => {...}, [deps]);

// Signals: 自动精确更新，无需优化
const count = signal(0);  // 就这样，完事了
```

### 3. 基准测试

在 JS Framework Benchmark 中，使用 Signals 的框架（如 Solid.js）通常比 React 快 2-10 倍，尤其在大量数据更新场景下。

## 最佳实践

### 1. 信号的粒度

```javascript
// ✅ 好：细粒度信号
const firstName = signal('张');
const lastName = signal('三');
const age = signal(25);

// ⚠️ 避免：粗粒度对象信号
const user = signal({
  firstName: '张',
  lastName: '三',
  age: 25
});
// 任何属性变化都会触发所有依赖更新
```

### 2. 使用 Computed 而非 Effect

```javascript
// ✅ 好：使用 computed 派生值
const fullName = computed(() =>
  firstName.value + lastName.value
);

// ❌ 避免：用 effect 模拟 computed
let fullName = '';
effect(() => {
  fullName = firstName.value + lastName.value;
});
```

### 3. Effect 清理

```javascript
effect(() => {
  const handler = () => console.log(count.value);
  window.addEventListener('resize', handler);

  // 返回清理函数
  return () => {
    window.removeEventListener('resize', handler);
  };
});
```

### 4. 批量更新

```javascript
import { batch } from '@preact/signals';

// 多次更新合并为一次
batch(() => {
  firstName.value = '李';
  lastName.value = '四';
  age.value = 30;
});
// 订阅者只会执行一次
```

## TC39 Signals 提案

好消息是，Signals 可能会成为 JavaScript 语言的一部分！TC39（JavaScript 标准委员会）正在讨论 [Signals 提案](https://github.com/tc39/proposal-signals)：

```javascript
// 未来可能的原生语法
const count = new Signal.State(0);
const doubled = new Signal.Computed(() => count.get() * 2);

Signal.subtle.Watcher(() => {
  console.log(count.get());
});
```

这将为所有框架提供统一的底层原语，实现更好的互操作性。

## 何时选择 Signals？

### ✅ 适合的场景

- **性能敏感应用**：大量数据、频繁更新
- **复杂状态逻辑**：多层派生状态
- **新项目**：可以选择 Signals-first 框架
- **渐进迁移**：Preact Signals 可与 React 配合使用

### ⚠️ 需要考虑的因素

- **团队熟悉度**：新范式需要学习时间
- **生态系统**：React 生态仍然最丰富
- **调试工具**：Signals 调试体验还在发展中

## 总结

Signals 代表了前端响应式编程的重要演进：

| 特性 | useState/虚拟 DOM | Signals |
|------|-------------------|---------|
| 更新粒度 | 组件级 | DOM 节点级 |
| 依赖追踪 | 手动声明 | 自动追踪 |
| 优化方式 | memo/callback | 内置优化 |
| 心智模型 | 函数重执行 | 订阅/发布 |

**关键收获**：

1. Signal 是可订阅的值容器
2. Computed 自动派生并缓存值
3. Effect 响应变化执行副作用
4. 依赖追踪在运行时自动完成
5. 细粒度更新带来显著性能提升

无论你现在使用什么框架，理解 Signals 都将帮助你成为更好的前端开发者。它不仅是一种技术，更是一种思考响应式编程的新方式。

---

*响应式编程的未来已经到来，而 Signals 正是开启这扇门的钥匙。*
