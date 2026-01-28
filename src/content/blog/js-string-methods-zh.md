---
title: 'JavaScript 字符串方法完全指南'
description: '掌握字符串查找、截取、转换、格式化等常用方法及模板字符串技巧'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'js-string-methods'
---

字符串处理是日常开发中最常见的任务。本文详解 JavaScript 字符串的所有实用方法。

## 基础操作

### 字符串创建

```javascript
// 字面量
const str1 = 'Hello';
const str2 = "World";
const str3 = `Template`;

// 构造函数（不推荐）
const str4 = new String('Hello');  // String 对象

// 模板字符串
const name = 'Alice';
const greeting = `Hello, ${name}!`;  // "Hello, Alice!"

// 多行字符串
const multiline = `
  第一行
  第二行
  第三行
`;
```

### 访问字符

```javascript
const str = 'Hello';

// 索引访问
str[0];            // 'H'
str[str.length - 1];  // 'o'

// charAt 方法
str.charAt(0);     // 'H'
str.charAt(10);    // '' (空字符串)

// charCodeAt - 获取字符编码
str.charCodeAt(0);  // 72 (H 的 ASCII 码)

// codePointAt - 支持 Unicode
'😀'.codePointAt(0);  // 128512

// 遍历字符
for (const char of str) {
  console.log(char);
}

// 转为数组
[...'Hello'];  // ['H', 'e', 'l', 'l', 'o']
```

## 查找方法

### indexOf 和 lastIndexOf

```javascript
const str = 'Hello World Hello';

// indexOf - 查找首次出现位置
str.indexOf('o');        // 4
str.indexOf('o', 5);     // 7 (从索引5开始)
str.indexOf('xyz');      // -1 (未找到)

// lastIndexOf - 从后往前查找
str.lastIndexOf('o');    // 16
str.lastIndexOf('Hello');  // 12
```

### includes、startsWith、endsWith

```javascript
const str = 'Hello World';

// includes - 是否包含
str.includes('World');   // true
str.includes('world');   // false (区分大小写)
str.includes('o', 5);    // true (从索引5开始)

// startsWith - 是否以...开头
str.startsWith('Hello'); // true
str.startsWith('World', 6);  // true (从索引6检查)

// endsWith - 是否以...结尾
str.endsWith('World');   // true
str.endsWith('Hello', 5);  // true (只检查前5个字符)
```

### search 和 match

```javascript
const str = 'The price is $100.00';

// search - 正则搜索，返回索引
str.search(/\d+/);       // 14

// match - 返回匹配结果
str.match(/\d+/);        // ['100']
str.match(/\d+/g);       // ['100', '00']

// matchAll - 返回迭代器
const matches = [...str.matchAll(/\d+/g)];
// [['100', index: 14, ...], ['00', index: 18, ...]]
```

## 截取方法

### slice

```javascript
const str = 'Hello World';

str.slice(0, 5);    // 'Hello'
str.slice(6);       // 'World'
str.slice(-5);      // 'World' (负数从末尾计算)
str.slice(-5, -1);  // 'Worl'
str.slice(6, 3);    // '' (start > end 返回空)
```

### substring

```javascript
const str = 'Hello World';

str.substring(0, 5);   // 'Hello'
str.substring(6);      // 'World'
str.substring(6, 0);   // 'Hello' (自动调换 start > end)
str.substring(-5);     // 'Hello World' (负数当作0)
```

### substr（已废弃）

```javascript
// 不推荐使用，但仍有效
const str = 'Hello World';

str.substr(0, 5);   // 'Hello' (起始位置, 长度)
str.substr(6, 5);   // 'World'
str.substr(-5, 5);  // 'World'
```

## 转换方法

### 大小写转换

```javascript
const str = 'Hello World';

str.toUpperCase();       // 'HELLO WORLD'
str.toLowerCase();       // 'hello world'

// 本地化转换（处理特殊语言）
'ß'.toLocaleUpperCase('de');  // 'SS' (德语)

// 首字母大写
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
capitalize('hELLO');  // 'Hello'
```

### 去除空白

```javascript
const str = '  Hello World  ';

str.trim();         // 'Hello World'
str.trimStart();    // 'Hello World  '
str.trimEnd();      // '  Hello World'

// 自定义字符处理
function customTrim(str, char) {
  const regex = new RegExp(`^${char}+|${char}+$`, 'g');
  return str.replace(regex, '');
}
customTrim('---Hello---', '-');  // 'Hello'
```

### 填充

```javascript
const str = '5';

// padStart - 开头填充
str.padStart(3, '0');    // '005'
str.padStart(3);         // '  5' (默认空格)

// padEnd - 末尾填充
str.padEnd(3, '0');      // '500'

// 实用示例
function formatTime(h, m, s) {
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}
formatTime(9, 5, 3);  // '09:05:03'
```

### 重复

```javascript
'abc'.repeat(3);     // 'abcabcabc'
'Hello '.repeat(2);  // 'Hello Hello '

// 分隔线
'-'.repeat(50);
```

## 分割与合并

### split

```javascript
const str = 'apple,banana,orange';

str.split(',');          // ['apple', 'banana', 'orange']
str.split(',', 2);       // ['apple', 'banana'] (限制数量)

// 正则分割
'a1b2c3'.split(/\d/);    // ['a', 'b', 'c', '']

// 分割为字符
'Hello'.split('');       // ['H', 'e', 'l', 'l', 'o']

// 保留分隔符
'a1b2c3'.split(/(\d)/);  // ['a', '1', 'b', '2', 'c', '3', '']
```

### join（数组方法）

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

// 更推荐使用 + 或模板字符串
'Hello' + ' ' + 'World';
`Hello World`;
```

## 替换方法

### replace

```javascript
const str = 'Hello World World';

// 替换首个匹配
str.replace('World', 'JavaScript');
// 'Hello JavaScript World'

// 使用正则全局替换
str.replace(/World/g, 'JavaScript');
// 'Hello JavaScript JavaScript'

// 替换函数
str.replace(/\w+/g, match => match.toUpperCase());
// 'HELLO WORLD WORLD'

// 使用捕获组
'John Smith'.replace(/(\w+) (\w+)/, '$2, $1');
// 'Smith, John'
```

### replaceAll

```javascript
const str = 'Hello World World';

str.replaceAll('World', 'JavaScript');
// 'Hello JavaScript JavaScript'

// 等同于使用 /g 标志的 replace
str.replace(/World/g, 'JavaScript');
```

## 模板字符串高级用法

### 标签模板

```javascript
// 自定义标签函数
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

// HTML 转义
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

### 国际化

```javascript
// Intl.Segmenter (ES2022)
const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
const text = '我爱JavaScript';
const segments = [...segmenter.segment(text)];
// 分词结果

// 本地化比较
const collator = new Intl.Collator('zh');
['张三', '李四', '王五'].sort(collator.compare);
```

## 实用工具函数

```javascript
// 驼峰转短横线
function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
camelToKebab('backgroundColor');  // 'background-color'

// 短横线转驼峰
function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
kebabToCamel('background-color');  // 'backgroundColor'

// 截断字符串
function truncate(str, length, suffix = '...') {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}
truncate('Hello World', 8);  // 'Hello...'

// 移除HTML标签
function stripTags(html) {
  return html.replace(/<[^>]*>/g, '');
}
```

## 最佳实践总结

```
字符串方法选择指南：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   查找选择                                          │
│   ├── 简单包含检查 → includes                      │
│   ├── 获取位置 → indexOf                           │
│   └── 复杂模式 → match / search                    │
│                                                     │
│   截取选择                                          │
│   ├── 推荐使用 → slice                             │
│   ├── 需要交换参数 → substring                     │
│   └── 避免使用 → substr                            │
│                                                     │
│   替换选择                                          │
│   ├── 单个替换 → replace                           │
│   ├── 全部替换 → replaceAll / replace + /g        │
│   └── 复杂转换 → replace + 函数                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 方法 | 用途 | 返回值 |
|------|------|--------|
| slice | 截取子串 | 新字符串 |
| split | 分割为数组 | 数组 |
| replace | 替换内容 | 新字符串 |
| trim | 去除空白 | 新字符串 |

---

*熟练掌握字符串方法，让文本处理得心应手。*
