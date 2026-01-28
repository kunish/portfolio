---
title: 'JavaScript Geolocation API 完全指南'
description: '掌握地理位置服务：位置获取、实时追踪、权限处理与位置应用开发'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'js-geolocation-api-guide'
---

Geolocation API 提供设备地理位置信息。本文详解其使用方法和实战应用。

## 基础用法

### 检测支持

```javascript
// 检查地理位置支持
if ('geolocation' in navigator) {
  console.log('支持地理位置 API');
} else {
  console.log('不支持地理位置 API');
}
```

### 获取当前位置

```javascript
// 基础位置获取
navigator.geolocation.getCurrentPosition(
  // 成功回调
  (position) => {
    console.log('纬度:', position.coords.latitude);
    console.log('经度:', position.coords.longitude);
    console.log('精度:', position.coords.accuracy, '米');
  },
  // 错误回调
  (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('用户拒绝了位置请求');
        break;
      case error.POSITION_UNAVAILABLE:
        console.error('位置信息不可用');
        break;
      case error.TIMEOUT:
        console.error('请求超时');
        break;
    }
  }
);

// 使用 Promise 封装
function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('不支持地理位置'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

// 使用示例
async function getLocation() {
  try {
    const position = await getCurrentPosition();
    console.log('位置:', position.coords);
    return position;
  } catch (error) {
    console.error('获取位置失败:', error);
    throw error;
  }
}
```

### 位置选项

```javascript
const options = {
  // 是否启用高精度（GPS）
  enableHighAccuracy: true,
  
  // 超时时间（毫秒）
  timeout: 10000,
  
  // 缓存时间（毫秒）
  maximumAge: 0  // 0 表示不使用缓存
};

navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log('高精度位置:', position.coords);
  },
  (error) => {
    console.error('错误:', error.message);
  },
  options
);
```

### 位置信息详解

```javascript
navigator.geolocation.getCurrentPosition((position) => {
  const coords = position.coords;
  
  // 必需属性
  console.log('纬度:', coords.latitude);           // 度数
  console.log('经度:', coords.longitude);          // 度数
  console.log('精度:', coords.accuracy);           // 米
  
  // 可选属性（可能为 null）
  console.log('海拔:', coords.altitude);           // 米
  console.log('海拔精度:', coords.altitudeAccuracy); // 米
  console.log('航向:', coords.heading);            // 0-360 度，正北为 0
  console.log('速度:', coords.speed);              // 米/秒
  
  // 时间戳
  console.log('时间:', new Date(position.timestamp));
});
```

## 位置追踪

### 实时位置监听

```javascript
// 开始监听位置变化
const watchId = navigator.geolocation.watchPosition(
  (position) => {
    console.log('位置更新:', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy
    });
  },
  (error) => {
    console.error('监听错误:', error.message);
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 1000
  }
);

// 停止监听
function stopWatching() {
  navigator.geolocation.clearWatch(watchId);
  console.log('已停止位置监听');
}

// 一段时间后停止
setTimeout(stopWatching, 60000); // 1 分钟后停止
```

### 位置追踪管理器

```javascript
class LocationTracker {
  constructor(options = {}) {
    this.options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
      ...options
    };
    
    this.watchId = null;
    this.listeners = new Set();
    this.lastPosition = null;
    this.isTracking = false;
  }
  
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.lastPosition = position;
          resolve(position);
        },
        reject,
        this.options
      );
    });
  }
  
  startTracking() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.lastPosition = position;
        this.notifyListeners(position);
      },
      (error) => {
        this.notifyListeners(null, error);
      },
      this.options
    );
    
    console.log('开始位置追踪');
  }
  
  stopTracking() {
    if (!this.isTracking) return;
    
    navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
    this.isTracking = false;
    
    console.log('停止位置追踪');
  }
  
  onPositionChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners(position, error = null) {
    this.listeners.forEach(callback => {
      callback(position, error);
    });
  }
  
  getLastPosition() {
    return this.lastPosition;
  }
  
  getDistance(lat1, lon1, lat2, lon2) {
    // Haversine 公式计算距离
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // 米
  }
}

// 使用
const tracker = new LocationTracker({
  enableHighAccuracy: true
});

tracker.onPositionChange((position, error) => {
  if (error) {
    console.error('位置错误:', error);
    return;
  }
  
  console.log('新位置:', position.coords);
});

tracker.startTracking();
```

## 权限处理

### 权限状态查询

```javascript
// 查询权限状态
async function checkGeolocationPermission() {
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    
    console.log('权限状态:', result.state);
    // 'granted' - 已授权
    // 'denied' - 已拒绝
    // 'prompt' - 需要询问
    
    // 监听权限变化
    result.addEventListener('change', () => {
      console.log('权限状态变化:', result.state);
    });
    
    return result.state;
  } catch (error) {
    console.error('权限查询失败:', error);
    return 'unknown';
  }
}

// 使用
checkGeolocationPermission().then(state => {
  if (state === 'granted') {
    console.log('可以直接获取位置');
  } else if (state === 'denied') {
    console.log('权限被拒绝，需要引导用户开启');
  } else {
    console.log('需要请求权限');
  }
});
```

### 带权限处理的位置服务

```javascript
class GeolocationService {
  constructor() {
    this.permissionState = 'unknown';
    this.initPermissionListener();
  }
  
  async initPermissionListener() {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      this.permissionState = result.state;
      
      result.addEventListener('change', () => {
        this.permissionState = result.state;
        this.onPermissionChange?.(result.state);
      });
    } catch {
      // 权限 API 不支持
    }
  }
  
  async requestPermission() {
    // 通过获取位置来请求权限
    try {
      await this.getCurrentPosition({ timeout: 5000 });
      return 'granted';
    } catch (error) {
      if (error.code === 1) {
        return 'denied';
      }
      throw error;
    }
  }
  
  async getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    };
    
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          reject(this.enhanceError(error));
        },
        { ...defaultOptions, ...options }
      );
    });
  }
  
  enhanceError(error) {
    const messages = {
      1: '位置权限被拒绝。请在浏览器设置中允许位置访问。',
      2: '无法获取位置信息。请检查您的网络连接或 GPS 设置。',
      3: '获取位置超时。请确保您在信号良好的区域。'
    };
    
    return {
      code: error.code,
      message: messages[error.code] || error.message,
      originalError: error
    };
  }
  
  onPermissionChange = null;
}

// 使用
const geoService = new GeolocationService();

geoService.onPermissionChange = (state) => {
  console.log('权限状态变化:', state);
  
  if (state === 'denied') {
    showPermissionDeniedUI();
  }
};

async function getMyLocation() {
  try {
    const position = await geoService.getCurrentPosition();
    return position.coords;
  } catch (error) {
    // 显示友好的错误信息
    alert(error.message);
    return null;
  }
}
```

## 实际应用

### 附近搜索

```javascript
class NearbySearch {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.tracker = new LocationTracker();
  }
  
  async searchNearby(type, radius = 1000) {
    const position = await this.tracker.getCurrentPosition();
    const { latitude, longitude } = position.coords;
    
    // 调用地点搜索 API
    const results = await this.fetchPlaces(latitude, longitude, type, radius);
    
    // 计算距离并排序
    return results
      .map(place => ({
        ...place,
        distance: this.tracker.getDistance(
          latitude, longitude,
          place.lat, place.lng
        )
      }))
      .sort((a, b) => a.distance - b.distance);
  }
  
  async fetchPlaces(lat, lng, type, radius) {
    // 模拟 API 调用
    const response = await fetch(
      `/api/places?lat=${lat}&lng=${lng}&type=${type}&radius=${radius}`
    );
    return response.json();
  }
  
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} 米`;
    }
    return `${(meters / 1000).toFixed(1)} 公里`;
  }
}

// 使用
const nearbySearch = new NearbySearch('your-api-key');

async function findNearbyRestaurants() {
  const restaurants = await nearbySearch.searchNearby('restaurant', 2000);
  
  restaurants.forEach(place => {
    console.log(
      `${place.name} - ${nearbySearch.formatDistance(place.distance)}`
    );
  });
}
```

### 运动轨迹记录

```javascript
class WorkoutTracker {
  constructor() {
    this.tracker = new LocationTracker({
      enableHighAccuracy: true,
      maximumAge: 0
    });
    
    this.path = [];
    this.startTime = null;
    this.totalDistance = 0;
    this.isRecording = false;
  }
  
  start() {
    if (this.isRecording) return;
    
    this.path = [];
    this.startTime = Date.now();
    this.totalDistance = 0;
    this.isRecording = true;
    
    this.tracker.onPositionChange((position, error) => {
      if (error || !position) return;
      this.recordPoint(position);
    });
    
    this.tracker.startTracking();
    console.log('开始记录运动');
  }
  
  stop() {
    if (!this.isRecording) return;
    
    this.tracker.stopTracking();
    this.isRecording = false;
    
    return this.getSummary();
  }
  
  recordPoint(position) {
    const point = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      altitude: position.coords.altitude,
      speed: position.coords.speed,
      timestamp: position.timestamp
    };
    
    // 计算与上一个点的距离
    if (this.path.length > 0) {
      const lastPoint = this.path[this.path.length - 1];
      const distance = this.tracker.getDistance(
        lastPoint.lat, lastPoint.lng,
        point.lat, point.lng
      );
      
      // 过滤掉可能的 GPS 漂移
      if (distance < 2) return; // 小于 2 米不记录
      
      this.totalDistance += distance;
    }
    
    this.path.push(point);
    this.onUpdate?.(this.getStats());
  }
  
  getStats() {
    const duration = Date.now() - this.startTime;
    const avgSpeed = this.totalDistance / (duration / 1000); // 米/秒
    
    return {
      distance: this.totalDistance,
      duration,
      avgSpeed,
      points: this.path.length
    };
  }
  
  getSummary() {
    const stats = this.getStats();
    
    return {
      ...stats,
      path: [...this.path],
      startTime: this.startTime,
      endTime: Date.now(),
      formattedDistance: this.formatDistance(stats.distance),
      formattedDuration: this.formatDuration(stats.duration),
      formattedPace: this.formatPace(stats.avgSpeed)
    };
  }
  
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  }
  
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }
  
  formatPace(speedMps) {
    if (speedMps <= 0) return '--:--';
    
    const paceSeconds = 1000 / speedMps; // 每公里秒数
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    
    return `${minutes}:${String(seconds).padStart(2, '0')} /km`;
  }
  
  onUpdate = null;
}

// 使用
const workout = new WorkoutTracker();

workout.onUpdate = (stats) => {
  console.log('距离:', workout.formatDistance(stats.distance));
  console.log('时间:', workout.formatDuration(stats.duration));
};

// 开始记录
workout.start();

// 停止并获取汇总
setTimeout(() => {
  const summary = workout.stop();
  console.log('运动汇总:', summary);
}, 300000); // 5 分钟后
```

### 地理围栏

```javascript
class Geofence {
  constructor() {
    this.fences = new Map();
    this.tracker = new LocationTracker();
    this.insideFences = new Set();
  }
  
  addFence(id, center, radius, callbacks = {}) {
    this.fences.set(id, {
      center,
      radius,
      onEnter: callbacks.onEnter || (() => {}),
      onExit: callbacks.onExit || (() => {}),
      onStay: callbacks.onStay || (() => {})
    });
  }
  
  removeFence(id) {
    this.fences.delete(id);
    this.insideFences.delete(id);
  }
  
  start() {
    this.tracker.onPositionChange((position, error) => {
      if (error || !position) return;
      this.checkFences(position);
    });
    
    this.tracker.startTracking();
  }
  
  stop() {
    this.tracker.stopTracking();
  }
  
  checkFences(position) {
    const { latitude, longitude } = position.coords;
    
    this.fences.forEach((fence, id) => {
      const distance = this.tracker.getDistance(
        latitude, longitude,
        fence.center.lat, fence.center.lng
      );
      
      const isInside = distance <= fence.radius;
      const wasInside = this.insideFences.has(id);
      
      if (isInside && !wasInside) {
        // 进入围栏
        this.insideFences.add(id);
        fence.onEnter({ id, distance, position });
      } else if (!isInside && wasInside) {
        // 离开围栏
        this.insideFences.delete(id);
        fence.onExit({ id, distance, position });
      } else if (isInside && wasInside) {
        // 在围栏内
        fence.onStay({ id, distance, position });
      }
    });
  }
  
  isInside(id) {
    return this.insideFences.has(id);
  }
}

// 使用
const geofence = new Geofence();

// 添加公司围栏
geofence.addFence('office', 
  { lat: 39.9042, lng: 116.4074 },
  200, // 200 米半径
  {
    onEnter: ({ id }) => {
      console.log('进入办公区域');
      // 自动打卡
    },
    onExit: ({ id }) => {
      console.log('离开办公区域');
      // 提醒下班打卡
    }
  }
);

// 添加家的围栏
geofence.addFence('home',
  { lat: 39.9142, lng: 116.4174 },
  100,
  {
    onEnter: () => {
      console.log('到家了');
      // 触发智能家居
    }
  }
);

geofence.start();
```

## 最佳实践总结

```
Geolocation API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   权限处理                                          │
│   ├── 说明为什么需要位置权限                       │
│   ├── 优雅处理权限拒绝                             │
│   ├── 提供手动输入位置的备选                       │
│   └── 缓存位置减少请求                             │
│                                                     │
│   精度与电量                                        │
│   ├── 按需选择高/低精度                            │
│   ├── 合理设置更新间隔                             │
│   ├── 不需要时停止追踪                             │
│   └── 使用 maximumAge 缓存                         │
│                                                     │
│   错误处理                                          │
│   ├── 处理所有错误类型                             │
│   ├── 提供友好的错误提示                           │
│   ├── 实现超时和重试机制                           │
│   └── 提供降级方案                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐设置 |
|------|----------|
| 一次性定位 | enableHighAccuracy: false, timeout: 10000 |
| 导航追踪 | enableHighAccuracy: true, maximumAge: 0 |
| 运动记录 | enableHighAccuracy: true, maximumAge: 1000 |
| 城市级定位 | enableHighAccuracy: false, maximumAge: 60000 |

---

*善用 Geolocation API，为用户提供基于位置的智能服务。*
