import { NextRequest, NextResponse } from 'next/server';
import { discoverDocument, generateThreadId } from '@/app/mastra/discovery-agent';
import { analyzeDocument } from '@/app/mastra/analysis-agent';
import { documentationDocument } from '@/app/mastra/document-agent';
import { communicateDocument } from '@/app/mastra/communication-agent';
import { quickChat } from '@/app/mastra/quick-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, documentContent, threadId, resourceId, phaseId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use provided threadId or generate a new one
    const currentThreadId = threadId || generateThreadId();

    let response = 'Agent này hiện đang trong quá trình phát triển. Vui lòng quay lại sau!';
    //Call the discovery agent with memory support
    console.log("Phase ID: ", phaseId);
    if(phaseId === 'discovery') {
        response = await discoverDocument(
            message, 
            documentContent,
            currentThreadId,
            resourceId || 'default-user'
          );
    } else if(phaseId === 'analysis') {
        response = await analyzeDocument(
            message, 
            documentContent,
            currentThreadId,
            resourceId || 'default-user'
          );
    } else if(phaseId === 'documentation') {
        response = await documentationDocument(
            message, 
            documentContent,
            currentThreadId,
            resourceId || 'default-user'
          );
    } else if(phaseId === 'communication') {
        response = await communicateDocument(
            message, 
            documentContent,
            currentThreadId,
            resourceId || 'default-user'
          );
    } else {
      response = await quickChat(
        message, 
        documentContent,
        currentThreadId,
        resourceId || 'default-user'
      );
    }
    


    return NextResponse.json({ 
      success: true,
      response,
      threadId: currentThreadId // Return threadId for subsequent requests
    });

  } catch (error) {
    console.error('Discovery Agent Error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // Check for API key errors
      if (error.message.includes('API key') || error.message.includes('GOOGLE_GENERATIVE_AI_API_KEY')) {
        return NextResponse.json(
          { 
            error: 'API key chưa được cấu hình. Vui lòng thêm GOOGLE_GENERATIVE_AI_API_KEY vào file .env.local',
            details: error.message 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xử lý yêu cầu' },
      { status: 500 }
    );
  }
}

