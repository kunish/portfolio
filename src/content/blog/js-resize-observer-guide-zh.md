---
title: 'JavaScript ResizeObserver API 完全指南'
description: '掌握元素尺寸监听：响应式组件、自适应布局、性能优化与实战应用'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'js-resize-observer-guide'
---

ResizeObserver API 提供了监听元素尺寸变化的能力。本文详解其用法和实战应用。

## 基础概念

### 创建观察器

```javascript
// 创建观察器
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    console.log('元素尺寸变化:', entry.target);
    console.log('新尺寸:', entry.contentRect.width, entry.contentRect.height);
  });
});

// 开始观察
const element = document.getElementById('target');
observer.observe(element);

// 停止观察特定元素
observer.unobserve(element);

// 断开所有观察
observer.disconnect();
```

### ResizeObserverEntry

```javascript
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // 被观察的元素
    console.log(entry.target);

    // 内容盒尺寸（不含 padding 和 border）
    console.log(entry.contentRect);
    // { x, y, width, height, top, right, bottom, left }

    // 内容盒尺寸（数组形式）
    console.log(entry.contentBoxSize);
    // [{ inlineSize, blockSize }]

    // 边框盒尺寸
    console.log(entry.borderBoxSize);
    // [{ inlineSize, blockSize }]

    // 设备像素内容盒尺寸
    console.log(entry.devicePixelContentBoxSize);
    // [{ inlineSize, blockSize }]
  });
});
```

### 观察选项

```javascript
const observer = new ResizeObserver(callback);

// 默认观察内容盒
observer.observe(element);

// 指定观察的盒模型
observer.observe(element, { box: 'content-box' }); // 默认
observer.observe(element, { box: 'border-box' });
observer.observe(element, { box: 'device-pixel-content-box' });
```

## 实战应用

### 响应式组件

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

    // 移除所有尺寸类
    element.classList.remove('size-small', 'size-medium', 'size-large');

    // 添加对应尺寸类
    if (width < this.breakpoints.small) {
      element.classList.add('size-small');
    } else if (width < this.breakpoints.medium) {
      element.classList.add('size-medium');
    } else {
      element.classList.add('size-large');
    }

    // 触发自定义事件
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

// 使用
const component = new ResponsiveComponent(
  document.getElementById('myComponent')
);

// 监听自定义事件
document.getElementById('myComponent').addEventListener('componentresize', (e) => {
  console.log('当前断点:', e.detail.breakpoint);
});
```

### 自适应文本

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

    // 创建测量元素
    const measurer = document.createElement('span');
    measurer.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;';
    measurer.textContent = this.originalText;
    document.body.appendChild(measurer);

    let fontSize = this.options.maxSize;

    // 二分查找合适的字体大小
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

// 使用
const autoText = new AutoFitText(
  document.getElementById('title'),
  { minSize: 16, maxSize: 72 }
);
```

### 图表自适应

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

    // 清空容器
    this.container.textContent = '';

    // 创建 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 绘制图表
    this.drawChart(ctx, width, height);

    this.container.appendChild(canvas);
  }

  drawChart(ctx, width, height) {
    // 示例：绘制简单柱状图
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

// 使用
const chart = new ResponsiveChart(
  document.getElementById('chartContainer'),
  { data: [25, 40, 65, 55, 80, 45] }
);
```

### 虚拟滚动

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

    // 创建内容容器
    this.content = document.createElement('div');
    this.content.style.position = 'relative';
    this.updateContentHeight();

    // 创建视口容器
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

    // 计算可见范围
    this.startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    this.endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + this.containerHeight) / itemHeight) + buffer
    );

    // 更新视口位置
    this.viewport.style.transform = 'translateY(' + (this.startIndex * itemHeight) + 'px)';

    // 渲染可见项
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

// 使用
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

### 容器查询替代

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

// 使用
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

### 布局变化检测

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

// 使用
const elements = document.querySelectorAll('.resizable');

const layoutObserver = new LayoutObserver(
  Array.from(elements),
  (changes) => {
    changes.forEach(change => {
      console.log('元素尺寸变化:',
        change.delta.width.toFixed(0) + 'px',
        change.delta.height.toFixed(0) + 'px'
      );
    });
  }
);
```

## 性能优化

### 节流处理

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

// 使用
const throttledObserver = new ThrottledResizeObserver((entries) => {
  entries.forEach(entry => {
    console.log('节流后的尺寸变化:', entry.contentRect.width);
  });
});

throttledObserver.observe(document.getElementById('target'));
```

### 条件触发

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

// 使用：只在宽度变化超过 50px 时触发
const conditionalObserver = new ConditionalResizeObserver(
  (entries) => {
    console.log('满足条件的尺寸变化');
  },
  (newSize, lastSize) => {
    if (!lastSize) return true;
    return Math.abs(newSize.width - lastSize.width) > 50;
  }
);
```

## 最佳实践总结

```
ResizeObserver 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   性能优化                                          │
│   ├── 使用节流/防抖处理回调                        │
│   ├── 避免在回调中触发布局                         │
│   ├── 及时断开不需要的观察                         │
│   └── 批量处理多个元素变化                         │
│                                                     │
│   使用场景                                          │
│   ├── 响应式组件                                   │
│   ├── 图表自适应                                   │
│   ├── 虚拟滚动                                     │
│   └── 容器查询替代                                 │
│                                                     │
│   注意事项                                          │
│   ├── 回调在 RAF 之前触发                          │
│   ├── 避免循环触发                                 │
│   ├── 处理初始化回调                               │
│   └── 考虑 devicePixelRatio                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 盒模型 | 说明 | 适用场景 |
|--------|------|---------|
| content-box | 内容区域 | 默认，常用 |
| border-box | 含边框 | 精确布局 |
| device-pixel-content-box | 设备像素 | Canvas |

---

*掌握 ResizeObserver API，构建真正响应式的组件和布局。*
