---
title: 'SQL 查询语法完全指南'
description: '掌握 SQL 基础语法、连接查询、子查询、聚合函数和性能优化'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'sql-query-guide'
---

SQL 是与数据库交互的标准语言。本文详细介绍 SQL 查询的核心语法和最佳实践。

## 基础查询

### SELECT 语句

```sql
-- 基本查询
SELECT * FROM users;

-- 选择特定列
SELECT id, name, email FROM users;

-- 使用别名
SELECT
  first_name AS "First Name",
  last_name AS "Last Name",
  CONCAT(first_name, ' ', last_name) AS full_name
FROM users;

-- 去重
SELECT DISTINCT department FROM employees;

-- 限制结果数量
SELECT * FROM products LIMIT 10;
SELECT * FROM products LIMIT 10 OFFSET 20;  -- 分页
```

### WHERE 条件

```sql
-- 比较运算符
SELECT * FROM products WHERE price > 100;
SELECT * FROM products WHERE price >= 50 AND price <= 100;
SELECT * FROM products WHERE price BETWEEN 50 AND 100;

-- 逻辑运算符
SELECT * FROM users
WHERE age >= 18 AND status = 'active';

SELECT * FROM orders
WHERE status = 'pending' OR status = 'processing';

SELECT * FROM products
WHERE NOT category = 'electronics';

-- NULL 检查
SELECT * FROM users WHERE phone IS NULL;
SELECT * FROM users WHERE phone IS NOT NULL;

-- 模式匹配
SELECT * FROM users WHERE name LIKE 'John%';      -- 以 John 开头
SELECT * FROM users WHERE email LIKE '%@gmail.com';  -- 以 @gmail.com 结尾
SELECT * FROM users WHERE name LIKE '%son%';      -- 包含 son

-- IN 运算符
SELECT * FROM products
WHERE category IN ('electronics', 'clothing', 'books');
```

### 排序和分组

```sql
-- 排序
SELECT * FROM products ORDER BY price ASC;       -- 升序
SELECT * FROM products ORDER BY price DESC;      -- 降序
SELECT * FROM products ORDER BY category, price DESC;  -- 多列排序

-- 分组
SELECT category, COUNT(*) as count
FROM products
GROUP BY category;

-- HAVING 过滤分组
SELECT category, AVG(price) as avg_price
FROM products
GROUP BY category
HAVING AVG(price) > 100;
```

## 聚合函数

### 常用函数

```sql
-- 计数
SELECT COUNT(*) FROM orders;                     -- 总行数
SELECT COUNT(DISTINCT customer_id) FROM orders;  -- 去重计数

-- 求和与平均
SELECT SUM(amount) as total_sales FROM orders;
SELECT AVG(price) as average_price FROM products;

-- 最大最小值
SELECT MAX(price) as highest, MIN(price) as lowest
FROM products;

-- 综合示例
SELECT
  category,
  COUNT(*) as product_count,
  AVG(price) as avg_price,
  SUM(stock) as total_stock,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM products
GROUP BY category
ORDER BY product_count DESC;
```

### 窗口函数

```sql
-- ROW_NUMBER - 行号
SELECT
  name,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees;

-- RANK - 排名（相同值同名次，跳过）
SELECT
  name,
  score,
  RANK() OVER (ORDER BY score DESC) as rank
FROM students;

-- DENSE_RANK - 密集排名（不跳过）
SELECT
  name,
  score,
  DENSE_RANK() OVER (ORDER BY score DESC) as rank
FROM students;

-- LAG / LEAD - 前/后行值
SELECT
  date,
  sales,
  LAG(sales, 1) OVER (ORDER BY date) as prev_day_sales,
  LEAD(sales, 1) OVER (ORDER BY date) as next_day_sales
FROM daily_sales;

-- 累计求和
SELECT
  date,
  amount,
  SUM(amount) OVER (ORDER BY date) as running_total
FROM transactions;
```

## 连接查询

### JOIN 类型

```
SQL JOIN 类型：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   INNER JOIN                                        │
│   └── 返回两表匹配的行                             │
│                                                     │
│   LEFT JOIN                                         │
│   └── 返回左表所有行，右表匹配或 NULL              │
│                                                     │
│   RIGHT JOIN                                        │
│   └── 返回右表所有行，左表匹配或 NULL              │
│                                                     │
│   FULL OUTER JOIN                                   │
│   └── 返回两表所有行，不匹配的为 NULL              │
│                                                     │
│   CROSS JOIN                                        │
│   └── 返回笛卡尔积（所有组合）                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### JOIN 示例

```sql
-- INNER JOIN
SELECT
  orders.id,
  customers.name,
  orders.total
FROM orders
INNER JOIN customers ON orders.customer_id = customers.id;

-- LEFT JOIN
SELECT
  customers.name,
  COUNT(orders.id) as order_count
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id
GROUP BY customers.id, customers.name;

-- 多表连接
SELECT
  o.id as order_id,
  c.name as customer_name,
  p.name as product_name,
  oi.quantity,
  oi.price
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.status = 'completed';

-- 自连接
SELECT
  e.name as employee,
  m.name as manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

## 子查询

### 标量子查询

```sql
-- 返回单个值
SELECT
  name,
  price,
  price - (SELECT AVG(price) FROM products) as diff_from_avg
FROM products;

-- WHERE 中使用
SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products);
```

### 表子查询

```sql
-- IN 子查询
SELECT * FROM customers
WHERE id IN (
  SELECT DISTINCT customer_id
  FROM orders
  WHERE total > 1000
);

-- EXISTS 子查询
SELECT * FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = c.id
  AND o.total > 1000
);

-- FROM 子查询
SELECT department, avg_salary
FROM (
  SELECT department, AVG(salary) as avg_salary
  FROM employees
  GROUP BY department
) as dept_salaries
WHERE avg_salary > 50000;
```

### CTE (公共表表达式)

```sql
-- 基本 CTE
WITH high_value_customers AS (
  SELECT customer_id, SUM(total) as total_spent
  FROM orders
  GROUP BY customer_id
  HAVING SUM(total) > 10000
)
SELECT c.name, hvc.total_spent
FROM customers c
JOIN high_value_customers hvc ON c.id = hvc.customer_id;

-- 递归 CTE（组织层级）
WITH RECURSIVE org_tree AS (
  -- 基础查询：顶级员工
  SELECT id, name, manager_id, 1 as level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- 递归查询：下属员工
  SELECT e.id, e.name, e.manager_id, t.level + 1
  FROM employees e
  JOIN org_tree t ON e.manager_id = t.id
)
SELECT * FROM org_tree ORDER BY level, name;
```

## 数据修改

### INSERT

```sql
-- 单行插入
INSERT INTO users (name, email, age)
VALUES ('John Doe', 'john@example.com', 30);

-- 多行插入
INSERT INTO users (name, email, age) VALUES
  ('Alice', 'alice@example.com', 25),
  ('Bob', 'bob@example.com', 28),
  ('Charlie', 'charlie@example.com', 35);

-- 从查询插入
INSERT INTO archived_orders
SELECT * FROM orders WHERE created_at < '2024-01-01';
```

### UPDATE

```sql
-- 基本更新
UPDATE users SET status = 'inactive' WHERE last_login < '2024-01-01';

-- 多列更新
UPDATE products
SET price = price * 1.1, updated_at = NOW()
WHERE category = 'electronics';

-- 带 JOIN 更新
UPDATE orders o
JOIN customers c ON o.customer_id = c.id
SET o.discount = 0.1
WHERE c.membership = 'gold';
```

### DELETE

```sql
-- 基本删除
DELETE FROM users WHERE status = 'deleted';

-- 带子查询删除
DELETE FROM orders
WHERE customer_id IN (
  SELECT id FROM customers WHERE status = 'inactive'
);

-- 清空表（更快，不记录日志）
TRUNCATE TABLE temp_data;
```

## 性能优化

### 索引使用

```sql
-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_orders_composite ON orders(customer_id, status);

-- 查看执行计划
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;
```

### 优化技巧

```
SQL 优化最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   查询优化                                          │
│   ├── 只选择需要的列，避免 SELECT *                │
│   ├── 使用 EXISTS 代替 IN（大数据集）              │
│   ├── 避免在 WHERE 中对列使用函数                  │
│   └── 使用 LIMIT 限制结果集                        │
│                                                     │
│   索引优化                                          │
│   ├── 为常用查询条件创建索引                       │
│   ├── 复合索引注意列顺序                           │
│   ├── 避免过多索引影响写入                         │
│   └── 定期分析和优化索引                           │
│                                                     │
│   JOIN 优化                                         │
│   ├── 小表驱动大表                                 │
│   ├── 确保 JOIN 列有索引                           │
│   └── 避免不必要的 JOIN                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 最佳实践总结

| 操作 | 建议 |
|------|------|
| SELECT | 明确指定列，避免 * |
| WHERE | 使用索引列，避免函数 |
| JOIN | 确保有适当索引 |
| 子查询 | 考虑改写为 JOIN 或 CTE |
| 聚合 | 先过滤再聚合 |

---

*掌握 SQL 是后端开发的必备技能。*
