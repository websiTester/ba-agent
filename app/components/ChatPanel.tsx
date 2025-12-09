'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic,
  Sparkles,
  User,
  Bot,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  X,
  FileText,
  Loader2,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Check,
  CheckCircle,
  ChevronRight,
  Save,
  SlidersHorizontal,
  Upload,
  Video,
  Music,
  Download
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, PhaseId } from '../types';
import { parseJson } from '../utils/json-parser';

// Interface cho Template (matching MongoDB schema)
interface Pair {
  header: string;
  content: string;
}

interface Template {
  _id?: string;
  agentId: string;
  templateName: string;
  isDefault: boolean;
  pair: Pair[];
  createdBy?: string; // Email của người tạo/cập nhật template
  updatedAt?: Date;
}

interface ChatPanelProps {
  phaseId: PhaseId;
  phaseName: string;
  phaseDescription: string;
  messages: Message[];
  onSendMessage: (content: string, role?: 'user' | 'assistant') => void;
}

interface AttachedFile {
  file: File;
  name: string;
  type: string;
  isProcessing: boolean;
  content?: string;
  error?: string;
}

interface AttachedRecord {
  file: File;
  name: string;
  type: string;
  size: number;
  isTranscribing?: boolean;
  transcription?: string;
  error?: string;
}

const ALLOWED_CHAT_FILE_TYPES = [
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const ALLOWED_CHAT_EXTENSIONS = ['.txt', '.docx', '.doc'];

const phasePrompts: Record<PhaseId, string[]> = {
  'discovery': [
    'Phân tích tài liệu SRS/BRD và trích xuất Requirements List',
    'Tạo danh sách câu hỏi phỏng vấn stakeholder',
    'Xác định functional và non-functional requirements',
    'Phân loại requirements theo priority',
  ],
  'analysis': [
    'Phát hiện gaps trong requirements',
    'Tạo ma trận ưu tiên requirements',
    'Validate requirements với business rules',
    'Tạo diagram phân tích nghiệp vụ',
  ],
  'documentation': [
    'Tạo BRD từ requirements đã thu thập',
    'Viết FSD cho module cụ thể',
    'Tạo user stories từ requirements',
    'Generate test scenarios từ acceptance criteria',
  ],
  'communication': [
    'Chuẩn bị nội dung cho meeting review',
    'Tạo email tóm tắt cho stakeholders',
    'Tạo checklist bàn giao cho dev team',
    'Q&A về requirements',
  ],
  'quick-chat': [
    'Giải thích khái niệm BA',
    'Best practices cho requirement gathering',
    'Làm thế nào để prioritize requirements?',
    'Cách viết user story hiệu quả',
  ],
};

// Function to read TXT file
const readTxtFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Không thể đọc file TXT'));
    reader.readAsText(file);
  });
};

// Function to read DOCX file
const readDocxFile = async (file: File): Promise<string> => {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

// Function to read file content based on type
const readFileContent = async (file: File): Promise<string> => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (file.type === 'text/plain' || extension === '.txt') {
    return await readTxtFile(file);
  } else if (file.type.includes('word') || extension === '.docx' || extension === '.doc') {
    return await readDocxFile(file);
  }
  
  throw new Error('Định dạng file không được hỗ trợ. Chỉ hỗ trợ .txt và .docx');
};

const isValidChatFileType = (file: File): boolean => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return ALLOWED_CHAT_FILE_TYPES.includes(file.type) || ALLOWED_CHAT_EXTENSIONS.includes(extension);
};

// Function to clean markdown content - remove outer code block wrappers
const cleanMarkdownContent = (content: string): string => {
  let cleaned = content.trim();
  
  // Pattern to match content wrapped in code blocks like ```markdown ... ``` or ``` ... ```
  // This handles cases where the LLM wraps the entire response in a code block
  const codeBlockPattern = /^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?```$/;
  const match = cleaned.match(codeBlockPattern);
  
  if (match) {
    cleaned = match[1].trim();
  }
  
  return cleaned;
};

export default function ChatPanel({ 
  phaseId, 
  phaseName, 
  phaseDescription, 
  messages, 
  onSendMessage 
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [attachedRecord, setAttachedRecord] = useState<AttachedRecord | null>(null);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Thread ID for memory - persists conversation context per phase
  const threadIdRef = useRef<string>(`thread-${phaseId}-${Date.now()}`);
  
  // Separate Thread ID for Obsidian Agent - persistent across the session
  const obsidianThreadIdRef = useRef<string>(`obsidian-thread-${Date.now()}`);
  
  // Store last saved note info for context continuity
  const [lastSavedNote, setLastSavedNote] = useState<{ title: string; content: string } | null>(null);

  // Initialize/reset threadId when phase changes
  useEffect(() => {
    // Create a new thread ID for each phase to maintain separate conversation contexts
    threadIdRef.current = `thread-${phaseId}-${Date.now()}`;
    console.log(`[Memory] New thread initialized for phase ${phaseId}: ${threadIdRef.current}`);
  }, [phaseId]);

  // Agent Mode Toggle State (Origin Agent / Obsidian Agent)
  const [isObsidianMode, setIsObsidianMode] = useState(false);

  // Template Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'structure' | 'agent'>('templates');
  
  // Agent Info State
  const [agentInfo, setAgentInfo] = useState<{ agentName: string; instructions: string } | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [editedInstructions, setEditedInstructions] = useState('');
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [editingPairIndex, setEditingPairIndex] = useState<number | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);
  const [settingDefaultTemplateId, setSettingDefaultTemplateId] = useState<string | null>(null);
  
  // Template Import ref
  const templateImportRef = useRef<HTMLInputElement>(null);
  const [isImportingTemplate, setIsImportingTemplate] = useState(false);
  
  // Options Menu State
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  //Record State
const recordRef = useRef<HTMLInputElement>(null);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setIsOptionsMenuOpen(false);
      }
    };

    if (isOptionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOptionsMenuOpen]);

  // Download message as .docx file
  const handleDownload = async (messageContent: string) => {
    try {
      const { Document, Packer, Paragraph } = await import('docx');
      
      // Tạo paragraphs trực tiếp từ các dòng content
      const paragraphs = messageContent.split('\n').map(line => new Paragraph({ text: line }));
      
      const doc = new Document({
        sections: [{ children: paragraphs }],
      });
      
      const blob = await Packer.toBlob(doc);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `BA-Agent-${phaseName}-${timestamp}.docx`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading docx:', error);
      alert('❌ Không thể tạo file .docx. Vui lòng thử lại.');
    }
  };

  // Save message to Obsidian
  const handleSaveToObsidian = async (messageContent: string, messageId: string) => {
    setIsAgentProcessing(true);
    setSavingMessageId(messageId);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const title = `BA-Agent-${phaseName}-${timestamp}`;
      
      const response = await fetch('/api/agent/obsidian', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          content: messageContent,
          title: title,
          folder: 'BA-Agent',
          threadId: obsidianThreadIdRef.current, // Use Obsidian-specific threadId
          resourceId: `user-${phaseId}`,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Save to obsidian successful');
        
        // Lưu thông tin note vừa tạo để dùng cho các yêu cầu tiếp theo
        setLastSavedNote({ title, content: messageContent });
        
        // Hiển thị phản hồi từ Obsidian Agent
        const aiResponse = data.response;
        onSendMessage(aiResponse, 'assistant');
      } else {
        console.error('Save to obsidian failed:', data.error);
        alert(`❌ Lỗi: ${data.error || 'Không thể lưu vào Obsidian'}`);
      }
    } catch (error) {
      console.error('Error saving to Obsidian:', error);
      alert('❌ Không thể kết nối với Obsidian. Kiểm tra Obsidian Local REST API plugin.');
    } finally {
      setSavingMessageId(null);
      setIsAgentProcessing(false);
    }
  };

  // Fetch templates from MongoDB when phase changes
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await fetch(`/api/templates?agentId=${phaseId}`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Fetch agent info from MongoDB
  const fetchAgentInfo = async () => {
    setIsLoadingAgent(true);
    try {
      const agentName = `${phaseName} Agent`;
      const response = await fetch(`/api/agents?agentName=${encodeURIComponent(agentName)}`);
      if (response.ok) {
        const data = await response.json();
        setAgentInfo(data);
      } else {
        setAgentInfo(null);
      }
    } catch (error) {
      console.error('Error fetching agent info:', error);
      setAgentInfo(null);
    } finally {
      setIsLoadingAgent(false);
    }
  };

  // Save agent instructions to database
  const handleSaveAgentInstructions = async () => {
    if (!agentInfo || !editedInstructions.trim()) return;
    
    setIsSavingAgent(true);
    try {
      const response = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agentInfo.agentName,
          instructions: editedInstructions,
        }),
      });

      if (response.ok) {
        // Update local state
        setAgentInfo({ ...agentInfo, instructions: editedInstructions });
        setIsEditingInstructions(false);
        console.log('[Agent] Instructions saved successfully');

      } else {
        console.error('[Agent] Failed to save instructions');
      }
    } catch (error) {
      console.error('Error saving agent instructions:', error);
    } finally {
      setIsSavingAgent(false);
    }
  };

  // Start editing instructions
  const handleStartEditingInstructions = () => {
    if (agentInfo) {
      setEditedInstructions(agentInfo.instructions);
      setIsEditingInstructions(true);
    }
  };

  // Cancel editing instructions
  const handleCancelEditingInstructions = () => {
    setIsEditingInstructions(false);
    setEditedInstructions('');
  };

  // Load templates and agent info when settings modal opens or phase changes
  useEffect(() => {
    if (isSettingsOpen) {
      fetchTemplates();
      fetchAgentInfo();
    }
  }, [isSettingsOpen, phaseId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidChatFileType(file)) {
      setAttachedFile({
        file,
        name: file.name,
        type: file.type,
        isProcessing: false,
        error: 'Chỉ hỗ trợ file .txt, .docx'
      });
      return;
    }

    setAttachedFile({
      file,
      name: file.name,
      type: file.type,
      isProcessing: true
    });

    try {
      const content = await readFileContent(file);
      setAttachedFile(prev => prev ? {
        ...prev,
        isProcessing: false,
        content
      } : null);
    } catch (error) {
      setAttachedFile(prev => prev ? {
        ...prev,
        isProcessing: false,
        error: 'Không thể đọc nội dung file'
      } : null);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  // Fetch RAG context từ document chunks
  const fetchRAGContext = async (query: string): Promise<string> => {
    try {
      
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          phaseId,
          limit: 20, // Top 20 chunks liên quan nhất
        }),
      });

      if (!response.ok) {
        console.warn('RAG search failed, continuing without context');
        return '';
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Format chunks thành context string
        const contextParts = data.results.map((result: {
          fileName: string;
          chunkIndex: number;
          totalChunks: number;
          metadata: { section?: string };
          content: string;
          score: number;
        }, index: number) => {
          const sectionInfo = result.metadata?.section ? `[Section: ${result.metadata.section}]` : '';
          const sourceInfo = `[Nguồn: ${result.fileName}, Phần ${result.chunkIndex + 1}/${result.totalChunks}]`;
          const relevanceInfo = `[Độ liên quan: ${(result.score * 100).toFixed(1)}%]`;
          
          return `### Ngữ cảnh ${index + 1}
${sourceInfo} ${sectionInfo} ${relevanceInfo}
${result.content}`;
        });

        let referenceStandards = `ĐÂY LÀ CÁC QUY TẮC/TIÊU CHUẨN CẦN TUÂN THỦ (RAG CONTEXT):\n`;
        referenceStandards += `<reference_standards>\n`;
        referenceStandards += `${contextParts.join('\n\n---\n\n')}\n`;
        referenceStandards += `</reference_standards>\n`;

        return `${referenceStandards}`;
      }
      
      return '';
    } catch (error) {
      console.error('Error fetching RAG context:', error);
      return '';
    }
  };

  const callAnalysisAgent = async (message: string, documentContent: string) => {
    setIsAgentProcessing(true);
    try {

      const ragContext = await fetchRAGContext(message);

      // 2. Kết hợp RAG context với document content (nếu có)
      let combinedContent = '';
      
      if (documentContent) {
        let userDocumentContent = `ĐÂY LÀ TÀI LIỆU CẦN PHÂN TÍCH:\n`;
        userDocumentContent = `<user_document>\n`;
        userDocumentContent += `${documentContent}\n`;
        userDocumentContent += `</user_document>\n`;
        combinedContent += `${userDocumentContent}\n`;
      }

      if (ragContext) {
        combinedContent += ragContext + '\n';
      }

      // 3. Gọi Discovery Agent với context đầy đủ
      const response = await fetch('/api/agent/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          documentContent: combinedContent,
          threadId: threadIdRef.current,
          resourceId: `user-${phaseId}`,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi gọi Discovery Agent');
      }

      return data.response;
    } catch (error) {
      console.error('Discovery Agent Error:', error);
      throw error;
    } finally {
      setIsAgentProcessing(false);
    }
  };

  const callDiscoveryAgent = async (message: string, documentContent: string) => {
    setIsAgentProcessing(true);
    try {

      const ragContext = await fetchRAGContext(message);

      // 2. Kết hợp RAG context với document content (nếu có)
      let combinedContent = '';
      
      if (documentContent) {
        let userDocumentContent = `ĐÂY LÀ TÀI LIỆU CẦN PHÂN TÍCH:\n`;
        userDocumentContent = `<user_document>\n`;
        userDocumentContent += `${documentContent}\n`;
        userDocumentContent += `</user_document>\n`;
        combinedContent += `${userDocumentContent}\n`;
      }

      if (ragContext) {
        combinedContent += ragContext + '\n';
      }

      // 3. Gọi Discovery Agent với context đầy đủ
      const response = await fetch('/api/agent/discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          documentContent: combinedContent,
          threadId: threadIdRef.current,
          resourceId: `user-${phaseId}`,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi gọi Discovery Agent');
      }

      // Log memory status (threadId is now initialized at component mount)
      console.log(`[Memory] Response received for thread: ${threadIdRef.current}`);

      return data.response;
    } catch (error) {
      console.error('Discovery Agent Error:', error);
      throw error;
    } finally {
      setIsAgentProcessing(false);
    }
  };

  const callAgent = async (message: string, documentContent: string) => {
    setIsAgentProcessing(true);
    try {

      const ragContext = await fetchRAGContext(message);

      // 2. Kết hợp RAG context với document content (nếu có)
      let combinedContent = '';
      
      if (documentContent) {
        let userDocumentContent = `ĐÂY LÀ TÀI LIỆU CẦN PHÂN TÍCH:\n`;
        userDocumentContent = `<user_document>\n`;
        userDocumentContent += `${documentContent}\n`;
        userDocumentContent += `</user_document>\n`;
        combinedContent += `${userDocumentContent}\n`;
      }

      if (ragContext) {
        combinedContent += ragContext + '\n';
      }

      // 3. Gọi Discovery Agent với context đầy đủ
      const response = await fetch('/api/agent/get-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          documentContent: combinedContent,
          threadId: threadIdRef.current,
          resourceId: `user-${phaseId}`,
          phaseId: phaseId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi gọi Discovery Agent');
      }

      return data.response;
    } catch (error) {
      console.error('Discovery Agent Error:', error);
      throw error;
    } finally {
      setIsAgentProcessing(false);
    }
  };

  // Call Obsidian Agent API
  const callObsidianAgent = async (message: string, documentContent: string) => {
    setIsAgentProcessing(true);
    try {
      // Kết hợp document content với message
      let fullMessage = message;
      
      // Thêm context về note vừa lưu nếu có
      if (lastSavedNote) {
        fullMessage = `[Context: Note vừa được lưu gần nhất có tên "${lastSavedNote.title}" với nội dung:\n${lastSavedNote.content.substring(0, 500)}${lastSavedNote.content.length > 500 ? '...' : ''}]\n\nYêu cầu của người dùng: ${message}`;
      }
      
      if (documentContent) {
        fullMessage += `\n\n<attached_document>\n${documentContent}\n</attached_document>`;
      }

      console.log(`[ObsidianAgent] Calling with threadId: ${obsidianThreadIdRef.current}`);

      // Gọi Obsidian Agent API
      const response = await fetch('/api/agent/obsidian', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'chat',
          message: fullMessage,
          threadId: obsidianThreadIdRef.current, // Use Obsidian-specific threadId
          resourceId: `user-${phaseId}`,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi gọi Obsidian Agent');
      }

      console.log(`[ObsidianAgent] Response received for thread: ${obsidianThreadIdRef.current}`);

      return data.response;
    } catch (error) {
      console.error('Obsidian Agent Error:', error);
      throw error;
    } finally {
      setIsAgentProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission while agent is processing
    if (isTyping || isAgentProcessing) return;
    if (!input.trim() && !attachedFile?.content) return;

    // Obsidian Mode - use Obsidian Agent
    if (isObsidianMode) {
      let userMessage = input.trim() || 'Xử lý yêu cầu này.';

      if (attachedFile?.content) {
        userMessage = `📎 **File: ${attachedFile.name}**\n\n${userMessage}`;
      }
      onSendMessage(userMessage, 'user');

      setIsTyping(true);
      try {
        const aiResponse = await callObsidianAgent(userMessage, attachedFile?.content ?? "");
        onSendMessage(aiResponse, 'assistant');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
        onSendMessage(`❌ **Lỗi Obsidian Agent:** ${errorMessage}\n\nVui lòng kiểm tra:\n1. Obsidian Local REST API plugin đã được bật\n2. OBSIDIAN_API_KEY và OBSIDIAN_BASE_URL đã cấu hình trong .env\n3. Thử lại sau`, 'assistant');
      } finally {
        setIsTyping(false);
      }
    }
    else {
      let userMessage = input.trim();

      if (attachedFile?.content) {
        userMessage = `📎 **File: ${attachedFile.name}**\n\n${userMessage}`;
      }
      onSendMessage(userMessage, 'user');

      setIsTyping(true);
      try {
        const aiResponse = await callAgent(userMessage, attachedFile?.content ?? "");
        onSendMessage(aiResponse, 'assistant');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
        onSendMessage(`❌ **Lỗi:** ${errorMessage}\n\nVui lòng kiểm tra:\n1. API key đã được cấu hình trong file \`.env.local\`\n2. Kết nối internet\n3. Thử lại sau`, 'assistant');
      } finally {
        setIsTyping(false);
      }
    }
    // Discovery phase - use Discovery Agent
    // else if (phaseId === 'discovery') {
    //   let userMessage = input.trim() || 'Phân tích tài liệu này và trích xuất Requirements List.';

    //   if (attachedFile?.content) {
    //     userMessage = `📎 **File: ${attachedFile.name}**\n\n${userMessage}`;
    //   }
    //   onSendMessage(userMessage, 'user');

    //   setIsTyping(true);
    //   try {
    //     const aiResponse = await callDiscoveryAgent(userMessage, attachedFile?.content ?? "");
    //     onSendMessage(aiResponse, 'assistant');
    //   } catch (error) {
    //     const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
    //     onSendMessage(`❌ **Lỗi:** ${errorMessage}\n\nVui lòng kiểm tra:\n1. API key đã được cấu hình trong file \`.env.local\`\n2. Kết nối internet\n3. Thử lại sau`, 'assistant');
    //   } finally {
    //     setIsTyping(false);
    //   }
    // }else if (phaseId === 'analysis') {
    //   let userMessage = input.trim();

    //   if (attachedFile?.content) {
    //     userMessage = `📎 **File: ${attachedFile.name}**\n\n${userMessage}`;
    //   }
    //   onSendMessage(userMessage, 'user');

    //   setIsTyping(true);
    //   try {
    //     const aiResponse = await callAnalysisAgent(userMessage, attachedFile?.content ?? "");
    //     onSendMessage(aiResponse, 'assistant');
    //   } catch (error) {
    //     const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
    //     onSendMessage(`❌ **Lỗi:** ${errorMessage}\n\nVui lòng kiểm tra:\n1. API key đã được cấu hình trong file \`.env.local\`\n2. Kết nối internet\n3. Thử lại sau`, 'assistant');
    //   } finally {
    //     setIsTyping(false);
    //   }
    // } 
     
    
    setAttachedFile(null);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping && !isAgentProcessing) {
        handleSubmit(e);
      }
    }
  };

  const handlePromptClick = (prompt: string) => {
    if (isTyping || isAgentProcessing) return;
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleAddNewTemplate = async () => {
    if (!newTemplateName.trim()) return;
    
    try {
      const templateData = {
        agentId: phaseId,
        templateName: newTemplateName.trim(),
        isDefault: false,
        pair: [{ header: 'New Section', content: 'Mô tả nội dung...' }]
      };
      
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }
      
      const createdTemplate = await response.json() as Template;
      setTemplates([...templates, createdTemplate]);
      setNewTemplateName('');
      setIsAddingNew(false);
    } catch (error) {
      console.error('Error creating template:', error);
    }
  }

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    
    setIsSavingTemplate(true);
    try {
      // Get user email from localStorage if logged in
      let userEmail: string | undefined;
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          userEmail = user.email;
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }

      // Add user email and update time to template
      const templateToSave = {
        ...selectedTemplate,
        ...(userEmail && { createdBy: userEmail }),
        updatedAt: new Date(),
      };

      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }
      
      // Update templates list with saved template
      setTemplates(templates.map(t => t._id === selectedTemplate._id ? templateToSave : t));
      setSelectedTemplate(templateToSave);
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSavingTemplate(false);
    }
  }

  const handleDeleteTemplate = async(e: React.MouseEvent<HTMLButtonElement>, template: Template) => {
    
    e.stopPropagation();
    await fetch(`/api/templates?templateId=${template._id}`, {
      method: 'DELETE',
    });
    setTemplates(templates.filter(t => t._id !== template._id));
    if (selectedTemplate?._id === template._id) {
      setSelectedTemplate(null);
    }
  }

  // Handle template import
  const handleTemplateImportClick = () => {
    templateImportRef.current?.click();
  };

  const ALLOWED_RECORD_EXTENSIONS = ['.mp3', '.mp4', '.wav'];
  
  const isValidRecordFileType = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ALLOWED_RECORD_EXTENSIONS.includes(extension);
  };

  // Format file size to human readable
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRecordClick = () => {
    recordRef.current?.click();
  };

  const handleRecordChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!isValidRecordFileType(file)) {
      setAttachedRecord({
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        error: 'Chỉ hỗ trợ file .mp3, .mp4, .wav'
      });
      return;
    }
    
    // Set attached record state with transcribing status
    setAttachedRecord({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      isTranscribing: true,
    });
    
    console.log("Record uploaded");
    console.log(`File name: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
    
    // Call transcription API
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/agent/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update state with transcription result
        setAttachedRecord(prev => prev ? {
          ...prev,
          isTranscribing: false,
          transcription: data.transcription,
        } : null);
        console.log("Transcription completed:", data.transcription);
      } else {
        // Handle error
        setAttachedRecord(prev => prev ? {
          ...prev,
          isTranscribing: false,
          error: data.error || 'Không thể transcribe file',
        } : null);
        console.error("Transcription error:", data.error);
      }
    } catch (error) {
      console.error("Transcription API error:", error);
      setAttachedRecord(prev => prev ? {
        ...prev,
        isTranscribing: false,
        error: 'Lỗi kết nối với server',
      } : null);
    }
    
    // Reset input để có thể upload lại cùng file
    if (recordRef.current) {
      recordRef.current.value = '';
    }
  };

  const handleRemoveRecord = () => {
    setAttachedRecord(null);
  };

  const handleTemplateImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Kiểm tra file type trước khi đọc
    if (!isValidChatFileType(file)) {
      console.error("File type không được hỗ trợ. Chỉ chấp nhận .txt, .docx");
      return;
    }
    
    setIsImportingTemplate(true);
    
    try {
      const content = await readFileContent(file);

      const response = await fetch('/api/agent/analyze-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: content,
        }),
      });
      const data = await response.json();
 
      const template = parseJson(data.response);

       
       if (selectedTemplate) {
         setSelectedTemplate({
           ...selectedTemplate,
           pair: [...selectedTemplate.pair, ...template],
         });
       }
       console.log("Response:", template);
      
    } catch (error) {
      console.error("Lỗi khi đọc file:", error);
    } finally {
      setIsImportingTemplate(false);
    }
    
    // Reset input để có thể upload lại cùng file
    if (templateImportRef.current) {
      templateImportRef.current.value = '';
    }
  };

  const handleSetDefaultTemplate = async (e: React.MouseEvent<HTMLButtonElement>, template: Template) => {
    e.stopPropagation();
    
    // Nếu template này đã là default rồi thì không cần làm gì
    if (template.isDefault) return;
    
    // Set loading state
    setSettingDefaultTemplateId(template._id || null);
    
    try {
      const response = await fetch('/api/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: template, agentName: phaseName+" Agent" }),
      });
      
      if (response.ok) {
        // Cập nhật state: bỏ isDefault của template cũ, set isDefault cho template mới
        setTemplates(templates.map(t => ({
          ...t,
          isDefault: t._id === template._id
        })));
      }
    } catch (error) {
      console.error('Error setting default template:', error);
    } finally {
      setSettingDefaultTemplateId(null);
    }
  }

  const FileIcon = FileText;

  return (
    <div className="relative flex flex-col h-full bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".txt,.doc,.docx,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileSelect}
      />

      {/* Hidden record input */}
      <input
        ref={recordRef}
        type="file"
        className="hidden"
        accept=".mp3,.mp4,.wav"
        onChange={handleRecordChange}
      />
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsSettingsOpen(false);
              setEditingTemplate(null);
              setIsAddingNew(false);
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
              <div>
                <h3 className="text-lg font-semibold text-[#1a1a2e]">Template Settings</h3>
                <p className="text-sm text-[#6b7280]">Quản lý templates cho {phaseName}</p>
              </div>
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setEditingTemplate(null);
                  setIsAddingNew(false);
                }}
                className="p-2 hover:bg-[#f3f4f6] rounded-lg transition-colors"
              >
                <X size={20} className="text-[#6b7280]" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#e5e7eb]">
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'templates'
                    ? 'text-[#f97316] border-b-2 border-[#f97316] bg-[#fff7ed]'
                    : 'text-[#6b7280] hover:text-[#1a1a2e] hover:bg-[#f9fafb]'
                }`}
              >
                Templates List
              </button>
              <button
                onClick={() => setActiveTab('structure')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'structure'
                    ? 'text-[#f97316] border-b-2 border-[#f97316] bg-[#fff7ed]'
                    : 'text-[#6b7280] hover:text-[#1a1a2e] hover:bg-[#f9fafb]'
                }`}
              >
                Template Structure
              </button>
              <button
                onClick={() => setActiveTab('agent')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'agent'
                    ? 'text-[#f97316] border-b-2 border-[#f97316] bg-[#fff7ed]'
                    : 'text-[#6b7280] hover:text-[#1a1a2e] hover:bg-[#f9fafb]'
                }`}
              >
                Agent Info
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              {activeTab === 'templates' ? (
                /* Templates List Tab */
                <div className="space-y-4">
                  {/* Add New Template Button */}
                  {!isAddingNew ? (
                    <button
                      onClick={() => setIsAddingNew(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#e5e7eb] rounded-xl text-[#6b7280] hover:border-[#f97316] hover:text-[#f97316] hover:bg-[#fff7ed] transition-colors"
                    >
                      <Plus size={18} />
                      Thêm Template mới
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-[#fff7ed] border border-[#fed7aa] rounded-xl">
                      <input
                        type="text"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="Nhập tên template..."
                        className="flex-1 px-3 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#f97316]"
                        autoFocus
                      />
                      <button
                        onClick={async () => await handleAddNewTemplate()}
                        className="p-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingNew(false);
                          setNewTemplateName('');
                        }}
                        className="p-2 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {/* Templates List */}
                  <div className="space-y-2">
                    {isLoadingTemplates ? (
                      /* Loading State */
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-[#f97316] mb-3" />
                        <p className="text-sm text-[#6b7280]">Đang tải templates...</p>
                      </div>
                    ) : templates.length === 0 ? (
                      /* Empty State */
                      <div className="text-center py-8 text-[#6b7280]">
                        <p>Chưa có template nào</p>
                        <p className="text-sm">Nhấn "Thêm Template mới" để bắt đầu</p>
                      </div>
                    ) : (
                      /* Templates */
                      templates.map((template) => (
                        <div
                          key={template._id}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                            selectedTemplate?._id === template._id
                              ? 'border-[#f97316] bg-[#fff7ed]'
                              : 'border-[#e5e7eb] hover:border-[#f97316] hover:bg-[#fafbfc]'
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#1a1a2e]">{template.templateName}</span>
                              {template.isDefault && (
                                <span className="px-2 py-0.5 bg-[#dbeafe] text-[#3b82f6] text-xs font-medium rounded-full">
                                  In use
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[#6b7280] mt-1">
                              {template.pair.length} sections
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTemplate(template);
                                setActiveTab('structure');
                              }}
                              className="p-2 hover:bg-[#e5e7eb] rounded-lg transition-colors"
                              title="Xem cấu trúc"
                            >
                              <ChevronRight size={18} className="text-[#6b7280]" />
                            </button>
                            <button
                              onClick={(e) => handleSetDefaultTemplate(e, template)}
                              className={`p-2 rounded-lg transition-colors ${
                                template.isDefault 
                                  ? 'bg-[#dcfce7] cursor-default' 
                                  : settingDefaultTemplateId === template._id
                                    ? 'bg-[#fff7ed] cursor-wait'
                                    : 'hover:bg-[#dbeafe]'
                              }`}
                              title={template.isDefault ? "Đang sử dụng" : settingDefaultTemplateId === template._id ? "Đang lưu..." : "Chọn làm mặc định"}
                              disabled={template.isDefault || settingDefaultTemplateId !== null}
                            >
                              {settingDefaultTemplateId === template._id ? (
                                <Loader2 size={16} className="animate-spin text-[#f97316]" />
                              ) : (
                                <CheckCircle 
                                  size={16} 
                                  className={template.isDefault ? "text-[#22c55e]" : "text-[#3b82f6]"} 
                                />
                              )}
                            </button>
                            <button
                              onClick={async (e) => {
                                await handleDeleteTemplate(e, template);
                              }}
                              className="p-2 hover:bg-[#fee2e2] rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 size={16} className="text-[#ef4444]" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Edit Template Name Modal */}
                  {editingTemplate && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center">
                      <div className="absolute inset-0 bg-black/30" onClick={() => setEditingTemplate(null)} />
                      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h4 className="text-lg font-semibold text-[#1a1a2e] mb-4">Sửa tên Template</h4>
                        <input
                          type="text"
                          defaultValue={editingTemplate.templateName}
                          className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#f97316] mb-4"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newName = (e.target as HTMLInputElement).value.trim();
                              if (newName) {
                                setTemplates(templates.map(t => 
                                  t._id === editingTemplate._id ? { ...t, templateName: newName } : t
                                ));
                                setEditingTemplate(null);
                              }
                            }
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingTemplate(null)}
                            className="px-4 py-2 text-[#6b7280] hover:bg-[#f3f4f6] rounded-lg transition-colors"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => {
                              const input = document.querySelector('input[defaultValue]') as HTMLInputElement;
                              const newName = input?.value.trim();
                              if (newName) {
                                setTemplates(templates.map(t => 
                                  t._id === editingTemplate._id ? { ...t, templateName: newName } : t
                                ));
                                setEditingTemplate(null);
                              }
                            }}
                            className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === 'structure' ? (
                /* Template Structure Tab */
                <div className="space-y-4">
                  {/* Hidden file input for template import */}
                  <input
                    ref={templateImportRef}
                    type="file"
                    className="hidden"
                    accept='.txt,.doc,.docx,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    onChange={handleTemplateImportChange}
                  />
                  
                  {selectedTemplate ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-[#1a1a2e]">{selectedTemplate.templateName}</h4>
                          <p className="text-sm text-[#6b7280]">Cấu trúc template với {selectedTemplate.pair.length} sections</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleTemplateImportClick}
                            disabled={isImportingTemplate}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isImportingTemplate ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Upload size={16} />
                            )}
                            {isImportingTemplate ? 'Đang xử lý...' : 'Import'}
                          </button>
                          <button
                            onClick={() => {
                              const newPair = { header: 'New Header', content: 'Mô tả nội dung mới...' };
                              const updatedTemplate = {
                                ...selectedTemplate,
                                pair: [...selectedTemplate.pair, newPair]
                              };
                              setSelectedTemplate(updatedTemplate);
                              setTemplates(templates.map(t => t._id === selectedTemplate._id ? updatedTemplate : t));
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#f97316] text-white text-sm rounded-lg hover:bg-[#ea580c] transition-colors"
                          >
                            <Plus size={16} />
                            Thêm Section
                          </button>
                          <button
                            onClick={handleSaveTemplate}
                            disabled={isSavingTemplate}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#10b981] text-white text-sm rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSavingTemplate ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                            {isSavingTemplate ? 'Đang lưu...' : 'Lưu Template'}
                          </button>
                        </div>
                      </div>

                      {/* Loading Overlay khi đang import */}
                      {isImportingTemplate && (
                        <div className="flex items-center gap-3 p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl mb-4">
                          <Loader2 size={20} className="animate-spin text-[#3b82f6]" />
                          <div>
                            <p className="text-sm font-medium text-[#1e40af]">Đang trong quá trình phân tích...</p>
                            <p className="text-xs text-[#3b82f6]">Vui lòng đợi trong giây lát</p>
                          </div>
                        </div>
                      )}

                      <div className={`space-y-3 ${isImportingTemplate ? 'opacity-50 pointer-events-none' : ''}`}>
                        {selectedTemplate.pair.map((pair, index) => (
                          <div
                            key={index}
                            className="p-4 bg-[#fafbfc] border border-[#e5e7eb] rounded-xl"
                          >
                            {editingPairIndex === index ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  defaultValue={pair.header}
                                  placeholder="Header"
                                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm font-medium focus:outline-none focus:border-[#f97316]"
                                  id={`header-${index}`}
                                />
                                <textarea
                                  defaultValue={pair.content}
                                  placeholder="Content"
                                  rows={3}
                                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#f97316] resize-none"
                                  id={`content-${index}`}
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingPairIndex(null)}
                                    className="px-3 py-1.5 text-[#6b7280] hover:bg-[#e5e7eb] rounded-lg text-sm transition-colors"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    onClick={() => {
                                      const headerInput = document.getElementById(`header-${index}`) as HTMLInputElement;
                                      const contentInput = document.getElementById(`content-${index}`) as HTMLTextAreaElement;
                                      if (headerInput && contentInput) {
                                        const updatedPairs = [...selectedTemplate.pair];
                                        updatedPairs[index] = {
                                          header: headerInput.value.trim() || pair.header,
                                          content: contentInput.value.trim() || pair.content
                                        };
                                        const updatedTemplate = { ...selectedTemplate, pair: updatedPairs };
                                        setSelectedTemplate(updatedTemplate);
                                        setTemplates(templates.map(t => t._id === selectedTemplate._id ? updatedTemplate : t));
                                        setEditingPairIndex(null);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-[#10b981] text-white rounded-lg text-sm hover:bg-[#059669] transition-colors"
                                  >
                                    Lưu
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-[#1a1a2e] mb-1">{pair.header}</h5>
                                  <p className="text-sm text-[#6b7280]">{pair.content}</p>
                                </div>
                                <div className="flex items-center gap-1 ml-3">
                                  <button
                                    onClick={() => setEditingPairIndex(index)}
                                    className="p-1.5 hover:bg-[#dbeafe] rounded-lg transition-colors"
                                    title="Sửa"
                                  >
                                    <Pencil size={14} className="text-[#3b82f6]" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const updatedPairs = selectedTemplate.pair.filter((_, i) => i !== index);
                                      const updatedTemplate = { ...selectedTemplate, pair: updatedPairs };
                                      setSelectedTemplate(updatedTemplate);
                                      setTemplates(templates.map(t => t._id === selectedTemplate._id ? updatedTemplate : t));
                                    }}
                                    className="p-1.5 hover:bg-[#fee2e2] rounded-lg transition-colors"
                                    title="Xóa"
                                  >
                                    <Trash2 size={14} className="text-[#ef4444]" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-[#6b7280]">
                      <Settings size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="font-medium">Chưa chọn template</p>
                      <p className="text-sm mt-1">Vui lòng chọn một template từ tab "Templates List" để xem cấu trúc</p>
                      <button
                        onClick={() => setActiveTab('templates')}
                        className="mt-4 px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-sm"
                      >
                        Chọn Template
                      </button>
                    </div>
                  )}
                </div>
              ) : activeTab === 'agent' ? (
                /* Agent Info Tab */
                <div className="space-y-4">
                  {isLoadingAgent ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={32} className="animate-spin text-[#f97316]" />
                    </div>
                  ) : agentInfo ? (
                    <div className="space-y-6">
                      {/* Agent Name */}
                      <div className="p-4 bg-[#fafbfc] border border-[#e5e7eb] rounded-xl">
                        <h4 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                          Agent Name
                        </h4>
                        <p className="text-lg font-medium text-[#1a1a2e]">{agentInfo.agentName}</p>
                      </div>

                      {/* Agent Instructions */}
                      <div className="p-4 bg-[#fafbfc] border border-[#e5e7eb] rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wider">
                            Instructions
                          </h4>
                          {!isEditingInstructions ? (
                            <button
                              onClick={handleStartEditingInstructions}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#3b82f6] hover:bg-[#dbeafe] rounded-lg transition-colors"
                            >
                              <Pencil size={14} />
                              Chỉnh sửa
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleCancelEditingInstructions}
                                className="px-3 py-1.5 text-sm text-[#6b7280] hover:bg-[#e5e7eb] rounded-lg transition-colors"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={handleSaveAgentInstructions}
                                disabled={isSavingAgent}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50"
                              >
                                {isSavingAgent ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Save size={14} />
                                )}
                                {isSavingAgent ? 'Đang lưu...' : 'Lưu thay đổi'}
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {isEditingInstructions ? (
                          /* Edit Mode */
                          <textarea
                            value={editedInstructions}
                            onChange={(e) => setEditedInstructions(e.target.value)}
                            className="w-full h-[400px] p-4 bg-[#282c34] border border-[#3e4451] rounded-lg text-[13px] text-[#abb2bf] resize-none focus:outline-none focus:border-[#f97316]"
                            style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
                            placeholder="Nhập instructions cho agent..."
                          />
                        ) : (
                          /* View Mode */
                          <div className="bg-[#282c34] border border-[#3e4451] rounded-lg max-h-[400px] overflow-y-auto">
                            <div className="p-4">
                              {agentInfo.instructions.split('\n').map((line, index) => (
                                <div key={index} className="flex hover:bg-[#2c313a] -mx-4 px-4">
                                  <span className="text-[#636d83] text-xs select-none w-8 flex-shrink-0 text-right pr-4 py-0.5">
                                    {index + 1}
                                  </span>
                                  <span 
                                    className="text-[13px] text-[#abb2bf] py-0.5 flex-1"
                                    style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
                                  >
                                    {line || '\u00A0'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={fetchAgentInfo}
                          disabled={isEditingInstructions}
                          className="flex items-center gap-2 px-4 py-2 text-[#6b7280] hover:text-[#1a1a2e] hover:bg-[#f3f4f6] rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw size={16} />
                          Tải lại thông tin
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-[#6b7280]">
                      <Bot size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="font-medium">Không tìm thấy thông tin Agent</p>
                      <p className="text-sm mt-1">Agent "{phaseName} Agent" chưa được tạo trong database</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 pb-36 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100%-120px)] text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] rounded-2xl flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-[#f97316]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a2e] mb-2">
              Chào mừng đến {phaseName}
            </h3>
            <p className="text-sm text-[#6b7280] mb-6 max-w-md">
              AI Agent sẵn sàng hỗ trợ bạn trong quá trình {phaseDescription.toLowerCase()}. 
              Hãy bắt đầu bằng cách chọn một gợi ý hoặc nhập câu hỏi của bạn.
            </p>
            
            {/* Quick Prompts */}
            <div className="w-full max-w-lg">
              <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">
                Gợi ý câu hỏi
              </p>
              <div className="grid grid-cols-1 gap-2">
                {phasePrompts[phaseId]?.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    disabled={isTyping || isAgentProcessing}
                    className={`text-left px-4 py-3 bg-[#fafbfc] border border-[#e5e7eb] rounded-xl text-sm transition-all ${
                      isTyping || isAgentProcessing
                        ? 'text-[#9ca3af] cursor-not-allowed opacity-60'
                        : 'text-[#1a1a2e] hover:bg-[#f3f4f6] hover:border-[#f97316] hover:shadow-sm'
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-slide-in ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Avatar */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${message.role === 'user' 
                    ? 'bg-[#3b82f6]' 
                    : 'bg-gradient-to-br from-[#f97316] to-[#ea580c]'
                  }
                `}>
                  {message.role === 'user' 
                    ? <User size={16} className="text-white" />
                    : <Bot size={16} className="text-white" />
                  }
                </div>

                {/* Message Content */}
                <div className={`
                  max-w-[70%] rounded-2xl px-4 py-3
                  ${message.role === 'user'
                    ? 'bg-[#3b82f6] text-white rounded-tr-md'
                    : 'bg-[#f3f4f6] text-[#1a1a2e] rounded-tl-md'
                  }
                `}>
                  <div className={`text-sm prose prose-sm max-w-none break-words ${
                    message.role === 'user' 
                      ? 'prose-invert prose-p:text-white prose-headings:text-white prose-strong:text-white prose-li:text-white' 
                      : 'prose-gray prose-p:text-[#1a1a2e] prose-headings:text-[#1a1a2e] prose-strong:text-[#1a1a2e]'
                  }`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Custom code block styling
                        code: ({ className, children, node, ...props }) => {
                          // Check if this is inline code or block code
                          // Block code is inside <pre>, inline is not
                          const isInline = node?.position?.start.line === node?.position?.end.line && 
                                          !className && 
                                          typeof children === 'string' && 
                                          !children.includes('\n');
                          
                          if (isInline) {
                            return (
                              <code 
                                className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                                  message.role === 'user' 
                                    ? 'bg-blue-500/30 text-white' 
                                    : 'bg-[#f3f4f6] text-[#e11d48]'
                                }`}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }
                          // Block code - just return the code element, pre will handle styling
                          return (
                            <code className={`${className || ''} text-[13px]`} {...props}>
                              {children}
                            </code>
                          );
                        },
                        // Custom pre (code block) styling
                        pre: ({ children }) => (
                          <pre className={`my-2 p-3 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap ${
                            message.role === 'user' 
                              ? 'bg-blue-600/50 text-white' 
                              : 'bg-[#f8f9fa] text-[#1a1a2e] border border-[#e5e7eb]'
                          }`}>
                            {children}
                          </pre>
                        ),
                        // Custom paragraph styling
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                        ),
                        // Custom list styling
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="leading-relaxed">{children}</li>
                        ),
                        // Custom heading styling
                        h1: ({ children }) => (
                          <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>
                        ),
                        // Custom link styling
                        a: ({ href, children }) => (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`underline ${
                              message.role === 'user' 
                                ? 'text-blue-200 hover:text-white' 
                                : 'text-[#f97316] hover:text-[#ea580c]'
                            }`}
                          >
                            {children}
                          </a>
                        ),
                        // Custom blockquote styling
                        blockquote: ({ children }) => (
                          <blockquote className={`border-l-4 pl-3 my-2 italic ${
                            message.role === 'user' 
                              ? 'border-blue-300 text-blue-100' 
                              : 'border-[#f97316] text-[#6b7280]'
                          }`}>
                            {children}
                          </blockquote>
                        ),
                        // Custom table styling
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-2">
                            <table className="min-w-full border-collapse text-xs">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className={`border px-2 py-1 text-left font-semibold ${
                            message.role === 'user' 
                              ? 'border-blue-400 bg-blue-500/30' 
                              : 'border-[#e5e7eb] bg-[#f3f4f6]'
                          }`}>
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className={`border px-2 py-1 ${
                            message.role === 'user' 
                              ? 'border-blue-400' 
                              : 'border-[#e5e7eb]'
                          }`}>
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {cleanMarkdownContent(message.content)}
                    </ReactMarkdown>
                  </div>
                  <div className={`
                    flex items-center gap-2 mt-2 text-xs
                    ${message.role === 'user' ? 'text-blue-200 justify-end' : 'text-[#9ca3af]'}
                  `}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1 ml-2">
                        <button className="p-1 hover:bg-[#e5e7eb] rounded transition-colors">
                          <Copy size={12} />
                        </button>
                        <button className="p-1 hover:bg-[#e5e7eb] rounded transition-colors">
                          <RefreshCw size={12} />
                        </button>
                        <button className="p-1 hover:bg-[#ecfdf5] hover:text-[#10b981] rounded transition-colors">
                          <ThumbsUp size={12} />
                        </button>
                        <button className="p-1 hover:bg-[#fef2f2] hover:text-[#ef4444] rounded transition-colors">
                          <ThumbsDown size={12} />
                        </button>
                        {/* Download as .docx button */}
                        <button 
                          onClick={() => handleDownload(message.content)}
                          className="ml-1 px-2 py-1 bg-[#3b82f6] text-white rounded-md transition-all flex items-center gap-1 shadow-sm hover:bg-[#2563eb] hover:shadow-md"
                          title="Tải xuống .docx"
                        >
                          <Download size={14} />
                          
                        </button>
                        {/* Save to Obsidian button - only shows when Obsidian mode is active */}
                        {isObsidianMode && (
                          <button 
                            onClick={() => handleSaveToObsidian(message.content, message.id)}
                            disabled={savingMessageId === message.id}
                            className={`ml-2 px-2.5 py-1 text-white rounded-md transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md ${
                              savingMessageId === message.id 
                                ? 'bg-[#9ca3af] cursor-not-allowed' 
                                : 'bg-[#7c3aed] hover:bg-[#6d28d9]'
                            }`}
                            title="Save to Obsidian"
                          >
                            {savingMessageId === message.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                            <span className="text-xs font-medium">
                              {savingMessageId === message.id ? 'Saving...' : 'Save'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {(isTyping || isAgentProcessing) && (
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isObsidianMode 
                    ? 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9]'
                    : 'bg-gradient-to-br from-[#f97316] to-[#ea580c]'
                }`}>
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-[#f3f4f6] rounded-2xl rounded-tl-md px-4 py-3">
                  {isAgentProcessing ? (
                    <div className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className={`animate-spin ${isObsidianMode ? 'text-[#7c3aed]' : 'text-[#f97316]'}`} />
                        <span>
                          {isObsidianMode 
                            ? 'Obsidian Agent đang xử lý yêu cầu...'
                            : 'Đang tìm kiếm thông tin liên quan đến yêu cầu...'
                          }
                        </span>
                      </div>
                      {isObsidianMode && (
                        <div className="text-xs text-[#9ca3af] ml-6">
                          Kết nối với Obsidian vault để xử lý
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                      <span className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Floating Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Gradient Fade Effect */}
        <div className="h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        
        <div className="px-5 pb-5 bg-white/95 backdrop-blur-sm">
          {/* Attached File Preview */}
          {attachedFile && (
            <div className="mb-3">
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                attachedFile.error 
                  ? 'bg-[#fef2f2] border-[#fecaca]' 
                  : attachedFile.isProcessing 
                    ? 'bg-[#fff7ed] border-[#fed7aa]'
                    : 'bg-[#ecfdf5] border-[#a7f3d0]'
              }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  attachedFile.error 
                    ? 'bg-[#fee2e2] text-[#ef4444]'
                    : attachedFile.isProcessing
                      ? 'bg-[#ffedd5] text-[#f97316]'
                      : 'bg-[#d1fae5] text-[#10b981]'
                }`}>
                  {attachedFile.isProcessing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <FileIcon size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a2e] truncate">{attachedFile.name}</p>
                  <p className="text-xs text-[#6b7280]">
                    {attachedFile.error 
                      ? <span className="text-[#ef4444]">{attachedFile.error}</span>
                      : attachedFile.isProcessing 
                        ? 'Đang đọc nội dung file...'
                        : `Đã sẵn sàng • ${attachedFile.content?.length} ký tự`
                    }
                  </p>
                </div>
                <button 
                  onClick={handleRemoveFile}
                  className="p-1.5 hover:bg-black/10 rounded-lg transition-colors"
                >
                  <X size={16} className="text-[#6b7280]" />
                </button>
              </div>
            </div>
          )}

          {/* Attached Record Preview */}
          {attachedRecord && (
            <div className="mb-3">
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                attachedRecord.error 
                  ? 'bg-[#fef2f2] border-[#fecaca]' 
                  : attachedRecord.isTranscribing
                    ? 'bg-[#fff7ed] border-[#fed7aa]'
                    : attachedRecord.transcription
                      ? 'bg-[#ecfdf5] border-[#a7f3d0]'
                      : 'bg-[#eff6ff] border-[#bfdbfe]'
              }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  attachedRecord.error 
                    ? 'bg-[#fee2e2] text-[#ef4444]'
                    : attachedRecord.isTranscribing
                      ? 'bg-[#ffedd5] text-[#f97316]'
                      : attachedRecord.transcription
                        ? 'bg-[#d1fae5] text-[#10b981]'
                        : 'bg-[#dbeafe] text-[#3b82f6]'
                }`}>
                  {attachedRecord.isTranscribing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : attachedRecord.name.endsWith('.mp4') ? (
                    <Video size={18} />
                  ) : (
                    <Music size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a2e] truncate">{attachedRecord.name}</p>
                  <p className="text-xs text-[#6b7280]">
                    {attachedRecord.error 
                      ? <span className="text-[#ef4444]">{attachedRecord.error}</span>
                      : attachedRecord.isTranscribing
                        ? <span className="text-[#f97316]">Đang transcribe audio...</span>
                        : attachedRecord.transcription
                          ? <span className="text-[#10b981]">Đã transcribe • {attachedRecord.transcription.length} ký tự</span>
                          : `${attachedRecord.name.endsWith('.mp4') ? 'Video' : 'Audio'} • ${formatFileSize(attachedRecord.size)}`
                    }
                  </p>
                  {/* Show transcription preview */}
                  {attachedRecord.transcription && (
                    <p className="text-xs text-[#6b7280] mt-1 line-clamp-2">
                      {attachedRecord.transcription.substring(0, 100)}
                      {attachedRecord.transcription.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>
                <button 
                  onClick={handleRemoveRecord}
                  disabled={attachedRecord.isTranscribing}
                  className={`p-1.5 rounded-lg transition-colors ${
                    attachedRecord.isTranscribing 
                      ? 'cursor-not-allowed opacity-50' 
                      : 'hover:bg-black/10'
                  }`}
                >
                  <X size={16} className="text-[#6b7280]" />
                </button>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="relative">
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-lg focus-within:border-[#f97316] focus-within:ring-2 focus-within:ring-[#fff7ed] focus-within:shadow-xl transition-all">
              {/* Textarea - Full Width */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping || isAgentProcessing}
                placeholder={
                  isTyping || isAgentProcessing 
                    ? "Agent đang xử lý..." 
                    : attachedFile?.content 
                      ? "Thêm câu hỏi về file (Enter để gửi)..." 
                      : "Nhập câu hỏi của bạn..."
                }
                rows={1}
                className={`w-full px-4 py-4 bg-transparent resize-none outline-none text-[15px] leading-relaxed text-[#1a1a2e] placeholder:text-[#9ca3af] max-h-32 rounded-t-2xl ${
                  isTyping || isAgentProcessing ? 'cursor-not-allowed opacity-60' : ''
                }`}
                style={{ minHeight: '44px' }}
              />

              {/* Bottom Toolbar */}
              <div className="flex items-center justify-between px-2 py-2 border-t border-[#f3f4f6]">
                {/* Left Side Buttons */}
                <div className="flex items-center gap-1">
                  {/* Attach File Button */}
                  <button
                    type="button"
                    onClick={handleAttachClick}
                    disabled={isTyping || isAgentProcessing}
                    className={`p-2 rounded-lg transition-colors ${
                      isTyping || isAgentProcessing
                        ? 'text-[#d1d5db] cursor-not-allowed'
                        : attachedFile?.content 
                          ? 'text-[#10b981] bg-[#ecfdf5]' 
                          : 'text-[#6b7280] hover:text-[#f97316] hover:bg-[#fff7ed]'
                    }`}
                    title="Đính kèm file (.txt, .docx)"
                  >
                    <Paperclip size={18} />
                  </button>

                  {/* Options Menu Button */}
                  <div className="relative" ref={optionsMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                      className={`p-2 rounded-lg transition-colors ${
                        isOptionsMenuOpen
                          ? 'text-[#f97316] bg-[#fff7ed]'
                          : 'text-[#6b7280] hover:text-[#f97316] hover:bg-[#fff7ed]'
                      }`}
                      title="Tùy chọn"
                    >
                      <SlidersHorizontal size={18} />
                    </button>

                    {/* Options Popup Menu */}
                    {isOptionsMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl border border-[#e5e7eb] shadow-xl z-50 overflow-hidden animate-scale-in">
                        {/* Menu Header */}
                        <div className="px-4 py-3 border-b border-[#e5e7eb] bg-[#fafbfc]">
                          <p className="text-sm font-medium text-[#1a1a2e]">Tùy chọn</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {/* Obsidian Agent Toggle */}
                          <div className="px-4 py-3 hover:bg-[#f9fafb] transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  isObsidianMode ? 'bg-[#7c3aed]' : 'bg-[#f3f4f6]'
                                }`}>
                                  <Sparkles size={16} className={isObsidianMode ? 'text-white' : 'text-[#6b7280]'} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[#1a1a2e]">Obsidian Agent</p>
                                  <p className="text-xs text-[#6b7280]">Kết nối với Obsidian vault</p>
                                </div>
                              </div>
                              {/* Toggle Switch */}
                              <button
                                type="button"
                                onClick={() => setIsObsidianMode(!isObsidianMode)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${
                                  isObsidianMode ? 'bg-[#7c3aed]' : 'bg-[#e5e7eb]'
                                }`}
                              >
                                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                                  isObsidianMode ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                          </div>
                          

                          {/* Divider */}
                          <div className="my-1 border-t border-[#e5e7eb]" />

                          {/* Settings */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTemplate(null);
                              setIsSettingsOpen(true);
                              setIsOptionsMenuOpen(false);
                            }}
                            className="w-full px-4 py-3 hover:bg-[#f9fafb] transition-colors flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#f3f4f6] flex items-center justify-center">
                              <Settings size={16} className="text-[#6b7280]" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-[#1a1a2e]">Settings</p>
                              <p className="text-xs text-[#6b7280]">Quản lý templates và agent</p>
                            </div>
                            <ChevronRight size={16} className="ml-auto text-[#9ca3af]" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Obsidian Mode Indicator */}
                  {isObsidianMode && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#7c3aed]/10 text-[#7c3aed] rounded-lg text-xs font-medium ml-1">
                      <Sparkles size={12} />
                      <span>Obsidian</span>
                      <button
                        type="button"
                        onClick={() => setIsObsidianMode(false)}
                        className="ml-1 p-0.5 hover:bg-[#7c3aed]/20 rounded transition-colors"
                        title="Tắt Obsidian Mode"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Side Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleRecordClick}
                    type="button"
                    disabled={isTyping || isAgentProcessing}
                    className={`p-2 rounded-lg transition-colors ${
                      isTyping || isAgentProcessing
                        ? 'text-[#d1d5db] cursor-not-allowed'
                        : 'text-[#6b7280] hover:text-[#f97316] hover:bg-[#fff7ed]'
                    }`}
                    title="Ghi âm"
                  >
                    <Mic size={18} />
                  </button>
                  <button
                    type="submit"
                    disabled={isTyping || isAgentProcessing || (!input.trim() && !attachedFile?.content)}
                    className={`
                      p-2 rounded-xl transition-all
                      ${isTyping || isAgentProcessing
                        ? 'bg-[#f97316] text-white cursor-not-allowed'
                        : (input.trim() || attachedFile?.content)
                          ? 'bg-[#f97316] text-white hover:bg-[#ea580c] shadow-sm hover:shadow-md'
                          : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                      }
                    `}
                  >
                    {isTyping || isAgentProcessing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
