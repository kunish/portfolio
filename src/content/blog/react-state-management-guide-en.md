---
title: 'Complete React State Management Guide: From Redux to Zustand'
description: 'Deep dive into modern frontend state management solutions, mastering Redux Toolkit, Zustand, Jotai, and React Query best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'react-state-management-guide'
---

State management is a core challenge in React applications. Choosing the right state management solution directly impacts your application's maintainability and performance. This article will take you deep into understanding the pros, cons, and use cases of various state management solutions.

## Types of State

### Understanding Different State Types

```
Types of State in React Applications:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Local State                                       │
│   ├── Form input values                             │
│   ├── UI state (modal open/close, dropdown expand)  │
│   └── Component-internal temporary data             │
│   → Use: useState, useReducer                       │
│                                                     │
│   Server State                                      │
│   ├── Data fetched from APIs                        │
│   ├── Needs caching, syncing, updating              │
│   └── Has loading, error, stale states              │
│   → Use: React Query, SWR, RTK Query                │
│                                                     │
│   Global State                                      │
│   ├── User authentication info                      │
│   ├── Theme, language preferences                   │
│   └── Cart, notifications shared across components  │
│   → Use: Context, Redux, Zustand, Jotai             │
│                                                     │
│   URL State                                         │
│   ├── Search parameters, filters                    │
│   └── Pagination info                               │
│   → Use: React Router, nuqs                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Choosing the Right Solution

| State Type | Recommended Solution | Reason |
|------------|---------------------|--------|
| Component UI state | useState | Simple and direct |
| Complex component logic | useReducer | Clear state transitions |
| Server data | React Query | Caching, sync, auto-retry |
| Cross-component (simple) | Context | Built-in, no dependencies |
| Cross-component (complex) | Zustand/Redux | Performance, DevTools |
| Atomic state | Jotai | Fine-grained updates |

## Built-in React Solutions

### useState and useReducer

```tsx
// useState: Good for simple state
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}

// useReducer: Good for complex state logic
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

// Usage
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

### Context Performance Issues and Solutions

```
Context Performance Problem:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Problem: All consumers re-render when Context     │
│            value changes                            │
│                                                     │
│   <UserContext.Provider value={{ user, settings }}> │
│       ├── ComponentA (only uses user)  → Re-render❌│
│       ├── ComponentB (only uses settings)→Re-render❌│
│       └── ComponentC (uses both)       → Re-render ✓│
│                                                     │
│   Solutions:                                        │
│   1. Split Context (separation of concerns)         │
│   2. Wrap value with useMemo                        │
│   3. Consider using Zustand/Jotai                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```tsx
// Split Context
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

Redux Toolkit (RTK) is the modern wrapper for Redux that greatly simplifies its usage.

### Basic Setup

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

// Typed Hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Creating Slices

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

// Async Thunks
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

### Component Usage

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

Zustand is a lightweight state management library with a simple API and excellent performance.

### Basic Usage

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

### Slice Pattern

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
  UserSlice & CartSlice, // Union of all slices
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

### Async Operations

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

### Selector Optimization

```tsx
// Avoid unnecessary re-renders
import { shallow } from 'zustand/shallow';

// ❌ Re-renders every time (returns new object)
const { todos, filter } = useTodoStore((state) => ({
  todos: state.todos,
  filter: state.filter,
}));

// ✅ Use shallow comparison
const { todos, filter } = useTodoStore(
  (state) => ({
    todos: state.todos,
    filter: state.filter,
  }),
  shallow
);

// ✅ Or select separately
const todos = useTodoStore((state) => state.todos);
const filter = useTodoStore((state) => state.filter);

// ✅ Use useShallow (Zustand v5+)
import { useShallow } from 'zustand/react/shallow';

const { todos, filter } = useTodoStore(
  useShallow((state) => ({
    todos: state.todos,
    filter: state.filter,
  }))
);
```

## Jotai

Jotai uses an atomic approach to state management, inspired by Recoil.

### Basic Usage

```typescript
// atoms/index.ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Basic atom
export const countAtom = atom(0);

// Derived atom (read-only)
export const doubleCountAtom = atom((get) => get(countAtom) * 2);

// Derived atom (writable)
export const countWithMaxAtom = atom(
  (get) => get(countAtom),
  (get, set, newValue: number) => {
    set(countAtom, Math.min(newValue, 100));
  }
);

// Persisted atom
export const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light');

// Async atom
export const userAtom = atom(async () => {
  const response = await fetch('/api/user');
  return response.json();
});
```

### Complex State

```typescript
// atoms/todos.ts
import { atom } from 'jotai';
import { atomWithStorage, splitAtom } from 'jotai/utils';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

// Base todos atom
export const todosAtom = atomWithStorage<Todo[]>('todos', []);

// Filter atom
export const filterAtom = atom<'all' | 'active' | 'completed'>('all');

// Derived: filtered todos
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

// Derived: stats
export const statsAtom = atom((get) => {
  const todos = get(todosAtom);
  const completed = todos.filter((t) => t.completed).length;
  return {
    total: todos.length,
    completed,
    active: todos.length - completed,
  };
});

// Action atoms
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

// Split atom (each todo updates independently)
export const todoAtomsAtom = splitAtom(todosAtom);
```

### Component Usage

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

React Query focuses on server state management, providing powerful data fetching and caching capabilities.

### Basic Setup

```tsx
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
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

### Queries and Mutations

```typescript
// hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

// API functions
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
      // Update list cache
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
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: postKeys.detail(updatedPost.id) });

      // Save previous value
      const previousPost = queryClient.getQueryData<Post>(
        postKeys.detail(updatedPost.id)
      );

      // Optimistic update
      queryClient.setQueryData<Post>(postKeys.detail(updatedPost.id), (old) =>
        old ? { ...old, ...updatedPost } : undefined
      );

      return { previousPost };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousPost) {
        queryClient.setQueryData(
          postKeys.detail(variables.id),
          context.previousPost
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch
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

### Infinite Scrolling

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

// Component usage
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

## Solution Comparison

```
State Management Solution Comparison:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Redux Toolkit                                     │
│   ├── Pros: Mature ecosystem, DevTools, rich       │
│   │         middleware                              │
│   ├── Cons: Learning curve, more boilerplate       │
│   └── Best for: Large apps, strict state management│
│                                                     │
│   Zustand                                           │
│   ├── Pros: Simple API, small size, good perf      │
│   ├── Cons: Smaller ecosystem                       │
│   └── Best for: Small-medium apps, simplicity      │
│                                                     │
│   Jotai                                             │
│   ├── Pros: Atomic, fine-grained updates, good     │
│   │         React integration                       │
│   ├── Cons: Paradigm shift                          │
│   └── Best for: Apps needing fine-grained control  │
│                                                     │
│   React Query                                       │
│   ├── Pros: Focused on server state, powerful      │
│   │         caching                                 │
│   ├── Cons: Only handles server state              │
│   └── Best for: Data-intensive apps                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Feature | Redux Toolkit | Zustand | Jotai | React Query |
|---------|---------------|---------|-------|-------------|
| Bundle Size | ~11KB | ~1KB | ~2KB | ~12KB |
| Learning Curve | Medium | Low | Low | Medium |
| TypeScript | Excellent | Excellent | Excellent | Excellent |
| DevTools | ✅ | ✅ | ✅ | ✅ |
| Persistence | Needs middleware | Built-in | Built-in | N/A |
| SSR Support | ✅ | ✅ | ✅ | ✅ |
| Use Case | Global state | Global state | Fine-grained | Server state |

## Best Practices

### Combining Solutions

```tsx
// Typical combo: Zustand + React Query
// Zustand for UI state, React Query for server state

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

// Use both in components
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

### State Normalization

```typescript
// Avoid nested data, use normalized structure
// ❌ Nested structure
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

// ✅ Normalized structure
interface NormalizedState {
  posts: Record<string, { id: string; title: string; authorId: string; commentIds: string[] }>;
  users: Record<string, { id: string; name: string }>;
  comments: Record<string, { id: string; text: string; authorId: string }>;
}
```

**Summary**:

1. Start with built-in solutions (useState, useReducer, Context)
2. Use React Query for server state
3. Use Zustand for simple global state
4. Use Redux Toolkit for complex global state or large teams
5. Use Jotai when you need fine-grained control

Choose the solution that fits your project scale and team familiarity.

---

*State management isn't about being more complex—it's about being simpler. Only introduce more complex tools when simple solutions aren't enough.*
