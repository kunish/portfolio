---
title: 'JavaScript Notification API Complete Guide'
description: 'Master browser notifications: permission requests, message pushing, custom options, and Service Worker integration'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'js-notification-api-guide'
---

The Notification API allows web pages to send system notifications to users. This article covers its usage and best practices.

## Basic Usage

### Requesting Permission

```javascript
// Check notification support
if (!('Notification' in window)) {
  console.log('Browser does not support notifications');
}

// Check current permission status
console.log(Notification.permission);
// 'default' - Not decided
// 'granted' - Authorized
// 'denied' - Rejected

// Request permission
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else if (permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    } else {
      console.log('User did not decide');
      return false;
    }
  } catch (error) {
    console.error('Failed to request permission:', error);
    return false;
  }
}

// Callback method (legacy compatibility)
Notification.requestPermission(function(permission) {
  console.log('Permission status:', permission);
});
```

### Creating Basic Notifications

```javascript
// Simple notification
function showNotification(title, options = {}) {
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }
  
  return new Notification(title, options);
}

// Usage example
const notification = showNotification('New Message', {
  body: 'You have a new message',
  icon: '/icons/message.png'
});
```

### Notification Options

```javascript
const notification = new Notification('Notification Title', {
  // Body content
  body: 'This is the detailed content of the notification',
  
  // Icon
  icon: '/icons/notification.png',
  
  // Badge (small icon)
  badge: '/icons/badge.png',
  
  // Image (large)
  image: '/images/preview.jpg',
  
  // Tag (notifications with same tag will replace)
  tag: 'message-group-1',
  
  // Whether to replace notifications with same tag
  renotify: true,
  
  // Requires user interaction to close
  requireInteraction: true,
  
  // Silent mode
  silent: false,
  
  // Vibration pattern [vibrate, pause, vibrate, ...]
  vibrate: [200, 100, 200],
  
  // Timestamp
  timestamp: Date.now(),
  
  // Custom data
  data: {
    url: 'https://example.com/message/123',
    messageId: 123
  },
  
  // Text direction
  dir: 'auto', // 'ltr', 'rtl', 'auto'
  
  // Language
  lang: 'en-US',
  
  // Action buttons (requires Service Worker)
  actions: [
    { action: 'reply', title: 'Reply', icon: '/icons/reply.png' },
    { action: 'archive', title: 'Archive', icon: '/icons/archive.png' }
  ]
});
```

### Notification Events

```javascript
const notification = new Notification('New Message', {
  body: 'Click for details'
});

// When notification is shown
notification.onshow = (event) => {
  console.log('Notification shown');
};

// When notification is clicked
notification.onclick = (event) => {
  event.preventDefault();
  window.focus();
  window.location.href = '/messages';
  notification.close();
};

// When notification is closed
notification.onclose = (event) => {
  console.log('Notification closed');
};

// When notification errors
notification.onerror = (event) => {
  console.error('Notification error:', event);
};

// Manually close notification
setTimeout(() => {
  notification.close();
}, 5000);
```

## Notification Manager

### Wrapper Class

```javascript
class NotificationManager {
  constructor() {
    this.supported = 'Notification' in window;
    this.notifications = new Map();
  }
  
  async requestPermission() {
    if (!this.supported) {
      throw new Error('Browser does not support notifications');
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
      console.warn('Notification permission not granted');
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
    
    // Auto close
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

// Usage
const notificationManager = new NotificationManager();

async function init() {
  const granted = await notificationManager.requestPermission();
  
  if (granted) {
    notificationManager.show('Welcome', {
      body: 'Thanks for enabling notifications',
      onClick: () => {
        console.log('Notification clicked');
      }
    });
  }
}
```

### Notification Queue

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
        reject(new Error('Failed to create notification'));
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

// Usage
const queue = new NotificationQueue({ maxConcurrent: 2 });

// Send batch notifications
async function sendBatchNotifications(messages) {
  for (const msg of messages) {
    await queue.enqueue(msg.title, {
      body: msg.body,
      autoClose: 3000
    });
  }
}
```

## Service Worker Integration

### Register Service Worker

```javascript
// main.js
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }
  throw new Error('Service Worker not supported');
}
```

### Notifications in Service Worker

```javascript
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'New message',
    icon: data.icon || '/icons/default.png',
    badge: '/icons/badge.png',
    tag: data.tag || 'default',
    data: data.payload || {},
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;
  
  notification.close();
  
  if (action === 'open' || !action) {
    // Open or focus window
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Find already open window
          for (const client of clientList) {
            if (client.url === data.url && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(data.url || '/');
          }
        })
    );
  } else if (action === 'dismiss') {
    // Dismiss
    console.log('Notification dismissed');
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  const notification = event.notification;
  console.log('Notification closed:', notification.tag);
});
```

### Push Subscription

```javascript
// main.js
async function subscribeToPush(registration) {
  try {
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Subscription already exists');
      return subscription;
    }
    
    // Get server public key
    const response = await fetch('/api/push/vapid-public-key');
    const vapidPublicKey = await response.text();
    
    // Convert public key format
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    
    // Create subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
    
    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    
    console.log('Push subscription successful');
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
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

## Practical Applications

### Message Notification System

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
    
    // Don't show notification when page is visible
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
    // Navigate to message
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

// Usage
const messageSystem = new MessageNotificationSystem();

// When receiving new message
socket.on('newMessage', (message) => {
  messageSystem.notify(message);
});
```

### Reminder System

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
      // Already expired
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
        { action: 'snooze', title: 'Snooze' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
    
    // Handle recurring reminders
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

// Usage
const reminders = new ReminderSystem();

// Add reminder
reminders.add({
  title: 'Meeting Reminder',
  body: 'Team meeting in 15 minutes',
  time: new Date(Date.now() + 15 * 60 * 1000).toISOString()
});

// Add daily reminder
reminders.add({
  title: 'Daily Standup',
  body: 'Get ready for daily standup',
  time: '2025-01-29T09:00:00',
  repeat: 'daily'
});
```

### Download Progress Notification

```javascript
class DownloadNotifier {
  constructor() {
    this.manager = new NotificationManager();
    this.downloads = new Map();
  }
  
  start(downloadId, filename) {
    const notificationId = this.manager.show('Download Started', {
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
    
    // Update notification
    this.manager.show('Downloading...', {
      body: `${download.filename} - ${progress}%`,
      tag: `download-${downloadId}`,
      requireInteraction: true,
      autoClose: false
    });
  }
  
  complete(downloadId) {
    const download = this.downloads.get(downloadId);
    if (!download) return;
    
    this.manager.show('Download Complete', {
      body: download.filename,
      tag: `download-${downloadId}`,
      autoClose: 5000,
      onClick: () => {
        // Open downloads folder
        console.log('Open downloaded file');
      }
    });
    
    this.downloads.delete(downloadId);
  }
  
  error(downloadId, errorMessage) {
    const download = this.downloads.get(downloadId);
    if (!download) return;
    
    this.manager.show('Download Failed', {
      body: `${download.filename}: ${errorMessage}`,
      tag: `download-${downloadId}`,
      autoClose: 10000
    });
    
    this.downloads.delete(downloadId);
  }
}

// Usage
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
    
    // Process downloaded data...
    return new Blob(chunks);
  } catch (error) {
    downloadNotifier.error(downloadId, error.message);
    throw error;
  }
}
```

## Best Practices Summary

```
Notification API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Permission Management                             │
│   ├── Explain why requesting permission            │
│   ├── Request after user action                    │
│   ├── Handle permission denial gracefully          │
│   └── Provide option to disable notifications      │
│                                                     │
│   User Experience                                   │
│   ├── Only send valuable notifications             │
│   ├── Use tag to consolidate related ones          │
│   ├── Avoid notifications when page visible        │
│   └── Provide notification preferences             │
│                                                     │
│   Technical Implementation                          │
│   ├── Use Service Worker for offline push          │
│   ├── Handle notification click properly           │
│   ├── Set reasonable auto-close time               │
│   └── Use actions for quick responses              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Permission Status | Description | Handling |
|-------------------|-------------|----------|
| default | Not decided | Can request permission |
| granted | Authorized | Can send notifications |
| denied | Rejected | Guide user to enable manually |

---

*Use the Notification API wisely to deliver valuable information at the right time.*
