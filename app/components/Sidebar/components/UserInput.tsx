/**
 * UserInput Component
 * Textarea để user nhập message/instruction
 */

import { FileText } from 'lucide-react';

interface UserInputProps {
  collapsed: boolean;
  userMessage: string;
  setUserMessage: (message: string) => void;
}

export default function UserInput({ collapsed, userMessage, setUserMessage }: UserInputProps) {
  if (collapsed) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <FileText size={14} className="text-[#f97316]" />
        <span className="text-xs font-bold text-[#1f2937]">User Input</span>
      </div>
      <textarea
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        className="w-full h-24 p-2.5 text-xs text-[#6b7280] bg-[#f9fafb] border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] resize-none placeholder:text-[#9ca3af] transition-all"
        placeholder="E.g., Focus on security requirements..."
      />
    </div>
  );
}
