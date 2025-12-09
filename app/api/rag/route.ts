import { searchRelevantChunks, getRAGContext } from "@/app/mastra/rag-service";
import { getChunksByPhaseId } from "@/app/db/chunks";
import { NextRequest, NextResponse } from "next/server";

// POST - Search relevant chunks cho query
export async function POST(request: NextRequest) {
  try {
    const { query, phaseId, limit = 5 } = await request.json();

    if (!query || !phaseId) {
      return NextResponse.json(
        { error: "query and phaseId are required" }, 
        { status: 400 }
      );
    }

    // Search relevant chunks
    const { chunks, scores } = await searchRelevantChunks(query, phaseId, limit);

    // Format results
    const results = chunks.map((chunk, index) => ({
      id: chunk._id?.toString(),
      fileId: chunk.fileId,
      fileName: chunk.fileName,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      totalChunks: chunk.totalChunks,
      metadata: chunk.metadata,
      score: scores[index],
    }));

    return NextResponse.json({
      success: true,
      query,
      phaseId,
      results,
      totalResults: results.length,
    });
  } catch (error) {
    console.error("Error searching chunks:", error);
    return NextResponse.json({ error: "Failed to search chunks" }, { status: 500 });
  }
}

// GET - Get RAG context cho query (formatted string để inject vào prompt)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const phaseId = searchParams.get('phaseId');
    const maxChunks = parseInt(searchParams.get('maxChunks') || '5');

    if (!query || !phaseId) {
      return NextResponse.json(
        { error: "query and phaseId are required" }, 
        { status: 400 }
      );
    }

    // Get formatted context string
    const context = await getRAGContext(query, phaseId, maxChunks);

    return NextResponse.json({
      success: true,
      query,
      phaseId,
      context,
      hasContext: context.length > 0,
    });
  } catch (error) {
    console.error("Error getting RAG context:", error);
    return NextResponse.json({ error: "Failed to get RAG context" }, { status: 500 });
  }
}

