/**
 * PhaseSelector Component
 * Hiển thị các phase buttons để user chọn
 */

import { PhaseId } from '@/app/models/types';
import { phases } from '../constants';

interface PhaseSelectorProps {
  activePhase: PhaseId;
  onPhaseChange: (phase: PhaseId) => void;
  collapsed: boolean;
  disabled?: boolean;
}

export default function PhaseSelector({ activePhase, onPhaseChange, collapsed, disabled = false }: PhaseSelectorProps) {
  if (collapsed) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">
          PROJECT PHASE
        </span>
        {disabled && (
          <span className="text-[9px] text-orange-500 font-medium">
            Loading...
          </span>
        )}
      </div>
      <div className="space-y-1">
        {phases.map((phase) => {
          const Icon = phase.icon;
          const isActive = activePhase === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => !disabled && onPhaseChange(phase.id)}
              disabled={disabled}
              className={`
                w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200
                ${disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
                }
                ${isActive 
                  ? 'bg-[#fff7ed] text-[#f97316] border-l-3 border-[#f97316] shadow-sm' 
                  : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#1f2937]'
                }
              `}
            >
              <Icon size={16} className={`flex-shrink-0 ${isActive ? 'text-[#f97316]' : 'text-[#9ca3af]'}`} />
              <span className="text-xs font-semibold whitespace-nowrap">{phase.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
