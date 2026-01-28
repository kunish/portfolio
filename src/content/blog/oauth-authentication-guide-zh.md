---
title: 'OAuth 2.0 认证：现代应用授权指南'
description: '掌握 OAuth 2.0 流程、JWT 令牌、第三方登录和安全最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'oauth-authentication-guide'
---

OAuth 2.0 是现代应用授权的标准协议。本文探讨 OAuth 的核心概念和实现方式。

## OAuth 2.0 概述

### 核心角色

```
OAuth 2.0 角色：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Resource Owner（资源所有者）                      │
│   └── 通常是用户                                    │
│                                                     │
│   Client（客户端）                                  │
│   └── 请求访问资源的应用                            │
│                                                     │
│   Authorization Server（授权服务器）                │
│   └── 验证身份并发放令牌                            │
│                                                     │
│   Resource Server（资源服务器）                     │
│   └── 托管受保护资源的服务                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 授权类型 | 适用场景 |
|----------|----------|
| Authorization Code | Web 应用 |
| PKCE | 移动/SPA 应用 |
| Client Credentials | 服务间通信 |
| Refresh Token | 令牌续期 |

## 授权码流程

### 完整流程

```typescript
// 1. 重定向用户到授权服务器
function redirectToAuth() {
  const params = new URLSearchParams({
    client_id: 'your-client-id',
    redirect_uri: 'https://yourapp.com/callback',
    response_type: 'code',
    scope: 'openid profile email',
    state: generateRandomState(),
  });

  window.location.href = `https://auth.example.com/authorize?${params}`;
}

// 2. 处理回调
async function handleCallback(code: string, state: string) {
  // 验证 state 防止 CSRF
  if (state !== getStoredState()) {
    throw new Error('Invalid state');
  }

  // 用授权码换取令牌
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://yourapp.com/callback',
      client_id: 'your-client-id',
      client_secret: 'your-client-secret',
    }),
  });

  const tokens = await response.json();
  return tokens;
}
```

### PKCE 扩展

```typescript
// 适用于公开客户端（SPA、移动应用）
async function generatePKCE() {
  // 生成 code_verifier
  const verifier = generateRandomString(128);

  // 生成 code_challenge
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { verifier, challenge };
}

// 授权请求
async function authorizeWithPKCE() {
  const { verifier, challenge } = await generatePKCE();
  sessionStorage.setItem('pkce_verifier', verifier);

  const params = new URLSearchParams({
    client_id: 'your-client-id',
    redirect_uri: 'https://yourapp.com/callback',
    response_type: 'code',
    scope: 'openid profile email',
    state: generateRandomState(),
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `https://auth.example.com/authorize?${params}`;
}

// 令牌交换
async function exchangeCodeWithPKCE(code: string) {
  const verifier = sessionStorage.getItem('pkce_verifier');

  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://yourapp.com/callback',
      client_id: 'your-client-id',
      code_verifier: verifier!,
    }),
  });

  return response.json();
}
```

## JWT 令牌

### 令牌结构

```typescript
// JWT 结构：header.payload.signature
interface JWTPayload {
  iss: string;       // 签发者
  sub: string;       // 主体（用户 ID）
  aud: string;       // 受众
  exp: number;       // 过期时间
  iat: number;       // 签发时间
  scope: string;     // 权限范围
  email?: string;    // 自定义声明
}

// 解析 JWT（不验证签名）
function parseJWT(token: string): JWTPayload {
  const [, payload] = token.split('.');
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}

// 检查令牌是否过期
function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  return Date.now() >= payload.exp * 1000;
}
```

### 令牌刷新

```typescript
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
  }

  async getValidAccessToken(): Promise<string> {
    if (this.accessToken && !isTokenExpired(this.accessToken)) {
      return this.accessToken;
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token');
    }

    // 刷新令牌
    const response = await fetch('https://auth.example.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: 'your-client-id',
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const tokens = await response.json();
    this.accessToken = tokens.access_token;
    if (tokens.refresh_token) {
      this.refreshToken = tokens.refresh_token;
    }

    return this.accessToken!;
  }
}
```

## 第三方登录

### Google 登录

```typescript
// Google OAuth 配置
const googleConfig = {
  clientId: 'your-google-client-id.apps.googleusercontent.com',
  redirectUri: 'https://yourapp.com/auth/google/callback',
  scope: 'openid email profile',
};

function loginWithGoogle() {
  const params = new URLSearchParams({
    client_id: googleConfig.clientId,
    redirect_uri: googleConfig.redirectUri,
    response_type: 'code',
    scope: googleConfig.scope,
    state: generateRandomState(),
    access_type: 'offline',
    prompt: 'consent',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
```

### GitHub 登录

```typescript
// GitHub OAuth 配置
const githubConfig = {
  clientId: 'your-github-client-id',
  redirectUri: 'https://yourapp.com/auth/github/callback',
  scope: 'read:user user:email',
};

function loginWithGitHub() {
  const params = new URLSearchParams({
    client_id: githubConfig.clientId,
    redirect_uri: githubConfig.redirectUri,
    scope: githubConfig.scope,
    state: generateRandomState(),
  });

  window.location.href = `https://github.com/login/oauth/authorize?${params}`;
}

// 后端处理
async function handleGitHubCallback(code: string) {
  // 换取令牌
  const tokenResponse = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    }
  );

  const { access_token } = await tokenResponse.json();

  // 获取用户信息
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  return userResponse.json();
}
```

## 服务端实现

### Express 中间件

```typescript
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: JWTPayload;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// 使用
app.get('/api/profile', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
```

### 令牌生成

```typescript
import jwt from 'jsonwebtoken';

function generateTokens(user: User) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      scope: user.roles.join(' '),
    },
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
```

## 安全最佳实践

```
OAuth 安全清单：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   令牌安全                                          │
│   ├── 短期访问令牌（15分钟）                        │
│   ├── 安全存储刷新令牌                              │
│   ├── HTTPS 传输                                   │
│   └── HttpOnly Cookie                              │
│                                                     │
│   防护措施                                          │
│   ├── 使用 state 防 CSRF                           │
│   ├── PKCE 防授权码拦截                            │
│   ├── 验证 redirect_uri                            │
│   └── 令牌绑定                                      │
│                                                     │
│   存储策略                                          │
│   ├── 避免 localStorage（XSS 风险）                │
│   ├── 使用 HttpOnly Cookie                         │
│   ├── 内存存储（SPA）                              │
│   └── 安全的会话管理                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| Web 应用 | Authorization Code + PKCE |
| SPA | PKCE + 内存存储 |
| 移动应用 | PKCE + 安全存储 |
| 服务间 | Client Credentials |

---

*OAuth 2.0 不仅是协议，更是安全思维方式。*
