# Testing Strategy

> Apply when: writing tests, planning test coverage, implementing TDD

## Test-Driven Development (TDD)

### The Red-Green-Refactor Cycle

```
1. RED    → Write a failing test
2. GREEN  → Write minimal code to pass
3. REFACTOR → Clean up, remove duplication
4. REPEAT
```

### TDD Example

```typescript
// Step 1: RED - Write failing test
describe('calculateDiscount', () => {
  it('returns 20% discount for premium users', () => {
    const user = { isPremium: true };
    expect(calculateDiscount(user)).toBe(0.2);
  });
});

// Step 2: GREEN - Minimal implementation
function calculateDiscount(user: User): number {
  if (user.isPremium) return 0.2;
  return 0;
}

// Step 3: REFACTOR - Clean up if needed
// (In this case, code is already clean)

// Step 4: Add next test
it('returns 30% discount for VIP users', () => {
  const user = { isVIP: true };
  expect(calculateDiscount(user)).toBe(0.3);
});
```

### Three Laws of TDD

1. No production code without a failing test
2. Write only enough test to fail
3. Write only enough code to pass

## Test Structure: Arrange-Act-Assert (AAA)

```typescript
describe('UserService', () => {
  it('creates user with hashed password', async () => {
    // Arrange - Set up test data and mocks
    const userData = { email: 'test@example.com', password: 'secret123' };
    const mockHash = jest.fn().mockResolvedValue('hashed_password');

    // Act - Execute the code under test
    const user = await createUser(userData, { hashFn: mockHash });

    // Assert - Verify the results
    expect(user.email).toBe('test@example.com');
    expect(user.password).toBe('hashed_password');
    expect(mockHash).toHaveBeenCalledWith('secret123');
  });
});
```

## Test Naming

```typescript
// BAD: Vague names
it('should work');
it('handles data correctly');
it('test user');

// GOOD: Concrete, behavior-focused
it('returns empty array when no users match filter');
it('throws ValidationError when email is invalid');
it('calculates 20% discount for orders over $100');
it('renders loading skeleton while fetching data');
```

### Naming Pattern
```
[action] + [condition/context] + [expected result]
```

## Test Hierarchy

```
         /\
        /  \  E2E Tests (few)
       /----\  - Critical user journeys
      /      \  - Slow, fragile
     /--------\  Integration Tests (some)
    /          \  - Component interactions
   /            \  - Database, API calls
  /--------------\  Unit Tests (many)
 /                \  - Fast, isolated
/                  \  - Single function/component
```

## Unit Tests

```typescript
// Test pure functions without mocking
describe('formatPrice', () => {
  it('formats number as USD currency', () => {
    expect(formatPrice(1234.56)).toBe('$1,234.56');
  });

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatPrice(10.999)).toBe('$11.00');
  });
});
```

## Integration Tests

```typescript
// Test multiple units working together
describe('CheckoutFlow', () => {
  it('completes purchase with valid cart', async () => {
    // Arrange
    const cart = await createTestCart([
      { productId: '1', quantity: 2 },
      { productId: '2', quantity: 1 },
    ]);

    // Act
    const result = await checkout(cart, testPaymentMethod);

    // Assert
    expect(result.status).toBe('completed');
    expect(result.order.items).toHaveLength(2);
    expect(await getInventory('1')).toBe(98); // Stock reduced
  });
});
```

## Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('MessageInput', () => {
  it('calls onSend with message when form submitted', () => {
    // Arrange
    const onSend = jest.fn();
    render(<MessageInput onSend={onSend} />);

    // Act
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(screen.getByRole('form'));

    // Assert
    expect(onSend).toHaveBeenCalledWith('Hello');
    expect(input).toHaveValue(''); // Cleared after send
  });

  it('disables send button when input is empty', () => {
    render(<MessageInput onSend={jest.fn()} />);

    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();
  });
});
```

## Test Doubles

| Type | Purpose | Example |
|------|---------|---------|
| **Dummy** | Fill parameters, not used | `null`, `{}` |
| **Stub** | Return predetermined values | `mockFn.mockReturnValue(42)` |
| **Spy** | Track calls | `jest.spyOn(obj, 'method')` |
| **Mock** | Verify interactions | `expect(mock).toHaveBeenCalledWith(...)` |
| **Fake** | Working implementation | In-memory database |

```typescript
// Stub
const getUser = jest.fn().mockResolvedValue({ id: '1', name: 'Test' });

// Spy
const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
// ... test ...
expect(consoleSpy).toHaveBeenCalled();

// Fake
class FakeUserRepository implements UserRepository {
  private users = new Map<string, User>();

  async save(user: User) { this.users.set(user.id, user); }
  async findById(id: string) { return this.users.get(id) || null; }
}
```

## Test Coverage Guidelines

### What to Test
- Business logic and calculations
- State transitions
- Edge cases and error conditions
- User interactions
- API contracts

### What NOT to Test
- Framework code (React, Next.js)
- Third-party libraries
- Simple getters/setters
- Implementation details

## Quick Checklist

- [ ] Does each test follow AAA pattern?
- [ ] Are test names concrete and descriptive?
- [ ] Is each test independent (no shared state)?
- [ ] Are tests testing behavior, not implementation?
- [ ] Is the test pyramid balanced (many unit, few E2E)?
- [ ] Are edge cases covered?
