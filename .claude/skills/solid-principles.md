# SOLID Principles

> Apply when: writing classes, modules, interfaces, refactoring code architecture

## Single Responsibility Principle (SRP)

"A class should have one, and only one, reason to change."

```typescript
// BAD: Multiple responsibilities
class UserService {
  createUser(data: UserData) { /* ... */ }
  sendEmail(user: User) { /* ... */ }
  generateReport(user: User) { /* ... */ }
}

// GOOD: Single responsibility each
class UserService {
  createUser(data: UserData) { /* ... */ }
}

class EmailService {
  sendEmail(to: string, content: string) { /* ... */ }
}

class ReportService {
  generateReport(data: ReportData) { /* ... */ }
}
```

## Open/Closed Principle (OCP)

"Open for extension, closed for modification."

```typescript
// BAD: Modifying existing code for new features
class PaymentProcessor {
  process(type: string, amount: number) {
    if (type === 'credit') { /* ... */ }
    else if (type === 'paypal') { /* ... */ }
    else if (type === 'crypto') { /* ... */ } // Adding new type = modifying
  }
}

// GOOD: Extend without modifying
interface PaymentMethod {
  process(amount: number): Promise<Result>;
}

class CreditCardPayment implements PaymentMethod {
  async process(amount: number) { /* ... */ }
}

class CryptoPayment implements PaymentMethod {
  async process(amount: number) { /* ... */ }
}

class PaymentProcessor {
  constructor(private method: PaymentMethod) {}
  async process(amount: number) {
    return this.method.process(amount);
  }
}
```

## Liskov Substitution Principle (LSP)

"Subtypes must be substitutable for their base types."

```typescript
// BAD: Violates LSP
class Rectangle {
  constructor(protected width: number, protected height: number) {}
  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
  getArea() { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(w: number) { this.width = this.height = w; } // Breaks expectation
  setHeight(h: number) { this.width = this.height = h; }
}

// GOOD: Proper abstraction
interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  getArea() { return this.width * this.height; }
}

class Square implements Shape {
  constructor(private side: number) {}
  getArea() { return this.side * this.side; }
}
```

## Interface Segregation Principle (ISP)

"Clients should not be forced to depend on methods they do not use."

```typescript
// BAD: Fat interface
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  code(): void;
  manage(): void;
}

// GOOD: Segregated interfaces
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Codeable {
  code(): void;
}

interface Manageable {
  manage(): void;
}

class Developer implements Workable, Eatable, Codeable {
  work() { /* ... */ }
  eat() { /* ... */ }
  code() { /* ... */ }
}

class Manager implements Workable, Eatable, Manageable {
  work() { /* ... */ }
  eat() { /* ... */ }
  manage() { /* ... */ }
}
```

## Dependency Inversion Principle (DIP)

"Depend on abstractions, not concrete implementations."

```typescript
// BAD: High-level depends on low-level
class UserController {
  private database = new MongoDatabase(); // Direct dependency

  async getUser(id: string) {
    return this.database.findById(id);
  }
}

// GOOD: Depend on abstraction
interface Database {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

class UserController {
  constructor(private database: Database) {} // Injected abstraction

  async getUser(id: string) {
    return this.database.findById(id);
  }
}

// Can swap implementations
const controller = new UserController(new MongoDatabase());
const testController = new UserController(new MockDatabase());
```

## Quick Checklist

- [ ] Does each class have only ONE reason to change? (SRP)
- [ ] Can I add features without modifying existing code? (OCP)
- [ ] Can I substitute subtypes without breaking behavior? (LSP)
- [ ] Are interfaces small and focused? (ISP)
- [ ] Do high-level modules depend on abstractions? (DIP)
