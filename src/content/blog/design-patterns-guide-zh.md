---
title: '设计模式实战：构建可维护的代码架构'
description: '掌握创建型、结构型、行为型设计模式及其在现代开发中的应用'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'design-patterns-guide'
---

设计模式是软件开发中经过验证的解决方案。本文探讨常用设计模式及其实践应用。

## 设计模式概述

### 为什么需要设计模式

```
设计模式的价值：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   代码复用                                          │
│   └── 经过验证的解决方案                            │
│                                                     │
│   可维护性                                          │
│   └── 清晰的代码结构                                │
│                                                     │
│   团队协作                                          │
│   └── 共同的设计语言                                │
│                                                     │
│   灵活扩展                                          │
│   └── 应对需求变化                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 类型 | 目的 | 常见模式 |
|------|------|----------|
| 创建型 | 对象创建 | 单例、工厂、建造者 |
| 结构型 | 对象组合 | 适配器、装饰器、代理 |
| 行为型 | 对象交互 | 观察者、策略、命令 |

## 创建型模式

### 单例模式

```typescript
// 单例模式 - 确保类只有一个实例
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

// 使用
const db1 = Database.getInstance();
const db2 = Database.getInstance();
console.log(db1 === db2); // true
```

### 工厂模式

```typescript
// 产品接口
interface Button {
  render(): void;
  onClick(handler: () => void): void;
}

// 具体产品
class WindowsButton implements Button {
  render() {
    console.log('渲染 Windows 风格按钮');
  }
  onClick(handler: () => void) {
    console.log('绑定 Windows 点击事件');
    handler();
  }
}

class MacButton implements Button {
  render() {
    console.log('渲染 Mac 风格按钮');
  }
  onClick(handler: () => void) {
    console.log('绑定 Mac 点击事件');
    handler();
  }
}

// 工厂
class ButtonFactory {
  static createButton(os: 'windows' | 'mac'): Button {
    switch (os) {
      case 'windows':
        return new WindowsButton();
      case 'mac':
        return new MacButton();
      default:
        throw new Error('不支持的操作系统');
    }
  }
}

// 使用
const button = ButtonFactory.createButton('mac');
button.render();
```

### 建造者模式

```typescript
// 复杂对象的构建
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

// 使用
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

## 结构型模式

### 适配器模式

```typescript
// 旧的支付接口
interface OldPaymentSystem {
  processPayment(amount: number): void;
}

class LegacyPayment implements OldPaymentSystem {
  processPayment(amount: number) {
    console.log(`旧系统处理支付: ¥${amount}`);
  }
}

// 新的支付接口
interface NewPaymentSystem {
  pay(data: { amount: number; currency: string }): Promise<boolean>;
}

// 适配器
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

// 使用
const legacy = new LegacyPayment();
const adapter = new PaymentAdapter(legacy);
await adapter.pay({ amount: 100, currency: 'CNY' });
```

### 装饰器模式

```typescript
// 基础组件接口
interface Coffee {
  cost(): number;
  description(): string;
}

// 基础咖啡
class SimpleCoffee implements Coffee {
  cost() {
    return 10;
  }
  description() {
    return '简单咖啡';
  }
}

// 装饰器基类
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

// 具体装饰器
class MilkDecorator extends CoffeeDecorator {
  cost() {
    return this.coffee.cost() + 3;
  }
  description() {
    return `${this.coffee.description()} + 牛奶`;
  }
}

class SugarDecorator extends CoffeeDecorator {
  cost() {
    return this.coffee.cost() + 1;
  }
  description() {
    return `${this.coffee.description()} + 糖`;
  }
}

// 使用
let coffee: Coffee = new SimpleCoffee();
console.log(`${coffee.description()}: ¥${coffee.cost()}`);

coffee = new MilkDecorator(coffee);
coffee = new SugarDecorator(coffee);
console.log(`${coffee.description()}: ¥${coffee.cost()}`);
// 简单咖啡 + 牛奶 + 糖: ¥14
```

### 代理模式

```typescript
// 图片接口
interface Image {
  display(): void;
}

// 真实图片
class RealImage implements Image {
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;
    this.loadFromDisk();
  }

  private loadFromDisk() {
    console.log(`加载图片: ${this.filename}`);
  }

  display() {
    console.log(`显示图片: ${this.filename}`);
  }
}

// 代理图片（懒加载）
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

// 使用
const image = new ProxyImage('photo.jpg');
// 图片还没加载

image.display(); // 首次调用才加载
image.display(); // 使用缓存
```

## 行为型模式

### 观察者模式

```typescript
// 观察者接口
interface Observer {
  update(data: any): void;
}

// 主题接口
interface Subject {
  subscribe(observer: Observer): void;
  unsubscribe(observer: Observer): void;
  notify(data: any): void;
}

// 事件发射器实现
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

// 具体观察者
class Logger implements Observer {
  update(data: any) {
    console.log('日志记录:', data);
  }
}

class EmailNotifier implements Observer {
  update(data: any) {
    console.log('发送邮件通知:', data);
  }
}

// 使用
const emitter = new EventEmitter();
const logger = new Logger();
const emailer = new EmailNotifier();

emitter.subscribe(logger);
emitter.subscribe(emailer);

emitter.notify({ event: '用户注册', userId: 123 });
```

### 策略模式

```typescript
// 策略接口
interface PaymentStrategy {
  pay(amount: number): void;
}

// 具体策略
class CreditCardPayment implements PaymentStrategy {
  private cardNumber: string;

  constructor(cardNumber: string) {
    this.cardNumber = cardNumber;
  }

  pay(amount: number) {
    console.log(`信用卡支付 ¥${amount}，卡号: ${this.cardNumber}`);
  }
}

class AlipayPayment implements PaymentStrategy {
  private account: string;

  constructor(account: string) {
    this.account = account;
  }

  pay(amount: number) {
    console.log(`支付宝支付 ¥${amount}，账号: ${this.account}`);
  }
}

class WechatPayment implements PaymentStrategy {
  pay(amount: number) {
    console.log(`微信支付 ¥${amount}`);
  }
}

// 上下文
class PaymentContext {
  private strategy: PaymentStrategy;

  setStrategy(strategy: PaymentStrategy) {
    this.strategy = strategy;
  }

  executePayment(amount: number) {
    this.strategy.pay(amount);
  }
}

// 使用
const payment = new PaymentContext();

payment.setStrategy(new CreditCardPayment('1234-5678'));
payment.executePayment(100);

payment.setStrategy(new AlipayPayment('user@example.com'));
payment.executePayment(200);
```

### 命令模式

```typescript
// 命令接口
interface Command {
  execute(): void;
  undo(): void;
}

// 接收者
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

// 具体命令
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

// 调用者
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

// 使用
const editor = new TextEditor();
const manager = new CommandManager();

manager.execute(new WriteCommand(editor, 'Hello '));
manager.execute(new WriteCommand(editor, 'World'));
console.log(editor.getContent()); // Hello World

manager.undo();
console.log(editor.getContent()); // Hello
```

## 现代应用

### React 中的设计模式

```tsx
// 组合模式 - Compound Components
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

// 使用
<Tabs defaultTab="tab1">
  <Tabs.List>
    <Tabs.Tab value="tab1">标签 1</Tabs.Tab>
    <Tabs.Tab value="tab2">标签 2</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="tab1">内容 1</Tabs.Panel>
  <Tabs.Panel value="tab2">内容 2</Tabs.Panel>
</Tabs>
```

### 依赖注入

```typescript
// 依赖注入容器
class Container {
  private services = new Map<string, any>();

  register<T>(key: string, factory: () => T) {
    this.services.set(key, factory);
  }

  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`服务 ${key} 未注册`);
    }
    return factory();
  }
}

// 使用
const container = new Container();

container.register('database', () => new Database());
container.register('userService', () =>
  new UserService(container.resolve('database'))
);

const userService = container.resolve('userService');
```

## 最佳实践总结

```
设计模式选择指南：
┌─────────────────────────────────────────────────────┐
│   何时使用                                          │
│   ├── 代码重复出现相似问题                          │
│   ├── 需要提高代码灵活性                            │
│   ├── 团队需要统一设计语言                          │
│   └── 应对可预见的变化                              │
│                                                     │
│   避免过度设计                                      │
│   ├── 简单问题不需要复杂模式                        │
│   ├── 先让代码工作，再优化                          │
│   ├── 重构时引入模式                                │
│   └── 遵循 YAGNI 原则                               │
│                                                     │
│   常见组合                                          │
│   ├── 工厂 + 单例                                   │
│   ├── 策略 + 工厂                                   │
│   ├── 装饰器 + 组合                                 │
│   └── 观察者 + 命令                                 │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐模式 |
|------|----------|
| 全局状态管理 | 单例 |
| 对象创建变化 | 工厂 |
| 功能扩展 | 装饰器 |
| 事件处理 | 观察者 |
| 算法切换 | 策略 |

---

*设计模式不是银弹，而是工具箱中的工具。选择合适的模式，让代码更优雅。*
