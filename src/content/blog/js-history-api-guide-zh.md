---
title: 'JavaScript History API 完全指南'
description: '掌握浏览器历史管理：pushState、replaceState、popstate 事件与 SPA 路由实现'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'js-history-api-guide'
---

History API 允许操作浏览器会话历史记录。本文详解其用法和 SPA 路由实现。

## 基础概念

### History 对象

```javascript
// 历史记录长度
console.log(history.length);

// 当前状态对象
console.log(history.state);

// 滚动恢复行为
history.scrollRestoration = 'manual'; // 或 'auto'
```

### 基本导航

```javascript
// 后退一页
history.back();

// 前进一页
history.forward();

// 跳转到指定位置
history.go(-2); // 后退两页
history.go(1);  // 前进一页
history.go(0);  // 刷新当前页
```

## 核心方法

### pushState

```javascript
// 添加历史记录
history.pushState(state, title, url);

// 参数说明
// state: 与新历史记录关联的状态对象
// title: 新页面标题（大多数浏览器忽略）
// url: 新的 URL（可选，必须同源）

// 示例
history.pushState(
  { page: 1, query: 'javascript' },
  '',
  '/search?q=javascript&page=1'
);

// 状态对象大小限制（通常 640KB）
const largeState = { data: new Array(100000).fill('x') };
try {
  history.pushState(largeState, '', '/large');
} catch (e) {
  console.error('状态对象过大:', e);
}
```

### replaceState

```javascript
// 替换当前历史记录
history.replaceState(state, title, url);

// 示例：更新当前页面状态
history.replaceState(
  { ...history.state, scrollPosition: window.scrollY },
  '',
  location.href
);

// 用于修正 URL
if (location.pathname === '/old-path') {
  history.replaceState(null, '', '/new-path');
}
```

### popstate 事件

```javascript
// 监听历史导航
window.addEventListener('popstate', (event) => {
  console.log('导航发生');
  console.log('状态:', event.state);
  
  // 根据状态更新页面
  if (event.state) {
    updatePage(event.state);
  }
});

// 注意：pushState/replaceState 不触发 popstate
// 只有用户点击后退/前进按钮或调用 history.back()/forward()/go() 时触发
```

## SPA 路由实现

### 基础路由器

```javascript
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    
    window.addEventListener('popstate', (e) => {
      this.handleRoute(location.pathname, e.state);
    });
  }
  
  // 注册路由
  register(path, handler) {
    this.routes.set(path, handler);
    return this;
  }
  
  // 导航到路径
  navigate(path, state = {}) {
    if (path === location.pathname) return;
    
    history.pushState(state, '', path);
    this.handleRoute(path, state);
  }
  
  // 替换当前路由
  replace(path, state = {}) {
    history.replaceState(state, '', path);
    this.handleRoute(path, state);
  }
  
  // 处理路由
  handleRoute(path, state) {
    // 精确匹配
    if (this.routes.has(path)) {
      this.currentRoute = path;
      this.routes.get(path)(state);
      return;
    }
    
    // 参数路由匹配
    for (const [pattern, handler] of this.routes) {
      const params = this.matchRoute(pattern, path);
      if (params) {
        this.currentRoute = path;
        handler({ ...state, params });
        return;
      }
    }
    
    // 404 处理
    if (this.routes.has('*')) {
      this.routes.get('*')(state);
    }
  }
  
  // 路由参数匹配
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
  
  // 初始化
  init() {
    this.handleRoute(location.pathname, history.state);
  }
}

// 使用
const router = new Router();

router
  .register('/', () => showHome())
  .register('/about', () => showAbout())
  .register('/users/:id', ({ params }) => showUser(params.id))
  .register('*', () => show404())
  .init();
```

### 带中间件的路由器

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
  
  // 添加中间件
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }
  
  // 导航守卫
  beforeEach(hook) {
    this.beforeHooks.push(hook);
    return this;
  }
  
  afterEach(hook) {
    this.afterHooks.push(hook);
    return this;
  }
  
  // 注册路由
  route(path, handler, meta = {}) {
    const regex = this.pathToRegex(path);
    this.routes.push({ path, regex, handler, meta });
    return this;
  }
  
  // 路径转正则
  pathToRegex(path) {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '(?<$1>[^/]+)')
      .replace(/\*/g, '.*');
    return new RegExp(`^${pattern}$`);
  }
  
  // 导航
  async navigate(path, state = {}) {
    const from = { path: location.pathname, state: history.state };
    const to = { path, state };
    
    // 执行前置守卫
    for (const hook of this.beforeHooks) {
      const result = await hook(to, from);
      if (result === false) return;
      if (typeof result === 'string') {
        return this.navigate(result, state);
      }
    }
    
    history.pushState(state, '', path);
    await this.resolve(path, state);
    
    // 执行后置守卫
    for (const hook of this.afterHooks) {
      await hook(to, from);
    }
  }
  
  // 解析路由
  async resolve(path, state) {
    // 执行中间件
    const context = { path, state, params: {} };
    
    for (const middleware of this.middlewares) {
      await middleware(context);
    }
    
    // 匹配路由
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

// 使用
const router = new AdvancedRouter();

// 中间件
router.use(async (ctx) => {
  console.log('访问:', ctx.path);
  ctx.startTime = Date.now();
});

// 导航守卫
router.beforeEach(async (to, from) => {
  if (to.path.startsWith('/admin') && !isLoggedIn()) {
    return '/login';
  }
});

router.afterEach((to, from) => {
  // 页面访问统计
  analytics.pageView(to.path);
});

// 路由
router
  .route('/', homeHandler)
  .route('/users/:id', userHandler, { requiresAuth: true })
  .init();
```

### 链接拦截

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
      
      // 检查是否应该拦截
      if (this.shouldIntercept(link)) {
        e.preventDefault();
        this.router.navigate(link.pathname + link.search);
      }
    });
  }
  
  shouldIntercept(link) {
    // 外部链接
    if (link.origin !== location.origin) return false;
    
    // 新标签页打开
    if (link.target === '_blank') return false;
    
    // 下载链接
    if (link.hasAttribute('download')) return false;
    
    // 明确要求不拦截
    if (link.dataset.noIntercept !== undefined) return false;
    
    // 特殊协议
    if (!/^https?:$/.test(link.protocol)) return false;
    
    return true;
  }
}

// 使用
new LinkInterceptor(router);
```

## 状态管理

### 页面状态持久化

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
  
  // 保存状态
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
  
  // 恢复状态
  restore(historyState) {
    const state = historyState?.[this.stateKey];
    if (!state) return;
    
    // 恢复滚动位置
    requestAnimationFrame(() => {
      window.scrollTo(state.scrollX, state.scrollY);
    });
    
    // 恢复表单数据
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

### 导航历史栈

```javascript
class NavigationStack {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.stack = [];
    this.currentIndex = -1;
    
    // 初始化
    this.push(location.pathname, history.state);
    
    window.addEventListener('popstate', (e) => {
      this.onPopState(e);
    });
  }
  
  push(path, state) {
    // 移除当前位置之后的记录
    this.stack = this.stack.slice(0, this.currentIndex + 1);
    
    // 添加新记录
    this.stack.push({ path, state, timestamp: Date.now() });
    this.currentIndex++;
    
    // 限制大小
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
      this.currentIndex--;
    }
  }
  
  onPopState(event) {
    const path = location.pathname;
    
    // 判断是前进还是后退
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

## 实际应用场景

### 无限滚动分页

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
    // 加载初始数据
    for (let i = 1; i <= this.page; i++) {
      const items = await this.options.loadMore(i);
      this.items.push(...items);
    }
    
    this.render();
    
    // 恢复滚动位置
    if (history.state?.scrollY) {
      window.scrollTo(0, history.state.scrollY);
    }
    
    // 监听滚动
    this.setupInfiniteScroll();
    
    // 监听历史导航
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
    // 渲染列表
  }
}
```

### 模态框历史管理

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
    
    // 添加历史记录
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
    
    // 后退历史
    if (this.activeModals.includes(id)) {
      history.back();
    }
  }
  
  handlePopState(event) {
    const state = event.state;
    
    // 关闭当前模态框
    if (this.activeModals.length > 0) {
      const currentModalId = this.activeModals.pop();
      const modal = this.modals.get(currentModalId);
      modal?.hide();
    }
    
    // 如果是打开模态框的状态
    if (state?.modalId) {
      const modal = this.modals.get(state.modalId);
      if (modal) {
        this.activeModals.push(state.modalId);
        modal.show(state.modalData);
      }
    }
  }
}

// 使用
const modalManager = new ModalHistoryManager();

modalManager.register('userProfile', {
  show: (data) => document.getElementById('userModal').classList.add('active'),
  hide: () => document.getElementById('userModal').classList.remove('active')
});

// 打开模态框
document.querySelector('.open-modal').addEventListener('click', () => {
  modalManager.open('userProfile', { userId: 123 });
});
```

### 标签页导航

```javascript
class TabNavigation {
  constructor(container) {
    this.container = container;
    this.tabs = container.querySelectorAll('[data-tab]');
    this.panels = container.querySelectorAll('[data-panel]');
    
    this.init();
  }
  
  init() {
    // 从 URL 恢复状态
    const hash = location.hash.slice(1);
    if (hash) {
      this.activate(hash, false);
    }
    
    // 监听标签点击
    this.tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = tab.dataset.tab;
        this.activate(tabId, true);
      });
    });
    
    // 监听历史导航
    window.addEventListener('popstate', () => {
      const hash = location.hash.slice(1);
      this.activate(hash || this.tabs[0].dataset.tab, false);
    });
  }
  
  activate(tabId, updateHistory = true) {
    // 更新标签状态
    this.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // 更新面板显示
    this.panels.forEach(panel => {
      panel.classList.toggle('active', panel.dataset.panel === tabId);
    });
    
    // 更新 URL
    if (updateHistory) {
      history.pushState({ tab: tabId }, '', `#${tabId}`);
    }
  }
}

// 使用
new TabNavigation(document.querySelector('.tabs-container'));
```

## 最佳实践总结

```
History API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   状态管理                                          │
│   ├── 保持状态对象精简                             │
│   ├── 序列化敏感数据                               │
│   ├── 合理使用 replaceState                        │
│   └── 处理状态恢复                                 │
│                                                     │
│   路由设计                                          │
│   ├── 使用语义化 URL                               │
│   ├── 支持直接访问                                 │
│   ├── 处理 404 情况                                │
│   └── 实现路由守卫                                 │
│                                                     │
│   用户体验                                          │
│   ├── 保持后退按钮可用                             │
│   ├── 恢复滚动位置                                 │
│   ├── 避免重复历史记录                             │
│   └── 处理外部链接                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 方法 | 用途 | 触发 popstate |
|------|------|---------------|
| pushState | 添加历史记录 | 否 |
| replaceState | 替换当前记录 | 否 |
| back/forward/go | 导航历史 | 是 |

---

*掌握 History API，构建流畅的单页应用导航体验。*
