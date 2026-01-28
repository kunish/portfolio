---
title: 'JavaScript Package Managers: npm, pnpm, Yarn Deep Comparison'
description: 'Master features, internals and best practices of modern package managers'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'package-manager-guide'
---

Package managers are the infrastructure of JavaScript development. This article provides an in-depth comparison of npm, pnpm, and Yarn.

## Package Manager Overview

### Core Functions

```
Package Manager Responsibilities:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Dependency Management                             │
│   └── Install, update, remove packages             │
│                                                     │
│   Version Control                                   │
│   └── Semantic versioning, lock files              │
│                                                     │
│   Script Execution                                  │
│   └── Run project-defined scripts                  │
│                                                     │
│   Publishing                                        │
│   └── Publish and manage your own packages         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Feature | npm | pnpm | Yarn |
|---------|-----|------|------|
| Storage Strategy | Flat | Content-addressed | Flat/PnP |
| Disk Usage | High | Low | Medium |
| Install Speed | Medium | Fast | Fast |
| Strictness | Low | High | Medium |

## npm

### Basic Commands

```bash
# Initialize project
npm init
npm init -y  # Use defaults

# Install dependencies
npm install lodash           # Add to dependencies
npm install -D typescript    # Dev dependency
npm install -g eslint        # Global install

# Update dependencies
npm update                   # Update all
npm update lodash            # Update specific
npm outdated                 # Check outdated

# Remove dependencies
npm uninstall lodash

# Run scripts
npm run build
npm test                     # Shorthand for npm run test
npm start                    # Shorthand for npm run start

# View information
npm list                     # List installed packages
npm list --depth=0           # Top-level only
npm info lodash              # Package info
```

### package.json Configuration

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "Project description",
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

### Version Semantics

```javascript
// Version format: major.minor.patch

// Version ranges
"lodash": "4.17.21"     // Exact version
"lodash": "^4.17.21"    // Compatible (4.x.x)
"lodash": "~4.17.21"    // Approximate (4.17.x)
"lodash": ">=4.0.0"     // Greater than or equal
"lodash": "4.17.x"      // Wildcard
"lodash": "*"           // Any version

// package-lock.json locks actual installed versions
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

### Why Choose pnpm

```
pnpm Advantages:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Saves Disk Space                                  │
│   └── Content-addressed storage, single copy       │
│                                                     │
│   Fast Installation                                 │
│   └── Hard links instead of copying                │
│                                                     │
│   Strict Dependency Management                      │
│   └── Cannot access undeclared dependencies        │
│                                                     │
│   Native Monorepo Support                           │
│   └── Built-in workspace feature                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Basic Commands

```bash
# Install pnpm
npm install -g pnpm
corepack enable pnpm

# Basic operations (similar to npm)
pnpm install
pnpm add lodash
pnpm add -D typescript
pnpm remove lodash
pnpm update

# Run scripts
pnpm run build
pnpm build              # Can omit 'run'
pnpm test

# Interactive update
pnpm update --interactive

# Check why a package is installed
pnpm why lodash
```

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/test/**'  # Exclude test directories
```

```bash
# Workspace operations
pnpm install                          # Install all workspace deps
pnpm --filter @my/app add lodash      # Add dep to specific package
pnpm --filter @my/app build           # Run script in specific package
pnpm -r build                         # Run script in all packages
pnpm -r --parallel build              # Run in parallel
```

### .npmrc Configuration

```ini
# .npmrc
# Use mirror registry
registry=https://registry.npmmirror.com

# Strict mode
strict-peer-dependencies=true
auto-install-peers=true

# Hoist certain packages
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*

# Virtual store directory
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

### Yarn Berry Features

```yaml
# .yarnrc.yml
nodeLinker: pnp                    # Use Plug'n'Play
enableGlobalCache: true
compressionLevel: mixed

plugins:
  - path: .yarn/plugins/@yarnpkg/plugin-interactive-tools.cjs
    spec: "@yarnpkg/plugin-interactive-tools"
```

### Basic Commands

```bash
# Initialize
yarn init

# Install
yarn                     # Install all dependencies
yarn add lodash          # Add dependency
yarn add -D typescript   # Dev dependency
yarn global add eslint   # Global install

# Update
yarn upgrade             # Update all
yarn upgrade lodash      # Update specific
yarn upgrade-interactive # Interactive update

# Remove
yarn remove lodash

# Run
yarn build              # Run scripts.build
yarn test

# Workspaces
yarn workspaces list
yarn workspace @my/app add lodash
```

### Plug'n'Play (PnP)

```javascript
// Yarn PnP doesn't use node_modules
// Dependencies stored in .yarn/cache
// Resolved via .pnp.cjs

// Dependency mapping in .pnp.cjs
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

## Package Manager Comparison

### Performance Comparison

```bash
# Install speed (cold start)
npm install   → ~45s
pnpm install  → ~15s
yarn install  → ~25s

# Install speed (with cache)
npm install   → ~20s
pnpm install  → ~5s
yarn install  → ~10s

# Disk usage (10 projects with same deps)
npm   → Full copy for each project
pnpm  → Shared storage, single copy
yarn  → Full copy for each project (Classic)
```

### Dependency Resolution

```typescript
// npm/Yarn Classic - Flat
node_modules/
├── lodash/
├── react/
└── some-package/

// pnpm - Symbolic links
node_modules/
├── .pnpm/
│   ├── lodash@4.17.21/
│   └── react@18.2.0/
├── lodash -> .pnpm/lodash@4.17.21/node_modules/lodash
└── react -> .pnpm/react@18.2.0/node_modules/react
```

## Best Practices

### Selection Guide

```
Selection Guide:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   npm                                               │
│   └── Simple projects, no special needs            │
│                                                     │
│   pnpm (Recommended)                                │
│   ├── Monorepo projects                            │
│   ├── Disk space sensitive                         │
│   └── Need strict dependency management            │
│                                                     │
│   Yarn Berry                                        │
│   ├── Need PnP features                            │
│   └── Zero-install CI/CD                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Lock Files

```bash
# Always commit lock files
git add package-lock.json  # npm
git add pnpm-lock.yaml     # pnpm
git add yarn.lock          # Yarn

# Use exact install in CI
npm ci                     # npm
pnpm install --frozen-lockfile  # pnpm
yarn install --immutable   # Yarn
```

### Security Practices

```bash
# Audit dependencies
npm audit
pnpm audit
yarn audit

# Fix vulnerabilities
npm audit fix
pnpm audit --fix

# Check licenses
npx license-checker

# Configure private registry in .npmrc
@mycompany:registry=https://npm.mycompany.com
//npm.mycompany.com/:_authToken=${NPM_TOKEN}
```

## Advanced Tips

### Dependency Overrides

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

### Patching Dependencies

```bash
# Using patch-package
npx patch-package lodash

# pnpm built-in support
pnpm patch lodash
# After editing
pnpm patch-commit
```

| Scenario | Recommendation |
|----------|----------------|
| New projects | pnpm |
| Monorepo | pnpm workspace |
| Enterprise | pnpm + private registry |
| Lightweight needs | npm |

---

*Choose the right package manager and make dependency management pain-free.*
