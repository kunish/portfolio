---
title: 'JWT Authentication Complete Guide: Principles and Best Practices'
description: 'Deep dive into JSON Web Token structure, signature verification, secure storage and attack prevention'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'jwt-auth-guide'
---

JWT (JSON Web Token) is the most common authentication scheme in modern web applications. This article explains its principles and practices.

## JWT Basics

### What is JWT

```
JWT Structure:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Header.Payload.Signature                          │
│                                                     │
│   eyJhbGciOiJIUzI1NiJ9.                             │
│   eyJzdWIiOiJ1c2VyMTIzIn0.                          │
│   SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c      │
│                                                     │
│   ├── Header: Algorithm and type                    │
│   ├── Payload: User data and claims                 │
│   └── Signature: Verification signature             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Three Parts Explained

```javascript
// Header - Describes token type and algorithm
{
  "alg": "HS256",  // Signing algorithm
  "typ": "JWT"    // Token type
}

// Payload - Contains claims
{
  // Registered Claims
  "iss": "auth.example.com",  // Issuer
  "sub": "user123",           // Subject (user ID)
  "aud": "api.example.com",   // Audience
  "exp": 1706486400,          // Expiration time
  "iat": 1706400000,          // Issued at
  "nbf": 1706400000,          // Not before

  // Private claims
  "userId": "user123",
  "role": "admin",
  "permissions": ["read", "write"]
}

// Signature
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

## Node.js Implementation

### Generating Tokens

```javascript
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Generate access token
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

// Generate refresh token
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, tokenType: 'refresh' },
    SECRET_KEY,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

// Login example
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

### Verifying Tokens

```javascript
// Verification middleware
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

// Using middleware
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.email}` });
});
```

### Refreshing Tokens

```javascript
async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, SECRET_KEY);

    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if blacklisted
    const isBlacklisted = await checkBlacklist(refreshToken);
    if (isBlacklisted) {
      throw new Error('Token revoked');
    }

    // Get user info
    const user = await getUserById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    return {
      accessToken: generateAccessToken(user),
      expiresIn: 900
    };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

// Refresh endpoint
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

## Frontend Handling

### Token Storage

```javascript
// Storage options comparison
/*
┌─────────────────────────────────────────────────────┐
│                                                     │
│   localStorage                                      │
│   ├── Persistent, survives refresh                 │
│   ├── Vulnerable to XSS attacks                    │
│   └── Suitable for: non-sensitive scenarios        │
│                                                     │
│   sessionStorage                                    │
│   ├── Lost when tab closes                         │
│   ├── Same XSS risk                                │
│   └── Suitable for: temporary sessions             │
│                                                     │
│   HttpOnly Cookie                                   │
│   ├── JavaScript cannot access                     │
│   ├── Needs CSRF protection                        │
│   └── Suitable for: high security requirements     │
│                                                     │
│   Memory (variable)                                 │
│   ├── Lost on page refresh                         │
│   ├── Most secure                                  │
│   └── Suitable for: combined with refresh token    │
│                                                     │
└─────────────────────────────────────────────────────┘
*/

// Memory storage approach
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

### Auto Refresh

```javascript
// Axios interceptors
import axios from 'axios';
import { tokenManager } from './token-manager';

const api = axios.create({
  baseURL: '/api'
});

// Request interceptor
api.interceptors.request.use(async (config) => {
  // Check if token is expiring soon (refresh 1 min before)
  if (tokenManager.isTokenExpiringSoon(60)) {
    await refreshToken();
  }

  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 and not retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshToken();
        originalRequest.headers.Authorization =
          `Bearer ${tokenManager.getToken()}`;
        return api(originalRequest);
      } catch {
        // Refresh failed, redirect to login
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

## Security Best Practices

### Algorithm Selection

```javascript
// Recommended: Use RS256 asymmetric encryption
import jwt from 'jsonwebtoken';
import fs from 'fs';

const privateKey = fs.readFileSync('private.pem');
const publicKey = fs.readFileSync('public.pem');

// Sign with private key
function signToken(payload) {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: '15m'
  });
}

// Verify with public key
function verifyToken(token) {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256']
  });
}
```

### Token Revocation

```javascript
// Redis blacklist approach
import Redis from 'ioredis';

const redis = new Redis();

// Revoke token
async function revokeToken(token) {
  const decoded = jwt.decode(token);
  const exp = decoded.exp;
  const ttl = exp - Math.floor(Date.now() / 1000);

  if (ttl > 0) {
    await redis.setex(`blacklist:${token}`, ttl, '1');
  }
}

// Check if revoked
async function isTokenRevoked(token) {
  const result = await redis.get(`blacklist:${token}`);
  return result === '1';
}

// Logout
app.post('/api/auth/logout', verifyToken, async (req, res) => {
  const token = req.headers.authorization.slice(7);
  await revokeToken(token);
  res.json({ message: 'Logged out' });
});
```

### Attack Prevention

```
JWT Security Checklist:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Signature Verification                            │
│   ├── Always verify signature                      │
│   ├── Check alg field, reject none                 │
│   └── Use strong keys (256+ bits)                  │
│                                                     │
│   Claims Verification                               │
│   ├── Verify exp expiration time                   │
│   ├── Verify iss issuer                            │
│   ├── Verify aud audience                          │
│   └── Verify nbf not before time                   │
│                                                     │
│   Transport Security                                │
│   ├── Only transmit over HTTPS                     │
│   ├── Set reasonable expiration times              │
│   └── Require re-auth for sensitive ops            │
│                                                     │
│   Storage Security                                  │
│   ├── Prefer HttpOnly Cookies                      │
│   ├── Set Secure and SameSite attributes           │
│   └── Avoid passing tokens in URLs                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Complete Auth Flow

```javascript
// Auth service
class AuthService {
  async login(email, password) {
    const user = await this.validateCredentials(email, password);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token in database
    await this.saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, user };
  }

  async logout(userId, refreshToken) {
    // Delete refresh token
    await this.deleteRefreshToken(userId, refreshToken);
  }

  async refreshTokens(refreshToken) {
    const decoded = jwt.verify(refreshToken, SECRET_KEY);

    // Verify refresh token exists in database
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

## Best Practices Summary

| Item | Recommendation |
|------|----------------|
| Access token expiry | 5-15 minutes |
| Refresh token expiry | 7-30 days |
| Signing algorithm | RS256 or HS256 |
| Storage method | HttpOnly Cookie |
| Transport method | HTTPS + Authorization Header |

---

*JWT is simple to use, but secure implementation requires caution.*
