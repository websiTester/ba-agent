import { NextRequest, NextResponse } from 'next/server';
import { 
  getObsidianAgent, 
  saveToObsidian, 
  generateObsidianThreadId, 
  chatWithObsidian
} from '@/app/mastra/obsidian-agent';

// POST - General interaction with Obsidian Agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, message, content, title, folder, threadId, resourceId } = body;

    const currentThreadId = threadId || generateObsidianThreadId();

    switch (action) {
      case 'save': {
        // Save content to Obsidian vault
        if (!content || !title) {
          return NextResponse.json(
            { error: 'Content and title are required for save action' },
            { status: 400 }
          );
        }

        const response = await saveToObsidian(
          content,
          title,
          folder,
          currentThreadId,
          resourceId || 'default-user'
        );

        return NextResponse.json({
          success: true,
          response,
          threadId: currentThreadId,
          action: 'save'
        });
      }

      case 'chat': {
        // Chat with Obsidian Agent
        if (!message) {
          return NextResponse.json(
            { error: 'Message/query is required for search action' },
            { status: 400 }
          );
        }

        const response = await chatWithObsidian(
          message,
          currentThreadId,
          resourceId || 'default-user'
        );

        return NextResponse.json({
          success: true,
          response,
          threadId: currentThreadId,
          action: 'chat'
        });
      }

      default: {
        // General chat with Obsidian Agent
        if (!message) {
          return NextResponse.json(
            { error: 'Message is required' },
            { status: 400 }
          );
        }

        const agent = await getObsidianAgent();
        const response = await agent.generate(message, {
          threadId: currentThreadId,
          resourceId: resourceId || 'default-user',
        });

        return NextResponse.json({
          success: true,
          response: response.text,
          threadId: currentThreadId,
          action: 'chat'
        });
      }
    }

  } catch (error) {
    console.error('Obsidian Agent Error:', error);

    if (error instanceof Error) {
      // Check for MCP connection errors
      if (error.message.includes('MCP') || error.message.includes('connection')) {
        return NextResponse.json(
          {
            error: 'Không thể kết nối với Obsidian MCP Server. Kiểm tra Obsidian Local REST API plugin và cấu hình .env',
            details: error.message
          },
          { status: 503 }
        );
      }

      // Check for API key errors
      if (error.message.includes('API key') || error.message.includes('OBSIDIAN_API_KEY')) {
        return NextResponse.json(
          {
            error: 'OBSIDIAN_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env',
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

// GET - Check Obsidian Agent status
export async function GET() {
  try {
    const agent = await getObsidianAgent();
    
    return NextResponse.json({
      status: 'connected',
      agentName: agent.name,
      message: 'Obsidian Agent is ready'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

