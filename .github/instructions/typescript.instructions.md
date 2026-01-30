---
applyTo: "**/*.ts"
---

# TypeScript Guidelines

## Type Definitions

```typescript
// Prefer interfaces for objects
interface User {
  id: string;
  name: string;
  email: string;
}

// Use types for unions, intersections
type Status = 'pending' | 'active' | 'completed';
type Result<T> = { data: T } | { error: string };

// Use Zod for runtime validation + type inference
const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email()
});
type User = z.infer<typeof userSchema>;
```

## Function Patterns

```typescript
// Early returns for validation
function processUser(user: unknown): Result<User> {
  if (!user) {
    return { error: 'User is required' };
  }

  const parsed = userSchema.safeParse(user);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  return { data: parsed.data };
}

// Async functions with proper error handling
async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const response = await api.get(`/users/${id}`);
    return { data: response.data };
  } catch (error) {
    return { error: 'Failed to fetch user' };
  }
}
```

## Naming Conventions

```typescript
// Variables: camelCase with auxiliary verbs
const isLoading = true;
const hasError = false;
const canSubmit = true;

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = '/api';

// Functions: camelCase, verb-first
function calculateTotal() {}
function validateInput() {}
async function fetchMessages() {}
```

## Best Practices

- Use `unknown` instead of `any`
- Prefer `const` over `let`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Avoid type assertions (`as`) when possible
- Export types alongside their implementations
- Use discriminated unions for state machines

## Code Structure

```typescript
// Keep functions small (<10 lines)
// Use early returns
// No else statements

// BAD
function getStatus(user: User) {
  if (user.isActive) {
    if (user.isPremium) {
      return 'premium';
    } else {
      return 'active';
    }
  } else {
    return 'inactive';
  }
}

// GOOD
function getStatus(user: User) {
  if (!user.isActive) return 'inactive';
  if (user.isPremium) return 'premium';
  return 'active';
}
```
