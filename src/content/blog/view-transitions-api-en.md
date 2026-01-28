---
title: 'View Transitions API: A New Era of Native Page Transitions'
description: 'Explore the browser-native View Transitions API—say goodbye to complex animation libraries and achieve silky-smooth page transitions'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'view-transitions-api'
---

Remember when smooth page transitions required complex JavaScript libraries? Now, the browser-native **View Transitions API** makes it simple and elegant. With just a few lines of code, you can achieve native-app-like smooth transitions.

## Why Do We Need View Transitions?

Traditional web page switches are "hard cuts"—the old page disappears, and the new page suddenly appears. This experience contrasts sharply with native apps. To improve this, developers typically needed to:

- Use SPA frameworks and implement animations manually
- Include animation libraries like Framer Motion or GSAP
- Manually manage DOM snapshots and transition states

The View Transitions API encapsulates this complexity at the browser level, providing a declarative way to define transition animations.

## Basic Usage

### Transitions in Single Page Applications (SPA)

```javascript
// Simplest transition
document.startViewTransition(() => {
  // Update DOM
  updateContent();
});

// Transition with async operations
document.startViewTransition(async () => {
  const data = await fetchNewContent();
  renderContent(data);
});
```

That's it! The browser automatically:
1. Captures a snapshot of the current page
2. Executes your DOM update
3. Captures a snapshot of the new state
4. Performs a crossfade animation between them

### Default Transition Effect

```css
/* Browser uses these pseudo-elements for transitions by default */
::view-transition-old(root) {
  animation: 250ms ease-out both fade-out;
}

::view-transition-new(root) {
  animation: 250ms ease-out both fade-in;
}
```

## Customizing Transition Animations

### 1. Modifying Default Transitions

```css
/* Extend transition duration */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 500ms;
}

/* Slide effect */
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

### 2. Named Transition Groups

The real power of View Transitions lies in **named transitions**—letting specific elements transition independently:

```css
/* Define elements that need independent transitions */
.hero-image {
  view-transition-name: hero;
}

.page-title {
  view-transition-name: title;
}

/* Customize transitions for these elements */
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

### 3. Shared Element Transitions

When two pages have elements with the same `view-transition-name`, the browser automatically creates a "shared element transition"—the element smoothly moves from its old position to its new position:

```css
/* Article list page */
.article-card-1 .thumbnail {
  view-transition-name: article-hero-1;
}

/* Article detail page */
.article-detail .hero-image {
  view-transition-name: article-hero-1;
}
```

```
┌─────────────────┐          ┌─────────────────────────┐
│  List Page      │          │      Detail Page        │
│ ┌───┐           │          │ ┌───────────────────┐   │
│ │ 🖼 │ Title     │  ──────▶ │ │                   │   │
│ └───┘           │ Transition│ │       🖼           │   │
│                 │ Animation │ │                   │   │
│ ┌───┐           │          │ └───────────────────┘   │
│ │ 🖼 │ Another   │          │ Article Title          │
│ └───┘           │          │ Article content...      │
└─────────────────┘          └─────────────────────────┘
```

The thumbnail automatically scales up and moves to the hero position on the detail page!

## Transitions in Multi-Page Applications (MPA)

Starting from Chrome 126, View Transitions also support cross-page navigation:

```css
/* Enable MPA transitions in CSS */
@view-transition {
  navigation: auto;
}
```

Or via meta tag:

```html
<meta name="view-transition" content="same-origin">
```

### MPA Shared Elements

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

As long as elements on both pages have the same `view-transition-name`, shared element transitions work across page navigations!

## Practical Example: Blog List to Detail

### HTML Structure

```html
<!-- List page -->
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
    Article Title
  </h2>
</article>
```

```html
<!-- Detail page -->
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
    Article Title
  </h1>
  <div class="post-content">...</div>
</article>
```

### JavaScript Implementation (SPA)

```javascript
async function navigateToPost(postId) {
  // Check browser support
  if (!document.startViewTransition) {
    // Fallback
    window.location.href = `/posts/${postId}`;
    return;
  }

  const transition = document.startViewTransition(async () => {
    // Fetch article content
    const response = await fetch(`/api/posts/${postId}`);
    const post = await response.json();

    // Update DOM using framework's safe rendering methods
    // Note: In real projects, use your framework's safe rendering mechanism
    // or sanitize content with libraries like DOMPurify
    renderPostDetail(document.querySelector('main'), post);

    // Update URL
    history.pushState({}, '', `/posts/${postId}`);
  });

  // Optional: wait for transition to complete
  await transition.finished;
  console.log('Transition completed!');
}
```

### CSS Animation Definitions

```css
/* Global transition settings */
::view-transition-group(*) {
  animation-duration: 350ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Page content fade in/out */
::view-transition-old(root) {
  animation: 200ms ease-out fade-out;
}

::view-transition-new(root) {
  animation: 300ms ease-in fade-in;
}

/* Maintain aspect ratio for image transitions */
::view-transition-old(post-image-1),
::view-transition-new(post-image-1) {
  object-fit: cover;
  overflow: hidden;
}

/* Title transition */
::view-transition-group(post-title-1) {
  animation-duration: 400ms;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

## Astro Integration

Astro provides first-class support for View Transitions:

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

Astro automatically handles View Transitions in MPA navigation!

## Transition Types

The View Transitions API provides different transition types to distinguish navigation direction:

```javascript
// Set transition type
document.startViewTransition({
  update: updateDOM,
  types: ['slide-left']
});
```

```css
/* Apply different animations based on type */
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

## Performance Considerations

### 1. Avoid Too Many Named Transitions

```css
/* ⚠️ Avoid: Too many independent transition elements impact performance */
.list-item {
  view-transition-name: item-1; /* Each item has unique name */
}

/* ✅ Recommended: Only use named transitions for key elements */
.hero-image {
  view-transition-name: hero;
}
```

### 2. Use contain for Optimization

```css
.transition-element {
  view-transition-name: element;
  contain: layout;  /* Helps browser optimize */
}
```

### 3. Conditional Enabling

```javascript
// Decide whether to enable transitions based on device performance
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion && document.startViewTransition) {
  document.startViewTransition(updateDOM);
} else {
  updateDOM();
}
```

## Browser Support

| Browser | SPA Transitions | MPA Transitions |
|---------|-----------------|-----------------|
| Chrome | 111+ | 126+ |
| Edge | 111+ | 126+ |
| Safari | 18+ | 18+ |
| Firefox | 🚧 In Development | 🚧 In Development |

### Progressive Enhancement Strategy

```javascript
function navigate(url) {
  if (document.startViewTransition) {
    document.startViewTransition(() => loadPage(url));
  } else {
    loadPage(url);
  }
}
```

## Summary

The View Transitions API represents a significant advancement in web animation:

| Traditional Approach | View Transitions |
|---------------------|------------------|
| Requires JavaScript libraries | Browser-native support |
| Manual state management | Automatic snapshots and transitions |
| Complex DOM operations | Declarative CSS |
| SPA-only | Works for SPA + MPA |

**Key Takeaways**:

1. `document.startViewTransition()` is the starting point
2. `view-transition-name` creates independent transition groups
3. Elements with the same name automatically create shared element transitions
4. Always consider `prefers-reduced-motion`
5. MPA support brings smooth transitions to traditional websites

The View Transitions API makes effects that once required complex libraries accessible to everyone. If you're building a website that values user experience, now is the perfect time to start using it.

---

*Next time your users navigate between pages, let them experience the silky-smooth transitions they deserve.*
