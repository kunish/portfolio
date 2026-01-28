---
title: 'JavaScript Web Notifications API 完全指南'
description: '掌握浏览器通知：权限请求、通知创建、交互处理和 Service Worker 通知'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'js-web-notifications-guide'
---

Web Notifications API 允许网页向用户发送系统通知。本文详解通知 API 的用法和最佳实践。

## 基础概念

### 检查支持

```javascript
// 检查是否支持通知
function isNotificationSupported() {
  return 'Notification' in window;
}

// 检查当前权限状态
function getNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
  // 'default' - 未请求
  // 'granted' - 已授权
  // 'denied' - 已拒绝
}
```

### 请求权限

```javascript
// 请求通知权限
async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  // 已经授权
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // 已经拒绝（无法再次请求）
  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // 请求权限
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('请求权限失败:', error);
    return 'error';
  }
}

// 在用户交互中请求
document.querySelector('.enable-notifications').addEventListener('click', async () => {
  const permission = await requestNotificationPermission();

  switch (permission) {
    case 'granted':
      showToast('通知已启用');
      break;
    case 'denied':
      showToast('通知被拒绝，请在浏览器设置中启用');
      break;
    case 'default':
      showToast('请允许通知权限');
      break;
  }
});
```

## 创建通知

### 基本通知

```javascript
// 创建简单通知
function showNotification(title, body) {
  if (Notification.permission !== 'granted') {
    console.warn('未授权通知');
    return null;
  }

  const notification = new Notification(title, {
    body: body
  });

  return notification;
}

// 使用示例
showNotification('新消息', '您有一条新的消息');
```

### 通知选项

```javascript
// 完整通知选项
function showRichNotification() {
  const notification = new Notification('新订单提醒', {
    // 通知正文
    body: '您收到了一个新订单，点击查看详情',

    // 通知图标
    icon: '/icons/notification-icon.png',

    // 徽章（小图标）
    badge: '/icons/badge.png',

    // 大图片
    image: '/images/order-preview.jpg',

    // 通知标签（相同标签的通知会替换）
    tag: 'order-notification',

    // 是否需要用户交互才关闭
    requireInteraction: true,

    // 是否静默
    silent: false,

    // 振动模式 [振动, 暂停, 振动]
    vibrate: [200, 100, 200],

    // 自定义数据
    data: {
      orderId: '12345',
      url: '/orders/12345'
    },

    // 通知方向
    dir: 'ltr', // 'ltr', 'rtl', 'auto'

    // 语言
    lang: 'zh-CN',

    // 时间戳
    timestamp: Date.now()
  });

  return notification;
}
```

### 通知动作按钮

```javascript
// 带动作按钮的通知（需要 Service Worker）
async function showActionNotification() {
  const registration = await navigator.serviceWorker.ready;

  await registration.showNotification('新消息', {
    body: '来自张三的消息：你好！',
    icon: '/icons/message.png',
    actions: [
      {
        action: 'reply',
        title: '回复',
        icon: '/icons/reply.png'
      },
      {
        action: 'dismiss',
        title: '忽略',
        icon: '/icons/dismiss.png'
      }
    ],
    data: {
      messageId: '123',
      senderId: 'zhangsan'
    }
  });
}
```

## 通知事件

### 基本事件

```javascript
function showNotificationWithEvents(title, options) {
  const notification = new Notification(title, options);

  // 通知显示
  notification.addEventListener('show', () => {
    console.log('通知已显示');
  });

  // 点击通知
  notification.addEventListener('click', (event) => {
    console.log('通知被点击');

    // 聚焦窗口
    window.focus();

    // 导航到相关页面
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }

    // 关闭通知
    notification.close();
  });

  // 通知关闭
  notification.addEventListener('close', () => {
    console.log('通知已关闭');
  });

  // 通知错误
  notification.addEventListener('error', (error) => {
    console.error('通知错误:', error);
  });

  return notification;
}
```

### 自动关闭

```javascript
// 自动关闭的通知
function showAutoCloseNotification(title, options, duration = 5000) {
  const notification = new Notification(title, options);

  // 设置自动关闭
  setTimeout(() => {
    notification.close();
  }, duration);

  return notification;
}

// 使用
showAutoCloseNotification('下载完成', {
  body: '文件已下载到本地'
}, 3000);
```

## Service Worker 通知

### 注册 Service Worker

```javascript
// main.js
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker 注册成功');
      return registration;
    } catch (error) {
      console.error('Service Worker 注册失败:', error);
      return null;
    }
  }
  return null;
}
```

### Service Worker 中处理通知

```javascript
// sw.js
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  notification.close();

  // 处理动作按钮
  if (action === 'reply') {
    // 打开回复页面
    event.waitUntil(
      clients.openWindow(`/messages/${data.messageId}/reply`)
    );
  } else if (action === 'dismiss') {
    // 标记为已读
    event.waitUntil(
      fetch(`/api/messages/${data.messageId}/dismiss`, {
        method: 'POST'
      })
    );
  } else {
    // 点击通知主体
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // 查找已打开的窗口
        for (const client of clientList) {
          if (client.url.includes('/messages') && 'focus' in client) {
            return client.focus();
          }
        }
        // 打开新窗口
        return clients.openWindow(data.url || '/');
      })
    );
  }
});

// 通知关闭事件
self.addEventListener('notificationclose', (event) => {
  console.log('通知被关闭:', event.notification.tag);

  // 可以记录用户行为
  event.waitUntil(
    fetch('/api/analytics/notification-closed', {
      method: 'POST',
      body: JSON.stringify({
        tag: event.notification.tag
      })
    })
  );
});
```

### 从 Service Worker 发送通知

```javascript
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || '您有新的通知',
    icon: data.icon || '/icons/default.png',
    badge: '/icons/badge.png',
    tag: data.tag || 'default',
    data: data,
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '通知', options)
  );
});
```

## 实际应用场景

### 消息通知系统

```javascript
class NotificationManager {
  constructor() {
    this.permission = Notification.permission;
    this.unreadCount = 0;
  }

  async init() {
    // 请求权限
    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    // 监听消息
    this.startListening();
  }

  startListening() {
    // 假设使用 WebSocket
    const ws = new WebSocket('wss://api.example.com/ws');

    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'new_message') {
        this.showMessageNotification(message);
      }
    });
  }

  showMessageNotification(message) {
    // 页面隐藏时才显示通知
    if (document.hidden && this.permission === 'granted') {
      const notification = new Notification(message.sender, {
        body: message.content,
        icon: message.avatar,
        tag: `message-${message.id}`,
        data: {
          messageId: message.id,
          url: `/messages/${message.id}`
        }
      });

      notification.addEventListener('click', () => {
        window.focus();
        window.location.href = `/messages/${message.id}`;
        notification.close();
      });

      // 更新标题
      this.unreadCount++;
      this.updateTitle();
    }
  }

  updateTitle() {
    const originalTitle = document.title.replace(/^\(\d+\)\s*/, '');
    if (this.unreadCount > 0) {
      document.title = `(${this.unreadCount}) ${originalTitle}`;
    } else {
      document.title = originalTitle;
    }
  }

  clearUnread() {
    this.unreadCount = 0;
    this.updateTitle();
  }
}

// 使用
const notificationManager = new NotificationManager();
notificationManager.init();

// 页面可见时清除未读
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    notificationManager.clearUnread();
  }
});
```

### 定时提醒

```javascript
class ReminderService {
  constructor() {
    this.reminders = new Map();
  }

  async requestPermission() {
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  }

  setReminder(id, title, body, time) {
    const delay = time - Date.now();

    if (delay <= 0) {
      console.warn('提醒时间已过');
      return false;
    }

    // 存储定时器
    const timerId = setTimeout(() => {
      this.showReminder(id, title, body);
    }, delay);

    this.reminders.set(id, {
      timerId,
      title,
      body,
      time
    });

    // 持久化存储
    this.saveReminders();

    return true;
  }

  showReminder(id, title, body) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icons/reminder.png',
        tag: `reminder-${id}`,
        requireInteraction: true
      });

      notification.addEventListener('click', () => {
        window.focus();
        notification.close();
      });
    }

    // 移除提醒
    this.reminders.delete(id);
    this.saveReminders();
  }

  cancelReminder(id) {
    const reminder = this.reminders.get(id);
    if (reminder) {
      clearTimeout(reminder.timerId);
      this.reminders.delete(id);
      this.saveReminders();
      return true;
    }
    return false;
  }

  saveReminders() {
    const data = Array.from(this.reminders.entries()).map(([id, r]) => ({
      id,
      title: r.title,
      body: r.body,
      time: r.time
    }));
    localStorage.setItem('reminders', JSON.stringify(data));
  }

  loadReminders() {
    const data = JSON.parse(localStorage.getItem('reminders') || '[]');
    data.forEach(r => {
      if (r.time > Date.now()) {
        this.setReminder(r.id, r.title, r.body, r.time);
      }
    });
  }
}
```

### 通知分组

```javascript
// 通知分组管理
class NotificationGroup {
  constructor(groupId, maxNotifications = 5) {
    this.groupId = groupId;
    this.maxNotifications = maxNotifications;
    this.notifications = [];
  }

  add(title, body, data) {
    // 关闭旧通知
    if (this.notifications.length >= this.maxNotifications) {
      const oldest = this.notifications.shift();
      oldest.close();
    }

    // 创建新通知
    const notification = new Notification(title, {
      body,
      tag: `${this.groupId}-${Date.now()}`,
      data
    });

    this.notifications.push(notification);

    // 监听关闭事件
    notification.addEventListener('close', () => {
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    });

    return notification;
  }

  closeAll() {
    this.notifications.forEach(n => n.close());
    this.notifications = [];
  }

  // 显示汇总通知
  showSummary(count, message) {
    this.closeAll();

    new Notification(`${count} 条新消息`, {
      body: message,
      tag: `${this.groupId}-summary`,
      requireInteraction: true
    });
  }
}

// 使用
const messageGroup = new NotificationGroup('messages', 3);

// 收到消息时
function onNewMessage(message) {
  if (messageGroup.notifications.length >= 3) {
    messageGroup.showSummary(4, '您有多条未读消息');
  } else {
    messageGroup.add(message.sender, message.content, {
      messageId: message.id
    });
  }
}
```

## 最佳实践总结

```
Web Notifications 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   权限处理                                          │
│   ├── 在合适时机请求权限                           │
│   ├── 解释为什么需要通知                           │
│   └── 优雅处理拒绝情况                             │
│                                                     │
│   通知设计                                          │
│   ├── 保持简洁明了                                 │
│   ├── 使用有意义的图标                             │
│   ├── 提供相关的动作按钮                           │
│   └── 避免过度通知                                 │
│                                                     │
│   用户体验                                          │
│   ├── 只在重要事件时发送通知                       │
│   ├── 提供通知设置选项                             │
│   ├── 合理使用 tag 避免重复                        │
│   └── 页面可见时避免发送                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 属性 | 用途 | 示例 |
|------|------|------|
| body | 通知正文 | 消息内容预览 |
| icon | 通知图标 | 发送者头像 |
| tag | 通知标识 | 相同 tag 替换 |
| requireInteraction | 持久显示 | 重要通知 |
| actions | 动作按钮 | 回复、忽略 |

---

*掌握 Web Notifications API，打造及时有效的用户提醒体验。*
