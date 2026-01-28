---
title: 'Database Design and Optimization: From Modeling to Performance Tuning'
description: 'Master database design normalization, indexing strategies, query optimization, and high availability architecture'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'database-design-optimization'
---

The database is the core of any application. Good design and optimization strategies directly impact system performance and scalability. This article explores database design and optimization best practices.

## Database Selection

### Relational vs Non-Relational

```
Database Selection Decision:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Relational Databases (RDBMS)                     │
│   ├── PostgreSQL  → Powerful, extensible           │
│   ├── MySQL       → Mature ecosystem, widely used  │
│   └── SQLite      → Lightweight, embedded          │
│                                                     │
│   Document Databases                                │
│   ├── MongoDB     → Flexible schema, scalable      │
│   └── CouchDB     → Offline-first, sync-friendly   │
│                                                     │
│   Key-Value Databases                               │
│   ├── Redis       → In-memory, rich data types     │
│   └── DynamoDB    → Managed, auto-scaling          │
│                                                     │
│   Time-Series Databases                             │
│   ├── InfluxDB    → Metrics monitoring             │
│   └── TimescaleDB → PostgreSQL extension           │
│                                                     │
│   Graph Databases                                   │
│   └── Neo4j       → Relationship network analysis  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Choice |
|----------|-------------------|
| Transaction Processing (OLTP) | PostgreSQL / MySQL |
| Data Analytics (OLAP) | ClickHouse / BigQuery |
| Sessions/Cache | Redis |
| Logs/Documents | MongoDB / Elasticsearch |
| Social Relationships | Neo4j |

## Relational Database Design

### Normalization

```sql
-- First Normal Form (1NF): Atomicity
-- ❌ Violates 1NF
CREATE TABLE orders_bad (
    id INT PRIMARY KEY,
    items VARCHAR(500)  -- 'ProductA,ProductB,ProductC'
);

-- ✅ Compliant with 1NF
CREATE TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT NOT NULL
);

CREATE TABLE order_items (
    id INT PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    product_id INT NOT NULL,
    quantity INT NOT NULL
);

-- Second Normal Form (2NF): Eliminate Partial Dependencies
-- ❌ Partial dependency: product_name depends only on product_id
CREATE TABLE order_items_bad (
    order_id INT,
    product_id INT,
    product_name VARCHAR(100),  -- Partial dependency
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);

-- ✅ Compliant with 2NF
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE order_items (
    order_id INT,
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL,
    PRIMARY KEY (order_id, product_id)
);

-- Third Normal Form (3NF): Eliminate Transitive Dependencies
-- ❌ Transitive dependency: city depends on zip_code
CREATE TABLE customers_bad (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    zip_code VARCHAR(10),
    city VARCHAR(50)  -- Transitive dependency
);

-- ✅ Compliant with 3NF
CREATE TABLE zip_codes (
    code VARCHAR(10) PRIMARY KEY,
    city VARCHAR(50) NOT NULL
);

CREATE TABLE customers (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    zip_code VARCHAR(10) REFERENCES zip_codes(code)
);
```

### Denormalization

```sql
-- Strategic denormalization for query performance

-- Redundant count field
CREATE TABLE posts (
    id INT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    comment_count INT DEFAULT 0,  -- Redundant field
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update count
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comment_count = comment_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comment_count = comment_count - 1
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Materialized view
CREATE MATERIALIZED VIEW product_stats AS
SELECT
    p.id,
    p.name,
    COUNT(oi.id) as total_orders,
    SUM(oi.quantity) as total_sold,
    AVG(r.rating) as avg_rating
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id, p.name;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY product_stats;
```

### Data Type Selection

```sql
-- Integer types
SMALLINT        -- 2 bytes, -32768 to 32767
INTEGER         -- 4 bytes, -2^31 to 2^31-1
BIGINT          -- 8 bytes, -2^63 to 2^63-1
SERIAL          -- Auto-incrementing integer

-- Exact numerics
DECIMAL(10, 2)  -- Currency amounts
NUMERIC(15, 6)  -- Precise calculations

-- Floating point (avoid for currency)
REAL            -- 4 bytes
DOUBLE PRECISION -- 8 bytes

-- Strings
VARCHAR(n)      -- Variable length, limited
TEXT            -- Variable length, unlimited
CHAR(n)         -- Fixed length

-- Time
TIMESTAMP WITH TIME ZONE  -- With timezone (recommended)
DATE            -- Date only
TIME            -- Time only
INTERVAL        -- Time interval

-- JSON
JSONB           -- Binary JSON (recommended)
JSON            -- Text JSON

-- UUID
UUID            -- Universally unique identifier

-- Best practices example
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash CHAR(60) NOT NULL,  -- bcrypt fixed length
    balance DECIMAL(15, 2) DEFAULT 0.00,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

## Indexing Strategies

### Index Types

```sql
-- B-Tree index (default)
-- Suitable for: =, <, >, <=, >=, BETWEEN, IN, LIKE 'prefix%'
CREATE INDEX idx_users_email ON users(email);

-- Composite index
-- Follows leftmost prefix rule
CREATE INDEX idx_orders_customer_date ON orders(customer_id, created_at DESC);

-- Covering index
-- Includes all columns needed by query
CREATE INDEX idx_products_covering ON products(category_id)
INCLUDE (name, price);

-- Partial index
-- Only indexes rows matching condition
CREATE INDEX idx_orders_pending ON orders(created_at)
WHERE status = 'pending';

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Hash index
-- Only for equality queries
CREATE INDEX idx_users_id_hash ON users USING HASH (id);

-- GIN index
-- For arrays, full-text search, JSONB
CREATE INDEX idx_posts_tags ON posts USING GIN (tags);
CREATE INDEX idx_users_metadata ON users USING GIN (metadata);

-- GiST index
-- For geospatial data
CREATE INDEX idx_locations_point ON locations USING GIST (point);
```

### Index Optimization

```sql
-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT
    schemaname || '.' || relname AS table,
    indexrelname AS index,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
    idx_scan as index_scans
FROM pg_stat_user_indexes i
JOIN pg_index USING (indexrelid)
WHERE idx_scan = 0
AND indisunique IS FALSE;

-- View table and index sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_table_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Query Optimization

### EXPLAIN Analysis

```sql
-- Basic analysis
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;

-- Detailed analysis (includes actual execution time)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.*, c.name as customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.created_at >= '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 100;

-- Output interpretation
/*
Limit  (cost=1000.00..1010.00 rows=100 width=200) (actual time=5.123..5.456 rows=100 loops=1)
  ->  Sort  (cost=1000.00..1250.00 rows=1000 width=200) (actual time=5.120..5.350 rows=100 loops=1)
        Sort Key: o.created_at DESC
        Sort Method: top-N heapsort  Memory: 128kB
        ->  Hash Join  (cost=50.00..800.00 rows=1000 width=200) (actual time=1.234..4.567 rows=1500 loops=1)
              Hash Cond: (o.customer_id = c.id)
              ->  Index Scan using idx_orders_created_at on orders o  (cost=0.00..500.00 rows=1000 width=150)
                    Index Cond: (created_at >= '2024-01-01')
              ->  Hash  (cost=25.00..25.00 rows=100 width=50) (actual time=0.500..0.500 rows=100 loops=1)
                    ->  Seq Scan on customers c  (cost=0.00..25.00 rows=100 width=50)
Planning Time: 0.234 ms
Execution Time: 5.678 ms
*/
```

### Common Optimization Techniques

```sql
-- 1. Avoid SELECT *
-- ❌
SELECT * FROM orders WHERE customer_id = 123;
-- ✅
SELECT id, status, total_amount, created_at
FROM orders WHERE customer_id = 123;

-- 2. Use indexed columns
-- ❌ Causes index to be ignored
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
-- ✅ Use function index or store lowercase
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- 3. Avoid OR, use UNION
-- ❌
SELECT * FROM orders WHERE status = 'pending' OR customer_id = 123;
-- ✅
SELECT * FROM orders WHERE status = 'pending'
UNION
SELECT * FROM orders WHERE customer_id = 123;

-- 4. Use EXISTS instead of IN (large datasets)
-- ❌
SELECT * FROM orders WHERE customer_id IN (SELECT id FROM vip_customers);
-- ✅
SELECT * FROM orders o
WHERE EXISTS (SELECT 1 FROM vip_customers v WHERE v.id = o.customer_id);

-- 5. Pagination optimization
-- ❌ Deep pagination is slow
SELECT * FROM orders ORDER BY id LIMIT 10 OFFSET 100000;
-- ✅ Use cursor pagination
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 10;

-- 6. Batch operations
-- ❌ Multiple inserts
INSERT INTO logs (message) VALUES ('log1');
INSERT INTO logs (message) VALUES ('log2');
-- ✅ Batch insert
INSERT INTO logs (message) VALUES ('log1'), ('log2'), ('log3');

-- 7. Use CTEs for complex queries
WITH recent_orders AS (
    SELECT customer_id, COUNT(*) as order_count
    FROM orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY customer_id
)
SELECT c.*, ro.order_count
FROM customers c
JOIN recent_orders ro ON c.id = ro.customer_id
WHERE ro.order_count > 5;
```

## Transactions and Concurrency

### Isolation Levels

```sql
-- Read Uncommitted (dirty reads)
-- Rarely used

-- Read Committed (default)
-- Prevents dirty reads
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Repeatable Read
-- Prevents dirty reads, non-repeatable reads
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Serializable
-- Highest isolation, fully serialized
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

### Locking Mechanisms

```sql
-- Row-level locks
-- SELECT ... FOR UPDATE (exclusive lock)
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;

-- SELECT ... FOR SHARE (shared lock)
SELECT * FROM products WHERE id = 1 FOR SHARE;

-- Avoid deadlocks: acquire locks in consistent order
BEGIN;
SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
-- Process transfer...
COMMIT;

-- Optimistic locking implementation
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 123 AND version = 5;
-- Check affected rows, if 0 then conflict occurred
```

## Partitioning and Sharding

### Table Partitioning

```sql
-- Range partitioning
CREATE TABLE orders (
    id BIGSERIAL,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- List partitioning
CREATE TABLE orders_by_region (
    id BIGSERIAL,
    region VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10,2),
    PRIMARY KEY (id, region)
) PARTITION BY LIST (region);

CREATE TABLE orders_asia PARTITION OF orders_by_region
    FOR VALUES IN ('cn', 'jp', 'kr');

CREATE TABLE orders_europe PARTITION OF orders_by_region
    FOR VALUES IN ('de', 'fr', 'uk');

-- Hash partitioning
CREATE TABLE sessions (
    id UUID,
    user_id INT NOT NULL,
    data JSONB,
    PRIMARY KEY (id, user_id)
) PARTITION BY HASH (user_id);

CREATE TABLE sessions_0 PARTITION OF sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE sessions_1 PARTITION OF sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);
```

### Read-Write Separation

```typescript
// Application-level read-write separation
import { Pool } from 'pg';

const writePool = new Pool({
  host: 'primary.db.example.com',
  database: 'myapp',
});

const readPool = new Pool({
  host: 'replica.db.example.com',
  database: 'myapp',
});

class DatabaseService {
  async query(sql: string, params?: any[]) {
    // Select pool based on SQL type
    const isWrite = /^(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i.test(sql.trim());
    const pool = isWrite ? writePool : readPool;
    return pool.query(sql, params);
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await writePool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

## Backup and Recovery

```bash
# PostgreSQL backup
# Logical backup
pg_dump -h localhost -U postgres -d mydb > backup.sql
pg_dump -h localhost -U postgres -Fc -d mydb > backup.dump

# Restore
psql -h localhost -U postgres -d mydb < backup.sql
pg_restore -h localhost -U postgres -d mydb backup.dump

# Continuous archiving (WAL)
# postgresql.conf
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'

# Point-in-time recovery (PITR)
# recovery.conf
restore_command = 'cp /backup/wal/%f %p'
recovery_target_time = '2024-01-28 12:00:00'
```

## Monitoring Metrics

```sql
-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT
    query,
    calls,
    mean_time,
    total_time,
    rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Table bloat
SELECT
    schemaname,
    relname,
    n_dead_tup,
    n_live_tup,
    round(n_dead_tup * 100.0 / nullif(n_live_tup + n_dead_tup, 0), 2) as dead_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Cache hit ratio
SELECT
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit)  as heap_hit,
    round(sum(heap_blks_hit) * 100.0 / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) as ratio
FROM pg_statio_user_tables;
```

## Best Practices Summary

```
Database Design Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Design Principles                                 │
│   ├── Design based on business requirements       │
│   ├── Normalize appropriately, denormalize when   │
│   │   necessary                                    │
│   ├── Choose appropriate data types               │
│   └── Use auto-increment or UUID for primary keys │
│                                                     │
│   Indexing Strategy                                 │
│   ├── Create indexes for common query conditions  │
│   ├── Follow leftmost prefix rule                 │
│   ├── Regularly check index usage                 │
│   └── Remove unused indexes                       │
│                                                     │
│   Query Optimization                                │
│   ├── Use EXPLAIN to analyze queries             │
│   ├── Avoid full table scans                      │
│   ├── Use pagination wisely                       │
│   └── Batch process large data volumes            │
│                                                     │
│   High Availability                                 │
│   ├── Master-slave replication                    │
│   ├── Read-write separation                       │
│   ├── Regular backups                             │
│   └── Monitor key metrics                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach |
|----------|---------------------|
| Primary Key | UUID or BIGSERIAL |
| Currency | DECIMAL(15,2) |
| Timestamps | TIMESTAMPTZ |
| JSON | JSONB |
| Full-text Search | GIN + tsvector |

Database design is the foundation of system architecture. Understand business requirements, choose appropriate storage solutions, and continuously optimize query performance.

---

*Data is the lifeblood of applications, the database is the heart. Well-designed databases make data flow more efficiently.*
