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

const MOCK_DATA = [
    {
      agent_source: 'requirement_analysis',
      response_type: 'interactive_table',
      title: 'Danh sách Yêu cầu Chức năng & Phi chức năng cho AI Business Analyst Assistant',
      data_format: 'csv',
      data: 'id,type,name,description,rationale\n' +
        'FR-01,FR,"Xử lý ý tưởng thô sơ","Tiếp nhận và diễn giải các ý tưởng dự án ban đầu từ người dùng/khách hàng.","Để khởi đầu quá trình phân tích yêu cầu từ input không cấu trúc."\n' +
        'FR-02,FR,"Đặt câu hỏi làm rõ","Chủ động đặt các câu hỏi liên quan để làm rõ thông tin, quy trình, và các yêu cầu chi tiết của ý tưởng.","Để thu thập đủ thông tin cần thiết, giống như một BA thực thụ."\n' +
        'FR-03,FR,"Trích xuất và phân loại yêu cầu","Tự động xác định, trích xuất và phân loại các yêu cầu thành Functional Requirements (FR) và Non-functional Requirements (NFR) từ cuộc hội thoại.","Để cung cấp một danh sách yêu cầu có cấu trúc và rõ ràng."\n' +
        'FR-04,FR,"Đề xuất cải tiến/Gợi ý","Phân tích các yêu cầu đã đưa ra, phát hiện thiếu sót/không logic và đề xuất các gợi ý hoặc phương án cải tiến quy trình/yêu cầu.","Để bổ sung và hoàn thiện các yêu cầu, nâng cao chất lượng đầu ra."\n' +
        'FR-05,FR,"Vẽ lưu đồ quy trình","Tạo ra lưu đồ quy trình (Flowchart/Activity Diagram) dựa trên thông tin thu thập được, có thể xuất ra dưới dạng code PlantUML.","Để minh họa trực quan quy trình nghiệp vụ và giúp BA dễ dàng chỉnh sửa."\n' +
        'FR-06,FR,"Tổng hợp tài liệu đặc tả nháp","Biên soạn toàn bộ cuộc hội thoại và các yêu cầu đã trích xuất thành một tài liệu đặc tả (SRS/FSD) nháp theo cấu trúc chuẩn.","Để cung cấp một tài liệu khởi điểm cho đội ngũ BA và Dev."\n' +
        'FR-07,FR,"Lưu trữ ngữ cảnh và lịch sử","Ghi nhớ ngữ cảnh của dự án và toàn bộ lịch sử hội thoại, cho phép tiếp tục tương tác mà không cần mô tả lại từ đầu.","Để duy trì tính liên tục của cuộc trò chuyện và hiệu quả làm việc."\n' +
        'NFR-01,NFR,"Độ chính xác","Đảm bảo độ chính xác cao trong việc trích xuất, phân loại yêu cầu và tạo ra các đề xuất, lưu đồ, tài liệu đặc tả.","Đảm bảo chất lượng và độ tin cậy của thông tin mà Agent cung cấp."\n' +
        'NFR-02,NFR,"Hiệu năng phản hồi","Hệ thống cần có khả năng xử lý nhanh các yêu cầu và phản hồi trong thời gian hợp lý.","Đảm bảo trải nghiệm người dùng mượt mà và hiệu quả làm việc."\n' +
        'NFR-03,NFR,"Bảo mật dữ liệu","Đảm bảo an toàn và bảo mật cho dữ liệu hội thoại, thông tin dự án và các tài liệu được tạo ra.","Để bảo vệ thông tin nhạy cảm của khách hàng và dự án."\n' +
        'NFR-04,NFR,"Khả năng mở rộng","Hệ thống cần có khả năng mở rộng để hỗ trợ đồng thời nhiều BA và quản lý nhiều dự án.","Đảm bảo Agent có thể phục vụ nhiều người dùng và quy mô dự án khác nhau."\n' +
        'NFR-05,NFR,"Tính dễ chỉnh sửa (PlantUML)","Đầu ra PlantUML phải dễ hiểu và dễ chỉnh sửa bởi người dùng.","Tăng cường khả năng kiểm soát và tùy chỉnh của BA đối với các lưu đồ."\n' +
        'NFR-06,NFR,"Tuân thủ cấu trúc chuẩn","Tài liệu đặc tả nháp phải tuân thủ cấu trúc SRS/FSD chuẩn ngành.","Đảm bảo tính chuyên nghiệp và khả năng sử dụng của tài liệu trong quy trình phát triển."'
    },
    {
      agent_source: 'requirement_analysis',
      response_type: 'interactive_table',
      title: 'Danh sách Yêu cầu Chức năng & Phi chức năng cho AI Business Analyst Assistant',
      data_format: 'csv',
      data: 'id,type,name,description,rationale\n' +
        'FR-01,FR,"Xử lý ý tưởng thô sơ","Tiếp nhận và diễn giải các ý tưởng dự án ban đầu từ người dùng/khách hàng.","Để khởi đầu quá trình phân tích yêu cầu từ input không cấu trúc."\n' +
        'FR-02,FR,"Đặt câu hỏi làm rõ","Chủ động đặt các câu hỏi liên quan để làm rõ thông tin, quy trình, và các yêu cầu chi tiết của ý tưởng.","Để thu thập đủ thông tin cần thiết, giống như một BA thực thụ."\n' +
        'FR-03,FR,"Trích xuất và phân loại yêu cầu","Tự động xác định, trích xuất và phân loại các yêu cầu thành Functional Requirements (FR) và Non-functional Requirements (NFR) từ cuộc hội thoại.","Để cung cấp một danh sách yêu cầu có cấu trúc và rõ ràng."\n' +
        'FR-04,FR,"Đề xuất cải tiến/Gợi ý","Phân tích các yêu cầu đã đưa ra, phát hiện thiếu sót/không logic và đề xuất các gợi ý hoặc phương án cải tiến quy trình/yêu cầu.","Để bổ sung và hoàn thiện các yêu cầu, nâng cao chất lượng đầu ra."\n' +
        'FR-05,FR,"Vẽ lưu đồ quy trình","Tạo ra lưu đồ quy trình (Flowchart/Activity Diagram) dựa trên thông tin thu thập được, có thể xuất ra dưới dạng code PlantUML.","Để minh họa trực quan quy trình nghiệp vụ và giúp BA dễ dàng chỉnh sửa."\n' +
        'FR-06,FR,"Tổng hợp tài liệu đặc tả nháp","Biên soạn toàn bộ cuộc hội thoại và các yêu cầu đã trích xuất thành một tài liệu đặc tả (SRS/FSD) nháp theo cấu trúc chuẩn.","Để cung cấp một tài liệu khởi điểm cho đội ngũ BA và Dev."\n' +
        'FR-07,FR,"Lưu trữ ngữ cảnh và lịch sử","Ghi nhớ ngữ cảnh của dự án và toàn bộ lịch sử hội thoại, cho phép tiếp tục tương tác mà không cần mô tả lại từ đầu.","Để duy trì tính liên tục của cuộc trò chuyện và hiệu quả làm việc."\n' +
        'NFR-01,NFR,"Độ chính xác","Đảm bảo độ chính xác cao trong việc trích xuất, phân loại yêu cầu và tạo ra các đề xuất, lưu đồ, tài liệu đặc tả.","Đảm bảo chất lượng và độ tin cậy của thông tin mà Agent cung cấp."\n' +
        'NFR-02,NFR,"Hiệu năng phản hồi","Hệ thống cần có khả năng xử lý nhanh các yêu cầu và phản hồi trong thời gian hợp lý.","Đảm bảo trải nghiệm người dùng mượt mà và hiệu quả làm việc."\n' +
        'NFR-03,NFR,"Bảo mật dữ liệu","Đảm bảo an toàn và bảo mật cho dữ liệu hội thoại, thông tin dự án và các tài liệu được tạo ra.","Để bảo vệ thông tin nhạy cảm của khách hàng và dự án."\n' +
        'NFR-04,NFR,"Khả năng mở rộng","Hệ thống cần có khả năng mở rộng để hỗ trợ đồng thời nhiều BA và quản lý nhiều dự án.","Đảm bảo Agent có thể phục vụ nhiều người dùng và quy mô dự án khác nhau."\n' +
        'NFR-05,NFR,"Tính dễ chỉnh sửa (PlantUML)","Đầu ra PlantUML phải dễ hiểu và dễ chỉnh sửa bởi người dùng.","Tăng cường khả năng kiểm soát và tùy chỉnh của BA đối với các lưu đồ."\n' +
        'NFR-06,NFR,"Tuân thủ cấu trúc chuẩn","Tài liệu đặc tả nháp phải tuân thủ cấu trúc SRS/FSD chuẩn ngành.","Đảm bảo tính chuyên nghiệp và khả năng sử dụng của tài liệu trong quy trình phát triển."'
    }
]


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


  const handleAIResponse = useCallback((aiResponse: any) => {
    //Merge new AI response with existing ones
    console.log(`Old response: ${currentData.aiResponse}`);
    console.log(`New response: ${aiResponse}`);
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
            isAgentProcessing ? (
                <div className="w-full h-full min-h-[400px] flex items-center justify-center relative overflow-hidden bg-gray-50/50 rounded-2xl">

                  {/* --- AMBIENT BACKGROUND --- */}

                  {/* 1. Central Warm Glow (Tạo tiêu điểm ngay sau Card) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-400/20 rounded-full blur-[80px] animate-pulse"></div>

                  {/* 2. Moving Orbs (Tạo cảm giác luân chuyển dữ liệu) */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-amber-300/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 animate-blob"></div>
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 animate-blob animation-delay-2000"></div>

                  {/* --- CONTENT --- */}
                  <div className="relative z-10">
                    <AILoadingCard />
                  </div>

                </div>
              ) : currentData.aiResponse &&  (
                  
                  <AIResponseRenderer 
                   aiResponse={currentData.aiResponse}
                  />
                )
              }

            {/* {
MOCK_DATA && MOCK_DATA.map((response: any, index:number) => (
                  
                  <AIResponseRenderer 
                   key = {index}
                   aiResponse={MOCK_DATA}
                  />
                ))
            } */}
           





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
