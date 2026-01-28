---
title: 'Serverless Architecture: Building Modern Applications'
description: 'Master AWS Lambda, Vercel, Cloudflare Workers and serverless best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'serverless-architecture-guide'
---

Serverless lets developers focus on business logic. This article explores core concepts and practices.

## Serverless Overview

### What is Serverless

```
Serverless Core Features:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   No Server Management                              │
│   └── Infrastructure managed by cloud provider     │
│                                                     │
│   Pay Per Use                                       │
│   └── Only pay for actual resource usage           │
│                                                     │
│   Auto Scaling                                      │
│   └── Automatically adjust resources by load       │
│                                                     │
│   Event Driven                                      │
│   └── Execute in response to events               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Comparison | Traditional | Serverless |
|------------|-------------|------------|
| Operations | Required | Not needed |
| Scaling | Manual | Automatic |
| Billing | By time | By invocation |
| Cold Start | None | Exists |

## AWS Lambda

### Basic Function

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

// Handle POST requests
export const createUser: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    // Validate input
    if (!body.email || !body.name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Create user
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

### Serverless Framework Config

```yaml
# serverless.yml
service: my-api

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
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

  // Process request
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

// Configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
```

## Cloudflare Workers

### Basic Worker

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

    // Routing
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

### Hono Framework

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

// Middleware
app.use('*', cors());
app.use('/api/*', jwt({ secret: (c) => c.env.JWT_SECRET }));

// Routes
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

## Database Connections

### Serverless Databases

```typescript
// Prisma with Accelerate
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function getUsers() {
  return prisma.user.findMany({
    cacheStrategy: { ttl: 60 }, // Cache for 60 seconds
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

## Cold Start Optimization

```typescript
// 1. Reduce dependencies
// Use lightweight libraries
import { z } from 'zod'; // Instead of joi
import dayjs from 'dayjs'; // Instead of moment

// 2. Connection reuse
let dbConnection: Connection | null = null;

async function getConnection() {
  if (!dbConnection) {
    dbConnection = await createConnection();
  }
  return dbConnection;
}

// 3. Warmup function
export async function warmup() {
  // Preload resources
  await getConnection();
  return { statusCode: 200, body: 'Warmed up' };
}

// 4. Use Provisioned Concurrency (AWS)
// serverless.yml
functions:
  api:
    handler: handler.api
    provisionedConcurrency: 5
```

## Event-Driven Patterns

```typescript
// Handle S3 events
export const processUpload = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    // Process uploaded file
    const file = await s3.getObject({ Bucket: bucket, Key: key });
    await processFile(file);
  }
};

// Handle SQS messages
export const processMessage = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    await handleMessage(message);
  }
};

// Scheduled tasks
export const scheduledTask = async (event: ScheduledEvent) => {
  console.log('Running scheduled task:', event.time);
  await cleanupOldRecords();
  await sendDailyReport();
};
```

## Best Practices Summary

```
Serverless Best Practices:
┌─────────────────────────────────────────────────────┐
│   Performance                                       │
│   ├── Reduce dependency size                      │
│   ├── Reuse database connections                  │
│   ├── Use Edge Functions                          │
│   └── Configure warmup strategies                 │
│                                                     │
│   Architecture                                      │
│   ├── Single responsibility functions             │
│   ├── Stateless design                            │
│   ├── Event-driven decoupling                     │
│   └── Idempotent processing                       │
│                                                     │
│   Security                                          │
│   ├── Least privilege principle                   │
│   ├── Encrypt environment variables               │
│   ├── Input validation                            │
│   └── Rate limiting                               │
│                                                     │
│   Observability                                     │
│   ├── Structured logging                          │
│   ├── Distributed tracing                         │
│   ├── Metrics monitoring                          │
│   └── Alert configuration                         │
└─────────────────────────────────────────────────────┘
```

| Platform | Use Case |
|----------|----------|
| AWS Lambda | Enterprise, complex integrations |
| Vercel Functions | Next.js applications |
| Cloudflare Workers | Edge computing, low latency |
| Supabase Functions | With Supabase ecosystem |

---

*Serverless isn't a silver bullet, but it lets developers focus on creating value.*
