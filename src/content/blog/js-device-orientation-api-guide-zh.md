---
title: 'JavaScript Device Orientation API 完全指南'
description: '掌握设备方向检测：陀螺仪数据获取、3D交互、VR/AR应用与体感游戏开发'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'js-device-orientation-api-guide'
---

Device Orientation API 允许网页获取设备的物理方向数据。本文详解其使用方法和实战应用。

## 基础概念

### 方向坐标系

```javascript
// 设备方向的三个角度：
// alpha (α): 0-360度，设备绕 Z 轴旋转（指南针方向）
// beta (β): -180到180度，设备绕 X 轴旋转（前后倾斜）
// gamma (γ): -90到90度，设备绕 Y 轴旋转（左右倾斜）

window.addEventListener('deviceorientation', (event) => {
  console.log('Alpha (Z轴):', event.alpha); // 方向角
  console.log('Beta (X轴):', event.beta);   // 前后倾斜
  console.log('Gamma (Y轴):', event.gamma); // 左右倾斜
  console.log('绝对值:', event.absolute);   // 是否为绝对值
});
```

### 请求权限（iOS 13+）

```javascript
// iOS 13+ 需要用户授权
async function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission === 'granted') {
        console.log('权限已授予');
        return true;
      } else {
        console.log('权限被拒绝');
        return false;
      }
    } catch (error) {
      console.error('请求权限失败:', error);
      return false;
    }
  }
  // 非 iOS 设备默认支持
  return true;
}

// 使用示例
document.getElementById('start-btn').addEventListener('click', async () => {
  const granted = await requestOrientationPermission();
  if (granted) {
    startOrientationTracking();
  }
});
```

### 设备运动数据

```javascript
// 加速度和旋转速率
window.addEventListener('devicemotion', (event) => {
  // 加速度（包含重力）
  const accWithGravity = event.accelerationIncludingGravity;
  console.log('加速度(含重力):', accWithGravity.x, accWithGravity.y, accWithGravity.z);
  
  // 加速度（不含重力）
  const acc = event.acceleration;
  if (acc) {
    console.log('加速度:', acc.x, acc.y, acc.z);
  }
  
  // 旋转速率（度/秒）
  const rotation = event.rotationRate;
  if (rotation) {
    console.log('旋转速率:', rotation.alpha, rotation.beta, rotation.gamma);
  }
  
  // 数据更新间隔（毫秒）
  console.log('间隔:', event.interval);
});
```

## 方向管理器

### 封装类

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
      console.warn('设备不支持 Device Orientation API');
      return false;
    }
    
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('未获得权限');
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

// 使用
const orientation = new OrientationManager();

orientation.onChange((type, data) => {
  if (type === 'orientation') {
    console.log('方向:', data);
  } else if (type === 'motion') {
    console.log('运动:', data);
  }
});

await orientation.start();
```

### 平滑处理

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
    
    // 低通滤波平滑
    this.smoothedOrientation = {
      alpha: this.lerp(this.smoothedOrientation.alpha, raw.alpha, this.smoothing),
      beta: this.lerp(this.smoothedOrientation.beta, raw.beta, this.smoothing),
      gamma: this.lerp(this.smoothedOrientation.gamma, raw.gamma, this.smoothing)
    };
    
    this.orientation = this.smoothedOrientation;
    this.notify('orientation', this.orientation);
  }
  
  lerp(current, target, factor) {
    // 处理角度环绕（alpha 从 360 到 0）
    if (Math.abs(target - current) > 180) {
      if (target > current) {
        current += 360;
      } else {
        target += 360;
      }
    }
    
    let result = current + (target - current) * factor;
    
    // 归一化到 0-360
    while (result < 0) result += 360;
    while (result >= 360) result -= 360;
    
    return result;
  }
  
  setSmoothingFactor(factor) {
    this.smoothing = Math.max(0.01, Math.min(1, factor));
  }
}

// 使用
const smoothOrientation = new SmoothOrientationManager(0.15);
```

## 实际应用

### 3D 视差效果

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
    // 将 beta 和 gamma 映射到倾斜角度
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

// 使用
const card = document.querySelector('.parallax-card');
const parallax = new ParallaxEffect(card, { maxTilt: 15 });

document.getElementById('enable-parallax').addEventListener('click', () => {
  parallax.start();
});
```

### 指南针

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
      this.showError('无法访问设备方向');
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
    // alpha 是设备顶部指向的方向
    // 0 = 北, 90 = 东, 180 = 南, 270 = 西
    this.heading = alpha;
    
    // 旋转指针指向北方
    this.needle.style.transform = `rotate(${-alpha}deg)`;
    
    // 更新方向文字
    this.updateDirectionText();
  }
  
  updateDirectionText() {
    const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
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

// 使用
const compass = new Compass(document.getElementById('compass'));
compass.start();
```

### 水平仪

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
    this.threshold = 2; // 2度内视为水平
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
    // 限制范围
    const x = Math.max(-45, Math.min(45, gamma));
    const y = Math.max(-45, Math.min(45, beta));
    
    // 计算气泡位置
    const bubbleX = this.centerX + (x / 45) * this.areaRadius;
    const bubbleY = this.centerY + (y / 45) * this.areaRadius;
    
    // 检查是否水平
    this.isLevel = Math.abs(x) < this.threshold && Math.abs(y) < this.threshold;
    
    this.draw(bubbleX, bubbleY);
  }
  
  draw(bubbleX, bubbleY) {
    const ctx = this.ctx;
    
    // 清除画布
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制外圈
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.areaRadius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 绘制中心十字
    ctx.beginPath();
    ctx.moveTo(this.centerX - 15, this.centerY);
    ctx.lineTo(this.centerX + 15, this.centerY);
    ctx.moveTo(this.centerX, this.centerY - 15);
    ctx.lineTo(this.centerX, this.centerY + 15);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制气泡
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, this.bubbleRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.isLevel ? '#4CAF50' : '#FF5722';
    ctx.fill();
    
    // 绘制气泡高光
    ctx.beginPath();
    ctx.arc(bubbleX - 5, bubbleY - 5, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
    
    // 显示状态文字
    ctx.font = '16px Arial';
    ctx.fillStyle = this.isLevel ? '#4CAF50' : '#333';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.isLevel ? '水平' : '倾斜',
      this.centerX,
      this.centerY + this.areaRadius + 40
    );
  }
  
  stop() {
    this.orientation.stop();
  }
}

// 使用
const canvas = document.getElementById('level-canvas');
const level = new LevelTool(canvas);
level.start();
```

### 体感游戏控制

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
    // 应用死区
    let x = Math.abs(gamma) < this.deadzone ? 0 : gamma;
    let y = Math.abs(beta) < this.deadzone ? 0 : beta;
    
    // 归一化到 -1 到 1
    x = this.clamp(x / this.maxAngle, -1, 1) * this.sensitivity;
    y = this.clamp(y / this.maxAngle, -1, 1) * this.sensitivity;
    
    this.position = { x, y };
    this.onMove?.(this.position);
  }
  
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  calibrate() {
    // 将当前位置设为中心
    // 实现校准逻辑...
  }
  
  stop() {
    this.orientation.stop();
  }
}

// 使用示例：控制游戏角色
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
    
    // 边界检测
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
    
    // 清除画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制玩家
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

// 使用
const game = new TiltGame(document.getElementById('game-canvas'));

document.getElementById('start-game').addEventListener('click', () => {
  game.start();
});
```

### 全景图查看器

```javascript
class PanoramaViewer {
  constructor(container, imageUrl) {
    this.container = container;
    this.imageUrl = imageUrl;
    this.orientation = new SmoothOrientationManager(0.1);
    
    this.viewX = 0;
    this.viewY = 0;
    this.fov = 75; // 视场角
    
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
    // 使用 alpha 控制水平视角
    // 使用 beta 控制垂直视角
    this.viewX = (orientation.alpha / 360) * this.imageWidth;
    this.viewY = ((orientation.beta + 90) / 180) * this.imageHeight;
    
    // 限制垂直范围
    const viewHeight = this.container.clientHeight;
    this.viewY = Math.max(0, Math.min(this.imageHeight - viewHeight, this.viewY));
    
    this.draw();
  }
  
  draw() {
    const viewWidth = this.container.clientWidth;
    const viewHeight = this.container.clientHeight;
    
    // 设置背景位置模拟全景查看
    this.container.style.backgroundImage = `url(${this.imageUrl})`;
    this.container.style.backgroundPosition = `-${this.viewX}px -${this.viewY}px`;
    this.container.style.backgroundSize = `${this.imageWidth}px ${this.imageHeight}px`;
  }
  
  stop() {
    this.orientation.stop();
  }
}

// 使用
const viewer = new PanoramaViewer(
  document.getElementById('panorama'),
  '/images/panorama.jpg'
);

viewer.start();
```

### 摇晃检测

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

// 使用
const shakeDetector = new ShakeDetector({
  threshold: 20,
  timeout: 500
});

shakeDetector.onShake = (data) => {
  console.log('检测到摇晃！', data);
  // 执行摇一摇操作
  performShakeAction();
};

shakeDetector.start();
```

## 最佳实践总结

```
Device Orientation API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   权限处理                                          │
│   ├── iOS 13+ 需要用户授权                         │
│   ├── 在用户交互中请求权限                         │
│   ├── 处理权限拒绝情况                             │
│   └── 提供非设备方向的替代方案                     │
│                                                     │
│   数据处理                                          │
│   ├── 使用低通滤波平滑数据                         │
│   ├── 处理角度环绕问题                             │
│   ├── 设置合理的死区                               │
│   └── 考虑不同设备的差异                           │
│                                                     │
│   性能优化                                          │
│   ├── 节流高频率事件                               │
│   ├── 不使用时停止监听                             │
│   ├── 使用 requestAnimationFrame 更新 UI          │
│   └── 避免在事件处理中做复杂计算                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 事件 | 数据 | 用途 |
|------|------|------|
| deviceorientation | alpha, beta, gamma | 设备方向 |
| devicemotion | acceleration, rotationRate | 运动检测 |
| deviceorientationabsolute | 绝对方向数据 | 指南针 |

---

*善用 Device Orientation API，创造沉浸式的交互体验。*
