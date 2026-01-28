---
title: 'JavaScript ResizeObserver API Complete Guide'
description: 'Master element size monitoring: responsive components, adaptive layouts, performance optimization, and practical applications'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'js-resize-observer-guide'
---

The ResizeObserver API provides the ability to monitor element size changes. This article covers its usage and practical applications.

## Basic Concepts

### Creating an Observer

```javascript
// Create observer
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    console.log('Element resized:', entry.target);
    console.log('New size:', entry.contentRect.width, entry.contentRect.height);
  });
});

// Start observing
const element = document.getElementById('target');
observer.observe(element);

// Stop observing specific element
observer.unobserve(element);

// Disconnect all observations
observer.disconnect();
```

### ResizeObserverEntry

```javascript
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // Observed element
    console.log(entry.target);

    // Content box size (excluding padding and border)
    console.log(entry.contentRect);
    // { x, y, width, height, top, right, bottom, left }

    // Content box size (array form)
    console.log(entry.contentBoxSize);
    // [{ inlineSize, blockSize }]

    // Border box size
    console.log(entry.borderBoxSize);
    // [{ inlineSize, blockSize }]

    // Device pixel content box size
    console.log(entry.devicePixelContentBoxSize);
    // [{ inlineSize, blockSize }]
  });
});
```

### Observation Options

```javascript
const observer = new ResizeObserver(callback);

// Default: observe content box
observer.observe(element);

// Specify box model to observe
observer.observe(element, { box: 'content-box' }); // Default
observer.observe(element, { box: 'border-box' });
observer.observe(element, { box: 'device-pixel-content-box' });
```

## Practical Applications

### Responsive Component

```javascript
class ResponsiveComponent {
  constructor(element) {
    this.element = element;
    this.breakpoints = {
      small: 320,
      medium: 640,
      large: 1024
    };

    this.observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      this.handleResize(entry.contentRect.width);
    });

    this.observer.observe(element);
  }

  handleResize(width) {
    const element = this.element;

    // Remove all size classes
    element.classList.remove('size-small', 'size-medium', 'size-large');

    // Add corresponding size class
    if (width < this.breakpoints.small) {
      element.classList.add('size-small');
    } else if (width < this.breakpoints.medium) {
      element.classList.add('size-medium');
    } else {
      element.classList.add('size-large');
    }

    // Dispatch custom event
    element.dispatchEvent(new CustomEvent('componentresize', {
      detail: { width, breakpoint: this.getCurrentBreakpoint(width) }
    }));
  }

  getCurrentBreakpoint(width) {
    if (width < this.breakpoints.small) return 'small';
    if (width < this.breakpoints.medium) return 'medium';
    return 'large';
  }

  setBreakpoints(breakpoints) {
    this.breakpoints = { ...this.breakpoints, ...breakpoints };
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
const component = new ResponsiveComponent(
  document.getElementById('myComponent')
);

// Listen for custom event
document.getElementById('myComponent').addEventListener('componentresize', (e) => {
  console.log('Current breakpoint:', e.detail.breakpoint);
});
```

### Auto-Fit Text

```javascript
class AutoFitText {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      minSize: 12,
      maxSize: 100,
      step: 1,
      ...options
    };

    this.originalText = element.textContent;
    this.observer = new ResizeObserver(() => this.fitText());
    this.observer.observe(element);
  }

  fitText() {
    const element = this.element;
    const containerWidth = element.clientWidth;

    // Create measuring element
    const measurer = document.createElement('span');
    measurer.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;';
    measurer.textContent = this.originalText;
    document.body.appendChild(measurer);

    let fontSize = this.options.maxSize;

    // Binary search for appropriate font size
    let min = this.options.minSize;
    let max = this.options.maxSize;

    while (max - min > this.options.step) {
      fontSize = Math.floor((min + max) / 2);
      measurer.style.fontSize = fontSize + 'px';

      if (measurer.offsetWidth > containerWidth) {
        max = fontSize;
      } else {
        min = fontSize;
      }
    }

    document.body.removeChild(measurer);

    element.style.fontSize = min + 'px';
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
const autoText = new AutoFitText(
  document.getElementById('title'),
  { minSize: 16, maxSize: 72 }
);
```

### Responsive Chart

```javascript
class ResponsiveChart {
  constructor(container, chartOptions = {}) {
    this.container = container;
    this.chartOptions = chartOptions;
    this.chart = null;

    this.observer = new ResizeObserver(
      this.debounce(() => this.resize(), 100)
    );

    this.init();
    this.observer.observe(container);
  }

  init() {
    const { width, height } = this.container.getBoundingClientRect();

    this.chart = {
      width,
      height,
      render: () => this.render()
    };

    this.render();
  }

  resize() {
    const { width, height } = this.container.getBoundingClientRect();

    if (width !== this.chart.width || height !== this.chart.height) {
      this.chart.width = width;
      this.chart.height = height;
      this.render();
    }
  }

  render() {
    const { width, height } = this.chart;

    // Clear container
    this.container.textContent = '';

    // Create Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Draw chart
    this.drawChart(ctx, width, height);

    this.container.appendChild(canvas);
  }

  drawChart(ctx, width, height) {
    // Example: Draw simple bar chart
    const data = this.chartOptions.data || [30, 50, 80, 60, 40];
    const barWidth = (width - 40) / data.length - 10;
    const maxValue = Math.max(...data);

    ctx.fillStyle = '#4CAF50';

    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * (height - 40);
      const x = 20 + index * (barWidth + 10);
      const y = height - 20 - barHeight;

      ctx.fillRect(x, y, barWidth, barHeight);
    });
  }

  debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
const chart = new ResponsiveChart(
  document.getElementById('chartContainer'),
  { data: [25, 40, 65, 55, 80, 45] }
);
```

### Virtual Scrolling

```javascript
class VirtualScroller {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      itemHeight: 50,
      buffer: 5,
      items: [],
      renderItem: (item) => item.toString(),
      ...options
    };

    this.visibleItems = [];
    this.startIndex = 0;
    this.endIndex = 0;

    this.setupDOM();
    this.setupObserver();
    this.setupScrollListener();
    this.render();
  }

  setupDOM() {
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';

    // Create content container
    this.content = document.createElement('div');
    this.content.style.position = 'relative';
    this.updateContentHeight();

    // Create viewport container
    this.viewport = document.createElement('div');
    this.viewport.style.position = 'absolute';
    this.viewport.style.top = '0';
    this.viewport.style.left = '0';
    this.viewport.style.width = '100%';

    this.content.appendChild(this.viewport);
    this.container.appendChild(this.content);
  }

  setupObserver() {
    this.observer = new ResizeObserver((entries) => {
      this.containerHeight = entries[0].contentRect.height;
      this.render();
    });

    this.observer.observe(this.container);
  }

  setupScrollListener() {
    this.container.addEventListener('scroll', () => {
      this.render();
    });
  }

  updateContentHeight() {
    const totalHeight = this.options.items.length * this.options.itemHeight;
    this.content.style.height = totalHeight + 'px';
  }

  render() {
    const scrollTop = this.container.scrollTop;
    const { itemHeight, buffer, items, renderItem } = this.options;

    // Calculate visible range
    this.startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    this.endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + this.containerHeight) / itemHeight) + buffer
    );

    // Update viewport position
    this.viewport.style.transform = 'translateY(' + (this.startIndex * itemHeight) + 'px)';

    // Render visible items
    this.viewport.textContent = '';

    for (let i = this.startIndex; i < this.endIndex; i++) {
      const itemElement = document.createElement('div');
      itemElement.style.height = itemHeight + 'px';
      itemElement.style.boxSizing = 'border-box';
      itemElement.textContent = renderItem(items[i], i);
      this.viewport.appendChild(itemElement);
    }
  }

  setItems(items) {
    this.options.items = items;
    this.updateContentHeight();
    this.render();
  }

  scrollToIndex(index) {
    this.container.scrollTop = index * this.options.itemHeight;
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
const items = Array.from({ length: 10000 }, (_, i) => 'Item ' + (i + 1));

const scroller = new VirtualScroller(
  document.getElementById('scrollContainer'),
  {
    itemHeight: 40,
    items,
    renderItem: (item, index) => item + ' (Index: ' + index + ')'
  }
);
```

### Container Query Alternative

```javascript
class ContainerQuery {
  constructor(element, queries) {
    this.element = element;
    this.queries = queries;

    this.observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      this.evaluate(entry.contentRect);
    });

    this.observer.observe(element);
  }

  evaluate(rect) {
    const { width, height } = rect;

    Object.entries(this.queries).forEach(([name, condition]) => {
      const matches = this.testCondition(condition, width, height);
      this.element.classList.toggle(name, matches);
    });
  }

  testCondition(condition, width, height) {
    if (typeof condition === 'function') {
      return condition(width, height);
    }

    const { minWidth, maxWidth, minHeight, maxHeight } = condition;

    if (minWidth !== undefined && width < minWidth) return false;
    if (maxWidth !== undefined && width > maxWidth) return false;
    if (minHeight !== undefined && height < minHeight) return false;
    if (maxHeight !== undefined && height > maxHeight) return false;

    return true;
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
const containerQuery = new ContainerQuery(
  document.getElementById('card'),
  {
    'card-small': { maxWidth: 300 },
    'card-medium': { minWidth: 301, maxWidth: 600 },
    'card-large': { minWidth: 601 },
    'card-square': (w, h) => Math.abs(w - h) < 50
  }
);
```

### Layout Change Detection

```javascript
class LayoutObserver {
  constructor(elements, callback) {
    this.elements = elements;
    this.callback = callback;
    this.sizes = new Map();

    this.observer = new ResizeObserver((entries) => {
      const changes = [];

      entries.forEach(entry => {
        const element = entry.target;
        const oldSize = this.sizes.get(element);
        const newSize = {
          width: entry.contentRect.width,
          height: entry.contentRect.height
        };

        if (oldSize) {
          if (oldSize.width !== newSize.width || oldSize.height !== newSize.height) {
            changes.push({
              element,
              oldSize,
              newSize,
              delta: {
                width: newSize.width - oldSize.width,
                height: newSize.height - oldSize.height
              }
            });
          }
        }

        this.sizes.set(element, newSize);
      });

      if (changes.length > 0) {
        this.callback(changes);
      }
    });

    elements.forEach(el => {
      this.observer.observe(el);
    });
  }

  add(element) {
    this.elements.push(element);
    this.observer.observe(element);
  }

  remove(element) {
    const index = this.elements.indexOf(element);
    if (index > -1) {
      this.elements.splice(index, 1);
      this.observer.unobserve(element);
      this.sizes.delete(element);
    }
  }

  destroy() {
    this.observer.disconnect();
    this.sizes.clear();
  }
}

// Usage
const elements = document.querySelectorAll('.resizable');

const layoutObserver = new LayoutObserver(
  Array.from(elements),
  (changes) => {
    changes.forEach(change => {
      console.log('Element size changed:',
        change.delta.width.toFixed(0) + 'px',
        change.delta.height.toFixed(0) + 'px'
      );
    });
  }
);
```

## Performance Optimization

### Throttled Processing

```javascript
class ThrottledResizeObserver {
  constructor(callback, delay = 100) {
    this.callback = callback;
    this.delay = delay;
    this.pending = false;
    this.lastEntries = [];

    this.observer = new ResizeObserver((entries) => {
      this.lastEntries = entries;

      if (!this.pending) {
        this.pending = true;
        requestAnimationFrame(() => {
          this.callback(this.lastEntries);
          this.pending = false;
        });
      }
    });
  }

  observe(target, options) {
    this.observer.observe(target, options);
  }

  unobserve(target) {
    this.observer.unobserve(target);
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// Usage
const throttledObserver = new ThrottledResizeObserver((entries) => {
  entries.forEach(entry => {
    console.log('Throttled resize:', entry.contentRect.width);
  });
});

throttledObserver.observe(document.getElementById('target'));
```

### Conditional Triggering

```javascript
class ConditionalResizeObserver {
  constructor(callback, condition) {
    this.callback = callback;
    this.condition = condition;
    this.lastSizes = new Map();

    this.observer = new ResizeObserver((entries) => {
      const filtered = entries.filter(entry => {
        const lastSize = this.lastSizes.get(entry.target);
        const newSize = entry.contentRect;

        const shouldTrigger = this.condition(newSize, lastSize, entry.target);

        this.lastSizes.set(entry.target, {
          width: newSize.width,
          height: newSize.height
        });

        return shouldTrigger;
      });

      if (filtered.length > 0) {
        this.callback(filtered);
      }
    });
  }

  observe(target, options) {
    this.observer.observe(target, options);
  }

  disconnect() {
    this.observer.disconnect();
    this.lastSizes.clear();
  }
}

// Usage: Only trigger when width changes by more than 50px
const conditionalObserver = new ConditionalResizeObserver(
  (entries) => {
    console.log('Conditional resize triggered');
  },
  (newSize, lastSize) => {
    if (!lastSize) return true;
    return Math.abs(newSize.width - lastSize.width) > 50;
  }
);
```

## Best Practices Summary

```
ResizeObserver Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Performance                                       │
│   ├── Use throttle/debounce in callbacks           │
│   ├── Avoid triggering layout in callbacks         │
│   ├── Disconnect unneeded observations             │
│   └── Batch process multiple element changes       │
│                                                     │
│   Use Cases                                         │
│   ├── Responsive components                        │
│   ├── Adaptive charts                              │
│   ├── Virtual scrolling                            │
│   └── Container query alternative                  │
│                                                     │
│   Considerations                                    │
│   ├── Callbacks fire before RAF                    │
│   ├── Avoid circular triggers                      │
│   ├── Handle initial callback                      │
│   └── Consider devicePixelRatio                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Box Model | Description | Use Case |
|-----------|-------------|----------|
| content-box | Content area | Default, common |
| border-box | With border | Precise layout |
| device-pixel-content-box | Device pixels | Canvas |

---

*Master the ResizeObserver API to build truly responsive components and layouts.*
