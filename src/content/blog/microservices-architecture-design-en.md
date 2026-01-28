---
title: 'Microservices Architecture Design and Practices: From Monolith to Distributed'
description: 'Master microservices decomposition strategies, service communication, data consistency and operational governance'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'microservices-architecture-design'
---

Microservices architecture has become the mainstream choice for building large distributed systems. This article explores design principles and practical experience with microservices.

## Monolith vs Microservices

### Architecture Comparison

```
Monolith vs Microservices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Monolithic Architecture                           │
│   ┌─────────────────────────────────┐              │
│   │        Single Application       │              │
│   │  ┌─────┐ ┌─────┐ ┌─────┐       │              │
│   │  │User │ │Order│ │Pay  │       │              │
│   │  └─────┘ └─────┘ └─────┘       │              │
│   │        Shared Database          │              │
│   └─────────────────────────────────┘              │
│                                                     │
│   Microservices Architecture                        │
│   ┌──────┐  ┌──────┐  ┌──────┐                    │
│   │User  │  │Order │  │Pay   │                    │
│   │Svc   │  │Svc   │  │Svc   │                    │
│   └──┬───┘  └──┬───┘  └──┬───┘                    │
│      │         │         │                         │
│   ┌──┴───┐  ┌──┴───┐  ┌──┴───┐                    │
│   │ DB1  │  │ DB2  │  │ DB3  │                    │
│   └──────┘  └──────┘  └──────┘                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Feature | Monolith | Microservices |
|---------|----------|---------------|
| Dev Complexity | Low | High |
| Deployment | All-at-once | Independent |
| Scaling | Scale entire app | Scale per service |
| Tech Stack | Unified | Heterogeneous |
| Team Collaboration | Tightly coupled | Loosely coupled |

## Service Decomposition Strategies

### Domain-Driven Design (DDD)

```
Domain-Driven Decomposition:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   E-commerce Bounded Contexts                       │
│                                                     │
│   ┌─────────────┐     ┌─────────────┐              │
│   │User Context │     │Product Ctx  │              │
│   │  ├─User     │     │  ├─Product  │              │
│   │  ├─Auth     │     │  ├─Category │              │
│   │  └─Perms    │     │  └─Inventory│              │
│   └─────────────┘     └─────────────┘              │
│                                                     │
│   ┌─────────────┐     ┌─────────────┐              │
│   │Order Context│     │Payment Ctx  │              │
│   │  ├─Cart     │     │  ├─Payment  │              │
│   │  ├─Order    │     │  ├─Refund   │              │
│   │  └─Shipping │     │  └─Billing  │              │
│   └─────────────┘     └─────────────┘              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Decomposition Principles

```typescript
// Service boundary definition
interface ServiceBoundary {
  // Single responsibility: each service does one thing
  responsibility: string;

  // High cohesion: related functions in same service
  cohesion: 'high' | 'medium' | 'low';

  // Loose coupling: minimize inter-service dependencies
  coupling: 'loose' | 'tight';

  // Data ownership: each service owns its data
  dataOwnership: boolean;

  // Team boundary: matches org structure
  teamOwnership: string;
}

// Decomposition decisions
const splitDecision = {
  // By business capability
  byBusinessCapability: [
    'user-service',      // User management
    'product-service',   // Product management
    'order-service',     // Order processing
    'payment-service',   // Payment processing
    'notification-service', // Notifications
  ],

  // By subdomain
  bySubdomain: {
    core: ['order', 'payment'],      // Core subdomain
    supporting: ['user', 'product'], // Supporting subdomain
    generic: ['notification', 'auth'], // Generic subdomain
  },
};
```

## Service Communication

### Synchronous Communication (REST/gRPC)

```typescript
// REST API Gateway
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Route to different services
app.use('/api/users', createProxyMiddleware({
  target: 'http://user-service:3001',
  pathRewrite: { '^/api/users': '' },
}));

app.use('/api/orders', createProxyMiddleware({
  target: 'http://order-service:3002',
  pathRewrite: { '^/api/orders': '' },
}));

app.use('/api/products', createProxyMiddleware({
  target: 'http://product-service:3003',
  pathRewrite: { '^/api/products': '' },
}));

// gRPC Service Definition
// order.proto
syntax = "proto3";

service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (Order);
  rpc GetOrder(GetOrderRequest) returns (Order);
  rpc ListOrders(ListOrdersRequest) returns (stream Order);
}

message Order {
  string id = 1;
  string user_id = 2;
  repeated OrderItem items = 3;
  OrderStatus status = 4;
  double total_amount = 5;
}
```

### Asynchronous Communication (Message Queue)

```typescript
// Event Publishing
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['kafka:9092'],
});

const producer = kafka.producer();

async function publishOrderCreated(order: Order) {
  await producer.send({
    topic: 'order.created',
    messages: [{
      key: order.id,
      value: JSON.stringify({
        eventType: 'ORDER_CREATED',
        timestamp: new Date().toISOString(),
        data: order,
      }),
    }],
  });
}

// Event Consumption
const consumer = kafka.consumer({ groupId: 'payment-service' });

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order.created' });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());

      if (event.eventType === 'ORDER_CREATED') {
        await processPayment(event.data);
      }
    },
  });
}
```

### Service Discovery

```typescript
// Consul Service Registration
import Consul from 'consul';

const consul = new Consul({ host: 'consul', port: 8500 });

// Register service
async function registerService() {
  await consul.agent.service.register({
    id: `order-service-${process.env.HOSTNAME}`,
    name: 'order-service',
    address: process.env.HOST,
    port: parseInt(process.env.PORT),
    check: {
      http: `http://${process.env.HOST}:${process.env.PORT}/health`,
      interval: '10s',
      timeout: '5s',
    },
  });
}

// Discover service
async function discoverService(serviceName: string) {
  const result = await consul.health.service({
    service: serviceName,
    passing: true,
  });

  const instances = result.map(entry => ({
    address: entry.Service.Address,
    port: entry.Service.Port,
  }));

  // Load balance instance selection
  return instances[Math.floor(Math.random() * instances.length)];
}
```

## Data Consistency

### Saga Pattern

```typescript
// Saga Coordinator
class OrderSaga {
  private steps: SagaStep[] = [];

  constructor() {
    this.steps = [
      {
        name: 'reserveInventory',
        execute: this.reserveInventory,
        compensate: this.releaseInventory,
      },
      {
        name: 'processPayment',
        execute: this.processPayment,
        compensate: this.refundPayment,
      },
      {
        name: 'createShipment',
        execute: this.createShipment,
        compensate: this.cancelShipment,
      },
    ];
  }

  async execute(order: Order): Promise<SagaResult> {
    const executedSteps: SagaStep[] = [];

    try {
      for (const step of this.steps) {
        console.log(`Executing step: ${step.name}`);
        await step.execute(order);
        executedSteps.push(step);
      }

      return { success: true };
    } catch (error) {
      // Compensate executed steps
      console.log('Saga failed, compensating...');
      for (const step of executedSteps.reverse()) {
        try {
          await step.compensate(order);
        } catch (compensateError) {
          console.error(`Compensation failed for ${step.name}`);
        }
      }

      return { success: false, error: error.message };
    }
  }

  private async reserveInventory(order: Order): Promise<void> {
    const response = await fetch('http://inventory-service/reserve', {
      method: 'POST',
      body: JSON.stringify({ orderId: order.id, items: order.items }),
    });
    if (!response.ok) throw new Error('Inventory reservation failed');
  }

  private async releaseInventory(order: Order): Promise<void> {
    await fetch('http://inventory-service/release', {
      method: 'POST',
      body: JSON.stringify({ orderId: order.id }),
    });
  }

  private async processPayment(order: Order): Promise<void> {
    const response = await fetch('http://payment-service/charge', {
      method: 'POST',
      body: JSON.stringify({ orderId: order.id, amount: order.total }),
    });
    if (!response.ok) throw new Error('Payment processing failed');
  }

  private async refundPayment(order: Order): Promise<void> {
    await fetch('http://payment-service/refund', {
      method: 'POST',
      body: JSON.stringify({ orderId: order.id }),
    });
  }
}
```

### Event Sourcing

```typescript
// Event Store
interface DomainEvent {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  data: any;
  version: number;
  timestamp: Date;
}

class EventStore {
  async append(event: DomainEvent): Promise<void> {
    await this.db.insert('events', event);
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    return this.db.query(
      'SELECT * FROM events WHERE aggregate_id = ? ORDER BY version',
      [aggregateId]
    );
  }
}

// Aggregate Reconstruction
class OrderAggregate {
  private state: Order;
  private version: number = 0;

  static async load(eventStore: EventStore, orderId: string): Promise<OrderAggregate> {
    const aggregate = new OrderAggregate();
    const events = await eventStore.getEvents(orderId);

    for (const event of events) {
      aggregate.apply(event);
    }

    return aggregate;
  }

  private apply(event: DomainEvent): void {
    switch (event.eventType) {
      case 'OrderCreated':
        this.state = {
          id: event.aggregateId,
          status: 'PENDING',
          items: event.data.items,
        };
        break;
      case 'OrderPaid':
        this.state.status = 'PAID';
        break;
      case 'OrderShipped':
        this.state.status = 'SHIPPED';
        this.state.trackingNumber = event.data.trackingNumber;
        break;
    }
    this.version = event.version;
  }
}
```

## Service Governance

### Circuit Breaker

```typescript
import CircuitBreaker from 'opossum';

const options = {
  timeout: 3000,           // Timeout duration
  errorThresholdPercentage: 50,  // Error rate threshold
  resetTimeout: 30000,     // Reset timeout
};

const breaker = new CircuitBreaker(callExternalService, options);

// Listen to events
breaker.on('success', (result) => {
  console.log('Call succeeded');
});

breaker.on('timeout', () => {
  console.log('Call timed out');
});

breaker.on('reject', () => {
  console.log('Call rejected (circuit open)');
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

// Fallback handling
breaker.fallback(() => {
  return { cached: true, data: getCachedData() };
});

// Use circuit breaker
async function getProductDetails(productId: string) {
  return breaker.fire(productId);
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: 'redis://redis:6379' });

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Maximum requests
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  message: { error: 'Too many requests' },
});

// API-level rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${req.user?.id}:${req.path}`,
  message: { error: 'API rate limit exceeded' },
});

app.use(globalLimiter);
app.use('/api/orders', apiLimiter);
```

### Distributed Tracing

```typescript
import { trace, context, SpanKind } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

// HTTP request tracing
async function callService(url: string, data: any) {
  return tracer.startActiveSpan('http-call', {
    kind: SpanKind.CLIENT,
    attributes: {
      'http.url': url,
      'http.method': 'POST',
    },
  }, async (span) => {
    try {
      // Inject trace context into request headers
      const headers = {};
      propagation.inject(context.active(), headers);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      span.setAttribute('http.status_code', response.status);
      return response.json();
    } catch (error) {
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Best Practices Summary

```
Microservices Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Design Principles                                 │
│   ├── Single responsibility principle             │
│   ├── Service autonomy                            │
│   ├── Decentralized data management               │
│   └── Design for failure                          │
│                                                     │
│   Communication Strategy                            │
│   ├── Sync for queries                            │
│   ├── Async for commands                          │
│   ├── Event-driven decoupling                     │
│   └── API versioning                              │
│                                                     │
│   Operational Governance                            │
│   ├── Centralized logging and monitoring          │
│   ├── Distributed tracing                         │
│   ├── Circuit breakers and rate limiting         │
│   └── Canary deployments                          │
│                                                     │
│   Team Collaboration                                │
│   ├── Clear service ownership                     │
│   ├── API contract first                          │
│   ├── Documentation as code                       │
│   └── Automated testing                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach |
|----------|---------------------|
| Service Communication | gRPC (internal) + REST (external) |
| Event Bus | Kafka / RabbitMQ |
| Service Discovery | Consul / Kubernetes |
| Config Center | Consul / etcd |
| API Gateway | Kong / Envoy |

Microservices are not a silver bullet, but they're an effective architectural choice for complex systems. Understand the complexity, weigh the trade-offs, and make appropriate decisions.

---

*Divide and conquer is the antidote to software complexity. Microservices take this principle to the extreme.*
