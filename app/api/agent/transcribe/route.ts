import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudioFile } from '@/app/mastra/transcription-agent';

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.mp3', '.mp4', '.wav'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const extension = '.' + fileName.split('.').pop();
    
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: `File không hợp lệ. Chỉ hỗ trợ ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File quá lớn. Giới hạn 50MB' },
        { status: 400 }
      );
    }

    console.log(`[Transcribe API] Received file: ${fileName}, size: ${file.size} bytes`);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call transcription agent
    const transcription = await transcribeAudioFile(buffer, fileName);

    return NextResponse.json({
      success: true,
      transcription,
      fileName: file.name,
      fileSize: file.size,
    });

  } catch (error) {
    console.error('[Transcribe API] Error:', error);
    
    if (error instanceof Error) {
      // Check for API key errors
      if (error.message.includes('API key') || error.message.includes('GOOGLE_GENERATIVE_AI_API_KEY')) {
        return NextResponse.json(
          { 
            error: 'API key chưa được cấu hình. Vui lòng thêm GOOGLE_GENERATIVE_AI_API_KEY vào file .env.local',
            details: error.message 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xử lý yêu cầu transcribe' },
      { status: 500 }
    );
  }
}

