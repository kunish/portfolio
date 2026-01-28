---
title: '前端状态管理：从 Redux 到现代方案的演进'
description: '掌握 Redux、Zustand、Jotai、React Query 等状态管理方案的选型与实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'frontend-state-management-evolution'
---

状态管理是前端应用的核心挑战。本文探讨从传统到现代的状态管理方案演进与最佳实践。

## 状态管理概述

### 状态类型

```
应用状态分类：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   服务端状态                                        │
│   ├── 来自 API 的数据                              │
│   ├── 需要缓存和同步                                │
│   └── React Query / SWR                            │
│                                                     │
│   客户端状态                                        │
│   ├── UI 状态（模态框、侧边栏）                    │
│   ├── 表单状态                                      │
│   └── 用户偏好设置                                  │
│                                                     │
│   URL 状态                                          │
│   ├── 路由参数                                      │
│   ├── 查询字符串                                    │
│   └── 可分享、可书签                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 状态类型 | 推荐方案 | 特点 |
|----------|----------|------|
| 服务端状态 | React Query | 缓存、同步、失效 |
| 全局客户端 | Zustand/Jotai | 简单、高效 |
| 表单状态 | React Hook Form | 性能优化 |
| URL 状态 | Router State | 可分享 |

## Redux 与 Redux Toolkit

### Redux Toolkit 现代用法

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

// 异步 Thunk
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

### Store 配置

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

// 类型化 Hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

## Zustand：轻量级方案

### 基础用法

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

### Zustand 选择器优化

```typescript
// 细粒度选择器避免不必要重渲染
import { shallow } from 'zustand/shallow';

// 只订阅需要的状态
function CartIcon() {
  const itemCount = useCartStore((state) => state.items.length);
  return <span>Cart ({itemCount})</span>;
}

// 多个值使用 shallow 比较
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

// 派生状态
const useCartItemCount = () => useCartStore((state) => state.items.length);
const useCartTotal = () => useCartStore((state) => state.total);
```

## Jotai：原子化状态

### 基础原子

```typescript
// atoms/index.ts
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage, atomWithQuery } from 'jotai/utils';

// 基础原子
export const countAtom = atom(0);

// 派生原子（只读）
export const doubleCountAtom = atom((get) => get(countAtom) * 2);

// 派生原子（可写）
export const countWithLimitAtom = atom(
  (get) => get(countAtom),
  (get, set, newValue: number) => {
    set(countAtom, Math.min(100, Math.max(0, newValue)));
  }
);

// 持久化原子
export const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light');

// 用户状态
interface User {
  id: string;
  name: string;
  email: string;
}

export const userAtom = atom<User | null>(null);
export const isLoggedInAtom = atom((get) => get(userAtom) !== null);

// 异步原子
export const userDataAtom = atom(async (get) => {
  const user = get(userAtom);
  if (!user) return null;

  const response = await fetch(`/api/users/${user.id}`);
  return response.json();
});
```

### 组件使用

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

// 只需要 setter
function ResetButton() {
  const setCount = useSetAtom(countAtom);
  return <button onClick={() => setCount(0)}>Reset</button>;
}
```

## React Query：服务端状态

### 查询与变更

```typescript
// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
}

// 查询所有用户
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 分钟内不会重新获取
  });
}

// 查询单个用户
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async (): Promise<User> => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!userId, // 只在有 userId 时执行
  });
}

// 创建用户
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
      // 更新缓存
      queryClient.setQueryData(['users'], (old: User[] = []) => [
        ...old,
        newUser,
      ]);
    },
  });
}

// 更新用户
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
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['users', newUser.id] });

      // 保存之前的值
      const previousUser = queryClient.getQueryData(['users', newUser.id]);

      // 乐观更新
      queryClient.setQueryData(['users', newUser.id], newUser);

      return { previousUser };
    },
    onError: (err, newUser, context) => {
      // 回滚
      queryClient.setQueryData(['users', newUser.id], context?.previousUser);
    },
    onSettled: (data, error, variables) => {
      // 重新获取
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
}
```

### 无限滚动

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

// 组件使用
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

## 状态管理选型

### 决策树

```
状态管理选型决策：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   是否需要服务端状态缓存？                          │
│   ├── 是 → React Query / SWR                       │
│   └── 否 ↓                                          │
│                                                     │
│   状态是否需要跨组件共享？                          │
│   ├── 否 → useState / useReducer                   │
│   └── 是 ↓                                          │
│                                                     │
│   是否有复杂的状态更新逻辑？                        │
│   ├── 是 → Redux Toolkit                           │
│   └── 否 ↓                                          │
│                                                     │
│   是否需要细粒度订阅？                              │
│   ├── 是 → Jotai / Recoil                          │
│   └── 否 → Zustand                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 最佳实践总结

```
状态管理最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   状态分类                                          │
│   ├── 区分服务端和客户端状态                        │
│   ├── 最小化全局状态                                │
│   ├── 优先使用本地状态                              │
│   └── URL 状态用于可分享数据                        │
│                                                     │
│   性能优化                                          │
│   ├── 细粒度选择器                                  │
│   ├── 避免不必要重渲染                              │
│   ├── 使用派生状态                                  │
│   └── 适当的缓存策略                                │
│                                                     │
│   代码组织                                          │
│   ├── 按功能模块组织                                │
│   ├── 类型安全                                      │
│   ├── 关注点分离                                    │
│   └── 可测试性                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 方案 | 适用场景 | 学习曲线 | 包大小 |
|------|----------|----------|--------|
| Redux Toolkit | 大型应用 | 中 | ~12KB |
| Zustand | 中小型应用 | 低 | ~1KB |
| Jotai | 细粒度更新 | 低 | ~2KB |
| React Query | 服务端状态 | 中 | ~12KB |

选择合适的状态管理方案，让应用状态清晰可控，开发体验顺畅高效。

---

*状态是应用的血液，管理好状态才能让应用充满活力。*
