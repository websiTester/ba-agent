/**
 * KnowledgeBase Component
 * Hiển thị danh sách files trong knowledge base từ database
 * Cho phép upload và delete files
 */

import { FileText, Loader2, Trash2, Plus } from 'lucide-react';
import { FileItem } from '@/app/models/types';
import { useState } from 'react';
import UploadModal from '@/app/components/UploadModal';

interface KnowledgeBaseProps {
  collapsed: boolean;
  files: FileItem[];
  isLoading?: boolean;
  phaseId: string;
  onFileUpload: (file: FileItem) => void;
  onFileDelete: (fileId: string) => void;
}

export default function KnowledgeBase({ 
  collapsed, 
  files,
  isLoading = false,
  phaseId,
  onFileUpload,
  onFileDelete,
}: KnowledgeBaseProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  if (collapsed) return null;

  // Helper để xác định màu icon dựa trên file type
  const getFileIconColor = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'bg-red-50 text-red-600 group-hover:bg-red-100';
      case 'doc':
      case 'docx':
        return 'bg-blue-50 text-blue-600 group-hover:bg-blue-100';
      case 'txt':
      case 'md':
        return 'bg-gray-50 text-gray-600 group-hover:bg-gray-100';
      default:
        return 'bg-orange-50 text-orange-600 group-hover:bg-orange-100';
    }
  };

  /**
   * Xử lý upload file từ modal
   */
  const handleModalConfirm = async (file: File, fileName: string) => {
    try {
      // Upload file lên server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('phaseId', phaseId);
      formData.append('fileName', fileName);

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Tạo FileItem với URL blob để preview/download
      const fileItem: FileItem = {
        id: result.file.id,
        name: result.file.name,
        type: result.file.type,
        size: result.file.size,
        uploadedAt: new Date(result.file.uploadedAt),
        file: file,
        url: URL.createObjectURL(file),
      };

      onFileUpload(fileItem);
    } catch (error) {
      console.error('Upload error:', error);
      throw error; // Re-throw để Modal có thể xử lý
    }
  };

  /**
   * Xử lý delete file
   */
  const handleDelete = async (fileId: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering file click
    
    setDeletingFileId(fileId);
    try {
      const response = await fetch(`/api/files?fileId=${fileId}&phaseId=${phaseId}&fileName=${fileName}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onFileDelete(fileId);
      } else {
        console.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <>
      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onConfirm={handleModalConfirm}
        phaseId={phaseId}
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-[#f97316]" />
            <span className="text-xs font-bold text-[#1f2937]">Knowledge Base</span>
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="w-5 h-5 flex items-center justify-center text-[#f97316] hover:bg-[#fff7ed] rounded transition-colors"
            title="Add file to knowledge base"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 size={16} className="animate-spin text-[#f97316] mb-1" />
            <p className="text-[10px] text-[#6b7280]">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          /* Empty State */
          <div className="text-center py-4 px-2">
            <FileText size={20} className="mx-auto text-gray-300 mb-1" />
            <p className="text-[10px] text-[#9ca3af]">No files in knowledge base</p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-2 text-[10px] text-[#f97316] hover:text-[#ea580c] font-medium transition-colors"
            >
              Click to add files
            </button>
          </div>
        ) : (
          /* Files List */
          <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
            {files.map((file) => (
              <div 
                key={file.id}
                className="flex items-center gap-2 p-1.5 bg-white border border-[#e5e7eb] rounded-md hover:border-[#f97316] hover:bg-[#fff7ed] transition-all cursor-pointer group"
                title={`${file.name} (${file.size})`}
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center transition-colors ${getFileIconColor(file.name)}`}>
                  <FileText size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#1f2937] truncate">
                    {file.name}
                  </p>
                  <p className="text-[9px] text-[#6b7280]">
                    {file.size}
                  </p>
                </div>
                {/* Delete Button - visible on hover */}
                <button
                  onClick={(e) => handleDelete(file.id, file.name, e)}
                  disabled={deletingFileId === file.id}
                  className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title={deletingFileId === file.id ? "Deleting..." : "Delete file"}
                >
                  {deletingFileId === file.id ? (
                    <Loader2 size={12} className="animate-spin text-red-500" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
