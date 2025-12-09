import { google } from '@ai-sdk/google';
import { embed, embedMany } from 'ai';
import { MDocument } from '@mastra/rag';
import { DocumentChunk, saveChunks, cosineSimilaritySearch, deleteChunksByFileId } from '../db/chunks';

// Embedding model configuration
const EMBEDDING_MODEL = 'text-embedding-004';

// Chunking configuration
const CHUNK_SIZE = 1000;        // Max characters per chunk
const CHUNK_OVERLAP = 200;      // Overlap between chunks để preserve context

// Interface for processed document
interface ProcessedDocument {
  content: string;
  fileName: string;
  fileType: string;
  mimeType: string;
}

/**
 * Document chunking using Mastra
 * Chia document thành chunks để embedding
 */
export async function chunkDocument(content: string, documentType: string): Promise<string[]> {
  // Create MDocument based on document type
  let doc: MDocument;
  
  if (documentType === 'md' || documentType === 'markdown') {
    doc = MDocument.fromMarkdown(content);
  } else if (documentType === 'html') {
    doc = MDocument.fromHTML(content);
  } else {
    doc = MDocument.fromText(content);
  }
  
  // Choose chunking strategy based on document type
  const chunkOptions = documentType === 'md' || documentType === 'markdown'
    ? { strategy: 'markdown' as const, maxSize: CHUNK_SIZE, overlap: CHUNK_OVERLAP }
    : { strategy: 'recursive' as const, maxSize: CHUNK_SIZE, overlap: CHUNK_OVERLAP, separators: ['\n\n', '\n', '. ', ', ', ' '] };
  
  const chunks = await doc.chunk(chunkOptions);
  
  // Extract text content from chunks (ignore Mastra's internal metadata)
  return chunks
    .map(chunk => typeof chunk === 'string' ? chunk : (chunk.text || ''))
    .filter(text => text.trim().length > 0);
}

/**
 * Generate embedding cho text sử dụng Google's embedding model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  console.log(`[RAG] Generating embedding for text: ${text}`);
  try {
    const { embedding } = await embed({
      value: text,
      model: google.textEmbeddingModel(EMBEDDING_MODEL),
      
    });
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings cho nhiều texts cùng lúc (batch processing)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel(EMBEDDING_MODEL),
      values: texts,
    });
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Process document: chunk, embed, và save to database
 */
export async function processDocument(
  fileId: string,
  phaseId: string,
  document: ProcessedDocument
): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
  try {
    console.log(`[RAG] Processing document: ${document.fileName}`);
    
    // 1. Chunk document using Mastra
    const chunks = await chunkDocument(document.content, document.fileType);
    console.log(`[RAG] Created ${chunks.length} chunks`);
    
    if (chunks.length === 0) {
      return { success: true, chunksCreated: 0 };
    }
    
    // 2. Generate embeddings cho tất cả chunks (batch processing)
    console.log(`[RAG] Generating embeddings...`);
    const embeddings = await generateEmbeddings(chunks);
    
    // 3. Prepare chunks for database
    const dbChunks: Omit<DocumentChunk, "_id">[] = chunks.map((content, index) => ({
      fileId,
      phaseId,
      fileName: document.fileName,
      content,
      chunkIndex: index,
      totalChunks: chunks.length,
      metadata: {
        documentType: document.fileType,
      },
      embedding: embeddings[index],
      embeddingModel: EMBEDDING_MODEL,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    // 4. Save to MongoDB
    console.log(`[RAG] Saving chunks to database...`);
    await saveChunks(dbChunks);
    
    console.log(`[RAG] Successfully processed ${document.fileName}: ${dbChunks.length} chunks created`);
    return { success: true, chunksCreated: dbChunks.length };
    
  } catch (error) {
    console.error('[RAG] Error processing document:', error);
    return { 
      success: false, 
      chunksCreated: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete document chunks (khi xóa file)
 */
export async function deleteDocumentChunks(fileId: string): Promise<void> {
  await deleteChunksByFileId(fileId);
  console.log(`[RAG] Deleted chunks for file: ${fileId}`);
}

/**
 * Search relevant chunks cho một query
 */
export async function searchRelevantChunks(
  query: string,
  phaseId: string,
  limit: number = 5
): Promise<{ chunks: DocumentChunk[]; scores: number[] }> {
  try {
    // Generate embedding cho query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search using cosine similarity
    const results = await cosineSimilaritySearch(queryEmbedding, phaseId, limit);
    
    return {
      chunks: results.map(r => r.chunk),
      scores: results.map(r => r.score),
    };
  } catch (error) {
    console.error('[RAG] Error searching chunks:', error);
    return { chunks: [], scores: [] };
  }
}

/**
 * Get context string từ relevant chunks để inject vào prompt
 */
export async function getRAGContext(
  query: string,
  phaseId: string,
  maxChunks: number = 5
): Promise<string> {
  const { chunks, scores } = await searchRelevantChunks(query, phaseId, maxChunks);
  
  if (chunks.length === 0) {
    return '';
  }
  
  // Format chunks thành context string
  const contextParts = chunks.map((chunk, index) => {
    const sourceInfo = `[Source: ${chunk.fileName}, Chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks}]`;
    const relevanceInfo = `[Relevance: ${(scores[index] * 100).toFixed(1)}%]`;
    
    return `---
${sourceInfo} ${relevanceInfo}
${chunk.content}
---`;
  });
  
  return `## Relevant Context from Documents:

${contextParts.join('\n\n')}

## End of Context`;
}
