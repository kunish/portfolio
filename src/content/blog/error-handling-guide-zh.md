---
title: '错误处理最佳实践：构建健壮的应用程序'
description: '掌握 JavaScript/TypeScript 错误处理、异步错误、全局错误处理和用户体验优化'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'error-handling-guide'
---

错误处理是构建可靠应用的关键。本文探讨 JavaScript/TypeScript 中的错误处理最佳实践。

## 错误处理基础

### 错误类型

```
JavaScript 错误类型：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   SyntaxError                                       │
│   └── 代码语法错误，解析时抛出                      │
│                                                     │
│   TypeError                                         │
│   └── 类型不匹配或操作无效                          │
│                                                     │
│   ReferenceError                                    │
│   └── 引用不存在的变量                              │
│                                                     │
│   RangeError                                        │
│   └── 值超出有效范围                                │
│                                                     │
│   Custom Error                                      │
│   └── 业务逻辑自定义错误                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 错误类型 | 常见场景 |
|----------|----------|
| TypeError | 调用 undefined 的方法 |
| ReferenceError | 使用未声明变量 |
| SyntaxError | JSON 解析失败 |
| RangeError | 数组长度为负数 |

## 自定义错误类

### 基础自定义错误

```typescript
// 基础自定义错误
class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // 维护正确的堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }
}

// 具体错误类型
class ValidationError extends AppError {
  public readonly field: string;
  public readonly value: unknown;

  constructor(field: string, message: string, value?: unknown) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
    this.value = value;
  }
}

class NotFoundError extends AppError {
  public readonly resource: string;
  public readonly id: string;

  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
    this.resource = resource;
    this.id = id;
  }
}

class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}
```

### 错误工厂

```typescript
// 错误工厂模式
const ErrorFactory = {
  validation(field: string, message: string) {
    return new ValidationError(field, message);
  },

  notFound(resource: string, id: string) {
    return new NotFoundError(resource, id);
  },

  unauthorized(message?: string) {
    return new AuthenticationError(message);
  },

  forbidden(message?: string) {
    return new AuthorizationError(message);
  },

  internal(message: string) {
    return new AppError(message, 'INTERNAL_ERROR', 500, false);
  },
};

// 使用
throw ErrorFactory.notFound('User', '123');
throw ErrorFactory.validation('email', 'Invalid email format');
```

## 同步错误处理

### try-catch 最佳实践

```typescript
// ❌ 过于宽泛的 catch
function processData(data: unknown) {
  try {
    // 很多代码...
    const result = JSON.parse(data as string);
    const processed = transform(result);
    saveToDatabase(processed);
  } catch (error) {
    console.log('Something went wrong'); // 丢失错误信息
  }
}

// ✅ 精确的错误处理
function processData(data: unknown) {
  // 1. 验证输入
  if (typeof data !== 'string') {
    throw new ValidationError('data', 'Data must be a string');
  }

  // 2. 解析 JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch (error) {
    throw new ValidationError('data', 'Invalid JSON format');
  }

  // 3. 转换数据（可能抛出自定义错误）
  const processed = transform(parsed);

  // 4. 保存（有自己的错误处理）
  return saveToDatabase(processed);
}

// 类型守卫
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// 安全的错误处理
function handleError(error: unknown): void {
  if (isAppError(error)) {
    console.error(`[${error.code}] ${error.message}`);
  } else if (isError(error)) {
    console.error(`Unexpected error: ${error.message}`);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## 异步错误处理

### Promise 错误处理

```typescript
// ❌ 未处理的 Promise 拒绝
async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json(); // 可能失败
}

// ✅ 完整的异步错误处理
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError('User', id);
    }
    if (response.status === 401) {
      throw new AuthenticationError();
    }
    throw new AppError(
      `HTTP error: ${response.status}`,
      'HTTP_ERROR',
      response.status
    );
  }

  try {
    return await response.json();
  } catch {
    throw new AppError('Invalid JSON response', 'PARSE_ERROR', 500);
  }
}

// 使用 .catch() 链式处理
fetchUser('123')
  .then((user) => processUser(user))
  .catch((error) => {
    if (error instanceof NotFoundError) {
      return null; // 返回默认值
    }
    throw error; // 重新抛出其他错误
  });
```

### 并行操作错误处理

```typescript
// Promise.all - 任一失败则全部失败
async function fetchAllUsers(ids: string[]): Promise<User[]> {
  try {
    return await Promise.all(ids.map((id) => fetchUser(id)));
  } catch (error) {
    // 只能捕获第一个失败
    throw new AppError('Failed to fetch users', 'BATCH_ERROR');
  }
}

// Promise.allSettled - 获取所有结果
async function fetchAllUsersWithResults(ids: string[]) {
  const results = await Promise.allSettled(ids.map((id) => fetchUser(id)));

  const users: User[] = [];
  const errors: Error[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      users.push(result.value);
    } else {
      errors.push(new Error(`Failed to fetch user ${ids[index]}: ${result.reason}`));
    }
  });

  return { users, errors };
}

// 带重试的请求
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
}
```

## React 错误处理

### Error Boundary

```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-fallback">
            <h2>出错了</h2>
            <p>{this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              重试
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// 使用
function App() {
  return (
    <ErrorBoundary
      fallback={<ErrorPage />}
      onError={(error) => reportError(error)}
    >
      <MainContent />
    </ErrorBoundary>
  );
}
```

### 异步状态错误处理

```tsx
import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });

    try {
      const data = await asyncFn();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setState({ data: null, loading: false, error: errorObj });
      throw errorObj;
    }
  }, []);

  return { ...state, execute };
}

// 使用
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error, execute } = useAsync<User>();

  useEffect(() => {
    execute(() => fetchUser(userId));
  }, [userId, execute]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return null;

  return <Profile user={user} />;
}
```

## 全局错误处理

### Node.js 全局处理

```typescript
// 未捕获异常
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  // 记录日志
  logger.fatal(error);
  // 优雅关闭
  gracefulShutdown(1);
});

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // 转换为未捕获异常处理
  throw reason;
});

// 优雅关闭
async function gracefulShutdown(exitCode: number) {
  console.log('Graceful shutdown initiated...');

  // 停止接收新请求
  server.close();

  // 等待现有请求完成
  await Promise.race([
    waitForConnections(),
    new Promise((resolve) => setTimeout(resolve, 30000)),
  ]);

  // 关闭数据库连接
  await database.disconnect();

  process.exit(exitCode);
}
```

### Express 错误中间件

```typescript
import { Request, Response, NextFunction } from 'express';

// 错误处理中间件
function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 记录错误
  console.error(error);

  // 判断错误类型
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // 开发环境返回详细错误
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }

  // 生产环境返回通用错误
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

// 异步路由包装器
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 使用
app.get(
  '/api/users/:id',
  asyncHandler(async (req, res) => {
    const user = await userService.findById(req.params.id);
    res.json(user);
  })
);

app.use(errorHandler);
```

## 最佳实践总结

```
错误处理最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   错误设计                                          │
│   ├── 使用自定义错误类                              │
│   ├── 包含错误代码和上下文                          │
│   ├── 区分可恢复和不可恢复错误                      │
│   └── 保持错误消息清晰                              │
│                                                     │
│   处理策略                                          │
│   ├── 尽早失败，快速恢复                            │
│   ├── 精确捕获，避免吞没错误                        │
│   ├── 使用类型守卫确保类型安全                      │
│   └── 提供有意义的默认值                            │
│                                                     │
│   用户体验                                          │
│   ├── 友好的错误消息                                │
│   ├── 提供重试选项                                  │
│   ├── 保持应用可用                                  │
│   └── 记录详细日志供调试                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 处理方式 |
|------|----------|
| 验证错误 | 返回具体字段错误 |
| 网络错误 | 重试机制 + 超时 |
| 认证错误 | 引导重新登录 |
| 未知错误 | 记录日志 + 通用提示 |

---

*好的错误处理让用户感觉不到错误的存在。*
