---
title: 'HTML5 Drag and Drop Complete Guide: From Native API to Practical Applications'
description: 'Master Drag and Drop API, file uploads, list sorting and cross-window dragging'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'drag-drop-guide'
---

Drag and drop is an important interaction for enhancing user experience. This article explores how to use HTML5 native drag and drop API.

## Drag and Drop Basics

### Core Concepts

```
Drag Event Flow:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Draggable Element                                 │
│   ├── dragstart  Drag begins                       │
│   ├── drag       Dragging (fires continuously)     │
│   └── dragend    Drag ends                         │
│                                                     │
│   Drop Target                                       │
│   ├── dragenter  Enter target area                 │
│   ├── dragover   Moving over target (prevent def)  │
│   ├── dragleave  Leave target area                 │
│   └── drop       Drop (prevent default)            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Event | Trigger | Target |
|-------|---------|--------|
| dragstart | Start dragging | Dragged element |
| dragover | Over target | Drop target |
| drop | Release mouse | Drop target |
| dragend | Drag ends | Dragged element |

### Basic Implementation

```html
<!-- Draggable element -->
<div id="draggable" draggable="true">
  Drag me
</div>

<!-- Drop target -->
<div id="dropzone">
  Drop zone
</div>
```

```typescript
const draggable = document.getElementById('draggable')!;
const dropzone = document.getElementById('dropzone')!;

// Drag start
draggable.addEventListener('dragstart', (e: DragEvent) => {
  e.dataTransfer!.setData('text/plain', draggable.id);
  e.dataTransfer!.effectAllowed = 'move';
  draggable.classList.add('dragging');
});

// Drag end
draggable.addEventListener('dragend', () => {
  draggable.classList.remove('dragging');
});

// Enter drop zone
dropzone.addEventListener('dragenter', (e: DragEvent) => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
});

// Over drop zone (must prevent default for drop to work)
dropzone.addEventListener('dragover', (e: DragEvent) => {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
});

// Leave drop zone
dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('drag-over');
});

// Drop
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

## DataTransfer Details

### Data Types

```typescript
// Set multiple data types
draggable.addEventListener('dragstart', (e: DragEvent) => {
  const dt = e.dataTransfer!;

  // Plain text
  dt.setData('text/plain', 'This is text content');

  // HTML
  dt.setData('text/html', '<strong>Bold text</strong>');

  // URI
  dt.setData('text/uri-list', 'https://example.com');

  // Custom type
  dt.setData('application/json', JSON.stringify({
    id: 123,
    name: 'Item'
  }));
});

// Get data
dropzone.addEventListener('drop', (e: DragEvent) => {
  e.preventDefault();
  const dt = e.dataTransfer!;

  const text = dt.getData('text/plain');
  const html = dt.getData('text/html');
  const json = JSON.parse(dt.getData('application/json') || '{}');

  console.log('Available types:', dt.types);
});
```

### Drag Effects

```typescript
draggable.addEventListener('dragstart', (e: DragEvent) => {
  const dt = e.dataTransfer!;

  // Allowed effects
  // 'none' | 'copy' | 'link' | 'move' | 'copyMove' | 'copyLink' | 'linkMove' | 'all'
  dt.effectAllowed = 'copyMove';
});

dropzone.addEventListener('dragover', (e: DragEvent) => {
  e.preventDefault();

  // Set drop effect
  // 'none' | 'copy' | 'link' | 'move'
  e.dataTransfer!.dropEffect = 'copy';
});
```

### Custom Drag Image

```typescript
draggable.addEventListener('dragstart', (e: DragEvent) => {
  // Use existing element
  const ghost = document.getElementById('drag-ghost')!;
  e.dataTransfer!.setDragImage(ghost, 10, 10);

  // Or create new element
  const img = new Image();
  img.src = 'drag-icon.png';
  e.dataTransfer!.setDragImage(img, 25, 25);
});
```

## File Drag Upload

### Basic File Drag

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
    console.log('Name:', file.name);
    console.log('Size:', file.size);
    console.log('Type:', file.type);
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

### Image Preview

```typescript
function handleImageDrop(file: File) {
  if (!file.type.startsWith('image/')) {
    console.error('Please select an image file');
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

### Folder Drag

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
    console.log('File:', file.name);
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

## List Sorting

### Sortable List

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

      const items = Array.from(
        this.container.querySelectorAll('[draggable="true"]')
      );
      const newIndex = items.indexOf(this.draggedItem);
      this.onSort(0, newIndex);
    }
  }
}

new SortableList({
  container: document.getElementById('sortable-list')!,
  onSort: (oldIndex, newIndex) => {
    console.log(`Moved from ${oldIndex} to ${newIndex}`);
  }
});
```

## React Implementation

### Draggable Components

```tsx
import { useState, DragEvent } from 'react';

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

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
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

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    onDrop(e.dataTransfer.getData('text/plain'));
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDragEnter={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={isOver ? 'drag-over' : ''}
    >
      {children}
    </div>
  );
}
```

## Best Practices Summary

```
Drag and Drop Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   User Experience                                   │
│   ├── Provide clear visual feedback                │
│   ├── Show drag preview image                      │
│   ├── Highlight valid drop zones                   │
│   └── Support keyboard as alternative              │
│                                                     │
│   Performance                                       │
│   ├── Use event delegation                         │
│   ├── Throttle dragover handlers                   │
│   ├── Avoid frequent DOM operations                │
│   └── Use transform instead of position            │
│                                                     │
│   Accessibility                                     │
│   ├── Provide non-drag alternatives                │
│   ├── Use ARIA attributes                          │
│   ├── Support screen readers                       │
│   └── Ensure proper focus management               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommendation |
|----------|----------------|
| File upload | Support click + drag |
| List sorting | Use mature libraries |
| Kanban apps | Consider touch support |
| Cross-window | Use dataTransfer |

---

*Good drag and drop makes interactions intuitive and natural.*
