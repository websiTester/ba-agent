'use client';

import {
  FolderSearch,
  ClipboardCheck,
  FileText,
  Users,
  ChevronLeft,
  LogIn,
  LogOut,
  ChevronDown,
  UploadCloud,
  Wrench,
  Send,
  X,
  FileIcon,
  Loader2,
} from 'lucide-react';
import { PhaseId } from '../models/types';
import Link from 'next/link';
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { formatFileSize } from '../utils/formatFileSize';
import { readFileContent } from '../utils/readFileContent';
import { useAppState } from '../store';
import { Tool } from '../models/tool';
import { getRawJson } from '../utils/getRawJson';
import { parseAgentResponseTwoSteps, safeJsonParse } from '../utils/jsonHelper';
import ToolListModal from './Tool/ToolListModal';
import ToolModal from './Tool/ToolModal';
import PromptModal from './MessageArea/PromptModal';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3001"
const apiUrl = `${baseUrl}/tools_management/get_tools`

export interface User {
  email: string;
}



interface SidebarProps {
  activePhase: PhaseId;
  onPhaseChange: (phase: PhaseId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: User | null;
  onLogout: () => void;
  onSendMessage: any;
  handleAIResponse: any
}

const phases = [
  {
    id: 'discovery' as PhaseId,
    name: 'Discovery & Requirements',
    shortName: 'Discovery',
    icon: FolderSearch,
    badge: null,
  },
  {
    id: 'analysis' as PhaseId,
    name: 'Analysis & Validation',
    shortName: 'Analysis',
    icon: ClipboardCheck,
    badge: null,
  },
  {
    id: 'documentation' as PhaseId,
    name: 'Documentation',
    shortName: 'Docs',
    icon: FileText,
    badge: null,
  },
  {
    id: 'communication' as PhaseId,
    name: 'Communication & Handoff',
    shortName: 'Handoff',
    icon: Users,
    badge: null,
  }
];
export const TIME_OUT = 3000000;
export default function Sidebar({handleAIResponse, onSendMessage, activePhase, onPhaseChange, collapsed, onToggleCollapse, user, onLogout }: SidebarProps) {
  // State
  const setShowToolListModal = useAppState(state => state.setShowToolListModal);
  const setIsAgentProcessing = useAppState(state => state.setIsAgentProcessing);
  const refreshTool = useAppState(state => state.refreshTool);
  const setRefreshTool = useAppState(state => state.setRefreshTool);

  const isAgentProcessing = useAppState(state => state.isAgentProcessing);
  const phaseId = useAppState(state => state.activePhase);

  const [showToolModal, setShowToolModal] = useState(false);
  const [selectedToolsItem, setSelectedToolsItem] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState('');
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolData, setToolData] = useState<any[]>([]);
  const [userMessage, setUserMessage] = useState('');

  // Ref cho input file ẩn
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get initials from email
  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    if (name.length >= 2) {
      return name.substring(0, 2).toUpperCase();
    }
    return name.toUpperCase();
  };

  // Toggle chọn tool
  const toggleTool = (label: string, toolPrompt: string) => {
    console.log("ToolPrompt: "+toolPrompt);
    
    setSelectedToolsItem(prev =>
      prev.some(item => item.label == label)
        ? prev.filter(item => item.label !== label)
        : [...prev, {label,toolPrompt}]
    );
    
  };

  const fetchTools = async () => {
    setIsLoadingTools(true);
    try {
      const toolResponse = await fetch(`${apiUrl}/${activePhase}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const toolData = await toolResponse.json();
      setToolData(toolData);
      // setTools(toolData); // Dòng này thừa nếu bạn map lại ở dưới, nhưng giữ logic cũ của bạn

      const mentionTools = toolData.map((tool: any) => {
        return {
          label: tool.toolName,
          description: tool.toolDescription,
          type: 'tool',
          toolPrompt: tool.toolPrompt
        }
      });

      setTools(mentionTools);
      setIsLoadingTools(false);

    } catch (error) {
      console.error('Error fetching tools:', error);
      setIsLoadingTools(false); // Đảm bảo tắt loading khi lỗi
    }
  };

  // Xử lý khi click nút Upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };


  // Xử lý khi file thay đổi
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      setUploadedFiles(fileList);
      updateFileContent(fileList);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  async function updateFileContent(fileList: File[]) {
    let content = '';
    for (const file of fileList) {
      const fileText = await readFileContent(file);
      content += `Nội dung file ${file.name}: 
       \n\n ${fileText} 
       \n\n`;
    }
    setFileContent(content);
  }

  const removeFile = (indexToRemove: number) => {
    const newList = uploadedFiles.filter((_, index) => index != indexToRemove);
    setUploadedFiles(newList);
    updateFileContent(newList);
  };

  const callAgent = async (message: string, documentContent: string='') => {
    console.log("Calling Agent with message: "+message);
    console.log(`Selected tool: ${selectedToolsItem}`)
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
            selectedTools: selectedToolsItem,
            threadId: `user-${phaseId}`,
            phaseId: phaseId,
          }),
          signal: AbortSignal.timeout(TIME_OUT)
        });


      const result = await response.json();
      response = result.response;
      
      console.log( `RESPONSE: ${response}`);
      return response;
    } catch (error) {
      console.error('Discovery Agent Error:', error);
      throw error;
    } finally {
      setIsAgentProcessing(false);
    }
  };

  const processRequest = async () => {
    
    //console.log(userMessage);
    const aiResponse = await callAgent(userMessage, fileContent);
    console.log(`AIResponse length: ${aiResponse.length}`)

    //onSendMessage(aiResponse, 'assistant');
    handleAIResponse(aiResponse);
    setUserMessage('');
    setSelectedToolsItem([]);
    setFileContent('');
  }


  const processPromptModalRequest = async (user_input: string) => {
    
    //console.log(userMessage);
    const aiResponse = await callAgent(user_input, '');

    //onSendMessage(aiResponse, 'assistant');
    handleAIResponse(aiResponse);

  }

  const openToolList = () => {
    setShowToolListModal(true)
  }

  useEffect(() => {
    fetchTools();
  }, [activePhase,refreshTool])

  return (
    <>
    <aside
      className={`
        flex flex-col h-screen bg-[#fafbfc] border-r border-[#e5e7eb]
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[70px]' : 'w-[260px]'}
      `}
    >
      {/* --- TOP: Logo & Brand --- */}
      <div className="relative flex items-center justify-between px-4 py-4 border-b border-[#e5e7eb] flex-shrink-0">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BA</span>
              </div>
              <span className="font-semibold text-[#1a1a2e] text-lg">BA Agent</span>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] transition-all duration-200"
              title="Thu gọn sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center w-full gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BA</span>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] transition-all duration-200"
              title="Mở rộng sidebar"
            >
              <ChevronLeft size={18} className="rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* --- MIDDLE: Scrollable Content --- */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">

        {/* 1. PROJECT PHASE */}
        {!collapsed && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">
                PROJECT PHASE
              </span>
            </div>
            <div className="space-y-1.5">
              {phases.map((phase) => {
                const Icon = phase.icon;
                const isActive = activePhase === phase.id;
                return (
                  <button
                    key={phase.id}
                    onClick={() => onPhaseChange(phase.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-[#fff7ed] text-[#f97316] border-l-4 border-[#f97316] shadow-sm' 
                        : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#1f2937]'
                      }
                    `}
                  >
                    <Icon size={20} className={`flex-shrink-0 ${isActive ? 'text-[#f97316]' : 'text-[#9ca3af]'}`} />
                    <span className="text-sm font-semibold whitespace-nowrap">{phase.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. CURRENT TASK INSTRUCTIONS */}
        {!collapsed && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-[#f97316]" />
              <span className="text-sm font-bold text-[#1f2937]">User Input</span>
            </div>
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              className="w-full h-28 p-3 text-sm text-[#6b7280] bg-[#f9fafb] border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] resize-none placeholder:text-[#9ca3af] transition-all"
              placeholder="E.g., Focus on security requirements from the uploaded specs..."
            />
          </div>
        )}

        {/* 3. UPLOAD FOR ANALYSIS */}
        {!collapsed && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UploadCloud size={16} className="text-[#f97316]" />
              <span className="text-sm font-bold text-[#1f2937]">Upload for Analysis</span>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept=".txt,.doc,.docx,.pdf,.md"
            />

            <div 
              onClick={handleUploadClick}
              className="border-2 border-dashed border-[#e5e7eb] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#f97316] hover:bg-[#fff7ed] transition-all duration-200 group"
            >
              <UploadCloud size={28} className="text-[#f97316] mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm text-[#1f2937] font-semibold mb-0.5">New Document for Analysis</p>
              <p className="text-xs text-[#9ca3af]">Drag & drop or browse</p>
            </div>

            {/* FILE PREVIEW SECTION */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file: any, index: number) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2.5 p-2.5 bg-white border border-[#e5e7eb] rounded-lg hover:border-[#d1d5db] hover:shadow-sm transition-all"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                      <FileIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1f2937] truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-[#6b7280]">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. ACTIVE TOOLS */}
        {!collapsed && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wrench size={16} className="text-[#f97316]" />
                <span className="text-sm font-bold text-[#1f2937]">Active Tools</span>
              </div>
              <button 
                onClick={openToolList}
                className="text-sm text-[#f97316] hover:text-[#ea580c] font-semibold transition-colors"
              >
                Advanced
              </button>
            </div>

            {isLoadingTools ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[#f97316] mb-2" />
                <p className="text-xs text-[#6b7280]">Loading tools...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {tools.map((tool) => {
                  const isSelected = selectedToolsItem.some(item => item.label==tool.label);
                  return (
                    <button
                      key={tool.label}
                      onClick={() => toggleTool(tool.label, tool.toolPrompt)}
                      className={`
                        relative px-3 py-4 rounded-2xl border-2 transition-all duration-200 text-center min-h-[70px] flex items-center justify-center
                        ${isSelected
                          ? 'bg-[#dcfce7] border-[#22c55e] shadow-md'
                          : 'bg-white border-[#e5e7eb] hover:border-[#d1d5db] hover:shadow-sm'
                        }
                      `}
                    >
                      <p className="text-xs font-semibold text-[#1f2937] leading-tight break-words w-full px-1">
                        {tool.label.replace(/_/g, ' ')}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. KNOWLEDGE BASE */}
        {!collapsed && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#f97316]" />
                <span className="text-sm font-bold text-[#1f2937]">Knowledge Base</span>
              </div>
              <button className="text-[#f97316] hover:text-[#ea580c] transition-colors">
                <span className="text-xl font-bold leading-none">+</span>
              </button>
            </div>

            <div className="space-y-2">
              {/* Sample Knowledge Base Files */}
              <div className="flex items-center gap-3 p-3 bg-white border border-[#e5e7eb] rounded-lg hover:border-[#d1d5db] hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex-shrink-0 w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1f2937] truncate">
                    Architect_Notes.pdf
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white border border-[#e5e7eb] rounded-lg hover:border-[#d1d5db] hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex-shrink-0 w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1f2937] truncate">
                    SLA_Doc_v2.docx
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white border border-[#e5e7eb] rounded-lg hover:border-[#d1d5db] hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex-shrink-0 w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1f2937] truncate">
                    Product_Brief.pdf
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. RUN DISCOVERY AGENT BUTTON */}
        {!collapsed && (
          <button 
            onClick={processRequest}
            disabled={isAgentProcessing}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white rounded-xl hover:from-[#ea580c] hover:to-[#c2410c] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none font-semibold"
          >
            {isAgentProcessing ? (
              <>
                <Loader2 size={20} className='animate-spin' />
                <span className="text-sm">Processing...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span className="text-sm">Run Discovery Agent</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* --- BOTTOM: User Section --- */}
      <div className="px-3 py-3 border-t border-[#e5e7eb] space-y-1 bg-[#fafbfc] flex-shrink-0">
        {user ? (
          <>
            {!collapsed ? (
              <div className="flex items-center gap-3 px-3 py-3 mt-1 bg-[#f3f4f6] rounded-lg">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-medium text-sm">
                  {getInitials(user.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a2e] truncate">
                    {user.email.split('@')[0]}
                  </p>
                  <p className="text-xs text-[#6b7280] truncate">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#6b7280] hover:text-[#ef4444] transition-all duration-200"
                  title="Đăng xuất"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-medium text-sm">
                  {getInitials(user.email)}
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#6b7280] hover:text-[#ef4444] transition-all duration-200"
                  title="Đăng xuất"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {!collapsed ? (
              <Link
                href="/login"
                className="flex items-center gap-3 px-3 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg hover:from-[#4f46e5] hover:to-[#7c3aed] transition-all duration-200 shadow-sm"
              >
                <LogIn size={18} />
                <span className="text-sm font-medium">Đăng nhập</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center p-2.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg hover:from-[#4f46e5] hover:to-[#7c3aed] transition-all duration-200"
                title="Đăng nhập"
              >
                <LogIn size={18} />
              </Link>
            )}
          </>
        )}
      </div>
    </aside>
    <ToolListModal 
            isLoadingTools={isLoadingTools}
            setSelectedTool={setSelectedTool}
            tools={toolData}
            setTools={setToolData}
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


        <PromptModal 
          processPromptModalRequest={processPromptModalRequest}
        />
    
    </>
  );
}