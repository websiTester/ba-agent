# BA-Agent - GitHub Copilot Instructions

> These instructions apply to all code in this repository.

## Project Overview

- **Project**: BA-Agent - Business Analysis Agent Application
- **Tech Stack**: Next.js 15, React 19, TypeScript 5, Zustand, Tailwind CSS, Mastra AI SDK
- **Architecture**: Next.js App Router with Server Components

## Project Structure

```
app/
├── api/           # API Routes (Next.js App Router)
├── components/    # React Components (feature-based)
├── db/            # Database operations (MongoDB)
├── mastra/        # Mastra AI Agents & Tools
├── models/        # Data models & Zod schemas
├── utils/         # Shared utilities
└── store.ts       # Zustand store
```

## Core Principles

### SOLID
- **SRP**: One reason to change per module
- **OCP**: Open for extension, closed for modification
- **LSP**: Subtypes substitutable for base types
- **ISP**: Small, focused interfaces
- **DIP**: Depend on abstractions

### Clean Code
- Functions under 10 lines
- Files under 150 lines
- Early returns, no else statements
- Descriptive names with auxiliary verbs (isLoading, hasError)

### Naming Conventions
- Directories: `kebab-case`
- Components: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`

## Quick Rules

- Prefer Server Components, use `'use client'` only when needed
- Use `Promise.all()` for parallel fetching
- Prefer named exports over default exports
- Validate at beginning, happy path last
- Use Zod for schema validation
- Handle errors with try-catch in API routes

## Git Conventions

```
feat: add new feature
fix: bug fix
refactor: code refactoring
docs: documentation
test: add tests
```

---

## 🧹 Dead Code Cleaner - Auto-Trigger Mode

### When to Activate

**AUTOMATICALLY** scan for and suggest dead code removal when:
- User mentions: "cleanup", "clean up", "clean code"
- User asks about: "unused", "dead code", "remove obsolete"
- During refactoring: "refactor", "remove legacy", "optimize codebase"
- After features removed or dependencies updated
- Before major releases or sprint completions

### Detection Strategy for TypeScript/React

#### 1. Unused Imports
```bash
# Find unused imports in TypeScript files
rg "import.*from" --type ts --type tsx | \
  while read import; do
    # Extract imported names and check usage
    echo "$import" | grep -oP "(?<=import\s).*(?=\sfrom)" | \
      xargs -I {} rg "\b{}\b" --count
  done
```

#### 2. Unused Components
- Search for component definitions not referenced in any file
- Check: `export (const|function|class) ComponentName`
- Verify no imports: `import.*ComponentName`

#### 3. Unused API Routes
- Check `app/api/**/*.ts` routes not called by any component
- Search for fetch/axios calls to endpoint paths

#### 4. Unused Utilities
- Functions in `app/utils/` not imported anywhere
- Check `export (const|function)` with no matching imports

#### 5. Unused Types/Interfaces
- TypeScript types/interfaces with zero references
- Search: `(type|interface) TypeName` then verify no usages

#### 6. Unused MongoDB Collections/Operations
- Database operations in `app/db/` not called
- Collection names in MongoDB not referenced in code

### Verification Protocol

**Before suggesting ANY removal:**

1. **Multi-pattern search**:
   ```bash
   # For element "ExampleComponent"
   rg "\bExampleComponent\b" --type ts --type tsx
   rg "['\"\\`]ExampleComponent['\"\\`]"
   rg "ExampleComponent" app/
   ```

2. **Check test files**:
   ```bash
   find . -name "*.test.ts" -o -name "*.test.tsx" | xargs rg "ElementName"
   ```

3. **Check dynamic references**:
   ```bash
   # String-based imports, lazy loading
   rg "import\(|require\(|dynamic\(" --type ts --type tsx
   ```

4. **Check configuration**:
   ```bash
   # Check package.json, tsconfig, next.config, etc.
   rg "ElementName" *.json *.js *.config.*
   ```

### Safe Removal Checklist

Generate report in this format:

```markdown
## 🗑️ Dead Code Analysis - Frontend

### Summary
- **Unused imports**: X found
- **Unused components**: X found
- **Unused utilities**: X found
- **Unused types**: X found
- **Estimated cleanup**: X% LOC reduction

### High Confidence Removals

#### Unused Components (X)
1. **`ComponentName`** in `app/components/path/file.tsx:123`
   - Size: X lines
   - Last modified: DATE
   - Verification: ✅ No imports found in codebase
   - Risk: LOW

#### Unused Utilities (X)
1. **`functionName`** in `app/utils/file.ts:45`
   - Size: X lines
   - Verification: ✅ No calls found in codebase
   - Risk: LOW

### Recommended Actions
- [ ] Review list above
- [ ] Remove unused imports (safe - TypeScript will catch errors)
- [ ] Remove unused components (verify in running app first)
- [ ] Remove unused utilities (run tests after)

### Safety Notes
- All items verified with multi-pattern search
- No references found in code, tests, or configs
- Recommend running `npm run build && npm run lint` after removal
```

### Execution Guidelines

1. **Always ask for approval** before removing code
2. **Remove one category at a time** (imports → components → utils)
3. **Run verification after each removal**: `npm run build && npm run lint`
4. **Never remove**:
   - Files in `node_modules/`
   - Configuration files (`.env`, `tsconfig.json`, `next.config.js`)
   - Build outputs (`dist/`, `.next/`)
   - Documentation (`README.md`, `CLAUDE.md`)
   - Test fixtures or example data (unless explicitly unused)

### Integration with Development Flow

**During Code Review**: Suggest unused code removal in PR comments
**During Refactoring**: Proactively scan affected modules
**Before Commits**: Quick scan of changed files for unused imports
**After Dependency Updates**: Check for unused package imports

### TypeScript-Specific Patterns

#### Find Unused Exports
```typescript
// Use TypeScript compiler API or simple regex
rg "^export (const|function|class|interface|type)" --type ts | \
  grep -v "export default"
```

#### Find Unused Props
```typescript
// Component props defined but never used
// Pattern: props.X never referenced in component body
```

#### Find Unused Hooks
```typescript
// Custom hooks in app/hooks/ or components/*/hooks/
// Not imported or called
```

### React/Next.js Specific Rules

- **Server Components**: Check if any component still uses `'use client'` unnecessarily
- **API Routes**: Unused routes in `app/api/` not called by frontend
- **Middleware**: Unused middleware functions
- **Metadata exports**: Unused `metadata` or `generateMetadata` exports

---

**Note**: This dead code cleaner runs in advisory mode only. Always present findings to the developer for approval before making changes.
