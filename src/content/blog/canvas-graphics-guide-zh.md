---
title: 'Canvas 图形编程：从基础绑定到游戏开发'
description: '掌握 Canvas 2D API、动画渲染、性能优化和简单游戏开发'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'canvas-graphics-guide'
---

Canvas 是浏览器内置的图形绘制能力。本文探讨 Canvas 2D 的各种应用场景和技巧。

## Canvas 基础

### 设置画布

```typescript
// 获取 Canvas 和上下文
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// 处理高清屏幕
function setupCanvas(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // 设置实际像素尺寸
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // 设置 CSS 尺寸
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  // 缩放上下文
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  return ctx;
}
```

### 基础绑定

```typescript
// 矩形
ctx.fillStyle = '#3498db';
ctx.fillRect(10, 10, 100, 80);

ctx.strokeStyle = '#e74c3c';
ctx.lineWidth = 3;
ctx.strokeRect(130, 10, 100, 80);

// 清除区域
ctx.clearRect(50, 30, 40, 40);

// 路径
ctx.beginPath();
ctx.moveTo(10, 120);
ctx.lineTo(110, 120);
ctx.lineTo(60, 180);
ctx.closePath();
ctx.fillStyle = '#2ecc71';
ctx.fill();
ctx.stroke();

// 圆形
ctx.beginPath();
ctx.arc(200, 150, 40, 0, Math.PI * 2);
ctx.fillStyle = '#9b59b6';
ctx.fill();

// 圆弧
ctx.beginPath();
ctx.arc(300, 150, 40, 0, Math.PI);
ctx.stroke();
```

### 文本和图像

```typescript
// 文本
ctx.font = 'bold 24px Arial';
ctx.fillStyle = '#333';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Hello Canvas', 200, 50);

// 描边文本
ctx.strokeStyle = '#e74c3c';
ctx.lineWidth = 1;
ctx.strokeText('Outlined', 200, 90);

// 测量文本
const metrics = ctx.measureText('Hello');
console.log('文本宽度:', metrics.width);

// 绘制图像
const img = new Image();
img.onload = () => {
  // 原始大小
  ctx.drawImage(img, 10, 200);

  // 缩放
  ctx.drawImage(img, 150, 200, 100, 75);

  // 裁剪
  ctx.drawImage(
    img,
    0, 0, 50, 50, // 源区域
    270, 200, 80, 80 // 目标区域
  );
};
img.src = 'image.png';
```

## 变换和状态

### 变换操作

```typescript
// 保存状态
ctx.save();

// 平移
ctx.translate(100, 100);

// 旋转 (弧度)
ctx.rotate(Math.PI / 4);

// 缩放
ctx.scale(1.5, 1.5);

// 绘制
ctx.fillRect(-25, -25, 50, 50);

// 恢复状态
ctx.restore();

// 变换矩阵
ctx.setTransform(1, 0.5, -0.5, 1, 30, 10);
ctx.fillRect(0, 0, 50, 50);

// 重置变换
ctx.resetTransform();
```

### 渐变和图案

```typescript
// 线性渐变
const linearGradient = ctx.createLinearGradient(0, 0, 200, 0);
linearGradient.addColorStop(0, '#ff6b6b');
linearGradient.addColorStop(0.5, '#4ecdc4');
linearGradient.addColorStop(1, '#45b7d1');

ctx.fillStyle = linearGradient;
ctx.fillRect(10, 10, 200, 80);

// 径向渐变
const radialGradient = ctx.createRadialGradient(100, 150, 10, 100, 150, 50);
radialGradient.addColorStop(0, '#fff');
radialGradient.addColorStop(1, '#3498db');

ctx.fillStyle = radialGradient;
ctx.beginPath();
ctx.arc(100, 150, 50, 0, Math.PI * 2);
ctx.fill();

// 图案填充
const patternImg = new Image();
patternImg.onload = () => {
  const pattern = ctx.createPattern(patternImg, 'repeat')!;
  ctx.fillStyle = pattern;
  ctx.fillRect(220, 10, 150, 150);
};
patternImg.src = 'pattern.png';
```

## 动画基础

### 基本动画循环

```typescript
interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

class Animation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private balls: Ball[] = [];
  private animationId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.init();
  }

  private init() {
    // 创建多个球
    for (let i = 0; i < 10; i++) {
      this.balls.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius: Math.random() * 20 + 10,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
      });
    }
  }

  private update() {
    for (const ball of this.balls) {
      ball.x += ball.vx;
      ball.y += ball.vy;

      // 边界反弹
      if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.canvas.width) {
        ball.vx *= -1;
      }
      if (ball.y - ball.radius < 0 || ball.y + ball.radius > this.canvas.height) {
        ball.vy *= -1;
      }
    }
  }

  private draw() {
    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制所有球
    for (const ball of this.balls) {
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = ball.color;
      this.ctx.fill();
    }
  }

  private loop = () => {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.loop);
  };

  start() {
    this.loop();
  }

  stop() {
    cancelAnimationFrame(this.animationId);
  }
}

// 使用
const animation = new Animation(canvas);
animation.start();
```

### 帧率控制

```typescript
class FrameRateLimiter {
  private lastTime = 0;
  private targetFPS: number;
  private frameInterval: number;

  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
  }

  shouldUpdate(currentTime: number): boolean {
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= this.frameInterval) {
      this.lastTime = currentTime - (elapsed % this.frameInterval);
      return true;
    }

    return false;
  }
}

// 使用
const limiter = new FrameRateLimiter(30); // 30 FPS

function gameLoop(currentTime: number) {
  requestAnimationFrame(gameLoop);

  if (limiter.shouldUpdate(currentTime)) {
    update();
    render();
  }
}

requestAnimationFrame(gameLoop);
```

## 交互处理

### 鼠标事件

```typescript
class InteractiveCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouse = { x: 0, y: 0, isDown: false };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.bindEvents();
  }

  private getMousePos(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const pos = this.getMousePos(e);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
    });

    this.canvas.addEventListener('mousedown', () => {
      this.mouse.isDown = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    this.canvas.addEventListener('click', (e) => {
      const pos = this.getMousePos(e);
      this.handleClick(pos.x, pos.y);
    });
  }

  private handleClick(x: number, y: number) {
    console.log('点击位置:', x, y);
  }

  // 检测点是否在圆内
  isPointInCircle(
    px: number,
    py: number,
    cx: number,
    cy: number,
    radius: number
  ): boolean {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= radius * radius;
  }

  // 检测点是否在矩形内
  isPointInRect(
    px: number,
    py: number,
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
}
```

## 性能优化

### 离屏 Canvas

```typescript
// 离屏渲染
function createOffscreenSprite(
  width: number,
  height: number,
  drawFn: (ctx: CanvasRenderingContext2D) => void
): HTMLCanvasElement {
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;

  const ctx = offscreen.getContext('2d')!;
  drawFn(ctx);

  return offscreen;
}

// 预渲染复杂图形
const starSprite = createOffscreenSprite(50, 50, (ctx) => {
  ctx.beginPath();
  const cx = 25, cy = 25, spikes = 5, outerRadius = 25, innerRadius = 10;

  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fillStyle = '#f1c40f';
  ctx.fill();
});

// 使用预渲染的精灵
for (let i = 0; i < 100; i++) {
  ctx.drawImage(starSprite, Math.random() * 500, Math.random() * 400);
}
```

### 分层渲染

```typescript
class LayeredCanvas {
  private layers: Map<string, HTMLCanvasElement> = new Map();
  private container: HTMLElement;

  constructor(container: HTMLElement, width: number, height: number) {
    this.container = container;
    this.container.style.position = 'relative';

    // 创建多个层
    this.createLayer('background', width, height, 0);
    this.createLayer('game', width, height, 1);
    this.createLayer('ui', width, height, 2);
  }

  private createLayer(
    name: string,
    width: number,
    height: number,
    zIndex: number
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.zIndex = String(zIndex);

    this.container.appendChild(canvas);
    this.layers.set(name, canvas);

    return canvas;
  }

  getContext(layer: string): CanvasRenderingContext2D | null {
    const canvas = this.layers.get(layer);
    return canvas?.getContext('2d') || null;
  }

  clear(layer: string) {
    const canvas = this.layers.get(layer);
    if (canvas) {
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}

// 使用：背景只绘制一次，游戏层频繁更新
const layers = new LayeredCanvas(document.body, 800, 600);

// 背景只绘制一次
const bgCtx = layers.getContext('background')!;
bgCtx.fillStyle = '#1a1a2e';
bgCtx.fillRect(0, 0, 800, 600);

// 游戏循环只更新游戏层
function gameLoop() {
  layers.clear('game');
  const gameCtx = layers.getContext('game')!;
  // 绘制游戏对象...

  requestAnimationFrame(gameLoop);
}
```

## 简单游戏示例

### 打砖块游戏

```typescript
interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  color: string;
}

class BreakoutGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private paddle = { x: 0, y: 0, width: 100, height: 10 };
  private ball = { x: 0, y: 0, radius: 8, vx: 4, vy: -4 };
  private bricks: Brick[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.init();
    this.bindEvents();
  }

  private init() {
    // 初始化挡板
    this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
    this.paddle.y = this.canvas.height - 30;

    // 初始化球
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.paddle.y - this.ball.radius;

    // 初始化砖块
    const cols = 8, rows = 4;
    const brickWidth = 70, brickHeight = 20, padding = 10;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.bricks.push({
          x: col * (brickWidth + padding) + 50,
          y: row * (brickHeight + padding) + 50,
          width: brickWidth,
          height: brickHeight,
          alive: true,
          color: `hsl(${row * 30 + col * 10}, 70%, 50%)`
        });
      }
    }
  }

  private bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.paddle.x = e.clientX - rect.left - this.paddle.width / 2;
    });
  }

  private update() {
    // 移动球
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // 墙壁碰撞
    if (this.ball.x < this.ball.radius || this.ball.x > this.canvas.width - this.ball.radius) {
      this.ball.vx *= -1;
    }
    if (this.ball.y < this.ball.radius) {
      this.ball.vy *= -1;
    }

    // 挡板碰撞
    if (
      this.ball.y + this.ball.radius > this.paddle.y &&
      this.ball.x > this.paddle.x &&
      this.ball.x < this.paddle.x + this.paddle.width
    ) {
      this.ball.vy = -Math.abs(this.ball.vy);
    }

    // 砖块碰撞
    for (const brick of this.bricks) {
      if (!brick.alive) continue;

      if (
        this.ball.x > brick.x &&
        this.ball.x < brick.x + brick.width &&
        this.ball.y - this.ball.radius < brick.y + brick.height &&
        this.ball.y + this.ball.radius > brick.y
      ) {
        brick.alive = false;
        this.ball.vy *= -1;
      }
    }
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制砖块
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      this.ctx.fillStyle = brick.color;
      this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    }

    // 绘制挡板
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

    // 绘制球
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fill();
  }

  start() {
    const loop = () => {
      this.update();
      this.draw();
      requestAnimationFrame(loop);
    };
    loop();
  }
}
```

## 最佳实践总结

```
Canvas 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   性能优化                                          │
│   ├── 使用离屏 Canvas 预渲染                       │
│   ├── 分层渲染减少重绘                             │
│   ├── 避免频繁修改样式属性                         │
│   └── 使用 requestAnimationFrame                   │
│                                                     │
│   清晰度                                            │
│   ├── 处理 devicePixelRatio                        │
│   ├── 整数坐标避免模糊                             │
│   └── 文本使用合适字体大小                         │
│                                                     │
│   代码组织                                          │
│   ├── 分离更新和渲染逻辑                           │
│   ├── 使用状态机管理游戏状态                       │
│   └── 对象池复用减少 GC                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 建议 |
|------|------|
| 数据可视化 | 考虑用 SVG |
| 复杂动画 | 离屏渲染 |
| 游戏开发 | 分层 + 对象池 |
| 图像处理 | Web Worker |

---

*Canvas 是构建图形应用的基础，掌握它能打开无限可能。*
