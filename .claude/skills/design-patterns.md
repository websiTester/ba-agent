# Design Patterns

> Apply when: solving recurring design problems, refactoring, improving architecture
> Warning: "Let patterns emerge from refactoring, don't force them upfront."

## When to Apply Patterns

Before adopting a pattern, verify:
- [ ] You've encountered this problem before
- [ ] The pattern genuinely fits your scenario
- [ ] It reduces complexity, not increases it
- [ ] Your team understands the approach

---

## Creational Patterns

### Factory
Abstracts object creation when construction logic is complex.

```typescript
// Problem: Complex object creation scattered everywhere
const user = new User();
user.setRole('admin');
user.setPermissions(['read', 'write', 'delete']);
user.setDepartment('engineering');

// Solution: Factory encapsulates creation
class UserFactory {
  static createAdmin(): User {
    return new User({
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
      department: 'engineering'
    });
  }

  static createGuest(): User {
    return new User({
      role: 'guest',
      permissions: ['read']
    });
  }
}

const admin = UserFactory.createAdmin();
const guest = UserFactory.createGuest();
```

### Builder
Step-by-step construction of complex objects.

```typescript
// Problem: Constructor with many optional parameters
new Query(table, columns, where, orderBy, limit, offset, joins, groupBy);

// Solution: Builder pattern
class QueryBuilder {
  private query: Partial<Query> = {};

  select(...columns: string[]) {
    this.query.columns = columns;
    return this;
  }

  from(table: string) {
    this.query.table = table;
    return this;
  }

  where(condition: string) {
    this.query.where = condition;
    return this;
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'asc') {
    this.query.orderBy = { column, direction };
    return this;
  }

  limit(count: number) {
    this.query.limit = count;
    return this;
  }

  build(): Query {
    return new Query(this.query);
  }
}

// Usage: Readable and flexible
const query = new QueryBuilder()
  .select('id', 'name', 'email')
  .from('users')
  .where('active = true')
  .orderBy('name')
  .limit(10)
  .build();
```

### Singleton (Use Sparingly)
Single instance shared across application.

```typescript
// Better approach: Use module scope
// config.ts
const config = {
  apiUrl: process.env.API_URL,
  debug: process.env.NODE_ENV === 'development'
};

export default config;

// Or use dependency injection instead of Singleton
```

---

## Structural Patterns

### Adapter
Makes incompatible interfaces work together.

```typescript
// Problem: Different payment providers with different APIs
interface PaymentProvider {
  charge(amount: number): Promise<PaymentResult>;
}

// Stripe has different interface
class StripeAdapter implements PaymentProvider {
  constructor(private stripe: StripeClient) {}

  async charge(amount: number): Promise<PaymentResult> {
    const result = await this.stripe.paymentIntents.create({
      amount: amount * 100, // Stripe uses cents
      currency: 'usd'
    });
    return { success: result.status === 'succeeded', id: result.id };
  }
}

// PayPal has different interface
class PayPalAdapter implements PaymentProvider {
  constructor(private paypal: PayPalClient) {}

  async charge(amount: number): Promise<PaymentResult> {
    const result = await this.paypal.createOrder({ value: amount.toString() });
    return { success: result.status === 'COMPLETED', id: result.id };
  }
}

// Usage: Same interface for all providers
class PaymentService {
  constructor(private provider: PaymentProvider) {}

  async processPayment(amount: number) {
    return this.provider.charge(amount);
  }
}
```

### Decorator
Add functionality without modifying original.

```typescript
// Problem: Adding logging, caching, auth to services
interface DataService {
  fetch(id: string): Promise<Data>;
}

// Base implementation
class ApiDataService implements DataService {
  async fetch(id: string) {
    return api.get(`/data/${id}`);
  }
}

// Decorator: Adds caching
class CachedDataService implements DataService {
  private cache = new Map<string, Data>();

  constructor(private wrapped: DataService) {}

  async fetch(id: string) {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }
    const data = await this.wrapped.fetch(id);
    this.cache.set(id, data);
    return data;
  }
}

// Decorator: Adds logging
class LoggedDataService implements DataService {
  constructor(private wrapped: DataService) {}

  async fetch(id: string) {
    console.log(`Fetching: ${id}`);
    const data = await this.wrapped.fetch(id);
    console.log(`Fetched: ${id}`);
    return data;
  }
}

// Compose decorators
const service = new LoggedDataService(
  new CachedDataService(
    new ApiDataService()
  )
);
```

### Composite
Handle tree structures uniformly.

```typescript
// Problem: File system with files and folders
interface FileSystemNode {
  getName(): string;
  getSize(): number;
}

class File implements FileSystemNode {
  constructor(private name: string, private size: number) {}
  getName() { return this.name; }
  getSize() { return this.size; }
}

class Folder implements FileSystemNode {
  private children: FileSystemNode[] = [];

  constructor(private name: string) {}

  add(node: FileSystemNode) { this.children.push(node); }
  getName() { return this.name; }
  getSize() {
    return this.children.reduce((sum, child) => sum + child.getSize(), 0);
  }
}

// Usage: Treat files and folders uniformly
const root = new Folder('root');
root.add(new File('readme.txt', 100));
root.add(new Folder('src'));
console.log(root.getSize()); // Works for both
```

---

## Behavioral Patterns

### Strategy
Interchangeable algorithms at runtime.

```typescript
// Problem: Different sorting/filtering algorithms
interface SortStrategy<T> {
  sort(items: T[]): T[];
}

class AlphabeticalSort implements SortStrategy<User> {
  sort(users: User[]) {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }
}

class DateSort implements SortStrategy<User> {
  sort(users: User[]) {
    return [...users].sort((a, b) => b.createdAt - a.createdAt);
  }
}

class UserList {
  constructor(private sortStrategy: SortStrategy<User>) {}

  setSortStrategy(strategy: SortStrategy<User>) {
    this.sortStrategy = strategy;
  }

  display(users: User[]) {
    return this.sortStrategy.sort(users);
  }
}

// Usage: Swap algorithms at runtime
const list = new UserList(new AlphabeticalSort());
list.display(users);
list.setSortStrategy(new DateSort());
list.display(users);
```

### Observer
Notify dependents when state changes.

```typescript
// Problem: Multiple components need to react to state changes
type Listener<T> = (state: T) => void;

class Observable<T> {
  private listeners: Set<Listener<T>> = new Set();

  subscribe(listener: Listener<T>) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  protected notify(state: T) {
    this.listeners.forEach(listener => listener(state));
  }
}

class CartStore extends Observable<CartState> {
  private state: CartState = { items: [], total: 0 };

  addItem(item: CartItem) {
    this.state = {
      items: [...this.state.items, item],
      total: this.state.total + item.price
    };
    this.notify(this.state);
  }
}

// Usage
const cart = new CartStore();
const unsubscribe = cart.subscribe(state => {
  console.log('Cart updated:', state);
});
```

### Command
Encapsulate actions as objects.

```typescript
// Problem: Need undo/redo, action queuing
interface Command {
  execute(): void;
  undo(): void;
}

class AddTextCommand implements Command {
  constructor(
    private editor: Editor,
    private text: string,
    private position: number
  ) {}

  execute() {
    this.editor.insertAt(this.position, this.text);
  }

  undo() {
    this.editor.deleteAt(this.position, this.text.length);
  }
}

class CommandHistory {
  private history: Command[] = [];
  private current = -1;

  execute(command: Command) {
    command.execute();
    this.history = this.history.slice(0, this.current + 1);
    this.history.push(command);
    this.current++;
  }

  undo() {
    if (this.current >= 0) {
      this.history[this.current].undo();
      this.current--;
    }
  }

  redo() {
    if (this.current < this.history.length - 1) {
      this.current++;
      this.history[this.current].execute();
    }
  }
}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem |
|--------------|---------|
| God Class | One class does everything |
| Spaghetti Code | Tangled, hard to follow |
| Golden Hammer | Using same pattern everywhere |
| Premature Optimization | Optimizing without profiling |
| Copy-Paste Programming | Duplicating instead of abstracting |

## Quick Reference

| Pattern | Use When |
|---------|----------|
| Factory | Complex object creation |
| Builder | Many optional parameters |
| Adapter | Integrating external libraries |
| Decorator | Adding features dynamically |
| Strategy | Swappable algorithms |
| Observer | Event/notification systems |
| Command | Undo/redo, action queuing |
