---
title: '软件测试策略：从单元测试到端到端测试的完整体系'
description: '掌握测试金字塔、单元测试、集成测试、E2E 测试和 TDD 实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'software-testing-strategies'
---

测试是保证软件质量的基石。本文深入探讨测试策略、最佳实践和工具链。

## 测试金字塔

### 测试层次

```
测试金字塔：
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    /\                               │
│                   /  \    E2E Tests                │
│                  /    \   (少量，验证关键流程)       │
│                 /──────\                            │
│                /        \  Integration Tests        │
│               /          \ (适量，验证模块协作)      │
│              /────────────\                         │
│             /              \ Unit Tests             │
│            /                \(大量，验证单个函数)    │
│           /──────────────────\                      │
│                                                     │
│   特点：                                            │
│   ├── 底层：快速、便宜、大量                        │
│   ├── 中层：适度速度和成本                          │
│   └── 顶层：慢速、昂贵、少量                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 测试类型对比

| 类型 | 速度 | 隔离性 | 覆盖范围 | 维护成本 |
|------|------|--------|----------|----------|
| 单元测试 | 毫秒级 | 高 | 单个函数 | 低 |
| 集成测试 | 秒级 | 中 | 多个模块 | 中 |
| E2E 测试 | 分钟级 | 低 | 完整系统 | 高 |

## 单元测试

### 基础示例

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

### Mock 和 Stub

```typescript
// 模拟外部依赖
import { vi } from 'vitest';

// Mock 模块
vi.mock('./database', () => ({
  query: vi.fn(),
}));

// Mock 函数
const mockFn = vi.fn()
  .mockReturnValueOnce('first')
  .mockReturnValueOnce('second')
  .mockReturnValue('default');

// Mock 时间
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-01-01'));

// 测试后恢复
afterEach(() => {
  vi.restoreAllMocks();
});

// Spy 监控真实函数
const spy = vi.spyOn(console, 'log');
someFunction();
expect(spy).toHaveBeenCalledWith('expected message');
```

### 测试异步代码

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

## 集成测试

### API 测试

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

### 数据库测试

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User Repository', () => {
  beforeEach(async () => {
    // 清理测试数据
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

## E2E 测试

### Playwright 测试

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should register new user successfully', async ({ page }) => {
    // 填写表单
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    await page.fill('[name="name"]', 'New User');

    // 提交表单
    await page.click('button[type="submit"]');

    // 验证跳转到仪表板
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
    // 模拟网络错误
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
    // 登录
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // 添加商品
    await page.goto('/products');
    await page.click('[data-product-id="1"] .add-to-cart');
    await page.click('[data-product-id="2"] .add-to-cart');

    // 查看购物车
    await page.click('.cart-icon');
    await expect(page.locator('.cart-count')).toHaveText('2');

    // 结账
    await page.click('.checkout-button');
    await page.fill('[name="cardNumber"]', '4242424242424242');
    await page.fill('[name="expiry"]', '12/25');
    await page.fill('[name="cvc"]', '123');
    await page.click('.pay-button');

    // 验证成功
    await expect(page).toHaveURL('/order-confirmation');
    await expect(page.locator('.order-status')).toContainText('Success');
  });
});
```

### 视觉回归测试

```typescript
import { test, expect } from '@playwright/test';

test('visual regression - homepage', async ({ page }) => {
  await page.goto('/');

  // 等待页面稳定
  await page.waitForLoadState('networkidle');

  // 截图对比
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

## TDD 实践

### 红-绿-重构循环

```typescript
// 1. 红：写一个失败的测试
test('should calculate order total with discount', () => {
  const order = new Order([
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 },
  ]);

  order.applyDiscount(0.1); // 10% 折扣

  expect(order.total).toBe(225); // (200 + 50) * 0.9
});

// 2. 绿：写最少代码使测试通过
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

// 3. 重构：优化代码结构
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

## 测试覆盖率

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

## 最佳实践总结

```
测试最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   编写原则                                          │
│   ├── 一个测试只验证一件事                          │
│   ├── 测试应该独立运行                              │
│   ├── 测试名称要清晰描述行为                        │
│   └── 遵循 AAA 模式 (Arrange-Act-Assert)           │
│                                                     │
│   测试策略                                          │
│   ├── 优先单元测试                                  │
│   ├── 关键路径用集成测试                            │
│   ├── 核心流程用 E2E 测试                           │
│   └── 平衡覆盖率和维护成本                          │
│                                                     │
│   测试维护                                          │
│   ├── 避免测试实现细节                              │
│   ├── 使用测试工厂和辅助函数                        │
│   ├── 定期清理过时测试                              │
│   └── 持续集成中运行测试                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| 纯函数 | 单元测试 |
| API 接口 | 集成测试 |
| 用户流程 | E2E 测试 |
| UI 组件 | 组件测试 + 快照 |
| 复杂逻辑 | TDD |

测试不是负担，而是质量保障。投资测试，让代码更可靠，让重构更自信。

---

*测试是代码的安全网。写好测试，才能放心地改代码。*
