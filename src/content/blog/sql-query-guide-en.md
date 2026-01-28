---
title: 'SQL Query Syntax Complete Guide'
description: 'Master SQL basics, join queries, subqueries, aggregate functions and optimization'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'sql-query-guide'
---

SQL is the standard language for database interaction. This article covers core SQL query syntax and best practices.

## Basic Queries

### SELECT Statement

```sql
-- Basic query
SELECT * FROM users;

-- Select specific columns
SELECT id, name, email FROM users;

-- Using aliases
SELECT
  first_name AS "First Name",
  last_name AS "Last Name",
  CONCAT(first_name, ' ', last_name) AS full_name
FROM users;

-- Distinct values
SELECT DISTINCT department FROM employees;

-- Limit results
SELECT * FROM products LIMIT 10;
SELECT * FROM products LIMIT 10 OFFSET 20;  -- Pagination
```

### WHERE Conditions

```sql
-- Comparison operators
SELECT * FROM products WHERE price > 100;
SELECT * FROM products WHERE price >= 50 AND price <= 100;
SELECT * FROM products WHERE price BETWEEN 50 AND 100;

-- Logical operators
SELECT * FROM users
WHERE age >= 18 AND status = 'active';

SELECT * FROM orders
WHERE status = 'pending' OR status = 'processing';

SELECT * FROM products
WHERE NOT category = 'electronics';

-- NULL check
SELECT * FROM users WHERE phone IS NULL;
SELECT * FROM users WHERE phone IS NOT NULL;

-- Pattern matching
SELECT * FROM users WHERE name LIKE 'John%';      -- Starts with John
SELECT * FROM users WHERE email LIKE '%@gmail.com';  -- Ends with @gmail.com
SELECT * FROM users WHERE name LIKE '%son%';      -- Contains son

-- IN operator
SELECT * FROM products
WHERE category IN ('electronics', 'clothing', 'books');
```

### Sorting and Grouping

```sql
-- Sorting
SELECT * FROM products ORDER BY price ASC;       -- Ascending
SELECT * FROM products ORDER BY price DESC;      -- Descending
SELECT * FROM products ORDER BY category, price DESC;  -- Multiple columns

-- Grouping
SELECT category, COUNT(*) as count
FROM products
GROUP BY category;

-- HAVING filters groups
SELECT category, AVG(price) as avg_price
FROM products
GROUP BY category
HAVING AVG(price) > 100;
```

## Aggregate Functions

### Common Functions

```sql
-- Count
SELECT COUNT(*) FROM orders;                     -- Total rows
SELECT COUNT(DISTINCT customer_id) FROM orders;  -- Distinct count

-- Sum and Average
SELECT SUM(amount) as total_sales FROM orders;
SELECT AVG(price) as average_price FROM products;

-- Min and Max
SELECT MAX(price) as highest, MIN(price) as lowest
FROM products;

-- Combined example
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

### Window Functions

```sql
-- ROW_NUMBER - row number
SELECT
  name,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees;

-- RANK - ranking (same values get same rank, skips)
SELECT
  name,
  score,
  RANK() OVER (ORDER BY score DESC) as rank
FROM students;

-- DENSE_RANK - dense ranking (no skipping)
SELECT
  name,
  score,
  DENSE_RANK() OVER (ORDER BY score DESC) as rank
FROM students;

-- LAG / LEAD - previous/next row values
SELECT
  date,
  sales,
  LAG(sales, 1) OVER (ORDER BY date) as prev_day_sales,
  LEAD(sales, 1) OVER (ORDER BY date) as next_day_sales
FROM daily_sales;

-- Running total
SELECT
  date,
  amount,
  SUM(amount) OVER (ORDER BY date) as running_total
FROM transactions;
```

## Join Queries

### JOIN Types

```
SQL JOIN Types:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   INNER JOIN                                        │
│   └── Returns matching rows from both tables       │
│                                                     │
│   LEFT JOIN                                         │
│   └── All left table rows, matching or NULL        │
│                                                     │
│   RIGHT JOIN                                        │
│   └── All right table rows, matching or NULL       │
│                                                     │
│   FULL OUTER JOIN                                   │
│   └── All rows from both, NULL for non-matches     │
│                                                     │
│   CROSS JOIN                                        │
│   └── Cartesian product (all combinations)         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### JOIN Examples

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

-- Multiple table join
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

-- Self join
SELECT
  e.name as employee,
  m.name as manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

## Subqueries

### Scalar Subqueries

```sql
-- Returns single value
SELECT
  name,
  price,
  price - (SELECT AVG(price) FROM products) as diff_from_avg
FROM products;

-- In WHERE clause
SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products);
```

### Table Subqueries

```sql
-- IN subquery
SELECT * FROM customers
WHERE id IN (
  SELECT DISTINCT customer_id
  FROM orders
  WHERE total > 1000
);

-- EXISTS subquery
SELECT * FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = c.id
  AND o.total > 1000
);

-- FROM subquery
SELECT department, avg_salary
FROM (
  SELECT department, AVG(salary) as avg_salary
  FROM employees
  GROUP BY department
) as dept_salaries
WHERE avg_salary > 50000;
```

### CTE (Common Table Expressions)

```sql
-- Basic CTE
WITH high_value_customers AS (
  SELECT customer_id, SUM(total) as total_spent
  FROM orders
  GROUP BY customer_id
  HAVING SUM(total) > 10000
)
SELECT c.name, hvc.total_spent
FROM customers c
JOIN high_value_customers hvc ON c.id = hvc.customer_id;

-- Recursive CTE (org hierarchy)
WITH RECURSIVE org_tree AS (
  -- Base query: top-level employees
  SELECT id, name, manager_id, 1 as level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- Recursive query: subordinates
  SELECT e.id, e.name, e.manager_id, t.level + 1
  FROM employees e
  JOIN org_tree t ON e.manager_id = t.id
)
SELECT * FROM org_tree ORDER BY level, name;
```

## Data Modification

### INSERT

```sql
-- Single row insert
INSERT INTO users (name, email, age)
VALUES ('John Doe', 'john@example.com', 30);

-- Multiple row insert
INSERT INTO users (name, email, age) VALUES
  ('Alice', 'alice@example.com', 25),
  ('Bob', 'bob@example.com', 28),
  ('Charlie', 'charlie@example.com', 35);

-- Insert from query
INSERT INTO archived_orders
SELECT * FROM orders WHERE created_at < '2024-01-01';
```

### UPDATE

```sql
-- Basic update
UPDATE users SET status = 'inactive' WHERE last_login < '2024-01-01';

-- Multiple column update
UPDATE products
SET price = price * 1.1, updated_at = NOW()
WHERE category = 'electronics';

-- Update with JOIN
UPDATE orders o
JOIN customers c ON o.customer_id = c.id
SET o.discount = 0.1
WHERE c.membership = 'gold';
```

### DELETE

```sql
-- Basic delete
DELETE FROM users WHERE status = 'deleted';

-- Delete with subquery
DELETE FROM orders
WHERE customer_id IN (
  SELECT id FROM customers WHERE status = 'inactive'
);

-- Truncate table (faster, no logging)
TRUNCATE TABLE temp_data;
```

## Performance Optimization

### Index Usage

```sql
-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_orders_composite ON orders(customer_id, status);

-- View execution plan
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;
```

### Optimization Tips

```
SQL Optimization Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Query Optimization                                │
│   ├── Select only needed columns, avoid SELECT *   │
│   ├── Use EXISTS instead of IN (large datasets)    │
│   ├── Avoid functions on columns in WHERE          │
│   └── Use LIMIT to restrict result sets            │
│                                                     │
│   Index Optimization                                │
│   ├── Create indexes for common query conditions   │
│   ├── Mind column order in composite indexes       │
│   ├── Avoid too many indexes (affects writes)      │
│   └── Regularly analyze and optimize indexes       │
│                                                     │
│   JOIN Optimization                                 │
│   ├── Smaller tables drive larger tables           │
│   ├── Ensure JOIN columns are indexed              │
│   └── Avoid unnecessary JOINs                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Best Practices Summary

| Operation | Recommendation |
|-----------|----------------|
| SELECT | Specify columns, avoid * |
| WHERE | Use indexed columns, avoid functions |
| JOIN | Ensure proper indexes exist |
| Subqueries | Consider rewriting as JOIN or CTE |
| Aggregation | Filter first, then aggregate |

---

*Mastering SQL is an essential skill for backend development.*
