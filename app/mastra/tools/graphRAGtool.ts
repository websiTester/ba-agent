import { createGraphRAGTool } from '@mastra/rag';
import { google } from '@ai-sdk/google';

// Constants matching the existing chunks configuration
const VECTOR_INDEX_NAME = "document_chunks";
const VECTOR_DIMENSION = 768; // Google text-embedding-004 dimension

/**
 * GraphRAG Tool for Discovery Agent
 * Uses Mastra's createGraphRAGTool to automatically query vector database
 * and create knowledge graph for context retrieval
 */
export const graphRAGTool = createGraphRAGTool({
  vectorStoreName: "mongoVector", // Must match the name registered in Mastra
  indexName: VECTOR_INDEX_NAME,
  model: google.textEmbeddingModel('text-embedding-004'),
  graphOptions: {
    dimension: VECTOR_DIMENSION,
    threshold: 0.7, // Similarity threshold for graph edges
  },
});

export default graphRAGTool;
