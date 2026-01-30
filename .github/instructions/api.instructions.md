---
applyTo: "**/api/**/*.ts"
---

# API Route Guidelines

## Standard API Route Structure

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  // Define your schema
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate input (early return on failure)
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.message },
        { status: 400 }
      );
    }

    // 3. Process data
    const result = await processData(parsed.data);

    // 4. Return success response
    return Response.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Error Handling Pattern

```typescript
// Early returns for validation
async function processData(input: unknown) {
  if (!input) {
    return { error: 'Input is required' };
  }

  if (typeof input !== 'object') {
    return { error: 'Input must be an object' };
  }

  // Happy path last
  const result = await transform(input);
  return { data: result };
}
```

## Response Patterns

```typescript
// Success
return Response.json({ data: result });
return Response.json({ data: result }, { status: 201 });

// Client errors
return Response.json({ error: 'Invalid input' }, { status: 400 });
return Response.json({ error: 'Unauthorized' }, { status: 401 });
return Response.json({ error: 'Not found' }, { status: 404 });

// Server errors
return Response.json({ error: 'Internal server error' }, { status: 500 });
```

## Best Practices

- Always validate input with Zod schemas
- Use try-catch for all async operations
- Log errors with context for debugging
- Return consistent error response format
- Authenticate Server Actions inside each action
- Use `Promise.all()` for parallel operations
