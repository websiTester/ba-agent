'use client';
import { useEffect, useState } from 'react';
import { X, Save, Box, Bot, FileText, Settings, Terminal, Loader2, Trash2, Plus } from 'lucide-react';
import { useAppState } from '@/app/store';
import { createMention } from '@/app/db/tools';
import { iso } from 'zod/v4';


const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3001"
const apiUrl = `${baseUrl}/tools_management/create_tool`

const updateApiUrl = `${baseUrl}/tools_management/update_tool`
interface ToolModalProps {
    isOpen: boolean;
    setIsOpen: any;
    setRefreshTool: any;
    refreshTool: number;
    selectedTool: any;
    setSelectedTool: any
}

export default function ToolModal({ setSelectedTool, selectedTool, isOpen = true, setIsOpen, setRefreshTool, refreshTool }: ToolModalProps) {
    // State quản lý dữ liệu form

    const phaseId = useAppState(state => state.activePhase);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
      phaseId: phaseId || '',
      toolName: '',
      toolDescription: '',
      agentToolName: '',
      agentToolDescription: '',
      agentInstruction: '',
      qa_system_prompt: '',
      model: 'gemini-2.5-flash', // Giá trị mặc định
      field: {} // Field sẽ được cập nhật tự động từ dynamicParams
    });

    // State quản lý danh sách các tham số động cho Tool Field
    const [dynamicParams, setDynamicParams] = useState([
      { id: '1', key: 'user_input', description: 'Yêu cầu đầu vào của người dùng cần được phân tích' },
      { id: '2', key: 'phase_id', description: 'The phase ID to get the relevant context' }
    ]);

    const resetFormData = () => {
      setFormData({
        phaseId: phaseId || '',
        toolName: '',
        toolDescription: '',
        agentToolName: '',
        agentToolDescription: '',
        agentInstruction: '',
        qa_system_prompt: '',
        model: 'gemini-2.5-flash', // Giá trị mặc định
        field: {} // Field sẽ được cập nhật tự động từ dynamicParams
      });
    }

    // Update form data when phaseId changes
    useEffect(() => {
      setFormData(prev => ({
        ...prev,
        phaseId: phaseId
      }));
    }, [phaseId]);


    // Tự động đồng bộ dynamicParams vào formData.field
  useEffect(() => {

    //Convert từ mảng sang Object Dictionary chứa key-value để gửi đi API
    const fieldObj = dynamicParams.reduce((acc: any, param) => {
      // Chỉ đưa vào object nếu key không rỗng
      if (param.key.trim()) {
        acc[param.key.trim()] = param.description;
      }
      return acc;
    }, {}); // <--- {} là giá trị khởi tạo ban đầu của acc

    console.log("fieldObj: "+fieldObj.toString());
    setFormData(prev => ({
      ...prev,
      field: fieldObj
    }));
  }, [dynamicParams]);


  // Thay đổi Key hoặc Value của một tham số
  const handleParamChange = (id:any, field:any, newValue:any) => {
    setDynamicParams(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: newValue } : p
    ));
  };

  // Thêm tham số mới
  const addParam = () => {
    const newId = Date.now().toString();
    setDynamicParams(prev => [
      ...prev,
      { id: newId, key: '', description: '' }
    ]);
  };

  // Xóa tham số
  const removeParam = (id:any) => {
    setDynamicParams(prev => prev.filter(p => p.id !== id));
  };

  // Fill form data with Selected Tool
   useEffect(() => {
     if(isOpen){
      if(selectedTool!=null){
        const tool = {
         phaseId: phaseId || '',
         toolName: selectedTool.toolName,
         toolDescription: selectedTool.toolDescription,
         agentToolName: selectedTool.agentToolName,
         agentToolDescription: selectedTool.agentToolDescription,
         agentInstruction: selectedTool.agentInstruction,
         qa_system_prompt: selectedTool.qa_system_prompt,
         model: selectedTool.model, // Giá trị mặc định
         field: selectedTool.field || {}
        }
        
        setFormData(tool);

      // 2. Map object "field" sang mảng "dynamicParams" để hiển thị lên giao diện
      if (selectedTool.field && typeof selectedTool.field === 'object') {
        const entries = Object.entries(selectedTool.field);
        
        if (entries.length > 0) {
          const loadedParams = entries.map(([key, value], index) => ({
            id: `loaded-${index}-${Date.now()}`, // Tạo ID unique
            key: key,
            description: String(value) || '' // UPDATE: Chuyển null/undefined thành string rỗng và gán vào description
          }));
          setDynamicParams(loadedParams);
        } else {
          // Nếu field rỗng, reset về mặc định
           setDynamicParams([{ id: 'default-1', key: '', description: '' }]); // UPDATE: description
        }
      }
    }
     } 
   }, [isOpen])
   
  
    // Hàm xử lý thay đổi input
    const handleChange = (e: any) => {
      const { name, value } = e.target;
      console.log(name, value);
      // Xử lý nested object "tool"
      
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      
    };
  
    const handleSubmit = async (e: any) => {
      e.preventDefault();
      setIsSubmitting(true);

      console.log("aupdatedApiUrl: ", updateApiUrl);
    if(selectedTool != null){
      const result = await fetch(`${updateApiUrl}/${selectedTool._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await result.json();
      console.log("data get from updated API: ", data);
    } else {
      const result = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await result.json();
      console.log("data get from create_tool: ", data);
    }
      
      setIsSubmitting(false);
      setIsOpen(false);
      setSelectedTool(null);
      resetFormData();
      setRefreshTool(refreshTool + 1);
    };
  
    // Nếu modal không mở thì không render gì cả
    if (!isOpen) return null;
  
    return (
      // Overlay backdrop
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-300">
        
        {/* Modal Container */}
        <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-orange-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                <Settings className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Configure Tool & Agent</h2>
              </div>
            </div>
            <button 
              onClick={() => {
                setSelectedTool(null);
                resetFormData();
                setIsOpen(false)
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
  
          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <form id="tool-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Section 1: Tool Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider flex items-center gap-2">
                  <Box size={14} /> Tool Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tool Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Tool Name</label>
                    <input
                      type="text"
                      name="toolName"
                      value={formData.toolName}
                      onChange={handleChange}
                      placeholder="e.g. DataAnalyzer"
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400 shadow-sm"
                    />
                  </div>
                  {/* Model */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Model</label>
                    <select
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer shadow-sm"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                      <option value="gemini-3-flash">Gemini 3 Flash</option>
                    </select>
                  </div>
                  {/* Tool Description - Full Width */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Tool Description</label>
                    <textarea
                      name="toolDescription"
                      value={formData.toolDescription}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Mô tả chức năng của tool này..."
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400 resize-none shadow-sm"
                    />
                  </div>
                </div>
              </div>
  
              <div className="h-px bg-gray-100 w-full my-4"></div>
  
              {/* Section 2: Agent Configuration */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <Bot size={14} className="text-orange-500" /> Agent Configuration
                </h3>
                
                {/* Agent Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Agent Name</label>
                  <input
                    type="text"
                    name="agentToolName"
                    value={formData.agentToolName}
                    onChange={handleChange}
                    placeholder="e.g. Senior Researcher"
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400 shadow-sm"
                  />
                </div>
                {/* Agent Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Agent Description</label>
                  <input
                    type="text"
                    name="agentToolDescription"
                    value={formData.agentToolDescription}
                    onChange={handleChange}
                    placeholder="e.g. Agent này chịu trách nhiệm phân tích dữ liệu và cung cấp các giải pháp"
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400 shadow-sm"
                  />
                </div>
  
                {/* Agent Instruction & QA System Prompt Grid */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 flex justify-between">
                      Agent Instruction
                      <span className="text-xs text-gray-400 font-normal">System behavior</span>
                    </label>
                    <textarea
                      name="agentInstruction"
                      value={formData.agentInstruction}
                      onChange={handleChange}
                      rows={8}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400 custom-scrollbar resize-none shadow-sm"
                      placeholder="Bạn là một trợ lý ảo hữu ích..."
                    />
                  </div>
  
                  {/* <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 flex justify-between">
                      QA System Prompt
                      <span className="text-xs text-gray-400 font-normal">Context prompt</span>
                    </label>
                    <textarea
                      name="qa_system_prompt"
                      value={formData.qa_system_prompt}
                      onChange={handleChange}
                      rows={4}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400 custom-scrollbar resize-none shadow-sm"
                      placeholder="Dữ liệu ngữ cảnh cho QA..."
                    />
                  </div> */}
                </div>
              </div>
  
              <div className="h-px bg-gray-100 w-full my-4"></div>
  
              {/* Section 3: Tool Field Parameters (Dynamic) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <Terminal size={14} className="text-orange-500" /> Tool Field Parameters
                </h3>
                <button
                  type="button"
                  onClick={addParam}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 px-2 py-1 bg-orange-50 hover:bg-orange-100 rounded transition-colors"
                >
                  <Plus size={14} /> Add Parameter
                </button>
              </div>

              <div className="bg-orange-50/50 rounded-lg p-4 border border-orange-100 space-y-3">
                {dynamicParams.length === 0 && (
                   <p className="text-sm text-gray-400 text-center py-2 italic">Chưa có tham số nào. Nhấn Add Parameter để thêm.</p>
                )}
                
                {dynamicParams.map((param, index) => (
                  <div key={param.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex-1 space-y-1">
                      {index === 0 && <label className="text-xs font-semibold text-gray-500 uppercase">Parameter Name</label>}
                      <input
                        type="text"
                        value={param.key}
                        onChange={(e) => handleParamChange(param.id, 'key', e.target.value)}
                        placeholder="Key (e.g. user_input)"
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm shadow-sm font-mono"
                      />
                    </div>
                    
                    <div className="flex-[2] space-y-1">
                      {index === 0 && <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>}
                      <input
                        type="text"
                        value={param.description}
                        onChange={(e) => handleParamChange(param.id, 'description', e.target.value)}
                        placeholder="Description..."
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm shadow-sm"
                      />
                    </div>

                    <div className={index === 0 ? "pt-5" : ""}>
                        <button
                        type="button"
                        onClick={() => removeParam(param.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors mt-[2px]"
                        title="Remove Parameter"
                        >
                        <Trash2 size={16} />
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
  
            </form>
          </div>
  
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
            <button
              onClick={() => {
                resetFormData();
                setSelectedTool(null);
                setIsOpen(false)
              }}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors border border-gray-200 shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSubmitting ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
  
        {/* Styles cho custom scrollbar */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f3f4f6;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
        `}</style>
      </div>
    );
  };