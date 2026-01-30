/**
 * Sidebar Component - Main Orchestrator
 * 
 * Component chính điều phối các sub-components và logic
 */

'use client';

import { ChevronLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useAppState } from '@/app/store';

// Types & Constants
import { SidebarProps, SelectedToolItem } from './types';

// Hooks
import { useSidebarState } from './hooks/useSidebarState';
import { useSidebarApi } from './hooks/useSidebarApi';

// Components
import PhaseSelector from './components/PhaseSelector';
import UserInput from './components/UserInput';
import FileUpload from './components/FileUpload';
import ActiveTools from './components/ActiveTools';
import KnowledgeBase from './components/KnowledgeBase';
import RunAgentButton from './components/RunAgentButton';
import UserSection from './components/UserSection';

// Modals
import ToolListModal from '../Tool/ToolListModal';
import ToolModal from '../Tool/ToolModal';
import PromptModal from '../MessageArea/PromptModal';

// Re-export User type for backward compatibility
export type { User } from './types';

export default function Sidebar({
  handleAIResponse,
  onSendMessage,
  activePhase,
  onPhaseChange,
  collapsed,
  onToggleCollapse,
  user,
  onLogout,
  knowledgeBaseFiles = [], // Default empty array
  isLoadingFiles = false,
  onFileUpload,
  onFileDelete,
}: SidebarProps) {
  
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  const {
    showToolModal,
    setShowToolModal,
    selectedToolsItem,
    setSelectedToolsItem,
    selectedTool,
    setSelectedTool,
    uploadedFiles,
    setUploadedFiles,
    fileContent,
    setFileContent,
    isLoadingTools,
    setIsLoadingTools,
    tools,
    setTools,
    toolData,
    setToolData,
    userMessage,
    setUserMessage,
  } = useSidebarState();

  // Global state
  const setShowToolListModal = useAppState(state => state.setShowToolListModal);
  const isAgentProcessing = useAppState(state => state.isAgentProcessing);
  const refreshTool = useAppState(state => state.refreshTool);
  const setRefreshTool = useAppState(state => state.setRefreshTool);

  // ============================================================
  // API HOOKS
  // ============================================================
  const { fetchTools, callAgent } = useSidebarApi();

  // ============================================================
  // HANDLERS
  // ============================================================
  
  /**
   * Toggle chọn tool
   */
  const toggleTool = (label: string, toolPrompt: string) => {
    console.log("ToolPrompt: " + toolPrompt);
    
    setSelectedToolsItem(prev =>
      prev.some(item => item.label === label)
        ? prev.filter(item => item.label !== label)
        : [...prev, { label, toolPrompt }]
    );
  };

  /**
   * Mở tool list modal
   */
  const openToolList = () => {
    setShowToolListModal(true);
  };

  /**
   * Xử lý request từ user
   */
  const processRequest = async () => {
    const aiResponse = await callAgent(userMessage, fileContent, selectedToolsItem);
    console.log(`AIResponse length: ${aiResponse.length}`);

    handleAIResponse(aiResponse);
    setUserMessage('');
    setSelectedToolsItem([]);
    setFileContent('');
  };

  /**
   * Xử lý request từ prompt modal
   */
  const processPromptModalRequest = async (user_input: string) => {
    //const aiResponse = await callAgent(user_input, '', selectedToolsItem);
    console.log(`PromptModal - selectedToolsItem: ${selectedToolsItem}`);
    const aiResponse = await callAgent(user_input, '', []);
    handleAIResponse(aiResponse);
  };

  // ============================================================
  // EFFECTS
  // ============================================================
  
  /**
   * Load tools khi phase thay đổi hoặc refresh
   */
  useEffect(() => {
    fetchTools(activePhase, setIsLoadingTools, setToolData, setTools);
  }, [activePhase, refreshTool]);

  // ============================================================
  // RENDER
  // ============================================================
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
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
          
          {/* 1. PROJECT PHASE */}
          <PhaseSelector
            activePhase={activePhase}
            onPhaseChange={onPhaseChange}
            collapsed={collapsed}
            disabled={isLoadingTools || isAgentProcessing}
          />

          {/* 2. USER INPUT */}
          <UserInput
            collapsed={collapsed}
            userMessage={userMessage}
            setUserMessage={setUserMessage}
          />

          {/* 3. UPLOAD FOR ANALYSIS */}
          <FileUpload
            collapsed={collapsed}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            setFileContent={setFileContent}
          />

          {/* 4. ACTIVE TOOLS */}
          <ActiveTools
            collapsed={collapsed}
            isLoadingTools={isLoadingTools}
            tools={tools}
            selectedToolsItem={selectedToolsItem}
            onToggleTool={toggleTool}
            onOpenToolList={openToolList}
          />

          {/* 5. KNOWLEDGE BASE */}
          <KnowledgeBase 
            collapsed={collapsed}
            files={knowledgeBaseFiles}
            isLoading={isLoadingFiles}
            phaseId={activePhase}
            onFileUpload={onFileUpload || (() => {})}
            onFileDelete={onFileDelete || (() => {})}
          />

          {/* 6. RUN DISCOVERY AGENT BUTTON */}
          <RunAgentButton
            collapsed={collapsed}
            isAgentProcessing={isAgentProcessing}
            onProcessRequest={processRequest}
          />
        </div>

        {/* --- BOTTOM: User Section --- */}
        <UserSection
          collapsed={collapsed}
          user={user}
          onLogout={onLogout}
        />
      </aside>

      {/* MODALS */}
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
