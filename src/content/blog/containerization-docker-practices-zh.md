---
title: '容器化与 Docker 实践：从开发到生产的完整指南'
description: '掌握 Docker 基础、镜像优化、多阶段构建、Docker Compose 和容器编排'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'containerization-docker-practices'
---

容器化已成为现代应用部署的标准方式。本文深入探讨 Docker 的核心概念和最佳实践。

## 容器技术基础

### 容器 vs 虚拟机

```
容器 vs 虚拟机：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   虚拟机 (VM)                                       │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│   │  App A  │ │  App B  │ │  App C  │              │
│   ├─────────┤ ├─────────┤ ├─────────┤              │
│   │Guest OS │ │Guest OS │ │Guest OS │              │
│   └────┬────┘ └────┬────┘ └────┬────┘              │
│        └───────────┼───────────┘                   │
│              ┌─────┴─────┐                         │
│              │ Hypervisor│                         │
│              ├───────────┤                         │
│              │  Host OS  │                         │
│              └───────────┘                         │
│                                                     │
│   容器 (Container)                                  │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│   │  App A  │ │  App B  │ │  App C  │              │
│   └────┬────┘ └────┬────┘ └────┬────┘              │
│        └───────────┼───────────┘                   │
│              ┌─────┴─────┐                         │
│              │  Docker   │                         │
│              ├───────────┤                         │
│              │  Host OS  │                         │
│              └───────────┘                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 特性 | 容器 | 虚拟机 |
|------|------|--------|
| 启动时间 | 秒级 | 分钟级 |
| 资源占用 | 轻量 | 重量 |
| 隔离性 | 进程级 | 系统级 |
| 性能 | 接近原生 | 有损耗 |
| 镜像大小 | MB 级 | GB 级 |

## Dockerfile 编写

### 基础示例

```dockerfile
# Node.js 应用 Dockerfile
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/index.js"]
```

### 多阶段构建

```dockerfile
# 多阶段构建优化镜像大小
# 阶段1: 构建
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 阶段2: 生产镜像
FROM node:20-alpine AS production

WORKDIR /app

# 只复制生产依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Go 应用示例

```dockerfile
# Go 多阶段构建
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建静态二进制
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# 最小化生产镜像
FROM scratch

# 复制二进制文件
COPY --from=builder /app/main /main

# 复制 CA 证书（用于 HTTPS 请求）
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080

ENTRYPOINT ["/main"]
```

## 镜像优化

### 层缓存优化

```dockerfile
# 优化前：每次代码变更都重新安装依赖
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

# 优化后：利用层缓存
FROM node:20-alpine
WORKDIR /app

# 先复制依赖文件（变更频率低）
COPY package*.json ./
RUN npm ci

# 再复制源代码（变更频率高）
COPY . .
RUN npm run build
```

### .dockerignore 配置

```plaintext
# 版本控制
.git
.gitignore

# 依赖目录
node_modules
vendor

# 构建产物
dist
build
*.log

# 开发文件
.env.local
.env.development
*.md
!README.md

# IDE
.vscode
.idea
*.swp

# 测试
coverage
__tests__
*.test.js
*.spec.js

# Docker
Dockerfile*
docker-compose*
.dockerignore
```

### 镜像大小对比

```dockerfile
# 不同基础镜像大小对比
# node:20          ~1GB
# node:20-slim     ~200MB
# node:20-alpine   ~130MB

# 推荐使用 Alpine 镜像
FROM node:20-alpine

# 如果需要额外工具
RUN apk add --no-cache \
    curl \
    tzdata
```

## Docker Compose

### 开发环境配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache
    command: npm run dev

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  adminer:
    image: adminer
    ports:
      - "8080:8080"
    depends_on:
      - db

volumes:
  postgres_data:
  redis_data:
```

### 生产环境配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: myapp:${VERSION:-latest}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
```

### 多环境配置

```yaml
# docker-compose.override.yml（开发环境自动加载）
version: '3.8'

services:
  app:
    build:
      context: .
      target: development
    volumes:
      - .:/app:cached
      - /app/node_modules
    environment:
      - DEBUG=true
```

```bash
# 使用不同配置启动
# 开发环境
docker compose up

# 生产环境
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 容器安全

### 安全最佳实践

```dockerfile
# 安全优化的 Dockerfile
FROM node:20-alpine

# 更新系统包
RUN apk update && apk upgrade

# 创建非 root 用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# 设置目录权限
RUN chown -R appuser:appgroup /app

# 复制依赖并安装
COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --only=production

# 复制应用代码
COPY --chown=appuser:appgroup . .

# 切换到非 root 用户
USER appuser

# 只读文件系统
# 在运行时使用 --read-only 标志

EXPOSE 3000

CMD ["node", "index.js"]
```

### 镜像扫描

```bash
# 使用 Trivy 扫描镜像漏洞
trivy image myapp:latest

# 使用 Docker Scout
docker scout cves myapp:latest

# 在 CI/CD 中集成扫描
# .github/workflows/security.yml
```

```yaml
name: Security Scan

on:
  push:
    branches: [main]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

## 网络配置

### 自定义网络

```yaml
version: '3.8'

services:
  frontend:
    networks:
      - frontend-network

  backend:
    networks:
      - frontend-network
      - backend-network

  database:
    networks:
      - backend-network

networks:
  frontend-network:
    driver: bridge
  backend-network:
    driver: bridge
    internal: true  # 不允许外部访问
```

### 服务发现

```typescript
// 在 Docker 网络中，可以使用服务名作为主机名
const dbHost = process.env.DATABASE_HOST || 'db';
const redisHost = process.env.REDIS_HOST || 'cache';

// Docker Compose 服务名会自动解析为容器 IP
const databaseUrl = `postgresql://user:pass@${dbHost}:5432/myapp`;
```

## 健康检查

```dockerfile
# Dockerfile 中的健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

```typescript
// 健康检查端点
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    status: 'OK',
    timestamp: Date.now(),
  };

  try {
    // 检查数据库连接
    await db.query('SELECT 1');
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'ERROR';
    res.status(503).json(healthcheck);
  }
});
```

## 日志管理

```yaml
# 日志配置
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "production"
        env: "NODE_ENV"

  # 或使用集中日志
  fluentd:
    image: fluent/fluentd:v1.14
    volumes:
      - ./fluentd/conf:/fluentd/etc
    ports:
      - "24224:24224"

  app-with-fluentd:
    logging:
      driver: "fluentd"
      options:
        fluentd-address: "localhost:24224"
        tag: "docker.{{.Name}}"
```

## 最佳实践总结

```
Docker 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   镜像构建                                          │
│   ├── 使用多阶段构建                                │
│   ├── 选择合适的基础镜像                            │
│   ├── 优化层缓存                                    │
│   └── 使用 .dockerignore                           │
│                                                     │
│   安全性                                            │
│   ├── 使用非 root 用户                             │
│   ├── 定期扫描漏洞                                  │
│   ├── 最小化镜像内容                                │
│   └── 使用固定版本标签                              │
│                                                     │
│   运维                                              │
│   ├── 配置健康检查                                  │
│   ├── 合理设置资源限制                              │
│   ├── 集中日志管理                                  │
│   └── 使用环境变量配置                              │
│                                                     │
│   开发体验                                          │
│   ├── 使用 Docker Compose                          │
│   ├── 热重载支持                                    │
│   ├── 开发/生产配置分离                             │
│   └── 文档化构建过程                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| 本地开发 | Docker Compose + volumes |
| CI/CD | 多阶段构建 + 镜像扫描 |
| 生产部署 | Kubernetes / Docker Swarm |
| 微服务 | 每服务一容器 |
| 遗留应用 | 渐进式容器化 |

容器化不仅是打包应用，更是现代化运维的基础。掌握 Docker，让部署变得简单可靠。

---

*一次构建，处处运行。容器化让应用交付变得标准化、可重复。*
