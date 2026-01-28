---
title: 'CSS Container Queries：响应式设计的革命性突破'
description: '深入了解 CSS 容器查询如何解决媒体查询的局限性，实现真正的组件级响应式设计'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'css-container-queries'
---

十多年来，媒体查询（Media Queries）一直是响应式设计的基石。但它有一个根本性的局限：**它只关心视口大小，而不是组件实际所处的容器大小**。CSS Container Queries 的出现，彻底改变了这一局面。

## 媒体查询的痛点

假设你有一个卡片组件，需要在不同宽度下展示不同的布局：

```css
/* 传统媒体查询方式 */
.card {
  display: flex;
  flex-direction: column;
}

@media (min-width: 600px) {
  .card {
    flex-direction: row;
  }
}
```

问题在于：这个 600px 是视口宽度，不是卡片容器的宽度。当同一个卡片组件被放在侧边栏（较窄）或主内容区（较宽）时，它无法根据实际可用空间做出正确响应。

```
┌─────────────────────────────────────────────────────┐
│ 视口宽度: 1200px                                      │
│ ┌─────────────────────┐ ┌─────────────────────────┐ │
│ │ 侧边栏 (300px)       │ │ 主内容区 (900px)         │ │
│ │ ┌─────────────────┐ │ │ ┌─────────────────────┐ │ │
│ │ │  Card 组件       │ │ │ │    Card 组件         │ │ │
│ │ │  （应该纵向布局） │ │ │ │   （应该横向布局）    │ │ │
│ │ │  但媒体查询说：  │ │ │ │                      │ │ │
│ │ │  视口>600px,    │ │ │ │                      │ │ │
│ │ │  所以横向布局！  │ │ │ │                      │ │ │
│ │ └─────────────────┘ │ │ └─────────────────────┘ │ │
│ └─────────────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Container Queries 来救场

Container Queries 让组件可以查询其**容器**的大小，而不是视口：

```css
/* 定义容器 */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* 组件根据容器大小响应 */
.card {
  display: flex;
  flex-direction: column;
}

@container card (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
```

现在，无论卡片放在哪里，它都会根据实际容器宽度做出正确的布局响应！

## 核心语法详解

### 1. 定义容器

```css
.container {
  /* 容器类型 */
  container-type: inline-size;  /* 只查询内联轴（宽度）*/
  /* container-type: size;      查询两个轴（宽高）*/
  /* container-type: normal;    不作为查询容器 */

  /* 容器名称（可选，但推荐）*/
  container-name: sidebar;

  /* 简写形式 */
  container: sidebar / inline-size;
}
```

### 2. 容器查询

```css
/* 基础语法 */
@container (min-width: 400px) {
  .element { /* 样式 */ }
}

/* 指定容器名称 */
@container sidebar (min-width: 300px) {
  .element { /* 只在 sidebar 容器中生效 */ }
}

/* 复合条件 */
@container card (min-width: 400px) and (max-width: 800px) {
  .element { /* 样式 */ }
}

/* 容器查询支持的特性 */
@container (width > 400px) { }
@container (height >= 200px) { }
@container (aspect-ratio > 1/1) { }
@container (orientation: landscape) { }
```

### 3. 容器查询单位

Container Queries 还引入了一组新的相对单位：

| 单位 | 含义 |
|------|------|
| `cqw` | 容器宽度的 1% |
| `cqh` | 容器高度的 1% |
| `cqi` | 容器内联尺寸的 1% |
| `cqb` | 容器块尺寸的 1% |
| `cqmin` | cqi 和 cqb 中较小的值 |
| `cqmax` | cqi 和 cqb 中较大的值 |

```css
.title {
  /* 字体大小随容器宽度缩放 */
  font-size: clamp(1rem, 4cqi, 2rem);
}

.hero-image {
  /* 图片高度为容器宽度的 50% */
  height: 50cqw;
}
```

## 实战示例：响应式卡片组件

让我们构建一个真正响应式的卡片组件：

```html
<div class="card-grid">
  <article class="card-wrapper">
    <div class="card">
      <img src="thumbnail.jpg" alt="文章缩略图" class="card-image">
      <div class="card-content">
        <h2 class="card-title">文章标题</h2>
        <p class="card-excerpt">这是文章摘要，描述了文章的主要内容...</p>
        <a href="#" class="card-link">阅读更多</a>
      </div>
    </div>
  </article>
</div>
```

```css
/* 容器定义 */
.card-wrapper {
  container: card / inline-size;
}

/* 基础样式（小容器）*/
.card {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 4px;
}

.card-title {
  font-size: clamp(1rem, 3cqi, 1.5rem);
  margin: 0;
}

.card-excerpt {
  font-size: 0.875rem;
  color: #666;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 中等容器：水平布局 */
@container card (min-width: 400px) {
  .card {
    grid-template-columns: 200px 1fr;
    align-items: start;
  }

  .card-image {
    aspect-ratio: 1;
    height: 100%;
  }

  .card-excerpt {
    -webkit-line-clamp: 3;
  }
}

/* 大容器：更详细的展示 */
@container card (min-width: 600px) {
  .card {
    grid-template-columns: 280px 1fr;
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .card-image {
    aspect-ratio: 4 / 3;
  }

  .card-excerpt {
    -webkit-line-clamp: 4;
    font-size: 1rem;
  }

  .card-link {
    margin-top: auto;
  }
}
```

## 与 CSS Grid 的完美配合

Container Queries 与 CSS Grid 结合使用效果更佳：

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* 每个格子自动成为容器 */
.card-wrapper {
  container-type: inline-size;
}

/* 卡片根据格子大小自适应 */
@container (min-width: 350px) {
  .card { /* 调整布局 */ }
}
```

这样，当 Grid 分配不同宽度的格子时，每个卡片都会根据其实际获得的空间做出响应。

## Style Queries：查询自定义属性

除了尺寸查询，Container Queries 还支持样式查询（Style Queries）——查询容器的 CSS 自定义属性：

```css
.card-wrapper {
  container-type: inline-size;
  --theme: light;
}

.dark-section .card-wrapper {
  --theme: dark;
}

/* 样式查询 */
@container style(--theme: dark) {
  .card {
    background: #1a1a1a;
    color: #ffffff;
  }

  .card-excerpt {
    color: #a0a0a0;
  }
}
```

这为组件主题切换提供了强大的 CSS-only 解决方案！

## 浏览器支持

截至 2025 年，Container Queries 已获得所有现代浏览器的支持：

| 浏览器 | 支持版本 |
|--------|----------|
| Chrome | 105+ |
| Firefox | 110+ |
| Safari | 16+ |
| Edge | 105+ |

对于需要支持旧浏览器的项目，可以使用渐进增强：

```css
/* 基础布局（所有浏览器）*/
.card {
  display: flex;
  flex-direction: column;
}

/* 增强布局（支持 Container Queries 的浏览器）*/
@supports (container-type: inline-size) {
  .card-wrapper {
    container-type: inline-size;
  }

  @container (min-width: 400px) {
    .card {
      flex-direction: row;
    }
  }
}
```

## 最佳实践

### 1. 明确命名容器

```css
/* ✅ 好：使用语义化名称 */
.sidebar { container: sidebar / inline-size; }
.main-content { container: main / inline-size; }

@container sidebar (min-width: 200px) { }
@container main (min-width: 600px) { }

/* ❌ 避免：依赖匿名容器查找 */
@container (min-width: 400px) { }
```

### 2. 优先使用 inline-size

```css
/* ✅ 推荐：只查询宽度 */
.container {
  container-type: inline-size;
}

/* ⚠️ 谨慎：查询两个轴可能影响性能 */
.container {
  container-type: size;
}
```

### 3. 与组件架构结合

```css
/* 组件容器模式 */
.component-container {
  container: component / inline-size;
}

.component-container > .component {
  /* 组件内部样式 */
}

@container component (min-width: 300px) {
  .component-container > .component {
    /* 响应式变体 */
  }
}
```

## 总结

CSS Container Queries 是响应式设计发展的重要里程碑：

| 特性 | Media Queries | Container Queries |
|------|---------------|-------------------|
| 查询目标 | 视口 | 容器 |
| 组件复用 | 困难 | 简单 |
| 上下文感知 | 无 | 有 |
| 组件封装 | 差 | 好 |

**关键收获**：

1. Container Queries 让组件真正"知道"自己所处的环境
2. 配合容器查询单位（cqw, cqi 等）可实现流体排版
3. Style Queries 提供了 CSS-only 主题方案
4. 与 CSS Grid 配合使用效果最佳

从现在开始，当你构建可复用的 UI 组件时，首先考虑使用 Container Queries。它不仅让代码更简洁，更让组件真正具备了"自适应"能力。

---

*这项技术正在改变我们构建响应式界面的方式。如果你还没有尝试过，现在是最好的开始时机。*
