---
title: 'JavaScript WebSocket API 完全指南'
description: '掌握实时通信：WebSocket 连接、消息处理、心跳检测与重连机制'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'js-websocket-api-guide'
---

WebSocket API 提供了浏览器与服务器之间的全双工通信能力。本文详解 WebSocket 的用法和最佳实践。

## 基础概念

### 创建连接

```javascript
// 创建 WebSocket 连接
const ws = new WebSocket('wss://example.com/socket');

// 带协议的连接
const wsWithProtocol = new WebSocket('wss://example.com/socket', ['protocol1', 'protocol2']);

// 连接状态
console.log(ws.readyState);
// 0 - CONNECTING: 正在连接
// 1 - OPEN: 已连接
// 2 - CLOSING: 正在关闭
// 3 - CLOSED: 已关闭
```

### 基本事件

```javascript
const ws = new WebSocket('wss://example.com/socket');

// 连接打开
ws.onopen = (event) => {
  console.log('连接已建立');
  ws.send('Hello Server!');
};

// 收到消息
ws.onmessage = (event) => {
  console.log('收到消息:', event.data);
};

// 连接关闭
ws.onclose = (event) => {
  console.log('连接已关闭:', {
    code: event.code,
    reason: event.reason,
    wasClean: event.wasClean
  });
};

// 连接错误
ws.onerror = (event) => {
  console.error('WebSocket 错误:', event);
};

// 使用 addEventListener
ws.addEventListener('message', (event) => {
  console.log('消息:', event.data);
});
```

### 发送消息

```javascript
// 发送文本
ws.send('Hello World');

// 发送 JSON
ws.send(JSON.stringify({ type: 'message', content: 'Hello' }));

// 发送二进制数据
const buffer = new ArrayBuffer(8);
ws.send(buffer);

// 发送 Blob
const blob = new Blob(['data'], { type: 'application/octet-stream' });
ws.send(blob);

// 检查缓冲区
console.log('待发送字节:', ws.bufferedAmount);

// 设置二进制类型
ws.binaryType = 'arraybuffer'; // 或 'blob'
```

## WebSocket 封装

### 基础封装类

```javascript
class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnect: true,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      maxReconnectAttempts: null,
      ...options
    };

    this.ws = null;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
    this.messageQueue = [];

    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket 已连接');
      this.reconnectAttempts = 0;
      this.flushMessageQueue();
      this.emit('open');
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket 已关闭:', event.code);
      this.emit('close', event);

      if (this.options.reconnect && !event.wasClean) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      this.emit('error', error);
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.emit('message', data);

      // 按类型分发
      if (data.type) {
        this.emit(data.type, data.payload || data);
      }
    } catch {
      // 非 JSON 消息
      this.emit('message', event.data);
    }
  }

  send(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // 连接未就绪，加入队列
      this.messageQueue.push(message);
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }

  scheduleReconnect() {
    if (this.options.maxReconnectAttempts !== null &&
        this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.log('达到最大重连次数');
      this.emit('maxReconnectAttempts');
      return;
    }

    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(this.options.reconnectDecay, this.reconnectAttempts),
      this.options.maxReconnectInterval
    );

    console.log(`${delay}ms 后重连...`);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`重连尝试 #${this.reconnectAttempts}`);
      this.connect();
    }, delay);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  close(code = 1000, reason = '') {
    this.options.reconnect = false;
    this.ws.close(code, reason);
  }

  get readyState() {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  get isConnected() {
    return this.readyState === WebSocket.OPEN;
  }
}

// 使用
const client = new WebSocketClient('wss://example.com/socket');

client.on('open', () => {
  console.log('已连接');
});

client.on('message', (data) => {
  console.log('收到消息:', data);
});

client.send({ type: 'subscribe', channel: 'updates' });
```

### 心跳检测

```javascript
class HeartbeatWebSocket extends WebSocketClient {
  constructor(url, options = {}) {
    super(url, {
      heartbeatInterval: 30000,
      heartbeatTimeout: 5000,
      pingMessage: { type: 'ping' },
      pongMessage: 'pong',
      ...options
    });

    this.heartbeatTimer = null;
    this.pongTimer = null;

    this.on('open', () => this.startHeartbeat());
    this.on('close', () => this.stopHeartbeat());
    this.on('pong', () => this.handlePong());
  }

  startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.sendPing();
      }
    }, this.options.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  sendPing() {
    this.send(this.options.pingMessage);

    // 等待 pong 响应
    this.pongTimer = setTimeout(() => {
      console.log('心跳超时，断开连接');
      this.ws.close(4000, 'Heartbeat timeout');
    }, this.options.heartbeatTimeout);
  }

  handlePong() {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      // 处理 pong 响应
      if (data.type === 'pong' || data === this.options.pongMessage) {
        this.emit('pong', data);
        return;
      }

      super.handleMessage(event);
    } catch {
      super.handleMessage(event);
    }
  }
}
```

## 实际应用场景

### 聊天应用

```javascript
class ChatClient {
  constructor(url, userId) {
    this.userId = userId;
    this.ws = new HeartbeatWebSocket(url);
    this.rooms = new Set();
    this.messageHandlers = new Map();

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.ws.on('open', () => {
      this.authenticate();
    });

    this.ws.on('message', (data) => {
      this.handleServerMessage(data);
    });

    this.ws.on('close', () => {
      console.log('聊天连接已断开');
    });
  }

  authenticate() {
    this.ws.send({
      type: 'auth',
      userId: this.userId,
      token: this.getAuthToken()
    });
  }

  getAuthToken() {
    return localStorage.getItem('chatToken');
  }

  handleServerMessage(data) {
    switch (data.type) {
      case 'auth_success':
        console.log('认证成功');
        this.rejoinRooms();
        break;

      case 'message':
        this.onMessage(data);
        break;

      case 'user_joined':
        this.onUserJoined(data);
        break;

      case 'user_left':
        this.onUserLeft(data);
        break;

      case 'typing':
        this.onTyping(data);
        break;

      case 'error':
        console.error('服务器错误:', data.message);
        break;
    }
  }

  joinRoom(roomId) {
    this.rooms.add(roomId);
    this.ws.send({
      type: 'join',
      roomId
    });
  }

  leaveRoom(roomId) {
    this.rooms.delete(roomId);
    this.ws.send({
      type: 'leave',
      roomId
    });
  }

  rejoinRooms() {
    this.rooms.forEach(roomId => {
      this.ws.send({
        type: 'join',
        roomId
      });
    });
  }

  sendMessage(roomId, content) {
    const message = {
      type: 'message',
      roomId,
      content,
      timestamp: Date.now()
    };

    this.ws.send(message);
    return message;
  }

  sendTyping(roomId) {
    this.ws.send({
      type: 'typing',
      roomId
    });
  }

  onMessage(data) {
    const handler = this.messageHandlers.get('message');
    if (handler) handler(data);
  }

  onUserJoined(data) {
    const handler = this.messageHandlers.get('userJoined');
    if (handler) handler(data);
  }

  onUserLeft(data) {
    const handler = this.messageHandlers.get('userLeft');
    if (handler) handler(data);
  }

  onTyping(data) {
    const handler = this.messageHandlers.get('typing');
    if (handler) handler(data);
  }

  on(event, handler) {
    this.messageHandlers.set(event, handler);
  }

  disconnect() {
    this.ws.close();
  }
}

// 使用
const chat = new ChatClient('wss://chat.example.com', 'user123');

chat.on('message', (data) => {
  displayMessage(data);
});

chat.on('typing', (data) => {
  showTypingIndicator(data.userId);
});

chat.joinRoom('room1');
chat.sendMessage('room1', 'Hello everyone!');
```

### 实时数据订阅

```javascript
class DataSubscriber {
  constructor(url) {
    this.ws = new WebSocketClient(url);
    this.subscriptions = new Map();
    this.dataHandlers = new Map();

    this.ws.on('message', (data) => {
      this.handleData(data);
    });
  }

  subscribe(channel, handler) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      this.ws.send({
        type: 'subscribe',
        channel
      });
    }

    this.subscriptions.get(channel).add(handler);

    // 返回取消订阅函数
    return () => this.unsubscribe(channel, handler);
  }

  unsubscribe(channel, handler) {
    if (this.subscriptions.has(channel)) {
      const handlers = this.subscriptions.get(channel);
      handlers.delete(handler);

      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
        this.ws.send({
          type: 'unsubscribe',
          channel
        });
      }
    }
  }

  handleData(data) {
    const { channel, payload } = data;

    if (this.subscriptions.has(channel)) {
      this.subscriptions.get(channel).forEach(handler => {
        handler(payload);
      });
    }
  }
}

// 使用
const subscriber = new DataSubscriber('wss://data.example.com');

// 订阅股票数据
const unsubscribe = subscriber.subscribe('stocks:AAPL', (data) => {
  console.log('AAPL 价格:', data.price);
  updateStockChart(data);
});

// 订阅新闻
subscriber.subscribe('news:tech', (data) => {
  displayNews(data);
});

// 取消订阅
// unsubscribe();
```

### 协同编辑

```javascript
class CollaborativeEditor {
  constructor(url, documentId) {
    this.documentId = documentId;
    this.ws = new WebSocketClient(url);
    this.version = 0;
    this.pendingChanges = [];
    this.onRemoteChange = null;

    this.setupConnection();
  }

  setupConnection() {
    this.ws.on('open', () => {
      this.joinDocument();
    });

    this.ws.on('message', (data) => {
      this.handleMessage(data);
    });
  }

  joinDocument() {
    this.ws.send({
      type: 'join',
      documentId: this.documentId
    });
  }

  handleMessage(data) {
    switch (data.type) {
      case 'init':
        // 初始化文档状态
        this.version = data.version;
        this.onRemoteChange?.(data.content, 'init');
        break;

      case 'change':
        // 处理远程变更
        if (data.version === this.version + 1) {
          this.version = data.version;
          this.applyRemoteChange(data.change);
        } else {
          // 版本冲突，需要同步
          this.requestSync();
        }
        break;

      case 'ack':
        // 变更确认
        const pending = this.pendingChanges.shift();
        if (pending) {
          this.version = data.version;
        }
        break;

      case 'cursor':
        // 其他用户的光标位置
        this.onCursorUpdate?.(data.userId, data.position);
        break;
    }
  }

  sendChange(change) {
    const message = {
      type: 'change',
      documentId: this.documentId,
      version: this.version,
      change
    };

    this.pendingChanges.push(change);
    this.ws.send(message);
  }

  sendCursor(position) {
    this.ws.send({
      type: 'cursor',
      documentId: this.documentId,
      position
    });
  }

  applyRemoteChange(change) {
    // 转换操作（OT）
    const transformedChange = this.transformChange(change);
    this.onRemoteChange?.(transformedChange, 'remote');
  }

  transformChange(change) {
    // 简化的操作转换
    // 实际实现需要完整的 OT 算法
    return change;
  }

  requestSync() {
    this.ws.send({
      type: 'sync',
      documentId: this.documentId
    });
  }
}

// 使用
const editor = new CollaborativeEditor('wss://collab.example.com', 'doc123');

editor.onRemoteChange = (change, source) => {
  if (source !== 'local') {
    applyChangeToEditor(change);
  }
};

editor.onCursorUpdate = (userId, position) => {
  showRemoteCursor(userId, position);
};

// 本地编辑时
function onLocalEdit(change) {
  editor.sendChange(change);
}
```

## 最佳实践总结

```
WebSocket 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   连接管理                                          │
│   ├── 实现自动重连机制                             │
│   ├── 使用心跳检测保活                             │
│   ├── 正确处理连接状态                             │
│   └── 优雅关闭连接                                 │
│                                                     │
│   消息处理                                          │
│   ├── 使用 JSON 格式化消息                         │
│   ├── 实现消息队列                                 │
│   ├── 处理消息确认                                 │
│   └── 考虑消息压缩                                 │
│                                                     │
│   安全考虑                                          │
│   ├── 使用 wss:// 加密连接                         │
│   ├── 实现身份认证                                 │
│   ├── 验证消息来源                                 │
│   └── 防止消息注入                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 关闭码 | 含义 | 场景 |
|-------|------|------|
| 1000 | 正常关闭 | 主动断开 |
| 1001 | 离开 | 页面关闭 |
| 1006 | 异常关闭 | 网络断开 |
| 1011 | 服务器错误 | 服务端异常 |

---

*掌握 WebSocket API，构建实时、高效的 Web 应用。*
