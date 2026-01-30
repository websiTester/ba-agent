# React & Next.js Best Practices

> Apply when: writing React components, Next.js pages/routes, data fetching, state management

## Server vs Client Components

```typescript
// Server Component (default) - NO 'use client' directive
// Use for: data fetching, accessing backend, SEO content
async function ServerComponent() {
  const data = await db.query('SELECT * FROM users');
  return <UserList users={data} />;
}

// Client Component - ONLY when needed
// Use for: interactivity, browser APIs, state, effects
'use client';
function ClientComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Minimize 'use client'
```typescript
// BAD: Entire page is client
'use client';
export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Header /> {/* Could be server */}
      <MainContent /> {/* Could be server */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

// GOOD: Only interactive parts are client
export default function Page() {
  return (
    <div>
      <Header />
      <MainContent />
      <ModalWrapper /> {/* Only this is 'use client' */}
    </div>
  );
}
```

## Critical: Eliminate Waterfalls

### Parallel Data Fetching
```typescript
// BAD: Sequential (waterfall)
async function Page() {
  const user = await getUser();
  const posts = await getPosts(user.id);
  const comments = await getComments(posts[0].id);
  // Total time: user + posts + comments
}

// GOOD: Parallel when possible
async function Page() {
  const [user, settings] = await Promise.all([
    getUser(),
    getSettings()
  ]);
  // Total time: max(user, settings)
}

// GOOD: Start promises early, await later
async function Page() {
  const userPromise = getUser();
  const settingsPromise = getSettings();

  // Do other sync work here

  const user = await userPromise;
  const settings = await settingsPromise;
}
```

### Suspense for Streaming
```typescript
// Stream data as it becomes available
export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts />
      </Suspense>
    </div>
  );
}
```

## Bundle Size Optimization

### Avoid Barrel Files
```typescript
// BAD: Imports entire library (200-800ms)
import { Search, Menu, User } from 'lucide-react';

// GOOD: Direct imports (40% faster cold starts)
import Search from 'lucide-react/dist/esm/icons/search';
import Menu from 'lucide-react/dist/esm/icons/menu';
import User from 'lucide-react/dist/esm/icons/user';
```

### Dynamic Imports for Heavy Components
```typescript
import dynamic from 'next/dynamic';

// Load heavy components only when needed
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  loading: () => <EditorSkeleton />,
  ssr: false
});

const MermaidChart = dynamic(() => import('./MermaidChart'), {
  loading: () => <ChartSkeleton />
});
```

### Defer Non-Critical Scripts
```typescript
// Load analytics after hydration
useEffect(() => {
  import('analytics').then(({ init }) => init());
}, []);

// Or use next/script
<Script src="https://analytics.com/script.js" strategy="lazyOnload" />
```

## Re-render Optimization

### Calculate Derived State During Render
```typescript
// BAD: Unnecessary state
function Component({ items }) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    setTotal(items.reduce((sum, i) => sum + i.price, 0));
  }, [items]);
}

// GOOD: Calculate during render
function Component({ items }) {
  const total = items.reduce((sum, i) => sum + i.price, 0);
}
```

### useTransition for Non-Urgent Updates
```typescript
function SearchResults({ query }) {
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState([]);

  function handleSearch(newQuery: string) {
    // Urgent: update input immediately
    setQuery(newQuery);

    // Non-urgent: can be interrupted
    startTransition(() => {
      setResults(filterResults(newQuery));
    });
  }

  return (
    <div>
      <input onChange={e => handleSearch(e.target.value)} />
      {isPending ? <Spinner /> : <ResultsList results={results} />}
    </div>
  );
}
```

### useRef for Non-Rendering Values
```typescript
function Component() {
  // Values that shouldn't trigger re-render
  const renderCount = useRef(0);
  const previousValue = useRef(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    renderCount.current++;
  });
}
```

### Memoization (Use Sparingly)
```typescript
// Only memoize expensive computations
const expensiveValue = useMemo(() => {
  return data.filter(complexFilter).map(complexTransform);
}, [data]);

// Don't memoize simple operations
// BAD
const doubled = useMemo(() => count * 2, [count]);
// GOOD
const doubled = count * 2;
```

## State Management (Zustand)

```typescript
// Keep stores small and focused
interface ChatStore {
  messages: Message[];
  isLoading: boolean;
  addMessage: (msg: Message) => void;
}

const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg]
  })),
}));

// Use selectors to prevent re-renders
function MessageCount() {
  // Only re-renders when messages.length changes
  const count = useChatStore((state) => state.messages.length);
  return <span>{count}</span>;
}
```

## API Routes Best Practices

```typescript
// app/api/users/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'ID required' }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id } });

  if (!user) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(user);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await db.user.create({ data: body });
    return Response.json(user, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'Create failed' }, { status: 500 });
  }
}
```

## Quick Checklist

- [ ] Is this component Server or Client? Choose wisely
- [ ] Can data be fetched in parallel?
- [ ] Are heavy components dynamically imported?
- [ ] Am I avoiding barrel file imports?
- [ ] Is derived state calculated during render?
- [ ] Are Zustand selectors specific enough?
