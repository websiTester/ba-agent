'use client'
import { useState } from 'react';
import { X, Sparkles, Wrench } from 'lucide-react';

interface RefineModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTools: string[];
  onRefine: (userInput: string, selectedTools: string[]) => void;
  handleAIResponse: any;
}

export default function RefineModal({ handleAIResponse, isOpen, onClose, availableTools, onRefine }: RefineModalProps) {
  const [userInput, setUserInput] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleToolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedTools.includes(value)) {
      setSelectedTools([...selectedTools, value]);
    }
  };

  const removeTool = (tool: string) => {
    setSelectedTools(selectedTools.filter(t => t !== tool));
  };

  const handleRefine = () => {
    onRefine(userInput, selectedTools);
    setUserInput('');
    setSelectedTools([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg">
              <Sparkles size={18} className="text-orange-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">Refine Results</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors group"
            aria-label="Close"
          >
            <X size={18} className="text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* User Input Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Refinement Instructions
            </label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full h-28 px-3.5 py-3 text-sm text-gray-700 bg-orange-50/30 border border-orange-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 focus:bg-white resize-none placeholder:text-gray-400 transition-all"
              placeholder="Add more details about security requirements, focus on performance metrics..."
            />
          </div>

          {/* Tool Selection Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Tools
            </label>
            <div className="relative">
              <select
                onChange={handleToolChange}
                value=""
                className="w-full appearance-none bg-white border border-orange-200/50 text-gray-700 text-sm rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 transition-all cursor-pointer hover:border-orange-300/70"
              >
                <option value="">Select a tool to add</option>
                {availableTools
                  .filter(tool => !selectedTools.includes(tool))
                  .map((tool) => (
                    <option key={tool} value={tool}>
                      {tool.replace(/_/g, ' ')}
                    </option>
                  ))}
              </select>
              <Wrench className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
            </div>

            {/* Selected Tools Display */}
            {selectedTools.length > 0 && (
              <div className="mt-3 pt-3 border-t border-orange-100/50">
                <div className="flex flex-wrap gap-2">
                  {selectedTools.map((tool) => (
                    <div
                      key={tool}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200/60 rounded-lg text-xs font-medium text-gray-700 group hover:border-orange-300/70 transition-all"
                    >
                      <span>{tool.replace(/_/g, ' ')}</span>
                      <button
                        onClick={() => removeTool(tool)}
                        className="p-0.5 hover:bg-orange-200/50 rounded transition-colors"
                        aria-label={`Remove ${tool}`}
                      >
                        <X size={13} className="text-orange-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-orange-100/50 bg-gradient-to-b from-white to-orange-50/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRefine}
            disabled={!userInput.trim() || selectedTools.length === 0}
            className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg hover:from-orange-500 hover:to-orange-600 transition-all shadow-sm hover:shadow disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Refine Results
          </button>
        </div>
      </div>
    </div>
  );
}
