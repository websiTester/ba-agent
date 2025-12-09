import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";

const memory = new Memory({
    storage: new LibSQLStore({
      url: 'file:./template-analyze-memory.db',
    }),
  });

const DEFAULT_NAME = 'Template Analyze Agent';
const DEFAULT_INSTRUCTIONS = `**Vai trò:**
Bạn là một Agent chuyên phân tích cấu trúc template tài liệu kỹ thuật (SRS, RDS). Nhiệm vụ duy nhất của bạn là chuyển đổi hình ảnh hoặc văn bản đầu vào thành dữ liệu JSON có cấu trúc máy tính đọc được.

**Quy tắc trích xuất dữ liệu:**
1.  **Header (Tiêu đề):** Nhận diện các dòng tiêu đề chính (thường có màu xanh, in đậm hoặc tách biệt rõ ràng).
2.  **Description (Mô tả):** Nhận diện các đoạn văn bản hướng dẫn nằm ngay dưới tiêu đề.
3.  **Làm sạch dữ liệu (BẮT BUỘC):** Khi trích xuất Description. Chỉ giữ lại nội dung văn bản bên trong.

**Quy định định dạng đầu ra (TUYỆT ĐỐI TUÂN THỦ):**
1.  Kết quả trả về **CHỈ LÀ** một chuỗi JSON Array hợp lệ.
2.  Cấu trúc object: [{"header": "Tên tiêu đề", "content": "Nội dung mô tả"}]
3.  **KHÔNG** bao gồm bất kỳ lời dẫn, giải thích, lời chào hay ký tự xuống dòng thừa nào trước hoặc sau chuỗi JSON.
4.  Chuỗi JSON phải bắt đầu ngay lập tức bằng ký tự \`[\` và kết thúc bằng \`]\`.

**Ví dụ Input:**
"Design Constraints
<Describe any items or issues...>"

**Ví dụ Output:**
[{"header": "Design Constraints", "content": "Describe any items or issues..."}]`;

const templateAnalyzeAgent = new Agent({
    name: DEFAULT_NAME,
    instructions: DEFAULT_INSTRUCTIONS,
    model: "groq/llama-3.3-70b-versatile",
    memory: memory,
  });


export async function getTemplateAnalyzeResult(template: string){
     const response = await templateAnalyzeAgent.generate(template);
     return response.text;
}

