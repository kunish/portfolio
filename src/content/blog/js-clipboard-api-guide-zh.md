---
title: 'JavaScript Clipboard API 完全指南'
description: '掌握剪贴板操作：读写文本、复制图片、处理富文本与权限管理'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'js-clipboard-api-guide'
---

Clipboard API 提供了现代化的剪贴板访问方式。本文详解其用法和实际应用场景。

## 基础概念

### API 概述

```javascript
// 检查 Clipboard API 支持
if ('clipboard' in navigator) {
  console.log('Clipboard API 可用');
}

// 主要方法
// navigator.clipboard.writeText() - 写入文本
// navigator.clipboard.readText() - 读取文本
// navigator.clipboard.write() - 写入任意数据
// navigator.clipboard.read() - 读取任意数据
```

### 权限要求

```javascript
// 查询权限状态
async function checkClipboardPermission() {
  try {
    // 读取权限
    const readPermission = await navigator.permissions.query({
      name: 'clipboard-read'
    });
    console.log('读取权限:', readPermission.state);
    
    // 写入权限（通常自动授予）
    const writePermission = await navigator.permissions.query({
      name: 'clipboard-write'
    });
    console.log('写入权限:', writePermission.state);
    
    // 监听权限变化
    readPermission.addEventListener('change', () => {
      console.log('读取权限变更:', readPermission.state);
    });
  } catch (e) {
    console.error('权限查询失败:', e);
  }
}
```

## 文本操作

### 复制文本

```javascript
// 基本复制
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('复制成功');
    return true;
  } catch (err) {
    console.error('复制失败:', err);
    return false;
  }
}

// 复制元素内容
async function copyElementText(selector) {
  const element = document.querySelector(selector);
  if (!element) return false;
  
  const text = element.textContent || element.value;
  return copyText(text);
}

// 带反馈的复制按钮
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
    this.button.textContent = '已复制!';
    this.button.classList.add('success');
    
    setTimeout(() => {
      this.button.textContent = this.originalText;
      this.button.classList.remove('success');
    }, 2000);
  }
  
  showError() {
    this.button.textContent = '复制失败';
    this.button.classList.add('error');
    
    setTimeout(() => {
      this.button.textContent = this.originalText;
      this.button.classList.remove('error');
    }, 2000);
  }
}

// 使用
new CopyButton(
  document.querySelector('.copy-btn'),
  '#code-block'
);
```

### 读取文本

```javascript
// 基本读取
async function readText() {
  try {
    const text = await navigator.clipboard.readText();
    console.log('剪贴板内容:', text);
    return text;
  } catch (err) {
    console.error('读取失败:', err);
    return null;
  }
}

// 粘贴到输入框
async function pasteToInput(inputSelector) {
  const input = document.querySelector(inputSelector);
  if (!input) return;
  
  const text = await readText();
  if (text) {
    input.value = text;
    input.dispatchEvent(new Event('input'));
  }
}

// 监听粘贴事件
document.addEventListener('paste', async (e) => {
  // 阻止默认粘贴
  e.preventDefault();
  
  // 获取粘贴的文本
  const text = e.clipboardData.getData('text/plain');
  
  // 或使用 Clipboard API
  const clipboardText = await navigator.clipboard.readText();
  
  console.log('粘贴内容:', text);
});
```

## 富媒体操作

### 复制图片

```javascript
// 复制图片到剪贴板
async function copyImage(imageUrl) {
  try {
    // 获取图片数据
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // 创建 ClipboardItem
    const item = new ClipboardItem({
      [blob.type]: blob
    });
    
    await navigator.clipboard.write([item]);
    console.log('图片复制成功');
    return true;
  } catch (err) {
    console.error('图片复制失败:', err);
    return false;
  }
}

// 从 Canvas 复制
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

// 复制截图
async function copyScreenshot(element) {
  // 需要 html2canvas 库
  const canvas = await html2canvas(element);
  return copyCanvas(canvas);
}
```

### 读取图片

```javascript
// 从剪贴板读取图片
async function readImage() {
  try {
    const items = await navigator.clipboard.read();
    
    for (const item of items) {
      // 查找图片类型
      const imageType = item.types.find(type => type.startsWith('image/'));
      
      if (imageType) {
        const blob = await item.getType(imageType);
        return URL.createObjectURL(blob);
      }
    }
    
    return null;
  } catch (err) {
    console.error('读取图片失败:', err);
    return null;
  }
}

// 粘贴图片显示
async function displayPastedImage(containerSelector) {
  const container = document.querySelector(containerSelector);
  const imageUrl = await readImage();
  
  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    container.appendChild(img);
  }
}

// 监听图片粘贴
document.addEventListener('paste', async (e) => {
  const items = e.clipboardData.items;
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      const url = URL.createObjectURL(blob);
      
      // 显示图片
      const img = document.createElement('img');
      img.src = url;
      document.body.appendChild(img);
    }
  }
});
```

### 复制富文本

```javascript
// 复制 HTML 内容
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
    console.error('复制失败:', err);
    return false;
  }
}

// 复制带格式的表格
async function copyTable(tableElement) {
  const html = tableElement.outerHTML;
  
  // 生成纯文本版本
  const rows = tableElement.querySelectorAll('tr');
  const plainText = Array.from(rows)
    .map(row => {
      const cells = row.querySelectorAll('td, th');
      return Array.from(cells).map(cell => cell.textContent).join('\t');
    })
    .join('\n');
  
  return copyHtml(html, plainText);
}

// 读取富文本
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
    console.error('读取失败:', err);
    return null;
  }
}
```

## 实际应用场景

### 代码复制组件

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
      console.error('复制失败:', err);
    }
  }
}

// 使用
new CodeCopyWidget(document.body);
```

### 图片上传粘贴

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
    
    // 拖拽支持
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
    // 验证
    if (!this.validateImage(file)) return;
    
    // 预览
    const previewUrl = URL.createObjectURL(file);
    this.options.onPreview(previewUrl);
    
    // 上传
    try {
      const result = await this.options.onUpload(file);
      return result;
    } catch (err) {
      console.error('上传失败:', err);
    }
  }
  
  validateImage(file) {
    if (!this.options.allowedTypes.includes(file.type)) {
      console.error('不支持的图片格式');
      return false;
    }
    
    if (file.size > this.options.maxSize) {
      console.error('图片过大');
      return false;
    }
    
    return true;
  }
}

// 使用
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

### 剪贴板历史

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
    // 监听复制事件
    document.addEventListener('copy', async () => {
      // 延迟读取以确保剪贴板已更新
      setTimeout(async () => {
        try {
          const text = await navigator.clipboard.readText();
          this.addItem(text);
        } catch (err) {
          console.error('读取剪贴板失败:', err);
        }
      }, 100);
    });
  }
  
  addItem(content) {
    if (!content || content.trim() === '') return;
    
    // 移除重复项
    this.history = this.history.filter(item => item.content !== content);
    
    // 添加到开头
    this.history.unshift({
      content,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    });
    
    // 限制数量
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

### 分享功能

```javascript
class ShareManager {
  constructor() {
    this.shareData = null;
  }
  
  // 复制链接分享
  async copyLink(url, title) {
    const text = title ? `${title}\n${url}` : url;
    
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('链接已复制');
      return true;
    } catch {
      return false;
    }
  }
  
  // 复制富文本链接
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
      // 回退到纯文本
      return this.copyLink(url, title);
    }
  }
  
  // 结合 Web Share API
  async share(data) {
    // 优先使用原生分享
    if (navigator.share) {
      try {
        await navigator.share(data);
        return { method: 'native', success: true };
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('分享失败:', err);
        }
      }
    }
    
    // 回退到复制
    const text = data.text || data.title || '';
    const url = data.url || '';
    
    const success = await this.copyLink(url, text);
    return { method: 'clipboard', success };
  }
  
  showNotification(message) {
    // 显示通知
  }
}

const shareManager = new ShareManager();
```

## 兼容性处理

### 降级方案

```javascript
class ClipboardHelper {
  // 检测支持
  static get isSupported() {
    return 'clipboard' in navigator;
  }
  
  // 复制文本（带降级）
  static async copyText(text) {
    if (this.isSupported) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // API 失败，使用降级方案
      }
    }
    
    return this.fallbackCopy(text);
  }
  
  // 降级复制方案
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
  
  // 读取文本（带降级）
  static async readText() {
    if (this.isSupported) {
      try {
        return await navigator.clipboard.readText();
      } catch {
        // API 失败
      }
    }
    
    // 降级：提示用户使用 Ctrl+V
    return null;
  }
}

// 使用
document.querySelector('.copy-btn').addEventListener('click', async () => {
  const success = await ClipboardHelper.copyText('Hello World');
  console.log(success ? '复制成功' : '复制失败');
});
```

## 最佳实践总结

```
Clipboard API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   安全考虑                                          │
│   ├── 仅在用户交互时访问                           │
│   ├── 处理权限被拒绝情况                           │
│   ├── 验证读取的内容                               │
│   └── 清理敏感数据                                 │
│                                                     │
│   用户体验                                          │
│   ├── 提供视觉反馈                                 │
│   ├── 支持多种格式                                 │
│   ├── 实现降级方案                                 │
│   └── 处理大文件限制                               │
│                                                     │
│   兼容性                                            │
│   ├── 检测 API 支持                                │
│   ├── 使用 execCommand 降级                        │
│   ├── 处理不同浏览器差异                           │
│   └── 测试各种场景                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 方法 | 用途 | 权限要求 |
|------|------|---------|
| writeText | 写入文本 | 自动授予 |
| readText | 读取文本 | 需要权限 |
| write | 写入任意数据 | 自动授予 |
| read | 读取任意数据 | 需要权限 |

---

*掌握 Clipboard API，提升应用的交互体验。*
