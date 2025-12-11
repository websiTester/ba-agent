'use   client';
import { Template } from "@/app/models/types";
import { isValidChatFileType } from "@/app/utils/isValidChatFileType";
import { parseJson } from "@/app/utils/json-parser";
import { readFileContent } from "@/app/utils/readFileContent";
import { Bot, Loader2, Pencil, Plus, RefreshCw, Save, Settings, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SettingTab from "./SettingTab";
import TemplateListTab from "./TemplateListTab";
import TemplateDetailTab from "./TemplateDetailTab";
import AgentInstructionTab from "./AgentInstructionTab";
export interface SettingModelProps {

    phaseName: string;
    phaseId: string;  
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isSettingsOpen: boolean) => void;
}


export default function SettingModel({ 
    phaseName, 
    phaseId,
    isSettingsOpen,
    setIsSettingsOpen }: SettingModelProps) {


    const [activeTab, setActiveTab] = useState<'templates' | 'structure' | 'agent'>('templates');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  

    //HANDLER FUNCTIONS

  


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsSettingsOpen(false);
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
                }}
                className="p-2 hover:bg-[#f3f4f6] rounded-lg transition-colors"
              >
                <X size={20} className="text-[#6b7280]" />
              </button>
            </div>

            {/* Tabs */}
            <SettingTab activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              {activeTab === 'templates' ? (
                /* Templates List Tab */
                <TemplateListTab
                  selectedTemplate={selectedTemplate}
                  setSelectedTemplate={setSelectedTemplate}
                  phaseName={phaseName}   
                  isSettingsOpen={isSettingsOpen}      
                  setActiveTab={setActiveTab}       

                />
              ) : activeTab === 'structure' ? (
                /* Template Structure Tab */
                <TemplateDetailTab 
                    selectedTemplate={selectedTemplate}
                    setSelectedTemplate={setSelectedTemplate}
                    setActiveTab={setActiveTab}
                />
              ) : activeTab === 'agent' ? (
                /* Agent Info Tab */
                <AgentInstructionTab 
                  phaseName={phaseName}
                  isSettingsOpen={isSettingsOpen}
                />
              ) : null}
            </div>
          </div>
        </div>
    );
}