---
title: 'Logging and Observability: Building Full-Stack Monitoring Systems'
description: 'Master structured logging, distributed tracing, metrics monitoring and alerting strategies'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'logging-observability-monitoring'
---

Observability is a critical capability for modern distributed systems. This article explores practical approaches to the three pillars: logs, traces, and metrics.

## Three Pillars of Observability

### Core Concepts

```
Three Pillars of Observability:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Logs                                              │
│   ├── Record discrete events                       │
│   ├── Detailed context information                │
│   └── Troubleshooting and auditing                │
│                                                     │
│   Metrics                                           │
│   ├── Numeric time series                          │
│   ├── Aggregation and trend analysis              │
│   └── Alerting and dashboards                     │
│                                                     │
│   Traces                                            │
│   ├── Complete request path through system        │
│   ├── Service-to-service call relationships       │
│   └── Performance bottleneck identification       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Tool Ecosystem

| Category | Tool Options |
|----------|--------------|
| Logs | ELK Stack, Loki, Splunk |
| Metrics | Prometheus, Datadog, InfluxDB |
| Traces | Jaeger, Zipkin, OpenTelemetry |
| Unified Platform | Grafana, Datadog, New Relic |

## Structured Logging

### Log Design

```typescript
import pino from 'pino';

// Create logger instance
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

// Request context logger
function createRequestLogger(req: Request) {
  return logger.child({
    requestId: req.headers['x-request-id'],
    userId: req.user?.id,
    path: req.path,
    method: req.method,
  });
}

// Usage example
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

### Log Level Strategy

```typescript
// Log level definitions
enum LogLevel {
  TRACE = 'trace',  // Most detailed, development debugging
  DEBUG = 'debug',  // Debug information
  INFO = 'info',    // Normal business events
  WARN = 'warn',    // Potential issues
  ERROR = 'error',  // Errors requiring attention
  FATAL = 'fatal',  // Critical errors, system unavailable
}

// Log level usage guidelines
class OrderService {
  async processOrder(orderId: string) {
    // TRACE: Detailed debug info
    logger.trace({ orderId }, 'Starting order processing');

    // DEBUG: Debug-related info
    logger.debug({ orderId, step: 'validation' }, 'Validating order');

    // INFO: Important business events
    logger.info({ orderId, amount: 100 }, 'Order payment initiated');

    // WARN: Non-fatal issues
    if (retryCount > 0) {
      logger.warn({ orderId, retryCount }, 'Payment retry required');
    }

    // ERROR: Error events
    try {
      await paymentGateway.charge(orderId);
    } catch (error) {
      logger.error({ orderId, error: error.message }, 'Payment failed');
      throw error;
    }

    // FATAL: System-level critical errors
    if (!databaseConnection) {
      logger.fatal('Database connection lost');
      process.exit(1);
    }
  }
}
```

### Log Aggregation

```typescript
// Transport logs to centralized storage
import pino from 'pino';

// Development: Pretty output
const devTransport = pino.transport({
  target: 'pino-pretty',
  options: { colorize: true },
});

// Production: Send to Loki
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

## Distributed Tracing

### OpenTelemetry Integration

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Initialize SDK
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

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

### Custom Spans

```typescript
import { trace, SpanStatusCode, context } from '@opentelemetry/api';

const tracer = trace.getTracer('user-service');

async function processPayment(orderId: string, amount: number) {
  return tracer.startActiveSpan('processPayment', async (span) => {
    try {
      // Add attributes
      span.setAttribute('order.id', orderId);
      span.setAttribute('payment.amount', amount);

      // Add events
      span.addEvent('payment_started');

      // Call payment gateway
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

// Cross-service context propagation
async function callInventoryService(orderId: string) {
  return tracer.startActiveSpan('callInventoryService', async (span) => {
    const headers = {};

    // Inject trace context into request headers
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

## Metrics Monitoring

### Prometheus Metrics

```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const registry = new Registry();

// Counter: Cumulative values
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [registry],
});

// Histogram: Distribution statistics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [registry],
});

// Gauge: Current values
const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [registry],
});

// Middleware to collect metrics
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

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});
```

### Business Metrics

```typescript
// Order-related metrics
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

// Record in business logic
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

## Alerting Strategy

### Prometheus Alert Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: application
    rules:
      # Error rate alert
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

      # Latency alert
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P95 latency is {{ $value }}s"

      # Service down
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
      # CPU usage
      - alert: HighCPUUsage
        expr: |
          100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }}%"

      # Memory usage
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

### Alert Notifications

```typescript
// Alert handler
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

    // Choose notification channel based on severity
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

## Health Checks

```typescript
// Health check endpoints
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

// Readiness check
app.get('/ready', async (req, res) => {
  const ready = await isApplicationReady();
  res.status(ready ? 200 : 503).send(ready ? 'Ready' : 'Not Ready');
});

// Liveness check
app.get('/live', (req, res) => {
  res.status(200).send('Alive');
});
```

## Best Practices Summary

```
Observability Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Logging                                           │
│   ├── Use structured logging                       │
│   ├── Include request context                      │
│   ├── Set appropriate log levels                  │
│   └── Centralize log storage                       │
│                                                     │
│   Tracing                                           │
│   ├── Use OpenTelemetry                            │
│   ├── Propagate trace context                      │
│   ├── Add meaningful spans                         │
│   └── Record key attributes and events            │
│                                                     │
│   Metrics                                           │
│   ├── RED method (Rate, Errors, Duration)         │
│   ├── USE method (Utilization, Saturation, Errors)│
│   ├── Business metrics                            │
│   └── Reasonable alert thresholds                 │
│                                                     │
│   Alerting                                          │
│   ├── SLO-based alerting                          │
│   ├── Tiered notification strategy                │
│   ├── Avoid alert fatigue                         │
│   └── Document alert response                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Solution |
|----------|---------------------|
| Log storage | Loki + Grafana |
| Metrics monitoring | Prometheus + Grafana |
| Distributed tracing | Jaeger / Tempo |
| Unified standard | OpenTelemetry |
| Alert management | Alertmanager |

Observability is the eyes of system operations. Build comprehensive monitoring to quickly identify and resolve issues.

---

*Systems you can't see are systems you can't manage. Observability makes complex systems transparent and controllable.*
