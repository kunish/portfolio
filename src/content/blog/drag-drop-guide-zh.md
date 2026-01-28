---
title: 'HTML5 拖拽功能完全指南：从原生 API 到实战应用'
description: '掌握 Drag and Drop API、文件上传、列表排序和跨窗口拖拽'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'drag-drop-guide'
---

拖拽是提升用户体验的重要交互方式。本文探讨 HTML5 原生拖拽 API 的使用方法。

## 拖拽基础

### 核心概念

```
拖拽事件流程：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   可拖拽元素 (Draggable)                           │
│   ├── dragstart  拖拽开始                          │
│   ├── drag       拖拽进行中（持续触发）            │
│   └── dragend    拖拽结束                          │
│                                                     │
│   放置目标 (Drop Target)                           │
│   ├── dragenter  进入目标区域                      │
│   ├── dragover   在目标区域移动（需阻止默认）      │
│   ├── dragleave  离开目标区域                      │
│   └── drop       放置（需阻止默认）                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 事件 | 触发时机 | 触发对象 |
|------|----------|----------|
| dragstart | 开始拖拽 | 被拖元素 |
| dragover | 在目标上方 | 放置目标 |
| drop | 释放鼠标 | 放置目标 |
| dragend | 拖拽结束 | 被拖元素 |

### 基础实现

```html
<!-- 可拖拽元素 -->
<div id="draggable" draggable="true">
  拖动我
</div>

<!-- 放置目标 -->
<div id="dropzone">
  放置区域
</div>
```

```typescript
const draggable = document.getElementById('draggable')!;
const dropzone = document.getElementById('dropzone')!;

// 拖拽开始
draggable.addEventListener('dragstart', (e: DragEvent) => {
  // 设置拖拽数据
  e.dataTransfer!.setData('text/plain', draggable.id);
  e.dataTransfer!.effectAllowed = 'move';

  // 添加拖拽样式
  draggable.classList.add('dragging');
});

// 拖拽结束
draggable.addEventListener('dragend', () => {
  draggable.classList.remove('dragging');
});

// 进入放置区域
dropzone.addEventListener('dragenter', (e: DragEvent) => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
});

// 在放置区域上方（必须阻止默认行为才能触发 drop）
dropzone.addEventListener('dragover', (e: DragEvent) => {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
});

// 离开放置区域
dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('drag-over');
});

// 放置
dropzone.addEventListener('drop', (e: DragEvent) => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');

  const id = e.dataTransfer!.getData('text/plain');
  const element = document.getElementById(id);

  if (element) {
    dropzone.appendChild(element);
  }
});
```

## DataTransfer 详解

### 数据类型

```typescript
// 设置多种数据类型
draggable.addEventListener('dragstart', (e: DragEvent) => {
  const dt = e.dataTransfer!;

  // 纯文本
  dt.setData('text/plain', '这是文本内容');

  // HTML
  dt.setData('text/html', '<strong>粗体文本</strong>');

  // URI
  dt.setData('text/uri-list', 'https://example.com');

  // 自定义类型
  dt.setData('application/json', JSON.stringify({
    id: 123,
    name: 'Item'
  }));
});

// 获取数据
dropzone.addEventListener('drop', (e: DragEvent) => {
  e.preventDefault();
  const dt = e.dataTransfer!;

  // 获取特定类型
  const text = dt.getData('text/plain');
  const html = dt.getData('text/html');
  const json = JSON.parse(dt.getData('application/json') || '{}');

  // 获取所有类型
  console.log('可用类型:', dt.types);
});
```

### 拖拽效果

```typescript
draggable.addEventListener('dragstart', (e: DragEvent) => {
  const dt = e.dataTransfer!;

  // 允许的效果
  // 'none' | 'copy' | 'link' | 'move' | 'copyMove' | 'copyLink' | 'linkMove' | 'all'
  dt.effectAllowed = 'copyMove';
});

dropzone.addEventListener('dragover', (e: DragEvent) => {
  e.preventDefault();

  // 设置放置效果
  // 'none' | 'copy' | 'link' | 'move'
  e.dataTransfer!.dropEffect = 'copy';
});
```

### 自定义拖拽图像

```typescript
draggable.addEventListener('dragstart', (e: DragEvent) => {
  // 使用现有元素
  const ghost = document.getElementById('drag-ghost')!;
  e.dataTransfer!.setDragImage(ghost, 10, 10);

  // 或创建新元素
  const img = new Image();
  img.src = 'drag-icon.png';
  e.dataTransfer!.setDragImage(img, 25, 25);
});
```

## 文件拖拽上传

### 基础文件拖拽

```typescript
const uploadZone = document.getElementById('upload-zone')!;

uploadZone.addEventListener('dragover', (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  uploadZone.classList.remove('drag-over');

  const files = e.dataTransfer!.files;

  for (const file of files) {
    console.log('文件名:', file.name);
    console.log('大小:', file.size);
    console.log('类型:', file.type);

    // 上传文件
    uploadFile(file);
  }
});

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  return response.json();
}
```

### 图片预览

```typescript
function handleImageDrop(file: File) {
  if (!file.type.startsWith('image/')) {
    console.error('请选择图片文件');
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const img = document.createElement('img');
    img.src = e.target!.result as string;
    img.className = 'preview-image';

    document.getElementById('preview')!.appendChild(img);
  };

  reader.readAsDataURL(file);
}
```

### 文件夹拖拽

```typescript
uploadZone.addEventListener('drop', async (e: DragEvent) => {
  e.preventDefault();

  const items = e.dataTransfer!.items;

  for (const item of items) {
    const entry = item.webkitGetAsEntry();

    if (entry) {
      await processEntry(entry);
    }
  }
});

async function processEntry(entry: FileSystemEntry): Promise<void> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    const file = await new Promise<File>((resolve) => {
      fileEntry.file(resolve);
    });
    console.log('文件:', file.name);
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();

    const entries = await new Promise<FileSystemEntry[]>((resolve) => {
      reader.readEntries(resolve);
    });

    for (const childEntry of entries) {
      await processEntry(childEntry);
    }
  }
}
```

## 列表排序

### 可排序列表

```typescript
interface SortableConfig {
  container: HTMLElement;
  onSort: (oldIndex: number, newIndex: number) => void;
}

class SortableList {
  private container: HTMLElement;
  private draggedItem: HTMLElement | null = null;
  private placeholder: HTMLElement;
  private onSort: (oldIndex: number, newIndex: number) => void;

  constructor(config: SortableConfig) {
    this.container = config.container;
    this.onSort = config.onSort;
    this.placeholder = this.createPlaceholder();
    this.init();
  }

  private createPlaceholder(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'sortable-placeholder';
    return el;
  }

  private init() {
    const items = this.container.querySelectorAll('[draggable="true"]');

    items.forEach((item) => {
      item.addEventListener('dragstart', this.handleDragStart.bind(this));
      item.addEventListener('dragend', this.handleDragEnd.bind(this));
      item.addEventListener('dragover', this.handleDragOver.bind(this));
      item.addEventListener('drop', this.handleDrop.bind(this));
    });
  }

  private handleDragStart(e: DragEvent) {
    this.draggedItem = e.target as HTMLElement;
    this.draggedItem.classList.add('dragging');

    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', '');

    // 延迟添加占位符
    setTimeout(() => {
      this.draggedItem!.style.display = 'none';
      this.draggedItem!.parentNode!.insertBefore(
        this.placeholder,
        this.draggedItem!.nextSibling
      );
    }, 0);
  }

  private handleDragEnd() {
    if (this.draggedItem) {
      this.draggedItem.style.display = '';
      this.draggedItem.classList.remove('dragging');
      this.placeholder.remove();
      this.draggedItem = null;
    }
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';

    const target = e.target as HTMLElement;
    const item = target.closest('[draggable="true"]') as HTMLElement;

    if (item && item !== this.draggedItem) {
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (e.clientY < midY) {
        item.parentNode!.insertBefore(this.placeholder, item);
      } else {
        item.parentNode!.insertBefore(this.placeholder, item.nextSibling);
      }
    }
  }

  private handleDrop(e: DragEvent) {
    e.preventDefault();

    if (this.draggedItem) {
      this.placeholder.parentNode!.insertBefore(
        this.draggedItem,
        this.placeholder
      );

      // 计算新旧索引
      const items = Array.from(
        this.container.querySelectorAll('[draggable="true"]')
      );
      const newIndex = items.indexOf(this.draggedItem);

      this.onSort(0, newIndex);
    }
  }
}

// 使用
new SortableList({
  container: document.getElementById('sortable-list')!,
  onSort: (oldIndex, newIndex) => {
    console.log(`从 ${oldIndex} 移动到 ${newIndex}`);
  }
});
```

## React 实现

### 拖拽组件

```tsx
import { useState, useRef, DragEvent } from 'react';

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
}

function DraggableItem({ id, children }: DraggableItemProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={isDragging ? 'dragging' : ''}
    >
      {children}
    </div>
  );
}

interface DropZoneProps {
  onDrop: (id: string) => void;
  children: React.ReactNode;
}

function DropZone({ onDrop, children }: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const id = e.dataTransfer.getData('text/plain');
    onDrop(id);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={isOver ? 'drag-over' : ''}
    >
      {children}
    </div>
  );
}
```

## 最佳实践总结

```
拖拽最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   用户体验                                          │
│   ├── 提供清晰的视觉反馈                           │
│   ├── 显示拖拽预览图                               │
│   ├── 高亮有效放置区域                             │
│   └── 支持键盘操作作为替代                         │
│                                                     │
│   性能优化                                          │
│   ├── 使用事件委托                                 │
│   ├── 节流 dragover 处理                           │
│   ├── 避免频繁 DOM 操作                            │
│   └── 使用 transform 而非改变位置                  │
│                                                     │
│   无障碍                                            │
│   ├── 提供非拖拽替代方案                           │
│   ├── 使用 ARIA 属性                               │
│   ├── 支持屏幕阅读器                               │
│   └── 确保焦点管理正确                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 建议 |
|------|------|
| 文件上传 | 支持点击 + 拖拽 |
| 列表排序 | 使用成熟库 |
| 看板应用 | 考虑触摸支持 |
| 跨窗口拖拽 | 使用 dataTransfer |

---

*好的拖拽交互让操作直观自然。*
