---
title: '正则表达式完全指南：从基础到实战'
description: '掌握正则语法、常用模式、性能优化和实际应用场景'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'regex-guide'
---

正则表达式是文本处理的强大工具。本文探讨正则表达式的语法和实际应用。

## 基础语法

### 字符匹配

```javascript
// 字面字符
/hello/      // 匹配 "hello"
/123/        // 匹配 "123"

// 特殊字符需转义
/\./         // 匹配 "."
/\$/         // 匹配 "$"
/\*/         // 匹配 "*"

// 点号匹配任意单字符
/h.llo/      // 匹配 "hello", "hallo", "h1llo" 等
```

### 字符类

```javascript
// 字符集合
/[abc]/      // 匹配 a, b 或 c
/[a-z]/      // 匹配任意小写字母
/[A-Z]/      // 匹配任意大写字母
/[0-9]/      // 匹配任意数字
/[a-zA-Z]/   // 匹配任意字母

// 否定字符集
/[^abc]/     // 匹配除 a, b, c 外的任意字符
/[^0-9]/     // 匹配非数字字符

// 预定义字符类
/\d/         // 数字，等同于 [0-9]
/\D/         // 非数字，等同于 [^0-9]
/\w/         // 单词字符，等同于 [a-zA-Z0-9_]
/\W/         // 非单词字符
/\s/         // 空白字符（空格、制表符、换行等）
/\S/         // 非空白字符
```

### 量词

```javascript
// 精确数量
/a{3}/       // 匹配 "aaa"
/a{2,4}/     // 匹配 "aa", "aaa", "aaaa"
/a{2,}/      // 匹配 2 个或更多 a

// 常用量词
/a*/         // 0 个或多个 a
/a+/         // 1 个或多个 a
/a?/         // 0 个或 1 个 a

// 贪婪 vs 非贪婪
/a+/         // 贪婪，尽可能多匹配
/a+?/        // 非贪婪，尽可能少匹配

// 示例
const text = '<div>content</div>';
text.match(/<.+>/);   // ["<div>content</div>"] 贪婪
text.match(/<.+?>/);  // ["<div>"] 非贪婪
```

### 锚点

```javascript
// 位置锚点
/^hello/     // 以 hello 开头
/world$/     // 以 world 结尾
/^hello$/    // 精确匹配 hello

// 单词边界
/\bword\b/   // 匹配独立单词 "word"
/\Bword/     // 匹配非单词边界的 word

// 示例
'hello world'.match(/\bworld\b/);  // ["world"]
'helloworld'.match(/\bworld\b/);   // null
```

## 分组与引用

### 捕获组

```javascript
// 基本分组
/(ab)+/      // 匹配 "ab", "abab", "ababab" 等

// 捕获组引用
const regex = /(\w+)\s(\w+)/;
const match = 'hello world'.match(regex);
// match[0] = "hello world"
// match[1] = "hello"
// match[2] = "world"

// 替换中使用
'hello world'.replace(/(\w+)\s(\w+)/, '$2 $1');
// "world hello"
```

### 命名捕获组

```javascript
// ES2018 命名组
const regex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = '2025-01-28'.match(regex);

console.log(match.groups.year);   // "2025"
console.log(match.groups.month);  // "01"
console.log(match.groups.day);    // "28"

// 替换中使用命名引用
'2025-01-28'.replace(
  /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/,
  '$<day>/$<month>/$<year>'
);
// "28/01/2025"
```

### 非捕获组

```javascript
// 不捕获的分组
/(?:ab)+/    // 匹配但不捕获

// 对比
'ababab'.match(/(ab)+/);    // ["ababab", "ab"]
'ababab'.match(/(?:ab)+/);  // ["ababab"]
```

### 反向引用

```javascript
// 引用前面的捕获组
/(\w+)\s\1/  // 匹配重复单词

'hello hello'.match(/(\w+)\s\1/);  // ["hello hello", "hello"]
'hello world'.match(/(\w+)\s\1/);  // null

// 匹配引号内容
/(['"]).*?\1/   // 匹配单引号或双引号包裹的内容
```

## 断言

### 前瞻断言

```javascript
// 正向前瞻：后面是
/foo(?=bar)/   // 匹配后面跟着 bar 的 foo
'foobar'.match(/foo(?=bar)/);  // ["foo"]
'foobaz'.match(/foo(?=bar)/);  // null

// 负向前瞻：后面不是
/foo(?!bar)/   // 匹配后面不跟着 bar 的 foo
'foobaz'.match(/foo(?!bar)/);  // ["foo"]
'foobar'.match(/foo(?!bar)/);  // null
```

### 后顾断言

```javascript
// 正向后顾：前面是
/(?<=\$)\d+/   // 匹配前面是 $ 的数字
'$100'.match(/(?<=\$)\d+/);  // ["100"]
'€100'.match(/(?<=\$)\d+/);  // null

// 负向后顾：前面不是
/(?<!\$)\d+/   // 匹配前面不是 $ 的数字
'€100'.match(/(?<!\$)\d+/);  // ["100"]
```

## 标志

### 常用标志

```javascript
// g - 全局匹配
'hello hello'.match(/hello/);   // ["hello"]
'hello hello'.match(/hello/g);  // ["hello", "hello"]

// i - 忽略大小写
'Hello'.match(/hello/);   // null
'Hello'.match(/hello/i);  // ["Hello"]

// m - 多行模式
const text = 'line1\nline2';
text.match(/^line/gm);  // ["line", "line"]

// s - 点号匹配换行
'a\nb'.match(/a.b/);   // null
'a\nb'.match(/a.b/s);  // ["a\nb"]

// u - Unicode 模式
'😀'.match(/./);   // ["\ud83d"]
'😀'.match(/./u);  // ["😀"]
```

## 常用正则模式

### 验证模式

```javascript
// 邮箱
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// URL
const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

// 手机号（中国）
const phoneRegex = /^1[3-9]\d{9}$/;

// 身份证号
const idCardRegex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

// 密码强度（至少8位，包含大小写字母和数字）
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

// IPv4 地址
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
```

### 提取模式

```javascript
// 提取数字
const extractNumbers = (str: string) => str.match(/\d+/g) || [];

// 提取 URL
const extractUrls = (str: string) =>
  str.match(/https?:\/\/[^\s]+/g) || [];

// 提取标签
const extractTags = (str: string) =>
  str.match(/#\w+/g) || [];

// 提取 HTML 标签内容
const extractTagContent = (html: string, tag: string) => {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gi');
  return [...html.matchAll(regex)].map(m => m[1]);
};
```

### 替换模式

```javascript
// 驼峰转短横线
const camelToKebab = (str: string) =>
  str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

// 短横线转驼峰
const kebabToCamel = (str: string) =>
  str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

// 首字母大写
const capitalize = (str: string) =>
  str.replace(/\b\w/g, c => c.toUpperCase());

// 移除 HTML 标签
const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, '');

// 格式化数字（添加千分位）
const formatNumber = (num: number) =>
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
```

## JavaScript RegExp 方法

### 测试和匹配

```javascript
const regex = /hello/gi;
const str = 'Hello World, hello!';

// test() - 返回布尔值
regex.test(str);  // true

// match() - 返回匹配数组
str.match(regex);  // ["Hello", "hello"]

// matchAll() - 返回迭代器（需要 g 标志）
const matches = [...str.matchAll(/hello/gi)];
matches[0].index;  // 0
matches[1].index;  // 13

// search() - 返回索引
str.search(/hello/i);  // 0

// replace() - 替换
str.replace(/hello/gi, 'hi');  // "hi World, hi!"

// replaceAll() - 全部替换
str.replaceAll(/hello/gi, 'hi');  // "hi World, hi!"

// split() - 分割
'a,b;c d'.split(/[,;\s]/);  // ["a", "b", "c", "d"]
```

### RegExp 对象

```javascript
// 构造函数（可动态创建）
const pattern = 'hello';
const regex = new RegExp(pattern, 'gi');

// 属性
regex.source;      // "hello"
regex.flags;       // "gi"
regex.global;      // true
regex.ignoreCase;  // true
regex.lastIndex;   // 0（用于 exec）

// exec() - 逐个匹配
const str = 'hello hello';
const re = /hello/g;
re.exec(str);  // ["hello"], lastIndex = 5
re.exec(str);  // ["hello"], lastIndex = 11
re.exec(str);  // null, lastIndex = 0
```

## 性能优化

### 避免灾难性回溯

```javascript
// 危险模式（指数级回溯）
/^(a+)+$/      // 对于 "aaaaaaaaaaaaaaX" 会非常慢

// 安全替代
/^a+$/         // 简化模式

// 原子组模拟（使用前瞻）
/^(?=(a+))\1$/  // 减少回溯
```

### 优化建议

```
正则表达式优化：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   编写建议                                          │
│   ├── 尽可能具体化                                 │
│   ├── 避免嵌套量词                                 │
│   ├── 使用非捕获组 (?:...)                         │
│   └── 锚定开始和结束                               │
│                                                     │
│   性能考虑                                          │
│   ├── 预编译复用正则                               │
│   ├── 避免在循环中创建                             │
│   ├── 简单匹配用字符串方法                         │
│   └── 测试边界情况                                 │
│                                                     │
│   可读性                                            │
│   ├── 使用命名捕获组                               │
│   ├── 添加注释说明                                 │
│   ├── 拆分复杂正则                                 │
│   └── 使用 x 标志（支持时）                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 最佳实践总结

| 符号 | 含义 |
|------|------|
| `.` | 任意单字符 |
| `*` | 0 或多个 |
| `+` | 1 或多个 |
| `?` | 0 或 1 个 |
| `^` | 开头 |
| `$` | 结尾 |
| `\d` | 数字 |
| `\w` | 单词字符 |
| `\s` | 空白字符 |

---

*正则表达式是程序员的瑞士军刀。*
