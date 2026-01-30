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
    label: 'Làm tài liệu Usecase Specification',
    phaseId:'documentation' as PhaseId,
    content: 'Dựa vào các thông tin ngữ cảnh (Context), hãy tạo usecase specification table cho requirement.'
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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpenPromptModal(false)}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg">
              <Edit3 className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                Phân tích từng yêu cầu
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Điền thông tin ngữ cảnh và nội dung prompt</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpenPromptModal(false)}
            className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors group"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          
          {/* Section 1: Main Prompt Textarea */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-orange-500" />
                Yêu cầu
              </label>
              
              {/* Option Menu - Chọn Template */}
              <div className="relative">
                <select
                  value={templateId ?? PROMPT_TEMPLATES[0].id}
                  onChange={handleTemplateChange}
                  className="appearance-none bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200/60 text-gray-700 text-xs rounded-lg focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 pl-8 pr-8 py-1.5 cursor-pointer hover:border-orange-300/70 transition-all outline-none font-medium"
                >
                  {PROMPT_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500 pointer-events-none" />
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="main-prompt" className="sr-only">Prompt</label>
              <textarea
                id="main-prompt"
                rows={5}
                placeholder="Nhập yêu cầu của bạn cho AI tại đây hoặc chọn mẫu gợi ý ở trên..."
                className="w-full px-3.5 py-3 bg-orange-50/30 border border-orange-200/50 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 focus:bg-white transition-all resize-y"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (setTemplateId) setTemplateId('');
                }}
              ></textarea>
              <div className="mt-1.5 flex justify-end">
                <span className="text-xs text-gray-400">
                  {prompt.length} ký tự
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Dynamic Context Fields */}
          {Object.keys(contextData).length > 0 && (
            <div className="space-y-3 pt-3 border-t border-orange-100/50">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-orange-500" />
                Thông tin requirement
              </label>
              
              <div className="space-y-3">
                {Object.keys(contextData).map((key) => {
                  const value = (contextData as any)[key];
                  const isLongText = typeof value === 'string' && value.length > 60;
                  
                  return (
                    <div key={key} className="group">
                      <label 
                        htmlFor={`field-${key}`}
                        className="block text-xs font-medium text-gray-600 mb-1.5 group-focus-within:text-orange-600 transition-colors"
                      >
                        {formatLabel(key)}
                      </label>
                      {isLongText ? (
                        <textarea
                          id={`field-${key}`}
                          rows={3}
                          className="w-full px-3 py-2 bg-white border border-orange-200/50 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 transition-all resize-y"
                          value={value}
                          onChange={(e) => handleContextChange(key, e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          id={`field-${key}`}
                          className="w-full px-3 py-2 bg-white border border-orange-200/50 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 transition-all"
                          value={value}
                          onChange={(e) => handleContextChange(key, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-orange-100/50 bg-gradient-to-b from-white to-orange-50/20 flex items-center justify-end gap-2.5">
          <button
            onClick={() => setIsOpenPromptModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg hover:from-orange-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300/50 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
          >
            <Save className="w-3.5 h-3.5" />
            Xử lý Prompt
          </button>
        </div>

      </div>
    </div>
  );
};