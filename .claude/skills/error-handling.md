# Error Handling Patterns

> Apply when: writing functions, API routes, async operations, form validation

## Core Pattern: Early Returns

```typescript
// BAD: Nested conditions
async function processOrder(order: Order | null) {
  if (order) {
    if (order.items.length > 0) {
      if (order.status === 'pending') {
        // Process order - deeply nested
        return { success: true };
      } else {
        return { error: 'Order already processed' };
      }
    } else {
      return { error: 'Order has no items' };
    }
  } else {
    return { error: 'Order not found' };
  }
}

// GOOD: Early returns, flat structure
async function processOrder(order: Order | null) {
  if (!order) {
    return { error: 'Order not found' };
  }

  if (order.items.length === 0) {
    return { error: 'Order has no items' };
  }

  if (order.status !== 'pending') {
    return { error: 'Order already processed' };
  }

  // Happy path - no nesting
  return { success: true };
}
```

## Result Type Pattern

```typescript
// Define result types
type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

// Use in functions
async function getUser(id: string): Promise<Result<User>> {
  if (!id) {
    return { success: false, error: 'ID is required' };
  }

  const user = await db.user.findUnique({ where: { id } });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  return { success: true, data: user };
}

// Usage
const result = await getUser(id);
if (!result.success) {
  console.error(result.error);
  return;
}
const user = result.data; // TypeScript knows this is User
```

## API Route Error Handling

```typescript
// app/api/users/[id]/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json().catch(() => null);

    if (!body) {
      return Response.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // 2. Validate with Zod
    const parsed = UserSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 3. Business logic
    const user = await createUser(parsed.data);

    // 4. Success response
    return Response.json(user, { status: 201 });

  } catch (error) {
    // 5. Log error for debugging
    console.error('POST /api/users error:', error);

    // 6. Return generic error to client
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Async/Await Error Handling

```typescript
// Pattern 1: Try-catch with specific handling
async function fetchData() {
  try {
    const response = await fetch('/api/data');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      console.error('Network error:', error);
      return { error: 'Unable to connect' };
    }

    // Other errors
    console.error('Fetch error:', error);
    return { error: 'Failed to fetch data' };
  }
}

// Pattern 2: Wrapper function for cleaner code
async function safeAsync<T>(
  promise: Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error as Error];
  }
}

// Usage
const [user, error] = await safeAsync(getUser(id));
if (error) {
  return handleError(error);
}
// user is typed correctly
```

## React Error Boundaries

```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorMessage />}>
  <RiskyComponent />
</ErrorBoundary>
```

## Form Validation Errors

```typescript
// Hook for form error handling
function useFormErrors<T extends Record<string, unknown>>() {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const setError = (field: keyof T, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  };

  const clearError = (field: keyof T) => {
    setErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  const clearAll = () => setErrors({});

  return { errors, setError, clearError, clearAll };
}

// Usage
function MyForm() {
  const { errors, setError, clearAll } = useFormErrors<FormData>();

  const handleSubmit = async (data: FormData) => {
    clearAll();

    if (!data.email) {
      setError('email', 'Email is required');
      return;
    }

    // Submit...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      {errors.email && <span className="error">{errors.email}</span>}
    </form>
  );
}
```

## Error Logging

```typescript
// Structured error logging
function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
) {
  const errorInfo = {
    context,
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...metadata,
  };

  console.error(JSON.stringify(errorInfo, null, 2));

  // Optional: Send to error tracking service
  // errorTracker.capture(errorInfo);
}

// Usage
try {
  await processPayment(order);
} catch (error) {
  logError('processPayment', error, { orderId: order.id });
}
```

## Quick Checklist

- [ ] Are errors handled at the beginning with early returns?
- [ ] Is the happy path at the end, not nested?
- [ ] Are API responses using proper HTTP status codes?
- [ ] Are errors logged with context for debugging?
- [ ] Are user-facing error messages generic (no sensitive info)?
- [ ] Are async operations wrapped in try-catch?
- [ ] Are React components wrapped in Error Boundaries?
