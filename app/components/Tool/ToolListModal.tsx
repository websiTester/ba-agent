import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Edit2, Wrench, Settings, Loader2 } from 'lucide-react';
import { useAppState } from '@/app/store';

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
  isOpen: boolean;
  onClose: () => void;
  refreshTool: number;
  tools: any;
  setTools: any;
  setSelectedTool: any;
  isLoadingTools: boolean
}

export default function ToolListModal({isLoadingTools,setSelectedTool, tools, setTools, refreshTool, setShowToolModal, isOpen, onClose }: ToolListModalProps) {
  const phaseId = useAppState(state => state.activePhase);
  //const [tools, setTools] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Xử lý khi bấm nút Add
  const handleAddTool = () => {
    setShowToolModal(true);
  };

  const handleEdit = (id: any) => {
    console.log(`Edit tool with ID: ${id}`);
    const tool = tools.filter((tool:any) => tool._id==id)[0];
    console.log("ToolListModal: "+tool);
    console.log("ToolListModal: "+tool.toolName);
    console.log("ToolListModal: "+tool.field.user_input);
    
    
    setSelectedTool(tool);
    setShowToolModal(true);
  };

  const handleRemove = async(id: any) => {
    setIsDeleting(true);
    const response = await fetch(`${deleteToolUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      console.error('Failed to delete tool');
    } 
    setSelectedTool(null);
    setTools(tools.filter((t: any) => t._id !== id));
    setIsDeleting(false);
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

  // Load templates and agent info when settings modal opens or phase changes
  useEffect(() => {
    if (isOpen) {
      //fetchTools();
    }
  }, [phaseId, isOpen, refreshTool]);


  // Nếu modal không mở thì không render gì cả
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay: Lớp nền mờ phía sau, bấm vào sẽ đóng modal */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-orange-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <Settings size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Quản lý Công cụ</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body: Danh sách Tools */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isLoadingTools ? (
                      /* Loading State */
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-[#f97316] mb-3" />
                        <p className="text-sm text-[#6b7280]">Đang tải tools...</p>
                      </div>
                    ) :
          tools.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có công cụ nào.
            </div>
          ) : (
            <div className="space-y-3">
              {tools.map((tool: any, index: number) => (
                <div 
                  key={index} 
                  className="group flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all duration-200"
                >
                  <div className="flex gap-3">
                    <div className="mt-1 text-gray-400 group-hover:text-orange-500">
                      <Wrench size={18} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 group-hover:text-orange-700">
                        {tool.toolName}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {tool.toolDescription}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 pl-2">
                    <button 
                      onClick={() => handleEdit(tool._id)}
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      disabled={isDeleting}
                      onClick={() => handleRemove(tool._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Remove"
                    >
                      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} /> }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Add Button */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleAddTool}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Plus size={20} />
            <span>Thêm công cụ mới</span>
          </button>
          <p className="text-xs text-center text-gray-400 mt-3">
            Danh sách Tool của phase {phaseId}
          </p>
        </div>

      </div>
    </div>
  );
};

