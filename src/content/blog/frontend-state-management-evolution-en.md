---
title: 'Frontend State Management: Evolution from Redux to Modern Solutions'
description: 'Master state management solutions including Redux, Zustand, Jotai, React Query - selection and practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'frontend-state-management-evolution'
---

State management is a core challenge in frontend applications. This article explores the evolution from traditional to modern state management solutions and best practices.

## State Management Overview

### Types of State

```
Application State Categories:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Server State                                      │
│   ├── Data from APIs                               │
│   ├── Needs caching and synchronization           │
│   └── React Query / SWR                            │
│                                                     │
│   Client State                                      │
│   ├── UI state (modals, sidebars)                 │
│   ├── Form state                                   │
│   └── User preferences                             │
│                                                     │
│   URL State                                         │
│   ├── Route parameters                             │
│   ├── Query strings                                │
│   └── Shareable, bookmarkable                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| State Type | Recommended Solution | Characteristics |
|-----------|---------------------|-----------------|
| Server State | React Query | Cache, sync, invalidate |
| Global Client | Zustand/Jotai | Simple, efficient |
| Form State | React Hook Form | Performance optimized |
| URL State | Router State | Shareable |

## Redux and Redux Toolkit

### Modern Redux Toolkit Usage

```typescript
// store/slices/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  users: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: Omit<User, 'id'>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User> & { id: string }>) => {
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      });
  },
});

export const { setCurrentUser, clearCurrentUser, updateUser } = userSlice.actions;
export default userSlice.reducer;
```

### Store Configuration

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import userReducer from './slices/userSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
  reducer: {
    users: userReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed Hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

## Zustand: Lightweight Solution

### Basic Usage

```typescript
// stores/useStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      immer((set, get) => ({
        items: [],
        total: 0,

        addItem: (item) =>
          set((state) => {
            const existing = state.items.find((i) => i.id === item.id);
            if (existing) {
              existing.quantity += 1;
            } else {
              state.items.push({ ...item, quantity: 1 });
            }
            state.total = calculateTotal(state.items);
          }),

        removeItem: (id) =>
          set((state) => {
            state.items = state.items.filter((i) => i.id !== id);
            state.total = calculateTotal(state.items);
          }),

        updateQuantity: (id, quantity) =>
          set((state) => {
            const item = state.items.find((i) => i.id === id);
            if (item) {
              item.quantity = quantity;
              state.total = calculateTotal(state.items);
            }
          }),

        clearCart: () =>
          set((state) => {
            state.items = [];
            state.total = 0;
          }),
      })),
      { name: 'cart-storage' }
    )
  )
);

function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

### Zustand Selector Optimization

```typescript
// Fine-grained selectors to avoid unnecessary re-renders
import { shallow } from 'zustand/shallow';

// Subscribe only to needed state
function CartIcon() {
  const itemCount = useCartStore((state) => state.items.length);
  return <span>Cart ({itemCount})</span>;
}

// Multiple values with shallow comparison
function CartSummary() {
  const { items, total } = useCartStore(
    (state) => ({ items: state.items, total: state.total }),
    shallow
  );

  return (
    <div>
      <p>{items.length} items</p>
      <p>Total: ${total}</p>
    </div>
  );
}

// Derived state hooks
const useCartItemCount = () => useCartStore((state) => state.items.length);
const useCartTotal = () => useCartStore((state) => state.total);
```

## Jotai: Atomic State

### Basic Atoms

```typescript
// atoms/index.ts
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage, atomWithQuery } from 'jotai/utils';

// Basic atom
export const countAtom = atom(0);

// Derived atom (read-only)
export const doubleCountAtom = atom((get) => get(countAtom) * 2);

// Derived atom (writable)
export const countWithLimitAtom = atom(
  (get) => get(countAtom),
  (get, set, newValue: number) => {
    set(countAtom, Math.min(100, Math.max(0, newValue)));
  }
);

// Persistent atom
export const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light');

// User state
interface User {
  id: string;
  name: string;
  email: string;
}

export const userAtom = atom<User | null>(null);
export const isLoggedInAtom = atom((get) => get(userAtom) !== null);

// Async atom
export const userDataAtom = atom(async (get) => {
  const user = get(userAtom);
  if (!user) return null;

  const response = await fetch(`/api/users/${user.id}`);
  return response.json();
});
```

### Component Usage

```tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { countAtom, doubleCountAtom, themeAtom } from './atoms';

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const doubleCount = useAtomValue(doubleCountAtom);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Double: {doubleCount}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}

// Only need the setter
function ResetButton() {
  const setCount = useSetAtom(countAtom);
  return <button onClick={() => setCount(0)}>Reset</button>;
}
```

## React Query: Server State

### Queries and Mutations

```typescript
// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
}

// Fetch all users
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes before refetch
  });
}

// Fetch single user
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async (): Promise<User> => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!userId, // Only execute when userId exists
  });
}

// Create user
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newUser: Omit<User, 'id'>): Promise<User> => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      return response.json();
    },
    onSuccess: (newUser) => {
      // Update cache
      queryClient.setQueryData(['users'], (old: User[] = []) => [
        ...old,
        newUser,
      ]);
    },
  });
}

// Update user
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: User): Promise<User> => {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      return response.json();
    },
    onMutate: async (newUser) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['users', newUser.id] });

      // Save previous value
      const previousUser = queryClient.getQueryData(['users', newUser.id]);

      // Optimistic update
      queryClient.setQueryData(['users', newUser.id], newUser);

      return { previousUser };
    },
    onError: (err, newUser, context) => {
      // Rollback
      queryClient.setQueryData(['users', newUser.id], context?.previousUser);
    },
    onSettled: (data, error, variables) => {
      // Refetch
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
}
```

### Infinite Scrolling

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

interface Page {
  items: User[];
  nextCursor?: string;
}

export function useInfiniteUsers() {
  return useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: async ({ pageParam }): Promise<Page> => {
      const url = pageParam
        ? `/api/users?cursor=${pageParam}`
        : '/api/users';
      const response = await fetch(url);
      return response.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

// Component usage
function UserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUsers();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.items.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
```

## State Management Selection

### Decision Tree

```
State Management Decision:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Need server state caching?                        │
│   ├── Yes → React Query / SWR                      │
│   └── No ↓                                          │
│                                                     │
│   Need cross-component sharing?                     │
│   ├── No → useState / useReducer                   │
│   └── Yes ↓                                         │
│                                                     │
│   Complex state update logic?                       │
│   ├── Yes → Redux Toolkit                          │
│   └── No ↓                                          │
│                                                     │
│   Need fine-grained subscriptions?                  │
│   ├── Yes → Jotai / Recoil                         │
│   └── No → Zustand                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Best Practices Summary

```
State Management Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   State Classification                              │
│   ├── Distinguish server vs client state          │
│   ├── Minimize global state                        │
│   ├── Prefer local state                          │
│   └── URL state for shareable data                │
│                                                     │
│   Performance Optimization                          │
│   ├── Fine-grained selectors                      │
│   ├── Avoid unnecessary re-renders                │
│   ├── Use derived state                           │
│   └── Appropriate caching strategies              │
│                                                     │
│   Code Organization                                 │
│   ├── Organize by feature modules                 │
│   ├── Type safety                                  │
│   ├── Separation of concerns                      │
│   └── Testability                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Solution | Use Case | Learning Curve | Bundle Size |
|----------|----------|----------------|-------------|
| Redux Toolkit | Large apps | Medium | ~12KB |
| Zustand | Small-medium apps | Low | ~1KB |
| Jotai | Fine-grained updates | Low | ~2KB |
| React Query | Server state | Medium | ~12KB |

Choose the right state management solution to keep application state clear and controllable, making development smooth and efficient.

---

*State is the lifeblood of your application. Manage state well to keep your app vibrant.*
