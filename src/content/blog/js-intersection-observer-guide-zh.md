---
title: 'JavaScript Intersection Observer API 完全指南'
description: '掌握元素可见性检测：懒加载、无限滚动、动画触发与性能优化'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'js-intersection-observer-guide'
---

Intersection Observer API 提供了异步检测元素可见性变化的能力。本文详解其用法和实战应用。

## 基础概念

### 创建观察器

```javascript
// 基本用法
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    console.log(entry.target, entry.isIntersecting);
  });
});

// 开始观察元素
const element = document.querySelector('.target');
observer.observe(element);

// 停止观察
observer.unobserve(element);

// 断开所有观察
observer.disconnect();
```

### 配置选项

```javascript
const options = {
  // 根元素（默认为视口）
  root: document.querySelector('.scroll-container'),

  // 根元素边距（扩展或收缩检测区域）
  rootMargin: '0px 0px -100px 0px',

  // 触发阈值（可见比例）
  threshold: 0 // 单个值：0-1
  // threshold: [0, 0.25, 0.5, 0.75, 1] // 多个阈值
};

const observer = new IntersectionObserver(callback, options);
```

### IntersectionObserverEntry

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // 目标元素
    console.log(entry.target);

    // 是否相交
    console.log(entry.isIntersecting);

    // 相交比例 0-1
    console.log(entry.intersectionRatio);

    // 目标元素边界
    console.log(entry.boundingClientRect);

    // 根元素边界
    console.log(entry.rootBounds);

    // 相交区域边界
    console.log(entry.intersectionRect);

    // 时间戳
    console.log(entry.time);
  });
});
```

## 实战应用

### 图片懒加载

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

// 使用
const lazyLoader = new LazyLoader({
  rootMargin: '100px 0px'
});

lazyLoader.observe();
```

### 无限滚动

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
      console.error('加载失败:', error);
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
    this.sentinel.textContent = '加载中...';
  }

  hideLoader() {
    this.sentinel.textContent = '';
  }

  destroy() {
    this.observer.disconnect();
    this.sentinel.remove();
  }
}

// 使用
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

### 滚动动画

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

// 使用
const animator = new ScrollAnimator({
  threshold: 0.3,
  once: true
});

animator.observe();
```

### 视频自动播放

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
        console.log('自动播放被阻止:', err);
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

// 使用
const videoPlayer = new VideoAutoPlayer({
  threshold: 0.6,
  muted: true
});

videoPlayer.observe();
```

### 广告可见性追踪

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
    console.log('广告追踪:', data);
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

// 使用
const adTracker = new AdViewabilityTracker({
  viewableThreshold: 0.5,
  viewableTime: 2000
});

adTracker.observe();
```

### 目录高亮

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

// 使用
const tocHighlighter = new TableOfContentsHighlighter({
  contentSelector: 'main',
  headingSelector: 'h2, h3, h4',
  tocSelector: 'nav.toc',
  activeClass: 'current'
});
```

## 高级技巧

### 多阈值观察

```javascript
// 追踪精确的可见比例
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

### 组合多个观察器

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

// 使用
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

## 最佳实践总结

```
Intersection Observer 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   性能优化                                          │
│   ├── 复用观察器实例                               │
│   ├── 合理设置 rootMargin                          │
│   ├── 选择适当的 threshold                         │
│   └── 及时 unobserve 不需要的元素                  │
│                                                     │
│   使用场景                                          │
│   ├── 图片/视频懒加载                              │
│   ├── 无限滚动                                     │
│   ├── 滚动动画触发                                 │
│   └── 可见性追踪                                   │
│                                                     │
│   注意事项                                          │
│   ├── 回调是异步执行的                             │
│   ├── 初始化时会触发一次回调                       │
│   ├── 注意内存泄漏                                 │
│   └── 考虑浏览器兼容性                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 选项 | 推荐值 | 说明 |
|------|-------|------|
| rootMargin | '50px 0px' | 提前加载 |
| threshold | 0.1 | 基本可见检测 |
| threshold | [0, 0.5, 1] | 精确追踪 |

---

*掌握 Intersection Observer API，构建高性能的滚动交互体验。*
