---
title: 'WebSocket in Practice: Building Real-Time Communication Apps'
description: 'Master WebSocket protocol, Socket.IO, message pushing and real-time data sync'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'websocket-realtime-communication'
---

Real-time communication is a core requirement for modern web applications. This article explores WebSocket protocol and real-time application development practices.

## Real-Time Communication Technologies

### Technology Comparison

```
Real-Time Communication Technologies:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Polling                                           │
│   ├── Timed requests                               │
│   ├── Simple implementation                        │
│   └── High resource consumption, high latency     │
│                                                     │
│   Long Polling                                      │
│   ├── Server holds connection until data ready    │
│   ├── Reduces unnecessary requests                │
│   └── Frequent connection open/close              │
│                                                     │
│   SSE (Server-Sent Events)                          │
│   ├── One-way (server to client)                  │
│   ├── Based on HTTP                               │
│   └── Auto-reconnect                              │
│                                                     │
│   WebSocket                                         │
│   ├── Full-duplex communication                   │
│   ├── Low latency                                  │
│   └── Requires dedicated server support           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Technology | Latency | Bandwidth | Complexity | Use Case |
|------------|---------|-----------|------------|----------|
| Polling | High | High | Low | Simple updates |
| Long Polling | Medium | Medium | Medium | Notifications |
| SSE | Low | Low | Low | Data streaming |
| WebSocket | Very Low | Very Low | High | Bidirectional |

## WebSocket Basics

### Native WebSocket

```typescript
// Server (Node.js + ws)
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const server = http.createServer();
const wss = new WebSocketServer({ server });

// Connection management
const clients = new Map<string, WebSocket>();

wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  clients.set(clientId, ws);

  console.log(`Client ${clientId} connected`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId,
  }));

  // Receive messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(clientId, message);
    } catch (error) {
      console.error('Invalid message format');
    }
  });

  // Connection closed
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected`);
  });

  // Error handling
  ws.on('error', (error) => {
    console.error(`Client ${clientId} error:`, error);
  });

  // Heartbeat
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

// Heartbeat timer
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

### Client Connection

```typescript
// Client
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

// Usage
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

## Socket.IO in Practice

### Server Configuration

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

// Authentication middleware
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

// Connection handling
io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`User ${user.id} connected`);

  // Join user room
  socket.join(`user:${user.id}`);

  // Chat messages
  socket.on('chat:send', async (data, callback) => {
    try {
      const message = await saveMessage({
        senderId: user.id,
        roomId: data.roomId,
        content: data.content,
      });

      // Broadcast to room
      io.to(data.roomId).emit('chat:message', message);

      callback({ success: true, messageId: message.id });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Join room
  socket.on('room:join', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('room:user-joined', {
      userId: user.id,
      username: user.name,
    });
  });

  // Leave room
  socket.on('room:leave', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('room:user-left', {
      userId: user.id,
    });
  });

  // Typing status
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

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`User ${user.id} disconnected: ${reason}`);
  });
});

httpServer.listen(3001);
```

### Client Integration

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

## Rooms and Broadcasting

```typescript
// Advanced broadcast patterns
class BroadcastService {
  constructor(private io: Server) {}

  // Send to specific user
  toUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Send to everyone in room
  toRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  // Send to room except sender
  toRoomExcept(socket: Socket, roomId: string, event: string, data: any): void {
    socket.to(roomId).emit(event, data);
  }

  // Send to all connected clients
  toAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Send to multiple rooms
  toRooms(roomIds: string[], event: string, data: any): void {
    this.io.to(roomIds).emit(event, data);
  }

  // Send with acknowledgment
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

## Message Queue Integration

```typescript
// Using Redis as Socket.IO adapter
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));

// Cross-server broadcasting
// Server A
io.to('room:123').emit('message', { text: 'Hello' });

// Clients on Server B will also receive the message

// External service sending messages
async function sendFromExternalService(roomId: string, message: any) {
  await pubClient.publish('socket.io#/#', JSON.stringify({
    type: 2,
    nsp: '/',
    data: ['message', message],
    rooms: [roomId],
  }));
}
```

## Real-Time Data Sync

```typescript
// Collaborative editing example
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
        this.applyOperation(operation);
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

## Performance Optimization

```typescript
// Message compression
import { Server } from 'socket.io';

const io = new Server(httpServer, {
  perMessageDeflate: {
    threshold: 1024, // Compress above 1KB
    zlibDeflateOptions: {
      chunkSize: 16 * 1024,
    },
  },
});

// Message batching
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

## Best Practices Summary

```
WebSocket Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Connection Management                             │
│   ├── Implement heartbeat detection               │
│   ├── Auto-reconnection mechanism                 │
│   ├── Connection state monitoring                 │
│   └── Graceful disconnect handling                │
│                                                     │
│   Message Design                                    │
│   ├── Use structured message format               │
│   ├── Implement message acknowledgment            │
│   ├── Consider message compression                │
│   └── Handle message ordering                     │
│                                                     │
│   Scalability                                       │
│   ├── Use Redis adapter                           │
│   ├── Rooms and namespaces                        │
│   ├── Load balancer configuration                 │
│   └── Connection count monitoring                 │
│                                                     │
│   Security                                          │
│   ├── Authentication                              │
│   ├── Message validation                          │
│   ├── Rate limiting                               │
│   └── Sensitive data encryption                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Solution |
|----------|---------------------|
| Chat apps | Socket.IO |
| Game sync | Native WebSocket |
| Data push | SSE |
| Collaborative editing | Socket.IO + OT/CRDT |
| Notification system | Socket.IO |

WebSocket brings true real-time capabilities to web apps. Choose the right solution and build smooth real-time experiences.

---

*Real-time is user expectation, low latency is technical pursuit. Let data flow instantly, make interactions more natural.*
