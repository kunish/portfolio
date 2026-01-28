---
title: 'CI/CD Continuous Integration and Deployment: Automated Delivery Pipelines'
description: 'Master GitHub Actions, GitLab CI, automated testing, deployment strategies and release management'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'cicd-continuous-integration-deployment'
---

CI/CD is a core practice in modern software development. This article explores how to build efficient automated delivery pipelines.

## CI/CD Basic Concepts

### Continuous Integration vs Continuous Deployment

```
CI/CD Pipeline:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Continuous Integration (CI)                       │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│   │Commit│→ │Build │→ │ Test │→ │Analyze│          │
│   └──────┘  └──────┘  └──────┘  └──────┘          │
│                                                     │
│   Continuous Delivery (CD)                          │
│   ┌──────┐  ┌──────┐  ┌──────┐                    │
│   │Package│→│Stage │→ │Approve│→ Manual Deploy    │
│   └──────┘  └──────┘  └──────┘                    │
│                                                     │
│   Continuous Deployment (CD)                        │
│   ┌──────┐  ┌──────┐  ┌──────┐                    │
│   │Package│→│Deploy│→ │Verify │→ Auto Production  │
│   └──────┘  └──────┘  └──────┘                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Stage | CI | Continuous Delivery | Continuous Deployment |
|-------|-----|---------------------|----------------------|
| Code Merge | Auto | Auto | Auto |
| Testing | Auto | Auto | Auto |
| Build | Auto | Auto | Auto |
| Deploy to Prod | Manual | Manual Approval | Auto |

## GitHub Actions

### Basic Workflow

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

### Docker Build and Push

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

### Deployment Workflow

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

### Complete Pipeline

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

# Cache configuration
.node-cache:
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
    policy: pull-push

# Lint stage
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

# Test stage
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

# Build stage
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

# Deploy to staging
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

# Deploy to production
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

## Deployment Strategies

### Blue-Green Deployment

```yaml
# Kubernetes Blue-Green Deployment
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
    version: blue  # Switch to green for deployment
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

### Canary Release

```yaml
# Kubernetes Canary Release
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
// Canary deployment script
async function canaryDeploy() {
  const weights = [10, 25, 50, 75, 100];

  for (const weight of weights) {
    console.log(`Setting canary weight to ${weight}%`);

    // Update Ingress weight
    await kubectl.patch('ingress', 'myapp-canary', {
      metadata: {
        annotations: {
          'nginx.ingress.kubernetes.io/canary-weight': weight.toString(),
        },
      },
    });

    // Wait and check metrics
    await sleep(300000); // 5 minutes

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

### Rolling Update

```yaml
# Kubernetes Rolling Update
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max extra pods
      maxUnavailable: 0  # Max unavailable pods
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

## Automated Testing

### Test Pyramid Strategy

```yaml
# Test job configuration
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

### Parallel Testing

```yaml
# Parallel test configuration
test:
  stage: test
  parallel: 4
  script:
    - npm run test -- --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

## Security Scanning

```yaml
# Security scanning jobs
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

## Release Management

### Semantic Versioning

```yaml
# Automatic version management
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

## Best Practices Summary

```
CI/CD Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Pipeline Design                                   │
│   ├── Fast feedback                               │
│   ├── Parallel execution                          │
│   ├── Cache optimization                          │
│   └── Fail fast                                   │
│                                                     │
│   Testing Strategy                                  │
│   ├── Test pyramid                                │
│   ├── Parallel testing                            │
│   ├── Test isolation                              │
│   └── Coverage reporting                          │
│                                                     │
│   Deployment Strategy                               │
│   ├── Environment isolation                       │
│   ├── Progressive rollout                         │
│   ├── Automatic rollback                          │
│   └── Feature flags                               │
│                                                     │
│   Security & Compliance                             │
│   ├── Secret management                           │
│   ├── Vulnerability scanning                      │
│   ├── Audit logging                               │
│   └── Access control                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach |
|----------|---------------------|
| Small Teams | GitHub Actions |
| Enterprise | GitLab CI / Jenkins |
| Cloud Native | ArgoCD / Flux |
| Multi-Cloud | Terraform + CI |
| Mobile Apps | Fastlane + CI |

CI/CD is not just tools, it's a culture. Automate everything that can be automated, letting teams focus on creating value.

---

*Automation is the foundation of efficiency. CI/CD makes software delivery reliable, repeatable, and predictable.*
