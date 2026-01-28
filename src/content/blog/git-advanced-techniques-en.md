---
title: 'Git Advanced Techniques: Level Up Your Version Control'
description: 'Master Git advanced commands and workflows to make version control your superpower'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'git-advanced-techniques'
---

Git is the foundation of modern software development, but most developers only use 10% of its capabilities. This article takes you deep into Git's advanced techniques—from interactive rebasing to bisecting—giving you true control over version history.

## Interactive Rebase

Interactive rebase is the Swiss Army knife for cleaning up commit history.

### Basic Usage

```bash
# Interactive rebase on last 3 commits
git rebase -i HEAD~3

# Rebase all commits from a specific point
git rebase -i abc1234^
```

The editor opens with something like:

```
pick abc1234 Add user login feature
pick def5678 Fix login bug
pick ghi9012 Add login logging

# Commands:
# p, pick = use commit
# r, reword = use commit, but edit the commit message
# e, edit = use commit, but stop for amending
# s, squash = use commit, but meld into previous commit
# f, fixup = like squash, but discard commit message
# d, drop = remove commit
```

### Practical Scenarios

**1. Squash Multiple Commits**

```bash
# Squash "Fix login bug" into "Add user login feature"
pick abc1234 Add user login feature
squash def5678 Fix login bug
pick ghi9012 Add login logging
```

**2. Edit Commit Message**

```bash
pick abc1234 Add user login feature
reword def5678 Fix login bug  # Will prompt for new message
pick ghi9012 Add login logging
```

**3. Reorder Commits**

```bash
pick ghi9012 Add login logging
pick abc1234 Add user login feature
pick def5678 Fix login bug
```

**4. Split a Commit**

```bash
# Mark commit to split as edit
pick abc1234 Add user login feature
edit def5678 Fix login bug and add captcha  # This commit is too big
pick ghi9012 Add login logging
```

```bash
# Git will stop at def5678
git reset HEAD^  # Undo commit but keep changes
git add login-fix.js
git commit -m "Fix login bug"
git add captcha.js
git commit -m "Add captcha feature"
git rebase --continue
```

## Git Stash Advanced Usage

### Basic Operations

```bash
# Stash current changes
git stash

# Stash with description
git stash push -m "Work in progress on login feature"

# List stashes
git stash list
# stash@{0}: On main: Work in progress on login feature
# stash@{1}: WIP on main: abc1234 previous commit

# Apply most recent stash
git stash pop

# Apply specific stash
git stash apply stash@{1}

# Drop a stash
git stash drop stash@{0}
```

### Advanced Techniques

```bash
# Stash including untracked files
git stash -u
# or
git stash --include-untracked

# Stash everything (including ignored files)
git stash -a
# or
git stash --all

# Create branch from stash
git stash branch feature/login stash@{0}

# View stash contents
git stash show -p stash@{0}

# Stash only some changes (interactive)
git stash -p
```

## Git Bisect: Binary Search for Bugs

When you know a bug was introduced in some commit but don't know which one, `git bisect` helps you quickly locate it.

### Manual Bisect

```bash
# Start bisecting
git bisect start

# Mark current version as bad
git bisect bad

# Mark a known good version
git bisect good v1.0.0

# Git checks out middle version, test and mark
git bisect good  # This version is OK
# or
git bisect bad   # This version has the bug

# Repeat until first bad commit is found
# Bisecting: 0 revisions left to test
# abc1234 is the first bad commit

# End bisecting
git bisect reset
```

### Automated Bisect

```bash
# Automate with test script
git bisect start HEAD v1.0.0
git bisect run npm test

# Script returns 0 for good, non-zero for bad
# Git automatically finds the commit that introduced the bug
```

## Git Worktree: Parallel Multi-Branch Development

Worktree lets you work on multiple branches simultaneously without switching back and forth.

```bash
# Create new worktree
git worktree add ../project-hotfix hotfix/urgent-fix
git worktree add ../project-feature feature/new-login

# Now you have three directories:
# /project          (main branch)
# /project-hotfix   (hotfix/urgent-fix branch)
# /project-feature  (feature/new-login branch)

# List all worktrees
git worktree list

# Remove worktree
git worktree remove ../project-hotfix

# Prune worktrees for deleted branches
git worktree prune
```

### Use Case

```
Scenario: You're developing a feature when an urgent bug needs fixing

Traditional way:
1. git stash
2. git checkout hotfix
3. Fix the bug
4. git checkout feature
5. git stash pop

Worktree way:
1. git worktree add ../hotfix hotfix
2. cd ../hotfix
3. Fix the bug
4. cd ../project  # Continue previous work, no stash needed
```

## Git Reflog: Time Machine

Reflog records all HEAD movements—it's a lifesaver for recovering "lost" commits.

```bash
# View reflog
git reflog
# abc1234 HEAD@{0}: commit: Add new feature
# def5678 HEAD@{1}: checkout: moving from main to feature
# ghi9012 HEAD@{2}: commit: Previous commit
# ...

# Restore to previous state
git reset --hard HEAD@{2}

# Recover deleted branch
git checkout -b recovered-branch HEAD@{5}

# Recover reset commits
git cherry-pick abc1234
```

### Recovery Scenarios

```bash
# Scenario 1: Accidentally ran git reset --hard
git reflog
# Find HEAD before reset
git reset --hard HEAD@{1}

# Scenario 2: Accidentally deleted a branch
git reflog
# Find branch's last commit
git checkout -b my-branch HEAD@{3}

# Scenario 3: Accidentally ran git rebase
git reflog
# Find state before rebase
git reset --hard HEAD@{5}
```

## Git Hooks: Workflow Automation

Git Hooks let you run scripts when specific events occur.

### Common Hooks

```bash
# Hook files in .git/hooks/ directory
pre-commit      # Runs before commit
prepare-commit-msg  # When preparing commit message
commit-msg      # Validate commit message
post-commit     # Runs after commit
pre-push        # Runs before push
```

### Example: pre-commit

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run lint
npm run lint
if [ $? -ne 0 ]; then
  echo "Lint check failed, please fix before committing"
  exit 1
fi

# Run tests
npm test
if [ $? -ne 0 ]; then
  echo "Tests failed, please fix before committing"
  exit 1
fi

exit 0
```

### Using Husky (Recommended)

```bash
# Install
npm install husky -D
npx husky init

# Add pre-commit hook
echo "npm run lint" > .husky/pre-commit
```

```json
// package.json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

## Advanced Git Configuration

### Useful Aliases

```bash
# ~/.gitconfig
[alias]
  # Short commands
  co = checkout
  br = branch
  ci = commit
  st = status

  # Pretty log
  lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

  # Recent branches
  recent = branch --sort=-committerdate --format='%(committerdate:relative)%09%(refname:short)'

  # Undo last commit
  undo = reset HEAD~1 --mixed

  # Amend without editing message
  amend = commit --amend --no-edit

  # File history
  filelog = log -p --follow --

  # Cleanup merged branches
  cleanup = "!git branch --merged | grep -v '\\*\\|main\\|master' | xargs -n 1 git branch -d"
```

### Other Useful Settings

```bash
# ~/.gitconfig
[core]
  # Default editor
  editor = code --wait

  # Auto-fix line endings
  autocrlf = input

[pull]
  # Use rebase instead of merge for pull
  rebase = true

[push]
  # Auto set upstream on push
  autoSetupRemote = true

[rerere]
  # Remember conflict resolutions
  enabled = true

[diff]
  # Better diff algorithm
  algorithm = histogram

[merge]
  # Show original in conflicts
  conflictstyle = zdiff3
```

## Git Workflows

### Git Flow

```
┌─────────────────────────────────────────────────────┐
│  main ──●──────────────────●──────────────●───────  │
│         │                  ↑              ↑         │
│         │                  │              │         │
│  develop ●────●────●───────●────●─────────●───────  │
│              │    ↑       ↑    │         ↑         │
│              │    │       │    │         │         │
│  feature/a   └────┘       │    │         │         │
│                           │    │         │         │
│  feature/b ───────────────┘    │         │         │
│                                │         │         │
│  release/1.0 ──────────────────┘         │         │
│                                          │         │
│  hotfix/bug ─────────────────────────────┘         │
└─────────────────────────────────────────────────────┘
```

### Trunk-Based Development

```
┌─────────────────────────────────────────────────────┐
│  main ●──●──●──●──●──●──●──●──●──●──●──●──●──●───   │
│       ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑     │
│       │  │  │  │  │  │  │  │  │  │  │  │  │  │     │
│       └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘     │
│        Short-lived feature branches, frequent merges │
└─────────────────────────────────────────────────────┘
```

## Practical Tips Collection

### Find Lost Commits

```bash
# Search commit messages
git log --all --grep="keyword"

# Search code changes
git log --all -S "code snippet"

# Search with regex
git log --all -G "regex pattern"
```

### Batch Modify History

```bash
# Change email in all commits (use with caution!)
git filter-branch --env-filter '
if [ "$GIT_AUTHOR_EMAIL" = "old@email.com" ]; then
    export GIT_AUTHOR_EMAIL="new@email.com"
    export GIT_COMMITTER_EMAIL="new@email.com"
fi
' --tag-name-filter cat -- --branches --tags

# Better option: use git-filter-repo
pip install git-filter-repo
git filter-repo --email-callback 'return email.replace(b"old@email.com", b"new@email.com")'
```

### Partial Clone

```bash
# Shallow clone (only recent history)
git clone --depth 1 https://github.com/user/repo.git

# Sparse checkout (only specific directories)
git clone --filter=blob:none --sparse https://github.com/user/repo.git
cd repo
git sparse-checkout set src/components
```

## Summary

Git advanced techniques enable you to:

| Technique | Purpose |
|-----------|---------|
| Interactive Rebase | Clean up commit history |
| Stash | Temporarily save work |
| Bisect | Binary search for bugs |
| Worktree | Parallel multi-branch development |
| Reflog | Recover lost work |
| Hooks | Workflow automation |

**Key Takeaways**:

1. `git rebase -i` is the power tool for history cleanup
2. `git reflog` can recover almost any "lost" work
3. `git worktree` makes multi-branch development efficient
4. `git bisect` quickly locates bug-introducing commits
5. Good alias configuration significantly boosts productivity

Master these advanced techniques, and Git transforms from a version control tool into your development superpower.

---

*Version control isn't just about saving history—it's the art of controlling history.*
