---
title: 'JavaScript Debugging: From Console to Advanced DevTools'
description: 'Master Chrome DevTools, breakpoint debugging, performance profiling and troubleshooting methods'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'js-debugging-guide'
---

Debugging is an essential developer skill. This article explores various JavaScript debugging techniques and best practices.

## Console API

### Basic Methods

```typescript
// Basic output
console.log('Regular log');
console.info('Info');
console.warn('Warning');
console.error('Error');

// Formatted output
console.log('User %s is %d years old', 'Alice', 25);
console.log('Object: %o', { name: 'Alice', age: 25 });
console.log('Styled: %cRed text', 'color: red; font-size: 20px');

// Conditional logging
console.assert(1 === 2, 'This will show because condition is false');

// Clear console
console.clear();
```

### Advanced Methods

```typescript
// Grouping
console.group('User Info');
console.log('Name: Alice');
console.log('Age: 25');
console.groupEnd();

// Collapsed grouping
console.groupCollapsed('Details');
console.log('Email: alice@example.com');
console.log('Address: ...');
console.groupEnd();

// Table display
const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 },
];
console.table(users);
console.table(users, ['name']); // Show only name column

// Counter
function handleClick() {
  console.count('Click count');
}
console.countReset('Click count');

// Timer
console.time('Data loading');
await fetchData();
console.timeEnd('Data loading'); // Data loading: 1234ms

console.time('Operation');
console.timeLog('Operation', 'Intermediate state');
console.timeEnd('Operation');
```

### Debugging Techniques

```typescript
// Stack trace
function a() { b(); }
function b() { c(); }
function c() {
  console.trace('Call stack');
}
a();

// Directory structure
console.dir(document.body, { depth: 2 });

// Performance monitoring
console.profile('Performance analysis');
// Execute code
console.profileEnd('Performance analysis');

// Memory snapshot
console.memory;
```

## Chrome DevTools

### Breakpoint Types

```
Breakpoint Types:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Line Breakpoint                                   │
│   └── Click line number, most common               │
│                                                     │
│   Conditional Breakpoint                            │
│   └── Right-click line number > Add condition      │
│                                                     │
│   Logpoint                                          │
│   └── Don't pause, just log output                 │
│                                                     │
│   DOM Breakpoint                                    │
│   └── Triggers on node modification                │
│                                                     │
│   XHR/Fetch Breakpoint                              │
│   └── Triggers on network requests                 │
│                                                     │
│   Event Listener Breakpoint                         │
│   └── Pause on specific events                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Code Debugging

```typescript
// debugger statement
function processData(data) {
  debugger; // Code pauses here
  return data.map(transform);
}

// Conditional debugger
function handleRequest(req) {
  if (req.userId === 'problem-user') {
    debugger;
  }
  // Processing logic
}
```

### Watch Expressions

```javascript
// Add in DevTools Sources panel Watch section
// Common expressions:
this
this.state
Array.from(document.querySelectorAll('.item'))
localStorage.getItem('token')
performance.now()
```

### Debugging Shortcuts

| Shortcut | Function |
|----------|----------|
| F8 | Resume execution |
| F10 | Step over |
| F11 | Step into |
| Shift+F11 | Step out |
| Ctrl+\ | Pause/Resume |

## Network Debugging

### Request Analysis

```typescript
// Using DevTools Network panel
// Filters:
// - XHR: Show only XHR requests
// - Fetch: Show only Fetch requests
// - is:running: In-progress requests
// - larger-than:100k: Larger than 100KB
// - domain:api.example.com: Specific domain

// Copy request as cURL
// Right-click request > Copy > Copy as cURL

// Replay request
// Right-click request > Replay XHR
```

### Mock Requests

```typescript
// Override response using DevTools
// Network > Right-click request > Override content

// Mock using Service Worker
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

## Performance Debugging

### Performance Panel

```typescript
// Using Performance API
const startTime = performance.now();
await expensiveOperation();
const duration = performance.now() - startTime;
console.log(`Duration: ${duration}ms`);

// Marks and measures
performance.mark('start');
await operation1();
performance.mark('after-op1');
await operation2();
performance.mark('end');

performance.measure('operation1', 'start', 'after-op1');
performance.measure('operation2', 'after-op1', 'end');
performance.measure('total', 'start', 'end');

// Get measurements
const measures = performance.getEntriesByType('measure');
console.table(measures);

// Cleanup
performance.clearMarks();
performance.clearMeasures();
```

### Memory Debugging

```typescript
// Detecting memory leaks
// 1. DevTools > Memory > Take heap snapshot
// 2. Perform operations
// 3. Take another snapshot
// 4. Compare snapshots

// Common memory leaks
// 1. Uncleared event listeners
function badComponent() {
  window.addEventListener('resize', this.handleResize);
  // Forgot to remove on unmount
}

// 2. Closure references
function createLeak() {
  const largeData = new Array(1000000);
  return function() {
    console.log(largeData.length); // Closure holds reference
  };
}

// 3. Uncleared timers
const intervalId = setInterval(() => {
  // operation
}, 1000);
// Forgot to call clearInterval(intervalId)
```

## React Debugging

### React DevTools

```tsx
// Using displayName
const MyComponent = memo(function MyComponent() {
  return <div>Hello</div>;
});
MyComponent.displayName = 'MyComponent';

// Using useDebugValue
function useCustomHook(value: string) {
  useDebugValue(value ? `Value: ${value}` : 'Empty');
  // hook logic
}

// Profiler component
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

### State Debugging

```tsx
// Development environment debugging helpers
if (process.env.NODE_ENV === 'development') {
  // Expose to global for debugging
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

## Node.js Debugging

### Starting Debug

```bash
# Using --inspect
node --inspect app.js

# Pause at first line
node --inspect-brk app.js

# Specify port
node --inspect=9229 app.js

# Chrome DevTools debugging
# Open chrome://inspect
```

### VS Code Debugging

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

## Debugging Tips Summary

```
Debugging Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Locating Issues                                   │
│   ├── Use binary search to narrow scope            │
│   ├── Check network requests and responses         │
│   ├── Look at console errors                       │
│   └── Use breakpoints for step debugging           │
│                                                     │
│   Tool Selection                                    │
│   ├── Console for quick logging                    │
│   ├── Debugger for complex logic                   │
│   ├── Network for API issues                       │
│   └── Performance for perf issues                  │
│                                                     │
│   Prevention                                        │
│   ├── Use TypeScript                               │
│   ├── Write unit tests                             │
│   ├── Use ESLint                                   │
│   └── Code review                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Issue Type | Debugging Method |
|------------|------------------|
| Logic errors | Breakpoints + Watch |
| Performance issues | Performance panel |
| Memory leaks | Memory panel |
| Network issues | Network panel |

---

*Debugging isn't finding bugs, it's understanding how code runs.*
