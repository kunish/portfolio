---
title: '安全编程实践：从代码到架构的全面防护'
description: '掌握 OWASP Top 10 防护、输入验证、认证授权、加密存储和安全架构设计'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'secure-programming-practices'
---

安全是软件开发的基石。本文将深入探讨安全编程的核心原则和最佳实践，帮助开发者构建更安全的应用程序。

## 安全威胁概览

### OWASP Top 10

```
常见安全威胁：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   A01 - 访问控制失效                                │
│   A02 - 加密机制失效                                │
│   A03 - 注入攻击                                    │
│   A04 - 不安全设计                                  │
│   A05 - 安全配置错误                                │
│   A06 - 易受攻击和过时的组件                        │
│   A07 - 身份识别和认证失败                          │
│   A08 - 软件和数据完整性故障                        │
│   A09 - 安全日志和监控失败                          │
│   A10 - 服务器端请求伪造 (SSRF)                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 注入攻击防护

### SQL 注入

```typescript
// ❌ 危险：字符串拼接
async function unsafeQuery(userId: string) {
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  return db.query(query);
}

// ✅ 安全：参数化查询
async function safeQuery(userId: string) {
  const query = 'SELECT * FROM users WHERE id = $1';
  return db.query(query, [userId]);
}

// ✅ 使用 ORM
async function ormQuery(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId }
  });
}
```

### 命令注入

```typescript
// ❌ 危险：直接执行用户输入
function unsafeExec(filename: string) {
  const cmd = `cat ${filename}`;
  return execSync(cmd);
}

// ✅ 安全：使用白名单和验证
function safeExec(filename: string) {
  // 验证文件名格式
  if (!/^[a-zA-Z0-9_-]+\.txt$/.test(filename)) {
    throw new Error('Invalid filename');
  }

  // 使用数组形式避免 shell 解析
  return execFileSync('cat', [filename]);
}
```

## XSS 防护

### 输出编码

```typescript
// HTML 实体编码
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// React 自动转义（安全）
function SafeComponent({ userInput }: { userInput: string }) {
  return <div>{userInput}</div>;
}

// ❌ 危险：绕过 React 转义
function UnsafeComponent({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// ✅ 安全：使用 DOMPurify
import DOMPurify from 'dompurify';

function SafeHtmlComponent({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

### Content Security Policy

```typescript
// Express CSP 中间件
import helmet from 'helmet';

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'strict-dynamic'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.example.com"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));
```

## 认证安全

### 密码存储

```typescript
import bcrypt from 'bcrypt';
import argon2 from 'argon2';

// bcrypt（推荐）
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Argon2（更现代）
async function hashWithArgon2(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}
```

### JWT 安全

```typescript
import jwt from 'jsonwebtoken';

// ✅ 安全配置
const JWT_CONFIG = {
  algorithm: 'RS256' as const,  // 使用非对称加密
  expiresIn: '15m',             // 短过期时间
  issuer: 'myapp',
  audience: 'myapp-users',
};

function generateToken(payload: object): string {
  return jwt.sign(payload, privateKey, JWT_CONFIG);
}

function verifyToken(token: string): object {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  });
}

// ❌ 避免：在 JWT 中存储敏感信息
const badPayload = { userId: 1, password: 'secret' };

// ✅ 正确：只存储必要信息
const goodPayload = { sub: userId, role: 'user' };
```

## 访问控制

### RBAC 实现

```typescript
// 角色定义
enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

// 权限定义
const permissions = {
  [Role.ADMIN]: ['read', 'write', 'delete', 'manage'],
  [Role.EDITOR]: ['read', 'write'],
  [Role.VIEWER]: ['read'],
};

// 权限检查中间件
function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !permissions[userRole]?.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// 使用
app.delete('/api/posts/:id',
  authenticate,
  requirePermission('delete'),
  deletePost
);
```

### 资源级别控制

```typescript
// 确保用户只能访问自己的资源
async function getOrder(userId: string, orderId: string) {
  const order = await db.orders.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // ✅ 验证资源所有权
  if (order.userId !== userId) {
    throw new ForbiddenError('Access denied');
  }

  return order;
}
```

## 加密与数据保护

### 数据加密

```typescript
import crypto from 'crypto';

// AES-256-GCM 加密
class Encryption {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32;
  private ivLength = 16;
  private tagLength = 16;

  constructor(private key: Buffer) {}

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')])
      .toString('base64');
  }

  decrypt(ciphertext: string): string {
    const data = Buffer.from(ciphertext, 'base64');

    const iv = data.subarray(0, this.ivLength);
    const tag = data.subarray(this.ivLength, this.ivLength + this.tagLength);
    const encrypted = data.subarray(this.ivLength + this.tagLength);

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }
}
```

### 敏感数据处理

```typescript
// 环境变量管理
// ❌ 危险：硬编码密钥
const API_KEY = 'sk-abc123';

// ✅ 安全：使用环境变量
const API_KEY = process.env.API_KEY;

// 日志脱敏
function sanitizeLog(data: object): object {
  const sensitiveFields = ['password', 'token', 'creditCard', 'ssn'];

  return Object.entries(data).reduce((acc, [key, value]) => {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
      acc[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      acc[key] = sanitizeLog(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
}
```

## 安全 HTTP 头

```typescript
import helmet from 'helmet';

app.use(helmet({
  // 防止点击劫持
  frameguard: { action: 'deny' },

  // 禁用 MIME 类型嗅探
  noSniff: true,

  // XSS 过滤
  xssFilter: true,

  // HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  // 隐藏服务器信息
  hidePoweredBy: true,
}));

// CORS 配置
import cors from 'cors';

app.use(cors({
  origin: ['https://example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));
```

## 输入验证

```typescript
import { z } from 'zod';

// 定义严格的输入模式
const UserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special char'),
  age: z.number().int().min(0).max(150),
});

// 验证中间件
function validate<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
    }
  };
}

app.post('/api/users', validate(UserSchema), createUser);
```

## 安全日志与监控

```typescript
// 安全事件日志
interface SecurityEvent {
  type: 'login_success' | 'login_failure' | 'access_denied' | 'suspicious_activity';
  userId?: string;
  ip: string;
  userAgent: string;
  details: object;
  timestamp: Date;
}

async function logSecurityEvent(event: SecurityEvent) {
  await db.securityLogs.create({
    data: {
      ...event,
      timestamp: new Date(),
    }
  });

  // 异常检测
  if (event.type === 'login_failure') {
    const recentFailures = await countRecentFailures(event.ip);
    if (recentFailures > 5) {
      await alertSecurityTeam('Possible brute force attack', event);
    }
  }
}
```

## 最佳实践总结

```
安全编程最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   输入处理                                          │
│   ├── 永远不信任用户输入                            │
│   ├── 使用参数化查询                                │
│   ├── 验证和清理所有输入                            │
│   └── 实施白名单策略                                │
│                                                     │
│   认证与授权                                        │
│   ├── 使用强密码哈希算法                            │
│   ├── 实施多因素认证                                │
│   ├── 最小权限原则                                  │
│   └── 会话安全管理                                  │
│                                                     │
│   数据保护                                          │
│   ├── 传输加密 (HTTPS)                              │
│   ├── 存储加密                                      │
│   ├── 密钥安全管理                                  │
│   └── 敏感数据脱敏                                  │
│                                                     │
│   监控与响应                                        │
│   ├── 安全事件日志                                  │
│   ├── 异常检测告警                                  │
│   ├── 定期安全审计                                  │
│   └── 事件响应计划                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 威胁 | 防护措施 |
|------|----------|
| SQL 注入 | 参数化查询、ORM |
| XSS | 输出编码、CSP |
| CSRF | Token 验证、SameSite |
| 暴力破解 | 速率限制、账户锁定 |
| 数据泄露 | 加密、访问控制 |

安全是一个持续的过程，而非一次性任务。保持警惕，定期更新，构建安全的应用程序。

---

*安全不是产品，而是过程。代码写得再好，一个安全漏洞就可能毁掉一切。*
