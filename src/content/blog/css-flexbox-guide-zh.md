---
title: 'CSS Flexbox 布局完全指南'
description: '掌握弹性盒子布局的容器属性、项目属性及实战技巧'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'css-flexbox-guide'
---

Flexbox 是现代 CSS 布局的核心技术。本文详解 Flexbox 的所有属性和实用技巧。

## 基础概念

### 什么是 Flexbox

```
Flexbox 布局模型：
┌─────────────────────────────────────────────────────┐
│  Flex Container (弹性容器)                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │  Item   │ │  Item   │ │  Item   │               │
│  │   1     │ │   2     │ │   3     │               │
│  └─────────┘ └─────────┘ └─────────┘               │
│  ← ─ ─ ─ ─ ─ ─ 主轴 (Main Axis) ─ ─ ─ ─ ─ ─ →     │
│              ↑                                      │
│              │ 交叉轴 (Cross Axis)                  │
│              ↓                                      │
└─────────────────────────────────────────────────────┘
```

### 启用 Flexbox

```css
/* 创建弹性容器 */
.container {
  display: flex;
}

/* 行内弹性容器 */
.container-inline {
  display: inline-flex;
}
```

## 容器属性

### flex-direction

```css
/* 主轴方向 */
.container {
  flex-direction: row;            /* 默认：水平从左到右 */
  flex-direction: row-reverse;    /* 水平从右到左 */
  flex-direction: column;         /* 垂直从上到下 */
  flex-direction: column-reverse; /* 垂直从下到上 */
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
/* 换行控制 */
.container {
  flex-wrap: nowrap;       /* 默认：不换行 */
  flex-wrap: wrap;         /* 换行，第一行在上方 */
  flex-wrap: wrap-reverse; /* 换行，第一行在下方 */
}
```

### flex-flow

```css
/* flex-direction 和 flex-wrap 的简写 */
.container {
  flex-flow: row wrap;
  flex-flow: column nowrap;
}
```

### justify-content

```css
/* 主轴对齐 */
.container {
  justify-content: flex-start;    /* 起点对齐 */
  justify-content: flex-end;      /* 终点对齐 */
  justify-content: center;        /* 居中 */
  justify-content: space-between; /* 两端对齐，项目间等距 */
  justify-content: space-around;  /* 每项两侧等距 */
  justify-content: space-evenly;  /* 所有间距相等 */
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
/* 交叉轴对齐（单行） */
.container {
  align-items: stretch;    /* 默认：拉伸填满 */
  align-items: flex-start; /* 交叉轴起点 */
  align-items: flex-end;   /* 交叉轴终点 */
  align-items: center;     /* 交叉轴居中 */
  align-items: baseline;   /* 基线对齐 */
}
```

### align-content

```css
/* 多行对齐（仅 wrap 时有效） */
.container {
  align-content: flex-start;
  align-content: flex-end;
  align-content: center;
  align-content: space-between;
  align-content: space-around;
  align-content: stretch;      /* 默认 */
}
```

### gap

```css
/* 项目间距（现代属性） */
.container {
  gap: 10px;           /* 行列间距相同 */
  gap: 10px 20px;      /* 行间距 列间距 */
  row-gap: 10px;       /* 仅行间距 */
  column-gap: 20px;    /* 仅列间距 */
}
```

## 项目属性

### order

```css
/* 排列顺序（默认 0） */
.item:nth-child(1) { order: 3; }
.item:nth-child(2) { order: 1; }
.item:nth-child(3) { order: 2; }
/* 显示顺序：2, 3, 1 */
```

### flex-grow

```css
/* 放大比例（默认 0，不放大） */
.item { flex-grow: 0; }  /* 不放大 */
.item { flex-grow: 1; }  /* 等比放大 */

/* 不同比例 */
.item1 { flex-grow: 1; }  /* 占 1/6 */
.item2 { flex-grow: 2; }  /* 占 2/6 */
.item3 { flex-grow: 3; }  /* 占 3/6 */
```

### flex-shrink

```css
/* 缩小比例（默认 1，可缩小） */
.item { flex-shrink: 0; }  /* 不缩小 */
.item { flex-shrink: 1; }  /* 等比缩小 */
.item { flex-shrink: 2; }  /* 缩小更多 */
```

### flex-basis

```css
/* 初始大小 */
.item { flex-basis: auto; }   /* 默认：基于内容 */
.item { flex-basis: 0; }      /* 从零开始计算 */
.item { flex-basis: 200px; }  /* 固定初始宽度 */
.item { flex-basis: 25%; }    /* 百分比 */
```

### flex

```css
/* flex-grow, flex-shrink, flex-basis 简写 */
.item { flex: 0 1 auto; }     /* 默认值 */
.item { flex: 1; }            /* 等于 1 1 0 */
.item { flex: auto; }         /* 等于 1 1 auto */
.item { flex: none; }         /* 等于 0 0 auto */
.item { flex: 2 1 200px; }    /* 完整写法 */
```

### align-self

```css
/* 单个项目的交叉轴对齐（覆盖 align-items） */
.item {
  align-self: auto;       /* 继承容器设置 */
  align-self: flex-start;
  align-self: flex-end;
  align-self: center;
  align-self: baseline;
  align-self: stretch;
}
```

## 实战布局

### 水平垂直居中

```css
/* 最简单的居中方案 */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
```

### 导航栏布局

```css
/* Logo 左边，导航右边 */
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

/* 导航居中，Logo 和操作两边 */
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

### 卡片网格

```css
/* 响应式卡片布局 */
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.card {
  flex: 1 1 300px;  /* 最小 300px，可伸缩 */
  max-width: 400px;
}

/* 固定列数 */
.three-column {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.three-column .item {
  flex: 0 0 calc(33.333% - 1rem);
}
```

### 侧边栏布局

```css
/* 固定侧边栏 + 弹性主内容 */
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  flex: 0 0 250px;  /* 固定宽度 */
}

.main-content {
  flex: 1;          /* 填满剩余空间 */
}

/* 可折叠侧边栏 */
.sidebar.collapsed {
  flex-basis: 60px;
}
```

### 页脚固定底部

```css
/* 内容不足时页脚固定底部 */
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;  /* 主内容区域扩展 */
}

footer {
  flex-shrink: 0;
}
```

### 等高列

```css
/* Flexbox 默认等高 */
.columns {
  display: flex;
  gap: 1rem;
}

.column {
  flex: 1;
  /* 自动等高 */
}
```

### 媒体对象

```css
/* 图片 + 文字布局 */
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

/* 反向（图片右边） */
.media-reverse {
  flex-direction: row-reverse;
}
```

### 输入框组合

```css
/* 按钮附加在输入框旁边 */
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

## 响应式技巧

### 移动端优先

```css
/* 移动端：垂直堆叠 */
.flex-container {
  display: flex;
  flex-direction: column;
}

/* 桌面端：水平排列 */
@media (min-width: 768px) {
  .flex-container {
    flex-direction: row;
  }
}
```

### 自适应换行

```css
/* 自动换行的响应式布局 */
.responsive-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.responsive-flex > * {
  flex: 1 1 250px;  /* 最小 250px */
}
```

### 顺序调整

```css
/* 移动端改变元素顺序 */
.sidebar {
  order: 1;
}

.main-content {
  order: 2;
}

@media (max-width: 768px) {
  .sidebar {
    order: 2;  /* 移动端侧边栏在后 */
  }

  .main-content {
    order: 1;  /* 主内容优先 */
  }
}
```

## 常见问题

### 子元素溢出

```css
/* 防止 flex 子元素溢出 */
.flex-item {
  min-width: 0;     /* 允许缩小到内容以下 */
  overflow: hidden;
}

/* 文本溢出省略 */
.flex-item-text {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### 保持宽高比

```css
/* Flex 项目保持宽高比 */
.aspect-ratio-box {
  flex: 1;
  aspect-ratio: 16 / 9;
}
```

### 最后一行对齐

```css
/* 解决最后一行元素对齐问题 */
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.grid::after {
  content: '';
  flex: 1 1 300px;  /* 与项目相同的 flex-basis */
  max-width: 300px;
  visibility: hidden;
}
```

## 最佳实践总结

```
Flexbox 使用指南：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   何时使用 Flexbox                                  │
│   ├── 一维布局（行或列）                           │
│   ├── 元素对齐和分布                               │
│   ├── 动态大小的元素                               │
│   └── 简单的响应式布局                             │
│                                                     │
│   常用组合                                          │
│   ├── 居中：justify-content + align-items          │
│   ├── 等分：flex: 1                                │
│   ├── 固定+弹性：flex-basis + flex-grow            │
│   └── 换行：flex-wrap + gap                        │
│                                                     │
│   避免的问题                                        │
│   ├── 复杂二维布局用 Grid                          │
│   ├── 注意 min-width: 0 防止溢出                   │
│   └── 使用 gap 代替 margin                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 属性 | 作用 | 常用值 |
|------|------|--------|
| justify-content | 主轴对齐 | center, space-between |
| align-items | 交叉轴对齐 | center, stretch |
| flex | 弹性大小 | 1, none, auto |
| gap | 间距 | 1rem, 10px 20px |

---

*掌握 Flexbox，轻松实现各种现代布局。*
