import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { getAgentByName } from '../db/agents';

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


// Default instructions fallback
const DEFAULT_NAME = 'Chunk Agent';
const DEFAULT_INSTRUCTIONS = `
### VAI TRÒ
Bạn là một AI chuyên xử lý văn bản và cấu trúc dữ liệu (Data Structuring Specialist). Nhiệm vụ của bạn là phân tích file văn bản định dạng Markdown và chuyển đổi nó thành cấu trúc JSON tiêu chuẩn.

### NHIỆM VỤ CHÍNH
Đọc nội dung file Markdown đầu vào, tách nội dung thành các phần dựa trên các **Header cấp cao nhất (Highest Level Headers)** và trả về một mảng JSON.

### QUY TẮC XỬ LÝ (QUAN TRỌNG)
1. **Xác định cấp độ phân tách:**
   - Quét văn bản để tìm cấp độ Header cao nhất được sử dụng (Ví dụ: # là cao nhất. Nếu không có #, thì ## là cao nhất).
   - Đây sẽ là "dấu phân cách" để tách các object.

2. **Logic trích xuất:**
   - **Header:** Là tiêu đề của Header cấp cao nhất (loại bỏ các ký tự # và khoảng trắng thừa).
   - **Content:** Là TOÀN BỘ nội dung nằm dưới Header đó cho đến khi gặp Header cấp cao nhất tiếp theo hoặc hết file.
   - **Lưu ý đặc biệt về Header con:** Nếu bên trong nội dung có các Header cấp thấp hơn (ví dụ: đang tách theo H1, nhưng bên trong có H2, H3), thì các H2, H3 đó và nội dung của chúng **phải được giữ nguyên** dưới dạng văn bản (text) trong phần \`content\` của Header cha. KHÔNG tách chúng thành object riêng.

3. **Định dạng đầu ra:**
   - Chỉ trả về duy nhất một chuỗi JSON hợp lệ (valid JSON string).
   - Không bọc trong block code markdown (\`\`\`json ... \`\`\`).
   - Không thêm lời dẫn hay giải thích.

### CẤU TRÚC JSON MONG MUỐN
Mảng các object, mỗi object có 2 key:
- header: (String) Tên tiêu đề.
- content: (String) Nội dung chi tiết (bao gồm cả text và markdown của các sub-header).

### VÍ DỤ MINH HỌA (Few-Shot)

**Input:**
\`\`\`markdown
# Giới thiệu
Đây là phần mở đầu.
## Lịch sử
Lịch sử hình thành dự án.

# Tính năng
Mô tả các tính năng chính.
## Tính năng A
Chi tiết A.
### Chi tiết nhỏ A1
Sâu hơn về A.
## Tính năng B
Chi tiết B.

**Output:**
\`\`\`json
[ { 
"header": "Giới thiệu", 
"content": "Đây là phần mở đầu.\n## Lịch sử\nLịch sử hình thành dự án." 
}, 
{ 
"header": "Tính năng", 
"content": "Mô tả các tính năng chính.\n## Tính năng A\nChi tiết A.\n### Chi tiết nhỏ A1\nSâu hơn về A.\n## Tính năng B\nChi tiết B." 
}]
\`\`\`
`;

// Cached agent instance
export let chunkAgentInstance: Agent | null = null;

// Factory function to get or create the Discovery Agent
export async function getChunkAgent(): Promise<Agent> {
  if (chunkAgentInstance) {
    return chunkAgentInstance;
  }

  // Load agent config from MongoDB
  const agentConfig = await getAgentByName('Chunk Agent');
  
  const name = agentConfig?.agentName || DEFAULT_NAME;
  const instructions = agentConfig?.instructions || DEFAULT_INSTRUCTIONS;

  chunkAgentInstance = new Agent({
    name,
    instructions,
    model: "groq/llama-3.3-70b-versatile",
    memory: memory,
  });
  console.log(`[ChunkAgent] Loaded from DB: ${instructions}`);

  return chunkAgentInstance;
}

// Function to reload agent from database (useful when config changes)
export async function reloadChunkAgent(): Promise<Agent> {
console.log(`[ChunkAgent] Reloading from DB`);
  chunkAgentInstance = null;
  return getChunkAgent();
}

// Function to analyze document with the agent (with memory support)
export async function chunkDocument(
  documentContent?: string,
): Promise<string> {
  const agent = await getChunkAgent();
  
  let formattedPrompt = '';

  // 1. SETUP: Định nghĩa vai trò (System Persona)
  formattedPrompt += `Chia tài liệu sau thành các chunks và trả về list các object dưới dạng JSON: ${documentContent}.\n\n`;


  let prompt = formattedPrompt;
  
  
  const response = await agent.generate(prompt);
  
  return response.text;
}

