---
title: 'JavaScript 模块系统完全指南：从 CommonJS 到 ESM'
description: '深入理解 JavaScript 模块化：ESM、CommonJS、动态导入和模块打包'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'js-modules-guide'
---

JavaScript 模块系统是现代前端开发的基础。本文详细介绍各种模块规范及其使用方法。

## 模块化演进

### 历史背景

```
JavaScript 模块化演进：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   早期（无模块）                                    │
│   └── 全局变量、IIFE、命名空间                     │
│                                                     │
│   CommonJS (2009)                                   │
│   └── Node.js 采用，require/module.exports         │
│                                                     │
│   AMD (2010)                                        │
│   └── RequireJS，异步加载                          │
│                                                     │
│   UMD (2011)                                        │
│   └── 兼容 CommonJS 和 AMD                         │
│                                                     │
│   ESM (2015)                                        │
│   └── ES6 原生模块，import/export                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## ES Modules (ESM)

### 导出语法

```javascript
// named-exports.js
// 命名导出 - 可以有多个
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

// 也可以先声明后导出
const subtract = (a, b) => a - b;
const divide = (a, b) => a / b;

export { subtract, divide };

// 重命名导出
export { subtract as minus };
```

### 默认导出

```javascript
// default-export.js
// 每个模块只能有一个默认导出

// 方式一：直接导出
export default function greet(name) {
  return `Hello, ${name}!`;
}

// 方式二：先声明后导出
function greet(name) {
  return `Hello, ${name}!`;
}
export default greet;

// 方式三：匿名导出
export default class {
  constructor(name) {
    this.name = name;
  }
}

// 混合导出
export default function main() {}
export const helper = () => {};
```

### 导入语法

```javascript
// 导入命名导出
import { add, subtract } from './math.js';
import { add as addition } from './math.js';  // 重命名

// 导入默认导出
import greet from './greet.js';
import MyClass from './my-class.js';

// 导入全部
import * as math from './math.js';
console.log(math.add(1, 2));
console.log(math.PI);

// 混合导入
import greet, { helper } from './module.js';

// 仅执行模块（副作用导入）
import './polyfills.js';
import './styles.css';
```

### 动态导入

```javascript
// 条件导入
async function loadModule(condition) {
  if (condition) {
    const module = await import('./heavy-module.js');
    return module.default;
  }
}

// 路由懒加载
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

// 基于用户操作加载
button.addEventListener('click', async () => {
  const { heavyFunction } = await import('./heavy.js');
  heavyFunction();
});
```

## CommonJS

### 基本语法

```javascript
// math.js - CommonJS 导出
const PI = 3.14159;

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

// 单个导出
module.exports = { PI, add, subtract };

// 或逐个挂载
exports.PI = PI;
exports.add = add;
exports.subtract = subtract;

// 注意：不能直接赋值 exports
exports = { PI };  // 错误！不会生效
```

### 导入方式

```javascript
// 导入整个模块
const math = require('./math.js');
console.log(math.add(1, 2));

// 解构导入
const { add, subtract } = require('./math.js');

// 条件导入（CommonJS 支持）
if (process.env.NODE_ENV === 'development') {
  const debug = require('./debug.js');
  debug.init();
}
```

### ESM vs CommonJS

```
ESM 与 CommonJS 对比：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   加载时机                                          │
│   ├── ESM：静态分析，编译时确定依赖                │
│   └── CJS：运行时加载，动态确定依赖                │
│                                                     │
│   导出绑定                                          │
│   ├── ESM：导出的是引用（live binding）            │
│   └── CJS：导出的是值的拷贝                        │
│                                                     │
│   this 指向                                         │
│   ├── ESM：顶层 this 是 undefined                  │
│   └── CJS：顶层 this 是 module.exports             │
│                                                     │
│   异步支持                                          │
│   ├── ESM：支持顶层 await                          │
│   └── CJS：不支持顶层 await                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 模块互操作

### ESM 中使用 CommonJS

```javascript
// Node.js 中 ESM 导入 CJS
import cjsModule from './cjs-module.cjs';

// 注意：CJS 默认导出会成为 ESM 的 default
import pkg from 'some-cjs-package';
const { someMethod } = pkg;

// 或使用 createRequire
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cjsModule = require('./cjs-module.cjs');
```

### CommonJS 中使用 ESM

```javascript
// CJS 中动态导入 ESM
async function loadESM() {
  const esmModule = await import('./esm-module.mjs');
  return esmModule.default;
}

// 在顶层使用
(async () => {
  const { namedExport } = await import('./esm-module.mjs');
  console.log(namedExport);
})();
```

### Package.json 配置

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

## 模块设计模式

### 桶文件 (Barrel)

```javascript
// components/index.js - 桶文件
export { Button } from './Button.js';
export { Input } from './Input.js';
export { Modal } from './Modal.js';
export { Dropdown } from './Dropdown.js';

// 使用
import { Button, Input, Modal } from './components';
```

### 工厂模式

```javascript
// logger-factory.js
export function createLogger(prefix) {
  return {
    log: (msg) => console.log(`[${prefix}] ${msg}`),
    error: (msg) => console.error(`[${prefix}] ERROR: ${msg}`),
    warn: (msg) => console.warn(`[${prefix}] WARN: ${msg}`)
  };
}

// 使用
import { createLogger } from './logger-factory.js';
const logger = createLogger('App');
logger.log('Started');
```

### 单例模式

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

// 或使用模块特性（模块只执行一次）
let instance = null;

export function getDatabase() {
  if (!instance) {
    instance = new Database();
  }
  return instance;
}
```

### 依赖注入

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

## 构建工具集成

### Vite 配置

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

### TypeScript 模块

```typescript
// types.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

// 类型导入（不会包含在运行时）
import type { User, UserRole } from './types';

// 混合导入
import { createUser, type User } from './user';
```

## 最佳实践总结

```
模块化最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   导出规范                                          │
│   ├── 优先使用命名导出                             │
│   ├── 一个模块做一件事                             │
│   ├── 避免循环依赖                                 │
│   └── 使用桶文件组织公共 API                       │
│                                                     │
│   导入规范                                          │
│   ├── 导入语句放在文件顶部                         │
│   ├── 按来源分组（内置、第三方、本地）             │
│   ├── 使用路径别名简化导入                         │
│   └── 按需导入减少打包体积                         │
│                                                     │
│   性能优化                                          │
│   ├── 使用动态导入实现代码分割                     │
│   ├── Tree-shaking 移除未使用代码                  │
│   └── 预加载关键模块                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 规范 | 语法 | 适用场景 |
|------|------|----------|
| ESM | import/export | 现代浏览器、现代 Node.js |
| CommonJS | require/exports | Node.js 传统项目 |
| 动态导入 | import() | 代码分割、懒加载 |

---

*模块化是大型应用可维护性的基石。*
