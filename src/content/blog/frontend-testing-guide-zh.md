---
title: '前端测试完全指南：从单元测试到 E2E'
description: '掌握现代前端测试策略，使用 Vitest、Testing Library、Playwright 构建可靠的测试体系'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'frontend-testing-guide'
---

测试是软件质量的保障。好的测试不仅能捕获 Bug，还能作为文档、支持重构、提升开发信心。本文将带你构建完整的前端测试体系。

## 测试金字塔

### 测试层次

```
测试金字塔：
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ┌───────┐                              │
│              │ E2E   │  少量、慢、贵                │
│              │ Tests │  真实用户场景                │
│            ┌─┴───────┴─┐                            │
│            │Integration│  适量、中速                │
│            │  Tests    │  组件交互                  │
│          ┌─┴───────────┴─┐                          │
│          │  Unit Tests   │  大量、快、便宜          │
│          │               │  函数/组件逻辑           │
│          └───────────────┘                          │
│                                                     │
│   越往下：数量越多、速度越快、维护成本越低           │
│   越往上：越接近真实场景、信心越高                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 测试类型对比

| 类型 | 范围 | 速度 | 信心 | 维护成本 |
|------|------|------|------|----------|
| 单元测试 | 函数/组件 | 极快 | 低 | 低 |
| 集成测试 | 多组件交互 | 快 | 中 | 中 |
| E2E 测试 | 完整流程 | 慢 | 高 | 高 |

## Vitest：现代单元测试

Vitest 是 Vite 生态的测试框架，速度快、配置简单。

### 基础配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### 基础测试

```typescript
// src/utils/math.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Cannot divide by zero');
  return a / b;
}

// src/utils/math.test.ts
import { describe, it, expect } from 'vitest';
import { add, divide } from './math';

describe('math utils', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(1, 2)).toBe(3);
    });

    it('should handle negative numbers', () => {
      expect(add(-1, 1)).toBe(0);
    });
  });

  describe('divide', () => {
    it('should divide two numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('should throw on division by zero', () => {
      expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
    });
  });
});
```

### 异步测试

```typescript
// src/api/user.ts
export async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error('User not found');
  return response.json();
}

// src/api/user.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUser } from './user';

describe('fetchUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch user successfully', async () => {
    const mockUser = { id: '1', name: 'Alice' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser)
    });

    const user = await fetchUser('1');

    expect(fetch).toHaveBeenCalledWith('/api/users/1');
    expect(user).toEqual(mockUser);
  });

  it('should throw on error response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false
    });

    await expect(fetchUser('999')).rejects.toThrow('User not found');
  });
});
```

### Mock 技巧

```typescript
// Mock 模块
vi.mock('./config', () => ({
  API_URL: 'https://test-api.com'
}));

// Mock 定时器
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();

// Mock 日期
vi.setSystemTime(new Date('2025-01-28'));

// Spy 函数
const consoleSpy = vi.spyOn(console, 'log');
expect(consoleSpy).toHaveBeenCalledWith('message');

// Mock 实现
const mockFn = vi.fn()
  .mockReturnValueOnce('first')
  .mockReturnValueOnce('second')
  .mockReturnValue('default');
```

## React Testing Library

Testing Library 提倡按用户行为测试，而非实现细节。

### 核心原则

```
Testing Library 哲学：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ❌ 避免测试实现细节                                │
│      - 不测试 state 值                              │
│      - 不测试内部方法                               │
│      - 不依赖 className                             │
│                                                     │
│   ✅ 测试用户行为                                   │
│      - 用户能看到什么                               │
│      - 用户能交互什么                               │
│      - 交互后发生什么                               │
│                                                     │
│   查询优先级：                                       │
│   1. getByRole     (最推荐，可访问性)                │
│   2. getByLabelText                                 │
│   3. getByPlaceholderText                           │
│   4. getByText                                      │
│   5. getByTestId   (最后手段)                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 组件测试

```tsx
// src/components/Counter.tsx
import { useState } from 'react';

export function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);

  return (
    <div>
      <span data-testid="count">Count: {count}</span>
      <button onClick={() => setCount(c => c - 1)}>Decrease</button>
      <button onClick={() => setCount(c => c + 1)}>Increase</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// src/components/Counter.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Counter } from './Counter';

describe('Counter', () => {
  it('should render initial count', () => {
    render(<Counter initialCount={5} />);

    expect(screen.getByText('Count: 5')).toBeInTheDocument();
  });

  it('should increment count on button click', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByRole('button', { name: 'Increase' }));

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('should decrement count on button click', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={5} />);

    await user.click(screen.getByRole('button', { name: 'Decrease' }));

    expect(screen.getByText('Count: 4')).toBeInTheDocument();
  });

  it('should reset count to zero', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={10} />);

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });
});
```

### 表单测试

```tsx
// src/components/LoginForm.tsx
import { useState } from 'react';

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('All fields are required');
      return;
    }
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div role="alert">{error}</div>}

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Log In</button>
    </form>
  );
}

// src/components/LoginForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('should show error for empty fields', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Log In' }));

    expect(screen.getByRole('alert')).toHaveTextContent('All fields are required');
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
```

### 异步组件测试

```tsx
// src/components/UserProfile.tsx
import { useEffect, useState } from 'react';

export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
      .catch(() => setError('Failed to load user'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div role="alert">{error}</div>;
  if (!user) return null;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// src/components/UserProfile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should show loading state initially', () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<UserProfile userId="1" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display user data after loading', async () => {
    const mockUser = { id: '1', name: 'Alice', email: 'alice@example.com' };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockUser)
    });

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByRole('heading')).toHaveTextContent('Alice');
    });
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('should show error on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load user');
    });
  });
});
```

## Playwright：E2E 测试

Playwright 是现代 E2E 测试的首选，支持多浏览器、强大的等待机制。

### 基础配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

### 基础测试

```typescript
// e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display welcome message', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 }))
      .toContainText('Welcome');
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'About' }).click();

    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading'))
      .toContainText('About Us');
  });
});
```

### 用户流程测试

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should complete login flow', async ({ page }) => {
    await page.goto('/login');

    // 填写表单
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');

    // 提交
    await page.getByRole('button', { name: 'Log In' }).click();

    // 验证跳转到首页
    await expect(page).toHaveURL('/dashboard');

    // 验证用户信息显示
    await expect(page.getByText('Welcome, User')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByRole('alert'))
      .toContainText('Invalid credentials');
  });
});
```

### Page Object Model

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Log In' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');

  await expect(page).toHaveURL('/dashboard');
});
```

### API Mock

```typescript
// e2e/api-mock.spec.ts
import { test, expect } from '@playwright/test';

test('should display mocked user data', async ({ page }) => {
  // 拦截 API 请求
  await page.route('**/api/users/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '1',
        name: 'Mocked User',
        email: 'mock@example.com'
      })
    });
  });

  await page.goto('/profile');

  await expect(page.getByText('Mocked User')).toBeVisible();
});
```

## 测试最佳实践

### 测试命名

```typescript
// ✅ 好的命名：描述行为和预期结果
it('should display error message when password is too short')
it('should redirect to dashboard after successful login')
it('should disable submit button while form is submitting')

// ❌ 差的命名：不清晰
it('test password')
it('works correctly')
it('handles click')
```

### 测试结构

```typescript
// AAA 模式：Arrange, Act, Assert
it('should add item to cart', async () => {
  // Arrange - 准备
  const user = userEvent.setup();
  render(<ProductPage product={mockProduct} />);

  // Act - 执行
  await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

  // Assert - 断言
  expect(screen.getByText('Added to cart')).toBeInTheDocument();
});
```

### 测试隔离

```typescript
// 每个测试应该独立
describe('Cart', () => {
  let cart: Cart;

  beforeEach(() => {
    // 每个测试前重置状态
    cart = new Cart();
  });

  afterEach(() => {
    // 清理副作用
    vi.clearAllMocks();
  });

  it('should add item', () => {
    cart.add({ id: '1', name: 'Product' });
    expect(cart.items).toHaveLength(1);
  });

  it('should start empty', () => {
    // 不依赖上一个测试的状态
    expect(cart.items).toHaveLength(0);
  });
});
```

### 覆盖率目标

```
合理的覆盖率目标：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   业务逻辑/工具函数：90%+                            │
│   ├─ 核心功能必须高覆盖                              │
│   └─ 边界条件都要测试                               │
│                                                     │
│   UI 组件：70-80%                                   │
│   ├─ 主要交互流程                                   │
│   └─ 不必测试每个样式                               │
│                                                     │
│   E2E 测试：关键用户流程                             │
│   ├─ 注册/登录                                      │
│   ├─ 核心业务流程                                   │
│   └─ 支付/结算                                      │
│                                                     │
│   注意：覆盖率不是目标，质量才是                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## CI 集成

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test:coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm exec playwright install --with-deps

      - run: pnpm test:e2e

      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 总结

构建可靠的测试体系：

| 测试类型 | 工具 | 关注点 |
|----------|------|--------|
| 单元测试 | Vitest | 函数逻辑、边界条件 |
| 组件测试 | Testing Library | 用户交互、渲染结果 |
| E2E 测试 | Playwright | 完整用户流程 |

**关键收获**：

1. 测试金字塔：单元测试多，E2E 测试少
2. 测试行为，而非实现
3. 每个测试应该独立、可重复
4. 合理的覆盖率，不盲目追求 100%
5. 将测试集成到 CI/CD 流程

好的测试是对代码的投资，它让你有信心进行重构和快速迭代。

---

*测试不是负担，而是给未来自己的礼物。*
