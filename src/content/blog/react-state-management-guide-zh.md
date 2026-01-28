---
title: 'React 状态管理完全指南：从 Redux 到 Zustand'
description: '深入理解现代前端状态管理方案，掌握 Redux Toolkit、Zustand、Jotai、React Query 等工具的最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'react-state-management-guide'
---

状态管理是 React 应用的核心挑战。选择正确的状态管理方案，直接影响应用的可维护性和性能。本文将带你深入理解各种状态管理方案的优劣和适用场景。

## 状态的分类

### 理解不同类型的状态

```
React 应用中的状态类型：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   本地状态 (Local State)                            │
│   ├── 表单输入值                                    │
│   ├── UI 状态（模态框开关、下拉展开）                │
│   └── 组件内部临时数据                              │
│   → 使用：useState, useReducer                      │
│                                                     │
│   服务端状态 (Server State)                         │
│   ├── 从 API 获取的数据                             │
│   ├── 需要缓存、同步、更新                          │
│   └── 有加载、错误、过期等状态                       │
│   → 使用：React Query, SWR, RTK Query               │
│                                                     │
│   全局状态 (Global State)                           │
│   ├── 用户认证信息                                  │
│   ├── 主题、语言偏好                                │
│   └── 购物车、通知等跨组件共享                       │
│   → 使用：Context, Redux, Zustand, Jotai            │
│                                                     │
│   URL 状态 (URL State)                              │
│   ├── 搜索参数、筛选条件                            │
│   └── 分页信息                                      │
│   → 使用：React Router, nuqs                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 选择合适的方案

| 状态类型 | 推荐方案 | 原因 |
|----------|----------|------|
| 组件内 UI 状态 | useState | 简单直接 |
| 复杂组件逻辑 | useReducer | 状态转换清晰 |
| 服务端数据 | React Query | 缓存、同步、自动重试 |
| 跨组件共享（简单）| Context | 内置，无依赖 |
| 跨组件共享（复杂）| Zustand/Redux | 性能优化，DevTools |
| 原子化状态 | Jotai | 细粒度更新 |

## React 内置方案

### useState 与 useReducer

```tsx
// useState：适合简单状态
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}

// useReducer：适合复杂状态逻辑
interface State {
  count: number;
  step: number;
}

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setStep'; payload: number }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.payload };
    case 'reset':
      return { count: 0, step: 1 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <input
        type="number"
        value={state.step}
        onChange={e => dispatch({ type: 'setStep', payload: +e.target.value })}
      />
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
}
```

### Context API

```tsx
// contexts/ThemeContext.tsx
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// 使用
function App() {
  return (
    <ThemeProvider>
      <Header />
      <Main />
    </ThemeProvider>
  );
}

function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={theme}>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </header>
  );
}
```

### Context 性能问题与解决

```
Context 的性能问题：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   问题：Context 值变化时，所有消费者都会重新渲染      │
│                                                     │
│   <UserContext.Provider value={{ user, settings }}> │
│       ├── ComponentA (只用 user)     → 重新渲染 ❌   │
│       ├── ComponentB (只用 settings) → 重新渲染 ❌   │
│       └── ComponentC (都用)          → 重新渲染 ✓   │
│                                                     │
│   解决方案：                                         │
│   1. 拆分 Context（按关注点分离）                    │
│   2. 使用 useMemo 包装 value                        │
│   3. 考虑使用 Zustand/Jotai 等库                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```tsx
// 拆分 Context
const UserContext = createContext<User | null>(null);
const SettingsContext = createContext<Settings | null>(null);

function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  return (
    <UserContext.Provider value={user}>
      <SettingsContext.Provider value={settings}>
        {children}
      </SettingsContext.Provider>
    </UserContext.Provider>
  );
}
```

## Redux Toolkit

Redux Toolkit (RTK) 是 Redux 的现代化封装，大幅简化了 Redux 的使用。

### 基础设置

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import counterReducer from './slices/counterSlice';
import todosReducer from './slices/todosSlice';
import { api } from './api';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    todos: todosReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 类型化的 Hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### 创建 Slice

```typescript
// store/slices/todosSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

interface TodosState {
  items: Todo[];
  loading: boolean;
  error: string | null;
}

const initialState: TodosState = {
  items: [],
  loading: false,
  error: null,
};

// 异步 Thunk
export const fetchTodos = createAsyncThunk(
  'todos/fetchTodos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    } catch (error) {
      return rejectWithValue('Failed to fetch todos');
    }
  }
);

export const addTodo = createAsyncThunk(
  'todos/addTodo',
  async (title: string, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('Failed to add');
      return response.json();
    } catch (error) {
      return rejectWithValue('Failed to add todo');
    }
  }
);

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    toggleTodo: (state, action: PayloadAction<string>) => {
      const todo = state.items.find(t => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    removeTodo: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    clearCompleted: (state) => {
      state.items = state.items.filter(t => !t.completed);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addTodo.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

export const { toggleTodo, removeTodo, clearCompleted } = todosSlice.actions;
export default todosSlice.reducer;

// Selectors
export const selectAllTodos = (state: RootState) => state.todos.items;
export const selectCompletedTodos = (state: RootState) =>
  state.todos.items.filter(t => t.completed);
export const selectActiveTodos = (state: RootState) =>
  state.todos.items.filter(t => !t.completed);
```

### RTK Query

```typescript
// store/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserDto {
  name: string;
  email: string;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Post'],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),

    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    createUser: builder.mutation<User, CreateUserDto>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    updateUser: builder.mutation<User, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = api;
```

### 组件中使用

```tsx
// components/UserList.tsx
import { useGetUsersQuery, useDeleteUserMutation } from '../store/api';

function UserList() {
  const { data: users, isLoading, error, refetch } = useGetUsersQuery();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading users</div>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {users?.map(user => (
          <li key={user.id}>
            {user.name} ({user.email})
            <button
              onClick={() => deleteUser(user.id)}
              disabled={isDeleting}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Zustand

Zustand 是一个轻量级的状态管理库，API 简洁，性能出色。

### 基础使用

```typescript
// stores/useStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

interface TodoStore {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';

  // Actions
  addTodo: (title: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
  clearCompleted: () => void;

  // Computed
  filteredTodos: () => Todo[];
  stats: () => { total: number; completed: number; active: number };
}

export const useTodoStore = create<TodoStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        todos: [],
        filter: 'all',

        addTodo: (title) =>
          set((state) => {
            state.todos.push({
              id: crypto.randomUUID(),
              title,
              completed: false,
            });
          }),

        toggleTodo: (id) =>
          set((state) => {
            const todo = state.todos.find(t => t.id === id);
            if (todo) {
              todo.completed = !todo.completed;
            }
          }),

        removeTodo: (id) =>
          set((state) => {
            state.todos = state.todos.filter(t => t.id !== id);
          }),

        setFilter: (filter) =>
          set({ filter }),

        clearCompleted: () =>
          set((state) => {
            state.todos = state.todos.filter(t => !t.completed);
          }),

        filteredTodos: () => {
          const { todos, filter } = get();
          switch (filter) {
            case 'active':
              return todos.filter(t => !t.completed);
            case 'completed':
              return todos.filter(t => t.completed);
            default:
              return todos;
          }
        },

        stats: () => {
          const { todos } = get();
          const completed = todos.filter(t => t.completed).length;
          return {
            total: todos.length,
            completed,
            active: todos.length - completed,
          };
        },
      })),
      { name: 'todo-storage' }
    ),
    { name: 'TodoStore' }
  )
);
```

### Slice 模式

```typescript
// stores/slices/userSlice.ts
import { StateCreator } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserSlice {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const createUserSlice: StateCreator<
  UserSlice & CartSlice, // 所有 slice 的联合类型
  [],
  [],
  UserSlice
> = (set) => ({
  user: null,
  isAuthenticated: false,

  login: (user) => set({ user, isAuthenticated: true }),

  logout: () => set({ user: null, isAuthenticated: false }),

  updateProfile: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),
});

// stores/slices/cartSlice.ts
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartSlice {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const createCartSlice: StateCreator<
  UserSlice & CartSlice,
  [],
  [],
  CartSlice
> = (set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find(i => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter(i => i.id !== id),
    })),

  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map(i =>
        i.id === id ? { ...i, quantity } : i
      ),
    })),

  clearCart: () => set({ items: [] }),

  total: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
});

// stores/index.ts
import { create } from 'zustand';
import { createUserSlice, UserSlice } from './slices/userSlice';
import { createCartSlice, CartSlice } from './slices/cartSlice';

export const useStore = create<UserSlice & CartSlice>()((...args) => ({
  ...createUserSlice(...args),
  ...createCartSlice(...args),
}));
```

### 异步操作

```typescript
// stores/useAsyncStore.ts
import { create } from 'zustand';

interface Post {
  id: number;
  title: string;
  body: string;
}

interface PostStore {
  posts: Post[];
  loading: boolean;
  error: string | null;
  fetchPosts: () => Promise<void>;
  createPost: (data: Omit<Post, 'id'>) => Promise<void>;
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  loading: false,
  error: null,

  fetchPosts: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/posts');
      if (!response.ok) throw new Error('Failed to fetch');
      const posts = await response.json();
      set({ posts, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createPost: async (data) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create');
      const post = await response.json();
      set((state) => ({
        posts: [...state.posts, post],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
```

### 选择器优化

```tsx
// 避免不必要的重新渲染
import { shallow } from 'zustand/shallow';

// ❌ 每次都会重新渲染（返回新对象）
const { todos, filter } = useTodoStore((state) => ({
  todos: state.todos,
  filter: state.filter,
}));

// ✅ 使用 shallow 比较
const { todos, filter } = useTodoStore(
  (state) => ({
    todos: state.todos,
    filter: state.filter,
  }),
  shallow
);

// ✅ 或者分开选择
const todos = useTodoStore((state) => state.todos);
const filter = useTodoStore((state) => state.filter);

// ✅ 使用 useShallow (Zustand v5+)
import { useShallow } from 'zustand/react/shallow';

const { todos, filter } = useTodoStore(
  useShallow((state) => ({
    todos: state.todos,
    filter: state.filter,
  }))
);
```

## Jotai

Jotai 采用原子化的状态管理方式，灵感来自 Recoil。

### 基础使用

```typescript
// atoms/index.ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// 基础原子
export const countAtom = atom(0);

// 派生原子（只读）
export const doubleCountAtom = atom((get) => get(countAtom) * 2);

// 派生原子（可写）
export const countWithMaxAtom = atom(
  (get) => get(countAtom),
  (get, set, newValue: number) => {
    set(countAtom, Math.min(newValue, 100));
  }
);

// 持久化原子
export const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light');

// 异步原子
export const userAtom = atom(async () => {
  const response = await fetch('/api/user');
  return response.json();
});
```

### 复杂状态

```typescript
// atoms/todos.ts
import { atom } from 'jotai';
import { atomWithStorage, splitAtom } from 'jotai/utils';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

// 基础 todos 原子
export const todosAtom = atomWithStorage<Todo[]>('todos', []);

// 过滤器原子
export const filterAtom = atom<'all' | 'active' | 'completed'>('all');

// 派生：过滤后的 todos
export const filteredTodosAtom = atom((get) => {
  const todos = get(todosAtom);
  const filter = get(filterAtom);

  switch (filter) {
    case 'active':
      return todos.filter((t) => !t.completed);
    case 'completed':
      return todos.filter((t) => t.completed);
    default:
      return todos;
  }
});

// 派生：统计
export const statsAtom = atom((get) => {
  const todos = get(todosAtom);
  const completed = todos.filter((t) => t.completed).length;
  return {
    total: todos.length,
    completed,
    active: todos.length - completed,
  };
});

// 操作原子
export const addTodoAtom = atom(null, (get, set, title: string) => {
  const todos = get(todosAtom);
  set(todosAtom, [
    ...todos,
    { id: crypto.randomUUID(), title, completed: false },
  ]);
});

export const toggleTodoAtom = atom(null, (get, set, id: string) => {
  const todos = get(todosAtom);
  set(
    todosAtom,
    todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
  );
});

export const removeTodoAtom = atom(null, (get, set, id: string) => {
  const todos = get(todosAtom);
  set(
    todosAtom,
    todos.filter((t) => t.id !== id)
  );
});

// 拆分原子（每个 todo 独立更新）
export const todoAtomsAtom = splitAtom(todosAtom);
```

### 组件使用

```tsx
// components/TodoApp.tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  filteredTodosAtom,
  filterAtom,
  statsAtom,
  addTodoAtom,
  toggleTodoAtom,
  removeTodoAtom,
} from '../atoms/todos';

function TodoStats() {
  const stats = useAtomValue(statsAtom);

  return (
    <div>
      Total: {stats.total} | Active: {stats.active} | Completed: {stats.completed}
    </div>
  );
}

function TodoFilter() {
  const [filter, setFilter] = useAtom(filterAtom);

  return (
    <div>
      {(['all', 'active', 'completed'] as const).map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          style={{ fontWeight: filter === f ? 'bold' : 'normal' }}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

function AddTodo() {
  const [title, setTitle] = useState('');
  const addTodo = useSetAtom(addTodoAtom);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addTodo(title.trim());
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add todo..."
      />
      <button type="submit">Add</button>
    </form>
  );
}

function TodoList() {
  const todos = useAtomValue(filteredTodosAtom);
  const toggleTodo = useSetAtom(toggleTodoAtom);
  const removeTodo = useSetAtom(removeTodoAtom);

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            {todo.title}
          </span>
          <button onClick={() => removeTodo(todo.id)}>×</button>
        </li>
      ))}
    </ul>
  );
}

function TodoApp() {
  return (
    <div>
      <AddTodo />
      <TodoFilter />
      <TodoList />
      <TodoStats />
    </div>
  );
}
```

## React Query / TanStack Query

React Query 专注于服务端状态管理，提供强大的数据获取和缓存能力。

### 基础设置

```tsx
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟
      gcTime: 1000 * 60 * 30, // 30 分钟
      retry: 3,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 查询与变更

```typescript
// hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

// API 函数
const api = {
  getPosts: async (): Promise<Post[]> => {
    const res = await fetch('/api/posts');
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  },

  getPost: async (id: string): Promise<Post> => {
    const res = await fetch(`/api/posts/${id}`);
    if (!res.ok) throw new Error('Failed to fetch post');
    return res.json();
  },

  createPost: async (data: Omit<Post, 'id'>): Promise<Post> => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create post');
    return res.json();
  },

  updatePost: async ({ id, ...data }: Partial<Post> & { id: string }): Promise<Post> => {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update post');
    return res.json();
  },

  deletePost: async (id: string): Promise<void> => {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete post');
  },
};

// Query Keys
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: object) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};

// Hooks
export function usePosts() {
  return useQuery({
    queryKey: postKeys.lists(),
    queryFn: api.getPosts,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => api.getPost(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createPost,
    onSuccess: (newPost) => {
      // 更新列表缓存
      queryClient.setQueryData<Post[]>(postKeys.lists(), (old) =>
        old ? [...old, newPost] : [newPost]
      );
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updatePost,
    onMutate: async (updatedPost) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: postKeys.detail(updatedPost.id) });

      // 保存之前的值
      const previousPost = queryClient.getQueryData<Post>(
        postKeys.detail(updatedPost.id)
      );

      // 乐观更新
      queryClient.setQueryData<Post>(postKeys.detail(updatedPost.id), (old) =>
        old ? { ...old, ...updatedPost } : undefined
      );

      return { previousPost };
    },
    onError: (err, variables, context) => {
      // 回滚
      if (context?.previousPost) {
        queryClient.setQueryData(
          postKeys.detail(variables.id),
          context.previousPost
        );
      }
    },
    onSettled: (data, error, variables) => {
      // 重新获取
      queryClient.invalidateQueries({ queryKey: postKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deletePost,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Post[]>(postKeys.lists(), (old) =>
        old?.filter((post) => post.id !== deletedId)
      );
      queryClient.removeQueries({ queryKey: postKeys.detail(deletedId) });
    },
  });
}
```

### 无限滚动

```typescript
// hooks/useInfinitePosts.ts
import { useInfiniteQuery } from '@tanstack/react-query';

interface PostsPage {
  posts: Post[];
  nextCursor: string | null;
}

async function fetchPostsPage(cursor?: string): Promise<PostsPage> {
  const url = cursor ? `/api/posts?cursor=${cursor}` : '/api/posts';
  const res = await fetch(url);
  return res.json();
}

export function useInfinitePosts() {
  return useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: ({ pageParam }) => fetchPostsPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

// 组件使用
function InfinitePostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfinitePosts();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </React.Fragment>
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## 方案对比

```
状态管理方案对比：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Redux Toolkit                                     │
│   ├── 优点：成熟生态、DevTools、中间件丰富           │
│   ├── 缺点：学习曲线、boilerplate 相对多            │
│   └── 适合：大型应用、需要严格状态管理               │
│                                                     │
│   Zustand                                           │
│   ├── 优点：简洁 API、体积小、性能好                 │
│   ├── 缺点：生态较小                                │
│   └── 适合：中小型应用、追求简洁                     │
│                                                     │
│   Jotai                                             │
│   ├── 优点：原子化、细粒度更新、React 集成好         │
│   ├── 缺点：思维模式转变                            │
│   └── 适合：需要精细控制更新的应用                   │
│                                                     │
│   React Query                                       │
│   ├── 优点：专注服务端状态、缓存强大                 │
│   ├── 缺点：只处理服务端状态                        │
│   └── 适合：数据密集型应用                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 特性 | Redux Toolkit | Zustand | Jotai | React Query |
|------|---------------|---------|-------|-------------|
| 包大小 | ~11KB | ~1KB | ~2KB | ~12KB |
| 学习曲线 | 中等 | 低 | 低 | 中等 |
| TypeScript | 优秀 | 优秀 | 优秀 | 优秀 |
| DevTools | ✅ | ✅ | ✅ | ✅ |
| 持久化 | 需中间件 | 内置 | 内置 | 不适用 |
| SSR 支持 | ✅ | ✅ | ✅ | ✅ |
| 适用场景 | 全局状态 | 全局状态 | 细粒度状态 | 服务端状态 |

## 最佳实践

### 组合使用

```tsx
// 典型组合：Zustand + React Query
// Zustand 管理 UI 状态，React Query 管理服务端状态

// stores/uiStore.ts
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  theme: 'light',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));

// hooks/useUsers.ts
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
}

// 组件中同时使用
function Dashboard() {
  const { sidebarOpen } = useUIStore();
  const { data: users, isLoading } = useUsers();

  return (
    <Layout sidebarOpen={sidebarOpen}>
      {isLoading ? <Loading /> : <UserList users={users} />}
    </Layout>
  );
}
```

### 状态规范化

```typescript
// 避免嵌套数据，使用规范化结构
// ❌ 嵌套结构
interface State {
  posts: Array<{
    id: string;
    title: string;
    author: {
      id: string;
      name: string;
    };
    comments: Array<{
      id: string;
      text: string;
      author: { id: string; name: string };
    }>;
  }>;
}

// ✅ 规范化结构
interface NormalizedState {
  posts: Record<string, { id: string; title: string; authorId: string; commentIds: string[] }>;
  users: Record<string, { id: string; name: string }>;
  comments: Record<string, { id: string; text: string; authorId: string }>;
}
```

**总结**：

1. 先用内置方案（useState、useReducer、Context）
2. 服务端状态用 React Query
3. 简单全局状态用 Zustand
4. 复杂全局状态或大型团队用 Redux Toolkit
5. 需要细粒度控制用 Jotai

选择适合你项目规模和团队熟悉度的方案。

---

*状态管理不是越复杂越好，而是越简单越好。只有当简单方案不够用时，才引入更复杂的工具。*
