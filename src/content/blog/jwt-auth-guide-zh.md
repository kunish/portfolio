---
title: 'JWT 认证完全指南：原理与最佳实践'
description: '深入理解 JSON Web Token 的结构、签名验证、安全存储和常见攻击防护'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'jwt-auth-guide'
---

JWT (JSON Web Token) 是现代 Web 应用中最常用的认证方案。本文详解其原理与实践。

## JWT 基础

### 什么是 JWT

```
JWT 结构：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Header.Payload.Signature                          │
│                                                     │
│   eyJhbGciOiJIUzI1NiJ9.                             │
│   eyJzdWIiOiJ1c2VyMTIzIn0.                          │
│   SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c      │
│                                                     │
│   ├── Header：算法和类型                            │
│   ├── Payload：用户数据和声明                       │
│   └── Signature：签名验证                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 三个部分详解

```javascript
// Header - 描述 token 类型和算法
{
  "alg": "HS256",  // 签名算法
  "typ": "JWT"    // token 类型
}

// Payload - 包含声明 (Claims)
{
  // 注册声明 (Registered Claims)
  "iss": "auth.example.com",  // 签发者
  "sub": "user123",           // 主题（用户ID）
  "aud": "api.example.com",   // 接收者
  "exp": 1706486400,          // 过期时间
  "iat": 1706400000,          // 签发时间
  "nbf": 1706400000,          // 生效时间

  // 私有声明
  "userId": "user123",
  "role": "admin",
  "permissions": ["read", "write"]
}

// Signature - 签名
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

## Node.js 实现

### 生成 Token

```javascript
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// 生成访问令牌
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    SECRET_KEY,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'api.example.com',
      audience: 'example.com'
    }
  );
}

// 生成刷新令牌
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, tokenType: 'refresh' },
    SECRET_KEY,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

// 登录示例
async function login(email, password) {
  const user = await authenticateUser(email, password);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    expiresIn: 900  // 15 minutes in seconds
  };
}
```

### 验证 Token

```javascript
// 验证中间件
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, SECRET_KEY, {
      issuer: 'api.example.com',
      audience: 'example.com'
    });

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// 使用中间件
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.email}` });
});
```

### 刷新令牌

```javascript
async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, SECRET_KEY);

    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // 检查是否在黑名单中
    const isBlacklisted = await checkBlacklist(refreshToken);
    if (isBlacklisted) {
      throw new Error('Token revoked');
    }

    // 获取用户信息
    const user = await getUserById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 生成新的访问令牌
    return {
      accessToken: generateAccessToken(user),
      expiresIn: 900
    };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

// 刷新端点
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const tokens = await refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
```

## 前端处理

### Token 存储

```javascript
// 存储选项对比
/*
┌─────────────────────────────────────────────────────┐
│                                                     │
│   localStorage                                      │
│   ├── 持久存储，刷新不丢失                         │
│   ├── 容易被 XSS 攻击获取                          │
│   └── 适合：不敏感场景                             │
│                                                     │
│   sessionStorage                                    │
│   ├── 标签页关闭即失效                             │
│   ├── 同样有 XSS 风险                              │
│   └── 适合：临时会话                               │
│                                                     │
│   HttpOnly Cookie                                   │
│   ├── JavaScript 无法访问                          │
│   ├── 需防护 CSRF                                  │
│   └── 适合：安全要求高的场景                       │
│                                                     │
│   内存（变量）                                      │
│   ├── 刷新页面丢失                                 │
│   ├── 最安全                                       │
│   └── 适合：结合 refresh token                     │
│                                                     │
└─────────────────────────────────────────────────────┘
*/

// 内存存储方案
class TokenManager {
  constructor() {
    this.accessToken = null;
  }

  setToken(token) {
    this.accessToken = token;
  }

  getToken() {
    return this.accessToken;
  }

  clearToken() {
    this.accessToken = null;
  }

  isTokenExpired() {
    if (!this.accessToken) return true;

    try {
      const payload = JSON.parse(
        atob(this.accessToken.split('.')[1])
      );
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}

export const tokenManager = new TokenManager();
```

### 自动刷新

```javascript
// Axios 拦截器
import axios from 'axios';
import { tokenManager } from './token-manager';

const api = axios.create({
  baseURL: '/api'
});

// 请求拦截器
api.interceptors.request.use(async (config) => {
  // 检查 token 是否即将过期（提前 1 分钟刷新）
  if (tokenManager.isTokenExpiringSoon(60)) {
    await refreshToken();
  }

  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 且未重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshToken();
        originalRequest.headers.Authorization =
          `Bearer ${tokenManager.getToken()}`;
        return api(originalRequest);
      } catch {
        // 刷新失败，跳转登录
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

async function refreshToken() {
  const response = await axios.post('/api/auth/refresh', {
    refreshToken: getCookie('refreshToken')
  });
  tokenManager.setToken(response.data.accessToken);
}
```

## 安全最佳实践

### 签名算法选择

```javascript
// 推荐：使用 RS256 非对称加密
import jwt from 'jsonwebtoken';
import fs from 'fs';

const privateKey = fs.readFileSync('private.pem');
const publicKey = fs.readFileSync('public.pem');

// 签名使用私钥
function signToken(payload) {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: '15m'
  });
}

// 验证使用公钥
function verifyToken(token) {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256']
  });
}
```

### 令牌吊销

```javascript
// Redis 黑名单方案
import Redis from 'ioredis';

const redis = new Redis();

// 吊销令牌
async function revokeToken(token) {
  const decoded = jwt.decode(token);
  const exp = decoded.exp;
  const ttl = exp - Math.floor(Date.now() / 1000);

  if (ttl > 0) {
    await redis.setex(`blacklist:${token}`, ttl, '1');
  }
}

// 检查是否被吊销
async function isTokenRevoked(token) {
  const result = await redis.get(`blacklist:${token}`);
  return result === '1';
}

// 登出
app.post('/api/auth/logout', verifyToken, async (req, res) => {
  const token = req.headers.authorization.slice(7);
  await revokeToken(token);
  res.json({ message: 'Logged out' });
});
```

### 常见攻击防护

```
JWT 安全清单：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   签名验证                                          │
│   ├── 始终验证签名                                 │
│   ├── 检查 alg 字段，拒绝 none                     │
│   └── 使用强密钥（256位以上）                      │
│                                                     │
│   声明验证                                          │
│   ├── 验证 exp 过期时间                            │
│   ├── 验证 iss 签发者                              │
│   ├── 验证 aud 接收者                              │
│   └── 验证 nbf 生效时间                            │
│                                                     │
│   传输安全                                          │
│   ├── 仅通过 HTTPS 传输                            │
│   ├── 设置合理的过期时间                           │
│   └── 敏感操作要求重新认证                         │
│                                                     │
│   存储安全                                          │
│   ├── 优先使用 HttpOnly Cookie                     │
│   ├── 设置 Secure 和 SameSite 属性                 │
│   └── 避免在 URL 中传递 token                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 完整认证流程

```javascript
// 认证服务
class AuthService {
  async login(email, password) {
    const user = await this.validateCredentials(email, password);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // 存储 refresh token 到数据库
    await this.saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, user };
  }

  async logout(userId, refreshToken) {
    // 删除 refresh token
    await this.deleteRefreshToken(userId, refreshToken);
  }

  async refreshTokens(refreshToken) {
    const decoded = jwt.verify(refreshToken, SECRET_KEY);

    // 验证 refresh token 存在于数据库
    const valid = await this.validateRefreshToken(
      decoded.userId,
      refreshToken
    );
    if (!valid) {
      throw new Error('Invalid refresh token');
    }

    const user = await this.getUserById(decoded.userId);
    return {
      accessToken: this.generateAccessToken(user)
    };
  }
}
```

## 最佳实践总结

| 项目 | 建议 |
|------|------|
| 访问令牌有效期 | 5-15 分钟 |
| 刷新令牌有效期 | 7-30 天 |
| 签名算法 | RS256 或 HS256 |
| 存储方式 | HttpOnly Cookie |
| 传输方式 | HTTPS + Authorization Header |

---

*JWT 简单易用，但安全实现需要谨慎。*
