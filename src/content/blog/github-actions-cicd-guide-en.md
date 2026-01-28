---
title: 'Complete GitHub Actions Guide: Automating CI/CD Pipelines'
description: 'Master GitHub Actions core concepts and build efficient continuous integration and deployment workflows'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'github-actions-cicd-guide'
---

Automation is the cornerstone of modern software development. GitHub Actions lets you build CI/CD pipelines directly in your code repository without additional tools or services. This article will take you from zero to mastering GitHub Actions.

## Why Choose GitHub Actions?

### CI/CD Tool Comparison

```
CI/CD Tool Ecosystem:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   GitHub Actions                                    │
│   ├── Native GitHub integration                     │
│   ├── Rich Marketplace                              │
│   ├── Generous free tier                            │
│   └── Clean YAML configuration                      │
│                                                     │
│   Other Options:                                    │
│   ├── Jenkins      → Self-hosted, complex config    │
│   ├── CircleCI     → Cloud service, friendly config │
│   ├── GitLab CI    → GitLab native                  │
│   └── Travis CI    → Classic, popular for OSS       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Feature | GitHub Actions | Jenkins | CircleCI |
|---------|----------------|---------|----------|
| Hosting | Cloud | Self-hosted | Cloud |
| Config Language | YAML | Groovy | YAML |
| GitHub Integration | Native | Plugin | API |
| Free Tier | 2000 min/month | Unlimited (self) | 6000 min/month |
| Learning Curve | Low | High | Medium |

## Core Concepts

### Workflow Structure

```yaml
# .github/workflows/ci.yml
name: CI Pipeline                    # Workflow name

on:                                  # Trigger conditions
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:                                 # Global environment variables
  NODE_VERSION: '20'

jobs:                                # Job definitions
  build:                             # Job ID
    runs-on: ubuntu-latest           # Runner environment
    steps:                           # Step list
      - uses: actions/checkout@v4    # Use an Action
      - name: Setup Node.js          # Step name
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci                  # Run command
      - run: npm test
```

### Event Triggers

```yaml
on:
  # Push events
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

  # PR events
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

  # Scheduled triggers
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

  # Manual triggers
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

  # When another workflow completes
  workflow_run:
    workflows: ["Build"]
    types: [completed]

  # Release events
  release:
    types: [published]
```

### Jobs and Steps

```yaml
jobs:
  # First job
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  # Depends on first job
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build

  # Parallel job
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint

  # Matrix strategy
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

## Complete CI Pipeline

### Node.js Project

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

### E2E Testing

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

## CD Deployment Pipeline

### Deploy to Vercel

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

### Deploy to AWS

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

### Docker Image Publishing

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

## Advanced Features

### Secrets and Environment Variables

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Use environment protection rules
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

### Reusable Workflows

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

### Composite Actions

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
# Using composite Action
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

### Conditional Execution

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      # Only run on PR merge
      - name: Deploy
        if: github.event_name == 'push'
        run: ./deploy.sh

      # Only run when specific files change
      - name: Build docs
        if: contains(github.event.head_commit.modified, 'docs/')
        run: npm run build:docs

      # Only run on success
      - name: Notify success
        if: success()
        run: ./notify.sh success

      # Always run (cleanup)
      - name: Cleanup
        if: always()
        run: ./cleanup.sh

      # Only run on failure
      - name: Notify failure
        if: failure()
        run: ./notify.sh failure
```

### Caching Strategy

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # pnpm cache (recommended to use setup-node built-in cache)
      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      # Custom cache
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: |
            playwright-${{ runner.os }}-

      # Turbo cache
      - name: Cache Turbo
        uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-${{ github.sha }}
          restore-keys: |
            turbo-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-
            turbo-${{ runner.os }}-
```

## Best Practices

### Security

```yaml
jobs:
  security:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4

      # Dependency audit
      - name: Audit dependencies
        run: npm audit --audit-level=high

      # Code scanning
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

      # Secret scanning
      - name: Detect secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

### Workflow Organization

```
.github/
├── workflows/
│   ├── ci.yml              # Continuous Integration
│   ├── cd.yml              # Continuous Deployment
│   ├── release.yml         # Release process
│   ├── security.yml        # Security scanning
│   └── reusable-*.yml      # Reusable workflows
├── actions/
│   └── setup-project/      # Composite Action
│       └── action.yml
└── CODEOWNERS              # Code review rules
```

### Performance Optimization

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history (for changelog)
          # or
          fetch-depth: 1  # Latest commit only (faster)

      # Parallel steps (via multiple jobs)
      # Use needs to control dependencies

      # Use faster runners
      # runs-on: ubuntu-latest-xl

      # Skip unnecessary steps
      - name: Build
        if: "!contains(github.event.head_commit.message, '[skip ci]')"
        run: npm run build
```

## Monitoring and Debugging

### Debug Mode

```yaml
# Set ACTIONS_RUNNER_DEBUG=true in Secrets
# Or enable at runtime
env:
  ACTIONS_RUNNER_DEBUG: true
  ACTIONS_STEP_DEBUG: true
```

### Status Badges

```markdown
![CI](https://github.com/owner/repo/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/owner/repo/actions/workflows/deploy.yml/badge.svg?branch=main)
```

## Summary

```
GitHub Actions Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Workflow Design                                   │
│   ├── Use concurrency control to avoid duplicates  │
│   ├── Use caching wisely to speed up builds        │
│   ├── Split jobs for parallel execution            │
│   └── Use reusable workflows to reduce duplication │
│                                                     │
│   Security                                          │
│   ├── Minimize Secrets permission scope             │
│   ├── Use OIDC instead of long-lived credentials   │
│   ├── Enable dependency audit and code scanning    │
│   └── Use environment protection rules             │
│                                                     │
│   Maintainability                                   │
│   ├── Use descriptive job and step names           │
│   ├── Add necessary comments                        │
│   ├── Pin Action versions (use SHA)                 │
│   └── Regularly update dependent Actions           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach |
|----------|---------------------|
| Code checking | lint + typecheck + test in parallel |
| Build deploy | Sequential execution with dependencies |
| Multi-env testing | Matrix strategy |
| Repeated logic | Reusable workflows or composite Actions |

GitHub Actions makes CI/CD simple yet powerful. Start with simple automated tests and gradually build a complete automation pipeline.

---

*Automation isn't the goal—reliably and quickly delivering value is. Let machines do the repetitive work, let humans focus on creating.*
