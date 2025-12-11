'use client'
import { useAppState } from "@/app/store";
import { Bot, Loader2, Pencil, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";


interface AgentInstructionProb {
    phaseName: string,
    isSettingsOpen: boolean
}

export default function AgentInstructionTab(
    {phaseName,
    isSettingsOpen
    } : AgentInstructionProb
){

    const activePhase = useAppState(set => set.activePhase);

    const [isLoadingAgent, setIsLoadingAgent] = useState(false);
    const [agentInfo, setAgentInfo] = useState<{ agentName: string; instructions: string } | null>(null);
    const [isEditingInstructions, setIsEditingInstructions] = useState(false);

    const [editedInstructions, setEditedInstructions] = useState('');
    const [isSavingAgent, setIsSavingAgent] = useState(false);


    // Start editing instructions
  const handleStartEditingInstructions = () => {
    if (agentInfo) {
      setEditedInstructions(agentInfo.instructions);
      setIsEditingInstructions(true);
    }
  };

  const handleCancelEditingInstructions = () => {
    setIsEditingInstructions(false);
    setEditedInstructions('');
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


  // Load templates and agent info when settings modal opens or phase changes
  useEffect(() => {
    if (isSettingsOpen) {
      //fetchTemplates();
      fetchAgentInfo();
    }
  }, [activePhase]);


    return (
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
    );
}