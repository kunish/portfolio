---
title: 'Frontend Routing Complete Guide: From Principles to Best Practices'
description: 'Master SPA routing principles, React Router, dynamic routing and route guards'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'frontend-routing-guide'
---

Routing is the core of single-page applications. This article explores the principles and various implementations of frontend routing.

## Routing Principles

### Routing Modes

```
Routing Mode Comparison:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Hash Mode                                         │
│   ├── URL: example.com/#/users                     │
│   ├── Uses hashchange event                        │
│   ├── No server configuration needed               │
│   └── Hash not sent to server                      │
│                                                     │
│   History Mode                                      │
│   ├── URL: example.com/users                       │
│   ├── Uses History API                             │
│   ├── Requires server fallback config              │
│   └── Cleaner URLs                                 │
│                                                     │
│   Memory Mode                                       │
│   ├── URL doesn't change                           │
│   ├── For non-browser environments                 │
│   └── e.g., React Native                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Mode | URL Style | Server Requirement |
|------|-----------|-------------------|
| Hash | /#/path | None |
| History | /path | Fallback config |
| Memory | Unchanged | None |

### Simple Router Implementation

```typescript
// Hash router
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

// History router
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

### Basic Configuration

```tsx
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Outlet,
} from 'react-router-dom';

// Basic routing
function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <NavLink
          to="/products"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Products
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

// Nested routes
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
        <Outlet /> {/* Child route render location */}
      </main>
      <Footer />
    </div>
  );
}
```

### Dynamic Routes

```tsx
import { useParams, useSearchParams, useLocation } from 'react-router-dom';

// Route parameters
function ProductDetail() {
  const { id } = useParams<{ id: string }>();

  return <div>Product ID: {id}</div>;
}

// Query parameters
function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category');
  const page = searchParams.get('page') || '1';

  const updateFilters = (newCategory: string) => {
    setSearchParams({ category: newCategory, page: '1' });
  };

  return (
    <div>
      <p>Category: {category}</p>
      <p>Page: {page}</p>
    </div>
  );
}

// Location info
function CurrentPage() {
  const location = useLocation();

  return (
    <div>
      <p>Pathname: {location.pathname}</p>
      <p>Search: {location.search}</p>
      <p>State: {JSON.stringify(location.state)}</p>
    </div>
  );
}
```

### Programmatic Navigation

```tsx
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login();

    // Navigate to home
    navigate('/');

    // Replace current history entry
    navigate('/dashboard', { replace: true });

    // Pass state
    navigate('/profile', { state: { from: '/login' } });

    // Go back
    navigate(-1);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Route Guards

### Authentication Guard

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

// Usage
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

### Role-Based Guard

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

// Usage
<Route
  path="/admin"
  element={
    <RoleGuard allowedRoles={['admin']}>
      <AdminPanel />
    </RoleGuard>
  }
/>
```

### Route Loaders

```tsx
import { createBrowserRouter, RouterProvider, useLoaderData } from 'react-router-dom';

// Define route loader
async function productLoader({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);
  if (!product) {
    throw new Response('Not Found', { status: 404 });
  }
  return product;
}

// Create router
const router = createBrowserRouter([
  {
    path: '/products/:id',
    element: <ProductDetail />,
    loader: productLoader,
    errorElement: <ErrorPage />,
  },
]);

// Use loaded data
function ProductDetail() {
  const product = useLoaderData() as Product;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}

// Render
function App() {
  return <RouterProvider router={router} />;
}
```

## Lazy Loading Routes

### React.lazy

```tsx
import { lazy, Suspense } from 'react';

// Lazy load components
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

// Named export lazy loading
const Settings = lazy(() =>
  import('./pages/Settings').then((module) => ({
    default: module.SettingsPage,
  }))
);
```

### Preloading

```tsx
// Preload on mouse hover
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

// Preload in route config
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    preload: () => import('./pages/Dashboard'),
  },
];
```

## Server Configuration

### Nginx Configuration

```nginx
# History mode fallback
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static asset caching
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache Configuration

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

## Best Practices Summary

```
Routing Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   URL Design                                        │
│   ├── Use semantic paths                           │
│   ├── Keep URLs concise                            │
│   ├── Use lowercase and hyphens                    │
│   └── Avoid deep nesting                           │
│                                                     │
│   Performance Optimization                          │
│   ├── Lazy load route components                   │
│   ├── Preload critical routes                      │
│   ├── Use route caching                            │
│   └── Code splitting                               │
│                                                     │
│   User Experience                                   │
│   ├── Provide loading states                       │
│   ├── Handle 404 pages                             │
│   ├── Preserve scroll position                     │
│   └── Support browser back button                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommendation |
|----------|----------------|
| SPA apps | History mode + server fallback |
| Static hosting | Hash mode |
| SEO needed | SSR/SSG |
| Large apps | Lazy loading + preloading |

---

*Good routing design makes users feel like they're browsing real pages.*
