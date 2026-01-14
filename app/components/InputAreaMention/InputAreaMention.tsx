'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useState } from 'react'

// 1. Import hàm factory thay vì object tĩnh
import { createSuggestion } from './suggestion'
import AttackedFilePreview from '../InputArea/AttackedFilePreview'
import AttackRecordPreview from '../InputArea/AttackRecordPreview'
import BottomToolBar from '../InputArea/BottomToolBar'
import { useAppState } from '@/app/store'
import { AttachedFile, AttachedRecord } from '@/app/models/types'
import { MentionDB } from '@/app/models/mentionDB'
import ToolModal from '../Tool/ToolModal'
import ToolListModal from '../Tool/ToolListModal'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3001"
const apiUrl = `${baseUrl}/tools_management/get_tools`

interface InputAreaMentionProps {
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
  lastSavedNote: any
}

export default function ChatInput({ 
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
}: InputAreaMentionProps) {

  const refreshTool = useAppState(state => state.refreshTool);
  const setRefreshTool = useAppState(state => state.setRefreshTool);

  const phaseId = useAppState(state => state.activePhase);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [attachedRecord, setAttachedRecord] = useState<AttachedRecord | null>(null);
  const threadIdRef = useRef<string>(`thread-${phaseId}-${Date.now()}`);
  // Store last saved note info for context continuity
  // 2. TẠO BIẾN CỜ HIỆU (REF)
  // Dùng useRef để theo dõi menu đóng/mở mà không gây re-render component liên tục
  const isMentionOpenRef = useRef(false);
  const [currentMention, setCurrentMention] = useState<any>(null);
  const [currentMentionDoc, setCurrentMentionDoc] = useState<MentionDB | null>(null);
  

  // Ref để lưu mentions mới nhất (luôn up-to-date, không trigger re-render)
  const mentionsRef = useRef<MentionDB[]>([]);
  const isLoadingMentionRef = useRef(false);
  const [showToolModal, setShowToolModal] = useState(false);
  
  const [tools, setTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  //const [isLoadingMention, setIsLoaddingMentions] = useState(false);


  useEffect(() => {
    // Create a new thread ID for each phase to maintain separate conversation contexts
    threadIdRef.current = `thread-${phaseId}-${Date.now()}`;
  }, [phaseId]);


  // Fetch mentions từ MongoDB
  const fetchMentions = async () => {
    setIsLoadingTools(true);
    isLoadingMentionRef.current = true;
    console.log("Start fetching mention");
    try {
      const response = await fetch(`/api/mentions?phaseId=${phaseId}`);
      if (response.ok) {
        const data = await response.json();

        const toolResponse = await fetch(`${apiUrl}/${phaseId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const toolData = await toolResponse.json();
        setTools(toolData);

        const mentionTools = toolData.map((tool:any) => {
          return {
            label: tool.toolName,
            description: tool.toolDescription,
            type: 'tool',
          }
        });

        const combineData = [...data, ...mentionTools]

        mentionsRef.current = combineData;
        isLoadingMentionRef.current = false;
        setIsLoadingTools(false);

      } else {
        console.error('Failed to fetch mentions');
      }
    } catch (error) {
      console.error('Error fetching mentions:', error);
    }
    console.log("End fetching mention");
  };



  // Fetch mentions khi component mount và khi phaseId thay đổi
  useEffect(() => {
    
    fetchMentions();
   
  }, [phaseId, refreshTool]);

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // console.log("InputAreaMention Input: "+input);

    // return;
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
        console.log("Current mention: ", currentMention);
        console.log("Current mention doc: ", currentMentionDoc);
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

      let response = null;
 
        response = await fetch('/api/agent/ui-analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            documentContent,
            threadId: threadIdRef.current,
            resourceId: `user-${phaseId}`,
            phaseId: phaseId,
          }),
        });

      

      const data = await response.json();
      console.log("=====data get response from discovery agent:===== ", data);
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



  useEffect(() => {
    if (!editor) return

    // Lấy nội dung hiện tại của editor (dạng text thuần)
    const currentContent = editor.getText()

    // Chỉ cập nhật nếu nội dung mới KHÁC nội dung hiện tại
    // (Điều này cực kỳ quan trọng để tránh con trỏ bị nhảy lung tung khi bạn đang gõ)
    if (input !== currentContent) {
      
      // Lệnh setContent của Tiptap thay thế cho inputRef.current.value
      editor.commands.setContent(input)
      
      // Tùy chọn: Đưa con trỏ về cuối dòng sau khi chèn
      editor.commands.focus('end')
    }
  }, [input])
  
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          // Class này sẽ được gán cho thẻ <span> bao quanh text @mention
          class: [
            'px-1.5 py-0.5',           // Padding tạo khoảng cách
            'rounded-md',              // Bo tròn góc
            'bg-blue-100/50',          // Màu nền xanh nhạt (giống Cursor)
            'text-blue-600',           // Màu chữ xanh đậm
            'border border-blue-200',  // Viền mỏng bao quanh
            'font-medium',             // Chữ đậm hơn chút
            'decoration-clone',        // Giữ style nếu thẻ bị ngắt dòng
            'mr-0.5',                  // Cách lề phải một chút
            'inline-block',            // Giúp thẻ cư xử như một khối khối hộp
            'align-middle'             // Căn giữa theo dòng kẻ
          ].join(' '),
        },
    
        // 3. TRUYỀN CALLBACK VÀ MENTIONS REF VÀO SUGGESTION
        suggestion: createSuggestion(
          (isOpen) => {
          // Cập nhật trạng thái ngay lập tức khi menu đóng/mở
          isMentionOpenRef.current = isOpen
        },
        (mention) => {
          setCurrentMention(mention);
        },
        (mentionDoc) => {
          setCurrentMentionDoc(mentionDoc);
        },
        isLoadingMentionRef,
        mentionsRef // Truyền ref để luôn có data mới nhất
      ),
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (isTyping || isAgentProcessing) return "Agent đang xử lý..."
          if (attachedFile?.content) return "Thêm câu hỏi về file (Enter để gửi)..."
          return "Nhập câu hỏi của bạn (Gõ @ để chọn tool)..."
        },
        emptyNodeClass: 'is-empty before:text-[#9ca3af] before:content-[attr(data-placeholder)] before:float-left before:pointer-events-none before:h-0',
      }),
    ],
    content: input,
    
    // Đồng bộ state input khi gõ
    onUpdate: ({ editor }) => {
       setInput(editor.getText()) 
    },

    editorProps: {
      attributes: {
        class: 'w-full px-4 py-4 bg-transparent outline-none text-[15px] leading-relaxed text-[#1a1a2e] max-h-32 overflow-y-auto min-h-[44px] prose prose-sm max-w-none dark:prose-invert',
      },
      // 4. XỬ LÝ LOGIC PHÍM ENTER
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          
          // CASE A: Nếu menu Mention đang mở -> RETURN FALSE
          // Để mặc cho Extension Mention xử lý việc chọn item trong list
          if (isMentionOpenRef.current) {
            return false 
          }

          // CASE B: Nếu đang loading -> CHẶN
          if (isTyping || isAgentProcessing) return true
          
          // CASE C: Menu đóng -> SUBMIT FORM
          // Gọi hàm submit và ngăn hành vi xuống dòng mặc định
          const fakeEvent = {
            preventDefault: () => {},
          } as React.FormEvent;
          handleSubmit(fakeEvent); 
          return true
        }
        return false
      }
    },
  })

  // Disable editor khi agent đang chạy
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isTyping && !isAgentProcessing)
    }
  }, [isTyping, isAgentProcessing, editor])

  // Clear editor khi submit thành công (khi props input về rỗng)
  useEffect(() => {
    if (editor && input === '') {
      if (editor.getText() !== '') {
        editor.commands.clearContent()
      }
    }
  }, [input, editor])

  if (!editor) return null

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      <div className="h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />

      <div className="px-5 pb-5 bg-white/95 backdrop-blur-sm">
        
        {attachedFile && (
           <AttackedFilePreview attachedFile={attachedFile} setAttachedFile={setAttachedFile} />
        )}
        {attachedRecord && (
           <AttackRecordPreview attachedRecord={attachedRecord} setAttachedRecord={setAttachedRecord} />
        )}

        <form 
          onSubmit={(e) => {
             e.preventDefault(); 
             // Logic submit an toàn: Lấy HTML mới nhất từ editor
             // const finalContent = editor.getHTML(); 
             handleSubmit(e);
             editor.commands.clearContent();
          }} 
          className="relative"
        >
          <div className={`
             bg-white rounded-2xl border border-[#e5e7eb] shadow-lg transition-all
             ${(isTyping || isAgentProcessing) ? 'opacity-60 cursor-not-allowed' : 'focus-within:border-[#f97316] focus-within:ring-2 focus-within:ring-[#fff7ed] focus-within:shadow-xl'}
          `}>
            
            <EditorContent editor={editor}   />

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


      <ToolListModal 
            isLoadingTools={isLoadingTools}
            setSelectedTool={setSelectedTool}
            tools={tools}
            setTools={setTools}
            refreshTool={refreshTool}
            setShowToolModal={setShowToolModal}            
        />
      
        <ToolModal 
            setSelectedTool={setSelectedTool}
            selectedTool={selectedTool}            
            refreshTool={refreshTool}
            setRefreshTool={setRefreshTool}
            isOpen={showToolModal} 
            setIsOpen={setShowToolModal}
            
        />

        
    
    </div>



  )
}