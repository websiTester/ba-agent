import { Agent } from '@mastra/core/agent';
import { MCPClient } from '@mastra/mcp';
import { google } from '@ai-sdk/google';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import dotenv from 'dotenv';
import { chunkDocument } from './chunk-agent';
import { parseJson } from '../utils/json-parser';

// Load environment variables
dotenv.config();

// Configure Memory with LibSQL storage
const memory = new Memory({
  storage: new LibSQLStore({
    url: 'file:./obsidian-memory.db',
  }),
  options: {
    lastMessages: 30,
    workingMemory: {
      enabled: true,
      template: `# Working Memory
- Current vault: {{currentVault}}
- Recent notes: {{recentNotes}}
- User preferences: {{userPreferences}}
`,
    },
  },
});

console.log('[ObsidianMCP] Initializing...');

// Create MCP Client for Obsidian
let obsidianMcpClient: MCPClient | null = null;

async function getObsidianMcpClient(): Promise<MCPClient> {
  if (obsidianMcpClient) {
    return obsidianMcpClient;
  }

  var obsidienKey = process.env.OBSIDIAN_API_KEY + "";
  var obsidianUrl = process.env.OBSIDIAN_BASE_URL + "";

   obsidianMcpClient = new MCPClient({
    id: "obsidian-mcp-server-client",
    timeout: 600000,
    servers: {
      "obsidian-mcp-server": {
        command: "npx",
        args: ["obsidian-mcp-server"],
        env: {
          OBSIDIAN_API_KEY: obsidienKey,
          OBSIDIAN_BASE_URL: obsidianUrl,
          OBSIDIAN_VERIFY_SSL: "false",
          OBSIDIAN_ENABLE_CACHE: "true"
        }
      }
    }
  });

  console.log('[ObsidianMCP] MCP Client created successfully');
  return obsidianMcpClient;
}

// Default instructions for Obsidian Agent
const OBSIDIAN_AGENT_INSTRUCTIONS = `
Bạn là một AI assistant chuyên quản lý và tương tác với Obsidian vault.

## Khả năng của bạn:
Tự động set tham số "wholeFileMode" = override và overwriteIfExists = true khi sử dụng tool.
1. **Đọc notes**: Đọc nội dung các ghi chú trong vault
2. **Tạo notes mới**: Tạo các ghi chú mới với nội dung được cung cấp
3. **Cập nhật notes**: Chỉnh sửa nội dung các ghi chú hiện có
4. **Tìm kiếm**: Tìm kiếm notes theo nội dung hoặc tags
5. **Quản lý vault**: Liệt kê và tổ chức các notes
6. **Xóa nội dung trong note**: Trong trường hợp người dùng yêu cầu xóa 1 phần nội dung nào đó trong note, Override phần nội dung cần delete đó trong note bằng chuỗi string rỗng "".
7. **Override note**: Bạn đã được phép override note nếu note đã tồn tại, tự động set tham số overwriteIfExists = true khi sử dụng tool.
8. **Update note**: Sử dụng phương án cập nhật toàn bộ note để thay thế nếu thay thế bình thường không hoạt động.

## Quy tắc:
- Luôn xác nhận trước khi ghi đè hoặc xóa nội dung
- Sử dụng Markdown format chuẩn của Obsidian
- Hỗ trợ wikilinks [[note]] và tags #tag
- Giữ nguyên cấu trúc và format của vault

## Lưu ý:
- Khi lưu requirements hoặc analysis results, tạo note với tiêu đề và metadata phù hợp
- Sử dụng frontmatter YAML cho metadata
- Đặt notes trong folder phù hợp nếu được yêu cầu


`;

// const OBSIDIAN_AGENT_INSTRUCTIONS = `
// Bạn là 1 trợ lý hữu ích chuyên về quản lý ghi chú và thông tin cá nhân trong Obsidian. Khi trả lời:
//           - Tự động set tham số "wholeFileMode" = override và overwriteIfExists = true khi sử dụng tool.
//           - Nếu người dùng hỏi về ghi chú, hãy cung cấp thông tin chi tiết về ghi chú đó.
//           - Nếu người dùng muốn tạo ghi chú mới, hãy hướng dẫn họ qua quá trình tạo ghi chú.
//           - Nếu người dùng muốn tìm kiếm ghi chú, hãy giúp họ tìm kiếm dựa trên từ khóa hoặc thẻ.
//           - Trong trường hợp người dùng yêu cầu xóa 1 phần nội dung nào đó trong note, Override phần nội dung cần delete đó trong note bằng chuỗi string rỗng "".
//           - Bạn đã được phép override note nếu note đã tồn tại, tự động set tham số overwriteIfExists = true khi sử dụng tool.
//           - Sử dụng phương án cập nhật toàn bộ note để thay thế nếu thay thế bình thường không hoạt động.

//   Sử lý khi gặp lỗi tự động sử dụng phương án sau: 
//         - Trong trường hợp công cụ tìm kiếm và thay thế vẫn đang gặp vấn đề không xác định.
//         - Giải quyết vấn đề này, sử dụng phương án cập nhật toàn bộ note để update, delete phần nội dung mà người dùng yêu cầu.
// `;

// Cached agent instance
let obsidianAgentInstance: Agent | null = null;

// Factory function to get or create the Obsidian Agent
export async function getObsidianAgent(): Promise<Agent> {
  if (obsidianAgentInstance) {
    return obsidianAgentInstance;
  }

  try {
    // Get MCP client and its tools
    const mcpClient = await getObsidianMcpClient();
    const toolsets = await mcpClient.getTools();
    
    console.log('[ObsidianAgent] Available toolsets:', Object.keys(toolsets));

    obsidianAgentInstance = new Agent({
      name: 'Obsidian Agent',
      instructions: OBSIDIAN_AGENT_INSTRUCTIONS,
      model: "google/gemini-2.5-flash-lite",
      memory: memory,
      tools: toolsets,
    });

    console.log('[ObsidianAgent] Agent created with MCP tools');
    return obsidianAgentInstance;
  } catch (error) {
    console.error('[ObsidianAgent] Error creating agent:', error);
    
    // Fallback: create agent without MCP tools
    obsidianAgentInstance = new Agent({
      name: 'Obsidian Agent',
      instructions: OBSIDIAN_AGENT_INSTRUCTIONS + '\n\n⚠️ MCP connection failed. Running in limited mode.',
      model: "google/gemini-2.5-flash-lite",
      memory: memory,
    });
    
    return obsidianAgentInstance;
  }
}

// Function to reload agent (useful when MCP connection changes)
export async function reloadObsidianAgent(): Promise<Agent> {
  obsidianAgentInstance = null;
  obsidianMcpClient = null;
  return getObsidianAgent();
}

// Function to save content to Obsidian
export async function saveToObsidian(
  content: string,
  title: string,
  folder?: string,
  threadId?: string,
  resourceId: string = 'default-user'
): Promise<string> {
  const agent = await getObsidianAgent();
  
  const timestamp = new Date().toISOString().split('T')[0];
  const notePath = folder ? `${folder}/${title}` : title;
  
//   const prompt = `
// Lưu nội dung sau vào Obsidian vault:

// **Tiêu đề note:** ${title}
// **Đường dẫn:** ${notePath}
// **Ngày tạo:** ${timestamp}

// **Nội dung cần lưu:**
// \`\`\`
// ${content}
// \`\`\`

// Hãy tạo note với định dạng .md chuẩn của Obsidian bao gồm:
// - title: ${title}
// - date: ${timestamp}
// - tags: [ba-agent, auto-generated]

// Sau đó là nội dung chính.
// `;

const jsonChunk = await chunkDocument(content);
const data = parseJson(jsonChunk);

console.log('==========DATA==========\n'+ data);
const effectiveThreadId = threadId || `obsidian-session`;

let text = '';
// data.map(async (item: any) => {
//   console.log('==========ITEM==========\n'+ item.header);

//   const prompt = `
//   Tạo note mới có Title là ${item.header} có định dạng markdown vào folder /1 - Rough Note/E-commerce Analyze Result trong obsidian, đảm bảo note mới là file markdown có đuôi .md.
//   Tự động set tham số "wholeFileMode" = override và overwriteIfExists = true khi sử dụng tool.
//   Sau khi note được tạo, ghi đè nội dung bên trong note là:
//       ${item.content}.
//       Trong trường hợp folder chưa được khởi tạo, tự động tạo folder tương ứng để lưu trữ note.
//       Tự động chuyển nội dung sang định dạng markdown nếu cần thiết.
//   `;

//   const itemResponse = await agent.generate(prompt, {
//     threadId: effectiveThreadId,
//     resourceId: resourceId,
//   });
//   text += itemResponse.text + '\n';
// });

for (const item of data) {
  console.log('==========ITEM==========\n'+ item.header);

  const prompt = `
  Tạo note mới có Title là ${item.header} có định dạng markdown vào folder /1 - Rough Note/E-commerce Analyze Result trong obsidian, đảm bảo note mới là file markdown có đuôi .md.
  Tự động set tham số "wholeFileMode" = override và overwriteIfExists = true khi sử dụng tool.
  Sau khi note được tạo, ghi đè nội dung bên trong note là:
      ${item.content}.
      Trong trường hợp folder chưa được khởi tạo, tự động tạo folder tương ứng để lưu trữ note.
      Tự động chuyển nội dung sang định dạng markdown nếu cần thiết.
  `;

  // Code sẽ dừng ở đây chờ agent chạy xong mới qua item tiếp theo
  const response = await agent.generate(prompt, {
    threadId: effectiveThreadId,
    resourceId: resourceId,
  });
  text += response.text + '\n';
}


  
  // Sử dụng threadId để memory ghi nhớ note đã lưu

  
  // const response = await agent.generate(prompt, {
  //   threadId: effectiveThreadId,
  //   resourceId: resourceId,
  // });
  const response = {text: text};
  console.log(`[ObsidianAgent] Saving successfully - Note: ${title}`);
  return response.text;
}

// Function to search notes in Obsidian
export async function searchObsidian(
  query: string,
  threadId?: string,
  resourceId: string = 'default-user'
): Promise<string> {
  const agent = await getObsidianAgent();
  
  const prompt = `Tìm kiếm trong Obsidian vault với query: "${query}"
  
Liệt kê các notes liên quan và tóm tắt nội dung của chúng.`;

  const response = await agent.generate(prompt, {
  //   memory: {
  //     thread: "user-session", // Use actual user/session ID
  //     resource: "obsidian-chat",
  // }
    threadId: threadId || `obsidian-search-${Date.now()}`,
    resourceId: resourceId,
  });
  
  return response.text;
}


// Function to chat with Obsidian Agent (general purpose)
export async function chatWithObsidian(
  message: string,
  threadId?: string,
  resourceId: string = 'default-user'
): Promise<string> {
  const agent = await getObsidianAgent();

  // Sử dụng message trực tiếp - context đã được thêm từ ChatPanel
  const prompt = `
Thực hiện yêu cầu sau của người dùng: ${message}

Lưu ý quan trọng:
- Tự động set tham số "wholeFileMode" = override và overwriteIfExists = true khi sử dụng tool.
- Nếu người dùng đề cập đến "nội dung này", "phần này", "note này" mà không chỉ rõ, hãy dựa vào Context được cung cấp ở trên.
- Trong trường hợp người dùng yêu cầu update, xóa nội dung trong note: thực hiện theo instruction.
- Bạn đã được phép override note nếu note đã tồn tại.

Sử lý khi gặp lỗi:
- Trong trường hợp công cụ tìm kiếm và thay thế vẫn đang gặp vấn đề không xác định.
- Giải quyết vấn đề này, sử dụng phương án cập nhật toàn bộ note để update, delete phần nội dung mà người dùng yêu cầu.
`;

  // Sử dụng threadId cố định để memory hoạt động đúng
  const effectiveThreadId = threadId || `obsidian-session`;
  
  console.log(`[ObsidianAgent] Chat with threadId: ${effectiveThreadId}, resourceId: ${resourceId}`);
  
  const response = await agent.generate(prompt, {
    threadId: effectiveThreadId,
    resourceId: resourceId,
  });
  
  console.log(`[ObsidianAgent] Chat response generated`);
  return response.text;
}

// Function to disconnect MCP client
export async function disconnectObsidianMcp(): Promise<void> {
  if (obsidianMcpClient) {
    await obsidianMcpClient.disconnect();
    obsidianMcpClient = null;
    obsidianAgentInstance = null;
    console.log('[ObsidianMCP] Disconnected');
  }
}

// Helper function to generate thread ID for Obsidian
export function generateObsidianThreadId(): string {
  return `obsidian-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

