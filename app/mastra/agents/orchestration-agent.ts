import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { getDiscoveryAgent } from './new-discovery-agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

// Tool để gọi Discovery Agent
const discoveryAgentTool = createTool({
  id: 'discovery-agent-tool',
  description: `Gọi Discovery Agent để phân tích tài liệu và trích xuất requirements.
Sử dụng tool này khi người dùng yêu cầu:
- Phân tích tài liệu SRS, BRD
- Trích xuất requirements từ tài liệu
- Tìm kiếm và đánh giá requirements
- Phân loại functional/non-functional requirements
- Kiểm tra chất lượng tài liệu BA`,
  inputSchema: z.object({
    userMessage: z.string().describe('Yêu cầu của người dùng'),
    //referenceStandards: z.string().optional().describe('Nội dung tiêu chuẩn tham chiếu từ RAG database - sẽ được đặt trong tag <reference_standards>'),
    userDocument: z.string().optional().describe('Nội dung tài liệu đính kèm từ người dùng - sẽ được đặt trong tag <user_document>'),
  }),
  outputSchema: z.object({
    response: z.string().describe('Kết quả phân tích từ Discovery Agent'),
  }),
  execute: async ({ context }) => {
    const { userMessage, userDocument } = context;

    try {
      // Gọi Discovery Agent
      let formattedPrompt = '';

      // 1. SETUP: Định nghĩa vai trò (System Persona)
      formattedPrompt += `Xử lý yêu cầu sau của người dùng: ${userMessage}.\n\n`;

      // 2. Thêm dữ liệu đầu vào với các tag tương ứng
      //const hasReferenceStandards = referenceStandards && referenceStandards.length > 0;
      const hasUserDocument = userDocument && userDocument.length > 0;

      if (hasUserDocument) {
        formattedPrompt += `---\n`;
        formattedPrompt += `DỮ LIỆU ĐẦU VÀO:\n\n`;


        // Tag user_document chứa nội dung file đính kèm
        if (hasUserDocument) {
          formattedPrompt += `<user_document>\n`;
          formattedPrompt += `${userDocument}\n`;
          formattedPrompt += `</user_document>\n`;
        }

        // Tag reference_standards chứa thông tin từ RAG database
        // if (hasReferenceStandards) {
        //   formattedPrompt += `<reference_standards>\n`;
        //   formattedPrompt += `${referenceStandards}\n`;
        //   formattedPrompt += `</reference_standards>\n\n`;
        // }

        formattedPrompt += `---\n`;
        formattedPrompt += `
QUY TRÌNH THỰC HIỆN (BẮT BUỘC):
BƯỚC 1: QUÉT & TRÍCH XUẤT
- Quét toàn bộ <user_document> để tìm nội dung tương ứng với danh sách yêu cầu trong Instruction.
- Tập hợp thông tin rải rác thành khối thống nhất.

BƯỚC 2: KIỂM TRA TIÊU CHUẨN (VALIDATION) - QUAN TRỌNG NHẤT
- Với mỗi nội dung trích xuất được, hãy mở thẻ <reference_standards> để xem quy định cụ thể cho loại nội dung đó.
- Ví dụ: Nếu <reference_standards> quy định "Functional Requirement bắt buộc phải có ID, Tên, Mô tả, Input, Output":
  -> Bạn phải kiểm tra xem nội dung trong <user_document> có đủ 5 mục này không.

BƯỚC 3: BÁO CÁO KẾT QUẢ
- Nếu nội dung trong <user_document> đáp ứng đủ các mục trong <reference_standards> -> Ghi nhận: "Đầy đủ theo tiêu chuẩn".
- Nếu nội dung có nhưng thiếu mục con (VD: Có mô tả chức năng nhưng thiếu Input/Output) -> Ghi nhận: "Thiếu thông tin chi tiết: [Liệt kê các trường còn thiếu so với chuẩn]".
- Nếu hoàn toàn không tìm thấy thông tin -> Ghi nhận: "[Không tìm thấy thông tin trong tài liệu]".

Hãy bắt đầu phân tích ngay bây giờ. Trình bày kết quả rõ ràng, tách bạch giữa "Nội dung tìm thấy" và "Đánh giá thiếu sót".
`;
      }
      // const response = await analyzeDocument(
      //   userMessage,
      //   documentContent || '',
      // );

      console.log('[DiscoveryAgentTool] Formatted prompt:', formattedPrompt);
      const agent = await getDiscoveryAgent();
      const result = await agent.generate(formattedPrompt);

      console.log('[DiscoveryAgentTool] Response received from Discovery Agent');
      
      return {
        response: result.text,
      };
    } catch (error) {
      console.error('[DiscoveryAgentTool] Error:', error);
      return {
        response: `Lỗi khi gọi Discovery Agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  },
});

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

// Orchestration Agent Instructions
const ORCHESTRATION_INSTRUCTIONS = `
Bạn là Orchestration Agent - agent điều phối chính của hệ thống BA Agent.

## Vai trò:
- Nhận yêu cầu từ người dùng
- Phân tích và định tuyến yêu cầu đến agent phù hợp
- Tổng hợp và trả về kết quả cho người dùng

## Quy tắc:
1. LUÔN sử dụng tool "discovery-agent-tool" khi người dùng yêu cầu liên quan đến:
   - Phân tích tài liệu
   - Trích xuất requirements
   - Đánh giá chất lượng tài liệu BA
   - Câu hỏi về requirements, use cases, business rules
   - Tìm kiếm thông tin trong knowledge base

2. Khi gọi tool discovery-agent-tool:
   - userMessage: Truyền đầy đủ yêu cầu của người dùng
   - referenceStandards: (Optional) Nếu có thông tin tiêu chuẩn cụ thể cần truyền trực tiếp
   - userDocument: Truyền nội dung tài liệu đính kèm từ người dùng (nếu có)
   
   LƯU Ý: Discovery Agent đã được trang bị GraphRAG tool, sẽ TỰ ĐỘNG tìm kiếm và nạp context liên quan từ MongoDB knowledge base. KHÔNG CẦN phải truyền referenceStandards thủ công nữa trừ khi có dữ liệu cụ thể.

3. Phân biệt 2 loại dữ liệu:
   - referenceStandards: (Auto) Dữ liệu chuẩn từ hệ thống - Discovery Agent sẽ tự động lấy qua GraphRAG
   - userDocument: Dữ liệu từ người dùng (file đính kèm) - dữ liệu cần được phân tích

4. Sau khi nhận kết quả từ tool:
   - Nhận kết quả từ tool trả về và phản hồi lại cho người dùng.
   - Trả về kết quả dưới định dạng markdown.

## Lưu ý:
- Bạn là agent điều phối, KHÔNG tự xử lý dữ liệu
- Luôn delegate công việc cho các agent chuyên biệt
- Discovery Agent có khả năng tự động truy xuất context từ RAG database
`;

// Static agent instance for Mastra registration (enables tracing)
export const orchestrationAgent = new Agent({
  name: 'orchestration-agent',
  instructions: ORCHESTRATION_INSTRUCTIONS,
  model: google('gemini-2.0-flash-lite'),
  memory: memory,
  tools: {
    discoveryAgentTool,
  },
});

console.log('[OrchestrationAgent] Static agent instance created');

// Main function to process user request through orchestration

