---
title: 'Web Components: Building Native Reusable Components'
description: 'Master Custom Elements, Shadow DOM, HTML Templates and cross-framework component development'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'web-components-guide'
---

Web Components enable you to create framework-agnostic native components. This article explores core technologies and best practices.

## Web Components Overview

### Three Core Technologies

```
Web Components Architecture:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Custom Elements                                   │
│   └── Define custom HTML tags                      │
│                                                     │
│   Shadow DOM                                        │
│   └── Style and DOM encapsulation                  │
│                                                     │
│   HTML Templates                                    │
│   └── Reusable template fragments                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Feature | Benefit | Use Case |
|---------|---------|----------|
| Native support | No framework needed | Cross-project reuse |
| Style isolation | No global pollution | Micro-frontends |
| Framework agnostic | Universal | Design systems |

## Custom Elements

### Basic Component

```typescript
// Define a custom element
class MyButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // When component mounts
  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  // When component unmounts
  disconnectedCallback() {
    this.cleanup();
  }

  // Observed attributes
  static get observedAttributes() {
    return ['variant', 'disabled'];
  }

  // When attributes change
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  private render() {
    const variant = this.getAttribute('variant') || 'primary';
    const disabled = this.hasAttribute('disabled');

    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        button.primary {
          background: #3b82f6;
          color: white;
        }
        button.primary:hover {
          background: #2563eb;
        }
        button.secondary {
          background: #e5e7eb;
          color: #374151;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>
      <button class="${variant}" ${disabled ? 'disabled' : ''}>
        <slot></slot>
      </button>
    `;
  }

  private setupEventListeners() {
    const button = this.shadowRoot!.querySelector('button');
    button?.addEventListener('click', (e) => {
      if (!this.hasAttribute('disabled')) {
        this.dispatchEvent(new CustomEvent('my-click', {
          bubbles: true,
          composed: true,
          detail: { timestamp: Date.now() }
        }));
      }
    });
  }

  private cleanup() {
    // Clean up event listeners, etc.
  }
}

// Register the component
customElements.define('my-button', MyButton);
```

### Using the Component

```html
<!-- Use in HTML -->
<my-button variant="primary">Click Me</my-button>
<my-button variant="secondary" disabled>Disabled</my-button>

<script>
  document.querySelector('my-button').addEventListener('my-click', (e) => {
    console.log('Button clicked', e.detail);
  });
</script>
```

## Shadow DOM

### Style Encapsulation

```typescript
class StyledCard extends HTMLElement {
  constructor() {
    super();
    // Create Shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
      <style>
        /* These styles only apply inside the component */
        :host {
          display: block;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        /* Style based on attributes */
        :host([elevated]) {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        /* Context-based styles */
        :host-context(.dark-theme) {
          border-color: #374151;
          background: #1f2937;
        }

        .header {
          padding: 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .content {
          padding: 16px;
        }

        /* Style slotted content */
        ::slotted(h3) {
          margin: 0;
          font-size: 18px;
        }
      </style>

      <div class="header">
        <slot name="header"></slot>
      </div>
      <div class="content">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('styled-card', StyledCard);
```

### Using Slots

```html
<styled-card elevated>
  <h3 slot="header">Card Title</h3>
  <p>This is the card content in the default slot.</p>
  <p>Multiple elements are allowed.</p>
</styled-card>
```

## HTML Templates

### Template Definition

```html
<!-- Define template in HTML -->
<template id="user-card-template">
  <style>
    .user-card {
      display: flex;
      align-items: center;
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin-right: 12px;
    }
    .info h4 {
      margin: 0 0 4px;
    }
    .info p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
  <div class="user-card">
    <img class="avatar" />
    <div class="info">
      <h4></h4>
      <p></p>
    </div>
  </div>
</template>
```

### Using Templates

```typescript
class UserCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Clone template content
    const template = document.getElementById('user-card-template') as HTMLTemplateElement;
    const content = template.content.cloneNode(true);
    this.shadowRoot!.appendChild(content);
  }

  connectedCallback() {
    this.updateCard();
  }

  static get observedAttributes() {
    return ['name', 'email', 'avatar'];
  }

  attributeChangedCallback() {
    this.updateCard();
  }

  private updateCard() {
    const name = this.getAttribute('name') || '';
    const email = this.getAttribute('email') || '';
    const avatar = this.getAttribute('avatar') || '';

    const root = this.shadowRoot!;
    root.querySelector('.avatar')?.setAttribute('src', avatar);
    root.querySelector('h4')!.textContent = name;
    root.querySelector('p')!.textContent = email;
  }
}

customElements.define('user-card', UserCard);
```

## Advanced Patterns

### Reactive Properties

```typescript
class ReactiveComponent extends HTMLElement {
  private _count = 0;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // Getter/Setter for reactivity
  get count() {
    return this._count;
  }

  set count(value: number) {
    this._count = value;
    this.render();
    this.dispatchEvent(new CustomEvent('count-changed', {
      detail: { count: value }
    }));
  }

  connectedCallback() {
    this.render();
  }

  private render() {
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        button {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 4px;
          background: #3b82f6;
          color: white;
          cursor: pointer;
        }
        span {
          min-width: 40px;
          text-align: center;
          font-size: 18px;
        }
      </style>
      <button id="dec">-</button>
      <span>${this.count}</span>
      <button id="inc">+</button>
    `;

    this.shadowRoot!.getElementById('dec')!.onclick = () => this.count--;
    this.shadowRoot!.getElementById('inc')!.onclick = () => this.count++;
  }
}

customElements.define('reactive-counter', ReactiveComponent);
```

### Form Integration

```typescript
class CustomInput extends HTMLElement {
  static formAssociated = true;
  private internals: ElementInternals;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  private render() {
    this.shadowRoot!.innerHTML = `
      <style>
        input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }
        input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      </style>
      <input type="text" />
    `;

    const input = this.shadowRoot!.querySelector('input')!;
    input.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.internals.setFormValue(value);
    });
  }

  // When form resets
  formResetCallback() {
    this.shadowRoot!.querySelector('input')!.value = '';
    this.internals.setFormValue('');
  }

  // Form validation
  get validity() {
    return this.internals.validity;
  }

  get validationMessage() {
    return this.internals.validationMessage;
  }
}

customElements.define('custom-input', CustomInput);
```

## Framework Integration

### Using in React

```tsx
// React wrapper
import React, { useRef, useEffect } from 'react';

interface MyButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: (e: CustomEvent) => void;
  children: React.ReactNode;
}

export function MyButtonWrapper({
  variant = 'primary',
  disabled = false,
  onClick,
  children
}: MyButtonProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element && onClick) {
      element.addEventListener('my-click', onClick as EventListener);
      return () => {
        element.removeEventListener('my-click', onClick as EventListener);
      };
    }
  }, [onClick]);

  return (
    <my-button
      ref={ref}
      variant={variant}
      disabled={disabled || undefined}
    >
      {children}
    </my-button>
  );
}

// Type declarations
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'my-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          variant?: string;
          disabled?: boolean;
        },
        HTMLElement
      >;
    }
  }
}
```

### Using in Vue

```vue
<template>
  <my-button
    :variant="variant"
    :disabled="disabled"
    @my-click="handleClick"
  >
    <slot></slot>
  </my-button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}>();

const emit = defineEmits<{
  click: [detail: { timestamp: number }];
}>();

function handleClick(e: CustomEvent) {
  emit('click', e.detail);
}
</script>
```

## Lit Framework

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('lit-button')
export class LitButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: var(--button-bg, #3b82f6);
      color: var(--button-color, white);
    }
    button:hover {
      filter: brightness(0.9);
    }
    :host([disabled]) button {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  @property({ type: String }) variant = 'primary';
  @property({ type: Boolean }) disabled = false;

  render() {
    return html`
      <button
        class=${this.variant}
        ?disabled=${this.disabled}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }

  private _handleClick() {
    if (!this.disabled) {
      this.dispatchEvent(new CustomEvent('lit-click', {
        bubbles: true,
        composed: true
      }));
    }
  }
}
```

## Best Practices Summary

```
Web Components Best Practices:
┌─────────────────────────────────────────────────────┐
│   Component Design                                  │
│   ├── Single responsibility principle              │
│   ├── Use meaningful tag names                     │
│   ├── Provide sensible defaults                    │
│   └── Sync attributes and properties               │
│                                                     │
│   Styling                                           │
│   ├── Use CSS variables for customization          │
│   ├── Proper use of :host and ::slotted            │
│   ├── Consider style piercing needs                │
│   └── Provide theming support                      │
│                                                     │
│   Performance                                       │
│   ├── Lazy load non-critical components            │
│   ├── Reuse template instances                     │
│   ├── Batch DOM updates                            │
│   └── Clean up event listeners                     │
│                                                     │
│   Accessibility                                     │
│   ├── Use semantic elements                        │
│   ├── Add ARIA attributes                          │
│   ├── Support keyboard navigation                  │
│   └── Manage focus                                 │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach |
|----------|---------------------|
| Simple components | Native API |
| Complex components | Lit framework |
| Design systems | Stencil |
| Cross-framework reuse | Web Components |

---

*Web Components are the native standard for building reusable UI. Frameworks come and go, but web standards endure.*
