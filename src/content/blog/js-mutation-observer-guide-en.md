---
title: 'JavaScript MutationObserver API Complete Guide'
description: 'Master DOM change monitoring: attribute observation, child node changes, performance optimization, and practical applications'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'js-mutation-observer-guide'
---

The MutationObserver API provides the ability to monitor DOM changes. This article covers its usage and practical applications.

## Basic Concepts

### Creating an Observer

```javascript
// Create observer
const observer = new MutationObserver((mutations, observer) => {
  mutations.forEach(mutation => {
    console.log('DOM change:', mutation.type);
  });
});

// Start observing
const targetNode = document.getElementById('target');
observer.observe(targetNode, {
  childList: true,
  attributes: true,
  subtree: true
});

// Stop observing
observer.disconnect();

// Get pending records
const pendingMutations = observer.takeRecords();
```

### Configuration Options

```javascript
const config = {
  // Watch child node changes
  childList: true,

  // Watch attribute changes
  attributes: true,

  // Watch character data changes (text nodes)
  characterData: true,

  // Watch all descendant nodes
  subtree: true,

  // Record old attribute values
  attributeOldValue: true,

  // Record old character data values
  characterDataOldValue: true,

  // Only watch specific attributes
  attributeFilter: ['class', 'style', 'data-id']
};

observer.observe(targetNode, config);
```

### MutationRecord

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    // Change type: 'attributes', 'characterData', 'childList'
    console.log(mutation.type);

    // Target node where change occurred
    console.log(mutation.target);

    // List of added nodes
    console.log(mutation.addedNodes);

    // List of removed nodes
    console.log(mutation.removedNodes);

    // Previous sibling node
    console.log(mutation.previousSibling);

    // Next sibling node
    console.log(mutation.nextSibling);

    // Changed attribute name
    console.log(mutation.attributeName);

    // Attribute namespace
    console.log(mutation.attributeNamespace);

    // Old value (requires oldValue option)
    console.log(mutation.oldValue);
  });
});
```

## Practical Applications

### Attribute Change Monitoring

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

// Usage
const watcher = new AttributeWatcher(
  document.getElementById('myElement'),
  (change) => {
    console.log('Attribute changed:', change.attribute);
    console.log('From', change.oldValue, 'to', change.newValue);
  }
);

// Watch specific attributes only
watcher.watchOnly(['class', 'data-state']);
```

### Child Node Change Monitoring

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

// Usage
const watcher = new ChildrenWatcher(
  document.getElementById('container'),
  {
    onAdd: (node, parent) => {
      console.log('Node added:', node.tagName);
      node.classList.add('fade-in');
    },
    onRemove: (node, parent) => {
      console.log('Node removed:', node.tagName);
    },
    deep: true
  }
);
```

### Text Content Monitoring

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

// Usage
const textWatcher = new TextContentWatcher(
  document.getElementById('editor'),
  (change) => {
    console.log('Text changed:', change.oldValue, '->', change.newValue);
  }
);
```

### Auto-Save Form

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

    // Monitor form internal changes
    this.observer.observe(this.form, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true
    });

    // Also listen for input events
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

    console.log('Form auto-saved');
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
        console.error('Failed to load saved data:', e);
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

// Usage
const autoSave = new AutoSaveForm(
  document.getElementById('myForm'),
  {
    saveKey: 'myFormDraft',
    debounceTime: 500
  }
);
```

### DOM Change History

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

// Usage
const domHistory = new DOMHistory(
  document.getElementById('editor'),
  { maxHistory: 50 }
);

// Get history
console.log(domHistory.getHistory());
```

### Dynamic Content Load Detection

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
    // Process images
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

    // Process scripts
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

    // Trigger content ready callback
    this.options.onContentReady(element);
  }

  checkAllLoaded() {
    if (this.pendingImages.size === 0) {
      console.log('All images loaded');
    }
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// Usage
const detector = new DynamicContentDetector(
  document.getElementById('content'),
  {
    onImageLoad: (img) => {
      console.log('Image loaded:', img.src);
    },
    onContentReady: (element) => {
      console.log('New content ready:', element.tagName);
    }
  }
);
```

### Third-Party Library Detection

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

// Usage
const detector = new ThirdPartyDetector((library, src) => {
  console.log('Detected library:', library, 'from', src);
});
```

## Performance Optimization

### Batch Processing Changes

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

// Usage
const batchedObserver = new BatchedMutationObserver(
  (mutations) => {
    console.log('Batch processing', mutations.length, 'changes');
  },
  { batchTime: 200 }
);

batchedObserver.observe(document.body, {
  childList: true,
  subtree: true
});
```

### Filtering Irrelevant Changes

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

// Usage: Only process changes to elements with specific class
const filteredObserver = new FilteredMutationObserver(
  (mutations) => {
    mutations.forEach(m => {
      console.log('Matching change:', m);
    });
  },
  (mutation) => {
    const target = mutation.target;
    return target.classList && target.classList.contains('monitored');
  }
);
```

## Best Practices Summary

```
MutationObserver Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Performance                                       │
│   ├── Limit observation scope (avoid subtree)      │
│   ├── Use attributeFilter to filter attributes     │
│   ├── Batch process changes                        │
│   └── Disconnect unneeded observers promptly       │
│                                                     │
│   Use Cases                                         │
│   ├── Dynamic content monitoring                   │
│   ├── Form auto-save                               │
│   ├── Third-party library detection                │
│   └── DOM change history                           │
│                                                     │
│   Considerations                                    │
│   ├── Callbacks run in microtask queue             │
│   ├── Avoid modifying DOM in callbacks             │
│   ├── Watch for memory leaks                       │
│   └── Handle old value recording properly          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Config | Recommendation | Notes |
|--------|----------------|-------|
| subtree | Use cautiously | High overhead |
| attributeFilter | Prefer using | Reduces callbacks |
| oldValue | Use as needed | Memory overhead |

---

*Master the MutationObserver API for precise DOM change monitoring.*
