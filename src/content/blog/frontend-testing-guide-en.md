---
title: 'Complete Frontend Testing Guide: From Unit Tests to E2E'
description: 'Master modern frontend testing strategies using Vitest, Testing Library, and Playwright to build reliable test systems'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'frontend-testing-guide'
---

Testing is the guardian of software quality. Good tests not only catch bugs but also serve as documentation, support refactoring, and boost development confidence. This article will help you build a complete frontend testing system.

## The Testing Pyramid

### Test Layers

```
The Testing Pyramid:
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ┌───────┐                              │
│              │ E2E   │  Few, slow, expensive        │
│              │ Tests │  Real user scenarios         │
│            ┌─┴───────┴─┐                            │
│            │Integration│  Moderate, medium speed    │
│            │  Tests    │  Component interactions    │
│          ┌─┴───────────┴─┐                          │
│          │  Unit Tests   │  Many, fast, cheap       │
│          │               │  Function/component logic│
│          └───────────────┘                          │
│                                                     │
│   Lower: More tests, faster, lower maintenance      │
│   Higher: Closer to real scenarios, higher confidence│
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Test Type Comparison

| Type | Scope | Speed | Confidence | Maintenance |
|------|-------|-------|------------|-------------|
| Unit Tests | Functions/Components | Very Fast | Low | Low |
| Integration | Multi-component | Fast | Medium | Medium |
| E2E Tests | Complete Flow | Slow | High | High |

## Vitest: Modern Unit Testing

Vitest is the testing framework for the Vite ecosystem—fast and easy to configure.

### Basic Configuration

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

### Basic Tests

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

### Async Testing

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

### Mocking Techniques

```typescript
// Mock modules
vi.mock('./config', () => ({
  API_URL: 'https://test-api.com'
}));

// Mock timers
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();

// Mock dates
vi.setSystemTime(new Date('2025-01-28'));

// Spy on functions
const consoleSpy = vi.spyOn(console, 'log');
expect(consoleSpy).toHaveBeenCalledWith('message');

// Mock implementations
const mockFn = vi.fn()
  .mockReturnValueOnce('first')
  .mockReturnValueOnce('second')
  .mockReturnValue('default');
```

## React Testing Library

Testing Library advocates testing by user behavior, not implementation details.

### Core Principles

```
Testing Library Philosophy:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ❌ Avoid testing implementation details           │
│      - Don't test state values                      │
│      - Don't test internal methods                  │
│      - Don't rely on classNames                     │
│                                                     │
│   ✅ Test user behavior                             │
│      - What can users see                           │
│      - What can users interact with                 │
│      - What happens after interaction               │
│                                                     │
│   Query Priority:                                   │
│   1. getByRole     (most recommended, accessibility)│
│   2. getByLabelText                                 │
│   3. getByPlaceholderText                           │
│   4. getByText                                      │
│   5. getByTestId   (last resort)                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Component Testing

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

### Form Testing

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

### Async Component Testing

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

## Playwright: E2E Testing

Playwright is the modern choice for E2E testing—multi-browser support and powerful waiting mechanisms.

### Basic Configuration

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

### Basic Tests

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

### User Flow Testing

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should complete login flow', async ({ page }) => {
    await page.goto('/login');

    // Fill form
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit
    await page.getByRole('button', { name: 'Log In' }).click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify user info displayed
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

### API Mocking

```typescript
// e2e/api-mock.spec.ts
import { test, expect } from '@playwright/test';

test('should display mocked user data', async ({ page }) => {
  // Intercept API request
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

## Testing Best Practices

### Test Naming

```typescript
// ✅ Good naming: describes behavior and expected result
it('should display error message when password is too short')
it('should redirect to dashboard after successful login')
it('should disable submit button while form is submitting')

// ❌ Poor naming: unclear
it('test password')
it('works correctly')
it('handles click')
```

### Test Structure

```typescript
// AAA Pattern: Arrange, Act, Assert
it('should add item to cart', async () => {
  // Arrange - Setup
  const user = userEvent.setup();
  render(<ProductPage product={mockProduct} />);

  // Act - Execute
  await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

  // Assert - Verify
  expect(screen.getByText('Added to cart')).toBeInTheDocument();
});
```

### Test Isolation

```typescript
// Each test should be independent
describe('Cart', () => {
  let cart: Cart;

  beforeEach(() => {
    // Reset state before each test
    cart = new Cart();
  });

  afterEach(() => {
    // Cleanup side effects
    vi.clearAllMocks();
  });

  it('should add item', () => {
    cart.add({ id: '1', name: 'Product' });
    expect(cart.items).toHaveLength(1);
  });

  it('should start empty', () => {
    // Doesn't depend on previous test state
    expect(cart.items).toHaveLength(0);
  });
});
```

### Coverage Targets

```
Reasonable Coverage Targets:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Business Logic/Utilities: 90%+                    │
│   ├─ Core functionality must have high coverage     │
│   └─ All edge cases should be tested                │
│                                                     │
│   UI Components: 70-80%                             │
│   ├─ Main interaction flows                         │
│   └─ Don't test every style                         │
│                                                     │
│   E2E Tests: Critical User Flows                    │
│   ├─ Registration/Login                             │
│   ├─ Core business processes                        │
│   └─ Payment/Checkout                               │
│                                                     │
│   Note: Coverage isn't the goal, quality is         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## CI Integration

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

## Summary

Building a reliable testing system:

| Test Type | Tools | Focus |
|-----------|-------|-------|
| Unit Tests | Vitest | Function logic, edge cases |
| Component Tests | Testing Library | User interactions, render output |
| E2E Tests | Playwright | Complete user flows |

**Key Takeaways**:

1. Testing pyramid: Many unit tests, few E2E tests
2. Test behavior, not implementation
3. Each test should be independent and repeatable
4. Reasonable coverage, don't blindly chase 100%
5. Integrate tests into CI/CD pipeline

Good tests are an investment in your code—they give you confidence to refactor and iterate quickly.

---

*Tests aren't a burden—they're a gift to your future self.*
