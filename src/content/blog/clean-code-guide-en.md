---
title: 'Clean Code: Writing Maintainable High-Quality Code'
description: 'Master naming conventions, function design, error handling and refactoring best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'clean-code-guide'
---

Clean code is the foundation of software engineering. This article explores how to write readable, maintainable high-quality code.

## Why Clean Code Matters

```
Value of Clean Code:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Readability                                       │
│   └── Code is read far more than it's written      │
│                                                     │
│   Maintainability                                   │
│   └── Fewer bugs, lower modification costs         │
│                                                     │
│   Team Collaboration                                │
│   └── Unified standards, less communication        │
│                                                     │
│   Long-term Benefits                                │
│   └── Less tech debt, faster iterations            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Naming Conventions

### Meaningful Names

```typescript
// Bad naming
const d = new Date();
const arr = users.filter(u => u.a > 18);
function calc(x: number, y: number) { return x * y; }

// Good naming
const currentDate = new Date();
const adultUsers = users.filter(user => user.age > 18);
function calculateArea(width: number, height: number) {
  return width * height;
}
```

### Naming Principles

```typescript
// 1. Use searchable names
const MILLISECONDS_PER_DAY = 86400000;
const MAX_RETRY_COUNT = 3;

// 2. Use pronounceable names
// Bad: genymdhms
// Good: generationTimestamp

// 3. Use domain terminology
interface ShoppingCart {
  items: CartItem[];
  totalAmount: number;
  discountCode?: string;
}

// 4. Be consistent
// Getting user info: pick one of getUser, fetchUser, retrieveUser and stick with it
class UserService {
  getUser(id: string): User { }
  getUserOrders(userId: string): Order[] { }
  getUserPreferences(userId: string): Preferences { }
}

// 5. Avoid disinformation
// Bad: accountList (but it's actually a Set)
// Good: accounts or accountSet
```

### Boolean Naming

```typescript
// Boolean variables should be assertions
const isLoading = true;
const hasPermission = user.role === 'admin';
const canEdit = hasPermission && !isLocked;
const shouldShowModal = isLoggedIn && !hasSeenOnboarding;

// Functions returning booleans
function isEmpty(array: unknown[]): boolean {
  return array.length === 0;
}

function hasAccess(user: User, resource: Resource): boolean {
  return user.permissions.includes(resource.requiredPermission);
}
```

## Function Design

### Single Responsibility

```typescript
// Bad: one function doing too much
function processUserData(user: User) {
  // Validation
  if (!user.email || !user.name) {
    throw new Error('Invalid user');
  }

  // Formatting
  user.name = user.name.trim().toLowerCase();
  user.email = user.email.toLowerCase();

  // Saving
  database.save(user);

  // Sending email
  emailService.send(user.email, 'Welcome!');

  // Logging
  logger.info(`User created: ${user.id}`);
}

// Good: each function does one thing
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

### Function Arguments

```typescript
// Bad: too many parameters
function createUser(
  name: string,
  email: string,
  age: number,
  address: string,
  phone: string,
  role: string
) { }

// Good: use object parameters
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

// Clearer when calling
createUser({
  name: 'John',
  email: 'john@example.com',
  age: 25,
  role: 'admin',
});
```

### Avoid Side Effects

```typescript
// Bad: has side effects
let globalConfig: Config;

function initConfig() {
  globalConfig = loadConfigFromFile();
  globalConfig.timestamp = Date.now();
}

// Good: pure function
function loadConfig(): Config {
  const config = loadConfigFromFile();
  return {
    ...config,
    timestamp: Date.now(),
  };
}

// Bad: mutating input parameters
function addItem(cart: Cart, item: Item) {
  cart.items.push(item);
  cart.total += item.price;
}

// Good: return new object
function addItem(cart: Cart, item: Item): Cart {
  return {
    ...cart,
    items: [...cart.items, item],
    total: cart.total + item.price,
  };
}
```

## Error Handling

### Use Exceptions Instead of Return Codes

```typescript
// Bad: return codes
function divide(a: number, b: number): number | null {
  if (b === 0) return null;
  return a / b;
}

const result = divide(10, 0);
if (result === null) {
  console.log('Error');
}

// Good: throw exceptions
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

### Custom Error Classes

```typescript
// Custom error types
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

// Usage
function getUser(id: string): User {
  const user = database.findById(id);
  if (!user) {
    throw new NotFoundError('User', id);
  }
  return user;
}

// Handling
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

### Result Type

```typescript
// Use Result type instead of exceptions
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

// Usage
const result = parseJson<User>(jsonString);
if (result.success) {
  console.log(result.data.name);
} else {
  console.error(result.error.message);
}
```

## Comments and Documentation

### Good Comments

```typescript
// Explain "why" not "what"
// Bad: increment counter
count++;

// Good: Resetting counter on page refresh may cause data loss,
// so we only initialize at session start
count++;

// Explain complex business logic
// Per banking regulations, transfers over $50,000 require additional verification
if (amount > 50000) {
  requireAdditionalVerification();
}

// Mark TODOs and FIXMEs
// TODO: Add batch delete feature in next version
// FIXME: Possible race condition under high concurrency
```

### Bad Comments

```typescript
// Unnecessary comments
// This is a constructor
constructor() { }

// Add 1
i = i + 1;

// Get user
function getUser() { }

// Outdated comments are worse than no comments
// Returns username and email (actually also returns phone)
function getUserInfo() {
  return { name, email, phone };
}

// Commented out code should be deleted, not kept
// function oldImplementation() {
//   // old implementation
// }
```

## Code Formatting

### Vertical Formatting

```typescript
// Keep related code together
class UserService {
  // Public methods
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

  // Private helper methods
  private validateUserData(data: CreateUserDto): void {
    // validation logic
  }

  private buildUser(data: CreateUserDto): User {
    // build logic
  }

  private async saveUser(user: User): Promise<User> {
    // save logic
  }
}
```

### Horizontal Formatting

```typescript
// Use consistent indentation
function calculateTotal(items: Item[]): number {
  return items.reduce((total, item) => {
    const itemTotal = item.price * item.quantity;
    const discount = item.discount || 0;
    return total + itemTotal - discount;
  }, 0);
}

// Reasonable line length (80-120 characters)
const result = await userService
  .findByEmail(email)
  .then(user => user.profile)
  .then(profile => profile.settings);
```

## Code Refactoring

### Extract Function

```typescript
// Before refactoring
function printOwing(invoice: Invoice) {
  let outstanding = 0;

  // Calculate outstanding
  for (const order of invoice.orders) {
    outstanding += order.amount;
  }

  // Print banner
  console.log('***********************');
  console.log('**** Customer Owes ****');
  console.log('***********************');

  // Print details
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
}

// After refactoring
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

### Early Return

```typescript
// Before refactoring
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

// After refactoring
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

## Best Practices Summary

```
Clean Code Principles:
┌─────────────────────────────────────────────────────┐
│   Naming                                            │
│   ├── Reveal intention                             │
│   ├── Avoid encodings and prefixes                 │
│   ├── Use searchable names                         │
│   └── Be consistent                                │
│                                                     │
│   Functions                                         │
│   ├── Keep them small                              │
│   ├── Single responsibility                        │
│   ├── Few arguments                                │
│   └── No side effects                              │
│                                                     │
│   Error Handling                                    │
│   ├── Use exceptions                               │
│   ├── Provide context                              │
│   ├── Define exception types                       │
│   └── Don't return null                            │
│                                                     │
│   Refactoring                                       │
│   ├── Refactor continuously                        │
│   ├── Take small steps                             │
│   ├── Tests as safety net                          │
│   └── Eliminate duplication                        │
└─────────────────────────────────────────────────────┘
```

---

*Code is written for humans to read, and only incidentally for machines to execute. Clean code shows respect for your team.*
