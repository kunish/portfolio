---
title: 'CSS 动画完全指南：从过渡到关键帧动画'
description: '掌握 transition、animation、transform 及性能优化技巧'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'css-animation-guide'
---

CSS 动画让网页更生动。本文探讨 transition 和 animation 的使用技巧。

## Transition 过渡

### 基础语法

```css
/* 单属性过渡 */
.button {
  background-color: #3498db;
  transition: background-color 0.3s ease;
}

.button:hover {
  background-color: #2980b9;
}

/* 多属性过渡 */
.card {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* 全属性过渡（谨慎使用） */
.element {
  transition: all 0.3s ease;
}
```

### 过渡属性详解

```css
.element {
  /* 完整写法 */
  transition-property: transform, opacity;
  transition-duration: 0.3s, 0.5s;
  transition-timing-function: ease-in-out;
  transition-delay: 0s, 0.1s;

  /* 简写 */
  transition: transform 0.3s ease-in-out,
              opacity 0.5s ease-in-out 0.1s;
}
```

### 时间函数

```css
.element {
  /* 预设函数 */
  transition-timing-function: ease;        /* 默认，慢-快-慢 */
  transition-timing-function: linear;      /* 匀速 */
  transition-timing-function: ease-in;     /* 慢入 */
  transition-timing-function: ease-out;    /* 慢出 */
  transition-timing-function: ease-in-out; /* 慢入慢出 */

  /* 贝塞尔曲线 */
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* 步进函数 */
  transition-timing-function: steps(4, end);
}
```

## Transform 变换

### 2D 变换

```css
.element {
  /* 位移 */
  transform: translateX(100px);
  transform: translateY(50px);
  transform: translate(100px, 50px);

  /* 缩放 */
  transform: scaleX(1.5);
  transform: scaleY(0.5);
  transform: scale(1.5, 0.5);

  /* 旋转 */
  transform: rotate(45deg);

  /* 倾斜 */
  transform: skewX(10deg);
  transform: skewY(10deg);
  transform: skew(10deg, 5deg);

  /* 组合变换（顺序重要） */
  transform: translate(100px, 0) rotate(45deg) scale(1.2);
}
```

### 3D 变换

```css
.container {
  perspective: 1000px;
  perspective-origin: center;
}

.element {
  /* 3D 位移 */
  transform: translateZ(100px);
  transform: translate3d(100px, 50px, 30px);

  /* 3D 旋转 */
  transform: rotateX(45deg);
  transform: rotateY(45deg);
  transform: rotateZ(45deg);
  transform: rotate3d(1, 1, 0, 45deg);

  /* 保留 3D 空间 */
  transform-style: preserve-3d;

  /* 背面可见性 */
  backface-visibility: hidden;
}
```

### 变换原点

```css
.element {
  /* 默认中心 */
  transform-origin: center;

  /* 关键字 */
  transform-origin: top left;
  transform-origin: bottom right;

  /* 具体值 */
  transform-origin: 0 0;
  transform-origin: 100% 100%;
  transform-origin: 50px 100px;

  /* 3D 原点 */
  transform-origin: 50% 50% 50px;
}
```

## Animation 动画

### 关键帧定义

```css
/* 基础关键帧 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 百分比关键帧 */
@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-30px);
  }
  100% {
    transform: translateY(0);
  }
}

/* 复杂动画 */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
```

### 动画属性

```css
.element {
  /* 完整写法 */
  animation-name: bounce;
  animation-duration: 1s;
  animation-timing-function: ease-in-out;
  animation-delay: 0s;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-fill-mode: both;
  animation-play-state: running;

  /* 简写 */
  animation: bounce 1s ease-in-out infinite alternate;
}
```

### 动画属性值

```css
.element {
  /* 迭代次数 */
  animation-iteration-count: 3;        /* 具体次数 */
  animation-iteration-count: infinite; /* 无限循环 */

  /* 方向 */
  animation-direction: normal;          /* 正向 */
  animation-direction: reverse;         /* 反向 */
  animation-direction: alternate;       /* 交替 */
  animation-direction: alternate-reverse;

  /* 填充模式 */
  animation-fill-mode: none;      /* 默认，动画前后恢复原状 */
  animation-fill-mode: forwards;  /* 保持结束状态 */
  animation-fill-mode: backwards; /* 应用开始状态 */
  animation-fill-mode: both;      /* 同时应用 */

  /* 播放状态 */
  animation-play-state: running;
  animation-play-state: paused;
}
```

## 实用动画示例

### 加载动画

```css
/* 旋转加载 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 脉冲点 */
@keyframes pulse-dot {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-dots span {
  display: inline-block;
  width: 12px;
  height: 12px;
  background: #3498db;
  border-radius: 50%;
  animation: pulse-dot 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}
```

### 悬停效果

```css
/* 按钮波纹 */
.ripple-button {
  position: relative;
  overflow: hidden;
}

.ripple-button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.ripple-button:hover::after {
  width: 300px;
  height: 300px;
}

/* 下划线动画 */
.underline-link {
  position: relative;
}

.underline-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width 0.3s ease;
}

.underline-link:hover::after {
  width: 100%;
}
```

### 入场动画

```css
/* 淡入上滑 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

/* 交错入场 */
.stagger-item {
  opacity: 0;
  animation: fadeInUp 0.6s ease-out forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0.1s; }
.stagger-item:nth-child(2) { animation-delay: 0.2s; }
.stagger-item:nth-child(3) { animation-delay: 0.3s; }
.stagger-item:nth-child(4) { animation-delay: 0.4s; }

/* 使用 CSS 变量 */
.stagger-item {
  animation-delay: calc(var(--index) * 0.1s);
}
```

### 翻转卡片

```css
.flip-card {
  width: 300px;
  height: 200px;
  perspective: 1000px;
}

.flip-card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card:hover .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 8px;
}

.flip-card-back {
  transform: rotateY(180deg);
}
```

## 性能优化

### 高性能属性

```css
/* 推荐：只动画这些属性 */
.performant {
  /* GPU 加速，不触发重排重绘 */
  transform: translateX(100px);
  opacity: 0.5;
}

/* 避免：触发重排的属性 */
.avoid {
  /* 以下属性会触发重排 */
  width: 200px;
  height: 200px;
  margin: 10px;
  padding: 10px;
  left: 100px;
  top: 100px;
}
```

### 硬件加速

```css
.accelerated {
  /* 触发 GPU 加速 */
  transform: translateZ(0);
  /* 或 */
  will-change: transform;
}

/* 注意：不要过度使用 will-change */
.element:hover {
  will-change: transform;
}

.element {
  /* 悬停结束后移除 */
  will-change: auto;
}
```

### 减少重绘

```css
/* 使用 transform 代替位置属性 */
.slide {
  /* 好 */
  transform: translateX(100px);

  /* 避免 */
  /* left: 100px; */
}

/* 使用 opacity 代替 visibility */
.fade {
  /* 好 */
  opacity: 0;

  /* 避免频繁切换 */
  /* visibility: hidden; */
}
```

## 响应式动画

### 减少动画偏好

```css
/* 尊重用户偏好 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 或提供替代方案 */
.animated-element {
  animation: bounce 1s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
  }
}
```

## 最佳实践总结

```
CSS 动画最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   性能                                              │
│   ├── 只动画 transform 和 opacity                  │
│   ├── 使用 will-change 提示浏览器                  │
│   ├── 避免同时动画大量元素                         │
│   └── 测量实际性能                                 │
│                                                     │
│   用户体验                                          │
│   ├── 动画时长 200-500ms 最佳                      │
│   ├── 使用适当的缓动函数                           │
│   ├── 避免过度动画                                 │
│   └── 尊重 prefers-reduced-motion                  │
│                                                     │
│   代码组织                                          │
│   ├── 使用 CSS 变量管理时长                        │
│   ├── 创建可复用的动画类                           │
│   └── 保持动画简洁有目的                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 属性 | 用途 |
|------|------|
| transition | 状态间平滑过渡 |
| animation | 复杂关键帧动画 |
| transform | 变换元素 |
| opacity | 透明度变化 |

---

*恰当的动画让交互更自然流畅。*
