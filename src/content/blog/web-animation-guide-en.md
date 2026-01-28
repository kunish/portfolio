---
title: 'Web Animation: From CSS to JavaScript Animation Libraries'
description: 'Master CSS animations, Web Animations API, Framer Motion and performance optimization'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'web-animation-guide'
---

Animation is a key element for enhancing user experience. This article explores various ways to implement web animations and best practices.

## Animation Fundamentals

### CSS Animation vs JavaScript Animation

```
Animation Technology Selection:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   CSS Animation                                     │
│   ├── Simple transitions and keyframes             │
│   ├── Browser optimized, great performance         │
│   ├── Declarative, easy to maintain               │
│   └── Ideal for UI state changes                   │
│                                                     │
│   JavaScript Animation                              │
│   ├── Complex interactions and sequences           │
│   ├── Precise control over timing and state        │
│   ├── Responds to user input                       │
│   └── Ideal for games and data visualization       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Type | Use Case | Performance |
|------|----------|-------------|
| CSS Transition | Simple state changes | Best |
| CSS Animation | Loops and keyframes | Excellent |
| Web Animations API | Complex control | Good |
| Animation Libraries | Complex sequences | Depends on implementation |

## CSS Transitions

### Basic Transitions

```css
/* Basic transition */
.button {
  background-color: #3b82f6;
  transform: scale(1);
  transition: all 0.3s ease;
}

.button:hover {
  background-color: #2563eb;
  transform: scale(1.05);
}

/* Multi-property transition */
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

### Timing Functions

```css
/* Built-in easing functions */
.ease-linear { transition-timing-function: linear; }
.ease-in { transition-timing-function: ease-in; }
.ease-out { transition-timing-function: ease-out; }
.ease-in-out { transition-timing-function: ease-in-out; }

/* Custom bezier curves */
.custom-ease {
  /* Elastic effect */
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Step function */
.steps {
  transition-timing-function: steps(5, end);
}
```

## CSS Keyframe Animations

### @keyframes Definition

```css
/* Fade in animation */
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

/* Multi-step animation */
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

/* Apply animation */
.animated-element {
  animation: fadeIn 0.5s ease-out forwards;
}

.bouncing {
  animation: bounce 1s ease-in-out infinite;
}
```

### Animation Control

```css
.animation-control {
  /* Animation name */
  animation-name: slideIn;

  /* Duration */
  animation-duration: 0.5s;

  /* Easing function */
  animation-timing-function: ease-out;

  /* Delay */
  animation-delay: 0.2s;

  /* Iteration count */
  animation-iteration-count: infinite;

  /* Direction */
  animation-direction: alternate;

  /* Fill mode */
  animation-fill-mode: forwards;

  /* Play state */
  animation-play-state: running;
}

/* Shorthand */
.shorthand {
  animation: slideIn 0.5s ease-out 0.2s infinite alternate forwards;
}
```

### Complex Animation Sequences

```css
/* Loading spinner */
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

/* Pulse effect */
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

### Basic Usage

```typescript
// Basic animation
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

// Control animation
animation.pause();
animation.play();
animation.reverse();
animation.cancel();

// Listen to events
animation.addEventListener('finish', () => {
  console.log('Animation finished');
});
```

### Animation Control

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

  // Timeline control
  seekTo(progress: number): void {
    if (this.animation) {
      const duration = this.animation.effect?.getTiming().duration as number;
      this.animation.currentTime = duration * progress;
    }
  }
}
```

### Animation Sequences

```typescript
// Sequential animation
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

// Parallel animation
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

// Staggered animation
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

## React Animation

### Framer Motion

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Basic animation
function AnimatedBox() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      Animated content
    </motion.div>
  );
}

// Interactive animation
function InteractiveCard() {
  return (
    <motion.div
      whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      Hover and tap effects
    </motion.div>
  );
}

// List animation
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

### Advanced Animation Patterns

```tsx
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';

// Scroll-triggered animation
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

// Layout animation
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
      Click to expand
    </motion.div>
  );
}

// Shared layout animation
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
              Close
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

## Performance Optimization

### High-Performance Properties

```css
/* Recommended: GPU-accelerated properties */
.performant {
  transform: translateX(100px);
  opacity: 0.5;
}

/* Avoid: Properties that trigger layout */
.avoid {
  /* These properties trigger reflow */
  width: 200px;
  height: 100px;
  margin: 20px;
  padding: 10px;
  top: 50px;
  left: 100px;
}

/* Use will-change hint */
.will-animate {
  will-change: transform, opacity;
}

/* Remove after animation */
.animation-done {
  will-change: auto;
}
```

### Hardware Acceleration

```css
/* Force GPU acceleration */
.gpu-accelerated {
  transform: translateZ(0);
  /* or */
  transform: translate3d(0, 0, 0);
  /* or */
  backface-visibility: hidden;
}

/* Composite layer isolation */
.isolated-layer {
  isolation: isolate;
  contain: layout paint;
}
```

### React Animation Performance

```tsx
import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

// Use memo to avoid unnecessary re-renders
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

// Cache animation variants
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

## Best Practices Summary

```
Web Animation Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Choose the Right Technology                       │
│   ├── Use CSS for simple transitions               │
│   ├── Use Web Animations API for complex control   │
│   ├── Use Framer Motion for React projects         │
│   └── Use D3.js for data visualization             │
│                                                     │
│   Performance Considerations                        │
│   ├── Prefer transform and opacity                 │
│   ├── Avoid animations that trigger reflow         │
│   ├── Use will-change appropriately                │
│   └── Reduce concurrent animations                  │
│                                                     │
│   User Experience                                   │
│   ├── Respect prefers-reduced-motion               │
│   ├── Keep animations short (200-500ms)            │
│   ├── Use meaningful animations                     │
│   └── Avoid excessive animation                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommendation |
|----------|----------------|
| Hover effects | CSS transition |
| Loading animations | CSS @keyframes |
| Page transitions | Framer Motion |
| Complex sequences | Web Animations API |

---

*The best animation is one that users barely notice.*
