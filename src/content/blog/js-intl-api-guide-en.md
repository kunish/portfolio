---
title: 'JavaScript Intl Internationalization API Complete Guide'
description: 'Master localized formatting for numbers, dates, currencies, lists, and more'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'js-intl-api-guide'
---

Intl is JavaScript's built-in internationalization API, providing language-sensitive string comparison, number formatting, date and time formatting, and more. This article covers various usage patterns.

## Number Formatting

### NumberFormat Basics

```javascript
// Basic formatting
const num = 1234567.89;

new Intl.NumberFormat('en-US').format(num);
// '1,234,567.89'

new Intl.NumberFormat('de-DE').format(num);
// '1.234.567,89'

new Intl.NumberFormat('en-IN').format(num);
// '12,34,567.89'

// Format multiple numbers
const formatter = new Intl.NumberFormat('en-US');
formatter.format(1234);   // '1,234'
formatter.format(5678.9); // '5,678.9'
```

### Currency Format

```javascript
const amount = 1234.56;

// US Dollars
new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(amount);
// '$1,234.56'

// Euros
new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR'
}).format(amount);
// '1.234,56 €'

// British Pounds
new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP'
}).format(amount);
// '£1,234.56'

// Japanese Yen (no decimals)
new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY'
}).format(amount);
// '￥1,235'

// Currency display style
new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'name'  // 'symbol', 'code', 'name', 'narrowSymbol'
}).format(amount);
// '1,234.56 US dollars'
```

### Percentages and Units

```javascript
// Percentage
new Intl.NumberFormat('en-US', {
  style: 'percent'
}).format(0.1234);
// '12%'

new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2
}).format(0.1234);
// '12.34%'

// Units
new Intl.NumberFormat('en-US', {
  style: 'unit',
  unit: 'kilometer'
}).format(100);
// '100 km'

new Intl.NumberFormat('en-US', {
  style: 'unit',
  unit: 'mile-per-hour',
  unitDisplay: 'long'
}).format(60);
// '60 miles per hour'

// Available units: kilometer, meter, centimeter, millimeter
// kilogram, gram, pound, ounce
// celsius, fahrenheit
// liter, milliliter, gallon
// and more
```

### Compact Notation

```javascript
// Compact notation
new Intl.NumberFormat('en-US', {
  notation: 'compact'
}).format(1234567);
// '1.2M'

new Intl.NumberFormat('en-GB', {
  notation: 'compact',
  compactDisplay: 'long'
}).format(1234567);
// '1.2 million'

new Intl.NumberFormat('zh-CN', {
  notation: 'compact'
}).format(1234567);
// '123万'

// Scientific notation
new Intl.NumberFormat('en-US', {
  notation: 'scientific'
}).format(1234567);
// '1.235E6'

// Engineering notation
new Intl.NumberFormat('en-US', {
  notation: 'engineering'
}).format(1234567);
// '1.235E6'
```

### Decimal Control

```javascript
const num = 3.14159;

// Min/max fraction digits
new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4
}).format(num);
// '3.1416'

// Significant digits
new Intl.NumberFormat('en-US', {
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 5
}).format(num);
// '3.1416'

// Integer digits
new Intl.NumberFormat('en-US', {
  minimumIntegerDigits: 3
}).format(42);
// '042'

// Rounding mode
new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  roundingMode: 'ceil'  // 'ceil', 'floor', 'trunc', 'halfExpand', etc.
}).format(4.1);
// '5'
```

## Date Time Formatting

### DateTimeFormat Basics

```javascript
const date = new Date('2025-01-28T14:30:00');

// Basic formatting
new Intl.DateTimeFormat('en-US').format(date);
// '1/28/2025'

new Intl.DateTimeFormat('en-GB').format(date);
// '28/01/2025'

new Intl.DateTimeFormat('de-DE').format(date);
// '28.1.2025'

new Intl.DateTimeFormat('ja-JP').format(date);
// '2025/1/28'
```

### Detailed Options

```javascript
const date = new Date('2025-01-28T14:30:00');

// Full date time
new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'long'
}).format(date);
// 'Tuesday, January 28, 2025 at 2:30:00 PM GMT+8'

// Custom format
new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}).format(date);
// 'Tuesday, January 28, 2025'

// Time only
new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}).format(date);
// '14:30:00'

// Time zone
new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  timeZoneName: 'long',
  hour: 'numeric',
  minute: 'numeric'
}).format(date);
// '1:30 AM Eastern Standard Time'
```

### Date Range

```javascript
const start = new Date('2025-01-28');
const end = new Date('2025-02-05');

const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

formatter.formatRange(start, end);
// 'January 28 – February 5, 2025'

// Short format
new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
}).formatRange(start, end);
// 'Jan 28 – Feb 5'
```

## Relative Time

### RelativeTimeFormat

```javascript
const rtf = new Intl.RelativeTimeFormat('en-US', {
  numeric: 'auto'
});

rtf.format(-1, 'day');     // 'yesterday'
rtf.format(0, 'day');      // 'today'
rtf.format(1, 'day');      // 'tomorrow'
rtf.format(2, 'day');      // 'in 2 days'

rtf.format(-1, 'week');    // 'last week'
rtf.format(1, 'week');     // 'next week'

rtf.format(-1, 'month');   // 'last month'
rtf.format(1, 'month');    // 'next month'

rtf.format(-1, 'year');    // 'last year'
rtf.format(1, 'year');     // 'next year'

// Always show numbers
const rtfNumeric = new Intl.RelativeTimeFormat('en-US', {
  numeric: 'always'
});

rtfNumeric.format(-1, 'day');  // '1 day ago'
rtfNumeric.format(1, 'day');   // 'in 1 day'
```

### Calculating Relative Time

```javascript
function getRelativeTime(date, locale = 'en-US') {
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

// Usage
getRelativeTime(new Date(Date.now() - 1000 * 60 * 5));
// '5 minutes ago'

getRelativeTime(new Date(Date.now() + 1000 * 60 * 60 * 2));
// 'in 2 hours'
```

## List Formatting

### ListFormat

```javascript
const list = ['Apple', 'Banana', 'Orange'];

// Conjunction
new Intl.ListFormat('en-US', {
  style: 'long',
  type: 'conjunction'
}).format(list);
// 'Apple, Banana, and Orange'

// Disjunction
new Intl.ListFormat('en-US', {
  style: 'long',
  type: 'disjunction'
}).format(list);
// 'Apple, Banana, or Orange'

// Unit list
new Intl.ListFormat('en-US', {
  style: 'narrow',
  type: 'unit'
}).format(['3 meters', '50 centimeters']);
// '3 meters, 50 centimeters'

// Different locales
new Intl.ListFormat('de-DE', {
  type: 'conjunction'
}).format(['Apfel', 'Banane', 'Orange']);
// 'Apfel, Banane und Orange'
```

## Plural Rules

### PluralRules

```javascript
// English has plural forms
const prEn = new Intl.PluralRules('en-US');
prEn.select(0);  // 'other'
prEn.select(1);  // 'one'
prEn.select(2);  // 'other'

// Practical application
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

// Ordinals
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

## String Comparison

### Collator

```javascript
// Basic sorting
const words = ['zebra', 'apple', 'Orange', 'banana'];

words.sort(new Intl.Collator('en-US').compare);
// Alphabetically sorted

// Case-sensitive
words.sort(new Intl.Collator('en-US', {
  sensitivity: 'case'
}).compare);
// ['apple', 'banana', 'Orange', 'zebra']

// Case-insensitive
words.sort(new Intl.Collator('en-US', {
  sensitivity: 'base'
}).compare);
// Case-insensitive sort

// Numeric sorting
const files = ['file1', 'file10', 'file2', 'file20'];

files.sort(new Intl.Collator('en-US', {
  numeric: true
}).compare);
// ['file1', 'file2', 'file10', 'file20']

// Comparison options
const collator = new Intl.Collator('de-DE', {
  usage: 'search',  // 'sort' or 'search'
  sensitivity: 'accent',  // 'base', 'accent', 'case', 'variant'
  ignorePunctuation: true
});
```

## Segmentation

### Segmenter

```javascript
// Word segmentation
const segmenter = new Intl.Segmenter('en-US', {
  granularity: 'word'
});

const text = 'Hello world!';
const segments = [...segmenter.segment(text)];
// [{ segment: 'Hello', ... }, { segment: ' ', ... }, { segment: 'world', ... }, ...]

// Sentence segmentation
const sentenceSegmenter = new Intl.Segmenter('en-US', {
  granularity: 'sentence'
});

const paragraph = 'Hello world. How are you? I am fine.';
const sentences = [...sentenceSegmenter.segment(paragraph)];
// Three sentences

// Grapheme segmentation (handles emoji and combining characters)
const graphemeSegmenter = new Intl.Segmenter('en-US', {
  granularity: 'grapheme'
});

const emoji = '👨‍👩‍👧‍👦';  // Family emoji
const graphemes = [...graphemeSegmenter.segment(emoji)];
graphemes.length;  // 1 (correctly identified as one grapheme)

// Compare with spread
[...emoji].length;  // 7 (incorrectly split)
```

## Display Names

### DisplayNames

```javascript
// Language names
const languageNames = new Intl.DisplayNames(['en'], {
  type: 'language'
});

languageNames.of('en');     // 'English'
languageNames.of('zh');     // 'Chinese'
languageNames.of('ja');     // 'Japanese'
languageNames.of('ko');     // 'Korean'

// Region names
const regionNames = new Intl.DisplayNames(['en'], {
  type: 'region'
});

regionNames.of('US');  // 'United States'
regionNames.of('CN');  // 'China'
regionNames.of('JP');  // 'Japan'

// Currency names
const currencyNames = new Intl.DisplayNames(['en'], {
  type: 'currency'
});

currencyNames.of('USD');  // 'US Dollar'
currencyNames.of('EUR');  // 'Euro'
currencyNames.of('GBP');  // 'British Pound'

// Calendar names
const calendarNames = new Intl.DisplayNames(['en'], {
  type: 'calendar'
});

calendarNames.of('gregorian');  // 'Gregorian Calendar'
calendarNames.of('chinese');    // 'Chinese Calendar'

// Script names
const scriptNames = new Intl.DisplayNames(['en'], {
  type: 'script'
});

scriptNames.of('Latn');  // 'Latin'
scriptNames.of('Hans');  // 'Simplified Han'
```

## Locale Information

### Locale

```javascript
// Create Locale object
const locale = new Intl.Locale('en-US');

locale.language;   // 'en'
locale.region;     // 'US'
locale.baseName;   // 'en-US'

// Locale with extensions
const localeExt = new Intl.Locale('en-US-u-nu-arab');
localeExt.numberingSystem;  // 'arab'

// Get calendar information
const calendars = locale.getCalendars();
// ['gregory']

// Get time zones
const timeZones = locale.getTimeZones();
// ['America/New_York', ...]

// Get week info
const weekInfo = locale.getWeekInfo();
// { firstDay: 7, weekend: [6, 7], minimalDays: 1 }

// Get hour cycles
const hourCycles = locale.getHourCycles();
// ['h12']

// Minimize/maximize
const minimized = locale.minimize();
const maximized = locale.maximize();
```

## Best Practices Summary

```
Intl API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Number Formatting                                 │
│   ├── Use NumberFormat + currency for money        │
│   ├── Use compact notation for large numbers       │
│   └── Use appropriate style for percent/units      │
│                                                     │
│   Date Time                                         │
│   ├── Use DateTimeFormat for date display          │
│   ├── Use RelativeTimeFormat for relative time     │
│   └── Handle time zones properly                   │
│                                                     │
│   Text Processing                                   │
│   ├── Use Collator for sorting                     │
│   ├── Use ListFormat for lists                     │
│   └── Use Segmenter for word/sentence splitting    │
│                                                     │
│   Performance                                       │
│   ├── Reuse formatter instances                    │
│   └── Avoid creating instances in loops            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| API | Purpose | Example |
|-----|---------|---------|
| NumberFormat | Number/currency formatting | 1,234.56 / $100 |
| DateTimeFormat | Date time formatting | January 28, 2025 |
| RelativeTimeFormat | Relative time | yesterday, 2 hours ago |
| ListFormat | List formatting | A, B, and C |
| Collator | String comparison/sorting | Natural sort order |
| Segmenter | Text segmentation | Word/sentence splitting |

---

*Master the Intl API to build truly internationalized applications.*
