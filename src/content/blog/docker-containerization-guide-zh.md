---
title: 'Docker 容器化实战指南：从开发到部署'
description: '全面掌握 Docker 核心概念和实践技巧，构建可移植、可扩展的应用部署方案'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'docker-containerization-guide'
---

Docker 彻底改变了软件的开发、测试和部署方式。"在我机器上能运行"不再是借口——容器让环境一致性成为现实。本文将带你从零掌握 Docker 容器化技术。

## 为什么需要 Docker？

### 传统部署的痛点

```
传统部署问题：
┌─────────────────────────────────────────────────────┐
│ 开发环境                        生产环境            │
│ ┌─────────────┐                ┌─────────────┐     │
│ │ Node 18.x   │       →        │ Node 16.x   │ ❌  │
│ │ Ubuntu 22   │                │ CentOS 7    │ ❌  │
│ │ npm 9.x     │                │ npm 8.x     │ ❌  │
│ └─────────────┘                └─────────────┘     │
│                                                     │
│ 常见问题：                                          │
│ • 依赖版本不一致                                    │
│ • 系统库差异                                        │
│ • 配置文件不同                                      │
│ • 多应用端口冲突                                    │
└─────────────────────────────────────────────────────┘
```

### Docker 的解决方案

```
Docker 容器化：
┌─────────────────────────────────────────────────────┐
│ 开发环境                        生产环境            │
│ ┌─────────────┐                ┌─────────────┐     │
│ │  Container  │       =        │  Container  │ ✅  │
│ │ ┌─────────┐ │                │ ┌─────────┐ │     │
│ │ │  App    │ │                │ │  App    │ │     │
│ │ │ Node 18 │ │                │ │ Node 18 │ │     │
│ │ │ Alpine  │ │                │ │ Alpine  │ │     │
│ │ └─────────┘ │                │ └─────────┘ │     │
│ └─────────────┘                └─────────────┘     │
│                                                     │
│ 优势：环境完全一致，一次构建到处运行                 │
└─────────────────────────────────────────────────────┘
```

## 核心概念

### 镜像 vs 容器

```
镜像 (Image) 与容器 (Container) 的关系：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   镜像 (只读模板)              容器 (运行实例)       │
│   ┌─────────────┐              ┌─────────────┐     │
│   │   Layer 4   │  docker run  │   Layer 4   │     │
│   │   Layer 3   │  ─────────→  │   Layer 3   │     │
│   │   Layer 2   │              │   Layer 2   │     │
│   │   Layer 1   │              │   Layer 1   │     │
│   │  Base Image │              │  Base Image │     │
│   └─────────────┘              ├─────────────┤     │
│                                │ 可写层 (R/W) │     │
│   类比：类 (Class)             └─────────────┘     │
│                                类比：实例 (Object)  │
│                                                     │
│   一个镜像可以创建多个容器                          │
└─────────────────────────────────────────────────────┘
```

### 分层文件系统

```dockerfile
# 每条指令创建一层
FROM node:18-alpine        # 基础层
WORKDIR /app               # 新层
COPY package*.json ./      # 新层
RUN npm install            # 新层（最大）
COPY . .                   # 新层
CMD ["npm", "start"]       # 元数据，不创建层
```

```
层的复用机制：
┌─────────────────────────────────────────────────────┐
│ 构建 App A          构建 App B                      │
│ ┌─────────┐         ┌─────────┐                    │
│ │ App A   │         │ App B   │  ← 不同            │
│ ├─────────┤         ├─────────┤                    │
│ │npm deps │         │npm deps │  ← 不同            │
│ ├─────────┤         ├─────────┤                    │
│ │node:18  │ ═══════ │node:18  │  ← 复用！          │
│ └─────────┘         └─────────┘                    │
│                                                     │
│ 相同层只存储一份，节省空间和构建时间                 │
└─────────────────────────────────────────────────────┘
```

## Dockerfile 编写

### 基础结构

```dockerfile
# syntax=docker/dockerfile:1

# 基础镜像
FROM node:18-alpine

# 元数据
LABEL maintainer="dev@example.com"
LABEL version="1.0"

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "server.js"]
```

### 多阶段构建

多阶段构建可以大幅减小最终镜像大小：

```dockerfile
# 阶段 1：构建
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 阶段 2：生产
FROM node:18-alpine AS production

WORKDIR /app

# 只复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 使用非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 优化技巧

```dockerfile
# ✅ 利用缓存：不常变化的层放前面
COPY package*.json ./
RUN npm ci
COPY . .   # 源码经常变，放最后

# ✅ 合并 RUN 命令减少层数
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      curl \
      git \
    && rm -rf /var/lib/apt/lists/*

# ✅ 使用 .dockerignore 排除不需要的文件
# .dockerignore
node_modules
.git
*.md
.env
dist

# ✅ 使用特定版本标签
FROM node:18.19.0-alpine3.19  # 不要用 latest

# ✅ 最小化基础镜像
FROM node:18-alpine  # 比 node:18 小很多
# 或者使用 distroless
FROM gcr.io/distroless/nodejs18-debian11
```

## 常用命令

### 镜像操作

```bash
# 构建镜像
docker build -t myapp:1.0 .
docker build -t myapp:1.0 -f Dockerfile.prod .

# 查看镜像
docker images
docker image ls

# 删除镜像
docker rmi myapp:1.0
docker image prune  # 删除悬空镜像

# 镜像标签
docker tag myapp:1.0 registry.example.com/myapp:1.0

# 推送/拉取镜像
docker push registry.example.com/myapp:1.0
docker pull nginx:alpine
```

### 容器操作

```bash
# 运行容器
docker run -d --name myapp -p 3000:3000 myapp:1.0
docker run -it --rm node:18-alpine sh  # 交互式，退出后删除

# 查看容器
docker ps           # 运行中的容器
docker ps -a        # 所有容器

# 容器日志
docker logs myapp
docker logs -f myapp  # 实时跟踪

# 进入容器
docker exec -it myapp sh
docker exec -it myapp /bin/bash

# 停止/启动/重启
docker stop myapp
docker start myapp
docker restart myapp

# 删除容器
docker rm myapp
docker rm -f myapp  # 强制删除运行中的容器

# 查看资源使用
docker stats
```

### 数据持久化

```bash
# Volume（推荐）
docker volume create mydata
docker run -v mydata:/app/data myapp:1.0

# Bind Mount（开发用）
docker run -v $(pwd)/src:/app/src myapp:1.0

# 查看 volume
docker volume ls
docker volume inspect mydata
```

## Docker Compose

Docker Compose 用于定义和运行多容器应用。

### 基础配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Web 应用
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 数据库
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # 缓存
  cache:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Nginx 反向代理
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

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    driver: bridge
```

### Compose 命令

```bash
# 启动服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f app

# 停止服务
docker compose down

# 停止并删除 volumes
docker compose down -v

# 重新构建并启动
docker compose up -d --build

# 扩展服务
docker compose up -d --scale app=3
```

### 开发环境配置

```yaml
# docker-compose.override.yml（自动合并）
version: '3.8'

services:
  app:
    build:
      target: development
    volumes:
      - .:/app
      - /app/node_modules  # 排除 node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev

  # 开发工具
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"
```

## 生产环境最佳实践

### 安全加固

```dockerfile
# 1. 使用非 root 用户
FROM node:18-alpine

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app
COPY --chown=appuser:appgroup . .

USER appuser

# 2. 只读文件系统
docker run --read-only --tmpfs /tmp myapp:1.0

# 3. 限制权限
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE myapp:1.0

# 4. 扫描漏洞
docker scout cve myapp:1.0
trivy image myapp:1.0
```

### 资源限制

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

```bash
# 或者命令行
docker run --cpus=0.5 --memory=512m myapp:1.0
```

### 日志管理

```yaml
services:
  app:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

```bash
# 使用外部日志系统
docker run --log-driver=fluentd myapp:1.0
```

### 健康检查与重启策略

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped
    # 或者 always, on-failure, no
```

## 实战：部署完整应用栈

### 项目结构

```
myapp/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env
├── .env.example
├── app/
│   ├── Dockerfile
│   └── ...
├── nginx/
│   ├── nginx.conf
│   └── Dockerfile
└── scripts/
    ├── deploy.sh
    └── backup.sh
```

### 生产环境 Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: registry.example.com/myapp:${VERSION:-latest}
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        max_attempts: 3
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    networks:
      - internal
      - web

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - app
    networks:
      - web

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password
    networks:
      - internal

volumes:
  postgres_data:

networks:
  internal:
    internal: true
  web:

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### 部署脚本

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

VERSION=${1:-latest}
REGISTRY="registry.example.com"

echo "Deploying version: $VERSION"

# 构建并推送镜像
docker build -t $REGISTRY/myapp:$VERSION ./app
docker push $REGISTRY/myapp:$VERSION

# 部署
VERSION=$VERSION docker compose -f docker-compose.prod.yml up -d

# 等待健康检查
sleep 30
docker compose -f docker-compose.prod.yml ps

echo "Deployment complete!"
```

## 调试技巧

### 进入容器调试

```bash
# 进入运行中的容器
docker exec -it myapp sh

# 以 root 用户进入
docker exec -u root -it myapp sh

# 查看容器进程
docker top myapp

# 查看容器详情
docker inspect myapp
```

### 构建调试

```bash
# 查看构建过程
docker build --progress=plain -t myapp .

# 在特定阶段停止
docker build --target builder -t myapp:builder .

# 不使用缓存
docker build --no-cache -t myapp .
```

### 网络调试

```bash
# 查看网络
docker network ls
docker network inspect bridge

# 测试容器间连通性
docker exec app ping db

# 查看端口映射
docker port myapp
```

## 总结

Docker 容器化让应用部署变得可预测和可重复：

| 方面 | 传统部署 | Docker 容器化 |
|------|---------|--------------|
| 环境一致性 | 难以保证 | 完全一致 |
| 部署速度 | 慢（配置环境） | 快（启动容器） |
| 资源隔离 | 需要虚拟机 | 轻量级隔离 |
| 扩展性 | 复杂 | 简单（启动更多容器） |
| 回滚 | 困难 | 简单（切换镜像版本） |

**关键收获**：

1. 镜像是只读模板，容器是运行实例
2. 多阶段构建可以大幅减小镜像体积
3. Docker Compose 简化多容器应用管理
4. 生产环境要注意安全加固和资源限制
5. 合理利用分层缓存加速构建

容器化不只是技术升级，更是 DevOps 文化的核心实践。

---

*容器化：让"在我机器上能跑"成为过去式。*
