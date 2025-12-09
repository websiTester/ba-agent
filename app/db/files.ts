import { ObjectId } from "mongodb";
import { connectDB } from "./mongodb";

// Interface cho File document trong MongoDB
export interface FileDocument {
  _id?: ObjectId;
  phaseId: string;           // Phase mà file thuộc về (discovery, analysis, etc.)
  fileName: string;          // Tên file gốc
  fileType: 'document' | 'text';  // Loại file (txt hoặc docx)
  fileSize: string;          // Kích thước file (formatted)
  fileSizeBytes: number;     // Kích thước file (bytes)
  mimeType: string;          // MIME type
  content: string;           // Nội dung file (base64 cho binary, text cho .txt)
  uploadedAt: Date;          // Thời gian upload
  createdAt: Date;           // Thời gian tạo record
}

const COLLECTION_NAME = "files";

// Lấy collection files
export async function getFilesCollection() {
  const db = await connectDB();
  return db.collection<FileDocument>(COLLECTION_NAME);
}

// Tạo file mới
export async function createFile(file: Omit<FileDocument, "_id" | "createdAt">) {
  const collection = await getFilesCollection();
  const fileWithTimestamp = {
    ...file,
    createdAt: new Date()
  };
  return collection.insertOne(fileWithTimestamp);
}

// Lấy tất cả files theo phaseId
export async function getFilesByPhaseId(phaseId: string) {
  const collection = await getFilesCollection();
  return collection.find({ phaseId }).sort({ uploadedAt: -1 }).toArray();
}

// Lấy file theo ID
export async function getFileById(id: string) {
  const collection = await getFilesCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}

// Xóa file
export async function deleteFile(id: string) {
  const collection = await getFilesCollection();
  return collection.deleteOne({ _id: new ObjectId(id) });
}

// Xóa tất cả files của một phase
export async function deleteFilesByPhaseId(phaseId: string) {
  const collection = await getFilesCollection();
  return collection.deleteMany({ phaseId });
}

