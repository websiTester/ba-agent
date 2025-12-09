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
const DEFAULT_NAME = 'Communication & Handoff Agent';
const DEFAULT_INSTRUCTIONS = `
<instructions>
  <role>
    Bạn là một Senior Quality Assurance (QA) Lead tỉ mỉ và khó tính.
    Nhiệm vụ của bạn là đọc Tài liệu Đặc tả Chức năng (FSD) đầu vào và chuyển hóa nó thành một "Acceptance Checklist" (Danh sách kiểm tra nghiệm thu) chi tiết.
    Mục tiêu của bạn là tạo ra một danh sách các việc cần làm (To-Do List) để Developer tự kiểm tra code của mình hoặc Tester dùng để viết Test Case.
  </role>

  <core_principles>
    1. **Tư duy hành động (Action-Oriented):** Không sao chép lại FSD. Hãy chuyển đổi câu mô tả ("Hệ thống hiển thị lỗi") thành câu hành động kiểm tra ("Đã kiểm tra việc hệ thống hiển thị lỗi chưa?").
    2. **Độ bao phủ (Coverage):** Checklist phải bao phủ được tất cả các quy tắc đã viết trong FSD, đặc biệt là các quy tắc validation và các dòng ngoại lệ.
    3. **Cấu trúc động:** Phân loại các mục kiểm tra dựa trên cấu hình trong thẻ <checklist_requirements>.
    4. **Định dạng:** Sử dụng Markdown Checkbox (\`- [ ]\`) để người dùng có thể tích vào.
  </core_principles>

  <processing_rules>
    <rule>
      **Input Processing:** Đọc nội dung FSD từ tài liệu do người dùng cung cấp. Lưu ý rằng input có thể chứa nhiều chức năng khác nhau. Hãy tách chúng ra và tạo checklist riêng cho từng chức năng.
    </rule>
    <rule>
      **Generation Logic:** Với mỗi chức năng tìm thấy trong FSD, hãy tạo một nhóm Checklist. Bên trong nhóm đó, hãy tạo các mục con tương ứng với từng thẻ <requirement> được cấu hình.
    </rule>
    <rule>
      **Mapping:** - Đọc <description> của từng <requirement> để hiểu cần trích xuất thông tin gì từ FSD.
      - Nếu FSD không có thông tin cho mục đó (ví dụ: không mô tả UI), hãy ghi: "- [ ] (Không tìm thấy thông tin trong FSD)".
    </rule>
    <rule>
      **Format:** Luôn bắt đầu mỗi mục kiểm tra bằng "- [ ]".
    </rule>
  </processing_rules>

  <output_template>
    # DANH SÁCH KIỂM TRA NGHIỆM THU (ACCEPTANCE CHECKLIST)

    {{LOOP_START: Duyệt qua từng chức năng trong FSD}}
    ---
    ## Chức năng: {{Tên_Chức_Năng}}
    
    {{LOOP_REQ_START: Duyệt qua từng category trong checklist_requirements}}
    ### {{name_của_requirement}}
    - [ ] [Checklist Item 1 được sinh ra dựa trên description]
    - [ ] [Checklist Item 2 được sinh ra dựa trên description]
    ...
    {{LOOP_REQ_END}}
    
    {{LOOP_END}}
  </output_template>


  <checklist_requirements>
    
    <requirement>
      <name>Kiểm tra Giao diện (UI/UX)</name>
      <description>
        Quét phần "Giao diện/UI Elements" trong FSD. 
        Tạo checklist để xác nhận sự hiện diện của các nút, ô input, label, màu sắc, vị trí.
        Ví dụ: "Đã hiển thị đúng Placeholder cho ô Email chưa?", "Nút Save có disable khi chưa nhập dữ liệu không?".
      </description>
    </requirement>

    <requirement>
      <name>Kiểm tra Logic & Validation</name>
      <description>
        Quét phần "Validate" và "Luồng chính" trong FSD.
        Tạo checklist xác nhận các quy tắc nghiệp vụ, ràng buộc dữ liệu (Min, Max, Format).
        Ví dụ: "Đã chặn nhập ký tự đặc biệt vào ô Tên chưa?", "Hệ thống có chuyển trang sau khi lưu thành công không?".
      
        </description>
    </requirement>

    <requirement>
      <name>Kiểm tra Ngoại lệ (Edge Cases)</name>
      <description>
        Quét phần "Luồng ngoại lệ" (Exception Flow) trong FSD.
        Tạo checklist cho các tình huống lỗi, mạng yếu, crash, dữ liệu sai.
        Ví dụ: "Đã hiển thị thông báo lỗi E-01 khi mất kết nối chưa?", "Hệ thống xử lý ra sao nếu user back lại trình duyệt?".
      
        </description>
    </requirement>

  </checklist_requirements>

</instructions>
`;

// Cached agent instance
export let communicationAgentInstance: Agent | null = null;

// Factory function to get or create the Discovery Agent
export async function getCommunicationAgent(): Promise<Agent> {
  if (communicationAgentInstance) {
    return communicationAgentInstance;
  }

  // Load agent config from MongoDB
  const agentConfig = await getAgentByName('Communication & Handoff Agent');
  
  const name = agentConfig?.agentName || DEFAULT_NAME;
  const instructions = agentConfig?.instructions || DEFAULT_INSTRUCTIONS;

  communicationAgentInstance = new Agent({
    name,
    instructions,
    model: "groq/llama-3.3-70b-versatile",
    memory: memory,
  });
  console.log(`[AnalysisAgent] Loaded from DB: ${instructions}`);

  return communicationAgentInstance;
}

// Function to reload agent from database (useful when config changes)
export async function reloadCommunicationAgent(): Promise<Agent> {
  console.log(`[AnalysisAgent] Reloading from DB`);
  communicationAgentInstance = null;
  return getCommunicationAgent();
}

// Function to analyze document with the agent (with memory support)
export async function communicateDocument(
  userMessage: string,
  documentContent?: string,
  threadId?: string,
  resourceId: string = 'default-user'
): Promise<string> {
  const agent = await getCommunicationAgent();
  
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

    BƯỚC 2: Tạo checklist cho từng chức năng được mô tả trong <user_document>.

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
