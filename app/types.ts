export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'document' | 'text';  // document = docx, text = txt
  size: string;
  uploadedAt: Date;
  file?: File; // Actual file object for uploaded files
  url?: string; // Object URL for preview/download
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  messages: Message[];
  files: FileItem[];
}

export type PhaseId = 'discovery' | 'analysis' | 'documentation' | 'communication' | 'quick-chat';

// Allowed file types for upload (chỉ hỗ trợ txt và docx)
export const ALLOWED_FILE_TYPES = {
  'text/plain': 'text',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/msword': 'document',
} as const;

export const ALLOWED_EXTENSIONS = ['.txt', '.docx', '.doc'];
