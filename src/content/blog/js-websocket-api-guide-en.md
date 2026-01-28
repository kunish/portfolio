---
title: 'JavaScript WebSocket API Complete Guide'
description: 'Master real-time communication: WebSocket connections, message handling, heartbeat detection, and reconnection mechanisms'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'js-websocket-api-guide'
---

The WebSocket API provides full-duplex communication between browsers and servers. This article covers WebSocket usage and best practices.

## Basic Concepts

### Creating Connections

```javascript
// Create WebSocket connection
const ws = new WebSocket('wss://example.com/socket');

// Connection with protocols
const wsWithProtocol = new WebSocket('wss://example.com/socket', ['protocol1', 'protocol2']);

// Connection state
console.log(ws.readyState);
// 0 - CONNECTING: Connecting
// 1 - OPEN: Connected
// 2 - CLOSING: Closing
// 3 - CLOSED: Closed
```

### Basic Events

```javascript
const ws = new WebSocket('wss://example.com/socket');

// Connection opened
ws.onopen = (event) => {
  console.log('Connection established');
  ws.send('Hello Server!');
};

// Message received
ws.onmessage = (event) => {
  console.log('Message received:', event.data);
};

// Connection closed
ws.onclose = (event) => {
  console.log('Connection closed:', {
    code: event.code,
    reason: event.reason,
    wasClean: event.wasClean
  });
};

// Connection error
ws.onerror = (event) => {
  console.error('WebSocket error:', event);
};

// Using addEventListener
ws.addEventListener('message', (event) => {
  console.log('Message:', event.data);
});
```

### Sending Messages

```javascript
// Send text
ws.send('Hello World');

// Send JSON
ws.send(JSON.stringify({ type: 'message', content: 'Hello' }));

// Send binary data
const buffer = new ArrayBuffer(8);
ws.send(buffer);

// Send Blob
const blob = new Blob(['data'], { type: 'application/octet-stream' });
ws.send(blob);

// Check buffer
console.log('Bytes pending:', ws.bufferedAmount);

// Set binary type
ws.binaryType = 'arraybuffer'; // or 'blob'
```

## WebSocket Wrapper

### Basic Wrapper Class

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
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.flushMessageQueue();
      this.emit('open');
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code);
      this.emit('close', event);

      if (this.options.reconnect && !event.wasClean) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
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

      // Dispatch by type
      if (data.type) {
        this.emit(data.type, data.payload || data);
      }
    } catch {
      // Non-JSON message
      this.emit('message', event.data);
    }
  }

  send(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // Connection not ready, add to queue
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
      console.log('Max reconnect attempts reached');
      this.emit('maxReconnectAttempts');
      return;
    }

    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(this.options.reconnectDecay, this.reconnectAttempts),
      this.options.maxReconnectInterval
    );

    console.log(`Reconnecting in ${delay}ms...`);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`Reconnect attempt #${this.reconnectAttempts}`);
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

// Usage
const client = new WebSocketClient('wss://example.com/socket');

client.on('open', () => {
  console.log('Connected');
});

client.on('message', (data) => {
  console.log('Message received:', data);
});

client.send({ type: 'subscribe', channel: 'updates' });
```

### Heartbeat Detection

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

    // Wait for pong response
    this.pongTimer = setTimeout(() => {
      console.log('Heartbeat timeout, disconnecting');
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

      // Handle pong response
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

## Practical Applications

### Chat Application

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
      console.log('Chat connection closed');
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
        console.log('Authentication successful');
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
        console.error('Server error:', data.message);
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

// Usage
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

### Real-time Data Subscription

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

    // Return unsubscribe function
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

// Usage
const subscriber = new DataSubscriber('wss://data.example.com');

// Subscribe to stock data
const unsubscribe = subscriber.subscribe('stocks:AAPL', (data) => {
  console.log('AAPL price:', data.price);
  updateStockChart(data);
});

// Subscribe to news
subscriber.subscribe('news:tech', (data) => {
  displayNews(data);
});

// Unsubscribe
// unsubscribe();
```

### Collaborative Editing

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
        // Initialize document state
        this.version = data.version;
        this.onRemoteChange?.(data.content, 'init');
        break;

      case 'change':
        // Handle remote change
        if (data.version === this.version + 1) {
          this.version = data.version;
          this.applyRemoteChange(data.change);
        } else {
          // Version conflict, need sync
          this.requestSync();
        }
        break;

      case 'ack':
        // Change acknowledged
        const pending = this.pendingChanges.shift();
        if (pending) {
          this.version = data.version;
        }
        break;

      case 'cursor':
        // Other users' cursor positions
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
    // Operational Transformation
    const transformedChange = this.transformChange(change);
    this.onRemoteChange?.(transformedChange, 'remote');
  }

  transformChange(change) {
    // Simplified operational transformation
    // Real implementation needs full OT algorithm
    return change;
  }

  requestSync() {
    this.ws.send({
      type: 'sync',
      documentId: this.documentId
    });
  }
}

// Usage
const editor = new CollaborativeEditor('wss://collab.example.com', 'doc123');

editor.onRemoteChange = (change, source) => {
  if (source !== 'local') {
    applyChangeToEditor(change);
  }
};

editor.onCursorUpdate = (userId, position) => {
  showRemoteCursor(userId, position);
};

// On local edit
function onLocalEdit(change) {
  editor.sendChange(change);
}
```

## Best Practices Summary

```
WebSocket Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Connection Management                             │
│   ├── Implement auto-reconnection                  │
│   ├── Use heartbeat for keep-alive                 │
│   ├── Handle connection states properly            │
│   └── Close connections gracefully                 │
│                                                     │
│   Message Handling                                  │
│   ├── Use JSON formatted messages                  │
│   ├── Implement message queue                      │
│   ├── Handle message acknowledgment                │
│   └── Consider message compression                 │
│                                                     │
│   Security                                          │
│   ├── Use wss:// encrypted connections            │
│   ├── Implement authentication                     │
│   ├── Validate message sources                     │
│   └── Prevent message injection                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Close Code | Meaning | Scenario |
|-----------|---------|----------|
| 1000 | Normal close | Active disconnect |
| 1001 | Going away | Page close |
| 1006 | Abnormal close | Network disconnect |
| 1011 | Server error | Server exception |

---

*Master the WebSocket API to build real-time, efficient web applications.*
