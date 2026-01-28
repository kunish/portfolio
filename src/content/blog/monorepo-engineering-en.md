---
title: 'Monorepo Engineering: Managing Code at Scale'
description: 'Master Monorepo architecture and practical techniques with pnpm workspace, Turborepo, and more'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'monorepo-engineering'
---

As projects grow, code organization becomes critical. Monorepo (single repository) allows multiple related projects to coexist in one repository with unified management and code sharing. This article will help you master Monorepo engineering practices.

## Why Choose Monorepo?

### Polyrepo vs Monorepo

```
Polyrepo (Multiple Repos):
┌─────────────────────────────────────────────────────┐
│  repo-web/        repo-api/        repo-shared/    │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐     │
│  │ package │      │ package │      │ package │     │
│  │ .json   │      │ .json   │      │ .json   │     │
│  └─────────┘      └─────────┘      └─────────┘     │
│       ↓                ↓                ↓          │
│  Separate         Separate          Separate       │
│  versions         versions          versions       │
│  CI/CD            CI/CD             CI/CD          │
│                                                     │
│  Problems:                                          │
│  • Cross-repo changes difficult (multiple PRs)      │
│  • Dependency versions hard to sync                 │
│  • Code reuse requires publishing npm packages      │
└─────────────────────────────────────────────────────┘

Monorepo (Single Repo):
┌─────────────────────────────────────────────────────┐
│  monorepo/                                          │
│  ├── packages/                                      │
│  │   ├── web/                                       │
│  │   ├── api/                                       │
│  │   └── shared/                                    │
│  ├── package.json                                   │
│  └── pnpm-workspace.yaml                            │
│                                                     │
│  Advantages:                                        │
│  • Atomic commits (one PR across packages)          │
│  • Unified dependency management                    │
│  • Instant code sharing (no publishing)             │
│  • Unified toolchain configuration                  │
└─────────────────────────────────────────────────────┘
```

### When to Use

| Scenario | Recommended | Reason |
|----------|-------------|--------|
| Multiple closely related apps | ✅ Monorepo | Frequent code sharing |
| Component lib + docs + examples | ✅ Monorepo | Need synchronized updates |
| Independent unrelated projects | ❌ Polyrepo | No sharing needs |
| Small team / fast iteration | ✅ Monorepo | Simplifies collaboration |
| Very large org (10k+ people) | ⚠️ Depends | Needs more complex tools |

## Project Structure Design

### Recommended Structure

```
my-monorepo/
├── apps/                    # Applications
│   ├── web/                 # Main website
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── admin/               # Admin dashboard
│   │   ├── src/
│   │   └── package.json
│   └── api/                 # API service
│       ├── src/
│       └── package.json
│
├── packages/                # Shared packages
│   ├── ui/                  # UI component library
│   │   ├── src/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── utils/               # Utility functions
│   │   ├── src/
│   │   └── package.json
│   ├── config/              # Shared configs
│   │   ├── eslint/
│   │   ├── tsconfig/
│   │   └── package.json
│   └── types/               # Type definitions
│       ├── src/
│       └── package.json
│
├── tools/                   # Development tools
│   └── scripts/
│
├── package.json             # Root config
├── pnpm-workspace.yaml      # Workspace config
├── turbo.json               # Turborepo config
└── tsconfig.json            # Root TS config
```

### Package Naming Conventions

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

pnpm is the best package manager choice for Monorepo.

### Basic Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
```

```json
// package.json (root)
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

### Common Commands

```bash
# Install all dependencies
pnpm install

# Add dependency to specific package
pnpm add lodash --filter @myorg/utils

# Add dev dependency to root
pnpm add -Dw typescript

# Add dependency to all packages
pnpm add -r dayjs

# Run script in specific package
pnpm --filter @myorg/web dev
pnpm --filter "./apps/*" build

# Run script in package and its dependencies
pnpm --filter @myorg/web... build

# Run script in all packages that depend on a package
pnpm --filter ...@myorg/ui build
```

### Internal Dependencies

```json
// apps/web/package.json
{
  "dependencies": {
    // workspace:* uses latest workspace version
    "@myorg/ui": "workspace:*",
    // workspace:^ converts to actual version on publish
    "@myorg/utils": "workspace:^"
  }
}
```

## Turborepo: Build Acceleration

Turborepo dramatically improves build speed through smart caching and task orchestration.

### Basic Configuration

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

### Task Dependency Graph

```
dependsOn Configuration Explained:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   "^build"  - Build all dependencies first          │
│                                                     │
│   @myorg/ui ─────┐                                  │
│                  ├──→ @myorg/web (build)            │
│   @myorg/utils ──┘                                  │
│                                                     │
│   "build"   - Complete own build first              │
│                                                     │
│   @myorg/web (build) ──→ @myorg/web (test)          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Remote Caching

```bash
# Login to Vercel (Turborepo official cache)
npx turbo login

# Link to remote cache
npx turbo link

# Or self-host
# turbo.json
{
  "remoteCache": {
    "signature": true
  }
}

# Set environment variables
TURBO_API=https://your-cache-server.com
TURBO_TOKEN=your-token
TURBO_TEAM=your-team
```

### Filtered Execution

```bash
# Build specific package only
turbo run build --filter=@myorg/web

# Build package and its dependencies
turbo run build --filter=@myorg/web...

# Build all packages that depend on a package
turbo run build --filter=...@myorg/ui

# Build only changed packages
turbo run build --filter=[origin/main]

# Combined usage
turbo run build --filter=@myorg/web...[origin/main]
```

## Shared Configuration

### TypeScript Configuration

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

### ESLint Configuration

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

## Version Management & Publishing

### Changesets

Changesets is the standard tool for Monorepo version management.

```bash
# Install
pnpm add -Dw @changesets/cli

# Initialize
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

### Release Workflow

```bash
# 1. Add changeset
pnpm changeset
# Select changed packages
# Choose version type (patch/minor/major)
# Write change description

# 2. Version packages
pnpm changeset version
# Auto-updates package.json and CHANGELOG.md

# 3. Publish
pnpm changeset publish
# Publishes all changed packages to npm
```

### CI Automation

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

## Developer Experience Optimization

### Path Aliases

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

### Hot Reload Configuration

```typescript
// apps/web/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      // Watch workspace package changes
      ignored: ['!**/node_modules/@myorg/**']
    }
  },
  optimizeDeps: {
    // Exclude internal packages from pre-bundling
    exclude: ['@myorg/ui', '@myorg/utils']
  }
});
```

### VS Code Configuration

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

## Common Issues & Solutions

### Phantom Dependencies

```bash
# .npmrc
shamefully-hoist=false  # Disable dependency hoisting
strict-peer-dependencies=true
auto-install-peers=true
```

### Circular Dependencies

```
Detecting Circular Dependencies:
┌─────────────────────────────────────────────────────┐
│ @myorg/ui ──────→ @myorg/utils                      │
│     ↑                  │                            │
│     └──────────────────┘  ❌ Circular!              │
│                                                     │
│ Solutions:                                          │
│ 1. Extract common parts to new package              │
│ 2. Use dependency injection                         │
│ 3. Redesign package boundaries                      │
└─────────────────────────────────────────────────────┘
```

```bash
# Detect circular dependencies
pnpm dlx madge --circular packages/*/src/index.ts
```

### Build Order

```json
// turbo.json
{
  "tasks": {
    "build": {
      // ^build ensures dependencies build first
      "dependsOn": ["^build"]
    }
  }
}
```

## Summary

Monorepo makes large project code management more efficient:

| Aspect | Polyrepo | Monorepo |
|--------|----------|----------|
| Code Sharing | Need npm publish | Instant sharing |
| Cross-project Changes | Multiple PRs | Single PR |
| Dependency Management | Separate | Unified |
| CI/CD | Separate configs | Unified config |
| Build Speed | Redundant builds | Incremental cache |

**Key Takeaways**:

1. pnpm workspace is the foundation of Monorepo
2. Turborepo dramatically improves build speed through caching
3. Shared configs reduce duplication, maintain consistency
4. Changesets solves multi-package version management
5. Proper package boundary design is key to success

Monorepo isn't a silver bullet, but for projects with code sharing needs, it's a powerful architectural choice.

---

*How you organize code determines collaboration efficiency. Choose the architecture that fits your team.*
