---
title: 'JavaScript Fullscreen and Screen API Complete Guide'
description: 'Master Fullscreen API, Page Visibility API, and Screen API techniques'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'js-fullscreen-screen-api-guide'
---

Fullscreen and screen-related APIs are commonly used features in web applications. This article covers the usage and best practices of these APIs.

## Fullscreen API

### Entering Fullscreen

```javascript
// Enter fullscreen
async function enterFullscreen(element = document.documentElement) {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      // Safari
      await element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      // IE11
      await element.msRequestFullscreen();
    }
    return true;
  } catch (error) {
    console.error('Enter fullscreen failed:', error);
    return false;
  }
}

// Make entire page fullscreen
document.querySelector('.fullscreen-btn').addEventListener('click', () => {
  enterFullscreen();
});

// Make specific element fullscreen
document.querySelector('.video-fullscreen-btn').addEventListener('click', () => {
  const video = document.querySelector('video');
  enterFullscreen(video);
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
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen();
    }
    return true;
  } catch (error) {
    console.error('Exit fullscreen failed:', error);
    return false;
  }
}

// Toggle fullscreen
async function toggleFullscreen(element) {
  if (isFullscreen()) {
    return exitFullscreen();
  } else {
    return enterFullscreen(element);
  }
}
```

### Checking Fullscreen State

```javascript
// Check if in fullscreen
function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
}

// Get current fullscreen element
function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement ||
    null
  );
}

// Check if fullscreen is supported
function isFullscreenSupported() {
  return !!(
    document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen ||
    document.documentElement.msRequestFullscreen
  );
}
```

### Fullscreen Events

```javascript
// Listen for fullscreen change
function onFullscreenChange(callback) {
  document.addEventListener('fullscreenchange', callback);
  document.addEventListener('webkitfullscreenchange', callback);
  document.addEventListener('msfullscreenchange', callback);
}

// Listen for fullscreen error
function onFullscreenError(callback) {
  document.addEventListener('fullscreenerror', callback);
  document.addEventListener('webkitfullscreenerror', callback);
  document.addEventListener('msfullscreenerror', callback);
}

// Usage
onFullscreenChange(() => {
  if (isFullscreen()) {
    console.log('Entered fullscreen');
    document.body.classList.add('is-fullscreen');
  } else {
    console.log('Exited fullscreen');
    document.body.classList.remove('is-fullscreen');
  }
});

onFullscreenError((event) => {
  console.error('Fullscreen error:', event);
});
```

### Fullscreen Styles

```css
/* Element styles in fullscreen */
:fullscreen {
  background-color: #000;
}

:-webkit-full-screen {
  background-color: #000;
}

:-ms-fullscreen {
  background-color: #000;
}

/* Child elements of fullscreen container */
:fullscreen video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Using backdrop pseudo-element */
::backdrop {
  background-color: rgba(0, 0, 0, 0.9);
}

::-webkit-backdrop {
  background-color: rgba(0, 0, 0, 0.9);
}
```

## Page Visibility API

### Detecting Page Visibility

```javascript
// Get current visibility state
function getVisibilityState() {
  return document.visibilityState;
  // 'visible' - page is visible
  // 'hidden' - page is hidden
  // 'prerender' - page is being prerendered
}

// Check if page is hidden
function isPageHidden() {
  return document.hidden;
}

// Listen for visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Page hidden');
    handlePageHidden();
  } else {
    console.log('Page visible');
    handlePageVisible();
  }
});
```

### Practical Applications

```javascript
// 1. Pause/resume video
const video = document.querySelector('video');

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    video.pause();
  } else {
    video.play();
  }
});

// 2. Pause animations
let animationId;

function animate() {
  // Animation logic
  animationId = requestAnimationFrame(animate);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animationId);
  } else {
    animate();
  }
});

// 3. Reduce polling frequency
let pollInterval;

function startPolling() {
  pollInterval = setInterval(fetchData, document.hidden ? 60000 : 5000);
}

document.addEventListener('visibilitychange', () => {
  clearInterval(pollInterval);
  startPolling();
});

// 4. Update title notification
let originalTitle = document.title;
let unreadCount = 0;

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    document.title = originalTitle;
    unreadCount = 0;
  }
});

function onNewMessage() {
  if (document.hidden) {
    unreadCount++;
    document.title = `(${unreadCount}) ${originalTitle}`;
  }
}
```

## Screen API

### Screen Information

```javascript
// Screen dimensions
console.log('Screen width:', screen.width);
console.log('Screen height:', screen.height);

// Available dimensions (excluding system UI)
console.log('Available width:', screen.availWidth);
console.log('Available height:', screen.availHeight);

// Color depth
console.log('Color depth:', screen.colorDepth);
console.log('Pixel depth:', screen.pixelDepth);

// Device pixel ratio
console.log('Device pixel ratio:', window.devicePixelRatio);

// Screen orientation
console.log('Orientation:', screen.orientation?.type);
// 'portrait-primary', 'portrait-secondary'
// 'landscape-primary', 'landscape-secondary'
```

### Screen Orientation

```javascript
// Get current orientation
function getOrientation() {
  if (screen.orientation) {
    return screen.orientation.type;
  }
  // Fallback
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

// Listen for orientation changes
if (screen.orientation) {
  screen.orientation.addEventListener('change', () => {
    console.log('Orientation changed:', screen.orientation.type);
    handleOrientationChange(screen.orientation.type);
  });
} else {
  // Fallback to resize event
  window.addEventListener('resize', () => {
    const orientation = getOrientation();
    handleOrientationChange(orientation);
  });
}

// Lock screen orientation (requires fullscreen)
async function lockOrientation(orientation) {
  try {
    await screen.orientation.lock(orientation);
    // 'portrait', 'landscape', 'portrait-primary', etc.
  } catch (error) {
    console.error('Lock orientation failed:', error);
  }
}

// Unlock orientation
function unlockOrientation() {
  screen.orientation.unlock();
}
```

### Window Management API

```javascript
// Get all screen info (multi-monitor)
async function getScreenDetails() {
  if ('getScreenDetails' in window) {
    try {
      const screenDetails = await window.getScreenDetails();

      console.log('Number of screens:', screenDetails.screens.length);

      screenDetails.screens.forEach((screen, index) => {
        console.log(`Screen ${index + 1}:`, {
          width: screen.width,
          height: screen.height,
          left: screen.left,
          top: screen.top,
          isPrimary: screen.isPrimary,
          label: screen.label
        });
      });

      // Current screen
      console.log('Current screen:', screenDetails.currentScreen);

      return screenDetails;
    } catch (error) {
      console.error('Get screen details failed:', error);
    }
  }
  return null;
}

// Watch for screen changes
async function watchScreenChanges() {
  const screenDetails = await getScreenDetails();

  if (screenDetails) {
    screenDetails.addEventListener('screenschange', () => {
      console.log('Screen configuration changed');
    });

    screenDetails.addEventListener('currentscreenchange', () => {
      console.log('Current screen changed');
    });
  }
}
```

## Practical Applications

### Video Player

```javascript
class VideoPlayer {
  constructor(container) {
    this.container = container;
    this.video = container.querySelector('video');
    this.fullscreenBtn = container.querySelector('.fullscreen-btn');

    this.init();
  }

  init() {
    // Fullscreen button
    this.fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Double-click for fullscreen
    this.video.addEventListener('dblclick', () => {
      this.toggleFullscreen();
    });

    // Update UI on fullscreen change
    onFullscreenChange(() => {
      this.updateFullscreenButton();
    });

    // Pause when page hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !this.video.paused) {
        this.video.pause();
        this.wasPlaying = true;
      } else if (!document.hidden && this.wasPlaying) {
        this.video.play();
        this.wasPlaying = false;
      }
    });

    // ESC to exit fullscreen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isFullscreen()) {
        exitFullscreen();
      }
    });
  }

  async toggleFullscreen() {
    if (isFullscreen()) {
      await exitFullscreen();
    } else {
      await enterFullscreen(this.container);
    }
  }

  updateFullscreenButton() {
    const icon = isFullscreen() ? 'exit-fullscreen' : 'enter-fullscreen';
    this.fullscreenBtn.querySelector('.icon').className = `icon ${icon}`;
  }
}
```

### Game Fullscreen

```javascript
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.isRunning = false;
  }

  async start() {
    // Request fullscreen
    await enterFullscreen(this.canvas);

    // Lock orientation to landscape
    try {
      await screen.orientation.lock('landscape');
    } catch {}

    // Start game loop
    this.isRunning = true;
    this.gameLoop();
  }

  gameLoop() {
    if (!this.isRunning) return;

    // Update game state
    this.update();

    // Render
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  pause() {
    this.isRunning = false;
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.gameLoop();
    }
  }
}

// Page visibility control
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.pause();
  } else {
    game.resume();
  }
});

// Fullscreen change handling
onFullscreenChange(() => {
  if (!isFullscreen()) {
    game.pause();
    showPauseMenu();
  }
});
```

### Presentation Mode

```javascript
class Presentation {
  constructor(slides) {
    this.slides = slides;
    this.currentIndex = 0;
    this.container = document.querySelector('.presentation');
  }

  async start() {
    // Enter fullscreen
    await enterFullscreen(this.container);

    // Hide cursor
    this.container.style.cursor = 'none';

    // Keyboard navigation
    this.handleKeyboard();

    // Show first slide
    this.showSlide(0);
  }

  handleKeyboard() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Space':
          this.next();
          break;
        case 'ArrowLeft':
          this.prev();
          break;
        case 'Escape':
          this.exit();
          break;
        case 'f':
          if (!isFullscreen()) {
            enterFullscreen(this.container);
          }
          break;
      }
    });
  }

  next() {
    if (this.currentIndex < this.slides.length - 1) {
      this.showSlide(this.currentIndex + 1);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.showSlide(this.currentIndex - 1);
    }
  }

  showSlide(index) {
    this.currentIndex = index;
    // Update display
    this.slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
  }

  exit() {
    exitFullscreen();
    this.container.style.cursor = 'auto';
  }
}
```

### Responsive Layout Detection

```javascript
// Comprehensive viewport info
function getViewportInfo() {
  return {
    // Viewport size
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,

    // Document size
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,

    // Screen size
    screenWidth: screen.width,
    screenHeight: screen.height,

    // Device pixel ratio
    devicePixelRatio: window.devicePixelRatio,

    // Orientation
    orientation: getOrientation(),

    // Is fullscreen
    isFullscreen: isFullscreen(),

    // Is visible
    isVisible: !document.hidden
  };
}

// Watch all changes
function watchViewportChanges(callback) {
  // Size changes
  window.addEventListener('resize', () => callback(getViewportInfo()));

  // Orientation changes
  if (screen.orientation) {
    screen.orientation.addEventListener('change', () => callback(getViewportInfo()));
  }

  // Fullscreen changes
  onFullscreenChange(() => callback(getViewportInfo()));

  // Visibility changes
  document.addEventListener('visibilitychange', () => callback(getViewportInfo()));
}
```

## Best Practices Summary

```
Fullscreen and Screen API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Fullscreen API                                    │
│   ├── Must be triggered by user gesture            │
│   ├── Handle browser prefix compatibility          │
│   ├── Provide obvious exit method                  │
│   └── Listen for fullscreenchange to update UI     │
│                                                     │
│   Page Visibility API                               │
│   ├── Pause non-essential operations when hidden   │
│   ├── Reduce background resource consumption       │
│   └── Sync latest state when resuming              │
│                                                     │
│   Screen API                                        │
│   ├── Consider multi-monitor scenarios             │
│   ├── Respond to orientation changes               │
│   └── Adapt to different pixel densities           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| API | Purpose | Example Scenarios |
|-----|---------|-------------------|
| Fullscreen | Full-screen display | Video, games, presentations |
| Page Visibility | Detect page visibility | Pause animations, reduce polling |
| Screen | Get screen info | Responsive layout, multi-monitor |
| Screen Orientation | Orientation control | Games, video players |

---

*Master fullscreen and screen APIs to enhance immersive web experiences.*
