---
title: 'ESLint and Prettier: Building Consistent Code Style'
description: 'Master code linting configuration, rule customization and team collaboration best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'eslint-prettier-guide'
---

Code quality tools are fundamental for team collaboration. This article explores ESLint and Prettier configuration and best practices.

## Tool Overview

### ESLint vs Prettier

```
Tool Focus:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ESLint                                            │
│   ├── Code quality checks                          │
│   ├── Find potential issues                        │
│   ├── Enforce coding standards                     │
│   └── Auto-fix some problems                       │
│                                                     │
│   Prettier                                          │
│   ├── Code formatting                              │
│   ├── Unified code style                           │
│   ├── No debates about format                      │
│   └── Multi-language support                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Tool | Focus | Examples |
|------|-------|----------|
| ESLint | Code logic | Unused variables, equality checks |
| Prettier | Code format | Indentation, line breaks, quotes |

## ESLint Configuration

### Basic Installation

```bash
# Install ESLint
pnpm add -D eslint

# Initialize configuration
pnpm eslint --init

# Install TypeScript support
pnpm add -D @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Install React support
pnpm add -D eslint-plugin-react eslint-plugin-react-hooks
```

### Flat Config (ESLint 9+)

```javascript
// eslint.config.js
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Ignored files
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js'],
  },

  // Base configuration
  js.configs.recommended,

  // TypeScript configuration
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

  // React configuration
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

### Common Rules

```javascript
// eslint.config.js
export default [
  {
    rules: {
      // Code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-unused-vars': 'error',
      'no-undef': 'error',

      // Best practices
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'prefer-const': 'error',

      // Code style (consider leaving to Prettier)
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],

      // Complexity control
      'complexity': ['warn', 10],
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', 50],
    },
  },
];
```

## Prettier Configuration

### Basic Installation

```bash
# Install Prettier
pnpm add -D prettier

# Install ESLint integration
pnpm add -D eslint-config-prettier eslint-plugin-prettier
```

### Configuration File

```javascript
// prettier.config.js
export default {
  // Basic formatting
  printWidth: 80,              // Line width
  tabWidth: 2,                 // Indentation
  useTabs: false,              // Use spaces
  semi: true,                  // Semicolons
  singleQuote: true,           // Single quotes
  quoteProps: 'as-needed',     // Object property quotes

  // JSX
  jsxSingleQuote: false,       // JSX double quotes

  // Trailing commas
  trailingComma: 'es5',        // ES5 compatible

  // Brackets
  bracketSpacing: true,        // Object bracket spacing
  bracketSameLine: false,      // JSX bracket new line
  arrowParens: 'always',       // Arrow function parens

  // Special handling
  endOfLine: 'lf',             // Line endings
  proseWrap: 'preserve',       // Markdown wrapping

  // File-specific overrides
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

### Ignore File

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

## ESLint + Prettier Integration

### Configuration Integration

```javascript
// eslint.config.js
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  // ... other configs

  // Prettier integration (place last)
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

### package.json Scripts

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

## Editor Integration

### VS Code Configuration

```json
// .vscode/settings.json
{
  // Format on save
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",

  // ESLint auto-fix
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },

  // Language-specific settings
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // ESLint configuration
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

### Recommended Extensions

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

## Git Hooks Integration

### Husky + lint-staged

```bash
# Install
pnpm add -D husky lint-staged

# Initialize husky
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

### Commit Message Checking

```bash
# Install commitlint
pnpm add -D @commitlint/cli @commitlint/config-conventional

# Add hook
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

## Custom Rules

### ESLint Custom Rule

```javascript
// eslint-plugin-custom/no-console-log.js
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow console.log',
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
            message: 'Do not use console.log, use logger instead',
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

## Best Practices Summary

```
Code Quality Tool Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Configuration Strategy                            │
│   ├── ESLint for code quality                      │
│   ├── Prettier for formatting                      │
│   ├── Use eslint-config-prettier to avoid conflicts│
│   └── Keep configuration simple                    │
│                                                     │
│   Team Collaboration                                │
│   ├── Unified editor settings                      │
│   ├── Use Git hooks for enforcement               │
│   ├── Run checks in CI/CD                          │
│   └── Regularly update dependencies                │
│                                                     │
│   Gradual Adoption                                  │
│   ├── Start with relaxed rules                     │
│   ├── Gradually tighten rules                      │
│   ├── New code enforced, old code gradual         │
│   └── Document rule decisions                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommendation |
|----------|----------------|
| New projects | ESLint + Prettier + Husky |
| Large teams | Shared config packages |
| Open source | Use popular configs |
| Legacy projects | Gradual migration |

---

*Good code style isn't debated into existence - it's enforced by tools.*
