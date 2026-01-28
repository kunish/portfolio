---
title: 'JavaScript Date & Time Handling: From Native API to Modern Libraries'
description: 'Master Date object, Intl API, timezone handling, date library selection and common pitfalls'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'date-time-guide'
---

Date and time handling is a common challenge in frontend development. This article explores various methods and best practices for JavaScript date handling.

## Date Object Fundamentals

### Creating Dates

```typescript
// Current time
const now = new Date();

// ISO 8601 format (recommended)
const date1 = new Date('2025-01-28T10:30:00Z');

// Timestamp (milliseconds)
const date2 = new Date(1706432400000);

// Year, month, day parameters (month is 0-based!)
const date3 = new Date(2025, 0, 28, 10, 30, 0); // January 28, 2025

// Common pitfall: months are 0-based
const january = new Date(2025, 0, 1);  // January
const december = new Date(2025, 11, 1); // December
```

### Getting Date Components

```typescript
const date = new Date('2025-01-28T10:30:45.123Z');

// Get components
date.getFullYear();     // 2025
date.getMonth();        // 0 (January)
date.getDate();         // 28
date.getDay();          // 2 (Tuesday, 0=Sunday)
date.getHours();        // Local timezone hours
date.getMinutes();      // 30
date.getSeconds();      // 45
date.getMilliseconds(); // 123

// UTC versions
date.getUTCFullYear();
date.getUTCMonth();
date.getUTCHours();

// Timestamp
date.getTime();         // Millisecond timestamp
Date.now();             // Current timestamp
```

### Date Calculations

```typescript
// Add days
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Add months
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// Calculate difference between two dates
function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diff / msPerDay);
}

// Check if same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
```

## Intl Internationalization API

### Date Formatting

```typescript
const date = new Date('2025-01-28T10:30:00');

// Basic formatting
const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});
formatter.format(date); // "Tuesday, January 28, 2025"

// Different locales
new Intl.DateTimeFormat('zh-CN').format(date); // "2025/1/28"
new Intl.DateTimeFormat('ja-JP').format(date); // "2025/1/28"
new Intl.DateTimeFormat('de-DE').format(date); // "28.1.2025"

// Full date time
new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'medium',
}).format(date); // "Tuesday, January 28, 2025 at 10:30:00 AM"

// Custom format
new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).format(date); // "01/28/2025, 10:30"
```

### Relative Time Formatting

```typescript
const rtf = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
});

rtf.format(-1, 'day');     // "yesterday"
rtf.format(1, 'day');      // "tomorrow"
rtf.format(-3, 'hour');    // "3 hours ago"
rtf.format(2, 'week');     // "in 2 weeks"

// Auto-select unit
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  const absDiff = Math.abs(diff);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

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

## Timezone Handling

### Timezone Basics

```
Timezone Concepts:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   UTC (Coordinated Universal Time)                  │
│   └── Global standard time reference               │
│                                                     │
│   Timezone Offset                                   │
│   └── e.g., +08:00 (Beijing time)                 │
│                                                     │
│   IANA Timezone                                     │
│   └── e.g., Asia/Shanghai, America/New_York       │
│                                                     │
│   Daylight Saving Time (DST)                        │
│   └── Seasonal time adjustment in some regions     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Timezone Conversion

```typescript
const date = new Date('2025-01-28T10:30:00Z'); // UTC time

// Format in specific timezone
function formatInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(date);
}

formatInTimezone(date, 'Asia/Shanghai');     // Beijing time
formatInTimezone(date, 'America/New_York');  // New York time
formatInTimezone(date, 'Europe/London');     // London time

// Get timezone offset
function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (60 * 1000);
}
```

### ISO 8601 Format

```typescript
// Convert to ISO string
const date = new Date();
date.toISOString(); // "2025-01-28T02:30:00.000Z"

// Parse ISO string
const parsed = new Date('2025-01-28T10:30:00+08:00');

// Generate ISO string with timezone
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

## Date Libraries

### Day.js

```typescript
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

// Enable plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// Basic usage
const now = dayjs();
const date = dayjs('2025-01-28');

// Formatting
date.format('YYYY-MM-DD HH:mm:ss'); // "2025-01-28 00:00:00"
date.format('MMMM D, YYYY');         // "January 28, 2025"

// Calculations
date.add(7, 'day');
date.subtract(1, 'month');
date.startOf('week');
date.endOf('month');

// Comparison
date.isBefore(dayjs());
date.isAfter(dayjs());
date.isSame(dayjs(), 'day');

// Relative time
date.fromNow();    // "in 2 days"
date.toNow();      // "2 days ago"

// Timezone
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

const date = new Date('2025-01-28');

// Formatting
format(date, 'yyyy-MM-dd HH:mm:ss'); // "2025-01-28 00:00:00"
format(date, 'MMMM d, yyyy EEEE');   // "January 28, 2025 Tuesday"

// Calculations
addDays(date, 7);
subMonths(date, 1);
startOfWeek(date);
endOfMonth(date);

// Difference
differenceInDays(new Date(), date);

// Comparison
isAfter(new Date(), date);
isBefore(date, new Date());

// Relative time
formatDistanceToNow(date, { addSuffix: true }); // "in 2 days"
```

## Common Pitfalls

### Months Are 0-Based

```typescript
// ❌ Wrong: expecting February, gets March
const feb = new Date(2025, 2, 1);

// ✅ Correct: February
const feb = new Date(2025, 1, 1);

// Recommended: use ISO string
const feb = new Date('2025-02-01');
```

### Date String Parsing

```typescript
// ❌ Different browsers may give different results
new Date('2025-1-28');       // May be invalid
new Date('01/28/2025');      // US format
new Date('28/01/2025');      // EU format, may be invalid

// ✅ Use ISO 8601 format
new Date('2025-01-28');
new Date('2025-01-28T10:30:00Z');
new Date('2025-01-28T10:30:00+08:00');
```

### Date Object Mutability

```typescript
// ❌ Original date is modified
const date = new Date('2025-01-28');
date.setDate(date.getDate() + 7); // date is changed

// ✅ Create new date object
const date = new Date('2025-01-28');
const newDate = new Date(date);
newDate.setDate(newDate.getDate() + 7);
```

## Best Practices Summary

```
Date & Time Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Storage and Transport                             │
│   ├── Use ISO 8601 format                          │
│   ├── Store in UTC                                 │
│   ├── Include timezone info when transmitting     │
│   └── Use timestamps for calculations              │
│                                                     │
│   Display                                           │
│   ├── Convert to user's local timezone             │
│   ├── Use Intl API for formatting                  │
│   ├── Provide relative time options                │
│   └── Consider localization needs                  │
│                                                     │
│   Development                                       │
│   ├── Use date libraries for simplicity            │
│   ├── Avoid string parsing pitfalls                │
│   ├── Beware of Date object mutability            │
│   └── Write tests covering edge cases              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommendation |
|----------|----------------|
| Simple formatting | Intl.DateTimeFormat |
| Complex operations | Day.js or date-fns |
| Relative time | Intl.RelativeTimeFormat |
| Timezone handling | Day.js + timezone plugin |

---

*Date handling complexity is beyond imagination - choose the right tools to work smarter.*
