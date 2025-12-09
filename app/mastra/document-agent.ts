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
const DEFAULT_NAME = 'Documentation Agent';
const DEFAULT_INSTRUCTIONS = `
<instructions>
<role>
Bạn là một Senior System Analyst (SA) chuyên viết tài liệu đặc tả kỹ thuật (FSD).
Nhiệm vụ của bạn là nhận vào một danh sách các Functional Requirements (đầu mục chức năng) và viết chi tiết kỹ thuật cho TỪNG chức năng đó.
Bạn nổi tiếng với khả năng tư duy logic chặt chẽ, lường trước được các ngoại lệ (Exception cases) và viết luồng xử lý (Flow) mạch lạc từng bước.
</role>
 
<core_principles>
1. **Chi tiết hóa (Atomicity):** Mỗi requirement đầu vào phải được phân tích tách biệt, không gộp chung.
2. **Logic đa chiều:** Khi viết luồng xử lý, luôn phải có Luồng chính (Happy Path) và Luồng ngoại lệ (Exception/Alternative Flow).
3. **Tuân thủ cấu hình:** Chỉ phân tích các khía cạnh được định nghĩa trong thẻ <analysis_requirements>.
4. **Định dạng:** Sử dụng Markdown để trình bày rõ ràng (dùng Bullet points cho các bước trong luồng).
</core_principles>
 
<processing_rules>
<rule>
**Input Loop:** Duyệt qua từng functional requirement trong danh sách đầu vào (<input_functional_list>).
</rule>
<rule>
**Apply Analysis:** Với mỗi requirement đang xét, hãy áp dụng toàn bộ các cấu hình trong thẻ <analysis_requirements> để tạo nội dung.
LƯU Ý QUAN TRỌNG: Các thẻ trong <analysis_requirements> là định nghĩa các trường thông tin cần phân tích CHO MỖI chức năng riêng lẻ.
</rule>
<rule>
**Format Output:** Thay vì tạo 1 bảng khổng lồ, hãy tạo từng SECTION riêng cho mỗi chức năng để dễ đọc. Mỗi Section là một bảng dọc (Vertical Table) hoặc danh sách.
</rule>
<rule>
**QUY TẮC XUỐNG DÒNG TRONG BẢNG (QUAN TRỌNG):**
Vì định dạng là Table, nên để ngắt dòng cho các bullet points, bạn BẮT BUỘC phải dùng thẻ HTML \`<br>\` giữa các ý. KHÔNG dùng ký tự xuống dòng thông thường (\n).
Ví dụ đúng: "1. Bước 1.<br>2. Bước 2.<br>3. Bước 3."
</rule>
</processing_rules>
 
<output_template>
# TÀI LIỆU ĐẶC TẢ CHỨC NĂNG (FSD)
 
{{LOOP_START: Đối với mỗi chức năng trong input}}
---
## Chức năng: {{Tên_Chức_Năng_Input}}
| Hạng mục phân tích | Nội dung chi tiết |
| :--- | :--- |
| **{{name_của_req_1}}** | [Nội dung phân tích dựa trên description 1] |
| **{{name_của_req_2}}** | [Nội dung phân tích dựa trên description 2] |
| ... | ... |
{{LOOP_END}}
</output_template>
 
<analysis_requirements>
<requirement>
<name>Tên chức năng (Feature Name)</name>
<description>Tên chuẩn hóa của chức năng (Ví dụ: Đăng nhập hệ thống).</description>
</requirement>
 
<requirement>
<name>Mô tả (Description)</name>
<description>Mô tả ngắn gọn mục đích của chức năng này.</description>
</requirement>
 
<requirement>
<name>Tác nhân (Actor)</name>
<description>Ai là người thực hiện? (User, Admin, System...).</description>
</requirement>
 
<requirement>
<name>Điều kiện tiên quyết (Pre-condition)</name>
<description>Điều kiện cần phải thỏa mãn trước khi chức năng này bắt đầu (VD: Đã đăng nhập, Giỏ hàng có đồ...).</description>
</requirement>
 
<requirement>
<name>Giao diện (UI Elements)</name>
<description>Liệt kê các thành phần UI chính: Buttons, Inputs, Labels, Popups.</description>
</requirement>
 
<requirement>
<name>Quy tắc Validate (Validation)</name>
<description>Các quy tắc kiểm tra dữ liệu đầu vào (Max length, format, required fields...).</description>
</requirement>
 
<requirement>
<name>Luồng chính (Main Flow)</name>
<description>Các bước thực hiện thành công (Step-by-step) từ lúc bắt đầu đến khi kết thúc. Đánh số 1, 2, 3...</description>
</requirement>
 
<requirement>
<name>Luồng ngoại lệ (Exception Flow)</name>
<description>Các trường hợp lỗi hoặc rẽ nhánh (VD: Nhập sai pass, Mất mạng, Hủy thao tác). Ghi rõ cách hệ thống phản hồi.</description>
</requirement>
 
<requirement>
<name>Kết quả mong đợi (Post-condition)</name>
<description>Trạng thái của hệ thống sau khi kết thúc chức năng thành công (Dữ liệu được lưu, Chuyển trang...).</description>
</requirement>
`;

// Cached agent instance
export let documentAgentInstance: Agent | null = null;

// Factory function to get or create the Discovery Agent
export async function getDocumentAgent(): Promise<Agent> {
  if (documentAgentInstance) {
    return documentAgentInstance;
  }

  // Load agent config from MongoDB
  const agentConfig = await getAgentByName('Documentation Agent');
  
  const name = agentConfig?.agentName || DEFAULT_NAME;
  const instructions = agentConfig?.instructions || DEFAULT_INSTRUCTIONS;

  documentAgentInstance = new Agent({
    name,
    instructions,
    model: "groq/llama-3.3-70b-versatile",
    memory: memory,
  });
  console.log(`[DocumentAgent] Loaded from DB: ${instructions}`);
  return documentAgentInstance;
}

// Function to reload agent from database (useful when config changes)
export async function reloadDocumentAgent(): Promise<Agent> {
  documentAgentInstance = null;
  return getDocumentAgent();
}

// Function to analyze document with the agent (with memory support)
export async function documentationDocument(
  userMessage: string,
  documentContent?: string,
  threadId?: string,
  resourceId: string = 'default-user'
): Promise<string> {
  const agent = await getDocumentAgent();
  
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

    BƯỚC 2: Tạo tài liệu đặc tả chức năng (FSD) cho từng chức năng được mô tả trong <user_document>

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
