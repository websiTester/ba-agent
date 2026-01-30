---
applyTo: "**/*.test.{ts,tsx},**/*.spec.{ts,tsx},**/__tests__/**"
---

# Testing Guidelines

## Test Structure (Arrange-Act-Assert)

```typescript
describe('MessageArea', () => {
  it('displays error message when API fails', () => {
    // Arrange
    const errorMessage = 'Failed to fetch';
    mockApi.mockRejectedValue(new Error(errorMessage));

    // Act
    render(<MessageArea />);

    // Assert
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
```

## Test Naming

```typescript
// BAD: Vague names
it('should work correctly');
it('handles the data');

// GOOD: Concrete, domain-specific
it('calculates 20% discount for premium users');
it('returns error when cart is empty');
it('renders loading skeleton while fetching messages');
```

## Test Hierarchy

1. **Unit Tests** - Fast, isolated, test single functions/components
2. **Integration Tests** - Multiple components working together
3. **E2E Tests** - Critical user journeys only

## Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isLoading is true', () => {
    render(<Button isLoading>Submit</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});
```

## API Testing

```typescript
describe('POST /api/agent/analysis', () => {
  it('returns 400 for invalid input', async () => {
    const response = await POST(
      new Request('http://localhost/api/agent/analysis', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' })
      })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
```

## Best Practices

- Test behavior, not implementation
- One assertion per test (when practical)
- Use descriptive test names
- Mock external dependencies
- Don't test framework code
