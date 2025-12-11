'use client'

import { Template } from "@/app/models/types";
import { isValidChatFileType } from "@/app/utils/isValidChatFileType";
import { parseJson } from "@/app/utils/json-parser";
import { readFileContent } from "@/app/utils/readFileContent";
import { Loader2, Pencil, Plus, Save, Settings, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

interface TemplateDetailProb {
    selectedTemplate: Template | null;
    setSelectedTemplate: any;
    setActiveTab: any
}


export default function TemplateDetailTab({
   selectedTemplate,
   setSelectedTemplate,
   setActiveTab
}: TemplateDetailProb){

    const [templates, setTemplates] = useState<Template[]>([]);

    const templateImportRef = useRef<HTMLInputElement>(null);
    const [isImportingTemplate, setIsImportingTemplate] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [editingPairIndex, setEditingPairIndex] = useState<number | null>(null);



    const handleTemplateImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Kiểm tra file type trước khi đọc
        if (!isValidChatFileType(file)) {
          console.error("File type không được hỗ trợ. Chỉ chấp nhận .txt, .docx");
          return;
        }
        
        setIsImportingTemplate(true);
        
        try {
          const content = await readFileContent(file);
    
          const response = await fetch('/api/agent/analyze-template', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              template: content,
            }),
          });
          const data = await response.json();
     
          const template = parseJson(data.response);
    
           
           if (selectedTemplate) {
             setSelectedTemplate({
               ...selectedTemplate,
               pair: [...selectedTemplate.pair, ...template],
             });
           }
           console.log("Response:", template);
          
        } catch (error) {
          console.error("Lỗi khi đọc file:", error);
        } finally {
          setIsImportingTemplate(false);
        }
        
        // Reset input để có thể upload lại cùng file
        if (templateImportRef.current) {
          templateImportRef.current.value = '';
        }
      };


      const handleTemplateImportClick = () => {
        templateImportRef.current?.click();
      };


      const handleSaveTemplate = async () => {
        if (!selectedTemplate) return;
        
        setIsSavingTemplate(true);
        try {
          // Get user email from localStorage if logged in
          let userEmail: string | undefined;
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              userEmail = user.email;
            } catch (e) {
              console.error('Error parsing user from localStorage:', e);
            }
          }
    
          // Add user email and update time to template
          const templateToSave = {
            ...selectedTemplate,
            ...(userEmail && { createdBy: userEmail }),
            updatedAt: new Date(),
          };
    
          const response = await fetch('/api/templates', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateToSave),
          });
    
          if (!response.ok) {
            throw new Error('Failed to save template');
          }
          
          // Update templates list with saved template
          setTemplates(templates.map(t => t._id === selectedTemplate._id ? templateToSave : t));
          setSelectedTemplate(templateToSave);
        } catch (error) {
          console.error('Error saving template:', error);
        } finally {
          setIsSavingTemplate(false);
        }
      }


    return (

        <div className="space-y-4">
                  {/* Hidden file input for template import */}
                  <input
                    ref={templateImportRef}
                    type="file"
                    className="hidden"
                    accept='.txt,.doc,.docx,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    onChange={handleTemplateImportChange}
                  />
                  
                  {selectedTemplate ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-[#1a1a2e]">{selectedTemplate.templateName}</h4>
                          <p className="text-sm text-[#6b7280]">Cấu trúc template với {selectedTemplate.pair.length} sections</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleTemplateImportClick}
                            disabled={isImportingTemplate}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isImportingTemplate ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Upload size={16} />
                            )}
                            {isImportingTemplate ? 'Đang xử lý...' : 'Import'}
                          </button>
                          <button
                            onClick={() => {
                              const newPair = { header: 'New Header', content: 'Mô tả nội dung mới...' };
                              const updatedTemplate = {
                                ...selectedTemplate,
                                pair: [...selectedTemplate.pair, newPair]
                              };
                              setSelectedTemplate(updatedTemplate);
                              setTemplates(templates.map(t => t._id === selectedTemplate._id ? updatedTemplate : t));
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#f97316] text-white text-sm rounded-lg hover:bg-[#ea580c] transition-colors"
                          >
                            <Plus size={16} />
                            Thêm Section
                          </button>
                          <button
                            onClick={handleSaveTemplate}
                            disabled={isSavingTemplate}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#10b981] text-white text-sm rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSavingTemplate ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                            {isSavingTemplate ? 'Đang lưu...' : 'Lưu Template'}
                          </button>
                        </div>
                      </div>

                      {/* Loading Overlay khi đang import */}
                      {isImportingTemplate && (
                        <div className="flex items-center gap-3 p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl mb-4">
                          <Loader2 size={20} className="animate-spin text-[#3b82f6]" />
                          <div>
                            <p className="text-sm font-medium text-[#1e40af]">Đang trong quá trình phân tích...</p>
                            <p className="text-xs text-[#3b82f6]">Vui lòng đợi trong giây lát</p>
                          </div>
                        </div>
                      )}

                      <div className={`space-y-3 ${isImportingTemplate ? 'opacity-50 pointer-events-none' : ''}`}>
                        {selectedTemplate.pair.map((pair, index) => (
                          <div
                            key={index}
                            className="p-4 bg-[#fafbfc] border border-[#e5e7eb] rounded-xl"
                          >
                            {editingPairIndex === index ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  defaultValue={pair.header}
                                  placeholder="Header"
                                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm font-medium focus:outline-none focus:border-[#f97316]"
                                  id={`header-${index}`}
                                />
                                <textarea
                                  defaultValue={pair.content}
                                  placeholder="Content"
                                  rows={3}
                                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#f97316] resize-none"
                                  id={`content-${index}`}
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingPairIndex(null)}
                                    className="px-3 py-1.5 text-[#6b7280] hover:bg-[#e5e7eb] rounded-lg text-sm transition-colors"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    onClick={() => {
                                      const headerInput = document.getElementById(`header-${index}`) as HTMLInputElement;
                                      const contentInput = document.getElementById(`content-${index}`) as HTMLTextAreaElement;
                                      if (headerInput && contentInput) {
                                        const updatedPairs = [...selectedTemplate.pair];
                                        updatedPairs[index] = {
                                          header: headerInput.value.trim() || pair.header,
                                          content: contentInput.value.trim() || pair.content
                                        };
                                        const updatedTemplate = { ...selectedTemplate, pair: updatedPairs };
                                        setSelectedTemplate(updatedTemplate);
                                        setTemplates(templates.map(t => t._id === selectedTemplate._id ? updatedTemplate : t));
                                        setEditingPairIndex(null);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-[#10b981] text-white rounded-lg text-sm hover:bg-[#059669] transition-colors"
                                  >
                                    Lưu
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-[#1a1a2e] mb-1">{pair.header}</h5>
                                  <p className="text-sm text-[#6b7280]">{pair.content}</p>
                                </div>
                                <div className="flex items-center gap-1 ml-3">
                                  <button
                                    onClick={() => setEditingPairIndex(index)}
                                    className="p-1.5 hover:bg-[#dbeafe] rounded-lg transition-colors"
                                    title="Sửa"
                                  >
                                    <Pencil size={14} className="text-[#3b82f6]" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const updatedPairs = selectedTemplate.pair.filter((_, i) => i !== index);
                                      const updatedTemplate = { ...selectedTemplate, pair: updatedPairs };
                                      setSelectedTemplate(updatedTemplate);
                                      setTemplates(templates.map(t => t._id === selectedTemplate._id ? updatedTemplate : t));
                                    }}
                                    className="p-1.5 hover:bg-[#fee2e2] rounded-lg transition-colors"
                                    title="Xóa"
                                  >
                                    <Trash2 size={14} className="text-[#ef4444]" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-[#6b7280]">
                      <Settings size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="font-medium">Chưa chọn template</p>
                      <p className="text-sm mt-1">Vui lòng chọn một template từ tab "Templates List" để xem cấu trúc</p>
                      <button
                        onClick={() => setActiveTab('templates')}
                        className="mt-4 px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-sm"
                      >
                        Chọn Template
                      </button>
                    </div>
                  )}
                </div>
    );
}