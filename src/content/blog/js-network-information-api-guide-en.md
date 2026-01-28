---
title: 'JavaScript Network Information API Complete Guide'
description: 'Master network status detection: connection type identification, bandwidth estimation, adaptive loading, and offline handling strategies'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'js-network-information-api-guide'
---

The Network Information API allows web pages to access device network connection information. This article covers its usage and practical applications.

## Basic Concepts

### Detecting Support

```javascript
// Check API support
if ('connection' in navigator) {
  console.log('Network Information API is supported');
  const connection = navigator.connection;
  console.log(connection);
} else {
  console.log('Network Information API is not supported');
}

// Compatibility handling
const connection = navigator.connection || 
                   navigator.mozConnection || 
                   navigator.webkitConnection;
```

### Connection Properties

```javascript
const connection = navigator.connection;

if (connection) {
  // Effective connection type: slow-2g, 2g, 3g, 4g
  console.log('Effective type:', connection.effectiveType);
  
  // Actual connection type: bluetooth, cellular, ethernet, wifi, wimax, other, unknown
  console.log('Connection type:', connection.type);
  
  // Downlink bandwidth estimate (Mbps)
  console.log('Downlink:', connection.downlink, 'Mbps');
  
  // Round-trip time estimate (milliseconds)
  console.log('RTT:', connection.rtt, 'ms');
  
  // Whether data saver mode is enabled
  console.log('Save data:', connection.saveData);
  
  // Maximum downlink speed (Mbps)
  console.log('Max downlink:', connection.downlinkMax, 'Mbps');
}
```

### Listening to Changes

```javascript
const connection = navigator.connection;

if (connection) {
  connection.addEventListener('change', () => {
    console.log('Network status changed:');
    console.log('  Type:', connection.effectiveType);
    console.log('  Bandwidth:', connection.downlink, 'Mbps');
    console.log('  RTT:', connection.rtt, 'ms');
  });
}
```

## Network Manager

### Wrapper Class

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
    // Listen for network status changes
    if (this.connection) {
      this.connection.addEventListener('change', () => {
        this.notify('connectionChange', this.getStatus());
      });
    }
    
    // Listen for online/offline status
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
  
  // Check if connection is fast
  isFastConnection() {
    if (!this.connection) return true; // Assume fast by default
    
    const { effectiveType, downlink } = this.connection;
    return effectiveType === '4g' && downlink >= 5;
  }
  
  // Check if connection is slow
  isSlowConnection() {
    if (!this.connection) return false;
    
    const { effectiveType } = this.connection;
    return effectiveType === 'slow-2g' || effectiveType === '2g';
  }
  
  // Check if data should be saved
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

// Usage
const network = new NetworkManager();

console.log('Current network status:', network.getStatus());

network.onChange((event, status) => {
  console.log('Network event:', event);
  console.log('Status:', status);
});
```

### Connection Quality Assessment

```javascript
class ConnectionQuality {
  constructor() {
    this.network = new NetworkManager();
  }
  
  // Get quality level: excellent, good, fair, poor
  getQuality() {
    const status = this.network.getStatus();
    
    if (!status.isOnline) return 'offline';
    
    const { effectiveType, downlink, rtt } = status;
    
    // Evaluate based on multiple factors
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
  
  // Get recommended media quality
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
  
  // Get recommended request strategy
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

// Usage
const connectionQuality = new ConnectionQuality();

console.log('Connection quality:', connectionQuality.getQuality());
console.log('Recommended media quality:', connectionQuality.getRecommendedMediaQuality());
console.log('Request strategy:', connectionQuality.getRequestStrategy());
```

## Practical Applications

### Adaptive Image Loading

```javascript
class AdaptiveImageLoader {
  constructor() {
    this.network = new NetworkManager();
  }
  
  // Get optimal image URL
  getOptimalImageUrl(baseUrl, sizes = {}) {
    const status = this.network.getStatus();
    
    // Default size configuration
    const defaultSizes = {
      high: 'large',
      medium: 'medium',
      low: 'small',
      thumbnail: 'thumb'
    };
    
    const sizeSuffixes = { ...defaultSizes, ...sizes };
    
    // Choose based on network conditions
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
    // Assume URL format: /images/photo.jpg -> /images/photo-large.jpg
    const ext = baseUrl.substring(baseUrl.lastIndexOf('.'));
    const name = baseUrl.substring(0, baseUrl.lastIndexOf('.'));
    return `${name}-${size}${ext}`;
  }
  
  // Lazy load image
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
  
  // Process all images on page
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

// Usage
const imageLoader = new AdaptiveImageLoader();

// Process all lazy-load images
imageLoader.processImages();

// Load single image
const img = document.getElementById('hero-image');
imageLoader.loadImage(img, '/images/hero.jpg');
```

### Adaptive Video Quality

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
    
    // Initial quality adjustment
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
    
    // Choose based on bandwidth
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
    
    // Update video source
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
    console.log('Video quality changed to:', quality);
    
    // Update UI
    const indicator = document.getElementById('quality-indicator');
    if (indicator) {
      indicator.textContent = quality;
    }
  }
  
  // Manually set quality
  forceQuality(quality) {
    if (this.qualities[quality]) {
      this.setQuality(quality);
    }
  }
  
  // Get current quality
  getCurrentQuality() {
    return this.currentQuality;
  }
}

// Usage
const video = document.getElementById('main-video');
const player = new AdaptiveVideoPlayer(video);
```

### Smart Prefetching

```javascript
class SmartPrefetcher {
  constructor() {
    this.network = new NetworkManager();
    this.prefetchedUrls = new Set();
  }
  
  // Check if prefetching should occur
  shouldPrefetch() {
    const status = this.network.getStatus();
    
    if (!status.isOnline) return false;
    if (status.saveData) return false;
    if (this.network.isSlowConnection()) return false;
    
    return true;
  }
  
  // Prefetch resource
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
      console.error('Prefetch failed:', url, error);
      return false;
    }
  }
  
  // Preconnect to origin
  preconnect(origin) {
    if (!this.shouldPrefetch()) return;
    
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    document.head.appendChild(link);
  }
  
  // Prefetch multiple resources
  async prefetchMultiple(urls) {
    if (!this.shouldPrefetch()) return [];
    
    const status = this.network.getStatus();
    
    // Limit concurrency based on network
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
  
  // Smart prefetch next page
  prefetchNextPage(links) {
    if (!this.shouldPrefetch()) return;
    
    // Decide prefetch count based on network quality
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

// Usage
const prefetcher = new SmartPrefetcher();

// Prefetch resource
prefetcher.prefetch('/api/data.json');

// Prefetch multiple resources
prefetcher.prefetchMultiple([
  '/images/hero.jpg',
  '/js/page-2.js',
  '/css/page-2.css'
]);

// Prefetch on hover
document.querySelectorAll('a[data-prefetch]').forEach(link => {
  link.addEventListener('mouseenter', () => {
    prefetcher.prefetch(link.href);
  });
});
```

### Offline-Aware Application

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
    console.log('Network restored, processing pending actions...');
    
    this.showNotification('Network restored', 'success');
    this.syncPendingActions();
  }
  
  handleOffline() {
    this.isOffline = true;
    console.log('Network disconnected');
    
    this.showNotification('Network disconnected, actions will sync when restored', 'warning');
  }
  
  // Perform network-required action
  async performAction(action, data) {
    if (this.isOffline) {
      // Queue action when offline
      this.queueAction(action, data);
      return { queued: true, message: 'Action saved, will execute when online' };
    }
    
    try {
      return await this.executeAction(action, data);
    } catch (error) {
      if (this.isNetworkError(error)) {
        this.queueAction(action, data);
        return { queued: true, message: 'Network error, action saved' };
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
        console.log('Sync successful:', item.action);
      } catch (error) {
        console.error('Sync failed:', item.action, error);
        this.pendingActions.push(item);
      }
    }
    
    this.savePendingActions();
  }
  
  async executeAction(action, data) {
    // Actual API call
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
    // Display notification UI
    console.log(`[${type}] ${message}`);
  }
  
  getPendingCount() {
    return this.pendingActions.length;
  }
}

// Usage
const app = new OfflineAwareApp();
app.loadPendingActions();

// Perform action
document.getElementById('save-btn').addEventListener('click', async () => {
  const result = await app.performAction('saveData', { content: 'test' });
  console.log('Result:', result);
});
```

## Best Practices Summary

```
Network Information API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Adaptive Loading                                  │
│   ├── Adjust media quality based on connection     │
│   ├── Use placeholders on slow networks            │
│   ├── Respect user's data saver preferences        │
│   └── Dynamically adjust prefetch strategy         │
│                                                     │
│   Offline Handling                                  │
│   ├── Listen for online/offline events             │
│   ├── Cache data with local storage                │
│   ├── Implement action queue and sync              │
│   └── Provide clear status feedback                │
│                                                     │
│   Performance Optimization                          │
│   ├── Avoid frequent network status checks         │
│   ├── Use event listeners instead of polling       │
│   ├── Set appropriate timeout and retry strategies │
│   └── Consider API compatibility                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Connection Type | Typical Bandwidth | Recommended Strategy |
|-----------------|-------------------|---------------------|
| 4g | >10 Mbps | High quality media, aggressive prefetch |
| 3g | 1-10 Mbps | Medium quality, moderate prefetch |
| 2g | 50-250 Kbps | Low quality, disable prefetch |
| slow-2g | <50 Kbps | Minimum quality, text-first |

---

*Master the Network Information API to provide optimal network experience for users.*
