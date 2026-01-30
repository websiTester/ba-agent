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
