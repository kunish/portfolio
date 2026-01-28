---
title: 'JavaScript Proxy and Reflect Complete Guide'
description: 'Master Proxy objects, Reflect API, metaprogramming techniques, and practical applications'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'js-proxy-reflect-guide'
---

Proxy and Reflect are powerful metaprogramming features introduced in ES6. This article covers the usage and practical applications of these concepts.

## Proxy Basics

### Creating Proxies

```javascript
// Basic syntax
const target = { name: 'Alice', age: 25 };
const handler = {
  get(target, prop, receiver) {
    console.log(`Accessing property: ${prop}`);
    return target[prop];
  }
};

const proxy = new Proxy(target, handler);
proxy.name;  // Output: Accessing property: name, Returns: 'Alice'

// Empty handler (transparent proxy)
const transparentProxy = new Proxy(target, {});
transparentProxy.name;  // 'Alice' (direct access to original)
```

### Revocable Proxies

```javascript
// Create revocable proxy
const { proxy, revoke } = Proxy.revocable(target, handler);

proxy.name;  // Works normally

// Revoke the proxy
revoke();

// Access after revocation throws error
proxy.name;  // TypeError: Cannot perform 'get' on a proxy that has been revoked
```

## Common Traps

### get Trap

```javascript
const handler = {
  get(target, prop, receiver) {
    // Return default value for missing properties
    if (!(prop in target)) {
      return `Property ${prop} does not exist`;
    }
    return target[prop];
  }
};

const obj = new Proxy({ name: 'Alice' }, handler);
obj.name;     // 'Alice'
obj.unknown;  // 'Property unknown does not exist'

// Implement negative array indices
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

### set Trap

```javascript
// Data validation
const validator = {
  set(target, prop, value, receiver) {
    if (prop === 'age') {
      if (typeof value !== 'number') {
        throw new TypeError('Age must be a number');
      }
      if (value < 0 || value > 150) {
        throw new RangeError('Age must be between 0 and 150');
      }
    }
    target[prop] = value;
    return true;  // Indicates success
  }
};

const person = new Proxy({}, validator);
person.age = 25;    // OK
person.age = -1;    // RangeError
person.age = 'old'; // TypeError
```

### has Trap

```javascript
// Hide private properties
const handler = {
  has(target, prop) {
    if (prop.startsWith('_')) {
      return false;  // Hide properties starting with _
    }
    return prop in target;
  }
};

const obj = new Proxy({ name: 'Alice', _secret: 123 }, handler);
'name' in obj;     // true
'_secret' in obj;  // false (exists but hidden)
```

### deleteProperty Trap

```javascript
// Prevent deleting certain properties
const handler = {
  deleteProperty(target, prop) {
    if (prop.startsWith('_')) {
      throw new Error(`Cannot delete private property ${prop}`);
    }
    delete target[prop];
    return true;
  }
};

const obj = new Proxy({ name: 'Alice', _id: 1 }, handler);
delete obj.name;  // Success
delete obj._id;   // Error: Cannot delete private property _id
```

### ownKeys Trap

```javascript
// Filter enumerable properties
const handler = {
  ownKeys(target) {
    // Hide properties starting with _
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

### apply Trap

```javascript
// Function call interception
const handler = {
  apply(target, thisArg, args) {
    console.log(`Calling function with args: ${args}`);
    return target.apply(thisArg, args);
  }
};

function sum(a, b) {
  return a + b;
}

const proxySum = new Proxy(sum, handler);
proxySum(1, 2);  // Output: Calling function with args: 1,2, Returns: 3

// Function execution timing
const timedHandler = {
  apply(target, thisArg, args) {
    const start = performance.now();
    const result = target.apply(thisArg, args);
    const end = performance.now();
    console.log(`Execution time: ${end - start}ms`);
    return result;
  }
};
```

### construct Trap

```javascript
// Intercept new operator
const handler = {
  construct(target, args, newTarget) {
    console.log(`Creating instance with args: ${args}`);
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
// Output: Creating instance with args: Alice
```

## Reflect API

### Reflect Basics

```javascript
// Reflect methods correspond one-to-one with Proxy traps
const obj = { name: 'Alice', age: 25 };

// Property operations
Reflect.get(obj, 'name');           // 'Alice'
Reflect.set(obj, 'age', 26);        // true
Reflect.has(obj, 'name');           // true
Reflect.deleteProperty(obj, 'age'); // true

// Define property
Reflect.defineProperty(obj, 'city', {
  value: 'New York',
  writable: true
});

// Get property descriptor
Reflect.getOwnPropertyDescriptor(obj, 'name');

// Get prototype
Reflect.getPrototypeOf(obj);

// Set prototype
Reflect.setPrototypeOf(obj, null);
```

### Using Reflect in Proxy

```javascript
// Recommended: use Reflect in Proxy to forward operations
const handler = {
  get(target, prop, receiver) {
    console.log(`Accessing: ${prop}`);
    // Use Reflect to maintain correct this binding
    return Reflect.get(target, prop, receiver);
  },

  set(target, prop, value, receiver) {
    console.log(`Setting: ${prop} = ${value}`);
    return Reflect.set(target, prop, value, receiver);
  }
};

// Importance of receiver parameter
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

// Using Reflect.get(target, prop, receiver)
// receiver ensures this in getter points to correct object
child.name;  // 'Child' (not 'Parent')
```

### Reflect vs Traditional Methods

```javascript
// Reflect.get vs obj[prop]
const obj = { name: 'Alice' };
Reflect.get(obj, 'name');  // 'Alice'
obj['name'];               // 'Alice' (same effect)

// Reflect.set returns boolean for success/failure
const frozen = Object.freeze({ x: 1 });
Reflect.set(frozen, 'x', 2);  // false (set failed)
// frozen.x = 2;              // Silent fail or throws in strict mode

// Reflect.defineProperty returns boolean
const success = Reflect.defineProperty(obj, 'age', { value: 25 });
// vs Object.defineProperty throws on failure

// Reflect.has vs in operator
Reflect.has(obj, 'name');  // true
'name' in obj;             // true

// Reflect.deleteProperty vs delete
Reflect.deleteProperty(obj, 'name');  // true (returns success)
delete obj.name;                      // true (can't distinguish success from non-existent)
```

## Practical Applications

### Reactive System

```javascript
// Vue 3 style reactivity implementation
function reactive(target) {
  const handlers = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      track(target, prop);  // Collect dependencies
      // Recursively proxy nested objects
      if (typeof value === 'object' && value !== null) {
        return reactive(value);
      }
      return value;
    },

    set(target, prop, value, receiver) {
      const oldValue = target[prop];
      const result = Reflect.set(target, prop, value, receiver);
      if (oldValue !== value) {
        trigger(target, prop);  // Trigger updates
      }
      return result;
    }
  };

  return new Proxy(target, handlers);
}

// Simplified dependency tracking
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

### Data Validation

```javascript
// Create validated object
function createValidated(target, schema) {
  return new Proxy(target, {
    set(target, prop, value, receiver) {
      const validator = schema[prop];
      if (validator && !validator(value)) {
        throw new Error(`Property ${prop} validation failed`);
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
user.age = -1;             // Error: Property age validation failed
```

### Access Logging

```javascript
// Log all property access
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

### Caching Proxy

```javascript
// Function result caching
function memoize(fn) {
  const cache = new Map();

  return new Proxy(fn, {
    apply(target, thisArg, args) {
      const key = JSON.stringify(args);

      if (cache.has(key)) {
        console.log('Cache hit');
        return cache.get(key);
      }

      console.log('Computing result');
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
memoFib(40);  // Computing result (slow)
memoFib(40);  // Cache hit (instant)
```

### Singleton Pattern

```javascript
// Implement singleton using Proxy
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
    console.log('Creating database connection');
  }
}

const SingletonDB = createSingleton(Database);

const db1 = new SingletonDB('mysql://...');
const db2 = new SingletonDB('postgres://...');  // Won't create new instance

db1 === db2;  // true
```

### Immutable Objects

```javascript
// Deep freeze object
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
      throw new Error('Object is read-only');
    },

    deleteProperty() {
      throw new Error('Cannot delete property from read-only object');
    }
  });
}

const config = deepFreeze({
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 5000
  }
});

config.api.baseUrl = 'xxx';  // Error: Object is read-only
```

## Important Considerations

### Performance

```javascript
// Proxy has performance overhead
// Avoid excessive use in performance-critical paths

// Bad practice: complex proxy in hot path
const arr = new Proxy(largeArray, complexHandler);
for (let i = 0; i < arr.length; i++) {
  arr[i];  // Every access goes through proxy
}

// Better: get raw data when needed
const rawData = getOriginalData(arr);
for (let i = 0; i < rawData.length; i++) {
  rawData[i];  // Direct access
}
```

### this Binding Issues

```javascript
// Some built-in objects may have this binding issues
const map = new Map();
const proxyMap = new Proxy(map, {});

// This will throw because Map methods need correct this
// proxyMap.set('key', 'value');  // TypeError

// Solution: bind this
const proxyMap2 = new Proxy(map, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(target);
    }
    return value;
  }
});

proxyMap2.set('key', 'value');  // Works correctly
```

## Best Practices Summary

```
Proxy and Reflect Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Proxy Usage                                       │
│   ├── Data validation and type checking            │
│   ├── Implement reactive systems                   │
│   ├── Access control and logging                   │
│   └── Create immutable data structures             │
│                                                     │
│   Reflect Usage                                     │
│   ├── Forward operations in Proxy                  │
│   ├── Get success/failure as boolean               │
│   ├── Maintain correct receiver binding            │
│   └── Replace some Object static methods           │
│                                                     │
│   Considerations                                    │
│   ├── Be aware of performance overhead             │
│   ├── Handle this binding issues                   │
│   ├── Consider revocable proxies                   │
│   └── Design trap handlers carefully               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Trap | Intercepts | Reflect Method |
|------|------------|----------------|
| get | Property read | Reflect.get() |
| set | Property assignment | Reflect.set() |
| has | in operator | Reflect.has() |
| deleteProperty | delete operator | Reflect.deleteProperty() |
| apply | Function call | Reflect.apply() |
| construct | new operator | Reflect.construct() |

---

*Master Proxy and Reflect to unlock JavaScript metaprogramming capabilities.*
