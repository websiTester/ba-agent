import { createFile, deleteFile, getFilesByPhaseId } from "@/app/db/files";
import { processDocument, deleteDocumentChunks } from "@/app/mastra/rag-service";
import { NextRequest, NextResponse } from "next/server";

// GET - Lấy danh sách files theo phaseId
export async function GET(request: NextRequest) {
  try {
    
    const { searchParams } = new URL(request.url);
    const phaseId = searchParams.get('phaseId');

    if (!phaseId) {
      return NextResponse.json({ error: "phaseId is required" }, { status: 400 });
    }

    const files = await getFilesByPhaseId(phaseId);
    
    // Chuyển đổi format để frontend sử dụng
    const formattedFiles = files.map(file => ({
      id: file._id?.toString(),
      name: file.fileName,
      type: file.fileType,
      size: file.fileSize,
      uploadedAt: file.uploadedAt,
      content: file.content,
      mimeType: file.mimeType,
    }));

    return NextResponse.json(formattedFiles);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}

// Helper: Extract text content from file based on type (chỉ hỗ trợ txt và docx)
async function extractTextContent(file: File, buffer: Buffer): Promise<string> {
  const mimeType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    // Plain text file (.txt)
    if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
      return buffer.toString('utf-8');
    }

    // Word document (.docx, .doc)
    if (mimeType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    // Fallback: try to read as text
    return buffer.toString('utf-8');
  } catch (error) {
    console.error('Error extracting text content:', error);
    return '';
  }
}

// Helper: Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// POST - Upload file mới với RAG processing
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const phaseId = formData.get('phaseId') as string;

    if (!file || !phaseId) {
      return NextResponse.json(
        { error: "File and phaseId are required" }, 
        { status: 400 }
      );
    }

    // Đọc nội dung file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Chuyển sang base64 để lưu vào MongoDB
    const base64Content = buffer.toString('base64');

    // Xác định loại file (chỉ hỗ trợ txt và docx)
    let fileType: 'document' | 'text' = 'document';
    if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
      fileType = 'text';
    }

    // Tạo document để lưu vào DB
    const fileDocument = {
      phaseId,
      fileName: file.name,
      fileType,
      fileSize: formatFileSize(file.size),
      fileSizeBytes: file.size,
      mimeType: file.type,
      content: base64Content,
      uploadedAt: new Date(),
    };

    // 1. Lưu file vào database
    const result = await createFile(fileDocument);
    const fileId = result.insertedId.toString();

    // 2. Extract text content từ file
    console.log(`[Upload] Extracting text from: ${file.name}`);
    const textContent = await extractTextContent(file, buffer);

    // 3. Process document với RAG (chunking & embedding)
    let ragResult: { success: boolean; chunksCreated: number; error?: string } = { success: false, chunksCreated: 0 };
    
    if (textContent && textContent.trim().length > 0) {
      console.log(`[Upload] Processing document with RAG...`);
      ragResult = await processDocument(fileId, phaseId, {
        content: textContent,
        fileName: file.name,
        fileType: fileType,
        mimeType: file.type,
      });
      
      if (!ragResult.success) {
        console.warn(`[Upload] RAG processing failed: ${ragResult.error}`);
      } else {
        console.log(`[Upload] RAG processing complete: ${ragResult.chunksCreated} chunks created`);
      }
    } else {
      console.warn(`[Upload] No text content extracted from ${file.name}`);
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileId,
        name: file.name,
        type: fileType,
        size: formatFileSize(file.size),
        uploadedAt: fileDocument.uploadedAt,
        mimeType: file.type,
      },
      rag: {
        processed: ragResult.success,
        chunksCreated: ragResult.chunksCreated,
        error: ragResult.error || undefined,
      }
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

// DELETE - Xóa file và chunks liên quan
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    // 1. Xóa document chunks từ vector database
    console.log(`[Delete] Removing chunks for file: ${fileId}`);
    await deleteDocumentChunks(fileId);

    // 2. Xóa file từ database
    await deleteFile(fileId);
    console.log(`[Delete] File deleted: ${fileId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
