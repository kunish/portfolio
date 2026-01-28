---
title: 'JavaScript Intersection Observer API Complete Guide'
description: 'Master element visibility detection: lazy loading, infinite scroll, animation triggers, and performance optimization'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'js-intersection-observer-guide'
---

The Intersection Observer API provides asynchronous detection of element visibility changes. This article covers its usage and practical applications.

## Basic Concepts

### Creating an Observer

```javascript
// Basic usage
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    console.log(entry.target, entry.isIntersecting);
  });
});

// Start observing an element
const element = document.querySelector('.target');
observer.observe(element);

// Stop observing
observer.unobserve(element);

// Disconnect all observations
observer.disconnect();
```

### Configuration Options

```javascript
const options = {
  // Root element (defaults to viewport)
  root: document.querySelector('.scroll-container'),

  // Root margin (expand or contract detection area)
  rootMargin: '0px 0px -100px 0px',

  // Trigger thresholds (visibility ratio)
  threshold: 0 // Single value: 0-1
  // threshold: [0, 0.25, 0.5, 0.75, 1] // Multiple thresholds
};

const observer = new IntersectionObserver(callback, options);
```

### IntersectionObserverEntry

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // Target element
    console.log(entry.target);

    // Is intersecting
    console.log(entry.isIntersecting);

    // Intersection ratio 0-1
    console.log(entry.intersectionRatio);

    // Target element bounds
    console.log(entry.boundingClientRect);

    // Root element bounds
    console.log(entry.rootBounds);

    // Intersection area bounds
    console.log(entry.intersectionRect);

    // Timestamp
    console.log(entry.time);
  });
});
```

## Practical Applications

### Image Lazy Loading

```javascript
class LazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px 0px',
      threshold: 0.01,
      ...options
    };

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    );
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }

  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (src) {
      img.src = src;
    }

    if (srcset) {
      img.srcset = srcset;
    }

    img.classList.add('loaded');
  }

  observe(selector = 'img[data-src]') {
    const images = document.querySelectorAll(selector);
    images.forEach(img => this.observer.observe(img));
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
const lazyLoader = new LazyLoader({
  rootMargin: '100px 0px'
});

lazyLoader.observe();
```

### Infinite Scroll

```javascript
class InfiniteScroll {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      threshold: 0.1,
      rootMargin: '100px',
      loadMore: async () => {},
      ...options
    };

    this.isLoading = false;
    this.hasMore = true;

    this.setupSentinel();
    this.setupObserver();
  }

  setupSentinel() {
    this.sentinel = document.createElement('div');
    this.sentinel.className = 'scroll-sentinel';
    this.container.appendChild(this.sentinel);
  }

  setupObserver() {
    this.observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting && !this.isLoading && this.hasMore) {
          await this.loadContent();
        }
      },
      {
        root: this.options.root,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold
      }
    );

    this.observer.observe(this.sentinel);
  }

  async loadContent() {
    this.isLoading = true;
    this.showLoader();

    try {
      const result = await this.options.loadMore();

      if (result.items.length === 0 || !result.hasMore) {
        this.hasMore = false;
        this.observer.disconnect();
      }

      this.renderItems(result.items);
    } catch (error) {
      console.error('Loading failed:', error);
    } finally {
      this.isLoading = false;
      this.hideLoader();
    }
  }

  renderItems(items) {
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
      const element = this.options.renderItem(item);
      fragment.appendChild(element);
    });

    this.sentinel.before(fragment);
  }

  showLoader() {
    this.sentinel.textContent = 'Loading...';
  }

  hideLoader() {
    this.sentinel.textContent = '';
  }

  destroy() {
    this.observer.disconnect();
    this.sentinel.remove();
  }
}

// Usage
const container = document.querySelector('.content-list');
let page = 1;

const infiniteScroll = new InfiniteScroll(container, {
  loadMore: async () => {
    const response = await fetch('/api/items?page=' + page++);
    return response.json();
  },
  renderItem: (item) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.textContent = item.title;
    return div;
  }
});
```

### Scroll Animations

```javascript
class ScrollAnimator {
  constructor(options = {}) {
    this.options = {
      threshold: 0.2,
      rootMargin: '0px',
      animationClass: 'animate',
      once: true,
      ...options
    };

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: this.options.threshold,
        rootMargin: this.options.rootMargin
      }
    );
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.animate(entry.target);

        if (this.options.once) {
          this.observer.unobserve(entry.target);
        }
      } else if (!this.options.once) {
        this.unanimate(entry.target);
      }
    });
  }

  animate(element) {
    const animation = element.dataset.animation || this.options.animationClass;
    const delay = element.dataset.delay || 0;

    setTimeout(() => {
      element.classList.add(animation);
      element.classList.add('visible');
    }, parseFloat(delay) * 1000);
  }

  unanimate(element) {
    const animation = element.dataset.animation || this.options.animationClass;
    element.classList.remove(animation);
    element.classList.remove('visible');
  }

  observe(selector = '[data-animate]') {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => this.observer.observe(el));
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
const animator = new ScrollAnimator({
  threshold: 0.3,
  once: true
});

animator.observe();
```

### Video Auto-Play

```javascript
class VideoAutoPlayer {
  constructor(options = {}) {
    this.options = {
      threshold: 0.5,
      muted: true,
      ...options
    };

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      { threshold: this.options.threshold }
    );
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const video = entry.target;

      if (entry.isIntersecting) {
        this.playVideo(video);
      } else {
        this.pauseVideo(video);
      }
    });
  }

  playVideo(video) {
    if (video.paused) {
      video.muted = this.options.muted;
      video.play().catch(err => {
        console.log('Autoplay blocked:', err);
      });
    }
  }

  pauseVideo(video) {
    if (!video.paused) {
      video.pause();
    }
  }

  observe(selector = 'video[data-autoplay]') {
    const videos = document.querySelectorAll(selector);
    videos.forEach(video => this.observer.observe(video));
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
const videoPlayer = new VideoAutoPlayer({
  threshold: 0.6,
  muted: true
});

videoPlayer.observe();
```

### Ad Viewability Tracking

```javascript
class AdViewabilityTracker {
  constructor(options = {}) {
    this.options = {
      viewableThreshold: 0.5,
      viewableTime: 1000,
      ...options
    };

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      { threshold: [0, 0.5, 1] }
    );

    this.adStates = new Map();
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const adId = entry.target.dataset.adId;
      const state = this.adStates.get(adId) || this.createState(adId);

      if (entry.intersectionRatio >= this.options.viewableThreshold) {
        if (!state.viewableStartTime) {
          state.viewableStartTime = Date.now();
          state.timer = setTimeout(() => {
            this.trackViewable(entry.target, state);
          }, this.options.viewableTime);
        }
      } else {
        this.clearViewableTimer(state);
      }

      state.maxVisibility = Math.max(
        state.maxVisibility,
        entry.intersectionRatio
      );

      this.adStates.set(adId, state);
    });
  }

  createState(adId) {
    return {
      viewableTracked: false,
      viewableStartTime: null,
      maxVisibility: 0,
      timer: null
    };
  }

  clearViewableTimer(state) {
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
    state.viewableStartTime = null;
  }

  trackViewable(element, state) {
    if (!state.viewableTracked) {
      state.viewableTracked = true;

      this.sendAnalytics({
        event: 'ad_viewable',
        adId: element.dataset.adId,
        viewTime: this.options.viewableTime
      });
    }
  }

  sendAnalytics(data) {
    console.log('Ad tracking:', data);
  }

  observe(selector = '[data-ad-id]') {
    const ads = document.querySelectorAll(selector);
    ads.forEach(ad => this.observer.observe(ad));
  }

  destroy() {
    this.observer.disconnect();
    this.adStates.forEach(state => this.clearViewableTimer(state));
    this.adStates.clear();
  }
}

// Usage
const adTracker = new AdViewabilityTracker({
  viewableThreshold: 0.5,
  viewableTime: 2000
});

adTracker.observe();
```

### Table of Contents Highlighting

```javascript
class TableOfContentsHighlighter {
  constructor(options = {}) {
    this.options = {
      contentSelector: 'article',
      headingSelector: 'h2, h3',
      tocSelector: '.toc',
      activeClass: 'active',
      offset: 100,
      ...options
    };

    this.headings = [];
    this.tocLinks = new Map();

    this.init();
  }

  init() {
    this.collectHeadings();
    this.setupObserver();
  }

  collectHeadings() {
    const content = document.querySelector(this.options.contentSelector);
    const headings = content.querySelectorAll(this.options.headingSelector);
    const toc = document.querySelector(this.options.tocSelector);

    headings.forEach(heading => {
      const id = heading.id || this.generateId(heading);
      heading.id = id;

      const link = toc.querySelector('a[href="#' + id + '"]');
      if (link) {
        this.headings.push(heading);
        this.tocLinks.set(heading, link);
      }
    });
  }

  generateId(heading) {
    return heading.textContent
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  setupObserver() {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: '-' + this.options.offset + 'px 0px -80% 0px',
        threshold: 0
      }
    );

    this.headings.forEach(heading => {
      this.observer.observe(heading);
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const link = this.tocLinks.get(entry.target);

      if (entry.isIntersecting) {
        this.tocLinks.forEach(l => {
          l.classList.remove(this.options.activeClass);
        });

        link.classList.add(this.options.activeClass);
      }
    });
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
const tocHighlighter = new TableOfContentsHighlighter({
  contentSelector: 'main',
  headingSelector: 'h2, h3, h4',
  tocSelector: 'nav.toc',
  activeClass: 'current'
});
```

## Advanced Techniques

### Multiple Threshold Observation

```javascript
// Track precise visibility percentage
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      const percent = Math.round(entry.intersectionRatio * 100);
      entry.target.dataset.visibility = percent + '%';

      if (entry.intersectionRatio >= 0.75) {
        entry.target.classList.add('mostly-visible');
      } else if (entry.intersectionRatio >= 0.25) {
        entry.target.classList.add('partially-visible');
      } else {
        entry.target.classList.remove('mostly-visible', 'partially-visible');
      }
    });
  },
  {
    threshold: Array.from({ length: 101 }, (_, i) => i / 100)
  }
);
```

### Combining Multiple Observers

```javascript
class MultiObserver {
  constructor() {
    this.observers = new Map();
  }

  create(name, callback, options = {}) {
    const observer = new IntersectionObserver(callback, options);
    this.observers.set(name, observer);
    return observer;
  }

  observe(name, elements) {
    const observer = this.observers.get(name);
    if (!observer) return;

    if (elements instanceof NodeList || Array.isArray(elements)) {
      elements.forEach(el => observer.observe(el));
    } else {
      observer.observe(elements);
    }
  }

  disconnect(name) {
    const observer = this.observers.get(name);
    if (observer) {
      observer.disconnect();
      this.observers.delete(name);
    }
  }

  disconnectAll() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Usage
const multiObserver = new MultiObserver();

multiObserver.create('lazy', (entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadImage(entry.target);
    }
  });
}, { rootMargin: '50px' });

multiObserver.create('animate', (entries) => {
  entries.forEach(entry => {
    entry.target.classList.toggle('animate', entry.isIntersecting);
  });
}, { threshold: 0.2 });

multiObserver.observe('lazy', document.querySelectorAll('img[data-src]'));
multiObserver.observe('animate', document.querySelectorAll('[data-animate]'));
```

## Best Practices Summary

```
Intersection Observer Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Performance                                       │
│   ├── Reuse observer instances                     │
│   ├── Set appropriate rootMargin                   │
│   ├── Choose suitable thresholds                   │
│   └── Unobserve elements when done                 │
│                                                     │
│   Use Cases                                         │
│   ├── Image/video lazy loading                     │
│   ├── Infinite scrolling                           │
│   ├── Scroll animation triggers                    │
│   └── Visibility tracking                          │
│                                                     │
│   Considerations                                    │
│   ├── Callbacks are asynchronous                   │
│   ├── Callback fires on initialization             │
│   ├── Watch for memory leaks                       │
│   └── Consider browser compatibility               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Option | Recommended | Description |
|--------|-------------|-------------|
| rootMargin | '50px 0px' | Load ahead |
| threshold | 0.1 | Basic visibility |
| threshold | [0, 0.5, 1] | Precise tracking |

---

*Master the Intersection Observer API to build high-performance scroll interactions.*
