---
title: 'JavaScript PerformanceObserver API Complete Guide'
description: 'Master performance monitoring: Core Web Vitals, resource loading, long task detection, and performance analysis'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'js-performance-observer-guide'
---

The PerformanceObserver API provides the ability to monitor performance metrics. This article covers its usage and practical applications.

## Basic Concepts

### Creating an Observer

```javascript
// Create observer
const observer = new PerformanceObserver((list, observer) => {
  const entries = list.getEntries();

  entries.forEach(entry => {
    console.log(entry.name, entry.entryType, entry.duration);
  });
});

// Start observing
observer.observe({ entryTypes: ['resource', 'paint', 'longtask'] });

// Disconnect
observer.disconnect();

// Get recorded entries
const records = observer.takeRecords();
```

### Supported Entry Types

```javascript
// Get supported types
const supportedTypes = PerformanceObserver.supportedEntryTypes;
console.log(supportedTypes);

// Common types:
// - 'navigation': Page navigation
// - 'resource': Resource loading
// - 'paint': Paint timing
// - 'mark': Custom marks
// - 'measure': Custom measurements
// - 'longtask': Long tasks
// - 'element': Element timing
// - 'first-input': First input
// - 'largest-contentful-paint': LCP
// - 'layout-shift': Layout shifts

// Observe by type
observer.observe({ type: 'resource', buffered: true });

// buffered: true includes entries before observation started
```

### PerformanceEntry

```javascript
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    // Common properties
    console.log(entry.name);        // Entry name
    console.log(entry.entryType);   // Entry type
    console.log(entry.startTime);   // Start time
    console.log(entry.duration);    // Duration

    // Convert to JSON
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

      // LCP may fire multiple times, take the last one
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
      console.warn('LCP not supported');
    }

    // Report final LCP when page is hidden
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

// Usage
const lcpObserver = new LCPObserver((lcp) => {
  console.log('LCP:', lcp.value.toFixed(0) + 'ms');

  // Send to analytics
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
        // FID is the first input delay
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
      console.warn('FID not supported');
    }
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// Usage
const fidObserver = new FIDObserver((fid) => {
  console.log('FID:', fid.value.toFixed(0) + 'ms');
  console.log('Trigger event:', fid.name);
});
```

### Cumulative Layout Shift (CLS)

```javascript
class CLSObserver {
  constructor(callback) {
    this.callback = callback;
    this.clsValue = 0;
    this.clsEntries = [];

    // Session window for calculation
    this.sessionValue = 0;
    this.sessionEntries = [];
    this.firstSessionEntry = null;

    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        // Ignore shifts after user input
        if (!entry.hadRecentInput) {
          this.processEntry(entry);
        }
      });
    });

    try {
      this.observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('CLS not supported');
    }

    // Report when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.report();
      }
    });
  }

  processEntry(entry) {
    const firstEntry = this.sessionEntries[0];
    const lastEntry = this.sessionEntries[this.sessionEntries.length - 1];

    // Within 5 seconds and less than 1 second gap from first entry
    if (firstEntry &&
        entry.startTime - lastEntry.startTime < 1000 &&
        entry.startTime - firstEntry.startTime < 5000) {
      this.sessionValue += entry.value;
      this.sessionEntries.push(entry);
    } else {
      // Start new session
      this.sessionValue = entry.value;
      this.sessionEntries = [entry];
    }

    // Update max CLS
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

// Usage
const clsObserver = new CLSObserver((cls) => {
  console.log('CLS:', cls.value.toFixed(4));

  if (cls.value > 0.1) {
    console.warn('CLS exceeds threshold, check layout shift sources');
    cls.entries.forEach(entry => {
      console.log('Shift element:', entry.sources);
    });
  }
});
```

## Resource Monitoring

### Resource Loading Performance

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

      // Time breakdown
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.secureConnectionStart > 0
        ? entry.connectEnd - entry.secureConnectionStart
        : 0,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      total: entry.duration,

      // Transfer info
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,

      // Cache status
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,

      // Original entry
      entry
    };
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// Usage
const resourceObserver = new ResourceObserver({
  onResource: (metrics) => {
    // Only care about slow resources
    if (metrics.total > 1000) {
      console.log('Slow resource:', metrics.name);
      console.log('  DNS:', metrics.dns + 'ms');
      console.log('  TCP:', metrics.tcp + 'ms');
      console.log('  TTFB:', metrics.ttfb + 'ms');
      console.log('  Download:', metrics.download + 'ms');
    }
  },
  filter: (entry) => {
    // Filter analytics requests
    return !entry.name.includes('analytics');
  }
});
```

### Resource Waterfall

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

    // Create timeline
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

    // Resource name
    const name = document.createElement('div');
    name.className = 'resource-name';
    name.textContent = this.getFileName(resource.name);
    name.title = resource.name;

    // Time bar
    const bar = document.createElement('div');
    bar.className = 'resource-bar';

    const startPercent = (resource.startTime / maxTime) * 100;
    const widthPercent = (resource.duration / maxTime) * 100;

    bar.style.marginLeft = startPercent + '%';
    bar.style.width = Math.max(widthPercent, 0.5) + '%';

    // Type color
    bar.classList.add('type-' + resource.initiatorType);

    // Time label
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

// Usage
const waterfall = new ResourceWaterfall(
  document.getElementById('waterfall')
);
```

## Long Task Detection

### Long Task Monitoring

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
      console.warn('Long task monitoring not supported');
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

// Usage
const longTaskObserver = new LongTaskObserver({
  onLongTask: (task) => {
    console.warn('Long task detected:', task.duration.toFixed(0) + 'ms');

    if (task.attribution && task.attribution.length > 0) {
      task.attribution.forEach(attr => {
        console.log('  Source:', attr.containerType, attr.containerName);
      });
    }
  }
});

// Get statistics
setTimeout(() => {
  const stats = longTaskObserver.getStats();
  console.log('Long task stats:', stats);
}, 10000);
```

### Frame Rate Monitoring

```javascript
class FrameRateMonitor {
  constructor(callback) {
    this.callback = callback;
    this.frames = [];
    this.lastTime = performance.now();
    this.running = false;

    // Use PerformanceObserver for frames
    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'frame') {
          this.frames.push(entry.duration);
        }
      });
    });

    // frame type may not be supported, use RAF fallback
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

    // Keep last 60 frames
    if (this.frames.length > 60) {
      this.frames.shift();
    }

    // Calculate FPS
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

// Usage
const fpsMonitor = new FrameRateMonitor((data) => {
  if (data.fps < 30) {
    console.warn('Low frame rate:', data.fps + ' FPS');
  }
});

fpsMonitor.start();
```

## Custom Marks and Measures

### Performance Marking

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
      console.error('Measure failed:', e);
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

// Usage
const marker = new PerformanceMarker();

// Mark operation start
marker.mark('dataFetch-start');

// Execute operation
await fetchData();

// Measure duration
const measure = marker.measureSince('dataFetch', 'dataFetch-start');
console.log('Data fetch took:', measure.duration + 'ms');
```

### User Action Tracking

```javascript
class UserActionTracker {
  constructor() {
    this.actions = new Map();

    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'measure' && entry.name.startsWith('action:')) {
          const actionName = entry.name.replace('action:', '');
          console.log('Action completed:', actionName, entry.duration + 'ms');
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
      console.warn('Action start mark not found:', name);
      return null;
    }

    const endMark = 'action-end:' + name;
    performance.mark(endMark);

    const measureName = 'action:' + name;
    performance.measure(measureName, startMark, endMark);

    const entries = performance.getEntriesByName(measureName, 'measure');
    const measure = entries[entries.length - 1];

    // Cleanup
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

// Usage
const tracker = new UserActionTracker();

// Track form submission
submitButton.addEventListener('click', async () => {
  tracker.startAction('formSubmit');

  try {
    await submitForm();
    const result = tracker.endAction('formSubmit', { success: true });
    console.log('Submit took:', result.duration + 'ms');
  } catch (error) {
    tracker.endAction('formSubmit', { success: false, error: error.message });
  }
});
```

## Performance Reporting

### Comprehensive Performance Report

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

    // Navigation timing
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
    console.log('Performance report:', report);

    // Send to server
    navigator.sendBeacon('/api/performance', JSON.stringify(report));
  }
}

// Usage
const reporter = new PerformanceReporter();

// Send report when page unloads
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    reporter.send();
  }
});
```

## Best Practices Summary

```
PerformanceObserver Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Monitoring Strategy                               │
│   ├── Use buffered: true for historical data       │
│   ├── Report final data when page is hidden        │
│   ├── Set reasonable sampling rates                │
│   └── Filter irrelevant entries                    │
│                                                     │
│   Core Web Vitals                                   │
│   ├── LCP < 2.5s (good)                            │
│   ├── FID < 100ms (good)                           │
│   ├── CLS < 0.1 (good)                             │
│   └── Use web-vitals library for simplicity        │
│                                                     │
│   Considerations                                    │
│   ├── Check browser support                        │
│   ├── Handle exceptions                            │
│   ├── Avoid monitoring affecting performance       │
│   └── Use sendBeacon for data transmission         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5-4s | > 4s |
| FID | < 100ms | 100-300ms | > 300ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |

---

*Master the PerformanceObserver API to build comprehensive performance monitoring systems.*
