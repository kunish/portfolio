---
title: 'JavaScript 全屏与屏幕 API 完全指南'
description: '掌握 Fullscreen API、Page Visibility API、Screen API 的使用技巧'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'js-fullscreen-screen-api-guide'
---

全屏和屏幕相关的 API 是 Web 应用中常用的功能。本文详解这些 API 的用法和最佳实践。

## Fullscreen API

### 进入全屏

```javascript
// 进入全屏
async function enterFullscreen(element = document.documentElement) {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      // Safari
      await element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      // IE11
      await element.msRequestFullscreen();
    }
    return true;
  } catch (error) {
    console.error('进入全屏失败:', error);
    return false;
  }
}

// 使整个页面全屏
document.querySelector('.fullscreen-btn').addEventListener('click', () => {
  enterFullscreen();
});

// 使特定元素全屏
document.querySelector('.video-fullscreen-btn').addEventListener('click', () => {
  const video = document.querySelector('video');
  enterFullscreen(video);
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
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen();
    }
    return true;
  } catch (error) {
    console.error('退出全屏失败:', error);
    return false;
  }
}

// 切换全屏
async function toggleFullscreen(element) {
  if (isFullscreen()) {
    return exitFullscreen();
  } else {
    return enterFullscreen(element);
  }
}
```

### 检查全屏状态

```javascript
// 检查是否处于全屏
function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
}

// 获取当前全屏元素
function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement ||
    null
  );
}

// 检查是否支持全屏
function isFullscreenSupported() {
  return !!(
    document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen ||
    document.documentElement.msRequestFullscreen
  );
}
```

### 全屏事件

```javascript
// 监听全屏变化
function onFullscreenChange(callback) {
  document.addEventListener('fullscreenchange', callback);
  document.addEventListener('webkitfullscreenchange', callback);
  document.addEventListener('msfullscreenchange', callback);
}

// 监听全屏错误
function onFullscreenError(callback) {
  document.addEventListener('fullscreenerror', callback);
  document.addEventListener('webkitfullscreenerror', callback);
  document.addEventListener('msfullscreenerror', callback);
}

// 使用示例
onFullscreenChange(() => {
  if (isFullscreen()) {
    console.log('进入全屏');
    document.body.classList.add('is-fullscreen');
  } else {
    console.log('退出全屏');
    document.body.classList.remove('is-fullscreen');
  }
});

onFullscreenError((event) => {
  console.error('全屏错误:', event);
});
```

### 全屏样式

```css
/* 全屏时的元素样式 */
:fullscreen {
  background-color: #000;
}

:-webkit-full-screen {
  background-color: #000;
}

:-ms-fullscreen {
  background-color: #000;
}

/* 全屏容器的子元素 */
:fullscreen video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 使用 backdrop 伪元素 */
::backdrop {
  background-color: rgba(0, 0, 0, 0.9);
}

::-webkit-backdrop {
  background-color: rgba(0, 0, 0, 0.9);
}
```

## Page Visibility API

### 检测页面可见性

```javascript
// 获取当前可见状态
function getVisibilityState() {
  return document.visibilityState;
  // 'visible' - 页面可见
  // 'hidden' - 页面隐藏
  // 'prerender' - 页面正在预渲染
}

// 检查页面是否隐藏
function isPageHidden() {
  return document.hidden;
}

// 监听可见性变化
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('页面隐藏');
    handlePageHidden();
  } else {
    console.log('页面可见');
    handlePageVisible();
  }
});
```

### 实际应用

```javascript
// 1. 暂停/恢复视频
const video = document.querySelector('video');

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    video.pause();
  } else {
    video.play();
  }
});

// 2. 暂停动画
let animationId;

function animate() {
  // 动画逻辑
  animationId = requestAnimationFrame(animate);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animationId);
  } else {
    animate();
  }
});

// 3. 减少轮询频率
let pollInterval;

function startPolling() {
  pollInterval = setInterval(fetchData, document.hidden ? 60000 : 5000);
}

document.addEventListener('visibilitychange', () => {
  clearInterval(pollInterval);
  startPolling();
});

// 4. 更新标题提醒
let originalTitle = document.title;
let unreadCount = 0;

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    document.title = originalTitle;
    unreadCount = 0;
  }
});

function onNewMessage() {
  if (document.hidden) {
    unreadCount++;
    document.title = `(${unreadCount}) ${originalTitle}`;
  }
}
```

## Screen API

### 屏幕信息

```javascript
// 屏幕尺寸
console.log('屏幕宽度:', screen.width);
console.log('屏幕高度:', screen.height);

// 可用尺寸（不含系统 UI）
console.log('可用宽度:', screen.availWidth);
console.log('可用高度:', screen.availHeight);

// 颜色深度
console.log('颜色深度:', screen.colorDepth);
console.log('像素深度:', screen.pixelDepth);

// 设备像素比
console.log('设备像素比:', window.devicePixelRatio);

// 屏幕方向
console.log('方向:', screen.orientation?.type);
// 'portrait-primary', 'portrait-secondary'
// 'landscape-primary', 'landscape-secondary'
```

### 屏幕方向

```javascript
// 获取当前方向
function getOrientation() {
  if (screen.orientation) {
    return screen.orientation.type;
  }
  // 回退方案
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

// 监听方向变化
if (screen.orientation) {
  screen.orientation.addEventListener('change', () => {
    console.log('方向变化:', screen.orientation.type);
    handleOrientationChange(screen.orientation.type);
  });
} else {
  // 回退到 resize 事件
  window.addEventListener('resize', () => {
    const orientation = getOrientation();
    handleOrientationChange(orientation);
  });
}

// 锁定屏幕方向（需要全屏）
async function lockOrientation(orientation) {
  try {
    await screen.orientation.lock(orientation);
    // 'portrait', 'landscape', 'portrait-primary', 等
  } catch (error) {
    console.error('锁定方向失败:', error);
  }
}

// 解锁方向
function unlockOrientation() {
  screen.orientation.unlock();
}
```

### Window Management API

```javascript
// 获取所有屏幕信息（多显示器）
async function getScreenDetails() {
  if ('getScreenDetails' in window) {
    try {
      const screenDetails = await window.getScreenDetails();

      console.log('屏幕数量:', screenDetails.screens.length);

      screenDetails.screens.forEach((screen, index) => {
        console.log(`屏幕 ${index + 1}:`, {
          width: screen.width,
          height: screen.height,
          left: screen.left,
          top: screen.top,
          isPrimary: screen.isPrimary,
          label: screen.label
        });
      });

      // 当前屏幕
      console.log('当前屏幕:', screenDetails.currentScreen);

      return screenDetails;
    } catch (error) {
      console.error('获取屏幕信息失败:', error);
    }
  }
  return null;
}

// 监听屏幕变化
async function watchScreenChanges() {
  const screenDetails = await getScreenDetails();

  if (screenDetails) {
    screenDetails.addEventListener('screenschange', () => {
      console.log('屏幕配置变化');
    });

    screenDetails.addEventListener('currentscreenchange', () => {
      console.log('当前屏幕变化');
    });
  }
}
```

## 实际应用场景

### 视频播放器

```javascript
class VideoPlayer {
  constructor(container) {
    this.container = container;
    this.video = container.querySelector('video');
    this.fullscreenBtn = container.querySelector('.fullscreen-btn');

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

    // 全屏变化时更新 UI
    onFullscreenChange(() => {
      this.updateFullscreenButton();
    });

    // 页面隐藏时暂停
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !this.video.paused) {
        this.video.pause();
        this.wasPlaying = true;
      } else if (!document.hidden && this.wasPlaying) {
        this.video.play();
        this.wasPlaying = false;
      }
    });

    // ESC 键退出全屏
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isFullscreen()) {
        exitFullscreen();
      }
    });
  }

  async toggleFullscreen() {
    if (isFullscreen()) {
      await exitFullscreen();
    } else {
      await enterFullscreen(this.container);
    }
  }

  updateFullscreenButton() {
    const icon = isFullscreen() ? 'exit-fullscreen' : 'enter-fullscreen';
    this.fullscreenBtn.querySelector('.icon').className = `icon ${icon}`;
  }
}
```

### 游戏全屏

```javascript
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.isRunning = false;
  }

  async start() {
    // 请求全屏
    await enterFullscreen(this.canvas);

    // 锁定方向为横屏
    try {
      await screen.orientation.lock('landscape');
    } catch {}

    // 开始游戏循环
    this.isRunning = true;
    this.gameLoop();
  }

  gameLoop() {
    if (!this.isRunning) return;

    // 更新游戏状态
    this.update();

    // 渲染
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  pause() {
    this.isRunning = false;
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.gameLoop();
    }
  }
}

// 页面可见性控制
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.pause();
  } else {
    game.resume();
  }
});

// 全屏变化处理
onFullscreenChange(() => {
  if (!isFullscreen()) {
    game.pause();
    showPauseMenu();
  }
});
```

### 演示模式

```javascript
class Presentation {
  constructor(slides) {
    this.slides = slides;
    this.currentIndex = 0;
    this.container = document.querySelector('.presentation');
  }

  async start() {
    // 进入全屏
    await enterFullscreen(this.container);

    // 隐藏鼠标
    this.container.style.cursor = 'none';

    // 键盘导航
    this.handleKeyboard();

    // 显示第一张幻灯片
    this.showSlide(0);
  }

  handleKeyboard() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Space':
          this.next();
          break;
        case 'ArrowLeft':
          this.prev();
          break;
        case 'Escape':
          this.exit();
          break;
        case 'f':
          if (!isFullscreen()) {
            enterFullscreen(this.container);
          }
          break;
      }
    });
  }

  next() {
    if (this.currentIndex < this.slides.length - 1) {
      this.showSlide(this.currentIndex + 1);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.showSlide(this.currentIndex - 1);
    }
  }

  showSlide(index) {
    this.currentIndex = index;
    // 更新显示
    this.slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
  }

  exit() {
    exitFullscreen();
    this.container.style.cursor = 'auto';
  }
}
```

### 响应式布局检测

```javascript
// 综合获取视口信息
function getViewportInfo() {
  return {
    // 视口尺寸
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,

    // 文档尺寸
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,

    // 屏幕尺寸
    screenWidth: screen.width,
    screenHeight: screen.height,

    // 设备像素比
    devicePixelRatio: window.devicePixelRatio,

    // 方向
    orientation: getOrientation(),

    // 是否全屏
    isFullscreen: isFullscreen(),

    // 是否可见
    isVisible: !document.hidden
  };
}

// 监听所有变化
function watchViewportChanges(callback) {
  // 尺寸变化
  window.addEventListener('resize', () => callback(getViewportInfo()));

  // 方向变化
  if (screen.orientation) {
    screen.orientation.addEventListener('change', () => callback(getViewportInfo()));
  }

  // 全屏变化
  onFullscreenChange(() => callback(getViewportInfo()));

  // 可见性变化
  document.addEventListener('visibilitychange', () => callback(getViewportInfo()));
}
```

## 最佳实践总结

```
全屏与屏幕 API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Fullscreen API                                    │
│   ├── 必须由用户手势触发                           │
│   ├── 处理浏览器前缀兼容                           │
│   ├── 提供明显的退出方式                           │
│   └── 监听 fullscreenchange 更新 UI                │
│                                                     │
│   Page Visibility API                               │
│   ├── 页面隐藏时暂停非必要操作                     │
│   ├── 减少后台资源消耗                             │
│   └── 恢复时同步最新状态                           │
│                                                     │
│   Screen API                                        │
│   ├── 考虑多显示器场景                             │
│   ├── 响应方向变化                                 │
│   └── 适配不同像素密度                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| API | 用途 | 示例场景 |
|-----|------|----------|
| Fullscreen | 全屏显示 | 视频、游戏、演示 |
| Page Visibility | 检测页面可见性 | 暂停动画、减少轮询 |
| Screen | 获取屏幕信息 | 响应式布局、多显示器 |
| Screen Orientation | 方向控制 | 游戏、视频播放器 |

---

*掌握全屏和屏幕 API，提升 Web 应用的沉浸体验。*
