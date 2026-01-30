# BA-Agent - AI-Powered Business Analysis Platform

## 📋 Tổng quan dự án

**BA-Agent** là một nền tảng phân tích nghiệp vụ (Business Analysis) được hỗ trợ bởi AI, giúp tự động hóa các quy trình thu thập requirements, phân tích, tạo tài liệu và giao tiếp trong vòng đời phát triển phần mềm.

### Thông tin cơ bản
- **Framework**: Next.js 15.1.0
- **Language**: TypeScript
- **Runtime**: React 19.2.0
- **AI SDK**: Mastra Core + Google Generative AI
- **Database**: MongoDB + PostgreSQL (Vector Store)
- **State Management**: Zustand

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Sidebar   │  │  ChatPanel  │  │ FileManager │  │  Settings   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                         API ROUTES                                   │
│  /api/agent/*  │  /api/files  │  /api/rag  │  /api/templates        │
├─────────────────────────────────────────────────────────────────────┤
│                         MASTRA AI AGENTS                            │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │
│  │ Discovery │ │ Analysis  │ │ Document  │ │ Communica │           │
│  │   Agent   │ │   Agent   │ │   Agent   │ │   Agent   │           │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │
├─────────────────────────────────────────────────────────────────────┤
│                    DATABASE & VECTOR STORE                          │
│  ┌───────────────────┐  ┌───────────────────────────────┐          │
│  │     MongoDB       │  │    PostgreSQL (pgVector)      │          │
│  │  - Files          │  │  - Document Chunks            │          │
│  │  - Agents         │  │  - Embeddings                 │          │
│  │  - Templates      │  │  - RAG Search                 │          │
│  └───────────────────┘  └───────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Cấu trúc thư mục

```
ba-agent/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Trang Dashboard chính
│   ├── layout.tsx                # Root layout với metadata
│   ├── store.ts                  # Zustand global state
│   ├── globals.css               # Global styles
│   │
│   ├── api/                      # API Routes
│   │   ├── agent/                # AI Agent endpoints
│   │   │   ├── discovery/        # Discovery Agent API
│   │   │   ├── analysis/         # Analysis Agent API
│   │   │   ├── obsidian/         # Obsidian integration
│   │   │   ├── transcribe/       # Audio transcription
│   │   │   └── ...
│   │   ├── agents/               # Agent management API
│   │   ├── files/                # File upload/management
│   │   ├── rag/                  # RAG search API
│   │   ├── templates/            # Template management
│   │   └── ...
│   │
│   ├── components/               # React Components
│   │   ├── ChatPanel.tsx         # Main chat interface
│   │   ├── FileManager.tsx       # File upload & management
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── UploadModal.tsx       # File upload modal
│   │   │
│   │   ├── InputArea/            # Input components
│   │   │   ├── InputArea.tsx
│   │   │   ├── AttackedFilePreview.tsx
│   │   │   └── BottomToolBar.tsx
│   │   │
│   │   ├── InputAreaMention/     # @mention functionality
│   │   │   ├── InputAreaMention.tsx
│   │   │   ├── MentionList.tsx
│   │   │   └── suggestion.ts
│   │   │
│   │   ├── MessageArea/          # Message display
│   │   │   ├── MessageArea.tsx
│   │   │   ├── AIResponseRenderer.tsx
│   │   │   ├── TableComponent.tsx
│   │   │   ├── Mermaid.tsx       # Mermaid diagram render
│   │   │   └── PlantUml/         # PlantUML diagrams
│   │   │
│   │   ├── Setting/              # Settings components
│   │   │   ├── SettingModel.tsx
│   │   │   ├── TemplateListTab.tsx
│   │   │   └── AgentInstructionTab.tsx
│   │   │
│   │   ├── Sidebar/              # Sidebar sub-components
│   │   │   ├── index.tsx
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   │
│   │   └── Tool/                 # Tool management
│   │
│   ├── db/                       # Database operations
│   │   ├── mongodb.ts            # MongoDB connection
│   │   ├── files.ts              # File CRUD operations
│   │   ├── agents.ts             # Agent CRUD operations
│   │   ├── templates.ts          # Template CRUD operations
│   │   ├── chunks.ts             # Document chunks for RAG
│   │   └── tools.ts              # Tool management
│   │
│   ├── mastra/                   # AI Agents (Mastra SDK)
│   │   ├── index.ts              # Mastra initialization
│   │   ├── discovery-agent.ts    # Discovery & Requirements Agent
│   │   ├── analysis-agent.ts     # Analysis & Validation Agent
│   │   ├── document-agent.ts     # Documentation Agent
│   │   ├── communication-agent.ts# Communication & Handoff Agent
│   │   ├── quick-agent.ts        # Quick Chat Agent
│   │   ├── obsidian-agent.ts     # Obsidian MCP Integration
│   │   ├── transcription-agent.ts# Audio Transcription Agent
│   │   ├── chunk-agent.ts        # Document Chunking Agent
│   │   ├── rag-service.ts        # RAG Service
│   │   └── agents/               # Additional agent configs
│   │
│   ├── models/                   # TypeScript interfaces
│   │   ├── types.ts              # Core type definitions
│   │   ├── agent.ts              # Agent model
│   │   ├── file-document.ts      # File document model
│   │   ├── tool.ts               # Tool model
│   │   └── mentionDB.ts          # Mention model
│   │
│   ├── utils/                    # Utility functions
│   │   ├── download.ts           # Download helpers
│   │   ├── extractTextContent.ts # Text extraction
│   │   ├── formatFileSize.ts     # File size formatting
│   │   ├── json-parser.ts        # JSON parsing utilities
│   │   └── merge-response.ts     # Response merging
│   │
│   ├── login/                    # Login page
│   └── register/                 # Registration page
│
├── public/                       # Static assets
├── package.json                  # Dependencies
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── eslint.config.mjs             # ESLint configuration
```

---

## 🤖 AI Agents (Mastra SDK)

### 1. Discovery & Requirements Agent
**File**: `app/mastra/discovery-agent.ts`
**Model**: `google/gemini-2.5-flash`

**Chức năng**:
- Phân tích tài liệu SRS/BRD
- Trích xuất Functional Requirements (FR) và Non-Functional Requirements (NFR)
- Xác định gaps và khuyến nghị cải thiện

**Output Format**:
- Bảng Functional Requirements
- Bảng Non-Functional Requirements  
- Phân loại theo: Performance, Security, Usability, Reliability, Scalability

---

### 2. Analysis & Validation Agent
**File**: `app/mastra/analysis-agent.ts`
**Model**: `google/gemini-2.5-flash`

**Chức năng**:
- Đánh giá và phân loại requirements theo phương pháp MoSCoW
- Must have / Should have / Could have / Won't have
- Cân bằng Business Value và Technical Effort

**Output Format**:
- Ma trận ưu tiên MoSCoW
- Lý do xếp loại cho từng requirement

---

### 3. Documentation Agent
**File**: `app/mastra/document-agent.ts`
**Model**: `google/gemini-2.5-flash-lite`

**Chức năng**:
- Tạo tài liệu đặc tả chức năng (FSD - Functional Specification Document)
- Chi tiết hóa từng Functional Requirement

**Output Format**:
- Tên chức năng
- Mô tả
- Tác nhân (Actor)
- Điều kiện tiên quyết (Pre-condition)
- Giao diện (UI Elements)
- Quy tắc Validate
- Luồng chính (Main Flow)
- Luồng ngoại lệ (Exception Flow)
- Kết quả mong đợi (Post-condition)

---

### 4. Communication & Handoff Agent
**File**: `app/mastra/communication-agent.ts`
**Model**: `groq/llama-3.3-70b-versatile`

**Chức năng**:
- Tạo Acceptance Checklist từ FSD
- Danh sách kiểm tra cho Developer/Tester

**Output Format**:
- Kiểm tra Giao diện (UI/UX)
- Kiểm tra Logic & Validation
- Kiểm tra Ngoại lệ (Edge Cases)

---

### 5. Quick Chat Agent
**File**: `app/mastra/quick-agent.ts`
**Model**: `groq/llama-3.3-70b-versatile`

**Chức năng**:
- BA Mentor & System Guide
- Giải thích khái niệm BA (User Story, MoSCoW, Requirement Gathering...)
- Hướng dẫn sử dụng các Agent trong hệ thống

---

### 6. Obsidian Agent
**File**: `app/mastra/obsidian-agent.ts`
**Model**: `google/gemini-2.5-flash-lite`

**Chức năng**:
- Tích hợp với Obsidian vault qua MCP (Model Context Protocol)
- Đọc/Tạo/Cập nhật notes trong Obsidian
- Tìm kiếm và quản lý ghi chú

---

### 7. Transcription Agent
**File**: `app/mastra/transcription-agent.ts`
**Model**: `groq/llama-3.3-70b-versatile`

**Chức năng**:
- Chuyển đổi audio/video thành văn bản
- Sử dụng Google Cloud Speech-to-Text
- Phân biệt người nói trong hội thoại

---

### 8. Chunk Agent
**File**: `app/mastra/chunk-agent.ts`

**Chức năng**:
- Phân tách văn bản Markdown thành các chunks
- Tạo cấu trúc JSON cho RAG processing
- Hỗ trợ việc lưu trữ và tìm kiếm semantic

---

## 🔄 Workflow (4 Phases)

Hệ thống được tổ chức theo 4 giai đoạn phát triển phần mềm:

| Phase | Tên | Mô tả | Agent chính |
|-------|-----|-------|-------------|
| 1 | **Discovery** | Thu thập và xác định yêu cầu | Discovery Agent |
| 2 | **Analysis** | Phân tích và xác nhận requirements | Analysis Agent |
| 3 | **Documentation** | Tạo tài liệu BRD, FSD, User Stories | Documentation Agent |
| 4 | **Communication** | Giao tiếp và bàn giao cho team | Communication Agent |

---

## 🗄️ Database Schema

### MongoDB Collections

#### 1. Files Collection
```typescript
interface FileDocument {
  _id: ObjectId;
  phaseId: string;           // Phase mà file thuộc về
  fileName: string;          // Tên file gốc
  fileType: 'document' | 'text';
  fileSize: string;          // Formatted size
  fileSizeBytes: number;
  mimeType: string;
  content: string;           // Base64 encoded
  uploadedAt: Date;
  createdAt: Date;
}
```

#### 2. Agents Collection
```typescript
interface Agent {
  _id: ObjectId;
  agentName: string;
  instructions: string;      // System prompt
  model: string;             // AI model identifier
}
```

#### 3. Templates Collection
```typescript
interface Template {
  _id: ObjectId;
  agentId: string;
  templateName: string;
  isDefault: boolean;
  pair: Array<{
    header: string;
    content: string;
  }>;
  createdBy?: string;
  updatedAt?: Date;
}
```

### PostgreSQL (pgVector)

#### Document Chunks Table
```typescript
interface DocumentChunk {
  _id: string;
  fileId: string;
  phaseId: string;
  fileName: string;
  content: string;
  chunkIndex: number;
  totalChunks: number;
  metadata: { documentType: string };
  embedding: number[];       // Vector (768 dimensions)
  embeddingModel: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🛠️ API Endpoints

### Agent APIs (`/api/agent/*`)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/agent/discovery` | POST | Phân tích requirements |
| `/api/agent/analysis` | POST | Phân loại MoSCoW |
| `/api/agent/obsidian` | POST | Obsidian integration |
| `/api/agent/transcribe` | POST | Audio transcription |
| `/api/agent/ui-analyze` | POST | UI analysis |
| `/api/agent/chunk-and-download` | POST | Chunk và download document |

### Management APIs

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/agents` | GET/PUT | Quản lý agent configurations |
| `/api/files` | GET/POST/DELETE | Upload/quản lý files |
| `/api/templates` | GET/POST/PUT/DELETE | Quản lý templates |
| `/api/rag` | GET/POST | RAG search |
| `/api/mentions` | GET/POST | Mention management |

---

## 📦 Dependencies chính

### AI & ML
- `@mastra/core` - Mastra AI Agent framework
- `@mastra/rag` - RAG (Retrieval-Augmented Generation)
- `@mastra/memory` - Agent memory management
- `@mastra/mcp` - Model Context Protocol (Obsidian)
- `@mastra/voice-google` - Google Voice integration
- `@ai-sdk/google` - Google AI SDK
- `ai` - Vercel AI SDK

### Database
- `mongodb` - MongoDB driver
- `@mastra/mongodb` - Mastra MongoDB Vector
- `@mastra/pg` - PostgreSQL Vector Store
- `@mastra/libsql` - LibSQL for memory storage

### UI & Rich Text
- `@tiptap/react` - Rich text editor with mentions
- `@tiptap/extension-mention` - @mention support
- `ag-grid-react` - Data grid component
- `mermaid` - Diagram rendering
- `plantuml-encoder` - PlantUML diagrams
- `react-markdown` - Markdown rendering
- `lucide-react` - Icon library

### Document Processing
- `mammoth` - DOCX parsing
- `pdfjs-dist` - PDF parsing
- `docx` - DOCX generation
- `jszip` - ZIP file creation
- `papaparse` - CSV parsing

### State Management
- `zustand` - Global state management

---

## 🚀 Hướng dẫn chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment variables
Tạo file `.env.local`:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=ba_agent

# PostgreSQL (Vector Store)
POSTGRES_CONNECTION_STRING=postgresql://...

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key
GOOGLE_API_KEY=your_google_cloud_api_key

# Obsidian (optional)
OBSIDIAN_API_KEY=your_obsidian_api_key
OBSIDIAN_BASE_URL=http://localhost:27124

# Base URL for external services
BASE_URL=http://127.0.0.1:3001
```

### 3. Chạy development server
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

---

## 🔧 Tính năng chính

1. **Multi-Agent System**: 8 AI agents chuyên biệt cho từng giai đoạn BA
2. **RAG (Retrieval-Augmented Generation)**: Tìm kiếm semantic trong documents
3. **File Management**: Upload và quản lý TXT, DOCX files
4. **Template System**: Tùy chỉnh instructions cho từng agent
5. **@Mention Support**: Tag files và tools trong chat
6. **Obsidian Integration**: Lưu trữ kết quả vào Obsidian vault
7. **Audio Transcription**: Chuyển đổi audio thành text
8. **Diagram Generation**: Mermaid và PlantUML diagrams
9. **Export Options**: Download kết quả dưới dạng DOCX, ZIP

---

## 📝 License

Private project - All rights reserved.

---

*Tài liệu được tạo tự động bởi BA-Agent Overview Generator*
*Ngày cập nhật: 30/01/2026*
