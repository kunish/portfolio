---
title: '日志与可观测性：构建全链路监控体系'
description: '掌握结构化日志、分布式追踪、指标监控和告警策略'
pubDate: 'Jan 28 2025'
heroImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80'
lang: 'zh'
translationKey: 'logging-observability-monitoring'
---

可观测性是现代分布式系统的关键能力。本文深入探讨日志、追踪、指标三大支柱的实践方法。

## 可观测性三大支柱

### 核心概念

```
可观测性三大支柱：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Logs (日志)                                       │
│   ├── 记录离散事件                                  │
│   ├── 详细上下文信息                                │
│   └── 问题排查和审计                                │
│                                                     │
│   Metrics (指标)                                    │
│   ├── 数值型时间序列                                │
│   ├── 聚合和趋势分析                                │
│   └── 告警和仪表盘                                  │
│                                                     │
│   Traces (追踪)                                     │
│   ├── 请求在系统中的完整路径                        │
│   ├── 服务间调用关系                                │
│   └── 性能瓶颈定位                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 工具生态

| 类别 | 工具选择 |
|------|----------|
| 日志 | ELK Stack, Loki, Splunk |
| 指标 | Prometheus, Datadog, InfluxDB |
| 追踪 | Jaeger, Zipkin, OpenTelemetry |
| 统一平台 | Grafana, Datadog, New Relic |

## 结构化日志

### 日志设计

```typescript
import pino from 'pino';

// 创建 logger 实例
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: 'user-service',
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});

// 请求上下文 logger
function createRequestLogger(req: Request) {
  return logger.child({
    requestId: req.headers['x-request-id'],
    userId: req.user?.id,
    path: req.path,
    method: req.method,
  });
}

// 使用示例
app.use((req, res, next) => {
  req.log = createRequestLogger(req);
  next();
});

app.post('/api/orders', async (req, res) => {
  req.log.info({ orderData: req.body }, 'Creating order');

  try {
    const order = await orderService.create(req.body);
    req.log.info({ orderId: order.id }, 'Order created successfully');
    res.json(order);
  } catch (error) {
    req.log.error({ error: error.message, stack: error.stack }, 'Order creation failed');
    res.status(500).json({ error: 'Internal error' });
  }
});
```

### 日志级别策略

```typescript
// 日志级别定义
enum LogLevel {
  TRACE = 'trace',  // 最详细，开发调试
  DEBUG = 'debug',  // 调试信息
  INFO = 'info',    // 正常业务事件
  WARN = 'warn',    // 潜在问题
  ERROR = 'error',  // 错误，需要关注
  FATAL = 'fatal',  // 严重错误，系统不可用
}

// 日志级别使用指南
class OrderService {
  async processOrder(orderId: string) {
    // TRACE: 详细调试信息
    logger.trace({ orderId }, 'Starting order processing');

    // DEBUG: 调试相关信息
    logger.debug({ orderId, step: 'validation' }, 'Validating order');

    // INFO: 重要业务事件
    logger.info({ orderId, amount: 100 }, 'Order payment initiated');

    // WARN: 非致命问题
    if (retryCount > 0) {
      logger.warn({ orderId, retryCount }, 'Payment retry required');
    }

    // ERROR: 错误事件
    try {
      await paymentGateway.charge(orderId);
    } catch (error) {
      logger.error({ orderId, error: error.message }, 'Payment failed');
      throw error;
    }

    // FATAL: 系统级严重错误
    if (!databaseConnection) {
      logger.fatal('Database connection lost');
      process.exit(1);
    }
  }
}
```

### 日志聚合

```typescript
// 日志传输到集中存储
import pino from 'pino';

// 开发环境：美化输出
const devTransport = pino.transport({
  target: 'pino-pretty',
  options: { colorize: true },
});

// 生产环境：发送到 Loki
const prodTransport = pino.transport({
  targets: [
    {
      target: 'pino-loki',
      options: {
        host: process.env.LOKI_HOST,
        labels: { app: 'user-service' },
      },
    },
    {
      target: 'pino/file',
      options: { destination: '/var/log/app.log' },
    },
  ],
});

const logger = pino(
  process.env.NODE_ENV === 'production' ? prodTransport : devTransport
);
```

## 分布式追踪

### OpenTelemetry 集成

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// 初始化 SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'user-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://jaeger:4318/v1/traces',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

// 优雅关闭
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

### 自定义 Span

```typescript
import { trace, SpanStatusCode, context } from '@opentelemetry/api';

const tracer = trace.getTracer('user-service');

async function processPayment(orderId: string, amount: number) {
  return tracer.startActiveSpan('processPayment', async (span) => {
    try {
      // 添加属性
      span.setAttribute('order.id', orderId);
      span.setAttribute('payment.amount', amount);

      // 添加事件
      span.addEvent('payment_started');

      // 调用支付网关
      const result = await paymentGateway.charge({
        orderId,
        amount,
      });

      span.addEvent('payment_completed', {
        transactionId: result.transactionId,
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

// 跨服务传播上下文
async function callInventoryService(orderId: string) {
  return tracer.startActiveSpan('callInventoryService', async (span) => {
    const headers = {};

    // 注入追踪上下文到请求头
    const propagator = trace.getTracer('propagator');
    propagator.inject(context.active(), headers);

    const response = await fetch('http://inventory-service/reserve', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
    });

    span.end();
    return response.json();
  });
}
```

## 指标监控

### Prometheus 指标

```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const registry = new Registry();

// 计数器：累计值
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [registry],
});

// 直方图：分布统计
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [registry],
});

// 仪表：当前值
const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [registry],
});

// 中间件收集指标
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestsTotal.inc({
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      { method: req.method, path: req.route?.path || req.path },
      duration
    );
  });

  next();
});

// 暴露指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});
```

### 业务指标

```typescript
// 订单相关指标
const ordersCreated = new Counter({
  name: 'orders_created_total',
  help: 'Total orders created',
  labelNames: ['status', 'payment_method'],
});

const orderValue = new Histogram({
  name: 'order_value_dollars',
  help: 'Order value distribution',
  buckets: [10, 50, 100, 500, 1000, 5000],
});

const inventoryLevel = new Gauge({
  name: 'inventory_level',
  help: 'Current inventory level',
  labelNames: ['product_id'],
});

// 在业务逻辑中记录
async function createOrder(orderData: CreateOrderDto) {
  const order = await orderRepository.create(orderData);

  ordersCreated.inc({
    status: order.status,
    payment_method: order.paymentMethod,
  });

  orderValue.observe(order.totalAmount);

  for (const item of order.items) {
    inventoryLevel.dec({ product_id: item.productId });
  }

  return order;
}
```

## 告警策略

### Prometheus 告警规则

```yaml
# prometheus/alerts.yml
groups:
  - name: application
    rules:
      # 错误率告警
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # 响应时间告警
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P95 latency is {{ $value }}s"

      # 服务不可用
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.instance }} is unreachable"

  - name: infrastructure
    rules:
      # CPU 使用率
      - alert: HighCPUUsage
        expr: |
          100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }}%"

      # 内存使用率
      - alert: HighMemoryUsage
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}%"
```

### 告警通知

```typescript
// 告警处理器
interface AlertPayload {
  status: 'firing' | 'resolved';
  alerts: Alert[];
}

interface Alert {
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: string;
  endsAt?: string;
}

app.post('/api/alerts', async (req, res) => {
  const payload: AlertPayload = req.body;

  for (const alert of payload.alerts) {
    const message = formatAlertMessage(alert, payload.status);

    // 根据严重程度选择通知渠道
    if (alert.labels.severity === 'critical') {
      await sendPagerDutyAlert(alert);
      await sendSlackMessage('#incidents', message);
    } else if (alert.labels.severity === 'warning') {
      await sendSlackMessage('#alerts', message);
    }
  }

  res.status(200).send('OK');
});

function formatAlertMessage(alert: Alert, status: string): string {
  const emoji = status === 'firing' ? '🔴' : '✅';
  return `${emoji} **${alert.labels.alertname}**
Status: ${status}
Severity: ${alert.labels.severity}
Summary: ${alert.annotations.summary}
Description: ${alert.annotations.description}`;
}
```

## 健康检查

```typescript
// 健康检查端点
interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
}

const healthChecks: HealthCheck[] = [
  {
    name: 'database',
    check: async () => {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    },
  },
  {
    name: 'redis',
    check: async () => {
      const result = await redis.ping();
      return result === 'PONG';
    },
  },
  {
    name: 'external-api',
    check: async () => {
      const response = await fetch('https://api.external.com/health');
      return response.ok;
    },
  },
];

app.get('/health', async (req, res) => {
  const results: Record<string, { status: string; latency: number }> = {};
  let healthy = true;

  for (const check of healthChecks) {
    const start = Date.now();
    try {
      await check.check();
      results[check.name] = {
        status: 'healthy',
        latency: Date.now() - start,
      };
    } catch (error) {
      healthy = false;
      results[check.name] = {
        status: 'unhealthy',
        latency: Date.now() - start,
      };
    }
  }

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks: results,
    timestamp: new Date().toISOString(),
  });
});

// 就绪检查
app.get('/ready', async (req, res) => {
  const ready = await isApplicationReady();
  res.status(ready ? 200 : 503).send(ready ? 'Ready' : 'Not Ready');
});

// 存活检查
app.get('/live', (req, res) => {
  res.status(200).send('Alive');
});
```

## 最佳实践总结

```
可观测性最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   日志                                              │
│   ├── 使用结构化日志                                │
│   ├── 包含请求上下文                                │
│   ├── 合理设置日志级别                              │
│   └── 集中日志存储                                  │
│                                                     │
│   追踪                                              │
│   ├── 使用 OpenTelemetry                            │
│   ├── 传播追踪上下文                                │
│   ├── 添加有意义的 Span                             │
│   └── 记录关键属性和事件                            │
│                                                     │
│   指标                                              │
│   ├── RED 方法 (Rate, Errors, Duration)            │
│   ├── USE 方法 (Utilization, Saturation, Errors)   │
│   ├── 业务指标                                      │
│   └── 合理的告警阈值                                │
│                                                     │
│   告警                                              │
│   ├── 基于 SLO 告警                                 │
│   ├── 分级通知策略                                  │
│   ├── 避免告警疲劳                                  │
│   └── 记录告警响应                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| 日志存储 | Loki + Grafana |
| 指标监控 | Prometheus + Grafana |
| 分布式追踪 | Jaeger / Tempo |
| 统一标准 | OpenTelemetry |
| 告警管理 | Alertmanager |

可观测性是系统运维的眼睛。建立完善的监控体系，才能在问题发生时快速定位和解决。

---

*看不见的系统是无法管理的。可观测性让复杂系统变得透明可控。*
