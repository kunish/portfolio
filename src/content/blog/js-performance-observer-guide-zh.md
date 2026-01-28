---
title: 'JavaScript PerformanceObserver API 完全指南'
description: '掌握性能监控：Core Web Vitals、资源加载、长任务检测与性能分析'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'js-performance-observer-guide'
---

PerformanceObserver API 提供了监听性能指标的能力。本文详解其用法和实战应用。

## 基础概念

### 创建观察器

```javascript
// 创建观察器
const observer = new PerformanceObserver((list, observer) => {
  const entries = list.getEntries();

  entries.forEach(entry => {
    console.log(entry.name, entry.entryType, entry.duration);
  });
});

// 开始观察
observer.observe({ entryTypes: ['resource', 'paint', 'longtask'] });

// 断开观察
observer.disconnect();

// 获取已观察的记录
const records = observer.takeRecords();
```

### 支持的条目类型

```javascript
// 获取支持的类型
const supportedTypes = PerformanceObserver.supportedEntryTypes;
console.log(supportedTypes);

// 常见类型：
// - 'navigation': 页面导航
// - 'resource': 资源加载
// - 'paint': 绘制时机
// - 'mark': 自定义标记
// - 'measure': 自定义测量
// - 'longtask': 长任务
// - 'element': 元素时机
// - 'first-input': 首次输入
// - 'largest-contentful-paint': LCP
// - 'layout-shift': 布局偏移

// 按类型观察
observer.observe({ type: 'resource', buffered: true });

// buffered: true 包含在观察开始前的条目
```

### PerformanceEntry

```javascript
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    // 通用属性
    console.log(entry.name);        // 条目名称
    console.log(entry.entryType);   // 条目类型
    console.log(entry.startTime);   // 开始时间
    console.log(entry.duration);    // 持续时间

    // 转为 JSON
    console.log(entry.toJSON());
  });
});
```

## Core Web Vitals

### Largest Contentful Paint (LCP)

```javascript
class LCPObserver {
  constructor(callback) {
    this.callback = callback;
    this.lastLCP = null;

    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      // LCP 可能多次触发，取最后一个
      entries.forEach(entry => {
        this.lastLCP = {
          value: entry.startTime,
          element: entry.element,
          size: entry.size,
          url: entry.url,
          id: entry.id
        };
      });
    });

    try {
      this.observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP 不支持');
    }

    // 页面隐藏时报告最终 LCP
    this.handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && this.lastLCP) {
        this.report();
      }
    };

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  report() {
    if (this.lastLCP) {
      this.callback(this.lastLCP);
      this.lastLCP = null;
    }
  }

  disconnect() {
    this.observer.disconnect();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.report();
  }
}

// 使用
const lcpObserver = new LCPObserver((lcp) => {
  console.log('LCP:', lcp.value.toFixed(0) + 'ms');

  // 发送到分析服务
  sendAnalytics('lcp', {
    value: lcp.value,
    element: lcp.element?.tagName
  });
});
```

### First Input Delay (FID)

```javascript
class FIDObserver {
  constructor(callback) {
    this.callback = callback;

    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach(entry => {
        // FID 是首次输入延迟
        const fid = {
          value: entry.processingStart - entry.startTime,
          name: entry.name,
          target: entry.target,
          startTime: entry.startTime
        };

        this.callback(fid);
      });
    });

    try {
      this.observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID 不支持');
    }
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用
const fidObserver = new FIDObserver((fid) => {
  console.log('FID:', fid.value.toFixed(0) + 'ms');
  console.log('触发事件:', fid.name);
});
```

### Cumulative Layout Shift (CLS)

```javascript
class CLSObserver {
  constructor(callback) {
    this.callback = callback;
    this.clsValue = 0;
    this.clsEntries = [];

    // 会话窗口用于计算
    this.sessionValue = 0;
    this.sessionEntries = [];
    this.firstSessionEntry = null;

    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        // 忽略用户输入后的偏移
        if (!entry.hadRecentInput) {
          this.processEntry(entry);
        }
      });
    });

    try {
      this.observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('CLS 不支持');
    }

    // 页面隐藏时报告
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.report();
      }
    });
  }

  processEntry(entry) {
    const firstEntry = this.sessionEntries[0];
    const lastEntry = this.sessionEntries[this.sessionEntries.length - 1];

    // 5秒内且与第一个条目间隔不超过1秒
    if (firstEntry &&
        entry.startTime - lastEntry.startTime < 1000 &&
        entry.startTime - firstEntry.startTime < 5000) {
      this.sessionValue += entry.value;
      this.sessionEntries.push(entry);
    } else {
      // 开始新会话
      this.sessionValue = entry.value;
      this.sessionEntries = [entry];
    }

    // 更新最大 CLS
    if (this.sessionValue > this.clsValue) {
      this.clsValue = this.sessionValue;
      this.clsEntries = [...this.sessionEntries];
    }
  }

  report() {
    this.callback({
      value: this.clsValue,
      entries: this.clsEntries
    });
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用
const clsObserver = new CLSObserver((cls) => {
  console.log('CLS:', cls.value.toFixed(4));

  if (cls.value > 0.1) {
    console.warn('CLS 超标，检查布局偏移源');
    cls.entries.forEach(entry => {
      console.log('偏移元素:', entry.sources);
    });
  }
});
```

## 资源监控

### 资源加载性能

```javascript
class ResourceObserver {
  constructor(options = {}) {
    this.options = {
      onResource: () => {},
      filter: () => true,
      ...options
    };

    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (this.options.filter(entry)) {
          const metrics = this.parseResourceTiming(entry);
          this.options.onResource(metrics);
        }
      });
    });

    this.observer.observe({ type: 'resource', buffered: true });
  }

  parseResourceTiming(entry) {
    return {
      name: entry.name,
      initiatorType: entry.initiatorType,

      // 时间分解
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.secureConnectionStart > 0
        ? entry.connectEnd - entry.secureConnectionStart
        : 0,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      total: entry.duration,

      // 传输信息
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,

      // 缓存状态
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,

      // 原始条目
      entry
    };
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用
const resourceObserver = new ResourceObserver({
  onResource: (metrics) => {
    // 只关注慢资源
    if (metrics.total > 1000) {
      console.log('慢资源:', metrics.name);
      console.log('  DNS:', metrics.dns + 'ms');
      console.log('  TCP:', metrics.tcp + 'ms');
      console.log('  TTFB:', metrics.ttfb + 'ms');
      console.log('  下载:', metrics.download + 'ms');
    }
  },
  filter: (entry) => {
    // 过滤分析请求
    return !entry.name.includes('analytics');
  }
});
```

### 资源加载瀑布图

```javascript
class ResourceWaterfall {
  constructor(container) {
    this.container = container;
    this.resources = [];

    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.resources.push(entry);
      });
      this.render();
    });

    this.observer.observe({ type: 'resource', buffered: true });
  }

  render() {
    const maxTime = Math.max(...this.resources.map(r => r.responseEnd));

    this.container.textContent = '';

    // 创建时间轴
    const timeline = document.createElement('div');
    timeline.className = 'waterfall-timeline';

    this.resources.forEach(resource => {
      const row = this.createRow(resource, maxTime);
      timeline.appendChild(row);
    });

    this.container.appendChild(timeline);
  }

  createRow(resource, maxTime) {
    const row = document.createElement('div');
    row.className = 'waterfall-row';

    // 资源名称
    const name = document.createElement('div');
    name.className = 'resource-name';
    name.textContent = this.getFileName(resource.name);
    name.title = resource.name;

    // 时间条
    const bar = document.createElement('div');
    bar.className = 'resource-bar';

    const startPercent = (resource.startTime / maxTime) * 100;
    const widthPercent = (resource.duration / maxTime) * 100;

    bar.style.marginLeft = startPercent + '%';
    bar.style.width = Math.max(widthPercent, 0.5) + '%';

    // 类型颜色
    bar.classList.add('type-' + resource.initiatorType);

    // 时间标签
    const time = document.createElement('span');
    time.className = 'resource-time';
    time.textContent = resource.duration.toFixed(0) + 'ms';

    row.appendChild(name);
    row.appendChild(bar);
    row.appendChild(time);

    return row;
  }

  getFileName(url) {
    try {
      return new URL(url).pathname.split('/').pop() || url;
    } catch {
      return url;
    }
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用
const waterfall = new ResourceWaterfall(
  document.getElementById('waterfall')
);
```

## 长任务检测

### 长任务监控

```javascript
class LongTaskObserver {
  constructor(options = {}) {
    this.options = {
      threshold: 50,
      onLongTask: () => {},
      ...options
    };

    this.tasks = [];

    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        const task = {
          startTime: entry.startTime,
          duration: entry.duration,
          name: entry.name,
          attribution: entry.attribution
        };

        this.tasks.push(task);
        this.options.onLongTask(task);
      });
    });

    try {
      this.observer.observe({ type: 'longtask', buffered: true });
    } catch (e) {
      console.warn('长任务监控不支持');
    }
  }

  getStats() {
    if (this.tasks.length === 0) {
      return { count: 0, total: 0, average: 0, max: 0 };
    }

    const durations = this.tasks.map(t => t.duration);
    const total = durations.reduce((a, b) => a + b, 0);

    return {
      count: this.tasks.length,
      total,
      average: total / this.tasks.length,
      max: Math.max(...durations)
    };
  }

  getTasks() {
    return [...this.tasks];
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用
const longTaskObserver = new LongTaskObserver({
  onLongTask: (task) => {
    console.warn('长任务检测:', task.duration.toFixed(0) + 'ms');

    if (task.attribution && task.attribution.length > 0) {
      task.attribution.forEach(attr => {
        console.log('  来源:', attr.containerType, attr.containerName);
      });
    }
  }
});

// 获取统计
setTimeout(() => {
  const stats = longTaskObserver.getStats();
  console.log('长任务统计:', stats);
}, 10000);
```

### 帧率监控

```javascript
class FrameRateMonitor {
  constructor(callback) {
    this.callback = callback;
    this.frames = [];
    this.lastTime = performance.now();
    this.running = false;

    // 使用 PerformanceObserver 监控帧
    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'frame') {
          this.frames.push(entry.duration);
        }
      });
    });

    // frame 类型可能不支持，使用 RAF 替代
    this.rafLoop = this.rafLoop.bind(this);
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.frames = [];
    this.rafLoop();
  }

  rafLoop() {
    if (!this.running) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    this.frames.push(delta);

    // 保留最近 60 帧
    if (this.frames.length > 60) {
      this.frames.shift();
    }

    // 计算 FPS
    const avgDelta = this.frames.reduce((a, b) => a + b) / this.frames.length;
    const fps = 1000 / avgDelta;

    this.callback({
      fps: Math.round(fps),
      avgFrameTime: avgDelta,
      dropped: this.frames.filter(f => f > 16.67).length
    });

    requestAnimationFrame(this.rafLoop);
  }

  stop() {
    this.running = false;
  }
}

// 使用
const fpsMonitor = new FrameRateMonitor((data) => {
  if (data.fps < 30) {
    console.warn('低帧率:', data.fps + ' FPS');
  }
});

fpsMonitor.start();
```

## 自定义标记和测量

### 性能标记

```javascript
class PerformanceMarker {
  constructor() {
    this.markers = new Map();
  }

  mark(name) {
    performance.mark(name);
    this.markers.set(name, performance.now());
  }

  measure(name, startMark, endMark) {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name, 'measure');
      return entries[entries.length - 1];
    } catch (e) {
      console.error('测量失败:', e);
      return null;
    }
  }

  measureSince(name, startMark) {
    const endMark = name + '-end';
    this.mark(endMark);
    return this.measure(name, startMark, endMark);
  }

  clear(name) {
    if (name) {
      performance.clearMarks(name);
      performance.clearMeasures(name);
    } else {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  getMarks() {
    return performance.getEntriesByType('mark');
  }

  getMeasures() {
    return performance.getEntriesByType('measure');
  }
}

// 使用
const marker = new PerformanceMarker();

// 标记操作开始
marker.mark('dataFetch-start');

// 执行操作
await fetchData();

// 测量持续时间
const measure = marker.measureSince('dataFetch', 'dataFetch-start');
console.log('数据获取耗时:', measure.duration + 'ms');
```

### 用户操作追踪

```javascript
class UserActionTracker {
  constructor() {
    this.actions = new Map();

    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'measure' && entry.name.startsWith('action:')) {
          const actionName = entry.name.replace('action:', '');
          console.log('操作完成:', actionName, entry.duration + 'ms');
        }
      });
    });

    this.observer.observe({ entryTypes: ['measure'] });
  }

  startAction(name) {
    const markName = 'action-start:' + name;
    performance.mark(markName);
    this.actions.set(name, markName);
  }

  endAction(name, metadata = {}) {
    const startMark = this.actions.get(name);
    if (!startMark) {
      console.warn('未找到操作开始标记:', name);
      return null;
    }

    const endMark = 'action-end:' + name;
    performance.mark(endMark);

    const measureName = 'action:' + name;
    performance.measure(measureName, startMark, endMark);

    const entries = performance.getEntriesByName(measureName, 'measure');
    const measure = entries[entries.length - 1];

    // 清理
    this.actions.delete(name);
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);

    return {
      name,
      duration: measure.duration,
      ...metadata
    };
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用
const tracker = new UserActionTracker();

// 追踪表单提交
submitButton.addEventListener('click', async () => {
  tracker.startAction('formSubmit');

  try {
    await submitForm();
    const result = tracker.endAction('formSubmit', { success: true });
    console.log('提交耗时:', result.duration + 'ms');
  } catch (error) {
    tracker.endAction('formSubmit', { success: false, error: error.message });
  }
});
```

## 性能报告

### 综合性能报告

```javascript
class PerformanceReporter {
  constructor() {
    this.metrics = {};
    this.setupObservers();
  }

  setupObservers() {
    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      this.metrics.lcp = entries[entries.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // FID
    new PerformanceObserver((list) => {
      const entry = list.getEntries()[0];
      this.metrics.fid = entry.processingStart - entry.startTime;
    }).observe({ type: 'first-input', buffered: true });

    // CLS
    let clsValue = 0;
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.cls = clsValue;
    }).observe({ type: 'layout-shift', buffered: true });

    // 导航时间
    new PerformanceObserver((list) => {
      const entry = list.getEntries()[0];
      this.metrics.navigation = {
        dns: entry.domainLookupEnd - entry.domainLookupStart,
        tcp: entry.connectEnd - entry.connectStart,
        ttfb: entry.responseStart - entry.requestStart,
        domLoad: entry.domContentLoadedEventEnd - entry.startTime,
        load: entry.loadEventEnd - entry.startTime
      };
    }).observe({ type: 'navigation', buffered: true });

    // Paint
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.name === 'first-paint') {
          this.metrics.fp = entry.startTime;
        }
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
        }
      });
    }).observe({ type: 'paint', buffered: true });
  }

  getReport() {
    return {
      timestamp: Date.now(),
      url: location.href,
      metrics: { ...this.metrics },
      rating: this.getRating()
    };
  }

  getRating() {
    const { lcp, fid, cls } = this.metrics;

    return {
      lcp: lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor',
      fid: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor',
      cls: cls < 0.1 ? 'good' : cls < 0.25 ? 'needs-improvement' : 'poor'
    };
  }

  send() {
    const report = this.getReport();
    console.log('性能报告:', report);

    // 发送到服务器
    navigator.sendBeacon('/api/performance', JSON.stringify(report));
  }
}

// 使用
const reporter = new PerformanceReporter();

// 页面卸载时发送报告
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    reporter.send();
  }
});
```

## 最佳实践总结

```
PerformanceObserver 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   监控策略                                          │
│   ├── 使用 buffered: true 获取历史数据             │
│   ├── 页面隐藏时报告最终数据                       │
│   ├── 合理设置采样率                               │
│   └── 过滤无关条目                                 │
│                                                     │
│   Core Web Vitals                                   │
│   ├── LCP < 2.5s (良好)                            │
│   ├── FID < 100ms (良好)                           │
│   ├── CLS < 0.1 (良好)                             │
│   └── 使用 web-vitals 库简化                       │
│                                                     │
│   注意事项                                          │
│   ├── 检查浏览器支持                               │
│   ├── 处理异常情况                                 │
│   ├── 避免性能监控影响性能                         │
│   └── 使用 sendBeacon 发送数据                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 指标 | 良好 | 需改进 | 差 |
|------|------|--------|-----|
| LCP | < 2.5s | 2.5-4s | > 4s |
| FID | < 100ms | 100-300ms | > 300ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |

---

*掌握 PerformanceObserver API，构建全面的性能监控体系。*
