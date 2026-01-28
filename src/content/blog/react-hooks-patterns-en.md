---
title: 'React Hooks Advanced Guide: Custom Hooks and Best Practices'
description: 'Deep dive into useState, useEffect, useCallback and other common Hooks plus custom Hook patterns'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'react-hooks-patterns'
---

React Hooks changed how we write components. This article explores in-depth usage of common Hooks and custom Hook patterns.

## State Management Hooks

### useState Advanced

```tsx
import { useState, useCallback } from 'react';

// Lazy initialization
function ExpensiveComponent() {
  // Initial value computed only on first render
  const [data, setData] = useState(() => {
    return computeExpensiveValue();
  });

  return <div>{data}</div>;
}

// Functional updates
function Counter() {
  const [count, setCount] = useState(0);

  // Update based on previous value (recommended)
  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  // Batch multiple updates
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

### useReducer for Complex State

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

## Side Effect Hooks

### useEffect Dependency Management

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

        // Check if cancelled
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

    // Cleanup function
    return () => {
      cancelled = true;
    };
  }, [userId]); // Re-fetch only when userId changes

  if (loading) return <div>Loading...</div>;
  return <div>{user?.name}</div>;
}
```

### useLayoutEffect for Synchronous Updates

```tsx
import { useLayoutEffect, useRef, useState } from 'react';

function Tooltip({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Runs synchronously before browser paint
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

## Performance Optimization Hooks

### useMemo for Cached Computation

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

  // Recompute only when items, filter, or sortBy changes
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

### useCallback for Cached Functions

```tsx
import { useCallback, useState, memo } from 'react';

interface ButtonProps {
  onClick: () => void;
  label: string;
}

// Wrap child component with memo
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

  // Use useCallback to avoid creating new function each render
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []); // No dependencies, function never changes

  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <p>Count: {count}</p>
      {/* Button won't re-render even when text changes */}
      <ExpensiveButton onClick={handleClick} label="Increment" />
    </div>
  );
}
```

## Ref Related Hooks

### useRef Multiple Uses

```tsx
import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

// 1. DOM reference
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

// 2. Store mutable value (doesn't trigger re-render)
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

## Custom Hooks

### useLocalStorage

```tsx
import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  // Lazy initialization
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

// Usage
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

// Usage
function SearchInput() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch) {
      // Perform search
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

// Usage
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

// Usage
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

## Hooks Rules and Best Practices

```
Hooks Rules:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Must Follow                                       │
│   ├── Only call at top level of function          │
│   ├── Don't call in conditions or loops           │
│   └── Only call in React functions                │
│                                                     │
│   Best Practices                                    │
│   ├── Split custom Hooks by functionality         │
│   ├── Use ESLint plugin for dependency checks     │
│   ├── Use useMemo/useCallback appropriately       │
│   └── Clean up effects to prevent memory leaks    │
│                                                     │
│   Performance                                       │
│   ├── Avoid premature optimization                │
│   ├── Measure before optimizing                   │
│   └── Use React DevTools Profiler                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Hook | Purpose |
|------|---------|
| useState | Basic state management |
| useReducer | Complex state logic |
| useEffect | Side effect handling |
| useMemo | Cache computed values |
| useCallback | Cache function references |
| useRef | DOM refs or mutable values |

---

*Master Hooks and make React components simple yet powerful.*
