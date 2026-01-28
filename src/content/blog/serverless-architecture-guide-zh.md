---
title: 'Serverless 架构：无服务器应用开发指南'
description: '掌握 AWS Lambda、Vercel、Cloudflare Workers 等无服务器平台的最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'serverless-architecture-guide'
---

Serverless 让开发者专注于业务逻辑。本文探讨无服务器架构的核心概念和实践。

## Serverless 概述

### 什么是 Serverless

```
Serverless 核心特点：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   无需管理服务器                                    │
│   └── 基础设施由云服务商管理                        │
│                                                     │
│   按需付费                                          │
│   └── 仅为实际使用的资源付费                        │
│                                                     │
│   自动扩缩容                                        │
│   └── 根据负载自动调整资源                          │
│                                                     │
│   事件驱动                                          │
│   └── 响应事件触发执行                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 对比 | 传统服务器 | Serverless |
|------|-----------|------------|
| 运维 | 需要管理 | 无需管理 |
| 扩展 | 手动配置 | 自动扩缩 |
| 计费 | 按时间 | 按调用 |
| 冷启动 | 无 | 存在 |

## AWS Lambda

### 基础函数

```typescript
// handler.ts
import { APIGatewayProxyHandler } from 'aws-lambda';

export const hello: APIGatewayProxyHandler = async (event) => {
  const name = event.queryStringParameters?.name || 'World';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
    }),
  };
};

// 处理 POST 请求
export const createUser: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    // 验证输入
    if (!body.email || !body.name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // 创建用户
    const user = await db.user.create({ data: body });

    return {
      statusCode: 201,
      body: JSON.stringify(user),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

### Serverless Framework 配置

```yaml
# serverless.yml
service: my-api

provider:
  name: aws
  runtime: nodejs20.x
  region: ap-northeast-1
  memorySize: 256
  timeout: 10
  environment:
    DATABASE_URL: ${ssm:/my-app/database-url}
    JWT_SECRET: ${ssm:/my-app/jwt-secret}

functions:
  hello:
    handler: handler.hello
    events:
      - http:
          path: /hello
          method: get
          cors: true

  createUser:
    handler: handler.createUser
    events:
      - http:
          path: /users
          method: post
          cors: true

  processQueue:
    handler: handler.processQueue
    events:
      - sqs:
          arn: !GetAtt MyQueue.Arn
          batchSize: 10

resources:
  Resources:
    MyQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: my-queue
```

## Vercel Functions

### Edge Functions

```typescript
// app/api/hello/route.ts (Next.js App Router)
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'World';

  return NextResponse.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  // 处理请求
  const result = await processData(body);

  return NextResponse.json(result, { status: 201 });
}
```

### API Routes

```typescript
// pages/api/users.ts (Pages Router)
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      const users = await db.user.findMany();
      return res.json(users);

    case 'POST':
      const user = await db.user.create({ data: req.body });
      return res.status(201).json(user);

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// 配置
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
```

## Cloudflare Workers

### 基础 Worker

```typescript
// src/index.ts
export interface Env {
  DATABASE: D1Database;
  KV: KVNamespace;
  BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 路由
    if (url.pathname === '/api/hello') {
      return handleHello(request);
    }

    if (url.pathname.startsWith('/api/users')) {
      return handleUsers(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleHello(request: Request): Promise<Response> {
  return new Response(
    JSON.stringify({ message: 'Hello from Cloudflare Workers!' }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

async function handleUsers(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const users = await env.DATABASE.prepare('SELECT * FROM users').all();
    return Response.json(users.results);
  }

  if (request.method === 'POST') {
    const body = await request.json();
    await env.DATABASE.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
      .bind(body.name, body.email)
      .run();
    return Response.json({ success: true }, { status: 201 });
  }

  return new Response('Method not allowed', { status: 405 });
}
```

### Hono 框架

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

type Bindings = {
  DATABASE: D1Database;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// 中间件
app.use('*', cors());
app.use('/api/*', jwt({ secret: (c) => c.env.JWT_SECRET }));

// 路由
app.get('/api/users', async (c) => {
  const db = c.env.DATABASE;
  const users = await db.prepare('SELECT * FROM users').all();
  return c.json(users.results);
});

app.post('/api/users', async (c) => {
  const db = c.env.DATABASE;
  const body = await c.req.json();

  await db.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
    .bind(body.name, body.email)
    .run();

  return c.json({ success: true }, 201);
});

app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.env.DATABASE;

  const user = await db.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user);
});

export default app;
```

## 数据库连接

### Serverless 数据库

```typescript
// Prisma with Accelerate
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function getUsers() {
  return prisma.user.findMany({
    cacheStrategy: { ttl: 60 }, // 缓存 60 秒
  });
}

// Neon Serverless
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function getUsers() {
  return sql`SELECT * FROM users`;
}

// PlanetScale
import { connect } from '@planetscale/database';

const conn = connect({
  url: process.env.DATABASE_URL,
});

export async function getUsers() {
  const results = await conn.execute('SELECT * FROM users');
  return results.rows;
}
```

## 冷启动优化

```typescript
// 1. 减少依赖
// 使用轻量级库
import { z } from 'zod'; // 替代 joi
import dayjs from 'dayjs'; // 替代 moment

// 2. 连接复用
let dbConnection: Connection | null = null;

async function getConnection() {
  if (!dbConnection) {
    dbConnection = await createConnection();
  }
  return dbConnection;
}

// 3. 预热函数
export async function warmup() {
  // 预加载资源
  await getConnection();
  return { statusCode: 200, body: 'Warmed up' };
}

// 4. 使用 Provisioned Concurrency (AWS)
// serverless.yml
functions:
  api:
    handler: handler.api
    provisionedConcurrency: 5
```

## 事件驱动模式

```typescript
// 处理 S3 事件
export const processUpload = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    // 处理上传的文件
    const file = await s3.getObject({ Bucket: bucket, Key: key });
    await processFile(file);
  }
};

// 处理 SQS 消息
export const processMessage = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    await handleMessage(message);
  }
};

// 定时任务
export const scheduledTask = async (event: ScheduledEvent) => {
  console.log('Running scheduled task:', event.time);
  await cleanupOldRecords();
  await sendDailyReport();
};
```

## 最佳实践总结

```
Serverless 最佳实践：
┌─────────────────────────────────────────────────────┐
│   性能优化                                          │
│   ├── 减少依赖包大小                                │
│   ├── 复用数据库连接                                │
│   ├── 使用 Edge Functions                          │
│   └── 配置预热策略                                  │
│                                                     │
│   架构设计                                          │
│   ├── 函数单一职责                                  │
│   ├── 无状态设计                                    │
│   ├── 事件驱动解耦                                  │
│   └── 幂等性处理                                    │
│                                                     │
│   安全性                                            │
│   ├── 最小权限原则                                  │
│   ├── 环境变量加密                                  │
│   ├── 输入验证                                      │
│   └── 速率限制                                      │
│                                                     │
│   可观测性                                          │
│   ├── 结构化日志                                    │
│   ├── 分布式追踪                                    │
│   ├── 指标监控                                      │
│   └── 告警配置                                      │
└─────────────────────────────────────────────────────┘
```

| 平台 | 适用场景 |
|------|----------|
| AWS Lambda | 企业级、复杂集成 |
| Vercel Functions | Next.js 应用 |
| Cloudflare Workers | 边缘计算、低延迟 |
| Supabase Functions | 配合 Supabase 生态 |

---

*Serverless 不是银弹，但它让开发者更专注于创造价值。*
