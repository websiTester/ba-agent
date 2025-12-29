import { createFile, deleteFile, getFilesByPhaseId } from "@/app/db/files";
import { createMention, deleteMentionByFileId } from "@/app/db/tools";
import { processDocument, deleteDocumentChunks, deleteChunksInChroma } from "@/app/mastra/rag-service";
import { extractTextContent } from "@/app/utils/extractTextContent";
import { formatFileSize } from "@/app/utils/formatFileSize";
import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config();
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001"
const apiUrl = `${baseUrl}/rag/chunk_and_embedding`

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




// POST - Upload file mới với RAG processing
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const phaseId = formData.get('phaseId') as string;
    const customFileName = formData.get('fileName') as string | null;

    if (!file || !phaseId) {
      return NextResponse.json(
        { error: "File and phaseId are required" }, 
        { status: 400 }
      );
    }

    // Sử dụng custom fileName nếu có, nếu không thì dùng tên file gốc
    const finalFileName = customFileName || file.name;

    // Đọc nội dung file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Chuyển sang base64 để lưu vào MongoDB
    const base64Content = buffer.toString('base64');

    // Xác định loại file (chỉ hỗ trợ txt và docx)
    let fileType: 'document' | 'text' = 'document';
    if (file.type === 'text/plain' || finalFileName.toLowerCase().endsWith('.txt')) {
      fileType = 'text';
    }

    // Tạo document để lưu vào DB
    const fileDocument = {
      phaseId,
      fileName: finalFileName,
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


    //Create mention for file
    const mention = {
      label: finalFileName,
      description: 'Mention for file '+finalFileName+' in phase '+phaseId,
      type: 'file',
      fileId: fileId,
      phaseId: phaseId,
    };
    await createMention(mention);
    // 2. Extract text content từ file
    const textContent = await extractTextContent(file, buffer);

    // 3. Process document với RAG (chunking & embedding)
    let ragResult = null;
    // if (textContent && textContent.trim().length > 0) {
    //   console.log(`[Upload] Processing document with RAG...`);
    //   ragResult = await processDocument(fileId, phaseId, {
    //     content: textContent,
    //     fileName: finalFileName,
    //     fileType: fileType,
    //     mimeType: file.type,
    //   });
      
    //   if (!ragResult.success) {
    //     console.warn(`[Upload] RAG processing failed: ${ragResult.error}`);
    //   } else {
    //     console.log(`[Upload] RAG processing complete: ${ragResult.chunksCreated} chunks created`);
    //   }
    // } else {
    //   console.warn(`[Upload] No text content extracted from ${finalFileName}`);
    // }

    if(textContent && textContent.trim().length > 0) {
       ragResult = await fetch(`${apiUrl}/${phaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: textContent,
          source: finalFileName,
          phaseId: phaseId,
        }),
       })

       const data = await ragResult.json();
       console.log("data get from rag/chunk_and_embedding: ", data);

    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileId,
        name: finalFileName,
        type: fileType,
        size: formatFileSize(file.size),
        uploadedAt: fileDocument.uploadedAt,
        mimeType: file.type,
      },
      rag: {
        message: ragResult
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
    const phaseId = searchParams.get('phaseId');
    const fileName = searchParams.get('fileName');


    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    // 1. Xóa document chunks từ vector database
    console.log(`[Delete] Removing chunks for file: ${fileId}`);
    //await deleteDocumentChunks(fileId);
    await deleteChunksInChroma(phaseId, fileName);

    //Xóa mention cho file
    await deleteMentionByFileId(fileId);

    // 2. Xóa file từ database
    await deleteFile(fileId);
    console.log(`[Delete] File deleted: ${fileId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
