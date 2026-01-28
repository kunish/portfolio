---
title: 'JavaScript Vibration API 完全指南'
description: '掌握设备振动控制：触觉反馈、游戏体验、通知提醒与交互增强开发'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'js-vibration-api-guide'
---

Vibration API 允许网页控制设备的振动功能。本文详解其使用方法和实战应用。

## 基础概念

### 检测支持

```javascript
// 检查 API 支持
if ('vibrate' in navigator) {
  console.log('Vibration API 受支持');
} else {
  console.log('Vibration API 不受支持');
}

// 安全的振动函数
function vibrate(pattern) {
  if ('vibrate' in navigator) {
    return navigator.vibrate(pattern);
  }
  return false;
}
```

### 简单振动

```javascript
// 振动 200 毫秒
navigator.vibrate(200);

// 振动 1 秒
navigator.vibrate(1000);

// 停止振动
navigator.vibrate(0);
// 或
navigator.vibrate([]);
```

### 振动模式

```javascript
// 模式: [振动, 暂停, 振动, 暂停, ...]
// 振动 100ms, 暂停 50ms, 振动 100ms
navigator.vibrate([100, 50, 100]);

// SOS 摩尔斯电码
// ... --- ... (3短 3长 3短)
const sos = [
  100, 50, 100, 50, 100, // S: ...
  200,                    // 间隔
  300, 50, 300, 50, 300, // O: ---
  200,                    // 间隔
  100, 50, 100, 50, 100  // S: ...
];
navigator.vibrate(sos);

// 心跳模式
const heartbeat = [100, 100, 100, 400];
navigator.vibrate(heartbeat);
```

## 振动管理器

### 封装类

```javascript
class VibrationManager {
  constructor() {
    this.isSupported = 'vibrate' in navigator;
    this.isEnabled = true;
    this.currentPattern = null;
  }
  
  // 检查是否可以振动
  canVibrate() {
    return this.isSupported && this.isEnabled;
  }
  
  // 启用/禁用振动
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }
  
  // 简单振动
  vibrate(duration = 100) {
    if (!this.canVibrate()) return false;
    return navigator.vibrate(duration);
  }
  
  // 模式振动
  pattern(pattern) {
    if (!this.canVibrate()) return false;
    this.currentPattern = pattern;
    return navigator.vibrate(pattern);
  }
  
  // 重复模式
  repeat(pattern, times) {
    if (!this.canVibrate()) return false;
    
    const repeatedPattern = [];
    for (let i = 0; i < times; i++) {
      repeatedPattern.push(...pattern);
      if (i < times - 1) {
        // 添加间隔
        repeatedPattern.push(pattern[pattern.length - 1] || 100);
      }
    }
    
    return navigator.vibrate(repeatedPattern);
  }
  
  // 停止振动
  stop() {
    if (this.isSupported) {
      navigator.vibrate(0);
      this.currentPattern = null;
    }
  }
}

// 使用
const vibration = new VibrationManager();

// 简单振动
vibration.vibrate(200);

// 模式振动
vibration.pattern([100, 50, 100]);

// 重复 3 次
vibration.repeat([100, 50, 100], 3);

// 禁用振动
vibration.setEnabled(false);
```

### 预设模式库

```javascript
class VibrationPatterns {
  static patterns = {
    // 通知类型
    notification: [100, 50, 100],
    success: [50, 50, 100],
    error: [100, 50, 100, 50, 100],
    warning: [200, 100, 200],
    
    // 交互反馈
    tap: [10],
    doubleTap: [10, 50, 10],
    longPress: [50],
    
    // 游戏效果
    explosion: [100, 30, 50, 30, 200],
    hit: [30],
    powerUp: [50, 30, 50, 30, 100],
    gameOver: [200, 100, 200, 100, 500],
    
    // 特殊模式
    heartbeat: [100, 100, 100, 400],
    alarm: [500, 200, 500, 200, 500],
    sos: [100, 50, 100, 50, 100, 200, 300, 50, 300, 50, 300, 200, 100, 50, 100, 50, 100],
    
    // 音乐节奏
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

// 使用
VibrationPatterns.play('success');
VibrationPatterns.play('heartbeat');

// 注册自定义模式
VibrationPatterns.register('custom', [75, 25, 75, 25, 150]);
VibrationPatterns.play('custom');
```

## 实际应用

### 触觉反馈按钮

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

// 使用
document.querySelectorAll('.haptic-btn').forEach(btn => {
  new HapticButton(btn, {
    pattern: [15],
    enabled: true
  });
});

// 不同按钮不同反馈
new HapticButton(document.getElementById('submit-btn'), {
  pattern: VibrationPatterns.get('success')
});

new HapticButton(document.getElementById('delete-btn'), {
  pattern: VibrationPatterns.get('warning')
});
```

### 游戏振动反馈

```javascript
class GameHaptics {
  constructor() {
    this.vibration = new VibrationManager();
    this.intensityMultiplier = 1;
  }
  
  // 设置强度系数
  setIntensity(multiplier) {
    this.intensityMultiplier = Math.max(0, Math.min(2, multiplier));
  }
  
  // 应用强度
  applyIntensity(pattern) {
    return pattern.map(duration => 
      Math.round(duration * this.intensityMultiplier)
    );
  }
  
  // 碰撞反馈
  collision(force = 1) {
    const baseDuration = 30;
    const duration = Math.round(baseDuration * force * this.intensityMultiplier);
    this.vibration.vibrate(Math.min(duration, 200));
  }
  
  // 爆炸效果
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
  
  // 受击效果
  hit(damage = 1) {
    const duration = Math.round(20 + damage * 30);
    this.vibration.vibrate(Math.min(duration, 150));
  }
  
  // 拾取道具
  pickup() {
    this.vibration.pattern(this.applyIntensity([30, 30, 50]));
  }
  
  // 升级效果
  levelUp() {
    this.vibration.pattern(this.applyIntensity([50, 50, 50, 50, 100, 100, 200]));
  }
  
  // 游戏结束
  gameOver() {
    this.vibration.pattern(this.applyIntensity([200, 100, 200, 100, 500]));
  }
  
  // 胜利效果
  victory() {
    this.vibration.pattern(this.applyIntensity([
      100, 50, 100, 50, 100, 100,
      200, 100, 200, 100,
      300
    ]));
  }
  
  // 倒计时
  countdown(remaining) {
    if (remaining <= 3) {
      this.vibration.vibrate(100 + (4 - remaining) * 50);
    }
  }
}

// 使用
const haptics = new GameHaptics();
haptics.setIntensity(1.2);

// 游戏事件
game.on('collision', (force) => haptics.collision(force));
game.on('explosion', () => haptics.explosion());
game.on('hit', (damage) => haptics.hit(damage));
game.on('pickup', () => haptics.pickup());
game.on('levelUp', () => haptics.levelUp());
game.on('gameOver', () => haptics.gameOver());
```

### 表单验证反馈

```javascript
class FormHapticFeedback {
  constructor(form) {
    this.form = form;
    this.vibration = new VibrationManager();
    
    this.bindEvents();
  }
  
  bindEvents() {
    // 表单提交
    this.form.addEventListener('submit', (e) => {
      if (!this.form.checkValidity()) {
        e.preventDefault();
        this.onValidationError();
      } else {
        this.onSubmitSuccess();
      }
    });
    
    // 输入字段验证
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

// 使用
const form = document.getElementById('signup-form');
new FormHapticFeedback(form);
```

### 通知振动

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
    // 来电振动（持续振动）
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

// 使用
const notifVibration = new NotificationVibration();

// 收到消息
notifVibration.message();

// 来电
notifVibration.call();

// 接听或拒绝时停止
document.getElementById('answer-btn').addEventListener('click', () => {
  notifVibration.stopRinging();
});
```

### 摩尔斯电码生成器

```javascript
class MorseVibrator {
  constructor() {
    this.vibration = new VibrationManager();
    
    // 时间单位（毫秒）
    this.unit = 100;
    
    // 摩尔斯电码表
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
  
  // 文本转振动模式
  textToPattern(text) {
    const pattern = [];
    const upperText = text.toUpperCase();
    
    for (let i = 0; i < upperText.length; i++) {
      const char = upperText[i];
      
      if (char === ' ') {
        // 单词间隔（7 单位）
        pattern.push(0, this.unit * 7);
      } else if (this.morseCode[char]) {
        const morse = this.morseCode[char];
        
        for (let j = 0; j < morse.length; j++) {
          if (morse[j] === '.') {
            pattern.push(this.unit); // 点：1 单位
          } else {
            pattern.push(this.unit * 3); // 划：3 单位
          }
          
          // 符号间隔（1 单位）
          if (j < morse.length - 1) {
            pattern.push(this.unit);
          }
        }
        
        // 字符间隔（3 单位）
        if (i < upperText.length - 1 && upperText[i + 1] !== ' ') {
          pattern.push(this.unit * 3);
        }
      }
    }
    
    return pattern.filter(d => d > 0);
  }
  
  // 振动发送文本
  send(text) {
    const pattern = this.textToPattern(text);
    this.vibration.pattern(pattern);
    return pattern;
  }
  
  // 发送 SOS
  sendSOS() {
    return this.send('SOS');
  }
  
  // 设置速度
  setSpeed(wpm) {
    // 标准：PARIS = 50 单位，每分钟 wpm 个 PARIS
    this.unit = Math.round(1200 / wpm);
  }
}

// 使用
const morse = new MorseVibrator();
morse.setSpeed(15); // 15 WPM

// 发送消息
morse.send('HELLO');

// 发送 SOS
document.getElementById('sos-btn').addEventListener('click', () => {
  morse.sendSOS();
});
```

### 音乐节拍振动

```javascript
class RhythmVibrator {
  constructor() {
    this.vibration = new VibrationManager();
    this.bpm = 120;
    this.isPlaying = false;
    this.beatInterval = null;
  }
  
  // 设置 BPM
  setBPM(bpm) {
    this.bpm = Math.max(30, Math.min(300, bpm));
    
    // 如果正在播放，重新开始
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }
  
  // 计算拍子间隔（毫秒）
  getBeatInterval() {
    return 60000 / this.bpm;
  }
  
  // 开始节拍
  start() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    const interval = this.getBeatInterval();
    
    // 立即振动一次
    this.beat();
    
    this.beatInterval = setInterval(() => {
      this.beat();
    }, interval);
  }
  
  // 单次拍子
  beat() {
    this.vibration.vibrate(30);
  }
  
  // 停止
  stop() {
    this.isPlaying = false;
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
    this.vibration.stop();
  }
  
  // 播放节奏模式
  playPattern(pattern, repeat = 1) {
    // pattern 示例: [1, 0, 1, 0, 1, 1, 0, 1]
    // 1 = 振动, 0 = 静音
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

// 使用
const rhythm = new RhythmVibrator();
rhythm.setBPM(100);

// 开始节拍
document.getElementById('start-rhythm').addEventListener('click', () => {
  rhythm.start();
});

// 停止
document.getElementById('stop-rhythm').addEventListener('click', () => {
  rhythm.stop();
});

// 播放 4/4 拍节奏
document.getElementById('pattern-44').addEventListener('click', () => {
  rhythm.playPattern([1, 0, 1, 0, 1, 0, 1, 0], 4);
});
```

## 最佳实践总结

```
Vibration API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   用户体验                                          │
│   ├── 提供禁用振动的选项                           │
│   ├── 振动时长保持简短                             │
│   ├── 避免过度使用振动                             │
│   └── 考虑用户场景（会议等）                       │
│                                                     │
│   性能考虑                                          │
│   ├── 避免连续高频振动                             │
│   ├── 长模式可能被系统中断                         │
│   ├── 后台页面振动可能不工作                       │
│   └── 电量消耗需考虑                               │
│                                                     │
│   兼容性处理                                        │
│   ├── 始终检查 API 支持                            │
│   ├── 桌面浏览器通常不支持                         │
│   ├── 提供非振动替代方案                           │
│   └── iOS Safari 不支持                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐时长 | 模式示例 |
|------|----------|----------|
| 轻触反馈 | 5-15ms | [10] |
| 点击确认 | 15-30ms | [20] |
| 成功提示 | 50-100ms | [50, 30, 80] |
| 错误警告 | 100-200ms | [100, 50, 100] |
| 通知提醒 | 200-500ms | [200, 100, 200] |

---

*善用 Vibration API，提升移动端交互体验。*
