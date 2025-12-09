import { analyzeDocument, generateThreadId } from '@/app/mastra/analysis-agent';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, documentContent, threadId, resourceId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use provided threadId or generate a new one
    const currentThreadId = threadId || generateThreadId();

    //Call the discovery agent with memory support
    const response = await analyzeDocument(
      message, 
      documentContent,
      currentThreadId,
      resourceId || 'default-user'
    );

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

