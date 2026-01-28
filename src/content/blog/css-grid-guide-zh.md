---
title: 'CSS Grid 布局完全指南：从基础到复杂布局'
description: '掌握 Grid 容器属性、网格线定位、响应式布局和实战案例'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'css-grid-guide'
---

CSS Grid 是二维布局系统，能轻松创建复杂的页面结构。本文探讨 Grid 的核心概念和实战应用。

## Grid 基础

### 核心概念

```
Grid 布局结构：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Grid Container (容器)                             │
│   ├── display: grid                                │
│   ├── grid-template-columns                        │
│   ├── grid-template-rows                           │
│   └── gap                                          │
│                                                     │
│   Grid Item (项目)                                  │
│   ├── grid-column                                  │
│   ├── grid-row                                     │
│   └── grid-area                                    │
│                                                     │
│   Grid Lines (网格线)                               │
│   ├── 列线: 1, 2, 3...                             │
│   └── 行线: 1, 2, 3...                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 术语 | 说明 |
|------|------|
| Grid Container | 设置 display: grid 的元素 |
| Grid Item | 容器的直接子元素 |
| Grid Line | 分隔网格的线 |
| Grid Cell | 行列交叉形成的单元格 |
| Grid Track | 相邻网格线之间的空间 |
| Grid Area | 多个单元格组成的区域 |

### 创建网格

```css
.container {
  display: grid;

  /* 定义列 */
  grid-template-columns: 200px 1fr 200px;

  /* 定义行 */
  grid-template-rows: 100px auto 100px;

  /* 间距 */
  gap: 20px;
  /* 或分别设置 */
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

## 列和行定义

### fr 单位

```css
.container {
  /* fr 表示可用空间的份数 */
  grid-template-columns: 1fr 2fr 1fr;

  /* 混合使用 */
  grid-template-columns: 200px 1fr 100px;

  /* 百分比 */
  grid-template-columns: 25% 50% 25%;
}
```

### repeat() 函数

```css
.container {
  /* 重复 4 列，每列 1fr */
  grid-template-columns: repeat(4, 1fr);

  /* 重复模式 */
  grid-template-columns: repeat(3, 100px 200px);
  /* 等于: 100px 200px 100px 200px 100px 200px */

  /* 自动填充 */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

  /* 自动适应 */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
```

### minmax() 函数

```css
.container {
  /* 最小 100px，最大 1fr */
  grid-template-columns: minmax(100px, 1fr) 2fr 1fr;

  /* 响应式网格 */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

### auto-fill vs auto-fit

```css
/* auto-fill: 尽可能多地创建列，即使是空的 */
.grid-fill {
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}

/* auto-fit: 折叠空列，让现有项目扩展填充 */
.grid-fit {
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}
```

## 网格线定位

### 基于线的定位

```css
.item {
  /* 列起始线 / 列结束线 */
  grid-column: 1 / 3;

  /* 行起始线 / 行结束线 */
  grid-row: 1 / 2;

  /* 简写 */
  grid-column-start: 1;
  grid-column-end: 3;
  grid-row-start: 1;
  grid-row-end: 2;
}

/* 跨越指定数量 */
.item-span {
  grid-column: 1 / span 2; /* 从第1线开始，跨2列 */
  grid-row: span 3; /* 跨3行 */
}

/* 负值从末尾计算 */
.item-full {
  grid-column: 1 / -1; /* 跨越所有列 */
}
```

### 命名网格线

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

## 网格区域

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

### 空单元格

```css
.container {
  grid-template-areas:
    "header header header"
    "sidebar main ."      /* . 表示空单元格 */
    "footer footer footer";
}
```

## 对齐方式

### 容器对齐

```css
.container {
  /* 水平对齐所有项目 */
  justify-items: start | end | center | stretch;

  /* 垂直对齐所有项目 */
  align-items: start | end | center | stretch;

  /* 简写 */
  place-items: center center;

  /* 水平对齐整个网格 */
  justify-content: start | end | center | stretch | space-around | space-between | space-evenly;

  /* 垂直对齐整个网格 */
  align-content: start | end | center | stretch | space-around | space-between | space-evenly;

  /* 简写 */
  place-content: center center;
}
```

### 项目对齐

```css
.item {
  /* 单个项目水平对齐 */
  justify-self: start | end | center | stretch;

  /* 单个项目垂直对齐 */
  align-self: start | end | center | stretch;

  /* 简写 */
  place-self: center center;
}
```

## 隐式网格

### 自动行列

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* 显式定义的行 */
  grid-template-rows: 100px 100px;

  /* 隐式行的高度 */
  grid-auto-rows: 150px;

  /* 使用 minmax */
  grid-auto-rows: minmax(100px, auto);

  /* 隐式列的宽度 */
  grid-auto-columns: 100px;

  /* 自动放置方向 */
  grid-auto-flow: row | column | dense;
}
```

### dense 密集填充

```css
.container {
  grid-auto-flow: row dense;
  /* 自动填充空白区域 */
}
```

## 响应式布局

### 媒体查询

```css
.container {
  display: grid;
  gap: 20px;
}

/* 移动端：单列 */
@media (max-width: 600px) {
  .container {
    grid-template-columns: 1fr;
  }
}

/* 平板：两列 */
@media (min-width: 601px) and (max-width: 900px) {
  .container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 桌面：三列 */
@media (min-width: 901px) {
  .container {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 无媒体查询响应式

```css
/* 自适应列数 */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  gap: 20px;
}
```

## 实战布局

### 经典三栏布局

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

/* 响应式 */
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

### 卡片网格

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

### 仪表板布局

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

  /* 嵌套网格 */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  align-content: start;
}
```

### 图片画廊

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  gap: 10px;
}

/* 特色项目 */
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

## Grid 与 Flexbox 对比

```
何时使用：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Grid 适合                                         │
│   ├── 二维布局（行和列）                           │
│   ├── 复杂页面结构                                 │
│   ├── 需要精确控制位置                             │
│   └── 响应式多列布局                               │
│                                                     │
│   Flexbox 适合                                      │
│   ├── 一维布局（行或列）                           │
│   ├── 内容驱动的布局                               │
│   ├── 导航菜单                                     │
│   └── 项目对齐和分布                               │
│                                                     │
│   结合使用                                          │
│   ├── Grid 用于页面整体布局                        │
│   └── Flexbox 用于组件内部布局                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 特性 | Grid | Flexbox |
|------|------|---------|
| 维度 | 二维 | 一维 |
| 方向 | 行列同时 | 行或列 |
| 控制 | 容器控制 | 内容驱动 |
| 对齐 | 精确定位 | 灵活分布 |
| 适用 | 页面布局 | 组件布局 |

## 最佳实践总结

```
CSS Grid 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   命名与组织                                        │
│   ├── 使用命名网格线提高可读性                     │
│   ├── grid-template-areas 直观展示布局             │
│   ├── 保持网格结构简洁                             │
│   └── 适当使用 CSS 变量                            │
│                                                     │
│   响应式设计                                        │
│   ├── 优先使用 auto-fit/auto-fill                  │
│   ├── minmax() 设置弹性范围                        │
│   ├── 移动优先的媒体查询                           │
│   └── 避免固定像素值                               │
│                                                     │
│   性能考虑                                          │
│   ├── 避免过深的网格嵌套                           │
│   ├── 使用 subgrid 对齐嵌套网格                    │
│   └── 减少重排触发                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

*掌握 CSS Grid，让复杂布局变得简单直观。*
