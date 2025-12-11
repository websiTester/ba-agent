'use client';
import { Template } from "@/app/models/types";
import { useAppState } from "@/app/store";
import { Check, CheckCircle, ChevronRight, Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TemplateTabProps{
    selectedTemplate: Template | null;
    setSelectedTemplate: any;
    phaseName: string,
    isSettingsOpen: boolean,
    setActiveTab: any,
}


export default function TemplateListTab({

    selectedTemplate, 
    setSelectedTemplate,
    phaseName,
    isSettingsOpen,
    setActiveTab,
    
}: TemplateTabProps) {
    
    const activePhase = useAppState(set => set.activePhase);


    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [settingDefaultTemplateId, setSettingDefaultTemplateId] = useState<string | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);


    const handleAddNewTemplate = async () => {
        if (!newTemplateName.trim()) return;
        
        try {
          const templateData = {
            agentId: activePhase,
            templateName: newTemplateName.trim(),
            isDefault: false,
            pair: [{ header: 'New Section', content: 'Mô tả nội dung...' }]
          };
          
          const response = await fetch('/api/templates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateData),
          });
    
          if (!response.ok) {
            throw new Error('Failed to create template');
          }
          
          const createdTemplate = await response.json() as Template;
          setTemplates([...templates, createdTemplate]);
          setNewTemplateName('');
          setIsAddingNew(false);
        } catch (error) {
          console.error('Error creating template:', error);
        }
      }

    
    const handleSetDefaultTemplate = async (e: React.MouseEvent<HTMLButtonElement>, template: Template) => {
        e.stopPropagation();
        
        // Nếu template này đã là default rồi thì không cần làm gì
        if (template.isDefault) return;
        
        // Set loading state
        setSettingDefaultTemplateId(template._id || null);
        
        try {
            const response = await fetch('/api/templates', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template: template, agentName: phaseName+" Agent" }),
            });
            
            if (response.ok) {
            // Cập nhật state: bỏ isDefault của template cũ, set isDefault cho template mới
            setTemplates(templates.map(t => ({
                ...t,
                isDefault: t._id === template._id
            })));
            }
        } catch (error) {
            console.error('Error setting default template:', error);
        } finally {
            setSettingDefaultTemplateId(null);
        }
        }


        const handleDeleteTemplate = async(e: React.MouseEvent<HTMLButtonElement>, template: Template) => {
    
            e.stopPropagation();
            await fetch(`/api/templates?templateId=${template._id}`, {
              method: 'DELETE',
            });
            setTemplates(templates.filter(t => t._id !== template._id));
            if (selectedTemplate?._id === template._id) {
              setSelectedTemplate(null);
            }
        }

    // Fetch templates from MongoDB when phase changes
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await fetch(`/api/templates?agentId=${activePhase}`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Load templates and agent info when settings modal opens or phase changes
  useEffect(() => {
    if (isSettingsOpen) {
      fetchTemplates();
    }
  }, [activePhase]);



    return (
        <div className="space-y-4">
                  {/* Add New Template Button */}
                  {!isAddingNew ? (
                    <button
                      onClick={() => setIsAddingNew(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#e5e7eb] rounded-xl text-[#6b7280] hover:border-[#f97316] hover:text-[#f97316] hover:bg-[#fff7ed] transition-colors"
                    >
                      <Plus size={18} />
                      Thêm Template mới
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-[#fff7ed] border border-[#fed7aa] rounded-xl">
                      <input
                        type="text"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="Nhập tên template..."
                        className="flex-1 px-3 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#f97316]"
                        autoFocus
                      />
                      <button
                        onClick={async () => await handleAddNewTemplate()}
                        className="p-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingNew(false);
                          setNewTemplateName('');
                        }}
                        className="p-2 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {/* Templates List */}
                  <div className="space-y-2">
                    {isLoadingTemplates ? (
                      /* Loading State */
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-[#f97316] mb-3" />
                        <p className="text-sm text-[#6b7280]">Đang tải templates...</p>
                      </div>
                    ) : templates.length === 0 ? (
                      /* Empty State */
                      <div className="text-center py-8 text-[#6b7280]">
                        <p>Chưa có template nào</p>
                        <p className="text-sm">Nhấn "Thêm Template mới" để bắt đầu</p>
                      </div>
                    ) : (
                      /* Templates */
                      templates.map((template) => (
                        <div
                          key={template._id}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                            selectedTemplate?._id === template._id
                              ? 'border-[#f97316] bg-[#fff7ed]'
                              : 'border-[#e5e7eb] hover:border-[#f97316] hover:bg-[#fafbfc]'
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#1a1a2e]">{template.templateName}</span>
                              {template.isDefault && (
                                <span className="px-2 py-0.5 bg-[#dbeafe] text-[#3b82f6] text-xs font-medium rounded-full">
                                  In use
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[#6b7280] mt-1">
                              {template.pair.length} sections
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTemplate(template);
                                setActiveTab('structure');
                              }}
                              className="p-2 hover:bg-[#e5e7eb] rounded-lg transition-colors"
                              title="Xem cấu trúc"
                            >
                              <ChevronRight size={18} className="text-[#6b7280]" />
                            </button>
                            <button
                              onClick={(e) => handleSetDefaultTemplate(e, template)}
                              className={`p-2 rounded-lg transition-colors ${
                                template.isDefault 
                                  ? 'bg-[#dcfce7] cursor-default' 
                                  : settingDefaultTemplateId === template._id
                                    ? 'bg-[#fff7ed] cursor-wait'
                                    : 'hover:bg-[#dbeafe]'
                              }`}
                              title={template.isDefault ? "Đang sử dụng" : settingDefaultTemplateId === template._id ? "Đang lưu..." : "Chọn làm mặc định"}
                              disabled={template.isDefault || settingDefaultTemplateId !== null}
                            >
                              {settingDefaultTemplateId === template._id ? (
                                <Loader2 size={16} className="animate-spin text-[#f97316]" />
                              ) : (
                                <CheckCircle 
                                  size={16} 
                                  className={template.isDefault ? "text-[#22c55e]" : "text-[#3b82f6]"} 
                                />
                              )}
                            </button>
                            <button
                              onClick={async (e) => {
                                await handleDeleteTemplate(e, template);
                              }}
                              className="p-2 hover:bg-[#fee2e2] rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 size={16} className="text-[#ef4444]" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Edit Template Name Modal */}
                  {editingTemplate && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center">
                      <div className="absolute inset-0 bg-black/30" onClick={() => setEditingTemplate(null)} />
                      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h4 className="text-lg font-semibold text-[#1a1a2e] mb-4">Sửa tên Template</h4>
                        <input
                          type="text"
                          defaultValue={editingTemplate.templateName}
                          className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#f97316] mb-4"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newName = (e.target as HTMLInputElement).value.trim();
                              if (newName) {
                                setTemplates(templates.map(t => 
                                  t._id === editingTemplate._id ? { ...t, templateName: newName } : t
                                ));
                                setEditingTemplate(null);
                              }
                            }
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingTemplate(null)}
                            className="px-4 py-2 text-[#6b7280] hover:bg-[#f3f4f6] rounded-lg transition-colors"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => {
                              const input = document.querySelector('input[defaultValue]') as HTMLInputElement;
                              const newName = input?.value.trim();
                              if (newName) {
                                setTemplates(templates.map(t => 
                                  t._id === editingTemplate._id ? { ...t, templateName: newName } : t
                                ));
                                setEditingTemplate(null);
                              }
                            }}
                            className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

    );
}