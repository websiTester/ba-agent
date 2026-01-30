# Code Smells & Refactoring

> Apply when: reviewing code, refactoring, identifying technical debt

## What Are Code Smells?

Indicators that something MAY be wrong. Not bugs, but design problems that make code hard to understand, change, or test.

---

## Bloaters

Code that has grown too large.

### Long Methods (>10 lines)
```typescript
// SMELL: Method does too much
async function processOrder(order: Order) {
  // Validate order (5 lines)
  // Calculate totals (10 lines)
  // Apply discounts (8 lines)
  // Process payment (12 lines)
  // Send notifications (7 lines)
  // Update inventory (6 lines)
}

// REFACTOR: Extract methods
async function processOrder(order: Order) {
  validateOrder(order);
  const totals = calculateTotals(order);
  const finalAmount = applyDiscounts(totals, order.customer);
  await processPayment(finalAmount);
  await sendNotifications(order);
  await updateInventory(order.items);
}
```

### Large Classes (>50 lines)
```typescript
// SMELL: God class
class UserManager {
  createUser() { }
  deleteUser() { }
  updateUser() { }
  sendEmail() { }
  generateReport() { }
  validatePassword() { }
  handlePayment() { }
  // ... 20 more methods
}

// REFACTOR: Split by responsibility
class UserService { createUser(); deleteUser(); updateUser(); }
class EmailService { sendEmail(); }
class ReportService { generateReport(); }
class PaymentService { handlePayment(); }
```

### Long Parameter Lists (>3 params)
```typescript
// SMELL
function createUser(
  name: string,
  email: string,
  age: number,
  address: string,
  phone: string,
  role: string
) { }

// REFACTOR: Use parameter object
interface CreateUserParams {
  name: string;
  email: string;
  age: number;
  address?: string;
  phone?: string;
  role?: string;
}

function createUser(params: CreateUserParams) { }
```

### Primitive Obsession
```typescript
// SMELL: Using primitives for domain concepts
function sendEmail(to: string, subject: string) {
  if (!to.includes('@')) throw new Error('Invalid email');
  // ...
}

// REFACTOR: Use value objects
class Email {
  constructor(private value: string) {
    if (!value.includes('@')) throw new Error('Invalid email');
  }
  toString() { return this.value; }
}

function sendEmail(to: Email, subject: string) { }
```

---

## Object-Orientation Abusers

### Switch Statements
```typescript
// SMELL: Type checking with switch
function calculateArea(shape: Shape) {
  switch (shape.type) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'rectangle': return shape.width * shape.height;
    case 'triangle': return (shape.base * shape.height) / 2;
  }
}

// REFACTOR: Use polymorphism
interface Shape {
  calculateArea(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  calculateArea() { return Math.PI * this.radius ** 2; }
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  calculateArea() { return this.width * this.height; }
}
```

### Refused Bequest
```typescript
// SMELL: Subclass doesn't use inherited methods
class Bird {
  fly() { }
  eat() { }
}

class Penguin extends Bird {
  fly() { throw new Error("Can't fly"); } // Breaks LSP
}

// REFACTOR: Better abstraction
interface Bird { eat(): void; }
interface FlyingBird extends Bird { fly(): void; }

class Sparrow implements FlyingBird { fly() { } eat() { } }
class Penguin implements Bird { eat() { } swim() { } }
```

---

## Change Preventers

Code that makes changes risky.

### Divergent Change
```typescript
// SMELL: One class changes for many reasons
class Report {
  generatePDF() { }   // Changes when PDF format changes
  generateExcel() { } // Changes when Excel format changes
  calculateData() { } // Changes when business logic changes
}

// REFACTOR: Separate by reason to change
class ReportData { calculate() { } }
class PDFExporter { export(data: ReportData) { } }
class ExcelExporter { export(data: ReportData) { } }
```

### Shotgun Surgery
```typescript
// SMELL: One change requires editing many files
// Adding a new user field requires changes to:
// - User model
// - User form
// - User API
// - User validation
// - User display
// - Database migration

// REFACTOR: Encapsulate related code
// Use a single UserModule that handles all user-related changes
```

---

## Dispensables

Code that should be removed.

### Dead Code
```typescript
// SMELL: Unused code
function oldCalculation() { // Never called
  // ...
}

const UNUSED_CONSTANT = 42; // Never used

// REFACTOR: Delete it
// If you need it later, use version control
```

### Speculative Generality (YAGNI)
```typescript
// SMELL: Building for hypothetical future
class UserFactory {
  createUser(type: 'admin' | 'guest' | 'superadmin' | 'moderator') {
    // Only 'admin' and 'guest' are ever used
  }
}

// REFACTOR: Only build what's needed now
class UserFactory {
  createAdmin() { }
  createGuest() { }
}
```

### Comments Explaining Bad Code
```typescript
// SMELL: Comment compensating for unclear code
// This loops through users and filters active ones then maps to names
const x = u.filter(i => i.a).map(i => i.n);

// REFACTOR: Make code self-documenting
const activeUserNames = users
  .filter(user => user.isActive)
  .map(user => user.name);
```

---

## Couplers

### Feature Envy
```typescript
// SMELL: Method uses another class's data more than its own
class Order {
  calculateShipping() {
    return this.customer.address.country === 'US'
      ? this.customer.address.state === 'CA' ? 10 : 15
      : 30;
  }
}

// REFACTOR: Move method to where data lives
class Address {
  calculateShipping(): number {
    if (this.country !== 'US') return 30;
    return this.state === 'CA' ? 10 : 15;
  }
}
```

### Message Chains (Train Wreck)
```typescript
// SMELL: Long chain of method calls
const city = order.getCustomer().getAddress().getCity().getName();

// REFACTOR: Law of Demeter - ask, don't dig
const city = order.getDeliveryCity();
```

### Inappropriate Intimacy
```typescript
// SMELL: Classes know too much about each other's internals
class Order {
  process() {
    this.inventory.items[this.product.id].quantity -= this.quantity;
  }
}

// REFACTOR: Use public interfaces
class Order {
  process() {
    this.inventory.reduceStock(this.product.id, this.quantity);
  }
}
```

---

## Refactoring Guidelines

1. **Refactor in small steps** - Keep tests passing
2. **Commit frequently** - Easy to revert if needed
3. **One refactoring at a time** - Don't mix with features
4. **Rule of Three** - Refactor after third duplication

## Quick Smell Detection

| Smell | Question to Ask |
|-------|-----------------|
| Long Method | Can I describe it in one sentence? |
| Large Class | Does it have ONE responsibility? |
| Feature Envy | Should this method be somewhere else? |
| Primitive Obsession | Should this be a value object? |
| Dead Code | Is this actually used? |
| Comments | Can the code speak for itself? |
