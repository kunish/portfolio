---
title: 'Web Security Best Practices: From OWASP to Real-World Protection'
description: 'Master XSS, CSRF, SQL injection prevention, authentication, HTTPS, and security headers'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'web-security-best-practices'
---

Web security is the foundation of modern application development. This article explores common threats and protection strategies.

## OWASP Top 10 Overview

```
OWASP Top 10 2021:
┌─────────────────────────────────────────────────────┐
│   A01 - Broken Access Control                       │
│   A02 - Cryptographic Failures                      │
│   A03 - Injection                                   │
│   A04 - Insecure Design                            │
│   A05 - Security Misconfiguration                   │
│   A06 - Vulnerable and Outdated Components          │
│   A07 - Identification and Authentication Failures  │
│   A08 - Software and Data Integrity Failures        │
│   A09 - Security Logging and Monitoring Failures    │
│   A10 - Server-Side Request Forgery (SSRF)         │
└─────────────────────────────────────────────────────┘
```

## XSS Cross-Site Scripting

### Attack Types

| Type | Description | Protection |
|------|-------------|------------|
| Stored XSS | Scripts stored in database | Output encoding |
| Reflected XSS | Scripts in URL parameters | Input validation |
| DOM-based XSS | Executed via DOM manipulation | CSP policy |

### Output Encoding

```typescript
// HTML escape function
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Usage example
const userInput = '<script>alert("xss")</script>';
const safeOutput = escapeHtml(userInput);
// Result: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;
```

### CSP Content Security Policy

```typescript
// Using helmet in Express.js
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

## CSRF Protection

### Token Validation

```typescript
import csrf from 'csurf';

// Enable CSRF protection
app.use(csrf({ cookie: true }));

// Generate Token
app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

// Use in form
// <input type="hidden" name="_csrf" value="{{ csrfToken }}" />
```

### SameSite Cookie

```typescript
res.cookie('session', sessionId, {
  httpOnly: true,      // Prevent JS access
  secure: true,        // HTTPS only
  sameSite: 'strict',  // Prevent CSRF
  maxAge: 3600000,
});
```

## SQL Injection Prevention

### Parameterized Queries

```typescript
// Dangerous: string concatenation
const unsafeQuery = `SELECT * FROM users WHERE id = ${userId}`; // Unsafe!

// Safe: parameterized queries
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1 AND status = $2',
  [userId, 'active']
);

// Prisma ORM (automatic protection)
const user = await prisma.user.findFirst({
  where: { email: userInput },
});
```

### Input Validation

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

## Authentication & Authorization

### JWT Security Practices

```typescript
import jwt from 'jsonwebtoken';

// Generate Token
function generateToken(userId: string, roles: string[]) {
  return jwt.sign(
    { sub: userId, roles },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
}

// Verify Token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
}

// Authentication middleware
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

### RBAC Access Control

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

## Password Security

```typescript
import bcrypt from 'bcrypt';

// Password hashing
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Password verification
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Password strength validation
const passwordSchema = z.string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'Requires uppercase')
  .regex(/[a-z]/, 'Requires lowercase')
  .regex(/[0-9]/, 'Requires number')
  .regex(/[^A-Za-z0-9]/, 'Requires special character');
```

## HTTPS and Security Headers

```typescript
import helmet from 'helmet';

// Enable security headers
app.use(helmet());

// HSTS configuration
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true,
}));

// Force HTTPS
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }
  next();
});
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests' },
});

// Login limiting (stricter)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts' },
});

app.use('/api/', limiter);
app.post('/auth/login', loginLimiter);
```

## Security Logging

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

// Log login attempts
logSecurityEvent({
  type: 'LOGIN_ATTEMPT',
  ip: req.ip,
  details: { email, success: true },
});
```

## Best Practices Summary

```
Web Security Checklist:
┌─────────────────────────────────────────────────────┐
│   Input Validation                                  │
│   ├── Validate all inputs server-side             │
│   ├── Use parameterized queries                   │
│   └── Sanitize HTML content                        │
│                                                     │
│   Authentication Security                           │
│   ├── Strong password policies                    │
│   ├── Secure session management                   │
│   └── Token expiration                             │
│                                                     │
│   Transport Security                                │
│   ├── Force HTTPS                                  │
│   ├── Secure cookies                               │
│   └── Security headers                             │
│                                                     │
│   Monitoring & Auditing                             │
│   ├── Log security events                         │
│   ├── Anomaly detection                           │
│   └── Regular security audits                     │
└─────────────────────────────────────────────────────┘
```

| Threat | Protection |
|--------|------------|
| XSS | CSP + Output Encoding |
| CSRF | Token + SameSite |
| SQL Injection | Parameterized Queries |
| Brute Force | Rate Limiting |

---

*Security is not a feature, it's quality. Embed security into every step of development.*
