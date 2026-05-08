---
title: 'JavaScript Intl 国际化 API 完全指南'
description: '掌握数字、日期、货币、列表等的本地化格式化技术'
pubDate: 'Jan 28 2025'
heroImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'
lang: 'zh'
translationKey: 'js-intl-api-guide'
---

Intl 是 JavaScript 内置的国际化 API，提供语言敏感的字符串比较、数字格式化、日期时间格式化等功能。本文详解各种用法。

## 数字格式化

### NumberFormat 基础

```javascript
// 基本格式化
const num = 1234567.89;

new Intl.NumberFormat('zh-CN').format(num);
// '1,234,567.89'

new Intl.NumberFormat('de-DE').format(num);
// '1.234.567,89'

new Intl.NumberFormat('en-IN').format(num);
// '12,34,567.89'

// 格式化多个数字
const formatter = new Intl.NumberFormat('zh-CN');
formatter.format(1234);   // '1,234'
formatter.format(5678.9); // '5,678.9'
```

### 货币格式

```javascript
const amount = 1234.56;

// 人民币
new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY'
}).format(amount);
// '¥1,234.56'

// 美元
new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(amount);
// '$1,234.56'

// 欧元
new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR'
}).format(amount);
// '1.234,56 €'

// 日元（无小数）
new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY'
}).format(amount);
// '￥1,235'

// 货币显示样式
new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  currencyDisplay: 'name'  // 'symbol', 'code', 'name', 'narrowSymbol'
}).format(amount);
// '1,234.56 人民币'
```

### 百分比和单位

```javascript
// 百分比
new Intl.NumberFormat('zh-CN', {
  style: 'percent'
}).format(0.1234);
// '12%'

new Intl.NumberFormat('zh-CN', {
  style: 'percent',
  minimumFractionDigits: 2
}).format(0.1234);
// '12.34%'

// 单位
new Intl.NumberFormat('zh-CN', {
  style: 'unit',
  unit: 'kilometer'
}).format(100);
// '100公里'

new Intl.NumberFormat('en-US', {
  style: 'unit',
  unit: 'mile-per-hour',
  unitDisplay: 'long'
}).format(60);
// '60 miles per hour'

// 可用单位：kilometer, meter, centimeter, millimeter
// kilogram, gram, pound, ounce
// celsius, fahrenheit
// liter, milliliter, gallon
// 等等
```

### 紧凑表示

```javascript
// 紧凑表示法
new Intl.NumberFormat('zh-CN', {
  notation: 'compact'
}).format(1234567);
// '123万'

new Intl.NumberFormat('en-US', {
  notation: 'compact'
}).format(1234567);
// '1.2M'

new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  compactDisplay: 'long'
}).format(1234567);
// '123万'

// 科学计数法
new Intl.NumberFormat('en-US', {
  notation: 'scientific'
}).format(1234567);
// '1.235E6'

// 工程计数法
new Intl.NumberFormat('en-US', {
  notation: 'engineering'
}).format(1234567);
// '1.235E6'
```

### 小数位控制

```javascript
const num = 3.14159;

// 最小/最大小数位
new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4
}).format(num);
// '3.1416'

// 有效数字
new Intl.NumberFormat('zh-CN', {
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 5
}).format(num);
// '3.1416'

// 整数位
new Intl.NumberFormat('zh-CN', {
  minimumIntegerDigits: 3
}).format(42);
// '042'

// 舍入模式
new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 0,
  roundingMode: 'ceil'  // 'ceil', 'floor', 'trunc', 'halfExpand' 等
}).format(4.1);
// '5'
```

## 日期时间格式化

### DateTimeFormat 基础

```javascript
const date = new Date('2025-01-28T14:30:00');

// 基本格式化
new Intl.DateTimeFormat('zh-CN').format(date);
// '2025/1/28'

new Intl.DateTimeFormat('en-US').format(date);
// '1/28/2025'

new Intl.DateTimeFormat('de-DE').format(date);
// '28.1.2025'

new Intl.DateTimeFormat('ja-JP').format(date);
// '2025/1/28'
```

### 详细选项

```javascript
const date = new Date('2025-01-28T14:30:00');

// 完整日期时间
new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'full',
  timeStyle: 'long'
}).format(date);
// '2025年1月28日星期二 GMT+8 14:30:00'

// 自定义格式
new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}).format(date);
// '2025年1月28日星期二'

// 只要时间
new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}).format(date);
// '14:30:00'

// 时区
new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'America/New_York',
  timeZoneName: 'long',
  hour: 'numeric',
  minute: 'numeric'
}).format(date);
// '凌晨1:30 北美东部标准时间'
```

### 日期范围

```javascript
const start = new Date('2025-01-28');
const end = new Date('2025-02-05');

const formatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

formatter.formatRange(start, end);
// '2025年1月28日至2月5日'

// 英文
new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
}).formatRange(start, end);
// 'Jan 28 – Feb 5'
```

## 相对时间

### RelativeTimeFormat

```javascript
const rtf = new Intl.RelativeTimeFormat('zh-CN', {
  numeric: 'auto'
});

rtf.format(-1, 'day');     // '昨天'
rtf.format(0, 'day');      // '今天'
rtf.format(1, 'day');      // '明天'
rtf.format(2, 'day');      // '后天'

rtf.format(-1, 'week');    // '上周'
rtf.format(1, 'week');     // '下周'

rtf.format(-1, 'month');   // '上个月'
rtf.format(1, 'month');    // '下个月'

rtf.format(-1, 'year');    // '去年'
rtf.format(1, 'year');     // '明年'

// 总是显示数字
const rtfNumeric = new Intl.RelativeTimeFormat('zh-CN', {
  numeric: 'always'
});

rtfNumeric.format(-1, 'day');  // '1天前'
rtfNumeric.format(1, 'day');   // '1天后'
```

### 计算相对时间

```javascript
function getRelativeTime(date, locale = 'zh-CN') {
  const now = new Date();
  const diff = date - now;

  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(diff / (1000 * 60));
  const hours = Math.round(diff / (1000 * 60 * 60));
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.round(diff / (1000 * 60 * 60 * 24 * 7));
  const months = Math.round(diff / (1000 * 60 * 60 * 24 * 30));
  const years = Math.round(diff / (1000 * 60 * 60 * 24 * 365));

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(seconds) < 60) {
    return rtf.format(seconds, 'second');
  } else if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, 'minute');
  } else if (Math.abs(hours) < 24) {
    return rtf.format(hours, 'hour');
  } else if (Math.abs(days) < 7) {
    return rtf.format(days, 'day');
  } else if (Math.abs(weeks) < 4) {
    return rtf.format(weeks, 'week');
  } else if (Math.abs(months) < 12) {
    return rtf.format(months, 'month');
  } else {
    return rtf.format(years, 'year');
  }
}

// 使用示例
getRelativeTime(new Date(Date.now() - 1000 * 60 * 5));
// '5分钟前'

getRelativeTime(new Date(Date.now() + 1000 * 60 * 60 * 2));
// '2小时后'
```

## 列表格式化

### ListFormat

```javascript
const list = ['苹果', '香蕉', '橙子'];

// 并列
new Intl.ListFormat('zh-CN', {
  style: 'long',
  type: 'conjunction'
}).format(list);
// '苹果、香蕉和橙子'

// 选择其一
new Intl.ListFormat('zh-CN', {
  style: 'long',
  type: 'disjunction'
}).format(list);
// '苹果、香蕉或橙子'

// 单位列表
new Intl.ListFormat('zh-CN', {
  style: 'narrow',
  type: 'unit'
}).format(['3米', '50厘米']);
// '3米 50厘米'

// 英文
new Intl.ListFormat('en-US', {
  type: 'conjunction'
}).format(['Apple', 'Banana', 'Orange']);
// 'Apple, Banana, and Orange'
```

## 复数规则

### PluralRules

```javascript
// 中文没有复数变化
const prZh = new Intl.PluralRules('zh-CN');
prZh.select(0);  // 'other'
prZh.select(1);  // 'other'
prZh.select(2);  // 'other'

// 英文有复数
const prEn = new Intl.PluralRules('en-US');
prEn.select(0);  // 'other'
prEn.select(1);  // 'one'
prEn.select(2);  // 'other'

// 实际应用
function formatMessage(count, locale = 'en-US') {
  const pr = new Intl.PluralRules(locale);
  const messages = {
    one: `You have ${count} message`,
    other: `You have ${count} messages`
  };
  return messages[pr.select(count)];
}

formatMessage(1);  // 'You have 1 message'
formatMessage(5);  // 'You have 5 messages'

// 序数词
const ordinal = new Intl.PluralRules('en-US', { type: 'ordinal' });

function formatOrdinal(n) {
  const suffixes = {
    one: 'st',
    two: 'nd',
    few: 'rd',
    other: 'th'
  };
  return `${n}${suffixes[ordinal.select(n)]}`;
}

formatOrdinal(1);   // '1st'
formatOrdinal(2);   // '2nd'
formatOrdinal(3);   // '3rd'
formatOrdinal(4);   // '4th'
formatOrdinal(21);  // '21st'
```

## 字符串比较

### Collator

```javascript
// 基本排序
const names = ['张三', '李四', '王五', '赵六'];

names.sort(new Intl.Collator('zh-CN').compare);
// 按拼音排序

// 英文大小写敏感
const words = ['apple', 'Apple', 'APPLE', 'banana'];

words.sort(new Intl.Collator('en-US', {
  sensitivity: 'case'
}).compare);
// ['apple', 'Apple', 'APPLE', 'banana']

// 忽略大小写
words.sort(new Intl.Collator('en-US', {
  sensitivity: 'base'
}).compare);
// ['apple', 'Apple', 'APPLE', 'banana']（顺序可能不同）

// 数字排序
const files = ['file1', 'file10', 'file2', 'file20'];

files.sort(new Intl.Collator('en-US', {
  numeric: true
}).compare);
// ['file1', 'file2', 'file10', 'file20']

// 比较选项
const collator = new Intl.Collator('de-DE', {
  usage: 'search',  // 'sort' 或 'search'
  sensitivity: 'accent',  // 'base', 'accent', 'case', 'variant'
  ignorePunctuation: true
});
```

## 分段

### Segmenter

```javascript
// 按字分词（中文）
const segmenter = new Intl.Segmenter('zh-CN', {
  granularity: 'word'
});

const text = '你好世界！';
const segments = [...segmenter.segment(text)];
// [{ segment: '你好', ... }, { segment: '世界', ... }, ...]

// 按句子分段
const sentenceSegmenter = new Intl.Segmenter('en-US', {
  granularity: 'sentence'
});

const paragraph = 'Hello world. How are you? I am fine.';
const sentences = [...sentenceSegmenter.segment(paragraph)];
// 分成三个句子

// 按字素分段（处理 emoji 和组合字符）
const graphemeSegmenter = new Intl.Segmenter('en-US', {
  granularity: 'grapheme'
});

const emoji = '👨‍👩‍👧‍👦';  // 家庭 emoji
const graphemes = [...graphemeSegmenter.segment(emoji)];
graphemes.length;  // 1（正确识别为一个字素）

// 对比 spread 操作
[...emoji].length;  // 7（错误地分成了多个）
```

## 显示名称

### DisplayNames

```javascript
// 语言名称
const languageNames = new Intl.DisplayNames(['zh-CN'], {
  type: 'language'
});

languageNames.of('en');     // '英语'
languageNames.of('zh');     // '中文'
languageNames.of('ja');     // '日语'
languageNames.of('ko');     // '韩语'

// 地区名称
const regionNames = new Intl.DisplayNames(['zh-CN'], {
  type: 'region'
});

regionNames.of('US');  // '美国'
regionNames.of('CN');  // '中国'
regionNames.of('JP');  // '日本'

// 货币名称
const currencyNames = new Intl.DisplayNames(['zh-CN'], {
  type: 'currency'
});

currencyNames.of('USD');  // '美元'
currencyNames.of('CNY');  // '人民币'
currencyNames.of('EUR');  // '欧元'

// 日历名称
const calendarNames = new Intl.DisplayNames(['zh-CN'], {
  type: 'calendar'
});

calendarNames.of('gregorian');  // '公历'
calendarNames.of('chinese');    // '农历'

// 书写方向
const scriptNames = new Intl.DisplayNames(['zh-CN'], {
  type: 'script'
});

scriptNames.of('Hans');  // '简体中文'
scriptNames.of('Hant');  // '繁体中文'
```

## 获取区域信息

### Locale

```javascript
// 创建 Locale 对象
const locale = new Intl.Locale('zh-CN');

locale.language;   // 'zh'
locale.region;     // 'CN'
locale.baseName;   // 'zh-CN'

// 带扩展的 locale
const localeExt = new Intl.Locale('zh-CN-u-nu-hanidec');
localeExt.numberingSystem;  // 'hanidec'

// 获取日历信息
const calendars = locale.getCalendars();
// ['gregory', 'chinese']

// 获取时区
const timeZones = locale.getTimeZones();
// ['Asia/Shanghai', ...]

// 获取星期信息
const weekInfo = locale.getWeekInfo();
// { firstDay: 1, weekend: [6, 7], minimalDays: 1 }

// 获取小时周期
const hourCycles = locale.getHourCycles();
// ['h23']（24小时制）

// 最大化/最小化
const minimized = locale.minimize();
const maximized = locale.maximize();
```

## 最佳实践总结

```
Intl API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   数字格式化                                        │
│   ├── 货币显示使用 NumberFormat + currency         │
│   ├── 大数字使用 compact 表示法                    │
│   └── 百分比和单位使用对应 style                   │
│                                                     │
│   日期时间                                          │
│   ├── 日期显示使用 DateTimeFormat                  │
│   ├── 相对时间使用 RelativeTimeFormat              │
│   └── 注意时区处理                                 │
│                                                     │
│   文本处理                                          │
│   ├── 排序使用 Collator                            │
│   ├── 列表使用 ListFormat                          │
│   └── 分词使用 Segmenter                           │
│                                                     │
│   性能优化                                          │
│   ├── 复用 formatter 实例                          │
│   └── 避免在循环中创建新实例                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| API | 用途 | 示例 |
|-----|------|------|
| NumberFormat | 数字/货币格式化 | 1,234.56 / ¥100 |
| DateTimeFormat | 日期时间格式化 | 2025年1月28日 |
| RelativeTimeFormat | 相对时间 | 昨天、2小时前 |
| ListFormat | 列表格式化 | A、B和C |
| Collator | 字符串比较排序 | 按拼音排序 |
| Segmenter | 文本分段 | 分词、分句 |

---

*掌握 Intl API，构建真正的国际化应用。*
