---
title: 'Web 动画技术：从 CSS 到 JavaScript 动画库'
description: '掌握 CSS 动画、Web Animations API、Framer Motion 和性能优化技巧'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'web-animation-guide'
---

动画是提升用户体验的关键元素。本文探讨 Web 动画的各种实现方式和最佳实践。

## 动画基础

### CSS 动画 vs JavaScript 动画

```
动画技术选择：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   CSS 动画                                          │
│   ├── 简单过渡和关键帧                              │
│   ├── 浏览器优化，性能好                            │
│   ├── 声明式，易于维护                              │
│   └── 适合 UI 状态变化                              │
│                                                     │
│   JavaScript 动画                                   │
│   ├── 复杂交互和序列                                │
│   ├── 精确控制时间和状态                            │
│   ├── 响应用户输入                                  │
│   └── 适合游戏和数据可视化                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 类型 | 适用场景 | 性能 |
|------|----------|------|
| CSS Transition | 简单状态变化 | 最佳 |
| CSS Animation | 循环和关键帧 | 优秀 |
| Web Animations API | 复杂控制 | 良好 |
| 动画库 | 复杂序列 | 取决于实现 |

## CSS 过渡

### 基础过渡

```css
/* 基础过渡 */
.button {
  background-color: #3b82f6;
  transform: scale(1);
  transition: all 0.3s ease;
}

.button:hover {
  background-color: #2563eb;
  transform: scale(1.05);
}

/* 多属性过渡 */
.card {
  opacity: 0.8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition:
    opacity 0.2s ease-out,
    box-shadow 0.3s ease-in-out,
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  opacity: 1;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  transform: translateY(-4px);
}
```

### 过渡时序函数

```css
/* 内置缓动函数 */
.ease-linear { transition-timing-function: linear; }
.ease-in { transition-timing-function: ease-in; }
.ease-out { transition-timing-function: ease-out; }
.ease-in-out { transition-timing-function: ease-in-out; }

/* 自定义贝塞尔曲线 */
.custom-ease {
  /* 弹性效果 */
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* 阶跃函数 */
.steps {
  transition-timing-function: steps(5, end);
}
```

## CSS 关键帧动画

### @keyframes 定义

```css
/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 多步骤动画 */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-20px);
  }
  50% {
    transform: translateY(-10px);
  }
  75% {
    transform: translateY(-15px);
  }
}

/* 应用动画 */
.animated-element {
  animation: fadeIn 0.5s ease-out forwards;
}

.bouncing {
  animation: bounce 1s ease-in-out infinite;
}
```

### 动画控制

```css
.animation-control {
  /* 动画名称 */
  animation-name: slideIn;

  /* 持续时间 */
  animation-duration: 0.5s;

  /* 缓动函数 */
  animation-timing-function: ease-out;

  /* 延迟 */
  animation-delay: 0.2s;

  /* 迭代次数 */
  animation-iteration-count: infinite;

  /* 方向 */
  animation-direction: alternate;

  /* 填充模式 */
  animation-fill-mode: forwards;

  /* 播放状态 */
  animation-play-state: running;
}

/* 简写 */
.shorthand {
  animation: slideIn 0.5s ease-out 0.2s infinite alternate forwards;
}
```

### 复杂动画序列

```css
/* 加载动画 */
@keyframes spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spinner 1s linear infinite;
}

/* 脉冲效果 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

## Web Animations API

### 基础用法

```typescript
// 基础动画
const element = document.querySelector('.box');

const animation = element.animate(
  [
    { transform: 'translateX(0)', opacity: 1 },
    { transform: 'translateX(100px)', opacity: 0.5 },
    { transform: 'translateX(200px)', opacity: 1 },
  ],
  {
    duration: 1000,
    iterations: Infinity,
    easing: 'ease-in-out',
  }
);

// 控制动画
animation.pause();
animation.play();
animation.reverse();
animation.cancel();

// 监听事件
animation.addEventListener('finish', () => {
  console.log('动画完成');
});
```

### 动画控制

```typescript
class AnimationController {
  private animation: Animation | null = null;
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  fadeIn(duration = 300): Promise<void> {
    return new Promise((resolve) => {
      this.animation = this.element.animate(
        [
          { opacity: 0, transform: 'scale(0.95)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        {
          duration,
          easing: 'ease-out',
          fill: 'forwards',
        }
      );

      this.animation.onfinish = () => resolve();
    });
  }

  fadeOut(duration = 300): Promise<void> {
    return new Promise((resolve) => {
      this.animation = this.element.animate(
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.95)' },
        ],
        {
          duration,
          easing: 'ease-in',
          fill: 'forwards',
        }
      );

      this.animation.onfinish = () => resolve();
    });
  }

  // 时间线控制
  seekTo(progress: number): void {
    if (this.animation) {
      const duration = this.animation.effect?.getTiming().duration as number;
      this.animation.currentTime = duration * progress;
    }
  }
}
```

### 动画序列

```typescript
// 顺序动画
async function animateSequence(elements: HTMLElement[]) {
  for (const element of elements) {
    await element.animate(
      [
        { opacity: 0, transform: 'translateY(20px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 300,
        easing: 'ease-out',
        fill: 'forwards',
      }
    ).finished;
  }
}

// 并行动画
function animateParallel(elements: HTMLElement[]) {
  const animations = elements.map((element, index) =>
    element.animate(
      [
        { opacity: 0, transform: 'scale(0.8)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      {
        duration: 400,
        delay: index * 50,
        easing: 'ease-out',
        fill: 'forwards',
      }
    )
  );

  return Promise.all(animations.map((a) => a.finished));
}

// 交错动画
function staggerAnimation(
  elements: HTMLElement[],
  staggerDelay = 50
): Animation[] {
  return elements.map((element, index) =>
    element.animate(
      [
        { opacity: 0, transform: 'translateX(-20px)' },
        { opacity: 1, transform: 'translateX(0)' },
      ],
      {
        duration: 300,
        delay: index * staggerDelay,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      }
    )
  );
}
```

## React 动画

### Framer Motion

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// 基础动画
function AnimatedBox() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      动画内容
    </motion.div>
  );
}

// 交互动画
function InteractiveCard() {
  return (
    <motion.div
      whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      悬停和点击效果
    </motion.div>
  );
}

// 列表动画
function AnimatedList({ items }: { items: string[] }) {
  return (
    <motion.ul>
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.li
            key={item}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.1 }}
          >
            {item}
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
```

### 高级动画模式

```tsx
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';

// 滚动触发动画
function ScrollAnimation({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

// 布局动画
function LayoutAnimation() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        width: isExpanded ? 300 : 100,
        height: isExpanded ? 200 : 100,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      点击展开
    </motion.div>
  );
}

// 共享布局动画
function SharedLayoutAnimation() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      {items.map((item) => (
        <motion.div
          key={item.id}
          layoutId={item.id}
          onClick={() => setSelectedId(item.id)}
        >
          <motion.h2>{item.title}</motion.h2>
        </motion.div>
      ))}

      <AnimatePresence>
        {selectedId && (
          <motion.div layoutId={selectedId}>
            <motion.h2>{items.find((i) => i.id === selectedId)?.title}</motion.h2>
            <motion.button onClick={() => setSelectedId(null)}>
              关闭
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

## 性能优化

### 高性能属性

```css
/* 推荐：GPU 加速属性 */
.performant {
  transform: translateX(100px);
  opacity: 0.5;
}

/* 避免：触发布局重排 */
.avoid {
  /* 这些属性会触发重排 */
  width: 200px;
  height: 100px;
  margin: 20px;
  padding: 10px;
  top: 50px;
  left: 100px;
}

/* 使用 will-change 提示 */
.will-animate {
  will-change: transform, opacity;
}

/* 动画结束后移除 */
.animation-done {
  will-change: auto;
}
```

### 硬件加速

```css
/* 强制 GPU 加速 */
.gpu-accelerated {
  transform: translateZ(0);
  /* 或 */
  transform: translate3d(0, 0, 0);
  /* 或 */
  backface-visibility: hidden;
}

/* 合成层隔离 */
.isolated-layer {
  isolation: isolate;
  contain: layout paint;
}
```

### React 动画性能

```tsx
import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

// 使用 memo 避免不必要的重渲染
const AnimatedItem = memo(function AnimatedItem({
  item
}: {
  item: ItemType
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {item.content}
    </motion.div>
  );
});

// 缓存动画变体
function OptimizedList({ items }: { items: ItemType[] }) {
  const variants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }), []);

  return (
    <motion.ul variants={variants} initial="hidden" animate="visible">
      {items.map((item) => (
        <AnimatedItem key={item.id} item={item} />
      ))}
    </motion.ul>
  );
}
```

## 最佳实践总结

```
Web 动画最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   选择合适的技术                                    │
│   ├── 简单过渡用 CSS                               │
│   ├── 复杂控制用 Web Animations API                │
│   ├── React 项目用 Framer Motion                   │
│   └── 数据可视化用 D3.js                           │
│                                                     │
│   性能考虑                                          │
│   ├── 优先使用 transform 和 opacity                │
│   ├── 避免动画触发布局重排                          │
│   ├── 合理使用 will-change                         │
│   └── 减少同时运行的动画数量                        │
│                                                     │
│   用户体验                                          │
│   ├── 尊重 prefers-reduced-motion                  │
│   ├── 保持动画简短（200-500ms）                    │
│   ├── 使用有意义的动画                              │
│   └── 避免过度动画                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| 悬停效果 | CSS transition |
| 加载动画 | CSS @keyframes |
| 页面切换 | Framer Motion |
| 复杂序列 | Web Animations API |

---

*好的动画是用户几乎察觉不到的动画。*
