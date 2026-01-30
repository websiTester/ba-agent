/**
 * EditingTemplate Component
 * 
 * Component cho phép người dùng chỉnh sửa template với các sections
 * Mỗi section có header và content
 * Hỗ trợ thêm/sửa/xóa sections
 * 
 * @features
 * - Inline editing cho sections
 * - Add/Edit/Delete sections
 * - Professional UI với smooth animations
 * - Auto-save hoặc manual save
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react';

interface TemplateSection {
  id: string;
  header: string;
  content: string;
}

interface EditingTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  templateName?: string;
  templateDescription?: string;
  initialSections?: TemplateSection[];
  onSave?: (templateName: string, sections: TemplateSection[]) => void;
}

export default function EditingTemplate({
  isOpen,
  onClose,
  templateName = "Requirement Template",
  initialSections = [],
  onSave,
}: EditingTemplateProps) {
  const [sections, setSections] = useState<TemplateSection[]>(
    initialSections.length > 0 ? initialSections : []
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHeader, setEditHeader] = useState('');
  const [editContent, setEditContent] = useState('');
  
  // State cho template name
  const [currentTemplateName, setCurrentTemplateName] = useState(templateName);
  const [isEditingName, setIsEditingName] = useState(false);

  // ============================================================
  // EFFECTS
  // ============================================================

  /**
   * Cập nhật sections và template name khi props thay đổi
   * Điều này đảm bảo khi user click vào template khác, data được refresh
   */
  useEffect(() => {
    if (isOpen) {
      setSections(initialSections.length > 0 ? initialSections : []);
      setCurrentTemplateName(templateName);
      // Reset editing state khi mở modal mới
      setEditingId(null);
      setEditHeader('');
      setEditContent('');
      setIsEditingName(false);
    }
  }, [isOpen, initialSections, templateName]);

  if (!isOpen) return null;

  // ============================================================
  // HANDLERS
  // ============================================================

  /**
   * Bắt đầu edit section
   */
  const handleStartEdit = (section: TemplateSection) => {
    setEditingId(section.id);
    setEditHeader(section.header);
    setEditContent(section.content);
  };

  /**
   * Hủy edit
   */
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditHeader('');
    setEditContent('');
  };

  /**
   * Lưu section đang edit
   */
  const handleUpdateSection = () => {
    if (!editingId) return;

    setSections(prev =>
      prev.map(section =>
        section.id === editingId
          ? { ...section, header: editHeader, content: editContent }
          : section
      )
    );
    handleCancelEdit();
  };

  /**
   * Xóa section
   */
  const handleDeleteSection = (id: string) => {
    setSections(prev => prev.filter(section => section.id !== id));
  };

  /**
   * Thêm section mới
   */
  const handleAddSection = () => {
    const newSection: TemplateSection = {
      id: Date.now().toString(),
      header: 'New Section',
      content: 'Enter section content here...',
    };
    setSections(prev => [...prev, newSection]);
    // Auto-edit new section
    handleStartEdit(newSection);
  };

  /**
   * Lưu tất cả thay đổi
   */
  const handleSaveAll = async () => {
    console.log(`Save template: ${currentTemplateName} - Section: `, sections);
    if (onSave) {
      await onSave(currentTemplateName, sections);
    }
    // onClose sẽ được gọi trong handleSaveTemplateSections sau khi save thành công
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal - Compact & Professional */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[90vw] max-w-4xl animate-in zoom-in-95 fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
          
          {/* Header - Compact */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 via-orange-25 to-white">
            <div className="flex-1 mr-4">
              {/* Editable Template Name */}
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={currentTemplateName}
                    onChange={(e) => setCurrentTemplateName(e.target.value)}
                    className="flex-1 text-lg font-bold text-gray-900 bg-white border-2 border-orange-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingName(false);
                      if (e.key === 'Escape') {
                        setCurrentTemplateName(templateName);
                        setIsEditingName(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg transition-all shadow-sm"
                    title="Save name"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h2 className="text-lg font-bold text-gray-900">
                    {currentTemplateName}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 transition-all shadow-sm"
                    title="Edit template name"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-0.5">
                {sections.length} section{sections.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors shadow-sm"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/30">
            {sections.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16">
                <div className="inline-flex p-3 bg-orange-100 rounded-full mb-3">
                  <Plus size={32} className="text-orange-600" />
                </div>
                <p className="text-gray-600 font-medium mb-1">No sections yet</p>
                <p className="text-sm text-gray-400 mb-4">Add your first section to get started</p>
                <button
                  onClick={handleAddSection}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-all shadow-sm"
                >
                  <Plus size={16} />
                  Add Section
                </button>
              </div>
            ) : (
              sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`
                    border rounded-xl transition-all duration-200 overflow-hidden
                    ${editingId === section.id
                      ? 'border-orange-300 bg-orange-50/50 shadow-md ring-2 ring-orange-200'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Section Number Badge */}
                      <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-500 text-white text-xs font-bold rounded-md flex items-center justify-center shadow-sm">
                        {index + 1}
                      </span>
                      
                      {editingId === section.id ? (
                        <span className="text-xs text-orange-600 italic font-medium">
                          Editing...
                        </span>
                      ) : (
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {section.header}
                        </h3>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {editingId !== section.id && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleStartEdit(section)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit section"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete section"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Section Content */}
                  <div className="px-4 py-3">
                    {editingId === section.id ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        {/* Header Input */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                            Section Title
                          </label>
                          <input
                            type="text"
                            value={editHeader}
                            onChange={(e) => setEditHeader(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all shadow-sm"
                            placeholder="Enter section title..."
                          />
                        </div>

                        {/* Content Textarea */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                            Content
                          </label>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none transition-all shadow-sm"
                            placeholder="Enter section content..."
                          />
                        </div>

                        {/* Edit Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={handleCancelEdit}
                            className="px-3.5 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateSection}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Check size={14} />
                            Update
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {section.content}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Add Section Button */}
            {sections.length > 0 && (
              <button
                onClick={handleAddSection}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/30 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Section
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-200 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              {sections.length} section{sections.length !== 1 ? 's' : ''} • Click section to edit
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAll}
                className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
