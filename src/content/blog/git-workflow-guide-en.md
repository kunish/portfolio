---
title: 'Git Workflow Complete Guide: From Branch Strategies to Team Collaboration'
description: 'Master Git Flow, GitHub Flow and other branch models plus team collaboration best practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'git-workflow-guide'
---

Git workflows are the foundation of team collaboration. This article explores common branch strategies and team collaboration practices.

## Branch Basics

### Branch Operations

```bash
# View branches
git branch          # Local branches
git branch -r       # Remote branches
git branch -a       # All branches

# Create branch
git branch feature/login
git checkout -b feature/login    # Create and switch
git switch -c feature/login      # Git 2.23+ recommended

# Switch branch
git checkout main
git switch main     # Git 2.23+ recommended

# Delete branch
git branch -d feature/login      # Safe delete
git branch -D feature/login      # Force delete
git push origin --delete feature/login  # Delete remote

# Rename branch
git branch -m old-name new-name
```

### Merge Strategies

```bash
# Regular merge (preserves history)
git merge feature/login

# Fast-forward merge (linear history)
git merge --ff-only feature/login

# No fast-forward (always create merge commit)
git merge --no-ff feature/login

# Squash merge (compress into single commit)
git merge --squash feature/login
git commit -m "Add login feature"

# Rebase
git checkout feature/login
git rebase main
git checkout main
git merge feature/login  # Fast-forward merge
```

## Git Flow Workflow

### Branch Model

```
Git Flow Branch Structure:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   main (production branch)                          │
│   ├── Only accepts release and hotfix merges       │
│   └── Every commit is releasable                   │
│                                                     │
│   develop (development branch)                      │
│   ├── Accepts feature branch merges                │
│   └── Development baseline for next version        │
│                                                     │
│   feature/* (feature branches)                      │
│   ├── Branch from develop                          │
│   └── Merge back to develop                        │
│                                                     │
│   release/* (release branches)                      │
│   ├── Branch from develop                          │
│   └── Merge to main and develop                    │
│                                                     │
│   hotfix/* (hotfix branches)                        │
│   ├── Branch from main                             │
│   └── Merge to main and develop                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Git Flow in Practice

```bash
# Start new feature
git checkout develop
git checkout -b feature/user-auth

# Feature complete
git checkout develop
git merge --no-ff feature/user-auth
git branch -d feature/user-auth

# Prepare release
git checkout develop
git checkout -b release/1.0.0

# Release complete
git checkout main
git merge --no-ff release/1.0.0
git tag -a v1.0.0 -m "Version 1.0.0"
git checkout develop
git merge --no-ff release/1.0.0
git branch -d release/1.0.0

# Hotfix
git checkout main
git checkout -b hotfix/fix-login
# After fix
git checkout main
git merge --no-ff hotfix/fix-login
git tag -a v1.0.1 -m "Version 1.0.1"
git checkout develop
git merge --no-ff hotfix/fix-login
git branch -d hotfix/fix-login
```

## GitHub Flow Workflow

### Simplified Model

```
GitHub Flow Process:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   1. Create feature branch from main               │
│      git checkout -b feature/new-feature            │
│                                                     │
│   2. Develop and commit                            │
│      git add . && git commit                        │
│                                                     │
│   3. Push to remote                                │
│      git push -u origin feature/new-feature         │
│                                                     │
│   4. Create Pull Request                           │
│      Open PR on GitHub                             │
│                                                     │
│   5. Code review and discussion                    │
│      Team members review code                      │
│                                                     │
│   6. Merge to main                                 │
│      Merge after approval                          │
│                                                     │
│   7. Delete feature branch                         │
│      git branch -d feature/new-feature              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### PR Best Practices

```markdown
## PR Template Example

### Description
Brief explanation of what this PR does

### Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation update

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing done

### Related Issue
Closes #123

### Screenshots (if applicable)
```

## Trunk-Based Development

### Trunk Development Model

```
Trunk-Based Development:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Core Principles                                   │
│   ├── Develop directly on main/trunk               │
│   ├── Short-lived feature branches (1-2 days max)  │
│   ├── Frequent integration (multiple times daily)  │
│   └── Use feature flags for incomplete features    │
│                                                     │
│   Best For                                          │
│   ├── Continuous deployment environments           │
│   ├── Small agile teams                            │
│   └── Rapid iteration needs                        │
│                                                     │
│   Feature Flag Example                              │
│   if (featureFlags.newCheckout) {                  │
│     // New checkout flow                           │
│   } else {                                         │
│     // Old checkout flow                           │
│   }                                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Commit Conventions

### Conventional Commits

```bash
# Format
<type>(<scope>): <subject>

<body>

<footer>

# Types
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Formatting (no logic changes)
refactor: Refactoring (not feature or fix)
perf:     Performance improvement
test:     Test related
chore:    Build process or tools

# Example
feat(auth): add OAuth2 login support

Implement OAuth2 authentication flow with Google and GitHub providers.

Closes #123
```

### Commit Message Examples

```bash
# Good commit messages
git commit -m "feat(cart): add quantity adjustment buttons"
git commit -m "fix(auth): resolve token refresh race condition"
git commit -m "docs(api): update authentication endpoints"
git commit -m "refactor(user): extract validation logic to utils"

# Bad commit messages (avoid)
git commit -m "fix bug"
git commit -m "update code"
git commit -m "WIP"
```

## Conflict Resolution

### Handling Merge Conflicts

```bash
# Conflict during merge
git merge feature/login
# Auto-merge failed, manual resolution needed

# View conflicted files
git status

# Conflict markers
<<<<<<< HEAD
Code from current branch
=======
Code from merging branch
>>>>>>> feature/login

# After resolving
git add <resolved-files>
git commit  # Complete merge

# Or abort merge
git merge --abort
```

### Using Rebase to Resolve

```bash
# Resolve conflicts during rebase
git checkout feature/login
git rebase main

# When conflict occurs
# After resolving
git add <resolved-files>
git rebase --continue

# Or skip current commit
git rebase --skip

# Or abort rebase
git rebase --abort
```

## Team Collaboration Practices

### Code Review Checklist

```
Code Review Points:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Functionality                                     │
│   ├── Does code implement requirements             │
│   ├── Are edge cases handled                       │
│   └── Is error handling complete                   │
│                                                     │
│   Readability                                       │
│   ├── Are names clear                              │
│   ├── Is code easy to understand                   │
│   └── Are comments necessary and accurate          │
│                                                     │
│   Design                                            │
│   ├── Does it follow design patterns               │
│   ├── Is there duplicate code                      │
│   └── Are dependencies reasonable                  │
│                                                     │
│   Testing                                           │
│   ├── Is test coverage sufficient                  │
│   ├── Are test cases meaningful                    │
│   └── Are edge cases tested                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Branch Naming Conventions

```bash
# Feature branches
feature/user-authentication
feature/JIRA-123-add-login

# Bug fixes
fix/login-validation
bugfix/JIRA-456-null-pointer

# Hotfixes
hotfix/security-patch
hotfix/v1.2.1

# Release branches
release/1.0.0
release/2024-01

# Experimental branches
experiment/new-algorithm
spike/graphql-migration
```

## Workflow Comparison

| Feature | Git Flow | GitHub Flow | Trunk-Based |
|---------|----------|-------------|-------------|
| Complexity | High | Low | Low |
| Branch Count | Many | Few | Minimal |
| Release Cycle | Long | Short | Shortest |
| Team Size | Large | Small-Medium | Agile teams |
| CI/CD | Difficult | Easy | Easiest |

## Best Practices Summary

```
Git Workflow Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Branch Management                                 │
│   ├── Keep branches short-lived                    │
│   ├── Sync with main frequently                    │
│   ├── Delete merged branches                       │
│   └── Use descriptive branch names                 │
│                                                     │
│   Commit Habits                                     │
│   ├── Small, frequent commits                      │
│   ├── Follow commit conventions                    │
│   ├── Every commit should build                    │
│   └── Never commit sensitive data                  │
│                                                     │
│   Collaboration Process                             │
│   ├── Require code reviews                         │
│   ├── Automated tests must pass                    │
│   ├── Keep documentation updated                   │
│   └── Communicate and give feedback promptly       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

*Choose the right workflow for your team and collaborate more efficiently.*
