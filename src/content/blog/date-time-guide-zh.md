---
title: 'JavaScript 日期时间处理：从原生 API 到现代库'
description: '掌握 Date 对象、Intl API、时区处理、日期库选择和常见陷阱'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'date-time-guide'
---

日期时间处理是前端开发中的常见挑战。本文探讨 JavaScript 日期处理的各种方法和最佳实践。

## Date 对象基础

### 创建日期

```typescript
// 当前时间
const now = new Date();

// ISO 8601 格式（推荐）
const date1 = new Date('2025-01-28T10:30:00Z');

// 时间戳（毫秒）
const date2 = new Date(1706432400000);

// 年月日参数（月份从 0 开始！）
const date3 = new Date(2025, 0, 28, 10, 30, 0); // 2025年1月28日

// 常见陷阱：月份从 0 开始
const january = new Date(2025, 0, 1);  // 1月
const december = new Date(2025, 11, 1); // 12月
```

### 获取日期组件

```typescript
const date = new Date('2025-01-28T10:30:45.123Z');

// 获取各组件
date.getFullYear();     // 2025
date.getMonth();        // 0（一月）
date.getDate();         // 28
date.getDay();          // 2（星期二，0=周日）
date.getHours();        // 本地时区小时
date.getMinutes();      // 30
date.getSeconds();      // 45
date.getMilliseconds(); // 123

// UTC 版本
date.getUTCFullYear();
date.getUTCMonth();
date.getUTCHours();

// 时间戳
date.getTime();         // 毫秒时间戳
Date.now();             // 当前时间戳
```

### 日期计算

```typescript
// 添加天数
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// 添加月份
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// 计算两个日期的差异
function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diff / msPerDay);
}

// 判断是否同一天
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
```

## Intl 国际化 API

### 日期格式化

```typescript
const date = new Date('2025-01-28T10:30:00');

// 基础格式化
const formatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});
formatter.format(date); // "2025年1月28日星期二"

// 不同语言
new Intl.DateTimeFormat('en-US').format(date); // "1/28/2025"
new Intl.DateTimeFormat('ja-JP').format(date); // "2025/1/28"
new Intl.DateTimeFormat('de-DE').format(date); // "28.1.2025"

// 完整日期时间
new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'full',
  timeStyle: 'medium',
}).format(date); // "2025年1月28日星期二 10:30:00"

// 自定义格式
new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).format(date); // "2025/01/28 10:30"
```

### 相对时间格式化

```typescript
const rtf = new Intl.RelativeTimeFormat('zh-CN', {
  numeric: 'auto',
});

rtf.format(-1, 'day');     // "昨天"
rtf.format(1, 'day');      // "明天"
rtf.format(-3, 'hour');    // "3小时前"
rtf.format(2, 'week');     // "2周后"

// 自动选择单位
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  const absDiff = Math.abs(diff);

  const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });

  if (absDiff < 60 * 1000) {
    return rtf.format(Math.round(diff / 1000), 'second');
  }
  if (absDiff < 60 * 60 * 1000) {
    return rtf.format(Math.round(diff / (60 * 1000)), 'minute');
  }
  if (absDiff < 24 * 60 * 60 * 1000) {
    return rtf.format(Math.round(diff / (60 * 60 * 1000)), 'hour');
  }
  if (absDiff < 7 * 24 * 60 * 60 * 1000) {
    return rtf.format(Math.round(diff / (24 * 60 * 60 * 1000)), 'day');
  }
  if (absDiff < 30 * 24 * 60 * 60 * 1000) {
    return rtf.format(Math.round(diff / (7 * 24 * 60 * 60 * 1000)), 'week');
  }
  return rtf.format(Math.round(diff / (30 * 24 * 60 * 60 * 1000)), 'month');
}
```

## 时区处理

### 时区基础

```
时区概念：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   UTC（协调世界时）                                 │
│   └── 全球标准时间基准                              │
│                                                     │
│   时区偏移                                          │
│   └── 如 +08:00（北京时间）                        │
│                                                     │
│   IANA 时区                                         │
│   └── 如 Asia/Shanghai, America/New_York          │
│                                                     │
│   夏令时（DST）                                     │
│   └── 某些地区季节性时间调整                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 时区转换

```typescript
const date = new Date('2025-01-28T10:30:00Z'); // UTC 时间

// 格式化为特定时区
function formatInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(date);
}

formatInTimezone(date, 'Asia/Shanghai');     // 北京时间
formatInTimezone(date, 'America/New_York');  // 纽约时间
formatInTimezone(date, 'Europe/London');     // 伦敦时间

// 获取时区偏移
function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (60 * 1000);
}
```

### ISO 8601 格式

```typescript
// 转换为 ISO 字符串
const date = new Date();
date.toISOString(); // "2025-01-28T02:30:00.000Z"

// 解析 ISO 字符串
const parsed = new Date('2025-01-28T10:30:00+08:00');

// 生成带时区的 ISO 字符串
function toISOStringWithTimezone(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${hours}:${minutes}`;
}
```

## 日期库

### Day.js

```typescript
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 启用插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// 基础用法
const now = dayjs();
const date = dayjs('2025-01-28');

// 格式化
date.format('YYYY-MM-DD HH:mm:ss'); // "2025-01-28 00:00:00"
date.format('YYYY年M月D日');         // "2025年1月28日"

// 计算
date.add(7, 'day');
date.subtract(1, 'month');
date.startOf('week');
date.endOf('month');

// 比较
date.isBefore(dayjs());
date.isAfter(dayjs());
date.isSame(dayjs(), 'day');

// 相对时间
date.fromNow();    // "2天后"
date.toNow();      // "2天前"

// 时区
dayjs.tz('2025-01-28 10:00', 'Asia/Shanghai');
dayjs().tz('America/New_York').format();
```

### date-fns

```typescript
import {
  format,
  addDays,
  subMonths,
  differenceInDays,
  isAfter,
  isBefore,
  startOfWeek,
  endOfMonth,
  formatDistanceToNow,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

const date = new Date('2025-01-28');

// 格式化
format(date, 'yyyy-MM-dd HH:mm:ss'); // "2025-01-28 00:00:00"
format(date, 'yyyy年M月d日 EEEE', { locale: zhCN }); // "2025年1月28日 星期二"

// 计算
addDays(date, 7);
subMonths(date, 1);
startOfWeek(date, { locale: zhCN });
endOfMonth(date);

// 差异
differenceInDays(new Date(), date);

// 比较
isAfter(new Date(), date);
isBefore(date, new Date());

// 相对时间
formatDistanceToNow(date, { addSuffix: true, locale: zhCN }); // "2天后"
```

## 常见陷阱

### 月份从 0 开始

```typescript
// ❌ 错误：期望2月，实际是3月
const feb = new Date(2025, 2, 1);

// ✅ 正确：2月
const feb = new Date(2025, 1, 1);

// 推荐：使用 ISO 字符串
const feb = new Date('2025-02-01');
```

### 日期字符串解析

```typescript
// ❌ 不同浏览器可能有不同结果
new Date('2025-1-28');       // 可能无效
new Date('01/28/2025');      // 美式格式
new Date('28/01/2025');      // 欧式格式，可能无效

// ✅ 使用 ISO 8601 格式
new Date('2025-01-28');
new Date('2025-01-28T10:30:00Z');
new Date('2025-01-28T10:30:00+08:00');
```

### Date 对象可变性

```typescript
// ❌ 原日期被修改
const date = new Date('2025-01-28');
date.setDate(date.getDate() + 7); // date 被改变了

// ✅ 创建新的日期对象
const date = new Date('2025-01-28');
const newDate = new Date(date);
newDate.setDate(newDate.getDate() + 7);
```

## 最佳实践总结

```
日期时间最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   存储和传输                                        │
│   ├── 使用 ISO 8601 格式                           │
│   ├── 存储 UTC 时间                                │
│   ├── 传输时包含时区信息                            │
│   └── 使用时间戳进行计算                            │
│                                                     │
│   显示                                              │
│   ├── 转换为用户本地时区                            │
│   ├── 使用 Intl API 格式化                         │
│   ├── 提供相对时间选项                              │
│   └── 考虑本地化需求                                │
│                                                     │
│   开发                                              │
│   ├── 使用日期库简化操作                            │
│   ├── 避免字符串解析陷阱                            │
│   ├── 注意 Date 对象可变性                         │
│   └── 编写测试覆盖边界情况                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐 |
|------|------|
| 简单格式化 | Intl.DateTimeFormat |
| 复杂操作 | Day.js 或 date-fns |
| 相对时间 | Intl.RelativeTimeFormat |
| 时区处理 | Day.js + timezone 插件 |

---

*日期处理的复杂性超乎想象，选择合适的工具事半功倍。*
