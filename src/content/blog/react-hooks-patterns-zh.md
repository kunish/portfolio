---
title: 'React Hooks 进阶指南：自定义 Hooks 与最佳实践'
description: '深入理解 useState、useEffect、useCallback 等常用 Hooks 及自定义 Hooks 模式'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'react-hooks-patterns'
---

React Hooks 改变了组件的编写方式。本文探讨常用 Hooks 的深入用法和自定义 Hooks 模式。

## 状态管理 Hooks

### useState 进阶

```tsx
import { useState, useCallback } from 'react';

// 惰性初始化
function ExpensiveComponent() {
  // 仅在首次渲染时计算初始值
  const [data, setData] = useState(() => {
    return computeExpensiveValue();
  });

  return <div>{data}</div>;
}

// 函数式更新
function Counter() {
  const [count, setCount] = useState(0);

  // 基于前值更新（推荐）
  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  // 批量更新多次
  const incrementByThree = useCallback(() => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
  }, []);

  return (
    <button onClick={increment}>
      Count: {count}
    </button>
  );
}
```

### useReducer 复杂状态

```tsx
import { useReducer } from 'react';

interface State {
  count: number;
  step: number;
}

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setStep'; payload: number }
  | { type: 'reset' };

const initialState: State = { count: 0, step: 1 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.payload };
    case 'reset':
      return initialState;
    default:
      return state;
  }
}

function StepCounter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>Count: {state.count}</p>
      <input
        type="number"
        value={state.step}
        onChange={e => dispatch({
          type: 'setStep',
          payload: Number(e.target.value)
        })}
      />
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
}
```

## 副作用 Hooks

### useEffect 依赖管理

```tsx
import { useEffect, useState } from 'react';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();

        // 检查是否已取消
        if (!cancelled) {
          setUser(data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    // 清理函数
    return () => {
      cancelled = true;
    };
  }, [userId]); // 仅 userId 变化时重新获取

  if (loading) return <div>Loading...</div>;
  return <div>{user?.name}</div>;
}
```

### useLayoutEffect 同步更新

```tsx
import { useLayoutEffect, useRef, useState } from 'react';

function Tooltip({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // 在浏览器绘制前同步执行
  useLayoutEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  }, [text]);

  return (
    <div ref={ref}>
      {text}
      <span style={{ left: position.x, top: position.y }}>
        Tooltip
      </span>
    </div>
  );
}
```

## 性能优化 Hooks

### useMemo 缓存计算

```tsx
import { useMemo, useState } from 'react';

interface Item {
  id: number;
  category: string;
  name: string;
}

function FilteredList({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'category'>('name');

  // 仅在 items、filter、sortBy 变化时重新计算
  const filteredAndSorted = useMemo(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );

    return filtered.sort((a, b) =>
      a[sortBy].localeCompare(b[sortBy])
    );
  }, [items, filter, sortBy]);

  return (
    <div>
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter..."
      />
      <select
        value={sortBy}
        onChange={e => setSortBy(e.target.value as 'name' | 'category')}
      >
        <option value="name">Name</option>
        <option value="category">Category</option>
      </select>
      <ul>
        {filteredAndSorted.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### useCallback 缓存函数

```tsx
import { useCallback, useState, memo } from 'react';

interface ButtonProps {
  onClick: () => void;
  label: string;
}

// 使用 memo 包装子组件
const ExpensiveButton = memo(function ExpensiveButton({
  onClick,
  label
}: ButtonProps) {
  console.log('Button rendered:', label);
  return <button onClick={onClick}>{label}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  // 使用 useCallback 避免每次渲染创建新函数
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []); // 无依赖，函数永不改变

  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <p>Count: {count}</p>
      {/* 即使 text 变化，Button 也不会重新渲染 */}
      <ExpensiveButton onClick={handleClick} label="Increment" />
    </div>
  );
}
```

## Ref 相关 Hooks

### useRef 多种用途

```tsx
import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

// 1. DOM 引用
function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
    </div>
  );
}

// 2. 保存可变值（不触发重渲染）
function Timer() {
  const intervalRef = useRef<number | null>(null);
  const countRef = useRef(0);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      countRef.current += 1;
      console.log('Count:', countRef.current);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return <div>Check console for count</div>;
}

// 3. forwardRef + useImperativeHandle
interface InputHandle {
  focus: () => void;
  clear: () => void;
}

const FancyInput = forwardRef<InputHandle, {}>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => {
      if (inputRef.current) inputRef.current.value = '';
    }
  }));

  return <input ref={inputRef} {...props} />;
});
```

## 自定义 Hooks

### useLocalStorage

```tsx
import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  // 惰性初始化
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // 同步到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

// 使用
function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <select value={theme} onChange={e => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
```

### useDebounce

```tsx
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 使用
function SearchInput() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch) {
      // 执行搜索
      console.log('Searching:', debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={search}
      onChange={e => setSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### useFetch

```tsx
import { useState, useEffect } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch failed');
        const data = await response.json();

        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ data: null, loading: false, error: error as Error });
        }
      }
    }

    fetchData();

    return () => { cancelled = true; };
  }, [url]);

  return state;
}

// 使用
function UserList() {
  const { data, loading, error } = useFetch<User[]>('/api/users');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

### useClickOutside

```tsx
import { useEffect, useRef } from 'react';

function useClickOutside<T extends HTMLElement>(
  handler: () => void
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [handler]);

  return ref;
}

// 使用
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  return (
    <div ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && <div className="menu">Menu Content</div>}
    </div>
  );
}
```

## Hooks 规则与最佳实践

```
Hooks 规则：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   必须遵守                                          │
│   ├── 只在函数组件顶层调用                         │
│   ├── 不在条件、循环中调用                         │
│   └── 只在 React 函数中调用                        │
│                                                     │
│   最佳实践                                          │
│   ├── 按功能拆分自定义 Hook                        │
│   ├── 使用 ESLint 插件检查依赖                     │
│   ├── 合理使用 useMemo/useCallback                 │
│   └── 清理副作用避免内存泄漏                       │
│                                                     │
│   性能优化                                          │
│   ├── 避免过度优化                                 │
│   ├── 先测量再优化                                 │
│   └── 使用 React DevTools Profiler                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Hook | 用途 |
|------|------|
| useState | 基础状态管理 |
| useReducer | 复杂状态逻辑 |
| useEffect | 副作用处理 |
| useMemo | 缓存计算结果 |
| useCallback | 缓存函数引用 |
| useRef | DOM 引用或可变值 |

---

*掌握 Hooks，让 React 组件简洁而强大。*
