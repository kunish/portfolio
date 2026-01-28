---
title: 'Software Testing Strategies: Complete System from Unit to E2E Testing'
description: 'Master testing pyramid, unit testing, integration testing, E2E testing and TDD practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'software-testing-strategies'
---

Testing is the cornerstone of software quality. This article explores testing strategies, best practices, and tooling.

## Testing Pyramid

### Test Layers

```
Testing Pyramid:
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    /\                               │
│                   /  \    E2E Tests                │
│                  /    \   (Few, verify key flows) │
│                 /──────\                            │
│                /        \  Integration Tests        │
│               /          \ (Moderate, verify       │
│              /────────────\ module collaboration)  │
│             /              \ Unit Tests             │
│            /                \(Many, verify single │
│           /──────────────────\ functions)          │
│                                                     │
│   Characteristics:                                  │
│   ├── Bottom: Fast, cheap, many                   │
│   ├── Middle: Moderate speed and cost             │
│   └── Top: Slow, expensive, few                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Test Type Comparison

| Type | Speed | Isolation | Coverage | Maintenance |
|------|-------|-----------|----------|-------------|
| Unit | Milliseconds | High | Single function | Low |
| Integration | Seconds | Medium | Multiple modules | Medium |
| E2E | Minutes | Low | Full system | High |

## Unit Testing

### Basic Examples

```typescript
// user.service.ts
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(data: CreateUserDto): Promise<User> {
    if (!data.email.includes('@')) {
      throw new ValidationError('Invalid email format');
    }

    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const passwordHash = await hashPassword(data.password);
    return this.userRepository.create({
      ...data,
      password: passwordHash,
    });
  }
}

// user.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };
    userService = new UserService(mockRepository);
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: '1',
        ...userData,
        password: 'hashed',
      });

      const result = await userService.createUser(userData);

      expect(result.email).toBe(userData.email);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          name: userData.name,
        })
      );
    });

    it('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test',
      };

      await expect(userService.createUser(userData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error for duplicate email', async () => {
      mockRepository.findByEmail.mockResolvedValue({ id: '1' } as User);

      await expect(userService.createUser({
        email: 'existing@example.com',
        password: 'password',
        name: 'Test',
      })).rejects.toThrow(ConflictError);
    });
  });
});
```

### Mocks and Stubs

```typescript
// Mocking external dependencies
import { vi } from 'vitest';

// Mock modules
vi.mock('./database', () => ({
  query: vi.fn(),
}));

// Mock functions
const mockFn = vi.fn()
  .mockReturnValueOnce('first')
  .mockReturnValueOnce('second')
  .mockReturnValue('default');

// Mock time
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-01-01'));

// Restore after tests
afterEach(() => {
  vi.restoreAllMocks();
});

// Spy on real functions
const spy = vi.spyOn(console, 'log');
someFunction();
expect(spy).toHaveBeenCalledWith('expected message');
```

### Testing Async Code

```typescript
describe('Async Operations', () => {
  it('should handle promises', async () => {
    const result = await asyncFunction();
    expect(result).toBe('expected');
  });

  it('should handle rejected promises', async () => {
    await expect(failingAsyncFunction())
      .rejects.toThrow('Error message');
  });

  it('should handle callbacks', (done) => {
    callbackFunction((error, result) => {
      expect(error).toBeNull();
      expect(result).toBe('expected');
      done();
    });
  });

  it('should handle timers', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    setTimeout(callback, 1000);

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalled();
  });
});
```

## Integration Testing

### API Testing

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { setupTestDatabase, teardownTestDatabase } from './helpers';

describe('User API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        email: 'new@example.com',
        name: 'New User',
      });
      expect(response.body.password).toBeUndefined();
    });

    it('should return 422 for invalid data', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'invalid',
          password: '123',
        })
        .expect(422);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.id).toBe('1');
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .get('/api/users/1')
        .expect(401);
    });
  });
});
```

### Database Testing

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User Repository', () => {
  beforeEach(async () => {
    // Clean test data
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should create and retrieve user', async () => {
    const created = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hash',
      },
    });

    const found = await prisma.user.findUnique({
      where: { id: created.id },
    });

    expect(found?.email).toBe('test@example.com');
  });

  it('should enforce unique email constraint', async () => {
    await prisma.user.create({
      data: {
        email: 'unique@example.com',
        name: 'First',
        passwordHash: 'hash',
      },
    });

    await expect(
      prisma.user.create({
        data: {
          email: 'unique@example.com',
          name: 'Second',
          passwordHash: 'hash',
        },
      })
    ).rejects.toThrow();
  });
});
```

## E2E Testing

### Playwright Testing

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should register new user successfully', async ({ page }) => {
    // Fill form
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    await page.fill('[name="name"]', 'New User');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome, New User');
  });

  test('should show validation errors', async ({ page }) => {
    await page.fill('[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message'))
      .toContainText('Please enter a valid email');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('/api/register', route => {
      route.abort('failed');
    });

    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('.toast-error'))
      .toContainText('Network error');
  });
});

test.describe('Shopping Cart', () => {
  test('should add items and checkout', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Add products
    await page.goto('/products');
    await page.click('[data-product-id="1"] .add-to-cart');
    await page.click('[data-product-id="2"] .add-to-cart');

    // View cart
    await page.click('.cart-icon');
    await expect(page.locator('.cart-count')).toHaveText('2');

    // Checkout
    await page.click('.checkout-button');
    await page.fill('[name="cardNumber"]', '4242424242424242');
    await page.fill('[name="expiry"]', '12/25');
    await page.fill('[name="cvc"]', '123');
    await page.click('.pay-button');

    // Verify success
    await expect(page).toHaveURL('/order-confirmation');
    await expect(page.locator('.order-status')).toContainText('Success');
  });
});
```

### Visual Regression Testing

```typescript
import { test, expect } from '@playwright/test';

test('visual regression - homepage', async ({ page }) => {
  await page.goto('/');

  // Wait for page to stabilize
  await page.waitForLoadState('networkidle');

  // Screenshot comparison
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixels: 100,
  });
});

test('visual regression - component', async ({ page }) => {
  await page.goto('/components/button');

  const button = page.locator('.primary-button');
  await expect(button).toHaveScreenshot('primary-button.png');
});
```

## TDD Practices

### Red-Green-Refactor Cycle

```typescript
// 1. Red: Write a failing test
test('should calculate order total with discount', () => {
  const order = new Order([
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 },
  ]);

  order.applyDiscount(0.1); // 10% discount

  expect(order.total).toBe(225); // (200 + 50) * 0.9
});

// 2. Green: Write minimum code to pass
class Order {
  private items: OrderItem[];
  private discountRate = 0;

  constructor(items: OrderItem[]) {
    this.items = items;
  }

  applyDiscount(rate: number): void {
    this.discountRate = rate;
  }

  get total(): number {
    const subtotal = this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return subtotal * (1 - this.discountRate);
  }
}

// 3. Refactor: Improve code structure
class Order {
  private items: OrderItem[];
  private discountRate = 0;

  constructor(items: OrderItem[]) {
    this.items = items;
  }

  applyDiscount(rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('Discount rate must be between 0 and 1');
    }
    this.discountRate = rate;
  }

  get subtotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  get discount(): number {
    return this.subtotal * this.discountRate;
  }

  get total(): number {
    return this.subtotal - this.discount;
  }
}
```

## Test Coverage

```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

## Best Practices Summary

```
Testing Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Writing Principles                                │
│   ├── One test verifies one thing                 │
│   ├── Tests should run independently              │
│   ├── Test names clearly describe behavior        │
│   └── Follow AAA pattern (Arrange-Act-Assert)     │
│                                                     │
│   Testing Strategy                                  │
│   ├── Prioritize unit tests                       │
│   ├── Integration tests for key paths             │
│   ├── E2E tests for core flows                    │
│   └── Balance coverage and maintenance cost       │
│                                                     │
│   Test Maintenance                                  │
│   ├── Avoid testing implementation details        │
│   ├── Use test factories and helpers              │
│   ├── Regularly clean up outdated tests          │
│   └── Run tests in CI                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach |
|----------|---------------------|
| Pure functions | Unit tests |
| API endpoints | Integration tests |
| User flows | E2E tests |
| UI components | Component tests + snapshots |
| Complex logic | TDD |

Testing is not a burden but a quality guarantee. Invest in testing to make code more reliable and refactoring more confident.

---

*Tests are the safety net of code. Write good tests to confidently change code.*
