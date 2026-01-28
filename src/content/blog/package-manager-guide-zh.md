---
title: 'JavaScript 包管理器：npm、pnpm、Yarn 深度对比'
description: '掌握现代包管理器的特性、工作原理和最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'package-manager-guide'
---

包管理器是 JavaScript 开发的基础设施。本文深入对比 npm、pnpm 和 Yarn。

## 包管理器概述

### 核心功能

```
包管理器职责：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   依赖管理                                          │
│   └── 安装、更新、删除依赖包                        │
│                                                     │
│   版本控制                                          │
│   └── 语义化版本，锁定文件                          │
│                                                     │
│   脚本执行                                          │
│   └── 运行项目定义的脚本                            │
│                                                     │
│   发布管理                                          │
│   └── 发布和管理自己的包                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 特性 | npm | pnpm | Yarn |
|------|-----|------|------|
| 存储策略 | 扁平化 | 内容寻址 | 扁平化/PnP |
| 磁盘占用 | 高 | 低 | 中 |
| 安装速度 | 中 | 快 | 快 |
| 严格性 | 低 | 高 | 中 |

## npm

### 基础命令

```bash
# 初始化项目
npm init
npm init -y  # 使用默认值

# 安装依赖
npm install lodash           # 安装并添加到 dependencies
npm install -D typescript    # 开发依赖
npm install -g eslint        # 全局安装

# 更新依赖
npm update                   # 更新所有依赖
npm update lodash            # 更新特定依赖
npm outdated                 # 查看过期依赖

# 删除依赖
npm uninstall lodash

# 运行脚本
npm run build
npm test                     # npm run test 的简写
npm start                    # npm run start 的简写

# 查看信息
npm list                     # 查看已安装的包
npm list --depth=0           # 只看顶层依赖
npm info lodash              # 查看包信息
```

### package.json 配置

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "项目描述",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "lint": "eslint src",
    "prepare": "husky install"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "peerDependencies": {
    "react": ">=17.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "packageManager": "pnpm@8.0.0"
}
```

### 版本语义

```javascript
// 版本号格式：主版本.次版本.修订号
// major.minor.patch

// 版本范围
"lodash": "4.17.21"     // 精确版本
"lodash": "^4.17.21"    // 兼容版本 (4.x.x)
"lodash": "~4.17.21"    // 近似版本 (4.17.x)
"lodash": ">=4.0.0"     // 大于等于
"lodash": "4.17.x"      // 通配符
"lodash": "*"           // 任意版本

// package-lock.json 锁定实际安装的版本
{
  "packages": {
    "node_modules/lodash": {
      "version": "4.17.21",
      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
      "integrity": "sha512-..."
    }
  }
}
```

## pnpm

### 为什么选择 pnpm

```
pnpm 优势：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   节省磁盘空间                                      │
│   └── 内容寻址存储，同一版本只存一份                │
│                                                     │
│   安装速度快                                        │
│   └── 硬链接而非复制                                │
│                                                     │
│   严格的依赖管理                                    │
│   └── 不能访问未声明的依赖                          │
│                                                     │
│   原生 Monorepo 支持                                │
│   └── 内置工作区功能                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 基础命令

```bash
# 安装 pnpm
npm install -g pnpm
corepack enable pnpm

# 基本操作（与 npm 类似）
pnpm install
pnpm add lodash
pnpm add -D typescript
pnpm remove lodash
pnpm update

# 运行脚本
pnpm run build
pnpm build              # 可省略 run
pnpm test

# 交互式更新
pnpm update --interactive

# 查看为什么安装了某个包
pnpm why lodash
```

### 工作区配置

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/test/**'  # 排除测试目录
```

```bash
# 工作区操作
pnpm install                          # 安装所有工作区依赖
pnpm --filter @my/app add lodash      # 给特定包添加依赖
pnpm --filter @my/app build           # 运行特定包的脚本
pnpm -r build                         # 在所有包中运行脚本
pnpm -r --parallel build              # 并行运行
```

### .npmrc 配置

```ini
# .npmrc
# 使用淘宝镜像
registry=https://registry.npmmirror.com

# 严格模式
strict-peer-dependencies=true
auto-install-peers=true

# 提升某些包
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*

# 虚拟存储目录
virtual-store-dir=node_modules/.pnpm
```

## Yarn

### Yarn Classic vs Yarn Berry

```bash
# Yarn Classic (1.x)
npm install -g yarn

# Yarn Berry (2.x+)
corepack enable
yarn set version stable
```

### Yarn Berry 特性

```yaml
# .yarnrc.yml
nodeLinker: pnp                    # 使用 Plug'n'Play
enableGlobalCache: true
compressionLevel: mixed

plugins:
  - path: .yarn/plugins/@yarnpkg/plugin-interactive-tools.cjs
    spec: "@yarnpkg/plugin-interactive-tools"
```

### 基础命令

```bash
# 初始化
yarn init

# 安装
yarn                     # 安装所有依赖
yarn add lodash          # 添加依赖
yarn add -D typescript   # 开发依赖
yarn global add eslint   # 全局安装

# 更新
yarn upgrade             # 更新所有
yarn upgrade lodash      # 更新特定包
yarn upgrade-interactive # 交互式更新

# 删除
yarn remove lodash

# 运行
yarn build              # 运行 scripts.build
yarn test

# 工作区
yarn workspaces list
yarn workspace @my/app add lodash
```

### Plug'n'Play (PnP)

```javascript
// Yarn PnP 不使用 node_modules
// 依赖存储在 .yarn/cache 中
// 通过 .pnp.cjs 解析依赖

// .pnp.cjs 中的依赖映射
["my-project", [
  ["workspace:.", {
    "packageLocation": "./",
    "packageDependencies": [
      ["lodash", "npm:4.17.21"],
      ["react", "npm:18.2.0"]
    ]
  }]
]]
```

## 包管理器对比

### 性能对比

```bash
# 安装速度（冷启动）
npm install   → 约 45s
pnpm install  → 约 15s
yarn install  → 约 25s

# 安装速度（有缓存）
npm install   → 约 20s
pnpm install  → 约 5s
yarn install  → 约 10s

# 磁盘占用（10 个相同依赖的项目）
npm   → 每个项目完整复制
pnpm  → 共享存储，只占一份空间
yarn  → 每个项目完整复制（Classic）
```

### 依赖解析

```typescript
// npm/Yarn Classic - 扁平化
node_modules/
├── lodash/
├── react/
└── some-package/

// pnpm - 符号链接
node_modules/
├── .pnpm/
│   ├── lodash@4.17.21/
│   └── react@18.2.0/
├── lodash -> .pnpm/lodash@4.17.21/node_modules/lodash
└── react -> .pnpm/react@18.2.0/node_modules/react
```

## 最佳实践

### 选择建议

```
选择指南：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   npm                                               │
│   └── 简单项目，无特殊需求                          │
│                                                     │
│   pnpm（推荐）                                      │
│   ├── Monorepo 项目                                │
│   ├── 磁盘空间敏感                                  │
│   └── 需要严格依赖管理                              │
│                                                     │
│   Yarn Berry                                        │
│   ├── 需要 PnP 特性                                │
│   └── 零安装 CI/CD                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 锁定文件

```bash
# 始终提交锁定文件
git add package-lock.json  # npm
git add pnpm-lock.yaml     # pnpm
git add yarn.lock          # Yarn

# CI 中使用精确安装
npm ci                     # npm
pnpm install --frozen-lockfile  # pnpm
yarn install --immutable   # Yarn
```

### 安全实践

```bash
# 审计依赖
npm audit
pnpm audit
yarn audit

# 修复漏洞
npm audit fix
pnpm audit --fix

# 检查许可证
npx license-checker

# 使用 .npmrc 配置私有仓库
@mycompany:registry=https://npm.mycompany.com
//npm.mycompany.com/:_authToken=${NPM_TOKEN}
```

## 高级技巧

### 依赖覆盖

```json
// package.json - npm/Yarn
{
  "overrides": {
    "lodash": "4.17.21"
  }
}

// package.json - pnpm
{
  "pnpm": {
    "overrides": {
      "lodash": "4.17.21"
    }
  }
}
```

### 补丁依赖

```bash
# 使用 patch-package
npx patch-package lodash

# pnpm 内置支持
pnpm patch lodash
# 编辑后
pnpm patch-commit
```

| 场景 | 推荐方案 |
|------|----------|
| 新项目 | pnpm |
| Monorepo | pnpm workspace |
| 企业项目 | pnpm + 私有仓库 |
| 轻量需求 | npm |

---

*选择合适的包管理器，让依赖管理不再是痛点。*
