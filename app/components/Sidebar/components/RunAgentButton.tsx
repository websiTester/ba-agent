/**
 * RunAgentButton Component
 * Button để trigger agent processing
 */

import { Send, Loader2 } from 'lucide-react';

interface RunAgentButtonProps {
  collapsed: boolean;
  isAgentProcessing: boolean;
  onProcessRequest: () => void;
}

export default function RunAgentButton({ 
  collapsed, 
  isAgentProcessing, 
  onProcessRequest 
}: RunAgentButtonProps) {
  if (collapsed) return null;

  return (
    <button 
      onClick={onProcessRequest}
      disabled={isAgentProcessing}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#fb923c] to-[#f97316] text-white rounded-lg hover:from-[#f97316] hover:to-[#ea580c] transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none font-semibold"
    >
      {isAgentProcessing ? (
        <>
          <Loader2 size={18} className='animate-spin' />
          <span className="text-xs">Processing...</span>
        </>
      ) : (
        <>
          <Send size={18} />
          <span className="text-xs">Run Discovery Agent</span>
        </>
      )}
    </button>
  );
}
