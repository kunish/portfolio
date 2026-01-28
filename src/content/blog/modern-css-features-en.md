---
title: 'Modern CSS Features: 2025 Must-Know Guide'
description: 'Explore modern CSS features like :has(), Cascade Layers, and Subgrid to boost your styling productivity'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'modern-css-features'
---

CSS is experiencing a renaissance. Over the past few years, browser vendors have united to ship powerful new features. From the "parent selector" `:has()` to cascade control with `@layer`, these features are changing how we write styles.

## :has() — Finally, a "Parent Selector"

`:has()` is called CSS's most powerful new selector, allowing you to select elements based on their descendants.

### Basic Usage

```css
/* Select cards that contain images */
.card:has(img) {
  display: grid;
  grid-template-rows: 200px 1fr;
}

/* Select form groups with required inputs */
.form-group:has(input:required) {
  font-weight: bold;
}

/* Select list items with checked checkboxes */
li:has(input:checked) {
  background-color: #e8f5e9;
}
```

### Practical Scenarios

**1. Form Validation Styling**

```css
/* When input is invalid, entire form group turns red */
.form-group:has(input:invalid) {
  border-left: 3px solid #e53935;
}

/* When input is valid, show success state */
.form-group:has(input:valid) {
  border-left: 3px solid #43a047;
}

/* Highlight entire area on focus */
.form-group:has(input:focus) {
  background-color: #fff8e1;
}
```

**2. Dynamic Layouts**

```css
/* Adjust layout based on child count */
.grid:has(> :nth-child(4)) {
  grid-template-columns: repeat(2, 1fr);
}

.grid:has(> :nth-child(7)) {
  grid-template-columns: repeat(3, 1fr);
}

/* Card layout when no image present */
.card:not(:has(img)) {
  padding: 2rem;
}
```

**3. State-Driven Global Styles**

```css
/* Dark mode toggle */
body:has(#dark-mode:checked) {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
}

/* Adjust main content when sidebar is expanded */
body:has(.sidebar.expanded) .main-content {
  margin-left: 280px;
}

/* Prevent scrolling when modal is open */
body:has(.modal.open) {
  overflow: hidden;
}
```

### Combining :has() with Other Selectors

```css
/* Select card immediately following a card with image */
.card:has(img) + .card {
  margin-top: 2rem;
}

/* Select empty state */
.list:not(:has(li)) {
  display: grid;
  place-content: center;
}
.list:not(:has(li))::after {
  content: 'No data available';
  color: #999;
}
```

## @layer — Cascade Layer Control

Cascade Layers let you precisely control style priority without fighting selector specificity.

### Basic Syntax

```css
/* Define layer order (later = higher priority) */
@layer reset, base, components, utilities;

/* Add styles to specific layers */
@layer reset {
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
}

@layer base {
  body {
    font-family: system-ui, sans-serif;
    line-height: 1.6;
  }
}

@layer components {
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 4px;
  }
}

@layer utilities {
  .mt-4 { margin-top: 1rem; }
  .hidden { display: none; }
}
```

### Why Do We Need @layer?

```css
/* Traditional problem: third-party library styles hard to override */
/* Even with lower specificity, you can now override */

@layer third-party, custom;

@layer third-party {
  /* Imported UI library styles */
  .btn {
    background: blue;  /* Specificity: 0,0,1,0 */
  }
}

@layer custom {
  /* Your custom styles, higher priority! */
  .btn {
    background: green;  /* Same specificity, but higher layer priority */
  }
}
```

### Nested Layers

```css
@layer components {
  @layer buttons {
    .btn { /* ... */ }
  }

  @layer cards {
    .card { /* ... */ }
  }
}

/* Or reference like this */
@layer components.buttons {
  .btn-primary { /* ... */ }
}
```

### Anonymous Layers and Imports

```css
/* Anonymous layer (lowest priority) */
@layer {
  /* These styles come before all named layers */
}

/* Put external styles into a layer */
@import url("bootstrap.css") layer(framework);
```

## Subgrid — Grid of Grids

Subgrid lets child grids inherit parent grid track definitions, solving nested alignment issues.

### The Problem

```html
<div class="card-grid">
  <article class="card">
    <h2>Short Title</h2>
    <p>Content text...</p>
    <footer>Action Button</footer>
  </article>
  <article class="card">
    <h2>This is a very very long title that needs to wrap</h2>
    <p>Content text...</p>
    <footer>Action Button</footer>
  </article>
</div>
```

Without Subgrid, internal elements of each card can't align:

```
┌─────────────────┐ ┌─────────────────┐
│ Short Title     │ │ This is a very  │
│                 │ │ long title that │
├─────────────────┤ │ needs to wrap   │
│ Content text... │ ├─────────────────┤  ← Misaligned!
├─────────────────┤ │ Content text... │
│ Action Button   │ ├─────────────────┤
└─────────────────┘ │ Action Button   │
                    └─────────────────┘
```

### The Subgrid Solution

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;

  /* Define row tracks for subgrid to use */
  grid-template-rows: subgrid;
}

.card {
  display: grid;

  /* Inherit parent's row tracks */
  grid-template-rows: subgrid;

  /* Span 3 rows */
  grid-row: span 3;
}
```

Now all card titles, content, and action areas align perfectly!

### Practical: Form Layout

```css
.form {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem 2rem;
}

.form-row {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
}

/* All labels and inputs automatically align */
.form-row label {
  grid-column: 1;
  text-align: right;
}

.form-row input {
  grid-column: 2;
}
```

## Native CSS Nesting

No more need for Sass/Less—browsers natively support CSS nesting!

```css
.card {
  background: white;
  border-radius: 8px;

  /* Nested children */
  .title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .content {
    color: #666;
  }

  /* Pseudo-classes and pseudo-elements */
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &::before {
    content: '';
    /* ... */
  }

  /* Nested media queries */
  @media (min-width: 768px) {
    display: flex;
    gap: 2rem;
  }
}
```

### The Nesting Selector &

```css
.btn {
  /* & represents the parent selector */

  /* .btn:hover */
  &:hover { }

  /* .btn.primary */
  &.primary { }

  /* .container .btn */
  .container & { }

  /* .btn + .btn */
  & + & {
    margin-left: 0.5rem;
  }
}
```

## color-mix() — Color Mixing

Native CSS can now mix colors:

```css
:root {
  --primary: #3b82f6;
  --white: #ffffff;
  --black: #000000;
}

.btn {
  background: var(--primary);
}

.btn:hover {
  /* Mix primary with 20% white */
  background: color-mix(in srgb, var(--primary), var(--white) 20%);
}

.btn:active {
  /* Mix primary with 20% black */
  background: color-mix(in srgb, var(--primary), var(--black) 20%);
}
```

### Creating Color Palettes

```css
:root {
  --primary: #3b82f6;

  /* Auto-generate light/dark variants */
  --primary-50: color-mix(in srgb, var(--primary), white 90%);
  --primary-100: color-mix(in srgb, var(--primary), white 80%);
  --primary-200: color-mix(in srgb, var(--primary), white 60%);
  --primary-300: color-mix(in srgb, var(--primary), white 40%);
  --primary-400: color-mix(in srgb, var(--primary), white 20%);
  --primary-500: var(--primary);
  --primary-600: color-mix(in srgb, var(--primary), black 20%);
  --primary-700: color-mix(in srgb, var(--primary), black 40%);
  --primary-800: color-mix(in srgb, var(--primary), black 60%);
  --primary-900: color-mix(in srgb, var(--primary), black 80%);
}
```

## Other Useful New Features

### Logical Properties

```css
/* Traditional approach */
.element {
  margin-left: 1rem;
  margin-right: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

/* Logical properties (RTL-friendly) */
.element {
  margin-inline: 1rem;    /* left/right */
  padding-block: 0.5rem;  /* top/bottom */
}
```

### accent-color

```css
/* One line to change form control colors */
:root {
  accent-color: #3b82f6;
}

/* All checkboxes, radio buttons, progress bars use this color */
```

### text-wrap: balance

```css
/* Balance headline wrapping to avoid orphans */
h1, h2, h3 {
  text-wrap: balance;
}

/* For longer text, use pretty */
p {
  text-wrap: pretty;
}
```

### @scope

```css
/* Limit style scope */
@scope (.card) to (.card-content) {
  /* These styles only apply inside .card but not .card-content and its descendants */
  p {
    margin-bottom: 1rem;
  }
}
```

## Browser Support

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| :has() | 105+ | 121+ | 15.4+ |
| @layer | 99+ | 97+ | 15.4+ |
| Subgrid | 117+ | 71+ | 16+ |
| Nesting | 120+ | 117+ | 17.2+ |
| color-mix() | 111+ | 113+ | 16.2+ |

### Progressive Enhancement Strategy

```css
/* Fallback */
.card {
  display: flex;
  flex-direction: column;
}

/* Modern browser enhancement */
@supports (grid-template-rows: subgrid) {
  .card {
    display: grid;
    grid-template-rows: subgrid;
  }
}

@supports selector(:has(*)) {
  .form-group:has(:invalid) {
    border-color: red;
  }
}
```

## Summary

Modern CSS is becoming incredibly powerful:

| Feature | Problem Solved |
|---------|----------------|
| `:has()` | Parent selection, state-driven styles |
| `@layer` | Style priority management |
| Subgrid | Nested grid alignment |
| Nesting | Reduce selector repetition |
| `color-mix()` | Dynamic color calculation |

**Key Takeaways**:

1. `:has()` is the most powerful new selector, unlocking countless possibilities
2. `@layer` makes style priority controllable and predictable
3. Subgrid solves years of nested alignment challenges
4. Native nesting makes CSS preprocessors' core features optional
5. New features are rapidly gaining browser support

The future of CSS is here. These features not only make code cleaner but turn interactions that once required JavaScript into pure CSS solutions.

---

*CSS is no longer just "Cascading Style Sheets"—it's becoming a powerful declarative programming language.*
