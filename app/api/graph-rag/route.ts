import { mastra } from "@/app/mastra";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { query, fileId, phaseId, limit = 5 } = await request.json();
       
        if (!query) {
            return NextResponse.json(
                { error: 'Input is required' },
                { status: 400 }
            );
        }

        const runtimeContext = new RuntimeContext<{
            filter: any;
            topK: number;
            vectorStoreName: string;
            indexName: string;
          }>();

        if(fileId){
            runtimeContext.set("filter", { fileId: fileId });
        }

        runtimeContext.set("topK", limit);
        runtimeContext.set("vectorStoreName", "pgVector");
        runtimeContext.set("indexName", "ba_agent_chunks_document");




        const agent = mastra.getAgent('ragGraphAgent');
        const response = await agent.generate(`Các thông tin liên quan đến yêu cầu sau của người dùng: ${query}?`,{
            runtimeContext,
        });
        
        return NextResponse.json({ text: response.text });
    } catch (error) {
        console.error('[GraphRAG API] Error:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
            },
            { status: 500 }
        );
    }
}