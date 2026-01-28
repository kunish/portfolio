---
title: 'JavaScript History API Complete Guide'
description: 'Master browser history management: pushState, replaceState, popstate events, and SPA routing implementation'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'js-history-api-guide'
---

The History API allows manipulation of browser session history. This article covers its usage and SPA routing implementation.

## Basic Concepts

### History Object

```javascript
// History length
console.log(history.length);

// Current state object
console.log(history.state);

// Scroll restoration behavior
history.scrollRestoration = 'manual'; // or 'auto'
```

### Basic Navigation

```javascript
// Go back one page
history.back();

// Go forward one page
history.forward();

// Navigate to specific position
history.go(-2); // Go back two pages
history.go(1);  // Go forward one page
history.go(0);  // Refresh current page
```

## Core Methods

### pushState

```javascript
// Add history entry
history.pushState(state, title, url);

// Parameters
// state: State object associated with new history entry
// title: New page title (ignored by most browsers)
// url: New URL (optional, must be same origin)

// Example
history.pushState(
  { page: 1, query: 'javascript' },
  '',
  '/search?q=javascript&page=1'
);

// State object size limit (typically 640KB)
const largeState = { data: new Array(100000).fill('x') };
try {
  history.pushState(largeState, '', '/large');
} catch (e) {
  console.error('State object too large:', e);
}
```

### replaceState

```javascript
// Replace current history entry
history.replaceState(state, title, url);

// Example: Update current page state
history.replaceState(
  { ...history.state, scrollPosition: window.scrollY },
  '',
  location.href
);

// Fix URL
if (location.pathname === '/old-path') {
  history.replaceState(null, '', '/new-path');
}
```

### popstate Event

```javascript
// Listen for history navigation
window.addEventListener('popstate', (event) => {
  console.log('Navigation occurred');
  console.log('State:', event.state);
  
  // Update page based on state
  if (event.state) {
    updatePage(event.state);
  }
});

// Note: pushState/replaceState don't trigger popstate
// Only triggered by back/forward buttons or history.back()/forward()/go()
```

## SPA Router Implementation

### Basic Router

```javascript
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    
    window.addEventListener('popstate', (e) => {
      this.handleRoute(location.pathname, e.state);
    });
  }
  
  // Register route
  register(path, handler) {
    this.routes.set(path, handler);
    return this;
  }
  
  // Navigate to path
  navigate(path, state = {}) {
    if (path === location.pathname) return;
    
    history.pushState(state, '', path);
    this.handleRoute(path, state);
  }
  
  // Replace current route
  replace(path, state = {}) {
    history.replaceState(state, '', path);
    this.handleRoute(path, state);
  }
  
  // Handle route
  handleRoute(path, state) {
    // Exact match
    if (this.routes.has(path)) {
      this.currentRoute = path;
      this.routes.get(path)(state);
      return;
    }
    
    // Parameter route matching
    for (const [pattern, handler] of this.routes) {
      const params = this.matchRoute(pattern, path);
      if (params) {
        this.currentRoute = path;
        handler({ ...state, params });
        return;
      }
    }
    
    // 404 handling
    if (this.routes.has('*')) {
      this.routes.get('*')(state);
    }
  }
  
  // Route parameter matching
  matchRoute(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) {
      return null;
    }
    
    const params = {};
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    
    return params;
  }
  
  // Initialize
  init() {
    this.handleRoute(location.pathname, history.state);
  }
}

// Usage
const router = new Router();

router
  .register('/', () => showHome())
  .register('/about', () => showAbout())
  .register('/users/:id', ({ params }) => showUser(params.id))
  .register('*', () => show404())
  .init();
```

### Router with Middleware

```javascript
class AdvancedRouter {
  constructor() {
    this.routes = [];
    this.middlewares = [];
    this.beforeHooks = [];
    this.afterHooks = [];
    
    window.addEventListener('popstate', (e) => {
      this.resolve(location.pathname, e.state);
    });
  }
  
  // Add middleware
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }
  
  // Navigation guards
  beforeEach(hook) {
    this.beforeHooks.push(hook);
    return this;
  }
  
  afterEach(hook) {
    this.afterHooks.push(hook);
    return this;
  }
  
  // Register route
  route(path, handler, meta = {}) {
    const regex = this.pathToRegex(path);
    this.routes.push({ path, regex, handler, meta });
    return this;
  }
  
  // Path to regex
  pathToRegex(path) {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '(?<$1>[^/]+)')
      .replace(/\*/g, '.*');
    return new RegExp(`^${pattern}$`);
  }
  
  // Navigate
  async navigate(path, state = {}) {
    const from = { path: location.pathname, state: history.state };
    const to = { path, state };
    
    // Execute before guards
    for (const hook of this.beforeHooks) {
      const result = await hook(to, from);
      if (result === false) return;
      if (typeof result === 'string') {
        return this.navigate(result, state);
      }
    }
    
    history.pushState(state, '', path);
    await this.resolve(path, state);
    
    // Execute after guards
    for (const hook of this.afterHooks) {
      await hook(to, from);
    }
  }
  
  // Resolve route
  async resolve(path, state) {
    // Execute middleware
    const context = { path, state, params: {} };
    
    for (const middleware of this.middlewares) {
      await middleware(context);
    }
    
    // Match route
    for (const route of this.routes) {
      const match = path.match(route.regex);
      if (match) {
        context.params = match.groups || {};
        context.meta = route.meta;
        await route.handler(context);
        return;
      }
    }
  }
  
  init() {
    this.resolve(location.pathname, history.state);
  }
}

// Usage
const router = new AdvancedRouter();

// Middleware
router.use(async (ctx) => {
  console.log('Visiting:', ctx.path);
  ctx.startTime = Date.now();
});

// Navigation guards
router.beforeEach(async (to, from) => {
  if (to.path.startsWith('/admin') && !isLoggedIn()) {
    return '/login';
  }
});

router.afterEach((to, from) => {
  // Page view analytics
  analytics.pageView(to.path);
});

// Routes
router
  .route('/', homeHandler)
  .route('/users/:id', userHandler, { requiresAuth: true })
  .init();
```

### Link Interception

```javascript
class LinkInterceptor {
  constructor(router) {
    this.router = router;
    this.init();
  }
  
  init() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      
      // Check if should intercept
      if (this.shouldIntercept(link)) {
        e.preventDefault();
        this.router.navigate(link.pathname + link.search);
      }
    });
  }
  
  shouldIntercept(link) {
    // External links
    if (link.origin !== location.origin) return false;
    
    // New tab
    if (link.target === '_blank') return false;
    
    // Download links
    if (link.hasAttribute('download')) return false;
    
    // Explicitly disabled
    if (link.dataset.noIntercept !== undefined) return false;
    
    // Special protocols
    if (!/^https?:$/.test(link.protocol)) return false;
    
    return true;
  }
}

// Usage
new LinkInterceptor(router);
```

## State Management

### Page State Persistence

```javascript
class PageStateManager {
  constructor() {
    this.stateKey = 'pageState';
    
    window.addEventListener('popstate', (e) => {
      this.restore(e.state);
    });
    
    window.addEventListener('beforeunload', () => {
      this.save();
    });
  }
  
  // Save state
  save() {
    const state = {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      formData: this.getFormData(),
      timestamp: Date.now()
    };
    
    history.replaceState(
      { ...history.state, [this.stateKey]: state },
      ''
    );
  }
  
  // Restore state
  restore(historyState) {
    const state = historyState?.[this.stateKey];
    if (!state) return;
    
    // Restore scroll position
    requestAnimationFrame(() => {
      window.scrollTo(state.scrollX, state.scrollY);
    });
    
    // Restore form data
    if (state.formData) {
      this.restoreFormData(state.formData);
    }
  }
  
  getFormData() {
    const forms = document.querySelectorAll('form[data-persist]');
    const data = {};
    
    forms.forEach((form, index) => {
      const formData = new FormData(form);
      data[index] = Object.fromEntries(formData.entries());
    });
    
    return data;
  }
  
  restoreFormData(data) {
    const forms = document.querySelectorAll('form[data-persist]');
    
    forms.forEach((form, index) => {
      if (data[index]) {
        Object.entries(data[index]).forEach(([name, value]) => {
          const input = form.elements[name];
          if (input) input.value = value;
        });
      }
    });
  }
}

const stateManager = new PageStateManager();
```

### Navigation History Stack

```javascript
class NavigationStack {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.stack = [];
    this.currentIndex = -1;
    
    // Initialize
    this.push(location.pathname, history.state);
    
    window.addEventListener('popstate', (e) => {
      this.onPopState(e);
    });
  }
  
  push(path, state) {
    // Remove entries after current position
    this.stack = this.stack.slice(0, this.currentIndex + 1);
    
    // Add new entry
    this.stack.push({ path, state, timestamp: Date.now() });
    this.currentIndex++;
    
    // Limit size
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
      this.currentIndex--;
    }
  }
  
  onPopState(event) {
    const path = location.pathname;
    
    // Determine if back or forward
    if (this.currentIndex > 0 && 
        this.stack[this.currentIndex - 1]?.path === path) {
      this.currentIndex--;
    } else if (this.currentIndex < this.stack.length - 1 &&
               this.stack[this.currentIndex + 1]?.path === path) {
      this.currentIndex++;
    }
  }
  
  canGoBack() {
    return this.currentIndex > 0;
  }
  
  canGoForward() {
    return this.currentIndex < this.stack.length - 1;
  }
  
  getHistory() {
    return [...this.stack];
  }
  
  getCurrent() {
    return this.stack[this.currentIndex];
  }
}

const navStack = new NavigationStack();
```

## Practical Applications

### Infinite Scroll Pagination

```javascript
class InfiniteScrollWithHistory {
  constructor(options) {
    this.options = {
      container: document.body,
      loadMore: async () => [],
      itemsPerPage: 20,
      ...options
    };
    
    this.page = this.getPageFromUrl();
    this.items = [];
    
    this.init();
  }
  
  getPageFromUrl() {
    const params = new URLSearchParams(location.search);
    return parseInt(params.get('page')) || 1;
  }
  
  updateUrl(page) {
    const url = new URL(location.href);
    url.searchParams.set('page', page);
    
    history.replaceState(
      { page, scrollY: window.scrollY },
      '',
      url.toString()
    );
  }
  
  async init() {
    // Load initial data
    for (let i = 1; i <= this.page; i++) {
      const items = await this.options.loadMore(i);
      this.items.push(...items);
    }
    
    this.render();
    
    // Restore scroll position
    if (history.state?.scrollY) {
      window.scrollTo(0, history.state.scrollY);
    }
    
    // Setup infinite scroll
    this.setupInfiniteScroll();
    
    // Listen for history navigation
    window.addEventListener('popstate', (e) => {
      if (e.state?.page) {
        this.page = e.state.page;
        window.scrollTo(0, e.state.scrollY || 0);
      }
    });
  }
  
  setupInfiniteScroll() {
    const observer = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting) {
        this.page++;
        const newItems = await this.options.loadMore(this.page);
        this.items.push(...newItems);
        this.render();
        this.updateUrl(this.page);
      }
    });
    
    observer.observe(document.querySelector('#load-more-trigger'));
  }
  
  render() {
    // Render list
  }
}
```

### Modal History Management

```javascript
class ModalHistoryManager {
  constructor() {
    this.modals = new Map();
    this.activeModals = [];
    
    window.addEventListener('popstate', (e) => {
      this.handlePopState(e);
    });
  }
  
  register(id, modal) {
    this.modals.set(id, modal);
  }
  
  open(id, data = {}) {
    const modal = this.modals.get(id);
    if (!modal) return;
    
    // Add history entry
    history.pushState(
      { modalId: id, modalData: data },
      '',
      `${location.pathname}?modal=${id}`
    );
    
    this.activeModals.push(id);
    modal.show(data);
  }
  
  close(id) {
    const modal = this.modals.get(id);
    if (!modal) return;
    
    // Go back in history
    if (this.activeModals.includes(id)) {
      history.back();
    }
  }
  
  handlePopState(event) {
    const state = event.state;
    
    // Close current modal
    if (this.activeModals.length > 0) {
      const currentModalId = this.activeModals.pop();
      const modal = this.modals.get(currentModalId);
      modal?.hide();
    }
    
    // If state has modal
    if (state?.modalId) {
      const modal = this.modals.get(state.modalId);
      if (modal) {
        this.activeModals.push(state.modalId);
        modal.show(state.modalData);
      }
    }
  }
}

// Usage
const modalManager = new ModalHistoryManager();

modalManager.register('userProfile', {
  show: (data) => document.getElementById('userModal').classList.add('active'),
  hide: () => document.getElementById('userModal').classList.remove('active')
});

// Open modal
document.querySelector('.open-modal').addEventListener('click', () => {
  modalManager.open('userProfile', { userId: 123 });
});
```

### Tab Navigation

```javascript
class TabNavigation {
  constructor(container) {
    this.container = container;
    this.tabs = container.querySelectorAll('[data-tab]');
    this.panels = container.querySelectorAll('[data-panel]');
    
    this.init();
  }
  
  init() {
    // Restore from URL
    const hash = location.hash.slice(1);
    if (hash) {
      this.activate(hash, false);
    }
    
    // Listen for tab clicks
    this.tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = tab.dataset.tab;
        this.activate(tabId, true);
      });
    });
    
    // Listen for history navigation
    window.addEventListener('popstate', () => {
      const hash = location.hash.slice(1);
      this.activate(hash || this.tabs[0].dataset.tab, false);
    });
  }
  
  activate(tabId, updateHistory = true) {
    // Update tab states
    this.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // Update panel visibility
    this.panels.forEach(panel => {
      panel.classList.toggle('active', panel.dataset.panel === tabId);
    });
    
    // Update URL
    if (updateHistory) {
      history.pushState({ tab: tabId }, '', `#${tabId}`);
    }
  }
}

// Usage
new TabNavigation(document.querySelector('.tabs-container'));
```

## Best Practices Summary

```
History API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   State Management                                  │
│   ├── Keep state objects minimal                   │
│   ├── Serialize sensitive data                     │
│   ├── Use replaceState appropriately               │
│   └── Handle state restoration                     │
│                                                     │
│   Routing Design                                    │
│   ├── Use semantic URLs                            │
│   ├── Support direct access                        │
│   ├── Handle 404 cases                             │
│   └── Implement navigation guards                  │
│                                                     │
│   User Experience                                   │
│   ├── Keep back button functional                  │
│   ├── Restore scroll position                      │
│   ├── Avoid duplicate history entries              │
│   └── Handle external links                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Method | Purpose | Triggers popstate |
|--------|---------|-------------------|
| pushState | Add history entry | No |
| replaceState | Replace current entry | No |
| back/forward/go | Navigate history | Yes |

---

*Master the History API to build seamless single-page application navigation.*
