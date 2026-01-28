---
title: 'JavaScript Fullscreen API 完全指南'
description: '掌握全屏控制：进入/退出全屏、事件监听、样式控制与跨浏览器兼容'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'js-fullscreen-api-guide'
---

Fullscreen API 允许网页元素以全屏模式显示。本文详解其使用方法和实战应用。

## 基础用法

### 检测支持

```javascript
// 检测全屏支持
function isFullscreenSupported() {
  return !!(
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullscreenEnabled
  );
}

// 检测当前是否全屏
function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

// 获取当前全屏元素
function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

console.log('全屏支持:', isFullscreenSupported());
console.log('当前全屏:', isFullscreen());
```

### 进入全屏

```javascript
// 基础进入全屏
async function enterFullscreen(element) {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    }
    console.log('已进入全屏');
  } catch (error) {
    console.error('进入全屏失败:', error);
  }
}

// 使用示例
const videoElement = document.getElementById('video');
const fullscreenBtn = document.getElementById('fullscreen-btn');

fullscreenBtn.addEventListener('click', () => {
  enterFullscreen(videoElement);
});
```

### 退出全屏

```javascript
// 退出全屏
async function exitFullscreen() {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      await document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen();
    }
    console.log('已退出全屏');
  } catch (error) {
    console.error('退出全屏失败:', error);
  }
}

// 切换全屏
async function toggleFullscreen(element) {
  if (isFullscreen()) {
    await exitFullscreen();
  } else {
    await enterFullscreen(element);
  }
}

// 使用示例
document.getElementById('toggle-btn').addEventListener('click', () => {
  toggleFullscreen(document.getElementById('container'));
});
```

### 全屏选项

```javascript
// 带选项的全屏请求
async function enterFullscreenWithOptions(element, options = {}) {
  const fullscreenOptions = {
    // 导航 UI 显示模式
    // 'auto' - 浏览器决定
    // 'hide' - 隐藏导航
    // 'show' - 显示导航
    navigationUI: options.navigationUI || 'auto'
  };
  
  try {
    await element.requestFullscreen(fullscreenOptions);
  } catch (error) {
    console.error('全屏请求失败:', error);
  }
}

// 隐藏导航栏的全屏
enterFullscreenWithOptions(element, { navigationUI: 'hide' });
```

## 事件处理

### 全屏变化事件

```javascript
// 监听全屏变化
function onFullscreenChange(callback) {
  document.addEventListener('fullscreenchange', callback);
  document.addEventListener('webkitfullscreenchange', callback);
  document.addEventListener('mozfullscreenchange', callback);
  document.addEventListener('MSFullscreenChange', callback);
}

// 移除监听
function offFullscreenChange(callback) {
  document.removeEventListener('fullscreenchange', callback);
  document.removeEventListener('webkitfullscreenchange', callback);
  document.removeEventListener('mozfullscreenchange', callback);
  document.removeEventListener('MSFullscreenChange', callback);
}

// 使用示例
onFullscreenChange(() => {
  if (isFullscreen()) {
    console.log('进入全屏模式');
    console.log('全屏元素:', getFullscreenElement());
  } else {
    console.log('退出全屏模式');
  }
});
```

### 全屏错误事件

```javascript
// 监听全屏错误
function onFullscreenError(callback) {
  document.addEventListener('fullscreenerror', callback);
  document.addEventListener('webkitfullscreenerror', callback);
  document.addEventListener('mozfullscreenerror', callback);
  document.addEventListener('MSFullscreenError', callback);
}

onFullscreenError((event) => {
  console.error('全屏错误:', event);
  
  // 可能的错误原因:
  // 1. 元素不在文档中
  // 2. 元素在 iframe 中但没有 allowfullscreen
  // 3. 不是用户手势触发
  // 4. 元素被禁止全屏
});
```

## 全屏管理器

### 封装类

```javascript
class FullscreenManager {
  constructor() {
    this.listeners = {
      change: new Set(),
      error: new Set()
    };
    
    this.setupEventListeners();
  }
  
  get supported() {
    return !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    );
  }
  
  get isFullscreen() {
    return !!this.element;
  }
  
  get element() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }
  
  setupEventListeners() {
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];
    
    const errors = [
      'fullscreenerror',
      'webkitfullscreenerror',
      'mozfullscreenerror',
      'MSFullscreenError'
    ];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.emit('change', this.isFullscreen, this.element);
      });
    });
    
    errors.forEach(event => {
      document.addEventListener(event, (e) => {
        this.emit('error', e);
      });
    });
  }
  
  async enter(element, options = {}) {
    if (!this.supported) {
      throw new Error('全屏不受支持');
    }
    
    const el = element || document.documentElement;
    
    if (el.requestFullscreen) {
      return el.requestFullscreen(options);
    } else if (el.webkitRequestFullscreen) {
      return el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      return el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      return el.msRequestFullscreen();
    }
  }
  
  async exit() {
    if (!this.isFullscreen) return;
    
    if (document.exitFullscreen) {
      return document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      return document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      return document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      return document.msExitFullscreen();
    }
  }
  
  async toggle(element, options = {}) {
    if (this.isFullscreen) {
      return this.exit();
    }
    return this.enter(element, options);
  }
  
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
    }
    return () => this.off(event, callback);
  }
  
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].delete(callback);
    }
  }
  
  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(...args));
    }
  }
}

// 使用
const fullscreen = new FullscreenManager();

fullscreen.on('change', (isFullscreen, element) => {
  console.log('全屏状态:', isFullscreen);
  if (element) {
    console.log('全屏元素:', element.id);
  }
});

fullscreen.on('error', (error) => {
  console.error('全屏错误:', error);
});

// 进入全屏
document.getElementById('btn').addEventListener('click', () => {
  fullscreen.toggle(document.getElementById('video'));
});
```

## 全屏样式

### CSS 伪类

```css
/* 全屏元素样式 */
:fullscreen {
  background-color: black;
}

/* 全屏时的背景（Safari） */
::backdrop {
  background-color: rgba(0, 0, 0, 0.9);
}

/* 全屏元素的特定样式 */
.video-container:fullscreen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container:fullscreen video {
  max-width: 100%;
  max-height: 100%;
}

/* 全屏时隐藏某些元素 */
:fullscreen .hide-in-fullscreen {
  display: none;
}

/* 全屏时显示某些元素 */
.show-in-fullscreen {
  display: none;
}

:fullscreen .show-in-fullscreen {
  display: block;
}

/* 带前缀的兼容写法 */
:-webkit-full-screen {
  background-color: black;
}

:-moz-full-screen {
  background-color: black;
}

:-ms-fullscreen {
  background-color: black;
}
```

### 动态样式控制

```javascript
class FullscreenStyleController {
  constructor(element) {
    this.element = element;
    this.originalStyles = {};
    this.fullscreen = new FullscreenManager();
    
    this.fullscreen.on('change', (isFullscreen, el) => {
      if (el === this.element) {
        if (isFullscreen) {
          this.applyFullscreenStyles();
        } else {
          this.restoreStyles();
        }
      }
    });
  }
  
  applyFullscreenStyles() {
    // 保存原始样式
    this.originalStyles = {
      width: this.element.style.width,
      height: this.element.style.height,
      position: this.element.style.position,
      top: this.element.style.top,
      left: this.element.style.left,
      zIndex: this.element.style.zIndex,
      backgroundColor: this.element.style.backgroundColor
    };
    
    // 应用全屏样式
    Object.assign(this.element.style, {
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: '0',
      left: '0',
      zIndex: '9999',
      backgroundColor: '#000'
    });
  }
  
  restoreStyles() {
    Object.assign(this.element.style, this.originalStyles);
  }
  
  async enter() {
    return this.fullscreen.enter(this.element);
  }
  
  async exit() {
    return this.fullscreen.exit();
  }
  
  async toggle() {
    return this.fullscreen.toggle(this.element);
  }
}

// 使用
const container = document.getElementById('video-container');
const controller = new FullscreenStyleController(container);

document.getElementById('fullscreen-btn').addEventListener('click', () => {
  controller.toggle();
});
```

## 实际应用

### 视频播放器

```javascript
class VideoPlayer {
  constructor(container) {
    this.container = container;
    this.video = container.querySelector('video');
    this.controls = container.querySelector('.controls');
    this.fullscreenBtn = container.querySelector('.fullscreen-btn');
    
    this.fullscreen = new FullscreenManager();
    
    this.init();
  }
  
  init() {
    // 全屏按钮
    this.fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });
    
    // 双击全屏
    this.video.addEventListener('dblclick', () => {
      this.toggleFullscreen();
    });
    
    // 全屏变化监听
    this.fullscreen.on('change', (isFullscreen) => {
      this.updateFullscreenUI(isFullscreen);
    });
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
      if (this.fullscreen.element === this.container) {
        this.handleKeydown(e);
      }
    });
  }
  
  async toggleFullscreen() {
    await this.fullscreen.toggle(this.container);
  }
  
  updateFullscreenUI(isFullscreen) {
    this.container.classList.toggle('is-fullscreen', isFullscreen);
    
    const icon = this.fullscreenBtn.querySelector('i');
    if (icon) {
      icon.className = isFullscreen ? 'icon-exit-fullscreen' : 'icon-fullscreen';
    }
    
    this.fullscreenBtn.title = isFullscreen ? '退出全屏' : '全屏';
  }
  
  handleKeydown(e) {
    switch (e.key) {
      case 'Escape':
        // 浏览器会自动处理，这里可以添加额外逻辑
        break;
      case 'f':
      case 'F':
        this.toggleFullscreen();
        break;
      case ' ':
        e.preventDefault();
        this.video.paused ? this.video.play() : this.video.pause();
        break;
      case 'ArrowLeft':
        this.video.currentTime -= 10;
        break;
      case 'ArrowRight':
        this.video.currentTime += 10;
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.video.volume = Math.min(1, this.video.volume + 0.1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.video.volume = Math.max(0, this.video.volume - 0.1);
        break;
    }
  }
}

// 使用
const player = new VideoPlayer(document.getElementById('player'));
```

### 图片画廊

```javascript
class FullscreenGallery {
  constructor(container) {
    this.container = container;
    this.images = [...container.querySelectorAll('img')];
    this.currentIndex = 0;
    this.overlay = null;
    
    this.fullscreen = new FullscreenManager();
    
    this.init();
  }
  
  init() {
    // 点击图片进入全屏
    this.images.forEach((img, index) => {
      img.addEventListener('click', () => {
        this.open(index);
      });
    });
    
    // 创建全屏覆盖层
    this.createOverlay();
    
    // 全屏变化监听
    this.fullscreen.on('change', (isFullscreen) => {
      if (!isFullscreen && this.overlay.classList.contains('active')) {
        this.close();
      }
    });
  }
  
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'fullscreen-gallery-overlay';
    this.overlay.innerHTML = `
      <button class="close-btn">&times;</button>
      <button class="prev-btn">&lt;</button>
      <button class="next-btn">&gt;</button>
      <div class="image-container">
        <img src="" alt="">
      </div>
      <div class="counter"></div>
    `;
    
    document.body.appendChild(this.overlay);
    
    // 绑定事件
    this.overlay.querySelector('.close-btn').addEventListener('click', () => {
      this.close();
    });
    
    this.overlay.querySelector('.prev-btn').addEventListener('click', () => {
      this.prev();
    });
    
    this.overlay.querySelector('.next-btn').addEventListener('click', () => {
      this.next();
    });
    
    // 键盘导航
    document.addEventListener('keydown', (e) => {
      if (!this.overlay.classList.contains('active')) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          this.prev();
          break;
        case 'ArrowRight':
          this.next();
          break;
        case 'Escape':
          this.close();
          break;
      }
    });
    
    // 触摸滑动
    let startX = 0;
    this.overlay.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });
    
    this.overlay.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
      }
    });
  }
  
  async open(index) {
    this.currentIndex = index;
    this.updateImage();
    this.overlay.classList.add('active');
    
    await this.fullscreen.enter(this.overlay);
  }
  
  async close() {
    if (this.fullscreen.isFullscreen) {
      await this.fullscreen.exit();
    }
    this.overlay.classList.remove('active');
  }
  
  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.updateImage();
  }
  
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.updateImage();
  }
  
  updateImage() {
    const img = this.overlay.querySelector('.image-container img');
    img.src = this.images[this.currentIndex].src;
    
    const counter = this.overlay.querySelector('.counter');
    counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
  }
}

// 使用
const gallery = new FullscreenGallery(document.getElementById('gallery'));
```

### 演示模式

```javascript
class PresentationMode {
  constructor(slides) {
    this.slides = slides;
    this.currentSlide = 0;
    this.container = null;
    
    this.fullscreen = new FullscreenManager();
    
    this.createContainer();
    this.setupEventListeners();
  }
  
  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'presentation-container';
    this.container.innerHTML = `
      <div class="slide-viewport"></div>
      <div class="slide-controls">
        <button class="prev-slide">上一页</button>
        <span class="slide-number"></span>
        <button class="next-slide">下一页</button>
        <button class="exit-presentation">退出</button>
      </div>
      <div class="progress-bar">
        <div class="progress"></div>
      </div>
    `;
    
    document.body.appendChild(this.container);
  }
  
  setupEventListeners() {
    // 控制按钮
    this.container.querySelector('.prev-slide').addEventListener('click', () => {
      this.prevSlide();
    });
    
    this.container.querySelector('.next-slide').addEventListener('click', () => {
      this.nextSlide();
    });
    
    this.container.querySelector('.exit-presentation').addEventListener('click', () => {
      this.stop();
    });
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
      if (!this.container.classList.contains('active')) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          this.prevSlide();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          this.nextSlide();
          break;
        case 'Home':
          this.goToSlide(0);
          break;
        case 'End':
          this.goToSlide(this.slides.length - 1);
          break;
        case 'Escape':
          this.stop();
          break;
      }
    });
    
    // 全屏变化
    this.fullscreen.on('change', (isFullscreen) => {
      if (!isFullscreen && this.container.classList.contains('active')) {
        this.stop();
      }
    });
  }
  
  async start(startIndex = 0) {
    this.currentSlide = startIndex;
    this.container.classList.add('active');
    this.renderSlide();
    
    await this.fullscreen.enter(this.container, { navigationUI: 'hide' });
  }
  
  async stop() {
    if (this.fullscreen.isFullscreen) {
      await this.fullscreen.exit();
    }
    this.container.classList.remove('active');
  }
  
  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.renderSlide();
    }
  }
  
  nextSlide() {
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
      this.renderSlide();
    }
  }
  
  goToSlide(index) {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlide = index;
      this.renderSlide();
    }
  }
  
  renderSlide() {
    const viewport = this.container.querySelector('.slide-viewport');
    const slide = this.slides[this.currentSlide];
    
    viewport.innerHTML = slide.content || '';
    
    // 更新页码
    const number = this.container.querySelector('.slide-number');
    number.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;
    
    // 更新进度条
    const progress = this.container.querySelector('.progress');
    progress.style.width = `${((this.currentSlide + 1) / this.slides.length) * 100}%`;
    
    // 更新按钮状态
    this.container.querySelector('.prev-slide').disabled = this.currentSlide === 0;
    this.container.querySelector('.next-slide').disabled = 
      this.currentSlide === this.slides.length - 1;
  }
}

// 使用
const slides = [
  { content: '<h1>欢迎</h1><p>这是第一页</p>' },
  { content: '<h1>主题</h1><ul><li>要点1</li><li>要点2</li></ul>' },
  { content: '<h1>结论</h1><p>谢谢观看</p>' }
];

const presentation = new PresentationMode(slides);

document.getElementById('start-btn').addEventListener('click', () => {
  presentation.start();
});
```

## 最佳实践总结

```
Fullscreen API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   用户体验                                          │
│   ├── 需要用户手势触发全屏                         │
│   ├── 提供明显的退出方式                           │
│   ├── 保持控件可访问性                             │
│   └── 响应 Escape 键退出                           │
│                                                     │
│   兼容性                                            │
│   ├── 使用带前缀的 API                             │
│   ├── 检测支持情况后降级处理                       │
│   ├── CSS 伪类也需要前缀                           │
│   └── 测试不同浏览器行为                           │
│                                                     │
│   安全考虑                                          │
│   ├── iframe 需要 allowfullscreen 属性             │
│   ├── 某些元素可能被禁止全屏                       │
│   ├── 注意全屏状态下的用户输入                     │
│   └── 妥善处理全屏错误                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐做法 |
|------|----------|
| 视频播放器 | 容器元素全屏，保留控件 |
| 图片查看 | 使用 overlay 层全屏 |
| 游戏/演示 | 整个应用全屏 |
| iframe 内容 | 确保 allowfullscreen 属性 |

---

*善用 Fullscreen API，打造沉浸式的用户体验。*
