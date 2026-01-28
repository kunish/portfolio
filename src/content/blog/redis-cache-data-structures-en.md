---
title: 'Redis Practical Guide: Caching Strategies and Data Structures'
description: 'Master Redis core data structures, caching patterns, and high availability architecture'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'redis-cache-data-structures'
---

Redis is the most popular in-memory database, widely used for caching, session storage, message queues, and more. This article explores Redis core features and practical applications.

## Why Choose Redis?

### In-Memory Database Comparison

```
In-Memory Database Ecosystem:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Redis                                             │
│   ├── Rich data structures                         │
│   ├── Persistence support                          │
│   ├── Clustering and high availability            │
│   └── Active community ecosystem                   │
│                                                     │
│   Other Options:                                   │
│   ├── Memcached    → Simple KV, multi-threaded    │
│   ├── KeyDB        → Redis compatible, MT         │
│   ├── Dragonfly    → Redis compatible, high perf  │
│   └── Valkey       → Redis open source fork       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Feature | Redis | Memcached |
|---------|-------|-----------|
| Data Structures | Multiple | String only |
| Persistence | RDB/AOF | None |
| Clustering | Native | Client sharding |
| Pub/Sub | Supported | Not supported |
| Scripting | Lua | Not supported |

## Core Data Structures

### String

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

// Basic operations
await redis.set('user:1:name', 'Alice');
const name = await redis.get('user:1:name');

// With expiration
await redis.setex('session:abc123', 3600, JSON.stringify({ userId: 1 }));

// Atomic operations
await redis.set('counter', 0);
await redis.incr('counter');      // 1
await redis.incrby('counter', 5); // 6
await redis.decr('counter');      // 5

// Conditional set
await redis.setnx('lock:resource', '1'); // Set only if not exists
await redis.set('key', 'value', 'EX', 60, 'NX'); // NX with expiration

// Batch operations
await redis.mset('key1', 'value1', 'key2', 'value2');
const [v1, v2] = await redis.mget('key1', 'key2');
```

### Hash

```typescript
// User information storage
await redis.hset('user:1', {
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
});

// Get single field
const email = await redis.hget('user:1', 'email');

// Get all fields
const user = await redis.hgetall('user:1');
// { name: 'Alice', email: 'alice@example.com', age: '30' }

// Increment
await redis.hincrby('user:1', 'age', 1);

// Batch operations
await redis.hmset('product:100', {
  name: 'iPhone 15',
  price: 999,
  stock: 100,
});
const [productName, price] = await redis.hmget('product:100', 'name', 'price');

// Check field exists
const exists = await redis.hexists('user:1', 'email');

// Get all keys or values
const fields = await redis.hkeys('user:1');
const values = await redis.hvals('user:1');
```

### List

```typescript
// Message queue
await redis.lpush('queue:tasks', 'task1', 'task2', 'task3');

// Blocking pop
const [queue, task] = await redis.brpop('queue:tasks', 30);

// Range query
const tasks = await redis.lrange('queue:tasks', 0, -1);

// Recent view history
async function addRecentView(userId: string, productId: string) {
  const key = `user:${userId}:recent`;
  await redis.lpush(key, productId);
  await redis.ltrim(key, 0, 9); // Keep only recent 10
}

// Simple rate limiter
async function isRateLimited(userId: string, limit: number, window: number): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const windowStart = now - window * 1000;

  // Clean expired records
  await redis.zremrangebyscore(key, 0, windowStart);

  // Get current count
  const count = await redis.zcard(key);

  if (count >= limit) {
    return true;
  }

  // Add new request
  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.expire(key, window);

  return false;
}
```

### Set

```typescript
// User tags
await redis.sadd('user:1:tags', 'vip', 'active', 'premium');
await redis.sadd('user:2:tags', 'active', 'new');

// Check member
const isVip = await redis.sismember('user:1:tags', 'vip');

// Get all members
const tags = await redis.smembers('user:1:tags');

// Set operations
// Intersection: common tags
const common = await redis.sinter('user:1:tags', 'user:2:tags');

// Union: all tags
const all = await redis.sunion('user:1:tags', 'user:2:tags');

// Difference: unique to user 1
const unique = await redis.sdiff('user:1:tags', 'user:2:tags');

// Random members
const random = await redis.srandmember('user:1:tags', 2);

// Pop random member
const popped = await redis.spop('user:1:tags');
```

### Sorted Set

```typescript
// Leaderboard
await redis.zadd('leaderboard:game1',
  1000, 'player1',
  2500, 'player2',
  1800, 'player3'
);

// Update score
await redis.zincrby('leaderboard:game1', 100, 'player1');

// Get rankings (high to low)
const topPlayers = await redis.zrevrange('leaderboard:game1', 0, 9, 'WITHSCORES');

// Get specific player rank
const rank = await redis.zrevrank('leaderboard:game1', 'player1');

// Get members in score range
const midRange = await redis.zrangebyscore('leaderboard:game1', 1000, 2000);

// Get member count
const count = await redis.zcard('leaderboard:game1');

// Remove members by rank range
await redis.zremrangebyrank('leaderboard:game1', 0, -11); // Keep top 10

// Delayed task queue
async function scheduleTask(taskId: string, executeAt: number, payload: string) {
  await redis.zadd('delayed:tasks', executeAt, JSON.stringify({ taskId, payload }));
}

async function processDelayedTasks() {
  const now = Date.now();
  const tasks = await redis.zrangebyscore('delayed:tasks', 0, now);

  for (const taskData of tasks) {
    const task = JSON.parse(taskData);
    await processTask(task);
    await redis.zrem('delayed:tasks', taskData);
  }
}
```

### HyperLogLog

```typescript
// Unique visitor counting (approximate)
await redis.pfadd('uv:2024-01-28', 'user1', 'user2', 'user3');
await redis.pfadd('uv:2024-01-28', 'user1', 'user4'); // user1 already exists

const uniqueVisitors = await redis.pfcount('uv:2024-01-28'); // ≈ 4

// Merge multi-day stats
await redis.pfmerge('uv:week1', 'uv:2024-01-22', 'uv:2024-01-23', 'uv:2024-01-24');
const weeklyUV = await redis.pfcount('uv:week1');
```

### Bitmap

```typescript
// User check-in
async function checkIn(userId: number, day: number) {
  const key = `checkin:2024-01:${userId}`;
  await redis.setbit(key, day, 1);
}

// Check if checked in
async function isCheckedIn(userId: number, day: number): Promise<boolean> {
  const key = `checkin:2024-01:${userId}`;
  return (await redis.getbit(key, day)) === 1;
}

// Count check-in days
async function getCheckInCount(userId: number): Promise<number> {
  const key = `checkin:2024-01:${userId}`;
  return redis.bitcount(key);
}

// User activity stats
await redis.setbit('active:2024-01-28', 1001, 1);
await redis.setbit('active:2024-01-28', 1002, 1);
await redis.setbit('active:2024-01-29', 1001, 1);

// Users active both days
await redis.bitop('AND', 'active:both', 'active:2024-01-28', 'active:2024-01-29');
```

## Caching Patterns

### Cache-Aside

```typescript
class CacheAsidePattern<T> {
  constructor(
    private redis: Redis,
    private ttl: number = 3600
  ) {}

  async get(
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // 1. Check cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. Cache miss, query database
    const data = await fetchFn();

    // 3. Write to cache
    if (data) {
      await this.redis.setex(key, this.ttl, JSON.stringify(data));
    }

    return data;
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

// Usage
const userCache = new CacheAsidePattern<User>(redis, 3600);

async function getUser(userId: string): Promise<User> {
  return userCache.get(`user:${userId}`, async () => {
    return db.users.findById(userId);
  });
}

async function updateUser(userId: string, data: UpdateUserDto): Promise<void> {
  await db.users.update(userId, data);
  await userCache.invalidate(`user:${userId}`);
}
```

### Read-Through / Write-Through

```typescript
class ReadThroughCache<T> {
  constructor(
    private redis: Redis,
    private loader: (key: string) => Promise<T>,
    private ttl: number = 3600
  ) {}

  async get(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await this.loader(key);
    if (data) {
      await this.redis.setex(key, this.ttl, JSON.stringify(data));
    }
    return data;
  }
}

class WriteThroughCache<T> {
  constructor(
    private redis: Redis,
    private writer: (key: string, data: T) => Promise<void>,
    private ttl: number = 3600
  ) {}

  async set(key: string, data: T): Promise<void> {
    // Write to both cache and database
    await Promise.all([
      this.redis.setex(key, this.ttl, JSON.stringify(data)),
      this.writer(key, data),
    ]);
  }
}
```

### Cache Penetration, Breakdown, and Avalanche

```typescript
// Prevent cache penetration: Bloom filter
class BloomFilterCache<T> {
  constructor(
    private redis: Redis,
    private bloomKey: string,
    private ttl: number = 3600
  ) {}

  async get(key: string, fetchFn: () => Promise<T | null>): Promise<T | null> {
    // Check bloom filter first
    const mightExist = await this.redis.call('BF.EXISTS', this.bloomKey, key);
    if (!mightExist) {
      return null; // Definitely doesn't exist
    }

    const cached = await this.redis.get(key);
    if (cached) {
      return cached === 'NULL' ? null : JSON.parse(cached);
    }

    const data = await fetchFn();

    if (data) {
      await this.redis.setex(key, this.ttl, JSON.stringify(data));
      await this.redis.call('BF.ADD', this.bloomKey, key);
    } else {
      // Cache null to prevent penetration
      await this.redis.setex(key, 60, 'NULL');
    }

    return data;
  }
}

// Prevent cache breakdown: Mutex lock
class MutexCache<T> {
  constructor(
    private redis: Redis,
    private ttl: number = 3600,
    private lockTtl: number = 10
  ) {}

  async get(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const lockKey = `lock:${key}`;
    const acquired = await this.redis.set(lockKey, '1', 'EX', this.lockTtl, 'NX');

    if (acquired) {
      try {
        const data = await fetchFn();
        await this.redis.setex(key, this.ttl, JSON.stringify(data));
        return data;
      } finally {
        await this.redis.del(lockKey);
      }
    } else {
      // Wait for other request to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.get(key, fetchFn);
    }
  }
}

// Prevent cache avalanche: Random TTL
function setWithJitter(redis: Redis, key: string, value: string, baseTtl: number) {
  const jitter = Math.floor(Math.random() * 300); // 0-5 min random
  return redis.setex(key, baseTtl + jitter, value);
}
```

## Distributed Locks

### Basic Implementation

```typescript
class RedisLock {
  constructor(
    private redis: Redis,
    private lockKey: string,
    private ttl: number = 10000
  ) {}

  private token = Math.random().toString(36).substring(2);

  async acquire(): Promise<boolean> {
    const result = await this.redis.set(
      this.lockKey,
      this.token,
      'PX',
      this.ttl,
      'NX'
    );
    return result === 'OK';
  }

  async release(): Promise<boolean> {
    // Lua script for atomic check-and-delete
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.redis.call('EVAL', script, 1, this.lockKey, this.token);
    return result === 1;
  }
}

// Usage
async function processWithLock(resourceId: string) {
  const lock = new RedisLock(redis, `lock:${resourceId}`);

  if (await lock.acquire()) {
    try {
      await doWork(resourceId);
    } finally {
      await lock.release();
    }
  } else {
    throw new Error('Failed to acquire lock');
  }
}
```

### Redlock Algorithm

```typescript
import Redlock from 'redlock';

const redlock = new Redlock(
  [redis1, redis2, redis3], // Multiple Redis instances
  {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200,
  }
);

async function processWithRedlock(resourceId: string) {
  let lock;
  try {
    lock = await redlock.acquire([`lock:${resourceId}`], 5000);
    await doWork(resourceId);
  } catch (err) {
    if (err instanceof Redlock.LockError) {
      throw new Error('Failed to acquire distributed lock');
    }
    throw err;
  } finally {
    if (lock) {
      await lock.release();
    }
  }
}
```

## Pub/Sub

```typescript
// Publisher
async function publishMessage(channel: string, message: object) {
  await redis.publish(channel, JSON.stringify(message));
}

// Subscriber
const subscriber = redis.duplicate();

subscriber.subscribe('notifications', 'events', (err, count) => {
  console.log(`Subscribed to ${count} channels`);
});

subscriber.on('message', (channel, message) => {
  const data = JSON.parse(message);
  console.log(`Received from ${channel}:`, data);
});

// Pattern subscription
subscriber.psubscribe('user:*:events', (err, count) => {
  console.log(`Subscribed to pattern`);
});

subscriber.on('pmessage', (pattern, channel, message) => {
  console.log(`Pattern ${pattern}, channel ${channel}:`, message);
});
```

## Streams

```typescript
// Producer
async function addToStream(streamKey: string, data: Record<string, string>) {
  const id = await redis.xadd(streamKey, '*', ...Object.entries(data).flat());
  return id;
}

await addToStream('orders', { orderId: '123', status: 'created' });

// Consumer group
await redis.xgroup('CREATE', 'orders', 'order-processors', '$', 'MKSTREAM');

// Consumer reading
async function consumeStream(
  streamKey: string,
  groupName: string,
  consumerName: string
) {
  while (true) {
    const results = await redis.xreadgroup(
      'GROUP', groupName, consumerName,
      'BLOCK', 5000,
      'COUNT', 10,
      'STREAMS', streamKey, '>'
    );

    if (!results) continue;

    for (const [stream, messages] of results) {
      for (const [id, fields] of messages) {
        try {
          await processMessage(Object.fromEntries(fields));
          await redis.xack(streamKey, groupName, id);
        } catch (err) {
          console.error('Failed to process message:', id, err);
        }
      }
    }
  }
}
```

## High Availability Architecture

### Master-Slave Replication

```
Master-Slave Architecture:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ┌──────────┐                                      │
│   │  Master  │◄───── Write operations              │
│   │  Redis   │                                      │
│   └────┬─────┘                                      │
│        │                                            │
│        │ Async replication                          │
│        │                                            │
│   ┌────┴─────┬─────────┐                            │
│   ▼          ▼         ▼                            │
│ ┌────────┐ ┌────────┐ ┌────────┐                   │
│ │ Slave1 │ │ Slave2 │ │ Slave3 │◄── Read ops      │
│ └────────┘ └────────┘ └────────┘                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Sentinel

```yaml
# sentinel.conf
port 26379
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1
```

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  sentinels: [
    { host: 'sentinel1', port: 26379 },
    { host: 'sentinel2', port: 26379 },
    { host: 'sentinel3', port: 26379 },
  ],
  name: 'mymaster',
});
```

### Cluster

```
Redis Cluster Architecture:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ┌──────────────┐  ┌──────────────┐               │
│   │ Node 1       │  │ Node 2       │               │
│   │ Slots: 0-5460│  │ Slots: 5461- │               │
│   │              │  │        10922 │               │
│   │ Master ◄──►  │  │ Master ◄──►  │               │
│   │    │         │  │    │         │               │
│   │    ▼         │  │    ▼         │               │
│   │  Replica     │  │  Replica     │               │
│   └──────────────┘  └──────────────┘               │
│                                                     │
│   ┌──────────────┐                                  │
│   │ Node 3       │                                  │
│   │ Slots: 10923-│                                  │
│   │        16383 │                                  │
│   │ Master ◄──►  │                                  │
│   │    │         │                                  │
│   │    ▼         │                                  │
│   │  Replica     │                                  │
│   └──────────────┘                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```typescript
import Redis from 'ioredis';

const cluster = new Redis.Cluster([
  { host: 'node1', port: 6379 },
  { host: 'node2', port: 6379 },
  { host: 'node3', port: 6379 },
], {
  redisOptions: {
    password: 'your-password',
  },
  scaleReads: 'slave', // Read from replicas
});
```

## Best Practices

```
Redis Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Key Design                                        │
│   ├── Use colons for namespacing: user:1:profile  │
│   ├── Avoid overly long key names                 │
│   ├── Set appropriate TTL                         │
│   └── Avoid big keys                              │
│                                                     │
│   Performance Optimization                          │
│   ├── Use Pipeline for batch operations           │
│   ├── Avoid KEYS command, use SCAN               │
│   ├── Choose appropriate data structures          │
│   └── Enable connection pooling                   │
│                                                     │
│   High Availability                                 │
│   ├── Master-slave + Sentinel                     │
│   ├── Or use Cluster mode                         │
│   ├── Persistence: RDB + AOF                      │
│   └── Monitor memory usage                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach |
|----------|---------------------|
| Session storage | String + TTL |
| Leaderboard | Sorted Set |
| Counter | String INCR |
| Message queue | Stream / List |
| Distributed lock | SET NX + Lua |
| UV stats | HyperLogLog |

Redis is the foundation of high-performance applications. Understanding its data structure characteristics and choosing appropriate patterns can significantly improve system performance.

---

*Memory is expensive, data is precious. Use Redis wisely and let caching become your system's accelerator.*
