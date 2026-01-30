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
    if(selectedTools && selectedTools.length > 0) {
    selectedTools.map((item:any) => {
      toolPrompt += `Sử dụng tool ${item.label} để sử lý yêu cầu: ${item.toolPrompt}\n\n`
    })
  }

    const tools  =  `${toolPrompt}.\n`;
    
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
    
    // Create abort controller with longer timeout (15 minutes = 900000ms)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 900000); // 15 minutes
    
    try {
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
            signal: controller.signal,
            // Additional options for better timeout handling
            keepalive: true,
        });

        clearTimeout(timeoutId); // Clear timeout if request succeeds

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

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
    } catch (error: any) {
        clearTimeout(timeoutId); // Clear timeout on error
        
        console.error('Error calling agent:', error);
        
        // Handle specific timeout errors
        if (error.name === 'AbortError') {
            return NextResponse.json(
                { 
                    error: 'Request timeout - Agent took too long to respond. Please try again.',
                    success: false 
                },
                { status: 504 }
            );
        }
        
        // Handle other errors
        return NextResponse.json(
            { 
                error: error.message || 'Failed to process request',
                success: false 
            },
            { status: 500 }
        );
    }
}
