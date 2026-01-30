'use client';

import { useState, useCallback, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar, { User } from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import FileManager from './components/FileManager';
import { Message, FileItem, PhaseId } from './models/types';
import { useAppState } from './store';
import TableComponent from './components/MessageArea/TableComponent';
import CsvTable from './components/MessageArea/CsvTable';
import PlantUMLCompoent from './components/MessageArea/PlantUml/PlantUmlComponent';
import AILoadingCard from './components/MessageArea/Loading';
import AIResponseRenderer from './components/MessageArea/AIResponseRenderer';
import { mergeData } from './utils/merge-response';


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
  }
};

// Initial data - empty for real file uploads
const initialData: Record<PhaseId, { messages: Message[]; files: FileItem[], aiResponse: any }> = {
  'discovery': {
    messages: [],
    files: [],
    aiResponse: []
  },
  'analysis': {
    messages: [],
    files: [],
    aiResponse: []
  },
  'documentation': {
    messages: [],
    files: [],
    aiResponse: []
  },
  'communication': {
    messages: [],
    files: [],
    aiResponse: []
  },
};

export default function Dashboard() {
  //const [activePhase, setActivePhase] = useState<PhaseId>('discovery');

  const activePhase = useAppState(state => state.activePhase);
  const setActivePhase = useAppState(state => state.setActivePhase);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fileManagerCollapsed, setFileManagerCollapsed] = useState(false);
  const [phaseData, setPhaseData] = useState(initialData);
  const [loadedPhases, setLoadedPhases] = useState<Set<PhaseId>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false); // State để track loading từ DB
  const router = useRouter();
  const isAgentProcessing = useAppState(state => state.isAgentProcessing);

  console.log('Rendering Dashboard with activePhase:', activePhase);
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

  // Load files và AI responses từ database khi phase thay đổi
  useEffect(() => {
    const loadDataFromDB = async () => {
      // Chỉ load nếu chưa load phase này trước đó
      if (loadedPhases.has(activePhase)) return;

      // Bắt đầu loading
      setIsLoadingData(true);

      try {
        // --- 1. LOAD FILES ---
        const filesResponse = await fetch(`/api/files?phaseId=${activePhase}`);
        if (filesResponse.ok) {
          const filesFromDB = await filesResponse.json();

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
        }

        // --- 2. LOAD AI RESPONSES ---
        const responsesResponse = await fetch(`/api/responses?phaseId=${activePhase}`);
        if (responsesResponse.ok) {
          const responsesData = await responsesResponse.json();
          
          // Check if API call was successful
          if (responsesData.success && responsesData.data) {
            console.log(`✅ Loaded ${responsesData.count} AI responses for phase: ${activePhase}`);
            
            // Set AI responses vào phaseData
            setPhaseData(prev => ({
              ...prev,
              [activePhase]: {
                ...prev[activePhase],
                aiResponse: responsesData.data, // Array of AI responses
              }
            }));
          } else {
            console.warn(`⚠️ No AI responses found for phase: ${activePhase}`);
          }
        }

        // Đánh dấu đã load phase này
        setLoadedPhases(prev => new Set(prev).add(activePhase));
        
      } catch (error) {
        console.error('Error loading data from DB:', error);
      } finally {
        // Kết thúc loading
        setIsLoadingData(false);
      }
    };

    loadDataFromDB();
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


  const handleAIResponse = useCallback((aiResponse: any) => {
    //Merge new AI response with existing ones
    
    const response = mergeData(currentData.aiResponse || [], aiResponse);
    console.log(`Merged response: ${response}`);
    setPhaseData(prev => ({
      ...prev,
      [activePhase]: {
        ...prev[activePhase],
        aiResponse: response,
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

  let currentPhase = phaseConfig[activePhase];
  

  //Clone to load Orchestation agent data in all setting
  currentPhase.name = "Orchestration";
  const currentData = phaseData[activePhase];
  console.log(`Current data aiResponse type: ${typeof(currentData.aiResponse)}`)
  console.log(`Current data aiResponse: ${currentData.aiResponse}`)

  return (
    <div className="flex h-screen bg-[#f3f4f6]">
      {/* Sidebar */}
      <Sidebar
        handleAIResponse={handleAIResponse}
        onSendMessage={handleSendMessage}
        activePhase={activePhase}
        onPhaseChange={setActivePhase}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={handleLogout}
        knowledgeBaseFiles={currentData.files}
        isLoadingFiles={isLoadingData}
        onFileUpload={handleFileUpload}
        onFileDelete={handleFileDelete}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}


        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden px-4 gap-4">
          {/* Chat Panel */}
          <div className="flex-1 min-w-0">
            {/* OLD MESSAGE AREA */}
            {/* <ChatPanel
              phaseId={activePhase}
              phaseName={currentPhase.name}
              phaseDescription={currentPhase.description}
              messages={currentData.messages}
              onSendMessage={handleSendMessage}
            /> */}

            {/* {id:"123", name:"dasdasd", rationale:"sdasd",description:"dasdsad"} */}

            {/* <TableComponent 
            aiResponse = {currentData.aiResponse}
            data={[{id:"123", name:"dasdasd", type:"functional", rationale:"sdasd",description:"dasdsad"}]} 
            onAdd={onAddRequirement}
            onDelete={onDeleteRequirement}
            /> */}

              {/* {
                currentData.aiResponse && currentData.aiResponse.map((response: any) => (
                  
                  <AIResponseRenderer 
                   aiResponse={response}
                  />
                ))
              } */}

            {/* {currentData.aiResponse ? (
              currentData.aiResponse.agent_source === 'create_diagram' ? (
                <PlantUMLCompoent aiResponse={currentData.aiResponse} />
              ) : (
                <div className="h-full">
                  <CsvTable
                    aiResponse={currentData.aiResponse}
                  />
                </div>
              )
            ) :  */}
            {
            // Hiển thị loading khi đang load data từ DB hoặc agent đang xử lý
            isLoadingData || isAgentProcessing ? (
                <div className="w-full h-full min-h-[400px] flex items-center justify-center relative overflow-hidden bg-gray-50/50 rounded-2xl">

                  {/* --- AMBIENT BACKGROUND --- */}

                  {/* 1. Central Warm Glow (Tạo tiêu điểm ngay sau Card) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-400/20 rounded-full blur-[80px] animate-pulse"></div>

                  {/* 2. Moving Orbs (Tạo cảm giác luân chuyển dữ liệu) */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-amber-300/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 animate-blob"></div>
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 animate-blob animation-delay-2000"></div>

                  {/* --- CONTENT --- */}
                  <div className="relative z-10">
                    <AILoadingCard 
                    message={isLoadingData ? "Loading data" : "Đang phân tích"}
                    />
                  </div>

                </div>
              ) : currentData.aiResponse &&  (
                  
                  <AIResponseRenderer 
                   handleAIResponse={handleAIResponse}
                   aiResponse={currentData.aiResponse}
                  />
                )
              }


          </div>

          {/* <div className={`flex-shrink-0 transition-all duration-300 ${fileManagerCollapsed ? 'w-12' : 'w-80'}`}>
              <FileManager
                files={currentData.files}
                onUpload={handleFileUpload}
                onDelete={handleFileDelete}
                phaseName={currentPhase.name}
                phaseId={activePhase}
                collapsed={fileManagerCollapsed}
                onToggleCollapse={() => setFileManagerCollapsed(!fileManagerCollapsed)}
              />
            </div> */}
        </div>
      </main>


    </div>
  );
}
