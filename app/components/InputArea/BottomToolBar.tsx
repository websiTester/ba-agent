'use client'
import { AttachedFile } from "@/app/models/types";
import { isValidChatFileType } from "@/app/utils/isValidChatFileType";
import { isValidRecordFileType } from "@/app/utils/isValidRecordFileType";
import { readFileContent } from "@/app/utils/readFileContent";
import { ChevronRight, Loader2, Mic, Paperclip, Send, Settings, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import OptionMenu from "./OptionMenu";


interface BottomToolBarProps {
    setAttachedFile: any;
    setAttachedRecord: any;
    isTyping: boolean;
    isAgentProcessing: boolean;
    attachedFile: AttachedFile | null;
    isObsidianMode: boolean;
    setIsObsidianMode: any;
    setIsSettingsOpen: any;
    input: string;
}


export default function BottomToolBar({
    setAttachedFile,
    setAttachedRecord,
    isTyping,
    isAgentProcessing,
    attachedFile,
    isObsidianMode,
    setIsObsidianMode,
    setIsSettingsOpen,
    input
}: BottomToolBarProps) {

    const fileInputRef = useRef<HTMLInputElement>(null);
    const recordRef = useRef<HTMLInputElement>(null);
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const optionsMenuRef = useRef<HTMLDivElement>(null);



    const handleAttachClick = () => {
        fileInputRef.current?.click();
      };

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
          setAttachedFile((prev: any) => prev ? {
            ...prev,
            isProcessing: false,
            content
          } : null);
        } catch (error) {
          setAttachedFile((prev: any) => prev ? {
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
            setAttachedRecord((prev: any) => prev ? {
              ...prev,
              isTranscribing: false,
              transcription: data.transcription,
            } : null);
            console.log("Transcription completed:", data.transcription);
          } else {
            // Handle error
            setAttachedRecord((prev: any) => prev ? {
              ...prev,
              isTranscribing: false,
              error: data.error || 'Không thể transcribe file',
            } : null);
            console.error("Transcription error:", data.error);
          }
        } catch (error) {
          console.error("Transcription API error:", error);
          setAttachedRecord((prev: any) => prev ? {
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

      const handleRecordClick = () => {
        recordRef.current?.click();
      };
    
    

    return (
        <div className="flex items-center justify-between px-2 py-2 border-t border-[#f3f4f6]">

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
                      <OptionMenu
                        isObsidianMode={isObsidianMode}
                        setIsObsidianMode={setIsObsidianMode}
                        setIsSettingsOpen={setIsSettingsOpen}
                        setIsOptionsMenuOpen={setIsOptionsMenuOpen}
                      />
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
    );
}