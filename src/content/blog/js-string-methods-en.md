---
title: 'JavaScript String Methods Complete Guide'
description: 'Master string searching, slicing, transformation, formatting and template literal techniques'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'js-string-methods'
---

String manipulation is one of the most common tasks in daily development. This article covers all practical JavaScript string methods.

## Basic Operations

### Creating Strings

```javascript
// Literals
const str1 = 'Hello';
const str2 = "World";
const str3 = `Template`;

// Constructor (not recommended)
const str4 = new String('Hello');  // String object

// Template literals
const name = 'Alice';
const greeting = `Hello, ${name}!`;  // "Hello, Alice!"

// Multi-line strings
const multiline = `
  Line one
  Line two
  Line three
`;
```

### Accessing Characters

```javascript
const str = 'Hello';

// Index access
str[0];            // 'H'
str[str.length - 1];  // 'o'

// charAt method
str.charAt(0);     // 'H'
str.charAt(10);    // '' (empty string)

// charCodeAt - get character code
str.charCodeAt(0);  // 72 (ASCII code for H)

// codePointAt - supports Unicode
'😀'.codePointAt(0);  // 128512

// Iterate characters
for (const char of str) {
  console.log(char);
}

// Convert to array
[...'Hello'];  // ['H', 'e', 'l', 'l', 'o']
```

## Search Methods

### indexOf and lastIndexOf

```javascript
const str = 'Hello World Hello';

// indexOf - find first occurrence
str.indexOf('o');        // 4
str.indexOf('o', 5);     // 7 (start from index 5)
str.indexOf('xyz');      // -1 (not found)

// lastIndexOf - search from end
str.lastIndexOf('o');    // 16
str.lastIndexOf('Hello');  // 12
```

### includes, startsWith, endsWith

```javascript
const str = 'Hello World';

// includes - contains substring
str.includes('World');   // true
str.includes('world');   // false (case sensitive)
str.includes('o', 5);    // true (start from index 5)

// startsWith - starts with
str.startsWith('Hello'); // true
str.startsWith('World', 6);  // true (check from index 6)

// endsWith - ends with
str.endsWith('World');   // true
str.endsWith('Hello', 5);  // true (check first 5 chars only)
```

### search and match

```javascript
const str = 'The price is $100.00';

// search - regex search, returns index
str.search(/\d+/);       // 14

// match - returns match result
str.match(/\d+/);        // ['100']
str.match(/\d+/g);       // ['100', '00']

// matchAll - returns iterator
const matches = [...str.matchAll(/\d+/g)];
// [['100', index: 14, ...], ['00', index: 18, ...]]
```

## Slicing Methods

### slice

```javascript
const str = 'Hello World';

str.slice(0, 5);    // 'Hello'
str.slice(6);       // 'World'
str.slice(-5);      // 'World' (negative counts from end)
str.slice(-5, -1);  // 'Worl'
str.slice(6, 3);    // '' (start > end returns empty)
```

### substring

```javascript
const str = 'Hello World';

str.substring(0, 5);   // 'Hello'
str.substring(6);      // 'World'
str.substring(6, 0);   // 'Hello' (swaps if start > end)
str.substring(-5);     // 'Hello World' (negative treated as 0)
```

### substr (Deprecated)

```javascript
// Not recommended but still works
const str = 'Hello World';

str.substr(0, 5);   // 'Hello' (start, length)
str.substr(6, 5);   // 'World'
str.substr(-5, 5);  // 'World'
```

## Transformation Methods

### Case Conversion

```javascript
const str = 'Hello World';

str.toUpperCase();       // 'HELLO WORLD'
str.toLowerCase();       // 'hello world'

// Locale-aware conversion
'ß'.toLocaleUpperCase('de');  // 'SS' (German)

// Capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
capitalize('hELLO');  // 'Hello'
```

### Trimming Whitespace

```javascript
const str = '  Hello World  ';

str.trim();         // 'Hello World'
str.trimStart();    // 'Hello World  '
str.trimEnd();      // '  Hello World'

// Custom character trimming
function customTrim(str, char) {
  const regex = new RegExp(`^${char}+|${char}+$`, 'g');
  return str.replace(regex, '');
}
customTrim('---Hello---', '-');  // 'Hello'
```

### Padding

```javascript
const str = '5';

// padStart - pad at beginning
str.padStart(3, '0');    // '005'
str.padStart(3);         // '  5' (default space)

// padEnd - pad at end
str.padEnd(3, '0');      // '500'

// Practical example
function formatTime(h, m, s) {
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}
formatTime(9, 5, 3);  // '09:05:03'
```

### Repeating

```javascript
'abc'.repeat(3);     // 'abcabcabc'
'Hello '.repeat(2);  // 'Hello Hello '

// Separator line
'-'.repeat(50);
```

## Splitting and Joining

### split

```javascript
const str = 'apple,banana,orange';

str.split(',');          // ['apple', 'banana', 'orange']
str.split(',', 2);       // ['apple', 'banana'] (limit count)

// Regex split
'a1b2c3'.split(/\d/);    // ['a', 'b', 'c', '']

// Split into characters
'Hello'.split('');       // ['H', 'e', 'l', 'l', 'o']

// Keep separators
'a1b2c3'.split(/(\d)/);  // ['a', '1', 'b', '2', 'c', '3', '']
```

### join (Array Method)

```javascript
const arr = ['apple', 'banana', 'orange'];

arr.join(',');    // 'apple,banana,orange'
arr.join(' - ');  // 'apple - banana - orange'
arr.join('');     // 'applebananaorange'
```

### concat

```javascript
const str = 'Hello';

str.concat(' ', 'World');  // 'Hello World'
str.concat('!');           // 'Hello!'

// Prefer + or template literals
'Hello' + ' ' + 'World';
`Hello World`;
```

## Replacement Methods

### replace

```javascript
const str = 'Hello World World';

// Replace first match
str.replace('World', 'JavaScript');
// 'Hello JavaScript World'

// Global replace with regex
str.replace(/World/g, 'JavaScript');
// 'Hello JavaScript JavaScript'

// Replacement function
str.replace(/\w+/g, match => match.toUpperCase());
// 'HELLO WORLD WORLD'

// Using capture groups
'John Smith'.replace(/(\w+) (\w+)/, '$2, $1');
// 'Smith, John'
```

### replaceAll

```javascript
const str = 'Hello World World';

str.replaceAll('World', 'JavaScript');
// 'Hello JavaScript JavaScript'

// Equivalent to replace with /g flag
str.replace(/World/g, 'JavaScript');
```

## Advanced Template Literals

### Tagged Templates

```javascript
// Custom tag function
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i] ? `<mark>${values[i]}</mark>` : '';
    return result + str + value;
  }, '');
}

const name = 'Alice';
const age = 25;

highlight`Name: ${name}, Age: ${age}`;
// 'Name: <mark>Alice</mark>, Age: <mark>25</mark>'

// HTML escaping
function escapeHTML(strings, ...values) {
  const escape = str => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return strings.reduce((result, str, i) => {
    const value = values[i] ? escape(String(values[i])) : '';
    return result + str + value;
  }, '');
}
```

### Internationalization

```javascript
// Intl.Segmenter (ES2022)
const segmenter = new Intl.Segmenter('en', { granularity: 'word' });
const text = 'Hello World';
const segments = [...segmenter.segment(text)];
// Word segmentation result

// Locale-aware comparison
const collator = new Intl.Collator('en');
['banana', 'apple', 'cherry'].sort(collator.compare);
```

## Utility Functions

```javascript
// Camel to kebab case
function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
camelToKebab('backgroundColor');  // 'background-color'

// Kebab to camel case
function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
kebabToCamel('background-color');  // 'backgroundColor'

// Truncate string
function truncate(str, length, suffix = '...') {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}
truncate('Hello World', 8);  // 'Hello...'

// Strip HTML tags
function stripTags(html) {
  return html.replace(/<[^>]*>/g, '');
}
```

## Best Practices Summary

```
String Method Selection Guide:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Search Choice                                     │
│   ├── Simple contains → includes                   │
│   ├── Get position → indexOf                       │
│   └── Complex patterns → match / search            │
│                                                     │
│   Slicing Choice                                    │
│   ├── Recommended → slice                          │
│   ├── Need param swap → substring                  │
│   └── Avoid → substr                               │
│                                                     │
│   Replacement Choice                                │
│   ├── Single replace → replace                     │
│   ├── Replace all → replaceAll / replace + /g      │
│   └── Complex transform → replace + function       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Method | Purpose | Returns |
|--------|---------|---------|
| slice | Extract substring | New string |
| split | Split to array | Array |
| replace | Replace content | New string |
| trim | Remove whitespace | New string |

---

*Master string methods for effortless text manipulation.*
