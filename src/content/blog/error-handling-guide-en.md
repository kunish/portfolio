---
title: 'Error Handling Best Practices: Building Robust Applications'
description: 'Master JavaScript/TypeScript error handling, async errors, global handling and UX optimization'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'error-handling-guide'
---

Error handling is key to building reliable applications. This article explores error handling best practices in JavaScript/TypeScript.

## Error Handling Fundamentals

### Error Types

```
JavaScript Error Types:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   SyntaxError                                       │
│   └── Code syntax error, thrown during parsing     │
│                                                     │
│   TypeError                                         │
│   └── Type mismatch or invalid operation           │
│                                                     │
│   ReferenceError                                    │
│   └── Reference to non-existent variable           │
│                                                     │
│   RangeError                                        │
│   └── Value out of valid range                     │
│                                                     │
│   Custom Error                                      │
│   └── Business logic custom errors                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Error Type | Common Scenarios |
|------------|-----------------|
| TypeError | Calling method on undefined |
| ReferenceError | Using undeclared variable |
| SyntaxError | JSON parse failure |
| RangeError | Negative array length |

## Custom Error Classes

### Basic Custom Error

```typescript
// Basic custom error
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

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
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

### Error Factory

```typescript
// Error factory pattern
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

// Usage
throw ErrorFactory.notFound('User', '123');
throw ErrorFactory.validation('email', 'Invalid email format');
```

## Synchronous Error Handling

### try-catch Best Practices

```typescript
// ❌ Too broad catch
function processData(data: unknown) {
  try {
    // Lots of code...
    const result = JSON.parse(data as string);
    const processed = transform(result);
    saveToDatabase(processed);
  } catch (error) {
    console.log('Something went wrong'); // Loses error info
  }
}

// ✅ Precise error handling
function processData(data: unknown) {
  // 1. Validate input
  if (typeof data !== 'string') {
    throw new ValidationError('data', 'Data must be a string');
  }

  // 2. Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch (error) {
    throw new ValidationError('data', 'Invalid JSON format');
  }

  // 3. Transform data (may throw custom errors)
  const processed = transform(parsed);

  // 4. Save (has its own error handling)
  return saveToDatabase(processed);
}

// Type guards
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Safe error handling
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

## Async Error Handling

### Promise Error Handling

```typescript
// ❌ Unhandled Promise rejection
async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json(); // May fail
}

// ✅ Complete async error handling
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

// Using .catch() chain handling
fetchUser('123')
  .then((user) => processUser(user))
  .catch((error) => {
    if (error instanceof NotFoundError) {
      return null; // Return default value
    }
    throw error; // Re-throw other errors
  });
```

### Parallel Operation Error Handling

```typescript
// Promise.all - any failure fails all
async function fetchAllUsers(ids: string[]): Promise<User[]> {
  try {
    return await Promise.all(ids.map((id) => fetchUser(id)));
  } catch (error) {
    // Can only catch first failure
    throw new AppError('Failed to fetch users', 'BATCH_ERROR');
  }
}

// Promise.allSettled - get all results
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

// Request with retry
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

## React Error Handling

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
            <h2>Something went wrong</h2>
            <p>{this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              Retry
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Usage
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

### Async State Error Handling

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

// Usage
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

## Global Error Handling

### Node.js Global Handling

```typescript
// Uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  // Log error
  logger.fatal(error);
  // Graceful shutdown
  gracefulShutdown(1);
});

// Unhandled Promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Convert to uncaught exception handling
  throw reason;
});

// Graceful shutdown
async function gracefulShutdown(exitCode: number) {
  console.log('Graceful shutdown initiated...');

  // Stop accepting new requests
  server.close();

  // Wait for existing requests to complete
  await Promise.race([
    waitForConnections(),
    new Promise((resolve) => setTimeout(resolve, 30000)),
  ]);

  // Close database connections
  await database.disconnect();

  process.exit(exitCode);
}
```

### Express Error Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

// Error handling middleware
function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  console.error(error);

  // Check error type
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // Development environment returns detailed error
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }

  // Production environment returns generic error
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

// Async route wrapper
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
app.get(
  '/api/users/:id',
  asyncHandler(async (req, res) => {
    const user = await userService.findById(req.params.id);
    res.json(user);
  })
);

app.use(errorHandler);
```

## Best Practices Summary

```
Error Handling Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Error Design                                      │
│   ├── Use custom error classes                     │
│   ├── Include error codes and context             │
│   ├── Distinguish recoverable vs fatal errors     │
│   └── Keep error messages clear                    │
│                                                     │
│   Handling Strategy                                 │
│   ├── Fail fast, recover quickly                   │
│   ├── Catch precisely, avoid swallowing errors    │
│   ├── Use type guards for type safety             │
│   └── Provide meaningful defaults                  │
│                                                     │
│   User Experience                                   │
│   ├── Friendly error messages                      │
│   ├── Provide retry options                        │
│   ├── Keep application available                   │
│   └── Log details for debugging                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Handling Approach |
|----------|-------------------|
| Validation errors | Return specific field errors |
| Network errors | Retry mechanism + timeout |
| Auth errors | Guide to re-login |
| Unknown errors | Log + generic message |

---

*Good error handling makes users unaware that errors exist.*
