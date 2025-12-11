'use client'
import { AttachedRecord } from "@/app/models/types";
import { formatFileSize } from "@/app/utils/formatFileSize";
import { Loader2, Video, Music, X } from "lucide-react";

interface AttackRecordPreviewProps {
    attachedRecord: AttachedRecord;
    setAttachedRecord: any;
}

export default function AttackRecordPreview({
    attachedRecord, 
    setAttachedRecord}: AttackRecordPreviewProps) {

    const handleRemoveRecord = () => {
        setAttachedRecord(null);
        };
    
    return (
        <div className="mb-3">
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                attachedRecord.error 
                  ? 'bg-[#fef2f2] border-[#fecaca]' 
                  : attachedRecord.isTranscribing
                    ? 'bg-[#fff7ed] border-[#fed7aa]'
                    : attachedRecord.transcription
                      ? 'bg-[#ecfdf5] border-[#a7f3d0]'
                      : 'bg-[#eff6ff] border-[#bfdbfe]'
              }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  attachedRecord.error 
                    ? 'bg-[#fee2e2] text-[#ef4444]'
                    : attachedRecord.isTranscribing
                      ? 'bg-[#ffedd5] text-[#f97316]'
                      : attachedRecord.transcription
                        ? 'bg-[#d1fae5] text-[#10b981]'
                        : 'bg-[#dbeafe] text-[#3b82f6]'
                }`}>
                  {attachedRecord.isTranscribing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : attachedRecord.name.endsWith('.mp4') ? (
                    <Video size={18} />
                  ) : (
                    <Music size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a2e] truncate">{attachedRecord.name}</p>
                  <p className="text-xs text-[#6b7280]">
                    {attachedRecord.error 
                      ? <span className="text-[#ef4444]">{attachedRecord.error}</span>
                      : attachedRecord.isTranscribing
                        ? <span className="text-[#f97316]">Đang transcribe audio...</span>
                        : attachedRecord.transcription
                          ? <span className="text-[#10b981]">Đã transcribe • {attachedRecord.transcription.length} ký tự</span>
                          : `${attachedRecord.name.endsWith('.mp4') ? 'Video' : 'Audio'} • ${formatFileSize(attachedRecord.size)}`
                    }
                  </p>
                  {/* Show transcription preview */}
                  {attachedRecord.transcription && (
                    <p className="text-xs text-[#6b7280] mt-1 line-clamp-2">
                      {attachedRecord.transcription.substring(0, 100)}
                      {attachedRecord.transcription.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>
                <button 
                  onClick={handleRemoveRecord}
                  disabled={attachedRecord.isTranscribing}
                  className={`p-1.5 rounded-lg transition-colors ${
                    attachedRecord.isTranscribing 
                      ? 'cursor-not-allowed opacity-50' 
                      : 'hover:bg-black/10'
                  }`}
                >
                  <X size={16} className="text-[#6b7280]" />
                </button>
              </div>
            </div>
    );
}