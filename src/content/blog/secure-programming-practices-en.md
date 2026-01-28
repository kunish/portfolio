---
title: 'Secure Programming Practices: Comprehensive Protection from Code to Architecture'
description: 'Master OWASP Top 10 defense, input validation, authentication, encryption, and security architecture design'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'secure-programming-practices'
---

Security is the cornerstone of software development. This article explores core principles and best practices for secure programming to help developers build more secure applications.

## Security Threat Overview

### OWASP Top 10

```
Common Security Threats:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   A01 - Broken Access Control                       │
│   A02 - Cryptographic Failures                      │
│   A03 - Injection                                   │
│   A04 - Insecure Design                            │
│   A05 - Security Misconfiguration                  │
│   A06 - Vulnerable and Outdated Components         │
│   A07 - Identification and Authentication Failures │
│   A08 - Software and Data Integrity Failures       │
│   A09 - Security Logging and Monitoring Failures   │
│   A10 - Server-Side Request Forgery (SSRF)         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Injection Attack Prevention

### SQL Injection

```typescript
// ❌ Dangerous: String concatenation allows injection
// Example: userId = "1' OR '1'='1" bypasses authentication

// ✅ Safe: Parameterized query
async function safeQuery(userId: string) {
  const query = 'SELECT * FROM users WHERE id = $1';
  return db.query(query, [userId]);
}

// ✅ Using ORM (recommended)
async function ormQuery(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId }
  });
}
```

### Command Injection Prevention

```typescript
// ✅ Safe: Use execFile with array arguments
import { execFileSync } from 'child_process';

function safeFileRead(filename: string) {
  // Validate filename format first
  if (!/^[a-zA-Z0-9_-]+\.txt$/.test(filename)) {
    throw new Error('Invalid filename');
  }

  // Use array form to avoid shell parsing
  return execFileSync('cat', [filename]);
}

// Key principle: Never pass user input to shell commands
// Always use execFile/spawn with argument arrays instead of exec
```

## XSS Prevention

### Output Encoding

```typescript
// HTML entity encoding function
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// React auto-escaping (safe by default)
function SafeComponent({ userInput }: { userInput: string }) {
  return <div>{userInput}</div>;
}

// For rich HTML content: always sanitize with DOMPurify
import DOMPurify from 'dompurify';

function SafeHtmlComponent({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html);
  return <div>{clean}</div>;
}
```

### Content Security Policy

```typescript
// Express CSP middleware using helmet
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

## Authentication Security

### Password Storage

```typescript
import bcrypt from 'bcrypt';
import argon2 from 'argon2';

// bcrypt (recommended)
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Argon2 (more modern alternative)
async function hashWithArgon2(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}
```

### JWT Security

```typescript
import jwt from 'jsonwebtoken';

// ✅ Secure configuration
const JWT_CONFIG = {
  algorithm: 'RS256' as const,  // Use asymmetric encryption
  expiresIn: '15m',             // Short expiration time
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

// Only store minimal info in JWT payload
const goodPayload = { sub: userId, role: 'user' };
```

## Access Control

### RBAC Implementation

```typescript
// Role definition
enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

// Permission definition
const permissions = {
  [Role.ADMIN]: ['read', 'write', 'delete', 'manage'],
  [Role.EDITOR]: ['read', 'write'],
  [Role.VIEWER]: ['read'],
};

// Permission check middleware
function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !permissions[userRole]?.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// Usage example
app.delete('/api/posts/:id',
  authenticate,
  requirePermission('delete'),
  deletePost
);
```

### Resource-Level Control

```typescript
// Ensure users can only access their own resources
async function getOrder(userId: string, orderId: string) {
  const order = await db.orders.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // ✅ Verify resource ownership
  if (order.userId !== userId) {
    throw new ForbiddenError('Access denied');
  }

  return order;
}
```

## Encryption and Data Protection

### Data Encryption

```typescript
import crypto from 'crypto';

// AES-256-GCM encryption class
class Encryption {
  private algorithm = 'aes-256-gcm';
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

### Sensitive Data Handling

```typescript
// ✅ Use environment variables for secrets
const API_KEY = process.env.API_KEY;

// Log sanitization to prevent credential leaks
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

## Secure HTTP Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  frameguard: { action: 'deny' },      // Prevent clickjacking
  noSniff: true,                        // Disable MIME sniffing
  xssFilter: true,                      // XSS filter
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  hidePoweredBy: true,                  // Hide server info
}));

// CORS configuration
import cors from 'cors';

app.use(cors({
  origin: ['https://example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));
```

## Input Validation

```typescript
import { z } from 'zod';

// Define strict input schema
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

// Validation middleware
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

## Security Logging and Monitoring

```typescript
// Security event logging
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

  // Anomaly detection
  if (event.type === 'login_failure') {
    const recentFailures = await countRecentFailures(event.ip);
    if (recentFailures > 5) {
      await alertSecurityTeam('Possible brute force attack', event);
    }
  }
}
```

## Best Practices Summary

```
Secure Programming Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Input Handling                                    │
│   ├── Never trust user input                       │
│   ├── Use parameterized queries                    │
│   ├── Validate and sanitize all input             │
│   └── Implement whitelist approach                 │
│                                                     │
│   Authentication & Authorization                    │
│   ├── Use strong password hashing                  │
│   ├── Implement multi-factor authentication       │
│   ├── Principle of least privilege                │
│   └── Secure session management                    │
│                                                     │
│   Data Protection                                   │
│   ├── Transport encryption (HTTPS)                │
│   ├── Storage encryption                           │
│   ├── Secure key management                        │
│   └── Sensitive data masking                       │
│                                                     │
│   Monitoring & Response                             │
│   ├── Security event logging                       │
│   ├── Anomaly detection alerts                    │
│   ├── Regular security audits                     │
│   └── Incident response plan                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Threat | Defense |
|--------|---------|
| SQL Injection | Parameterized queries, ORM |
| XSS | Output encoding, CSP |
| CSRF | Token validation, SameSite |
| Brute Force | Rate limiting, account lockout |
| Data Breach | Encryption, access control |

Security is an ongoing process, not a one-time task. Stay vigilant, update regularly, and build secure applications.

---

*Security is not a product but a process. No matter how well code is written, one security vulnerability can ruin everything.*
