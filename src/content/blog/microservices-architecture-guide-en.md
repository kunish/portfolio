---
title: 'Microservices Architecture: From Monolith to Distributed Systems'
description: 'Master microservices core patterns, service decomposition strategies, and distributed system best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'microservices-architecture-guide'
---

Microservices architecture has become the mainstream approach for building large-scale distributed systems. This article explores the core concepts, design patterns, and practical experience with microservices.

## Architecture Evolution

### From Monolith to Microservices

```
Architecture Evolution Path:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Monolith                                          │
│   ├── All functionality in one application         │
│   ├── Simple deployment                            │
│   └── Difficult to maintain as scale grows         │
│              │                                      │
│              ▼                                      │
│   Modular Monolith                                  │
│   ├── Internal modularity                          │
│   ├── Clear boundaries                             │
│   └── Single deployment unit                       │
│              │                                      │
│              ▼                                      │
│   Microservices                                     │
│   ├── Independently deployable services            │
│   ├── Technology diversity                         │
│   └── Distributed complexity                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### When to Adopt Microservices

| Scenario | Monolith | Microservices |
|----------|----------|---------------|
| Team Size | < 10 people | > 10 people |
| Codebase Size | < 100K LOC | > 100K LOC |
| Deploy Frequency | Weekly/Monthly | Daily/Hourly |
| Scaling Needs | Scale everything | Scale as needed |
| Tech Stack | Unified | Diverse |

## Core Design Principles

### Single Responsibility

```
Service Responsibility Division:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ✅ Good Division                                   │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│   │  User   │  │  Order  │  │ Payment │            │
│   │ Service │  │ Service │  │ Service │            │
│   │         │  │         │  │         │            │
│   │ • Signup│  │ • Create│  │ • Process│           │
│   │ • Auth  │  │ • Query │  │ • Refund │           │
│   │ • Profile│ │ • Status│  │ • Reconcile│         │
│   └─────────┘  └─────────┘  └─────────┘            │
│                                                     │
│   ❌ Mixed Responsibilities                          │
│   ┌─────────────────────────────────────────┐      │
│   │         Business Service                  │      │
│   │  User + Order + Payment + Inventory...   │      │
│   └─────────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Domain-Driven Design (DDD)

```typescript
// Aggregate Root definition
interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: Money;
  createdAt: Date;

  // Domain behaviors
  addItem(product: Product, quantity: number): void;
  removeItem(itemId: string): void;
  confirm(): void;
  cancel(): void;
}

// Value Object
interface Money {
  amount: number;
  currency: string;
}

// Domain Event
interface OrderCreatedEvent {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: Money;
  occurredAt: Date;
}

// Repository Interface
interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
}
```

### Bounded Contexts

```
E-commerce Bounded Contexts:
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────────────┐   ┌──────────────────┐       │
│  │   Sales Context   │   │ Inventory Context│       │
│  │                  │   │                  │       │
│  │  Product         │   │  StockItem       │       │
│  │  • name          │   │  • sku           │       │
│  │  • price         │   │  • quantity      │       │
│  │  • description   │   │  • location      │       │
│  │                  │   │                  │       │
│  └──────────────────┘   └──────────────────┘       │
│           │                      │                  │
│           └──────────┬───────────┘                  │
│                      │                              │
│            ┌─────────▼─────────┐                   │
│            │ Anti-Corruption   │                   │
│            │    Layer (ACL)    │                   │
│            │ ProductId ↔ SKU   │                   │
│            └───────────────────┘                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Service Communication

### Synchronous Communication

```typescript
// REST API
// user-service/src/controllers/user.controller.ts
import express from 'express';

const router = express.Router();

router.get('/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

router.post('/users', async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).json(user);
});

// gRPC Service Definition
// proto/user.proto
syntax = "proto3";

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  string created_at = 4;
}

message GetUserRequest {
  string id = 1;
}
```

### Asynchronous Communication

```typescript
// Event Publisher
// order-service/src/events/publisher.ts
import { Kafka, Producer } from 'kafkajs';

class EventPublisher {
  private producer: Producer;

  constructor(kafka: Kafka) {
    this.producer = kafka.producer();
  }

  async publish(topic: string, event: DomainEvent): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          key: event.aggregateId,
          value: JSON.stringify(event),
          headers: {
            eventType: event.type,
            timestamp: event.occurredAt.toISOString(),
          },
        },
      ],
    });
  }
}

// Publish event after order creation
async function createOrder(data: CreateOrderDto): Promise<Order> {
  const order = Order.create(data);
  await orderRepository.save(order);

  await eventPublisher.publish('order-events', {
    type: 'OrderCreated',
    aggregateId: order.id,
    payload: {
      orderId: order.id,
      customerId: order.customerId,
      items: order.items,
      totalAmount: order.totalAmount,
    },
    occurredAt: new Date(),
  });

  return order;
}

// Event Consumer
// inventory-service/src/events/consumer.ts
import { Kafka, Consumer } from 'kafkajs';

class OrderEventConsumer {
  private consumer: Consumer;

  async start(): Promise<void> {
    await this.consumer.subscribe({ topic: 'order-events' });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(message.value!.toString());

        switch (event.type) {
          case 'OrderCreated':
            await this.handleOrderCreated(event.payload);
            break;
          case 'OrderCancelled':
            await this.handleOrderCancelled(event.payload);
            break;
        }
      },
    });
  }

  private async handleOrderCreated(payload: OrderCreatedPayload): Promise<void> {
    // Reserve inventory
    for (const item of payload.items) {
      await inventoryService.reserve(item.productId, item.quantity);
    }
  }
}
```

## Distributed Patterns

### API Gateway

```typescript
// gateway/src/index.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' },
});

app.use(limiter);

// JWT authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Service routing
app.use('/api/users', authMiddleware, createProxyMiddleware({
  target: process.env.USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
}));

app.use('/api/orders', authMiddleware, createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '' },
}));

app.use('/api/products', createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/products': '' },
}));
```

### Service Discovery

```yaml
# Kubernetes Service Discovery
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: production
spec:
  selector:
    app: user-service
  ports:
    - port: 80
      targetPort: 8080

---
# Application uses DNS name
# user-service.production.svc.cluster.local
```

```typescript
// Consul Service Registration
import Consul from 'consul';

const consul = new Consul({ host: 'consul.local' });

async function registerService(): Promise<void> {
  await consul.agent.service.register({
    name: 'user-service',
    id: `user-service-${process.env.HOSTNAME}`,
    address: process.env.POD_IP,
    port: 8080,
    check: {
      http: `http://${process.env.POD_IP}:8080/health`,
      interval: '10s',
    },
  });
}

async function discoverService(name: string): Promise<string[]> {
  const services = await consul.catalog.service.nodes(name);
  return services.map(s => `http://${s.ServiceAddress}:${s.ServicePort}`);
}
```

### Circuit Breaker Pattern

```typescript
// circuit-breaker.ts
import CircuitBreaker from 'opossum';

interface CircuitBreakerOptions {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
}

function createCircuitBreaker<T>(
  fn: (...args: any[]) => Promise<T>,
  options: CircuitBreakerOptions
): CircuitBreaker {
  const breaker = new CircuitBreaker(fn, {
    timeout: options.timeout,
    errorThresholdPercentage: options.errorThresholdPercentage,
    resetTimeout: options.resetTimeout,
  });

  breaker.on('open', () => {
    console.log('Circuit breaker opened');
  });

  breaker.on('halfOpen', () => {
    console.log('Circuit breaker half-open');
  });

  breaker.on('close', () => {
    console.log('Circuit breaker closed');
  });

  breaker.fallback(() => {
    return { error: 'Service temporarily unavailable' };
  });

  return breaker;
}

// Usage example
const userServiceBreaker = createCircuitBreaker(
  (userId: string) => fetch(`http://user-service/users/${userId}`).then(r => r.json()),
  {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  }
);

async function getUser(userId: string) {
  return userServiceBreaker.fire(userId);
}
```

### Saga Pattern

```typescript
// saga/order-saga.ts
interface SagaStep<T> {
  name: string;
  execute: (context: T) => Promise<void>;
  compensate: (context: T) => Promise<void>;
}

class OrderSaga {
  private steps: SagaStep<OrderContext>[] = [
    {
      name: 'reserveInventory',
      execute: async (ctx) => {
        ctx.inventoryReservationId = await inventoryService.reserve(
          ctx.items
        );
      },
      compensate: async (ctx) => {
        if (ctx.inventoryReservationId) {
          await inventoryService.cancelReservation(ctx.inventoryReservationId);
        }
      },
    },
    {
      name: 'processPayment',
      execute: async (ctx) => {
        ctx.paymentId = await paymentService.process({
          orderId: ctx.orderId,
          amount: ctx.totalAmount,
          customerId: ctx.customerId,
        });
      },
      compensate: async (ctx) => {
        if (ctx.paymentId) {
          await paymentService.refund(ctx.paymentId);
        }
      },
    },
    {
      name: 'createShipment',
      execute: async (ctx) => {
        ctx.shipmentId = await shippingService.createShipment({
          orderId: ctx.orderId,
          items: ctx.items,
          address: ctx.shippingAddress,
        });
      },
      compensate: async (ctx) => {
        if (ctx.shipmentId) {
          await shippingService.cancelShipment(ctx.shipmentId);
        }
      },
    },
  ];

  async execute(context: OrderContext): Promise<void> {
    const executedSteps: SagaStep<OrderContext>[] = [];

    try {
      for (const step of this.steps) {
        console.log(`Executing step: ${step.name}`);
        await step.execute(context);
        executedSteps.push(step);
      }
    } catch (error) {
      console.error('Saga failed, compensating...');

      // Compensate in reverse order
      for (const step of executedSteps.reverse()) {
        try {
          console.log(`Compensating step: ${step.name}`);
          await step.compensate(context);
        } catch (compensateError) {
          console.error(`Compensation failed for ${step.name}`, compensateError);
          // Log failure for manual intervention
        }
      }

      throw error;
    }
  }
}
```

## Data Management

### Database per Service

```
Database Isolation Strategy:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│   │   User   │  │  Order   │  │ Inventory│         │
│   │ Service  │  │ Service  │  │ Service  │         │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│        │             │             │                │
│   ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐         │
│   │PostgreSQL│  │ MongoDB  │  │  Redis   │         │
│   │  Users   │  │  Orders  │  │ Inventory│         │
│   └──────────┘  └──────────┘  └──────────┘         │
│                                                     │
│   Benefits:                                         │
│   • Technology diversity                           │
│   • Independent scaling                            │
│   • Fault isolation                                │
│                                                     │
│   Challenges:                                       │
│   • Cross-service queries                          │
│   • Data consistency                               │
│   • Distributed transactions                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### CQRS Pattern

```typescript
// Command side - Write model
interface CreateOrderCommand {
  customerId: string;
  items: { productId: string; quantity: number }[];
  shippingAddress: Address;
}

class OrderCommandHandler {
  async handle(command: CreateOrderCommand): Promise<string> {
    const order = Order.create(command);
    await this.orderRepository.save(order);

    // Publish event to update read model
    await this.eventBus.publish(new OrderCreatedEvent(order));

    return order.id;
  }
}

// Query side - Read model
interface OrderReadModel {
  id: string;
  customerName: string;
  customerEmail: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: string;
  createdAt: Date;
}

class OrderQueryHandler {
  // Uses optimized read model database (e.g., Elasticsearch)
  private readStore: ReadModelStore;

  async getOrderDetails(orderId: string): Promise<OrderReadModel> {
    return this.readStore.findById(orderId);
  }

  async getOrdersByCustomer(customerId: string): Promise<OrderReadModel[]> {
    return this.readStore.findByCustomerId(customerId);
  }
}

// Projector - Updates read model
class OrderProjection {
  @EventHandler(OrderCreatedEvent)
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    const customer = await this.customerService.getById(event.customerId);
    const products = await this.productService.getByIds(
      event.items.map(i => i.productId)
    );

    const readModel: OrderReadModel = {
      id: event.orderId,
      customerName: customer.name,
      customerEmail: customer.email,
      items: event.items.map(item => ({
        productName: products.find(p => p.id === item.productId)!.name,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: event.totalAmount,
      status: 'created',
      createdAt: event.occurredAt,
    };

    await this.readStore.save(readModel);
  }
}
```

### Event Sourcing

```typescript
// Event Store
interface Event {
  id: string;
  aggregateId: string;
  aggregateType: string;
  type: string;
  payload: Record<string, any>;
  version: number;
  occurredAt: Date;
}

class EventStore {
  async append(event: Event): Promise<void> {
    await this.db.collection('events').insertOne(event);
  }

  async getEvents(aggregateId: string): Promise<Event[]> {
    return this.db
      .collection('events')
      .find({ aggregateId })
      .sort({ version: 1 })
      .toArray();
  }
}

// Aggregate Reconstruction
class Order {
  private id: string;
  private status: OrderStatus;
  private items: OrderItem[] = [];

  static async fromEvents(events: Event[]): Promise<Order> {
    const order = new Order();

    for (const event of events) {
      order.apply(event);
    }

    return order;
  }

  private apply(event: Event): void {
    switch (event.type) {
      case 'OrderCreated':
        this.id = event.payload.orderId;
        this.status = 'created';
        break;
      case 'ItemAdded':
        this.items.push(event.payload.item);
        break;
      case 'OrderConfirmed':
        this.status = 'confirmed';
        break;
      case 'OrderShipped':
        this.status = 'shipped';
        break;
    }
  }
}
```

## Observability

### Distributed Tracing

```typescript
// OpenTelemetry Configuration
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://jaeger:4318/v1/traces',
  }),
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
});

sdk.start();

// Manual tracing
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

async function processOrder(orderId: string): Promise<void> {
  const span = tracer.startSpan('processOrder');
  span.setAttribute('orderId', orderId);

  try {
    await validateOrder(orderId);
    span.addEvent('Order validated');

    await reserveInventory(orderId);
    span.addEvent('Inventory reserved');

    await processPayment(orderId);
    span.addEvent('Payment processed');

    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    throw error;
  } finally {
    span.end();
  }
}
```

### Log Aggregation

```typescript
// Structured logging
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: 'order-service',
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
  },
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - startTime,
      traceId: req.headers['x-trace-id'],
      userId: req.user?.id,
    });
  });

  next();
};

// Business logging
logger.info({ orderId, customerId }, 'Order created');
logger.error({ orderId, error: err.message }, 'Order processing failed');
```

### Health Checks

```typescript
// Health check endpoints
import express from 'express';

const app = express();

// Liveness check
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
});

// Readiness check
app.get('/health/ready', async (req, res) => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkMessageQueue(),
    checkCache(),
  ]);

  const results = {
    database: checks[0].status === 'fulfilled' ? 'ok' : 'error',
    messageQueue: checks[1].status === 'fulfilled' ? 'ok' : 'error',
    cache: checks[2].status === 'fulfilled' ? 'ok' : 'error',
  };

  const healthy = Object.values(results).every(v => v === 'ok');

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    checks: results,
  });
});

async function checkDatabase(): Promise<void> {
  await db.query('SELECT 1');
}

async function checkMessageQueue(): Promise<void> {
  await kafka.admin().describeCluster();
}

async function checkCache(): Promise<void> {
  await redis.ping();
}
```

## Security Design

### Inter-Service Authentication

```typescript
// mTLS Configuration
import https from 'https';
import fs from 'fs';

const server = https.createServer({
  key: fs.readFileSync('/certs/server.key'),
  cert: fs.readFileSync('/certs/server.crt'),
  ca: fs.readFileSync('/certs/ca.crt'),
  requestCert: true,
  rejectUnauthorized: true,
}, app);

// JWT inter-service authentication
class ServiceAuthMiddleware {
  verify(req, res, next) {
    const token = req.headers['x-service-token'];

    try {
      const decoded = jwt.verify(token, process.env.SERVICE_SECRET);
      if (!decoded.service) {
        throw new Error('Invalid service token');
      }
      req.callingService = decoded.service;
      next();
    } catch {
      res.status(401).json({ error: 'Unauthorized service' });
    }
  }
}
```

## Best Practices Summary

```
Microservices Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Design Principles                                 │
│   ├── Decompose by business capability            │
│   ├── Keep services autonomous                     │
│   ├── Use API-first design                        │
│   └── Practice Domain-Driven Design               │
│                                                     │
│   Communication Patterns                            │
│   ├── Prefer asynchronous communication           │
│   ├── Use event-driven architecture               │
│   ├── Implement idempotency                       │
│   └── Design for fault tolerance                  │
│                                                     │
│   Data Management                                   │
│   ├── Database per service                        │
│   ├── Eventual consistency                        │
│   ├── Use Saga for distributed transactions       │
│   └── Consider CQRS and Event Sourcing           │
│                                                     │
│   Operations                                        │
│   ├── Comprehensive observability                 │
│   ├── Automated CI/CD                             │
│   ├── Containerized deployment                    │
│   └── Practice chaos engineering                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Pattern | Use Case |
|---------|----------|
| API Gateway | Unified entry, auth, rate limiting |
| Service Discovery | Dynamic service registration |
| Circuit Breaker | Fault isolation, graceful degradation |
| Saga | Distributed transaction coordination |
| CQRS | Read/write separation, performance optimization |
| Event Sourcing | Audit trail, state reconstruction |

Microservices architecture brings flexibility but also introduces complexity. Start with a modular monolith and split into microservices only when truly needed.

---

*Microservices are not the goal—they're a means to an end. The key is solving business problems, not pursuing technical complexity.*
