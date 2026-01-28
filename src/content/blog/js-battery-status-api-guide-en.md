---
title: 'JavaScript Battery Status API Complete Guide'
description: 'Master battery monitoring: level detection, charging status, remaining time estimation, and power-saving mode development'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'js-battery-status-api-guide'
---

The Battery Status API provides device battery information. This article covers its usage and practical applications.

## Basic Concepts

### Getting Battery Information

```javascript
// Get battery manager
async function getBatteryInfo() {
  try {
    const battery = await navigator.getBattery();
    
    console.log('Battery level:', Math.round(battery.level * 100) + '%');
    console.log('Charging:', battery.charging ? 'Yes' : 'No');
    console.log('Time to full:', battery.chargingTime, 'seconds');
    console.log('Time remaining:', battery.dischargingTime, 'seconds');
    
    return battery;
  } catch (error) {
    console.error('Could not get battery info:', error);
    return null;
  }
}

getBatteryInfo();
```

### Battery Properties Explained

```javascript
navigator.getBattery().then(battery => {
  // level: 0.0 - 1.0, represents battery percentage
  console.log('Level:', battery.level); // e.g., 0.75 means 75%
  
  // charging: boolean, whether currently charging
  console.log('Charging:', battery.charging);
  
  // chargingTime: seconds until fully charged
  // Infinity means not charging or cannot estimate
  console.log('Charging time:', battery.chargingTime);
  
  // dischargingTime: seconds until battery empty
  // Infinity means charging or cannot estimate
  console.log('Discharging time:', battery.dischargingTime);
});
```

### Listening for Battery Changes

```javascript
navigator.getBattery().then(battery => {
  // Level change
  battery.addEventListener('levelchange', () => {
    console.log('Level changed:', Math.round(battery.level * 100) + '%');
  });
  
  // Charging status change
  battery.addEventListener('chargingchange', () => {
    console.log('Charging changed:', battery.charging ? 'Started' : 'Stopped');
  });
  
  // Charging time change
  battery.addEventListener('chargingtimechange', () => {
    console.log('Charging time updated:', battery.chargingTime);
  });
  
  // Discharging time change
  battery.addEventListener('dischargingtimechange', () => {
    console.log('Remaining time updated:', battery.dischargingTime);
  });
});
```

## Battery Manager

### Wrapper Class

```javascript
class BatteryManager {
  constructor() {
    this.battery = null;
    this.listeners = new Map();
    this.isSupported = 'getBattery' in navigator;
  }
  
  async init() {
    if (!this.isSupported) {
      console.warn('Battery API not supported');
      return false;
    }
    
    try {
      this.battery = await navigator.getBattery();
      this.setupEventListeners();
      return true;
    } catch (error) {
      console.error('Failed to initialize battery manager:', error);
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
      return 'Unknown';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

// Usage
const batteryManager = new BatteryManager();

batteryManager.init().then(success => {
  if (success) {
    const status = batteryManager.getStatus();
    console.log('Current level:', status.levelPercent + '%');
    
    batteryManager.onChange((status) => {
      console.log('Battery status updated:', status);
    });
  }
});
```

## Practical Applications

### Low Battery Warning

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
    
    // Initial check
    this.checkBattery(this.manager.getStatus());
    
    // Listen for changes
    this.manager.on('levelchange', (status) => {
      this.checkBattery(status);
    });
    
    this.manager.on('chargingchange', (status) => {
      // Reset warnings when charging starts
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

// Usage
const lowBatteryWarning = new LowBatteryWarning({
  warningThreshold: 0.2,
  criticalThreshold: 0.1,
  onWarning: (status) => {
    showNotification('Battery Low', `Current level: ${status.levelPercent}%. Please charge.`);
  },
  onCritical: (status) => {
    showNotification('Battery Critical', `Only ${status.levelPercent}% remaining. Charge now!`);
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

### Adaptive Performance Mode

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
    
    // Initial evaluation
    this.evaluatePerformanceMode(this.manager.getStatus());
    
    // Listen for changes
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
    
    // Apply settings
    this.setAnimationSettings(settings.animations);
    this.setPollingInterval(settings.pollingInterval);
    this.setImageQuality(settings.imageQuality);
    
    console.log('Performance mode changed to:', mode);
    this.onModeChange?.(mode, settings);
  }
  
  getModeSettings(mode) {
    const modes = {
      high: {
        animations: true,
        pollingInterval: 5000,
        imageQuality: 'high',
        description: 'High Performance'
      },
      normal: {
        animations: true,
        pollingInterval: 10000,
        imageQuality: 'high',
        description: 'Normal Mode'
      },
      balanced: {
        animations: true,
        pollingInterval: 30000,
        imageQuality: 'medium',
        description: 'Balanced Mode'
      },
      'power-save': {
        animations: false,
        pollingInterval: 60000,
        imageQuality: 'low',
        description: 'Power Save Mode'
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
    // Update polling interval
    window.dispatchEvent(new CustomEvent('polling-interval-change', {
      detail: { interval }
    }));
  }
  
  setImageQuality(quality) {
    // Set image quality
    document.documentElement.dataset.imageQuality = quality;
  }
}

// Usage
const adaptivePerf = new AdaptivePerformance();

adaptivePerf.onModeChange = (mode, settings) => {
  console.log('Mode:', settings.description);
  updateUIForMode(mode);
};

adaptivePerf.init();
```

### Battery Status Indicator

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
    
    // Initial update
    this.update(this.manager.getStatus());
    
    // Listen for changes
    this.manager.onChange((status) => {
      this.update(status);
    });
  }
  
  update(status) {
    const levelEl = this.element.querySelector('.battery-level');
    const textEl = this.element.querySelector('.battery-text');
    const chargingEl = this.element.querySelector('.charging-icon');
    const bodyEl = this.element.querySelector('.battery-body');
    
    // Update level bar
    levelEl.style.width = status.levelPercent + '%';
    
    // Update text
    textEl.textContent = status.levelPercent + '%';
    
    // Update charging icon
    chargingEl.style.display = status.charging ? 'block' : 'none';
    
    // Update colors
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

// CSS styles
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

// Usage
const indicator = new BatteryIndicator(document.getElementById('header'));
indicator.init();
```

### Smart Download Manager

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
        console.log('Charging, resuming download queue');
        this.processQueue();
      }
    });
  }
  
  handleBatteryChange(status) {
    if (!status.charging && 
        status.level <= this.settings.lowBatteryThreshold && 
        this.settings.pauseOnLowBattery) {
      this.pauseAll();
      console.log('Battery too low, pausing all downloads');
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
    
    // Check battery
    const status = this.manager.getStatus();
    if (status && 
        !status.charging && 
        status.level <= this.settings.lowBatteryThreshold &&
        this.settings.pauseOnLowBattery) {
      console.log('Battery too low, waiting for charge');
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
        
        // Check if should pause
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

// Usage
const downloadManager = new SmartDownloadManager();
downloadManager.init();

// Add download
downloadManager.add('/files/large-file.zip');
```

## Best Practices Summary

```
Battery Status API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Power Saving Strategies                           │
│   ├── Reduce animations on low battery            │
│   ├── Lower polling frequency                      │
│   ├── Defer non-urgent background tasks           │
│   └── Use lower quality images/video               │
│                                                     │
│   User Experience                                   │
│   ├── Display battery status indicator             │
│   ├── Warn on low battery                          │
│   ├── Provide manual performance toggle            │
│   └── Resume features when charging                │
│                                                     │
│   Privacy Considerations                            │
│   ├── API may be restricted for privacy           │
│   ├── Only use when necessary                      │
│   ├── Don't use battery info for tracking         │
│   └── Provide graceful fallback                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Battery Range | Recommended Strategy |
|---------------|---------------------|
| > 50% | Normal mode |
| 20-50% | Balanced mode |
| 10-20% | Power save mode |
| < 10% | Emergency mode |

---

*Use the Battery Status API responsibly for battery-aware user experiences.*
