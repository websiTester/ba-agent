import { create } from 'zustand'
import { PhaseId } from './models/types';
import { Tool } from './models/tool';


interface AppState{
    activePhase: PhaseId;
    setActivePhase: (phaseId: PhaseId) => void;
    showToolListModal: boolean;
    setShowToolListModal: (isOpen: boolean) => void;
    isAgentProcessing: boolean;
    setIsAgentProcessing: (isProcessing: boolean) => void;
    refreshTool: number;
    setRefreshTool: ((count: number) => void);
    isOpenPromptModal: boolean;
    setIsOpenPromptModal: (isOpen: boolean) => void;
    initialContextData: Record<string, any>;
    setInitialContextData: (data: Record<string, any>) => void;
    templateId: string;
    setTemplateId: (templateId: string) => void;
    

}

export const useAppState = create<AppState>((set) => ({
    activePhase: 'discovery',
    setActivePhase: (phaseId) => set({activePhase: phaseId}),
    showToolListModal: false,
    setShowToolListModal: isOpen => {set({showToolListModal: isOpen})},
    isAgentProcessing: false,
    setIsAgentProcessing: isProcessing => {set({isAgentProcessing: isProcessing})},
    refreshTool: 0,
    setRefreshTool: ((count: number) => {set({refreshTool: count})}),
    isOpenPromptModal: false,
    setIsOpenPromptModal: (isOpen: boolean) => {set({isOpenPromptModal: isOpen})},
    initialContextData: {},
    setInitialContextData: (data: Record<string, any>) => {set({initialContextData: data})},

    templateId: 'diagram',
    setTemplateId: (newId: string) => {set({templateId: newId})},

}));