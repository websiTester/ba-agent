// AILoadingCard.tsx
import React from 'react';
import { BrainCircuit, Sparkles, Loader2 } from 'lucide-react';

export default function AILoadingCard() {
  return (
    <div className="relative group">
      {/* Outer Glow Effect (Hiệu ứng tỏa sáng nhẹ ra xung quanh card) */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-300 to-amber-300 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
      
      <div className="relative p-8 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-sm w-80 text-center flex flex-col items-center gap-5">
        
        {/* Icon Container with Rings */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Outer Ring Spinning */}
          <div className="absolute inset-0 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
          
          {/* Inner Ring Reverse Spinning */}
          <div className="absolute inset-2 border-2 border-amber-50 border-b-amber-400 rounded-full animate-spin-reverse"></div>
          
          {/* Central Icon */}
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-full p-3 shadow-sm z-10">
            <BrainCircuit className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          
          
          {/* Status Message that feels alive */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
             <span className="animate-pulse">Đang phân tích yêu cầu...</span>
          </div>
        </div>

      </div>
    </div>
  );
}