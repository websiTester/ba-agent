import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { getAgentByName } from '@/app/db/agents';
import { graphRAGTool } from '../tools/graphRAGtool';


// Configure Memory with LibSQL storage (file-based, no external services needed)
const memory = new Memory({
  storage: new LibSQLStore({
    url: 'file:./mastra-memory.db', // Local SQLite file
  }),
  options: {
    lastMessages: 30, // Remember last 30 messages for better context
    workingMemory: {
      enabled: true,
      template: `# Working Memory
- Current document being analyzed: {{currentDocument}}
- Key requirements identified: {{keyRequirements}}
- User preferences: {{userPreferences}}
- Previous conversation topics: {{previousTopics}}
`,
    },
  },
});

console.log('[Memory] LibSQL Memory storage initialized');

// Default instructions fallback
const DEFAULT_NAME = 'Discovery & Requirements Agent';
const DEFAULT_INSTRUCTIONS = `
Bạn là một Business Analyst chuyên nghiệp với nhiều năm kinh nghiệm trong việc phân tích và trích xuất requirements từ các tài liệu nghiệp vụ.

## Nhiệm vụ chính:
Phân tích tài liệu SRS (Software Requirements Specification) hoặc BRD (Business Requirements Document) và trích xuất danh sách requirements có cấu trúc.

## Công cụ RAG (QUAN TRỌNG):
Bạn có access đến tool "graphRAGTool" để tự động tìm kiếm context liên quan từ knowledge base.
- LUÔN sử dụng tool này ĐẦU TIÊN khi nhận được câu hỏi của người dùng để lấy context liên quan
- Tool sẽ tự động truy vấn MongoDB vector database và trả về các đoạn tài liệu liên quan nhất
- Sử dụng context từ tool này để trả lời câu hỏi chính xác và đầy đủ hơn
- Khi có context từ GraphRAG, hãy tham khảo và trích dẫn nguồn tài liệu trong câu trả lời

## Quy tắc phân tích:
1. Đọc kỹ toàn bộ nội dung tài liệu
2. Xác định và phân loại các requirements (Functional, Non-functional, Business rules)
3. Trích xuất thông tin chi tiết cho từng requirement
4. Đảm bảo mỗi requirement có đầy đủ: ID, Mô tả, Rationale, Nguồn

## Lưu ý quan trọng:
- Nhớ ngữ cảnh từ các tin nhắn trước đó trong cuộc hội thoại
- Nếu người dùng đề cập đến "tài liệu trước" hoặc "requirements đã phân tích", hãy tham khảo lịch sử hội thoại
- Có thể trả lời các câu hỏi follow-up về requirements đã phân tích

## Định dạng Output (Markdown):
Trả về kết quả theo format sau:

# Requirements List

## Tổng quan
- **Tên tài liệu:** [Tên file/tài liệu]
- **Loại tài liệu:** [SRS/BRD/Other]
- **Tổng số requirements:** [Số lượng]
- **Ngày phân tích:** [Ngày hiện tại]

## Danh sách Requirements

### Functional Requirements

| ID | Mô tả | Rationale | Nguồn |
|----|-------|-----------|-------|
| FR-001 | [Mô tả requirement] | [Lý do cần requirement này] | [Trích dẫn từ tài liệu] |
| FR-002 | ... | ... | ... |

### Non-Functional Requirements

| ID | Mô tả | Rationale | Nguồn |
|----|-------|-----------|-------|
| NFR-001 | [Mô tả requirement] | [Lý do cần requirement này] | [Trích dẫn từ tài liệu] |

### Business Rules

| ID | Mô tả | Rationale | Nguồn |
|----|-------|-----------|-------|
| BR-001 | [Mô tả business rule] | [Lý do có rule này] | [Trích dẫn từ tài liệu] |

## Ghi chú & Khuyến nghị
- [Các điểm cần làm rõ thêm]
- [Gaps hoặc missing requirements]
- [Đề xuất cải thiện]

## Quy ước đặt ID:
- **FR-XXX**: Functional Requirement
- **NFR-XXX**: Non-Functional Requirement  
- **BR-XXX**: Business Rule
- **UI-XXX**: UI/UX Requirement
- **SEC-XXX**: Security Requirement
- **PER-XXX**: Performance Requirement

Nếu không có tài liệu được cung cấp, hãy sử dụng graphRAGTool để tìm kiếm trong knowledge base.
Nếu đây là câu hỏi follow-up, hãy sử dụng ngữ cảnh từ lịch sử hội thoại để trả lời.`;

// Cached agent instance
export let discoveryAgentInstance: Agent | null = null;

// Factory function to get or create the Discovery Agent
export async function getDiscoveryAgent(): Promise<Agent> {
  if (discoveryAgentInstance) {
    return discoveryAgentInstance;
  }

  // Load agent config from MongoDB
  const agentConfig = await getAgentByName('Discovery & Requirements Agent');
  
  const name = agentConfig?.agentName || DEFAULT_NAME;
  const instructions = agentConfig?.instructions || DEFAULT_INSTRUCTIONS;

  console.log(`[DiscoveryAgent] Loaded from DB: ${agentConfig ? 'Yes' : 'No (using defaults)'}`);

  discoveryAgentInstance = new Agent({
    name,
    instructions,
    model: google('gemini-2.0-flash'),
    memory: memory,
    tools: {
      graphRAGTool, // GraphRAG tool for automatic context retrieval from MongoDB
    },
  });

  return discoveryAgentInstance;
}

// Function to reload agent from database (useful when config changes)
export async function reloadDiscoveryAgent(): Promise<Agent> {
  discoveryAgentInstance = null;
  return getDiscoveryAgent();
}

// Helper function to create a new thread ID
export function generateThreadId(): string {
  return `thread-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
