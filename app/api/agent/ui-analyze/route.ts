import { uiAgent } from "@/app/mastra/agents/ui-agent";
import { generateThreadId } from "@/app/mastra/analysis-agent";
import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config();
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001"
//const apiUrl = `${baseUrl}/agent_response/get_response`
//const apiUrl = `${baseUrl}/agent_response/get_discovery_response`
const apiUrl = `${baseUrl}/agent_response/get_branching_response`

export async function POST(request: NextRequest) {
    const { message, documentContent, threadId, resourceId, phaseId } = await request.json();


    let combinedMessage = message;
    if(documentContent && documentContent.trim().length > 0) {
      combinedMessage = `${message}\n\n
      ĐÂY LÀ TÀI LIỆU CẦN PHÂN TÍCH:\n
      <user_document>\n
      ${documentContent}
      </user_document>\n`;
    }
    if (!message) {
        return NextResponse.json(
            { error: 'Message is required' },
            { status: 400 }
        );
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: combinedMessage,
          phase_id: phaseId,
          thread_id: threadId,
        }),
        // THÊM DÒNG NÀY: Tăng signal timeout (ví dụ 10 phút)
        // Lưu ý: Cần Node.js v17.3+ để dùng AbortSignal.timeout
        signal: AbortSignal.timeout(600000),
    });


    const data = await response.json(); 
    console.log("JSON get from agent_response: ", data);
    // Lúc này data sẽ là: { "message": "Nội dung string dài..." }
    let text = "";

    // if(Array.isArray(data.message)) {
    //   text = data.message[0]?.text ||  "";  //"".join(content_list) data.message[0] ||
    // } else {
    //   text = data.message || "";
    // }

    

    if(Array.isArray(data.message)) {
      text = data.message[0]?.text ||  data.message[0] || "";
      if(data.message.length > 1) {
        for(let i=1; i<data.message.length; i++){
          text += "\n\n";
          text += data.message[i];
        }
      } 
    } else {
      text = data.message || "";
    }
    

    console.log("=======Data from FastAPI:=========", text);
 

    // // Tạo prompt chi tiết cho phân tích UI/UX
    // const prompt = generateUiAnalyzePrompt(message, documentContent || '');

    // console.log("=======prompt get from ui-analyze:=========", prompt);
    // // Gọi UI Agent với prompt đã được format
    // const response = await uiAgent.generate(prompt, {
    //     threadId: threadId || generateThreadId(),
    //     resourceId: resourceId || 'default-user',
    // });

    return NextResponse.json({
        success: true,
        response: text,
        threadId: threadId || generateThreadId(),
    });
}


function generateUiAnalyzePrompt(message: string, documentContent: string) {
  let formattedPrompt = `Yêu cầu của người dùng: ${message}\n\n`;

  if (documentContent && documentContent.length > 0) {
    formattedPrompt += `---\n`;
    formattedPrompt += `TÀI LIỆU ĐƯỢC CUNG CẤP:\n\n`;
    formattedPrompt += `${documentContent}\n`;
    formattedPrompt += `---\n\n`;
    
    formattedPrompt += `
HƯỚNG DẪN:
- Đọc kỹ nội dung trong <user_document> (nếu có) để hiểu chức năng cần phân tích
- Sử dụng thông tin trong <reference_standards> (nếu có) để áp dụng các tiêu chuẩn phù hợp
- Phân tích UI/UX chi tiết dựa trên tài liệu được cung cấp
- Trả lời theo định dạng Markdown có cấu trúc rõ ràng
- Ưu tiên trình bày dưới dạng bảng. Nếu không thể trình bày dưới dạng bảng, mới trình bày dưới dạng danh sách.

Hãy bắt đầu phân tích ngay bây giờ!
`;
  } else {
    formattedPrompt += `
Người dùng chưa cung cấp tài liệu chi tiết.

HƯỚNG DẪN:
- Phân tích UI/UX dựa trên kiến thức chung về chức năng này
- Áp dụng các UI patterns và best practices phổ biến
- Trả lời theo định dạng Markdown có cấu trúc rõ ràng

Hãy bắt đầu phân tích ngay bây giờ!
`;
  }

  return formattedPrompt;
}