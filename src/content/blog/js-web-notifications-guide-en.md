---
title: 'JavaScript Web Notifications API Complete Guide'
description: 'Master browser notifications: permission requests, notification creation, interaction handling, and Service Worker notifications'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'js-web-notifications-guide'
---

The Web Notifications API allows web pages to send system notifications to users. This article covers notification API usage and best practices.

## Basic Concepts

### Checking Support

```javascript
// Check if notifications are supported
function isNotificationSupported() {
  return 'Notification' in window;
}

// Check current permission status
function getNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
  // 'default' - not requested
  // 'granted' - authorized
  // 'denied' - rejected
}
```

### Requesting Permission

```javascript
// Request notification permission
async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  // Already granted
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // Already denied (cannot request again)
  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Permission request failed:', error);
    return 'error';
  }
}

// Request on user interaction
document.querySelector('.enable-notifications').addEventListener('click', async () => {
  const permission = await requestNotificationPermission();

  switch (permission) {
    case 'granted':
      showToast('Notifications enabled');
      break;
    case 'denied':
      showToast('Notifications denied, please enable in browser settings');
      break;
    case 'default':
      showToast('Please allow notification permission');
      break;
  }
});
```

## Creating Notifications

### Basic Notification

```javascript
// Create simple notification
function showNotification(title, body) {
  if (Notification.permission !== 'granted') {
    console.warn('Notifications not authorized');
    return null;
  }

  const notification = new Notification(title, {
    body: body
  });

  return notification;
}

// Usage
showNotification('New Message', 'You have a new message');
```

### Notification Options

```javascript
// Full notification options
function showRichNotification() {
  const notification = new Notification('New Order Alert', {
    // Notification body
    body: 'You received a new order, click to view details',

    // Notification icon
    icon: '/icons/notification-icon.png',

    // Badge (small icon)
    badge: '/icons/badge.png',

    // Large image
    image: '/images/order-preview.jpg',

    // Notification tag (same tag notifications replace each other)
    tag: 'order-notification',

    // Require user interaction to close
    requireInteraction: true,

    // Silent mode
    silent: false,

    // Vibration pattern [vibrate, pause, vibrate]
    vibrate: [200, 100, 200],

    // Custom data
    data: {
      orderId: '12345',
      url: '/orders/12345'
    },

    // Text direction
    dir: 'ltr', // 'ltr', 'rtl', 'auto'

    // Language
    lang: 'en-US',

    // Timestamp
    timestamp: Date.now()
  });

  return notification;
}
```

### Notification Action Buttons

```javascript
// Notification with action buttons (requires Service Worker)
async function showActionNotification() {
  const registration = await navigator.serviceWorker.ready;

  await registration.showNotification('New Message', {
    body: 'Message from John: Hello!',
    icon: '/icons/message.png',
    actions: [
      {
        action: 'reply',
        title: 'Reply',
        icon: '/icons/reply.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ],
    data: {
      messageId: '123',
      senderId: 'john'
    }
  });
}
```

## Notification Events

### Basic Events

```javascript
function showNotificationWithEvents(title, options) {
  const notification = new Notification(title, options);

  // Notification shown
  notification.addEventListener('show', () => {
    console.log('Notification displayed');
  });

  // Click notification
  notification.addEventListener('click', (event) => {
    console.log('Notification clicked');

    // Focus window
    window.focus();

    // Navigate to related page
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }

    // Close notification
    notification.close();
  });

  // Notification closed
  notification.addEventListener('close', () => {
    console.log('Notification closed');
  });

  // Notification error
  notification.addEventListener('error', (error) => {
    console.error('Notification error:', error);
  });

  return notification;
}
```

### Auto-Close

```javascript
// Auto-closing notification
function showAutoCloseNotification(title, options, duration = 5000) {
  const notification = new Notification(title, options);

  // Set auto-close
  setTimeout(() => {
    notification.close();
  }, duration);

  return notification;
}

// Usage
showAutoCloseNotification('Download Complete', {
  body: 'File downloaded to local storage'
}, 3000);
```

## Service Worker Notifications

### Registering Service Worker

```javascript
// main.js
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}
```

### Handling Notifications in Service Worker

```javascript
// sw.js
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  notification.close();

  // Handle action buttons
  if (action === 'reply') {
    // Open reply page
    event.waitUntil(
      clients.openWindow(`/messages/${data.messageId}/reply`)
    );
  } else if (action === 'dismiss') {
    // Mark as read
    event.waitUntil(
      fetch(`/api/messages/${data.messageId}/dismiss`, {
        method: 'POST'
      })
    );
  } else {
    // Click on notification body
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Find open window
        for (const client of clientList) {
          if (client.url.includes('/messages') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        return clients.openWindow(data.url || '/');
      })
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);

  // Can record user behavior
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

### Sending Notifications from Service Worker

```javascript
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/default.png',
    badge: '/icons/badge.png',
    tag: data.tag || 'default',
    data: data,
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});
```

## Practical Applications

### Message Notification System

```javascript
class NotificationManager {
  constructor() {
    this.permission = Notification.permission;
    this.unreadCount = 0;
  }

  async init() {
    // Request permission
    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    // Listen for messages
    this.startListening();
  }

  startListening() {
    // Assume using WebSocket
    const ws = new WebSocket('wss://api.example.com/ws');

    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'new_message') {
        this.showMessageNotification(message);
      }
    });
  }

  showMessageNotification(message) {
    // Only show notification when page is hidden
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

      // Update title
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

// Usage
const notificationManager = new NotificationManager();
notificationManager.init();

// Clear unread when page visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    notificationManager.clearUnread();
  }
});
```

### Scheduled Reminders

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
      console.warn('Reminder time has passed');
      return false;
    }

    // Store timer
    const timerId = setTimeout(() => {
      this.showReminder(id, title, body);
    }, delay);

    this.reminders.set(id, {
      timerId,
      title,
      body,
      time
    });

    // Persist storage
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

    // Remove reminder
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

### Notification Grouping

```javascript
// Notification group management
class NotificationGroup {
  constructor(groupId, maxNotifications = 5) {
    this.groupId = groupId;
    this.maxNotifications = maxNotifications;
    this.notifications = [];
  }

  add(title, body, data) {
    // Close old notifications
    if (this.notifications.length >= this.maxNotifications) {
      const oldest = this.notifications.shift();
      oldest.close();
    }

    // Create new notification
    const notification = new Notification(title, {
      body,
      tag: `${this.groupId}-${Date.now()}`,
      data
    });

    this.notifications.push(notification);

    // Listen for close event
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

  // Show summary notification
  showSummary(count, message) {
    this.closeAll();

    new Notification(`${count} new messages`, {
      body: message,
      tag: `${this.groupId}-summary`,
      requireInteraction: true
    });
  }
}

// Usage
const messageGroup = new NotificationGroup('messages', 3);

// On new message
function onNewMessage(message) {
  if (messageGroup.notifications.length >= 3) {
    messageGroup.showSummary(4, 'You have multiple unread messages');
  } else {
    messageGroup.add(message.sender, message.content, {
      messageId: message.id
    });
  }
}
```

## Best Practices Summary

```
Web Notifications Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Permission Handling                               │
│   ├── Request at appropriate time                  │
│   ├── Explain why notifications are needed         │
│   └── Handle denial gracefully                     │
│                                                     │
│   Notification Design                               │
│   ├── Keep it concise and clear                    │
│   ├── Use meaningful icons                         │
│   ├── Provide relevant action buttons              │
│   └── Avoid excessive notifications                │
│                                                     │
│   User Experience                                   │
│   ├── Only send for important events               │
│   ├── Provide notification settings                │
│   ├── Use tags wisely to avoid duplicates          │
│   └── Avoid sending when page is visible           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Property | Purpose | Example |
|----------|---------|---------|
| body | Notification body | Message content preview |
| icon | Notification icon | Sender avatar |
| tag | Notification ID | Same tag replaces |
| requireInteraction | Persistent display | Important notifications |
| actions | Action buttons | Reply, Dismiss |

---

*Master the Web Notifications API to create timely and effective user alerts.*
