'use client';
import { useEffect, useState } from 'react';
import { X, Save, Settings, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppState } from '@/app/store';


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
    // State management
    const phaseId = useAppState(state => state.activePhase);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
      phaseId: phaseId || '',
      toolName: '',
      toolDescription: '',
      toolPrompt: '',
      agentToolName: '',
      agentToolDescription: '',
      agentInstruction: '',
      qa_system_prompt: '',
      model: 'gemini-2.5-flash', // Giá trị mặc định
      field: {} // Field sẽ được cập nhật tự động từ dynamicParams
    });

    // Dynamic parameters state (currently unused but kept for future functionality)
    const [dynamicParams, setDynamicParams] = useState([
      { id: '1', key: 'user_input', description: 'Yêu cầu đầu vào của người dùng cần được phân tích' },
      { id: '2', key: 'phase_id', description: 'The phase ID to get the relevant context' }
    ]);

    const resetFormData = () => {
      setFormData({
        phaseId: phaseId || '',
        toolName: '',
        toolDescription: '',
        toolPrompt: '',
        agentToolName: '',
        agentToolDescription: '',
        agentInstruction: '',
        qa_system_prompt: '',
        model: 'gemini-2.5-flash',
        field: {}
      });
      setValidationErrors({});
      setSubmitStatus('idle');
      setErrorMessage('');
    };

    // Update form data when phaseId changes
    useEffect(() => {
      setFormData(prev => ({
        ...prev,
        phaseId: phaseId
      }));
    }, [phaseId]);


    // Auto-sync dynamicParams to formData.field
  useEffect(() => {
    const fieldObj = dynamicParams.reduce((acc: any, param) => {
      if (param.key.trim()) {
        acc[param.key.trim()] = param.description;
      }
      return acc;
    }, {});

    setFormData(prev => ({
      ...prev,
      field: fieldObj
    }));
  }, [dynamicParams]);

  // Fill form data with selected tool
   useEffect(() => {
     if(isOpen){
      if(selectedTool!=null){
        const tool = {
         phaseId: phaseId || '',
         toolName: selectedTool.toolName,
         toolDescription: selectedTool.toolDescription,
         toolPrompt: selectedTool.toolPrompt || '',
         agentToolName: selectedTool.agentToolName,
         agentToolDescription: selectedTool.agentToolDescription,
         agentInstruction: selectedTool.agentInstruction,
         qa_system_prompt: selectedTool.qa_system_prompt,
         model: selectedTool.model,
         field: selectedTool.field || {}
        }
        
        setFormData(tool);

      // Map object "field" to "dynamicParams" array for UI display
      if (selectedTool.field && typeof selectedTool.field === 'object') {
        const entries = Object.entries(selectedTool.field);
        
        if (entries.length > 0) {
          const loadedParams = entries.map(([key, value], index) => ({
            id: `loaded-${index}-${Date.now()}`,
            key: key,
            description: String(value) || ''
          }));
          setDynamicParams(loadedParams);
        } else {
           setDynamicParams([{ id: 'default-1', key: '', description: '' }]);
        }
      }
    }
     } 
   }, [isOpen, selectedTool, phaseId])
   
  
    // Handle input changes with validation
    const handleChange = (e: any) => {
      const { name, value } = e.target;
      
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      // Clear validation error for this field
      if (validationErrors[name]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    };

    // Form validation
    const validateForm = () => {
      const errors: Record<string, string> = {};

      if (!formData.toolName.trim()) {
        errors.toolName = 'Tool name is required';
      }

      if (!formData.toolDescription.trim()) {
        errors.toolDescription = 'Tool description is required';
      }

      if (!formData.agentInstruction.trim()) {
        errors.agentInstruction = 'Agent instruction is required';
      }

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    };
  
    const handleSubmit = async (e: any) => {
      e.preventDefault();
      
      // Validate form
      if (!validateForm()) {
        setSubmitStatus('error');
        setErrorMessage('Please fill in all required fields');
        return;
      }

      setIsSubmitting(true);
      setSubmitStatus('idle');
      setErrorMessage('');

      try {
        let result;
        
        if(selectedTool != null){
          result = await fetch(`${updateApiUrl}/${selectedTool._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });
        } else {
          result = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });
        }

        if (!result.ok) {
          throw new Error('Failed to save configuration');
        }

        const data = await result.json();
        console.log("API response:", data);
        
        setSubmitStatus('success');
        
        // Close modal after short delay to show success state
        setTimeout(() => {
          setIsOpen(false);
          setSelectedTool(null);
          resetFormData();
          setRefreshTool(refreshTool + 1);
        }, 800);
        
      } catch (error) {
        console.error('Submit error:', error);
        setSubmitStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An error occurred while saving');
      } finally {
        setIsSubmitting(false);
      }
    };
  
    if (!isOpen) return null;
  
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedTool(null);
            resetFormData();
            setIsOpen(false);
          }
        }}
      >
        {/* Modal Container */}
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
          
          {/* Simple Header */}
          <div className="px-6 py-4 border-b border-orange-100 bg-orange-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100/50 rounded-lg">
                  <Settings className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedTool ? 'Edit Tool' : 'Create Tool'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Configure AI tool settings</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedTool(null);
                  resetFormData();
                  setIsOpen(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status Messages */}
            {submitStatus === 'error' && errorMessage && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-red-700">{errorMessage}</p>
                  {Object.keys(validationErrors).length > 0 && (
                    <ul className="mt-1 text-xs text-red-600 list-disc list-inside">
                      {Object.values(validationErrors).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {submitStatus === 'success' && (
              <div className="mt-3 p-2.5 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-green-700">Saved successfully!</p>
              </div>
            )}
          </div>
  
          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <form id="tool-form" onSubmit={handleSubmit} className="p-5 space-y-6">
              
              {/* Section 1: Tool Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-orange-400 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-gray-700">Tool Information</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Tool Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      Tool Name <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="toolName"
                      value={formData.toolName}
                      onChange={handleChange}
                      placeholder="e.g. DataAnalyzer"
                      className={`w-full bg-white border ${validationErrors.toolName ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-orange-300'} text-gray-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${validationErrors.toolName ? 'focus:ring-red-100' : 'focus:ring-orange-100'} transition-all placeholder:text-gray-400`}
                      aria-invalid={!!validationErrors.toolName}
                      aria-describedby={validationErrors.toolName ? 'toolName-error' : undefined}
                    />
                    {validationErrors.toolName && (
                      <p id="toolName-error" className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.toolName}
                      </p>
                    )}
                  </div>

                  {/* Model */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">AI Model</label>
                    <div className="relative">
                      <select
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all cursor-pointer appearance-none"
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                        <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Tool Description - Full Width */}
                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      Tool Description <span className="text-orange-500">*</span>
                    </label>
                    <textarea
                      name="toolDescription"
                      value={formData.toolDescription}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe what this tool does..."
                      className={`w-full bg-white border ${validationErrors.toolDescription ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-orange-300'} text-gray-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${validationErrors.toolDescription ? 'focus:ring-red-100' : 'focus:ring-orange-100'} transition-all placeholder:text-gray-400 resize-none`}
                      aria-invalid={!!validationErrors.toolDescription}
                      aria-describedby={validationErrors.toolDescription ? 'toolDescription-error' : undefined}
                    />
                    {validationErrors.toolDescription && (
                      <p id="toolDescription-error" className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.toolDescription}
                      </p>
                    )}
                  </div>

                  {/* Tool Prompt - Full Width */}
                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center justify-between">
                      <span>Tool Prompt</span>
                      <span className="text-xs text-gray-400 font-normal">Optional</span>
                    </label>
                    <textarea
                      name="toolPrompt"
                      value={formData.toolPrompt}
                      onChange={handleChange}
                      rows={3}
                      placeholder="System prompt for this tool..."
                      className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all placeholder:text-gray-400 resize-none"
                    />
                  </div>
                </div>
              </div>
  
              {/* Simple Divider */}
              <div className="border-t border-gray-100"></div>
  
              {/* Section 2: Agent Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-orange-400 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-gray-700">Agent Configuration</h3>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      Agent Instruction <span className="text-orange-500">*</span>
                    </span>
                    <span className="text-xs text-gray-400">{formData.agentInstruction.length} chars</span>
                  </label>
                  <div className="relative">
                    <textarea
                      name="agentInstruction"
                      value={formData.agentInstruction}
                      onChange={handleChange}
                      rows={16}
                      className={`w-full bg-white border ${validationErrors.agentInstruction ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-orange-300'} text-gray-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${validationErrors.agentInstruction ? 'focus:ring-red-100' : 'focus:ring-orange-100'} transition-all placeholder:text-gray-400 custom-scrollbar resize-none leading-relaxed`}
                      placeholder="You are a helpful AI assistant..."
                      aria-invalid={!!validationErrors.agentInstruction}
                      aria-describedby={validationErrors.agentInstruction ? 'agentInstruction-error' : undefined}
                      style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
                    />
                  </div>
                  {validationErrors.agentInstruction && (
                    <p id="agentInstruction-error" className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.agentInstruction}
                    </p>
                  )}
                </div>
              </div>
  
            </form>
          </div>
  
          {/* Simple Footer */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                resetFormData();
                setSelectedTool(null);
                setIsOpen(false);
              }}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="tool-form"
              disabled={isSubmitting || submitStatus === 'success'}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                submitStatus === 'success' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-orange-400 hover:bg-orange-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : submitStatus === 'success' ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{selectedTool ? 'Update' : 'Create'}</span>
                </>
              )}
            </button>
          </div>
        </div>
  
        {/* Custom scrollbar styles */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #fafafa;
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