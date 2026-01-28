---
title: 'JavaScript Battery Status API 完全指南'
description: '掌握电池状态监测：电量获取、充电状态、续航估算与节能模式开发'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'js-battery-status-api-guide'
---

Battery Status API 提供设备电池状态信息。本文详解其使用方法和实战应用。

## 基础概念

### 获取电池信息

```javascript
// 获取电池管理器
async function getBatteryInfo() {
  try {
    const battery = await navigator.getBattery();
    
    console.log('电池电量:', Math.round(battery.level * 100) + '%');
    console.log('是否充电:', battery.charging ? '是' : '否');
    console.log('充满时间:', battery.chargingTime, '秒');
    console.log('剩余时间:', battery.dischargingTime, '秒');
    
    return battery;
  } catch (error) {
    console.error('无法获取电池信息:', error);
    return null;
  }
}

getBatteryInfo();
```

### 电池属性详解

```javascript
navigator.getBattery().then(battery => {
  // level: 0.0 - 1.0，表示电量百分比
  console.log('电量:', battery.level); // 例如 0.75 表示 75%
  
  // charging: 布尔值，是否正在充电
  console.log('充电中:', battery.charging);
  
  // chargingTime: 充满电还需的秒数
  // Infinity 表示未充电或无法估算
  console.log('充满需要:', battery.chargingTime);
  
  // dischargingTime: 电池耗尽还需的秒数
  // Infinity 表示正在充电或无法估算
  console.log('耗尽需要:', battery.dischargingTime);
});
```

### 监听电池变化

```javascript
navigator.getBattery().then(battery => {
  // 电量变化
  battery.addEventListener('levelchange', () => {
    console.log('电量变化:', Math.round(battery.level * 100) + '%');
  });
  
  // 充电状态变化
  battery.addEventListener('chargingchange', () => {
    console.log('充电状态变化:', battery.charging ? '开始充电' : '停止充电');
  });
  
  // 充电时间变化
  battery.addEventListener('chargingtimechange', () => {
    console.log('充满时间更新:', battery.chargingTime);
  });
  
  // 放电时间变化
  battery.addEventListener('dischargingtimechange', () => {
    console.log('剩余时间更新:', battery.dischargingTime);
  });
});
```

## 电池管理器

### 封装类

```javascript
class BatteryManager {
  constructor() {
    this.battery = null;
    this.listeners = new Map();
    this.isSupported = 'getBattery' in navigator;
  }
  
  async init() {
    if (!this.isSupported) {
      console.warn('Battery API 不受支持');
      return false;
    }
    
    try {
      this.battery = await navigator.getBattery();
      this.setupEventListeners();
      return true;
    } catch (error) {
      console.error('初始化电池管理器失败:', error);
      return false;
    }
  }
  
  setupEventListeners() {
    const events = ['levelchange', 'chargingchange', 'chargingtimechange', 'dischargingtimechange'];
    
    events.forEach(event => {
      this.battery.addEventListener(event, () => {
        this.notify(event, this.getStatus());
      });
    });
  }
  
  getStatus() {
    if (!this.battery) return null;
    
    return {
      level: this.battery.level,
      levelPercent: Math.round(this.battery.level * 100),
      charging: this.battery.charging,
      chargingTime: this.battery.chargingTime,
      dischargingTime: this.battery.dischargingTime,
      isLow: this.battery.level < 0.2,
      isCritical: this.battery.level < 0.1
    };
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }
  
  onChange(callback) {
    const events = ['levelchange', 'chargingchange'];
    const unsubscribes = events.map(event => this.on(event, callback));
    return () => unsubscribes.forEach(unsub => unsub());
  }
  
  notify(event, data) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
  
  formatTime(seconds) {
    if (seconds === Infinity || isNaN(seconds)) {
      return '未知';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  }
}

// 使用
const batteryManager = new BatteryManager();

batteryManager.init().then(success => {
  if (success) {
    const status = batteryManager.getStatus();
    console.log('当前电量:', status.levelPercent + '%');
    
    batteryManager.onChange((status) => {
      console.log('电池状态更新:', status);
    });
  }
});
```

## 实际应用

### 低电量警告

```javascript
class LowBatteryWarning {
  constructor(options = {}) {
    this.manager = new BatteryManager();
    this.warningThreshold = options.warningThreshold || 0.2; // 20%
    this.criticalThreshold = options.criticalThreshold || 0.1; // 10%
    this.hasWarnedLow = false;
    this.hasWarnedCritical = false;
    this.onWarning = options.onWarning || (() => {});
    this.onCritical = options.onCritical || (() => {});
  }
  
  async init() {
    const success = await this.manager.init();
    if (!success) return;
    
    // 初始检查
    this.checkBattery(this.manager.getStatus());
    
    // 监听变化
    this.manager.on('levelchange', (status) => {
      this.checkBattery(status);
    });
    
    this.manager.on('chargingchange', (status) => {
      // 开始充电时重置警告状态
      if (status.charging) {
        this.hasWarnedLow = false;
        this.hasWarnedCritical = false;
      }
    });
  }
  
  checkBattery(status) {
    if (status.charging) return;
    
    if (status.level <= this.criticalThreshold && !this.hasWarnedCritical) {
      this.hasWarnedCritical = true;
      this.onCritical(status);
    } else if (status.level <= this.warningThreshold && !this.hasWarnedLow) {
      this.hasWarnedLow = true;
      this.onWarning(status);
    }
  }
}

// 使用
const lowBatteryWarning = new LowBatteryWarning({
  warningThreshold: 0.2,
  criticalThreshold: 0.1,
  onWarning: (status) => {
    showNotification('电量偏低', `当前电量 ${status.levelPercent}%，建议充电`);
  },
  onCritical: (status) => {
    showNotification('电量严重不足', `电量仅剩 ${status.levelPercent}%，请立即充电！`);
    enablePowerSaveMode();
  }
});

lowBatteryWarning.init();

function showNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}
```

### 自适应性能模式

```javascript
class AdaptivePerformance {
  constructor() {
    this.manager = new BatteryManager();
    this.currentMode = 'normal';
    this.onModeChange = null;
  }
  
  async init() {
    const success = await this.manager.init();
    if (!success) return;
    
    // 初始评估
    this.evaluatePerformanceMode(this.manager.getStatus());
    
    // 监听变化
    this.manager.onChange((status) => {
      this.evaluatePerformanceMode(status);
    });
  }
  
  evaluatePerformanceMode(status) {
    let newMode;
    
    if (status.charging) {
      newMode = 'high';
    } else if (status.level > 0.5) {
      newMode = 'normal';
    } else if (status.level > 0.2) {
      newMode = 'balanced';
    } else {
      newMode = 'power-save';
    }
    
    if (newMode !== this.currentMode) {
      this.currentMode = newMode;
      this.applyMode(newMode);
    }
  }
  
  applyMode(mode) {
    const settings = this.getModeSettings(mode);
    
    // 应用设置
    this.setAnimationSettings(settings.animations);
    this.setPollingInterval(settings.pollingInterval);
    this.setImageQuality(settings.imageQuality);
    
    console.log('性能模式切换为:', mode);
    this.onModeChange?.(mode, settings);
  }
  
  getModeSettings(mode) {
    const modes = {
      high: {
        animations: true,
        pollingInterval: 5000,
        imageQuality: 'high',
        description: '高性能模式'
      },
      normal: {
        animations: true,
        pollingInterval: 10000,
        imageQuality: 'high',
        description: '正常模式'
      },
      balanced: {
        animations: true,
        pollingInterval: 30000,
        imageQuality: 'medium',
        description: '平衡模式'
      },
      'power-save': {
        animations: false,
        pollingInterval: 60000,
        imageQuality: 'low',
        description: '节能模式'
      }
    };
    
    return modes[mode] || modes.normal;
  }
  
  setAnimationSettings(enabled) {
    if (enabled) {
      document.body.classList.remove('reduce-motion');
    } else {
      document.body.classList.add('reduce-motion');
    }
  }
  
  setPollingInterval(interval) {
    // 更新轮询间隔
    window.dispatchEvent(new CustomEvent('polling-interval-change', {
      detail: { interval }
    }));
  }
  
  setImageQuality(quality) {
    // 设置图片质量
    document.documentElement.dataset.imageQuality = quality;
  }
}

// 使用
const adaptivePerf = new AdaptivePerformance();

adaptivePerf.onModeChange = (mode, settings) => {
  console.log('模式:', settings.description);
  updateUIForMode(mode);
};

adaptivePerf.init();
```

### 电池状态指示器

```javascript
class BatteryIndicator {
  constructor(container) {
    this.container = container;
    this.manager = new BatteryManager();
    this.element = null;
    
    this.createIndicator();
  }
  
  createIndicator() {
    this.element = document.createElement('div');
    this.element.className = 'battery-indicator';
    this.element.innerHTML = `
      <div class="battery-icon">
        <div class="battery-body">
          <div class="battery-level"></div>
        </div>
        <div class="battery-tip"></div>
        <div class="charging-icon" style="display: none;">⚡</div>
      </div>
      <span class="battery-text">--%</span>
    `;
    
    this.container.appendChild(this.element);
  }
  
  async init() {
    const success = await this.manager.init();
    if (!success) {
      this.element.style.display = 'none';
      return;
    }
    
    // 初始更新
    this.update(this.manager.getStatus());
    
    // 监听变化
    this.manager.onChange((status) => {
      this.update(status);
    });
  }
  
  update(status) {
    const levelEl = this.element.querySelector('.battery-level');
    const textEl = this.element.querySelector('.battery-text');
    const chargingEl = this.element.querySelector('.charging-icon');
    const bodyEl = this.element.querySelector('.battery-body');
    
    // 更新电量条
    levelEl.style.width = status.levelPercent + '%';
    
    // 更新文字
    textEl.textContent = status.levelPercent + '%';
    
    // 更新充电图标
    chargingEl.style.display = status.charging ? 'block' : 'none';
    
    // 更新颜色
    bodyEl.classList.remove('low', 'critical', 'charging');
    
    if (status.charging) {
      bodyEl.classList.add('charging');
    } else if (status.isCritical) {
      bodyEl.classList.add('critical');
    } else if (status.isLow) {
      bodyEl.classList.add('low');
    }
  }
}

// CSS 样式
const styles = `
.battery-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.battery-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.battery-body {
  width: 24px;
  height: 12px;
  border: 2px solid #333;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.battery-level {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s;
}

.battery-body.low .battery-level {
  background: #ff9800;
}

.battery-body.critical .battery-level {
  background: #f44336;
}

.battery-body.charging .battery-level {
  background: #2196f3;
}

.battery-tip {
  width: 3px;
  height: 6px;
  background: #333;
  border-radius: 0 1px 1px 0;
}

.charging-icon {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
}

.battery-text {
  font-size: 12px;
  color: #666;
}
`;

// 使用
const indicator = new BatteryIndicator(document.getElementById('header'));
indicator.init();
```

### 下载管理器

```javascript
class SmartDownloadManager {
  constructor() {
    this.manager = new BatteryManager();
    this.queue = [];
    this.isProcessing = false;
    this.settings = {
      maxConcurrent: 3,
      pauseOnLowBattery: true,
      lowBatteryThreshold: 0.15
    };
  }
  
  async init() {
    const success = await this.manager.init();
    if (!success) return;
    
    this.manager.on('levelchange', (status) => {
      this.handleBatteryChange(status);
    });
    
    this.manager.on('chargingchange', (status) => {
      if (status.charging && this.queue.length > 0) {
        console.log('充电中，恢复下载队列');
        this.processQueue();
      }
    });
  }
  
  handleBatteryChange(status) {
    if (!status.charging && 
        status.level <= this.settings.lowBatteryThreshold && 
        this.settings.pauseOnLowBattery) {
      this.pauseAll();
      console.log('电量过低，暂停所有下载');
    }
  }
  
  add(url, options = {}) {
    const download = {
      id: crypto.randomUUID(),
      url,
      options,
      status: 'pending',
      progress: 0
    };
    
    this.queue.push(download);
    this.processQueue();
    
    return download.id;
  }
  
  async processQueue() {
    if (this.isProcessing) return;
    
    // 检查电量
    const status = this.manager.getStatus();
    if (status && 
        !status.charging && 
        status.level <= this.settings.lowBatteryThreshold &&
        this.settings.pauseOnLowBattery) {
      console.log('电量过低，等待充电后继续');
      return;
    }
    
    this.isProcessing = true;
    
    const pending = this.queue.filter(d => d.status === 'pending');
    const active = this.queue.filter(d => d.status === 'downloading');
    
    const available = this.settings.maxConcurrent - active.length;
    const toStart = pending.slice(0, available);
    
    await Promise.all(toStart.map(d => this.startDownload(d)));
    
    this.isProcessing = false;
    
    if (pending.length > available) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }
  
  async startDownload(download) {
    download.status = 'downloading';
    
    try {
      const response = await fetch(download.url);
      const reader = response.body.getReader();
      const contentLength = +response.headers.get('Content-Length');
      
      let receivedLength = 0;
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        download.progress = receivedLength / contentLength;
        
        // 检查是否应该暂停
        const status = this.manager.getStatus();
        if (status && 
            !status.charging && 
            status.level <= this.settings.lowBatteryThreshold) {
          download.status = 'paused';
          return;
        }
      }
      
      download.status = 'completed';
      download.data = new Blob(chunks);
      
      this.processQueue();
    } catch (error) {
      download.status = 'error';
      download.error = error;
    }
  }
  
  pauseAll() {
    this.queue.forEach(d => {
      if (d.status === 'downloading' || d.status === 'pending') {
        d.status = 'paused';
      }
    });
  }
  
  resumeAll() {
    this.queue.forEach(d => {
      if (d.status === 'paused') {
        d.status = 'pending';
      }
    });
    this.processQueue();
  }
  
  getStatus() {
    return {
      pending: this.queue.filter(d => d.status === 'pending').length,
      downloading: this.queue.filter(d => d.status === 'downloading').length,
      completed: this.queue.filter(d => d.status === 'completed').length,
      paused: this.queue.filter(d => d.status === 'paused').length
    };
  }
}

// 使用
const downloadManager = new SmartDownloadManager();
downloadManager.init();

// 添加下载
downloadManager.add('/files/large-file.zip');
```

## 最佳实践总结

```
Battery Status API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   节能策略                                          │
│   ├── 低电量时减少动画效果                         │
│   ├── 降低轮询频率                                 │
│   ├── 延迟非紧急的后台任务                         │
│   └── 使用低质量图片/视频                          │
│                                                     │
│   用户体验                                          │
│   ├── 显示电池状态指示器                           │
│   ├── 低电量时发出警告                             │
│   ├── 提供手动切换性能模式                         │
│   └── 充电时恢复正常功能                           │
│                                                     │
│   隐私考虑                                          │
│   ├── API 可能因隐私问题被限制                     │
│   ├── 仅在必要时使用                               │
│   ├── 不要将电池信息用于追踪                       │
│   └── 提供降级方案                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 电量范围 | 建议策略 |
|---------|----------|
| > 50% | 正常模式 |
| 20-50% | 平衡模式 |
| 10-20% | 节能模式 |
| < 10% | 紧急模式 |

---

*合理使用 Battery Status API，提供电量感知的用户体验。*
