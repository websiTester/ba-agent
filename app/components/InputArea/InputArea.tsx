'use client'
import { AttachedFile, AttachedRecord } from "@/app/models/types";
import { useAppState } from "@/app/store";
import { useEffect, useRef, useState } from "react";
import AttackedFilePreview from "./AttackedFilePreview";
import AttackRecordPreview from "./AttackRecordPreview";
import BottomToolBar from "./BottomToolBar";


interface InputAreaProb {
  isTyping: boolean,
  isAgentProcessing: boolean,
  setInput: any,
  input: string,
  isObsidianMode: boolean,
  setIsObsidianMode: any,
  onSendMessage: any,
  setIsTyping: any,
  setIsAgentProcessing: any,
  obsidianThreadIdRef: any,
  setIsSettingsOpen: any,
  lastSavedNote: any,
  inputRef: any
}


export default function InputArea({
  inputRef,
  isTyping,
  isAgentProcessing,
  setInput,
  input,
  isObsidianMode,
  setIsObsidianMode,
  onSendMessage,
  setIsTyping,
  setIsAgentProcessing,
  obsidianThreadIdRef,
  setIsSettingsOpen,
  lastSavedNote
}: InputAreaProb) {

  const phaseId = useAppState(state => state.activePhase);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [attachedRecord, setAttachedRecord] = useState<AttachedRecord | null>(null);
  const threadIdRef = useRef<string>(`thread-${phaseId}-${Date.now()}`);
  // Store last saved note info for context continuity

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping && !isAgentProcessing) {
        handleSubmit(e);
      }
    }
  };



  useEffect(() => {
    // Create a new thread ID for each phase to maintain separate conversation contexts
    threadIdRef.current = `thread-${phaseId}-${Date.now()}`;
  }, [phaseId]);

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



    setAttachedFile(null);
    setInput('');
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


      return data.response;
    } catch (error) {
      console.error('Obsidian Agent Error:', error);
      throw error;
    } finally {
      setIsAgentProcessing(false);
    }
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


  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">


      {/* Gradient Fade Effect */}
      <div className="h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />

      <div className="px-5 pb-5 bg-white/95 backdrop-blur-sm">
        {/* Attached File Preview */}
        {attachedFile && (
          <AttackedFilePreview
            attachedFile={attachedFile}
            setAttachedFile={setAttachedFile}
          />
        )}

        {/* Attached Record Preview */}
        {attachedRecord && (
          <AttackRecordPreview
            attachedRecord={attachedRecord}
            setAttachedRecord={setAttachedRecord}
          />
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
              className={`w-full px-4 py-4 bg-transparent resize-none outline-none text-[15px] leading-relaxed text-[#1a1a2e] placeholder:text-[#9ca3af] max-h-32 rounded-t-2xl ${isTyping || isAgentProcessing ? 'cursor-not-allowed opacity-60' : ''
                }`}
              style={{ minHeight: '44px' }}
            />

            {/* Bottom Toolbar */}
            <BottomToolBar
              setAttachedFile={setAttachedFile}
              setAttachedRecord={setAttachedRecord}
              isTyping={isTyping}
              isAgentProcessing={isAgentProcessing}
              attachedFile={attachedFile}
              isObsidianMode={isObsidianMode}
              setIsObsidianMode={setIsObsidianMode}
              setIsSettingsOpen={setIsSettingsOpen}
              input={input}
            />
          </div>
        </form>
      </div>
    </div>
  );
}