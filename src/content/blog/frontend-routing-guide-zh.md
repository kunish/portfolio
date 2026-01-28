---
title: '前端路由完全指南：从原理到最佳实践'
description: '掌握 SPA 路由原理、React Router、动态路由和路由守卫实现'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'frontend-routing-guide'
---

路由是单页应用的核心。本文探讨前端路由的原理和各种实现方式。

## 路由原理

### 路由模式

```
路由模式对比：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Hash 模式                                         │
│   ├── URL: example.com/#/users                     │
│   ├── 使用 hashchange 事件                         │
│   ├── 无需服务器配置                                │
│   └── 不会发送到服务器                              │
│                                                     │
│   History 模式                                      │
│   ├── URL: example.com/users                       │
│   ├── 使用 History API                             │
│   ├── 需要服务器配置回退                            │
│   └── 更美观的 URL                                 │
│                                                     │
│   Memory 模式                                       │
│   ├── 不改变 URL                                   │
│   ├── 用于非浏览器环境                              │
│   └── 如 React Native                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 模式 | URL 样式 | 服务器要求 |
|------|----------|------------|
| Hash | /#/path | 无 |
| History | /path | 需要回退配置 |
| Memory | 不变 | 无 |

### 简单路由实现

```typescript
// Hash 路由
class HashRouter {
  private routes: Map<string, () => void> = new Map();

  constructor() {
    window.addEventListener('hashchange', () => this.handleChange());
    window.addEventListener('load', () => this.handleChange());
  }

  register(path: string, handler: () => void) {
    this.routes.set(path, handler);
  }

  navigate(path: string) {
    window.location.hash = path;
  }

  private handleChange() {
    const path = window.location.hash.slice(1) || '/';
    const handler = this.routes.get(path);
    if (handler) {
      handler();
    }
  }
}

// History 路由
class HistoryRouter {
  private routes: Map<string, () => void> = new Map();

  constructor() {
    window.addEventListener('popstate', () => this.handleChange());
  }

  register(path: string, handler: () => void) {
    this.routes.set(path, handler);
  }

  navigate(path: string) {
    window.history.pushState(null, '', path);
    this.handleChange();
  }

  private handleChange() {
    const path = window.location.pathname;
    const handler = this.routes.get(path);
    if (handler) {
      handler();
    }
  }
}
```

## React Router

### 基础配置

```tsx
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Outlet,
} from 'react-router-dom';

// 基础路由
function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/about">关于</Link>
        <NavLink
          to="/products"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          产品
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<Products />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// 嵌套路由
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />}>
            <Route index element={<ProductList />} />
            <Route path=":id" element={<ProductDetail />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  return (
    <div>
      <Header />
      <main>
        <Outlet /> {/* 子路由渲染位置 */}
      </main>
      <Footer />
    </div>
  );
}
```

### 动态路由

```tsx
import { useParams, useSearchParams, useLocation } from 'react-router-dom';

// 路由参数
function ProductDetail() {
  const { id } = useParams<{ id: string }>();

  return <div>产品 ID: {id}</div>;
}

// 查询参数
function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category');
  const page = searchParams.get('page') || '1';

  const updateFilters = (newCategory: string) => {
    setSearchParams({ category: newCategory, page: '1' });
  };

  return (
    <div>
      <p>分类: {category}</p>
      <p>页码: {page}</p>
    </div>
  );
}

// 位置信息
function CurrentPage() {
  const location = useLocation();

  return (
    <div>
      <p>路径: {location.pathname}</p>
      <p>搜索: {location.search}</p>
      <p>状态: {JSON.stringify(location.state)}</p>
    </div>
  );
}
```

### 编程式导航

```tsx
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login();

    // 跳转到首页
    navigate('/');

    // 替换当前历史记录
    navigate('/dashboard', { replace: true });

    // 传递状态
    navigate('/profile', { state: { from: '/login' } });

    // 后退
    navigate(-1);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## 路由守卫

### 认证守卫

```tsx
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// 使用
<Routes>
  <Route path="/login" element={<Login />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
</Routes>
```

### 角色权限守卫

```tsx
interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// 使用
<Route
  path="/admin"
  element={
    <RoleGuard allowedRoles={['admin']}>
      <AdminPanel />
    </RoleGuard>
  }
/>
```

### 路由加载器

```tsx
import { createBrowserRouter, RouterProvider, useLoaderData } from 'react-router-dom';

// 定义路由加载器
async function productLoader({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);
  if (!product) {
    throw new Response('Not Found', { status: 404 });
  }
  return product;
}

// 创建路由
const router = createBrowserRouter([
  {
    path: '/products/:id',
    element: <ProductDetail />,
    loader: productLoader,
    errorElement: <ErrorPage />,
  },
]);

// 使用加载的数据
function ProductDetail() {
  const product = useLoaderData() as Product;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}

// 渲染
function App() {
  return <RouterProvider router={router} />;
}
```

## 懒加载路由

### React.lazy

```tsx
import { lazy, Suspense } from 'react';

// 懒加载组件
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// 命名导出的懒加载
const Settings = lazy(() =>
  import('./pages/Settings').then((module) => ({
    default: module.SettingsPage,
  }))
);
```

### 预加载

```tsx
// 鼠标悬停时预加载
const Dashboard = lazy(() => import('./pages/Dashboard'));

function NavLink() {
  const preloadDashboard = () => {
    import('./pages/Dashboard');
  };

  return (
    <Link
      to="/dashboard"
      onMouseEnter={preloadDashboard}
      onFocus={preloadDashboard}
    >
      Dashboard
    </Link>
  );
}

// 路由配置中预加载
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    preload: () => import('./pages/Dashboard'),
  },
];
```

## 服务器配置

### Nginx 配置

```nginx
# History 模式回退
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache 配置

```apache
# .htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 最佳实践总结

```
路由最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   URL 设计                                          │
│   ├── 使用语义化路径                                │
│   ├── 保持 URL 简洁                                │
│   ├── 使用小写和连字符                              │
│   └── 避免深层嵌套                                  │
│                                                     │
│   性能优化                                          │
│   ├── 懒加载路由组件                                │
│   ├── 预加载关键路由                                │
│   ├── 使用路由缓存                                  │
│   └── 代码分割                                      │
│                                                     │
│   用户体验                                          │
│   ├── 提供加载状态                                  │
│   ├── 处理 404 页面                                │
│   ├── 保持滚动位置                                  │
│   └── 支持浏览器后退                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 建议 |
|------|------|
| SPA 应用 | History 模式 + 服务器回退 |
| 静态托管 | Hash 模式 |
| 需要 SEO | SSR/SSG |
| 大型应用 | 懒加载 + 预加载 |

---

*好的路由设计让用户感觉在浏览真正的页面。*
