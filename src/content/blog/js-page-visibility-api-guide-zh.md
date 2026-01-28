---
title: 'JavaScript Page Visibility API 完全指南'
description: '掌握页面可见性检测：标签页切换监听、性能优化、资源管理与用户体验提升'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'js-page-visibility-api-guide'
---

Page Visibility API 允许检测页面的可见性状态。本文详解其使用方法和实战应用。

## 基础概念

### 检测页面可见性

```javascript
// 检查当前可见性状态
console.log(document.visibilityState);
// 'visible' - 页面可见
// 'hidden' - 页面隐藏

// 检查页面是否隐藏
console.log(document.hidden);
// true - 隐藏
// false - 可见

// 获取可见性状态
function getVisibilityState() {
  return {
    state: document.visibilityState,
    hidden: document.hidden
  };
}
```

### 监听可见性变化

```javascript
// 基础监听
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('页面被隐藏');
  } else {
    console.log('页面可见');
  }
});

// 带时间戳的监听
let hiddenAt = null;

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    console.log('页面隐藏于:', new Date(hiddenAt).toLocaleTimeString());
  } else {
    if (hiddenAt) {
      const duration = Date.now() - hiddenAt;
      console.log('页面隐藏时长:', duration, 'ms');
      hiddenAt = null;
    }
    console.log('页面恢复可见');
  }
});
```

### 兼容性处理

```javascript
// 获取带前缀的属性名
function getVisibilityProps() {
  const prefixes = ['', 'webkit', 'moz', 'ms'];
  
  for (const prefix of prefixes) {
    const hiddenProp = prefix ? `${prefix}Hidden` : 'hidden';
    const stateProp = prefix ? `${prefix}VisibilityState` : 'visibilityState';
    const eventName = prefix ? `${prefix}visibilitychange` : 'visibilitychange';
    
    if (hiddenProp in document) {
      return {
        hidden: hiddenProp,
        state: stateProp,
        event: eventName
      };
    }
  }
  
  return null;
}

// 使用兼容性封装
const visibility = getVisibilityProps();

if (visibility) {
  document.addEventListener(visibility.event, () => {
    const isHidden = document[visibility.hidden];
    const state = document[visibility.state];
    console.log('可见性状态:', state, '隐藏:', isHidden);
  });
} else {
  console.warn('不支持 Page Visibility API');
}
```

## 可见性管理器

### 封装类

```javascript
class VisibilityManager {
  constructor() {
    this.listeners = new Set();
    this.hiddenAt = null;
    this.props = this.getVisibilityProps();
    
    if (this.props) {
      document.addEventListener(this.props.event, () => {
        this.handleVisibilityChange();
      });
    }
  }
  
  getVisibilityProps() {
    const prefixes = ['', 'webkit', 'moz', 'ms'];
    
    for (const prefix of prefixes) {
      const hidden = prefix ? `${prefix}Hidden` : 'hidden';
      if (hidden in document) {
        return {
          hidden,
          state: prefix ? `${prefix}VisibilityState` : 'visibilityState',
          event: prefix ? `${prefix}visibilitychange` : 'visibilitychange'
        };
      }
    }
    return null;
  }
  
  get supported() {
    return this.props !== null;
  }
  
  get isVisible() {
    if (!this.props) return true;
    return !document[this.props.hidden];
  }
  
  get isHidden() {
    return !this.isVisible;
  }
  
  get state() {
    if (!this.props) return 'visible';
    return document[this.props.state];
  }
  
  get hiddenDuration() {
    if (!this.hiddenAt) return 0;
    return Date.now() - this.hiddenAt;
  }
  
  handleVisibilityChange() {
    if (this.isHidden) {
      this.hiddenAt = Date.now();
    }
    
    const data = {
      visible: this.isVisible,
      hidden: this.isHidden,
      state: this.state,
      hiddenDuration: this.hiddenDuration
    };
    
    if (!this.isHidden) {
      this.hiddenAt = null;
    }
    
    this.notify(data);
  }
  
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  onVisible(callback) {
    return this.onChange((data) => {
      if (data.visible) callback(data);
    });
  }
  
  onHidden(callback) {
    return this.onChange((data) => {
      if (data.hidden) callback(data);
    });
  }
  
  notify(data) {
    this.listeners.forEach(callback => callback(data));
  }
}

// 使用
const visibility = new VisibilityManager();

visibility.onChange(({ visible, hiddenDuration }) => {
  if (visible) {
    console.log('欢迎回来！离开了', hiddenDuration, 'ms');
  } else {
    console.log('再见！');
  }
});
```

## 实际应用

### 视频播放控制

```javascript
class VisibilityAwareVideo {
  constructor(videoElement) {
    this.video = videoElement;
    this.wasPlaying = false;
    this.visibility = new VisibilityManager();
    
    this.visibility.onChange(({ visible }) => {
      if (visible) {
        this.onVisible();
      } else {
        this.onHidden();
      }
    });
  }
  
  onHidden() {
    // 保存播放状态并暂停
    this.wasPlaying = !this.video.paused;
    if (this.wasPlaying) {
      this.video.pause();
      console.log('页面隐藏，暂停视频');
    }
  }
  
  onVisible() {
    // 恢复播放
    if (this.wasPlaying) {
      this.video.play().catch(err => {
        console.log('自动播放被阻止:', err);
      });
      console.log('页面可见，恢复播放');
    }
  }
}

// 使用
const video = document.getElementById('video');
const visibilityVideo = new VisibilityAwareVideo(video);
```

### 音频播放控制

```javascript
class BackgroundAudioController {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.visibility = new VisibilityManager();
    this.userPaused = false;
    
    this.visibility.onChange(({ visible }) => {
      if (visible) {
        this.resume();
      } else {
        this.suspend();
      }
    });
  }
  
  suspend() {
    if (this.audioContext.state === 'running') {
      this.audioContext.suspend();
      console.log('音频已暂停');
    }
  }
  
  resume() {
    if (this.audioContext.state === 'suspended' && !this.userPaused) {
      this.audioContext.resume();
      console.log('音频已恢复');
    }
  }
  
  pause() {
    this.userPaused = true;
    this.suspend();
  }
  
  play() {
    this.userPaused = false;
    this.resume();
  }
}

// 使用
const audioContext = new AudioContext();
const audioController = new BackgroundAudioController(audioContext);
```

### 动画暂停

```javascript
class VisibilityAwareAnimation {
  constructor() {
    this.animations = new Set();
    this.visibility = new VisibilityManager();
    this.rafId = null;
    this.lastTime = 0;
    
    this.visibility.onChange(({ visible }) => {
      if (visible) {
        this.start();
      } else {
        this.stop();
      }
    });
  }
  
  add(animation) {
    this.animations.add(animation);
  }
  
  remove(animation) {
    this.animations.delete(animation);
  }
  
  start() {
    if (this.rafId) return;
    
    this.lastTime = performance.now();
    this.tick();
  }
  
  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  tick() {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;
    
    this.animations.forEach(animation => {
      animation.update(deltaTime);
    });
    
    this.rafId = requestAnimationFrame(() => this.tick());
  }
}

// 动画对象示例
class BouncingBall {
  constructor(element) {
    this.element = element;
    this.y = 0;
    this.velocity = 0;
    this.gravity = 0.001;
    this.bounce = 0.8;
  }
  
  update(deltaTime) {
    this.velocity += this.gravity * deltaTime;
    this.y += this.velocity * deltaTime;
    
    // 碰到底部反弹
    if (this.y > 300) {
      this.y = 300;
      this.velocity = -this.velocity * this.bounce;
    }
    
    this.element.style.transform = `translateY(${this.y}px)`;
  }
}

// 使用
const animator = new VisibilityAwareAnimation();
const ball = new BouncingBall(document.getElementById('ball'));
animator.add(ball);
animator.start();
```

### 轮询暂停

```javascript
class SmartPolling {
  constructor(options) {
    this.url = options.url;
    this.interval = options.interval || 5000;
    this.onData = options.onData || (() => {});
    this.onError = options.onError || console.error;
    
    this.visibility = new VisibilityManager();
    this.timerId = null;
    this.isPolling = false;
    this.missedPolls = 0;
    
    this.visibility.onChange(({ visible }) => {
      if (visible) {
        this.handleVisible();
      } else {
        this.handleHidden();
      }
    });
  }
  
  start() {
    this.isPolling = true;
    this.poll();
  }
  
  stop() {
    this.isPolling = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
  
  handleHidden() {
    // 停止轮询，开始计数错过的轮询
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.missedPolls = 0;
    
    // 用低频率在后台继续轮询（可选）
    this.startBackgroundPolling();
  }
  
  handleVisible() {
    // 清除后台轮询
    this.stopBackgroundPolling();
    
    // 如果错过了轮询，立即获取新数据
    if (this.missedPolls > 0) {
      console.log(`错过了 ${this.missedPolls} 次轮询，立即获取数据`);
      this.poll();
    } else {
      this.scheduleNext();
    }
  }
  
  startBackgroundPolling() {
    // 后台以更低频率轮询
    const backgroundInterval = this.interval * 3;
    this.backgroundTimer = setInterval(() => {
      this.missedPolls++;
    }, backgroundInterval);
  }
  
  stopBackgroundPolling() {
    if (this.backgroundTimer) {
      clearInterval(this.backgroundTimer);
      this.backgroundTimer = null;
    }
  }
  
  async poll() {
    if (!this.isPolling) return;
    
    try {
      const response = await fetch(this.url);
      const data = await response.json();
      this.onData(data);
      this.missedPolls = 0;
    } catch (error) {
      this.onError(error);
    }
    
    this.scheduleNext();
  }
  
  scheduleNext() {
    if (!this.isPolling || this.visibility.isHidden) return;
    
    this.timerId = setTimeout(() => {
      this.poll();
    }, this.interval);
  }
}

// 使用
const polling = new SmartPolling({
  url: '/api/notifications',
  interval: 10000,
  onData: (data) => {
    console.log('新数据:', data);
  }
});

polling.start();
```

### WebSocket 连接管理

```javascript
class VisibilityAwareWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.ws = null;
    this.visibility = new VisibilityManager();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.messageQueue = [];
    this.handlers = new Map();
    
    this.visibility.onChange(({ visible }) => {
      if (visible) {
        this.onVisible();
      } else {
        this.onHidden();
      }
    });
  }
  
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('WebSocket 已连接');
      this.reconnectAttempts = 0;
      this.flushQueue();
      this.emit('open');
    };
    
    this.ws.onmessage = (event) => {
      this.emit('message', JSON.parse(event.data));
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket 已断开');
      this.emit('close', event);
      
      if (this.visibility.isVisible) {
        this.tryReconnect();
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      this.emit('error', error);
    };
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  onVisible() {
    // 页面可见时重新连接
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('页面可见，重新连接 WebSocket');
      this.connect();
    }
  }
  
  onHidden() {
    // 页面隐藏时可选择断开连接
    if (this.options.disconnectOnHidden) {
      console.log('页面隐藏，断开 WebSocket');
      this.disconnect();
    }
  }
  
  tryReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('达到最大重连次数');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`${delay}ms 后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  send(data) {
    const message = JSON.stringify(data);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // 页面隐藏时消息入队
      this.messageQueue.push(message);
    }
  }
  
  flushQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }
  
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(handler);
    return () => this.handlers.get(event).delete(handler);
  }
  
  emit(event, data) {
    this.handlers.get(event)?.forEach(handler => handler(data));
  }
}

// 使用
const ws = new VisibilityAwareWebSocket('wss://api.example.com/socket', {
  disconnectOnHidden: false,
  maxReconnectAttempts: 10
});

ws.on('message', (data) => {
  console.log('收到消息:', data);
});

ws.connect();
```

### 页面分析

```javascript
class VisibilityAnalytics {
  constructor() {
    this.visibility = new VisibilityManager();
    this.sessions = [];
    this.currentSession = null;
    
    this.startSession();
    
    this.visibility.onChange(({ visible }) => {
      if (visible) {
        this.startSession();
      } else {
        this.endSession();
      }
    });
    
    // 页面关闭时发送数据
    window.addEventListener('beforeunload', () => {
      this.endSession();
      this.sendAnalytics();
    });
  }
  
  startSession() {
    if (this.currentSession) return;
    
    this.currentSession = {
      startTime: Date.now(),
      endTime: null,
      duration: 0
    };
  }
  
  endSession() {
    if (!this.currentSession) return;
    
    this.currentSession.endTime = Date.now();
    this.currentSession.duration = 
      this.currentSession.endTime - this.currentSession.startTime;
    
    this.sessions.push(this.currentSession);
    this.currentSession = null;
  }
  
  getTotalVisibleTime() {
    let total = this.sessions.reduce((sum, s) => sum + s.duration, 0);
    
    if (this.currentSession) {
      total += Date.now() - this.currentSession.startTime;
    }
    
    return total;
  }
  
  getSessionCount() {
    return this.sessions.length + (this.currentSession ? 1 : 0);
  }
  
  getAnalytics() {
    return {
      totalVisibleTime: this.getTotalVisibleTime(),
      sessionCount: this.getSessionCount(),
      averageSessionDuration: this.getTotalVisibleTime() / this.getSessionCount(),
      sessions: [...this.sessions]
    };
  }
  
  sendAnalytics() {
    const data = this.getAnalytics();
    
    // 使用 sendBeacon 确保数据发送
    navigator.sendBeacon('/api/analytics', JSON.stringify(data));
  }
}

// 使用
const analytics = new VisibilityAnalytics();

// 获取分析数据
setInterval(() => {
  console.log('页面可见时长:', analytics.getTotalVisibleTime(), 'ms');
  console.log('会话次数:', analytics.getSessionCount());
}, 10000);
```

## 最佳实践总结

```
Page Visibility API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   性能优化                                          │
│   ├── 暂停不可见时的动画                           │
│   ├── 停止后台轮询请求                             │
│   ├── 暂停视频/音频播放                            │
│   └── 降低定时器频率                               │
│                                                     │
│   资源管理                                          │
│   ├── 管理 WebSocket 连接                          │
│   ├── 暂停非必要的网络请求                         │
│   ├── 释放不需要的内存                             │
│   └── 保存用户状态                                 │
│                                                     │
│   用户体验                                          │
│   ├── 恢复时同步最新数据                           │
│   ├── 显示离开时长提示                             │
│   ├── 保持状态一致性                               │
│   └── 平滑恢复动画                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 状态 | 说明 | 应用场景 |
|------|------|----------|
| visible | 页面可见 | 正常运行 |
| hidden | 页面隐藏 | 暂停非必要操作 |

---

*善用 Page Visibility API，优化页面性能，提升用户体验。*
