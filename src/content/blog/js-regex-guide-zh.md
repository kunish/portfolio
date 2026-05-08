---
title: 'JavaScript 正则表达式完全指南'
description: '掌握正则表达式：语法基础、模式匹配、捕获组、断言与实战应用'
pubDate: 'Jan 28 2025'
heroImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'
lang: 'zh'
translationKey: 'js-regex-guide'
---

正则表达式是处理字符串的强大工具。本文详解 JavaScript 正则表达式的语法和实战技巧。

## 基础语法

### 创建正则表达式

```javascript
// 字面量方式
const regex1 = /pattern/flags;

// 构造函数方式
const regex2 = new RegExp('pattern', 'flags');

// 示例
const emailRegex = /^\w+@\w+\.\w+$/;
const dynamicRegex = new RegExp(`user_${userId}`, 'i');
```

### 常用标志

```javascript
// g - 全局匹配
'hello hello'.match(/hello/g); // ['hello', 'hello']

// i - 忽略大小写
/hello/i.test('HELLO'); // true

// m - 多行模式
/^start/m.test('line1\nstart'); // true

// s - 点号匹配换行
/a.b/s.test('a\nb'); // true

// u - Unicode 模式
/\u{1F600}/u.test('😀'); // true

// y - 粘性匹配
const sticky = /foo/y;
sticky.lastIndex = 3;
sticky.test('xxxfoo'); // true

// 组合使用
const regex = /pattern/gim;
```

### 元字符

```javascript
// . - 匹配任意单个字符（除换行符）
/a.c/.test('abc'); // true
/a.c/.test('a\nc'); // false

// ^ - 匹配开头
/^hello/.test('hello world'); // true

// $ - 匹配结尾
/world$/.test('hello world'); // true

// | - 或运算
/cat|dog/.test('I have a cat'); // true

// \ - 转义特殊字符
/\$100/.test('$100'); // true
/1\+1/.test('1+1'); // true
```

### 字符类

```javascript
// [abc] - 匹配方括号内任意字符
/[aeiou]/.test('hello'); // true

// [^abc] - 匹配非方括号内的字符
/[^0-9]/.test('abc'); // true

// [a-z] - 范围匹配
/[a-zA-Z]/.test('Hello'); // true

// 预定义字符类
/\d/.test('123');     // true - 数字 [0-9]
/\D/.test('abc');     // true - 非数字 [^0-9]
/\w/.test('hello');   // true - 单词字符 [a-zA-Z0-9_]
/\W/.test('@#$');     // true - 非单词字符
/\s/.test(' \t\n');   // true - 空白字符
/\S/.test('abc');     // true - 非空白字符

// 边界匹配
/\bword\b/.test('a word here'); // true - 单词边界
/\Bword/.test('sword'); // true - 非单词边界
```

### 量词

```javascript
// * - 零次或多次
/ab*c/.test('ac');    // true
/ab*c/.test('abbc');  // true

// + - 一次或多次
/ab+c/.test('ac');    // false
/ab+c/.test('abc');   // true

// ? - 零次或一次
/colou?r/.test('color');  // true
/colou?r/.test('colour'); // true

// {n} - 恰好 n 次
/a{3}/.test('aaa');   // true
/a{3}/.test('aa');    // false

// {n,} - 至少 n 次
/a{2,}/.test('aaa');  // true

// {n,m} - n 到 m 次
/a{2,4}/.test('aaa'); // true

// 贪婪 vs 非贪婪
'<div>content</div>'.match(/<.*>/);   // ['<div>content</div>']
'<div>content</div>'.match(/<.*?>/);  // ['<div>']
```

## 分组与捕获

### 捕获组

```javascript
// 基本捕获组
const match = /(\d{4})-(\d{2})-(\d{2})/.exec('2025-01-28');
console.log(match[0]); // '2025-01-28' - 完整匹配
console.log(match[1]); // '2025' - 第一个捕获组
console.log(match[2]); // '01' - 第二个捕获组
console.log(match[3]); // '28' - 第三个捕获组

// 使用 match
const result = 'hello world'.match(/(\w+) (\w+)/);
console.log(result[1], result[2]); // 'hello' 'world'

// 嵌套捕获组
const nested = /((a)(b))/.exec('ab');
console.log(nested[1]); // 'ab'
console.log(nested[2]); // 'a'
console.log(nested[3]); // 'b'
```

### 命名捕获组

```javascript
// ES2018 命名捕获组
const dateRegex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = dateRegex.exec('2025-01-28');

console.log(match.groups.year);  // '2025'
console.log(match.groups.month); // '01'
console.log(match.groups.day);   // '28'

// 解构赋值
const { groups: { year, month, day } } = dateRegex.exec('2025-01-28');

// 在替换中使用
'2025-01-28'.replace(dateRegex, '$<month>/$<day>/$<year>');
// '01/28/2025'
```

### 非捕获组

```javascript
// (?:pattern) - 分组但不捕获
const regex = /(?:https?|ftp):\/\/(\w+)/;
const match = regex.exec('https://example');

console.log(match[0]); // 'https://example'
console.log(match[1]); // 'example' - 只有一个捕获组
```

### 反向引用

```javascript
// \n 引用第 n 个捕获组
const duplicateWords = /(\w+)\s+\1/;
duplicateWords.test('hello hello'); // true
duplicateWords.test('hello world'); // false

// 命名反向引用
const repeat = /(?<word>\w+)\s+\k<word>/;
repeat.test('the the'); // true

// 匹配引号内容（开闭引号相同）
const quoted = /(['"]).*?\1/;
quoted.test('"hello"'); // true
quoted.test("'hello'"); // true
quoted.test('"hello\''); // false
```

## 断言

### 先行断言

```javascript
// 正向先行断言 (?=pattern)
// 匹配后面跟着 pattern 的位置
/\d+(?=元)/.exec('100元'); // ['100']
/\d+(?=元)/.exec('100美元'); // null

// 负向先行断言 (?!pattern)
// 匹配后面不跟着 pattern 的位置
/\d+(?!元)/.exec('100美元'); // ['100']
/\d+(?!元)/.exec('100元'); // ['10'] - 匹配到不在"元"前的数字
```

### 后行断言

```javascript
// 正向后行断言 (?<=pattern) - ES2018
// 匹配前面是 pattern 的位置
/(?<=\$)\d+/.exec('$100'); // ['100']
/(?<=\$)\d+/.exec('¥100'); // null

// 负向后行断言 (?<!pattern)
// 匹配前面不是 pattern 的位置
/(?<!\$)\d+/.exec('¥100'); // ['100']
```

### 实用示例

```javascript
// 密码强度检查（必须包含大小写和数字）
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
strongPassword.test('Password123'); // true
strongPassword.test('password123'); // false

// 提取不在引号内的数字
const notInQuotes = /(?<!['"]\d*)\d+(?!\d*['"])/g;

// 千分位格式化
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
formatNumber(1234567); // '1,234,567'
```

## 常用方法

### RegExp 方法

```javascript
const regex = /hello/g;

// test - 测试是否匹配
regex.test('hello world'); // true

// exec - 执行匹配
let match;
const str = 'hello hello';
regex.lastIndex = 0; // 重置索引

while ((match = regex.exec(str)) !== null) {
  console.log(`Found ${match[0]} at ${match.index}`);
}
// Found hello at 0
// Found hello at 6
```

### String 方法

```javascript
const str = 'hello world hello';

// match - 返回匹配结果
str.match(/hello/g); // ['hello', 'hello']
str.match(/hello/);  // ['hello', index: 0, ...]

// matchAll - 返回迭代器（ES2020）
for (const match of str.matchAll(/hello/g)) {
  console.log(match.index, match[0]);
}

// search - 返回首次匹配索引
str.search(/world/); // 6

// replace - 替换
str.replace(/hello/g, 'hi'); // 'hi world hi'

// replaceAll - 替换所有（ES2021）
str.replaceAll('hello', 'hi'); // 'hi world hi'

// split - 分割
'a,b;c|d'.split(/[,;|]/); // ['a', 'b', 'c', 'd']
```

### 替换回调

```javascript
// 使用函数作为替换参数
const result = 'hello world'.replace(/(\w+)/g, (match, p1, offset) => {
  return p1.toUpperCase();
});
// 'HELLO WORLD'

// 模板字符串转换
const template = 'Hello, {{name}}! Today is {{day}}.';
const data = { name: 'Alice', day: 'Monday' };

const output = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
  return data[key] || match;
});
// 'Hello, Alice! Today is Monday.'
```

## 实战应用

### 表单验证

```javascript
const validators = {
  // 邮箱
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // 手机号（中国）
  phone: /^1[3-9]\d{9}$/,

  // 身份证
  idCard: /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,

  // URL
  url: /^https?:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/,

  // IP 地址
  ip: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,

  // 强密码
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

  // 用户名
  username: /^[a-zA-Z][a-zA-Z0-9_]{2,15}$/,

  // 中文
  chinese: /^[\u4e00-\u9fa5]+$/
};

function validate(type, value) {
  return validators[type]?.test(value) ?? false;
}

validate('email', 'test@example.com'); // true
validate('phone', '13812345678'); // true
```

### 文本处理

```javascript
// 提取所有链接
function extractLinks(html) {
  const regex = /href=["']([^"']+)["']/g;
  const links = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    links.push(match[1]);
  }

  return links;
}

// 移除 HTML 标签
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '');
}

// 驼峰转换
function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
camelToKebab('backgroundColor'); // 'background-color'

function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
kebabToCamel('background-color'); // 'backgroundColor'

// 首字母大写
function capitalize(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}
capitalize('hello world'); // 'Hello World'

// 压缩空白
function compressWhitespace(str) {
  return str.replace(/\s+/g, ' ').trim();
}
```

### 数据提取

```javascript
// 解析 URL 参数
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

// 解析 CSV
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

// 日志解析
function parseLog(log) {
  const regex = /\[(?<timestamp>[^\]]+)\]\s+(?<level>\w+)\s+(?<message>.*)/;
  const match = regex.exec(log);

  return match?.groups ?? null;
}
parseLog('[2025-01-28 10:30:00] ERROR Connection failed');
// { timestamp: '2025-01-28 10:30:00', level: 'ERROR', message: 'Connection failed' }
```

### 语法高亮

```javascript
function highlightCode(code) {
  const rules = [
    // 关键字
    { pattern: /\b(const|let|var|function|return|if|else|for|while)\b/g, class: 'keyword' },
    // 字符串
    { pattern: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, class: 'string' },
    // 数字
    { pattern: /\b\d+\.?\d*\b/g, class: 'number' },
    // 注释
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

## 性能优化

### 避免回溯陷阱

```javascript
// 危险模式 - 可能导致灾难性回溯
const dangerous = /a+a+b/;

// 优化版本
const optimized = /a{2,}b/;

// 使用原子组（通过先行断言模拟）
// 匹配不回溯
const atomic = /(?=(\d+))\1/;

// 使用占有量词的替代方案
// 原始：/\d++/ （其他语言支持）
// JS 替代：通过逻辑控制避免回溯
```

### 正则表达式优化技巧

```javascript
// 1. 预编译正则
const emailRegex = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;

function validateEmail(email) {
  return emailRegex.test(email); // 复用编译好的正则
}

// 2. 具体化模式
// 差：/.*?pattern/
// 好：/[^p]*pattern/ 或 /[\s\S]*?pattern/

// 3. 使用非捕获组
// 差：/(foo|bar|baz)/
// 好：/(?:foo|bar|baz)/

// 4. 锚定模式
// 差：/pattern/
// 好：/^pattern$/ 或 /\bpattern\b/

// 5. 提取公共前缀
// 差：/javascript|javafx|java/
// 好：/java(?:script|fx)?/
```

## 最佳实践总结

```
正则表达式最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   可读性                                            │
│   ├── 使用命名捕获组                               │
│   ├── 添加注释说明                                 │
│   ├── 拆分复杂正则                                 │
│   └── 使用 RegExp 构造函数组合                     │
│                                                     │
│   性能                                              │
│   ├── 预编译正则表达式                             │
│   ├── 避免回溯陷阱                                 │
│   ├── 使用具体字符类                               │
│   └── 锚定匹配位置                                 │
│                                                     │
│   安全                                              │
│   ├── 验证用户输入的正则                           │
│   ├── 设置匹配超时                                 │
│   ├── 限制正则复杂度                               │
│   └── 避免 ReDoS 攻击                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐做法 |
|------|---------|
| 简单匹配 | 字符串方法 includes/indexOf |
| 复杂模式 | 正则表达式 |
| 动态模式 | RegExp 构造函数 |
| 多次使用 | 预编译存储 |

---

*掌握正则表达式，解锁强大的文本处理能力。*
