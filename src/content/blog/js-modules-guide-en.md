---
title: 'JavaScript Module Systems: From CommonJS to ESM'
description: 'Deep dive into JavaScript modules: ESM, CommonJS, dynamic imports and bundling'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'js-modules-guide'
---

The JavaScript module system is fundamental to modern frontend development. This article covers various module specifications and their usage.

## Module Evolution

### Historical Background

```
JavaScript Module Evolution:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Early Days (No Modules)                           │
│   └── Global variables, IIFE, Namespaces           │
│                                                     │
│   CommonJS (2009)                                   │
│   └── Adopted by Node.js, require/module.exports   │
│                                                     │
│   AMD (2010)                                        │
│   └── RequireJS, async loading                     │
│                                                     │
│   UMD (2011)                                        │
│   └── Compatible with CommonJS and AMD             │
│                                                     │
│   ESM (2015)                                        │
│   └── ES6 native modules, import/export            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## ES Modules (ESM)

### Export Syntax

```javascript
// named-exports.js
// Named exports - can have multiple
export const PI = 3.14159;
export const E = 2.71828;

export function add(a, b) {
  return a + b;
}

export class Calculator {
  multiply(a, b) {
    return a * b;
  }
}

// Declare first, export later
const subtract = (a, b) => a - b;
const divide = (a, b) => a / b;

export { subtract, divide };

// Renamed export
export { subtract as minus };
```

### Default Export

```javascript
// default-export.js
// Each module can have only one default export

// Method 1: Direct export
export default function greet(name) {
  return `Hello, ${name}!`;
}

// Method 2: Declare then export
function greet(name) {
  return `Hello, ${name}!`;
}
export default greet;

// Method 3: Anonymous export
export default class {
  constructor(name) {
    this.name = name;
  }
}

// Mixed exports
export default function main() {}
export const helper = () => {};
```

### Import Syntax

```javascript
// Import named exports
import { add, subtract } from './math.js';
import { add as addition } from './math.js';  // Rename

// Import default export
import greet from './greet.js';
import MyClass from './my-class.js';

// Import all
import * as math from './math.js';
console.log(math.add(1, 2));
console.log(math.PI);

// Mixed imports
import greet, { helper } from './module.js';

// Side-effect imports
import './polyfills.js';
import './styles.css';
```

### Dynamic Imports

```javascript
// Conditional import
async function loadModule(condition) {
  if (condition) {
    const module = await import('./heavy-module.js');
    return module.default;
  }
}

// Route lazy loading
const routes = {
  '/home': () => import('./pages/Home.js'),
  '/about': () => import('./pages/About.js'),
  '/contact': () => import('./pages/Contact.js')
};

async function loadRoute(path) {
  const loader = routes[path];
  if (loader) {
    const module = await loader();
    return module.default;
  }
}

// Load on user action
button.addEventListener('click', async () => {
  const { heavyFunction } = await import('./heavy.js');
  heavyFunction();
});
```

## CommonJS

### Basic Syntax

```javascript
// math.js - CommonJS exports
const PI = 3.14159;

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

// Single export
module.exports = { PI, add, subtract };

// Or attach individually
exports.PI = PI;
exports.add = add;
exports.subtract = subtract;

// Note: Cannot directly assign to exports
exports = { PI };  // Wrong! Won't work
```

### Import Methods

```javascript
// Import entire module
const math = require('./math.js');
console.log(math.add(1, 2));

// Destructured import
const { add, subtract } = require('./math.js');

// Conditional import (CommonJS supports this)
if (process.env.NODE_ENV === 'development') {
  const debug = require('./debug.js');
  debug.init();
}
```

### ESM vs CommonJS

```
ESM vs CommonJS Comparison:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Loading Time                                      │
│   ├── ESM: Static analysis, compile-time deps      │
│   └── CJS: Runtime loading, dynamic deps           │
│                                                     │
│   Export Binding                                    │
│   ├── ESM: Exports are references (live binding)   │
│   └── CJS: Exports are value copies                │
│                                                     │
│   Top-level this                                    │
│   ├── ESM: this is undefined                       │
│   └── CJS: this is module.exports                  │
│                                                     │
│   Async Support                                     │
│   ├── ESM: Supports top-level await                │
│   └── CJS: No top-level await support              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Module Interop

### Using CommonJS in ESM

```javascript
// In Node.js, ESM importing CJS
import cjsModule from './cjs-module.cjs';

// Note: CJS default export becomes ESM default
import pkg from 'some-cjs-package';
const { someMethod } = pkg;

// Or use createRequire
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cjsModule = require('./cjs-module.cjs');
```

### Using ESM in CommonJS

```javascript
// Dynamic import ESM in CJS
async function loadESM() {
  const esmModule = await import('./esm-module.mjs');
  return esmModule.default;
}

// At top level
(async () => {
  const { namedExport } = await import('./esm-module.mjs');
  console.log(namedExport);
})();
```

### Package.json Configuration

```json
{
  "name": "my-package",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs"
    }
  },
  "files": ["dist"]
}
```

## Module Design Patterns

### Barrel Files

```javascript
// components/index.js - Barrel file
export { Button } from './Button.js';
export { Input } from './Input.js';
export { Modal } from './Modal.js';
export { Dropdown } from './Dropdown.js';

// Usage
import { Button, Input, Modal } from './components';
```

### Factory Pattern

```javascript
// logger-factory.js
export function createLogger(prefix) {
  return {
    log: (msg) => console.log(`[${prefix}] ${msg}`),
    error: (msg) => console.error(`[${prefix}] ERROR: ${msg}`),
    warn: (msg) => console.warn(`[${prefix}] WARN: ${msg}`)
  };
}

// Usage
import { createLogger } from './logger-factory.js';
const logger = createLogger('App');
logger.log('Started');
```

### Singleton Pattern

```javascript
// singleton.js
class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    this.connection = null;
    Database.instance = this;
  }

  connect(url) {
    this.connection = url;
    console.log(`Connected to ${url}`);
  }
}

export const db = new Database();

// Or use module feature (modules execute once)
let instance = null;

export function getDatabase() {
  if (!instance) {
    instance = new Database();
  }
  return instance;
}
```

### Dependency Injection

```javascript
// service.js
export function createService(dependencies) {
  const { logger, http, config } = dependencies;

  return {
    async fetchData() {
      logger.log('Fetching data...');
      const response = await http.get(config.apiUrl);
      return response.data;
    }
  };
}

// main.js
import { createService } from './service.js';
import { createLogger } from './logger.js';
import { createHttp } from './http.js';
import config from './config.js';

const service = createService({
  logger: createLogger('Service'),
  http: createHttp(),
  config
});
```

## Build Tool Integration

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`
    }
  }
});
```

### TypeScript Modules

```typescript
// types.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

// Type-only import (not included at runtime)
import type { User, UserRole } from './types';

// Mixed import
import { createUser, type User } from './user';
```

## Best Practices Summary

```
Module Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Export Guidelines                                 │
│   ├── Prefer named exports                         │
│   ├── One module, one responsibility               │
│   ├── Avoid circular dependencies                  │
│   └── Use barrel files for public API              │
│                                                     │
│   Import Guidelines                                 │
│   ├── Imports at top of file                       │
│   ├── Group by source (built-in, 3rd party, local)│
│   ├── Use path aliases to simplify imports         │
│   └── Import only what you need                    │
│                                                     │
│   Performance                                       │
│   ├── Use dynamic imports for code splitting       │
│   ├── Tree-shaking removes unused code             │
│   └── Preload critical modules                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Spec | Syntax | Use Case |
|------|--------|----------|
| ESM | import/export | Modern browsers, modern Node.js |
| CommonJS | require/exports | Traditional Node.js projects |
| Dynamic Import | import() | Code splitting, lazy loading |

---

*Modularity is the cornerstone of maintainability in large applications.*
