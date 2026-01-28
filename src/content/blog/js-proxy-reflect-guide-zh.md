---
title: 'JavaScript Proxy 与 Reflect 完全指南'
description: '掌握 Proxy 代理对象、Reflect 反射 API、元编程技术和实际应用场景'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'js-proxy-reflect-guide'
---

Proxy 和 Reflect 是 ES6 引入的强大元编程特性。本文详解这些概念的用法和实际应用。

## Proxy 基础

### 创建代理

```javascript
// 基本语法
const target = { name: 'Alice', age: 25 };
const handler = {
  get(target, prop, receiver) {
    console.log(`访问属性: ${prop}`);
    return target[prop];
  }
};

const proxy = new Proxy(target, handler);
proxy.name;  // 输出: 访问属性: name，返回: 'Alice'

// 空处理器（透传代理）
const transparentProxy = new Proxy(target, {});
transparentProxy.name;  // 'Alice'（直接访问原对象）
```

### 可撤销代理

```javascript
// 创建可撤销代理
const { proxy, revoke } = Proxy.revocable(target, handler);

proxy.name;  // 正常工作

// 撤销代理
revoke();

// 撤销后访问抛出错误
proxy.name;  // TypeError: Cannot perform 'get' on a proxy that has been revoked
```

## 常用陷阱（Traps）

### get 陷阱

```javascript
const handler = {
  get(target, prop, receiver) {
    // 属性不存在时返回默认值
    if (!(prop in target)) {
      return `属性 ${prop} 不存在`;
    }
    return target[prop];
  }
};

const obj = new Proxy({ name: 'Alice' }, handler);
obj.name;     // 'Alice'
obj.unknown;  // '属性 unknown 不存在'

// 实现负数索引
const arr = new Proxy([1, 2, 3, 4, 5], {
  get(target, prop, receiver) {
    const index = Number(prop);
    if (index < 0) {
      prop = target.length + index;
    }
    return target[prop];
  }
});

arr[-1];  // 5
arr[-2];  // 4
```

### set 陷阱

```javascript
// 数据验证
const validator = {
  set(target, prop, value, receiver) {
    if (prop === 'age') {
      if (typeof value !== 'number') {
        throw new TypeError('年龄必须是数字');
      }
      if (value < 0 || value > 150) {
        throw new RangeError('年龄必须在 0-150 之间');
      }
    }
    target[prop] = value;
    return true;  // 表示设置成功
  }
};

const person = new Proxy({}, validator);
person.age = 25;    // 正常
person.age = -1;    // RangeError
person.age = 'old'; // TypeError
```

### has 陷阱

```javascript
// 隐藏私有属性
const handler = {
  has(target, prop) {
    if (prop.startsWith('_')) {
      return false;  // 隐藏 _ 开头的属性
    }
    return prop in target;
  }
};

const obj = new Proxy({ name: 'Alice', _secret: 123 }, handler);
'name' in obj;     // true
'_secret' in obj;  // false（实际存在但被隐藏）
```

### deleteProperty 陷阱

```javascript
// 阻止删除某些属性
const handler = {
  deleteProperty(target, prop) {
    if (prop.startsWith('_')) {
      throw new Error(`无法删除私有属性 ${prop}`);
    }
    delete target[prop];
    return true;
  }
};

const obj = new Proxy({ name: 'Alice', _id: 1 }, handler);
delete obj.name;  // 成功
delete obj._id;   // Error: 无法删除私有属性 _id
```

### ownKeys 陷阱

```javascript
// 过滤可枚举属性
const handler = {
  ownKeys(target) {
    // 隐藏 _ 开头的属性
    return Object.keys(target).filter(key => !key.startsWith('_'));
  }
};

const obj = new Proxy(
  { name: 'Alice', age: 25, _secret: 'hidden' },
  handler
);

Object.keys(obj);        // ['name', 'age']
Object.values(obj);      // ['Alice', 25]
Object.entries(obj);     // [['name', 'Alice'], ['age', 25]]
```

### apply 陷阱

```javascript
// 函数调用拦截
const handler = {
  apply(target, thisArg, args) {
    console.log(`调用函数，参数: ${args}`);
    return target.apply(thisArg, args);
  }
};

function sum(a, b) {
  return a + b;
}

const proxySum = new Proxy(sum, handler);
proxySum(1, 2);  // 输出: 调用函数，参数: 1,2，返回: 3

// 函数执行时间统计
const timedHandler = {
  apply(target, thisArg, args) {
    const start = performance.now();
    const result = target.apply(thisArg, args);
    const end = performance.now();
    console.log(`执行耗时: ${end - start}ms`);
    return result;
  }
};
```

### construct 陷阱

```javascript
// 拦截 new 操作
const handler = {
  construct(target, args, newTarget) {
    console.log(`创建实例，参数: ${args}`);
    return new target(...args);
  }
};

class Person {
  constructor(name) {
    this.name = name;
  }
}

const ProxyPerson = new Proxy(Person, handler);
const p = new ProxyPerson('Alice');
// 输出: 创建实例，参数: Alice
```

## Reflect API

### Reflect 基础

```javascript
// Reflect 方法与 Proxy 陷阱一一对应
const obj = { name: 'Alice', age: 25 };

// 属性操作
Reflect.get(obj, 'name');           // 'Alice'
Reflect.set(obj, 'age', 26);        // true
Reflect.has(obj, 'name');           // true
Reflect.deleteProperty(obj, 'age'); // true

// 定义属性
Reflect.defineProperty(obj, 'city', {
  value: 'Beijing',
  writable: true
});

// 获取属性描述符
Reflect.getOwnPropertyDescriptor(obj, 'name');

// 获取原型
Reflect.getPrototypeOf(obj);

// 设置原型
Reflect.setPrototypeOf(obj, null);
```

### 在 Proxy 中使用 Reflect

```javascript
// 推荐在 Proxy 中使用 Reflect 转发操作
const handler = {
  get(target, prop, receiver) {
    console.log(`访问: ${prop}`);
    // 使用 Reflect 保持正确的 this 绑定
    return Reflect.get(target, prop, receiver);
  },

  set(target, prop, value, receiver) {
    console.log(`设置: ${prop} = ${value}`);
    return Reflect.set(target, prop, value, receiver);
  }
};

// receiver 参数的重要性
const parent = new Proxy({
  get name() {
    return this._name;
  },
  _name: 'Parent'
}, handler);

const child = {
  __proto__: parent,
  _name: 'Child'
};

// 使用 Reflect.get(target, prop, receiver)
// receiver 确保 getter 中的 this 指向正确的对象
child.name;  // 'Child'（不是 'Parent'）
```

### Reflect vs 传统方法

```javascript
// Reflect.get vs obj[prop]
const obj = { name: 'Alice' };
Reflect.get(obj, 'name');  // 'Alice'
obj['name'];               // 'Alice'（效果相同）

// Reflect.set 返回布尔值表示成功与否
const frozen = Object.freeze({ x: 1 });
Reflect.set(frozen, 'x', 2);  // false（设置失败）
// frozen.x = 2;              // 静默失败或严格模式报错

// Reflect.defineProperty 返回布尔值
const success = Reflect.defineProperty(obj, 'age', { value: 25 });
// vs Object.defineProperty 失败时抛出异常

// Reflect.has vs in 操作符
Reflect.has(obj, 'name');  // true
'name' in obj;             // true

// Reflect.deleteProperty vs delete
Reflect.deleteProperty(obj, 'name');  // true（返回是否成功）
delete obj.name;                      // true（但无法区分删除成功和属性不存在）
```

## 实际应用场景

### 响应式系统

```javascript
// Vue 3 风格的响应式实现
function reactive(target) {
  const handlers = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      track(target, prop);  // 收集依赖
      // 递归代理嵌套对象
      if (typeof value === 'object' && value !== null) {
        return reactive(value);
      }
      return value;
    },

    set(target, prop, value, receiver) {
      const oldValue = target[prop];
      const result = Reflect.set(target, prop, value, receiver);
      if (oldValue !== value) {
        trigger(target, prop);  // 触发更新
      }
      return result;
    }
  };

  return new Proxy(target, handlers);
}

// 简化的依赖追踪
let activeEffect = null;
const targetMap = new WeakMap();

function track(target, prop) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    let deps = depsMap.get(prop);
    if (!deps) {
      depsMap.set(prop, (deps = new Set()));
    }
    deps.add(activeEffect);
  }
}

function trigger(target, prop) {
  const depsMap = targetMap.get(target);
  if (depsMap) {
    const deps = depsMap.get(prop);
    if (deps) {
      deps.forEach(effect => effect());
    }
  }
}
```

### 数据验证

```javascript
// 创建带验证的对象
function createValidated(target, schema) {
  return new Proxy(target, {
    set(target, prop, value, receiver) {
      const validator = schema[prop];
      if (validator && !validator(value)) {
        throw new Error(`属性 ${prop} 验证失败`);
      }
      return Reflect.set(target, prop, value, receiver);
    }
  });
}

const userSchema = {
  name: v => typeof v === 'string' && v.length > 0,
  age: v => typeof v === 'number' && v >= 0 && v <= 150,
  email: v => /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(v)
};

const user = createValidated({}, userSchema);
user.name = 'Alice';       // OK
user.age = 25;             // OK
user.email = 'test@example.com';  // OK
user.age = -1;             // Error: 属性 age 验证失败
```

### 访问日志

```javascript
// 记录所有属性访问
function createLogger(target, name = 'Object') {
  return new Proxy(target, {
    get(target, prop, receiver) {
      console.log(`[GET] ${name}.${prop}`);
      return Reflect.get(target, prop, receiver);
    },

    set(target, prop, value, receiver) {
      console.log(`[SET] ${name}.${prop} = ${JSON.stringify(value)}`);
      return Reflect.set(target, prop, value, receiver);
    },

    deleteProperty(target, prop) {
      console.log(`[DELETE] ${name}.${prop}`);
      return Reflect.deleteProperty(target, prop);
    }
  });
}

const user = createLogger({ name: 'Alice' }, 'user');
user.name;           // [GET] user.name
user.age = 25;       // [SET] user.age = 25
delete user.age;     // [DELETE] user.age
```

### 缓存代理

```javascript
// 函数结果缓存
function memoize(fn) {
  const cache = new Map();

  return new Proxy(fn, {
    apply(target, thisArg, args) {
      const key = JSON.stringify(args);

      if (cache.has(key)) {
        console.log('缓存命中');
        return cache.get(key);
      }

      console.log('计算结果');
      const result = Reflect.apply(target, thisArg, args);
      cache.set(key, result);
      return result;
    }
  });
}

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const memoFib = memoize(fibonacci);
memoFib(40);  // 计算结果（较慢）
memoFib(40);  // 缓存命中（瞬间）
```

### 单例模式

```javascript
// 使用 Proxy 实现单例
function createSingleton(ClassName) {
  let instance = null;

  return new Proxy(ClassName, {
    construct(target, args, newTarget) {
      if (!instance) {
        instance = Reflect.construct(target, args, newTarget);
      }
      return instance;
    }
  });
}

class Database {
  constructor(connection) {
    this.connection = connection;
    console.log('创建数据库连接');
  }
}

const SingletonDB = createSingleton(Database);

const db1 = new SingletonDB('mysql://...');
const db2 = new SingletonDB('postgres://...');  // 不会创建新实例

db1 === db2;  // true
```

### 不可变对象

```javascript
// 深度冻结对象
function deepFreeze(target) {
  return new Proxy(target, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'object' && value !== null) {
        return deepFreeze(value);
      }
      return value;
    },

    set() {
      throw new Error('对象是只读的');
    },

    deleteProperty() {
      throw new Error('无法删除只读对象的属性');
    }
  });
}

const config = deepFreeze({
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 5000
  }
});

config.api.baseUrl = 'xxx';  // Error: 对象是只读的
```

## 注意事项

### 性能考虑

```javascript
// Proxy 有一定性能开销
// 避免在性能关键路径上过度使用

// 不好的实践：在热路径上使用复杂代理
const arr = new Proxy(largeArray, complexHandler);
for (let i = 0; i < arr.length; i++) {
  arr[i];  // 每次访问都经过代理
}

// 更好的做法：必要时获取原始数据
const rawData = getOriginalData(arr);
for (let i = 0; i < rawData.length; i++) {
  rawData[i];  // 直接访问
}
```

### this 绑定问题

```javascript
// 某些内置对象可能有 this 绑定问题
const map = new Map();
const proxyMap = new Proxy(map, {});

// 这会报错，因为 Map 方法需要正确的 this
// proxyMap.set('key', 'value');  // TypeError

// 解决方案：绑定 this
const proxyMap2 = new Proxy(map, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(target);
    }
    return value;
  }
});

proxyMap2.set('key', 'value');  // 正常工作
```

## 最佳实践总结

```
Proxy 与 Reflect 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Proxy 使用                                        │
│   ├── 数据验证和类型检查                           │
│   ├── 实现响应式系统                               │
│   ├── 访问控制和日志记录                           │
│   └── 创建不可变数据结构                           │
│                                                     │
│   Reflect 使用                                      │
│   ├── 在 Proxy 中转发操作                          │
│   ├── 获取操作成功/失败的布尔值                   │
│   ├── 保持正确的 receiver 绑定                    │
│   └── 替代一些 Object 静态方法                     │
│                                                     │
│   注意事项                                          │
│   ├── 注意性能开销                                 │
│   ├── 处理 this 绑定问题                           │
│   ├── 考虑使用可撤销代理                           │
│   └── 合理设计陷阱处理器                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 陷阱 | 拦截操作 | Reflect 方法 |
|------|----------|--------------|
| get | 属性读取 | Reflect.get() |
| set | 属性设置 | Reflect.set() |
| has | in 操作符 | Reflect.has() |
| deleteProperty | delete 操作符 | Reflect.deleteProperty() |
| apply | 函数调用 | Reflect.apply() |
| construct | new 操作符 | Reflect.construct() |

---

*掌握 Proxy 和 Reflect，解锁 JavaScript 元编程能力。*
