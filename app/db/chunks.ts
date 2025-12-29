import { ObjectId } from "mongodb";
import { connectDB } from "./mongodb";
import { MongoDBVector } from "@mastra/mongodb";
import { INDEX_NAME, mastra } from "../mastra";

// Interface cho Document Chunk trong MongoDB
export interface DocumentChunk {
  _id?: ObjectId | string;     // ObjectId (MongoDB) or UUID string (Mastra)
  fileId: string;              // Reference đến file gốc
  phaseId: string;             // Phase mà document thuộc về
  fileName: string;            // Tên file gốc để dễ truy xuất
  
  // Chunk content
  content: string;             // Nội dung chunk
  chunkIndex: number;          // Vị trí chunk trong document
  totalChunks: number;         // Tổng số chunks của document
  
  // Metadata (simplified)
  metadata: {
    documentType: string;      // Loại document (txt, docx, pdf, md)
  };
  
  // Embedding vector cho semantic search
  embedding: number[];         // Vector embedding từ model
  embeddingModel: string;      // Model đã dùng để tạo embedding
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Interface cho search result
export interface ChunkSearchResult {
  chunk: DocumentChunk;
  score: number;               // Similarity score
  distance: number;            // Vector distance
}

// Interface cho vector search result (simplified, direct from Mastra)
export interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  metadata: {
    fileId: string;
    phaseId: string;
    fileName: string;
    chunkIndex: number;
    documentType: string;
  };
}


const COLLECTION_NAME = "document_chunks";
const VECTOR_INDEX_NAME = "document_chunks"; // Same as collection name
const VECTOR_DIMENSION = 768; // Google text-embedding-004 dimension

// Mastra MongoDB Vector Store singleton
let mongoVector: MongoDBVector | null = null;
let vectorIndexInitialized = false;

async function getMongoVector(): Promise<MongoDBVector> {
  if (!mongoVector) {
    mongoVector = new MongoDBVector({
      uri: process.env.MONGODB_URI || "mongodb://localhost:27017",
      dbName: process.env.MONGODB_DATABASE || "ba_agent",
    });
    await mongoVector.connect();
    console.log("[Mastra] MongoDBVector connected");
  }
  return mongoVector;
}

// Ensure vector index exists before operations
async function ensureVectorIndex(): Promise<void> {
  if (vectorIndexInitialized) return;
  
  const vector = await getMongoVector();
  
  try {
    // Check if index already exists
    const indexes = await vector.listIndexes();
    if (!indexes.includes(VECTOR_INDEX_NAME)) {
      // Create index if not exists
      await vector.createIndex({
        indexName: VECTOR_INDEX_NAME,
        dimension: VECTOR_DIMENSION,
        metric: "cosine",
      });
      console.log("[Mastra] Vector index created successfully");
    }
    vectorIndexInitialized = true;
  } catch (error) {
    console.error("[Mastra] Error ensuring vector index:", error);
    // Still mark as initialized to avoid repeated failures
    vectorIndexInitialized = true;
  }
}

// Lấy collection chunks
export async function getChunksCollection() {
  const db = await connectDB();
  return db.collection<DocumentChunk>(COLLECTION_NAME);
}



// Lưu nhiều chunks cùng lúc sử dụng Mastra upsert
export async function saveChunks(chunks: Omit<DocumentChunk, "_id">[]) {
  // Ensure vector index exists before upserting
  await ensureVectorIndex();
  
  const vector = await getMongoVector();
  const now = new Date();
  
  // Prepare data for Mastra upsert
  const vectors = chunks.map(chunk => chunk.embedding);
  
  // Store ALL chunk properties in metadata để có thể reconstruct DocumentChunk khi query
  const metadata = chunks.map(chunk => ({
    fileId: chunk.fileId,
    phaseId: chunk.phaseId,
    fileName: chunk.fileName,
    chunkIndex: chunk.chunkIndex,
    totalChunks: chunk.totalChunks,
    documentType: chunk.metadata.documentType,
    embeddingModel: chunk.embeddingModel,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }));
  
  // Store content as documents
  const documents = chunks.map(chunk => chunk.content);
  
  // Use Mastra upsert - returns array of IDs
  const ids = await vector.upsert({
    indexName: VECTOR_INDEX_NAME,
    vectors,
    metadata,
    documents,
  });
  
  console.log(`[Mastra] Saved ${ids.length} chunks to vector index`);
  return { insertedIds: ids, insertedCount: ids.length };
}


export async function saveChunksToPostgres(chunks: Omit<DocumentChunk, "_id">[]) {

  const embeddings = chunks.map((chunk) => chunk.embedding);
  const metadata = chunks.map((chunk) => 
    ({ text: chunk.content, fileId: chunk.fileId, phaseId: chunk.phaseId }));

  const vectorStore = mastra.getVector("pgVector");
  await vectorStore.createIndex({
    indexName: INDEX_NAME,
    dimension: 768,
  });
  await vectorStore.upsert({
    indexName: INDEX_NAME,
    vectors: embeddings,
    metadata: metadata,
  });
}

// Lấy chunks theo fileId
export async function getChunksByFileId(fileId: string) {
  const collection = await getChunksCollection();
  return collection.find({ fileId }).sort({ chunkIndex: 1 }).toArray();
}

// Lấy chunks theo phaseId
export async function getChunksByPhaseId(phaseId: string) {
  const collection = await getChunksCollection();
  return collection.find({ phaseId }).sort({ fileName: 1, chunkIndex: 1 }).toArray();
}

// Xóa chunks theo fileId (khi xóa file)
// export async function deleteChunksByFileId(fileId: string) {
//   try {
//     const vector = await getMongoVector();
    
//     // Delete from Mastra Vector Store by filter
//     await vector.deleteVectors({
//       indexName: VECTOR_INDEX_NAME,
//       filter: { fileId },
//     });
    
//     console.log(`[Mastra] Deleted chunks for fileId: ${fileId}`);
//   } catch (error) {
//     console.error("[Mastra] Error deleting vectors:", error);
//   }
// }


export async function deleteChunksByFileId(fileId: string) {
  const vectorStore = mastra.getVector("pgVector") as any;
  await vectorStore.deleteVectors({indexName: INDEX_NAME, filter: {fileId: fileId}});
}



// Cosine similarity search using Mastra's .query() - Returns results directly
export async function cosineSimilaritySearch(
  queryEmbedding: number[],
  phaseId: string,
  limit: number = 5
): Promise<ChunkSearchResult[]> {
  try {
    // Ensure vector index exists before querying
    await ensureVectorIndex();
    
    // Use Mastra's MongoDB vector query
    const vector = await getMongoVector();
    
    // Debug: Check index stats
    const stats = await vector.describeIndex({ indexName: VECTOR_INDEX_NAME });
    console.log(`[Mastra] Index stats:`, stats);

    // Then try with filter
    const results = await vector.query({
      indexName: VECTOR_INDEX_NAME,
      queryVector: queryEmbedding,
      topK: limit,
      filter: { phaseId }, // Filter by phaseId directly in query
    });
    console.log(`[Mastra] Results with filter phaseId=${phaseId}: ${results.length}`);
    
    // Convert QueryResult to ChunkSearchResult
    return results.map(result => {
      const meta = result.metadata as {
        fileId: string;
        phaseId: string;
        fileName: string;
        chunkIndex: number;
        totalChunks: number;
        documentType: string;
        embeddingModel: string;
        createdAt: string;
        updatedAt: string;
      };
      
      // Reconstruct DocumentChunk from query result
      // Note: Mastra uses UUID for _id, not ObjectId
      const chunk: DocumentChunk = {
        _id: result.id, // UUID string from Mastra
        fileId: meta.fileId,
        phaseId: meta.phaseId,
        fileName: meta.fileName,
        content: result.document || '',
        chunkIndex: meta.chunkIndex,
        totalChunks: meta.totalChunks,
        metadata: {
          documentType: meta.documentType,
        },
        embedding: result.vector || [],
        embeddingModel: meta.embeddingModel,
        createdAt: new Date(meta.createdAt),
        updatedAt: new Date(meta.updatedAt),
      };
      
      return {
        chunk,
        score: result.score || 0,
        distance: 1 - (result.score || 0),
      };
    });
  } catch (error) {
    console.error("[Mastra] Vector query error:", error);
    return [];
  }
}
