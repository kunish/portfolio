---
title: 'JavaScript Data Structures and Algorithms: Essential Knowledge for Frontend Developers'
description: 'Master arrays, linked lists, trees, graphs and common algorithm implementations in JavaScript'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'js-algorithms-guide'
---

Data structures and algorithms are the foundation of programming. This article explores commonly used data structures and algorithms in frontend development.

## Complexity Analysis

### Time Complexity

```
Common Time Complexities:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   O(1)     → Constant time (hash table lookup)     │
│   O(log n) → Logarithmic time (binary search)      │
│   O(n)     → Linear time (array traversal)         │
│   O(n log n) → Linearithmic (sorting algorithms)   │
│   O(n²)    → Quadratic time (nested loops)         │
│   O(2ⁿ)    → Exponential (recursive fibonacci)     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Operation | Array | Linked List | Hash Table |
|-----------|-------|-------------|------------|
| Access | O(1) | O(n) | O(1) |
| Search | O(n) | O(n) | O(1) |
| Insert | O(n) | O(1) | O(1) |
| Delete | O(n) | O(1) | O(1) |

## Basic Data Structures

### Stack

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

// Application: Parentheses matching
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
    } else if (')]}'.includes(char)) {
      if (stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }

  return stack.isEmpty();
}
```

### Queue

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

// Application: Task scheduling
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

### Linked List

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

// Reverse linked list
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

## Tree Structures

### Binary Tree

```typescript
class TreeNode<T> {
  value: T;
  left: TreeNode<T> | null = null;
  right: TreeNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

// Traversal methods
function preorder<T>(node: TreeNode<T> | null, result: T[] = []): T[] {
  if (node) {
    result.push(node.value);        // Root
    preorder(node.left, result);    // Left
    preorder(node.right, result);   // Right
  }
  return result;
}

function inorder<T>(node: TreeNode<T> | null, result: T[] = []): T[] {
  if (node) {
    inorder(node.left, result);     // Left
    result.push(node.value);        // Root
    inorder(node.right, result);    // Right
  }
  return result;
}

function postorder<T>(node: TreeNode<T> | null, result: T[] = []): T[] {
  if (node) {
    postorder(node.left, result);   // Left
    postorder(node.right, result);  // Right
    result.push(node.value);        // Root
  }
  return result;
}

// Level order traversal (BFS)
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

### Binary Search Tree

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

## Hash Map

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

## Sorting Algorithms

### Quick Sort

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

### Merge Sort

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

## Search Algorithms

### Binary Search

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

// Find first position >= target
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

## Dynamic Programming

```typescript
// Climbing stairs
function climbStairs(n: number): number {
  if (n <= 2) return n;

  let prev = 1, curr = 2;
  for (let i = 3; i <= n; i++) {
    [prev, curr] = [curr, prev + curr];
  }
  return curr;
}

// Longest common subsequence
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

## Best Practices Summary

```
Algorithm Learning Path:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Fundamentals                                      │
│   ├── Array, string operations                     │
│   ├── Stack, queue, linked list                    │
│   ├── Hash table                                   │
│   └── Basic sorting                                │
│                                                     │
│   Advanced                                          │
│   ├── Trees, graphs                                │
│   ├── Recursion, backtracking                      │
│   ├── Dynamic programming                          │
│   └── Greedy algorithms                            │
│                                                     │
│   Practice Tips                                     │
│   ├── Understand time/space complexity             │
│   ├── Practice problems regularly                  │
│   ├── Analyze real-world applications              │
│   └── Implement by hand for deeper understanding   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

*Data structures are the skeleton of programs, algorithms are the soul.*
