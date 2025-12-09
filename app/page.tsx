'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar, { User } from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import FileManager from './components/FileManager';
import { Message, FileItem, PhaseId } from './types';

// Phase configurations
const phaseConfig: Record<PhaseId, { name: string; description: string }> = {
  'discovery': {
    name: 'Discovery & Requirements',
    description: 'Thu thập và xác định yêu cầu'
  },
  'analysis': {
    name: 'Analysis & Validation', 
    description: 'Phân tích và xác nhận requirements'
  },
  'documentation': {
    name: 'Documentation',
    description: 'Tạo tài liệu BRD, FSD, User Stories'
  },
  'communication': {
    name: 'Communication & Handoff',
    description: 'Giao tiếp và bàn giao cho team'
  },
  'quick-chat': {
    name: 'Quick Chat',
    description: 'Hỏi đáp nhanh về Business Analysis'
  }
};

// Initial data - empty for real file uploads
const initialData: Record<PhaseId, { messages: Message[]; files: FileItem[] }> = {
  'discovery': {
    messages: [],
    files: []
  },
  'analysis': {
    messages: [],
    files: []
  },
  'documentation': {
    messages: [],
    files: []
  },
  'communication': {
    messages: [],
    files: []
  },
  'quick-chat': {
    messages: [],
    files: []
  }
};

export default function Dashboard() {
  const [activePhase, setActivePhase] = useState<PhaseId>('discovery');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fileManagerCollapsed, setFileManagerCollapsed] = useState(false);
  const [phaseData, setPhaseData] = useState(initialData);
  const [loadedPhases, setLoadedPhases] = useState<Set<PhaseId>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  }, [router]);

  // Load files từ database khi phase thay đổi
  useEffect(() => {
    const loadFilesFromDB = async () => {
      // Chỉ load nếu chưa load phase này trước đó
      if (loadedPhases.has(activePhase)) return;
      
      try {
        const response = await fetch(`/api/files?phaseId=${activePhase}`);
        if (response.ok) {
          const filesFromDB = await response.json();
          
          // Chuyển đổi data từ DB thành FileItem format
          const fileItems: FileItem[] = filesFromDB.map((file: {
            id: string;
            name: string;
            type: 'document' | 'text';
            size: string;
            uploadedAt: string;
            content: string;
            mimeType: string;
          }) => {
            // Tạo blob từ base64 content để có thể preview/download
            const byteCharacters = atob(file.content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: file.mimeType });
            const url = URL.createObjectURL(blob);

            return {
              id: file.id,
              name: file.name,
              type: file.type,
              size: file.size,
              uploadedAt: new Date(file.uploadedAt),
              url: url,
            };
          });

          setPhaseData(prev => ({
            ...prev,
            [activePhase]: {
              ...prev[activePhase],
              files: fileItems,
            }
          }));

          // Đánh dấu đã load phase này
          setLoadedPhases(prev => new Set(prev).add(activePhase));
        }
      } catch (error) {
        console.error('Error loading files from DB:', error);
      }
    };

    loadFilesFromDB();
  }, [activePhase, loadedPhases]);

  const handleSendMessage = useCallback((content: string, role: 'user' | 'assistant' = 'user') => {
    const message: Message = {
      id: `msg-${Date.now()}-${role}`,
      role,
      content,
      timestamp: new Date(),
    };

    setPhaseData(prev => ({
      ...prev,
      [activePhase]: {
        ...prev[activePhase],
        messages: [...prev[activePhase].messages, message],
      }
    }));

   
  }, [activePhase]);

  const handleFileUpload = useCallback((file: FileItem) => {
    setPhaseData(prev => ({
      ...prev,
      [activePhase]: {
        ...prev[activePhase],
        files: [...prev[activePhase].files, file],
      }
    }));
  }, [activePhase]);

  const handleFileDelete = useCallback((fileId: string) => {
    setPhaseData(prev => ({
      ...prev,
      [activePhase]: {
        ...prev[activePhase],
        files: prev[activePhase].files.filter(f => f.id !== fileId),
      }
    }));
  }, [activePhase]);

  const currentPhase = phaseConfig[activePhase];
  const currentData = phaseData[activePhase];

  return (
    <div className="flex h-screen bg-[#f3f4f6]">
      {/* Sidebar */}
      <Sidebar
        activePhase={activePhase}
        onPhaseChange={setActivePhase}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden px-4 gap-4">
          {/* Chat Panel */}
          <div className="flex-1 min-w-0">
            <ChatPanel
              phaseId={activePhase}
              phaseName={currentPhase.name}
              phaseDescription={currentPhase.description}
              messages={currentData.messages}
              onSendMessage={handleSendMessage}
            />
          </div>

          {/* File Manager - Hidden for quick-chat */}
          {activePhase !== 'quick-chat' && (
            <div className={`flex-shrink-0 transition-all duration-300 ${fileManagerCollapsed ? 'w-12' : 'w-80'}`}>
              <FileManager
                files={currentData.files}
                onUpload={handleFileUpload}
                onDelete={handleFileDelete}
                phaseName={currentPhase.name}
                phaseId={activePhase}
                collapsed={fileManagerCollapsed}
                onToggleCollapse={() => setFileManagerCollapsed(!fileManagerCollapsed)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
