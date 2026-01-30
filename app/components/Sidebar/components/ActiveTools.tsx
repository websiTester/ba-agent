/**
 * ActiveTools Component
 * Hiển thị grid các tools có thể chọn
 */

import { Wrench, Loader2 } from 'lucide-react';
import { Tool } from '@/app/models/tool';
import { SelectedToolItem } from '../types';

interface ActiveToolsProps {
  collapsed: boolean;
  isLoadingTools: boolean;
  tools: Tool[];
  selectedToolsItem: SelectedToolItem[];
  onToggleTool: (label: string, toolPrompt: string) => void;
  onOpenToolList: () => void;
}

export default function ActiveTools({ 
  collapsed, 
  isLoadingTools, 
  tools, 
  selectedToolsItem,
  onToggleTool,
  onOpenToolList 
}: ActiveToolsProps) {
  if (collapsed) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wrench size={14} className="text-[#f97316]" />
          <span className="text-xs font-bold text-[#1f2937]">Active Tools</span>
        </div>
        <button 
          onClick={onOpenToolList}
          className="text-xs text-[#f97316] hover:text-[#ea580c] font-semibold transition-colors"
        >
          Settings
        </button>
      </div>

      {isLoadingTools ? (
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 size={20} className="animate-spin text-[#f97316] mb-2" />
          <p className="text-[10px] text-[#6b7280]">Loading tools...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => {
            const isSelected = selectedToolsItem.some(item => item.label === tool.label);
            return (
              <button
                key={tool.label}
                onClick={() => onToggleTool(tool.label, tool.toolPrompt)}
                className={`
                  relative px-2 py-3 rounded-xl border-2 transition-all duration-200 text-center min-h-[60px] flex items-center justify-center
                  ${isSelected
                    ? 'bg-[#dcfce7] border-[#22c55e] shadow-sm'
                    : 'bg-white border-[#e5e7eb] hover:border-[#d1d5db] hover:shadow-sm'
                  }
                `}
              >
                <p className="text-[10px] font-semibold text-[#1f2937] leading-tight break-words w-full px-0.5">
                  {tool.label.replace(/_/g, ' ')}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
