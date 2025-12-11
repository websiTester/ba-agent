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
const DEFAULT_NAME = 'Discovery & Requirements Agent';
const DEFAULT_INSTRUCTIONS = `
<instructions>
<role>
Bạn là một Senior Business Analyst (BA) chuyên nghiệp.
Nhiệm vụ cốt lõi của bạn là đọc tài liệu mô tả của người dùng và luôn luôn xác định hai danh sách:
1. Functional Requirements (Yêu cầu chức năng).
2. Non-functional Requirements (Yêu cầu phi chức năng).
</role>
 
<core_principles>
1. **Luôn đầy đủ:** Phải luôn trả về cả hai phần Functional và Non-functional, bất kể mô tả ngắn hay dài.
2. **Phân tích động (Dynamic Analysis):** Nội dung chi tiết của từng yêu cầu được xác định bởi cấu hình trong thẻ <requirements>.
3. **Chính xác:** Dựa vào <description> trong thẻ <requirement> để biết chính xác cần viết gì vào từng cột.
</core_principles>
 
 
<requirements>
<requirement>
<name>Mô tả chi tiết</name>
<description>Mô tả hành vi của hệ thống và tương tác của người dùng một cách cụ thể.</description>
</requirement>
 
<requirement>
<name>Lý do cần thiết</name>
<description>Tại sao chức năng này quan trọng với business? Nếu thiếu thì ảnh hưởng gì?</description>
</requirement>
 
<requirement>
<name>Rủi ro tiềm ẩn</name>
<description>Các lỗi kỹ thuật hoặc lỗ hổng logic có thể xảy ra với chức năng này.</description>
</requirement>
</requirements>
 
</instructions>
`;

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

  console.log('==========INSTRUCTIONS==========\n'+ instructions);
  discoveryAgentInstance = new Agent({
    name,
    instructions,
    model: "google/gemini-2.5-flash",
    memory: memory,
  });

  return discoveryAgentInstance;
}

// Function to reload agent from database (useful when config changes)
export async function reloadDiscoveryAgent(): Promise<Agent> {
  discoveryAgentInstance = null;
  return getDiscoveryAgent();
}

// Function to analyze document with the agent (with memory support)
export async function discoverDocument(
  userMessage: string,
  documentContent?: string,
  threadId?: string,
  resourceId: string = 'default-user'
): Promise<string> {
  const agent = await getDiscoveryAgent();
  
  let formattedPrompt = '';

  // 1. SETUP: Định nghĩa vai trò (System Persona)
  formattedPrompt += `Xử lý yêu cầu sau của người dùng: ${userMessage}.\n\n`;
  

  // if (documentContent && documentContent.length > 0) {
  //   formattedPrompt += `---\n`;
  //   formattedPrompt += `DỮ LIỆU ĐẦU VÀO:\n`;
  //   formattedPrompt += `${documentContent}\n`;
  //   formattedPrompt += `---\n`;
  //   formattedPrompt+=`
  //   QUY TRÌNH THỰC HIỆN (BẮT BUỘC):
  //   BƯỚC 1: QUÉT & TRÍCH XUẤT
  //   - Quét toàn bộ <user_document> để tìm nội dung tương ứng với danh sách yêu cầu trong Instruction.
  //   - Tập hợp thông tin rải rác thành khối thống nhất.

  //   BƯỚC 2: KIỂM TRA TIÊU CHUẨN (VALIDATION) - QUAN TRỌNG NHẤT
  //   - Với mỗi nội dung trích xuất được, hãy mở thẻ <reference_standards> để xem quy định cụ thể cho loại nội dung đó.
  //   - Ví dụ: Nếu <reference_standards> quy định "Functional Requirement bắt buộc phải có ID, Tên, Mô tả, Input, Output":
  //     -> Bạn phải kiểm tra xem nội dung trong <user_document> có đủ 5 mục này không.

  //   BƯỚC 3: BÁO CÁO KẾT QUẢ
  //   - Nếu nội dung trong <user_document> đáp ứng đủ các mục trong <reference_standards> -> Ghi nhận: "Đầy đủ theo tiêu chuẩn".
  //   - Nếu nội dung có nhưng thiếu mục con (VD: Có mô tả chức năng nhưng thiếu Input/Output) -> Ghi nhận: "Thiếu thông tin chi tiết: [Liệt kê các trường còn thiếu so với chuẩn]".
  //   - Nếu hoàn toàn không tìm thấy thông tin -> Ghi nhận: "[Không tìm thấy thông tin trong tài liệu]".

  //   Hãy bắt đầu phân tích ngay bây giờ. Trình bày kết quả rõ ràng, tách bạch giữa "Nội dung tìm thấy" và "Đánh giá thiếu sót".
        
  //   `;
   
  // }



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

    BƯỚC 2: ĐỀ XUẤT FUNCTIONAL REQUIREMENTS (FR)
    Với mỗi chức năng được mô tả, tạo các FR tương ứng với từng mô tả

    BƯỚC 3: ĐỀ XUẤT NON-FUNCTIONAL REQUIREMENTS (NFR)
    Dựa trên mô tả, đề xuất các NFR phù hợp với từng yêu cầu chức năng được đề xuất dựa trên các nhóm:
    - **Performance (PER)**: Yêu cầu về hiệu năng, thời gian phản hồi
    - **Security (SEC)**: Yêu cầu về bảo mật, xác thực, phân quyền
    - **Usability (USA)**: Yêu cầu về trải nghiệm người dùng
    - **Reliability (REL)**: Yêu cầu về độ tin cậy, khả năng phục hồi
    - **Scalability (SCA)**: Yêu cầu về khả năng mở rộng
    - **Compatibility (COM)**: Yêu cầu về tương thích

    BƯỚC 4: OUTPUT - ĐỊNH DẠNG KẾT QUẢ

    Trình bày kết quả theo format sau:

    ## 📋 TỔNG QUAN
    - Tên hệ thống/module: [Tên]
    - Số lượng FR: [X]
    - Số lượng NFR: [X]

    ## 🔧 FUNCTIONAL REQUIREMENTS

    {Nội dung phân tích của FUNCTIONAL REQUIREMENTS}

    ## ⚙️ NON-FUNCTIONAL REQUIREMENTS
    {Nội dung phân tích của NON-FUNCTIONAL REQUIREMENTS}
    \n
    `;

    formattedPrompt += `
    LƯU Ý: 
    - Trong trường hơp người dùng không cung cấp nội dung tài liệu, hãy phân tích dựa trên các thông tin được cung cấp trong yêu cầu của người dùng.
    Hãy bắt đầu phân tích ngay bây giờ.
    - CHỉ trình bày nội dung của FUNCTIONAL REQUIREMENTS và NON-FUNCTIONAL REQUIREMENTS, đúng 1 lần duy nhất.
    `;
   
  }

  let prompt = formattedPrompt;
  
  console.log('==========PROMPT==========\n'+ prompt);
  const response = await agent.generate(prompt, {
    threadId: threadId || `default-thread-${Date.now()}`, // Ensure threadId is never undefined
    resourceId: resourceId, // User/session identifier
  });
  
  console.log(`[DiscoveryAgent] Response generated successfully`);
  return response.text;
}

// Helper function to create a new thread ID
export function generateThreadId(): string {
  return `thread-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
