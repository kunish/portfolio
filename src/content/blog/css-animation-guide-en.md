---
title: 'CSS Animation Complete Guide: From Transitions to Keyframe Animations'
description: 'Master transition, animation, transform and performance optimization techniques'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'css-animation-guide'
---

CSS animations bring web pages to life. This article explores techniques for using transition and animation.

## Transition Basics

### Basic Syntax

```css
/* Single property transition */
.button {
  background-color: #3498db;
  transition: background-color 0.3s ease;
}

.button:hover {
  background-color: #2980b9;
}

/* Multiple property transitions */
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

/* All properties (use cautiously) */
.element {
  transition: all 0.3s ease;
}
```

### Transition Properties Explained

```css
.element {
  /* Full syntax */
  transition-property: transform, opacity;
  transition-duration: 0.3s, 0.5s;
  transition-timing-function: ease-in-out;
  transition-delay: 0s, 0.1s;

  /* Shorthand */
  transition: transform 0.3s ease-in-out,
              opacity 0.5s ease-in-out 0.1s;
}
```

### Timing Functions

```css
.element {
  /* Preset functions */
  transition-timing-function: ease;        /* Default, slow-fast-slow */
  transition-timing-function: linear;      /* Constant speed */
  transition-timing-function: ease-in;     /* Slow start */
  transition-timing-function: ease-out;    /* Slow end */
  transition-timing-function: ease-in-out; /* Slow start and end */

  /* Bezier curves */
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* Step functions */
  transition-timing-function: steps(4, end);
}
```

## Transform

### 2D Transforms

```css
.element {
  /* Translate */
  transform: translateX(100px);
  transform: translateY(50px);
  transform: translate(100px, 50px);

  /* Scale */
  transform: scaleX(1.5);
  transform: scaleY(0.5);
  transform: scale(1.5, 0.5);

  /* Rotate */
  transform: rotate(45deg);

  /* Skew */
  transform: skewX(10deg);
  transform: skewY(10deg);
  transform: skew(10deg, 5deg);

  /* Combined (order matters) */
  transform: translate(100px, 0) rotate(45deg) scale(1.2);
}
```

### 3D Transforms

```css
.container {
  perspective: 1000px;
  perspective-origin: center;
}

.element {
  /* 3D translate */
  transform: translateZ(100px);
  transform: translate3d(100px, 50px, 30px);

  /* 3D rotate */
  transform: rotateX(45deg);
  transform: rotateY(45deg);
  transform: rotateZ(45deg);
  transform: rotate3d(1, 1, 0, 45deg);

  /* Preserve 3D space */
  transform-style: preserve-3d;

  /* Backface visibility */
  backface-visibility: hidden;
}
```

### Transform Origin

```css
.element {
  /* Default center */
  transform-origin: center;

  /* Keywords */
  transform-origin: top left;
  transform-origin: bottom right;

  /* Specific values */
  transform-origin: 0 0;
  transform-origin: 100% 100%;
  transform-origin: 50px 100px;

  /* 3D origin */
  transform-origin: 50% 50% 50px;
}
```

## Animation

### Keyframe Definition

```css
/* Basic keyframes */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Percentage keyframes */
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

/* Complex animation */
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

### Animation Properties

```css
.element {
  /* Full syntax */
  animation-name: bounce;
  animation-duration: 1s;
  animation-timing-function: ease-in-out;
  animation-delay: 0s;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-fill-mode: both;
  animation-play-state: running;

  /* Shorthand */
  animation: bounce 1s ease-in-out infinite alternate;
}
```

### Animation Property Values

```css
.element {
  /* Iteration count */
  animation-iteration-count: 3;        /* Specific count */
  animation-iteration-count: infinite; /* Loop forever */

  /* Direction */
  animation-direction: normal;          /* Forward */
  animation-direction: reverse;         /* Backward */
  animation-direction: alternate;       /* Alternate */
  animation-direction: alternate-reverse;

  /* Fill mode */
  animation-fill-mode: none;      /* Default, reset after */
  animation-fill-mode: forwards;  /* Keep end state */
  animation-fill-mode: backwards; /* Apply start state */
  animation-fill-mode: both;      /* Apply both */

  /* Play state */
  animation-play-state: running;
  animation-play-state: paused;
}
```

## Practical Animation Examples

### Loading Animations

```css
/* Spin loader */
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

/* Pulsing dots */
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

### Hover Effects

```css
/* Button ripple */
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

/* Underline animation */
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

### Entrance Animations

```css
/* Fade in up */
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

/* Staggered entrance */
.stagger-item {
  opacity: 0;
  animation: fadeInUp 0.6s ease-out forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0.1s; }
.stagger-item:nth-child(2) { animation-delay: 0.2s; }
.stagger-item:nth-child(3) { animation-delay: 0.3s; }
.stagger-item:nth-child(4) { animation-delay: 0.4s; }

/* Using CSS variables */
.stagger-item {
  animation-delay: calc(var(--index) * 0.1s);
}
```

### Flip Card

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

## Performance Optimization

### High-Performance Properties

```css
/* Recommended: only animate these */
.performant {
  /* GPU accelerated, no reflow/repaint */
  transform: translateX(100px);
  opacity: 0.5;
}

/* Avoid: properties that trigger reflow */
.avoid {
  /* These trigger reflow */
  width: 200px;
  height: 200px;
  margin: 10px;
  padding: 10px;
  left: 100px;
  top: 100px;
}
```

### Hardware Acceleration

```css
.accelerated {
  /* Trigger GPU acceleration */
  transform: translateZ(0);
  /* Or */
  will-change: transform;
}

/* Note: don't overuse will-change */
.element:hover {
  will-change: transform;
}

.element {
  /* Remove after hover ends */
  will-change: auto;
}
```

### Reduce Repaints

```css
/* Use transform instead of position */
.slide {
  /* Good */
  transform: translateX(100px);

  /* Avoid */
  /* left: 100px; */
}

/* Use opacity instead of visibility */
.fade {
  /* Good */
  opacity: 0;

  /* Avoid frequent toggling */
  /* visibility: hidden; */
}
```

## Responsive Animations

### Reduced Motion Preference

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Or provide alternatives */
.animated-element {
  animation: bounce 1s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
  }
}
```

## Best Practices Summary

```
CSS Animation Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Performance                                       │
│   ├── Only animate transform and opacity           │
│   ├── Use will-change to hint browser              │
│   ├── Avoid animating many elements at once        │
│   └── Measure actual performance                   │
│                                                     │
│   User Experience                                   │
│   ├── 200-500ms duration is optimal                │
│   ├── Use appropriate easing functions             │
│   ├── Avoid excessive animations                   │
│   └── Respect prefers-reduced-motion               │
│                                                     │
│   Code Organization                                 │
│   ├── Use CSS variables for durations              │
│   ├── Create reusable animation classes            │
│   └── Keep animations simple and purposeful        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Property | Purpose |
|----------|---------|
| transition | Smooth state changes |
| animation | Complex keyframe animations |
| transform | Transform elements |
| opacity | Transparency changes |

---

*Proper animations make interactions feel natural and fluid.*
