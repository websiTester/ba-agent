'use client'
import { AttachedFile } from "@/app/models/types";
import { FileText, Loader2, X } from "lucide-react";

interface AttackedFilePreviewProps {
    attachedFile: AttachedFile;
    setAttachedFile: any;
}


export default function AttackedFilePreview({
    attachedFile,
    setAttachedFile
}:AttackedFilePreviewProps) {

    const FileIcon = FileText;

    const handleRemoveFile = () => {
        setAttachedFile(null);
      };


    return (

        <div className="mb-3">
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                attachedFile.error 
                  ? 'bg-[#fef2f2] border-[#fecaca]' 
                  : attachedFile.isProcessing 
                    ? 'bg-[#fff7ed] border-[#fed7aa]'
                    : 'bg-[#ecfdf5] border-[#a7f3d0]'
              }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  attachedFile.error 
                    ? 'bg-[#fee2e2] text-[#ef4444]'
                    : attachedFile.isProcessing
                      ? 'bg-[#ffedd5] text-[#f97316]'
                      : 'bg-[#d1fae5] text-[#10b981]'
                }`}>
                  {attachedFile.isProcessing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <FileIcon size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a2e] truncate">{attachedFile.name}</p>
                  <p className="text-xs text-[#6b7280]">
                    {attachedFile.error 
                      ? <span className="text-[#ef4444]">{attachedFile.error}</span>
                      : attachedFile.isProcessing 
                        ? 'Đang đọc nội dung file...'
                        : `Đã sẵn sàng • ${attachedFile.content?.length} ký tự`
                    }
                  </p>
                </div>
                <button 
                  onClick={handleRemoveFile}
                  className="p-1.5 hover:bg-black/10 rounded-lg transition-colors"
                >
                  <X size={16} className="text-[#6b7280]" />
                </button>
              </div>
            </div>

    );
}