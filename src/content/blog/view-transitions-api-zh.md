---
title: 'View Transitions API：原生页面过渡动画的新时代'
description: '探索浏览器原生的 View Transitions API，告别复杂的动画库，实现丝滑的页面切换效果'
pubDate: 'Jan 28 2025'
heroImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'
lang: 'zh'
translationKey: 'view-transitions-api'
---

还记得那些需要复杂 JavaScript 库才能实现的页面过渡动画吗？现在，浏览器原生的 **View Transitions API** 让这一切变得简单优雅。只需几行代码，就能实现堪比原生应用的丝滑过渡效果。

## 为什么需要 View Transitions？

传统的 Web 页面切换是"硬切"——旧页面消失，新页面突然出现。这种体验与原生应用形成鲜明对比。为了改善这一点，开发者通常需要：

- 使用 SPA 框架并自行实现动画
- 引入动画库如 Framer Motion、GSAP
- 手动管理 DOM 快照和过渡状态

View Transitions API 将这些复杂性封装在浏览器层面，提供了一种声明式的方式来定义过渡动画。

## 基础用法

### 单页应用（SPA）中的过渡

```javascript
// 最简单的过渡
document.startViewTransition(() => {
  // 更新 DOM
  updateContent();
});

// 带有异步操作的过渡
document.startViewTransition(async () => {
  const data = await fetchNewContent();
  renderContent(data);
});
```

就这么简单！浏览器会自动：
1. 捕获当前页面的快照
2. 执行你的 DOM 更新
3. 捕获新状态的快照
4. 在两者之间执行淡入淡出动画

### 默认过渡效果

```css
/* 浏览器默认使用这些伪元素进行过渡 */
::view-transition-old(root) {
  animation: 250ms ease-out both fade-out;
}

::view-transition-new(root) {
  animation: 250ms ease-out both fade-in;
}
```

## 自定义过渡动画

### 1. 修改默认过渡

```css
/* 延长过渡时间 */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 500ms;
}

/* 滑动效果 */
@keyframes slide-out {
  to { transform: translateX(-100%); }
}

@keyframes slide-in {
  from { transform: translateX(100%); }
}

::view-transition-old(root) {
  animation: 300ms ease-out slide-out;
}

::view-transition-new(root) {
  animation: 300ms ease-out slide-in;
}
```

### 2. 命名过渡组

View Transitions 的真正威力在于**命名过渡**——让特定元素独立过渡：

```css
/* 定义需要独立过渡的元素 */
.hero-image {
  view-transition-name: hero;
}

.page-title {
  view-transition-name: title;
}

/* 自定义这些元素的过渡 */
::view-transition-old(hero),
::view-transition-new(hero) {
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

::view-transition-old(title) {
  animation: 200ms ease-out fade-out-up;
}

::view-transition-new(title) {
  animation: 300ms ease-out fade-in-up;
}

@keyframes fade-out-up {
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
}
```

### 3. 共享元素过渡

当两个页面有相同 `view-transition-name` 的元素时，浏览器会自动创建"共享元素过渡"——元素会平滑地从旧位置移动到新位置：

```css
/* 文章列表页 */
.article-card-1 .thumbnail {
  view-transition-name: article-hero-1;
}

/* 文章详情页 */
.article-detail .hero-image {
  view-transition-name: article-hero-1;
}
```

```
┌─────────────────┐          ┌─────────────────────────┐
│  列表页          │          │      详情页              │
│ ┌───┐           │          │ ┌───────────────────┐   │
│ │ 🖼 │ 文章标题   │  ──────▶ │ │                   │   │
│ └───┘           │   过渡    │ │       🖼           │   │
│                 │  动画     │ │                   │   │
│ ┌───┐           │          │ └───────────────────┘   │
│ │ 🖼 │ 另一篇文章 │          │ 文章标题                │
│ └───┘           │          │ 文章内容...             │
└─────────────────┘          └─────────────────────────┘
```

缩略图会自动放大并移动到详情页的 hero 位置！

## 多页应用（MPA）中的过渡

从 Chrome 126 开始，View Transitions 也支持跨页面导航：

```css
/* 在 CSS 中启用 MPA 过渡 */
@view-transition {
  navigation: auto;
}
```

或者通过 meta 标签：

```html
<meta name="view-transition" content="same-origin">
```

### MPA 共享元素

```css
/* page-a.html */
.card-image {
  view-transition-name: shared-image;
}

/* page-b.html */
.hero-image {
  view-transition-name: shared-image;
}
```

只要两个页面的元素有相同的 `view-transition-name`，跨页面导航时也能实现共享元素过渡！

## 实战：博客文章列表到详情

### HTML 结构

```html
<!-- 列表页 -->
<article class="post-card" data-post-id="1">
  <img
    src="thumbnail.jpg"
    class="post-thumbnail"
    style="view-transition-name: post-image-1"
  >
  <h2
    class="post-title"
    style="view-transition-name: post-title-1"
  >
    文章标题
  </h2>
</article>
```

```html
<!-- 详情页 -->
<article class="post-detail">
  <img
    src="hero.jpg"
    class="post-hero"
    style="view-transition-name: post-image-1"
  >
  <h1
    class="post-title"
    style="view-transition-name: post-title-1"
  >
    文章标题
  </h1>
  <div class="post-content">...</div>
</article>
```

### JavaScript 实现（SPA）

```javascript
async function navigateToPost(postId) {
  // 检查浏览器支持
  if (!document.startViewTransition) {
    // 降级处理
    window.location.href = `/posts/${postId}`;
    return;
  }

  const transition = document.startViewTransition(async () => {
    // 获取文章内容
    const response = await fetch(`/api/posts/${postId}`);
    const post = await response.json();

    // 使用框架的安全渲染方法更新 DOM
    // 注意：实际项目中应使用框架提供的安全渲染机制
    // 或使用 DOMPurify 等库对内容进行消毒处理
    renderPostDetail(document.querySelector('main'), post);

    // 更新 URL
    history.pushState({}, '', `/posts/${postId}`);
  });

  // 可选：等待过渡完成
  await transition.finished;
  console.log('Transition completed!');
}
```

### CSS 动画定义

```css
/* 全局过渡设置 */
::view-transition-group(*) {
  animation-duration: 350ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 页面内容淡入淡出 */
::view-transition-old(root) {
  animation: 200ms ease-out fade-out;
}

::view-transition-new(root) {
  animation: 300ms ease-in fade-in;
}

/* 图片过渡保持比例 */
::view-transition-old(post-image-1),
::view-transition-new(post-image-1) {
  object-fit: cover;
  overflow: hidden;
}

/* 标题过渡 */
::view-transition-group(post-title-1) {
  animation-duration: 400ms;
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

## 与 Astro 集成

Astro 对 View Transitions 提供了一流的支持：

```astro
---
// src/layouts/Layout.astro
import { ViewTransitions } from 'astro:transitions';
---

<html>
  <head>
    <ViewTransitions />
  </head>
  <body>
    <slot />
  </body>
</html>
```

```astro
---
// src/pages/blog/[slug].astro
const { slug } = Astro.params;
---

<img
  src={post.heroImage}
  transition:name={`hero-${slug}`}
/>
<h1 transition:name={`title-${slug}`}>
  {post.title}
</h1>
```

Astro 会自动处理 MPA 导航中的 View Transitions！

## 过渡类型

View Transitions API 提供了不同的过渡类型，用于区分导航方向：

```javascript
// 设置过渡类型
document.startViewTransition({
  update: updateDOM,
  types: ['slide-left']
});
```

```css
/* 根据类型应用不同动画 */
html:active-view-transition-type(slide-left) {
  &::view-transition-old(root) {
    animation-name: slide-out-left;
  }
  &::view-transition-new(root) {
    animation-name: slide-in-right;
  }
}

html:active-view-transition-type(slide-right) {
  &::view-transition-old(root) {
    animation-name: slide-out-right;
  }
  &::view-transition-new(root) {
    animation-name: slide-in-left;
  }
}
```

## 性能考虑

### 1. 避免过多命名过渡

```css
/* ⚠️ 避免：太多独立过渡元素会影响性能 */
.list-item {
  view-transition-name: item-1; /* 每个项都有独立名称 */
}

/* ✅ 推荐：只对关键元素使用命名过渡 */
.hero-image {
  view-transition-name: hero;
}
```

### 2. 使用 contain 优化

```css
.transition-element {
  view-transition-name: element;
  contain: layout;  /* 帮助浏览器优化 */
}
```

### 3. 条件性启用

```javascript
// 根据设备性能决定是否启用过渡
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion && document.startViewTransition) {
  document.startViewTransition(updateDOM);
} else {
  updateDOM();
}
```

## 浏览器支持

| 浏览器 | SPA 过渡 | MPA 过渡 |
|--------|----------|----------|
| Chrome | 111+ | 126+ |
| Edge | 111+ | 126+ |
| Safari | 18+ | 18+ |
| Firefox | 🚧 开发中 | 🚧 开发中 |

### 渐进增强策略

```javascript
function navigate(url) {
  if (document.startViewTransition) {
    document.startViewTransition(() => loadPage(url));
  } else {
    loadPage(url);
  }
}
```

## 总结

View Transitions API 代表了 Web 动画的重要进步：

| 传统方式 | View Transitions |
|----------|------------------|
| 需要 JavaScript 库 | 浏览器原生支持 |
| 手动管理状态 | 自动快照和过渡 |
| 复杂的 DOM 操作 | 声明式 CSS |
| SPA 专属 | SPA + MPA 通用 |

**关键收获**：

1. `document.startViewTransition()` 是一切的起点
2. `view-transition-name` 创建独立过渡组
3. 相同名称的元素会自动创建共享元素过渡
4. 始终考虑 `prefers-reduced-motion`
5. MPA 支持让传统网站也能享受丝滑过渡

View Transitions API 让曾经需要复杂库才能实现的效果变得触手可及。如果你正在构建注重用户体验的网站，现在就是开始使用它的最佳时机。

---

*下次当你的用户在页面间导航时，让他们感受到这种丝滑的过渡体验吧。*
