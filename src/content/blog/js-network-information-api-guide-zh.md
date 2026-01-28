---
title: 'JavaScript Network Information API 完全指南'
description: '掌握网络状态检测：连接类型识别、带宽估算、自适应加载与离线处理策略'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'js-network-information-api-guide'
---

Network Information API 允许网页获取设备的网络连接信息。本文详解其使用方法和实战应用。

## 基础概念

### 检测支持

```javascript
// 检查 API 支持
if ('connection' in navigator) {
  console.log('Network Information API 受支持');
  const connection = navigator.connection;
  console.log(connection);
} else {
  console.log('Network Information API 不受支持');
}

// 兼容性处理
const connection = navigator.connection || 
                   navigator.mozConnection || 
                   navigator.webkitConnection;
```

### 连接属性

```javascript
const connection = navigator.connection;

if (connection) {
  // 有效连接类型：slow-2g, 2g, 3g, 4g
  console.log('有效类型:', connection.effectiveType);
  
  // 实际连接类型：bluetooth, cellular, ethernet, wifi, wimax, other, unknown
  console.log('连接类型:', connection.type);
  
  // 下行带宽估算（Mbps）
  console.log('下行带宽:', connection.downlink, 'Mbps');
  
  // 往返时间估算（毫秒）
  console.log('RTT:', connection.rtt, 'ms');
  
  // 是否启用数据节省模式
  console.log('数据节省:', connection.saveData);
  
  // 下行最大速度（Mbps）
  console.log('最大下行:', connection.downlinkMax, 'Mbps');
}
```

### 监听变化

```javascript
const connection = navigator.connection;

if (connection) {
  connection.addEventListener('change', () => {
    console.log('网络状态变化:');
    console.log('  类型:', connection.effectiveType);
    console.log('  带宽:', connection.downlink, 'Mbps');
    console.log('  RTT:', connection.rtt, 'ms');
  });
}
```

## 网络管理器

### 封装类

```javascript
class NetworkManager {
  constructor() {
    this.connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection;
    this.listeners = new Set();
    this.isOnline = navigator.onLine;
    
    this.init();
  }
  
  init() {
    // 监听网络状态变化
    if (this.connection) {
      this.connection.addEventListener('change', () => {
        this.notify('connectionChange', this.getStatus());
      });
    }
    
    // 监听在线/离线状态
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notify('online', this.getStatus());
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notify('offline', this.getStatus());
    });
  }
  
  get isSupported() {
    return !!this.connection;
  }
  
  getStatus() {
    if (!this.connection) {
      return {
        isOnline: this.isOnline,
        effectiveType: 'unknown',
        type: 'unknown',
        downlink: null,
        rtt: null,
        saveData: false
      };
    }
    
    return {
      isOnline: this.isOnline,
      effectiveType: this.connection.effectiveType,
      type: this.connection.type,
      downlink: this.connection.downlink,
      rtt: this.connection.rtt,
      saveData: this.connection.saveData,
      downlinkMax: this.connection.downlinkMax
    };
  }
  
  // 判断是否为快速连接
  isFastConnection() {
    if (!this.connection) return true; // 默认假设快速
    
    const { effectiveType, downlink } = this.connection;
    return effectiveType === '4g' && downlink >= 5;
  }
  
  // 判断是否为慢速连接
  isSlowConnection() {
    if (!this.connection) return false;
    
    const { effectiveType } = this.connection;
    return effectiveType === 'slow-2g' || effectiveType === '2g';
  }
  
  // 判断是否应节省数据
  shouldSaveData() {
    if (!this.connection) return false;
    return this.connection.saveData || this.isSlowConnection();
  }
  
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notify(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }
}

// 使用
const network = new NetworkManager();

console.log('当前网络状态:', network.getStatus());

network.onChange((event, status) => {
  console.log('网络事件:', event);
  console.log('状态:', status);
});
```

### 连接质量评估

```javascript
class ConnectionQuality {
  constructor() {
    this.network = new NetworkManager();
  }
  
  // 获取质量等级：excellent, good, fair, poor
  getQuality() {
    const status = this.network.getStatus();
    
    if (!status.isOnline) return 'offline';
    
    const { effectiveType, downlink, rtt } = status;
    
    // 基于多个因素评估
    if (effectiveType === '4g' && downlink >= 10 && rtt < 50) {
      return 'excellent';
    }
    
    if (effectiveType === '4g' && downlink >= 5) {
      return 'good';
    }
    
    if (effectiveType === '3g' || (effectiveType === '4g' && downlink < 5)) {
      return 'fair';
    }
    
    return 'poor';
  }
  
  // 获取推荐的媒体质量
  getRecommendedMediaQuality() {
    const quality = this.getQuality();
    
    switch (quality) {
      case 'excellent':
        return { video: '1080p', image: 'high', prefetch: true };
      case 'good':
        return { video: '720p', image: 'medium', prefetch: true };
      case 'fair':
        return { video: '480p', image: 'low', prefetch: false };
      case 'poor':
        return { video: '360p', image: 'thumbnail', prefetch: false };
      default:
        return { video: 'none', image: 'placeholder', prefetch: false };
    }
  }
  
  // 获取推荐的请求策略
  getRequestStrategy() {
    const quality = this.getQuality();
    
    switch (quality) {
      case 'excellent':
        return {
          timeout: 5000,
          retries: 2,
          batchSize: 10,
          concurrent: 6
        };
      case 'good':
        return {
          timeout: 10000,
          retries: 3,
          batchSize: 5,
          concurrent: 4
        };
      case 'fair':
        return {
          timeout: 15000,
          retries: 4,
          batchSize: 3,
          concurrent: 2
        };
      case 'poor':
        return {
          timeout: 30000,
          retries: 5,
          batchSize: 1,
          concurrent: 1
        };
      default:
        return {
          timeout: 60000,
          retries: 10,
          batchSize: 1,
          concurrent: 1
        };
    }
  }
}

// 使用
const connectionQuality = new ConnectionQuality();

console.log('连接质量:', connectionQuality.getQuality());
console.log('推荐媒体质量:', connectionQuality.getRecommendedMediaQuality());
console.log('请求策略:', connectionQuality.getRequestStrategy());
```

## 实际应用

### 自适应图片加载

```javascript
class AdaptiveImageLoader {
  constructor() {
    this.network = new NetworkManager();
  }
  
  // 获取最佳图片 URL
  getOptimalImageUrl(baseUrl, sizes = {}) {
    const status = this.network.getStatus();
    
    // 默认尺寸配置
    const defaultSizes = {
      high: 'large',
      medium: 'medium',
      low: 'small',
      thumbnail: 'thumb'
    };
    
    const sizeSuffixes = { ...defaultSizes, ...sizes };
    
    // 根据网络状况选择
    if (!status.isOnline) {
      return null;
    }
    
    if (this.network.shouldSaveData()) {
      return this.buildUrl(baseUrl, sizeSuffixes.thumbnail);
    }
    
    switch (status.effectiveType) {
      case '4g':
        return this.buildUrl(baseUrl, sizeSuffixes.high);
      case '3g':
        return this.buildUrl(baseUrl, sizeSuffixes.medium);
      case '2g':
        return this.buildUrl(baseUrl, sizeSuffixes.low);
      default:
        return this.buildUrl(baseUrl, sizeSuffixes.thumbnail);
    }
  }
  
  buildUrl(baseUrl, size) {
    // 假设 URL 格式：/images/photo.jpg -> /images/photo-large.jpg
    const ext = baseUrl.substring(baseUrl.lastIndexOf('.'));
    const name = baseUrl.substring(0, baseUrl.lastIndexOf('.'));
    return `${name}-${size}${ext}`;
  }
  
  // 懒加载图片
  async loadImage(img, baseUrl) {
    const optimalUrl = this.getOptimalImageUrl(baseUrl);
    
    if (!optimalUrl) {
      img.src = '/images/placeholder.jpg';
      return;
    }
    
    return new Promise((resolve, reject) => {
      const tempImg = new Image();
      
      tempImg.onload = () => {
        img.src = optimalUrl;
        resolve(optimalUrl);
      };
      
      tempImg.onerror = () => {
        img.src = '/images/placeholder.jpg';
        reject(new Error('Failed to load image'));
      };
      
      tempImg.src = optimalUrl;
    });
  }
  
  // 批量处理页面上的图片
  async processImages(selector = 'img[data-src]') {
    const images = document.querySelectorAll(selector);
    
    for (const img of images) {
      const baseUrl = img.dataset.src;
      if (baseUrl) {
        await this.loadImage(img, baseUrl);
      }
    }
  }
}

// 使用
const imageLoader = new AdaptiveImageLoader();

// 处理所有懒加载图片
imageLoader.processImages();

// 单独加载图片
const img = document.getElementById('hero-image');
imageLoader.loadImage(img, '/images/hero.jpg');
```

### 视频质量自适应

```javascript
class AdaptiveVideoPlayer {
  constructor(videoElement) {
    this.video = videoElement;
    this.network = new NetworkManager();
    this.currentQuality = null;
    
    this.qualities = {
      '1080p': { width: 1920, bitrate: 5000 },
      '720p': { width: 1280, bitrate: 2500 },
      '480p': { width: 854, bitrate: 1000 },
      '360p': { width: 640, bitrate: 500 },
      '240p': { width: 426, bitrate: 250 }
    };
    
    this.init();
  }
  
  init() {
    this.network.onChange((event, status) => {
      if (event === 'connectionChange') {
        this.adjustQuality();
      }
    });
    
    // 初始质量调整
    this.adjustQuality();
  }
  
  adjustQuality() {
    const status = this.network.getStatus();
    const recommendedQuality = this.getRecommendedQuality(status);
    
    if (recommendedQuality !== this.currentQuality) {
      this.setQuality(recommendedQuality);
    }
  }
  
  getRecommendedQuality(status) {
    if (!status.isOnline) return '240p';
    
    const { downlink, effectiveType, saveData } = status;
    
    if (saveData) return '360p';
    
    // 基于带宽选择
    if (downlink >= 10 && effectiveType === '4g') {
      return '1080p';
    } else if (downlink >= 5) {
      return '720p';
    } else if (downlink >= 2) {
      return '480p';
    } else if (downlink >= 1) {
      return '360p';
    } else {
      return '240p';
    }
  }
  
  setQuality(quality) {
    const currentTime = this.video.currentTime;
    const wasPlaying = !this.video.paused;
    
    // 更新视频源
    const qualityConfig = this.qualities[quality];
    const newSrc = this.buildVideoUrl(quality);
    
    this.video.src = newSrc;
    this.video.currentTime = currentTime;
    this.currentQuality = quality;
    
    if (wasPlaying) {
      this.video.play();
    }
    
    this.onQualityChange(quality);
  }
  
  buildVideoUrl(quality) {
    const basePath = this.video.dataset.basePath || '';
    return `${basePath}/video-${quality}.mp4`;
  }
  
  onQualityChange(quality) {
    console.log('视频质量切换到:', quality);
    
    // 更新 UI
    const indicator = document.getElementById('quality-indicator');
    if (indicator) {
      indicator.textContent = quality;
    }
  }
  
  // 手动设置质量
  forceQuality(quality) {
    if (this.qualities[quality]) {
      this.setQuality(quality);
    }
  }
  
  // 获取当前质量
  getCurrentQuality() {
    return this.currentQuality;
  }
}

// 使用
const video = document.getElementById('main-video');
const player = new AdaptiveVideoPlayer(video);
```

### 智能预加载

```javascript
class SmartPrefetcher {
  constructor() {
    this.network = new NetworkManager();
    this.prefetchedUrls = new Set();
  }
  
  // 检查是否应该预加载
  shouldPrefetch() {
    const status = this.network.getStatus();
    
    if (!status.isOnline) return false;
    if (status.saveData) return false;
    if (this.network.isSlowConnection()) return false;
    
    return true;
  }
  
  // 预加载资源
  async prefetch(url) {
    if (!this.shouldPrefetch()) return false;
    if (this.prefetchedUrls.has(url)) return true;
    
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
      
      this.prefetchedUrls.add(url);
      return true;
    } catch (error) {
      console.error('预加载失败:', url, error);
      return false;
    }
  }
  
  // 预连接到域名
  preconnect(origin) {
    if (!this.shouldPrefetch()) return;
    
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    document.head.appendChild(link);
  }
  
  // 预加载多个资源
  async prefetchMultiple(urls) {
    if (!this.shouldPrefetch()) return [];
    
    const status = this.network.getStatus();
    
    // 根据网络状况限制并发
    const concurrentLimit = status.effectiveType === '4g' ? 5 : 2;
    const results = [];
    
    for (let i = 0; i < urls.length; i += concurrentLimit) {
      const batch = urls.slice(i, i + concurrentLimit);
      const batchResults = await Promise.all(
        batch.map(url => this.prefetch(url))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // 智能预加载下一页
  prefetchNextPage(links) {
    if (!this.shouldPrefetch()) return;
    
    // 根据网络质量决定预加载数量
    const status = this.network.getStatus();
    let count = 1;
    
    if (status.effectiveType === '4g' && status.downlink >= 10) {
      count = 3;
    } else if (status.effectiveType === '4g') {
      count = 2;
    }
    
    const urlsToFetch = links.slice(0, count);
    this.prefetchMultiple(urlsToFetch);
  }
}

// 使用
const prefetcher = new SmartPrefetcher();

// 预加载资源
prefetcher.prefetch('/api/data.json');

// 预加载多个资源
prefetcher.prefetchMultiple([
  '/images/hero.jpg',
  '/js/page-2.js',
  '/css/page-2.css'
]);

// 预加载链接
document.querySelectorAll('a[data-prefetch]').forEach(link => {
  link.addEventListener('mouseenter', () => {
    prefetcher.prefetch(link.href);
  });
});
```

### 离线感知应用

```javascript
class OfflineAwareApp {
  constructor() {
    this.network = new NetworkManager();
    this.pendingActions = [];
    this.isOffline = !navigator.onLine;
    
    this.init();
  }
  
  init() {
    this.network.onChange((event, status) => {
      if (event === 'online') {
        this.handleOnline();
      } else if (event === 'offline') {
        this.handleOffline();
      }
    });
  }
  
  handleOnline() {
    this.isOffline = false;
    console.log('网络恢复，处理待执行操作...');
    
    this.showNotification('网络已恢复', 'success');
    this.syncPendingActions();
  }
  
  handleOffline() {
    this.isOffline = true;
    console.log('网络断开');
    
    this.showNotification('网络已断开，操作将在恢复后同步', 'warning');
  }
  
  // 执行需要网络的操作
  async performAction(action, data) {
    if (this.isOffline) {
      // 离线时保存操作
      this.queueAction(action, data);
      return { queued: true, message: '操作已保存，将在网络恢复后执行' };
    }
    
    try {
      return await this.executeAction(action, data);
    } catch (error) {
      if (this.isNetworkError(error)) {
        this.queueAction(action, data);
        return { queued: true, message: '网络错误，操作已保存' };
      }
      throw error;
    }
  }
  
  queueAction(action, data) {
    const queuedAction = {
      id: Date.now(),
      action,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.pendingActions.push(queuedAction);
    this.savePendingActions();
    
    return queuedAction;
  }
  
  async syncPendingActions() {
    const actions = [...this.pendingActions];
    this.pendingActions = [];
    
    for (const item of actions) {
      try {
        await this.executeAction(item.action, item.data);
        console.log('同步成功:', item.action);
      } catch (error) {
        console.error('同步失败:', item.action, error);
        this.pendingActions.push(item);
      }
    }
    
    this.savePendingActions();
  }
  
  async executeAction(action, data) {
    // 实际的 API 调用
    const response = await fetch(`/api/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  }
  
  isNetworkError(error) {
    return error.name === 'TypeError' && error.message === 'Failed to fetch';
  }
  
  savePendingActions() {
    localStorage.setItem('pendingActions', JSON.stringify(this.pendingActions));
  }
  
  loadPendingActions() {
    try {
      const saved = localStorage.getItem('pendingActions');
      this.pendingActions = saved ? JSON.parse(saved) : [];
    } catch {
      this.pendingActions = [];
    }
  }
  
  showNotification(message, type) {
    // 显示通知 UI
    console.log(`[${type}] ${message}`);
  }
  
  getPendingCount() {
    return this.pendingActions.length;
  }
}

// 使用
const app = new OfflineAwareApp();
app.loadPendingActions();

// 执行操作
document.getElementById('save-btn').addEventListener('click', async () => {
  const result = await app.performAction('saveData', { content: 'test' });
  console.log('结果:', result);
});
```

## 最佳实践总结

```
Network Information API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   自适应加载                                        │
│   ├── 根据连接类型调整媒体质量                     │
│   ├── 慢速网络下使用占位图                         │
│   ├── 尊重用户的数据节省偏好                       │
│   └── 动态调整预加载策略                           │
│                                                     │
│   离线处理                                          │
│   ├── 监听在线/离线事件                            │
│   ├── 使用本地存储缓存数据                         │
│   ├── 实现操作队列和同步                           │
│   └── 提供清晰的状态反馈                           │
│                                                     │
│   性能优化                                          │
│   ├── 避免频繁检查网络状态                         │
│   ├── 使用事件监听而非轮询                         │
│   ├── 合理设置超时和重试策略                       │
│   └── 考虑 API 兼容性                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 连接类型 | 典型带宽 | 推荐策略 |
|----------|----------|----------|
| 4g | >10 Mbps | 高质量媒体，积极预加载 |
| 3g | 1-10 Mbps | 中等质量，适度预加载 |
| 2g | 50-250 Kbps | 低质量，禁用预加载 |
| slow-2g | <50 Kbps | 最低质量，纯文本优先 |

---

*善用 Network Information API，为用户提供最佳的网络体验。*
