import { chunkDocument } from "@/app/mastra/chunk-agent";
import { generateObsidianThreadId } from "@/app/mastra/obsidian-agent";
import { downloadDocument } from "@/app/utils/download";
import { parseJson } from "@/app/utils/json-parser";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const { content, threadId, resourceId, phaseName } = body;
  
      const currentThreadId = threadId || generateObsidianThreadId();

  
      const jsonChunk = await chunkDocument(content);
      const data = parseJson(jsonChunk);
      
      
      return NextResponse.json({
        success: true,
        data,
        threadId: currentThreadId,
        action: 'chunk-and-download'
      });
  
    } catch (error) {
  
      return NextResponse.json(
        { error: 'Đã xảy ra lỗi khi xử lý yêu cầu' },
        { status: 500 }
      );
    }
  }