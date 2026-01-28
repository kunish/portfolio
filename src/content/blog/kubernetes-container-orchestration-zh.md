---
title: 'Kubernetes 容器编排：从入门到生产实践'
description: '掌握 Kubernetes 核心概念、部署策略和生产最佳实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'kubernetes-container-orchestration'
---

容器化改变了应用部署方式，而 Kubernetes 则是容器编排的事实标准。本文将带你从概念到实践，全面掌握 Kubernetes。

## 为什么选择 Kubernetes？

### 容器编排对比

```
容器编排生态：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Kubernetes (K8s)                                  │
│   ├── 行业标准，社区庞大                             │
│   ├── 功能全面，高度可扩展                           │
│   ├── 云厂商原生支持                                │
│   └── 学习曲线陡峭                                  │
│                                                     │
│   其他选择：                                        │
│   ├── Docker Swarm  → 简单，适合小规模              │
│   ├── Nomad         → HashiCorp 出品，轻量级        │
│   ├── ECS/Fargate   → AWS 原生，托管服务            │
│   └── Cloud Run     → GCP 无服务器容器              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 特性 | Kubernetes | Docker Swarm | ECS |
|------|------------|--------------|-----|
| 复杂度 | 高 | 低 | 中 |
| 可扩展性 | 极高 | 中 | 高 |
| 社区生态 | 庞大 | 较小 | AWS 生态 |
| 学习曲线 | 陡峭 | 平缓 | 中等 |
| 托管方案 | EKS/GKE/AKS | - | 原生 |

## 核心概念

### 架构概览

```
Kubernetes 集群架构：
┌─────────────────────────────────────────────────────┐
│                   Control Plane                      │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────────┐  │
│  │ API Server  │ │ Scheduler   │ │ Controller    │  │
│  │             │ │             │ │ Manager       │  │
│  └─────────────┘ └─────────────┘ └───────────────┘  │
│  ┌─────────────────────────────────────────────────┐│
│  │                    etcd                          ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    ▼                    ▼                    ▼
┌─────────┐        ┌─────────┐          ┌─────────┐
│  Node   │        │  Node   │          │  Node   │
│ ┌─────┐ │        │ ┌─────┐ │          │ ┌─────┐ │
│ │Pod  │ │        │ │Pod  │ │          │ │Pod  │ │
│ │ ┌─┐ │ │        │ │ ┌─┐ │ │          │ │ ┌─┐ │ │
│ │ │C│ │ │        │ │ │C│ │ │          │ │ │C│ │ │
│ │ └─┘ │ │        │ │ └─┘ │ │          │ │ └─┘ │ │
│ └─────┘ │        │ └─────┘ │          │ └─────┘ │
│ kubelet │        │ kubelet │          │ kubelet │
└─────────┘        └─────────┘          └─────────┘
```

### 核心资源

```yaml
# Pod - 最小部署单元
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  containers:
    - name: app
      image: my-app:1.0.0
      ports:
        - containerPort: 8080
      resources:
        requests:
          memory: "128Mi"
          cpu: "100m"
        limits:
          memory: "256Mi"
          cpu: "200m"
      livenessProbe:
        httpGet:
          path: /health
          port: 8080
        initialDelaySeconds: 10
        periodSeconds: 5
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 3
```

### Deployment

```yaml
# Deployment - 声明式部署管理
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: my-app:1.0.0
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
          envFrom:
            - configMapRef:
                name: app-config
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### Service

```yaml
# ClusterIP Service - 集群内部访问
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  type: ClusterIP
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080

---
# NodePort Service - 节点端口暴露
apiVersion: v1
kind: Service
metadata:
  name: my-app-nodeport
spec:
  type: NodePort
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080

---
# LoadBalancer Service - 云负载均衡
apiVersion: v1
kind: Service
metadata:
  name: my-app-lb
spec:
  type: LoadBalancer
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080
```

## 配置管理

### ConfigMap

```yaml
# ConfigMap - 非敏感配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # 简单键值对
  LOG_LEVEL: "info"
  CACHE_TTL: "3600"

  # 配置文件
  config.yaml: |
    server:
      host: 0.0.0.0
      port: 8080
    features:
      enableMetrics: true
      enableTracing: true
```

### Secret

```yaml
# Secret - 敏感信息
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  # Base64 编码
  username: YWRtaW4=
  password: cGFzc3dvcmQxMjM=

---
# 使用 stringData 避免手动编码
apiVersion: v1
kind: Secret
metadata:
  name: api-secret
type: Opaque
stringData:
  api-key: "your-secret-api-key"
```

### 使用配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
        - name: app
          image: my-app:1.0.0

          # 环境变量方式
          env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: password

          # 整体注入
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: api-secret

          # 挂载为文件
          volumeMounts:
            - name: config-volume
              mountPath: /etc/config

      volumes:
        - name: config-volume
          configMap:
            name: app-config
```

## Ingress 网关

### Nginx Ingress

```yaml
# Ingress 资源
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.example.com
        - api.example.com
      secretName: tls-secret
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80

    - host: api.example.com
      http:
        paths:
          - path: /v1
            pathType: Prefix
            backend:
              service:
                name: api-v1
                port:
                  number: 80
          - path: /v2
            pathType: Prefix
            backend:
              service:
                name: api-v2
                port:
                  number: 80
```

### 高级路由

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: advanced-ingress
  annotations:
    # 速率限制
    nginx.ingress.kubernetes.io/limit-rps: "100"
    # 请求体大小限制
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    # 超时设置
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    # CORS
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://app.example.com"
spec:
  ingressClassName: nginx
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

## 存储管理

### PersistentVolume

```yaml
# PersistentVolume - 持久化存储
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-data
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: standard
  hostPath:
    path: /data/pv

---
# PersistentVolumeClaim - 存储声明
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard
```

### StatefulSet

```yaml
# StatefulSet - 有状态应用
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data

  # 每个 Pod 独立存储
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 20Gi
```

## 部署策略

### 滚动更新

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2        # 最多额外创建 2 个 Pod
      maxUnavailable: 1  # 最多 1 个不可用
  template:
    spec:
      containers:
        - name: app
          image: my-app:2.0.0
```

### 蓝绿部署

```yaml
# 蓝色版本 (当前生产)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-blue
  labels:
    app: my-app
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
      version: blue
  template:
    metadata:
      labels:
        app: my-app
        version: blue
    spec:
      containers:
        - name: app
          image: my-app:1.0.0

---
# 绿色版本 (新版本)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-green
  labels:
    app: my-app
    version: green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
      version: green
  template:
    metadata:
      labels:
        app: my-app
        version: green
    spec:
      containers:
        - name: app
          image: my-app:2.0.0

---
# 切换 Service 指向
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
    version: green  # 切换到绿色版本
  ports:
    - port: 80
      targetPort: 8080
```

### 金丝雀发布

```yaml
# 使用 Istio 进行金丝雀发布
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app
spec:
  hosts:
    - my-app
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: my-app-canary
            port:
              number: 80
    - route:
        - destination:
            host: my-app-stable
            port:
              number: 80
          weight: 90
        - destination:
            host: my-app-canary
            port:
              number: 80
          weight: 10
```

## 自动扩缩容

### HPA (Horizontal Pod Autoscaler)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    # CPU 使用率
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

    # 内存使用率
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

    # 自定义指标
    - type: Pods
      pods:
        metric:
          name: requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"

  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

### VPA (Vertical Pod Autoscaler)

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Auto"  # Auto, Recreate, Initial, Off
  resourcePolicy:
    containerPolicies:
      - containerName: app
        minAllowed:
          cpu: 100m
          memory: 128Mi
        maxAllowed:
          cpu: 2
          memory: 4Gi
        controlledResources: ["cpu", "memory"]
```

## 安全最佳实践

### Pod 安全上下文

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault

  containers:
    - name: app
      image: my-app:1.0.0
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
      volumeMounts:
        - name: tmp
          mountPath: /tmp

  volumes:
    - name: tmp
      emptyDir: {}
```

### NetworkPolicy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
    - Egress

  ingress:
    # 只允许来自前端的流量
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080

    # 允许来自 Ingress Controller
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080

  egress:
    # 允许访问数据库
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432

    # 允许 DNS 查询
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

### RBAC

```yaml
# ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: production

---
# Role - 命名空间级别权限
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-role
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]

---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-role-binding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: app-sa
    namespace: production
roleRef:
  kind: Role
  name: app-role
  apiGroup: rbac.authorization.k8s.io
```

## 监控与日志

### Prometheus 监控

```yaml
# ServiceMonitor - Prometheus Operator
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics

---
# PrometheusRule - 告警规则
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: my-app-alerts
spec:
  groups:
    - name: my-app
      rules:
        - alert: HighErrorRate
          expr: |
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            / sum(rate(http_requests_total[5m])) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "High error rate detected"
            description: "Error rate is {{ $value | humanizePercentage }}"

        - alert: PodCrashLooping
          expr: |
            rate(kube_pod_container_status_restarts_total[15m]) > 0
          for: 5m
          labels:
            severity: warning
```

### 日志收集

```yaml
# Fluent Bit DaemonSet
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: logging
spec:
  selector:
    matchLabels:
      app: fluent-bit
  template:
    metadata:
      labels:
        app: fluent-bit
    spec:
      serviceAccountName: fluent-bit
      containers:
        - name: fluent-bit
          image: fluent/fluent-bit:2.1
          volumeMounts:
            - name: varlog
              mountPath: /var/log
            - name: varlibdockercontainers
              mountPath: /var/lib/docker/containers
              readOnly: true
            - name: config
              mountPath: /fluent-bit/etc/
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
        - name: varlibdockercontainers
          hostPath:
            path: /var/lib/docker/containers
        - name: config
          configMap:
            name: fluent-bit-config
```

## Helm 包管理

### Chart 结构

```
my-app/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   └── hpa.yaml
└── charts/           # 子 Chart
```

### values.yaml

```yaml
# values.yaml
replicaCount: 3

image:
  repository: my-app
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: app.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: app-tls
      hosts:
        - app.example.com

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

### 模板示例

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: 8080
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

## 生产检查清单

```
Kubernetes 生产就绪检查：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   资源配置                                          │
│   ├── 设置 requests 和 limits                       │
│   ├── 配置 liveness 和 readiness 探针               │
│   ├── 使用 PodDisruptionBudget                     │
│   └── 配置反亲和性分散 Pod                          │
│                                                     │
│   安全性                                            │
│   ├── 使用非 root 用户运行                          │
│   ├── 启用只读文件系统                              │
│   ├── 配置 NetworkPolicy                           │
│   ├── 使用 RBAC 最小权限                            │
│   └── 定期更新镜像修复漏洞                          │
│                                                     │
│   可观测性                                          │
│   ├── 配置 Prometheus 指标                          │
│   ├── 集中化日志收集                                │
│   ├── 设置告警规则                                  │
│   └── 配置链路追踪                                  │
│                                                     │
│   高可用                                            │
│   ├── 多副本部署                                    │
│   ├── 跨可用区分布                                  │
│   ├── 配置 HPA 自动扩缩                             │
│   └── 定期灾难恢复演练                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 常用命令

```bash
# 集群信息
kubectl cluster-info
kubectl get nodes -o wide

# 资源操作
kubectl apply -f manifest.yaml
kubectl delete -f manifest.yaml
kubectl get pods -n production -o wide
kubectl describe pod my-pod -n production

# 日志与调试
kubectl logs my-pod -c container-name -f
kubectl exec -it my-pod -- /bin/sh
kubectl port-forward svc/my-service 8080:80

# 扩缩容
kubectl scale deployment my-app --replicas=5
kubectl rollout status deployment my-app
kubectl rollout undo deployment my-app

# 资源使用
kubectl top nodes
kubectl top pods -n production
```

## 总结

| 场景 | 推荐方案 |
|------|----------|
| 无状态应用 | Deployment + HPA |
| 有状态应用 | StatefulSet + PVC |
| 批处理任务 | Job / CronJob |
| 守护进程 | DaemonSet |
| 配置管理 | ConfigMap + Secret |
| 流量入口 | Ingress + TLS |

Kubernetes 学习曲线陡峭，但掌握后能够管理任意规模的容器化应用。从简单的 Deployment 开始，逐步深入各个领域。

---

*容器编排不是终点，而是云原生之旅的起点。让 Kubernetes 成为你的基础设施即代码的核心。*
