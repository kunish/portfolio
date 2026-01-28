---
title: 'JavaScript Broadcast Channel API 完全指南'
description: '掌握跨标签页通信：消息广播、状态同步、多窗口协作与实时数据共享'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'js-broadcast-channel-api-guide'
---

Broadcast Channel API 提供了同源浏览器上下文之间的通信机制。本文详解其用法和实际应用。

## 基础概念

### 创建频道

```javascript
// 创建或加入广播频道
const channel = new BroadcastChannel('my-channel');

// 频道名称
console.log(channel.name); // 'my-channel'

// 关闭频道
channel.close();
```

### 发送消息

```javascript
const channel = new BroadcastChannel('app-channel');

// 发送简单消息
channel.postMessage('Hello from this tab!');

// 发送对象
channel.postMessage({
  type: 'USER_LOGIN',
  payload: { userId: 123, username: 'john' }
});

// 发送数组
channel.postMessage([1, 2, 3, 4, 5]);

// 注意：消息会被结构化克隆
// 不能发送函数、DOM 节点、Symbol 等
```

### 接收消息

```javascript
const channel = new BroadcastChannel('app-channel');

// 监听消息
channel.onmessage = (event) => {
  console.log('收到消息:', event.data);
  console.log('来源:', event.origin);
};

// 使用 addEventListener
channel.addEventListener('message', (event) => {
  console.log('消息数据:', event.data);
});

// 错误处理
channel.onmessageerror = (event) => {
  console.error('消息反序列化失败:', event);
};
```

## 消息管理

### 消息类型系统

```javascript
class TypedBroadcastChannel {
  constructor(name) {
    this.channel = new BroadcastChannel(name);
    this.handlers = new Map();
    
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }
  
  // 注册消息处理器
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type).add(handler);
    
    // 返回取消订阅函数
    return () => {
      this.handlers.get(type).delete(handler);
    };
  }
  
  // 发送类型化消息
  emit(type, payload) {
    this.channel.postMessage({ type, payload, timestamp: Date.now() });
  }
  
  // 处理消息
  handleMessage(data) {
    if (data.type && this.handlers.has(data.type)) {
      this.handlers.get(data.type).forEach(handler => {
        handler(data.payload, data);
      });
    }
  }
  
  // 关闭频道
  close() {
    this.channel.close();
    this.handlers.clear();
  }
}

// 使用
const bus = new TypedBroadcastChannel('app-bus');

// 订阅
const unsubscribe = bus.on('USER_LOGIN', (payload) => {
  console.log('用户登录:', payload);
});

// 发送
bus.emit('USER_LOGIN', { userId: 123 });

// 取消订阅
unsubscribe();
```

### 请求-响应模式

```javascript
class BroadcastRPC {
  constructor(name) {
    this.channel = new BroadcastChannel(name);
    this.pendingRequests = new Map();
    this.handlers = new Map();
    this.instanceId = crypto.randomUUID();
    
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }
  
  // 注册请求处理器
  handle(method, handler) {
    this.handlers.set(method, handler);
  }
  
  // 发送请求
  async request(method, params, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Request timeout'));
      }, timeout);
      
      this.pendingRequests.set(id, { resolve, reject, timer });
      
      this.channel.postMessage({
        type: 'request',
        id,
        method,
        params,
        from: this.instanceId
      });
    });
  }
  
  // 处理消息
  async handleMessage(data) {
    if (data.type === 'request' && data.from !== this.instanceId) {
      // 处理请求
      const handler = this.handlers.get(data.method);
      if (handler) {
        try {
          const result = await handler(data.params);
          this.channel.postMessage({
            type: 'response',
            id: data.id,
            result,
            from: this.instanceId
          });
        } catch (error) {
          this.channel.postMessage({
            type: 'response',
            id: data.id,
            error: error.message,
            from: this.instanceId
          });
        }
      }
    } else if (data.type === 'response') {
      // 处理响应
      const pending = this.pendingRequests.get(data.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(data.id);
        
        if (data.error) {
          pending.reject(new Error(data.error));
        } else {
          pending.resolve(data.result);
        }
      }
    }
  }
  
  close() {
    this.channel.close();
    this.pendingRequests.forEach(({ timer }) => clearTimeout(timer));
    this.pendingRequests.clear();
  }
}

// 使用
const rpc = new BroadcastRPC('app-rpc');

// 注册处理器（在其他标签页）
rpc.handle('getUser', async (params) => {
  const user = await fetchUser(params.id);
  return user;
});

// 发送请求
const user = await rpc.request('getUser', { id: 123 });
console.log('用户:', user);
```

## 状态同步

### 跨标签页状态管理

```javascript
class SharedState {
  constructor(channelName, initialState = {}) {
    this.channel = new BroadcastChannel(channelName);
    this.state = { ...initialState };
    this.listeners = new Set();
    this.instanceId = crypto.randomUUID();
    
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    
    // 请求其他标签页的状态
    this.requestSync();
  }
  
  requestSync() {
    this.channel.postMessage({
      type: 'SYNC_REQUEST',
      from: this.instanceId
    });
  }
  
  handleMessage(data) {
    if (data.from === this.instanceId) return;
    
    switch (data.type) {
      case 'SYNC_REQUEST':
        // 响应同步请求
        this.channel.postMessage({
          type: 'SYNC_RESPONSE',
          state: this.state,
          from: this.instanceId
        });
        break;
        
      case 'SYNC_RESPONSE':
        // 合并状态（可自定义合并策略）
        this.state = { ...this.state, ...data.state };
        this.notify();
        break;
        
      case 'STATE_UPDATE':
        // 应用更新
        this.state = { ...this.state, ...data.changes };
        this.notify();
        break;
    }
  }
  
  getState() {
    return { ...this.state };
  }
  
  setState(changes) {
    this.state = { ...this.state, ...changes };
    
    // 广播变更
    this.channel.postMessage({
      type: 'STATE_UPDATE',
      changes,
      from: this.instanceId
    });
    
    this.notify();
  }
  
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
  
  close() {
    this.channel.close();
    this.listeners.clear();
  }
}

// 使用
const sharedState = new SharedState('app-state', {
  user: null,
  theme: 'light',
  locale: 'zh-CN'
});

// 订阅变化
sharedState.subscribe((state) => {
  console.log('状态变化:', state);
  updateUI(state);
});

// 更新状态
sharedState.setState({ theme: 'dark' });
```

### 用户登录状态同步

```javascript
class AuthSync {
  constructor() {
    this.channel = new BroadcastChannel('auth-sync');
    this.currentUser = null;
    this.onAuthChange = null;
    
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    
    // 从 localStorage 恢复
    this.restore();
  }
  
  restore() {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch {}
    }
  }
  
  handleMessage(data) {
    switch (data.type) {
      case 'LOGIN':
        this.currentUser = data.user;
        localStorage.setItem('auth', JSON.stringify(data.user));
        this.onAuthChange?.('login', data.user);
        break;
        
      case 'LOGOUT':
        this.currentUser = null;
        localStorage.removeItem('auth');
        this.onAuthChange?.('logout');
        break;
        
      case 'TOKEN_REFRESH':
        if (this.currentUser) {
          this.currentUser.token = data.token;
          localStorage.setItem('auth', JSON.stringify(this.currentUser));
        }
        break;
    }
  }
  
  login(user) {
    this.currentUser = user;
    localStorage.setItem('auth', JSON.stringify(user));
    
    this.channel.postMessage({
      type: 'LOGIN',
      user
    });
    
    this.onAuthChange?.('login', user);
  }
  
  logout() {
    this.currentUser = null;
    localStorage.removeItem('auth');
    
    this.channel.postMessage({
      type: 'LOGOUT'
    });
    
    this.onAuthChange?.('logout');
  }
  
  refreshToken(token) {
    if (this.currentUser) {
      this.currentUser.token = token;
      localStorage.setItem('auth', JSON.stringify(this.currentUser));
      
      this.channel.postMessage({
        type: 'TOKEN_REFRESH',
        token
      });
    }
  }
  
  isAuthenticated() {
    return this.currentUser !== null;
  }
  
  getUser() {
    return this.currentUser;
  }
}

// 使用
const authSync = new AuthSync();

authSync.onAuthChange = (type, user) => {
  if (type === 'login') {
    console.log('用户已登录:', user);
    updateHeader(user);
  } else {
    console.log('用户已登出');
    redirectToLogin();
  }
};

// 登录
authSync.login({ id: 1, name: 'John', token: 'abc123' });

// 其他标签页会自动同步
```

## 实际应用场景

### 购物车同步

```javascript
class CartSync {
  constructor() {
    this.channel = new BroadcastChannel('cart-sync');
    this.cart = this.loadCart();
    this.onCartUpdate = null;
    
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }
  
  loadCart() {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch {
      return [];
    }
  }
  
  saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }
  
  handleMessage(data) {
    switch (data.type) {
      case 'CART_UPDATE':
        this.cart = data.cart;
        this.saveCart();
        this.onCartUpdate?.(this.cart);
        break;
    }
  }
  
  addItem(item) {
    const existing = this.cart.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      this.cart.push({ ...item, quantity: item.quantity || 1 });
    }
    
    this.syncCart();
  }
  
  removeItem(itemId) {
    this.cart = this.cart.filter(i => i.id !== itemId);
    this.syncCart();
  }
  
  updateQuantity(itemId, quantity) {
    const item = this.cart.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      if (quantity <= 0) {
        this.removeItem(itemId);
        return;
      }
    }
    this.syncCart();
  }
  
  clearCart() {
    this.cart = [];
    this.syncCart();
  }
  
  syncCart() {
    this.saveCart();
    this.channel.postMessage({
      type: 'CART_UPDATE',
      cart: this.cart
    });
    this.onCartUpdate?.(this.cart);
  }
  
  getCart() {
    return [...this.cart];
  }
  
  getTotal() {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  
  getItemCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }
}

// 使用
const cartSync = new CartSync();

cartSync.onCartUpdate = (cart) => {
  updateCartBadge(cartSync.getItemCount());
  updateCartTotal(cartSync.getTotal());
};

// 添加商品
cartSync.addItem({ id: 'prod-1', name: 'iPhone', price: 999 });
```

### 通知同步

```javascript
class NotificationSync {
  constructor() {
    this.channel = new BroadcastChannel('notification-sync');
    this.notifications = [];
    this.onNotification = null;
    this.onDismiss = null;
    
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }
  
  handleMessage(data) {
    switch (data.type) {
      case 'NEW_NOTIFICATION':
        this.notifications.push(data.notification);
        this.onNotification?.(data.notification);
        break;
        
      case 'DISMISS_NOTIFICATION':
        this.notifications = this.notifications.filter(
          n => n.id !== data.notificationId
        );
        this.onDismiss?.(data.notificationId);
        break;
        
      case 'DISMISS_ALL':
        this.notifications = [];
        this.onDismiss?.('all');
        break;
    }
  }
  
  show(notification) {
    const notif = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...notification
    };
    
    this.notifications.push(notif);
    this.channel.postMessage({
      type: 'NEW_NOTIFICATION',
      notification: notif
    });
    this.onNotification?.(notif);
    
    return notif.id;
  }
  
  dismiss(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.channel.postMessage({
      type: 'DISMISS_NOTIFICATION',
      notificationId: id
    });
    this.onDismiss?.(id);
  }
  
  dismissAll() {
    this.notifications = [];
    this.channel.postMessage({ type: 'DISMISS_ALL' });
    this.onDismiss?.('all');
  }
  
  getNotifications() {
    return [...this.notifications];
  }
}

// 使用
const notifSync = new NotificationSync();

notifSync.onNotification = (notification) => {
  showToast(notification);
};

// 显示通知（所有标签页都会看到）
notifSync.show({
  title: '新消息',
  message: '您有一条新消息',
  type: 'info'
});
```

### 标签页领导者选举

```javascript
class TabLeaderElection {
  constructor(channelName) {
    this.channel = new BroadcastChannel(channelName);
    this.tabId = crypto.randomUUID();
    this.isLeader = false;
    this.leaderId = null;
    this.onLeaderChange = null;
    
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    
    // 开始选举
    this.startElection();
    
    // 定期心跳
    this.heartbeatInterval = setInterval(() => {
      if (this.isLeader) {
        this.sendHeartbeat();
      }
    }, 2000);
    
    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      if (this.isLeader) {
        this.channel.postMessage({
          type: 'LEADER_LEAVING',
          tabId: this.tabId
        });
      }
    });
  }
  
  handleMessage(data) {
    switch (data.type) {
      case 'ELECTION_START':
        // 其他标签页发起选举，参与竞选
        this.channel.postMessage({
          type: 'ELECTION_VOTE',
          tabId: this.tabId,
          timestamp: Date.now()
        });
        break;
        
      case 'ELECTION_VOTE':
        // 收集投票
        if (!this.leaderId || data.tabId < this.leaderId) {
          this.leaderId = data.tabId;
        }
        break;
        
      case 'LEADER_ANNOUNCE':
        this.leaderId = data.tabId;
        this.isLeader = data.tabId === this.tabId;
        this.onLeaderChange?.(this.isLeader, this.leaderId);
        break;
        
      case 'LEADER_HEARTBEAT':
        this.leaderId = data.tabId;
        break;
        
      case 'LEADER_LEAVING':
        if (data.tabId === this.leaderId) {
          this.startElection();
        }
        break;
    }
  }
  
  startElection() {
    this.channel.postMessage({
      type: 'ELECTION_START',
      tabId: this.tabId
    });
    
    // 等待投票
    setTimeout(() => {
      this.announceLeader();
    }, 500);
  }
  
  announceLeader() {
    // 如果没有收到其他投票，自己成为领导者
    if (!this.leaderId || this.tabId <= this.leaderId) {
      this.leaderId = this.tabId;
      this.isLeader = true;
      
      this.channel.postMessage({
        type: 'LEADER_ANNOUNCE',
        tabId: this.tabId
      });
      
      this.onLeaderChange?.(true, this.tabId);
    }
  }
  
  sendHeartbeat() {
    this.channel.postMessage({
      type: 'LEADER_HEARTBEAT',
      tabId: this.tabId
    });
  }
  
  close() {
    clearInterval(this.heartbeatInterval);
    this.channel.close();
  }
}

// 使用
const election = new TabLeaderElection('leader-election');

election.onLeaderChange = (isLeader, leaderId) => {
  if (isLeader) {
    console.log('本标签页成为领导者');
    // 执行只应该在一个标签页运行的任务
    startBackgroundSync();
  } else {
    console.log('领导者是:', leaderId);
  }
};
```

## 最佳实践总结

```
Broadcast Channel API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   消息设计                                          │
│   ├── 使用类型化消息                               │
│   ├── 包含发送者标识                               │
│   ├── 添加时间戳                                   │
│   └── 保持消息精简                                 │
│                                                     │
│   状态管理                                          │
│   ├── 结合 localStorage 持久化                     │
│   ├── 实现冲突解决策略                             │
│   ├── 处理初始同步                                 │
│   └── 避免循环广播                                 │
│                                                     │
│   资源管理                                          │
│   ├── 及时关闭不需要的频道                         │
│   ├── 避免频繁发送大消息                           │
│   ├── 处理页面卸载                                 │
│   └── 实现心跳检测                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 特性 | 说明 |
|------|------|
| 同源限制 | 仅同源页面可通信 |
| 消息类型 | 可结构化克隆的数据 |
| 广播范围 | 同一频道的所有上下文 |
| 性能 | 比 localStorage 事件更高效 |

---

*掌握 Broadcast Channel API，实现高效的跨标签页通信。*
