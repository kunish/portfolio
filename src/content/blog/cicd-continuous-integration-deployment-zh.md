---
title: 'CI/CD 持续集成与持续部署：自动化交付流水线'
description: '掌握 GitHub Actions、GitLab CI、自动化测试、部署策略和发布管理'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'cicd-continuous-integration-deployment'
---

CI/CD 是现代软件开发的核心实践。本文深入探讨如何构建高效的自动化交付流水线。

## CI/CD 基础概念

### 持续集成 vs 持续部署

```
CI/CD 流水线：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   持续集成 (CI)                                     │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│   │ 提交 │→ │ 构建 │→ │ 测试 │→ │ 分析 │          │
│   └──────┘  └──────┘  └──────┘  └──────┘          │
│                                                     │
│   持续交付 (CD)                                     │
│   ┌──────┐  ┌──────┐  ┌──────┐                    │
│   │ 打包 │→ │ 暂存 │→ │ 审批 │→ 手动部署         │
│   └──────┘  └──────┘  └──────┘                    │
│                                                     │
│   持续部署 (CD)                                     │
│   ┌──────┐  ┌──────┐  ┌──────┐                    │
│   │ 打包 │→ │ 部署 │→ │ 验证 │→ 自动生产         │
│   └──────┘  └──────┘  └──────┘                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 阶段 | 持续集成 | 持续交付 | 持续部署 |
|------|----------|----------|----------|
| 代码合并 | 自动 | 自动 | 自动 |
| 测试 | 自动 | 自动 | 自动 |
| 构建 | 自动 | 自动 | 自动 |
| 部署到生产 | 手动 | 手动审批 | 自动 |

## GitHub Actions

### 基础工作流

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
```

### Docker 构建与发布

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
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

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
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

### 部署工作流

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  deploy-staging:
    if: github.event_name == 'push' || github.event.inputs.environment == 'staging'
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /app
            docker compose pull
            docker compose up -d
            docker system prune -f

  deploy-production:
    if: github.event.inputs.environment == 'production'
    runs-on: ubuntu-latest
    environment: production
    needs: deploy-staging

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /app
            docker compose pull
            docker compose up -d --no-deps --scale app=3
            sleep 30
            docker compose up -d
```

## GitLab CI

### 完整流水线

```yaml
# .gitlab-ci.yml
stages:
  - lint
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

# 缓存配置
.node-cache:
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
    policy: pull-push

# Lint 阶段
lint:
  stage: lint
  image: node:${NODE_VERSION}
  extends: .node-cache
  script:
    - npm ci
    - npm run lint
  only:
    - merge_requests
    - main

# 测试阶段
test:
  stage: test
  image: node:${NODE_VERSION}
  extends: .node-cache
  services:
    - postgres:15
  variables:
    POSTGRES_DB: test
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    DATABASE_URL: postgresql://test:test@postgres:5432/test
  script:
    - npm ci
    - npm test
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

# 构建阶段
build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
    - docker tag $DOCKER_IMAGE $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:latest
  only:
    - main

# 部署到预发布
deploy-staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | ssh-add -
  script:
    - ssh -o StrictHostKeyChecking=no $SSH_USER@$STAGING_HOST "
        docker pull $DOCKER_IMAGE &&
        docker compose up -d"
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - main

# 部署到生产
deploy-production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | ssh-add -
  script:
    - ssh -o StrictHostKeyChecking=no $SSH_USER@$PRODUCTION_HOST "
        docker pull $DOCKER_IMAGE &&
        docker compose up -d"
  environment:
    name: production
    url: https://example.com
  when: manual
  only:
    - main
```

## 部署策略

### 蓝绿部署

```yaml
# Kubernetes 蓝绿部署
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
    version: blue  # 切换到 green 实现部署
  ports:
    - port: 80
      targetPort: 3000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue
  template:
    metadata:
      labels:
        app: myapp
        version: blue
    spec:
      containers:
        - name: myapp
          image: myapp:1.0.0
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: green
  template:
    metadata:
      labels:
        app: myapp
        version: green
    spec:
      containers:
        - name: myapp
          image: myapp:1.1.0
```

### 金丝雀发布

```yaml
# Kubernetes 金丝雀发布
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-canary
                port:
                  number: 80
```

```typescript
// 金丝雀发布脚本
async function canaryDeploy() {
  const weights = [10, 25, 50, 75, 100];

  for (const weight of weights) {
    console.log(`Setting canary weight to ${weight}%`);

    // 更新 Ingress 权重
    await kubectl.patch('ingress', 'myapp-canary', {
      metadata: {
        annotations: {
          'nginx.ingress.kubernetes.io/canary-weight': weight.toString(),
        },
      },
    });

    // 等待并检查指标
    await sleep(300000); // 5 分钟

    const metrics = await getMetrics();

    if (metrics.errorRate > 0.01) {
      console.log('Error rate too high, rolling back');
      await rollback();
      return;
    }

    console.log(`Canary at ${weight}% is healthy`);
  }

  console.log('Canary deployment complete');
}
```

### 滚动更新

```yaml
# Kubernetes 滚动更新
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 最多额外 Pod 数
      maxUnavailable: 0  # 最多不可用 Pod 数
  template:
    spec:
      containers:
        - name: myapp
          image: myapp:1.1.0
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 10
```

## 自动化测试

### 测试金字塔策略

```yaml
# 测试作业配置
test-unit:
  stage: test
  script:
    - npm run test:unit
  artifacts:
    reports:
      junit: coverage/junit.xml

test-integration:
  stage: test
  services:
    - postgres:15
    - redis:7
  script:
    - npm run test:integration

test-e2e:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0
  script:
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - test-results/
    reports:
      junit: test-results/junit.xml
```

### 并行测试

```yaml
# 并行测试配置
test:
  stage: test
  parallel: 4
  script:
    - npm run test -- --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

## 安全扫描

```yaml
# 安全扫描作业
security-scan:
  stage: test
  image: aquasec/trivy:latest
  script:
    - trivy fs --exit-code 1 --severity HIGH,CRITICAL .
  allow_failure: true

dependency-check:
  stage: test
  script:
    - npm audit --audit-level=high
  allow_failure: true

sast:
  stage: test
  image: returntocorp/semgrep
  script:
    - semgrep --config=auto --error .
```

## 发布管理

### 语义化版本

```yaml
# 自动版本管理
release:
  stage: deploy
  image: node:20
  script:
    - npx semantic-release
  only:
    - main
```

```javascript
// release.config.js
module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/github',
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json'],
      message: 'chore(release): ${nextRelease.version}',
    }],
  ],
};
```

## 最佳实践总结

```
CI/CD 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   流水线设计                                        │
│   ├── 快速反馈                                      │
│   ├── 并行执行                                      │
│   ├── 缓存优化                                      │
│   └── 失败快速                                      │
│                                                     │
│   测试策略                                          │
│   ├── 测试金字塔                                    │
│   ├── 并行测试                                      │
│   ├── 测试隔离                                      │
│   └── 覆盖率报告                                    │
│                                                     │
│   部署策略                                          │
│   ├── 环境隔离                                      │
│   ├── 渐进式发布                                    │
│   ├── 自动回滚                                      │
│   └── 功能开关                                      │
│                                                     │
│   安全合规                                          │
│   ├── 密钥管理                                      │
│   ├── 漏洞扫描                                      │
│   ├── 审计日志                                      │
│   └── 权限控制                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| 小团队 | GitHub Actions |
| 企业级 | GitLab CI / Jenkins |
| 云原生 | ArgoCD / Flux |
| 多云部署 | Terraform + CI |
| 移动应用 | Fastlane + CI |

CI/CD 不仅是工具，更是文化。自动化一切可以自动化的，让团队专注于创造价值。

---

*自动化是效率的基石，CI/CD 让软件交付变得可靠、可重复、可预测。*
