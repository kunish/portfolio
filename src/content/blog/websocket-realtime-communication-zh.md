---
title: 'WebSocket 实战：构建实时通信应用'
description: '掌握 WebSocket 协议、Socket.IO、消息推送和实时数据同步'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'websocket-realtime-communication'
---

实时通信是现代 Web 应用的核心需求。本文深入探讨 WebSocket 协议和实时应用开发实践。

## 实时通信技术对比

### 技术选型

```
实时通信技术：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   轮询 (Polling)                                    │
│   ├── 定时发送请求                                  │
│   ├── 实现简单                                      │
│   └── 资源消耗大，延迟高                            │
│                                                     │
│   长轮询 (Long Polling)                             │
│   ├── 服务器保持连接直到有数据                      │
│   ├── 减少无效请求                                  │
│   └── 连接频繁建立断开                              │
│                                                     │
│   SSE (Server-Sent Events)                          │
│   ├── 单向通信（服务器到客户端）                    │
│   ├── 基于 HTTP                                     │
│   └── 自动重连                                      │
│                                                     │
│   WebSocket                                         │
│   ├── 全双工通信                                    │
│   ├── 低延迟                                        │
│   └── 需要专门的服务器支持                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 技术 | 延迟 | 带宽 | 复杂度 | 适用场景 |
|------|------|------|--------|----------|
| Polling | 高 | 高 | 低 | 简单更新 |
| Long Polling | 中 | 中 | 中 | 通知推送 |
| SSE | 低 | 低 | 低 | 实时数据流 |
| WebSocket | 极低 | 极低 | 高 | 双向交互 |

## WebSocket 基础

### 原生 WebSocket

```typescript
// 服务端 (Node.js + ws)
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const server = http.createServer();
const wss = new WebSocketServer({ server });

// 连接管理
const clients = new Map<string, WebSocket>();

wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  clients.set(clientId, ws);

  console.log(`Client ${clientId} connected`);

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId,
  }));

  // 接收消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(clientId, message);
    } catch (error) {
      console.error('Invalid message format');
    }
  });

  // 连接关闭
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected`);
  });

  // 错误处理
  ws.on('error', (error) => {
    console.error(`Client ${clientId} error:`, error);
  });

  // 心跳检测
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

// 心跳定时器
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeat);
});

server.listen(8080);
```

### 客户端连接

```typescript
// 客户端
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers = new Map<string, (data: any) => void>();

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message.data);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, delay);
  }

  on(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  send(type: string, data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  close(): void {
    this.ws?.close();
  }
}

// 使用
const client = new WebSocketClient('ws://localhost:8080');
await client.connect();

client.on('welcome', (data) => {
  console.log('Connected with ID:', data.clientId);
});

client.on('message', (data) => {
  console.log('Received:', data);
});

client.send('chat', { text: 'Hello!' });
```

## Socket.IO 实战

### 服务端配置

```typescript
import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// 认证中间件
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  try {
    const user = await verifyToken(token);
    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// 连接处理
io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`User ${user.id} connected`);

  // 加入用户房间
  socket.join(`user:${user.id}`);

  // 聊天消息
  socket.on('chat:send', async (data, callback) => {
    try {
      const message = await saveMessage({
        senderId: user.id,
        roomId: data.roomId,
        content: data.content,
      });

      // 广播到房间
      io.to(data.roomId).emit('chat:message', message);

      callback({ success: true, messageId: message.id });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // 加入房间
  socket.on('room:join', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('room:user-joined', {
      userId: user.id,
      username: user.name,
    });
  });

  // 离开房间
  socket.on('room:leave', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('room:user-left', {
      userId: user.id,
    });
  });

  // 输入状态
  socket.on('typing:start', (roomId) => {
    socket.to(roomId).emit('typing:user', {
      userId: user.id,
      username: user.name,
    });
  });

  socket.on('typing:stop', (roomId) => {
    socket.to(roomId).emit('typing:stopped', {
      userId: user.id,
    });
  });

  // 断开连接
  socket.on('disconnect', (reason) => {
    console.log(`User ${user.id} disconnected: ${reason}`);
  });
});

httpServer.listen(3001);
```

### 客户端集成

```typescript
import { io, Socket } from 'socket.io-client';

class ChatClient {
  private socket: Socket;
  private eventHandlers = new Map<string, Set<Function>>();

  constructor(url: string, token: string) {
    this.socket = io(url, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      this.emit('error', error);
    });

    this.socket.on('chat:message', (message) => {
      this.emit('message', message);
    });

    this.socket.on('typing:user', (data) => {
      this.emit('typing', data);
    });
  }

  connect(): void {
    this.socket.connect();
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  joinRoom(roomId: string): void {
    this.socket.emit('room:join', roomId);
  }

  leaveRoom(roomId: string): void {
    this.socket.emit('room:leave', roomId);
  }

  sendMessage(roomId: string, content: string): Promise<{ messageId: string }> {
    return new Promise((resolve, reject) => {
      this.socket.emit('chat:send', { roomId, content }, (response) => {
        if (response.success) {
          resolve({ messageId: response.messageId });
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  startTyping(roomId: string): void {
    this.socket.emit('typing:start', roomId);
  }

  stopTyping(roomId: string): void {
    this.socket.emit('typing:stop', roomId);
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    handlers?.forEach(handler => handler(data));
  }
}
```

## 房间和广播

```typescript
// 高级广播模式
class BroadcastService {
  constructor(private io: Server) {}

  // 发送给特定用户
  toUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // 发送给房间内所有人
  toRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  // 发送给房间内除发送者外的所有人
  toRoomExcept(socket: Socket, roomId: string, event: string, data: any): void {
    socket.to(roomId).emit(event, data);
  }

  // 发送给所有连接的客户端
  toAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // 发送给多个房间
  toRooms(roomIds: string[], event: string, data: any): void {
    this.io.to(roomIds).emit(event, data);
  }

  // 带确认的发送
  async toUserWithAck(
    userId: string,
    event: string,
    data: any,
    timeout = 5000
  ): Promise<any> {
    const sockets = await this.io.in(`user:${userId}`).fetchSockets();

    if (sockets.length === 0) {
      throw new Error('User not connected');
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Acknowledgment timeout'));
      }, timeout);

      sockets[0].emit(event, data, (response: any) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  }
}
```

## 消息队列集成

```typescript
// 使用 Redis 作为 Socket.IO 适配器
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));

// 跨服务器广播
// 服务器 A
io.to('room:123').emit('message', { text: 'Hello' });

// 服务器 B 上的客户端也会收到消息

// 外部服务发送消息
async function sendFromExternalService(roomId: string, message: any) {
  await pubClient.publish('socket.io#/#', JSON.stringify({
    type: 2, // 事件类型
    nsp: '/',
    data: ['message', message],
    rooms: [roomId],
  }));
}
```

## 实时数据同步

```typescript
// 协作编辑示例
interface Operation {
  type: 'insert' | 'delete';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

class CollaborativeDocument {
  private content = '';
  private operations: Operation[] = [];
  private io: Server;
  private documentId: string;

  constructor(io: Server, documentId: string) {
    this.io = io;
    this.documentId = documentId;
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket) => {
      socket.on('doc:join', () => {
        socket.join(this.documentId);
        socket.emit('doc:sync', {
          content: this.content,
          version: this.operations.length,
        });
      });

      socket.on('doc:operation', (operation: Operation) => {
        // 应用操作
        this.applyOperation(operation);

        // 广播给其他用户
        socket.to(this.documentId).emit('doc:operation', operation);
      });

      socket.on('doc:cursor', (position) => {
        socket.to(this.documentId).emit('doc:cursor', {
          userId: socket.data.user.id,
          position,
        });
      });
    });
  }

  private applyOperation(op: Operation): void {
    if (op.type === 'insert' && op.content) {
      this.content =
        this.content.slice(0, op.position) +
        op.content +
        this.content.slice(op.position);
    } else if (op.type === 'delete' && op.length) {
      this.content =
        this.content.slice(0, op.position) +
        this.content.slice(op.position + op.length);
    }

    this.operations.push(op);
  }
}
```

## 性能优化

```typescript
// 消息压缩
import { Server } from 'socket.io';

const io = new Server(httpServer, {
  perMessageDeflate: {
    threshold: 1024, // 超过 1KB 压缩
    zlibDeflateOptions: {
      chunkSize: 16 * 1024,
    },
  },
});

// 消息批处理
class MessageBatcher {
  private batch: any[] = [];
  private timer: NodeJS.Timeout | null = null;
  private batchSize = 100;
  private flushInterval = 50;

  constructor(private socket: Socket) {}

  add(message: any): void {
    this.batch.push(message);

    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  private flush(): void {
    if (this.batch.length > 0) {
      this.socket.emit('batch', this.batch);
      this.batch = [];
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
```

## 最佳实践总结

```
WebSocket 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   连接管理                                          │
│   ├── 实现心跳检测                                  │
│   ├── 自动重连机制                                  │
│   ├── 连接状态监控                                  │
│   └── 优雅断开处理                                  │
│                                                     │
│   消息设计                                          │
│   ├── 使用结构化消息格式                            │
│   ├── 实现消息确认                                  │
│   ├── 考虑消息压缩                                  │
│   └── 处理消息顺序                                  │
│                                                     │
│   扩展性                                            │
│   ├── 使用 Redis 适配器                             │
│   ├── 房间和命名空间                                │
│   ├── 负载均衡配置                                  │
│   └── 连接数监控                                    │
│                                                     │
│   安全性                                            │
│   ├── 认证鉴权                                      │
│   ├── 消息验证                                      │
│   ├── 速率限制                                      │
│   └── 敏感数据加密                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| 聊天应用 | Socket.IO |
| 游戏同步 | 原生 WebSocket |
| 数据推送 | SSE |
| 协作编辑 | Socket.IO + OT/CRDT |
| 通知系统 | Socket.IO |

WebSocket 为 Web 应用带来了真正的实时能力。选择合适的方案，构建流畅的实时体验。

---

*实时是用户期待，低延迟是技术追求。让数据即时流动，让交互更加自然。*
