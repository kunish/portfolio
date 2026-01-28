---
title: 'Canvas Graphics Programming: From Basics to Game Development'
description: 'Master Canvas 2D API, animation rendering, performance optimization and simple game development'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'canvas-graphics-guide'
---

Canvas is a built-in browser graphics drawing capability. This article explores various Canvas 2D applications and techniques.

## Canvas Basics

### Setting Up Canvas

```typescript
// Get Canvas and context
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Handle high-resolution screens
function setupCanvas(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // Set actual pixel dimensions
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // Set CSS dimensions
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  // Scale context
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  return ctx;
}
```

### Basic Drawing

```typescript
// Rectangles
ctx.fillStyle = '#3498db';
ctx.fillRect(10, 10, 100, 80);

ctx.strokeStyle = '#e74c3c';
ctx.lineWidth = 3;
ctx.strokeRect(130, 10, 100, 80);

// Clear area
ctx.clearRect(50, 30, 40, 40);

// Paths
ctx.beginPath();
ctx.moveTo(10, 120);
ctx.lineTo(110, 120);
ctx.lineTo(60, 180);
ctx.closePath();
ctx.fillStyle = '#2ecc71';
ctx.fill();
ctx.stroke();

// Circle
ctx.beginPath();
ctx.arc(200, 150, 40, 0, Math.PI * 2);
ctx.fillStyle = '#9b59b6';
ctx.fill();

// Arc
ctx.beginPath();
ctx.arc(300, 150, 40, 0, Math.PI);
ctx.stroke();
```

### Text and Images

```typescript
// Text
ctx.font = 'bold 24px Arial';
ctx.fillStyle = '#333';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Hello Canvas', 200, 50);

// Stroke text
ctx.strokeStyle = '#e74c3c';
ctx.lineWidth = 1;
ctx.strokeText('Outlined', 200, 90);

// Measure text
const metrics = ctx.measureText('Hello');
console.log('Text width:', metrics.width);

// Draw image
const img = new Image();
img.onload = () => {
  // Original size
  ctx.drawImage(img, 10, 200);

  // Scaled
  ctx.drawImage(img, 150, 200, 100, 75);

  // Cropped
  ctx.drawImage(
    img,
    0, 0, 50, 50, // Source region
    270, 200, 80, 80 // Destination region
  );
};
img.src = 'image.png';
```

## Transformations and State

### Transform Operations

```typescript
// Save state
ctx.save();

// Translate
ctx.translate(100, 100);

// Rotate (radians)
ctx.rotate(Math.PI / 4);

// Scale
ctx.scale(1.5, 1.5);

// Draw
ctx.fillRect(-25, -25, 50, 50);

// Restore state
ctx.restore();

// Transform matrix
ctx.setTransform(1, 0.5, -0.5, 1, 30, 10);
ctx.fillRect(0, 0, 50, 50);

// Reset transform
ctx.resetTransform();
```

### Gradients and Patterns

```typescript
// Linear gradient
const linearGradient = ctx.createLinearGradient(0, 0, 200, 0);
linearGradient.addColorStop(0, '#ff6b6b');
linearGradient.addColorStop(0.5, '#4ecdc4');
linearGradient.addColorStop(1, '#45b7d1');

ctx.fillStyle = linearGradient;
ctx.fillRect(10, 10, 200, 80);

// Radial gradient
const radialGradient = ctx.createRadialGradient(100, 150, 10, 100, 150, 50);
radialGradient.addColorStop(0, '#fff');
radialGradient.addColorStop(1, '#3498db');

ctx.fillStyle = radialGradient;
ctx.beginPath();
ctx.arc(100, 150, 50, 0, Math.PI * 2);
ctx.fill();

// Pattern fill
const patternImg = new Image();
patternImg.onload = () => {
  const pattern = ctx.createPattern(patternImg, 'repeat')!;
  ctx.fillStyle = pattern;
  ctx.fillRect(220, 10, 150, 150);
};
patternImg.src = 'pattern.png';
```

## Animation Basics

### Basic Animation Loop

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

      // Boundary bounce
      if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.canvas.width) {
        ball.vx *= -1;
      }
      if (ball.y - ball.radius < 0 || ball.y + ball.radius > this.canvas.height) {
        ball.vy *= -1;
      }
    }
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

const animation = new Animation(canvas);
animation.start();
```

### Frame Rate Control

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

## Interaction Handling

### Mouse Events

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
  }

  // Check if point is in circle
  isPointInCircle(
    px: number, py: number,
    cx: number, cy: number, radius: number
  ): boolean {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= radius * radius;
  }

  // Check if point is in rectangle
  isPointInRect(
    px: number, py: number,
    rx: number, ry: number, rw: number, rh: number
  ): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
}
```

## Performance Optimization

### Offscreen Canvas

```typescript
// Offscreen rendering
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

// Pre-render complex graphics
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

// Use pre-rendered sprite
for (let i = 0; i < 100; i++) {
  ctx.drawImage(starSprite, Math.random() * 500, Math.random() * 400);
}
```

### Layered Rendering

```typescript
class LayeredCanvas {
  private layers: Map<string, HTMLCanvasElement> = new Map();
  private container: HTMLElement;

  constructor(container: HTMLElement, width: number, height: number) {
    this.container = container;
    this.container.style.position = 'relative';

    this.createLayer('background', width, height, 0);
    this.createLayer('game', width, height, 1);
    this.createLayer('ui', width, height, 2);
  }

  private createLayer(
    name: string, width: number, height: number, zIndex: number
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

// Usage: background draws once, game layer updates frequently
const layers = new LayeredCanvas(document.body, 800, 600);

const bgCtx = layers.getContext('background')!;
bgCtx.fillStyle = '#1a1a2e';
bgCtx.fillRect(0, 0, 800, 600);

function gameLoop() {
  layers.clear('game');
  const gameCtx = layers.getContext('game')!;
  // Draw game objects...
  requestAnimationFrame(gameLoop);
}
```

## Simple Game Example

### Breakout Game

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
    this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
    this.paddle.y = this.canvas.height - 30;
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.paddle.y - this.ball.radius;

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
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Wall collision
    if (this.ball.x < this.ball.radius || this.ball.x > this.canvas.width - this.ball.radius) {
      this.ball.vx *= -1;
    }
    if (this.ball.y < this.ball.radius) {
      this.ball.vy *= -1;
    }

    // Paddle collision
    if (
      this.ball.y + this.ball.radius > this.paddle.y &&
      this.ball.x > this.paddle.x &&
      this.ball.x < this.paddle.x + this.paddle.width
    ) {
      this.ball.vy = -Math.abs(this.ball.vy);
    }

    // Brick collision
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

    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      this.ctx.fillStyle = brick.color;
      this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    }

    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

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

## Best Practices Summary

```
Canvas Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Performance                                       │
│   ├── Use offscreen Canvas for pre-rendering       │
│   ├── Layer rendering to reduce redraws            │
│   ├── Avoid frequent style property changes        │
│   └── Use requestAnimationFrame                    │
│                                                     │
│   Clarity                                           │
│   ├── Handle devicePixelRatio                      │
│   ├── Use integer coordinates to avoid blur        │
│   └── Use appropriate font sizes for text          │
│                                                     │
│   Code Organization                                 │
│   ├── Separate update and render logic             │
│   ├── Use state machines for game state            │
│   └── Object pooling to reduce GC                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommendation |
|----------|----------------|
| Data visualization | Consider SVG |
| Complex animations | Offscreen rendering |
| Game development | Layers + object pooling |
| Image processing | Web Worker |

---

*Canvas is the foundation for building graphics applications, mastering it opens infinite possibilities.*
