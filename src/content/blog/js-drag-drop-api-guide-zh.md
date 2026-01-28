---
title: 'JavaScript 拖放 API 完全指南'
description: '掌握拖放交互：draggable 元素、数据传输、拖放事件与文件上传'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'js-drag-drop-api-guide'
---

HTML5 拖放 API 提供了原生的拖放交互支持。本文详解其用法和实际应用。

## 基础概念

### 使元素可拖动

```html
<!-- 添加 draggable 属性 -->
<div draggable="true" id="drag-item">
  拖动我
</div>

<!-- 图片和链接默认可拖动 -->
<img src="image.jpg" alt="可拖动图片">
<a href="https://example.com">可拖动链接</a>
```

```javascript
// JavaScript 设置 draggable
const element = document.getElementById('item');
element.draggable = true;
```

### 拖放事件

```javascript
const draggable = document.getElementById('drag-item');
const dropzone = document.getElementById('drop-zone');

// 拖动开始
draggable.addEventListener('dragstart', (e) => {
  console.log('开始拖动');
  e.dataTransfer.setData('text/plain', e.target.id);
});

// 拖动中
draggable.addEventListener('drag', (e) => {
  // 拖动过程中持续触发
});

// 拖动结束
draggable.addEventListener('dragend', (e) => {
  console.log('拖动结束');
});

// 进入放置区域
dropzone.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
});

// 在放置区域上方
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault(); // 必须阻止默认行为才能接收 drop
  e.dataTransfer.dropEffect = 'move';
});

// 离开放置区域
dropzone.addEventListener('dragleave', (e) => {
  dropzone.classList.remove('drag-over');
});

// 放置
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  const element = document.getElementById(id);
  dropzone.appendChild(element);
  dropzone.classList.remove('drag-over');
});
```

### DataTransfer 对象

```javascript
draggable.addEventListener('dragstart', (e) => {
  const dt = e.dataTransfer;
  
  // 设置数据
  dt.setData('text/plain', '纯文本');
  dt.setData('text/html', '<p>HTML内容</p>');
  dt.setData('application/json', JSON.stringify({ id: 1 }));
  
  // 设置拖动效果
  dt.effectAllowed = 'move'; // copy, move, link, all, none
  
  // 设置拖动图像
  const img = new Image();
  img.src = 'drag-image.png';
  dt.setDragImage(img, 0, 0);
});

dropzone.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  
  // 获取数据
  const text = dt.getData('text/plain');
  const html = dt.getData('text/html');
  const json = JSON.parse(dt.getData('application/json') || '{}');
  
  // 获取文件
  const files = dt.files;
  
  // 获取所有项
  const items = dt.items;
  
  console.log('拖动效果:', dt.dropEffect);
});
```

## 高级功能

### 自定义拖动预览

```javascript
class DragPreview {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      offsetX: 0,
      offsetY: 0,
      ...options
    };
    
    element.draggable = true;
    element.addEventListener('dragstart', (e) => this.handleDragStart(e));
  }
  
  handleDragStart(e) {
    // 创建自定义预览
    const preview = this.createPreview();
    document.body.appendChild(preview);
    
    e.dataTransfer.setDragImage(
      preview,
      this.options.offsetX,
      this.options.offsetY
    );
    
    // 延迟移除（需要在拖动开始后）
    requestAnimationFrame(() => {
      preview.remove();
    });
  }
  
  createPreview() {
    const preview = this.element.cloneNode(true);
    preview.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      opacity: 0.8;
      transform: rotate(5deg);
    `;
    return preview;
  }
}

// 使用
new DragPreview(document.querySelector('.draggable'), {
  offsetX: 50,
  offsetY: 25
});
```

### 拖放排序列表

```javascript
class SortableList {
  constructor(container) {
    this.container = container;
    this.items = container.querySelectorAll('.sortable-item');
    this.draggedItem = null;
    this.placeholder = this.createPlaceholder();
    
    this.init();
  }
  
  createPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.className = 'sortable-placeholder';
    return placeholder;
  }
  
  init() {
    this.items.forEach(item => {
      item.draggable = true;
      
      item.addEventListener('dragstart', (e) => this.handleDragStart(e, item));
      item.addEventListener('dragend', (e) => this.handleDragEnd(e, item));
      item.addEventListener('dragover', (e) => this.handleDragOver(e, item));
      item.addEventListener('dragenter', (e) => this.handleDragEnter(e, item));
    });
    
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
  }
  
  handleDragStart(e, item) {
    this.draggedItem = item;
    item.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    
    // 设置占位符尺寸
    this.placeholder.style.height = item.offsetHeight + 'px';
  }
  
  handleDragEnd(e, item) {
    item.classList.remove('dragging');
    this.placeholder.remove();
    this.draggedItem = null;
  }
  
  handleDragOver(e, item) {
    e.preventDefault();
    
    if (item === this.draggedItem) return;
    
    const rect = item.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    
    if (e.clientY < midY) {
      item.parentNode.insertBefore(this.placeholder, item);
      item.parentNode.insertBefore(this.draggedItem, item);
    } else {
      item.parentNode.insertBefore(this.placeholder, item.nextSibling);
      item.parentNode.insertBefore(this.draggedItem, item.nextSibling);
    }
  }
  
  handleDragEnter(e, item) {
    e.preventDefault();
  }
  
  getOrder() {
    return Array.from(this.container.querySelectorAll('.sortable-item'))
      .map(item => item.dataset.id);
  }
}

// 使用
const sortable = new SortableList(document.querySelector('.sortable-list'));
```

### 多列看板拖放

```javascript
class KanbanBoard {
  constructor(container) {
    this.container = container;
    this.columns = container.querySelectorAll('.kanban-column');
    this.cards = container.querySelectorAll('.kanban-card');
    this.draggedCard = null;
    this.onCardMove = null;
    
    this.init();
  }
  
  init() {
    // 设置卡片拖动
    this.cards.forEach(card => {
      card.draggable = true;
      card.addEventListener('dragstart', (e) => this.handleCardDragStart(e, card));
      card.addEventListener('dragend', (e) => this.handleCardDragEnd(e, card));
    });
    
    // 设置列放置
    this.columns.forEach(column => {
      const dropzone = column.querySelector('.kanban-cards');
      
      dropzone.addEventListener('dragover', (e) => this.handleDragOver(e, dropzone));
      dropzone.addEventListener('dragenter', (e) => this.handleDragEnter(e, dropzone));
      dropzone.addEventListener('dragleave', (e) => this.handleDragLeave(e, dropzone));
      dropzone.addEventListener('drop', (e) => this.handleDrop(e, dropzone, column));
    });
  }
  
  handleCardDragStart(e, card) {
    this.draggedCard = card;
    card.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.dataset.id);
    
    // 添加源列标识
    const sourceColumn = card.closest('.kanban-column');
    e.dataTransfer.setData('source-column', sourceColumn.dataset.status);
  }
  
  handleCardDragEnd(e, card) {
    card.classList.remove('dragging');
    this.columns.forEach(col => {
      col.querySelector('.kanban-cards').classList.remove('drag-over');
    });
    this.draggedCard = null;
  }
  
  handleDragOver(e, dropzone) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // 计算插入位置
    const afterElement = this.getInsertPosition(dropzone, e.clientY);
    
    if (afterElement) {
      dropzone.insertBefore(this.draggedCard, afterElement);
    } else {
      dropzone.appendChild(this.draggedCard);
    }
  }
  
  handleDragEnter(e, dropzone) {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  }
  
  handleDragLeave(e, dropzone) {
    // 确保是离开整个 dropzone
    if (!dropzone.contains(e.relatedTarget)) {
      dropzone.classList.remove('drag-over');
    }
  }
  
  handleDrop(e, dropzone, column) {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    
    const cardId = e.dataTransfer.getData('text/plain');
    const sourceColumn = e.dataTransfer.getData('source-column');
    const targetColumn = column.dataset.status;
    
    // 触发回调
    if (this.onCardMove && sourceColumn !== targetColumn) {
      this.onCardMove({
        cardId,
        from: sourceColumn,
        to: targetColumn,
        position: this.getCardPosition(dropzone, cardId)
      });
    }
  }
  
  getInsertPosition(dropzone, y) {
    const cards = [...dropzone.querySelectorAll('.kanban-card:not(.dragging)')];
    
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      
      if (y < midY) {
        return card;
      }
    }
    
    return null;
  }
  
  getCardPosition(dropzone, cardId) {
    const cards = dropzone.querySelectorAll('.kanban-card');
    return Array.from(cards).findIndex(c => c.dataset.id === cardId);
  }
}

// 使用
const board = new KanbanBoard(document.querySelector('.kanban-board'));

board.onCardMove = ({ cardId, from, to, position }) => {
  console.log(`卡片 ${cardId} 从 ${from} 移动到 ${to}，位置 ${position}`);
  // 更新后端
  updateCardStatus(cardId, to, position);
};
```

## 文件拖放上传

### 基础文件上传

```javascript
class FileDropzone {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      multiple: true,
      accept: '*/*',
      maxSize: 10 * 1024 * 1024, // 10MB
      onDrop: () => {},
      onError: () => {},
      ...options
    };
    
    this.init();
  }
  
  init() {
    this.element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.element.classList.add('drag-over');
    });
    
    this.element.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.element.classList.remove('drag-over');
    });
    
    this.element.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.element.classList.remove('drag-over');
      this.handleDrop(e);
    });
    
    // 阻止页面默认拖放行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
      document.body.addEventListener(event, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
  }
  
  handleDrop(e) {
    const files = e.dataTransfer.files;
    const validFiles = this.validateFiles(files);
    
    if (validFiles.length > 0) {
      this.options.onDrop(validFiles);
    }
  }
  
  validateFiles(files) {
    const validFiles = [];
    const errors = [];
    
    Array.from(files).forEach(file => {
      // 检查数量
      if (!this.options.multiple && validFiles.length >= 1) {
        errors.push({ file, error: '只能上传一个文件' });
        return;
      }
      
      // 检查类型
      if (!this.matchType(file.type)) {
        errors.push({ file, error: '文件类型不支持' });
        return;
      }
      
      // 检查大小
      if (file.size > this.options.maxSize) {
        errors.push({ file, error: '文件过大' });
        return;
      }
      
      validFiles.push(file);
    });
    
    if (errors.length > 0) {
      this.options.onError(errors);
    }
    
    return validFiles;
  }
  
  matchType(type) {
    if (this.options.accept === '*/*') return true;
    
    const accepts = this.options.accept.split(',').map(t => t.trim());
    
    return accepts.some(accept => {
      if (accept.startsWith('.')) {
        // 扩展名匹配
        return type.endsWith(accept.slice(1));
      }
      if (accept.endsWith('/*')) {
        // MIME 类型前缀匹配
        return type.startsWith(accept.slice(0, -1));
      }
      return type === accept;
    });
  }
}

// 使用
const dropzone = new FileDropzone(document.querySelector('.file-dropzone'), {
  accept: 'image/*,.pdf',
  maxSize: 5 * 1024 * 1024,
  onDrop: (files) => {
    console.log('接收文件:', files);
    uploadFiles(files);
  },
  onError: (errors) => {
    errors.forEach(({ file, error }) => {
      console.error(`${file.name}: ${error}`);
    });
  }
});
```

### 带预览的图片上传

```javascript
class ImageDropzone extends FileDropzone {
  constructor(element, options = {}) {
    super(element, {
      accept: 'image/*',
      onDrop: (files) => this.handleImages(files),
      ...options
    });
    
    this.previewContainer = options.previewContainer || element;
    this.images = [];
  }
  
  handleImages(files) {
    files.forEach(file => {
      this.readAndPreview(file);
    });
  }
  
  readAndPreview(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageData = {
        file,
        dataUrl: e.target.result,
        id: crypto.randomUUID()
      };
      
      this.images.push(imageData);
      this.renderPreview(imageData);
    };
    
    reader.readAsDataURL(file);
  }
  
  renderPreview(imageData) {
    const preview = document.createElement('div');
    preview.className = 'image-preview';
    preview.dataset.id = imageData.id;
    
    preview.innerHTML = `
      <img src="${imageData.dataUrl}" alt="${imageData.file.name}">
      <div class="image-info">
        <span class="name">${imageData.file.name}</span>
        <span class="size">${this.formatSize(imageData.file.size)}</span>
      </div>
      <button class="remove-btn" type="button">&times;</button>
    `;
    
    preview.querySelector('.remove-btn').addEventListener('click', () => {
      this.removeImage(imageData.id);
    });
    
    this.previewContainer.appendChild(preview);
  }
  
  removeImage(id) {
    this.images = this.images.filter(img => img.id !== id);
    const preview = this.previewContainer.querySelector(`[data-id="${id}"]`);
    preview?.remove();
  }
  
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let index = 0;
    let size = bytes;
    
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index++;
    }
    
    return `${size.toFixed(1)} ${units[index]}`;
  }
  
  getImages() {
    return this.images.map(img => img.file);
  }
  
  clear() {
    this.images = [];
    this.previewContainer.innerHTML = '';
  }
}

// 使用
const imageDropzone = new ImageDropzone(
  document.querySelector('.image-dropzone'),
  {
    previewContainer: document.querySelector('.image-previews'),
    maxSize: 2 * 1024 * 1024
  }
);
```

## 触摸设备支持

### 触摸拖放适配

```javascript
class TouchDraggable {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      onDragStart: () => {},
      onDrag: () => {},
      onDragEnd: () => {},
      ...options
    };
    
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    
    this.init();
  }
  
  init() {
    this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    this.element.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));
  }
  
  handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    
    // 长按触发拖动
    this.longPressTimer = setTimeout(() => {
      this.isDragging = true;
      this.element.classList.add('dragging');
      this.options.onDragStart(this.element, touch);
    }, 200);
  }
  
  handleTouchMove(e) {
    if (!this.isDragging) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - this.startX);
      const dy = Math.abs(touch.clientY - this.startY);
      
      // 移动距离过大，取消长按
      if (dx > 10 || dy > 10) {
        clearTimeout(this.longPressTimer);
      }
      return;
    }
    
    e.preventDefault();
    const touch = e.touches[0];
    this.currentX = touch.clientX;
    this.currentY = touch.clientY;
    
    // 移动元素
    const dx = this.currentX - this.startX;
    const dy = this.currentY - this.startY;
    
    this.element.style.transform = `translate(${dx}px, ${dy}px)`;
    this.options.onDrag(this.element, touch, { dx, dy });
  }
  
  handleTouchEnd(e) {
    clearTimeout(this.longPressTimer);
    
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.element.classList.remove('dragging');
    this.element.style.transform = '';
    
    this.options.onDragEnd(this.element, {
      x: this.currentX,
      y: this.currentY
    });
  }
}

// 结合原生拖放
class UnifiedDraggable {
  constructor(element, options = {}) {
    this.element = element;
    this.options = options;
    
    if ('ontouchstart' in window) {
      this.touchHandler = new TouchDraggable(element, options);
    }
    
    // 同时支持原生拖放
    element.draggable = true;
    element.addEventListener('dragstart', (e) => options.onDragStart?.(element, e));
    element.addEventListener('drag', (e) => options.onDrag?.(element, e));
    element.addEventListener('dragend', (e) => options.onDragEnd?.(element, e));
  }
}
```

## 最佳实践总结

```
拖放 API 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   交互设计                                          │
│   ├── 提供清晰的视觉反馈                           │
│   ├── 显示拖放目标区域                             │
│   ├── 使用合适的光标样式                           │
│   └── 支持键盘辅助功能                             │
│                                                     │
│   性能优化                                          │
│   ├── 避免在 drag 事件中执行复杂操作               │
│   ├── 使用节流处理位置更新                         │
│   ├── 合理设置拖动图像                             │
│   └── 减少 DOM 操作                                │
│                                                     │
│   兼容性                                            │
│   ├── 处理触摸设备                                 │
│   ├── 提供降级方案                                 │
│   ├── 测试不同浏览器                               │
│   └── 考虑移动端体验                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 事件 | 触发时机 | 目标 |
|------|---------|------|
| dragstart | 开始拖动 | 被拖动元素 |
| drag | 拖动过程中 | 被拖动元素 |
| dragend | 拖动结束 | 被拖动元素 |
| dragenter | 进入放置区 | 放置目标 |
| dragover | 在放置区上 | 放置目标 |
| dragleave | 离开放置区 | 放置目标 |
| drop | 放置 | 放置目标 |

---

*掌握拖放 API，创建直观的交互体验。*
