---
title: 'Signals: The Future of Frontend Reactive Programming'
description: 'Deep dive into Signals reactive primitives and explore why major frameworks are embracing this paradigm'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'signals-reactivity'
---

Since 2023, the frontend framework world has witnessed a "Signals revolution." Solid.js, Preact, Angular, Vue, Qwik—even the React team is exploring similar concepts. **Signals** are becoming the new standard for modern frontend reactive programming. This article will help you deeply understand this paradigm.

## What Are Signals?

A Signal is a reactive primitive—essentially a **subscribable value container**. When a signal's value changes, all computations and effects that depend on it automatically update.

```javascript
// Pseudocode showing Signal's core concept
const count = signal(0);        // Create signal
console.log(count.value);       // Read: 0

count.value = 1;                // Write: automatically triggers updates
```

Unlike traditional state management, Signals have these characteristics:

1. **Fine-grained updates**: Only parts that truly depend on the signal re-execute
2. **Automatic dependency tracking**: No need to manually declare dependencies
3. **Synchronous updates**: Value changes reflect immediately, no scheduling
4. **No immutability required**: Values can be modified directly

## Why Do Signals Matter?

### React's Dilemma

React uses virtual DOM and component-level re-rendering:

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  // Every time count changes, the entire component function re-executes
  console.log('Component re-rendered');

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

The problems:
- **Over-rendering**: Even if only one value changes, the entire component tree might re-render
- **Manual optimization**: Requires `useMemo`, `useCallback`, `React.memo`, etc.
- **Closure traps**: `useEffect` dependency arrays are error-prone
- **Rules constraints**: Hooks rules add mental overhead

### The Signals Solution

```jsx
// Solid.js example
function Counter() {
  const [count, setCount] = createSignal(0);

  // This console.log only executes once!
  console.log('Component setup (runs once)');

  return (
    <div>
      {/* Only this text node updates */}
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

Key differences:
- Component function executes only once (setup)
- Only the `{count()}` DOM node updates
- No memo or manual optimization needed

## Core Concepts

### 1. Signal

The most basic reactive unit:

```javascript
// Preact Signals
import { signal } from '@preact/signals';

const count = signal(0);

// Read
console.log(count.value);  // 0

// Write
count.value = 1;

// Or use .peek() to read without establishing dependency
console.log(count.peek());
```

### 2. Computed

Read-only values derived from other signals:

```javascript
import { signal, computed } from '@preact/signals';

const firstName = signal('John');
const lastName = signal('Doe');

// Automatically tracks dependencies
const fullName = computed(() => firstName.value + ' ' + lastName.value);

console.log(fullName.value);  // 'John Doe'

firstName.value = 'Jane';
console.log(fullName.value);  // 'Jane Doe' - auto updated!
```

Computed signal characteristics:
- **Lazy evaluation**: Only computes when accessed
- **Cached results**: Returns cached value if dependencies unchanged
- **Automatic dependency tracking**: No manual declaration needed

### 3. Effect

Side effects that execute in response to signal changes:

```javascript
import { signal, effect } from '@preact/signals';

const count = signal(0);

// Automatically executes when count changes
effect(() => {
  console.log(`Count is now: ${count.value}`);
});

count.value = 1;  // Console: "Count is now: 1"
count.value = 2;  // Console: "Count is now: 2"
```

## The Magic of Dependency Tracking

How do Signals know which computations depend on which signals? The answer is **runtime dependency collection**:

```
Execution flow:
┌─────────────────────────────────────────────────────┐
│ 1. Start executing computed/effect                  │
│ 2. Set current "subscriber" context                 │
│ 3. Execute function body                            │
│    └─> Accessing signal.value auto-registers dep    │
│ 4. Clear context                                    │
│ 5. When signal changes, notify all subscribers      │
└─────────────────────────────────────────────────────┘
```

```javascript
// Simplified implementation principle
let currentSubscriber = null;

function signal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  return {
    get value() {
      // Collect dependencies on read
      if (currentSubscriber) {
        subscribers.add(currentSubscriber);
      }
      return value;
    },
    set value(newValue) {
      value = newValue;
      // Notify subscribers on write
      subscribers.forEach(fn => fn());
    }
  };
}

function effect(fn) {
  currentSubscriber = fn;
  fn();  // First execution, collect dependencies
  currentSubscriber = null;
}
```

## Signals Across Frameworks

### Solid.js

Pioneer and best practice for Signals:

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

Can be used standalone or integrated with React:

```jsx
import { signal, computed } from '@preact/signals';
// Or '@preact/signals-react' for React

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

Vue's `ref` and `reactive` are essentially Signals:

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

Angular 16+ introduced Signals:

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

## Performance Benefits

### 1. Fine-Grained Updates

```
Traditional Virtual DOM:
┌─────────────────────────────────────┐
│ App component re-renders            │
│ ├─ Header re-renders                │
│ ├─ Content re-renders               │
│ │   ├─ Article re-renders           │
│ │   └─ Sidebar re-renders           │
│ └─ Footer re-renders                │
└─────────────────────────────────────┘

Signals:
┌─────────────────────────────────────┐
│ App                                 │
│ ├─ Header                           │
│ ├─ Content                          │
│ │   ├─ Article                      │
│ │   │   └─ [only this text updates]←│
│ │   └─ Sidebar                      │
│ └─ Footer                           │
└─────────────────────────────────────┘
```

### 2. No Manual Optimization Needed

```jsx
// React: Requires extensive optimization code
const MemoizedChild = React.memo(Child);
const handleClick = useCallback(() => {...}, [deps]);
const expensiveValue = useMemo(() => {...}, [deps]);

// Signals: Automatic precise updates, no optimization needed
const count = signal(0);  // That's it, done
```

### 3. Benchmarks

In JS Framework Benchmark, Signals-based frameworks (like Solid.js) are typically 2-10x faster than React, especially in scenarios with large data updates.

## Best Practices

### 1. Signal Granularity

```javascript
// ✅ Good: Fine-grained signals
const firstName = signal('John');
const lastName = signal('Doe');
const age = signal(25);

// ⚠️ Avoid: Coarse-grained object signals
const user = signal({
  firstName: 'John',
  lastName: 'Doe',
  age: 25
});
// Any property change triggers all dependent updates
```

### 2. Use Computed Instead of Effect

```javascript
// ✅ Good: Use computed for derived values
const fullName = computed(() =>
  firstName.value + ' ' + lastName.value
);

// ❌ Avoid: Using effect to simulate computed
let fullName = '';
effect(() => {
  fullName = firstName.value + ' ' + lastName.value;
});
```

### 3. Effect Cleanup

```javascript
effect(() => {
  const handler = () => console.log(count.value);
  window.addEventListener('resize', handler);

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handler);
  };
});
```

### 4. Batch Updates

```javascript
import { batch } from '@preact/signals';

// Multiple updates combined into one
batch(() => {
  firstName.value = 'Jane';
  lastName.value = 'Smith';
  age.value = 30;
});
// Subscribers only execute once
```

## TC39 Signals Proposal

Good news—Signals might become part of the JavaScript language! TC39 (JavaScript standards committee) is discussing the [Signals proposal](https://github.com/tc39/proposal-signals):

```javascript
// Possible future native syntax
const count = new Signal.State(0);
const doubled = new Signal.Computed(() => count.get() * 2);

Signal.subtle.Watcher(() => {
  console.log(count.get());
});
```

This would provide a unified low-level primitive for all frameworks, enabling better interoperability.

## When to Choose Signals?

### ✅ Ideal Scenarios

- **Performance-sensitive apps**: Large data, frequent updates
- **Complex state logic**: Multi-level derived state
- **New projects**: Can choose Signals-first frameworks
- **Gradual migration**: Preact Signals works with React

### ⚠️ Factors to Consider

- **Team familiarity**: New paradigm requires learning time
- **Ecosystem**: React ecosystem is still richest
- **Debugging tools**: Signals debugging experience is still evolving

## Summary

Signals represent a significant evolution in frontend reactive programming:

| Feature | useState/Virtual DOM | Signals |
|---------|---------------------|---------|
| Update Granularity | Component level | DOM node level |
| Dependency Tracking | Manual declaration | Automatic tracking |
| Optimization | memo/callback | Built-in |
| Mental Model | Function re-execution | Pub/Sub |

**Key Takeaways**:

1. Signal is a subscribable value container
2. Computed automatically derives and caches values
3. Effect responds to changes with side effects
4. Dependency tracking happens automatically at runtime
5. Fine-grained updates bring significant performance gains

Regardless of what framework you currently use, understanding Signals will help you become a better frontend developer. It's not just a technology—it's a new way of thinking about reactive programming.

---

*The future of reactive programming is here, and Signals are the key that opens the door.*
