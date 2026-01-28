---
title: 'CSS Variables (Custom Properties) Complete Guide'
description: 'Master CSS variable declaration, usage, scoping, and dynamic modification techniques'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'css-variables-guide'
---

CSS variables (custom properties) are an important feature of modern CSS. This article covers various usage patterns and techniques for CSS variables.

## Basic Syntax

### Declaring Variables

```css
/* Declare global variables in :root */
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --font-size-base: 16px;
  --spacing-unit: 8px;
  --border-radius: 4px;
}

/* Declare local variables in selectors */
.card {
  --card-padding: 20px;
  --card-bg: #ffffff;
}

/* Variable naming conventions */
:root {
  /* Use semantic naming */
  --color-primary: #3498db;
  --color-text: #333333;
  --size-header: 64px;

  /* Use hyphens as separators */
  --font-family-base: system-ui, sans-serif;
  --transition-duration: 0.3s;
}
```

### Using Variables

```css
/* Use the var() function */
.button {
  background-color: var(--primary-color);
  padding: var(--spacing-unit);
  border-radius: var(--border-radius);
}

/* Provide fallback values */
.text {
  color: var(--text-color, #333333);
  font-size: var(--font-size, 16px);
}

/* Nested fallback values */
.element {
  color: var(--theme-color, var(--primary-color, blue));
}

/* Use in calc() */
.container {
  padding: calc(var(--spacing-unit) * 2);
  margin: calc(var(--spacing-unit) * 3);
  width: calc(100% - var(--sidebar-width, 250px));
}
```

## Scoping

### Global Scope

```css
/* :root pseudo-class represents the document root */
:root {
  --global-color: #3498db;
  --global-spacing: 16px;
}

/* Available anywhere */
.header {
  background: var(--global-color);
}

.footer {
  padding: var(--global-spacing);
}
```

### Local Scope

```css
/* Variables are valid in declaring selector and descendants */
.card {
  --card-color: #ffffff;
}

.card .title {
  color: var(--card-color);  /* Valid */
}

.other-element {
  color: var(--card-color);  /* Invalid, uses fallback or inherited */
}
```

### Variable Override

```css
:root {
  --button-bg: #3498db;
}

/* Override in specific contexts */
.dark-theme {
  --button-bg: #2980b9;
}

.button {
  background: var(--button-bg);
}

/* Component-level override */
.button-danger {
  --button-bg: #e74c3c;
}

/* Override in media queries */
@media (prefers-color-scheme: dark) {
  :root {
    --button-bg: #2980b9;
  }
}
```

## Theme Systems

### Light/Dark Theme

```css
/* Define theme variables */
:root {
  /* Light theme (default) */
  --bg-color: #ffffff;
  --text-color: #333333;
  --border-color: #e0e0e0;
  --shadow-color: rgba(0, 0, 0, 0.1);
}

/* Dark theme */
[data-theme="dark"] {
  --bg-color: #1a1a2e;
  --text-color: #eaeaea;
  --border-color: #3a3a5c;
  --shadow-color: rgba(0, 0, 0, 0.3);
}

/* Follow system preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-color: #1a1a2e;
    --text-color: #eaeaea;
    --border-color: #3a3a5c;
    --shadow-color: rgba(0, 0, 0, 0.3);
  }
}

/* Use variables */
body {
  background-color: var(--bg-color);
  color: var(--text-color);
}

.card {
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px var(--shadow-color);
}
```

### Multiple Theme Support

```css
/* Theme variables */
:root {
  --primary: #3498db;
  --primary-light: #5dade2;
  --primary-dark: #2980b9;
}

[data-theme="green"] {
  --primary: #2ecc71;
  --primary-light: #58d68d;
  --primary-dark: #27ae60;
}

[data-theme="purple"] {
  --primary: #9b59b6;
  --primary-light: #af7ac5;
  --primary-dark: #8e44ad;
}

/* Component usage */
.button-primary {
  background: var(--primary);
}

.button-primary:hover {
  background: var(--primary-light);
}

.button-primary:active {
  background: var(--primary-dark);
}
```

## Dynamic Modification

### JavaScript Operations

```javascript
// Get variable value
const root = document.documentElement;
const primaryColor = getComputedStyle(root)
  .getPropertyValue('--primary-color');

// Set variable value
root.style.setProperty('--primary-color', '#e74c3c');

// Remove variable
root.style.removeProperty('--primary-color');

// Set on specific element
const card = document.querySelector('.card');
card.style.setProperty('--card-bg', '#f0f0f0');

// Get element's variable
const cardBg = getComputedStyle(card)
  .getPropertyValue('--card-bg');
```

### Theme Switching

```javascript
// Set theme
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Load saved theme
function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
}

// Detect system preference
function detectSystemTheme() {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setTheme('dark');
  }
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', e => {
    setTheme(e.matches ? 'dark' : 'light');
  });
```

### Animation Control

```css
:root {
  --animation-duration: 0.3s;
  --animation-timing: ease-in-out;
}

.element {
  transition: transform var(--animation-duration) var(--animation-timing);
}

/* Reduce motion (accessibility) */
@media (prefers-reduced-motion: reduce) {
  :root {
    --animation-duration: 0.01ms;
  }
}
```

```javascript
// Dynamically adjust animation speed
function setAnimationSpeed(speed) {
  const duration = speed === 'fast' ? '0.1s' :
                   speed === 'slow' ? '0.5s' : '0.3s';
  document.documentElement.style.setProperty(
    '--animation-duration',
    duration
  );
}
```

## Practical Patterns

### Spacing System

```css
:root {
  --space-unit: 8px;
  --space-xs: calc(var(--space-unit) * 0.5);  /* 4px */
  --space-sm: var(--space-unit);               /* 8px */
  --space-md: calc(var(--space-unit) * 2);     /* 16px */
  --space-lg: calc(var(--space-unit) * 3);     /* 24px */
  --space-xl: calc(var(--space-unit) * 4);     /* 32px */
  --space-2xl: calc(var(--space-unit) * 6);    /* 48px */
}

.card {
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.card-header {
  margin-bottom: var(--space-sm);
}
```

### Color System

```css
:root {
  /* Base colors */
  --color-blue-50: #e3f2fd;
  --color-blue-100: #bbdefb;
  --color-blue-500: #2196f3;
  --color-blue-700: #1976d2;
  --color-blue-900: #0d47a1;

  /* Semantic colors */
  --color-primary: var(--color-blue-500);
  --color-primary-light: var(--color-blue-100);
  --color-primary-dark: var(--color-blue-700);

  /* Status colors */
  --color-success: #4caf50;
  --color-warning: #ff9800;
  --color-error: #f44336;
  --color-info: #2196f3;
}
```

### Typography System

```css
:root {
  /* Font families */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: 'Fira Code', monospace;

  /* Font sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-bold: 700;
}

h1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

p {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}
```

### Responsive Variables

```css
:root {
  --container-width: 100%;
  --sidebar-width: 250px;
  --header-height: 60px;
}

@media (min-width: 768px) {
  :root {
    --container-width: 750px;
    --header-height: 80px;
  }
}

@media (min-width: 1024px) {
  :root {
    --container-width: 980px;
    --sidebar-width: 300px;
  }
}

@media (min-width: 1280px) {
  :root {
    --container-width: 1200px;
  }
}

.container {
  max-width: var(--container-width);
  margin: 0 auto;
}

.sidebar {
  width: var(--sidebar-width);
}

.header {
  height: var(--header-height);
}
```

## Component Design

### Customizable Components

```css
/* Button component */
.button {
  /* Component internal variables */
  --btn-padding-x: 1rem;
  --btn-padding-y: 0.5rem;
  --btn-bg: var(--color-primary);
  --btn-color: white;
  --btn-border-radius: var(--border-radius);

  padding: var(--btn-padding-y) var(--btn-padding-x);
  background: var(--btn-bg);
  color: var(--btn-color);
  border-radius: var(--btn-border-radius);
}

/* Size variants */
.button-sm {
  --btn-padding-x: 0.75rem;
  --btn-padding-y: 0.25rem;
  font-size: var(--text-sm);
}

.button-lg {
  --btn-padding-x: 1.5rem;
  --btn-padding-y: 0.75rem;
  font-size: var(--text-lg);
}

/* Color variants */
.button-secondary {
  --btn-bg: var(--color-secondary);
}

.button-danger {
  --btn-bg: var(--color-error);
}
```

### Card Component

```css
.card {
  --card-padding: var(--space-md);
  --card-bg: var(--bg-color);
  --card-border: 1px solid var(--border-color);
  --card-radius: var(--border-radius);
  --card-shadow: 0 2px 8px var(--shadow-color);

  padding: var(--card-padding);
  background: var(--card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

/* Inline override */
.card.featured {
  --card-border: 2px solid var(--color-primary);
  --card-shadow: 0 4px 16px var(--shadow-color);
}
```

## With SCSS

```scss
// SCSS variables for compile time
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;

// CSS variables for runtime
:root {
  --primary: #3498db;
  --spacing: 16px;
}

// Mixed usage
.container {
  padding: var(--spacing);

  @media (min-width: $breakpoint-md) {
    --spacing: 24px;
  }
}

// SCSS function to generate CSS variables
@function css-var($name, $fallback: null) {
  @if $fallback {
    @return var(--#{$name}, #{$fallback});
  }
  @return var(--#{$name});
}

.element {
  color: css-var(primary-color, blue);
}
```

## Best Practices Summary

```
CSS Variables Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Naming Conventions                                │
│   ├── Use semantic naming                          │
│   ├── Keep naming consistent                       │
│   └── Use hyphens as separators                    │
│                                                     │
│   Organization                                      │
│   ├── Global variables in :root                    │
│   ├── Component variables in component selector    │
│   └── Categorize (colors, spacing, typography)     │
│                                                     │
│   Performance                                       │
│   ├── Avoid deeply nested variables               │
│   ├── Batch updates reduce repaints               │
│   └── Use class toggle instead of frequent JS     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach | Example |
|----------|---------------------|---------|
| Theme switching | data attribute + variable override | [data-theme="dark"] |
| Component customization | Component-level variables | --btn-bg |
| Responsive | Media query override | Reassign in @media |
| Dynamic values | JS setProperty | style.setProperty() |

---

*Master CSS variables to build flexible and maintainable styling systems.*
