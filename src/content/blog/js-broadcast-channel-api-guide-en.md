---
title: 'JavaScript Broadcast Channel API Complete Guide'
description: 'Master cross-tab communication: message broadcasting, state synchronization, multi-window collaboration, and real-time data sharing'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'js-broadcast-channel-api-guide'
---

The Broadcast Channel API provides a communication mechanism between same-origin browser contexts. This article covers its usage and practical applications.

## Basic Concepts

### Creating Channels

```javascript
// Create or join a broadcast channel
const channel = new BroadcastChannel('my-channel');

// Channel name
console.log(channel.name); // 'my-channel'

// Close channel
channel.close();
```

### Sending Messages

```javascript
const channel = new BroadcastChannel('app-channel');

// Send simple message
channel.postMessage('Hello from this tab!');

// Send object
channel.postMessage({
  type: 'USER_LOGIN',
  payload: { userId: 123, username: 'john' }
});

// Send array
channel.postMessage([1, 2, 3, 4, 5]);

// Note: Messages are structurally cloned
// Cannot send functions, DOM nodes, Symbols, etc.
```

### Receiving Messages

```javascript
const channel = new BroadcastChannel('app-channel');

// Listen for messages
channel.onmessage = (event) => {
  console.log('Received message:', event.data);
  console.log('Origin:', event.origin);
};

// Using addEventListener
channel.addEventListener('message', (event) => {
  console.log('Message data:', event.data);
});

// Error handling
channel.onmessageerror = (event) => {
  console.error('Message deserialization failed:', event);
};
```

## Message Management

### Typed Message System

```javascript
class TypedBroadcastChannel {
  constructor(name) {
    this.channel = new BroadcastChannel(name);
    this.handlers = new Map();
    
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }
  
  // Register message handler
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type).add(handler);
    
    // Return unsubscribe function
    return () => {
      this.handlers.get(type).delete(handler);
    };
  }
  
  // Send typed message
  emit(type, payload) {
    this.channel.postMessage({ type, payload, timestamp: Date.now() });
  }
  
  // Handle message
  handleMessage(data) {
    if (data.type && this.handlers.has(data.type)) {
      this.handlers.get(data.type).forEach(handler => {
        handler(data.payload, data);
      });
    }
  }
  
  // Close channel
  close() {
    this.channel.close();
    this.handlers.clear();
  }
}

// Usage
const bus = new TypedBroadcastChannel('app-bus');

// Subscribe
const unsubscribe = bus.on('USER_LOGIN', (payload) => {
  console.log('User logged in:', payload);
});

// Emit
bus.emit('USER_LOGIN', { userId: 123 });

// Unsubscribe
unsubscribe();
```

### Request-Response Pattern

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
  
  // Register request handler
  handle(method, handler) {
    this.handlers.set(method, handler);
  }
  
  // Send request
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
  
  // Handle message
  async handleMessage(data) {
    if (data.type === 'request' && data.from !== this.instanceId) {
      // Handle request
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
      // Handle response
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

// Usage
const rpc = new BroadcastRPC('app-rpc');

// Register handler (in other tabs)
rpc.handle('getUser', async (params) => {
  const user = await fetchUser(params.id);
  return user;
});

// Send request
const user = await rpc.request('getUser', { id: 123 });
console.log('User:', user);
```

## State Synchronization

### Cross-Tab State Management

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
    
    // Request state from other tabs
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
        // Respond to sync request
        this.channel.postMessage({
          type: 'SYNC_RESPONSE',
          state: this.state,
          from: this.instanceId
        });
        break;
        
      case 'SYNC_RESPONSE':
        // Merge state (custom merge strategy possible)
        this.state = { ...this.state, ...data.state };
        this.notify();
        break;
        
      case 'STATE_UPDATE':
        // Apply update
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
    
    // Broadcast changes
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

// Usage
const sharedState = new SharedState('app-state', {
  user: null,
  theme: 'light',
  locale: 'en-US'
});

// Subscribe to changes
sharedState.subscribe((state) => {
  console.log('State changed:', state);
  updateUI(state);
});

// Update state
sharedState.setState({ theme: 'dark' });
```

### User Authentication Sync

```javascript
class AuthSync {
  constructor() {
    this.channel = new BroadcastChannel('auth-sync');
    this.currentUser = null;
    this.onAuthChange = null;
    
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    
    // Restore from localStorage
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

// Usage
const authSync = new AuthSync();

authSync.onAuthChange = (type, user) => {
  if (type === 'login') {
    console.log('User logged in:', user);
    updateHeader(user);
  } else {
    console.log('User logged out');
    redirectToLogin();
  }
};

// Login
authSync.login({ id: 1, name: 'John', token: 'abc123' });

// Other tabs will sync automatically
```

## Practical Applications

### Shopping Cart Sync

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

// Usage
const cartSync = new CartSync();

cartSync.onCartUpdate = (cart) => {
  updateCartBadge(cartSync.getItemCount());
  updateCartTotal(cartSync.getTotal());
};

// Add product
cartSync.addItem({ id: 'prod-1', name: 'iPhone', price: 999 });
```

### Notification Sync

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

// Usage
const notifSync = new NotificationSync();

notifSync.onNotification = (notification) => {
  showToast(notification);
};

// Show notification (all tabs will see it)
notifSync.show({
  title: 'New Message',
  message: 'You have a new message',
  type: 'info'
});
```

### Tab Leader Election

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
    
    // Start election
    this.startElection();
    
    // Periodic heartbeat
    this.heartbeatInterval = setInterval(() => {
      if (this.isLeader) {
        this.sendHeartbeat();
      }
    }, 2000);
    
    // Listen for page unload
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
        // Another tab started election, participate
        this.channel.postMessage({
          type: 'ELECTION_VOTE',
          tabId: this.tabId,
          timestamp: Date.now()
        });
        break;
        
      case 'ELECTION_VOTE':
        // Collect votes
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
    
    // Wait for votes
    setTimeout(() => {
      this.announceLeader();
    }, 500);
  }
  
  announceLeader() {
    // If no other votes received, become leader
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

// Usage
const election = new TabLeaderElection('leader-election');

election.onLeaderChange = (isLeader, leaderId) => {
  if (isLeader) {
    console.log('This tab is now the leader');
    // Execute tasks that should only run in one tab
    startBackgroundSync();
  } else {
    console.log('Leader is:', leaderId);
  }
};
```

## Best Practices Summary

```
Broadcast Channel API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Message Design                                    │
│   ├── Use typed messages                           │
│   ├── Include sender identification                │
│   ├── Add timestamps                               │
│   └── Keep messages concise                        │
│                                                     │
│   State Management                                  │
│   ├── Combine with localStorage persistence        │
│   ├── Implement conflict resolution                │
│   ├── Handle initial synchronization              │
│   └── Avoid circular broadcasts                    │
│                                                     │
│   Resource Management                               │
│   ├── Close unused channels promptly               │
│   ├── Avoid frequent large messages                │
│   ├── Handle page unload                           │
│   └── Implement heartbeat detection               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Feature | Description |
|---------|-------------|
| Same-origin restriction | Only same-origin pages can communicate |
| Message types | Structurally clonable data |
| Broadcast scope | All contexts on the same channel |
| Performance | More efficient than localStorage events |

---

*Master the Broadcast Channel API for efficient cross-tab communication.*
