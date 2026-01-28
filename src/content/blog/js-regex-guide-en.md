---
title: 'JavaScript Regular Expressions Complete Guide'
description: 'Master regular expressions: syntax basics, pattern matching, capture groups, assertions, and practical applications'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'js-regex-guide'
---

Regular expressions are powerful tools for string processing. This article covers JavaScript regex syntax and practical techniques.

## Basic Syntax

### Creating Regular Expressions

```javascript
// Literal notation
const regex1 = /pattern/flags;

// Constructor notation
const regex2 = new RegExp('pattern', 'flags');

// Examples
const emailRegex = /^\w+@\w+\.\w+$/;
const dynamicRegex = new RegExp(`user_${userId}`, 'i');
```

### Common Flags

```javascript
// g - Global match
'hello hello'.match(/hello/g); // ['hello', 'hello']

// i - Case insensitive
/hello/i.test('HELLO'); // true

// m - Multiline mode
/^start/m.test('line1\nstart'); // true

// s - Dotall mode (dot matches newline)
/a.b/s.test('a\nb'); // true

// u - Unicode mode
/\u{1F600}/u.test('😀'); // true

// y - Sticky match
const sticky = /foo/y;
sticky.lastIndex = 3;
sticky.test('xxxfoo'); // true

// Combined flags
const regex = /pattern/gim;
```

### Metacharacters

```javascript
// . - Match any single character (except newline)
/a.c/.test('abc'); // true
/a.c/.test('a\nc'); // false

// ^ - Match start
/^hello/.test('hello world'); // true

// $ - Match end
/world$/.test('hello world'); // true

// | - Alternation
/cat|dog/.test('I have a cat'); // true

// \ - Escape special characters
/\$100/.test('$100'); // true
/1\+1/.test('1+1'); // true
```

### Character Classes

```javascript
// [abc] - Match any character in brackets
/[aeiou]/.test('hello'); // true

// [^abc] - Match any character NOT in brackets
/[^0-9]/.test('abc'); // true

// [a-z] - Range matching
/[a-zA-Z]/.test('Hello'); // true

// Predefined character classes
/\d/.test('123');     // true - Digits [0-9]
/\D/.test('abc');     // true - Non-digits [^0-9]
/\w/.test('hello');   // true - Word characters [a-zA-Z0-9_]
/\W/.test('@#$');     // true - Non-word characters
/\s/.test(' \t\n');   // true - Whitespace
/\S/.test('abc');     // true - Non-whitespace

// Boundary matching
/\bword\b/.test('a word here'); // true - Word boundary
/\Bword/.test('sword'); // true - Non-word boundary
```

### Quantifiers

```javascript
// * - Zero or more
/ab*c/.test('ac');    // true
/ab*c/.test('abbc');  // true

// + - One or more
/ab+c/.test('ac');    // false
/ab+c/.test('abc');   // true

// ? - Zero or one
/colou?r/.test('color');  // true
/colou?r/.test('colour'); // true

// {n} - Exactly n times
/a{3}/.test('aaa');   // true
/a{3}/.test('aa');    // false

// {n,} - At least n times
/a{2,}/.test('aaa');  // true

// {n,m} - Between n and m times
/a{2,4}/.test('aaa'); // true

// Greedy vs Non-greedy
'<div>content</div>'.match(/<.*>/);   // ['<div>content</div>']
'<div>content</div>'.match(/<.*?>/);  // ['<div>']
```

## Groups and Capturing

### Capture Groups

```javascript
// Basic capture groups
const match = /(\d{4})-(\d{2})-(\d{2})/.exec('2025-01-28');
console.log(match[0]); // '2025-01-28' - Full match
console.log(match[1]); // '2025' - First capture group
console.log(match[2]); // '01' - Second capture group
console.log(match[3]); // '28' - Third capture group

// Using match
const result = 'hello world'.match(/(\w+) (\w+)/);
console.log(result[1], result[2]); // 'hello' 'world'

// Nested capture groups
const nested = /((a)(b))/.exec('ab');
console.log(nested[1]); // 'ab'
console.log(nested[2]); // 'a'
console.log(nested[3]); // 'b'
```

### Named Capture Groups

```javascript
// ES2018 named capture groups
const dateRegex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = dateRegex.exec('2025-01-28');

console.log(match.groups.year);  // '2025'
console.log(match.groups.month); // '01'
console.log(match.groups.day);   // '28'

// Destructuring
const { groups: { year, month, day } } = dateRegex.exec('2025-01-28');

// Using in replacement
'2025-01-28'.replace(dateRegex, '$<month>/$<day>/$<year>');
// '01/28/2025'
```

### Non-Capturing Groups

```javascript
// (?:pattern) - Group without capturing
const regex = /(?:https?|ftp):\/\/(\w+)/;
const match = regex.exec('https://example');

console.log(match[0]); // 'https://example'
console.log(match[1]); // 'example' - Only one capture group
```

### Backreferences

```javascript
// \n references the nth capture group
const duplicateWords = /(\w+)\s+\1/;
duplicateWords.test('hello hello'); // true
duplicateWords.test('hello world'); // false

// Named backreference
const repeat = /(?<word>\w+)\s+\k<word>/;
repeat.test('the the'); // true

// Match quoted content (matching quotes)
const quoted = /(['"]).*?\1/;
quoted.test('"hello"'); // true
quoted.test("'hello'"); // true
quoted.test('"hello\''); // false
```

## Assertions

### Lookahead Assertions

```javascript
// Positive lookahead (?=pattern)
// Match position followed by pattern
/\d+(?=元)/.exec('100元'); // ['100']
/\d+(?=元)/.exec('100USD'); // null

// Negative lookahead (?!pattern)
// Match position NOT followed by pattern
/\d+(?!元)/.exec('100USD'); // ['100']
/\d+(?!元)/.exec('100元'); // ['10'] - Matches digits not before "元"
```

### Lookbehind Assertions

```javascript
// Positive lookbehind (?<=pattern) - ES2018
// Match position preceded by pattern
/(?<=\$)\d+/.exec('$100'); // ['100']
/(?<=\$)\d+/.exec('€100'); // null

// Negative lookbehind (?<!pattern)
// Match position NOT preceded by pattern
/(?<!\$)\d+/.exec('€100'); // ['100']
```

### Practical Examples

```javascript
// Password strength check (must contain upper, lower, digit)
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
strongPassword.test('Password123'); // true
strongPassword.test('password123'); // false

// Extract numbers not in quotes
const notInQuotes = /(?<!['"]\d*)\d+(?!\d*['"])/g;

// Thousand separator formatting
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
formatNumber(1234567); // '1,234,567'
```

## Common Methods

### RegExp Methods

```javascript
const regex = /hello/g;

// test - Test if matches
regex.test('hello world'); // true

// exec - Execute match
let match;
const str = 'hello hello';
regex.lastIndex = 0; // Reset index

while ((match = regex.exec(str)) !== null) {
  console.log(`Found ${match[0]} at ${match.index}`);
}
// Found hello at 0
// Found hello at 6
```

### String Methods

```javascript
const str = 'hello world hello';

// match - Return matches
str.match(/hello/g); // ['hello', 'hello']
str.match(/hello/);  // ['hello', index: 0, ...]

// matchAll - Return iterator (ES2020)
for (const match of str.matchAll(/hello/g)) {
  console.log(match.index, match[0]);
}

// search - Return first match index
str.search(/world/); // 6

// replace - Replace
str.replace(/hello/g, 'hi'); // 'hi world hi'

// replaceAll - Replace all (ES2021)
str.replaceAll('hello', 'hi'); // 'hi world hi'

// split - Split
'a,b;c|d'.split(/[,;|]/); // ['a', 'b', 'c', 'd']
```

### Replacement Callbacks

```javascript
// Using function as replacement
const result = 'hello world'.replace(/(\w+)/g, (match, p1, offset) => {
  return p1.toUpperCase();
});
// 'HELLO WORLD'

// Template string conversion
const template = 'Hello, {{name}}! Today is {{day}}.';
const data = { name: 'Alice', day: 'Monday' };

const output = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
  return data[key] || match;
});
// 'Hello, Alice! Today is Monday.'
```

## Practical Applications

### Form Validation

```javascript
const validators = {
  // Email
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Phone (US)
  phone: /^(\+1)?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,

  // SSN
  ssn: /^\d{3}-\d{2}-\d{4}$/,

  // URL
  url: /^https?:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/,

  // IP Address
  ip: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,

  // Strong Password
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

  // Username
  username: /^[a-zA-Z][a-zA-Z0-9_]{2,15}$/,

  // Zip Code (US)
  zipCode: /^\d{5}(-\d{4})?$/
};

function validate(type, value) {
  return validators[type]?.test(value) ?? false;
}

validate('email', 'test@example.com'); // true
validate('phone', '(555) 123-4567'); // true
```

### Text Processing

```javascript
// Extract all links
function extractLinks(html) {
  const regex = /href=["']([^"']+)["']/g;
  const links = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    links.push(match[1]);
  }

  return links;
}

// Strip HTML tags
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '');
}

// Case conversion
function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
camelToKebab('backgroundColor'); // 'background-color'

function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
kebabToCamel('background-color'); // 'backgroundColor'

// Title case
function capitalize(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}
capitalize('hello world'); // 'Hello World'

// Compress whitespace
function compressWhitespace(str) {
  return str.replace(/\s+/g, ' ').trim();
}
```

### Data Extraction

```javascript
// Parse URL parameters
function parseQuery(url) {
  const params = {};
  const regex = /[?&]([^=&]+)=([^&]*)/g;
  let match;

  while ((match = regex.exec(url)) !== null) {
    params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
  }

  return params;
}
parseQuery('https://example.com?name=test&id=123');
// { name: 'test', id: '123' }

// Parse CSV
function parseCSV(csv) {
  const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
  const rows = csv.split('\n');

  return rows.map(row => {
    const values = [];
    let match;

    while ((match = regex.exec(row)) !== null) {
      values.push(match[1]?.replace(/""/g, '"') ?? match[2] ?? '');
    }

    return values;
  });
}

// Log parsing
function parseLog(log) {
  const regex = /\[(?<timestamp>[^\]]+)\]\s+(?<level>\w+)\s+(?<message>.*)/;
  const match = regex.exec(log);

  return match?.groups ?? null;
}
parseLog('[2025-01-28 10:30:00] ERROR Connection failed');
// { timestamp: '2025-01-28 10:30:00', level: 'ERROR', message: 'Connection failed' }
```

### Syntax Highlighting

```javascript
function highlightCode(code) {
  const rules = [
    // Keywords
    { pattern: /\b(const|let|var|function|return|if|else|for|while)\b/g, class: 'keyword' },
    // Strings
    { pattern: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, class: 'string' },
    // Numbers
    { pattern: /\b\d+\.?\d*\b/g, class: 'number' },
    // Comments
    { pattern: /\/\/.*$/gm, class: 'comment' },
    { pattern: /\/\*[\s\S]*?\*\//g, class: 'comment' }
  ];

  let result = code;

  rules.forEach(({ pattern, class: className }) => {
    result = result.replace(pattern, `<span class="${className}">$&</span>`);
  });

  return result;
}
```

## Performance Optimization

### Avoiding Backtracking Traps

```javascript
// Dangerous pattern - may cause catastrophic backtracking
const dangerous = /a+a+b/;

// Optimized version
const optimized = /a{2,}b/;

// Simulating atomic groups with lookahead
// Match without backtracking
const atomic = /(?=(\d+))\1/;

// Alternative to possessive quantifiers
// Original: /\d++/ (supported in other languages)
// JS alternative: Control logic to avoid backtracking
```

### Regex Optimization Tips

```javascript
// 1. Pre-compile regex
const emailRegex = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;

function validateEmail(email) {
  return emailRegex.test(email); // Reuse compiled regex
}

// 2. Be specific with patterns
// Bad: /.*?pattern/
// Good: /[^p]*pattern/ or /[\s\S]*?pattern/

// 3. Use non-capturing groups
// Bad: /(foo|bar|baz)/
// Good: /(?:foo|bar|baz)/

// 4. Anchor patterns
// Bad: /pattern/
// Good: /^pattern$/ or /\bpattern\b/

// 5. Extract common prefixes
// Bad: /javascript|javafx|java/
// Good: /java(?:script|fx)?/
```

## Best Practices Summary

```
Regular Expression Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Readability                                       │
│   ├── Use named capture groups                     │
│   ├── Add comments for explanation                 │
│   ├── Split complex regex                          │
│   └── Use RegExp constructor for composition       │
│                                                     │
│   Performance                                       │
│   ├── Pre-compile regular expressions              │
│   ├── Avoid backtracking traps                     │
│   ├── Use specific character classes              │
│   └── Anchor match positions                       │
│                                                     │
│   Security                                          │
│   ├── Validate user-provided regex                 │
│   ├── Set matching timeouts                        │
│   ├── Limit regex complexity                       │
│   └── Prevent ReDoS attacks                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach |
|----------|---------------------|
| Simple matching | String methods includes/indexOf |
| Complex patterns | Regular expressions |
| Dynamic patterns | RegExp constructor |
| Multiple uses | Pre-compile and store |

---

*Master regular expressions to unlock powerful text processing capabilities.*
