---
title: 'Regular Expressions Complete Guide: From Basics to Practice'
description: 'Master regex syntax, common patterns, performance optimization and practical applications'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'regex-guide'
---

Regular expressions are a powerful tool for text processing. This article explores regex syntax and practical applications.

## Basic Syntax

### Character Matching

```javascript
// Literal characters
/hello/      // Matches "hello"
/123/        // Matches "123"

// Escape special characters
/\./         // Matches "."
/\$/         // Matches "$"
/\*/         // Matches "*"

// Dot matches any single character
/h.llo/      // Matches "hello", "hallo", "h1llo" etc.
```

### Character Classes

```javascript
// Character sets
/[abc]/      // Matches a, b, or c
/[a-z]/      // Matches any lowercase letter
/[A-Z]/      // Matches any uppercase letter
/[0-9]/      // Matches any digit
/[a-zA-Z]/   // Matches any letter

// Negated character set
/[^abc]/     // Matches any character except a, b, c
/[^0-9]/     // Matches non-digit character

// Predefined character classes
/\d/         // Digit, same as [0-9]
/\D/         // Non-digit, same as [^0-9]
/\w/         // Word character, same as [a-zA-Z0-9_]
/\W/         // Non-word character
/\s/         // Whitespace (space, tab, newline, etc.)
/\S/         // Non-whitespace
```

### Quantifiers

```javascript
// Exact quantity
/a{3}/       // Matches "aaa"
/a{2,4}/     // Matches "aa", "aaa", "aaaa"
/a{2,}/      // Matches 2 or more a's

// Common quantifiers
/a*/         // 0 or more a's
/a+/         // 1 or more a's
/a?/         // 0 or 1 a

// Greedy vs Non-greedy
/a+/         // Greedy, matches as many as possible
/a+?/        // Non-greedy, matches as few as possible

// Example
const text = '<div>content</div>';
text.match(/<.+>/);   // ["<div>content</div>"] greedy
text.match(/<.+?>/);  // ["<div>"] non-greedy
```

### Anchors

```javascript
// Position anchors
/^hello/     // Starts with hello
/world$/     // Ends with world
/^hello$/    // Exactly matches hello

// Word boundaries
/\bword\b/   // Matches standalone word "word"
/\Bword/     // Matches word not at word boundary

// Example
'hello world'.match(/\bworld\b/);  // ["world"]
'helloworld'.match(/\bworld\b/);   // null
```

## Groups and References

### Capturing Groups

```javascript
// Basic grouping
/(ab)+/      // Matches "ab", "abab", "ababab" etc.

// Capturing group reference
const regex = /(\w+)\s(\w+)/;
const match = 'hello world'.match(regex);
// match[0] = "hello world"
// match[1] = "hello"
// match[2] = "world"

// Use in replacement
'hello world'.replace(/(\w+)\s(\w+)/, '$2 $1');
// "world hello"
```

### Named Capturing Groups

```javascript
// ES2018 named groups
const regex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = '2025-01-28'.match(regex);

console.log(match.groups.year);   // "2025"
console.log(match.groups.month);  // "01"
console.log(match.groups.day);    // "28"

// Named reference in replacement
'2025-01-28'.replace(
  /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/,
  '$<day>/$<month>/$<year>'
);
// "28/01/2025"
```

### Non-Capturing Groups

```javascript
// Group without capturing
/(?:ab)+/    // Matches but doesn't capture

// Comparison
'ababab'.match(/(ab)+/);    // ["ababab", "ab"]
'ababab'.match(/(?:ab)+/);  // ["ababab"]
```

### Backreferences

```javascript
// Reference previous capturing group
/(\w+)\s\1/  // Matches repeated words

'hello hello'.match(/(\w+)\s\1/);  // ["hello hello", "hello"]
'hello world'.match(/(\w+)\s\1/);  // null

// Match quoted content
/(['"]).*?\1/   // Matches single or double quoted content
```

## Assertions

### Lookahead

```javascript
// Positive lookahead: followed by
/foo(?=bar)/   // Matches foo followed by bar
'foobar'.match(/foo(?=bar)/);  // ["foo"]
'foobaz'.match(/foo(?=bar)/);  // null

// Negative lookahead: not followed by
/foo(?!bar)/   // Matches foo not followed by bar
'foobaz'.match(/foo(?!bar)/);  // ["foo"]
'foobar'.match(/foo(?!bar)/);  // null
```

### Lookbehind

```javascript
// Positive lookbehind: preceded by
/(?<=\$)\d+/   // Matches digits preceded by $
'$100'.match(/(?<=\$)\d+/);  // ["100"]
'€100'.match(/(?<=\$)\d+/);  // null

// Negative lookbehind: not preceded by
/(?<!\$)\d+/   // Matches digits not preceded by $
'€100'.match(/(?<!\$)\d+/);  // ["100"]
```

## Flags

### Common Flags

```javascript
// g - Global match
'hello hello'.match(/hello/);   // ["hello"]
'hello hello'.match(/hello/g);  // ["hello", "hello"]

// i - Case insensitive
'Hello'.match(/hello/);   // null
'Hello'.match(/hello/i);  // ["Hello"]

// m - Multiline mode
const text = 'line1\nline2';
text.match(/^line/gm);  // ["line", "line"]

// s - Dot matches newline
'a\nb'.match(/a.b/);   // null
'a\nb'.match(/a.b/s);  // ["a\nb"]

// u - Unicode mode
'😀'.match(/./);   // ["\ud83d"]
'😀'.match(/./u);  // ["😀"]
```

## Common Regex Patterns

### Validation Patterns

```javascript
// Email
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// URL
const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

// US Phone
const phoneRegex = /^\+?1?\s*\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

// Password (min 8 chars, upper, lower, digit)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

// IPv4 Address
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
```

### Extraction Patterns

```javascript
// Extract numbers
const extractNumbers = (str: string) => str.match(/\d+/g) || [];

// Extract URLs
const extractUrls = (str: string) =>
  str.match(/https?:\/\/[^\s]+/g) || [];

// Extract hashtags
const extractTags = (str: string) =>
  str.match(/#\w+/g) || [];
```

### Replacement Patterns

```javascript
// camelCase to kebab-case
const camelToKebab = (str: string) =>
  str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

// kebab-case to camelCase
const kebabToCamel = (str: string) =>
  str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

// Capitalize words
const capitalize = (str: string) =>
  str.replace(/\b\w/g, c => c.toUpperCase());

// Strip HTML tags
const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, '');

// Format number with commas
const formatNumber = (num: number) =>
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
```

## JavaScript RegExp Methods

### Testing and Matching

```javascript
const regex = /hello/gi;
const str = 'Hello World, hello!';

// test() - returns boolean
regex.test(str);  // true

// match() - returns match array
str.match(regex);  // ["Hello", "hello"]

// matchAll() - returns iterator (needs g flag)
const matches = [...str.matchAll(/hello/gi)];
matches[0].index;  // 0
matches[1].index;  // 13

// search() - returns index
str.search(/hello/i);  // 0

// replace() and replaceAll()
str.replace(/hello/gi, 'hi');     // "hi World, hi!"
str.replaceAll(/hello/gi, 'hi');  // "hi World, hi!"

// split() - split string
'a,b;c d'.split(/[,;\s]/);  // ["a", "b", "c", "d"]
```

### RegExp Object

```javascript
// Constructor (dynamic creation)
const pattern = 'hello';
const regex = new RegExp(pattern, 'gi');

// Properties
regex.source;      // "hello"
regex.flags;       // "gi"
regex.global;      // true
regex.ignoreCase;  // true
regex.lastIndex;   // 0

// Iterate matches with while loop
const str = 'hello hello';
const re = /hello/g;
let result;
while ((result = re.test(str)) !== false) {
  console.log('Found at:', re.lastIndex);
  if (re.lastIndex === 0) break;
}
```

## Performance Optimization

### Avoid Catastrophic Backtracking

```javascript
// Dangerous pattern (exponential backtracking)
/^(a+)+$/      // Very slow for "aaaaaaaaaaaaaaX"

// Safe alternative
/^a+$/         // Simplified pattern
```

### Optimization Tips

```
Regular Expression Optimization:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Writing Tips                                      │
│   ├── Be as specific as possible                   │
│   ├── Avoid nested quantifiers                     │
│   ├── Use non-capturing groups (?:...)             │
│   └── Anchor start and end                         │
│                                                     │
│   Performance                                       │
│   ├── Pre-compile and reuse regex                  │
│   ├── Avoid creating in loops                      │
│   ├── Use string methods for simple matches        │
│   └── Test edge cases                              │
│                                                     │
│   Readability                                       │
│   ├── Use named capturing groups                   │
│   ├── Add comments for explanation                 │
│   └── Split complex patterns                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Best Practices Summary

| Symbol | Meaning |
|--------|---------|
| `.` | Any single character |
| `*` | 0 or more |
| `+` | 1 or more |
| `?` | 0 or 1 |
| `^` | Start |
| `$` | End |
| `\d` | Digit |
| `\w` | Word character |
| `\s` | Whitespace |

---

*Regular expressions are the programmer's Swiss Army knife.*
