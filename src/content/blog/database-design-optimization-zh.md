---
title: '数据库设计与优化：从建模到性能调优'
description: '掌握数据库设计范式、索引策略、查询优化和高可用架构'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'database-design-optimization'
---

数据库是应用程序的核心。良好的设计和优化策略直接影响系统性能和可扩展性。本文将深入探讨数据库设计与优化的最佳实践。

## 数据库选型

### 关系型 vs 非关系型

```
数据库选型决策：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   关系型数据库 (RDBMS)                              │
│   ├── PostgreSQL  → 功能强大，扩展性好              │
│   ├── MySQL       → 生态成熟，应用广泛              │
│   └── SQLite      → 轻量级，嵌入式                  │
│                                                     │
│   文档数据库                                        │
│   ├── MongoDB     → 灵活 schema，易扩展             │
│   └── CouchDB     → 离线优先，同步友好              │
│                                                     │
│   键值数据库                                        │
│   ├── Redis       → 内存存储，多数据结构            │
│   └── DynamoDB    → 托管服务，自动扩展              │
│                                                     │
│   时序数据库                                        │
│   ├── InfluxDB    → 监控指标                        │
│   └── TimescaleDB → PostgreSQL 扩展                 │
│                                                     │
│   图数据库                                          │
│   └── Neo4j       → 关系网络分析                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐选择 |
|------|----------|
| 事务处理 (OLTP) | PostgreSQL / MySQL |
| 数据分析 (OLAP) | ClickHouse / BigQuery |
| 会话/缓存 | Redis |
| 日志/文档 | MongoDB / Elasticsearch |
| 社交关系 | Neo4j |

## 关系型数据库设计

### 范式化设计

```sql
-- 第一范式 (1NF)：原子性
-- ❌ 违反1NF
CREATE TABLE orders_bad (
    id INT PRIMARY KEY,
    items VARCHAR(500)  -- '商品A,商品B,商品C'
);

-- ✅ 符合1NF
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

-- 第二范式 (2NF)：消除部分依赖
-- ❌ 部分依赖：product_name 只依赖 product_id
CREATE TABLE order_items_bad (
    order_id INT,
    product_id INT,
    product_name VARCHAR(100),  -- 部分依赖
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);

-- ✅ 符合2NF
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

-- 第三范式 (3NF)：消除传递依赖
-- ❌ 传递依赖：city 依赖 zip_code，zip_code 依赖 id
CREATE TABLE customers_bad (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    zip_code VARCHAR(10),
    city VARCHAR(50)  -- 传递依赖
);

-- ✅ 符合3NF
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

### 反范式化

```sql
-- 适当的反范式化提升查询性能

-- 冗余计数字段
CREATE TABLE posts (
    id INT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    comment_count INT DEFAULT 0,  -- 冗余字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 更新计数的触发器
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

-- 物化视图
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

-- 刷新物化视图
REFRESH MATERIALIZED VIEW CONCURRENTLY product_stats;
```

### 数据类型选择

```sql
-- 整数类型
SMALLINT        -- 2 bytes, -32768 to 32767
INTEGER         -- 4 bytes, -2^31 to 2^31-1
BIGINT          -- 8 bytes, -2^63 to 2^63-1
SERIAL          -- 自增整数

-- 精确数值
DECIMAL(10, 2)  -- 货币金额
NUMERIC(15, 6)  -- 精确计算

-- 浮点数（避免用于货币）
REAL            -- 4 bytes
DOUBLE PRECISION -- 8 bytes

-- 字符串
VARCHAR(n)      -- 变长，有限制
TEXT            -- 变长，无限制
CHAR(n)         -- 定长

-- 时间
TIMESTAMP WITH TIME ZONE  -- 带时区（推荐）
DATE            -- 仅日期
TIME            -- 仅时间
INTERVAL        -- 时间间隔

-- JSON
JSONB           -- 二进制JSON（推荐）
JSON            -- 文本JSON

-- UUID
UUID            -- 通用唯一标识符

-- 最佳实践示例
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash CHAR(60) NOT NULL,  -- bcrypt固定长度
    balance DECIMAL(15, 2) DEFAULT 0.00,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

## 索引策略

### 索引类型

```sql
-- B-Tree 索引（默认）
-- 适用于：=, <, >, <=, >=, BETWEEN, IN, LIKE 'prefix%'
CREATE INDEX idx_users_email ON users(email);

-- 复合索引
-- 遵循最左前缀原则
CREATE INDEX idx_orders_customer_date ON orders(customer_id, created_at DESC);

-- 覆盖索引
-- 包含查询所需所有列
CREATE INDEX idx_products_covering ON products(category_id)
INCLUDE (name, price);

-- 部分索引
-- 只索引满足条件的行
CREATE INDEX idx_orders_pending ON orders(created_at)
WHERE status = 'pending';

-- 唯一索引
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Hash 索引
-- 仅适用于等值查询
CREATE INDEX idx_users_id_hash ON users USING HASH (id);

-- GIN 索引
-- 适用于数组、全文搜索、JSONB
CREATE INDEX idx_posts_tags ON posts USING GIN (tags);
CREATE INDEX idx_users_metadata ON users USING GIN (metadata);

-- GiST 索引
-- 适用于地理空间数据
CREATE INDEX idx_locations_point ON locations USING GIST (point);
```

### 索引优化

```sql
-- 查看索引使用情况
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 查找未使用的索引
SELECT
    schemaname || '.' || relname AS table,
    indexrelname AS index,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
    idx_scan as index_scans
FROM pg_stat_user_indexes i
JOIN pg_index USING (indexrelid)
WHERE idx_scan = 0
AND indisunique IS FALSE;

-- 查看表和索引大小
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_table_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 查询优化

### EXPLAIN 分析

```sql
-- 基本分析
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;

-- 详细分析（包含实际执行时间）
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.*, c.name as customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.created_at >= '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 100;

-- 输出解读
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

### 常见优化技巧

```sql
-- 1. 避免 SELECT *
-- ❌
SELECT * FROM orders WHERE customer_id = 123;
-- ✅
SELECT id, status, total_amount, created_at
FROM orders WHERE customer_id = 123;

-- 2. 使用索引覆盖的列
-- ❌ 导致索引失效
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
-- ✅ 使用函数索引或存储小写
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- 3. 避免 OR，使用 UNION
-- ❌
SELECT * FROM orders WHERE status = 'pending' OR customer_id = 123;
-- ✅
SELECT * FROM orders WHERE status = 'pending'
UNION
SELECT * FROM orders WHERE customer_id = 123;

-- 4. 使用 EXISTS 替代 IN（大数据集）
-- ❌
SELECT * FROM orders WHERE customer_id IN (SELECT id FROM vip_customers);
-- ✅
SELECT * FROM orders o
WHERE EXISTS (SELECT 1 FROM vip_customers v WHERE v.id = o.customer_id);

-- 5. 分页优化
-- ❌ 深分页性能差
SELECT * FROM orders ORDER BY id LIMIT 10 OFFSET 100000;
-- ✅ 使用游标分页
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 10;

-- 6. 批量操作
-- ❌ 多次插入
INSERT INTO logs (message) VALUES ('log1');
INSERT INTO logs (message) VALUES ('log2');
-- ✅ 批量插入
INSERT INTO logs (message) VALUES ('log1'), ('log2'), ('log3');

-- 7. 使用 CTE 优化复杂查询
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

## 事务与并发

### 隔离级别

```sql
-- Read Uncommitted（脏读）
-- 几乎不使用

-- Read Committed（默认）
-- 防止脏读
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Repeatable Read
-- 防止脏读、不可重复读
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Serializable
-- 最高隔离级别，完全串行化
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

### 锁机制

```sql
-- 行级锁
-- SELECT ... FOR UPDATE（排他锁）
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;

-- SELECT ... FOR SHARE（共享锁）
SELECT * FROM products WHERE id = 1 FOR SHARE;

-- 避免死锁：按固定顺序获取锁
BEGIN;
SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
-- 处理转账...
COMMIT;

-- 乐观锁实现
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 123 AND version = 5;
-- 检查 affected rows，如果为0则发生冲突
```

## 分区与分片

### 表分区

```sql
-- 范围分区
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

-- 列表分区
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

-- 哈希分区
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

### 读写分离

```typescript
// 应用层读写分离
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
    // 根据 SQL 类型选择连接池
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

## 备份与恢复

```bash
# PostgreSQL 备份
# 逻辑备份
pg_dump -h localhost -U postgres -d mydb > backup.sql
pg_dump -h localhost -U postgres -Fc -d mydb > backup.dump

# 恢复
psql -h localhost -U postgres -d mydb < backup.sql
pg_restore -h localhost -U postgres -d mydb backup.dump

# 持续归档 (WAL)
# postgresql.conf
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'

# 时间点恢复 (PITR)
# recovery.conf
restore_command = 'cp /backup/wal/%f %p'
recovery_target_time = '2024-01-28 12:00:00'
```

## 监控指标

```sql
-- 连接数
SELECT count(*) FROM pg_stat_activity;

-- 慢查询
SELECT
    query,
    calls,
    mean_time,
    total_time,
    rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 表膨胀
SELECT
    schemaname,
    relname,
    n_dead_tup,
    n_live_tup,
    round(n_dead_tup * 100.0 / nullif(n_live_tup + n_dead_tup, 0), 2) as dead_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- 缓存命中率
SELECT
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit)  as heap_hit,
    round(sum(heap_blks_hit) * 100.0 / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) as ratio
FROM pg_statio_user_tables;
```

## 最佳实践总结

```
数据库设计最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   设计原则                                          │
│   ├── 从业务需求出发设计                            │
│   ├── 适度范式化，必要时反范式                       │
│   ├── 选择合适的数据类型                            │
│   └── 主键使用自增或 UUID                           │
│                                                     │
│   索引策略                                          │
│   ├── 为常用查询条件创建索引                         │
│   ├── 遵循最左前缀原则                              │
│   ├── 定期检查索引使用情况                          │
│   └── 删除未使用的索引                              │
│                                                     │
│   查询优化                                          │
│   ├── 使用 EXPLAIN 分析查询                         │
│   ├── 避免全表扫描                                  │
│   ├── 合理使用分页                                  │
│   └── 批量处理大量数据                              │
│                                                     │
│   高可用                                            │
│   ├── 主从复制                                      │
│   ├── 读写分离                                      │
│   ├── 定期备份                                      │
│   └── 监控关键指标                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| 主键 | UUID 或 BIGSERIAL |
| 货币 | DECIMAL(15,2) |
| 时间 | TIMESTAMPTZ |
| JSON | JSONB |
| 全文搜索 | GIN + tsvector |

数据库设计是系统架构的基础。理解业务需求，选择合适的存储方案，持续优化查询性能。

---

*数据是应用的血液，数据库是心脏。设计良好的数据库，让数据流动更加高效。*
