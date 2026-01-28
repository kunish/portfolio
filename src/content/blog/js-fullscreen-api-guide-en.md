---
title: 'JavaScript Fullscreen API Complete Guide'
description: 'Master fullscreen control: entering/exiting fullscreen, event handling, style control, and cross-browser compatibility'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'js-fullscreen-api-guide'
---

The Fullscreen API allows webpage elements to be displayed in fullscreen mode. This article covers its usage and practical applications.

## Basic Usage

### Detecting Support

```javascript
// Check fullscreen support
function isFullscreenSupported() {
  return !!(
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullscreenEnabled
  );
}

// Check if currently fullscreen
function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

// Get current fullscreen element
function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

console.log('Fullscreen supported:', isFullscreenSupported());
console.log('Currently fullscreen:', isFullscreen());
```

### Entering Fullscreen

```javascript
// Basic enter fullscreen
async function enterFullscreen(element) {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    }
    console.log('Entered fullscreen');
  } catch (error) {
    console.error('Failed to enter fullscreen:', error);
  }
}

// Usage example
const videoElement = document.getElementById('video');
const fullscreenBtn = document.getElementById('fullscreen-btn');

fullscreenBtn.addEventListener('click', () => {
  enterFullscreen(videoElement);
});
```

### Exiting Fullscreen

```javascript
// Exit fullscreen
async function exitFullscreen() {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      await document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen();
    }
    console.log('Exited fullscreen');
  } catch (error) {
    console.error('Failed to exit fullscreen:', error);
  }
}

// Toggle fullscreen
async function toggleFullscreen(element) {
  if (isFullscreen()) {
    await exitFullscreen();
  } else {
    await enterFullscreen(element);
  }
}

// Usage example
document.getElementById('toggle-btn').addEventListener('click', () => {
  toggleFullscreen(document.getElementById('container'));
});
```

### Fullscreen Options

```javascript
// Fullscreen request with options
async function enterFullscreenWithOptions(element, options = {}) {
  const fullscreenOptions = {
    // Navigation UI display mode
    // 'auto' - Browser decides
    // 'hide' - Hide navigation
    // 'show' - Show navigation
    navigationUI: options.navigationUI || 'auto'
  };
  
  try {
    await element.requestFullscreen(fullscreenOptions);
  } catch (error) {
    console.error('Fullscreen request failed:', error);
  }
}

// Fullscreen with hidden navigation bar
enterFullscreenWithOptions(element, { navigationUI: 'hide' });
```

## Event Handling

### Fullscreen Change Event

```javascript
// Listen for fullscreen changes
function onFullscreenChange(callback) {
  document.addEventListener('fullscreenchange', callback);
  document.addEventListener('webkitfullscreenchange', callback);
  document.addEventListener('mozfullscreenchange', callback);
  document.addEventListener('MSFullscreenChange', callback);
}

// Remove listener
function offFullscreenChange(callback) {
  document.removeEventListener('fullscreenchange', callback);
  document.removeEventListener('webkitfullscreenchange', callback);
  document.removeEventListener('mozfullscreenchange', callback);
  document.removeEventListener('MSFullscreenChange', callback);
}

// Usage example
onFullscreenChange(() => {
  if (isFullscreen()) {
    console.log('Entered fullscreen mode');
    console.log('Fullscreen element:', getFullscreenElement());
  } else {
    console.log('Exited fullscreen mode');
  }
});
```

### Fullscreen Error Event

```javascript
// Listen for fullscreen errors
function onFullscreenError(callback) {
  document.addEventListener('fullscreenerror', callback);
  document.addEventListener('webkitfullscreenerror', callback);
  document.addEventListener('mozfullscreenerror', callback);
  document.addEventListener('MSFullscreenError', callback);
}

onFullscreenError((event) => {
  console.error('Fullscreen error:', event);
  
  // Possible error reasons:
  // 1. Element not in document
  // 2. Element in iframe without allowfullscreen
  // 3. Not triggered by user gesture
  // 4. Element is forbidden from fullscreen
});
```

## Fullscreen Manager

### Wrapper Class

```javascript
class FullscreenManager {
  constructor() {
    this.listeners = {
      change: new Set(),
      error: new Set()
    };
    
    this.setupEventListeners();
  }
  
  get supported() {
    return !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    );
  }
  
  get isFullscreen() {
    return !!this.element;
  }
  
  get element() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }
  
  setupEventListeners() {
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];
    
    const errors = [
      'fullscreenerror',
      'webkitfullscreenerror',
      'mozfullscreenerror',
      'MSFullscreenError'
    ];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.emit('change', this.isFullscreen, this.element);
      });
    });
    
    errors.forEach(event => {
      document.addEventListener(event, (e) => {
        this.emit('error', e);
      });
    });
  }
  
  async enter(element, options = {}) {
    if (!this.supported) {
      throw new Error('Fullscreen not supported');
    }
    
    const el = element || document.documentElement;
    
    if (el.requestFullscreen) {
      return el.requestFullscreen(options);
    } else if (el.webkitRequestFullscreen) {
      return el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      return el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      return el.msRequestFullscreen();
    }
  }
  
  async exit() {
    if (!this.isFullscreen) return;
    
    if (document.exitFullscreen) {
      return document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      return document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      return document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      return document.msExitFullscreen();
    }
  }
  
  async toggle(element, options = {}) {
    if (this.isFullscreen) {
      return this.exit();
    }
    return this.enter(element, options);
  }
  
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
    }
    return () => this.off(event, callback);
  }
  
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].delete(callback);
    }
  }
  
  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(...args));
    }
  }
}

// Usage
const fullscreen = new FullscreenManager();

fullscreen.on('change', (isFullscreen, element) => {
  console.log('Fullscreen state:', isFullscreen);
  if (element) {
    console.log('Fullscreen element:', element.id);
  }
});

fullscreen.on('error', (error) => {
  console.error('Fullscreen error:', error);
});

// Enter fullscreen
document.getElementById('btn').addEventListener('click', () => {
  fullscreen.toggle(document.getElementById('video'));
});
```

## Fullscreen Styles

### CSS Pseudo-classes

```css
/* Fullscreen element styles */
:fullscreen {
  background-color: black;
}

/* Fullscreen backdrop (Safari) */
::backdrop {
  background-color: rgba(0, 0, 0, 0.9);
}

/* Specific fullscreen element styles */
.video-container:fullscreen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container:fullscreen video {
  max-width: 100%;
  max-height: 100%;
}

/* Hide elements in fullscreen */
:fullscreen .hide-in-fullscreen {
  display: none;
}

/* Show elements in fullscreen */
.show-in-fullscreen {
  display: none;
}

:fullscreen .show-in-fullscreen {
  display: block;
}

/* Prefixed compatibility */
:-webkit-full-screen {
  background-color: black;
}

:-moz-full-screen {
  background-color: black;
}

:-ms-fullscreen {
  background-color: black;
}
```

### Dynamic Style Control

```javascript
class FullscreenStyleController {
  constructor(element) {
    this.element = element;
    this.originalStyles = {};
    this.fullscreen = new FullscreenManager();
    
    this.fullscreen.on('change', (isFullscreen, el) => {
      if (el === this.element) {
        if (isFullscreen) {
          this.applyFullscreenStyles();
        } else {
          this.restoreStyles();
        }
      }
    });
  }
  
  applyFullscreenStyles() {
    // Save original styles
    this.originalStyles = {
      width: this.element.style.width,
      height: this.element.style.height,
      position: this.element.style.position,
      top: this.element.style.top,
      left: this.element.style.left,
      zIndex: this.element.style.zIndex,
      backgroundColor: this.element.style.backgroundColor
    };
    
    // Apply fullscreen styles
    Object.assign(this.element.style, {
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: '0',
      left: '0',
      zIndex: '9999',
      backgroundColor: '#000'
    });
  }
  
  restoreStyles() {
    Object.assign(this.element.style, this.originalStyles);
  }
  
  async enter() {
    return this.fullscreen.enter(this.element);
  }
  
  async exit() {
    return this.fullscreen.exit();
  }
  
  async toggle() {
    return this.fullscreen.toggle(this.element);
  }
}

// Usage
const container = document.getElementById('video-container');
const controller = new FullscreenStyleController(container);

document.getElementById('fullscreen-btn').addEventListener('click', () => {
  controller.toggle();
});
```

## Practical Applications

### Video Player

```javascript
class VideoPlayer {
  constructor(container) {
    this.container = container;
    this.video = container.querySelector('video');
    this.controls = container.querySelector('.controls');
    this.fullscreenBtn = container.querySelector('.fullscreen-btn');
    
    this.fullscreen = new FullscreenManager();
    
    this.init();
  }
  
  init() {
    // Fullscreen button
    this.fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });
    
    // Double-click fullscreen
    this.video.addEventListener('dblclick', () => {
      this.toggleFullscreen();
    });
    
    // Fullscreen change listener
    this.fullscreen.on('change', (isFullscreen) => {
      this.updateFullscreenUI(isFullscreen);
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (this.fullscreen.element === this.container) {
        this.handleKeydown(e);
      }
    });
  }
  
  async toggleFullscreen() {
    await this.fullscreen.toggle(this.container);
  }
  
  updateFullscreenUI(isFullscreen) {
    this.container.classList.toggle('is-fullscreen', isFullscreen);
    
    const icon = this.fullscreenBtn.querySelector('i');
    if (icon) {
      icon.className = isFullscreen ? 'icon-exit-fullscreen' : 'icon-fullscreen';
    }
    
    this.fullscreenBtn.title = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
  }
  
  handleKeydown(e) {
    switch (e.key) {
      case 'Escape':
        // Browser handles this, add extra logic here
        break;
      case 'f':
      case 'F':
        this.toggleFullscreen();
        break;
      case ' ':
        e.preventDefault();
        this.video.paused ? this.video.play() : this.video.pause();
        break;
      case 'ArrowLeft':
        this.video.currentTime -= 10;
        break;
      case 'ArrowRight':
        this.video.currentTime += 10;
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.video.volume = Math.min(1, this.video.volume + 0.1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.video.volume = Math.max(0, this.video.volume - 0.1);
        break;
    }
  }
}

// Usage
const player = new VideoPlayer(document.getElementById('player'));
```

### Image Gallery

```javascript
class FullscreenGallery {
  constructor(container) {
    this.container = container;
    this.images = [...container.querySelectorAll('img')];
    this.currentIndex = 0;
    this.overlay = null;
    
    this.fullscreen = new FullscreenManager();
    
    this.init();
  }
  
  init() {
    // Click image to enter fullscreen
    this.images.forEach((img, index) => {
      img.addEventListener('click', () => {
        this.open(index);
      });
    });
    
    // Create fullscreen overlay
    this.createOverlay();
    
    // Fullscreen change listener
    this.fullscreen.on('change', (isFullscreen) => {
      if (!isFullscreen && this.overlay.classList.contains('active')) {
        this.close();
      }
    });
  }
  
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'fullscreen-gallery-overlay';
    this.overlay.innerHTML = `
      <button class="close-btn">&times;</button>
      <button class="prev-btn">&lt;</button>
      <button class="next-btn">&gt;</button>
      <div class="image-container">
        <img src="" alt="">
      </div>
      <div class="counter"></div>
    `;
    
    document.body.appendChild(this.overlay);
    
    // Bind events
    this.overlay.querySelector('.close-btn').addEventListener('click', () => {
      this.close();
    });
    
    this.overlay.querySelector('.prev-btn').addEventListener('click', () => {
      this.prev();
    });
    
    this.overlay.querySelector('.next-btn').addEventListener('click', () => {
      this.next();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.overlay.classList.contains('active')) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          this.prev();
          break;
        case 'ArrowRight':
          this.next();
          break;
        case 'Escape':
          this.close();
          break;
      }
    });
    
    // Touch swipe
    let startX = 0;
    this.overlay.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });
    
    this.overlay.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
      }
    });
  }
  
  async open(index) {
    this.currentIndex = index;
    this.updateImage();
    this.overlay.classList.add('active');
    
    await this.fullscreen.enter(this.overlay);
  }
  
  async close() {
    if (this.fullscreen.isFullscreen) {
      await this.fullscreen.exit();
    }
    this.overlay.classList.remove('active');
  }
  
  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.updateImage();
  }
  
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.updateImage();
  }
  
  updateImage() {
    const img = this.overlay.querySelector('.image-container img');
    img.src = this.images[this.currentIndex].src;
    
    const counter = this.overlay.querySelector('.counter');
    counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
  }
}

// Usage
const gallery = new FullscreenGallery(document.getElementById('gallery'));
```

### Presentation Mode

```javascript
class PresentationMode {
  constructor(slides) {
    this.slides = slides;
    this.currentSlide = 0;
    this.container = null;
    
    this.fullscreen = new FullscreenManager();
    
    this.createContainer();
    this.setupEventListeners();
  }
  
  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'presentation-container';
    this.container.innerHTML = `
      <div class="slide-viewport"></div>
      <div class="slide-controls">
        <button class="prev-slide">Previous</button>
        <span class="slide-number"></span>
        <button class="next-slide">Next</button>
        <button class="exit-presentation">Exit</button>
      </div>
      <div class="progress-bar">
        <div class="progress"></div>
      </div>
    `;
    
    document.body.appendChild(this.container);
  }
  
  setupEventListeners() {
    // Control buttons
    this.container.querySelector('.prev-slide').addEventListener('click', () => {
      this.prevSlide();
    });
    
    this.container.querySelector('.next-slide').addEventListener('click', () => {
      this.nextSlide();
    });
    
    this.container.querySelector('.exit-presentation').addEventListener('click', () => {
      this.stop();
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (!this.container.classList.contains('active')) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          this.prevSlide();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          this.nextSlide();
          break;
        case 'Home':
          this.goToSlide(0);
          break;
        case 'End':
          this.goToSlide(this.slides.length - 1);
          break;
        case 'Escape':
          this.stop();
          break;
      }
    });
    
    // Fullscreen change
    this.fullscreen.on('change', (isFullscreen) => {
      if (!isFullscreen && this.container.classList.contains('active')) {
        this.stop();
      }
    });
  }
  
  async start(startIndex = 0) {
    this.currentSlide = startIndex;
    this.container.classList.add('active');
    this.renderSlide();
    
    await this.fullscreen.enter(this.container, { navigationUI: 'hide' });
  }
  
  async stop() {
    if (this.fullscreen.isFullscreen) {
      await this.fullscreen.exit();
    }
    this.container.classList.remove('active');
  }
  
  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.renderSlide();
    }
  }
  
  nextSlide() {
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
      this.renderSlide();
    }
  }
  
  goToSlide(index) {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlide = index;
      this.renderSlide();
    }
  }
  
  renderSlide() {
    const viewport = this.container.querySelector('.slide-viewport');
    const slide = this.slides[this.currentSlide];
    
    viewport.innerHTML = slide.content || '';
    
    // Update page number
    const number = this.container.querySelector('.slide-number');
    number.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;
    
    // Update progress bar
    const progress = this.container.querySelector('.progress');
    progress.style.width = `${((this.currentSlide + 1) / this.slides.length) * 100}%`;
    
    // Update button states
    this.container.querySelector('.prev-slide').disabled = this.currentSlide === 0;
    this.container.querySelector('.next-slide').disabled = 
      this.currentSlide === this.slides.length - 1;
  }
}

// Usage
const slides = [
  { content: '<h1>Welcome</h1><p>This is the first slide</p>' },
  { content: '<h1>Topics</h1><ul><li>Point 1</li><li>Point 2</li></ul>' },
  { content: '<h1>Conclusion</h1><p>Thank you for watching</p>' }
];

const presentation = new PresentationMode(slides);

document.getElementById('start-btn').addEventListener('click', () => {
  presentation.start();
});
```

## Best Practices Summary

```
Fullscreen API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   User Experience                                   │
│   ├── Require user gesture for fullscreen          │
│   ├── Provide obvious exit method                  │
│   ├── Keep controls accessible                     │
│   └── Respond to Escape key to exit                │
│                                                     │
│   Compatibility                                     │
│   ├── Use prefixed API                             │
│   ├── Graceful degradation when unsupported        │
│   ├── CSS pseudo-classes also need prefixes        │
│   └── Test across different browsers               │
│                                                     │
│   Security Considerations                           │
│   ├── iframe needs allowfullscreen attribute       │
│   ├── Some elements may be forbidden               │
│   ├── Be aware of user input in fullscreen         │
│   └── Handle fullscreen errors properly            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach |
|----------|---------------------|
| Video Player | Fullscreen container, keep controls |
| Image Viewer | Use overlay layer for fullscreen |
| Games/Presentations | Fullscreen entire app |
| iframe Content | Ensure allowfullscreen attribute |

---

*Use the Fullscreen API wisely to create immersive user experiences.*
