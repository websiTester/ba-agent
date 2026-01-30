/**
 * Custom hook quản lý state cho Sidebar
 */

import { useState } from 'react';
import { Tool } from '@/app/models/tool';
import { SelectedToolItem } from '../types';

export const useSidebarState = () => {
  const [showToolModal, setShowToolModal] = useState(false);
  const [selectedToolsItem, setSelectedToolsItem] = useState<SelectedToolItem[]>([]);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState('');
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolData, setToolData] = useState<any[]>([]);
  const [userMessage, setUserMessage] = useState('');

  return {
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
  };
};
