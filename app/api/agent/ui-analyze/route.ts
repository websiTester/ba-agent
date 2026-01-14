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
    const { message,selectedTools, documentContent, threadId, phaseId } = await request.json();

    let toolPrompt = "";
    selectedTools.map((item:any) => {
      toolPrompt += `Sử dụng tool ${item.label} để sử lý yêu cầu: ${item.toolPrompt}\n\n`
    })

    const tools  =  `${toolPrompt}.\n
                     Nếu tool không thể sử lý yêu cầu, trả về cho người dùng: Tool không thể sử lý yêu cầu này, vui lòng chọn tool khác.`;
    
    let combinedMessage = `Sử lý yêu cầu sau của người dùng: ${message} \n\n ${tools} \n\n`;
    
    if(documentContent && documentContent.trim().length > 0) {
      combinedMessage += `
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

    console.log("COMBINED MESSAGE: "+combinedMessage);
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
        signal: AbortSignal.timeout(6000000),
    });


    const data = await response.json(); 
    console.log("JSON get from agent_response: ", data);
    // Lúc này data sẽ là: { "message": "Nội dung string dài..." }
    let text = "";    

    // if(Array.isArray(data.message)) {
    //   text = data.message[0]?.text ||  data.message[0] || "";
    //   if(data.message.length > 1) {
    //     for(let i=1; i<data.message.length; i++){
    //       text += "\n\n";
    //       text += data.message[i];
    //     }
    //   } 
    // } else {
    //   text = data.message || "";
    // }
    
    console.log("=======Data from FastAPI:=========", data.message);
    
    return NextResponse.json({
        success: true,
        response: data.message,
        threadId: threadId || generateThreadId(),
    });
}
