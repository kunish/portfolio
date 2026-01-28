---
title: 'JavaScript Device Orientation API Complete Guide'
description: 'Master device orientation detection: gyroscope data, 3D interactions, VR/AR applications, and motion-controlled games'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'js-device-orientation-api-guide'
---

The Device Orientation API allows web pages to access the physical orientation data of a device. This article covers its usage and practical applications.

## Basic Concepts

### Orientation Coordinate System

```javascript
// Three angles of device orientation:
// alpha (α): 0-360 degrees, rotation around Z-axis (compass direction)
// beta (β): -180 to 180 degrees, rotation around X-axis (front-back tilt)
// gamma (γ): -90 to 90 degrees, rotation around Y-axis (left-right tilt)

window.addEventListener('deviceorientation', (event) => {
  console.log('Alpha (Z-axis):', event.alpha); // Compass heading
  console.log('Beta (X-axis):', event.beta);   // Front-back tilt
  console.log('Gamma (Y-axis):', event.gamma); // Left-right tilt
  console.log('Absolute:', event.absolute);    // Is absolute value
});
```

### Requesting Permission (iOS 13+)

```javascript
// iOS 13+ requires user authorization
async function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission === 'granted') {
        console.log('Permission granted');
        return true;
      } else {
        console.log('Permission denied');
        return false;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }
  // Non-iOS devices have default support
  return true;
}

// Usage example
document.getElementById('start-btn').addEventListener('click', async () => {
  const granted = await requestOrientationPermission();
  if (granted) {
    startOrientationTracking();
  }
});
```

### Device Motion Data

```javascript
// Acceleration and rotation rate
window.addEventListener('devicemotion', (event) => {
  // Acceleration (including gravity)
  const accWithGravity = event.accelerationIncludingGravity;
  console.log('Acceleration (with gravity):', accWithGravity.x, accWithGravity.y, accWithGravity.z);
  
  // Acceleration (excluding gravity)
  const acc = event.acceleration;
  if (acc) {
    console.log('Acceleration:', acc.x, acc.y, acc.z);
  }
  
  // Rotation rate (degrees/second)
  const rotation = event.rotationRate;
  if (rotation) {
    console.log('Rotation rate:', rotation.alpha, rotation.beta, rotation.gamma);
  }
  
  // Data update interval (milliseconds)
  console.log('Interval:', event.interval);
});
```

## Orientation Manager

### Wrapper Class

```javascript
class OrientationManager {
  constructor() {
    this.orientation = { alpha: 0, beta: 0, gamma: 0 };
    this.motion = { x: 0, y: 0, z: 0 };
    this.listeners = new Set();
    this.isTracking = false;
    
    this.handleOrientation = this.handleOrientation.bind(this);
    this.handleMotion = this.handleMotion.bind(this);
  }
  
  get isSupported() {
    return 'DeviceOrientationEvent' in window;
  }
  
  get needsPermission() {
    return typeof DeviceOrientationEvent.requestPermission === 'function';
  }
  
  async requestPermission() {
    if (!this.needsPermission) return true;
    
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  
  async start() {
    if (!this.isSupported) {
      console.warn('Device Orientation API not supported');
      return false;
    }
    
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('Permission not granted');
      return false;
    }
    
    window.addEventListener('deviceorientation', this.handleOrientation);
    window.addEventListener('devicemotion', this.handleMotion);
    this.isTracking = true;
    
    return true;
  }
  
  stop() {
    window.removeEventListener('deviceorientation', this.handleOrientation);
    window.removeEventListener('devicemotion', this.handleMotion);
    this.isTracking = false;
  }
  
  handleOrientation(event) {
    this.orientation = {
      alpha: event.alpha || 0,
      beta: event.beta || 0,
      gamma: event.gamma || 0,
      absolute: event.absolute
    };
    
    this.notify('orientation', this.orientation);
  }
  
  handleMotion(event) {
    const acc = event.accelerationIncludingGravity || {};
    this.motion = {
      x: acc.x || 0,
      y: acc.y || 0,
      z: acc.z || 0
    };
    
    this.notify('motion', this.motion);
  }
  
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notify(type, data) {
    this.listeners.forEach(callback => callback(type, data));
  }
}

// Usage
const orientation = new OrientationManager();

orientation.onChange((type, data) => {
  if (type === 'orientation') {
    console.log('Orientation:', data);
  } else if (type === 'motion') {
    console.log('Motion:', data);
  }
});

await orientation.start();
```

### Smooth Processing

```javascript
class SmoothOrientationManager extends OrientationManager {
  constructor(smoothing = 0.1) {
    super();
    this.smoothing = smoothing;
    this.smoothedOrientation = { alpha: 0, beta: 0, gamma: 0 };
  }
  
  handleOrientation(event) {
    const raw = {
      alpha: event.alpha || 0,
      beta: event.beta || 0,
      gamma: event.gamma || 0
    };
    
    // Low-pass filter smoothing
    this.smoothedOrientation = {
      alpha: this.lerp(this.smoothedOrientation.alpha, raw.alpha, this.smoothing),
      beta: this.lerp(this.smoothedOrientation.beta, raw.beta, this.smoothing),
      gamma: this.lerp(this.smoothedOrientation.gamma, raw.gamma, this.smoothing)
    };
    
    this.orientation = this.smoothedOrientation;
    this.notify('orientation', this.orientation);
  }
  
  lerp(current, target, factor) {
    // Handle angle wrapping (alpha from 360 to 0)
    if (Math.abs(target - current) > 180) {
      if (target > current) {
        current += 360;
      } else {
        target += 360;
      }
    }
    
    let result = current + (target - current) * factor;
    
    // Normalize to 0-360
    while (result < 0) result += 360;
    while (result >= 360) result -= 360;
    
    return result;
  }
  
  setSmoothingFactor(factor) {
    this.smoothing = Math.max(0.01, Math.min(1, factor));
  }
}

// Usage
const smoothOrientation = new SmoothOrientationManager(0.15);
```

## Practical Applications

### 3D Parallax Effect

```javascript
class ParallaxEffect {
  constructor(element, options = {}) {
    this.element = element;
    this.maxTilt = options.maxTilt || 20;
    this.perspective = options.perspective || 1000;
    this.orientation = new SmoothOrientationManager(0.1);
    
    this.element.style.transformStyle = 'preserve-3d';
    this.element.parentElement.style.perspective = `${this.perspective}px`;
  }
  
  async start() {
    const started = await this.orientation.start();
    if (!started) return false;
    
    this.orientation.onChange((type, data) => {
      if (type === 'orientation') {
        this.updateTransform(data);
      }
    });
    
    return true;
  }
  
  updateTransform(orientation) {
    // Map beta and gamma to tilt angles
    const tiltX = this.clamp(orientation.beta, -this.maxTilt, this.maxTilt);
    const tiltY = this.clamp(orientation.gamma, -this.maxTilt, this.maxTilt);
    
    this.element.style.transform = `
      rotateX(${-tiltX}deg)
      rotateY(${tiltY}deg)
    `;
  }
  
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  stop() {
    this.orientation.stop();
    this.element.style.transform = '';
  }
}

// Usage
const card = document.querySelector('.parallax-card');
const parallax = new ParallaxEffect(card, { maxTilt: 15 });

document.getElementById('enable-parallax').addEventListener('click', () => {
  parallax.start();
});
```

### Compass

```javascript
class Compass {
  constructor(element) {
    this.element = element;
    this.needle = element.querySelector('.needle');
    this.heading = 0;
    this.orientation = new SmoothOrientationManager(0.2);
  }
  
  async start() {
    const started = await this.orientation.start();
    if (!started) {
      this.showError('Cannot access device orientation');
      return false;
    }
    
    this.orientation.onChange((type, data) => {
      if (type === 'orientation') {
        this.updateHeading(data.alpha);
      }
    });
    
    return true;
  }
  
  updateHeading(alpha) {
    // alpha is the direction the device top points to
    // 0 = North, 90 = East, 180 = South, 270 = West
    this.heading = alpha;
    
    // Rotate needle to point north
    this.needle.style.transform = `rotate(${-alpha}deg)`;
    
    // Update direction text
    this.updateDirectionText();
  }
  
  updateDirectionText() {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(this.heading / 45) % 8;
    
    const textElement = this.element.querySelector('.direction-text');
    if (textElement) {
      textElement.textContent = `${directions[index]} ${Math.round(this.heading)}°`;
    }
  }
  
  showError(message) {
    const errorElement = this.element.querySelector('.error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }
  
  stop() {
    this.orientation.stop();
  }
}

// Usage
const compass = new Compass(document.getElementById('compass'));
compass.start();
```

### Spirit Level

```javascript
class LevelTool {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    this.bubbleRadius = 20;
    this.areaRadius = 80;
    
    this.orientation = new SmoothOrientationManager(0.15);
    this.isLevel = false;
    this.threshold = 2; // Within 2 degrees is level
  }
  
  async start() {
    const started = await this.orientation.start();
    if (!started) return false;
    
    this.orientation.onChange((type, data) => {
      if (type === 'orientation') {
        this.update(data.beta, data.gamma);
      }
    });
    
    return true;
  }
  
  update(beta, gamma) {
    // Limit range
    const x = Math.max(-45, Math.min(45, gamma));
    const y = Math.max(-45, Math.min(45, beta));
    
    // Calculate bubble position
    const bubbleX = this.centerX + (x / 45) * this.areaRadius;
    const bubbleY = this.centerY + (y / 45) * this.areaRadius;
    
    // Check if level
    this.isLevel = Math.abs(x) < this.threshold && Math.abs(y) < this.threshold;
    
    this.draw(bubbleX, bubbleY);
  }
  
  draw(bubbleX, bubbleY) {
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw outer circle
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.areaRadius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw center crosshair
    ctx.beginPath();
    ctx.moveTo(this.centerX - 15, this.centerY);
    ctx.lineTo(this.centerX + 15, this.centerY);
    ctx.moveTo(this.centerX, this.centerY - 15);
    ctx.lineTo(this.centerX, this.centerY + 15);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw bubble
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, this.bubbleRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.isLevel ? '#4CAF50' : '#FF5722';
    ctx.fill();
    
    // Draw bubble highlight
    ctx.beginPath();
    ctx.arc(bubbleX - 5, bubbleY - 5, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
    
    // Display status text
    ctx.font = '16px Arial';
    ctx.fillStyle = this.isLevel ? '#4CAF50' : '#333';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.isLevel ? 'Level' : 'Tilted',
      this.centerX,
      this.centerY + this.areaRadius + 40
    );
  }
  
  stop() {
    this.orientation.stop();
  }
}

// Usage
const canvas = document.getElementById('level-canvas');
const level = new LevelTool(canvas);
level.start();
```

### Motion-Controlled Game

```javascript
class TiltController {
  constructor(options = {}) {
    this.sensitivity = options.sensitivity || 1;
    this.deadzone = options.deadzone || 5;
    this.maxAngle = options.maxAngle || 45;
    
    this.orientation = new SmoothOrientationManager(0.2);
    this.position = { x: 0, y: 0 };
    this.onMove = null;
  }
  
  async start() {
    const started = await this.orientation.start();
    if (!started) return false;
    
    this.orientation.onChange((type, data) => {
      if (type === 'orientation') {
        this.processInput(data.beta, data.gamma);
      }
    });
    
    return true;
  }
  
  processInput(beta, gamma) {
    // Apply deadzone
    let x = Math.abs(gamma) < this.deadzone ? 0 : gamma;
    let y = Math.abs(beta) < this.deadzone ? 0 : beta;
    
    // Normalize to -1 to 1
    x = this.clamp(x / this.maxAngle, -1, 1) * this.sensitivity;
    y = this.clamp(y / this.maxAngle, -1, 1) * this.sensitivity;
    
    this.position = { x, y };
    this.onMove?.(this.position);
  }
  
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  calibrate() {
    // Set current position as center
    // Implement calibration logic...
  }
  
  stop() {
    this.orientation.stop();
  }
}

// Example: Control game character
class TiltGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.playerX = canvas.width / 2;
    this.playerY = canvas.height / 2;
    this.playerSize = 30;
    this.speed = 5;
    
    this.controller = new TiltController({
      sensitivity: 1.5,
      deadzone: 3,
      maxAngle: 30
    });
    
    this.isRunning = false;
  }
  
  async start() {
    const started = await this.controller.start();
    if (!started) return;
    
    this.controller.onMove = (position) => {
      this.updatePlayer(position);
    };
    
    this.isRunning = true;
    this.gameLoop();
  }
  
  updatePlayer(position) {
    this.playerX += position.x * this.speed;
    this.playerY += position.y * this.speed;
    
    // Boundary detection
    this.playerX = Math.max(this.playerSize, Math.min(this.canvas.width - this.playerSize, this.playerX));
    this.playerY = Math.max(this.playerSize, Math.min(this.canvas.height - this.playerSize, this.playerY));
  }
  
  gameLoop() {
    if (!this.isRunning) return;
    
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
  
  draw() {
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw player
    ctx.beginPath();
    ctx.arc(this.playerX, this.playerY, this.playerSize, 0, Math.PI * 2);
    ctx.fillStyle = '#e94560';
    ctx.fill();
  }
  
  stop() {
    this.isRunning = false;
    this.controller.stop();
  }
}

// Usage
const game = new TiltGame(document.getElementById('game-canvas'));

document.getElementById('start-game').addEventListener('click', () => {
  game.start();
});
```

### Panorama Viewer

```javascript
class PanoramaViewer {
  constructor(container, imageUrl) {
    this.container = container;
    this.imageUrl = imageUrl;
    this.orientation = new SmoothOrientationManager(0.1);
    
    this.viewX = 0;
    this.viewY = 0;
    this.fov = 75; // Field of view
    
    this.init();
  }
  
  init() {
    this.img = new Image();
    this.img.onload = () => {
      this.imageWidth = this.img.width;
      this.imageHeight = this.img.height;
      this.draw();
    };
    this.img.src = this.imageUrl;
  }
  
  async start() {
    const started = await this.orientation.start();
    if (!started) return false;
    
    this.orientation.onChange((type, data) => {
      if (type === 'orientation') {
        this.updateView(data);
      }
    });
    
    return true;
  }
  
  updateView(orientation) {
    // Use alpha for horizontal view
    // Use beta for vertical view
    this.viewX = (orientation.alpha / 360) * this.imageWidth;
    this.viewY = ((orientation.beta + 90) / 180) * this.imageHeight;
    
    // Limit vertical range
    const viewHeight = this.container.clientHeight;
    this.viewY = Math.max(0, Math.min(this.imageHeight - viewHeight, this.viewY));
    
    this.draw();
  }
  
  draw() {
    const viewWidth = this.container.clientWidth;
    const viewHeight = this.container.clientHeight;
    
    // Set background position for panorama viewing
    this.container.style.backgroundImage = `url(${this.imageUrl})`;
    this.container.style.backgroundPosition = `-${this.viewX}px -${this.viewY}px`;
    this.container.style.backgroundSize = `${this.imageWidth}px ${this.imageHeight}px`;
  }
  
  stop() {
    this.orientation.stop();
  }
}

// Usage
const viewer = new PanoramaViewer(
  document.getElementById('panorama'),
  '/images/panorama.jpg'
);

viewer.start();
```

### Shake Detection

```javascript
class ShakeDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 15;
    this.timeout = options.timeout || 1000;
    this.onShake = null;
    
    this.lastX = null;
    this.lastY = null;
    this.lastZ = null;
    this.lastShakeTime = 0;
    
    this.handleMotion = this.handleMotion.bind(this);
  }
  
  get isSupported() {
    return 'DeviceMotionEvent' in window;
  }
  
  async requestPermission() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        return permission === 'granted';
      } catch {
        return false;
      }
    }
    return true;
  }
  
  async start() {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return false;
    
    window.addEventListener('devicemotion', this.handleMotion);
    return true;
  }
  
  stop() {
    window.removeEventListener('devicemotion', this.handleMotion);
  }
  
  handleMotion(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const { x, y, z } = acc;
    
    if (this.lastX !== null) {
      const deltaX = Math.abs(x - this.lastX);
      const deltaY = Math.abs(y - this.lastY);
      const deltaZ = Math.abs(z - this.lastZ);
      
      const totalDelta = deltaX + deltaY + deltaZ;
      
      if (totalDelta > this.threshold) {
        const now = Date.now();
        if (now - this.lastShakeTime > this.timeout) {
          this.lastShakeTime = now;
          this.onShake?.({ deltaX, deltaY, deltaZ, total: totalDelta });
        }
      }
    }
    
    this.lastX = x;
    this.lastY = y;
    this.lastZ = z;
  }
}

// Usage
const shakeDetector = new ShakeDetector({
  threshold: 20,
  timeout: 500
});

shakeDetector.onShake = (data) => {
  console.log('Shake detected!', data);
  // Perform shake action
  performShakeAction();
};

shakeDetector.start();
```

## Best Practices Summary

```
Device Orientation API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Permission Handling                               │
│   ├── iOS 13+ requires user authorization          │
│   ├── Request permission during user interaction   │
│   ├── Handle permission denial gracefully          │
│   └── Provide non-orientation fallback             │
│                                                     │
│   Data Processing                                   │
│   ├── Use low-pass filter for smoothing            │
│   ├── Handle angle wrapping issues                 │
│   ├── Set appropriate deadzone                     │
│   └── Consider device differences                  │
│                                                     │
│   Performance Optimization                          │
│   ├── Throttle high-frequency events               │
│   ├── Stop listening when not in use               │
│   ├── Use requestAnimationFrame for UI updates     │
│   └── Avoid complex calculations in handlers       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Event | Data | Use Case |
|-------|------|----------|
| deviceorientation | alpha, beta, gamma | Device direction |
| devicemotion | acceleration, rotationRate | Motion detection |
| deviceorientationabsolute | Absolute orientation | Compass |

---

*Master the Device Orientation API to create immersive interactive experiences.*
