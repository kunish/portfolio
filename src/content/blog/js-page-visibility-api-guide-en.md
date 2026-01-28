---
title: 'JavaScript Page Visibility API Complete Guide'
description: 'Master page visibility detection: tab switching, performance optimization, resource management, and user experience enhancement'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'js-page-visibility-api-guide'
---

The Page Visibility API allows detecting the visibility state of a page. This article covers its usage and practical applications.

## Basic Concepts

### Detecting Page Visibility

```javascript
// Check current visibility state
console.log(document.visibilityState);
// 'visible' - Page is visible
// 'hidden' - Page is hidden

// Check if page is hidden
console.log(document.hidden);
// true - Hidden
// false - Visible

// Get visibility state
function getVisibilityState() {
  return {
    state: document.visibilityState,
    hidden: document.hidden
  };
}
```

### Listening to Visibility Changes

```javascript
// Basic listener
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Page is hidden');
  } else {
    console.log('Page is visible');
  }
});

// Listener with timestamp
let hiddenAt = null;

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    console.log('Page hidden at:', new Date(hiddenAt).toLocaleTimeString());
  } else {
    if (hiddenAt) {
      const duration = Date.now() - hiddenAt;
      console.log('Hidden duration:', duration, 'ms');
      hiddenAt = null;
    }
    console.log('Page visible again');
  }
});
```

### Compatibility Handling

```javascript
// Get prefixed property names
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

// Using compatibility wrapper
const visibility = getVisibilityProps();

if (visibility) {
  document.addEventListener(visibility.event, () => {
    const isHidden = document[visibility.hidden];
    const state = document[visibility.state];
    console.log('Visibility state:', state, 'Hidden:', isHidden);
  });
} else {
  console.warn('Page Visibility API not supported');
}
```

## Visibility Manager

### Wrapper Class

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

// Usage
const visibility = new VisibilityManager();

visibility.onChange(({ visible, hiddenDuration }) => {
  if (visible) {
    console.log('Welcome back! You were away for', hiddenDuration, 'ms');
  } else {
    console.log('Goodbye!');
  }
});
```

## Practical Applications

### Video Playback Control

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
    // Save playback state and pause
    this.wasPlaying = !this.video.paused;
    if (this.wasPlaying) {
      this.video.pause();
      console.log('Page hidden, video paused');
    }
  }
  
  onVisible() {
    // Resume playback
    if (this.wasPlaying) {
      this.video.play().catch(err => {
        console.log('Autoplay blocked:', err);
      });
      console.log('Page visible, resuming video');
    }
  }
}

// Usage
const video = document.getElementById('video');
const visibilityVideo = new VisibilityAwareVideo(video);
```

### Audio Playback Control

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
      console.log('Audio suspended');
    }
  }
  
  resume() {
    if (this.audioContext.state === 'suspended' && !this.userPaused) {
      this.audioContext.resume();
      console.log('Audio resumed');
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

// Usage
const audioContext = new AudioContext();
const audioController = new BackgroundAudioController(audioContext);
```

### Animation Pausing

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

// Animation object example
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
    
    // Bounce at bottom
    if (this.y > 300) {
      this.y = 300;
      this.velocity = -this.velocity * this.bounce;
    }
    
    this.element.style.transform = `translateY(${this.y}px)`;
  }
}

// Usage
const animator = new VisibilityAwareAnimation();
const ball = new BouncingBall(document.getElementById('ball'));
animator.add(ball);
animator.start();
```

### Smart Polling

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
    // Stop polling, start counting missed polls
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.missedPolls = 0;
    
    // Optional: continue polling at lower frequency
    this.startBackgroundPolling();
  }
  
  handleVisible() {
    // Clear background polling
    this.stopBackgroundPolling();
    
    // If missed polls, fetch data immediately
    if (this.missedPolls > 0) {
      console.log(`Missed ${this.missedPolls} polls, fetching data now`);
      this.poll();
    } else {
      this.scheduleNext();
    }
  }
  
  startBackgroundPolling() {
    // Poll at lower frequency in background
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

// Usage
const polling = new SmartPolling({
  url: '/api/notifications',
  interval: 10000,
  onData: (data) => {
    console.log('New data:', data);
  }
});

polling.start();
```

### WebSocket Connection Management

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
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.flushQueue();
      this.emit('open');
    };
    
    this.ws.onmessage = (event) => {
      this.emit('message', JSON.parse(event.data));
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected');
      this.emit('close', event);
      
      if (this.visibility.isVisible) {
        this.tryReconnect();
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
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
    // Reconnect when page becomes visible
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('Page visible, reconnecting WebSocket');
      this.connect();
    }
  }
  
  onHidden() {
    // Optionally disconnect when hidden
    if (this.options.disconnectOnHidden) {
      console.log('Page hidden, disconnecting WebSocket');
      this.disconnect();
    }
  }
  
  tryReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Reconnecting in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  send(data) {
    const message = JSON.stringify(data);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // Queue messages when page is hidden
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

// Usage
const ws = new VisibilityAwareWebSocket('wss://api.example.com/socket', {
  disconnectOnHidden: false,
  maxReconnectAttempts: 10
});

ws.on('message', (data) => {
  console.log('Message received:', data);
});

ws.connect();
```

### Page Analytics

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
    
    // Send data on page unload
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
    
    // Use sendBeacon to ensure data is sent
    navigator.sendBeacon('/api/analytics', JSON.stringify(data));
  }
}

// Usage
const analytics = new VisibilityAnalytics();

// Get analytics data
setInterval(() => {
  console.log('Total visible time:', analytics.getTotalVisibleTime(), 'ms');
  console.log('Session count:', analytics.getSessionCount());
}, 10000);
```

## Best Practices Summary

```
Page Visibility API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Performance Optimization                          │
│   ├── Pause animations when not visible            │
│   ├── Stop background polling                      │
│   ├── Pause video/audio playback                   │
│   └── Reduce timer frequency                       │
│                                                     │
│   Resource Management                               │
│   ├── Manage WebSocket connections                 │
│   ├── Pause unnecessary network requests           │
│   ├── Release unneeded memory                      │
│   └── Save user state                              │
│                                                     │
│   User Experience                                   │
│   ├── Sync latest data on resume                   │
│   ├── Show time away notification                  │
│   ├── Maintain state consistency                   │
│   └── Smooth animation recovery                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| State | Description | Application |
|-------|-------------|-------------|
| visible | Page is visible | Normal operation |
| hidden | Page is hidden | Pause non-essential operations |

---

*Use the Page Visibility API wisely to optimize performance and enhance user experience.*
