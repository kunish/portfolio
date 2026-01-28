---
title: 'JavaScript 调试技巧：从 Console 到 DevTools 高级用法'
description: '掌握 Chrome DevTools、断点调试、性能分析和常见问题排查方法'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'js-debugging-guide'
---

调试是开发者必备技能。本文探讨 JavaScript 调试的各种技术和最佳实践。

## Console API

### 基础方法

```typescript
// 基本输出
console.log('普通日志');
console.info('信息');
console.warn('警告');
console.error('错误');

// 格式化输出
console.log('用户 %s 的年龄是 %d', 'Alice', 25);
console.log('对象: %o', { name: 'Alice', age: 25 });
console.log('样式: %c红色文字', 'color: red; font-size: 20px');

// 条件日志
console.assert(1 === 2, '这条会显示因为条件为假');

// 清空控制台
console.clear();
```

### 高级方法

```typescript
// 分组
console.group('用户信息');
console.log('姓名: Alice');
console.log('年龄: 25');
console.groupEnd();

// 折叠分组
console.groupCollapsed('详细信息');
console.log('邮箱: alice@example.com');
console.log('地址: ...');
console.groupEnd();

// 表格显示
const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 },
];
console.table(users);
console.table(users, ['name']); // 只显示 name 列

// 计数器
function handleClick() {
  console.count('点击次数');
}
console.countReset('点击次数');

// 计时器
console.time('数据加载');
await fetchData();
console.timeEnd('数据加载'); // 数据加载: 1234ms

console.time('操作');
console.timeLog('操作', '中间状态');
console.timeEnd('操作');
```

### 调试技巧

```typescript
// 调用栈追踪
function a() { b(); }
function b() { c(); }
function c() {
  console.trace('调用栈');
}
a();

// 目录结构
console.dir(document.body, { depth: 2 });

// 性能监控
console.profile('性能分析');
// 执行代码
console.profileEnd('性能分析');

// 内存快照
console.memory;
```

## Chrome DevTools

### 断点类型

```
断点类型：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   行断点                                            │
│   └── 点击行号设置，最常用                          │
│                                                     │
│   条件断点                                          │
│   └── 右键行号 > 添加条件表达式                    │
│                                                     │
│   日志断点                                          │
│   └── 不暂停，只输出日志                            │
│                                                     │
│   DOM 断点                                          │
│   └── 节点修改时触发                                │
│                                                     │
│   XHR/Fetch 断点                                    │
│   └── 网络请求时触发                                │
│                                                     │
│   事件监听器断点                                    │
│   └── 特定事件触发时暂停                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 代码调试

```typescript
// debugger 语句
function processData(data) {
  debugger; // 代码执行到这里会暂停
  return data.map(transform);
}

// 条件 debugger
function handleRequest(req) {
  if (req.userId === 'problem-user') {
    debugger;
  }
  // 处理逻辑
}
```

### Watch 表达式

```javascript
// 在 DevTools Sources 面板的 Watch 区域添加
// 常用表达式：
this
this.state
Array.from(document.querySelectorAll('.item'))
localStorage.getItem('token')
performance.now()
```

### 调试快捷键

| 快捷键 | 功能 |
|--------|------|
| F8 | 继续执行 |
| F10 | 单步跳过 |
| F11 | 单步进入 |
| Shift+F11 | 单步跳出 |
| Ctrl+\ | 暂停/继续 |

## 网络调试

### 请求分析

```typescript
// 使用 DevTools Network 面板
// 过滤器：
// - XHR：只显示 XHR 请求
// - Fetch：只显示 Fetch 请求
// - is:running：进行中的请求
// - larger-than:100k：大于 100KB 的请求
// - domain:api.example.com：特定域名

// 复制请求为 cURL
// 右键请求 > Copy > Copy as cURL

// 重放请求
// 右键请求 > Replay XHR
```

### Mock 请求

```typescript
// 使用 DevTools 覆盖响应
// Network > 右键请求 > Override content

// 使用 Service Worker mock
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/users')) {
    event.respondWith(
      new Response(JSON.stringify({ mock: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
});
```

## 性能调试

### Performance 面板

```typescript
// 使用 Performance API
const startTime = performance.now();
await expensiveOperation();
const duration = performance.now() - startTime;
console.log(`耗时: ${duration}ms`);

// 标记和测量
performance.mark('start');
await operation1();
performance.mark('after-op1');
await operation2();
performance.mark('end');

performance.measure('operation1', 'start', 'after-op1');
performance.measure('operation2', 'after-op1', 'end');
performance.measure('total', 'start', 'end');

// 获取测量结果
const measures = performance.getEntriesByType('measure');
console.table(measures);

// 清理
performance.clearMarks();
performance.clearMeasures();
```

### 内存调试

```typescript
// 检测内存泄漏
// 1. DevTools > Memory > Take heap snapshot
// 2. 执行操作
// 3. 再次快照
// 4. 比较两次快照

// 常见内存泄漏
// 1. 未清理的事件监听器
function badComponent() {
  window.addEventListener('resize', this.handleResize);
  // 忘记在卸载时移除
}

// 2. 闭包引用
function createLeak() {
  const largeData = new Array(1000000);
  return function() {
    console.log(largeData.length); // 闭包持有引用
  };
}

// 3. 定时器未清理
const intervalId = setInterval(() => {
  // 操作
}, 1000);
// 忘记调用 clearInterval(intervalId)
```

## React 调试

### React DevTools

```tsx
// 使用 displayName
const MyComponent = memo(function MyComponent() {
  return <div>Hello</div>;
});
MyComponent.displayName = 'MyComponent';

// 使用 useDebugValue
function useCustomHook(value: string) {
  useDebugValue(value ? `Value: ${value}` : 'Empty');
  // hook 逻辑
}

// Profiler 组件
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
) {
  console.log(`${id} ${phase}: ${actualDuration}ms`);
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <MainContent />
    </Profiler>
  );
}
```

### 状态调试

```tsx
// 开发环境调试辅助
if (process.env.NODE_ENV === 'development') {
  // 暴露到全局便于调试
  (window as any).__DEBUG__ = {
    getState: () => store.getState(),
    dispatch: store.dispatch,
  };
}

// useWhyDidYouUpdate hook
function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>({});

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changes: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current[key] !== props[key]) {
          changes[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changes).length) {
        console.log('[why-did-you-update]', name, changes);
      }
    }

    previousProps.current = props;
  });
}
```

## Node.js 调试

### 启动调试

```bash
# 使用 --inspect
node --inspect app.js

# 在第一行暂停
node --inspect-brk app.js

# 指定端口
node --inspect=9229 app.js

# Chrome DevTools 调试
# 打开 chrome://inspect
```

### VS Code 调试

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Program",
      "program": "${workspaceFolder}/src/index.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Process",
      "port": 9229
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--reporter=verbose"],
      "console": "integratedTerminal"
    }
  ]
}
```

## 调试技巧总结

```
调试最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   定位问题                                          │
│   ├── 使用二分法缩小范围                            │
│   ├── 检查网络请求和响应                            │
│   ├── 查看控制台错误                                │
│   └── 使用断点逐步调试                              │
│                                                     │
│   工具选择                                          │
│   ├── Console 用于快速日志                         │
│   ├── Debugger 用于复杂逻辑                        │
│   ├── Network 用于 API 问题                        │
│   └── Performance 用于性能问题                      │
│                                                     │
│   预防问题                                          │
│   ├── 使用 TypeScript                              │
│   ├── 编写单元测试                                  │
│   ├── 使用 ESLint                                  │
│   └── 代码审查                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 问题类型 | 调试方法 |
|----------|----------|
| 逻辑错误 | 断点 + Watch |
| 性能问题 | Performance 面板 |
| 内存泄漏 | Memory 面板 |
| 网络问题 | Network 面板 |

---

*调试不是找虫子，是理解代码如何运行。*
