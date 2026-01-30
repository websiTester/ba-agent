# BA-Agent

> This file is automatically loaded by Claude Code.

## Project Overview

- **Project**: BA-Agent - Business Analysis Agent Application
- **Tech Stack**: Next.js 15, React 19, TypeScript 5, Zustand, Tailwind CSS, Mastra AI SDK
- **Architecture**: Next.js App Router with Server Components

## Project Structure

```
app/
├── api/                    # API Routes (Next.js App Router)
│   ├── agent/             # Agent-related endpoints
│   ├── files/             # File operations
│   └── [feature]/route.ts # Feature-specific routes
├── components/            # React Components
│   ├── [Feature]/         # Feature-specific components
│   │   ├── index.tsx      # Main component
│   │   ├── hooks/         # Feature hooks
│   │   ├── utils/         # Feature utilities
│   │   └── types.ts       # Feature types
├── db/                    # Database operations (MongoDB)
├── mastra/                # Mastra AI Agents
│   ├── agents/            # Agent definitions
│   └── tools/             # Agent tools
├── models/                # Data models & Zod schemas
├── utils/                 # Shared utilities
└── store.ts               # Zustand store
```

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
```

## Git Conventions

```bash
# Commit messages
feat: add new feature
fix: bug fix
refactor: code refactoring
docs: documentation
test: add tests

# Branch naming
feature/feature-name
fix/bug-description
refactor/refactor-description
```

## Skills Reference

Detailed guidelines are in `.claude/skills/`:

| Skill | When to Apply |
|-------|---------------|
| `solid-principles.md` | Writing classes, modules, interfaces, architecture |
| `clean-code.md` | Naming, code structure, file organization |
| `react-nextjs.md` | React components, Next.js pages, data fetching, state |
| `error-handling.md` | Functions, API routes, async operations, validation |
| `testing.md` | Writing tests, TDD, test coverage |
| `code-smells.md` | Code review, refactoring, technical debt |
| `design-patterns.md` | Solving design problems, architecture decisions |

## Quick Rules

- **Prefer Server Components** - Use `'use client'` only when needed
- **Early returns** - Validate at beginning, happy path last
- **Small functions** - Under 10 lines
- **Small files** - Under 150 lines
- **Named exports** - Prefer over default exports
- **Parallel fetching** - Use `Promise.all()` when possible
