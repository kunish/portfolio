---
title: 'OAuth 2.0 Authentication: Modern Application Authorization Guide'
description: 'Master OAuth 2.0 flows, JWT tokens, third-party login and security best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'oauth-authentication-guide'
---

OAuth 2.0 is the standard protocol for modern application authorization. This article explores OAuth's core concepts and implementation.

## OAuth 2.0 Overview

### Core Roles

```
OAuth 2.0 Roles:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Resource Owner                                    │
│   └── Usually the user                             │
│                                                     │
│   Client                                            │
│   └── Application requesting resource access       │
│                                                     │
│   Authorization Server                              │
│   └── Verifies identity and issues tokens          │
│                                                     │
│   Resource Server                                   │
│   └── Hosts protected resources                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Grant Type | Use Case |
|------------|----------|
| Authorization Code | Web applications |
| PKCE | Mobile/SPA apps |
| Client Credentials | Service-to-service |
| Refresh Token | Token renewal |

## Authorization Code Flow

### Complete Flow

```typescript
// 1. Redirect user to authorization server
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

// 2. Handle callback
async function handleCallback(code: string, state: string) {
  // Verify state to prevent CSRF
  if (state !== getStoredState()) {
    throw new Error('Invalid state');
  }

  // Exchange authorization code for tokens
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

### PKCE Extension

```typescript
// For public clients (SPA, mobile apps)
async function generatePKCE() {
  // Generate code_verifier
  const verifier = generateRandomString(128);

  // Generate code_challenge
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { verifier, challenge };
}

// Authorization request
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

// Token exchange
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

## JWT Tokens

### Token Structure

```typescript
// JWT structure: header.payload.signature
interface JWTPayload {
  iss: string;       // Issuer
  sub: string;       // Subject (user ID)
  aud: string;       // Audience
  exp: number;       // Expiration time
  iat: number;       // Issued at
  scope: string;     // Permission scope
  email?: string;    // Custom claims
}

// Parse JWT (without signature verification)
function parseJWT(token: string): JWTPayload {
  const [, payload] = token.split('.');
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  return Date.now() >= payload.exp * 1000;
}
```

### Token Refresh

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

    // Refresh the token
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

## Third-Party Login

### Google Login

```typescript
// Google OAuth configuration
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

### GitHub Login

```typescript
// GitHub OAuth configuration
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

// Backend handling
async function handleGitHubCallback(code: string) {
  // Exchange for token
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

  // Get user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  return userResponse.json();
}
```

## Server Implementation

### Express Middleware

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

// Usage
app.get('/api/profile', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
```

### Token Generation

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

## Security Best Practices

```
OAuth Security Checklist:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Token Security                                    │
│   ├── Short-lived access tokens (15 min)           │
│   ├── Secure refresh token storage                 │
│   ├── HTTPS transport                              │
│   └── HttpOnly Cookies                             │
│                                                     │
│   Protection Measures                               │
│   ├── Use state to prevent CSRF                    │
│   ├── PKCE to prevent code interception            │
│   ├── Validate redirect_uri                        │
│   └── Token binding                                │
│                                                     │
│   Storage Strategy                                  │
│   ├── Avoid localStorage (XSS risk)               │
│   ├── Use HttpOnly Cookies                         │
│   ├── In-memory storage (SPA)                      │
│   └── Secure session management                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommendation |
|----------|----------------|
| Web apps | Authorization Code + PKCE |
| SPA | PKCE + Memory storage |
| Mobile apps | PKCE + Secure storage |
| Service-to-service | Client Credentials |

---

*OAuth 2.0 isn't just a protocol, it's a security mindset.*
