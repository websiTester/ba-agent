// AILoadingCard.tsx
import React from 'react';
import { BrainCircuit } from 'lucide-react';

interface AILoadingCardProps {
  message?: string;
}

export default function AILoadingCard({ message = 'Đang phân tích' }: AILoadingCardProps) {
  return (
    <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm">
      {/* Spinner với animation mượt mà */}
      <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
        {/* Outer ring - quay chậm */}
        <div className="absolute inset-0 border-2 border-gray-100 border-t-orange-500 rounded-full animate-spin" 
             style={{ animationDuration: '1s' }}></div>
        
        {/* Icon với pulse tinh tế */}
        <div className="bg-orange-50 rounded-full p-2">
          <BrainCircuit className="w-5 h-5 text-orange-500 animate-pulse" 
                        style={{ animationDuration: '2s' }} />
        </div>
      </div>

      {/* Text content - clean & minimal */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-gray-900">
          {message}
        </p>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" 
               style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></div>
          <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" 
               style={{ animationDelay: '200ms', animationDuration: '1.4s' }}></div>
          <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" 
               style={{ animationDelay: '400ms', animationDuration: '1.4s' }}></div>
        </div>
      </div>
    </div>
  );
}