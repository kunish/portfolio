---
title: 'CSS 变量（自定义属性）完全指南'
description: '掌握 CSS 变量的声明、使用、作用域、动态修改等核心技巧'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'css-variables-guide'
---

CSS 变量（自定义属性）是现代 CSS 的重要特性。本文详解 CSS 变量的各种用法和技巧。

## 基础语法

### 声明变量

```css
/* 在 :root 中声明全局变量 */
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --font-size-base: 16px;
  --spacing-unit: 8px;
  --border-radius: 4px;
}

/* 在选择器中声明局部变量 */
.card {
  --card-padding: 20px;
  --card-bg: #ffffff;
}

/* 变量命名规范 */
:root {
  /* 使用语义化命名 */
  --color-primary: #3498db;
  --color-text: #333333;
  --size-header: 64px;

  /* 使用连字符分隔 */
  --font-family-base: system-ui, sans-serif;
  --transition-duration: 0.3s;
}
```

### 使用变量

```css
/* 使用 var() 函数 */
.button {
  background-color: var(--primary-color);
  padding: var(--spacing-unit);
  border-radius: var(--border-radius);
}

/* 提供默认值 */
.text {
  color: var(--text-color, #333333);
  font-size: var(--font-size, 16px);
}

/* 嵌套默认值 */
.element {
  color: var(--theme-color, var(--primary-color, blue));
}

/* 在 calc() 中使用 */
.container {
  padding: calc(var(--spacing-unit) * 2);
  margin: calc(var(--spacing-unit) * 3);
  width: calc(100% - var(--sidebar-width, 250px));
}
```

## 作用域

### 全局作用域

```css
/* :root 伪类代表文档根元素 */
:root {
  --global-color: #3498db;
  --global-spacing: 16px;
}

/* 任何地方都可以使用 */
.header {
  background: var(--global-color);
}

.footer {
  padding: var(--global-spacing);
}
```

### 局部作用域

```css
/* 变量在声明的选择器及其后代中有效 */
.card {
  --card-color: #ffffff;
}

.card .title {
  color: var(--card-color);  /* 有效 */
}

.other-element {
  color: var(--card-color);  /* 无效，使用默认值或继承 */
}
```

### 变量覆盖

```css
:root {
  --button-bg: #3498db;
}

/* 在特定上下文中覆盖 */
.dark-theme {
  --button-bg: #2980b9;
}

.button {
  background: var(--button-bg);
}

/* 组件级覆盖 */
.button-danger {
  --button-bg: #e74c3c;
}

/* 媒体查询中覆盖 */
@media (prefers-color-scheme: dark) {
  :root {
    --button-bg: #2980b9;
  }
}
```

## 主题系统

### 亮色/暗色主题

```css
/* 定义主题变量 */
:root {
  /* 亮色主题（默认） */
  --bg-color: #ffffff;
  --text-color: #333333;
  --border-color: #e0e0e0;
  --shadow-color: rgba(0, 0, 0, 0.1);
}

/* 暗色主题 */
[data-theme="dark"] {
  --bg-color: #1a1a2e;
  --text-color: #eaeaea;
  --border-color: #3a3a5c;
  --shadow-color: rgba(0, 0, 0, 0.3);
}

/* 跟随系统偏好 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-color: #1a1a2e;
    --text-color: #eaeaea;
    --border-color: #3a3a5c;
    --shadow-color: rgba(0, 0, 0, 0.3);
  }
}

/* 使用变量 */
body {
  background-color: var(--bg-color);
  color: var(--text-color);
}

.card {
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px var(--shadow-color);
}
```

### 多主题支持

```css
/* 主题变量 */
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

/* 组件使用 */
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

## 动态修改

### JavaScript 操作

```javascript
// 获取变量值
const root = document.documentElement;
const primaryColor = getComputedStyle(root)
  .getPropertyValue('--primary-color');

// 设置变量值
root.style.setProperty('--primary-color', '#e74c3c');

// 移除变量
root.style.removeProperty('--primary-color');

// 在特定元素上设置
const card = document.querySelector('.card');
card.style.setProperty('--card-bg', '#f0f0f0');

// 获取元素上的变量
const cardBg = getComputedStyle(card)
  .getPropertyValue('--card-bg');
```

### 主题切换

```javascript
// 切换主题
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// 加载保存的主题
function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
}

// 检测系统偏好
function detectSystemTheme() {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setTheme('dark');
  }
}

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', e => {
    setTheme(e.matches ? 'dark' : 'light');
  });
```

### 动画控制

```css
:root {
  --animation-duration: 0.3s;
  --animation-timing: ease-in-out;
}

.element {
  transition: transform var(--animation-duration) var(--animation-timing);
}

/* 减少动画（无障碍） */
@media (prefers-reduced-motion: reduce) {
  :root {
    --animation-duration: 0.01ms;
  }
}
```

```javascript
// 动态调整动画速度
function setAnimationSpeed(speed) {
  const duration = speed === 'fast' ? '0.1s' :
                   speed === 'slow' ? '0.5s' : '0.3s';
  document.documentElement.style.setProperty(
    '--animation-duration',
    duration
  );
}
```

## 实用模式

### 间距系统

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

### 颜色系统

```css
:root {
  /* 基础颜色 */
  --color-blue-50: #e3f2fd;
  --color-blue-100: #bbdefb;
  --color-blue-500: #2196f3;
  --color-blue-700: #1976d2;
  --color-blue-900: #0d47a1;

  /* 语义化颜色 */
  --color-primary: var(--color-blue-500);
  --color-primary-light: var(--color-blue-100);
  --color-primary-dark: var(--color-blue-700);

  /* 状态颜色 */
  --color-success: #4caf50;
  --color-warning: #ff9800;
  --color-error: #f44336;
  --color-info: #2196f3;
}
```

### 排版系统

```css
:root {
  /* 字体族 */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: 'Fira Code', monospace;

  /* 字体大小 */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  /* 行高 */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* 字重 */
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

### 响应式变量

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

## 组件设计

### 可定制组件

```css
/* 按钮组件 */
.button {
  /* 组件内部变量 */
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

/* 尺寸变体 */
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

/* 颜色变体 */
.button-secondary {
  --btn-bg: var(--color-secondary);
}

.button-danger {
  --btn-bg: var(--color-error);
}
```

### 卡片组件

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

/* 内联覆盖 */
.card.featured {
  --card-border: 2px solid var(--color-primary);
  --card-shadow: 0 4px 16px var(--shadow-color);
}
```

## 与 SCSS 配合

```scss
// SCSS 变量用于编译时
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;

// CSS 变量用于运行时
:root {
  --primary: #3498db;
  --spacing: 16px;
}

// 混合使用
.container {
  padding: var(--spacing);

  @media (min-width: $breakpoint-md) {
    --spacing: 24px;
  }
}

// SCSS 函数生成 CSS 变量
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

## 最佳实践总结

```
CSS 变量最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   命名规范                                          │
│   ├── 使用语义化命名                               │
│   ├── 保持命名一致性                               │
│   └── 使用连字符分隔                               │
│                                                     │
│   组织结构                                          │
│   ├── 全局变量放在 :root                           │
│   ├── 组件变量放在组件选择器                       │
│   └── 分类整理（颜色、间距、排版）                 │
│                                                     │
│   性能考虑                                          │
│   ├── 避免过度嵌套变量                             │
│   ├── 批量更新减少重绘                             │
│   └── 使用类切换代替频繁 JS 修改                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐做法 | 示例 |
|------|----------|------|
| 主题切换 | data 属性 + 变量覆盖 | [data-theme="dark"] |
| 组件定制 | 组件级变量 | --btn-bg |
| 响应式 | 媒体查询覆盖 | @media 中重新赋值 |
| 动态值 | JS setProperty | style.setProperty() |

---

*掌握 CSS 变量，构建灵活可维护的样式系统。*
