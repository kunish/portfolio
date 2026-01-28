---
title: 'Git 高级技巧：提升你的版本控制能力'
description: '掌握 Git 高级命令和工作流，让版本控制成为你的超能力'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'git-advanced-techniques'
---

Git 是现代软件开发的基石，但大多数开发者只使用了它 10% 的功能。本文将带你深入 Git 的高级技巧，从交互式变基到二分查找，让你真正掌控版本历史。

## 交互式变基（Interactive Rebase）

交互式变基是整理提交历史的瑞士军刀。

### 基础用法

```bash
# 对最近 3 个提交进行交互式变基
git rebase -i HEAD~3

# 对从某个提交开始的所有提交进行变基
git rebase -i abc1234^
```

编辑器会打开类似这样的内容：

```
pick abc1234 添加用户登录功能
pick def5678 修复登录 bug
pick ghi9012 添加登录日志

# 可用命令:
# p, pick = 使用提交
# r, reword = 使用提交，但修改提交信息
# e, edit = 使用提交，但停下来修改
# s, squash = 使用提交，但合并到前一个提交
# f, fixup = 类似 squash，但丢弃提交信息
# d, drop = 删除提交
```

### 实用场景

**1. 合并多个提交**

```bash
# 将 "修复登录 bug" 合并到 "添加用户登录功能"
pick abc1234 添加用户登录功能
squash def5678 修复登录 bug
pick ghi9012 添加登录日志
```

**2. 修改提交信息**

```bash
pick abc1234 添加用户登录功能
reword def5678 修复登录 bug  # 会提示输入新的提交信息
pick ghi9012 添加登录日志
```

**3. 重新排序提交**

```bash
pick ghi9012 添加登录日志
pick abc1234 添加用户登录功能
pick def5678 修复登录 bug
```

**4. 拆分提交**

```bash
# 标记要拆分的提交为 edit
pick abc1234 添加用户登录功能
edit def5678 修复登录 bug 和添加验证码  # 这个提交太大了
pick ghi9012 添加登录日志
```

```bash
# Git 会在 def5678 处停下
git reset HEAD^  # 取消提交但保留更改
git add login-fix.js
git commit -m "修复登录 bug"
git add captcha.js
git commit -m "添加验证码功能"
git rebase --continue
```

## Git Stash 高级用法

### 基础操作

```bash
# 暂存当前更改
git stash

# 暂存并添加描述
git stash push -m "正在开发的登录功能"

# 查看暂存列表
git stash list
# stash@{0}: On main: 正在开发的登录功能
# stash@{1}: WIP on main: abc1234 上一个提交

# 应用最近的暂存
git stash pop

# 应用特定暂存
git stash apply stash@{1}

# 删除暂存
git stash drop stash@{0}
```

### 高级技巧

```bash
# 暂存包括未跟踪的文件
git stash -u
# 或
git stash --include-untracked

# 暂存所有文件（包括被忽略的）
git stash -a
# 或
git stash --all

# 从暂存创建分支
git stash branch feature/login stash@{0}

# 查看暂存的具体内容
git stash show -p stash@{0}

# 只暂存部分更改（交互式）
git stash -p
```

## Git Bisect：二分查找 Bug

当你知道某个 bug 是在某次提交引入的，但不知道具体是哪一次，`git bisect` 可以帮你快速定位。

### 手动二分

```bash
# 开始二分
git bisect start

# 标记当前版本有 bug
git bisect bad

# 标记已知正常的版本
git bisect good v1.0.0

# Git 会自动检出中间版本，测试后标记
git bisect good  # 这个版本没问题
# 或
git bisect bad   # 这个版本有问题

# 重复直到找到第一个有问题的提交
# Bisecting: 0 revisions left to test
# abc1234 is the first bad commit

# 结束二分
git bisect reset
```

### 自动化二分

```bash
# 使用测试脚本自动化
git bisect start HEAD v1.0.0
git bisect run npm test

# 脚本返回 0 表示 good，非 0 表示 bad
# Git 会自动找到引入 bug 的提交
```

## Git Worktree：多分支并行开发

Worktree 让你可以同时在多个分支上工作，而不需要来回切换。

```bash
# 创建新的工作树
git worktree add ../project-hotfix hotfix/urgent-fix
git worktree add ../project-feature feature/new-login

# 现在你有三个目录：
# /project          (main 分支)
# /project-hotfix   (hotfix/urgent-fix 分支)
# /project-feature  (feature/new-login 分支)

# 查看所有工作树
git worktree list

# 删除工作树
git worktree remove ../project-hotfix

# 清理已删除分支对应的工作树
git worktree prune
```

### 使用场景

```
场景：你正在开发新功能，突然需要修复紧急 bug

传统方式：
1. git stash
2. git checkout hotfix
3. 修复 bug
4. git checkout feature
5. git stash pop

Worktree 方式：
1. git worktree add ../hotfix hotfix
2. cd ../hotfix
3. 修复 bug
4. cd ../project  # 继续之前的工作，无需 stash
```

## Git Reflog：时光机器

Reflog 记录了 HEAD 的所有移动历史，是恢复"丢失"提交的救命稻草。

```bash
# 查看 reflog
git reflog
# abc1234 HEAD@{0}: commit: 添加新功能
# def5678 HEAD@{1}: checkout: moving from main to feature
# ghi9012 HEAD@{2}: commit: 上一个提交
# ...

# 恢复到之前的状态
git reset --hard HEAD@{2}

# 恢复被删除的分支
git checkout -b recovered-branch HEAD@{5}

# 恢复被重置的提交
git cherry-pick abc1234
```

### 恢复场景

```bash
# 场景 1：误执行了 git reset --hard
git reflog
# 找到重置前的 HEAD
git reset --hard HEAD@{1}

# 场景 2：误删除了分支
git reflog
# 找到分支最后的提交
git checkout -b my-branch HEAD@{3}

# 场景 3：误执行了 git rebase
git reflog
# 找到 rebase 前的状态
git reset --hard HEAD@{5}
```

## Git Hooks：自动化工作流

Git Hooks 让你可以在特定事件发生时运行脚本。

### 常用 Hooks

```bash
# .git/hooks/ 目录下的钩子文件
pre-commit      # 提交前运行
prepare-commit-msg  # 准备提交信息时
commit-msg      # 验证提交信息
post-commit     # 提交后运行
pre-push        # 推送前运行
```

### 示例：pre-commit

```bash
#!/bin/sh
# .git/hooks/pre-commit

# 运行 lint
npm run lint
if [ $? -ne 0 ]; then
  echo "Lint 检查失败，请修复后再提交"
  exit 1
fi

# 运行测试
npm test
if [ $? -ne 0 ]; then
  echo "测试失败，请修复后再提交"
  exit 1
fi

exit 0
```

### 使用 Husky（推荐）

```bash
# 安装
npm install husky -D
npx husky init

# 添加 pre-commit hook
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

## 高级 Git 配置

### 有用的别名

```bash
# ~/.gitconfig
[alias]
  # 简短命令
  co = checkout
  br = branch
  ci = commit
  st = status

  # 美化日志
  lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

  # 查看最近的分支
  recent = branch --sort=-committerdate --format='%(committerdate:relative)%09%(refname:short)'

  # 撤销上一个提交
  undo = reset HEAD~1 --mixed

  # 修改上一个提交
  amend = commit --amend --no-edit

  # 查看文件历史
  filelog = log -p --follow --

  # 清理已合并的分支
  cleanup = "!git branch --merged | grep -v '\\*\\|main\\|master' | xargs -n 1 git branch -d"
```

### 其他实用配置

```bash
# ~/.gitconfig
[core]
  # 默认编辑器
  editor = code --wait

  # 自动修正换行符
  autocrlf = input

[pull]
  # pull 时使用 rebase 而非 merge
  rebase = true

[push]
  # 推送时自动设置上游分支
  autoSetupRemote = true

[rerere]
  # 记住冲突解决方案
  enabled = true

[diff]
  # 更好的差异算法
  algorithm = histogram

[merge]
  # 冲突时显示原始版本
  conflictstyle = zdiff3
```

## Git 工作流

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
│           短生命周期的功能分支，频繁合并               │
└─────────────────────────────────────────────────────┘
```

## 实用技巧集锦

### 查找丢失的提交

```bash
# 搜索提交信息
git log --all --grep="关键词"

# 搜索代码变更
git log --all -S "代码片段"

# 搜索正则表达式
git log --all -G "正则表达式"
```

### 批量修改历史

```bash
# 修改所有提交的邮箱（谨慎使用！）
git filter-branch --env-filter '
if [ "$GIT_AUTHOR_EMAIL" = "old@email.com" ]; then
    export GIT_AUTHOR_EMAIL="new@email.com"
    export GIT_COMMITTER_EMAIL="new@email.com"
fi
' --tag-name-filter cat -- --branches --tags

# 更推荐使用 git-filter-repo
pip install git-filter-repo
git filter-repo --email-callback 'return email.replace(b"old@email.com", b"new@email.com")'
```

### 部分克隆

```bash
# 浅克隆（只获取最近的历史）
git clone --depth 1 https://github.com/user/repo.git

# 稀疏检出（只获取部分目录）
git clone --filter=blob:none --sparse https://github.com/user/repo.git
cd repo
git sparse-checkout set src/components
```

## 总结

Git 高级技巧让你能够：

| 技巧 | 用途 |
|------|------|
| Interactive Rebase | 整理提交历史 |
| Stash | 临时保存工作 |
| Bisect | 二分查找 bug |
| Worktree | 多分支并行开发 |
| Reflog | 恢复丢失的工作 |
| Hooks | 自动化工作流 |

**关键收获**：

1. `git rebase -i` 是整理历史的利器
2. `git reflog` 可以恢复几乎任何"丢失"的工作
3. `git worktree` 让多分支开发更高效
4. `git bisect` 能快速定位引入 bug 的提交
5. 合理的 alias 配置能大幅提升效率

掌握这些高级技巧，Git 将从一个版本控制工具变成你的开发超能力。

---

*版本控制不只是保存历史，更是掌控历史的艺术。*
