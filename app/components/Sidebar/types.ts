/**
 * Types & Interfaces cho Sidebar Component
 */

import { PhaseId, FileItem } from '@/app/models/types';

export interface User {
  email: string;
}

export interface SidebarProps {
  activePhase: PhaseId;
  onPhaseChange: (phase: PhaseId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: User | null;
  onLogout: () => void;
  onSendMessage: any;
  handleAIResponse: any;
  knowledgeBaseFiles?: FileItem[]; // Files từ database cho knowledge base
  isLoadingFiles?: boolean; // Loading state cho files
  onFileUpload?: (file: FileItem) => void; // Callback khi upload file
  onFileDelete?: (fileId: string) => void; // Callback khi delete file
}

export interface Phase {
  id: PhaseId;
  name: string;
  shortName: string;
  icon: any;
  badge: null | string | number;
}

export interface SelectedToolItem {
  label: string;
  toolPrompt: string;
}
