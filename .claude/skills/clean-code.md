# Clean Code Practices

> Apply when: writing any code, naming variables/functions/classes, structuring files

## Naming Conventions

### Directory & File Names
```typescript
// Directories: kebab-case
components/auth-wizard/
hooks/use-sidebar-state/
utils/json-parser/

// Component files: PascalCase
MessageArea.tsx
ChatPanel.tsx
UserSection.tsx

// Utility files: kebab-case
json-parser.ts
format-date.ts
```

### Variables & Functions
```typescript
// Use descriptive names with auxiliary verbs
const isLoading = true;
const hasError = false;
const canSubmit = form.isValid;
const shouldRefetch = isStale && isOnline;

// Avoid vague names
// BAD
const data = fetchData();
const info = getUserInfo();
const temp = calculate();

// GOOD
const userProfile = fetchUserProfile();
const accountSettings = getAccountSettings();
const discountedPrice = calculateDiscount(price, percentage);
```

### Constants
```typescript
// SCREAMING_SNAKE_CASE for true constants
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = '/api';
const DEFAULT_PAGE_SIZE = 20;
```

### Types & Interfaces
```typescript
// PascalCase with descriptive names
interface UserResponse { }
interface ChatMessage { }
type MessageStatus = 'pending' | 'sent' | 'failed';
type ApiResult<T> = { data: T } | { error: string };
```

## Object Calisthenics Rules

### 1. One Indentation Level Per Method
```typescript
// BAD: Multiple indentation levels
function processItems(items: Item[]) {
  for (const item of items) {
    if (item.isValid) {
      if (item.price > 0) {
        // deep nesting
      }
    }
  }
}

// GOOD: Extract methods
function processItems(items: Item[]) {
  items.filter(isValidItem).forEach(processValidItem);
}

function isValidItem(item: Item): boolean {
  return item.isValid && item.price > 0;
}

function processValidItem(item: Item) {
  // single level
}
```

### 2. No ELSE Statements - Use Early Returns
```typescript
// BAD: Using else
function getDiscount(user: User): number {
  if (user.isPremium) {
    return 0.2;
  } else if (user.isVIP) {
    return 0.3;
  } else {
    return 0;
  }
}

// GOOD: Early returns
function getDiscount(user: User): number {
  if (user.isVIP) return 0.3;
  if (user.isPremium) return 0.2;
  return 0;
}
```

### 3. Wrap Primitives in Domain Objects
```typescript
// BAD: Primitive obsession
function createUser(email: string, age: number) { }

// GOOD: Value objects
class Email {
  constructor(private value: string) {
    if (!this.isValid(value)) throw new Error('Invalid email');
  }
  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  toString() { return this.value; }
}

class Age {
  constructor(private value: number) {
    if (value < 0 || value > 150) throw new Error('Invalid age');
  }
  get years() { return this.value; }
}

function createUser(email: Email, age: Age) { }
```

### 4. One Dot Per Line (Law of Demeter)
```typescript
// BAD: Train wreck
const city = order.getCustomer().getAddress().getCity();

// GOOD: Ask, don't tell
const city = order.getDeliveryCity();
```

### 5. Size Limits
- **Classes**: Under 50 lines
- **Methods**: Under 10 lines
- **Files**: Under 150 lines
- **Parameters**: Maximum 3 (use object for more)

```typescript
// BAD: Too many parameters
function createUser(
  name: string,
  email: string,
  age: number,
  address: string,
  phone: string
) { }

// GOOD: Use object
interface CreateUserParams {
  name: string;
  email: string;
  age: number;
  address?: string;
  phone?: string;
}

function createUser(params: CreateUserParams) { }
```

## Comments

```typescript
// BAD: Commenting WHAT (redundant)
// Loop through users
for (const user of users) { }

// BAD: Commenting HOW (obvious)
// Increment counter by 1
counter++;

// GOOD: Commenting WHY (valuable)
// Use binary search because the list is always sorted and can have 10k+ items
const index = binarySearch(sortedUsers, targetId);

// GOOD: Explaining business logic
// Premium discount stacks with seasonal discount per marketing team decision (Q4 2024)
const totalDiscount = premiumDiscount + seasonalDiscount;
```

## Quick Reference

| Rule | Limit |
|------|-------|
| Method lines | < 10 |
| Class lines | < 50 |
| File lines | < 150 |
| Parameters | <= 3 |
| Indentation levels | 1 |
| Instance variables | <= 2 |
