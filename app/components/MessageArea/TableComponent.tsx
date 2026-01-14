import { TableIcon, PlusCircle, Inbox, MoreHorizontal, GitBranch, FileText, PenTool, X, Save, Shield, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export interface FunctionalRequirement {
  id: string;
  name: string;
  type: RequirementType; // Thêm type để phân loại
  rationale: string;
  description: string;
}
export type RequirementType = 'functional' | 'non-functional';

// --- COMPONENT: REQUIREMENTS TABLE EDITOR ---
interface TableComponentProps {
  data: FunctionalRequirement[];
  onAdd: (req: Omit<FunctionalRequirement, 'id'>) => void;
  onDelete: (id: string) => void;
  aiResponse: any
}

export default function TableComponent({ onDelete, aiResponse }: TableComponentProps) {
  const [activeTab, setActiveTab] = useState<RequirementType>('functional');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', rationale: '', description: '' });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [data, setData] = useState<any[]>([]);
  // Filter data based on active tab
  //const filteredData = data.filter(req => req.type === activeTab);
  // const functionalData = aiResponse.functional_requirements;
  // const nonFunctionalData = aiResponse.non_functional_requirements;

  useEffect(() => {
    if(aiResponse !== null) {
      if(activeTab === 'functional') {
        setData(aiResponse.functional_requirements);
      } else {
        setData(aiResponse.non_functional_requirements);
      }
    }
  }, [aiResponse, activeTab])
  const handleAddItem = () => {
    if (!newItem.name || !newItem.description) return;
    //onAdd({ ...newItem, type: activeTab }); // Include current type
    let id = '';
    if(activeTab === 'functional') {
      id = 'FR-' + (data.length + 1);
    } else {
      id = 'NFR-' + (data.length + 1);
    }
    
    setData([...data, {...newItem, id: id}]);
    setNewItem({ name: '', rationale: '', description: '' });
    setIsModalOpen(false);
  };

  const handleOptionClick = (action: string, id: string) => {
    console.log(`Action: ${action} for Requirement ID: ${id}`);
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const handleMenuTrigger = (e: React.MouseEvent<HTMLButtonElement>, reqId: string) => {
    e.stopPropagation();
    if (openMenuId === reqId) {
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setOpenMenuId(reqId);
      setMenuPosition({ 
        top: rect.bottom + window.scrollY + 5, 
        left: rect.left + window.scrollX 
      });
    }
  };

  return (


    <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col relative">
      
      {/* Header & Tabs */}
      <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">        
        {/* Tab Navigation */}
        <div className="flex px-6 space-x-6">
          <button
            onClick={() => setActiveTab('functional')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'functional' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Zap size={14} />
            Functional Requirements
           
          </button>
          <button
            onClick={() => setActiveTab('non-functional')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'non-functional' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield size={14} />
            Non-Functional Requirements
            
          </button>
          <div className="flex items-center justify-between px-6 py-4">
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
          >
            <PlusCircle size={14} /> Add {activeTab === 'functional' ? 'Functional' : 'Non-Functional'}
          </button>
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-white relative">
        {data.length === 0 || aiResponse === null ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 animate-in fade-in duration-300">
            <div className="bg-gray-50 p-4 rounded-full mb-3">
              <Inbox size={32} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              Hiện chưa có yêu cầu {activeTab === 'functional' ? 'chức năng' : 'phi chức năng'} nào
            </p>
            <p className="text-xs text-gray-400 mt-1">Sử dụng nút "Add" để tạo mới</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 sticky top-0 z-10 shadow-sm">
              <tr>
                {activeTab=='functional' && <th className="px-4 py-3 w-12 text-center text-gray-400 bg-gray-100"><MoreHorizontal size={14} /></th>}
                
                <th className="px-6 py-3 w-16 text-center bg-gray-100">STT</th>
                <th className="px-6 py-3 w-1/4 bg-gray-100">Requirement Name</th>
                <th className="px-6 py-3 w-1/4 bg-gray-100">Rationale</th>
                <th className="px-6 py-3 bg-gray-100">Detailed Description</th>
                <th className="px-6 py-3 w-16 text-center bg-gray-100">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((req, index) => (
                <tr key={req.id} className="hover:bg-blue-50/50 transition-colors group relative">
                  {activeTab=='functional' && (
                    <td className="px-4 py-3 text-center">
                    <button 
                      onClick={(e) => handleMenuTrigger(e, req.id)}
                      className={`p-1.5 rounded hover:bg-blue-100 transition-colors ${openMenuId === req.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                  )}
                  <td className="px-6 py-3 text-center text-gray-500 font-mono">{index + 1}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{req.name}</td>
                  <td className="px-6 py-3 text-gray-600">{req.rationale}</td>
                  <td className="px-6 py-3 text-gray-600 leading-relaxed">{req.description}</td>
                  <td className="px-6 py-3 text-center">
                    <button 
                      onClick={() => onDelete(req.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Xóa"
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DROPDOWN MENU */}
      {openMenuId && menuPosition && (
        <>
          <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setMenuPosition(null); }} />
          <div 
            className="fixed z-50 w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1 text-left animate-in fade-in zoom-in-95 duration-100 flex flex-col"
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
          >
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
              Requirement Actions
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleOptionClick('Diagram', openMenuId); }}
              className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors"
            >
              <GitBranch size={14} className="text-blue-500" /> Vẽ Diagram
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleOptionClick('FSD', openMenuId); }}
              className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors"
            >
              <FileText size={14} className="text-green-500" /> Tạo tài liệu FSD
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleOptionClick('UIUX', openMenuId); }}
              className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors"
            >
              <PenTool size={14} className="text-purple-500" /> Phân tích UI/UX
            </button>
          </div>
        </>
      )}

      {/* MODAL ADD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                Add {activeTab === 'functional' ? 'Functional' : 'Non-Functional'} Requirement
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Requirement Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                  placeholder={activeTab === 'functional' ? "Ví dụ: Đăng nhập" : "Ví dụ: Bảo mật"}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Rationale</label>
                <input 
                  type="text" 
                  value={newItem.rationale}
                  onChange={(e) => setNewItem({...newItem, rationale: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                  placeholder="Ví dụ: Để đảm bảo an toàn dữ liệu"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Detailed Description <span className="text-red-500">*</span></label>
                <textarea 
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm resize-none"
                  placeholder="Mô tả chi tiết..."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Hủy bỏ</button>
              <button onClick={handleAddItem} disabled={!newItem.name || !newItem.description} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Save size={16} /> Lưu lại</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};