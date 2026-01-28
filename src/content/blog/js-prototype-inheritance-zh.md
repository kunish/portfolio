---
title: 'JavaScript 原型与继承机制详解'
description: '深入理解原型链、构造函数、class 语法和各种继承模式'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'js-prototype-inheritance'
---

原型是 JavaScript 面向对象编程的核心机制。本文详解原型链和继承的工作原理。

## 原型基础

### 原型对象

```javascript
// 每个函数都有 prototype 属性
function Person(name) {
  this.name = name;
}

Person.prototype.sayHello = function() {
  console.log(`Hello, I'm ${this.name}`);
};

const alice = new Person('Alice');
alice.sayHello();  // "Hello, I'm Alice"

// 每个对象都有 [[Prototype]] 内部属性
console.log(alice.__proto__ === Person.prototype);  // true
console.log(Object.getPrototypeOf(alice) === Person.prototype);  // true
```

### 原型链

```
原型链结构：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   alice                                             │
│   ├── name: "Alice"                                │
│   └── [[Prototype]] ───→ Person.prototype          │
│                          ├── sayHello              │
│                          ├── constructor: Person   │
│                          └── [[Prototype]] ───→ Object.prototype
│                                                ├── toString
│                                                ├── hasOwnProperty
│                                                └── [[Prototype]] → null
│                                                     │
└─────────────────────────────────────────────────────┘
```

```javascript
// 属性查找沿原型链进行
const obj = { a: 1 };

console.log(obj.a);           // 1 (自身属性)
console.log(obj.toString);    // function (来自 Object.prototype)
console.log(obj.notExist);    // undefined (链上都没找到)

// 判断属性来源
console.log(obj.hasOwnProperty('a'));          // true
console.log(obj.hasOwnProperty('toString'));   // false
console.log('toString' in obj);                // true
```

## 构造函数

### 基本模式

```javascript
function Animal(name, age) {
  // 实例属性
  this.name = name;
  this.age = age;
}

// 原型方法（共享）
Animal.prototype.speak = function() {
  console.log(`${this.name} makes a sound`);
};

// 静态方法
Animal.create = function(name, age) {
  return new Animal(name, age);
};

const dog = new Animal('Buddy', 3);
dog.speak();  // "Buddy makes a sound"

const cat = Animal.create('Whiskers', 2);
```

### new 的工作原理

```javascript
// new 关键字做了什么：
function myNew(Constructor, ...args) {
  // 1. 创建空对象，原型指向构造函数的 prototype
  const obj = Object.create(Constructor.prototype);

  // 2. 执行构造函数，this 绑定到新对象
  const result = Constructor.apply(obj, args);

  // 3. 如果构造函数返回对象，使用该对象；否则使用新创建的对象
  return result instanceof Object ? result : obj;
}

// 验证
const instance = myNew(Animal, 'Test', 1);
console.log(instance instanceof Animal);  // true
console.log(instance.name);               // "Test"
```

## 继承模式

### 原型链继承

```javascript
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}

Parent.prototype.sayName = function() {
  console.log(this.name);
};

function Child(name, age) {
  this.age = age;
}

// 原型链继承
Child.prototype = new Parent('default');
Child.prototype.constructor = Child;

const child1 = new Child('Alice', 10);
const child2 = new Child('Bob', 12);

// 问题：引用类型属性被共享
child1.colors.push('green');
console.log(child2.colors);  // ['red', 'blue', 'green'] - 被污染了
```

### 借用构造函数

```javascript
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}

function Child(name, age) {
  // 借用父构造函数
  Parent.call(this, name);
  this.age = age;
}

const child1 = new Child('Alice', 10);
const child2 = new Child('Bob', 12);

child1.colors.push('green');
console.log(child1.colors);  // ['red', 'blue', 'green']
console.log(child2.colors);  // ['red', 'blue'] - 独立的

// 问题：无法继承原型方法
```

### 组合继承

```javascript
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}

Parent.prototype.sayName = function() {
  console.log(this.name);
};

function Child(name, age) {
  Parent.call(this, name);  // 第一次调用父构造函数
  this.age = age;
}

Child.prototype = new Parent();  // 第二次调用父构造函数
Child.prototype.constructor = Child;

Child.prototype.sayAge = function() {
  console.log(this.age);
};

const child = new Child('Alice', 10);
child.sayName();  // "Alice"
child.sayAge();   // 10

// 问题：父构造函数被调用两次
```

### 寄生组合继承（推荐）

```javascript
function inheritPrototype(Child, Parent) {
  // 创建父原型的副本
  const prototype = Object.create(Parent.prototype);
  prototype.constructor = Child;
  Child.prototype = prototype;
}

function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}

Parent.prototype.sayName = function() {
  console.log(this.name);
};

function Child(name, age) {
  Parent.call(this, name);
  this.age = age;
}

// 使用寄生组合继承
inheritPrototype(Child, Parent);

Child.prototype.sayAge = function() {
  console.log(this.age);
};

const child = new Child('Alice', 10);
child.sayName();  // "Alice"
child.sayAge();   // 10
```

## ES6 Class 语法

### 基本语法

```javascript
class Animal {
  // 构造函数
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  // 实例方法
  speak() {
    console.log(`${this.name} makes a sound`);
  }

  // 静态方法
  static create(name, age) {
    return new Animal(name, age);
  }

  // getter
  get info() {
    return `${this.name}, ${this.age} years old`;
  }

  // setter
  set info(value) {
    const [name, age] = value.split(',');
    this.name = name.trim();
    this.age = parseInt(age);
  }
}

const animal = new Animal('Buddy', 3);
animal.speak();            // "Buddy makes a sound"
console.log(animal.info);  // "Buddy, 3 years old"
```

### 类继承

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} makes a sound`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);  // 必须先调用 super
    this.breed = breed;
  }

  speak() {
    super.speak();  // 调用父类方法
    console.log(`${this.name} barks`);
  }

  fetch() {
    console.log(`${this.name} fetches the ball`);
  }
}

const dog = new Dog('Buddy', 'Golden Retriever');
dog.speak();
// "Buddy makes a sound"
// "Buddy barks"
```

### 私有字段

```javascript
class BankAccount {
  // 私有字段
  #balance = 0;
  #transactionHistory = [];

  constructor(initialBalance) {
    this.#balance = initialBalance;
  }

  deposit(amount) {
    if (amount > 0) {
      this.#balance += amount;
      this.#recordTransaction('deposit', amount);
    }
  }

  withdraw(amount) {
    if (amount > 0 && amount <= this.#balance) {
      this.#balance -= amount;
      this.#recordTransaction('withdraw', amount);
      return true;
    }
    return false;
  }

  // 私有方法
  #recordTransaction(type, amount) {
    this.#transactionHistory.push({
      type,
      amount,
      date: new Date()
    });
  }

  getBalance() {
    return this.#balance;
  }
}

const account = new BankAccount(100);
account.deposit(50);
console.log(account.getBalance());  // 150
// console.log(account.#balance);   // SyntaxError
```

## 对象创建模式

### Object.create

```javascript
// 创建指定原型的对象
const personProto = {
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
};

const person = Object.create(personProto, {
  name: {
    value: 'Alice',
    writable: true,
    enumerable: true
  }
});

person.greet();  // "Hello, I'm Alice"

// 创建无原型对象
const pureObject = Object.create(null);
console.log(pureObject.toString);  // undefined
```

### 工厂模式

```javascript
function createPerson(name, age) {
  return {
    name,
    age,
    greet() {
      console.log(`Hello, I'm ${this.name}`);
    }
  };
}

const person1 = createPerson('Alice', 25);
const person2 = createPerson('Bob', 30);

// 优点：简单，无 new 关键字
// 缺点：每个对象都有方法副本
```

## 最佳实践总结

```
原型与继承最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   推荐做法                                          │
│   ├── 优先使用 ES6 class 语法                      │
│   ├── 使用 Object.getPrototypeOf 代替 __proto__    │
│   ├── 私有数据使用 # 私有字段                      │
│   └── 组合优于继承                                 │
│                                                     │
│   避免的做法                                        │
│   ├── 修改内置对象原型                             │
│   ├── 过深的继承层次                               │
│   ├── 直接使用 __proto__                           │
│   └── 在原型上放置引用类型属性                     │
│                                                     │
│   性能考虑                                          │
│   ├── 原型方法比实例方法节省内存                   │
│   ├── 原型链越短查找越快                           │
│   └── 使用 hasOwnProperty 检查自身属性             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 模式 | 特点 |
|------|------|
| 原型链继承 | 简单但有共享问题 |
| 借用构造函数 | 独立属性但无法继承方法 |
| 组合继承 | 完整但调用两次父构造函数 |
| 寄生组合继承 | 最佳传统方案 |
| ES6 class | 推荐使用，语法清晰 |

---

*理解原型链是掌握 JavaScript 对象系统的基础。*
