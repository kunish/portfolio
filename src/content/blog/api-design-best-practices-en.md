---
title: 'API Design Best Practices: Building Elegant RESTful Interfaces'
description: 'Master RESTful API design principles, versioning, error handling, and documentation standards'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'api-design-best-practices'
---

Excellent API design is key to building maintainable and scalable systems. This article explores RESTful API design principles and best practices.

## RESTful Design Principles

### Resource-Oriented Design

```
RESTful API Design Approach:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Core Concepts                                     │
│   ├── Resource: Entities in the system             │
│   ├── Representation: JSON/XML form of resources   │
│   ├── State Transfer: Via HTTP methods             │
│   └── Uniform Interface: Standardized operations   │
│                                                     │
│   ✅ Good Design                                     │
│   GET    /users          Get user list             │
│   POST   /users          Create user               │
│   GET    /users/123      Get specific user         │
│   PUT    /users/123      Update user               │
│   DELETE /users/123      Delete user               │
│                                                     │
│   ❌ Avoid                                           │
│   GET    /getUsers                                  │
│   POST   /createUser                                │
│   POST   /deleteUser?id=123                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### HTTP Method Semantics

| Method | Idempotent | Safe | Purpose |
|--------|------------|------|---------|
| GET | Yes | Yes | Retrieve resource |
| POST | No | No | Create resource |
| PUT | Yes | No | Full update |
| PATCH | No | No | Partial update |
| DELETE | Yes | No | Delete resource |

### URL Design Standards

```typescript
// URL Design Best Practices

// 1. Use plural nouns for collections
GET /api/v1/users
GET /api/v1/products

// 2. Use slashes for hierarchy
GET /api/v1/users/123/orders
GET /api/v1/organizations/456/members

// 3. Use query params for filtering, sorting, pagination
GET /api/v1/products?category=electronics&sort=-price&page=1&limit=20

// 4. Avoid deep nesting (more than 3 levels)
// ❌ Not recommended
GET /api/v1/countries/1/states/2/cities/3/districts/4

// ✅ Recommended: use query params
GET /api/v1/districts?city=3

// 5. Use hyphens to separate words
GET /api/v1/user-profiles
GET /api/v1/order-items

// 6. Lowercase letters
// ❌ /api/v1/userProfiles
// ✅ /api/v1/user-profiles
```

## Request and Response Design

### Request Body Design

```typescript
// Create resource
// POST /api/v1/users
interface CreateUserRequest {
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  preferences?: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
}

// Update resource - PUT (full update)
// PUT /api/v1/users/123
interface UpdateUserRequest {
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  preferences: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
}

// Partial update - PATCH
// PATCH /api/v1/users/123
interface PatchUserRequest {
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}
```

### Response Body Design

```typescript
// Single resource response
interface UserResponse {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  createdAt: string;  // ISO 8601 format
  updatedAt: string;
  links: {
    self: string;
    orders: string;
  };
}

// Collection response (with pagination)
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  links: {
    self: string;
    first: string;
    prev: string | null;
    next: string | null;
    last: string;
  };
}

// Example response
const response: PaginatedResponse<UserResponse> = {
  data: [
    { id: '1', email: 'alice@example.com', /* ... */ },
    { id: '2', email: 'bob@example.com', /* ... */ },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 156,
    totalPages: 8,
  },
  links: {
    self: '/api/v1/users?page=1&limit=20',
    first: '/api/v1/users?page=1&limit=20',
    prev: null,
    next: '/api/v1/users?page=2&limit=20',
    last: '/api/v1/users?page=8&limit=20',
  },
};
```

### HTTP Status Codes

```typescript
// Success codes
// 200 OK - Request successful
// 201 Created - Resource created
// 204 No Content - Deletion successful, no content

// Client errors
// 400 Bad Request - Malformed request
// 401 Unauthorized - Not authenticated
// 403 Forbidden - No permission
// 404 Not Found - Resource doesn't exist
// 409 Conflict - Resource conflict
// 422 Unprocessable Entity - Validation failed
// 429 Too Many Requests - Rate limited

// Server errors
// 500 Internal Server Error
// 502 Bad Gateway
// 503 Service Unavailable
// 504 Gateway Timeout

// Express example
app.post('/api/v1/users', async (req, res) => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(422).json({ error: error.message, details: error.errors });
    } else if (error instanceof DuplicateError) {
      res.status(409).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
```

## Error Handling

### Error Response Format

```typescript
// Standard error response
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: ErrorDetail[]; // Detailed error info
    requestId?: string;     // Request tracking ID
    documentation?: string; // Documentation link
  };
}

interface ErrorDetail {
  field: string;
  code: string;
  message: string;
}

// Validation error example
const validationError: ErrorResponse = {
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details: [
      {
        field: 'email',
        code: 'INVALID_FORMAT',
        message: 'Email format is invalid',
      },
      {
        field: 'password',
        code: 'TOO_SHORT',
        message: 'Password must be at least 8 characters',
      },
    ],
    requestId: 'req_abc123',
    documentation: 'https://api.example.com/docs/errors#VALIDATION_ERROR',
  },
};
```

### Error Handling Middleware

```typescript
// Custom error classes
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: ErrorDetail[]
  ) {
    super(message);
  }
}

class ValidationError extends ApiError {
  constructor(details: ErrorDetail[]) {
    super(422, 'VALIDATION_ERROR', 'Request validation failed', details);
  }
}

class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

class UnauthorizedError extends ApiError {
  constructor() {
    super(401, 'UNAUTHORIZED', 'Authentication required');
  }
}

// Global error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || generateRequestId();

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
  }

  // Log unknown errors
  logger.error({ err, requestId }, 'Unhandled error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId,
    },
  });
};

app.use(errorHandler);
```

## Versioning

### Version Strategies

```typescript
// 1. URL versioning (recommended)
// Clear, intuitive, easy to cache
GET /api/v1/users
GET /api/v2/users

// 2. Header versioning
// Keeps URLs clean
GET /api/users
Accept: application/vnd.api+json; version=1

// 3. Query parameter versioning
// Flexible but not recommended
GET /api/users?version=1

// Express URL versioning implementation
import { Router } from 'express';

const v1Router = Router();
const v2Router = Router();

// V1 API
v1Router.get('/users', (req, res) => {
  // V1 implementation
});

// V2 API - new fields
v2Router.get('/users', (req, res) => {
  // V2 implementation with new fields
});

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
```

### Backward Compatibility

```typescript
// Adding new fields is safe (backward compatible)
interface UserV1 {
  id: string;
  email: string;
  name: string;
}

interface UserV2 extends UserV1 {
  avatar: string | null;      // New field
  preferences: Preferences;   // New field
}

// Removing or renaming fields requires new version
interface UserV3 {
  id: string;
  email: string;
  firstName: string;  // Split from name
  lastName: string;   // Split from name
  avatar: string | null;
  preferences: Preferences;
}

// Version adapter
function toUserV1(user: UserV3): UserV1 {
  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
  };
}
```

## Authentication and Authorization

### JWT Authentication

```typescript
import jwt from 'jsonwebtoken';

// Generate tokens
function generateTokens(user: User) {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

// Authentication middleware
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError();
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = {
      id: payload.sub as string,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'TOKEN_EXPIRED', 'Access token has expired');
    }
    throw new UnauthorizedError();
  }
};

// Authorization middleware
const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    next();
  };
};

// Usage example
app.get('/api/v1/admin/users', authenticate, authorize('admin'), async (req, res) => {
  const users = await userService.findAll();
  res.json({ data: users });
});
```

### API Key Authentication

```typescript
// API Key middleware
const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    throw new ApiError(401, 'API_KEY_REQUIRED', 'API key is required');
  }

  const client = await apiKeyService.validate(apiKey);

  if (!client) {
    throw new ApiError(401, 'INVALID_API_KEY', 'Invalid API key');
  }

  req.client = client;
  next();
};
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Basic rate limiting
const basicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false,
});

// Redis store (distributed)
const redisLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 60 * 1000,
  max: 100,
});

// Tiered rate limiting
const tierLimits = {
  free: { windowMs: 60000, max: 10 },
  basic: { windowMs: 60000, max: 100 },
  pro: { windowMs: 60000, max: 1000 },
  enterprise: { windowMs: 60000, max: 10000 },
};

const tieredLimiter = (req: Request, res: Response, next: NextFunction) => {
  const tier = req.client?.tier || 'free';
  const limits = tierLimits[tier];

  return rateLimit({
    windowMs: limits.windowMs,
    max: limits.max,
    keyGenerator: (req) => req.client?.id || req.ip,
  })(req, res, next);
};

// Response headers
// RateLimit-Limit: 100
// RateLimit-Remaining: 95
// RateLimit-Reset: 1640000000
```

## Querying and Filtering

### Filtering, Sorting, Pagination

```typescript
// GET /api/v1/products?category=electronics&minPrice=100&maxPrice=500&sort=-price,name&page=1&limit=20

interface QueryParams {
  // Filtering
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;

  // Sorting (- means descending)
  sort?: string;

  // Pagination
  page?: number;
  limit?: number;
}

function parseQueryParams(query: any): QueryParams {
  return {
    category: query.category,
    minPrice: query.minPrice ? Number(query.minPrice) : undefined,
    maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
    status: query.status,
    sort: query.sort,
    page: query.page ? Number(query.page) : 1,
    limit: Math.min(Number(query.limit) || 20, 100), // Max 100
  };
}

function buildQuery(params: QueryParams) {
  const where: any = {};
  const orderBy: any[] = [];

  // Filter conditions
  if (params.category) {
    where.category = params.category;
  }

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.price = {};
    if (params.minPrice !== undefined) where.price.gte = params.minPrice;
    if (params.maxPrice !== undefined) where.price.lte = params.maxPrice;
  }

  // Sorting
  if (params.sort) {
    const fields = params.sort.split(',');
    for (const field of fields) {
      const desc = field.startsWith('-');
      const name = desc ? field.slice(1) : field;
      orderBy.push({ [name]: desc ? 'desc' : 'asc' });
    }
  }

  return {
    where,
    orderBy,
    skip: (params.page! - 1) * params.limit!,
    take: params.limit,
  };
}
```

### Field Selection

```typescript
// GET /api/v1/users?fields=id,name,email

app.get('/api/v1/users', async (req, res) => {
  const fields = req.query.fields?.split(',') || null;

  const users = await prisma.user.findMany({
    select: fields
      ? fields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
      : undefined,
  });

  res.json({ data: users });
});
```

### Related Resources

```typescript
// GET /api/v1/users/123?include=orders,profile

app.get('/api/v1/users/:id', async (req, res) => {
  const includes = req.query.include?.split(',') || [];

  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      orders: includes.includes('orders'),
      profile: includes.includes('profile'),
    },
  });

  res.json({ data: user });
});
```

## API Documentation

### OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: User API
  version: 1.0.0
  description: User management API

servers:
  - url: https://api.example.com/v1
    description: Production server

paths:
  /users:
    get:
      summary: List users
      tags: [Users]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'

    post:
      summary: Create user
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '422':
          $ref: '#/components/responses/ValidationError'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        createdAt:
          type: string
          format: date-time
      required: [id, email, name, createdAt]

    CreateUserRequest:
      type: object
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
        name:
          type: string
      required: [email, password, name]

  responses:
    ValidationError:
      description: Validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```

## Best Practices Summary

```
API Design Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Design Principles                                 │
│   ├── Resource-centric design                      │
│   ├── Use correct HTTP methods                     │
│   ├── Return appropriate status codes              │
│   └── Maintain consistency                         │
│                                                     │
│   Security                                          │
│   ├── Always use HTTPS                             │
│   ├── Implement authentication & authorization     │
│   ├── Rate limiting                                │
│   └── Input validation                             │
│                                                     │
│   Usability                                         │
│   ├── Version control                              │
│   ├── Comprehensive error messages                 │
│   ├── Good documentation                           │
│   └── Consistent response format                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach |
|----------|---------------------|
| Version management | URL path versioning (/v1/) |
| Authentication | JWT + Refresh Token |
| Error format | Unified ErrorResponse |
| Pagination | Page-based + optional cursor |
| Documentation tool | OpenAPI/Swagger |

Good API design is the foundation of user experience and development efficiency. Follow these principles to build clear, consistent, and easy-to-use APIs.

---

*An API is your contract with developers. A well-designed API is the greatest respect you can show to your users.*
