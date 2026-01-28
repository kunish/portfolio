---
title: '前端测试最佳实践：从单元测试到端到端测试'
description: '掌握 Jest、React Testing Library、Playwright 等测试工具和测试驱动开发'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'frontend-testing-best-practices'
---

测试是保证代码质量的基石。本文深入探讨前端测试策略和最佳实践。

## 测试金字塔

```
测试金字塔模型：
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    /\                               │
│                   /  \     E2E 测试                │
│                  /    \    (少量，慢)              │
│                 /──────\                            │
│                /        \   集成测试               │
│               /          \  (适量，中速)           │
│              /────────────\                         │
│             /              \ 单元测试              │
│            /                \ (大量，快)           │
│           /──────────────────\                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 测试类型 | 占比 | 执行速度 | 覆盖范围 |
|----------|------|----------|----------|
| 单元测试 | 70% | 快 | 函数/组件 |
| 集成测试 | 20% | 中 | 模块协作 |
| E2E 测试 | 10% | 慢 | 完整流程 |

## Jest 单元测试

### 基础测试

```typescript
// utils.ts
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function calculateDiscount(price: number, discount: number): number {
  return price * (1 - discount / 100);
}

// utils.test.ts
import { formatPrice, calculateDiscount } from './utils';

describe('formatPrice', () => {
  it('formats integer price correctly', () => {
    expect(formatPrice(10)).toBe('$10.00');
  });

  it('formats decimal price correctly', () => {
    expect(formatPrice(10.5)).toBe('$10.50');
  });

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});

describe('calculateDiscount', () => {
  it('calculates 10% discount', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
  });

  it('calculates 0% discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });

  it('calculates 100% discount', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });
});
```

### 异步测试

```typescript
// api.ts
export async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error('User not found');
  }
  return response.json();
}

// api.test.ts
import { fetchUser } from './api';

// Mock fetch
global.fetch = jest.fn();

describe('fetchUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user data on success', async () => {
    const mockUser = { id: '1', name: 'John' };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    const user = await fetchUser('1');
    expect(user).toEqual(mockUser);
    expect(fetch).toHaveBeenCalledWith('/api/users/1');
  });

  it('throws error on failure', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false });

    await expect(fetchUser('1')).rejects.toThrow('User not found');
  });
});
```

### Mock 和 Spy

```typescript
// service.ts
import { sendEmail } from './email';
import { logEvent } from './analytics';

export async function registerUser(email: string, password: string) {
  const user = await createUser(email, password);
  await sendEmail(email, 'Welcome!');
  logEvent('user_registered', { userId: user.id });
  return user;
}

// service.test.ts
jest.mock('./email');
jest.mock('./analytics');

import { registerUser } from './service';
import { sendEmail } from './email';
import { logEvent } from './analytics';

describe('registerUser', () => {
  it('sends welcome email and logs event', async () => {
    const user = await registerUser('test@example.com', 'password');

    expect(sendEmail).toHaveBeenCalledWith('test@example.com', 'Welcome!');
    expect(logEvent).toHaveBeenCalledWith('user_registered', {
      userId: user.id,
    });
  });
});

// Spy 示例
it('calls console.log', () => {
  const spy = jest.spyOn(console, 'log');

  myFunction();

  expect(spy).toHaveBeenCalledWith('expected message');
  spy.mockRestore();
});
```

## React Testing Library

### 组件测试

```tsx
// Button.tsx
interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button({ onClick, disabled, children }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button onClick={() => {}} disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 用户交互测试

```tsx
// LoginForm.tsx
export function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('请填写所有字段');
      return;
    }
    await onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="邮箱"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit">登录</button>
    </form>
  );
}

// LoginForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('shows error when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: '登录' }));

    expect(screen.getByRole('alert')).toHaveTextContent('请填写所有字段');
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByPlaceholderText('邮箱'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### 异步组件测试

```tsx
// UserProfile.tsx
export function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <p>加载中...</p>;
  if (error) return <p>加载失败</p>;
  return <h1>{user.name}</h1>;
}

// UserProfile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { UserProfile } from './UserProfile';

jest.mock('./api', () => ({
  fetchUser: jest.fn(),
}));

import { fetchUser } from './api';

describe('UserProfile', () => {
  it('shows loading state initially', () => {
    (fetchUser as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<UserProfile userId="1" />);

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('shows user name after loading', async () => {
    (fetchUser as jest.Mock).mockResolvedValue({ name: 'John' });
    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });
  });

  it('shows error on failure', async () => {
    (fetchUser as jest.Mock).mockRejectedValue(new Error('Failed'));
    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });
  });
});
```

## Playwright E2E 测试

### 基础配置

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
```

### E2E 测试用例

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows validation errors', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toContainText('请填写邮箱');
  });

  test('logs in successfully', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('欢迎回来');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toContainText('邮箱或密码错误');
  });
});
```

### 页面对象模式

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  private page: Page;
  private emailInput: Locator;
  private passwordInput: Locator;
  private submitButton: Locator;
  private errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return this.errorMessage.textContent();
  }
}

// e2e/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('login with page object', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');

  await expect(page).toHaveURL('/dashboard');
});
```

## 测试覆盖率

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};
```

## 最佳实践总结

```
前端测试最佳实践：
┌─────────────────────────────────────────────────────┐
│   测试策略                                          │
│   ├── 遵循测试金字塔                                │
│   ├── 测试行为而非实现                              │
│   ├── 保持测试独立性                                │
│   └── 使用有意义的测试名称                          │
│                                                     │
│   单元测试                                          │
│   ├── 测试纯函数和工具                              │
│   ├── Mock 外部依赖                                │
│   ├── 追求高覆盖率                                  │
│   └── 快速执行                                      │
│                                                     │
│   组件测试                                          │
│   ├── 使用 Testing Library                         │
│   ├── 测试用户交互                                  │
│   ├── 避免测试实现细节                              │
│   └── 使用 userEvent                               │
│                                                     │
│   E2E 测试                                         │
│   ├── 覆盖关键用户流程                              │
│   ├── 使用页面对象模式                              │
│   ├── 处理异步操作                                  │
│   └── 跨浏览器测试                                  │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐工具 |
|------|----------|
| 单元测试 | Jest + Vitest |
| 组件测试 | React Testing Library |
| E2E 测试 | Playwright |
| 视觉测试 | Chromatic |

---

*好的测试是文档，是安全网，是信心的来源。*
