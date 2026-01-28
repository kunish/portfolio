---
title: 'JavaScript 数据结构与算法：前端开发者必备知识'
description: '掌握数组、链表、树、图等数据结构及常用算法的 JavaScript 实现'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'js-algorithms-guide'
---

数据结构与算法是编程的基础。本文探讨前端开发中常用的数据结构和算法。

## 复杂度分析

### 时间复杂度

```
常见时间复杂度：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   O(1)     → 常数时间（哈希表查找）                 │
│   O(log n) → 对数时间（二分查找）                   │
│   O(n)     → 线性时间（数组遍历）                   │
│   O(n log n) → 线性对数（排序算法）                 │
│   O(n²)    → 平方时间（嵌套循环）                   │
│   O(2ⁿ)    → 指数时间（递归斐波那契）               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 操作 | 数组 | 链表 | 哈希表 |
|------|------|------|--------|
| 访问 | O(1) | O(n) | O(1) |
| 搜索 | O(n) | O(n) | O(1) |
| 插入 | O(n) | O(1) | O(1) |
| 删除 | O(n) | O(1) | O(1) |

## 基础数据结构

### 栈 (Stack)

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

// 应用：括号匹配
function isValidParentheses(s: string): boolean {
  const stack = new Stack<string>();
  const pairs: Record<string, string> = {
    ')': '(',
    ']': '[',
    '}': '{',
  };

  for (const char of s) {
    if ('([{'.includes(char)) {
      stack.push(char);
    } else if (')]}' .includes(char)) {
      if (stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }

  return stack.isEmpty();
}
```

### 队列 (Queue)

```typescript
class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  front(): T | undefined {
    return this.items[0];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

// 应用：任务调度
class TaskScheduler {
  private queue = new Queue<() => Promise<void>>();
  private running = false;

  addTask(task: () => Promise<void>): void {
    this.queue.enqueue(task);
    this.process();
  }

  private async process(): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (!this.queue.isEmpty()) {
      const task = this.queue.dequeue();
      if (task) {
        await task();
      }
    }

    this.running = false;
  }
}
```

### 链表 (Linked List)

```typescript
class ListNode<T> {
  value: T;
  next: ListNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

class LinkedList<T> {
  private head: ListNode<T> | null = null;
  private tail: ListNode<T> | null = null;
  private length = 0;

  append(value: T): void {
    const node = new ListNode(value);
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
  }

  prepend(value: T): void {
    const node = new ListNode(value);
    node.next = this.head;
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
    this.length++;
  }

  find(value: T): ListNode<T> | null {
    let current = this.head;
    while (current) {
      if (current.value === value) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  delete(value: T): boolean {
    if (!this.head) return false;

    if (this.head.value === value) {
      this.head = this.head.next;
      if (!this.head) this.tail = null;
      this.length--;
      return true;
    }

    let current = this.head;
    while (current.next) {
      if (current.next.value === value) {
        current.next = current.next.next;
        if (!current.next) this.tail = current;
        this.length--;
        return true;
      }
      current = current.next;
    }
    return false;
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }
}

// 反转链表
function reverseList<T>(head: ListNode<T> | null): ListNode<T> | null {
  let prev: ListNode<T> | null = null;
  let current = head;

  while (current) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }

  return prev;
}
```

## 树结构

### 二叉树

```typescript
class TreeNode<T> {
  value: T;
  left: TreeNode<T> | null = null;
  right: TreeNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

// 遍历方式
function preorder<T>(node: TreeNode<T> | null, result: T[] = []): T[] {
  if (node) {
    result.push(node.value);        // 根
    preorder(node.left, result);    // 左
    preorder(node.right, result);   // 右
  }
  return result;
}

function inorder<T>(node: TreeNode<T> | null, result: T[] = []): T[] {
  if (node) {
    inorder(node.left, result);     // 左
    result.push(node.value);        // 根
    inorder(node.right, result);    // 右
  }
  return result;
}

function postorder<T>(node: TreeNode<T> | null, result: T[] = []): T[] {
  if (node) {
    postorder(node.left, result);   // 左
    postorder(node.right, result);  // 右
    result.push(node.value);        // 根
  }
  return result;
}

// 层序遍历（BFS）
function levelOrder<T>(root: TreeNode<T> | null): T[][] {
  if (!root) return [];

  const result: T[][] = [];
  const queue: TreeNode<T>[] = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    const level: T[] = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      level.push(node.value);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(level);
  }

  return result;
}
```

### 二叉搜索树

```typescript
class BinarySearchTree<T> {
  private root: TreeNode<T> | null = null;

  insert(value: T): void {
    const node = new TreeNode(value);

    if (!this.root) {
      this.root = node;
      return;
    }

    let current = this.root;
    while (true) {
      if (value < current.value) {
        if (!current.left) {
          current.left = node;
          return;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = node;
          return;
        }
        current = current.right;
      }
    }
  }

  search(value: T): boolean {
    let current = this.root;
    while (current) {
      if (value === current.value) return true;
      current = value < current.value ? current.left : current.right;
    }
    return false;
  }

  min(): T | null {
    if (!this.root) return null;
    let current = this.root;
    while (current.left) {
      current = current.left;
    }
    return current.value;
  }

  max(): T | null {
    if (!this.root) return null;
    let current = this.root;
    while (current.right) {
      current = current.right;
    }
    return current.value;
  }
}
```

## 哈希表

```typescript
class HashMap<K, V> {
  private buckets: Array<Array<[K, V]>>;
  private size = 0;
  private capacity: number;

  constructor(capacity = 16) {
    this.capacity = capacity;
    this.buckets = new Array(capacity).fill(null).map(() => []);
  }

  private hash(key: K): number {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % this.capacity;
    }
    return hash;
  }

  set(key: K, value: V): void {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    for (const pair of bucket) {
      if (pair[0] === key) {
        pair[1] = value;
        return;
      }
    }

    bucket.push([key, value]);
    this.size++;
  }

  get(key: K): V | undefined {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    for (const pair of bucket) {
      if (pair[0] === key) {
        return pair[1];
      }
    }

    return undefined;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.size--;
        return true;
      }
    }

    return false;
  }
}
```

## 排序算法

### 快速排序

```typescript
function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left: number[] = [];
  const middle: number[] = [];
  const right: number[] = [];

  for (const num of arr) {
    if (num < pivot) left.push(num);
    else if (num > pivot) right.push(num);
    else middle.push(num);
  }

  return [...quickSort(left), ...middle, ...quickSort(right)];
}
```

### 归并排序

```typescript
function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return [...result, ...left.slice(i), ...right.slice(j)];
}
```

## 搜索算法

### 二分查找

```typescript
function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1;
}

// 查找第一个大于等于 target 的位置
function lowerBound(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] < target) left = mid + 1;
    else right = mid;
  }

  return left;
}
```

## 动态规划

```typescript
// 爬楼梯
function climbStairs(n: number): number {
  if (n <= 2) return n;

  let prev = 1, curr = 2;
  for (let i = 3; i <= n; i++) {
    [prev, curr] = [curr, prev + curr];
  }
  return curr;
}

// 最长公共子序列
function longestCommonSubsequence(text1: string, text2: string): number {
  const m = text1.length, n = text2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}
```

## 最佳实践总结

```
算法学习路径：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   基础                                              │
│   ├── 数组、字符串操作                              │
│   ├── 栈、队列、链表                                │
│   ├── 哈希表                                        │
│   └── 基础排序                                      │
│                                                     │
│   进阶                                              │
│   ├── 树、图                                        │
│   ├── 递归、回溯                                    │
│   ├── 动态规划                                      │
│   └── 贪心算法                                      │
│                                                     │
│   实践建议                                          │
│   ├── 理解时间空间复杂度                            │
│   ├── 刷题巩固知识                                  │
│   ├── 分析实际应用场景                              │
│   └── 手写实现加深理解                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

*数据结构是程序的骨架，算法是程序的灵魂。*
