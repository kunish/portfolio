---
title: 'JavaScript Drag and Drop API Complete Guide'
description: 'Master drag and drop interaction: draggable elements, data transfer, drag events, and file upload'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'js-drag-drop-api-guide'
---

The HTML5 Drag and Drop API provides native support for drag and drop interactions. This article covers its usage and practical applications.

## Basic Concepts

### Making Elements Draggable

```html
<!-- Add draggable attribute -->
<div draggable="true" id="drag-item">
  Drag me
</div>

<!-- Images and links are draggable by default -->
<img src="image.jpg" alt="Draggable image">
<a href="https://example.com">Draggable link</a>
```

```javascript
// Set draggable via JavaScript
const element = document.getElementById('item');
element.draggable = true;
```

### Drag and Drop Events

```javascript
const draggable = document.getElementById('drag-item');
const dropzone = document.getElementById('drop-zone');

// Drag start
draggable.addEventListener('dragstart', (e) => {
  console.log('Drag started');
  e.dataTransfer.setData('text/plain', e.target.id);
});

// During drag
draggable.addEventListener('drag', (e) => {
  // Fires continuously during drag
});

// Drag end
draggable.addEventListener('dragend', (e) => {
  console.log('Drag ended');
});

// Enter drop zone
dropzone.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
});

// Over drop zone
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault(); // Must prevent default to receive drop
  e.dataTransfer.dropEffect = 'move';
});

// Leave drop zone
dropzone.addEventListener('dragleave', (e) => {
  dropzone.classList.remove('drag-over');
});

// Drop
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  const element = document.getElementById(id);
  dropzone.appendChild(element);
  dropzone.classList.remove('drag-over');
});
```

### DataTransfer Object

```javascript
draggable.addEventListener('dragstart', (e) => {
  const dt = e.dataTransfer;
  
  // Set data
  dt.setData('text/plain', 'Plain text');
  dt.setData('text/html', '<p>HTML content</p>');
  dt.setData('application/json', JSON.stringify({ id: 1 }));
  
  // Set drag effect
  dt.effectAllowed = 'move'; // copy, move, link, all, none
  
  // Set drag image
  const img = new Image();
  img.src = 'drag-image.png';
  dt.setDragImage(img, 0, 0);
});

dropzone.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  
  // Get data
  const text = dt.getData('text/plain');
  const html = dt.getData('text/html');
  const json = JSON.parse(dt.getData('application/json') || '{}');
  
  // Get files
  const files = dt.files;
  
  // Get all items
  const items = dt.items;
  
  console.log('Drop effect:', dt.dropEffect);
});
```

## Advanced Features

### Custom Drag Preview

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
    // Create custom preview
    const preview = this.createPreview();
    document.body.appendChild(preview);
    
    e.dataTransfer.setDragImage(
      preview,
      this.options.offsetX,
      this.options.offsetY
    );
    
    // Remove after drag starts
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

// Usage
new DragPreview(document.querySelector('.draggable'), {
  offsetX: 50,
  offsetY: 25
});
```

### Sortable List

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
    
    // Set placeholder size
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

// Usage
const sortable = new SortableList(document.querySelector('.sortable-list'));
```

### Multi-Column Kanban Board

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
    // Setup card dragging
    this.cards.forEach(card => {
      card.draggable = true;
      card.addEventListener('dragstart', (e) => this.handleCardDragStart(e, card));
      card.addEventListener('dragend', (e) => this.handleCardDragEnd(e, card));
    });
    
    // Setup column drop zones
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
    
    // Add source column identifier
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
    
    // Calculate insert position
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
    // Ensure leaving the entire dropzone
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
    
    // Trigger callback
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

// Usage
const board = new KanbanBoard(document.querySelector('.kanban-board'));

board.onCardMove = ({ cardId, from, to, position }) => {
  console.log(`Card ${cardId} moved from ${from} to ${to}, position ${position}`);
  // Update backend
  updateCardStatus(cardId, to, position);
};
```

## File Drop Upload

### Basic File Upload

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
    
    // Prevent default page drop behavior
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
      // Check count
      if (!this.options.multiple && validFiles.length >= 1) {
        errors.push({ file, error: 'Only one file allowed' });
        return;
      }
      
      // Check type
      if (!this.matchType(file.type)) {
        errors.push({ file, error: 'File type not supported' });
        return;
      }
      
      // Check size
      if (file.size > this.options.maxSize) {
        errors.push({ file, error: 'File too large' });
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
        // Extension match
        return type.endsWith(accept.slice(1));
      }
      if (accept.endsWith('/*')) {
        // MIME type prefix match
        return type.startsWith(accept.slice(0, -1));
      }
      return type === accept;
    });
  }
}

// Usage
const dropzone = new FileDropzone(document.querySelector('.file-dropzone'), {
  accept: 'image/*,.pdf',
  maxSize: 5 * 1024 * 1024,
  onDrop: (files) => {
    console.log('Received files:', files);
    uploadFiles(files);
  },
  onError: (errors) => {
    errors.forEach(({ file, error }) => {
      console.error(`${file.name}: ${error}`);
    });
  }
});
```

### Image Upload with Preview

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

// Usage
const imageDropzone = new ImageDropzone(
  document.querySelector('.image-dropzone'),
  {
    previewContainer: document.querySelector('.image-previews'),
    maxSize: 2 * 1024 * 1024
  }
);
```

## Touch Device Support

### Touch Drag Adapter

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
    
    // Long press to trigger drag
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
      
      // Cancel long press if moved too much
      if (dx > 10 || dy > 10) {
        clearTimeout(this.longPressTimer);
      }
      return;
    }
    
    e.preventDefault();
    const touch = e.touches[0];
    this.currentX = touch.clientX;
    this.currentY = touch.clientY;
    
    // Move element
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

// Combined with native drag and drop
class UnifiedDraggable {
  constructor(element, options = {}) {
    this.element = element;
    this.options = options;
    
    if ('ontouchstart' in window) {
      this.touchHandler = new TouchDraggable(element, options);
    }
    
    // Also support native drag and drop
    element.draggable = true;
    element.addEventListener('dragstart', (e) => options.onDragStart?.(element, e));
    element.addEventListener('drag', (e) => options.onDrag?.(element, e));
    element.addEventListener('dragend', (e) => options.onDragEnd?.(element, e));
  }
}
```

## Best Practices Summary

```
Drag and Drop API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Interaction Design                                │
│   ├── Provide clear visual feedback                │
│   ├── Show drop target areas                       │
│   ├── Use appropriate cursor styles                │
│   └── Support keyboard accessibility               │
│                                                     │
│   Performance Optimization                          │
│   ├── Avoid complex operations in drag events      │
│   ├── Use throttling for position updates          │
│   ├── Set appropriate drag images                  │
│   └── Minimize DOM operations                      │
│                                                     │
│   Compatibility                                     │
│   ├── Handle touch devices                         │
│   ├── Provide fallback solutions                   │
│   ├── Test across browsers                         │
│   └── Consider mobile experience                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Event | Trigger | Target |
|-------|---------|--------|
| dragstart | Drag starts | Dragged element |
| drag | During drag | Dragged element |
| dragend | Drag ends | Dragged element |
| dragenter | Enter drop zone | Drop target |
| dragover | Over drop zone | Drop target |
| dragleave | Leave drop zone | Drop target |
| drop | Drop | Drop target |

---

*Master the Drag and Drop API to create intuitive interaction experiences.*
