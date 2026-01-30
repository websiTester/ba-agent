import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Edit2, Wrench, Settings, Loader2 } from 'lucide-react';
import { useAppState } from '@/app/store';
import ListTemplate from '../Sidebar/components/ListTemplate';

/**
 * Mock data ban đầu cho danh sách tool
 */
const INITIAL_TOOLS = [
  { id: 1, name: 'VS Code', description: 'Code Editor mạnh mẽ nhất hiện nay' },
  { id: 2, name: 'Figma', description: 'Công cụ thiết kế UI/UX' },
  { id: 3, name: 'Postman', description: 'Testing API platform' },
];

/**
 * Component ToolListModal
 * @param {boolean} isOpen - Trạng thái hiển thị modal
 * @param {function} onClose - Hàm đóng modal
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3001"
const apiUrl = `${baseUrl}/tools_management/get_tools`

const deleteToolUrl = `${baseUrl}/tools_management/delete_tool`

interface ToolListModalProps {
  setShowToolModal: any;
  refreshTool: number;
  tools: any;
  setTools: any;
  setSelectedTool: any;
  isLoadingTools: boolean
}

export default function ToolListModal({isLoadingTools,setSelectedTool, tools, setTools, refreshTool, setShowToolModal}: ToolListModalProps) {
  
  const setShowToolListModal = useAppState(state => state.setShowToolListModal);
  const showToolListModal = useAppState(state => state.showToolListModal);

  const phaseId = useAppState(state => state.activePhase);
  //const [tools, setTools] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State cho ListTemplate modal
  const [isListTemplateOpen, setIsListTemplateOpen] = useState(false);
  const [selectedToolForTemplate, setSelectedToolForTemplate] = useState<any>(null);

  // Xử lý khi bấm nút Add
  const handleAddTool = () => {
    setShowToolModal(true);
  };

  /**
   * Xử lý khi click Edit button
   * Mở ListTemplate modal để edit template sections
   */
  const handleEdit = (tool: any) => {
    console.log(`Edit template for tool: ${tool.toolName}`);
    setSelectedToolForTemplate(tool);
    setIsListTemplateOpen(true);
  };

  /**
   * Xử lý khi click Settings button
   * Mở ToolModal để advanced configuration
   */
  const handleSettings = (tool: any) => {
    console.log(`Advanced settings for tool: ${tool.toolName}`);
    setSelectedTool(tool);
    setShowToolModal(true);
  };

  const handleRemove = async(id: any) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tool này?')) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`${deleteToolUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        console.error('Failed to delete tool');
      } else {
        setSelectedTool(null);
        setTools(tools.filter((t: any) => t._id !== id));
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
    } finally {
      setIsDeleting(false);
    }
  };


  const fetchTools = async () => {
    //setIsLoadingTemplates(true);
    try {
      console.log("apiUrl: ", apiUrl);
      const response = await fetch(`${apiUrl}/${phaseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      console.log("data get from fetchTools: ", data);
      setTools(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTools([]);
    } finally {
      //setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if(showToolListModal){
      fetchTools()
    }
  }, [showToolListModal]);

  // Nếu modal không mở thì không render gì cả
  if (!showToolListModal) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setShowToolListModal(false)}
        ></div>

        {/* Modal Content */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg">
                <Settings size={18} className="text-orange-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">Quản lý Công cụ</h3>
            </div>
            <button 
              onClick={() => setShowToolListModal(false)}
              className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors group"
              aria-label="Close"
            >
              <X size={18} className="text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>

          {/* Body: Danh sách Tools */}
          <div className="px-6 py-4 max-h-[58vh] overflow-y-auto">
            {isLoadingTools ? (
              /* Loading State */
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={28} className="animate-spin text-orange-500 mb-2.5" />
                <p className="text-sm text-gray-500">Đang tải tools...</p>
              </div>
            ) :
            tools.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="p-3 bg-orange-50 rounded-full mb-3">
                  <Wrench size={24} className="text-orange-300" />
                </div>
                <p className="text-sm text-gray-500">Chưa có công cụ nào</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tools.map((tool: any, index: number) => (
                  <div 
                    key={index} 
                    className="group flex items-start justify-between p-3 rounded-xl border border-orange-100/50 hover:border-orange-200/70 hover:bg-gradient-to-r hover:from-orange-50/30 hover:to-orange-50/50 transition-all duration-200"
                  >
                    <div className="flex gap-2.5 flex-1 min-w-0">
                      <div className="mt-0.5 text-gray-400 group-hover:text-orange-500 flex-shrink-0 transition-colors">
                        <Wrench size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 group-hover:text-orange-700 truncate transition-colors">
                          {tool.toolName}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                          {tool.toolDescription}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 pl-2 flex-shrink-0">
                      {/* Edit Template Button */}
                      <button 
                        onClick={() => handleEdit(tool)}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit template sections"
                        aria-label="Edit template"
                      >
                        <Edit2 size={14} />
                      </button>
                      
                      {/* Advanced Settings Button */}
                      <button 
                        onClick={() => handleSettings(tool)}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Advanced configuration"
                        aria-label="Settings"
                      >
                        <Settings size={14} />
                      </button>
                      
                      {/* Delete Button */}
                      <button 
                        disabled={isDeleting}
                        onClick={() => handleRemove(tool._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove"
                        aria-label="Delete"
                      >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} /> }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer: Add Button */}
          <div className="px-6 py-4 border-t border-orange-100/50 bg-gradient-to-b from-white to-orange-50/20">
            <button
              onClick={handleAddTool}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.98]"
            >
              <Plus size={18} />
              <span className="text-sm">Thêm công cụ mới</span>
            </button>
            <p className="text-xs text-center text-gray-400 mt-2.5">
              Phase: <span className="font-medium text-orange-600">{phaseId}</span>
            </p>
          </div>

        </div>
      </div>

      {/* ListTemplate Modal - Edit Template Sections */}
      {selectedToolForTemplate && (
        <ListTemplate
          isOpen={isListTemplateOpen}
          onClose={() => {
            setIsListTemplateOpen(false);
            setSelectedToolForTemplate(null);
          }}
          agentSource={selectedToolForTemplate.toolName}
        />
      )}
    </>
  );
};

