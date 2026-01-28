---
title: 'Web Accessibility Practical Guide: Making Your Site Usable for Everyone'
description: 'Master the core principles and practical techniques of web accessibility to build websites friendly to all users'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'web-accessibility-guide'
---

Approximately 15% of the world's population (over 1 billion people) has some form of disability. Web accessibility (a11y) ensures these users can equally access and use websites. More importantly, good accessibility design benefits all users.

## Why Does Accessibility Matter?

### Not Just for "Minorities"

```
Users who need accessibility support:
┌─────────────────────────────────────────────────────┐
│ Permanent Disabilities                              │
│ ├─ Visual (blindness, low vision, color blindness) │
│ ├─ Auditory (deaf, hard of hearing)                │
│ ├─ Motor (cannot use mouse)                        │
│ └─ Cognitive (dyslexia, attention disorders)       │
│                                                     │
│ Temporary Disabilities                              │
│ ├─ Broken arm (cannot use mouse)                   │
│ ├─ After eye surgery (limited vision)              │
│ └─ Noisy environment (cannot hear audio)           │
│                                                     │
│ Situational Disabilities                            │
│ ├─ Phone in sunlight (contrast issues)             │
│ ├─ Holding a baby, one-handed operation            │
│ └─ Slow internet (needs lightweight pages)         │
└─────────────────────────────────────────────────────┘
```

### Business Value

- **Larger user base**: 15% potential users
- **SEO improvement**: Accessible sites are search engine friendly
- **Legal compliance**: Many countries have accessibility laws
- **Better code quality**: Semantic HTML = more maintainable

## Semantic HTML: The Foundation of Accessibility

### Use the Right Elements

```html
<!-- ❌ Wrong: Using div to simulate button -->
<div class="button" onclick="submit()">Submit</div>

<!-- ✅ Correct: Use semantic button -->
<button type="submit">Submit</button>

<!-- ❌ Wrong: Using div for navigation -->
<div class="nav">
  <div class="nav-item">Home</div>
  <div class="nav-item">About</div>
</div>

<!-- ✅ Correct: Use nav and a -->
<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>
```

### Heading Hierarchy

```html
<!-- ❌ Wrong: Skipping heading levels -->
<h1>Site Title</h1>
<h3>Section Title</h3>  <!-- Skipped h2 -->
<h5>Subsection Title</h5>  <!-- Skipped h4 -->

<!-- ✅ Correct: Sequential heading levels -->
<h1>Site Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>
```

### Landmark Regions

```html
<body>
  <header>
    <nav aria-label="Main navigation">...</nav>
  </header>

  <main>
    <article>
      <h1>Article Title</h1>
      ...
    </article>

    <aside aria-label="Related articles">
      ...
    </aside>
  </main>

  <footer>
    <nav aria-label="Footer navigation">...</nav>
  </footer>
</body>
```

## Keyboard Accessibility

### Ensure All Features Work with Keyboard

```html
<!-- Custom dropdown needs keyboard support -->
<div
  role="button"
  tabindex="0"
  onkeydown="handleKeyDown(event)"
  onclick="toggleMenu()"
>
  Menu
</div>

<script>
function handleKeyDown(event) {
  // Enter or Space activates
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggleMenu();
  }
  // Escape closes
  if (event.key === 'Escape') {
    closeMenu();
  }
}
</script>
```

### Focus Management

```css
/* ❌ Wrong: Removing focus styles */
*:focus {
  outline: none;
}

/* ✅ Correct: Custom but visible focus styles */
*:focus {
  outline: none;
}

*:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

### Focus Trap (Modal)

```javascript
// Focus management in modals
function openModal(modal) {
  // Save previous focus position
  const previouslyFocused = document.activeElement;

  // Get all focusable elements in modal
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Focus first element
  firstElement.focus();

  // Listen for Tab key, keep focus within modal
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    // Escape closes modal
    if (e.key === 'Escape') {
      closeModal(modal);
      previouslyFocused.focus();
    }
  });
}
```

## ARIA: When HTML Isn't Enough

### ARIA Roles

```html
<!-- Tab interface -->
<div role="tablist">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="panel-1"
    id="tab-1"
  >
    Tab 1
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-2"
    id="tab-2"
  >
    Tab 2
  </button>
</div>

<div
  role="tabpanel"
  id="panel-1"
  aria-labelledby="tab-1"
>
  Content 1
</div>

<div
  role="tabpanel"
  id="panel-2"
  aria-labelledby="tab-2"
  hidden
>
  Content 2
</div>
```

### ARIA States and Properties

```html
<!-- Expand/Collapse -->
<button
  aria-expanded="false"
  aria-controls="details"
>
  Show Details
</button>
<div id="details" hidden>
  Detailed content...
</div>

<!-- Loading state -->
<button aria-busy="true" disabled>
  <span class="spinner"></span>
  Loading...
</button>

<!-- Error message -->
<input
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<div id="email-error" role="alert">
  Please enter a valid email address
</div>
```

### Live Regions

```html
<!-- Notify users of dynamic changes -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <!-- Screen reader announces when content changes -->
  Saved
</div>

<!-- Urgent notification -->
<div role="alert" aria-live="assertive">
  Your session is about to expire, please save your work!
</div>
```

### Golden Rules of ARIA

```html
<!-- Rule 1: Use HTML if possible, not ARIA -->
<!-- ❌ -->
<div role="button" tabindex="0">Click</div>
<!-- ✅ -->
<button>Click</button>

<!-- Rule 2: Don't change native semantics -->
<!-- ❌ -->
<h1 role="button">Heading</h1>
<!-- ✅ -->
<h1><button>Heading</button></h1>

<!-- Rule 3: All interactive elements must be keyboard accessible -->
<!-- If you add role="button", must also handle keyboard events -->
```

## Images and Media

### Image Alternative Text

```html
<!-- Informative image: Describe content -->
<img src="chart.png" alt="Bar chart showing 40% sales growth in 2024">

<!-- Decorative image: Empty alt -->
<img src="decoration.png" alt="">

<!-- Complex image: Detailed description -->
<figure>
  <img src="flowchart.png" alt="User registration flowchart">
  <figcaption>
    Process: Fill form → Verify email → Complete registration
  </figcaption>
</figure>

<!-- Icon button -->
<button aria-label="Close">
  <svg aria-hidden="true">...</svg>
</button>
```

### Video and Audio

```html
<!-- Video needs captions and descriptions -->
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track
    kind="captions"
    src="captions-en.vtt"
    srclang="en"
    label="English Captions"
    default
  >
  <track
    kind="descriptions"
    src="descriptions.vtt"
    srclang="en"
    label="Video Descriptions"
  >
</video>

<!-- Provide text alternative -->
<details>
  <summary>Video Transcript</summary>
  <p>Full text description of video content...</p>
</details>
```

## Form Accessibility

### Label Association

```html
<!-- Explicit association -->
<label for="email">Email Address</label>
<input type="email" id="email" name="email">

<!-- Implicit association -->
<label>
  Email Address
  <input type="email" name="email">
</label>

<!-- Required field -->
<label for="name">
  Name
  <span aria-hidden="true">*</span>
</label>
<input
  type="text"
  id="name"
  required
  aria-required="true"
>
```

### Error Handling

```html
<form novalidate>
  <div class="field">
    <label for="email">Email</label>
    <input
      type="email"
      id="email"
      aria-invalid="true"
      aria-describedby="email-error email-hint"
    >
    <p id="email-hint" class="hint">
      We won't share your email
    </p>
    <p id="email-error" class="error" role="alert">
      Please enter a valid email address
    </p>
  </div>

  <button type="submit">Submit</button>
</form>

<style>
  .error {
    color: #d32f2f;
  }

  input[aria-invalid="true"] {
    border-color: #d32f2f;
  }
</style>
```

### Grouping Fields

```html
<fieldset>
  <legend>Shipping Address</legend>

  <label for="street">Street</label>
  <input type="text" id="street">

  <label for="city">City</label>
  <input type="text" id="city">
</fieldset>

<fieldset>
  <legend>Payment Method</legend>

  <label>
    <input type="radio" name="payment" value="card">
    Credit Card
  </label>

  <label>
    <input type="radio" name="payment" value="paypal">
    PayPal
  </label>
</fieldset>
```

## Color and Contrast

### Color Contrast Requirements

```
WCAG 2.1 Standards:
┌─────────────────────────────────────────────────────┐
│ Level AA (Minimum)                                  │
│ ├─ Normal text: 4.5:1                               │
│ └─ Large text (18px+ or 14px bold): 3:1            │
│                                                     │
│ Level AAA (Recommended)                             │
│ ├─ Normal text: 7:1                                 │
│ └─ Large text: 4.5:1                                │
└─────────────────────────────────────────────────────┘
```

### Don't Rely Only on Color

```html
<!-- ❌ Only using color to indicate state -->
<span style="color: red">Error</span>
<span style="color: green">Success</span>

<!-- ✅ Color + Icon + Text -->
<span class="error">
  <svg aria-hidden="true">❌</svg>
  Error: Please fill this field
</span>
<span class="success">
  <svg aria-hidden="true">✓</svg>
  Success: Saved
</span>
```

## Testing Tools

### Automated Testing

```bash
# axe-core - Most popular accessibility testing library
npm install axe-core

# Lighthouse CLI
npm install -g lighthouse
lighthouse https://example.com --only-categories=accessibility

# Pa11y
npm install -g pa11y
pa11y https://example.com
```

```javascript
// Integrate axe-core in tests
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('page should have no accessibility issues', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing Checklist

```
□ Navigate entire site using only keyboard
□ Test with screen reader (VoiceOver, NVDA)
□ Zoom page to 200% and check layout
□ Check contrast in grayscale mode
□ Verify alt text for all images
□ Test form error message accessibility
□ Test keyboard operation for custom components
```

## Accessibility in React

```tsx
// Use semantic components
function Navigation() {
  return (
    <nav aria-label="Main navigation">
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
      </ul>
    </nav>
  );
}

// Use Fragment to avoid extra divs
function List({ items }) {
  return (
    <>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </>
  );
}

// Handle focus
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

## Summary

Web accessibility isn't optional—it's a responsibility:

| Area | Key Practices |
|------|---------------|
| HTML | Use semantic elements |
| Keyboard | Ensure all features work with keyboard |
| ARIA | Supplement semantics when HTML isn't enough |
| Visual | Ensure sufficient color contrast |
| Media | Provide alt text and captions |
| Forms | Properly associate labels and errors |

**Key Takeaways**:

1. Semantic HTML is the foundation of accessibility
2. All interactions must support keyboard operation
3. ARIA supplements, doesn't replace HTML
4. Color cannot be the only way to convey information
5. Automated testing + Manual testing = Complete coverage

Accessibility isn't a one-time task—it's an ongoing commitment. Making your product usable by everyone is both a technological responsibility and a human consideration.

---

*Truly excellent design is inclusive design. Let's build a more accessible Web together.*
