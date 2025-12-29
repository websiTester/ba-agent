'use client';

import { useState, useRef, useEffect } from 'react';

import { Message, PhaseId } from '../models/types';
import SettingModel from './Setting/SettingModel';
import MessageArea from './MessageArea/MessageArea';
import InputArea from './InputArea/InputArea';
import InputAreaMention from './InputAreaMention/InputAreaMention';


export interface ChatPanelProps {
  phaseId: PhaseId;
  phaseName: string;
  phaseDescription: string;
  messages: Message[];
  onSendMessage: (content: string, role?: 'user' | 'assistant') => void;
}



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




export default function ChatPanel({ 
  phaseId, 
  phaseName, 
  phaseDescription, 
  messages, 
  onSendMessage 
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Separate Thread ID for Obsidian Agent - persistent across the session
  const obsidianThreadIdRef = useRef<string>(`obsidian-thread-${Date.now()}`);
  
  // Store last saved note info for context continuity
  const [lastSavedNote, setLastSavedNote] = useState<{ title: string; content: string } | null>(null);



  // Agent Mode Toggle State (Origin Agent / Obsidian Agent)
  const [isObsidianMode, setIsObsidianMode] = useState(false);

  // Template Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    // Options Menu State
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

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






  //const FileIcon = FileText;

  return (
    <div className="relative flex flex-col h-full bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingModel
          phaseName={phaseName}
          phaseId={phaseId}
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
        />
      )}

      {/* Messages Area */}
      <MessageArea
          messages={messages}
          phaseName={phaseName}
          phaseDescription={phaseDescription}
          phasePrompts={phasePrompts}
          isTyping={isTyping}
          isAgentProcessing={isAgentProcessing}
          setInput={setInput}
          inputRef={inputRef}
          setIsAgentProcessing={setIsAgentProcessing}
          obsidianThreadIdRef={obsidianThreadIdRef}
          onSendMessage={onSendMessage}
          isObsidianMode={isObsidianMode}
          setLastSavedNote={setLastSavedNote}

      />

      {/* Input Area - Floating Overlay */}
      <InputAreaMention
      isTyping={isTyping}
      isAgentProcessing={isAgentProcessing}
      setInput={setInput}
      input={input}
      isObsidianMode={isObsidianMode}
      setIsObsidianMode={setIsObsidianMode}
      onSendMessage={onSendMessage}
      setIsTyping={setIsTyping}
      setIsAgentProcessing={setIsAgentProcessing}
      obsidianThreadIdRef={obsidianThreadIdRef}
      setIsSettingsOpen={setIsSettingsOpen}
      lastSavedNote={lastSavedNote}
      />
    </div>
  );
}
