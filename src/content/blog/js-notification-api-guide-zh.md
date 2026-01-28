---
title: 'JavaScript Notification API 完全指南'
description: '掌握浏览器通知：权限请求、消息推送、自定义选项与 Service Worker 集成'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'js-notification-api-guide'
---

Notification API 允许网页向用户发送系统通知。本文详解其使用方法和最佳实践。

## 基础用法

### 请求权限

```javascript
// 检查通知支持
if (!('Notification' in window)) {
  console.log('浏览器不支持通知');
}

// 检查当前权限状态
console.log(Notification.permission);
// 'default' - 未决定
// 'granted' - 已授权
// 'denied' - 已拒绝

// 请求权限
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('通知权限已授权');
      return true;
    } else if (permission === 'denied') {
      console.log('通知权限被拒绝');
      return false;
    } else {
      console.log('用户未做决定');
      return false;
    }
  } catch (error) {
    console.error('请求权限失败:', error);
    return false;
  }
}

// 回调方式（旧版兼容）
Notification.requestPermission(function(permission) {
  console.log('权限状态:', permission);
});
```

### 创建基本通知

```javascript
// 简单通知
function showNotification(title, options = {}) {
  if (Notification.permission !== 'granted') {
    console.warn('未授权通知权限');
    return null;
  }
  
  return new Notification(title, options);
}

// 使用示例
const notification = showNotification('新消息', {
  body: '您有一条新消息',
  icon: '/icons/message.png'
});
```

### 通知选项

```javascript
const notification = new Notification('通知标题', {
  // 正文内容
  body: '这是通知的详细内容',
  
  // 图标
  icon: '/icons/notification.png',
  
  // 徽章（小图标）
  badge: '/icons/badge.png',
  
  // 图片（大图）
  image: '/images/preview.jpg',
  
  // 标签（相同标签的通知会替换）
  tag: 'message-group-1',
  
  // 是否替换相同标签的通知
  renotify: true,
  
  // 是否需要用户交互才关闭
  requireInteraction: true,
  
  // 是否静音
  silent: false,
  
  // 振动模式 [振动, 暂停, 振动, ...]
  vibrate: [200, 100, 200],
  
  // 时间戳
  timestamp: Date.now(),
  
  // 自定义数据
  data: {
    url: 'https://example.com/message/123',
    messageId: 123
  },
  
  // 文字方向
  dir: 'auto', // 'ltr', 'rtl', 'auto'
  
  // 语言
  lang: 'zh-CN',
  
  // 操作按钮（需 Service Worker）
  actions: [
    { action: 'reply', title: '回复', icon: '/icons/reply.png' },
    { action: 'archive', title: '归档', icon: '/icons/archive.png' }
  ]
});
```

### 通知事件

```javascript
const notification = new Notification('新消息', {
  body: '点击查看详情'
});

// 通知显示时
notification.onshow = (event) => {
  console.log('通知已显示');
};

// 通知点击时
notification.onclick = (event) => {
  event.preventDefault();
  window.focus();
  window.location.href = '/messages';
  notification.close();
};

// 通知关闭时
notification.onclose = (event) => {
  console.log('通知已关闭');
};

// 通知出错时
notification.onerror = (event) => {
  console.error('通知出错:', event);
};

// 手动关闭通知
setTimeout(() => {
  notification.close();
}, 5000);
```

## 通知管理器

### 封装通知类

```javascript
class NotificationManager {
  constructor() {
    this.supported = 'Notification' in window;
    this.notifications = new Map();
  }
  
  async requestPermission() {
    if (!this.supported) {
      throw new Error('浏览器不支持通知');
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  get permission() {
    return this.supported ? Notification.permission : 'denied';
  }
  
  show(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('通知权限未授权');
      return null;
    }
    
    const id = options.tag || crypto.randomUUID();
    
    const notification = new Notification(title, {
      ...options,
      tag: id
    });
    
    this.notifications.set(id, notification);
    
    notification.onclose = () => {
      this.notifications.delete(id);
      options.onClose?.();
    };
    
    notification.onclick = (event) => {
      options.onClick?.(event);
    };
    
    // 自动关闭
    if (options.autoClose !== false) {
      const timeout = options.autoClose || 5000;
      setTimeout(() => {
        notification.close();
      }, timeout);
    }
    
    return id;
  }
  
  close(id) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.close();
      this.notifications.delete(id);
    }
  }
  
  closeAll() {
    this.notifications.forEach(notification => {
      notification.close();
    });
    this.notifications.clear();
  }
}

// 使用
const notificationManager = new NotificationManager();

async function init() {
  const granted = await notificationManager.requestPermission();
  
  if (granted) {
    notificationManager.show('欢迎', {
      body: '感谢启用通知',
      onClick: () => {
        console.log('通知被点击');
      }
    });
  }
}
```

### 通知队列

```javascript
class NotificationQueue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 3;
    this.queue = [];
    this.active = new Set();
    this.manager = new NotificationManager();
  }
  
  async enqueue(title, options = {}) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        title,
        options,
        resolve,
        reject
      });
      
      this.process();
    });
  }
  
  process() {
    while (this.active.size < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift();
      this.showNext(item);
    }
  }
  
  showNext(item) {
    const { title, options, resolve, reject } = item;
    
    try {
      const id = this.manager.show(title, {
        ...options,
        onClose: () => {
          this.active.delete(id);
          options.onClose?.();
          this.process();
        }
      });
      
      if (id) {
        this.active.add(id);
        resolve(id);
      } else {
        reject(new Error('创建通知失败'));
      }
    } catch (error) {
      reject(error);
    }
  }
  
  clear() {
    this.queue = [];
    this.manager.closeAll();
    this.active.clear();
  }
}

// 使用
const queue = new NotificationQueue({ maxConcurrent: 2 });

// 批量发送通知
async function sendBatchNotifications(messages) {
  for (const msg of messages) {
    await queue.enqueue(msg.title, {
      body: msg.body,
      autoClose: 3000
    });
  }
}
```

## Service Worker 集成

### 注册 Service Worker

```javascript
// main.js
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker 注册成功:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker 注册失败:', error);
      throw error;
    }
  }
  throw new Error('不支持 Service Worker');
}
```

### Service Worker 中的通知

```javascript
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || '新消息',
    icon: data.icon || '/icons/default.png',
    badge: '/icons/badge.png',
    tag: data.tag || 'default',
    data: data.payload || {},
    actions: [
      { action: 'open', title: '打开' },
      { action: 'dismiss', title: '忽略' }
    ],
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '通知', options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;
  
  notification.close();
  
  if (action === 'open' || !action) {
    // 打开或聚焦窗口
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // 查找已打开的窗口
          for (const client of clientList) {
            if (client.url === data.url && 'focus' in client) {
              return client.focus();
            }
          }
          // 打开新窗口
          if (clients.openWindow) {
            return clients.openWindow(data.url || '/');
          }
        })
    );
  } else if (action === 'dismiss') {
    // 忽略
    console.log('通知被忽略');
  }
});

// 处理通知关闭
self.addEventListener('notificationclose', (event) => {
  const notification = event.notification;
  console.log('通知被关闭:', notification.tag);
});
```

### 推送订阅

```javascript
// main.js
async function subscribeToPush(registration) {
  try {
    // 检查是否已订阅
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('已存在订阅');
      return subscription;
    }
    
    // 获取服务器公钥
    const response = await fetch('/api/push/vapid-public-key');
    const vapidPublicKey = await response.text();
    
    // 转换公钥格式
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    
    // 创建订阅
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
    
    // 发送订阅信息到服务器
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    
    console.log('推送订阅成功');
    return subscription;
  } catch (error) {
    console.error('推送订阅失败:', error);
    throw error;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
```

## 实际应用

### 消息通知系统

```javascript
class MessageNotificationSystem {
  constructor() {
    this.manager = new NotificationManager();
    this.unreadCount = 0;
    this.enabled = this.loadPreference();
  }
  
  loadPreference() {
    return localStorage.getItem('notifications') !== 'disabled';
  }
  
  savePreference(enabled) {
    localStorage.setItem('notifications', enabled ? 'enabled' : 'disabled');
    this.enabled = enabled;
  }
  
  async enable() {
    const granted = await this.manager.requestPermission();
    if (granted) {
      this.savePreference(true);
    }
    return granted;
  }
  
  disable() {
    this.savePreference(false);
    this.manager.closeAll();
  }
  
  notify(message) {
    if (!this.enabled || this.manager.permission !== 'granted') {
      return;
    }
    
    // 页面可见时不显示通知
    if (document.visibilityState === 'visible') {
      return;
    }
    
    this.unreadCount++;
    
    this.manager.show(message.sender, {
      body: message.text,
      icon: message.avatar,
      tag: `message-${message.id}`,
      data: { messageId: message.id },
      onClick: () => {
        window.focus();
        this.openMessage(message.id);
      }
    });
    
    this.updateBadge();
  }
  
  openMessage(messageId) {
    // 导航到消息
    window.location.href = `/messages/${messageId}`;
  }
  
  updateBadge() {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(this.unreadCount);
    }
  }
  
  clearBadge() {
    this.unreadCount = 0;
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge();
    }
  }
}

// 使用
const messageSystem = new MessageNotificationSystem();

// 接收新消息时
socket.on('newMessage', (message) => {
  messageSystem.notify(message);
});
```

### 定时提醒

```javascript
class ReminderSystem {
  constructor() {
    this.reminders = this.loadReminders();
    this.timers = new Map();
    this.manager = new NotificationManager();
    
    this.scheduleAll();
  }
  
  loadReminders() {
    try {
      return JSON.parse(localStorage.getItem('reminders')) || [];
    } catch {
      return [];
    }
  }
  
  saveReminders() {
    localStorage.setItem('reminders', JSON.stringify(this.reminders));
  }
  
  add(reminder) {
    const id = crypto.randomUUID();
    const newReminder = {
      id,
      title: reminder.title,
      body: reminder.body,
      time: reminder.time,
      repeat: reminder.repeat || null
    };
    
    this.reminders.push(newReminder);
    this.saveReminders();
    this.schedule(newReminder);
    
    return id;
  }
  
  remove(id) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    
    this.reminders = this.reminders.filter(r => r.id !== id);
    this.saveReminders();
  }
  
  schedule(reminder) {
    const now = Date.now();
    const time = new Date(reminder.time).getTime();
    const delay = time - now;
    
    if (delay <= 0) {
      // 已过期
      if (!reminder.repeat) {
        this.remove(reminder.id);
      }
      return;
    }
    
    const timer = setTimeout(() => {
      this.trigger(reminder);
    }, delay);
    
    this.timers.set(reminder.id, timer);
  }
  
  scheduleAll() {
    this.reminders.forEach(reminder => {
      this.schedule(reminder);
    });
  }
  
  trigger(reminder) {
    this.manager.show(reminder.title, {
      body: reminder.body,
      tag: `reminder-${reminder.id}`,
      requireInteraction: true,
      actions: [
        { action: 'snooze', title: '稍后提醒' },
        { action: 'dismiss', title: '关闭' }
      ]
    });
    
    // 处理重复提醒
    if (reminder.repeat) {
      const nextTime = this.calculateNextTime(reminder);
      reminder.time = nextTime;
      this.saveReminders();
      this.schedule(reminder);
    } else {
      this.remove(reminder.id);
    }
  }
  
  calculateNextTime(reminder) {
    const current = new Date(reminder.time);
    
    switch (reminder.repeat) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
    }
    
    return current.toISOString();
  }
}

// 使用
const reminders = new ReminderSystem();

// 添加提醒
reminders.add({
  title: '会议提醒',
  body: '15分钟后有团队会议',
  time: new Date(Date.now() + 15 * 60 * 1000).toISOString()
});

// 添加每日提醒
reminders.add({
  title: '每日站会',
  body: '准备参加每日站会',
  time: '2025-01-29T09:00:00',
  repeat: 'daily'
});
```

### 下载进度通知

```javascript
class DownloadNotifier {
  constructor() {
    this.manager = new NotificationManager();
    this.downloads = new Map();
  }
  
  start(downloadId, filename) {
    const notificationId = this.manager.show('开始下载', {
      body: filename,
      tag: `download-${downloadId}`,
      requireInteraction: true,
      autoClose: false
    });
    
    this.downloads.set(downloadId, {
      filename,
      notificationId,
      progress: 0
    });
  }
  
  updateProgress(downloadId, progress) {
    const download = this.downloads.get(downloadId);
    if (!download) return;
    
    download.progress = progress;
    
    // 更新通知
    this.manager.show('下载中...', {
      body: `${download.filename} - ${progress}%`,
      tag: `download-${downloadId}`,
      requireInteraction: true,
      autoClose: false
    });
  }
  
  complete(downloadId) {
    const download = this.downloads.get(downloadId);
    if (!download) return;
    
    this.manager.show('下载完成', {
      body: download.filename,
      tag: `download-${downloadId}`,
      autoClose: 5000,
      onClick: () => {
        // 打开下载文件夹
        console.log('打开下载文件');
      }
    });
    
    this.downloads.delete(downloadId);
  }
  
  error(downloadId, errorMessage) {
    const download = this.downloads.get(downloadId);
    if (!download) return;
    
    this.manager.show('下载失败', {
      body: `${download.filename}: ${errorMessage}`,
      tag: `download-${downloadId}`,
      autoClose: 10000
    });
    
    this.downloads.delete(downloadId);
  }
}

// 使用
const downloadNotifier = new DownloadNotifier();

async function downloadFile(url, filename) {
  const downloadId = crypto.randomUUID();
  downloadNotifier.start(downloadId, filename);
  
  try {
    const response = await fetch(url);
    const reader = response.body.getReader();
    const contentLength = +response.headers.get('Content-Length');
    
    let receivedLength = 0;
    const chunks = [];
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      receivedLength += value.length;
      
      const progress = Math.round((receivedLength / contentLength) * 100);
      downloadNotifier.updateProgress(downloadId, progress);
    }
    
    downloadNotifier.complete(downloadId);
    
    // 处理下载的数据...
    return new Blob(chunks);
  } catch (error) {
    downloadNotifier.error(downloadId, error.message);
    throw error;
  }
}
```

## 最佳实践总结

```
Notification API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   权限管理                                          │
│   ├── 解释请求权限的原因                           │
│   ├── 在用户操作后请求权限                         │
│   ├── 优雅处理权限被拒绝                           │
│   └── 提供关闭通知的选项                           │
│                                                     │
│   用户体验                                          │
│   ├── 只发送有价值的通知                           │
│   ├── 使用 tag 合并相关通知                        │
│   ├── 页面可见时避免发送通知                       │
│   └── 提供通知偏好设置                             │
│                                                     │
│   技术实现                                          │
│   ├── 使用 Service Worker 实现离线推送             │
│   ├── 正确处理通知点击事件                         │
│   ├── 设置合理的自动关闭时间                       │
│   └── 使用 actions 提供快捷操作                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 权限状态 | 说明 | 处理方式 |
|----------|------|----------|
| default | 未决定 | 可请求权限 |
| granted | 已授权 | 可发送通知 |
| denied | 已拒绝 | 引导用户手动开启 |

---

*善用 Notification API，在恰当的时机为用户推送有价值的信息。*
