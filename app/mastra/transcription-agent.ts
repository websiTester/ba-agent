import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { GoogleVoice } from '@mastra/voice-google';
import { Readable } from 'stream';

// Agent name and instructions
const AGENT_NAME = 'Audio Transcription Agent';
const AGENT_INSTRUCTIONS = `
Bạn là một AI agent chuyên xử lý và chuyển đổi nội dung audio/video thành văn bản.

## Nhiệm vụ chính:
- Lắng nghe và hiểu nội dung từ file audio hoặc video được cung cấp
- Chuyển đổi toàn bộ nội dung âm thanh thành văn bản chính xác
- Giữ nguyên cấu trúc hội thoại nếu có nhiều người nói

## Quy tắc:
1. Transcribe toàn bộ nội dung, không bỏ sót
2. Giữ nguyên ngôn ngữ gốc của audio
3. Nếu có nhiều người nói, phân biệt bằng nhãn [Người nói 1], [Người nói 2]...
4. Đánh dấu các phần không rõ bằng [không rõ]
5. Giữ nguyên dấu câu và ngắt đoạn phù hợp

## Định dạng Output:
Trả về văn bản đã transcribe theo format:

---
**Transcription:**

[Nội dung đã chuyển đổi]

---
`;

// Initialize GoogleVoice for Speech-to-Text
// GoogleVoice uses Google Cloud Speech-to-Text API
const googleVoice = new GoogleVoice({
  listeningModel: {
    apiKey: process.env.GOOGLE_API_KEY, // Google Cloud API key
  },
});

console.log('[TranscriptionAgent] GoogleVoice initialized');

// Cached agent instance with voice
let transcriptionAgentInstance: Agent | null = null;

// Factory function to get or create the Transcription Agent with voice
export async function getTranscriptionAgent(): Promise<Agent> {
  if (transcriptionAgentInstance) {
    return transcriptionAgentInstance;
  }

  transcriptionAgentInstance = new Agent({
    name: AGENT_NAME,
    instructions: AGENT_INSTRUCTIONS,
    model: "groq/llama-3.3-70b-versatile",
    voice: googleVoice, // Add voice capability to agent
  });

  console.log('[TranscriptionAgent] Initialized with GoogleVoice');
  return transcriptionAgentInstance;
}

// Get the GoogleVoice instance directly
export function getGoogleVoice(): GoogleVoice {
  return googleVoice;
}

// Convert Buffer to Node.js Readable stream for voice.listen()
function bufferToReadable(buffer: Buffer): Readable {
  const readable = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    }
  });
  return readable;
}

// Main function to transcribe audio/video file using GoogleVoice.listen()
export async function transcribeAudioFile(
  fileBuffer: Buffer,
  fileName: string,
): Promise<string> {
  console.log(`[TranscriptionAgent] Processing file: ${fileName}`);
  console.log(`[TranscriptionAgent] File size: ${fileBuffer.length} bytes`);
  
  try {
    // Convert Buffer to Node.js Readable stream
    const audioStream = bufferToReadable(fileBuffer);
    
    // Use GoogleVoice.listen() for Speech-to-Text
    const transcriptionResult = await googleVoice.listen(audioStream);
    
    // Process the transcription result
    let transcription = '';
    
    if (typeof transcriptionResult === 'string') {
      transcription = transcriptionResult;
    } else if (transcriptionResult && typeof transcriptionResult === 'object') {
      // Handle async iterator or stream response
      if (Symbol.asyncIterator in transcriptionResult) {
        for await (const chunk of transcriptionResult as AsyncIterable<string>) {
          transcription += chunk;
        }
      } else {
        transcription = String(transcriptionResult);
      }
    }
    
    console.log(`[TranscriptionAgent] Transcription completed: ${transcription.length} chars`);
    return transcription;
    
  } catch (error) {
    console.error('[TranscriptionAgent] Error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('apiKey')) {
        throw new Error('API key chưa được cấu hình. Vui lòng kiểm tra GOOGLE_GENERATIVE_AI_API_KEY');
      }
      if (error.message.includes('audio') || error.message.includes('video')) {
        throw new Error('Không thể xử lý file audio/video. Vui lòng kiểm tra định dạng file.');
      }
      throw error;
    }
    
    throw new Error('Đã xảy ra lỗi khi transcribe audio');
  }
}

// Alternative: Quick transcription using agent's voice directly
export async function quickTranscribeWithAgent(
  fileBuffer: Buffer,
  fileName: string,
): Promise<string> {
  const agent = await getTranscriptionAgent();
  
  // Access agent's voice capability
  if (agent.voice) {
    const audioStream = bufferToReadable(fileBuffer);
    const result = await agent.voice.listen(audioStream);
    
    if (typeof result === 'string') {
      return result;
    }
    
    // Handle stream response
    let text = '';
    if (result && Symbol.asyncIterator in result) {
      for await (const chunk of result as AsyncIterable<string>) {
        text += chunk;
      }
    }
    return text;
  }
  
  throw new Error('Agent voice not configured');
}

// Transcribe from base64 content
export async function transcribeFromBase64(
  base64Content: string,
  fileName: string = 'audio.mp3',
): Promise<string> {
  const buffer = Buffer.from(base64Content, 'base64');
  return transcribeAudioFile(buffer, fileName);
}
