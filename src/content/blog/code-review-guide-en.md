---
title: 'Code Review Best Practices: Improving Code Quality and Team Collaboration'
description: 'Master code review techniques, PR standards, automation tools and constructive feedback methods'
pubDate: 'Jan 28 2025'
heroImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80'
lang: 'en'
translationKey: 'code-review-guide'
---

Code Review is a key practice for ensuring code quality and knowledge sharing. This article explores methods and tools for effective code reviews.

## Code Review Overview

### Why Code Review Matters

```
Code Review Value:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Quality Assurance                                 │
│   ├── Discover bugs and logic errors               │
│   ├── Ensure code meets standards                  │
│   ├── Identify security vulnerabilities            │
│   └── Improve code maintainability                 │
│                                                     │
│   Knowledge Sharing                                 │
│   ├── Team learns the codebase                     │
│   ├── Learn best practices                         │
│   ├── Transfer technical decisions                 │
│   └── Mentor new developers                        │
│                                                     │
│   Collaboration Enhancement                         │
│   ├── Unify coding style                           │
│   ├── Build trust                                  │
│   ├── Foster communication                         │
│   └── Collective code ownership                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Goal | Focus Areas |
|------|-------------|
| Correctness | Logic, edge cases, error handling |
| Readability | Naming, structure, comments |
| Maintainability | Modularity, complexity, tests |
| Performance | Algorithm efficiency, resource usage |

## Creating Quality PRs

### PR Template

```markdown
## PR Template

### Description
<!-- Clearly describe what this PR does -->

### Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation update
- [ ] Tests

### Related Issue
<!-- Link related issues -->
Closes #123

### Testing Instructions
<!-- Describe how to test these changes -->

### Screenshots (if applicable)
<!-- Attach screenshots for UI changes -->

### Checklist
- [ ] Code follows project standards
- [ ] Necessary tests added
- [ ] Documentation updated
- [ ] Local tests pass
```

### Keep PRs Small and Focused

```typescript
// ❌ Large PR - hard to review
// PR #1: Refactor user module + add new feature + fix bug + update deps
// Involves 50+ files, 2000+ line changes

// ✅ Split into multiple small PRs
// PR #1: Refactor user data model (5 files, 100 lines)
// PR #2: Add user search feature (8 files, 200 lines)
// PR #3: Fix user login bug (2 files, 30 lines)
// PR #4: Upgrade auth library version (3 files, 50 lines)

// Ideal PR size
const idealPRSize = {
  files: '< 10',
  linesChanged: '< 400',
  reviewTime: '< 30 minutes',
  focusedOn: 'Single concern',
};
```

### Meaningful Commit Messages

```bash
# Commit message convention
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>

# Example
git commit -m "feat(auth): add OAuth2 login support

- Implement Google OAuth2 provider
- Add token refresh mechanism
- Update user model with provider field

Closes #456"

# Type descriptions
# feat:     New feature
# fix:      Bug fix
# docs:     Documentation update
# style:    Formatting (no logic changes)
# refactor: Refactoring
# test:     Test related
# chore:    Build/tool changes
```

## Review Techniques

### Review Checklist

```typescript
// Code review checkpoints
const reviewChecklist = {
  // 1. Correctness
  correctness: [
    'Is the logic correct?',
    'Are edge cases handled?',
    'Is error handling complete?',
    'Any potential null pointers?',
  ],

  // 2. Design
  design: [
    'Does it fit existing architecture?',
    'Is it over-engineered?',
    'Does it need refactoring?',
    'Are dependencies reasonable?',
  ],

  // 3. Readability
  readability: [
    'Are names clear?',
    'Is code easy to understand?',
    'Are comments necessary and accurate?',
    'Are functions too long?',
  ],

  // 4. Testing
  testing: [
    'Are there enough tests?',
    'Do tests cover edge cases?',
    'Are tests maintainable?',
  ],

  // 5. Security
  security: [
    'Any injection risks?',
    'Is sensitive data handled securely?',
    'Are permission checks in place?',
  ],

  // 6. Performance
  performance: [
    'Any performance issues?',
    'N+1 queries?',
    'Memory leak risks?',
  ],
};
```

### Review Priorities

```typescript
// Review focus layers
const reviewPriorities = {
  // High priority - must fix
  critical: [
    'Bugs and logic errors',
    'Security vulnerabilities',
    'Data loss risks',
    'Severe performance issues',
  ],

  // Medium priority - should fix
  major: [
    'Design issues',
    'Code duplication',
    'Missing error handling',
    'Insufficient test coverage',
  ],

  // Low priority - optional improvements
  minor: [
    'Code style',
    'Naming suggestions',
    'Documentation improvements',
    'Micro-optimizations',
  ],
};
```

## Providing Effective Feedback

### Constructive Comments

```markdown
## Comment Examples

### ❌ Bad Comments
"This code is terrible"
"Why would you write it this way?"
"Wrong"

### ✅ Good Comments

**Ask questions instead of commands**
"Would using `map` instead of `forEach` be clearer here?"

**Explain the reason**
"Suggest splitting this function into smaller functions.
Reason: Current function is 60 lines, hard to understand and test."

**Provide examples**
"Consider using early return pattern:
```typescript
// Current
if (user) {
  // 50 lines of logic
}

// Suggested
if (!user) return;
// 50 lines of logic
```"

**Distinguish priorities**
"[must] Need to handle null case here"
"[suggestion] This variable name could be more descriptive"
"[discuss] Which approach is better: this or X?"
```

### Comment Templates

```typescript
// Comment type labels
const commentLabels = {
  '[must]': 'Must fix before merge',
  '[suggestion]': 'Strongly recommended but non-blocking',
  '[question]': 'Question needing clarification',
  '[discuss]': 'Open discussion',
  '[praise]': 'Code highlight',
  '[nit]': 'Minor detail, can ignore',
};

// Example comments
const exampleComments = [
  '[must] This API call lacks error handling, may cause uncaught exceptions',
  '[suggestion] Consider using `const` instead of `let` since this variable is never reassigned',
  '[question] What is the reason for choosing sync over async here?',
  '[discuss] For this scenario, is Redux or Context more appropriate?',
  '[praise] This abstraction is elegantly designed with great reusability!',
  '[nit] Extra blank line here',
];
```

## Automation Tools

### CI/CD Integration

```yaml
# .github/workflows/pr-check.yml
name: PR Check

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build
```

### Automated Check Tools

```yaml
# PR automation check configuration
# .github/workflows/auto-review.yml
name: Auto Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  size-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check PR size
        uses: codelytv/pr-size-labeler@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          xs_label: 'size/XS'
          xs_max_size: 10
          s_label: 'size/S'
          s_max_size: 100
          m_label: 'size/M'
          m_max_size: 500
          l_label: 'size/L'
          l_max_size: 1000
          xl_label: 'size/XL'

  danger:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Danger
        uses: danger/danger-js@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Danger.js Configuration

```javascript
// dangerfile.js
import { danger, warn, fail, message } from 'danger';

// PR size check
const bigPRThreshold = 500;
if (danger.github.pr.additions + danger.github.pr.deletions > bigPRThreshold) {
  warn('PR is too large, consider splitting into smaller PRs');
}

// Check PR description
if (danger.github.pr.body.length < 50) {
  fail('Please provide a more detailed PR description');
}

// Check test files
const hasTestChanges = danger.git.modified_files.some(
  (file) => file.includes('.test.') || file.includes('.spec.')
);
const hasSourceChanges = danger.git.modified_files.some(
  (file) => file.includes('src/') && !file.includes('.test.')
);

if (hasSourceChanges && !hasTestChanges) {
  warn('Source code changed but no tests updated');
}

// Check for sensitive file modifications
const sensitiveFiles = ['.env', 'package-lock.json', 'yarn.lock'];
const modifiedSensitive = danger.git.modified_files.filter((file) =>
  sensitiveFiles.some((s) => file.includes(s))
);

if (modifiedSensitive.length > 0) {
  warn(`Modified sensitive files: ${modifiedSensitive.join(', ')}`);
}

// Celebrate first-time contributors
if (danger.github.pr.author_association === 'FIRST_TIME_CONTRIBUTOR') {
  message('Welcome first-time contributor! 🎉');
}
```

## Best Practices Summary

```
Code Review Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   As an Author                                      │
│   ├── Keep PRs small and focused                   │
│   ├── Provide clear description and context        │
│   ├── Self-review first                            │
│   └── Respond to feedback promptly                 │
│                                                     │
│   As a Reviewer                                     │
│   ├── Review promptly (within 24 hours)            │
│   ├── Provide constructive feedback                │
│   ├── Distinguish priorities                       │
│   └── Acknowledge good practices                   │
│                                                     │
│   Team Standards                                    │
│   ├── Establish review checklist                   │
│   ├── Use automation tools                         │
│   ├── Regularly review process                     │
│   └── Cultivate review culture                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommendation |
|----------|----------------|
| Large changes | Split into multiple PRs |
| Urgent fixes | Simplified process but still review |
| New developer code | Provide detailed guidance |
| Complex logic | Schedule discussion meeting |

---

*Code Review isn't fault-finding, it's the team growing together.*
