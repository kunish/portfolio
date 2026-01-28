---
title: 'JavaScript 数字与 Math 对象完全指南'
description: '掌握数字类型、精度处理、Math 方法、格式化等核心技巧'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'js-number-math-guide'
---

JavaScript 中的数字处理是日常开发的基础。本文详解数字类型和 Math 对象的各种用法。

## 数字类型

### 基本概念

```javascript
// JavaScript 只有一种数字类型
const integer = 42;
const float = 3.14159;
const negative = -17;
const scientific = 1.5e6;  // 1500000

// 特殊值
const infinity = Infinity;
const negInfinity = -Infinity;
const notANumber = NaN;

// 类型检查
typeof 42;         // 'number'
typeof 3.14;       // 'number'
typeof NaN;        // 'number'
typeof Infinity;   // 'number'
```

### 数字字面量

```javascript
// 整数
const decimal = 255;       // 十进制
const hex = 0xff;          // 十六进制
const octal = 0o377;       // 八进制
const binary = 0b11111111; // 二进制

// 数字分隔符（ES2021）
const billion = 1_000_000_000;
const bytes = 0xff_ff_ff_ff;
const fraction = 0.000_001;

// BigInt（大整数）
const bigInt = 9007199254740993n;
const bigFromString = BigInt('9007199254740993');
```

### 数字范围

```javascript
// 安全整数范围
Number.MAX_SAFE_INTEGER;  // 9007199254740991 (2^53 - 1)
Number.MIN_SAFE_INTEGER;  // -9007199254740991

// 最大/最小值
Number.MAX_VALUE;  // 1.7976931348623157e+308
Number.MIN_VALUE;  // 5e-324（最小正数）

// 检查安全整数
Number.isSafeInteger(9007199254740991);  // true
Number.isSafeInteger(9007199254740992);  // false

// 精度问题示例
9007199254740992 === 9007199254740993;  // true（危险！）
```

## 数字转换

### 字符串转数字

```javascript
// parseInt - 解析整数
parseInt('42');          // 42
parseInt('42.9');        // 42
parseInt('  42  ');      // 42
parseInt('42px');        // 42
parseInt('px42');        // NaN

// 指定进制
parseInt('ff', 16);      // 255
parseInt('1010', 2);     // 10
parseInt('777', 8);      // 511

// parseFloat - 解析浮点数
parseFloat('3.14');      // 3.14
parseFloat('3.14.15');   // 3.14
parseFloat('  3.14  ');  // 3.14

// Number() - 严格转换
Number('42');      // 42
Number('42.5');    // 42.5
Number('42px');    // NaN
Number('');        // 0
Number(null);      // 0
Number(undefined); // NaN

// 一元加号（最简洁）
+'42';       // 42
+'3.14';     // 3.14
+'';         // 0
+null;       // 0
+undefined;  // NaN
```

### 数字转字符串

```javascript
const num = 42.5;

// toString
num.toString();      // '42.5'
num.toString(2);     // '101010.1'（二进制）
num.toString(16);    // '2a.8'（十六进制）

// String()
String(num);         // '42.5'

// 模板字符串
`${num}`;            // '42.5'

// toFixed - 固定小数位
(3.14159).toFixed(2);    // '3.14'
(3.1).toFixed(3);        // '3.100'

// toExponential - 科学计数法
(12345).toExponential(2);  // '1.23e+4'

// toPrecision - 指定有效数字
(3.14159).toPrecision(3);  // '3.14'
(12345).toPrecision(3);    // '1.23e+4'
```

## 数字检查

### 有效性检查

```javascript
// isNaN - 全局函数（会类型转换）
isNaN(NaN);          // true
isNaN('hello');      // true（转换后是 NaN）
isNaN(42);           // false

// Number.isNaN - 严格检查
Number.isNaN(NaN);       // true
Number.isNaN('hello');   // false（不转换）
Number.isNaN(42);        // false

// isFinite - 检查有限数
isFinite(42);         // true
isFinite(Infinity);   // false
isFinite(NaN);        // false

// Number.isFinite - 严格检查
Number.isFinite(42);      // true
Number.isFinite('42');    // false（不转换）

// Number.isInteger - 检查整数
Number.isInteger(42);     // true
Number.isInteger(42.0);   // true
Number.isInteger(42.5);   // false
```

### 比较操作

```javascript
// 相等比较
42 === 42;     // true
NaN === NaN;   // false（特殊！）

// 使用 Object.is 比较
Object.is(NaN, NaN);  // true
Object.is(0, -0);     // false

// 比较浮点数（避免直接比较）
0.1 + 0.2 === 0.3;  // false!

// 使用 epsilon 比较
function almostEqual(a, b) {
  return Math.abs(a - b) < Number.EPSILON;
}

// 或自定义容差
function nearlyEqual(a, b, tolerance = 1e-10) {
  return Math.abs(a - b) < tolerance;
}
```

## Math 对象

### 常量

```javascript
Math.PI;      // 3.141592653589793
Math.E;       // 2.718281828459045
Math.LN2;     // 0.6931471805599453
Math.LN10;    // 2.302585092994046
Math.LOG2E;   // 1.4426950408889634
Math.LOG10E;  // 0.4342944819032518
Math.SQRT2;   // 1.4142135623730951
Math.SQRT1_2; // 0.7071067811865476
```

### 取整方法

```javascript
const num = 4.7;

// floor - 向下取整
Math.floor(4.7);   // 4
Math.floor(-4.7);  // -5

// ceil - 向上取整
Math.ceil(4.3);    // 5
Math.ceil(-4.3);   // -4

// round - 四舍五入
Math.round(4.5);   // 5
Math.round(4.4);   // 4
Math.round(-4.5);  // -4（注意！）

// trunc - 截断小数
Math.trunc(4.9);   // 4
Math.trunc(-4.9);  // -4

// 保留小数位
function roundTo(num, decimals) {
  const factor = 10 ** decimals;
  return Math.round(num * factor) / factor;
}

roundTo(3.14159, 2);  // 3.14
```

### 最大/最小值

```javascript
// max / min
Math.max(1, 5, 3);     // 5
Math.min(1, 5, 3);     // 1

// 处理数组
const arr = [1, 5, 3, 9, 2];
Math.max(...arr);      // 9
Math.min(...arr);      // 1

// 空参数
Math.max();  // -Infinity
Math.min();  // Infinity

// 限制范围
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

clamp(15, 0, 10);  // 10
clamp(-5, 0, 10);  // 0
clamp(5, 0, 10);   // 5
```

### 幂和根

```javascript
// pow - 幂运算
Math.pow(2, 3);    // 8
2 ** 3;            // 8（ES2016）

// sqrt - 平方根
Math.sqrt(16);     // 4
Math.sqrt(-1);     // NaN

// cbrt - 立方根
Math.cbrt(27);     // 3

// 自然对数和指数
Math.exp(1);       // 2.718... (e^1)
Math.log(Math.E);  // 1
Math.log10(100);   // 2
Math.log2(8);      // 3

// hypot - 斜边长度
Math.hypot(3, 4);  // 5
```

### 随机数

```javascript
// random - 0 到 1 之间（不含 1）
Math.random();  // 0.xxx...

// 范围随机整数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

randomInt(1, 10);  // 1-10 之间

// 范围随机浮点数
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

randomFloat(0, 100);  // 0-100 之间

// 随机数组元素
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 打乱数组
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

### 三角函数

```javascript
// 基本三角函数（参数为弧度）
Math.sin(Math.PI / 2);  // 1
Math.cos(0);            // 1
Math.tan(Math.PI / 4);  // 1

// 反三角函数
Math.asin(1);   // 1.5707... (π/2)
Math.acos(0);   // 1.5707... (π/2)
Math.atan(1);   // 0.7853... (π/4)

// atan2 - 两点角度
Math.atan2(1, 1);  // 0.7853... (π/4)

// 双曲函数
Math.sinh(0);  // 0
Math.cosh(0);  // 1
Math.tanh(0);  // 0

// 弧度转角度
function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

// 角度转弧度
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
```

### 其他方法

```javascript
// abs - 绝对值
Math.abs(-5);    // 5

// sign - 符号
Math.sign(-5);   // -1
Math.sign(5);    // 1
Math.sign(0);    // 0

// 对数
Math.log(Math.E);    // 1
Math.log10(1000);    // 3
Math.log2(1024);     // 10
Math.log1p(0);       // 0 (ln(1+x))

// 浮点运算
Math.fround(1.5);    // 1.5 (32位浮点)
Math.imul(2, 3);     // 6 (32位整数乘法)
```

## 数字格式化

### Intl.NumberFormat

```javascript
// 基本格式化
const num = 1234567.89;

new Intl.NumberFormat('zh-CN').format(num);
// '1,234,567.89'

new Intl.NumberFormat('de-DE').format(num);
// '1.234.567,89'

// 货币格式
new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY'
}).format(num);
// '¥1,234,567.89'

new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(num);
// '$1,234,567.89'

// 百分比
new Intl.NumberFormat('zh-CN', {
  style: 'percent',
  minimumFractionDigits: 2
}).format(0.1234);
// '12.34%'

// 紧凑表示
new Intl.NumberFormat('zh-CN', {
  notation: 'compact'
}).format(1234567);
// '123万'

new Intl.NumberFormat('en-US', {
  notation: 'compact'
}).format(1234567);
// '1.2M'
```

### 自定义格式化

```javascript
// 千分位分隔
function formatNumber(num) {
  return num.toLocaleString();
}

// 保留小数位
function formatDecimal(num, digits = 2) {
  return num.toFixed(digits);
}

// 文件大小
function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

formatBytes(1234567890);  // '1.15 GB'
```

## 精度处理

### 浮点数问题

```javascript
// 经典问题
0.1 + 0.2;  // 0.30000000000000004
0.1 + 0.2 === 0.3;  // false

// 原因：二进制无法精确表示某些小数
```

### 解决方案

```javascript
// 方案1：使用整数运算
function addMoney(a, b) {
  // 转换为分进行计算
  return (a * 100 + b * 100) / 100;
}

addMoney(0.1, 0.2);  // 0.3

// 方案2：固定小数位比较
function isEqual(a, b, precision = 10) {
  return a.toFixed(precision) === b.toFixed(precision);
}

// 方案3：使用专门的库
// decimal.js, bignumber.js, big.js 等

// 方案4：epsilon 比较
function nearlyEqual(a, b, epsilon = Number.EPSILON) {
  return Math.abs(a - b) < epsilon;
}
```

## 最佳实践总结

```
数字处理最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   类型转换                                          │
│   ├── 简单转换用一元加号 +                         │
│   ├── 解析带单位字符串用 parseInt/parseFloat       │
│   └── 严格转换用 Number()                          │
│                                                     │
│   数值检查                                          │
│   ├── 用 Number.isNaN 代替 isNaN                   │
│   ├── 用 Number.isFinite 代替 isFinite             │
│   └── 大整数检查 Number.isSafeInteger              │
│                                                     │
│   精度处理                                          │
│   ├── 金融计算使用整数或专门库                     │
│   ├── 浮点比较使用 epsilon                         │
│   └── 显示时使用 toFixed                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 操作 | 推荐方法 | 示例 |
|------|----------|------|
| 取整 | Math.floor/ceil/round | Math.round(4.5) |
| 随机数 | Math.random() | randomInt(1, 10) |
| 格式化 | Intl.NumberFormat | format(12345) |
| 精度控制 | toFixed | (3.14).toFixed(1) |

---

*掌握数字处理技巧，避免常见的精度陷阱。*
