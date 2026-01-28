---
title: 'ESLint 与 Prettier：构建一致的代码风格'
description: '掌握代码检查工具配置、规则定制和团队协作最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'eslint-prettier-guide'
---

代码质量工具是团队协作的基础。本文探讨 ESLint 和 Prettier 的配置与最佳实践。

## 工具概述

### ESLint vs Prettier

```
工具定位：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ESLint                                            │
│   ├── 代码质量检查                                  │
│   ├── 发现潜在问题                                  │
│   ├── 强制编码规范                                  │
│   └── 可自动修复部分问题                            │
│                                                     │
│   Prettier                                          │
│   ├── 代码格式化                                    │
│   ├── 统一代码风格                                  │
│   ├── 无需讨论格式问题                              │
│   └── 支持多种语言                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 工具 | 关注点 | 示例 |
|------|--------|------|
| ESLint | 代码逻辑 | 未使用变量、相等比较 |
| Prettier | 代码格式 | 缩进、换行、引号 |

## ESLint 配置

### 基础安装

```bash
# 安装 ESLint
pnpm add -D eslint

# 初始化配置
pnpm eslint --init

# 安装 TypeScript 支持
pnpm add -D @typescript-eslint/parser @typescript-eslint/eslint-plugin

# 安装 React 支持
pnpm add -D eslint-plugin-react eslint-plugin-react-hooks
```

### Flat Config（ESLint 9+）

```javascript
// eslint.config.js
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // 忽略文件
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js'],
  },

  // 基础配置
  js.configs.recommended,

  // TypeScript 配置
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // React 配置
  {
    files: ['**/*.jsx', '**/*.tsx'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
```

### 常用规则

```javascript
// eslint.config.js
export default [
  {
    rules: {
      // 代码质量
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-unused-vars': 'error',
      'no-undef': 'error',

      // 最佳实践
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'prefer-const': 'error',

      // 代码风格（建议交给 Prettier）
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],

      // 复杂度控制
      'complexity': ['warn', 10],
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', 50],
    },
  },
];
```

## Prettier 配置

### 基础安装

```bash
# 安装 Prettier
pnpm add -D prettier

# 安装 ESLint 集成
pnpm add -D eslint-config-prettier eslint-plugin-prettier
```

### 配置文件

```javascript
// prettier.config.js
export default {
  // 基础格式
  printWidth: 80,              // 行宽
  tabWidth: 2,                 // 缩进
  useTabs: false,              // 使用空格
  semi: true,                  // 分号
  singleQuote: true,           // 单引号
  quoteProps: 'as-needed',     // 对象属性引号

  // JSX
  jsxSingleQuote: false,       // JSX 双引号

  // 尾随逗号
  trailingComma: 'es5',        // ES5 兼容

  // 括号
  bracketSpacing: true,        // 对象括号空格
  bracketSameLine: false,      // JSX 括号换行
  arrowParens: 'always',       // 箭头函数括号

  // 特殊处理
  endOfLine: 'lf',             // 换行符
  proseWrap: 'preserve',       // Markdown 换行

  // 覆盖特定文件
  overrides: [
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
      },
    },
    {
      files: '*.json',
      options: {
        printWidth: 200,
      },
    },
  ],
};
```

### 忽略文件

```
# .prettierignore
dist
build
coverage
node_modules
pnpm-lock.yaml
*.min.js
*.min.css
```

## ESLint + Prettier 集成

### 配置集成

```javascript
// eslint.config.js
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  // ... 其他配置

  // Prettier 集成（放在最后）
  prettierConfig,
  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
```

### package.json 脚本

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint src --ext .ts,.tsx,.js,.jsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "check": "pnpm lint && pnpm format:check"
  }
}
```

## 编辑器集成

### VS Code 配置

```json
// .vscode/settings.json
{
  // 保存时格式化
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",

  // ESLint 自动修复
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },

  // 特定语言配置
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // ESLint 配置
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

### 推荐扩展

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

## Git Hooks 集成

### Husky + lint-staged

```bash
# 安装
pnpm add -D husky lint-staged

# 初始化 husky
pnpm husky install
pnpm husky add .husky/pre-commit "pnpm lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

### Commit 消息检查

```bash
# 安装 commitlint
pnpm add -D @commitlint/cli @commitlint/config-conventional

# 添加 hook
pnpm husky add .husky/commit-msg "npx --no -- commitlint --edit $1"
```

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    ],
    'subject-max-length': [2, 'always', 72],
  },
};
```

## 自定义规则

### ESLint 自定义规则

```javascript
// eslint-plugin-custom/no-console-log.js
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '禁止使用 console.log',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'console' &&
          node.callee.property.name === 'log'
        ) {
          context.report({
            node,
            message: '不要使用 console.log，请使用 logger',
            fix(fixer) {
              return fixer.replaceText(
                node.callee,
                'logger.debug'
              );
            },
          });
        }
      },
    };
  },
};
```

## 最佳实践总结

```
代码质量工具最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   配置策略                                          │
│   ├── ESLint 负责代码质量                          │
│   ├── Prettier 负责代码格式                        │
│   ├── 使用 eslint-config-prettier 避免冲突        │
│   └── 保持配置简洁                                  │
│                                                     │
│   团队协作                                          │
│   ├── 统一编辑器配置                                │
│   ├── 使用 Git hooks 强制检查                      │
│   ├── CI/CD 中运行检查                             │
│   └── 定期更新依赖                                  │
│                                                     │
│   渐进式采用                                        │
│   ├── 从宽松规则开始                                │
│   ├── 逐步收紧规则                                  │
│   ├── 新代码强制，老代码渐进                        │
│   └── 记录规则决策原因                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| 新项目 | ESLint + Prettier + Husky |
| 大型团队 | 共享配置包 |
| 开源项目 | 使用流行配置 |
| 遗留项目 | 渐进式迁移 |

---

*好的代码风格不是讨论出来的，而是工具强制出来的。*
