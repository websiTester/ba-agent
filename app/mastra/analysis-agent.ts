import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { getAgentByName } from '../db/agents';
import { mastra } from '.';

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
const DEFAULT_NAME = 'Analysis & Validation Agent';
const DEFAULT_INSTRUCTIONS = `
<instructions>
  <role>
    Bạn là một Senior Product Owner (PO) chuyên gia về Quản lý Backlog và Ưu tiên yêu cầu.
    Nhiệm vụ của bạn là đánh giá một danh sách các tính năng/yêu cầu đầu vào và phân loại chúng theo phương pháp MoSCoW (Must have, Should have, Could have, Won't have).
    Bạn có khả năng cân bằng giữa Lợi ích kinh doanh (Business Value) và Nỗ lực kỹ thuật (Technical Effort) để đưa ra quyết định sáng suốt.
  </role>

  <core_principles>
    1. **Định nghĩa MoSCoW chuẩn:**
       - **Must have (M):** Bắt buộc phải có để sản phẩm hoạt động được, hoặc do yêu cầu pháp lý. Nếu thiếu, coi như dự án thất bại.
       - **Should have (S):** Quan trọng nhưng chưa cấp bách, có thể dùng giải pháp tạm (workaround) nếu cần.
       - **Could have (C):** Có thì tốt (Nice-to-have), làm tăng trải nghiệm nhưng không ảnh hưởng cốt lõi.
       - **Won't have (W):** Chưa cần thiết ở thời điểm hiện tại, sẽ xem xét trong tương lai.
    2. **Khách quan:** Đánh giá dựa trên giá trị thực tế của tính năng đối với người dùng cuối, không thiên vị.
    3. **Tuân thủ cấu hình:** Chỉ phân tích và trả về các cột thông tin được định nghĩa trong thẻ <requirements>.
  </core_principles>

  <processing_rules>
    <rule>
      **Input:** Dữ liệu đầu vào là một danh sách các yêu cầu/tính năng thô (nằm trong <input_features_list>).
    </rule>
    <rule>
      **Cấu trúc bảng (Table Structure):**
      - Bảng kết quả luôn có 2 cột cố định: **ID** và **Tên Tính Năng**.
      - Các cột tiếp theo được tạo động dựa trên thẻ <requirement> trong phần cấu hình.
      - Nếu thẻ <requirement> yêu cầu "Phân loại MoSCoW", hãy áp dụng định nghĩa chuẩn ở trên để điền: "M", "S", "C", hoặc "W".
    </rule>
    <rule>
      **Sắp xếp:** Mặc định sắp xếp bảng kết quả theo thứ tự ưu tiên: Must Have -> Should Have -> Could Have -> Won't Have.
    </rule>
  </processing_rules>

  <output_template>
    ## Ma trận Ưu tiên MoSCoW
    
    | ID | Tên Tính Năng | {{name_của_req_1}} | {{name_của_req_2}} | ... |
    |----|---------------|--------------------|--------------------|-----|
    | F_01 | [Tên input] | [Phân tích theo description 1] | [Phân tích theo description 2] | ... |
  </output_template>

  <requirements>
    <requirement>
    <name>Phân loại MoSCoW</name>
    <description>Xếp loại yêu cầu này vào nhóm M, S, C, hoặc W.</description>
</requirement>

<requirement>
    <name>Lý do xếp loại</name>
    <description>Giải thích ngắn gọn tại sao tính năng này lại thuộc nhóm đó (dựa trên độ cấp thiết và impact).</description>
</requirement>
  </requirements>

</instructions>`;

// Cached agent instance
export let analysisAgentInstance: Agent | null = null;

// Factory function to get or create the Discovery Agent
export async function getAnalysisAgent(): Promise<Agent> {
  if (analysisAgentInstance) {
    return analysisAgentInstance;
  }

  // Load agent config from MongoDB
  const agentConfig = await getAgentByName('Analysis & Validation Agent');
  
  const name = agentConfig?.agentName || DEFAULT_NAME;
  const instructions = agentConfig?.instructions || DEFAULT_INSTRUCTIONS;

  analysisAgentInstance = new Agent({
    name,
    instructions,
    model: "google/gemini-2.5-flash",
    memory: memory,
  });
  console.log(`[AnalysisAgent] Loaded from DB: ${instructions}`);

  return analysisAgentInstance;
}

// Function to reload agent from database (useful when config changes)
export async function reloadAnalysisAgent(): Promise<Agent> {
  console.log(`[AnalysisAgent] Reloading from DB`);
  analysisAgentInstance = null;
  return getAnalysisAgent();
}

// Function to analyze document with the agent (with memory support)
export async function analyzeDocument(
  userMessage: string,
  documentContent?: string,
  threadId?: string,
  resourceId: string = 'default-user'
): Promise<string> {
  const agent = await getAnalysisAgent();
  
  let formattedPrompt = '';

  // 1. SETUP: Định nghĩa vai trò (System Persona)
  formattedPrompt += `Xử lý yêu cầu sau của người dùng: ${userMessage}.\n\n`;


  if (documentContent && documentContent.length > 0) {
    formattedPrompt += `---\n`;
    formattedPrompt += `<user_document>\n`;
    formattedPrompt += `${documentContent}\n`;
    formattedPrompt += `</user_document>\n`;
    formattedPrompt += `---\n`;
    formattedPrompt += `
    QUY TRÌNH THỰC HIỆN (BẮT BUỘC):

    BƯỚC 1: ĐỌC VÀ HIỂU MÔ TẢ CHỨC NĂNG
    - Đọc toàn bộ nội dung trong <user_document>
    - Xác định các chức năng chính của hệ thống được mô tả
    - Phân tích các hành vi, tác vụ, và tương tác người dùng được đề cập

    BƯỚC 2: PHÂN LOẠI YÊU CẦU THEO PHƯƠNG PHÁP MOSCOW ĐƯỢC ĐỊNH NGHĨA TRONG INSTRUCTION

    \n
    `;

    formattedPrompt += `
    LƯU Ý: 
    - Trong trường hơp người dùng không cung cấp nội dung tài liệu, hãy phân tích dựa trên các thông tin được cung cấp trong yêu cầu của người dùng.
    Hãy bắt đầu phân tích ngay bây giờ.
    `;
   
  }

  let prompt = formattedPrompt;
  
  
  const response = await agent.generate(prompt, {
    threadId: threadId || `default-thread-${Date.now()}`, // Ensure threadId is never undefined
    resourceId: resourceId, // User/session identifier
  });
  
  return response.text;
}

// Helper function to create a new thread ID
export function generateThreadId(): string {
  return `thread-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
