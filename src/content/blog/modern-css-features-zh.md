---
title: '现代 CSS 新特性：2025 必知必会'
description: '探索 :has()、Cascade Layers、Subgrid 等现代 CSS 特性，提升你的样式开发效率'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'modern-css-features'
---

CSS 正在经历一场复兴。过去几年，浏览器厂商联手推进了大量强大的新特性。从"父选择器" `:has()` 到层叠控制的 `@layer`，这些特性正在改变我们编写样式的方式。

## :has() — 终于有了"父选择器"

`:has()` 被称为 CSS 最强大的新选择器，它让你可以根据元素的后代来选择元素。

### 基础用法

```css
/* 选择包含图片的卡片 */
.card:has(img) {
  display: grid;
  grid-template-rows: 200px 1fr;
}

/* 选择包含必填输入框的表单组 */
.form-group:has(input:required) {
  font-weight: bold;
}

/* 选择包含被选中复选框的列表项 */
li:has(input:checked) {
  background-color: #e8f5e9;
}
```

### 实用场景

**1. 表单验证样式**

```css
/* 输入框无效时，整个表单组变红 */
.form-group:has(input:invalid) {
  border-left: 3px solid #e53935;
}

/* 输入框有效时，显示成功状态 */
.form-group:has(input:valid) {
  border-left: 3px solid #43a047;
}

/* 聚焦时高亮整个区域 */
.form-group:has(input:focus) {
  background-color: #fff8e1;
}
```

**2. 动态布局**

```css
/* 根据子元素数量调整布局 */
.grid:has(> :nth-child(4)) {
  grid-template-columns: repeat(2, 1fr);
}

.grid:has(> :nth-child(7)) {
  grid-template-columns: repeat(3, 1fr);
}

/* 没有图片时的卡片布局 */
.card:not(:has(img)) {
  padding: 2rem;
}
```

**3. 状态驱动的全局样式**

```css
/* 暗色模式切换 */
body:has(#dark-mode:checked) {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
}

/* 侧边栏展开时调整主内容 */
body:has(.sidebar.expanded) .main-content {
  margin-left: 280px;
}

/* 模态框打开时禁止滚动 */
body:has(.modal.open) {
  overflow: hidden;
}
```

### :has() 与其他选择器组合

```css
/* 选择紧跟在包含图片的卡片后面的卡片 */
.card:has(img) + .card {
  margin-top: 2rem;
}

/* 选择空状态 */
.list:not(:has(li)) {
  display: grid;
  place-content: center;
}
.list:not(:has(li))::after {
  content: '暂无数据';
  color: #999;
}
```

## @layer — 层叠层控制

Cascade Layers（层叠层）让你可以精确控制样式的优先级，不再需要与选择器权重作斗争。

### 基础语法

```css
/* 定义层的顺序（后面的优先级更高）*/
@layer reset, base, components, utilities;

/* 在特定层中添加样式 */
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

### 为什么需要 @layer？

```css
/* 传统问题：第三方库样式难以覆盖 */
/* 即使你的选择器权重更低，也能覆盖 */

@layer third-party, custom;

@layer third-party {
  /* 引入的 UI 库样式 */
  .btn {
    background: blue;  /* 选择器权重：0,0,1,0 */
  }
}

@layer custom {
  /* 你的自定义样式，优先级更高！ */
  .btn {
    background: green;  /* 虽然权重相同，但层优先级更高 */
  }
}
```

### 嵌套层

```css
@layer components {
  @layer buttons {
    .btn { /* ... */ }
  }

  @layer cards {
    .card { /* ... */ }
  }
}

/* 或者这样引用 */
@layer components.buttons {
  .btn-primary { /* ... */ }
}
```

### 匿名层和导入

```css
/* 匿名层（最低优先级）*/
@layer {
  /* 这些样式在所有命名层之前 */
}

/* 将外部样式放入层中 */
@import url("bootstrap.css") layer(framework);
```

## Subgrid — 网格的网格

Subgrid 让子网格可以继承父网格的轨道定义，解决了嵌套对齐问题。

### 问题场景

```html
<div class="card-grid">
  <article class="card">
    <h2>短标题</h2>
    <p>内容文本...</p>
    <footer>操作按钮</footer>
  </article>
  <article class="card">
    <h2>这是一个非常非常长的标题需要换行</h2>
    <p>内容文本...</p>
    <footer>操作按钮</footer>
  </article>
</div>
```

没有 Subgrid，每张卡片的内部元素无法对齐：

```
┌─────────────────┐ ┌─────────────────┐
│ 短标题          │ │ 这是一个非常    │
│                 │ │ 长的标题需要换行│
├─────────────────┤ ├─────────────────┤
│ 内容文本...     │ │ 内容文本...     │  ← 不对齐！
├─────────────────┤ │                 │
│ 操作按钮        │ ├─────────────────┤
└─────────────────┘ │ 操作按钮        │
                    └─────────────────┘
```

### Subgrid 解决方案

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;

  /* 定义行轨道供子网格使用 */
  grid-template-rows: subgrid;
}

.card {
  display: grid;

  /* 继承父网格的行轨道 */
  grid-template-rows: subgrid;

  /* 占据 3 行 */
  grid-row: span 3;
}
```

现在所有卡片的标题、内容、操作区都完美对齐！

### 实战：表单布局

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

/* 所有标签和输入框自动对齐 */
.form-row label {
  grid-column: 1;
  text-align: right;
}

.form-row input {
  grid-column: 2;
}
```

## 嵌套 CSS — 原生支持

不再需要 Sass/Less，浏览器原生支持 CSS 嵌套了！

```css
.card {
  background: white;
  border-radius: 8px;

  /* 嵌套子元素 */
  .title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .content {
    color: #666;
  }

  /* 伪类和伪元素 */
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &::before {
    content: '';
    /* ... */
  }

  /* 媒体查询嵌套 */
  @media (min-width: 768px) {
    display: flex;
    gap: 2rem;
  }
}
```

### 嵌套选择器 &

```css
.btn {
  /* & 代表父选择器 */

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

## color-mix() — 颜色混合

原生 CSS 现在可以混合颜色了：

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
  /* 将主色与白色混合 20% */
  background: color-mix(in srgb, var(--primary), var(--white) 20%);
}

.btn:active {
  /* 将主色与黑色混合 20% */
  background: color-mix(in srgb, var(--primary), var(--black) 20%);
}
```

### 创建调色板

```css
:root {
  --primary: #3b82f6;

  /* 自动生成明暗变体 */
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

## 其他实用新特性

### 逻辑属性

```css
/* 传统方式 */
.element {
  margin-left: 1rem;
  margin-right: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

/* 逻辑属性（支持 RTL）*/
.element {
  margin-inline: 1rem;    /* 左右 */
  padding-block: 0.5rem;  /* 上下 */
}
```

### accent-color

```css
/* 一行代码改变表单控件颜色 */
:root {
  accent-color: #3b82f6;
}

/* 所有复选框、单选框、进度条等都会使用这个颜色 */
```

### text-wrap: balance

```css
/* 平衡标题的换行，避免孤字 */
h1, h2, h3 {
  text-wrap: balance;
}

/* 对于更长的文本，使用 pretty */
p {
  text-wrap: pretty;
}
```

### @scope

```css
/* 限制样式作用范围 */
@scope (.card) to (.card-content) {
  /* 这些样式只应用于 .card 内部，但不包括 .card-content 及其后代 */
  p {
    margin-bottom: 1rem;
  }
}
```

## 浏览器支持

| 特性 | Chrome | Firefox | Safari |
|------|--------|---------|--------|
| :has() | 105+ | 121+ | 15.4+ |
| @layer | 99+ | 97+ | 15.4+ |
| Subgrid | 117+ | 71+ | 16+ |
| Nesting | 120+ | 117+ | 17.2+ |
| color-mix() | 111+ | 113+ | 16.2+ |

### 渐进增强策略

```css
/* 回退方案 */
.card {
  display: flex;
  flex-direction: column;
}

/* 现代浏览器增强 */
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

## 总结

现代 CSS 正在变得越来越强大：

| 特性 | 解决的问题 |
|------|------------|
| `:has()` | 父元素选择、状态驱动样式 |
| `@layer` | 样式优先级管理 |
| Subgrid | 嵌套网格对齐 |
| Nesting | 减少选择器重复 |
| `color-mix()` | 动态颜色计算 |

**关键收获**：

1. `:has()` 是最强大的新选择器，解锁了无数可能
2. `@layer` 让样式优先级变得可控可预测
3. Subgrid 解决了多年来的嵌套对齐难题
4. 原生嵌套让 CSS 预处理器的核心功能变得可选
5. 新特性正在快速获得浏览器支持

CSS 的未来已经到来。这些特性不仅让代码更简洁，更让曾经需要 JavaScript 的交互效果变成了纯 CSS 解决方案。

---

*CSS 不再只是"层叠样式表"，它正在成为一门强大的声明式编程语言。*
