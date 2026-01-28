---
title: '代码整洁之道：编写可维护的高质量代码'
description: '掌握命名规范、函数设计、错误处理和代码重构的最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'clean-code-guide'
---

整洁的代码是软件工程的基石。本文探讨如何编写可读、可维护的高质量代码。

## 为什么代码整洁很重要

```
代码整洁的价值：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   可读性                                            │
│   └── 代码阅读时间远超编写时间                      │
│                                                     │
│   可维护性                                          │
│   └── 减少 Bug，降低修改成本                        │
│                                                     │
│   团队协作                                          │
│   └── 统一标准，减少沟通成本                        │
│                                                     │
│   长期收益                                          │
│   └── 技术债务越少，迭代越快                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 命名规范

### 有意义的命名

```typescript
// 差的命名
const d = new Date();
const arr = users.filter(u => u.a > 18);
function calc(x: number, y: number) { return x * y; }

// 好的命名
const currentDate = new Date();
const adultUsers = users.filter(user => user.age > 18);
function calculateArea(width: number, height: number) {
  return width * height;
}
```

### 命名原则

```typescript
// 1. 使用可搜索的名称
const MILLISECONDS_PER_DAY = 86400000;
const MAX_RETRY_COUNT = 3;

// 2. 使用发音友好的名称
// 差: genymdhms
// 好: generationTimestamp

// 3. 使用领域术语
interface ShoppingCart {
  items: CartItem[];
  totalAmount: number;
  discountCode?: string;
}

// 4. 保持一致性
// 获取用户信息：getUser, fetchUser, retrieveUser 选一个坚持用
class UserService {
  getUser(id: string): User { }
  getUserOrders(userId: string): Order[] { }
  getUserPreferences(userId: string): Preferences { }
}

// 5. 避免误导
// 差: accountList (实际是 Set)
// 好: accounts 或 accountSet
```

### 布尔值命名

```typescript
// 布尔变量应该是断言形式
const isLoading = true;
const hasPermission = user.role === 'admin';
const canEdit = hasPermission && !isLocked;
const shouldShowModal = isLoggedIn && !hasSeenOnboarding;

// 函数返回布尔值
function isEmpty(array: unknown[]): boolean {
  return array.length === 0;
}

function hasAccess(user: User, resource: Resource): boolean {
  return user.permissions.includes(resource.requiredPermission);
}
```

## 函数设计

### 单一职责

```typescript
// 差：一个函数做太多事
function processUserData(user: User) {
  // 验证
  if (!user.email || !user.name) {
    throw new Error('Invalid user');
  }

  // 格式化
  user.name = user.name.trim().toLowerCase();
  user.email = user.email.toLowerCase();

  // 保存
  database.save(user);

  // 发送邮件
  emailService.send(user.email, 'Welcome!');

  // 记录日志
  logger.info(`User created: ${user.id}`);
}

// 好：每个函数只做一件事
function validateUser(user: User): void {
  if (!user.email || !user.name) {
    throw new Error('Invalid user data');
  }
}

function normalizeUser(user: User): User {
  return {
    ...user,
    name: user.name.trim().toLowerCase(),
    email: user.email.toLowerCase(),
  };
}

async function createUser(user: User): Promise<User> {
  validateUser(user);
  const normalizedUser = normalizeUser(user);
  const savedUser = await database.save(normalizedUser);
  await sendWelcomeEmail(savedUser);
  logger.info(`User created: ${savedUser.id}`);
  return savedUser;
}
```

### 函数参数

```typescript
// 差：参数过多
function createUser(
  name: string,
  email: string,
  age: number,
  address: string,
  phone: string,
  role: string
) { }

// 好：使用对象参数
interface CreateUserParams {
  name: string;
  email: string;
  age: number;
  address?: string;
  phone?: string;
  role?: string;
}

function createUser(params: CreateUserParams): User {
  const { name, email, age, address, phone, role = 'user' } = params;
  // ...
}

// 调用时更清晰
createUser({
  name: '张三',
  email: 'zhang@example.com',
  age: 25,
  role: 'admin',
});
```

### 避免副作用

```typescript
// 差：有副作用
let globalConfig: Config;

function initConfig() {
  globalConfig = loadConfigFromFile();
  globalConfig.timestamp = Date.now();
}

// 好：纯函数
function loadConfig(): Config {
  const config = loadConfigFromFile();
  return {
    ...config,
    timestamp: Date.now(),
  };
}

// 差：修改传入参数
function addItem(cart: Cart, item: Item) {
  cart.items.push(item);
  cart.total += item.price;
}

// 好：返回新对象
function addItem(cart: Cart, item: Item): Cart {
  return {
    ...cart,
    items: [...cart.items, item],
    total: cart.total + item.price,
  };
}
```

## 错误处理

### 使用异常而非返回码

```typescript
// 差：返回码
function divide(a: number, b: number): number | null {
  if (b === 0) return null;
  return a / b;
}

const result = divide(10, 0);
if (result === null) {
  console.log('Error');
}

// 好：抛出异常
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

try {
  const result = divide(10, 0);
} catch (error) {
  console.error('Division failed:', error.message);
}
```

### 自定义错误类

```typescript
// 自定义错误类型
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

// 使用
function getUser(id: string): User {
  const user = database.findById(id);
  if (!user) {
    throw new NotFoundError('User', id);
  }
  return user;
}

// 处理
try {
  const user = getUser('123');
} catch (error) {
  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message });
  }
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: error.message,
      field: error.field,
    });
  }
  throw error;
}
```

### Result 类型

```typescript
// 使用 Result 类型替代异常
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function parseJson<T>(json: string): Result<T> {
  try {
    const data = JSON.parse(json);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// 使用
const result = parseJson<User>(jsonString);
if (result.success) {
  console.log(result.data.name);
} else {
  console.error(result.error.message);
}
```

## 注释与文档

### 好的注释

```typescript
// 解释"为什么"而非"是什么"
// 差：增加计数器
count++;

// 好：用户每次刷新页面时重置计数器可能导致数据丢失，
// 因此只在会话开始时初始化
count++;

// 解释复杂的业务逻辑
// 根据央行规定，超过 5 万元的转账需要额外验证
if (amount > 50000) {
  requireAdditionalVerification();
}

// 标记 TODO 和 FIXME
// TODO: 下个版本添加批量删除功能
// FIXME: 在高并发场景下可能出现竞态条件
```

### 坏的注释

```typescript
// 不必要的注释
// 这是一个构造函数
constructor() { }

// 增加 1
i = i + 1;

// 获取用户
function getUser() { }

// 过时的注释比没有注释更糟糕
// 返回用户名和邮箱（实际上还返回了手机号）
function getUserInfo() {
  return { name, email, phone };
}

// 注释掉的代码应该删除，不要保留
// function oldImplementation() {
//   // 旧的实现
// }
```

## 代码格式

### 垂直格式

```typescript
// 相关的代码放在一起
class UserService {
  // 公共方法
  async createUser(data: CreateUserDto): Promise<User> {
    this.validateUserData(data);
    const user = this.buildUser(data);
    return this.saveUser(user);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.findUser(id);
    const updated = this.mergeUserData(user, data);
    return this.saveUser(updated);
  }

  // 私有辅助方法
  private validateUserData(data: CreateUserDto): void {
    // 验证逻辑
  }

  private buildUser(data: CreateUserDto): User {
    // 构建逻辑
  }

  private async saveUser(user: User): Promise<User> {
    // 保存逻辑
  }
}
```

### 水平格式

```typescript
// 使用一致的缩进
function calculateTotal(items: Item[]): number {
  return items.reduce((total, item) => {
    const itemTotal = item.price * item.quantity;
    const discount = item.discount || 0;
    return total + itemTotal - discount;
  }, 0);
}

// 合理的行长度（80-120 字符）
const result = await userService
  .findByEmail(email)
  .then(user => user.profile)
  .then(profile => profile.settings);
```

## 代码重构

### 提取函数

```typescript
// 重构前
function printOwing(invoice: Invoice) {
  let outstanding = 0;

  // 计算欠款
  for (const order of invoice.orders) {
    outstanding += order.amount;
  }

  // 打印抬头
  console.log('***********************');
  console.log('**** Customer Owes ****');
  console.log('***********************');

  // 打印详情
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
}

// 重构后
function printOwing(invoice: Invoice) {
  const outstanding = calculateOutstanding(invoice);
  printBanner();
  printDetails(invoice.customer, outstanding);
}

function calculateOutstanding(invoice: Invoice): number {
  return invoice.orders.reduce((sum, order) => sum + order.amount, 0);
}

function printBanner(): void {
  console.log('***********************');
  console.log('**** Customer Owes ****');
  console.log('***********************');
}

function printDetails(customer: string, amount: number): void {
  console.log(`name: ${customer}`);
  console.log(`amount: ${amount}`);
}
```

### 早返回

```typescript
// 重构前
function getPayAmount(employee: Employee): number {
  let result: number;
  if (employee.isSeparated) {
    result = getSeparatedAmount();
  } else {
    if (employee.isRetired) {
      result = getRetiredAmount();
    } else {
      result = getNormalAmount();
    }
  }
  return result;
}

// 重构后
function getPayAmount(employee: Employee): number {
  if (employee.isSeparated) {
    return getSeparatedAmount();
  }
  if (employee.isRetired) {
    return getRetiredAmount();
  }
  return getNormalAmount();
}
```

## 最佳实践总结

```
代码整洁原则：
┌─────────────────────────────────────────────────────┐
│   命名                                              │
│   ├── 名副其实，见名知意                            │
│   ├── 避免编码和前缀                                │
│   ├── 使用可搜索的名称                              │
│   └── 保持一致性                                    │
│                                                     │
│   函数                                              │
│   ├── 短小精悍                                      │
│   ├── 单一职责                                      │
│   ├── 参数尽量少                                    │
│   └── 无副作用                                      │
│                                                     │
│   错误处理                                          │
│   ├── 使用异常                                      │
│   ├── 提供上下文                                    │
│   ├── 定义异常类型                                  │
│   └── 别返回 null                                   │
│                                                     │
│   重构                                              │
│   ├── 持续重构                                      │
│   ├── 小步前进                                      │
│   ├── 测试保驾护航                                  │
│   └── 消除重复                                      │
└─────────────────────────────────────────────────────┘
```

---

*代码是写给人看的，顺便让机器执行。整洁的代码是对团队的尊重。*
