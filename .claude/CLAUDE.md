# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BA-Agent is a Business Analysis AI Assistant that helps organizations gather, analyze, and document requirements through a phase-based AI-powered workflow.

- **Tech Stack**: Next.js 16, React 19, TypeScript 5, Zustand, Tailwind CSS, MongoDB
- **Architecture**: Next.js App Router with Server Components + external FastAPI backend
- **Key Dependencies**: TipTap (rich text editor), AG Grid (tables), Mammoth (DOCX parsing), Mermaid (diagrams)

## Common Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (uses standalone output for Docker)
npm start            # Run production build
npm run lint         # Run ESLint

# Docker deployment (multi-stage build)
docker build -t ba-agent-frontend .
docker run -p 3000:3000 ba-agent-frontend
```

## Architecture Overview

### 1. Phase-Based Workflow

The application operates in 4 sequential business analysis phases:

```
discovery → analysis → documentation → communication
```

Each phase maintains isolated state (messages, files, AI responses) stored per-phase in MongoDB and managed via Zustand. Phase configuration is in the codebase as `phaseConfig`.

### 2. AI Agent System

**Flow**: User Input → API Route (`/api/agent/ui-analyze`) → External FastAPI Backend → Response Processing → UI Rendering

**Key patterns**:
- Agent calls are proxied through Next.js API routes to external Python FastAPI backend
- Each phase uses a `threadId` (based on phaseId) to maintain conversation context
- Agents can use selected "tools" (context-aware prompts appended to messages)
- Responses are structured (markdown, CSV, PlantUML) and parsed by specific renderers
- Multi-agent responses are merged using `mergeData()` utility

**Critical files**:
- `app/api/agent/ui-analyze/route.ts` - Main agent API endpoint (5min timeout)
- `app/components/Sidebar/hooks/useSidebarApi.ts` - Agent call orchestration
- `app/models/agent.ts` - Agent model (name, instructions, LLM model)
- `app/db/agents.ts` - Agent CRUD operations

### 3. File Processing & RAG

**Supported file types**: `.txt`, `.docx`, `.doc`

**Upload flow**:
1. File uploaded via `/api/files` POST (stored as base64 in MongoDB)
2. Text extracted using `mammoth` (DOCX) or direct UTF-8 conversion (TXT)
3. Sent to external RAG API (`/rag/chunk_and_embedding`) for chunking and vector embedding
4. "Mention" entry created for @file references in chat

**Critical files**:
- `app/api/files/route.ts` - File upload/delete/list endpoints
- `app/utils/extractTextContent.ts` - Text extraction logic
- `app/db/files.ts` - File storage operations
- `app/models/file-document.ts` - File model schema

### 4. Database (MongoDB)

**Collections**:
- `agents` - Agent configurations (instructions, model selection)
- `files` - Uploaded documents (stored as base64)
- `templates` - Output format templates (header-content pairs)
- `mentions` - @file and @tool references for autocomplete
- `tools` - Tool definitions (label, description, toolPrompt)
- `account` - User accounts (email, password, role)

**Connection**: Uses singleton pattern in `app/db/mongodb.ts` with two databases (`MONGODB_DATABASE`, `MONGODB_DATABASE2`)

### 5. State Management (Zustand)

Global state in `app/store.ts`:

```typescript
interface AppState {
  activePhase: PhaseId;              // current phase (discovery/analysis/etc)
  isAgentProcessing: boolean;        // agent running state
  showToolListModal: boolean;        // tool selection dialog
  templateId: string;                // selected output template
  initialContextData: Record<...>;   // phase context data
  selectedActionItem: {...};         // action menu selection
}
```

**Pattern**: Component-level state for UI interactions (file uploads, modals), global Zustand for cross-component coordination

### 6. Component Organization

```
app/page.tsx (main orchestrator)
├── Sidebar
│   ├── PhaseSelector - Switch between 4 phases
│   ├── FileUpload + KnowledgeBase - Upload documents
│   ├── ActiveTools - Select tools for agent context
│   └── RunAgentButton - Trigger agent processing
│
├── ChatPanel (main work area)
│   ├── MessageArea
│   │   └── AIResponseRenderer - Multi-tab agent responses (markdown/CSV/PlantUML)
│   └── InputAreaMention - Rich text editor with @mentions (TipTap-based)
│
└── FileManager - Document preview sidebar
```

**Feature organization**: Each feature has subfolder with `index.tsx`, `hooks/`, `utils/`, `types.ts`

### 7. API Routes

**Active routes**:
- `POST /api/agent/ui-analyze` - Main agent call (proxies to FastAPI backend)
- `GET /api/agents?agentName=X` - Fetch agent config
- `PUT /api/agents` - Update agent instructions/model
- `GET/POST/DELETE /api/files` - File operations
- `GET /api/responses?phaseId=X` - Fetch stored agent responses
- `GET /api/mentions` - List all mentions (files/tools)
- `POST /api/login` - User authentication
- `POST /api/register` - User registration

**Pattern**: Each route returns JSON with consistent error handling. Use `NextResponse` for responses.

## External Dependencies

### FastAPI Backend (Python)

BA-Agent requires an external Python FastAPI backend service (not in this repo):

- **Primary endpoint**: `POST /agent_response/get_branching_response` - Agent orchestration
- **Response endpoint**: `GET /agent_response/get_responses_by_phase/{phase_id}` - Fetch stored responses
- **Refresh endpoint**: `PUT /agent_response/refresh_agent` - Update agent config

Environment variables:
- `BASE_URL` - Backend URL for server-side calls (e.g., `http://backend:8000` in Docker)
- `NEXT_PUBLIC_BASE_URL` - Backend URL for client-side calls (e.g., `http://localhost:8000`)

### RAG Service

Document processing requires RAG API (part of FastAPI backend):

- `POST /rag/chunk_and_embedding/{phaseId}` - Chunk and embed documents

## Key Technical Patterns

### 1. Phase Isolation
Each phase maintains separate data (messages, files, responses). No cross-phase data bleed. Lazy loading on phase switch.

### 2. Tool Composition
Agent prompts are composed dynamically. Selected tools inject their `toolPrompt` into the message before agent call. Allows flexible tool combinations per request.

### 3. Mention System (@file @tool)
Users can reference files/tools with @mentions (like Slack). TipTap extension provides autocomplete. Referenced content is extracted and appended to agent message.

### 4. Structured Response Parsing
Agents return markdown or structured text. Components parse for specific formats:
- CSV tables → `CsvTable` component (AG Grid)
- PlantUML → `PlantUmlRenderer` (Mermaid)
- Markdown → `react-markdown`

Fallback: plain markdown rendering

### 5. Multi-Agent Responses
Single query can trigger multiple agents. Results returned as array with `agent_source` identifier. `AIResponseRenderer` displays tabs for each agent. Results merged using `app/utils/merge-response.ts`.

## Environment Variables

Required variables (see `.env` or Dockerfile build args):

```bash
# MongoDB
MONGODB_URI=mongodb://mongodb:27017/ba-agent
MONGODB_DATABASE=mastraDB2
MONGODB_DATABASE2=mastraDB

# Backend URLs
BASE_URL=http://backend:8000                    # Server-side
NEXT_PUBLIC_BASE_URL=http://localhost:8000      # Client-side

# Next.js
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Docker Deployment

Multi-stage Dockerfile with:
1. **deps** stage - Install dependencies
2. **builder** stage - Build Next.js app with `output: "standalone"`
3. **runner** stage - Lightweight production image (node:20-alpine)

Features:
- Non-root user (nextjs:nodejs)
- Health check endpoint (`wget http://localhost:3000`)
- Optimized for Docker networking (backend service accessible at `http://backend:8000`)

## Development Guidelines

### SOLID Principles
- **SRP**: One reason to change per module (separate concerns: DB ops, API routes, components)
- **DIP**: Depend on abstractions (use Zod schemas, MongoDB interfaces)

### Clean Code
- Functions under 10 lines
- Files under 150 lines
- Early returns, no else statements
- Descriptive names with auxiliary verbs (`isLoading`, `hasError`)

### Naming Conventions
- Directories: `kebab-case`
- Components: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`

### React/Next.js Rules
- Prefer Server Components (use `'use client'` only when needed)
- Named exports over default exports
- Use `Promise.all()` for parallel fetching
- Validate at beginning, happy path last

### Data Validation
- Use Zod for all schema validation (see `app/models/schema/`)
- Parse API responses with Zod schemas before use
- Use `jsonrepair` for malformed JSON from LLM responses

## Git Conventions

```bash
# Commit messages (conventional commits)
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

## Common Development Tasks

### Adding a New Phase
1. Update `PhaseId` type in `app/models/types.ts`
2. Add phase config to `phaseConfig` (icon, color, description)
3. Update Sidebar to include new phase in PhaseSelector
4. No code changes needed - phase isolation handles rest

### Adding a New Tool
1. Add tool definition to MongoDB `tools` collection
2. Tool automatically appears in Sidebar ActiveTools
3. Create mention entry (type: 'tool') for @mentions
4. Tool prompt will be injected when selected

### Adding a New Agent
1. Create agent in MongoDB `agents` collection (name, instructions, model)
2. Agent automatically available via `/api/agents` endpoint
3. Configure default template in `templates` collection
4. Update backend to handle agent routing

### Adding a New File Type
1. Add to `ALLOWED_FILE_TYPES` and `ALLOWED_EXTENSIONS` in `app/models/types.ts`
2. Implement text extractor in `app/utils/extractTextContent.ts`
3. Update file validation in `app/utils/isValidChatFileType.ts`
4. Update RAG processing if needed

### Adding a New Response Renderer
1. Create renderer component in `app/components/MessageArea/`
2. Add parsing logic in `AIResponseRenderer.tsx` based on format type
3. Update response schema in `app/models/schema/ai-response-schema.ts`
4. Agent must return data in expected format

## Critical Paths for Common Tasks

- **Agent orchestration**: `app/api/agent/ui-analyze/route.ts` → `useSidebarApi.ts` → FastAPI backend
- **File handling**: `app/api/files/route.ts` → `app/db/files.ts` → External RAG API
- **Response display**: `MessageArea.tsx` → `AIResponseRenderer.tsx` → Format-specific renderer (CsvTable/PlantUmlRenderer/Markdown)
- **State updates**: Component → Zustand hook (`useAppState`) → Global state → Reactivity
- **Database ops**: API route → `app/db/*.ts` → MongoDB client (`app/db/mongodb.ts`)

## Troubleshooting

### Agent calls timeout
- Check `BASE_URL` / `NEXT_PUBLIC_BASE_URL` environment variables
- Verify FastAPI backend is running and accessible
- Check timeout setting in `useSidebarApi.ts` (default: 5 minutes)

### File upload fails
- Verify file type is in `ALLOWED_EXTENSIONS` (only `.txt`, `.docx`, `.doc`)
- Check MongoDB connection and storage limits
- Verify RAG API is accessible

### Phase data not loading
- Check MongoDB collections (`files`, agent responses)
- Verify `phaseId` parameter in API calls
- Check lazy loading logic in Dashboard component

### Mention autocomplete not working
- Verify mentions created in MongoDB `mentions` collection
- Check TipTap configuration in `InputAreaMention`
- Verify suggestion list rendering in `suggestion.ts`
