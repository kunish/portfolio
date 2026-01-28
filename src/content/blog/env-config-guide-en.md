---
title: 'Environment Variables & Configuration: Building Maintainable Applications'
description: 'Master environment variables, config files, secrets management and multi-environment deployment'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'env-config-guide'
---

Configuration management is the foundation of maintainable applications. This article explores best practices for environment variables and configuration.

## Configuration Overview

### Configuration Hierarchy

```
Configuration Priority (high to low):
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Command Line Arguments                            │
│   └── node app.js --port=3000                      │
│                                                     │
│   Environment Variables                             │
│   └── PORT=3000 node app.js                        │
│                                                     │
│   .env Files                                        │
│   └── .env.local > .env.production > .env          │
│                                                     │
│   Config Files                                      │
│   └── config.json / config.ts                      │
│                                                     │
│   Default Values                                    │
│   └── Hardcoded defaults in code                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Config Type | Use Case |
|-------------|----------|
| Env Variables | Sensitive info, deployment differences |
| Config Files | Complex config, version controlled |
| Defaults | Development convenience, sensible defaults |

## Environment Variable Basics

### .env Files

```bash
# .env - Base configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:8080

# .env.development - Development environment
DATABASE_URL=postgres://localhost:5432/dev
DEBUG=true

# .env.production - Production environment
DATABASE_URL=postgres://prod-server:5432/prod
DEBUG=false

# .env.local - Local overrides (not committed to Git)
API_KEY=my-secret-key
```

### dotenv Loading

```typescript
// Using dotenv
import dotenv from 'dotenv';

// Load default .env
dotenv.config();

// Load specific environment
dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});

// Multi-file loading
import dotenvExpand from 'dotenv-expand';

const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

// Variable expansion example
// .env file:
// BASE_URL=https://api.example.com
// API_ENDPOINT=${BASE_URL}/v1
```

### Accessing Environment Variables

```typescript
// Node.js
const port = process.env.PORT;
const apiUrl = process.env.API_URL;

// With defaults
const port = process.env.PORT || 3000;
const debug = process.env.DEBUG === 'true';

// Required environment variables
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const apiKey = requireEnv('API_KEY');
```

## Type-Safe Configuration

### Zod Schema Validation

```typescript
import { z } from 'zod';

// Define config schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
  DEBUG: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGINS: z
    .string()
    .transform((s) => s.split(','))
    .default('*'),
});

// Validate and export
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = validateEnv();

// Usage
console.log(env.PORT);        // number
console.log(env.DEBUG);       // boolean
console.log(env.CORS_ORIGINS); // string[]
```

### TypeScript Type Declarations

```typescript
// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    DATABASE_URL: string;
    API_KEY: string;
    DEBUG?: string;
  }
}

// Or extend @types/node
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      // ...other variables
    }
  }
}
```

## Frontend Environment Variables

### Vite Environment Variables

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      'process.env.API_URL': JSON.stringify(env.VITE_API_URL),
    },
  };
});

// .env
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My App

// Usage (must have VITE_ prefix)
console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.VITE_APP_TITLE);
console.log(import.meta.env.MODE); // development | production
console.log(import.meta.env.DEV);  // boolean
console.log(import.meta.env.PROD); // boolean
```

### Next.js Environment Variables

```typescript
// .env.local
# Server-side variables
DATABASE_URL=postgres://localhost:5432/db
API_SECRET=secret

# Client-side variables (must have NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ANALYTICS_ID=UA-123456

// Server-side access
export async function getServerSideProps() {
  const dbUrl = process.env.DATABASE_URL; // ✅
  const apiUrl = process.env.NEXT_PUBLIC_API_URL; // ✅
  return { props: {} };
}

// Client-side access
function Component() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL; // ✅
  const dbUrl = process.env.DATABASE_URL; // ❌ undefined
}
```

### Astro Environment Variables

```typescript
// .env
# Private variables (server only)
DATABASE_URL=postgres://localhost:5432/db

# Public variables (client accessible)
PUBLIC_API_URL=https://api.example.com

// astro.config.mjs
export default defineConfig({
  vite: {
    define: {
      'process.env.CUSTOM_VAR': JSON.stringify(process.env.CUSTOM_VAR),
    },
  },
});

// Usage
import.meta.env.PUBLIC_API_URL; // Client accessible
import.meta.env.DATABASE_URL;    // Server only
```

## Multi-Environment Configuration

### Configuration Manager

```typescript
// config/index.ts
interface Config {
  env: string;
  port: number;
  database: {
    url: string;
    poolSize: number;
  };
  redis: {
    url: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    enableNewFeature: boolean;
  };
}

const configs: Record<string, Partial<Config>> = {
  development: {
    database: {
      url: 'postgres://localhost:5432/dev',
      poolSize: 5,
    },
    features: {
      enableNewFeature: true,
    },
  },
  production: {
    database: {
      url: process.env.DATABASE_URL!,
      poolSize: 20,
    },
    features: {
      enableNewFeature: false,
    },
  },
  test: {
    database: {
      url: 'postgres://localhost:5432/test',
      poolSize: 1,
    },
  },
};

const defaultConfig: Config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  database: {
    url: '',
    poolSize: 10,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  api: {
    baseUrl: process.env.API_URL || 'http://localhost:8080',
    timeout: 30000,
  },
  features: {
    enableNewFeature: false,
  },
};

function getConfig(): Config {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = configs[env] || {};

  return deepMerge(defaultConfig, envConfig) as Config;
}

export const config = getConfig();
```

### Feature Flags

```typescript
// features.ts
interface FeatureFlags {
  newDashboard: boolean;
  darkMode: boolean;
  betaFeatures: boolean;
  maintenanceMode: boolean;
}

function loadFeatureFlags(): FeatureFlags {
  return {
    newDashboard: process.env.FEATURE_NEW_DASHBOARD === 'true',
    darkMode: process.env.FEATURE_DARK_MODE !== 'false', // Default enabled
    betaFeatures: process.env.FEATURE_BETA === 'true',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
  };
}

export const features = loadFeatureFlags();

// Usage
if (features.newDashboard) {
  // New feature code
}
```

## Security Best Practices

### .gitignore Configuration

```plaintext
# Environment files
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local

# Sensitive config
config/secrets.json
*.pem
*.key
```

### Environment Variable Validation

```typescript
// Validate all required env vars at startup
function validateRequiredEnvVars() {
  const required = [
    'DATABASE_URL',
    'API_KEY',
    'JWT_SECRET',
  ];

  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach((name) => console.error(`  - ${name}`));
    process.exit(1);
  }
}

// Call before app starts
validateRequiredEnvVars();
```

### Sensitive Information Handling

```typescript
// Don't log sensitive information
function logConfig(config: Config) {
  const safeConfig = {
    ...config,
    database: {
      ...config.database,
      url: maskConnectionString(config.database.url),
    },
    apiKey: '***',
  };

  console.log('Configuration:', safeConfig);
}

function maskConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return '***';
  }
}
```

## Best Practices Summary

```
Environment Configuration Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Security                                          │
│   ├── Never commit sensitive info to Git           │
│   ├── Use .env.example as template                 │
│   ├── Validate required vars at startup            │
│   └── Mask sensitive info in logs                  │
│                                                     │
│   Maintainability                                   │
│   ├── Use type-safe configuration                  │
│   ├── Provide sensible defaults                    │
│   ├── Document all config options                  │
│   └── Use layered config structure                 │
│                                                     │
│   Deployment                                        │
│   ├── Environment isolation                        │
│   ├── Use config services or secrets management   │
│   ├── Support hot-reload for config               │
│   └── Version control non-sensitive config        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommendation |
|----------|----------------|
| Local development | .env.local overrides |
| CI/CD | Environment variable injection |
| Production deployment | Secrets management service |
| Config validation | Zod Schema |

---

*Good configuration management ensures your app runs correctly in any environment.*
