import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { MongoDBVector } from '@mastra/mongodb';
import { orchestrationAgent } from './agents/orchestration-agent';
import { PgVector } from '@mastra/pg';
import dotenv from 'dotenv';
import { ragGraphAgent } from './agents/rag-graph-agent';


export const INDEX_NAME = "ba_agent_chunks_document";
dotenv.config();
// MongoDB Vector Store for RAG
const mongoVector = new MongoDBVector({
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017",
  dbName: process.env.MONGODB_DATABASE || "ba_agent",
});


const pgVector = new PgVector({
  connectionString: process.env.POSTGRES_CONNECTION_STRING!,
  connectionTimeoutMillis: 20000, 
  // Tăng thời gian cho phép một query chạy (ví dụ: 60 giây hoặc lâu hơn cho việc tạo index)
  query_timeout: 60000, 
  // Giữ kết nối lâu hơn
  idleTimeoutMillis: 30000,
});


const globalForMastra = globalThis as unknown as { mastra: Mastra };
export const mastra = globalForMastra.mastra || new Mastra({
  workflows: {},
  agents: {
    orchestrationAgent, // Static agent for tracing
    ragGraphAgent,
  },
  vectors: {
    mongoVector,
    pgVector // Register MongoDB vector store for GraphRAG tool
  },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  telemetry: {
    // Telemetry is deprecated and will be removed in the Nov 4th release
    enabled: false, 
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true }, 
  },
});

console.log('[Mastra] Registered agents: orchestration-agent');
console.log('[Mastra] Registered vectors: mongoVector');

if (!globalForMastra.mastra) {
  globalForMastra.mastra = mastra;
}
