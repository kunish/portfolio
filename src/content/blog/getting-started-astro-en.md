---
title: 'Getting Started with Astro'
description: 'Learn how to build fast, content-focused websites with Astro - the web framework for content-driven sites'
pubDate: 'Jan 20 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'getting-started-astro'
---

Astro is a modern web framework designed for building fast, content-focused websites. It's perfect for blogs, portfolios, documentation sites, and more.

## Why Choose Astro?

Astro offers several compelling advantages for developers:

### 1. Zero JavaScript by Default

Unlike traditional frameworks, Astro ships zero JavaScript to the browser by default. This means your pages load incredibly fast.

```javascript
// Your components render to HTML at build time
// No JavaScript needed unless you explicitly add it
```

### 2. Component Islands

Need interactivity? Astro's "Island Architecture" lets you add JavaScript components only where needed:

```astro
---
import ReactCounter from './Counter.jsx';
---

<!-- This component will be interactive -->
<ReactCounter client:visible />

<!-- This is just static HTML -->
<p>Static content here</p>
```

### 3. Bring Your Own Framework

Astro works with React, Vue, Svelte, and more. Use your favorite UI components:

- React
- Vue
- Svelte
- Solid
- Preact
- Lit

## Getting Started

Create a new Astro project:

```bash
npm create astro@latest
```

Follow the prompts to set up your project. Choose a template that fits your needs.

## Project Structure

A typical Astro project looks like this:

```
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   └── content/
├── public/
├── astro.config.mjs
└── package.json
```

## Conclusion

Astro is an excellent choice for building modern, performant websites. Its focus on content and minimal JavaScript makes it ideal for blogs and portfolios.

Give it a try and see how fast your sites can be!
