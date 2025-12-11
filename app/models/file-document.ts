import { ObjectId } from "mongodb";

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