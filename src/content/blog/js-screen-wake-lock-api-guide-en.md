---
title: 'JavaScript Screen Wake Lock API Complete Guide'
description: 'Master screen wake lock: prevent screen sleep, reading mode, video playback, and navigation applications'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'js-screen-wake-lock-api-guide'
---

The Screen Wake Lock API allows web pages to prevent the device screen from entering sleep mode. This article covers its usage and practical applications.

## Basic Concepts

### Detecting Support

```javascript
// Check API support
if ('wakeLock' in navigator) {
  console.log('Screen Wake Lock API is supported');
} else {
  console.log('Screen Wake Lock API is not supported');
}
```

### Requesting Wake Lock

```javascript
// Request screen wake lock
async function requestWakeLock() {
  try {
    const wakeLock = await navigator.wakeLock.request('screen');
    console.log('Wake lock activated');
    return wakeLock;
  } catch (error) {
    console.error('Could not activate wake lock:', error.message);
    return null;
  }
}

// Usage example
let wakeLock = null;

document.getElementById('start-btn').addEventListener('click', async () => {
  wakeLock = await requestWakeLock();
});
```

### Releasing Wake Lock

```javascript
// Release wake lock
async function releaseWakeLock(wakeLock) {
  if (wakeLock) {
    await wakeLock.release();
    console.log('Wake lock released');
  }
}

// Usage example
document.getElementById('stop-btn').addEventListener('click', async () => {
  await releaseWakeLock(wakeLock);
  wakeLock = null;
});
```

### Listening for Release Events

```javascript
async function requestWakeLock() {
  try {
    const wakeLock = await navigator.wakeLock.request('screen');
    
    // Listen for release event
    wakeLock.addEventListener('release', () => {
      console.log('Wake lock was released');
      // Possible reasons:
      // 1. Called release()
      // 2. Page became hidden
      // 3. Low battery
    });
    
    console.log('Wake lock activated');
    return wakeLock;
  } catch (error) {
    console.error('Could not activate wake lock:', error);
    return null;
  }
}
```

## Wake Lock Manager

### Wrapper Class

```javascript
class WakeLockManager {
  constructor() {
    this.wakeLock = null;
    this.isSupported = 'wakeLock' in navigator;
    this.listeners = new Set();
    
    // Auto-reacquire when page becomes visible
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  }
  
  get isActive() {
    return this.wakeLock !== null && !this.wakeLock.released;
  }
  
  async request() {
    if (!this.isSupported) {
      console.warn('Screen Wake Lock API not supported');
      return false;
    }
    
    if (this.isActive) {
      console.log('Wake lock already active');
      return true;
    }
    
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      
      this.wakeLock.addEventListener('release', () => {
        this.notify('release');
      });
      
      this.notify('acquire');
      console.log('Wake lock activated');
      return true;
    } catch (error) {
      console.error('Failed to request wake lock:', error);
      this.notify('error', error);
      return false;
    }
  }
  
  async release() {
    if (!this.isActive) return;
    
    try {
      await this.wakeLock.release();
      this.wakeLock = null;
      console.log('Wake lock released');
    } catch (error) {
      console.error('Failed to release wake lock:', error);
    }
  }
  
  async handleVisibilityChange() {
    if (document.visibilityState === 'visible' && this.wakeLock?.released) {
      // Re-request wake lock when page becomes visible
      console.log('Page visible, re-requesting wake lock');
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

// Usage
const wakeLockManager = new WakeLockManager();

wakeLockManager.onChange((event, data) => {
  switch (event) {
    case 'acquire':
      console.log('Wake lock acquired');
      break;
    case 'release':
      console.log('Wake lock released');
      break;
    case 'error':
      console.error('Wake lock error:', data);
      break;
  }
});

// Request wake lock
wakeLockManager.request();
```

### Auto-managed Wake Lock

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

// Usage
const autoWakeLock = new AutoWakeLock({ autoReacquire: true });

// Enable (will auto-reacquire when page becomes visible)
autoWakeLock.enable();

// Disable
// autoWakeLock.disable();
```

## Practical Applications

### Reading Mode

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
    
    // Save scroll position
    this.scrollPosition = window.scrollY;
    
    // Apply reading mode styles
    document.body.classList.add('reading-mode');
    
    // Hide unnecessary elements
    this.hideElements();
    
    console.log('Reading mode enabled');
  }
  
  async disable() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    await this.wakeLock.disable();
    
    // Remove reading mode styles
    document.body.classList.remove('reading-mode');
    
    // Restore elements
    this.showElements();
    
    console.log('Reading mode disabled');
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

// Usage
const readingMode = new ReadingMode();

document.getElementById('reading-mode-btn').addEventListener('click', () => {
  readingMode.toggle();
});
```

### Video Player

```javascript
class VideoPlayerWithWakeLock {
  constructor(videoElement) {
    this.video = videoElement;
    this.wakeLock = new AutoWakeLock();
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Activate wake lock on play
    this.video.addEventListener('play', () => {
      this.enableWakeLock();
    });
    
    // Release on pause or end
    this.video.addEventListener('pause', () => {
      this.disableWakeLock();
    });
    
    this.video.addEventListener('ended', () => {
      this.disableWakeLock();
    });
    
    // Ensure wake lock is active in fullscreen
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement && !this.video.paused) {
        this.enableWakeLock();
      }
    });
  }
  
  async enableWakeLock() {
    const success = await this.wakeLock.enable();
    if (success) {
      console.log('Video playing, screen will stay awake');
    }
  }
  
  async disableWakeLock() {
    await this.wakeLock.disable();
    console.log('Video paused/ended, screen can sleep');
  }
}

// Usage
const video = document.getElementById('video');
const player = new VideoPlayerWithWakeLock(video);
```

### Navigation App

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
    
    // Enable wake lock
    await this.wakeLock.enable();
    
    // Start position tracking
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.updatePosition(position);
      },
      (error) => {
        console.error('Position error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0
      }
    );
    
    console.log('Navigation started, screen will stay awake');
  }
  
  async stopNavigation() {
    this.isNavigating = false;
    this.route = null;
    
    // Stop position tracking
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    // Release wake lock
    await this.wakeLock.disable();
    
    console.log('Navigation ended');
  }
  
  updatePosition(position) {
    if (!this.isNavigating) return;
    
    const { latitude, longitude } = position.coords;
    
    // Update map position
    this.updateMap(latitude, longitude);
    
    // Check if arrived at destination
    if (this.hasArrived(latitude, longitude)) {
      this.onArrival();
    }
  }
  
  updateMap(lat, lng) {
    // Update map display
    console.log('Current position:', lat, lng);
  }
  
  hasArrived(lat, lng) {
    if (!this.route?.destination) return false;
    
    const distance = this.calculateDistance(
      lat, lng,
      this.route.destination.lat,
      this.route.destination.lng
    );
    
    return distance < 50; // Within 50 meters is considered arrived
  }
  
  onArrival() {
    console.log('You have arrived!');
    this.stopNavigation();
    
    // Play notification sound
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
    // Play arrival notification sound
  }
}

// Usage
const navigation = new NavigationApp();

// Start navigation
navigation.startNavigation({
  destination: { lat: 40.7128, lng: -74.0060 }
});
```

### Presentation Mode

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
    
    // Activate wake lock
    await this.wakeLock.enable();
    
    // Enter fullscreen
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    }
    
    // Hide mouse cursor
    document.body.style.cursor = 'none';
    
    // Listen for fullscreen exit
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        this.stop();
      }
    });
    
    console.log('Presentation mode started');
  }
  
  async stop() {
    if (!this.isPresenting) return;
    
    this.isPresenting = false;
    
    // Release wake lock
    await this.wakeLock.disable();
    
    // Exit fullscreen
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    
    // Restore mouse cursor
    document.body.style.cursor = '';
    
    console.log('Presentation mode ended');
  }
}

// Usage
const presentation = new PresentationMode();

document.getElementById('present-btn').addEventListener('click', () => {
  presentation.start(document.getElementById('slides'));
});
```

### Timer Application

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
    
    // Activate wake lock
    await this.wakeLock.enable();
    
    this.timerId = setInterval(() => {
      this.tick();
    }, 1000);
    
    console.log('Timer started, screen will stay awake');
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
    
    // Release wake lock
    await this.wakeLock.disable();
    
    // Play alarm sound
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
    // Play alarm sound
    const audio = new Audio('/sounds/alarm.mp3');
    audio.play();
  }
}

// Usage
const timer = new TimerWithWakeLock();

timer.onTick = (remaining, formatted) => {
  document.getElementById('timer-display').textContent = formatted;
};

timer.onComplete = () => {
  alert('Time is up!');
};

// Start 5 minute countdown
timer.start(300);
```

## Best Practices Summary

```
Screen Wake Lock API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Use Cases                                         │
│   ├── Video/audio playback                         │
│   ├── Navigation apps                              │
│   ├── Reading mode                                 │
│   ├── Timers/alarms                                │
│   └── Presentations/slideshows                     │
│                                                     │
│   Battery Management                                │
│   ├── Only request when needed                     │
│   ├── Release immediately when not needed          │
│   ├── Handle release events for edge cases         │
│   └── Auto-release when page hidden                │
│                                                     │
│   User Experience                                   │
│   ├── Inform user screen stays awake              │
│   ├── Provide manual control option                │
│   ├── Auto-reacquire when page visible            │
│   └── Graceful fallback for unsupported browsers  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Need Wake Lock? |
|----------|----------------|
| Video playback | Yes |
| Music playback (background) | No (audio already prevents sleep) |
| Reading long articles | Yes |
| Map navigation | Yes |
| Normal browsing | No |

---

*Use the Screen Wake Lock API wisely to keep the screen awake when needed.*
