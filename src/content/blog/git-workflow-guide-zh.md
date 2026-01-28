---
title: 'Git 工作流完全指南：从分支策略到团队协作'
description: '掌握 Git Flow、GitHub Flow 等分支模型及团队协作最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'git-workflow-guide'
---

Git 工作流是团队协作的基础。本文探讨常见的分支策略和团队协作实践。

## 分支基础

### 分支操作

```bash
# 查看分支
git branch          # 本地分支
git branch -r       # 远程分支
git branch -a       # 所有分支

# 创建分支
git branch feature/login
git checkout -b feature/login    # 创建并切换
git switch -c feature/login      # Git 2.23+ 推荐

# 切换分支
git checkout main
git switch main     # Git 2.23+ 推荐

# 删除分支
git branch -d feature/login      # 安全删除
git branch -D feature/login      # 强制删除
git push origin --delete feature/login  # 删除远程分支

# 重命名分支
git branch -m old-name new-name
```

### 合并策略

```bash
# 普通合并（保留历史）
git merge feature/login

# 快进合并（线性历史）
git merge --ff-only feature/login

# 禁止快进（总是创建合并提交）
git merge --no-ff feature/login

# Squash 合并（压缩为单个提交）
git merge --squash feature/login
git commit -m "Add login feature"

# Rebase（变基）
git checkout feature/login
git rebase main
git checkout main
git merge feature/login  # 快进合并
```

## Git Flow 工作流

### 分支模型

```
Git Flow 分支结构：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   main (生产分支)                                   │
│   ├── 只接受 release 和 hotfix 合并                │
│   └── 每个提交都是可发布版本                       │
│                                                     │
│   develop (开发分支)                                │
│   ├── 接受 feature 分支合并                        │
│   └── 下一版本的开发基线                           │
│                                                     │
│   feature/* (功能分支)                              │
│   ├── 从 develop 分出                              │
│   └── 合并回 develop                               │
│                                                     │
│   release/* (发布分支)                              │
│   ├── 从 develop 分出                              │
│   └── 合并到 main 和 develop                       │
│                                                     │
│   hotfix/* (热修复分支)                             │
│   ├── 从 main 分出                                 │
│   └── 合并到 main 和 develop                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Git Flow 实践

```bash
# 开始新功能
git checkout develop
git checkout -b feature/user-auth

# 开发完成
git checkout develop
git merge --no-ff feature/user-auth
git branch -d feature/user-auth

# 准备发布
git checkout develop
git checkout -b release/1.0.0

# 发布完成
git checkout main
git merge --no-ff release/1.0.0
git tag -a v1.0.0 -m "Version 1.0.0"
git checkout develop
git merge --no-ff release/1.0.0
git branch -d release/1.0.0

# 紧急修复
git checkout main
git checkout -b hotfix/fix-login
# 修复后
git checkout main
git merge --no-ff hotfix/fix-login
git tag -a v1.0.1 -m "Version 1.0.1"
git checkout develop
git merge --no-ff hotfix/fix-login
git branch -d hotfix/fix-login
```

## GitHub Flow 工作流

### 简化模型

```
GitHub Flow 流程：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   1. 从 main 创建功能分支                          │
│      git checkout -b feature/new-feature            │
│                                                     │
│   2. 进行开发并提交                                │
│      git add . && git commit                        │
│                                                     │
│   3. 推送到远程                                    │
│      git push -u origin feature/new-feature         │
│                                                     │
│   4. 创建 Pull Request                             │
│      在 GitHub 上发起 PR                           │
│                                                     │
│   5. 代码审查和讨论                                │
│      团队成员审查代码                              │
│                                                     │
│   6. 合并到 main                                   │
│      审查通过后合并                                │
│                                                     │
│   7. 删除功能分支                                  │
│      git branch -d feature/new-feature              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### PR 最佳实践

```markdown
## PR 模板示例

### 变更描述
简要说明这个 PR 做了什么

### 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档更新

### 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试通过

### 相关 Issue
Closes #123

### 截图（如适用）
```

## Trunk-Based 开发

### 主干开发模式

```
Trunk-Based 开发：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   核心原则                                          │
│   ├── 直接在 main/trunk 分支开发                   │
│   ├── 短期功能分支（最多 1-2 天）                  │
│   ├── 频繁集成（每天多次）                         │
│   └── 使用功能开关控制未完成功能                   │
│                                                     │
│   适用场景                                          │
│   ├── 持续部署环境                                 │
│   ├── 小型敏捷团队                                 │
│   └── 需要快速迭代                                 │
│                                                     │
│   功能开关示例                                      │
│   if (featureFlags.newCheckout) {                  │
│     // 新结账流程                                  │
│   } else {                                         │
│     // 旧结账流程                                  │
│   }                                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 提交规范

### Conventional Commits

```bash
# 格式
<type>(<scope>): <subject>

<body>

<footer>

# 类型
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式（不影响代码逻辑）
refactor: 重构（既不是新功能也不是修复）
perf:     性能优化
test:     测试相关
chore:    构建过程或辅助工具的变动

# 示例
feat(auth): add OAuth2 login support

Implement OAuth2 authentication flow with Google and GitHub providers.

Closes #123
```

### 提交信息示例

```bash
# 好的提交信息
git commit -m "feat(cart): add quantity adjustment buttons"
git commit -m "fix(auth): resolve token refresh race condition"
git commit -m "docs(api): update authentication endpoints"
git commit -m "refactor(user): extract validation logic to utils"

# 差的提交信息（避免）
git commit -m "fix bug"
git commit -m "update code"
git commit -m "WIP"
```

## 冲突解决

### 处理合并冲突

```bash
# 合并时遇到冲突
git merge feature/login
# 自动合并失败，需要手动解决

# 查看冲突文件
git status

# 冲突标记
<<<<<<< HEAD
当前分支的代码
=======
要合并分支的代码
>>>>>>> feature/login

# 解决后
git add <resolved-files>
git commit  # 完成合并

# 或放弃合并
git merge --abort
```

### 使用 Rebase 解决

```bash
# Rebase 时解决冲突
git checkout feature/login
git rebase main

# 遇到冲突时
# 解决冲突后
git add <resolved-files>
git rebase --continue

# 或跳过当前提交
git rebase --skip

# 或放弃 rebase
git rebase --abort
```

## 团队协作实践

### 代码审查清单

```
代码审查要点：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   功能性                                            │
│   ├── 代码是否实现了需求                           │
│   ├── 边界条件是否处理                             │
│   └── 错误处理是否完善                             │
│                                                     │
│   可读性                                            │
│   ├── 命名是否清晰                                 │
│   ├── 代码是否易于理解                             │
│   └── 注释是否必要且准确                           │
│                                                     │
│   设计                                              │
│   ├── 是否遵循设计模式                             │
│   ├── 是否有重复代码                               │
│   └── 依赖是否合理                                 │
│                                                     │
│   测试                                              │
│   ├── 测试覆盖率是否足够                           │
│   ├── 测试用例是否有意义                           │
│   └── 是否测试了边界情况                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 分支命名约定

```bash
# 功能分支
feature/user-authentication
feature/JIRA-123-add-login

# Bug 修复
fix/login-validation
bugfix/JIRA-456-null-pointer

# 热修复
hotfix/security-patch
hotfix/v1.2.1

# 发布分支
release/1.0.0
release/2024-01

# 实验性分支
experiment/new-algorithm
spike/graphql-migration
```

## 工作流对比

| 特性 | Git Flow | GitHub Flow | Trunk-Based |
|------|----------|-------------|-------------|
| 复杂度 | 高 | 低 | 低 |
| 分支数量 | 多 | 少 | 最少 |
| 发布周期 | 长 | 短 | 最短 |
| 适用团队 | 大型 | 中小型 | 敏捷团队 |
| 持续部署 | 困难 | 容易 | 最容易 |

## 最佳实践总结

```
Git 工作流最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   分支管理                                          │
│   ├── 保持分支短期存在                             │
│   ├── 频繁同步主分支                               │
│   ├── 删除已合并分支                               │
│   └── 使用描述性分支名                             │
│                                                     │
│   提交习惯                                          │
│   ├── 小而频繁的提交                               │
│   ├── 遵循提交规范                                 │
│   ├── 每个提交都可构建                             │
│   └── 不提交敏感信息                               │
│                                                     │
│   协作流程                                          │
│   ├── 必须代码审查                                 │
│   ├── 自动化测试通过                               │
│   ├── 文档同步更新                                 │
│   └── 及时沟通和反馈                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

*选择适合团队的工作流，让协作更高效。*
