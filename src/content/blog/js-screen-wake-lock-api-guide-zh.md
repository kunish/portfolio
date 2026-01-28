---
title: 'JavaScript Screen Wake Lock API 完全指南'
description: '掌握屏幕唤醒锁：防止屏幕休眠、阅读模式、视频播放与导航应用开发'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'js-screen-wake-lock-api-guide'
---

Screen Wake Lock API 允许网页阻止设备屏幕进入休眠状态。本文详解其使用方法和实战应用。

## 基础概念

### 检测支持

```javascript
// 检查 API 支持
if ('wakeLock' in navigator) {
  console.log('Screen Wake Lock API 受支持');
} else {
  console.log('Screen Wake Lock API 不受支持');
}
```

### 请求唤醒锁

```javascript
// 请求屏幕唤醒锁
async function requestWakeLock() {
  try {
    const wakeLock = await navigator.wakeLock.request('screen');
    console.log('唤醒锁已激活');
    return wakeLock;
  } catch (error) {
    console.error('无法激活唤醒锁:', error.message);
    return null;
  }
}

// 使用示例
let wakeLock = null;

document.getElementById('start-btn').addEventListener('click', async () => {
  wakeLock = await requestWakeLock();
});
```

### 释放唤醒锁

```javascript
// 释放唤醒锁
async function releaseWakeLock(wakeLock) {
  if (wakeLock) {
    await wakeLock.release();
    console.log('唤醒锁已释放');
  }
}

// 使用示例
document.getElementById('stop-btn').addEventListener('click', async () => {
  await releaseWakeLock(wakeLock);
  wakeLock = null;
});
```

### 监听释放事件

```javascript
async function requestWakeLock() {
  try {
    const wakeLock = await navigator.wakeLock.request('screen');
    
    // 监听释放事件
    wakeLock.addEventListener('release', () => {
      console.log('唤醒锁被释放');
      // 可能是因为：
      // 1. 调用了 release()
      // 2. 页面变为不可见
      // 3. 设备电量低
    });
    
    console.log('唤醒锁已激活');
    return wakeLock;
  } catch (error) {
    console.error('无法激活唤醒锁:', error);
    return null;
  }
}
```

## 唤醒锁管理器

### 封装类

```javascript
class WakeLockManager {
  constructor() {
    this.wakeLock = null;
    this.isSupported = 'wakeLock' in navigator;
    this.listeners = new Set();
    
    // 页面可见性变化时自动重新获取
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  }
  
  get isActive() {
    return this.wakeLock !== null && !this.wakeLock.released;
  }
  
  async request() {
    if (!this.isSupported) {
      console.warn('不支持 Screen Wake Lock API');
      return false;
    }
    
    if (this.isActive) {
      console.log('唤醒锁已经激活');
      return true;
    }
    
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      
      this.wakeLock.addEventListener('release', () => {
        this.notify('release');
      });
      
      this.notify('acquire');
      console.log('唤醒锁已激活');
      return true;
    } catch (error) {
      console.error('请求唤醒锁失败:', error);
      this.notify('error', error);
      return false;
    }
  }
  
  async release() {
    if (!this.isActive) return;
    
    try {
      await this.wakeLock.release();
      this.wakeLock = null;
      console.log('唤醒锁已释放');
    } catch (error) {
      console.error('释放唤醒锁失败:', error);
    }
  }
  
  async handleVisibilityChange() {
    if (document.visibilityState === 'visible' && this.wakeLock?.released) {
      // 页面重新可见时，重新请求唤醒锁
      console.log('页面可见，重新请求唤醒锁');
      await this.request();
    }
  }
  
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notify(event, data = null) {
    this.listeners.forEach(callback => callback(event, data));
  }
}

// 使用
const wakeLockManager = new WakeLockManager();

wakeLockManager.onChange((event, data) => {
  switch (event) {
    case 'acquire':
      console.log('唤醒锁已获取');
      break;
    case 'release':
      console.log('唤醒锁已释放');
      break;
    case 'error':
      console.error('唤醒锁错误:', data);
      break;
  }
});

// 请求唤醒锁
wakeLockManager.request();
```

### 自动管理唤醒锁

```javascript
class AutoWakeLock {
  constructor(options = {}) {
    this.manager = new WakeLockManager();
    this.autoReacquire = options.autoReacquire !== false;
    this.shouldBeActive = false;
    
    if (this.autoReacquire) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.shouldBeActive) {
          this.manager.request();
        }
      });
    }
  }
  
  async enable() {
    this.shouldBeActive = true;
    return await this.manager.request();
  }
  
  async disable() {
    this.shouldBeActive = false;
    return await this.manager.release();
  }
  
  get isActive() {
    return this.manager.isActive;
  }
  
  get isSupported() {
    return this.manager.isSupported;
  }
}

// 使用
const autoWakeLock = new AutoWakeLock({ autoReacquire: true });

// 启用（会自动在页面重新可见时重新获取）
autoWakeLock.enable();

// 禁用
// autoWakeLock.disable();
```

## 实际应用

### 阅读模式

```javascript
class ReadingMode {
  constructor() {
    this.wakeLock = new AutoWakeLock();
    this.isEnabled = false;
    this.scrollPosition = 0;
  }
  
  async enable() {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    await this.wakeLock.enable();
    
    // 保存滚动位置
    this.scrollPosition = window.scrollY;
    
    // 应用阅读模式样式
    document.body.classList.add('reading-mode');
    
    // 隐藏不必要的元素
    this.hideElements();
    
    console.log('阅读模式已启用');
  }
  
  async disable() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    await this.wakeLock.disable();
    
    // 移除阅读模式样式
    document.body.classList.remove('reading-mode');
    
    // 恢复元素
    this.showElements();
    
    console.log('阅读模式已禁用');
  }
  
  hideElements() {
    document.querySelectorAll('.hide-in-reading').forEach(el => {
      el.dataset.originalDisplay = el.style.display;
      el.style.display = 'none';
    });
  }
  
  showElements() {
    document.querySelectorAll('.hide-in-reading').forEach(el => {
      el.style.display = el.dataset.originalDisplay || '';
    });
  }
  
  toggle() {
    if (this.isEnabled) {
      return this.disable();
    }
    return this.enable();
  }
}

// 使用
const readingMode = new ReadingMode();

document.getElementById('reading-mode-btn').addEventListener('click', () => {
  readingMode.toggle();
});
```

### 视频播放器

```javascript
class VideoPlayerWithWakeLock {
  constructor(videoElement) {
    this.video = videoElement;
    this.wakeLock = new AutoWakeLock();
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // 播放时激活唤醒锁
    this.video.addEventListener('play', () => {
      this.enableWakeLock();
    });
    
    // 暂停或结束时释放
    this.video.addEventListener('pause', () => {
      this.disableWakeLock();
    });
    
    this.video.addEventListener('ended', () => {
      this.disableWakeLock();
    });
    
    // 全屏时确保唤醒锁激活
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement && !this.video.paused) {
        this.enableWakeLock();
      }
    });
  }
  
  async enableWakeLock() {
    const success = await this.wakeLock.enable();
    if (success) {
      console.log('视频播放中，屏幕将保持唤醒');
    }
  }
  
  async disableWakeLock() {
    await this.wakeLock.disable();
    console.log('视频暂停/结束，屏幕可以休眠');
  }
}

// 使用
const video = document.getElementById('video');
const player = new VideoPlayerWithWakeLock(video);
```

### 导航应用

```javascript
class NavigationApp {
  constructor() {
    this.wakeLock = new AutoWakeLock();
    this.isNavigating = false;
    this.route = null;
  }
  
  async startNavigation(route) {
    this.route = route;
    this.isNavigating = true;
    
    // 启用唤醒锁
    await this.wakeLock.enable();
    
    // 开始位置追踪
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.updatePosition(position);
      },
      (error) => {
        console.error('位置错误:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0
      }
    );
    
    console.log('导航已开始，屏幕将保持唤醒');
  }
  
  async stopNavigation() {
    this.isNavigating = false;
    this.route = null;
    
    // 停止位置追踪
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    // 释放唤醒锁
    await this.wakeLock.disable();
    
    console.log('导航已结束');
  }
  
  updatePosition(position) {
    if (!this.isNavigating) return;
    
    const { latitude, longitude } = position.coords;
    
    // 更新地图位置
    this.updateMap(latitude, longitude);
    
    // 检查是否到达目的地
    if (this.hasArrived(latitude, longitude)) {
      this.onArrival();
    }
  }
  
  updateMap(lat, lng) {
    // 更新地图显示
    console.log('当前位置:', lat, lng);
  }
  
  hasArrived(lat, lng) {
    if (!this.route?.destination) return false;
    
    const distance = this.calculateDistance(
      lat, lng,
      this.route.destination.lat,
      this.route.destination.lng
    );
    
    return distance < 50; // 50 米内视为到达
  }
  
  onArrival() {
    console.log('已到达目的地！');
    this.stopNavigation();
    
    // 播放提示音
    this.playArrivalSound();
  }
  
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }
  
  playArrivalSound() {
    // 播放到达提示音
  }
}

// 使用
const navigation = new NavigationApp();

// 开始导航
navigation.startNavigation({
  destination: { lat: 39.9042, lng: 116.4074 }
});
```

### 演示模式

```javascript
class PresentationMode {
  constructor() {
    this.wakeLock = new AutoWakeLock();
    this.fullscreen = null;
    this.isPresenting = false;
  }
  
  async start(element) {
    if (this.isPresenting) return;
    
    this.isPresenting = true;
    
    // 激活唤醒锁
    await this.wakeLock.enable();
    
    // 进入全屏
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    }
    
    // 隐藏鼠标光标
    document.body.style.cursor = 'none';
    
    // 监听全屏退出
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        this.stop();
      }
    });
    
    console.log('演示模式已启动');
  }
  
  async stop() {
    if (!this.isPresenting) return;
    
    this.isPresenting = false;
    
    // 释放唤醒锁
    await this.wakeLock.disable();
    
    // 退出全屏
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    
    // 恢复鼠标光标
    document.body.style.cursor = '';
    
    console.log('演示模式已结束');
  }
}

// 使用
const presentation = new PresentationMode();

document.getElementById('present-btn').addEventListener('click', () => {
  presentation.start(document.getElementById('slides'));
});
```

### 计时器应用

```javascript
class TimerWithWakeLock {
  constructor() {
    this.wakeLock = new AutoWakeLock();
    this.timerId = null;
    this.remainingSeconds = 0;
    this.onTick = null;
    this.onComplete = null;
  }
  
  async start(seconds) {
    if (this.timerId) {
      this.stop();
    }
    
    this.remainingSeconds = seconds;
    
    // 激活唤醒锁
    await this.wakeLock.enable();
    
    this.timerId = setInterval(() => {
      this.tick();
    }, 1000);
    
    console.log('计时器已启动，屏幕将保持唤醒');
  }
  
  tick() {
    this.remainingSeconds--;
    
    this.onTick?.(this.remainingSeconds, this.formatTime(this.remainingSeconds));
    
    if (this.remainingSeconds <= 0) {
      this.complete();
    }
  }
  
  async complete() {
    this.stop();
    
    // 释放唤醒锁
    await this.wakeLock.disable();
    
    // 播放提示音
    this.playAlarm();
    
    this.onComplete?.();
  }
  
  async stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    
    await this.wakeLock.disable();
  }
  
  pause() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
  
  async resume() {
    if (this.remainingSeconds > 0 && !this.timerId) {
      await this.wakeLock.enable();
      
      this.timerId = setInterval(() => {
        this.tick();
      }, 1000);
    }
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  
  playAlarm() {
    // 播放闹钟声音
    const audio = new Audio('/sounds/alarm.mp3');
    audio.play();
  }
}

// 使用
const timer = new TimerWithWakeLock();

timer.onTick = (remaining, formatted) => {
  document.getElementById('timer-display').textContent = formatted;
};

timer.onComplete = () => {
  alert('时间到！');
};

// 启动 5 分钟倒计时
timer.start(300);
```

## 最佳实践总结

```
Screen Wake Lock API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   使用场景                                          │
│   ├── 视频/音频播放                                │
│   ├── 导航应用                                     │
│   ├── 阅读模式                                     │
│   ├── 计时器/闹钟                                  │
│   └── 演示/幻灯片                                  │
│                                                     │
│   电量管理                                          │
│   ├── 只在需要时请求唤醒锁                         │
│   ├── 不再需要时立即释放                           │
│   ├── 监听释放事件处理异常情况                     │
│   └── 页面隐藏时自动释放                           │
│                                                     │
│   用户体验                                          │
│   ├── 告知用户屏幕保持唤醒                         │
│   ├── 提供手动控制选项                             │
│   ├── 页面可见时自动重新获取                       │
│   └── 降级处理不支持的浏览器                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 是否需要唤醒锁 |
|------|---------------|
| 视频播放 | 是 |
| 音乐播放（后台） | 否（音频本身就阻止休眠） |
| 阅读长文 | 是 |
| 地图导航 | 是 |
| 普通浏览 | 否 |

---

*善用 Screen Wake Lock API，在需要时保持屏幕唤醒。*
