/**
 * ListTemplate Component
 * 
 * Modal hiển thị danh sách templates
 * Cho phép edit template (mở EditingTemplate) hoặc advanced config (mở ToolModal)
 * 
 * @features
 * - List templates với search/filter
 * - Edit button → EditingTemplate modal
 * - Delete template
 * - Add new template
 * - Load templates from API
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Plus, Search, Wrench, Loader2, CheckCircle2, Lock } from 'lucide-react';
import EditingTemplate from './EditingTemplate';

// API Configuration
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:8000";
const TEMPLATES_API_URL = `${baseUrl}/tool_template/templates`;

interface Template {
  _id: string;
  template_name: string;
  agent_source: string;
  is_default: boolean;
  is_in_use: boolean;
  template?: Array<{ header: string; content: string }>; // Backend format
}

interface ListTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  agentSource: string; // agent_source thay vì phaseId
  onRefresh?: () => void;
}

export default function ListTemplate({
  isOpen,
  onClose,
  agentSource,
}: ListTemplateProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSettingActive, setIsSettingActive] = useState<string | null>(null); // Track which template is being set as active
  
  // Modal states
  const [isEditingTemplateOpen, setIsEditingTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // ============================================================
  // API CALLS
  // ============================================================

  /**
   * Load templates từ API
   */
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${TEMPLATES_API_URL}/${agentSource}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ Loaded ${result.count} templates for agent: ${agentSource}`);
        setTemplates(result.data);
        setFilteredTemplates(result.data);
      } else {
        console.warn(`⚠️ No templates found for agent: ${agentSource}`);
        setTemplates([]);
        setFilteredTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
      setFilteredTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete template
   */
  const deleteTemplate = async (templateId: string) => {
    setIsDeleting(templateId);
    try {
      const response = await fetch(`${TEMPLATES_API_URL}/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      console.log(`✅ Deleted template: ${templateId}`);
      
      // Remove from local state
      setTemplates(prev => prev.filter(t => t._id !== templateId));
      setFilteredTemplates(prev => prev.filter(t => t._id !== templateId));

    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // ============================================================
  // EFFECTS
  // ============================================================

  /**
   * Load templates khi modal mở hoặc agentSource thay đổi
   */
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, agentSource]);

  /**
   * Filter templates khi search query thay đổi
   */
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTemplates(templates);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = templates.filter((t) =>
        t.template_name.toLowerCase().includes(query)
      );
      setFilteredTemplates(filtered);
    }
  }, [searchQuery, templates]);

  if (!isOpen) return null;

  // ============================================================
  // HANDLERS
  // ============================================================

  /**
   * Set template as active (is_in_use = true)
   * Các template khác sẽ được set is_in_use = false
   */
  const handleSelectTemplate = async (template: Template) => {
    // Nếu template đã được sử dụng rồi thì không làm gì
    if (template.is_in_use) {
      return;
    }

    // Nếu đang có template khác đang được set active, không cho phép
    if (isSettingActive) {
      return;
    }

    setIsSettingActive(template._id);

    try {
      // Call API để update is_in_use
      const response = await fetch(`${TEMPLATES_API_URL}/set-active/${template._id}?agent_source=${agentSource}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to set template as active');
      }

      const result = await response.json();
      console.log('✅ Template set as active:', result);

      // Update local state
      setTemplates(prev => prev.map(t => ({
        ...t,
        is_in_use: t._id === template._id
      })));
      setFilteredTemplates(prev => prev.map(t => ({
        ...t,
        is_in_use: t._id === template._id
      })));

    } catch (error) {
      console.error('Error setting template as active:', error);
      alert('Failed to set template as active. Please try again.');
    } finally {
      setIsSettingActive(null);
    }
  };

  /**
   * Mở EditingTemplate modal để edit sections
   */
  const handleEditTemplate = (template: Template, e: React.MouseEvent) => {
    // Stop propagation để không trigger handleSelectTemplate
    e.stopPropagation();
    
    // Không cho edit default template
    if (template.is_default) {
      alert('Cannot edit default template');
      return;
    }
    setSelectedTemplate(template);
    setIsEditingTemplateOpen(true);
  };

  /**
   * Xóa template
   */
  const handleDeleteTemplate = async (template: Template, e: React.MouseEvent) => {
    // Stop propagation để không trigger handleSelectTemplate
    e.stopPropagation();
    
    // Không cho xóa default template
    if (template.is_default) {
      alert('Cannot delete default template');
      return;
    }
    
    // Không cho xóa template đang được sử dụng
    if (template.is_in_use) {
      alert('Cannot delete template that is currently in use');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this template?')) return;
    await deleteTemplate(template._id);
  };

  /**
   * Thêm template mới
   * Tạo template với name "New Template" và 1 cặp header-content mặc định
   * Gọi API để lưu vào database
   */
  const handleAddTemplate = async () => {
    setIsLoading(true);
    try {
      // Default template data
      const newTemplateData = {
        agent_source: agentSource,
        template_name: "Default Template",
        is_default: false,
        is_in_use: false,
        template: [
          {
            header: "Section 1",
            content: "Enter your content here..."
          }
        ]
      };

      const response = await fetch(TEMPLATES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplateData),
      });

      if (!response.ok) {
        throw new Error('Failed to create new template');
      }

      const result = await response.json();
      console.log('✅ New template created:', result);

      // Refresh templates list để hiển thị template mới
      await fetchTemplates();

    } catch (error) {
      console.error('Error creating new template:', error);
      alert('Failed to create new template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save template sections từ EditingTemplate
   * Backend expects: { agent_source, template_name, template: [{header, content}] }
   */
  const handleSaveTemplateSections = async (templateName: string, sections: any[]) => {
    console.log('Saving template:', templateName, sections);
    console.log('Selected template:', selectedTemplate);
    
    try {
      const isUpdate = selectedTemplate !== null;
      
      if (!isUpdate) {
        console.error('❌ No template selected for update!');
        alert('Error: No template selected. Please try again.');
        return;
      }
      
      // Kiểm tra xem có thay đổi gì không
      const hasNameChanged = templateName !== selectedTemplate.template_name;
      
      // So sánh sections
      const originalSections = selectedTemplate.template || [];
      const hasSectionsChanged = 
        sections.length !== originalSections.length ||
        sections.some((section, index) => {
          const original = originalSections[index];
          return !original || 
                 section.header !== original.header || 
                 section.content !== original.content;
        });
      
      // Nếu không có thay đổi gì, đóng modal và return
      if (!hasNameChanged && !hasSectionsChanged) {
        console.log('ℹ️ No changes detected, closing modal without API call');
        setIsEditingTemplateOpen(false);
        setSelectedTemplate(null);
        return;
      }
      
      console.log(`📝 Changes detected - Name: ${hasNameChanged}, Sections: ${hasSectionsChanged}`);
      
      const url = `${TEMPLATES_API_URL}/update/${selectedTemplate._id}`;
      
      // Convert sections format to backend format
      const templateData = sections.map(section => ({
        header: section.header,
        content: section.content
      }));
      
      console.log(`Update URI: ${url}`);
      console.log('Request body:', {
        agent_source: agentSource,
        template_name: templateName,
        template: templateData,
      });

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_source: agentSource,
          template_name: templateName,
          template: templateData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to update template: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Template updated successfully:`, result);

      // Refresh templates list
      await fetchTemplates();
      
      // Close EditingTemplate modal
      setIsEditingTemplateOpen(false);
      setSelectedTemplate(null);
      
    } catch (error) {
      console.error('Error saving template:', error);
      alert(`Failed to save template. Please try again.`);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal - Compact & Professional */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-3xl animate-in zoom-in-95 fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col max-h-[75vh] overflow-hidden">
          
          {/* Header - Compact */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gradient-to-r from-orange-50 via-orange-25 to-white">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <Wrench size={18} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Template Management
                </h2>
                <p className="text-xs text-gray-500">
                  {agentSource}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search & Add - Compact */}
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2.5">
              {/* Search */}
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Add Button - Compact */}
              <button
                onClick={handleAddTemplate}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                New
              </button>
            </div>
          </div>

          {/* Templates List - Scrollable & Compact */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-[200px] max-h-[calc(75vh-180px)]">
            {isLoading ? (
              /* Loading State */
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 size={28} className="animate-spin text-orange-500 mb-2.5" />
                <p className="text-sm text-gray-500">Loading templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16">
                <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3">
                  <Wrench size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-1">
                  {searchQuery ? 'No templates found' : 'No templates yet'}
                </p>
                <p className="text-sm text-gray-400">
                  {searchQuery ? 'Try a different search term' : 'Click "New" to create your first template'}
                </p>
              </div>
            ) : (
              /* Templates List - Compact Cards */
              filteredTemplates.map((template) => (
                <div
                  key={template._id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`group bg-white border rounded-xl p-3 hover:shadow-md hover:scale-[1.01] transition-all duration-200 ${
                    isSettingActive === template._id 
                      ? 'cursor-wait opacity-70' 
                      : 'cursor-pointer'
                  } ${
                    template.is_in_use 
                      ? 'border-green-300 bg-green-50/30' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Icon - Smaller */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border ${
                      template.is_in_use
                        ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200/50'
                        : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200/50'
                    }`}>
                      {isSettingActive === template._id ? (
                        <Loader2 size={16} className="animate-spin text-orange-600" />
                      ) : (
                        <Wrench size={16} className={template.is_in_use ? 'text-green-600' : 'text-orange-600'} />
                      )}
                    </div>

                    {/* Template Name & Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {template.template_name}
                        </h3>
                        {/* Badges */}
                        <div className="flex items-center gap-1">
                          {isSettingActive === template._id && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-semibold rounded animate-pulse">
                              <Loader2 size={10} className="animate-spin" />
                              Setting...
                            </span>
                          )}
                          {template.is_in_use && isSettingActive !== template._id && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded">
                              <CheckCircle2 size={10} />
                              In Use
                            </span>
                          )}
                          {template.is_default && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded">
                              <Lock size={10} />
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {template.template?.length || 0} section{(template.template?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Actions - Compact */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Edit Template */}
                      <button
                        onClick={(e) => handleEditTemplate(template, e)}
                        disabled={template.is_default || isSettingActive === template._id}
                        className={`p-2 rounded-lg transition-colors ${
                          template.is_default || isSettingActive === template._id
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                        }`}
                        title={template.is_default ? 'Cannot edit default template' : 'Edit template'}
                      >
                        <Edit2 size={16} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => handleDeleteTemplate(template, e)}
                        disabled={isDeleting === template._id || template.is_default || template.is_in_use || isSettingActive === template._id}
                        className={`p-2 rounded-lg transition-colors ${
                          template.is_default || template.is_in_use || isSettingActive === template._id
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={
                          template.is_default 
                            ? 'Cannot delete default template' 
                            : template.is_in_use
                            ? 'Cannot delete template in use'
                            : 'Delete template'
                        }
                      >
                        {isDeleting === template._id ? (
                          <Loader2 size={16} className="animate-spin text-red-600" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer - Compact */}
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* EditingTemplate Modal */}
      <EditingTemplate
        isOpen={isEditingTemplateOpen}
        onClose={() => {
          setIsEditingTemplateOpen(false);
          setSelectedTemplate(null);
        }}
        templateName={selectedTemplate?.template_name || 'New Template'}
        initialSections={
          selectedTemplate?.template?.map((item, index) => ({
            id: String(index + 1),
            header: item.header,
            content: item.content,
          })) || []
        }
        onSave={handleSaveTemplateSections}
      />

    </>
  );
}
