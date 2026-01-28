---
title: 'GitHub Actions 完全指南：自动化 CI/CD 流水线'
description: '掌握 GitHub Actions 核心概念，构建高效的持续集成和持续部署工作流'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'github-actions-cicd-guide'
---

自动化是现代软件开发的基石。GitHub Actions 让你在代码仓库中直接构建 CI/CD 流水线，无需额外的工具或服务。本文将带你从零掌握 GitHub Actions。

## 为什么选择 GitHub Actions？

### CI/CD 工具对比

```
CI/CD 工具生态：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   GitHub Actions                                    │
│   ├── 原生集成 GitHub                               │
│   ├── 丰富的 Marketplace                           │
│   ├── 免费额度充足                                  │
│   └── YAML 配置简洁                                │
│                                                     │
│   其他选择：                                        │
│   ├── Jenkins      → 自托管，配置复杂               │
│   ├── CircleCI     → 云服务，配置友好               │
│   ├── GitLab CI    → GitLab 原生                   │
│   └── Travis CI    → 老牌，开源项目常用              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 特性 | GitHub Actions | Jenkins | CircleCI |
|------|----------------|---------|----------|
| 托管方式 | 云托管 | 自托管 | 云托管 |
| 配置语言 | YAML | Groovy | YAML |
| GitHub 集成 | 原生 | 插件 | API |
| 免费额度 | 2000分钟/月 | 无限（自托管）| 6000分钟/月 |
| 学习曲线 | 低 | 高 | 中 |

## 核心概念

### 工作流结构

```yaml
# .github/workflows/ci.yml
name: CI Pipeline                    # 工作流名称

on:                                  # 触发条件
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:                                 # 全局环境变量
  NODE_VERSION: '20'

jobs:                                # 作业定义
  build:                             # 作业 ID
    runs-on: ubuntu-latest           # 运行环境
    steps:                           # 步骤列表
      - uses: actions/checkout@v4    # 使用 Action
      - name: Setup Node.js          # 步骤名称
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci                  # 运行命令
      - run: npm test
```

### 事件触发

```yaml
on:
  # 推送事件
  push:
    branches:
      - main
      - 'release/**'
    tags:
      - 'v*'
    paths:
      - 'src/**'
      - 'package.json'
    paths-ignore:
      - '**.md'
      - 'docs/**'

  # PR 事件
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

  # 定时触发
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨 2 点

  # 手动触发
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

  # 其他工作流完成时
  workflow_run:
    workflows: ["Build"]
    types: [completed]

  # 发布事件
  release:
    types: [published]
```

### 作业与步骤

```yaml
jobs:
  # 第一个作业
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  # 依赖第一个作业
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build

  # 并行作业
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint

  # 矩阵策略
  test-matrix:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [18, 20, 22]
        exclude:
          - os: windows-latest
            node: 18
      fail-fast: false
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```

## 完整 CI 流水线

### Node.js 项目

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
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

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
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

      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test:
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

      - run: pnpm install --frozen-lockfile
      - run: pnpm test:coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 7
```

### E2E 测试

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
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

      - run: pnpm install --frozen-lockfile

      - name: Install Playwright Browsers
        run: pnpm exec playwright install --with-deps

      - name: Run Playwright tests
        run: pnpm test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-screenshots
          path: test-results/
          retention-days: 7
```

## CD 部署流水线

### 部署到 Vercel

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Deploy to Vercel
        id: deploy
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 部署到 AWS

```yaml
# .github/workflows/deploy-aws.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

env:
  AWS_REGION: ap-northeast-1
  ECR_REPOSITORY: my-app
  ECS_SERVICE: my-app-service
  ECS_CLUSTER: my-cluster
  CONTAINER_NAME: my-app

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Update ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}

      - name: Deploy to Amazon ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
```

### Docker 镜像发布

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    tags:
      - 'v*'

jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: |
            ghcr.io/${{ github.repository }}
            ${{ secrets.DOCKERHUB_USERNAME }}/my-app
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## 高级特性

### Secrets 和环境变量

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # 使用环境保护规则
    env:
      API_URL: https://api.example.com
    steps:
      - name: Deploy
        env:
          API_KEY: ${{ secrets.API_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          echo "Deploying to $API_URL"
          ./deploy.sh
```

### 可复用工作流

```yaml
# .github/workflows/reusable-build.yml
name: Reusable Build Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: false
        type: string
        default: '20'
      environment:
        required: true
        type: string
    secrets:
      npm-token:
        required: true
    outputs:
      artifact-name:
        description: 'Name of the build artifact'
        value: ${{ jobs.build.outputs.artifact-name }}

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact-name: ${{ steps.artifact.outputs.name }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}

      - run: npm ci
        env:
          NPM_TOKEN: ${{ secrets.npm-token }}

      - run: npm run build

      - id: artifact
        run: echo "name=build-${{ inputs.environment }}" >> $GITHUB_OUTPUT

      - uses: actions/upload-artifact@v4
        with:
          name: ${{ steps.artifact.outputs.name }}
          path: dist/
```

```yaml
# .github/workflows/main.yml
name: Main Pipeline

on:
  push:
    branches: [main]

jobs:
  build-staging:
    uses: ./.github/workflows/reusable-build.yml
    with:
      environment: staging
    secrets:
      npm-token: ${{ secrets.NPM_TOKEN }}

  build-production:
    uses: ./.github/workflows/reusable-build.yml
    with:
      environment: production
      node-version: '20'
    secrets:
      npm-token: ${{ secrets.NPM_TOKEN }}
```

### 复合 Action

```yaml
# .github/actions/setup-project/action.yml
name: 'Setup Project'
description: 'Setup Node.js and install dependencies'

inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '20'

runs:
  using: 'composite'
  steps:
    - uses: pnpm/action-setup@v2
      with:
        version: 8

    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'pnpm'

    - run: pnpm install --frozen-lockfile
      shell: bash
```

```yaml
# 使用复合 Action
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          node-version: '20'
      - run: pnpm build
```

### 条件执行

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      # 仅在 PR 合并时运行
      - name: Deploy
        if: github.event_name == 'push'
        run: ./deploy.sh

      # 仅在特定文件更改时运行
      - name: Build docs
        if: contains(github.event.head_commit.modified, 'docs/')
        run: npm run build:docs

      # 仅在成功时运行
      - name: Notify success
        if: success()
        run: ./notify.sh success

      # 总是运行（清理）
      - name: Cleanup
        if: always()
        run: ./cleanup.sh

      # 仅在失败时运行
      - name: Notify failure
        if: failure()
        run: ./notify.sh failure
```

### 缓存策略

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # pnpm 缓存（推荐使用 setup-node 内置缓存）
      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      # 自定义缓存
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: |
            playwright-${{ runner.os }}-

      # Turbo 缓存
      - name: Cache Turbo
        uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-${{ github.sha }}
          restore-keys: |
            turbo-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-
            turbo-${{ runner.os }}-
```

## 最佳实践

### 安全性

```yaml
jobs:
  security:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4

      # 依赖审计
      - name: Audit dependencies
        run: npm audit --audit-level=high

      # 代码扫描
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

      # Secret 扫描
      - name: Detect secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

### 工作流组织

```
.github/
├── workflows/
│   ├── ci.yml              # 持续集成
│   ├── cd.yml              # 持续部署
│   ├── release.yml         # 发布流程
│   ├── security.yml        # 安全扫描
│   └── reusable-*.yml      # 可复用工作流
├── actions/
│   └── setup-project/      # 复合 Action
│       └── action.yml
└── CODEOWNERS              # 代码审查规则
```

### 性能优化

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 完整历史（用于 changelog）
          # 或
          fetch-depth: 1  # 仅最新提交（更快）

      # 并行步骤（通过多个作业）
      # 使用 needs 控制依赖

      # 使用更快的运行器
      # runs-on: ubuntu-latest-xl

      # 跳过不必要的步骤
      - name: Build
        if: "!contains(github.event.head_commit.message, '[skip ci]')"
        run: npm run build
```

## 监控与调试

### 调试模式

```yaml
# 在 Secrets 中设置 ACTIONS_RUNNER_DEBUG=true
# 或在运行时启用
env:
  ACTIONS_RUNNER_DEBUG: true
  ACTIONS_STEP_DEBUG: true
```

### 状态徽章

```markdown
![CI](https://github.com/owner/repo/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/owner/repo/actions/workflows/deploy.yml/badge.svg?branch=main)
```

## 总结

```
GitHub Actions 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   工作流设计                                        │
│   ├── 使用并发控制避免重复运行                       │
│   ├── 合理使用缓存加速构建                          │
│   ├── 拆分作业实现并行执行                          │
│   └── 使用可复用工作流减少重复                       │
│                                                     │
│   安全性                                            │
│   ├── 最小化 Secrets 权限范围                       │
│   ├── 使用 OIDC 替代长期凭证                        │
│   ├── 启用依赖审计和代码扫描                        │
│   └── 使用环境保护规则                              │
│                                                     │
│   可维护性                                          │
│   ├── 使用描述性的作业和步骤名称                     │
│   ├── 添加必要的注释说明                            │
│   ├── 版本锁定 Action（使用 SHA）                   │
│   └── 定期更新依赖的 Action                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| 代码检查 | lint + typecheck + test 并行 |
| 构建部署 | 需要依赖的顺序执行 |
| 多环境测试 | 矩阵策略 |
| 重复逻辑 | 可复用工作流或复合 Action |

GitHub Actions 让 CI/CD 变得简单而强大。从简单的自动测试开始，逐步构建完整的自动化流水线。

---

*自动化不是目的，可靠且快速地交付价值才是。让机器做重复的事，让人专注于创造。*
