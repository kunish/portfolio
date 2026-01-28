---
title: 'API 设计最佳实践：构建优雅的 RESTful 接口'
description: '掌握 RESTful API 设计原则、版本控制、错误处理和文档规范'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'api-design-best-practices'
---

优秀的 API 设计是构建可维护、可扩展系统的关键。本文将深入探讨 RESTful API 的设计原则和最佳实践。

## RESTful 设计原则

### 资源导向设计

```
RESTful API 设计思路：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   核心概念                                          │
│   ├── 资源 (Resource)：系统中的实体                 │
│   ├── 表述 (Representation)：资源的 JSON/XML 形式  │
│   ├── 状态转移 (State Transfer)：通过 HTTP 方法    │
│   └── 统一接口 (Uniform Interface)：标准化操作      │
│                                                     │
│   ✅ 好的设计                                        │
│   GET    /users          获取用户列表               │
│   POST   /users          创建用户                   │
│   GET    /users/123      获取特定用户               │
│   PUT    /users/123      更新用户                   │
│   DELETE /users/123      删除用户                   │
│                                                     │
│   ❌ 避免的设计                                      │
│   GET    /getUsers                                  │
│   POST   /createUser                                │
│   POST   /deleteUser?id=123                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### HTTP 方法语义

| 方法 | 幂等性 | 安全性 | 用途 |
|------|--------|--------|------|
| GET | 是 | 是 | 获取资源 |
| POST | 否 | 否 | 创建资源 |
| PUT | 是 | 否 | 完整更新 |
| PATCH | 否 | 否 | 部分更新 |
| DELETE | 是 | 否 | 删除资源 |

### URL 设计规范

```typescript
// URL 设计最佳实践

// 1. 使用复数名词表示集合
GET /api/v1/users
GET /api/v1/products

// 2. 使用斜杠表示层级关系
GET /api/v1/users/123/orders
GET /api/v1/organizations/456/members

// 3. 使用查询参数进行筛选、排序、分页
GET /api/v1/products?category=electronics&sort=-price&page=1&limit=20

// 4. 避免深层嵌套（超过3层）
// ❌ 不推荐
GET /api/v1/countries/1/states/2/cities/3/districts/4

// ✅ 推荐：使用查询参数
GET /api/v1/districts?city=3

// 5. 使用连字符分隔多词
GET /api/v1/user-profiles
GET /api/v1/order-items

// 6. 小写字母
// ❌ /api/v1/userProfiles
// ✅ /api/v1/user-profiles
```

## 请求与响应设计

### 请求体设计

```typescript
// 创建资源
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

// 更新资源 - PUT (完整更新)
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

// 部分更新 - PATCH
// PATCH /api/v1/users/123
interface PatchUserRequest {
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}
```

### 响应体设计

```typescript
// 单个资源响应
interface UserResponse {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  createdAt: string;  // ISO 8601 格式
  updatedAt: string;
  links: {
    self: string;
    orders: string;
  };
}

// 集合响应（带分页）
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

// 示例响应
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

### HTTP 状态码

```typescript
// 成功状态码
// 200 OK - 请求成功
// 201 Created - 资源创建成功
// 204 No Content - 删除成功，无返回内容

// 客户端错误
// 400 Bad Request - 请求格式错误
// 401 Unauthorized - 未认证
// 403 Forbidden - 无权限
// 404 Not Found - 资源不存在
// 409 Conflict - 资源冲突
// 422 Unprocessable Entity - 验证失败
// 429 Too Many Requests - 请求过多

// 服务端错误
// 500 Internal Server Error - 服务器内部错误
// 502 Bad Gateway - 网关错误
// 503 Service Unavailable - 服务不可用
// 504 Gateway Timeout - 网关超时

// Express 示例
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

## 错误处理

### 错误响应格式

```typescript
// 标准错误响应
interface ErrorResponse {
  error: {
    code: string;           // 机器可读的错误码
    message: string;        // 人类可读的错误信息
    details?: ErrorDetail[]; // 详细错误信息
    requestId?: string;     // 请求追踪 ID
    documentation?: string; // 文档链接
  };
}

interface ErrorDetail {
  field: string;
  code: string;
  message: string;
}

// 验证错误示例
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

### 错误处理中间件

```typescript
// 自定义错误类
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

// 全局错误处理中间件
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

  // 记录未知错误
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

## 版本控制

### 版本策略

```typescript
// 1. URL 版本（推荐）
// 清晰、直观、易于缓存
GET /api/v1/users
GET /api/v2/users

// 2. Header 版本
// 保持 URL 整洁
GET /api/users
Accept: application/vnd.api+json; version=1

// 3. 查询参数版本
// 灵活但不推荐
GET /api/users?version=1

// Express 实现 URL 版本
import { Router } from 'express';

const v1Router = Router();
const v2Router = Router();

// V1 API
v1Router.get('/users', (req, res) => {
  // V1 实现
});

// V2 API - 新增字段
v2Router.get('/users', (req, res) => {
  // V2 实现，包含新字段
});

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
```

### 向后兼容

```typescript
// 添加新字段是安全的（向后兼容）
interface UserV1 {
  id: string;
  email: string;
  name: string;
}

interface UserV2 extends UserV1 {
  avatar: string | null;      // 新增字段
  preferences: Preferences;   // 新增字段
}

// 删除或重命名字段需要新版本
interface UserV3 {
  id: string;
  email: string;
  firstName: string;  // 从 name 拆分
  lastName: string;   // 从 name 拆分
  avatar: string | null;
  preferences: Preferences;
}

// 版本适配器
function toUserV1(user: UserV3): UserV1 {
  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
  };
}
```

## 认证与授权

### JWT 认证

```typescript
import jwt from 'jsonwebtoken';

// 生成 Token
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

// 认证中间件
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

// 授权中间件
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

// 使用示例
app.get('/api/v1/admin/users', authenticate, authorize('admin'), async (req, res) => {
  const users = await userService.findAll();
  res.json({ data: users });
});
```

### API Key 认证

```typescript
// API Key 中间件
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

## 速率限制

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// 基础限流
const basicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 100,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true, // 返回 RateLimit-* headers
  legacyHeaders: false,
});

// Redis 存储（分布式）
const redisLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 60 * 1000,
  max: 100,
});

// 分级限流
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

// 响应头
// RateLimit-Limit: 100
// RateLimit-Remaining: 95
// RateLimit-Reset: 1640000000
```

## 查询与过滤

### 筛选、排序、分页

```typescript
// GET /api/v1/products?category=electronics&minPrice=100&maxPrice=500&sort=-price,name&page=1&limit=20

interface QueryParams {
  // 筛选
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;

  // 排序（- 表示降序）
  sort?: string;

  // 分页
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
    limit: Math.min(Number(query.limit) || 20, 100), // 最大 100
  };
}

function buildQuery(params: QueryParams) {
  const where: any = {};
  const orderBy: any[] = [];

  // 筛选条件
  if (params.category) {
    where.category = params.category;
  }

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.price = {};
    if (params.minPrice !== undefined) where.price.gte = params.minPrice;
    if (params.maxPrice !== undefined) where.price.lte = params.maxPrice;
  }

  // 排序
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

### 字段选择

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

### 关联资源

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

## API 文档

### OpenAPI 规范

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

## 最佳实践总结

```
API 设计最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   设计原则                                          │
│   ├── 以资源为中心                                  │
│   ├── 使用正确的 HTTP 方法                          │
│   ├── 返回适当的状态码                              │
│   └── 保持一致性                                    │
│                                                     │
│   安全性                                            │
│   ├── 始终使用 HTTPS                                │
│   ├── 实施认证和授权                                │
│   ├── 速率限制                                      │
│   └── 输入验证                                      │
│                                                     │
│   可用性                                            │
│   ├── 版本控制                                      │
│   ├── 完善的错误信息                                │
│   ├── 良好的文档                                    │
│   └── 一致的响应格式                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| 版本管理 | URL 路径版本 (/v1/) |
| 认证方式 | JWT + Refresh Token |
| 错误格式 | 统一 ErrorResponse |
| 分页方式 | 基于页码 + 游标可选 |
| 文档工具 | OpenAPI/Swagger |

好的 API 设计是用户体验和开发效率的基础。遵循这些原则，构建清晰、一致、易用的 API。

---

*API 是你与开发者的契约。设计良好的 API，是对使用者最大的尊重。*
