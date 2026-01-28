---
title: 'Monorepo 工程化实践：大型项目的代码管理之道'
description: '深入理解 Monorepo 架构，掌握 pnpm workspace、Turborepo 等工具的实战技巧'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'monorepo-engineering'
---

随着项目规模增长，代码如何组织成为关键问题。Monorepo（单一代码仓库）让多个相关项目共存于一个仓库中，统一管理、共享代码。本文将带你掌握 Monorepo 的工程化实践。

## 为什么选择 Monorepo？

### Polyrepo vs Monorepo

```
Polyrepo（多仓库）：
┌─────────────────────────────────────────────────────┐
│  repo-web/        repo-api/        repo-shared/    │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐     │
│  │ package │      │ package │      │ package │     │
│  │ .json   │      │ .json   │      │ .json   │     │
│  └─────────┘      └─────────┘      └─────────┘     │
│       ↓                ↓                ↓          │
│  独立版本         独立版本          独立版本        │
│  独立 CI/CD       独立 CI/CD        独立 CI/CD      │
│                                                     │
│  问题：                                             │
│  • 跨仓库修改困难（需要多个 PR）                     │
│  • 依赖版本难以同步                                 │
│  • 代码复用需要发布 npm 包                          │
└─────────────────────────────────────────────────────┘

Monorepo（单仓库）：
┌─────────────────────────────────────────────────────┐
│  monorepo/                                          │
│  ├── packages/                                      │
│  │   ├── web/                                       │
│  │   ├── api/                                       │
│  │   └── shared/                                    │
│  ├── package.json                                   │
│  └── pnpm-workspace.yaml                            │
│                                                     │
│  优势：                                             │
│  • 原子提交（一个 PR 跨多个包）                      │
│  • 统一的依赖管理                                   │
│  • 即时代码共享（无需发布）                          │
│  • 统一的工具链配置                                  │
└─────────────────────────────────────────────────────┘
```

### 适用场景

| 场景 | 推荐 | 原因 |
|------|------|------|
| 多个紧密相关的应用 | ✅ Monorepo | 代码共享频繁 |
| 组件库 + 文档站 + 示例 | ✅ Monorepo | 需要同步更新 |
| 独立的不相关项目 | ❌ Polyrepo | 没有共享需求 |
| 小团队/快速迭代 | ✅ Monorepo | 简化协作 |
| 超大型组织（万人级） | ⚠️ 视情况 | 需要更复杂的工具 |

## 项目结构设计

### 推荐结构

```
my-monorepo/
├── apps/                    # 应用
│   ├── web/                 # 主站
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── admin/               # 管理后台
│   │   ├── src/
│   │   └── package.json
│   └── api/                 # API 服务
│       ├── src/
│       └── package.json
│
├── packages/                # 共享包
│   ├── ui/                  # UI 组件库
│   │   ├── src/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── utils/               # 工具函数
│   │   ├── src/
│   │   └── package.json
│   ├── config/              # 共享配置
│   │   ├── eslint/
│   │   ├── tsconfig/
│   │   └── package.json
│   └── types/               # 类型定义
│       ├── src/
│       └── package.json
│
├── tools/                   # 开发工具
│   └── scripts/
│
├── package.json             # 根配置
├── pnpm-workspace.yaml      # 工作区配置
├── turbo.json               # Turborepo 配置
└── tsconfig.json            # 根 TS 配置
```

### 包命名约定

```json
// packages/ui/package.json
{
  "name": "@myorg/ui",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./button": {
      "import": "./dist/button.mjs",
      "require": "./dist/button.js"
    }
  }
}

// apps/web/package.json
{
  "name": "@myorg/web",
  "private": true,
  "dependencies": {
    "@myorg/ui": "workspace:*",
    "@myorg/utils": "workspace:*"
  }
}
```

## pnpm Workspace

pnpm 是 Monorepo 的最佳包管理器选择。

### 基础配置

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
```

```json
// package.json (根目录)
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=18",
    "pnpm": ">=8"
  },
  "packageManager": "pnpm@8.15.0"
}
```

### 常用命令

```bash
# 安装所有依赖
pnpm install

# 给特定包添加依赖
pnpm add lodash --filter @myorg/utils

# 给根目录添加开发依赖
pnpm add -Dw typescript

# 给所有包添加依赖
pnpm add -r dayjs

# 运行特定包的脚本
pnpm --filter @myorg/web dev
pnpm --filter "./apps/*" build

# 运行包及其依赖的脚本
pnpm --filter @myorg/web... build

# 运行依赖某包的所有包的脚本
pnpm --filter ...@myorg/ui build
```

### 内部依赖

```json
// apps/web/package.json
{
  "dependencies": {
    // workspace:* 表示使用工作区中的最新版本
    "@myorg/ui": "workspace:*",
    // workspace:^ 发布时会转换为实际版本
    "@myorg/utils": "workspace:^"
  }
}
```

## Turborepo：构建加速

Turborepo 通过智能缓存和任务编排大幅提升构建速度。

### 基础配置

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    ".env",
    "tsconfig.json"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "package.json", "tsconfig.json"],
      "outputs": ["dist/**", ".next/**"],
      "cache": true
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "test/**"],
      "cache": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 任务依赖图

```
dependsOn 配置解析：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   "^build"  - 先构建所有依赖包                       │
│                                                     │
│   @myorg/ui ─────┐                                  │
│                  ├──→ @myorg/web (build)            │
│   @myorg/utils ──┘                                  │
│                                                     │
│   "build"   - 先完成自己的 build                    │
│                                                     │
│   @myorg/web (build) ──→ @myorg/web (test)          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 远程缓存

```bash
# 登录 Vercel（Turborepo 官方缓存）
npx turbo login

# 链接到远程缓存
npx turbo link

# 或者自托管
# turbo.json
{
  "remoteCache": {
    "signature": true
  }
}

# 设置环境变量
TURBO_API=https://your-cache-server.com
TURBO_TOKEN=your-token
TURBO_TEAM=your-team
```

### 过滤执行

```bash
# 只构建特定包
turbo run build --filter=@myorg/web

# 构建包及其依赖
turbo run build --filter=@myorg/web...

# 构建被某包依赖的所有包
turbo run build --filter=...@myorg/ui

# 只构建有更改的包
turbo run build --filter=[origin/main]

# 组合使用
turbo run build --filter=@myorg/web...[origin/main]
```

## 共享配置

### TypeScript 配置

```json
// packages/config/tsconfig/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true
  }
}

// packages/config/tsconfig/react.json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["DOM", "DOM.Iterable", "ES2022"]
  }
}

// packages/config/tsconfig/node.json
{
  "extends": "./base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "lib": ["ES2022"]
  }
}
```

```json
// apps/web/tsconfig.json
{
  "extends": "@myorg/config/tsconfig/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### ESLint 配置

```javascript
// packages/config/eslint/base.js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off'
  }
};

// packages/config/eslint/react.js
module.exports = {
  extends: [
    './base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  settings: {
    react: { version: 'detect' }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off'
  }
};
```

```javascript
// apps/web/.eslintrc.js
module.exports = {
  root: true,
  extends: ['@myorg/config/eslint/react']
};
```

## 版本管理与发布

### Changesets

Changesets 是 Monorepo 版本管理的标准工具。

```bash
# 安装
pnpm add -Dw @changesets/cli

# 初始化
pnpm changeset init
```

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [["@myorg/ui", "@myorg/utils"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@myorg/web", "@myorg/admin"]
}
```

### 发布流程

```bash
# 1. 添加变更集
pnpm changeset
# 选择变更的包
# 选择版本类型（patch/minor/major）
# 编写变更说明

# 2. 更新版本
pnpm changeset version
# 自动更新 package.json 和 CHANGELOG.md

# 3. 发布
pnpm changeset publish
# 发布所有有变更的包到 npm
```

### CI 自动化

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      - name: Create Release PR or Publish
        uses: changesets/action@v1
        with:
          version: pnpm changeset version
          publish: pnpm changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 开发体验优化

### 路径别名

```typescript
// packages/ui/tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@ui/*": ["./src/*"]
    }
  }
}

// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ui': path.resolve(__dirname, './src')
    }
  }
});
```

### 热重载配置

```typescript
// apps/web/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      // 监听工作区中的包变化
      ignored: ['!**/node_modules/@myorg/**']
    }
  },
  optimizeDeps: {
    // 排除内部包的预构建
    exclude: ['@myorg/ui', '@myorg/utils']
  }
});
```

### VS Code 配置

```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.workingDirectories": [
    { "pattern": "./apps/*" },
    { "pattern": "./packages/*" }
  ],
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.turbo": true
  }
}
```

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}
```

## 常见问题解决

### 幽灵依赖

```bash
# .npmrc
shamefully-hoist=false  # 禁止依赖提升
strict-peer-dependencies=true
auto-install-peers=true
```

### 循环依赖

```
检测循环依赖：
┌─────────────────────────────────────────────────────┐
│ @myorg/ui ──────→ @myorg/utils                      │
│     ↑                  │                            │
│     └──────────────────┘  ❌ 循环依赖！              │
│                                                     │
│ 解决方案：                                          │
│ 1. 提取公共部分到新包                                │
│ 2. 使用依赖注入                                      │
│ 3. 重新设计包边界                                    │
└─────────────────────────────────────────────────────┘
```

```bash
# 检测循环依赖
pnpm dlx madge --circular packages/*/src/index.ts
```

### 构建顺序

```json
// turbo.json
{
  "tasks": {
    "build": {
      // ^build 确保依赖先构建
      "dependsOn": ["^build"]
    }
  }
}
```

## 总结

Monorepo 让大型项目的代码管理更加高效：

| 方面 | Polyrepo | Monorepo |
|------|----------|----------|
| 代码共享 | 需发布 npm 包 | 即时共享 |
| 跨项目修改 | 多个 PR | 单个 PR |
| 依赖管理 | 各自独立 | 统一管理 |
| CI/CD | 各自配置 | 统一配置 |
| 构建速度 | 重复构建 | 增量缓存 |

**关键收获**：

1. pnpm workspace 是 Monorepo 的基础
2. Turborepo 通过缓存大幅提升构建速度
3. 共享配置减少重复，保持一致性
4. Changesets 解决多包版本管理问题
5. 合理的包边界设计是成功的关键

Monorepo 不是银弹，但对于有代码共享需求的项目，它是强大的架构选择。

---

*代码的组织方式决定了协作的效率。选择适合你团队的架构。*
