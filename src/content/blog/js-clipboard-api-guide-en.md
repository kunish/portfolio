---
title: 'JavaScript Clipboard API Complete Guide'
description: 'Master clipboard operations: reading and writing text, copying images, handling rich text, and permission management'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'js-clipboard-api-guide'
---

The Clipboard API provides modern access to the clipboard. This article covers its usage and practical applications.

## Basic Concepts

### API Overview

```javascript
// Check Clipboard API support
if ('clipboard' in navigator) {
  console.log('Clipboard API available');
}

// Main methods
// navigator.clipboard.writeText() - Write text
// navigator.clipboard.readText() - Read text
// navigator.clipboard.write() - Write arbitrary data
// navigator.clipboard.read() - Read arbitrary data
```

### Permission Requirements

```javascript
// Query permission status
async function checkClipboardPermission() {
  try {
    // Read permission
    const readPermission = await navigator.permissions.query({
      name: 'clipboard-read'
    });
    console.log('Read permission:', readPermission.state);
    
    // Write permission (usually auto-granted)
    const writePermission = await navigator.permissions.query({
      name: 'clipboard-write'
    });
    console.log('Write permission:', writePermission.state);
    
    // Listen for permission changes
    readPermission.addEventListener('change', () => {
      console.log('Read permission changed:', readPermission.state);
    });
  } catch (e) {
    console.error('Permission query failed:', e);
  }
}
```

## Text Operations

### Copy Text

```javascript
// Basic copy
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Copy successful');
    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
}

// Copy element content
async function copyElementText(selector) {
  const element = document.querySelector(selector);
  if (!element) return false;
  
  const text = element.textContent || element.value;
  return copyText(text);
}

// Copy button with feedback
class CopyButton {
  constructor(button, targetSelector) {
    this.button = button;
    this.target = document.querySelector(targetSelector);
    this.originalText = button.textContent;
    
    button.addEventListener('click', () => this.copy());
  }
  
  async copy() {
    const text = this.target.textContent || this.target.value;
    
    try {
      await navigator.clipboard.writeText(text);
      this.showSuccess();
    } catch (err) {
      this.showError();
    }
  }
  
  showSuccess() {
    this.button.textContent = 'Copied!';
    this.button.classList.add('success');
    
    setTimeout(() => {
      this.button.textContent = this.originalText;
      this.button.classList.remove('success');
    }, 2000);
  }
  
  showError() {
    this.button.textContent = 'Copy failed';
    this.button.classList.add('error');
    
    setTimeout(() => {
      this.button.textContent = this.originalText;
      this.button.classList.remove('error');
    }, 2000);
  }
}

// Usage
new CopyButton(
  document.querySelector('.copy-btn'),
  '#code-block'
);
```

### Read Text

```javascript
// Basic read
async function readText() {
  try {
    const text = await navigator.clipboard.readText();
    console.log('Clipboard content:', text);
    return text;
  } catch (err) {
    console.error('Read failed:', err);
    return null;
  }
}

// Paste to input
async function pasteToInput(inputSelector) {
  const input = document.querySelector(inputSelector);
  if (!input) return;
  
  const text = await readText();
  if (text) {
    input.value = text;
    input.dispatchEvent(new Event('input'));
  }
}

// Listen for paste event
document.addEventListener('paste', async (e) => {
  // Prevent default paste
  e.preventDefault();
  
  // Get pasted text
  const text = e.clipboardData.getData('text/plain');
  
  // Or use Clipboard API
  const clipboardText = await navigator.clipboard.readText();
  
  console.log('Pasted content:', text);
});
```

## Rich Media Operations

### Copy Images

```javascript
// Copy image to clipboard
async function copyImage(imageUrl) {
  try {
    // Fetch image data
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Create ClipboardItem
    const item = new ClipboardItem({
      [blob.type]: blob
    });
    
    await navigator.clipboard.write([item]);
    console.log('Image copied successfully');
    return true;
  } catch (err) {
    console.error('Image copy failed:', err);
    return false;
  }
}

// Copy from Canvas
async function copyCanvas(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      try {
        const item = new ClipboardItem({
          'image/png': blob
        });
        await navigator.clipboard.write([item]);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}

// Copy screenshot
async function copyScreenshot(element) {
  // Requires html2canvas library
  const canvas = await html2canvas(element);
  return copyCanvas(canvas);
}
```

### Read Images

```javascript
// Read image from clipboard
async function readImage() {
  try {
    const items = await navigator.clipboard.read();
    
    for (const item of items) {
      // Find image type
      const imageType = item.types.find(type => type.startsWith('image/'));
      
      if (imageType) {
        const blob = await item.getType(imageType);
        return URL.createObjectURL(blob);
      }
    }
    
    return null;
  } catch (err) {
    console.error('Read image failed:', err);
    return null;
  }
}

// Display pasted image
async function displayPastedImage(containerSelector) {
  const container = document.querySelector(containerSelector);
  const imageUrl = await readImage();
  
  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    container.appendChild(img);
  }
}

// Listen for image paste
document.addEventListener('paste', async (e) => {
  const items = e.clipboardData.items;
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      const url = URL.createObjectURL(blob);
      
      // Display image
      const img = document.createElement('img');
      img.src = url;
      document.body.appendChild(img);
    }
  }
});
```

### Copy Rich Text

```javascript
// Copy HTML content
async function copyHtml(html, plainText) {
  try {
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });
    
    const item = new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob
    });
    
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
}

// Copy formatted table
async function copyTable(tableElement) {
  const html = tableElement.outerHTML;
  
  // Generate plain text version
  const rows = tableElement.querySelectorAll('tr');
  const plainText = Array.from(rows)
    .map(row => {
      const cells = row.querySelectorAll('td, th');
      return Array.from(cells).map(cell => cell.textContent).join('\t');
    })
    .join('\n');
  
  return copyHtml(html, plainText);
}

// Read rich text
async function readHtml() {
  try {
    const items = await navigator.clipboard.read();
    
    for (const item of items) {
      if (item.types.includes('text/html')) {
        const blob = await item.getType('text/html');
        return await blob.text();
      }
    }
    
    return null;
  } catch (err) {
    console.error('Read failed:', err);
    return null;
  }
}
```

## Practical Applications

### Code Copy Widget

```javascript
class CodeCopyWidget {
  constructor(container) {
    this.container = container;
    this.codeBlocks = container.querySelectorAll('pre code');
    
    this.init();
  }
  
  init() {
    this.codeBlocks.forEach(block => {
      this.addCopyButton(block.parentElement);
    });
  }
  
  addCopyButton(pre) {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';
    
    const button = document.createElement('button');
    button.className = 'copy-code-btn';
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
      </svg>
    `;
    
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    wrapper.appendChild(button);
    
    button.addEventListener('click', () => this.copyCode(pre, button));
  }
  
  async copyCode(pre, button) {
    const code = pre.querySelector('code');
    const text = code.textContent;
    
    try {
      await navigator.clipboard.writeText(text);
      button.classList.add('copied');
      button.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      `;
      
      setTimeout(() => {
        button.classList.remove('copied');
        button.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
        `;
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }
}

// Usage
new CodeCopyWidget(document.body);
```

### Image Paste Uploader

```javascript
class ImagePasteUploader {
  constructor(options) {
    this.options = {
      container: document.body,
      onUpload: async () => {},
      onPreview: () => {},
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/png', 'image/jpeg', 'image/gif'],
      ...options
    };
    
    this.init();
  }
  
  init() {
    this.options.container.addEventListener('paste', (e) => {
      this.handlePaste(e);
    });
    
    // Drag and drop support
    this.options.container.addEventListener('drop', (e) => {
      e.preventDefault();
      this.handleDrop(e);
    });
    
    this.options.container.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
  }
  
  async handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        await this.processImage(file);
        break;
      }
    }
  }
  
  async handleDrop(e) {
    const files = e.dataTransfer?.files;
    if (!files) return;
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await this.processImage(file);
      }
    }
  }
  
  async processImage(file) {
    // Validate
    if (!this.validateImage(file)) return;
    
    // Preview
    const previewUrl = URL.createObjectURL(file);
    this.options.onPreview(previewUrl);
    
    // Upload
    try {
      const result = await this.options.onUpload(file);
      return result;
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }
  
  validateImage(file) {
    if (!this.options.allowedTypes.includes(file.type)) {
      console.error('Unsupported image format');
      return false;
    }
    
    if (file.size > this.options.maxSize) {
      console.error('Image too large');
      return false;
    }
    
    return true;
  }
}

// Usage
new ImagePasteUploader({
  container: document.querySelector('#editor'),
  onPreview: (url) => {
    const img = document.createElement('img');
    img.src = url;
    document.querySelector('#preview').appendChild(img);
  },
  onUpload: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    return response.json();
  }
});
```

### Clipboard History

```javascript
class ClipboardHistory {
  constructor(options = {}) {
    this.options = {
      maxItems: 20,
      storageKey: 'clipboardHistory',
      ...options
    };
    
    this.history = this.loadHistory();
    this.setupListener();
  }
  
  loadHistory() {
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  saveHistory() {
    localStorage.setItem(
      this.options.storageKey,
      JSON.stringify(this.history)
    );
  }
  
  setupListener() {
    // Listen for copy events
    document.addEventListener('copy', async () => {
      // Delay read to ensure clipboard is updated
      setTimeout(async () => {
        try {
          const text = await navigator.clipboard.readText();
          this.addItem(text);
        } catch (err) {
          console.error('Failed to read clipboard:', err);
        }
      }, 100);
    });
  }
  
  addItem(content) {
    if (!content || content.trim() === '') return;
    
    // Remove duplicates
    this.history = this.history.filter(item => item.content !== content);
    
    // Add to beginning
    this.history.unshift({
      content,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    });
    
    // Limit count
    if (this.history.length > this.options.maxItems) {
      this.history = this.history.slice(0, this.options.maxItems);
    }
    
    this.saveHistory();
  }
  
  getHistory() {
    return [...this.history];
  }
  
  async copyItem(id) {
    const item = this.history.find(i => i.id === id);
    if (item) {
      await navigator.clipboard.writeText(item.content);
    }
  }
  
  deleteItem(id) {
    this.history = this.history.filter(i => i.id !== id);
    this.saveHistory();
  }
  
  clearHistory() {
    this.history = [];
    this.saveHistory();
  }
}

const clipboardHistory = new ClipboardHistory();
```

### Share Functionality

```javascript
class ShareManager {
  constructor() {
    this.shareData = null;
  }
  
  // Copy link share
  async copyLink(url, title) {
    const text = title ? `${title}\n${url}` : url;
    
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Link copied');
      return true;
    } catch {
      return false;
    }
  }
  
  // Copy rich link
  async copyRichLink(url, title) {
    const html = `<a href="${url}">${title}</a>`;
    const text = `${title}: ${url}`;
    
    try {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([text], { type: 'text/plain' });
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);
      
      return true;
    } catch {
      // Fallback to plain text
      return this.copyLink(url, title);
    }
  }
  
  // Combine with Web Share API
  async share(data) {
    // Prefer native share
    if (navigator.share) {
      try {
        await navigator.share(data);
        return { method: 'native', success: true };
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
    
    // Fallback to copy
    const text = data.text || data.title || '';
    const url = data.url || '';
    
    const success = await this.copyLink(url, text);
    return { method: 'clipboard', success };
  }
  
  showNotification(message) {
    // Show notification
  }
}

const shareManager = new ShareManager();
```

## Compatibility Handling

### Fallback Solutions

```javascript
class ClipboardHelper {
  // Check support
  static get isSupported() {
    return 'clipboard' in navigator;
  }
  
  // Copy text with fallback
  static async copyText(text) {
    if (this.isSupported) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // API failed, use fallback
      }
    }
    
    return this.fallbackCopy(text);
  }
  
  // Fallback copy method
  static fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(textarea);
    
    try {
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      const success = document.execCommand('copy');
      return success;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
  
  // Read text with fallback
  static async readText() {
    if (this.isSupported) {
      try {
        return await navigator.clipboard.readText();
      } catch {
        // API failed
      }
    }
    
    // Fallback: prompt user to use Ctrl+V
    return null;
  }
}

// Usage
document.querySelector('.copy-btn').addEventListener('click', async () => {
  const success = await ClipboardHelper.copyText('Hello World');
  console.log(success ? 'Copy successful' : 'Copy failed');
});
```

## Best Practices Summary

```
Clipboard API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Security Considerations                           │
│   ├── Access only during user interaction          │
│   ├── Handle permission denied cases               │
│   ├── Validate read content                        │
│   └── Clear sensitive data                         │
│                                                     │
│   User Experience                                   │
│   ├── Provide visual feedback                      │
│   ├── Support multiple formats                     │
│   ├── Implement fallback solutions                 │
│   └── Handle file size limits                      │
│                                                     │
│   Compatibility                                     │
│   ├── Check API support                            │
│   ├── Use execCommand fallback                     │
│   ├── Handle browser differences                   │
│   └── Test various scenarios                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Method | Purpose | Permission Required |
|--------|---------|---------------------|
| writeText | Write text | Auto-granted |
| readText | Read text | Required |
| write | Write any data | Auto-granted |
| read | Read any data | Required |

---

*Master the Clipboard API to enhance your application's interaction experience.*
