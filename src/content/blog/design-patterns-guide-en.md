---
title: 'Design Patterns: Building Maintainable Code Architecture'
description: 'Master creational, structural, and behavioral design patterns with modern applications'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'design-patterns-guide'
---

Design patterns are proven solutions in software development. This article explores common patterns and their practical applications.

## Design Patterns Overview

### Why Design Patterns Matter

```
Value of Design Patterns:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Code Reuse                                        │
│   └── Proven solutions to common problems          │
│                                                     │
│   Maintainability                                   │
│   └── Clear code structure                         │
│                                                     │
│   Team Collaboration                                │
│   └── Shared design vocabulary                     │
│                                                     │
│   Flexibility                                       │
│   └── Adapt to changing requirements               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Type | Purpose | Common Patterns |
|------|---------|-----------------|
| Creational | Object creation | Singleton, Factory, Builder |
| Structural | Object composition | Adapter, Decorator, Proxy |
| Behavioral | Object interaction | Observer, Strategy, Command |

## Creational Patterns

### Singleton Pattern

```typescript
// Singleton - Ensures only one instance exists
class Database {
  private static instance: Database;
  private connection: Connection;

  private constructor() {
    this.connection = this.connect();
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private connect(): Connection {
    return new Connection('mongodb://localhost:27017');
  }

  query(sql: string) {
    return this.connection.execute(sql);
  }
}

// Usage
const db1 = Database.getInstance();
const db2 = Database.getInstance();
console.log(db1 === db2); // true
```

### Factory Pattern

```typescript
// Product interface
interface Button {
  render(): void;
  onClick(handler: () => void): void;
}

// Concrete products
class WindowsButton implements Button {
  render() {
    console.log('Rendering Windows style button');
  }
  onClick(handler: () => void) {
    console.log('Binding Windows click event');
    handler();
  }
}

class MacButton implements Button {
  render() {
    console.log('Rendering Mac style button');
  }
  onClick(handler: () => void) {
    console.log('Binding Mac click event');
    handler();
  }
}

// Factory
class ButtonFactory {
  static createButton(os: 'windows' | 'mac'): Button {
    switch (os) {
      case 'windows':
        return new WindowsButton();
      case 'mac':
        return new MacButton();
      default:
        throw new Error('Unsupported OS');
    }
  }
}

// Usage
const button = ButtonFactory.createButton('mac');
button.render();
```

### Builder Pattern

```typescript
// Building complex objects
class QueryBuilder {
  private query: string = '';
  private table: string = '';
  private conditions: string[] = [];
  private orderBy: string = '';
  private limitValue: number = 0;

  select(fields: string[]): this {
    this.query = `SELECT ${fields.join(', ')}`;
    return this;
  }

  from(table: string): this {
    this.table = table;
    return this;
  }

  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }

  order(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderBy = `ORDER BY ${field} ${direction}`;
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  build(): string {
    let sql = `${this.query} FROM ${this.table}`;

    if (this.conditions.length > 0) {
      sql += ` WHERE ${this.conditions.join(' AND ')}`;
    }
    if (this.orderBy) {
      sql += ` ${this.orderBy}`;
    }
    if (this.limitValue > 0) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    return sql;
  }
}

// Usage
const query = new QueryBuilder()
  .select(['id', 'name', 'email'])
  .from('users')
  .where('status = "active"')
  .where('age > 18')
  .order('created_at', 'DESC')
  .limit(10)
  .build();

console.log(query);
// SELECT id, name, email FROM users WHERE status = "active" AND age > 18 ORDER BY created_at DESC LIMIT 10
```

## Structural Patterns

### Adapter Pattern

```typescript
// Old payment interface
interface OldPaymentSystem {
  processPayment(amount: number): void;
}

class LegacyPayment implements OldPaymentSystem {
  processPayment(amount: number) {
    console.log(`Legacy system processing: $${amount}`);
  }
}

// New payment interface
interface NewPaymentSystem {
  pay(data: { amount: number; currency: string }): Promise<boolean>;
}

// Adapter
class PaymentAdapter implements NewPaymentSystem {
  private legacyPayment: OldPaymentSystem;

  constructor(legacyPayment: OldPaymentSystem) {
    this.legacyPayment = legacyPayment;
  }

  async pay(data: { amount: number; currency: string }): Promise<boolean> {
    try {
      this.legacyPayment.processPayment(data.amount);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Usage
const legacy = new LegacyPayment();
const adapter = new PaymentAdapter(legacy);
await adapter.pay({ amount: 100, currency: 'USD' });
```

### Decorator Pattern

```typescript
// Base component interface
interface Coffee {
  cost(): number;
  description(): string;
}

// Base coffee
class SimpleCoffee implements Coffee {
  cost() {
    return 10;
  }
  description() {
    return 'Simple coffee';
  }
}

// Decorator base class
abstract class CoffeeDecorator implements Coffee {
  protected coffee: Coffee;

  constructor(coffee: Coffee) {
    this.coffee = coffee;
  }

  cost(): number {
    return this.coffee.cost();
  }

  description(): string {
    return this.coffee.description();
  }
}

// Concrete decorators
class MilkDecorator extends CoffeeDecorator {
  cost() {
    return this.coffee.cost() + 3;
  }
  description() {
    return `${this.coffee.description()} + milk`;
  }
}

class SugarDecorator extends CoffeeDecorator {
  cost() {
    return this.coffee.cost() + 1;
  }
  description() {
    return `${this.coffee.description()} + sugar`;
  }
}

// Usage
let coffee: Coffee = new SimpleCoffee();
console.log(`${coffee.description()}: $${coffee.cost()}`);

coffee = new MilkDecorator(coffee);
coffee = new SugarDecorator(coffee);
console.log(`${coffee.description()}: $${coffee.cost()}`);
// Simple coffee + milk + sugar: $14
```

### Proxy Pattern

```typescript
// Image interface
interface Image {
  display(): void;
}

// Real image
class RealImage implements Image {
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;
    this.loadFromDisk();
  }

  private loadFromDisk() {
    console.log(`Loading image: ${this.filename}`);
  }

  display() {
    console.log(`Displaying image: ${this.filename}`);
  }
}

// Proxy image (lazy loading)
class ProxyImage implements Image {
  private realImage: RealImage | null = null;
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  display() {
    if (!this.realImage) {
      this.realImage = new RealImage(this.filename);
    }
    this.realImage.display();
  }
}

// Usage
const image = new ProxyImage('photo.jpg');
// Image not loaded yet

image.display(); // Loads on first call
image.display(); // Uses cached instance
```

## Behavioral Patterns

### Observer Pattern

```typescript
// Observer interface
interface Observer {
  update(data: any): void;
}

// Subject interface
interface Subject {
  subscribe(observer: Observer): void;
  unsubscribe(observer: Observer): void;
  notify(data: any): void;
}

// Event emitter implementation
class EventEmitter implements Subject {
  private observers: Observer[] = [];

  subscribe(observer: Observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer: Observer) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  notify(data: any) {
    this.observers.forEach(observer => observer.update(data));
  }
}

// Concrete observers
class Logger implements Observer {
  update(data: any) {
    console.log('Logging:', data);
  }
}

class EmailNotifier implements Observer {
  update(data: any) {
    console.log('Sending email notification:', data);
  }
}

// Usage
const emitter = new EventEmitter();
const logger = new Logger();
const emailer = new EmailNotifier();

emitter.subscribe(logger);
emitter.subscribe(emailer);

emitter.notify({ event: 'user_registered', userId: 123 });
```

### Strategy Pattern

```typescript
// Strategy interface
interface PaymentStrategy {
  pay(amount: number): void;
}

// Concrete strategies
class CreditCardPayment implements PaymentStrategy {
  private cardNumber: string;

  constructor(cardNumber: string) {
    this.cardNumber = cardNumber;
  }

  pay(amount: number) {
    console.log(`Credit card payment: $${amount}, Card: ${this.cardNumber}`);
  }
}

class PayPalPayment implements PaymentStrategy {
  private email: string;

  constructor(email: string) {
    this.email = email;
  }

  pay(amount: number) {
    console.log(`PayPal payment: $${amount}, Email: ${this.email}`);
  }
}

class CryptoPayment implements PaymentStrategy {
  pay(amount: number) {
    console.log(`Crypto payment: $${amount}`);
  }
}

// Context
class PaymentContext {
  private strategy: PaymentStrategy;

  setStrategy(strategy: PaymentStrategy) {
    this.strategy = strategy;
  }

  executePayment(amount: number) {
    this.strategy.pay(amount);
  }
}

// Usage
const payment = new PaymentContext();

payment.setStrategy(new CreditCardPayment('1234-5678'));
payment.executePayment(100);

payment.setStrategy(new PayPalPayment('user@example.com'));
payment.executePayment(200);
```

### Command Pattern

```typescript
// Command interface
interface Command {
  execute(): void;
  undo(): void;
}

// Receiver
class TextEditor {
  private content: string = '';

  write(text: string) {
    this.content += text;
  }

  deleteLast(length: number) {
    this.content = this.content.slice(0, -length);
  }

  getContent() {
    return this.content;
  }
}

// Concrete command
class WriteCommand implements Command {
  private editor: TextEditor;
  private text: string;

  constructor(editor: TextEditor, text: string) {
    this.editor = editor;
    this.text = text;
  }

  execute() {
    this.editor.write(this.text);
  }

  undo() {
    this.editor.deleteLast(this.text.length);
  }
}

// Invoker
class CommandManager {
  private history: Command[] = [];

  execute(command: Command) {
    command.execute();
    this.history.push(command);
  }

  undo() {
    const command = this.history.pop();
    if (command) {
      command.undo();
    }
  }
}

// Usage
const editor = new TextEditor();
const manager = new CommandManager();

manager.execute(new WriteCommand(editor, 'Hello '));
manager.execute(new WriteCommand(editor, 'World'));
console.log(editor.getContent()); // Hello World

manager.undo();
console.log(editor.getContent()); // Hello
```

## Modern Applications

### Design Patterns in React

```tsx
// Compound Components Pattern
const Tabs = ({ children, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

Tabs.List = ({ children }) => (
  <div className="tab-list">{children}</div>
);

Tabs.Tab = ({ value, children }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button
      className={activeTab === value ? 'active' : ''}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = ({ value, children }) => {
  const { activeTab } = useContext(TabsContext);
  return activeTab === value ? <div>{children}</div> : null;
};

// Usage
<Tabs defaultTab="tab1">
  <Tabs.List>
    <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
    <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
  <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
</Tabs>
```

### Dependency Injection

```typescript
// Dependency injection container
class Container {
  private services = new Map<string, any>();

  register<T>(key: string, factory: () => T) {
    this.services.set(key, factory);
  }

  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service ${key} not registered`);
    }
    return factory();
  }
}

// Usage
const container = new Container();

container.register('database', () => new Database());
container.register('userService', () =>
  new UserService(container.resolve('database'))
);

const userService = container.resolve('userService');
```

## Best Practices Summary

```
Design Pattern Selection Guide:
┌─────────────────────────────────────────────────────┐
│   When to Use                                       │
│   ├── Recurring similar problems                   │
│   ├── Need increased flexibility                   │
│   ├── Team needs shared vocabulary                 │
│   └── Anticipating changes                         │
│                                                     │
│   Avoid Over-Engineering                            │
│   ├── Simple problems don't need complex patterns  │
│   ├── Make it work first, then optimize            │
│   ├── Introduce patterns during refactoring        │
│   └── Follow YAGNI principle                       │
│                                                     │
│   Common Combinations                               │
│   ├── Factory + Singleton                          │
│   ├── Strategy + Factory                           │
│   ├── Decorator + Composite                        │
│   └── Observer + Command                           │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Pattern |
|----------|---------------------|
| Global state management | Singleton |
| Object creation varies | Factory |
| Feature extension | Decorator |
| Event handling | Observer |
| Algorithm switching | Strategy |

---

*Design patterns aren't silver bullets, but tools in your toolbox. Choose the right pattern to make your code more elegant.*
