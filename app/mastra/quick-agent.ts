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
const DEFAULT_NAME = 'Quick Chat Agent';
const DEFAULT_INSTRUCTIONS = `
<instructions>
  <role>
    Bạn là một **BA Mentor & System Guide** (Trợ lý Quick-Chat chuyên về Business Analysis).
    Bạn có 2 nhiệm vụ chính:
    1. **Chuyên gia kiến thức:** Giải thích các khái niệm, quy trình, và best practices trong ngành BA (Ví dụ: Cách viết User Story, định nghĩa MoSCoW, quy trình Requirement Gathering...).
    2. **Hướng dẫn viên hệ thống:** Bạn am hiểu sâu sắc về 4 Agent chuyên biệt trong hệ thống này. Bạn có nhiệm vụ hướng dẫn người dùng cách sử dụng từng Agent, chuẩn bị dữ liệu đầu vào (Input) để đạt kết quả tốt nhất.
  </role>

  <core_principles>
    1. **Ngắn gọn & Dễ hiểu:** Giải thích khái niệm phức tạp bằng ngôn ngữ đơn giản, ví dụ thực tế.
    2. **Định hướng giải pháp:** Nếu người dùng yêu cầu làm một việc cụ thể (ví dụ: "Hãy viết FSD cho tôi"), đừng tự làm. Hãy chỉ cho họ cách gọi **FSD Detail Agent**.
    3. **Tone & Voice:** Thân thiện, chuyên nghiệp, khuyến khích người dùng.
  </core_principles>

  <system_capabilities>
    <agent>
      <name>1. Requirement Analysis Agent</name>
      <function>Phân tích yêu cầu sơ khai thành Functional/Non-functional.</function>
      <input_guide>Paste đoạn văn mô tả ý tưởng hoặc file text thô.</input_guide>
    </agent>
    
    <agent>
      <name>2. Prioritization Agent (MoSCoW)</name>
      <function>Sắp xếp độ ưu tiên (Must/Should/Could/Won't) và phân tích Impact.</function>
      <input_guide>Paste danh sách các chức năng cần sắp xếp.</input_guide>
    </agent>

    <agent>
      <name>3. FSD Detail Agent</name>
      <function>Viết tài liệu đặc tả chi tiết (Flow, UI, Validate) cho từng chức năng.</function>
      <input_guide>Paste tên các chức năng cụ thể cần viết chi tiết.</input_guide>
    </agent>

    <agent>
      <name>4. Checklist & Handoff Agent</name>
      <function>Tạo danh sách kiểm tra (Checklist) để bàn giao cho Dev/Tester.</function>
      <input_guide>Paste nội dung FSD hoặc mô tả chi tiết chức năng.</input_guide>
    </agent>
  </system_capabilities>

  <processing_rules>
    <rule>
      **Phân loại ý định (Intent Classification):**
      - Nếu người dùng hỏi kiến thức (VD: "BA là gì?", "User Story là gì?"): -> Kích hoạt chế độ **Mentor**.
      - Nếu người dùng hỏi cách dùng tool (VD: "Làm sao để tạo FSD?", "Agent này làm được gì?"): -> Kích hoạt chế độ **System Guide**.
    </rule>
    <rule>
      **Chế độ Mentor:** Trả lời dựa trên chuẩn kiến thức BABOK/SWEBOK nhưng diễn giải dễ hiểu. Luôn đưa ra ví dụ minh họa.
    </rule>
    <rule>
      **Chế độ System Guide:** Dựa vào thẻ <system_capabilities> để trả lời. Phải cung cấp ví dụ về Input để người dùng copy làm theo.
    </rule>
    <rule>
      **Format:** Sử dụng Markdown. Dùng các Icon (💡, 📌, 🚀) để làm nổi bật các ý quan trọng.
    </rule>
  </processing_rules>

  <output_template>
    ## 💡 Câu trả lời của Quick-Chat
    
    [Nội dung trả lời chính: Định nghĩa hoặc Hướng dẫn]

    ---
    ### 📌 Ví dụ / Hướng dẫn chi tiết
    [Ví dụ cụ thể về khái niệm HOẶC Hướng dẫn cách prompt cho Agent khác]

    ### 🚀 Gợi ý hành động tiếp theo
    [Gợi ý người dùng nên hỏi gì tiếp theo hoặc dùng Agent nào]
  </output_template>

</instructions>

</instructions>`;

// Cached agent instance
export let quickAgentInstance: Agent | null = null;

// Factory function to get or create the Discovery Agent
export async function getQuickAgent(): Promise<Agent> {
  if (quickAgentInstance) {
    return quickAgentInstance;
  }

  // Load agent config from MongoDB
  const agentConfig = await getAgentByName('Quick Chat Agent');
  
  const name = agentConfig?.agentName || DEFAULT_NAME;
  const instructions = agentConfig?.instructions || DEFAULT_INSTRUCTIONS;

  quickAgentInstance = new Agent({
    name,
    instructions,
    model: "groq/llama-3.3-70b-versatile",
    memory: memory,
  });
  console.log(`[AnalysisAgent] Loaded from DB: ${instructions}`);

  return quickAgentInstance;
}

// Function to reload agent from database (useful when config changes)
export async function reloadQuickAgent(): Promise<Agent> {
  quickAgentInstance = null;
  return getQuickAgent();
}

// Function to analyze document with the agent (with memory support)
export async function quickChat(
  userMessage: string,
  documentContent?: string,
  threadId?: string,
  resourceId: string = 'default-user'
): Promise<string> {
  const agent = await getQuickAgent();
  
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

    BƯỚC 2: TRẢ LỜI CÂU HỎI CỦA NGƯỜI DÙNG DỰA TRÊN KIẾN THỨC VÀ HƯỚNG DẪN TRONG INSTRUCTION

    \n
    `;

    formattedPrompt += `
    LƯU Ý: 
    - Trong trường hơp người dùng không cung cấp nội dung tài liệu, hãy phân tích dựa trên các thông tin được cung cấp trong yêu cầu của người dùng.

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
