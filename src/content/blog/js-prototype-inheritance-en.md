---
title: 'JavaScript Prototypes and Inheritance Explained'
description: 'Deep dive into prototype chain, constructors, class syntax and inheritance patterns'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'js-prototype-inheritance'
---

Prototypes are the core mechanism of JavaScript's object-oriented programming. This article explains how prototype chain and inheritance work.

## Prototype Basics

### Prototype Object

```javascript
// Every function has a prototype property
function Person(name) {
  this.name = name;
}

Person.prototype.sayHello = function() {
  console.log(`Hello, I'm ${this.name}`);
};

const alice = new Person('Alice');
alice.sayHello();  // "Hello, I'm Alice"

// Every object has [[Prototype]] internal property
console.log(alice.__proto__ === Person.prototype);  // true
console.log(Object.getPrototypeOf(alice) === Person.prototype);  // true
```

### Prototype Chain

```
Prototype Chain Structure:
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
// Property lookup follows the prototype chain
const obj = { a: 1 };

console.log(obj.a);           // 1 (own property)
console.log(obj.toString);    // function (from Object.prototype)
console.log(obj.notExist);    // undefined (not found in chain)

// Determine property origin
console.log(obj.hasOwnProperty('a'));          // true
console.log(obj.hasOwnProperty('toString'));   // false
console.log('toString' in obj);                // true
```

## Constructors

### Basic Pattern

```javascript
function Animal(name, age) {
  // Instance properties
  this.name = name;
  this.age = age;
}

// Prototype methods (shared)
Animal.prototype.speak = function() {
  console.log(`${this.name} makes a sound`);
};

// Static method
Animal.create = function(name, age) {
  return new Animal(name, age);
};

const dog = new Animal('Buddy', 3);
dog.speak();  // "Buddy makes a sound"

const cat = Animal.create('Whiskers', 2);
```

### How new Works

```javascript
// What the new keyword does:
function myNew(Constructor, ...args) {
  // 1. Create empty object with prototype pointing to Constructor.prototype
  const obj = Object.create(Constructor.prototype);

  // 2. Execute constructor with this bound to new object
  const result = Constructor.apply(obj, args);

  // 3. If constructor returns object, use it; otherwise use new object
  return result instanceof Object ? result : obj;
}

// Verification
const instance = myNew(Animal, 'Test', 1);
console.log(instance instanceof Animal);  // true
console.log(instance.name);               // "Test"
```

## Inheritance Patterns

### Prototype Chain Inheritance

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

// Prototype chain inheritance
Child.prototype = new Parent('default');
Child.prototype.constructor = Child;

const child1 = new Child('Alice', 10);
const child2 = new Child('Bob', 12);

// Problem: reference type properties are shared
child1.colors.push('green');
console.log(child2.colors);  // ['red', 'blue', 'green'] - polluted
```

### Constructor Borrowing

```javascript
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}

function Child(name, age) {
  // Borrow parent constructor
  Parent.call(this, name);
  this.age = age;
}

const child1 = new Child('Alice', 10);
const child2 = new Child('Bob', 12);

child1.colors.push('green');
console.log(child1.colors);  // ['red', 'blue', 'green']
console.log(child2.colors);  // ['red', 'blue'] - independent

// Problem: cannot inherit prototype methods
```

### Combination Inheritance

```javascript
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}

Parent.prototype.sayName = function() {
  console.log(this.name);
};

function Child(name, age) {
  Parent.call(this, name);  // First call to parent constructor
  this.age = age;
}

Child.prototype = new Parent();  // Second call to parent constructor
Child.prototype.constructor = Child;

Child.prototype.sayAge = function() {
  console.log(this.age);
};

const child = new Child('Alice', 10);
child.sayName();  // "Alice"
child.sayAge();   // 10

// Problem: parent constructor called twice
```

### Parasitic Combination Inheritance (Recommended)

```javascript
function inheritPrototype(Child, Parent) {
  // Create copy of parent prototype
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

// Use parasitic combination inheritance
inheritPrototype(Child, Parent);

Child.prototype.sayAge = function() {
  console.log(this.age);
};

const child = new Child('Alice', 10);
child.sayName();  // "Alice"
child.sayAge();   // 10
```

## ES6 Class Syntax

### Basic Syntax

```javascript
class Animal {
  // Constructor
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  // Instance method
  speak() {
    console.log(`${this.name} makes a sound`);
  }

  // Static method
  static create(name, age) {
    return new Animal(name, age);
  }

  // Getter
  get info() {
    return `${this.name}, ${this.age} years old`;
  }

  // Setter
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

### Class Inheritance

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
    super(name);  // Must call super first
    this.breed = breed;
  }

  speak() {
    super.speak();  // Call parent method
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

### Private Fields

```javascript
class BankAccount {
  // Private fields
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

  // Private method
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

## Object Creation Patterns

### Object.create

```javascript
// Create object with specified prototype
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

// Create object with no prototype
const pureObject = Object.create(null);
console.log(pureObject.toString);  // undefined
```

### Factory Pattern

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

// Pros: Simple, no new keyword
// Cons: Each object has method copies
```

## Best Practices Summary

```
Prototype and Inheritance Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Recommended                                       │
│   ├── Prefer ES6 class syntax                      │
│   ├── Use Object.getPrototypeOf over __proto__     │
│   ├── Use # private fields for private data        │
│   └── Favor composition over inheritance           │
│                                                     │
│   Avoid                                             │
│   ├── Modifying built-in object prototypes         │
│   ├── Deep inheritance hierarchies                 │
│   ├── Using __proto__ directly                     │
│   └── Reference types on prototypes                │
│                                                     │
│   Performance                                       │
│   ├── Prototype methods save memory                │
│   ├── Shorter chains mean faster lookups           │
│   └── Use hasOwnProperty to check own properties   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Pattern | Characteristics |
|---------|-----------------|
| Prototype Chain | Simple but has sharing issues |
| Constructor Borrowing | Independent properties, no methods |
| Combination | Complete but calls parent twice |
| Parasitic Combination | Best traditional approach |
| ES6 Class | Recommended, clean syntax |

---

*Understanding the prototype chain is fundamental to mastering JavaScript's object system.*
