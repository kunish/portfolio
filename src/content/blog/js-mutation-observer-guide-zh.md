---
title: 'JavaScript MutationObserver API 完全指南'
description: '掌握 DOM 变化监听：属性监控、子节点变化、性能优化与实战应用'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'js-mutation-observer-guide'
---

MutationObserver API 提供了监听 DOM 变化的能力。本文详解其用法和实战应用。

## 基础概念

### 创建观察器

```javascript
// 创建观察器
const observer = new MutationObserver((mutations, observer) => {
  mutations.forEach(mutation => {
    console.log('DOM 变化:', mutation.type);
  });
});

// 开始观察
const targetNode = document.getElementById('target');
observer.observe(targetNode, {
  childList: true,
  attributes: true,
  subtree: true
});

// 停止观察
observer.disconnect();

// 获取待处理的记录
const pendingMutations = observer.takeRecords();
```

### 配置选项

```javascript
const config = {
  // 监听子节点变化
  childList: true,

  // 监听属性变化
  attributes: true,

  // 监听字符数据变化（文本节点）
  characterData: true,

  // 监听所有后代节点
  subtree: true,

  // 记录属性旧值
  attributeOldValue: true,

  // 记录字符数据旧值
  characterDataOldValue: true,

  // 只监听特定属性
  attributeFilter: ['class', 'style', 'data-id']
};

observer.observe(targetNode, config);
```

### MutationRecord

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    // 变化类型：'attributes', 'characterData', 'childList'
    console.log(mutation.type);

    // 发生变化的目标节点
    console.log(mutation.target);

    // 新增的节点列表
    console.log(mutation.addedNodes);

    // 移除的节点列表
    console.log(mutation.removedNodes);

    // 前一个同级节点
    console.log(mutation.previousSibling);

    // 后一个同级节点
    console.log(mutation.nextSibling);

    // 变化的属性名
    console.log(mutation.attributeName);

    // 属性的命名空间
    console.log(mutation.attributeNamespace);

    // 旧值（需要配置 oldValue 选项）
    console.log(mutation.oldValue);
  });
});
```

## 实战应用

### 属性变化监控

```javascript
class AttributeWatcher {
  constructor(element, callback) {
    this.element = element;
    this.callback = callback;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
          const attrName = mutation.attributeName;
          const oldValue = mutation.oldValue;
          const newValue = element.getAttribute(attrName);

          this.callback({
            attribute: attrName,
            oldValue,
            newValue,
            element: mutation.target
          });
        }
      });
    });

    this.observer.observe(element, {
      attributes: true,
      attributeOldValue: true
    });
  }

  watchOnly(attributes) {
    this.observer.disconnect();
    this.observer.observe(this.element, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: attributes
    });
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用
const watcher = new AttributeWatcher(
  document.getElementById('myElement'),
  (change) => {
    console.log('属性变化:', change.attribute);
    console.log('从', change.oldValue, '变为', change.newValue);
  }
);

// 只监控特定属性
watcher.watchOnly(['class', 'data-state']);
```

### 子节点变化监控

```javascript
class ChildrenWatcher {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onAdd: () => {},
      onRemove: () => {},
      deep: false,
      ...options
    };

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.options.onAdd(node, mutation.target);
            }
          });

          mutation.removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.options.onRemove(node, mutation.target);
            }
          });
        }
      });
    });

    this.observer.observe(container, {
      childList: true,
      subtree: this.options.deep
    });
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用
const watcher = new ChildrenWatcher(
  document.getElementById('container'),
  {
    onAdd: (node, parent) => {
      console.log('新增节点:', node.tagName);
      node.classList.add('fade-in');
    },
    onRemove: (node, parent) => {
      console.log('移除节点:', node.tagName);
    },
    deep: true
  }
);
```

### 文本内容监控

```javascript
class TextContentWatcher {
  constructor(element, callback) {
    this.element = element;
    this.callback = callback;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'characterData') {
          this.callback({
            oldValue: mutation.oldValue,
            newValue: mutation.target.textContent,
            node: mutation.target
          });
        }
      });
    });

    this.observer.observe(element, {
      characterData: true,
      characterDataOldValue: true,
      subtree: true
    });
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用
const textWatcher = new TextContentWatcher(
  document.getElementById('editor'),
  (change) => {
    console.log('文本变化:', change.oldValue, '->', change.newValue);
  }
);
```

### 自动保存表单

```javascript
class AutoSaveForm {
  constructor(form, options = {}) {
    this.form = form;
    this.options = {
      saveKey: 'formAutoSave',
      debounceTime: 1000,
      ...options
    };

    this.saveTimeout = null;
    this.setupObserver();
    this.loadSavedData();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      this.scheduleSave();
    });

    // 监控表单内部变化
    this.observer.observe(this.form, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true
    });

    // 同时监听 input 事件
    this.form.addEventListener('input', () => {
      this.scheduleSave();
    });
  }

  scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.save();
    }, this.options.debounceTime);
  }

  save() {
    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData.entries());

    localStorage.setItem(this.options.saveKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));

    console.log('表单已自动保存');
  }

  loadSavedData() {
    const saved = localStorage.getItem(this.options.saveKey);

    if (saved) {
      try {
        const { data } = JSON.parse(saved);

        Object.entries(data).forEach(([name, value]) => {
          const input = this.form.elements[name];
          if (input) {
            input.value = value;
          }
        });
      } catch (e) {
        console.error('加载保存数据失败:', e);
      }
    }
  }

  clearSaved() {
    localStorage.removeItem(this.options.saveKey);
  }

  disconnect() {
    this.observer.disconnect();
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }
}

// 使用
const autoSave = new AutoSaveForm(
  document.getElementById('myForm'),
  {
    saveKey: 'myFormDraft',
    debounceTime: 500
  }
);
```

### DOM 变化历史记录

```javascript
class DOMHistory {
  constructor(target, options = {}) {
    this.target = target;
    this.options = {
      maxHistory: 100,
      ...options
    };

    this.history = [];
    this.setupObserver();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      const record = {
        timestamp: Date.now(),
        mutations: mutations.map(m => this.serializeMutation(m))
      };

      this.history.push(record);

      if (this.history.length > this.options.maxHistory) {
        this.history.shift();
      }
    });

    this.observer.observe(this.target, {
      attributes: true,
      attributeOldValue: true,
      childList: true,
      characterData: true,
      characterDataOldValue: true,
      subtree: true
    });
  }

  serializeMutation(mutation) {
    return {
      type: mutation.type,
      target: this.getNodePath(mutation.target),
      attributeName: mutation.attributeName,
      oldValue: mutation.oldValue,
      addedNodes: Array.from(mutation.addedNodes).length,
      removedNodes: Array.from(mutation.removedNodes).length
    };
  }

  getNodePath(node) {
    const path = [];
    let current = node;

    while (current && current !== this.target) {
      const parent = current.parentNode;
      if (parent) {
        const index = Array.from(parent.children).indexOf(current);
        path.unshift(current.tagName + '[' + index + ']');
      }
      current = parent;
    }

    return path.join(' > ');
  }

  getHistory() {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用
const domHistory = new DOMHistory(
  document.getElementById('editor'),
  { maxHistory: 50 }
);

// 获取历史记录
console.log(domHistory.getHistory());
```

### 动态内容加载检测

```javascript
class DynamicContentDetector {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onImageLoad: () => {},
      onScriptLoad: () => {},
      onContentReady: () => {},
      ...options
    };

    this.pendingImages = new Set();
    this.setupObserver();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processElement(node);
          }
        });
      });
    });

    this.observer.observe(this.container, {
      childList: true,
      subtree: true
    });
  }

  processElement(element) {
    // 处理图片
    const images = element.matches('img')
      ? [element]
      : element.querySelectorAll('img');

    images.forEach(img => {
      if (!img.complete) {
        this.pendingImages.add(img);

        img.addEventListener('load', () => {
          this.pendingImages.delete(img);
          this.options.onImageLoad(img);
          this.checkAllLoaded();
        });

        img.addEventListener('error', () => {
          this.pendingImages.delete(img);
          this.checkAllLoaded();
        });
      }
    });

    // 处理脚本
    const scripts = element.matches('script')
      ? [element]
      : element.querySelectorAll('script');

    scripts.forEach(script => {
      if (script.src) {
        script.addEventListener('load', () => {
          this.options.onScriptLoad(script);
        });
      }
    });

    // 触发内容就绪回调
    this.options.onContentReady(element);
  }

  checkAllLoaded() {
    if (this.pendingImages.size === 0) {
      console.log('所有图片加载完成');
    }
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用
const detector = new DynamicContentDetector(
  document.getElementById('content'),
  {
    onImageLoad: (img) => {
      console.log('图片加载完成:', img.src);
    },
    onContentReady: (element) => {
      console.log('新内容就绪:', element.tagName);
    }
  }
);
```

### 第三方库集成检测

```javascript
class ThirdPartyDetector {
  constructor(callback) {
    this.callback = callback;
    this.detected = new Set();

    this.setupObserver();
    this.checkExisting();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.detectLibraries(node);
          }
        });
      });
    });

    this.observer.observe(document.head, {
      childList: true
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  checkExisting() {
    document.querySelectorAll('script[src]').forEach(script => {
      this.detectFromScript(script);
    });
  }

  detectLibraries(element) {
    if (element.matches('script[src]')) {
      this.detectFromScript(element);
    }

    element.querySelectorAll('script[src]').forEach(script => {
      this.detectFromScript(script);
    });
  }

  detectFromScript(script) {
    const src = script.src.toLowerCase();
    const libraries = {
      jquery: /jquery/,
      react: /react/,
      vue: /vue/,
      angular: /angular/,
      lodash: /lodash/,
      analytics: /google-analytics|gtag/
    };

    Object.entries(libraries).forEach(([name, pattern]) => {
      if (pattern.test(src) && !this.detected.has(name)) {
        this.detected.add(name);
        this.callback(name, script.src);
      }
    });
  }

  getDetectedLibraries() {
    return [...this.detected];
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用
const detector = new ThirdPartyDetector((library, src) => {
  console.log('检测到库:', library, 'from', src);
});
```

## 性能优化

### 批量处理变化

```javascript
class BatchedMutationObserver {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.options = {
      batchTime: 100,
      ...options
    };

    this.pendingMutations = [];
    this.batchTimeout = null;

    this.observer = new MutationObserver((mutations) => {
      this.pendingMutations.push(...mutations);
      this.scheduleBatch();
    });
  }

  scheduleBatch() {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      const mutations = this.pendingMutations;
      this.pendingMutations = [];
      this.batchTimeout = null;

      this.callback(mutations);
    }, this.options.batchTime);
  }

  observe(target, config) {
    this.observer.observe(target, config);
  }

  disconnect() {
    this.observer.disconnect();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
  }
}

// 使用
const batchedObserver = new BatchedMutationObserver(
  (mutations) => {
    console.log('批量处理', mutations.length, '个变化');
  },
  { batchTime: 200 }
);

batchedObserver.observe(document.body, {
  childList: true,
  subtree: true
});
```

### 过滤无关变化

```javascript
class FilteredMutationObserver {
  constructor(callback, filter) {
    this.callback = callback;
    this.filter = filter;

    this.observer = new MutationObserver((mutations) => {
      const filtered = mutations.filter(m => this.filter(m));

      if (filtered.length > 0) {
        this.callback(filtered);
      }
    });
  }

  observe(target, config) {
    this.observer.observe(target, config);
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// 使用：只处理特定类名的元素变化
const filteredObserver = new FilteredMutationObserver(
  (mutations) => {
    mutations.forEach(m => {
      console.log('匹配的变化:', m);
    });
  },
  (mutation) => {
    const target = mutation.target;
    return target.classList && target.classList.contains('monitored');
  }
);
```

## 最佳实践总结

```
MutationObserver 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   性能优化                                          │
│   ├── 限制观察范围（避免 subtree: true）           │
│   ├── 使用 attributeFilter 过滤属性                │
│   ├── 批量处理变化                                 │
│   └── 及时断开不需要的观察                         │
│                                                     │
│   使用场景                                          │
│   ├── 动态内容监控                                 │
│   ├── 表单自动保存                                 │
│   ├── 第三方库集成检测                             │
│   └── DOM 变化历史记录                             │
│                                                     │
│   注意事项                                          │
│   ├── 回调是微任务队列执行                         │
│   ├── 避免在回调中修改 DOM                         │
│   ├── 注意内存泄漏                                 │
│   └── 处理好旧值记录                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 配置 | 推荐 | 说明 |
|------|------|------|
| subtree | 谨慎使用 | 性能开销大 |
| attributeFilter | 优先使用 | 减少回调触发 |
| oldValue | 按需使用 | 内存开销 |

---

*掌握 MutationObserver API，实现精准的 DOM 变化监控。*
