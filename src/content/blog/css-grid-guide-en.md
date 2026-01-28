---
title: 'CSS Grid Layout Complete Guide: From Basics to Complex Layouts'
description: 'Master Grid container properties, grid line positioning, responsive layouts and practical examples'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'css-grid-guide'
---

CSS Grid is a two-dimensional layout system that makes creating complex page structures easy. This article explores Grid's core concepts and practical applications.

## Grid Basics

### Core Concepts

```
Grid Layout Structure:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Grid Container                                    │
│   ├── display: grid                                │
│   ├── grid-template-columns                        │
│   ├── grid-template-rows                           │
│   └── gap                                          │
│                                                     │
│   Grid Item                                         │
│   ├── grid-column                                  │
│   ├── grid-row                                     │
│   └── grid-area                                    │
│                                                     │
│   Grid Lines                                        │
│   ├── Column lines: 1, 2, 3...                     │
│   └── Row lines: 1, 2, 3...                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Term | Description |
|------|-------------|
| Grid Container | Element with display: grid |
| Grid Item | Direct children of container |
| Grid Line | Lines that divide the grid |
| Grid Cell | Intersection of row and column |
| Grid Track | Space between adjacent grid lines |
| Grid Area | Multiple cells forming a region |

### Creating a Grid

```css
.container {
  display: grid;

  /* Define columns */
  grid-template-columns: 200px 1fr 200px;

  /* Define rows */
  grid-template-rows: 100px auto 100px;

  /* Gap */
  gap: 20px;
  /* Or set separately */
  row-gap: 20px;
  column-gap: 10px;
}
```

```html
<div class="container">
  <div class="item">1</div>
  <div class="item">2</div>
  <div class="item">3</div>
  <div class="item">4</div>
  <div class="item">5</div>
  <div class="item">6</div>
</div>
```

## Columns and Rows

### The fr Unit

```css
.container {
  /* fr represents a fraction of available space */
  grid-template-columns: 1fr 2fr 1fr;

  /* Mixed units */
  grid-template-columns: 200px 1fr 100px;

  /* Percentages */
  grid-template-columns: 25% 50% 25%;
}
```

### The repeat() Function

```css
.container {
  /* Repeat 4 columns, each 1fr */
  grid-template-columns: repeat(4, 1fr);

  /* Repeat pattern */
  grid-template-columns: repeat(3, 100px 200px);
  /* Equals: 100px 200px 100px 200px 100px 200px */

  /* Auto-fill */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

  /* Auto-fit */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
```

### The minmax() Function

```css
.container {
  /* Minimum 100px, maximum 1fr */
  grid-template-columns: minmax(100px, 1fr) 2fr 1fr;

  /* Responsive grid */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

### auto-fill vs auto-fit

```css
/* auto-fill: creates as many columns as possible, even empty ones */
.grid-fill {
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}

/* auto-fit: collapses empty columns, lets items expand */
.grid-fit {
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}
```

## Grid Line Positioning

### Line-Based Placement

```css
.item {
  /* Column start / column end */
  grid-column: 1 / 3;

  /* Row start / row end */
  grid-row: 1 / 2;

  /* Longhand */
  grid-column-start: 1;
  grid-column-end: 3;
  grid-row-start: 1;
  grid-row-end: 2;
}

/* Span specified number */
.item-span {
  grid-column: 1 / span 2; /* Start at line 1, span 2 columns */
  grid-row: span 3; /* Span 3 rows */
}

/* Negative values count from end */
.item-full {
  grid-column: 1 / -1; /* Span all columns */
}
```

### Named Grid Lines

```css
.container {
  grid-template-columns:
    [sidebar-start] 200px
    [sidebar-end main-start] 1fr
    [main-end];

  grid-template-rows:
    [header-start] 80px
    [header-end content-start] 1fr
    [content-end footer-start] 60px
    [footer-end];
}

.header {
  grid-column: sidebar-start / main-end;
  grid-row: header-start / header-end;
}

.sidebar {
  grid-column: sidebar-start / sidebar-end;
  grid-row: content-start / content-end;
}

.main {
  grid-column: main-start / main-end;
  grid-row: content-start / content-end;
}
```

## Grid Areas

### grid-template-areas

```css
.container {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 80px 1fr 60px;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  gap: 10px;
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.aside   { grid-area: aside; }
.footer  { grid-area: footer; }
```

### Empty Cells

```css
.container {
  grid-template-areas:
    "header header header"
    "sidebar main ."      /* . represents empty cell */
    "footer footer footer";
}
```

## Alignment

### Container Alignment

```css
.container {
  /* Horizontal alignment for all items */
  justify-items: start | end | center | stretch;

  /* Vertical alignment for all items */
  align-items: start | end | center | stretch;

  /* Shorthand */
  place-items: center center;

  /* Horizontal alignment for entire grid */
  justify-content: start | end | center | stretch | space-around | space-between | space-evenly;

  /* Vertical alignment for entire grid */
  align-content: start | end | center | stretch | space-around | space-between | space-evenly;

  /* Shorthand */
  place-content: center center;
}
```

### Item Alignment

```css
.item {
  /* Single item horizontal alignment */
  justify-self: start | end | center | stretch;

  /* Single item vertical alignment */
  align-self: start | end | center | stretch;

  /* Shorthand */
  place-self: center center;
}
```

## Implicit Grid

### Auto Rows and Columns

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* Explicitly defined rows */
  grid-template-rows: 100px 100px;

  /* Height for implicit rows */
  grid-auto-rows: 150px;

  /* Using minmax */
  grid-auto-rows: minmax(100px, auto);

  /* Width for implicit columns */
  grid-auto-columns: 100px;

  /* Auto placement direction */
  grid-auto-flow: row | column | dense;
}
```

### Dense Packing

```css
.container {
  grid-auto-flow: row dense;
  /* Automatically fills gaps */
}
```

## Responsive Layouts

### Media Queries

```css
.container {
  display: grid;
  gap: 20px;
}

/* Mobile: single column */
@media (max-width: 600px) {
  .container {
    grid-template-columns: 1fr;
  }
}

/* Tablet: two columns */
@media (min-width: 601px) and (max-width: 900px) {
  .container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: three columns */
@media (min-width: 901px) {
  .container {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Media Query-Free Responsive

```css
/* Self-adapting column count */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  gap: 20px;
}
```

## Practical Layouts

### Classic Holy Grail

```css
.holy-grail {
  display: grid;
  min-height: 100vh;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 200px 1fr 200px;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
}

.header { grid-area: header; background: #3498db; }
.nav    { grid-area: nav;    background: #2ecc71; }
.main   { grid-area: main;   background: #ecf0f1; }
.aside  { grid-area: aside;  background: #e74c3c; }
.footer { grid-area: footer; background: #9b59b6; }

/* Responsive */
@media (max-width: 768px) {
  .holy-grail {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "nav"
      "main"
      "aside"
      "footer";
  }
}
```

### Card Grid

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
}

.card {
  display: grid;
  grid-template-rows: 200px 1fr auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-image {
  background-size: cover;
  background-position: center;
}

.card-content {
  padding: 16px;
}

.card-footer {
  padding: 16px;
  border-top: 1px solid #eee;
}
```

### Dashboard Layout

```css
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: 60px 1fr;
  grid-template-areas:
    "sidebar header"
    "sidebar main";
  min-height: 100vh;
}

.dashboard-header {
  grid-area: header;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 0 20px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dashboard-sidebar {
  grid-area: sidebar;
  background: #2c3e50;
  color: #fff;
}

.dashboard-main {
  grid-area: main;
  padding: 20px;
  background: #f5f6fa;

  /* Nested grid */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  align-content: start;
}
```

### Image Gallery

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  gap: 10px;
}

/* Featured items */
.gallery-item.featured {
  grid-column: span 2;
  grid-row: span 2;
}

.gallery-item.wide {
  grid-column: span 2;
}

.gallery-item.tall {
  grid-row: span 2;
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

## Grid vs Flexbox

```
When to Use:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Grid is Best For                                  │
│   ├── Two-dimensional layouts (rows and columns)   │
│   ├── Complex page structures                      │
│   ├── Precise position control                     │
│   └── Responsive multi-column layouts              │
│                                                     │
│   Flexbox is Best For                               │
│   ├── One-dimensional layouts (row or column)      │
│   ├── Content-driven layouts                       │
│   ├── Navigation menus                             │
│   └── Item alignment and distribution              │
│                                                     │
│   Combined Usage                                    │
│   ├── Grid for overall page layout                 │
│   └── Flexbox for component internal layout        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Feature | Grid | Flexbox |
|---------|------|---------|
| Dimensions | 2D | 1D |
| Direction | Rows and columns | Row or column |
| Control | Container-controlled | Content-driven |
| Alignment | Precise positioning | Flexible distribution |
| Best For | Page layouts | Component layouts |

## Best Practices Summary

```
CSS Grid Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Naming & Organization                             │
│   ├── Use named grid lines for readability         │
│   ├── grid-template-areas for visual layouts       │
│   ├── Keep grid structure simple                   │
│   └── Use CSS variables appropriately              │
│                                                     │
│   Responsive Design                                 │
│   ├── Prefer auto-fit/auto-fill                    │
│   ├── minmax() for flexible ranges                 │
│   ├── Mobile-first media queries                   │
│   └── Avoid fixed pixel values                     │
│                                                     │
│   Performance                                       │
│   ├── Avoid deeply nested grids                    │
│   ├── Use subgrid for nested grid alignment        │
│   └── Minimize reflow triggers                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

*Master CSS Grid and make complex layouts simple and intuitive.*
