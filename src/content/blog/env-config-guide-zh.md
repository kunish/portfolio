---
title: '环境变量与配置管理：构建可维护的应用'
description: '掌握环境变量、配置文件、secrets 管理和多环境部署最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'env-config-guide'
---

配置管理是构建可维护应用的基础。本文探讨环境变量和配置的最佳实践。

## 配置管理概述

### 配置层级

```
配置优先级（从高到低）：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   命令行参数                                        │
│   └── node app.js --port=3000                      │
│                                                     │
│   环境变量                                          │
│   └── PORT=3000 node app.js                        │
│                                                     │
│   .env 文件                                         │
│   └── .env.local > .env.production > .env          │
│                                                     │
│   配置文件                                          │
│   └── config.json / config.ts                      │
│                                                     │
│   默认值                                            │
│   └── 代码中的硬编码默认                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 配置类型 | 适用场景 |
|----------|----------|
| 环境变量 | 敏感信息、部署环境差异 |
| 配置文件 | 复杂配置、可版本控制 |
| 默认值 | 开发便利、合理默认 |

## 环境变量基础

### .env 文件

```bash
# .env - 基础配置
NODE_ENV=development
PORT=3000
API_URL=http://localhost:8080

# .env.development - 开发环境
DATABASE_URL=postgres://localhost:5432/dev
DEBUG=true

# .env.production - 生产环境
DATABASE_URL=postgres://prod-server:5432/prod
DEBUG=false

# .env.local - 本地覆盖（不提交到 Git）
API_KEY=my-secret-key
```

### dotenv 加载

```typescript
// 使用 dotenv
import dotenv from 'dotenv';

// 加载默认 .env
dotenv.config();

// 加载特定环境
dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});

// 多文件加载
import dotenvExpand from 'dotenv-expand';

const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

// 变量展开示例
// .env 文件：
// BASE_URL=https://api.example.com
// API_ENDPOINT=${BASE_URL}/v1
```

### 环境变量访问

```typescript
// Node.js
const port = process.env.PORT;
const apiUrl = process.env.API_URL;

// 带默认值
const port = process.env.PORT || 3000;
const debug = process.env.DEBUG === 'true';

// 必需的环境变量
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const apiKey = requireEnv('API_KEY');
```

## 类型安全配置

### Zod Schema 验证

```typescript
import { z } from 'zod';

// 定义配置 Schema
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

// 验证并导出
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

// 使用
console.log(env.PORT);        // number
console.log(env.DEBUG);       // boolean
console.log(env.CORS_ORIGINS); // string[]
```

### TypeScript 类型声明

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

// 或使用 @types/node 扩展
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      // ...其他变量
    }
  }
}
```

## 前端环境变量

### Vite 环境变量

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // 加载环境变量
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

// 使用（必须以 VITE_ 前缀）
console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.VITE_APP_TITLE);
console.log(import.meta.env.MODE); // development | production
console.log(import.meta.env.DEV);  // boolean
console.log(import.meta.env.PROD); // boolean
```

### Next.js 环境变量

```typescript
// .env.local
# 服务端变量
DATABASE_URL=postgres://localhost:5432/db
API_SECRET=secret

# 客户端变量（必须以 NEXT_PUBLIC_ 前缀）
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ANALYTICS_ID=UA-123456

// 服务端访问
export async function getServerSideProps() {
  const dbUrl = process.env.DATABASE_URL; // ✅
  const apiUrl = process.env.NEXT_PUBLIC_API_URL; // ✅
  return { props: {} };
}

// 客户端访问
function Component() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL; // ✅
  const dbUrl = process.env.DATABASE_URL; // ❌ undefined
}
```

### Astro 环境变量

```typescript
// .env
# 私有变量（仅服务端）
DATABASE_URL=postgres://localhost:5432/db

# 公开变量（客户端可用）
PUBLIC_API_URL=https://api.example.com

// astro.config.mjs
export default defineConfig({
  vite: {
    define: {
      'process.env.CUSTOM_VAR': JSON.stringify(process.env.CUSTOM_VAR),
    },
  },
});

// 使用
import.meta.env.PUBLIC_API_URL; // 客户端可用
import.meta.env.DATABASE_URL;    // 仅服务端
```

## 多环境配置

### 配置管理器

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

### 功能开关

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
    darkMode: process.env.FEATURE_DARK_MODE !== 'false', // 默认开启
    betaFeatures: process.env.FEATURE_BETA === 'true',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
  };
}

export const features = loadFeatureFlags();

// 使用
if (features.newDashboard) {
  // 新功能代码
}
```

## 安全最佳实践

### .gitignore 配置

```gitignore
# 环境变量文件
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local

# 敏感配置
config/secrets.json
*.pem
*.key
```

### 环境变量验证

```typescript
// 启动时验证所有必需的环境变量
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

// 在应用启动前调用
validateRequiredEnvVars();
```

### 敏感信息处理

```typescript
// 不要在日志中输出敏感信息
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

## 最佳实践总结

```
环境配置最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   安全                                              │
│   ├── 不提交敏感信息到 Git                          │
│   ├── 使用 .env.example 作为模板                   │
│   ├── 启动时验证必需变量                            │
│   └── 日志中屏蔽敏感信息                            │
│                                                     │
│   可维护性                                          │
│   ├── 使用类型安全的配置                            │
│   ├── 提供合理的默认值                              │
│   ├── 文档化所有配置项                              │
│   └── 使用分层配置结构                              │
│                                                     │
│   部署                                              │
│   ├── 环境隔离                                      │
│   ├── 使用配置服务或 secrets 管理                   │
│   ├── 支持热重载配置                                │
│   └── 版本控制非敏感配置                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 建议 |
|------|------|
| 本地开发 | .env.local 覆盖 |
| CI/CD | 环境变量注入 |
| 生产部署 | Secrets 管理服务 |
| 配置验证 | Zod Schema |

---

*好的配置管理让应用在任何环境都能正确运行。*
