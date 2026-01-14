'use client';
import { PhaseId } from "@/app/models/types";
import { useAppState } from "@/app/store";
import { ChevronDown, Edit3, FileText, Save, Sparkles, Type, X } from "lucide-react";
import { use, useEffect, useState } from "react";

// Định nghĩa các mẫu Prompt có sẵn
const PROMPT_TEMPLATES = [
  {
    id: 'diagram',
    label: 'Vẽ Diagram (PlantUML)',
    phaseId:'analysis' as PhaseId,
    content: 'Dựa vào các thông tin ngữ cảnh (Context) đã cung cấp, hãy tạo mã PlantUML (Usecase diagram, Class Diagram, Sequence Diagram) để mô tả yêu cầu này. Đảm bảo sử dụng các ký hiệu chuẩn và chú thích rõ ràng.'
  },
  {
    id: 'frs',
    label: 'Làm tài liệu FRS',
    phaseId:'documentation' as PhaseId,
    content: 'Dựa vào các thông tin ngữ cảnh (Context), hãy soạn thảo nội dung tài liệu Đặc tả Yêu cầu Chức năng (FRS). Nội dung cần bao gồm: Mô tả chi tiết chức năng, Điều kiện tiên quyết, Luồng sự kiện chính (Main Flow), và các Luồng thay thế/Ngoại lệ (Alternative/Exception Flows).'
  },
  {
    id: 'uiux',
    label: 'Phân tích UI/UX',
    phaseId:'documentation' as PhaseId,
    content: 'Dựa vào các thông tin ngữ cảnh, hãy phân tích yêu cầu về Giao diện (UI) và Trải nghiệm người dùng (UX). Hãy đề xuất: Bố cục màn hình (Layout), Các thành phần giao diện (Components) cần thiết, và Mô tả hành vi tương tác của người dùng.'
  }
];

/**
 * Component PromptModal
 * @param {boolean} isOpen - Trạng thái hiển thị modal
 * @param {function} onClose - Hàm đóng modal
 * @param {object} initialContextData - Object chứa dữ liệu dùng để sinh ra các trường input động
 * @param {function} processPromptModalRequest - Hàm xử lý khi người dùng nhấn xác nhận (trả về { prompt, contextData })
 */
export default function PromptModal({processPromptModalRequest}:any){
  // State lưu trữ nội dung prompt người dùng nhập
  const [prompt, setPrompt] = useState('');
  const initialContextData = useAppState(state => state.initialContextData);
  const setActivePhase = useAppState(state => state.setActivePhase);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const isOpenPromptModal = useAppState(state => state.isOpenPromptModal);
  const setIsOpenPromptModal = useAppState(state => state.setIsOpenPromptModal);
  const templateId = useAppState(state => state.templateId);
  const setTemplateId = useAppState(state => state.setTemplateId);
  // State lưu trữ template đang được chọn (để hiển thị trên UI nếu cần)
  //const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // State lưu trữ dữ liệu của các dynamic fields
  const [contextData, setContextData] = useState<Record<string, any>>({});

  // Cập nhật state khi modal mở hoặc dữ liệu đầu vào thay đổi
  useEffect(() => {
    if (initialContextData) {
      setContextData({ ...initialContextData });
    }
    // Reset prompt khi mở mới
    // if (isOpenPromptModal) {
    //   setPrompt('');
    //   setTemplateId('');
    // }

    const template = PROMPT_TEMPLATES.find(t => t.id === templateId);
    console.log("TemplateId: ", templateId);
    console.log("Selected Template: ", template)
    if (template && isOpenPromptModal) {
      //setActivePhase(template.phaseId);

      setPrompt(template.content);
      //setSelectedTemplate(template);
      setActivePhase(template.phaseId);
    }

  }, [initialContextData, isOpenPromptModal]);

  

  // Xử lý thay đổi giá trị trong các dynamic input
  const handleContextChange = (key:any, value:any) => {
    setContextData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  

  // Xử lý khi chọn mẫu prompt
  const handleTemplateChange = (e:any) => {
    const templateId = e.target.value;
    setTemplateId(templateId);
    
    const template = PROMPT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setActivePhase(template.phaseId);
      setPrompt(template.content);
    }
  };

  // Xử lý submit
  const handleSubmit = () => {
    if (processPromptModalRequest) {
      
      let user_input = prompt.trim();  
      user_input += "\n\nThông tin yêu cầu cần phân tích:\n";
      Object.keys(contextData).forEach(key => {
        // Nếu có trường nào đó trống, gán giá trị mặc định
        if (contextData[key].length > 0) {
            user_input += `- ${key}: ${contextData[key]}\n`;
        }
      });
      console.log("Final prompt to submit:", user_input);
      processPromptModalRequest(user_input);
      
    }
    setIsOpenPromptModal(false);
  };

  if (!isOpenPromptModal) return null;

  // Helper để format tên field
  const formatLabel = (key:any) => {
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Overlay / Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpenPromptModal(false)}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" />
                Phân tích từng yêu cầu
            </h3>
            <p className="text-sm text-gray-500 mt-1">Điền thông tin ngữ cảnh và nội dung prompt của bạn.</p>
          </div>
          <button 
            onClick={() => setIsOpenPromptModal(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Main Prompt Textarea */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Yêu cầu
              </h4>
              
              {/* Option Menu - Chọn Template */}
              <div className="relative group">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <select
                    value={templateId ?? PROMPT_TEMPLATES[0].id}
                    onChange={handleTemplateChange}
                    className="appearance-none bg-amber-50 border border-amber-200 text-gray-700 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full pl-3 pr-8 py-1.5 cursor-pointer hover:bg-amber-100 transition-colors outline-none font-medium"
                  >
                    
                    {PROMPT_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="main-prompt" className="sr-only">Prompt</label>
              <textarea
                id="main-prompt"
                rows={6}
                placeholder="Nhập yêu cầu của bạn cho AI tại đây hoặc chọn mẫu gợi ý ở trên..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm text-base text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  // Nếu người dùng tự sửa, reset selection để không gây hiểu nhầm
                  if (setTemplateId) setTemplateId('');
                }}
              ></textarea>
              <div className="mt-2 flex justify-end">
                <span className="text-xs text-gray-400">
                  {prompt.length} ký tự
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Dynamic Context Fields */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Type className="w-4 h-4" />
              Thông tin requirement
            </h4>
            
            <div className="grid grid-cols-1 gap-5">
              {Object.keys(contextData).map((key) => {
                const value = (contextData as any)[key];
                // Logic đơn giản: Nếu text dài > 60 ký tự thì dùng textarea, ngược lại dùng input
                const isLongText = typeof value === 'string' && value.length > 60;
                
                return (
                  <div key={key} className="group">
                    <label 
                      htmlFor={`field-${key}`}
                      className="block text-sm font-medium text-gray-700 mb-1.5 group-focus-within:text-indigo-600 transition-colors"
                    >
                      {formatLabel(key)}
                    </label>
                    {isLongText ? (
                      <textarea
                        id={`field-${key}`}
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y"
                        value={value}
                        onChange={(e) => handleContextChange(key, e.target.value)}
                      />
                    ) : (
                      <input
                        type="text"
                        id={`field-${key}`}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={value}
                        onChange={(e) => handleContextChange(key, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
              
              {Object.keys(contextData).length === 0 && (
                <p className="text-sm text-gray-400 italic text-center py-4">Không có dữ liệu ngữ cảnh.</p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={() => setIsOpenPromptModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            Xử lý Prompt
          </button>
        </div>

      </div>
    </div>
  );
};