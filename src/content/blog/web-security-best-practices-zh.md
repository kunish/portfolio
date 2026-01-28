---
title: 'Web 安全最佳实践：从 OWASP 到实战防护'
description: '掌握 XSS、CSRF、SQL 注入防护，认证授权、HTTPS、安全头配置等安全实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'web-security-best-practices'
---

Web 安全是现代应用开发的基石。本文深入探讨常见安全威胁和防护策略。

## OWASP Top 10 概览

```
OWASP Top 10 2021：
┌─────────────────────────────────────────────────────┐
│   A01 - 访问控制失效                                │
│   A02 - 加密机制失效                                │
│   A03 - 注入攻击                                    │
│   A04 - 不安全设计                                  │
│   A05 - 安全配置错误                                │
│   A06 - 易受攻击和过时的组件                        │
│   A07 - 身份认证失效                                │
│   A08 - 软件和数据完整性故障                        │
│   A09 - 安全日志和监控失效                          │
│   A10 - 服务端请求伪造 (SSRF)                      │
└─────────────────────────────────────────────────────┘
```

## XSS 跨站脚本攻击

### 攻击类型

| 类型 | 描述 | 防护 |
|------|------|------|
| 存储型 XSS | 恶意脚本存储在数据库 | 输出编码 |
| 反射型 XSS | URL 参数中传递脚本 | 输入验证 |
| DOM 型 XSS | 通过 DOM 操作执行 | CSP 策略 |

### 输出编码

```typescript
// HTML 转义函数
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 使用示例
const userInput = '<script>alert("xss")</script>';
const safeOutput = escapeHtml(userInput);
// 结果: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;
```

### CSP 内容安全策略

```typescript
// Express.js 中使用 helmet
import helmet from 'helmet';

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.example.com"],
      frameAncestors: ["'none'"],
    },
  })
);
```

## CSRF 防护

### Token 验证

```typescript
import csrf from 'csurf';

// 启用 CSRF 保护
app.use(csrf({ cookie: true }));

// 生成 Token
app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

// 表单中使用
// <input type="hidden" name="_csrf" value="{{ csrfToken }}" />
```

### SameSite Cookie

```typescript
res.cookie('session', sessionId, {
  httpOnly: true,      // 防止 JS 访问
  secure: true,        // 仅 HTTPS
  sameSite: 'strict',  // 防止 CSRF
  maxAge: 3600000,
});
```

## SQL 注入防护

### 参数化查询

```typescript
// 危险：字符串拼接
const unsafeQuery = `SELECT * FROM users WHERE id = ${userId}`; // 不安全！

// 安全：参数化查询
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1 AND status = $2',
  [userId, 'active']
);

// Prisma ORM（自动防护）
const user = await prisma.user.findFirst({
  where: { email: userInput },
});
```

### 输入验证

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().min(0).max(150),
});

function validateInput(input: unknown) {
  return UserSchema.parse(input);
}
```

## 认证与授权

### JWT 安全实践

```typescript
import jwt from 'jsonwebtoken';

// 生成 Token
function generateToken(userId: string, roles: string[]) {
  return jwt.sign(
    { sub: userId, roles },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
}

// 验证 Token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
}

// 认证中间件
function authenticate(req, res, next) {
  const token = req.headers.authorization?.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = payload;
  next();
}
```

### RBAC 权限控制

```typescript
type Role = 'user' | 'editor' | 'admin';

const permissions = {
  user: ['read'],
  editor: ['read', 'write'],
  admin: ['read', 'write', 'delete'],
};

function authorize(requiredPermission: string) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!permissions[userRole]?.includes(requiredPermission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

## 密码安全

```typescript
import bcrypt from 'bcrypt';

// 密码哈希
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// 密码验证
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 密码强度验证
const passwordSchema = z.string()
  .min(8, '至少 8 个字符')
  .regex(/[A-Z]/, '需要大写字母')
  .regex(/[a-z]/, '需要小写字母')
  .regex(/[0-9]/, '需要数字')
  .regex(/[^A-Za-z0-9]/, '需要特殊字符');
```

## HTTPS 和安全头

```typescript
import helmet from 'helmet';

// 一键启用安全头
app.use(helmet());

// HSTS 配置
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true,
}));

// 强制 HTTPS
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }
  next();
});
```

## 速率限制

```typescript
import rateLimit from 'express-rate-limit';

// 通用限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100,
  message: { error: '请求过于频繁' },
});

// 登录限制（更严格）
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: '登录尝试次数过多' },
});

app.use('/api/', limiter);
app.post('/auth/login', loginLimiter);
```

## 安全日志

```typescript
function logSecurityEvent(event: {
  type: string;
  userId?: string;
  ip: string;
  details: Record<string, any>;
}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event,
  }));
}

// 记录登录尝试
logSecurityEvent({
  type: 'LOGIN_ATTEMPT',
  ip: req.ip,
  details: { email, success: true },
});
```

## 最佳实践总结

```
Web 安全清单：
┌─────────────────────────────────────────────────────┐
│   输入验证                                          │
│   ├── 服务端验证所有输入                            │
│   ├── 使用参数化查询                                │
│   └── 清理 HTML 内容                               │
│                                                     │
│   认证安全                                          │
│   ├── 强密码策略                                    │
│   ├── 安全的会话管理                                │
│   └── Token 过期机制                               │
│                                                     │
│   传输安全                                          │
│   ├── 强制 HTTPS                                   │
│   ├── 安全 Cookie                                  │
│   └── 配置安全头                                    │
│                                                     │
│   监控审计                                          │
│   ├── 记录安全事件                                  │
│   ├── 异常检测                                      │
│   └── 定期安全审计                                  │
└─────────────────────────────────────────────────────┘
```

| 威胁 | 防护措施 |
|------|----------|
| XSS | CSP + 输出编码 |
| CSRF | Token + SameSite |
| SQL 注入 | 参数化查询 |
| 暴力破解 | 速率限制 |

---

*安全不是功能，是质量。将安全融入开发的每一步。*
