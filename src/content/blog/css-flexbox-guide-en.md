---
title: 'CSS Flexbox Layout Complete Guide'
description: 'Master flexbox container properties, item properties, and practical techniques'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'css-flexbox-guide'
---

Flexbox is a core technology for modern CSS layouts. This article covers all Flexbox properties and practical techniques.

## Basic Concepts

### What is Flexbox

```
Flexbox Layout Model:
┌─────────────────────────────────────────────────────┐
│  Flex Container                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │  Item   │ │  Item   │ │  Item   │               │
│  │   1     │ │   2     │ │   3     │               │
│  └─────────┘ └─────────┘ └─────────┘               │
│  ← ─ ─ ─ ─ ─ ─ ─ Main Axis ─ ─ ─ ─ ─ ─ ─ →        │
│              ↑                                      │
│              │ Cross Axis                           │
│              ↓                                      │
└─────────────────────────────────────────────────────┘
```

### Enabling Flexbox

```css
/* Create flex container */
.container {
  display: flex;
}

/* Inline flex container */
.container-inline {
  display: inline-flex;
}
```

## Container Properties

### flex-direction

```css
/* Main axis direction */
.container {
  flex-direction: row;            /* Default: horizontal left to right */
  flex-direction: row-reverse;    /* Horizontal right to left */
  flex-direction: column;         /* Vertical top to bottom */
  flex-direction: column-reverse; /* Vertical bottom to top */
}
```

```
row:           [1] [2] [3]
row-reverse:   [3] [2] [1]
column:        [1]
               [2]
               [3]
column-reverse:[3]
               [2]
               [1]
```

### flex-wrap

```css
/* Wrapping control */
.container {
  flex-wrap: nowrap;       /* Default: no wrapping */
  flex-wrap: wrap;         /* Wrap, first line on top */
  flex-wrap: wrap-reverse; /* Wrap, first line on bottom */
}
```

### flex-flow

```css
/* Shorthand for flex-direction and flex-wrap */
.container {
  flex-flow: row wrap;
  flex-flow: column nowrap;
}
```

### justify-content

```css
/* Main axis alignment */
.container {
  justify-content: flex-start;    /* Align to start */
  justify-content: flex-end;      /* Align to end */
  justify-content: center;        /* Center */
  justify-content: space-between; /* Space between items */
  justify-content: space-around;  /* Equal space around items */
  justify-content: space-evenly;  /* Equal space everywhere */
}
```

```
flex-start:    |[1][2][3]        |
flex-end:      |        [1][2][3]|
center:        |    [1][2][3]    |
space-between: |[1]    [2]    [3]|
space-around:  | [1]  [2]  [3] |
space-evenly:  |  [1]  [2]  [3]  |
```

### align-items

```css
/* Cross axis alignment (single line) */
.container {
  align-items: stretch;    /* Default: stretch to fill */
  align-items: flex-start; /* Cross axis start */
  align-items: flex-end;   /* Cross axis end */
  align-items: center;     /* Cross axis center */
  align-items: baseline;   /* Baseline alignment */
}
```

### align-content

```css
/* Multi-line alignment (only with wrap) */
.container {
  align-content: flex-start;
  align-content: flex-end;
  align-content: center;
  align-content: space-between;
  align-content: space-around;
  align-content: stretch;      /* Default */
}
```

### gap

```css
/* Gap between items (modern property) */
.container {
  gap: 10px;           /* Same row and column gap */
  gap: 10px 20px;      /* Row gap, column gap */
  row-gap: 10px;       /* Row gap only */
  column-gap: 20px;    /* Column gap only */
}
```

## Item Properties

### order

```css
/* Display order (default 0) */
.item:nth-child(1) { order: 3; }
.item:nth-child(2) { order: 1; }
.item:nth-child(3) { order: 2; }
/* Display order: 2, 3, 1 */
```

### flex-grow

```css
/* Grow ratio (default 0, no growth) */
.item { flex-grow: 0; }  /* No growth */
.item { flex-grow: 1; }  /* Equal growth */

/* Different ratios */
.item1 { flex-grow: 1; }  /* Takes 1/6 */
.item2 { flex-grow: 2; }  /* Takes 2/6 */
.item3 { flex-grow: 3; }  /* Takes 3/6 */
```

### flex-shrink

```css
/* Shrink ratio (default 1, can shrink) */
.item { flex-shrink: 0; }  /* No shrink */
.item { flex-shrink: 1; }  /* Equal shrink */
.item { flex-shrink: 2; }  /* Shrink more */
```

### flex-basis

```css
/* Initial size */
.item { flex-basis: auto; }   /* Default: based on content */
.item { flex-basis: 0; }      /* Start from zero */
.item { flex-basis: 200px; }  /* Fixed initial width */
.item { flex-basis: 25%; }    /* Percentage */
```

### flex

```css
/* Shorthand for flex-grow, flex-shrink, flex-basis */
.item { flex: 0 1 auto; }     /* Default value */
.item { flex: 1; }            /* Equals 1 1 0 */
.item { flex: auto; }         /* Equals 1 1 auto */
.item { flex: none; }         /* Equals 0 0 auto */
.item { flex: 2 1 200px; }    /* Full syntax */
```

### align-self

```css
/* Individual item cross axis alignment (overrides align-items) */
.item {
  align-self: auto;       /* Inherit container setting */
  align-self: flex-start;
  align-self: flex-end;
  align-self: center;
  align-self: baseline;
  align-self: stretch;
}
```

## Practical Layouts

### Horizontal and Vertical Centering

```css
/* Simplest centering solution */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
```

### Navigation Bar Layout

```css
/* Logo left, navigation right */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.navbar .logo {
  flex-shrink: 0;
}

.navbar .nav-links {
  display: flex;
  gap: 1rem;
}

/* Centered navigation, logo and actions on sides */
.navbar-centered {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-centered .nav-links {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
```

### Card Grid

```css
/* Responsive card layout */
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.card {
  flex: 1 1 300px;  /* Minimum 300px, flexible */
  max-width: 400px;
}

/* Fixed columns */
.three-column {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.three-column .item {
  flex: 0 0 calc(33.333% - 1rem);
}
```

### Sidebar Layout

```css
/* Fixed sidebar + flexible main content */
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  flex: 0 0 250px;  /* Fixed width */
}

.main-content {
  flex: 1;          /* Fill remaining space */
}

/* Collapsible sidebar */
.sidebar.collapsed {
  flex-basis: 60px;
}
```

### Sticky Footer

```css
/* Footer at bottom when content is short */
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;  /* Main content expands */
}

footer {
  flex-shrink: 0;
}
```

### Equal Height Columns

```css
/* Flexbox default equal height */
.columns {
  display: flex;
  gap: 1rem;
}

.column {
  flex: 1;
  /* Automatically equal height */
}
```

### Media Object

```css
/* Image + text layout */
.media {
  display: flex;
  gap: 1rem;
}

.media-image {
  flex-shrink: 0;
  width: 100px;
}

.media-content {
  flex: 1;
}

/* Reversed (image on right) */
.media-reverse {
  flex-direction: row-reverse;
}
```

### Input Group

```css
/* Button attached to input */
.input-group {
  display: flex;
}

.input-group input {
  flex: 1;
  border-radius: 4px 0 0 4px;
}

.input-group button {
  flex-shrink: 0;
  border-radius: 0 4px 4px 0;
}
```

## Responsive Techniques

### Mobile First

```css
/* Mobile: vertical stack */
.flex-container {
  display: flex;
  flex-direction: column;
}

/* Desktop: horizontal */
@media (min-width: 768px) {
  .flex-container {
    flex-direction: row;
  }
}
```

### Auto-Wrapping

```css
/* Auto-wrapping responsive layout */
.responsive-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.responsive-flex > * {
  flex: 1 1 250px;  /* Minimum 250px */
}
```

### Order Adjustment

```css
/* Change element order on mobile */
.sidebar {
  order: 1;
}

.main-content {
  order: 2;
}

@media (max-width: 768px) {
  .sidebar {
    order: 2;  /* Sidebar after on mobile */
  }

  .main-content {
    order: 1;  /* Main content first */
  }
}
```

## Common Issues

### Child Element Overflow

```css
/* Prevent flex child overflow */
.flex-item {
  min-width: 0;     /* Allow shrinking below content */
  overflow: hidden;
}

/* Text overflow ellipsis */
.flex-item-text {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### Maintain Aspect Ratio

```css
/* Flex item with aspect ratio */
.aspect-ratio-box {
  flex: 1;
  aspect-ratio: 16 / 9;
}
```

### Last Row Alignment

```css
/* Fix last row alignment issue */
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.grid::after {
  content: '';
  flex: 1 1 300px;  /* Same flex-basis as items */
  max-width: 300px;
  visibility: hidden;
}
```

## Best Practices Summary

```
Flexbox Usage Guide:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   When to Use Flexbox                               │
│   ├── One-dimensional layouts (row or column)      │
│   ├── Element alignment and distribution           │
│   ├── Dynamically sized elements                   │
│   └── Simple responsive layouts                    │
│                                                     │
│   Common Combinations                               │
│   ├── Centering: justify-content + align-items     │
│   ├── Equal distribution: flex: 1                  │
│   ├── Fixed + flexible: flex-basis + flex-grow     │
│   └── Wrapping: flex-wrap + gap                    │
│                                                     │
│   Issues to Avoid                                   │
│   ├── Use Grid for complex 2D layouts              │
│   ├── Note min-width: 0 to prevent overflow        │
│   └── Use gap instead of margin                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Property | Purpose | Common Values |
|----------|---------|---------------|
| justify-content | Main axis alignment | center, space-between |
| align-items | Cross axis alignment | center, stretch |
| flex | Flexible sizing | 1, none, auto |
| gap | Spacing | 1rem, 10px 20px |

---

*Master Flexbox to easily implement modern layouts.*
