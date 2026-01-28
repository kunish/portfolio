---
title: 'JavaScript Numbers and Math Object Complete Guide'
description: 'Master number types, precision handling, Math methods, and formatting techniques'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'js-number-math-guide'
---

Number handling in JavaScript is fundamental to daily development. This article covers various uses of number types and the Math object.

## Number Types

### Basic Concepts

```javascript
// JavaScript has only one number type
const integer = 42;
const float = 3.14159;
const negative = -17;
const scientific = 1.5e6;  // 1500000

// Special values
const infinity = Infinity;
const negInfinity = -Infinity;
const notANumber = NaN;

// Type checking
typeof 42;         // 'number'
typeof 3.14;       // 'number'
typeof NaN;        // 'number'
typeof Infinity;   // 'number'
```

### Number Literals

```javascript
// Integers
const decimal = 255;       // Decimal
const hex = 0xff;          // Hexadecimal
const octal = 0o377;       // Octal
const binary = 0b11111111; // Binary

// Numeric separators (ES2021)
const billion = 1_000_000_000;
const bytes = 0xff_ff_ff_ff;
const fraction = 0.000_001;

// BigInt (large integers)
const bigInt = 9007199254740993n;
const bigFromString = BigInt('9007199254740993');
```

### Number Range

```javascript
// Safe integer range
Number.MAX_SAFE_INTEGER;  // 9007199254740991 (2^53 - 1)
Number.MIN_SAFE_INTEGER;  // -9007199254740991

// Maximum/minimum values
Number.MAX_VALUE;  // 1.7976931348623157e+308
Number.MIN_VALUE;  // 5e-324 (smallest positive)

// Check safe integer
Number.isSafeInteger(9007199254740991);  // true
Number.isSafeInteger(9007199254740992);  // false

// Precision issue example
9007199254740992 === 9007199254740993;  // true (dangerous!)
```

## Number Conversion

### String to Number

```javascript
// parseInt - parse integer
parseInt('42');          // 42
parseInt('42.9');        // 42
parseInt('  42  ');      // 42
parseInt('42px');        // 42
parseInt('px42');        // NaN

// Specify radix
parseInt('ff', 16);      // 255
parseInt('1010', 2);     // 10
parseInt('777', 8);      // 511

// parseFloat - parse float
parseFloat('3.14');      // 3.14
parseFloat('3.14.15');   // 3.14
parseFloat('  3.14  ');  // 3.14

// Number() - strict conversion
Number('42');      // 42
Number('42.5');    // 42.5
Number('42px');    // NaN
Number('');        // 0
Number(null);      // 0
Number(undefined); // NaN

// Unary plus (most concise)
+'42';       // 42
+'3.14';     // 3.14
+'';         // 0
+null;       // 0
+undefined;  // NaN
```

### Number to String

```javascript
const num = 42.5;

// toString
num.toString();      // '42.5'
num.toString(2);     // '101010.1' (binary)
num.toString(16);    // '2a.8' (hexadecimal)

// String()
String(num);         // '42.5'

// Template literal
`${num}`;            // '42.5'

// toFixed - fixed decimal places
(3.14159).toFixed(2);    // '3.14'
(3.1).toFixed(3);        // '3.100'

// toExponential - scientific notation
(12345).toExponential(2);  // '1.23e+4'

// toPrecision - significant digits
(3.14159).toPrecision(3);  // '3.14'
(12345).toPrecision(3);    // '1.23e+4'
```

## Number Checking

### Validity Checks

```javascript
// isNaN - global function (converts type)
isNaN(NaN);          // true
isNaN('hello');      // true (becomes NaN after conversion)
isNaN(42);           // false

// Number.isNaN - strict check
Number.isNaN(NaN);       // true
Number.isNaN('hello');   // false (no conversion)
Number.isNaN(42);        // false

// isFinite - check finite number
isFinite(42);         // true
isFinite(Infinity);   // false
isFinite(NaN);        // false

// Number.isFinite - strict check
Number.isFinite(42);      // true
Number.isFinite('42');    // false (no conversion)

// Number.isInteger - check integer
Number.isInteger(42);     // true
Number.isInteger(42.0);   // true
Number.isInteger(42.5);   // false
```

### Comparison Operations

```javascript
// Equality comparison
42 === 42;     // true
NaN === NaN;   // false (special!)

// Use Object.is for comparison
Object.is(NaN, NaN);  // true
Object.is(0, -0);     // false

// Comparing floats (avoid direct comparison)
0.1 + 0.2 === 0.3;  // false!

// Use epsilon comparison
function almostEqual(a, b) {
  return Math.abs(a - b) < Number.EPSILON;
}

// Or custom tolerance
function nearlyEqual(a, b, tolerance = 1e-10) {
  return Math.abs(a - b) < tolerance;
}
```

## Math Object

### Constants

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

### Rounding Methods

```javascript
const num = 4.7;

// floor - round down
Math.floor(4.7);   // 4
Math.floor(-4.7);  // -5

// ceil - round up
Math.ceil(4.3);    // 5
Math.ceil(-4.3);   // -4

// round - round to nearest
Math.round(4.5);   // 5
Math.round(4.4);   // 4
Math.round(-4.5);  // -4 (note!)

// trunc - truncate decimals
Math.trunc(4.9);   // 4
Math.trunc(-4.9);  // -4

// Round to decimal places
function roundTo(num, decimals) {
  const factor = 10 ** decimals;
  return Math.round(num * factor) / factor;
}

roundTo(3.14159, 2);  // 3.14
```

### Maximum/Minimum

```javascript
// max / min
Math.max(1, 5, 3);     // 5
Math.min(1, 5, 3);     // 1

// Handle arrays
const arr = [1, 5, 3, 9, 2];
Math.max(...arr);      // 9
Math.min(...arr);      // 1

// Empty arguments
Math.max();  // -Infinity
Math.min();  // Infinity

// Clamp to range
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

clamp(15, 0, 10);  // 10
clamp(-5, 0, 10);  // 0
clamp(5, 0, 10);   // 5
```

### Powers and Roots

```javascript
// pow - exponentiation
Math.pow(2, 3);    // 8
2 ** 3;            // 8 (ES2016)

// sqrt - square root
Math.sqrt(16);     // 4
Math.sqrt(-1);     // NaN

// cbrt - cube root
Math.cbrt(27);     // 3

// Natural log and exponential
Math.exp(1);       // 2.718... (e^1)
Math.log(Math.E);  // 1
Math.log10(100);   // 2
Math.log2(8);      // 3

// hypot - hypotenuse length
Math.hypot(3, 4);  // 5
```

### Random Numbers

```javascript
// random - 0 to 1 (excluding 1)
Math.random();  // 0.xxx...

// Random integer in range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

randomInt(1, 10);  // between 1-10

// Random float in range
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

randomFloat(0, 100);  // between 0-100

// Random array element
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Shuffle array
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

### Trigonometric Functions

```javascript
// Basic trig functions (arguments in radians)
Math.sin(Math.PI / 2);  // 1
Math.cos(0);            // 1
Math.tan(Math.PI / 4);  // 1

// Inverse trig functions
Math.asin(1);   // 1.5707... (π/2)
Math.acos(0);   // 1.5707... (π/2)
Math.atan(1);   // 0.7853... (π/4)

// atan2 - angle between two points
Math.atan2(1, 1);  // 0.7853... (π/4)

// Hyperbolic functions
Math.sinh(0);  // 0
Math.cosh(0);  // 1
Math.tanh(0);  // 0

// Radians to degrees
function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

// Degrees to radians
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
```

### Other Methods

```javascript
// abs - absolute value
Math.abs(-5);    // 5

// sign - sign
Math.sign(-5);   // -1
Math.sign(5);    // 1
Math.sign(0);    // 0

// Logarithms
Math.log(Math.E);    // 1
Math.log10(1000);    // 3
Math.log2(1024);     // 10
Math.log1p(0);       // 0 (ln(1+x))

// Float operations
Math.fround(1.5);    // 1.5 (32-bit float)
Math.imul(2, 3);     // 6 (32-bit integer multiplication)
```

## Number Formatting

### Intl.NumberFormat

```javascript
// Basic formatting
const num = 1234567.89;

new Intl.NumberFormat('en-US').format(num);
// '1,234,567.89'

new Intl.NumberFormat('de-DE').format(num);
// '1.234.567,89'

// Currency format
new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(num);
// '$1,234,567.89'

new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY'
}).format(num);
// '¥1,234,568'

// Percentage
new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2
}).format(0.1234);
// '12.34%'

// Compact notation
new Intl.NumberFormat('en-US', {
  notation: 'compact'
}).format(1234567);
// '1.2M'
```

### Custom Formatting

```javascript
// Thousand separators
function formatNumber(num) {
  return num.toLocaleString();
}

// Fixed decimal places
function formatDecimal(num, digits = 2) {
  return num.toFixed(digits);
}

// File size
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

## Precision Handling

### Floating Point Issues

```javascript
// Classic problem
0.1 + 0.2;  // 0.30000000000000004
0.1 + 0.2 === 0.3;  // false

// Reason: Binary cannot precisely represent some decimals
```

### Solutions

```javascript
// Solution 1: Use integer arithmetic
function addMoney(a, b) {
  // Convert to cents for calculation
  return (a * 100 + b * 100) / 100;
}

addMoney(0.1, 0.2);  // 0.3

// Solution 2: Fixed decimal comparison
function isEqual(a, b, precision = 10) {
  return a.toFixed(precision) === b.toFixed(precision);
}

// Solution 3: Use specialized libraries
// decimal.js, bignumber.js, big.js, etc.

// Solution 4: Epsilon comparison
function nearlyEqual(a, b, epsilon = Number.EPSILON) {
  return Math.abs(a - b) < epsilon;
}
```

## Best Practices Summary

```
Number Handling Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Type Conversion                                   │
│   ├── Simple conversion: use unary plus +          │
│   ├── Parse strings with units: parseInt/parseFloat│
│   └── Strict conversion: use Number()              │
│                                                     │
│   Value Checking                                    │
│   ├── Use Number.isNaN instead of isNaN            │
│   ├── Use Number.isFinite instead of isFinite      │
│   └── Check large integers: Number.isSafeInteger   │
│                                                     │
│   Precision Handling                                │
│   ├── Financial: use integers or specialized libs  │
│   ├── Float comparison: use epsilon                │
│   └── Display: use toFixed                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Operation | Recommended Method | Example |
|-----------|-------------------|---------|
| Rounding | Math.floor/ceil/round | Math.round(4.5) |
| Random | Math.random() | randomInt(1, 10) |
| Formatting | Intl.NumberFormat | format(12345) |
| Precision | toFixed | (3.14).toFixed(1) |

---

*Master number handling techniques to avoid common precision pitfalls.*
