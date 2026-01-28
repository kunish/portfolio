---
title: 'JavaScript Vibration API Complete Guide'
description: 'Master device vibration control: haptic feedback, gaming experience, notifications, and interaction enhancement'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'js-vibration-api-guide'
---

The Vibration API allows web pages to control the device's vibration feature. This article covers its usage and practical applications.

## Basic Concepts

### Detecting Support

```javascript
// Check API support
if ('vibrate' in navigator) {
  console.log('Vibration API is supported');
} else {
  console.log('Vibration API is not supported');
}

// Safe vibration function
function vibrate(pattern) {
  if ('vibrate' in navigator) {
    return navigator.vibrate(pattern);
  }
  return false;
}
```

### Simple Vibration

```javascript
// Vibrate for 200 milliseconds
navigator.vibrate(200);

// Vibrate for 1 second
navigator.vibrate(1000);

// Stop vibration
navigator.vibrate(0);
// or
navigator.vibrate([]);
```

### Vibration Patterns

```javascript
// Pattern: [vibrate, pause, vibrate, pause, ...]
// Vibrate 100ms, pause 50ms, vibrate 100ms
navigator.vibrate([100, 50, 100]);

// SOS Morse code
// ... --- ... (3 short, 3 long, 3 short)
const sos = [
  100, 50, 100, 50, 100, // S: ...
  200,                    // gap
  300, 50, 300, 50, 300, // O: ---
  200,                    // gap
  100, 50, 100, 50, 100  // S: ...
];
navigator.vibrate(sos);

// Heartbeat pattern
const heartbeat = [100, 100, 100, 400];
navigator.vibrate(heartbeat);
```

## Vibration Manager

### Wrapper Class

```javascript
class VibrationManager {
  constructor() {
    this.isSupported = 'vibrate' in navigator;
    this.isEnabled = true;
    this.currentPattern = null;
  }
  
  // Check if vibration is possible
  canVibrate() {
    return this.isSupported && this.isEnabled;
  }
  
  // Enable/disable vibration
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }
  
  // Simple vibration
  vibrate(duration = 100) {
    if (!this.canVibrate()) return false;
    return navigator.vibrate(duration);
  }
  
  // Pattern vibration
  pattern(pattern) {
    if (!this.canVibrate()) return false;
    this.currentPattern = pattern;
    return navigator.vibrate(pattern);
  }
  
  // Repeat pattern
  repeat(pattern, times) {
    if (!this.canVibrate()) return false;
    
    const repeatedPattern = [];
    for (let i = 0; i < times; i++) {
      repeatedPattern.push(...pattern);
      if (i < times - 1) {
        // Add gap
        repeatedPattern.push(pattern[pattern.length - 1] || 100);
      }
    }
    
    return navigator.vibrate(repeatedPattern);
  }
  
  // Stop vibration
  stop() {
    if (this.isSupported) {
      navigator.vibrate(0);
      this.currentPattern = null;
    }
  }
}

// Usage
const vibration = new VibrationManager();

// Simple vibration
vibration.vibrate(200);

// Pattern vibration
vibration.pattern([100, 50, 100]);

// Repeat 3 times
vibration.repeat([100, 50, 100], 3);

// Disable vibration
vibration.setEnabled(false);
```

### Preset Pattern Library

```javascript
class VibrationPatterns {
  static patterns = {
    // Notification types
    notification: [100, 50, 100],
    success: [50, 50, 100],
    error: [100, 50, 100, 50, 100],
    warning: [200, 100, 200],
    
    // Interaction feedback
    tap: [10],
    doubleTap: [10, 50, 10],
    longPress: [50],
    
    // Game effects
    explosion: [100, 30, 50, 30, 200],
    hit: [30],
    powerUp: [50, 30, 50, 30, 100],
    gameOver: [200, 100, 200, 100, 500],
    
    // Special patterns
    heartbeat: [100, 100, 100, 400],
    alarm: [500, 200, 500, 200, 500],
    sos: [100, 50, 100, 50, 100, 200, 300, 50, 300, 50, 300, 200, 100, 50, 100, 50, 100],
    
    // Musical rhythms
    rhythm1: [100, 100, 100, 100, 200, 200],
    rhythm2: [50, 50, 50, 50, 100, 100, 200]
  };
  
  static get(name) {
    return this.patterns[name] || [100];
  }
  
  static play(name) {
    const pattern = this.get(name);
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
  
  static register(name, pattern) {
    this.patterns[name] = pattern;
  }
  
  static list() {
    return Object.keys(this.patterns);
  }
}

// Usage
VibrationPatterns.play('success');
VibrationPatterns.play('heartbeat');

// Register custom pattern
VibrationPatterns.register('custom', [75, 25, 75, 25, 150]);
VibrationPatterns.play('custom');
```

## Practical Applications

### Haptic Feedback Button

```javascript
class HapticButton {
  constructor(element, options = {}) {
    this.element = element;
    this.vibration = new VibrationManager();
    this.pattern = options.pattern || [10];
    this.enabled = options.enabled !== false;
    
    this.bindEvents();
  }
  
  bindEvents() {
    this.element.addEventListener('click', () => {
      this.onClick();
    });
    
    this.element.addEventListener('touchstart', () => {
      this.onTouchStart();
    });
  }
  
  onClick() {
    if (this.enabled) {
      this.vibration.pattern(this.pattern);
    }
  }
  
  onTouchStart() {
    if (this.enabled) {
      this.vibration.vibrate(5);
    }
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  
  setPattern(pattern) {
    this.pattern = pattern;
  }
}

// Usage
document.querySelectorAll('.haptic-btn').forEach(btn => {
  new HapticButton(btn, {
    pattern: [15],
    enabled: true
  });
});

// Different buttons with different feedback
new HapticButton(document.getElementById('submit-btn'), {
  pattern: VibrationPatterns.get('success')
});

new HapticButton(document.getElementById('delete-btn'), {
  pattern: VibrationPatterns.get('warning')
});
```

### Game Vibration Feedback

```javascript
class GameHaptics {
  constructor() {
    this.vibration = new VibrationManager();
    this.intensityMultiplier = 1;
  }
  
  // Set intensity multiplier
  setIntensity(multiplier) {
    this.intensityMultiplier = Math.max(0, Math.min(2, multiplier));
  }
  
  // Apply intensity
  applyIntensity(pattern) {
    return pattern.map(duration => 
      Math.round(duration * this.intensityMultiplier)
    );
  }
  
  // Collision feedback
  collision(force = 1) {
    const baseDuration = 30;
    const duration = Math.round(baseDuration * force * this.intensityMultiplier);
    this.vibration.vibrate(Math.min(duration, 200));
  }
  
  // Explosion effect
  explosion(intensity = 1) {
    const pattern = this.applyIntensity([
      100 * intensity,
      30,
      50 * intensity,
      30,
      200 * intensity
    ]);
    this.vibration.pattern(pattern);
  }
  
  // Hit effect
  hit(damage = 1) {
    const duration = Math.round(20 + damage * 30);
    this.vibration.vibrate(Math.min(duration, 150));
  }
  
  // Item pickup
  pickup() {
    this.vibration.pattern(this.applyIntensity([30, 30, 50]));
  }
  
  // Level up effect
  levelUp() {
    this.vibration.pattern(this.applyIntensity([50, 50, 50, 50, 100, 100, 200]));
  }
  
  // Game over
  gameOver() {
    this.vibration.pattern(this.applyIntensity([200, 100, 200, 100, 500]));
  }
  
  // Victory effect
  victory() {
    this.vibration.pattern(this.applyIntensity([
      100, 50, 100, 50, 100, 100,
      200, 100, 200, 100,
      300
    ]));
  }
  
  // Countdown
  countdown(remaining) {
    if (remaining <= 3) {
      this.vibration.vibrate(100 + (4 - remaining) * 50);
    }
  }
}

// Usage
const haptics = new GameHaptics();
haptics.setIntensity(1.2);

// Game events
game.on('collision', (force) => haptics.collision(force));
game.on('explosion', () => haptics.explosion());
game.on('hit', (damage) => haptics.hit(damage));
game.on('pickup', () => haptics.pickup());
game.on('levelUp', () => haptics.levelUp());
game.on('gameOver', () => haptics.gameOver());
```

### Form Validation Feedback

```javascript
class FormHapticFeedback {
  constructor(form) {
    this.form = form;
    this.vibration = new VibrationManager();
    
    this.bindEvents();
  }
  
  bindEvents() {
    // Form submission
    this.form.addEventListener('submit', (e) => {
      if (!this.form.checkValidity()) {
        e.preventDefault();
        this.onValidationError();
      } else {
        this.onSubmitSuccess();
      }
    });
    
    // Field validation
    this.form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('blur', () => {
        if (!field.checkValidity()) {
          this.onFieldError(field);
        }
      });
      
      field.addEventListener('input', () => {
        if (field.checkValidity() && field.value) {
          this.onFieldValid(field);
        }
      });
    });
  }
  
  onValidationError() {
    this.vibration.pattern([50, 30, 50, 30, 100]);
  }
  
  onSubmitSuccess() {
    this.vibration.pattern([50, 50, 100]);
  }
  
  onFieldError(field) {
    this.vibration.vibrate(30);
  }
  
  onFieldValid(field) {
    this.vibration.vibrate(10);
  }
}

// Usage
const form = document.getElementById('signup-form');
new FormHapticFeedback(form);
```

### Notification Vibration

```javascript
class NotificationVibration {
  constructor() {
    this.vibration = new VibrationManager();
    this.priorities = {
      low: [50],
      normal: [100, 50, 100],
      high: [200, 100, 200],
      urgent: [100, 50, 100, 50, 100, 100, 200, 100, 200]
    };
  }
  
  notify(priority = 'normal') {
    const pattern = this.priorities[priority] || this.priorities.normal;
    this.vibration.pattern(pattern);
  }
  
  message() {
    this.notify('normal');
  }
  
  call() {
    // Incoming call vibration (continuous)
    this.startRinging();
  }
  
  startRinging() {
    this.ringInterval = setInterval(() => {
      this.vibration.pattern([400, 200, 400, 1000]);
    }, 2000);
  }
  
  stopRinging() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
      this.vibration.stop();
    }
  }
  
  alarm() {
    this.notify('urgent');
  }
  
  reminder() {
    this.notify('low');
  }
}

// Usage
const notifVibration = new NotificationVibration();

// Message received
notifVibration.message();

// Incoming call
notifVibration.call();

// Stop when answered or rejected
document.getElementById('answer-btn').addEventListener('click', () => {
  notifVibration.stopRinging();
});
```

### Morse Code Generator

```javascript
class MorseVibrator {
  constructor() {
    this.vibration = new VibrationManager();
    
    // Time unit (milliseconds)
    this.unit = 100;
    
    // Morse code table
    this.morseCode = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 
      'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
      'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
      'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
      'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
      'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
      '3': '...--', '4': '....-', '5': '.....', '6': '-....',
      '7': '--...', '8': '---..', '9': '----.'
    };
  }
  
  // Convert text to vibration pattern
  textToPattern(text) {
    const pattern = [];
    const upperText = text.toUpperCase();
    
    for (let i = 0; i < upperText.length; i++) {
      const char = upperText[i];
      
      if (char === ' ') {
        // Word gap (7 units)
        pattern.push(0, this.unit * 7);
      } else if (this.morseCode[char]) {
        const morse = this.morseCode[char];
        
        for (let j = 0; j < morse.length; j++) {
          if (morse[j] === '.') {
            pattern.push(this.unit); // Dot: 1 unit
          } else {
            pattern.push(this.unit * 3); // Dash: 3 units
          }
          
          // Symbol gap (1 unit)
          if (j < morse.length - 1) {
            pattern.push(this.unit);
          }
        }
        
        // Character gap (3 units)
        if (i < upperText.length - 1 && upperText[i + 1] !== ' ') {
          pattern.push(this.unit * 3);
        }
      }
    }
    
    return pattern.filter(d => d > 0);
  }
  
  // Vibrate text
  send(text) {
    const pattern = this.textToPattern(text);
    this.vibration.pattern(pattern);
    return pattern;
  }
  
  // Send SOS
  sendSOS() {
    return this.send('SOS');
  }
  
  // Set speed
  setSpeed(wpm) {
    // Standard: PARIS = 50 units, wpm PARIS per minute
    this.unit = Math.round(1200 / wpm);
  }
}

// Usage
const morse = new MorseVibrator();
morse.setSpeed(15); // 15 WPM

// Send message
morse.send('HELLO');

// Send SOS
document.getElementById('sos-btn').addEventListener('click', () => {
  morse.sendSOS();
});
```

### Musical Rhythm Vibrator

```javascript
class RhythmVibrator {
  constructor() {
    this.vibration = new VibrationManager();
    this.bpm = 120;
    this.isPlaying = false;
    this.beatInterval = null;
  }
  
  // Set BPM
  setBPM(bpm) {
    this.bpm = Math.max(30, Math.min(300, bpm));
    
    // Restart if playing
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }
  
  // Calculate beat interval (milliseconds)
  getBeatInterval() {
    return 60000 / this.bpm;
  }
  
  // Start beat
  start() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    const interval = this.getBeatInterval();
    
    // Vibrate immediately
    this.beat();
    
    this.beatInterval = setInterval(() => {
      this.beat();
    }, interval);
  }
  
  // Single beat
  beat() {
    this.vibration.vibrate(30);
  }
  
  // Stop
  stop() {
    this.isPlaying = false;
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
    this.vibration.stop();
  }
  
  // Play rhythm pattern
  playPattern(pattern, repeat = 1) {
    // pattern example: [1, 0, 1, 0, 1, 1, 0, 1]
    // 1 = vibrate, 0 = silent
    const interval = this.getBeatInterval();
    let index = 0;
    let repeatCount = 0;
    
    this.stop();
    this.isPlaying = true;
    
    const playBeat = () => {
      if (!this.isPlaying) return;
      
      if (pattern[index]) {
        this.beat();
      }
      
      index++;
      
      if (index >= pattern.length) {
        index = 0;
        repeatCount++;
        
        if (repeat > 0 && repeatCount >= repeat) {
          this.stop();
          return;
        }
      }
      
      this.beatInterval = setTimeout(playBeat, interval);
    };
    
    playBeat();
  }
}

// Usage
const rhythm = new RhythmVibrator();
rhythm.setBPM(100);

// Start beat
document.getElementById('start-rhythm').addEventListener('click', () => {
  rhythm.start();
});

// Stop
document.getElementById('stop-rhythm').addEventListener('click', () => {
  rhythm.stop();
});

// Play 4/4 rhythm
document.getElementById('pattern-44').addEventListener('click', () => {
  rhythm.playPattern([1, 0, 1, 0, 1, 0, 1, 0], 4);
});
```

## Best Practices Summary

```
Vibration API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   User Experience                                   │
│   ├── Provide option to disable vibration          │
│   ├── Keep vibration duration short                │
│   ├── Avoid overusing vibration                    │
│   └── Consider user context (meetings, etc.)       │
│                                                     │
│   Performance Considerations                        │
│   ├── Avoid continuous high-frequency vibration    │
│   ├── Long patterns may be interrupted by system   │
│   ├── Background page vibration may not work       │
│   └── Consider battery consumption                 │
│                                                     │
│   Compatibility Handling                            │
│   ├── Always check API support                     │
│   ├── Desktop browsers usually don't support       │
│   ├── Provide non-vibration alternatives           │
│   └── iOS Safari is not supported                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Duration | Pattern Example |
|----------|---------------------|-----------------|
| Light touch | 5-15ms | [10] |
| Click confirm | 15-30ms | [20] |
| Success hint | 50-100ms | [50, 30, 80] |
| Error warning | 100-200ms | [100, 50, 100] |
| Notification | 200-500ms | [200, 100, 200] |

---

*Master the Vibration API to enhance mobile interaction experience.*
