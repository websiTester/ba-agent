---
applyTo: "**/*.tsx"
---

# React/Next.js Guidelines

## Server vs Client Components

```typescript
// Server Component (default) - NO 'use client'
async function ServerComponent() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// Client Component - Only when needed
'use client';
function ClientComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState(...)}>Click</button>;
}
```

## Performance Rules

### Eliminate Waterfalls
```typescript
// BAD
const user = await getUser();
const posts = await getPosts(user.id);

// GOOD
const [user, posts] = await Promise.all([getUser(), getPosts()]);
```

### Avoid Barrel Files
```typescript
// BAD
import { Icon1, Icon2 } from 'lucide-react';

// GOOD - Direct imports
import { Icon1 } from 'lucide-react/dist/esm/icons/icon1';
```

### Dynamic Imports
```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
});
```

## State Management (Zustand)

```typescript
// Use selectors to prevent re-renders
const messages = useStore(state => state.messages);
const isLoading = useStore(state => state.isLoading);
```

## Re-render Optimization

- Calculate derived state during rendering, not in useEffect
- Use `useTransition` for non-urgent updates
- Use `useRef` for values that shouldn't trigger renders
- Avoid `useMemo` for primitives

## Component Rules

- Keep page.tsx as Server Components
- Minimize 'use client' directives
- Co-locate hooks, utils, types with components
- Prefer named exports
