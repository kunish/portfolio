---
title: 'Message Queue in Practice: Async Processing and System Decoupling'
description: 'Master RabbitMQ, Kafka core concepts, messaging patterns, reliable delivery and distributed transactions'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'message-queue-async-processing'
---

Message queues are the cornerstone of distributed systems, enabling service decoupling, async processing, and traffic smoothing. This article explores core concepts and practical applications of message queues.

## Why Message Queues

### Core Use Cases

```
Message Queue Use Cases:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Async Processing                                  │
│   ├── Email/SMS sending                            │
│   ├── Report generation                            │
│   └── Data synchronization                         │
│                                                     │
│   Service Decoupling                               │
│   ├── Order system → Inventory system              │
│   ├── User system → Notification system            │
│   └── Payment system → Points system               │
│                                                     │
│   Traffic Smoothing                                │
│   ├── Flash sales                                  │
│   ├── Batch data processing                        │
│   └── Log collection                               │
│                                                     │
│   Event-Driven                                     │
│   ├── Real-time data processing                   │
│   ├── Event Sourcing                              │
│   └── CQRS architecture                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Message Queue Comparison

| Feature | RabbitMQ | Kafka | Redis Streams |
|---------|----------|-------|---------------|
| Model | Push | Pull | Pull |
| Throughput | 10K/s | 1M/s | 100K/s |
| Latency | Microseconds | Milliseconds | Microseconds |
| Persistence | Optional | Required | Optional |
| Message replay | No | Yes | Yes |
| Use case | Business msgs | Logs/Streaming | Lightweight |

## RabbitMQ in Practice

### Core Concepts

```
RabbitMQ Architecture:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Producer → Exchange → Binding → Queue → Consumer │
│                                                     │
│   Exchange Types:                                   │
│   ├── Direct   → Exact routing key match           │
│   ├── Fanout   → Broadcast to all queues          │
│   ├── Topic    → Pattern matching routing key     │
│   └── Headers  → Header-based matching            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Connection and Basic Operations

```typescript
import amqp from 'amqplib';

class RabbitMQClient {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect(url: string): Promise<void> {
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    // Set prefetch to control consumption rate
    await this.channel.prefetch(10);

    // Connection error handling
    this.connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
      this.reconnect(url);
    });
  }

  private async reconnect(url: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 5000));
    await this.connect(url);
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
```

### Publish/Subscribe Pattern

```typescript
// Publisher
class Publisher {
  constructor(private channel: amqp.Channel) {}

  async publish(exchange: string, routingKey: string, message: object): Promise<void> {
    const content = Buffer.from(JSON.stringify(message));

    this.channel.publish(exchange, routingKey, content, {
      persistent: true,           // Message persistence
      contentType: 'application/json',
      timestamp: Date.now(),
      messageId: generateUUID(),
    });
  }
}

// Subscriber
class Subscriber {
  constructor(private channel: amqp.Channel) {}

  async subscribe(
    queue: string,
    handler: (msg: object) => Promise<void>
  ): Promise<void> {
    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        await handler(content);
        this.channel.ack(msg);  // Acknowledge message
      } catch (error) {
        console.error('Message processing failed:', error);
        // Reject and requeue
        this.channel.nack(msg, false, true);
      }
    });
  }
}
```

### Delayed Queue

```typescript
// Using Dead Letter Exchange for delayed queue
async function setupDelayedQueue(channel: amqp.Channel): Promise<void> {
  // Delayed exchange
  await channel.assertExchange('delayed.exchange', 'direct', { durable: true });

  // Delayed queue (forwards to process queue on expiration)
  await channel.assertQueue('delayed.queue', {
    durable: true,
    deadLetterExchange: 'process.exchange',
    deadLetterRoutingKey: 'process',
  });

  // Process exchange and queue
  await channel.assertExchange('process.exchange', 'direct', { durable: true });
  await channel.assertQueue('process.queue', { durable: true });

  await channel.bindQueue('delayed.queue', 'delayed.exchange', 'delayed');
  await channel.bindQueue('process.queue', 'process.exchange', 'process');
}

// Send delayed message
async function sendDelayedMessage(
  channel: amqp.Channel,
  message: object,
  delayMs: number
): Promise<void> {
  channel.publish('delayed.exchange', 'delayed', Buffer.from(JSON.stringify(message)), {
    persistent: true,
    expiration: String(delayMs),
  });
}
```

## Kafka in Practice

### Core Concepts

```
Kafka Architecture:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Topic                                             │
│   ├── Partition 0  [msg0, msg3, msg6, ...]         │
│   ├── Partition 1  [msg1, msg4, msg7, ...]         │
│   └── Partition 2  [msg2, msg5, msg8, ...]         │
│                                                     │
│   Consumer Group                                    │
│   ├── Consumer A  → Partition 0                    │
│   ├── Consumer B  → Partition 1                    │
│   └── Consumer C  → Partition 2                    │
│                                                     │
│   Key Concepts:                                     │
│   ├── Offset    → Message position in partition    │
│   ├── Replica   → Partition replicas for HA       │
│   └── Leader    → Replica handling reads/writes   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Producer

```typescript
import { Kafka, Producer, Partitioners } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['kafka1:9092', 'kafka2:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

class KafkaProducer {
  private producer: Producer;

  constructor() {
    this.producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: false,
    });
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async send(topic: string, messages: object[]): Promise<void> {
    await this.producer.send({
      topic,
      messages: messages.map(msg => ({
        key: msg.id?.toString(),
        value: JSON.stringify(msg),
        headers: {
          'content-type': 'application/json',
          timestamp: Date.now().toString(),
        },
      })),
    });
  }

  // Batch sending optimization
  async sendBatch(messages: { topic: string; data: object }[]): Promise<void> {
    const grouped = messages.reduce((acc, msg) => {
      if (!acc[msg.topic]) acc[msg.topic] = [];
      acc[msg.topic].push(msg.data);
      return acc;
    }, {} as Record<string, object[]>);

    await this.producer.sendBatch({
      topicMessages: Object.entries(grouped).map(([topic, data]) => ({
        topic,
        messages: data.map(d => ({ value: JSON.stringify(d) })),
      })),
    });
  }
}
```

### Consumer

```typescript
import { Consumer, EachMessagePayload } from 'kafkajs';

class KafkaConsumer {
  private consumer: Consumer;

  constructor(groupId: string) {
    this.consumer = kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
  }

  async subscribe(topics: string[]): Promise<void> {
    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }
  }

  async run(handler: (payload: EachMessagePayload) => Promise<void>): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload) => {
        const { topic, partition, message } = payload;

        try {
          await handler(payload);
        } catch (error) {
          console.error(`Error processing message from ${topic}:${partition}`, error);
          await this.sendToDeadLetterQueue(topic, message);
        }
      },
    });
  }

  private async sendToDeadLetterQueue(topic: string, message: any): Promise<void> {
    // Dead letter queue implementation
  }
}

// Usage example
const consumer = new KafkaConsumer('order-service');
await consumer.connect();
await consumer.subscribe(['orders', 'payments']);

await consumer.run(async ({ topic, message }) => {
  const data = JSON.parse(message.value?.toString() || '{}');
  console.log(`Received from ${topic}:`, data);
});
```

### Message Replay

```typescript
// Consume from specific offset
async function seekToOffset(consumer: Consumer, topic: string, partition: number, offset: string): Promise<void> {
  consumer.seek({
    topic,
    partition,
    offset,
  });
}

// Consume from specific timestamp
async function seekToTimestamp(admin: Admin, topic: string, timestamp: number): Promise<void> {
  const offsets = await admin.fetchTopicOffsetsByTimestamp(topic, timestamp);

  for (const { partition, offset } of offsets) {
    consumer.seek({ topic, partition, offset });
  }
}
```

## Message Reliability

### Producer Acknowledgment

```typescript
// RabbitMQ confirm mode
async function publishWithConfirm(channel: amqp.ConfirmChannel, message: object): Promise<void> {
  await channel.assertQueue('reliable.queue', { durable: true });

  return new Promise((resolve, reject) => {
    channel.sendToQueue(
      'reliable.queue',
      Buffer.from(JSON.stringify(message)),
      { persistent: true },
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// Kafka acks configuration
const producer = kafka.producer({
  acks: -1,  // Wait for all replicas
  idempotent: true,  // Idempotency guarantee
});
```

### Consumer Acknowledgment

```typescript
// Manual acknowledgment mode
class ReliableConsumer {
  async consume(channel: amqp.Channel, queue: string): Promise<void> {
    await channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        await this.processMessage(msg);
        channel.ack(msg);
      } catch (error) {
        if (this.shouldRetry(error)) {
          channel.nack(msg, false, true);
        } else {
          await this.sendToDeadLetter(msg);
          channel.ack(msg);
        }
      }
    }, { noAck: false });
  }

  private shouldRetry(error: Error): boolean {
    return error instanceof TemporaryError;
  }
}
```

### Idempotency

```typescript
// Message ID-based idempotency
class IdempotentProcessor {
  private redis: Redis;

  async process(messageId: string, handler: () => Promise<void>): Promise<void> {
    const key = `processed:${messageId}`;

    // Check if already processed
    const exists = await this.redis.exists(key);
    if (exists) {
      console.log(`Message ${messageId} already processed`);
      return;
    }

    // Set processing flag atomically
    const acquired = await this.redis.set(key, '1', 'EX', 86400, 'NX');
    if (!acquired) {
      return; // Another instance is processing
    }

    try {
      await handler();
    } catch (error) {
      await this.redis.del(key);
      throw error;
    }
  }
}
```

## Distributed Transactions

### Saga Pattern

```typescript
// Saga Orchestrator
class SagaOrchestrator {
  private steps: SagaStep[] = [];

  addStep(step: SagaStep): this {
    this.steps.push(step);
    return this;
  }

  async execute(data: any): Promise<void> {
    const completedSteps: SagaStep[] = [];

    try {
      for (const step of this.steps) {
        await step.execute(data);
        completedSteps.push(step);
      }
    } catch (error) {
      // Compensate in reverse order
      for (const step of completedSteps.reverse()) {
        try {
          await step.compensate(data);
        } catch (compensateError) {
          console.error('Compensation failed:', compensateError);
        }
      }
      throw error;
    }
  }
}

interface SagaStep {
  execute(data: any): Promise<void>;
  compensate(data: any): Promise<void>;
}

// Usage: Order creation Saga
const orderSaga = new SagaOrchestrator()
  .addStep({
    execute: async (data) => await createOrder(data),
    compensate: async (data) => await cancelOrder(data.orderId),
  })
  .addStep({
    execute: async (data) => await reserveInventory(data),
    compensate: async (data) => await releaseInventory(data),
  })
  .addStep({
    execute: async (data) => await processPayment(data),
    compensate: async (data) => await refundPayment(data),
  });
```

### Outbox Pattern

```typescript
// Using Outbox table for guaranteed delivery
class OutboxPattern {
  async executeWithOutbox(
    db: Database,
    businessLogic: () => Promise<void>,
    message: OutboxMessage
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. Execute business logic
      await businessLogic();

      // 2. Write to Outbox table
      await tx.outbox.create({
        data: {
          id: generateUUID(),
          topic: message.topic,
          payload: JSON.stringify(message.payload),
          status: 'PENDING',
          createdAt: new Date(),
        },
      });
    });
  }
}

// Outbox publisher (background task)
class OutboxPublisher {
  async publishPendingMessages(): Promise<void> {
    const messages = await db.outbox.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    for (const msg of messages) {
      try {
        await this.producer.send(msg.topic, JSON.parse(msg.payload));
        await db.outbox.update({
          where: { id: msg.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
      } catch (error) {
        await db.outbox.update({
          where: { id: msg.id },
          data: { retryCount: { increment: 1 } },
        });
      }
    }
  }
}
```

## Monitoring and Operations

```typescript
// Consumer lag monitoring
async function monitorConsumerLag(admin: Admin, groupId: string): Promise<void> {
  const offsets = await admin.fetchOffsets({ groupId, topics: ['orders'] });

  for (const { topic, partitions } of offsets) {
    for (const { partition, offset } of partitions) {
      const topicOffsets = await admin.fetchTopicOffsets(topic);
      const latestOffset = topicOffsets.find(t => t.partition === partition)?.high;

      const lag = Number(latestOffset) - Number(offset);
      console.log(`Topic ${topic} Partition ${partition}: lag = ${lag}`);

      if (lag > 10000) {
        alertOps(`High consumer lag detected: ${topic}:${partition} = ${lag}`);
      }
    }
  }
}
```

## Best Practices Summary

```
Message Queue Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Producer                                          │
│   ├── Use acknowledgment mechanism                 │
│   ├── Implement retry logic                        │
│   ├── Batch sending for performance               │
│   └── Set reasonable timeouts                      │
│                                                     │
│   Consumer                                          │
│   ├── Manual message acknowledgment               │
│   ├── Implement idempotent processing             │
│   ├── Set appropriate concurrency                 │
│   └── Proper error handling                        │
│                                                     │
│   Operations                                        │
│   ├── Monitor consumer lag                        │
│   ├── Set up dead letter queues                   │
│   ├── Clean up expired messages                   │
│   └── Capacity planning                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Solution |
|----------|---------------------|
| Business messages | RabbitMQ |
| Log collection | Kafka |
| Lightweight queue | Redis Streams |
| Delayed tasks | RabbitMQ DLX |
| Event sourcing | Kafka |

Message queues are key components for building reliable distributed systems. Understanding their principles and choosing the right solution is essential for maximum value.

---

*Messages are the bloodstream of systems, queues are the art of scheduling. Async processing makes systems more elegant.*
