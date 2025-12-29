import { google } from "@ai-sdk/google";
import { createGraphRAGTool } from "@mastra/rag";

const VECTOR_DIMENSION = 768; // Google text-embedding-004 dimension

const INDEX_NAME = "ba_agent_chunks_document";
export const graphRAGTool = createGraphRAGTool({
  vectorStoreName: "pgVector", // Phải trùng tên với vector store đã đăng ký trong Mastra
  indexName: INDEX_NAME,
  model: google.textEmbeddingModel('text-embedding-004'),
  graphOptions: {
    dimension: VECTOR_DIMENSION,
    threshold: 0.1, // Giảm threshold để lấy được nhiều kết quả liên quan hơn
    randomWalkSteps: 100,  // Số bước random walk
    restartProb: 0.15,     // Xác suất restart
  },
  enableFilter: true, // Có thể bật filter theo metadata nếu cần
});
