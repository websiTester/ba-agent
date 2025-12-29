'use client';

import { useRef, useState } from 'react';
import { 
  File, 
  FileText, 
  Upload,
  Trash2,
  Download,
  Eye,
  Plus,
  PanelRightClose,
  PanelRightOpen,
  FolderOpen,
  X,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { FileItem, ALLOWED_FILE_TYPES, ALLOWED_EXTENSIONS } from '../models/types';
import UploadModal from './UploadModal';

interface FileManagerProps {
  files: FileItem[];
  onUpload: (file: FileItem) => void;
  onDelete: (fileId: string) => void;
  phaseName: string;
  phaseId: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'document':
      return FileText;
    case 'text':
      return FileText;
    default:
      return File;
  }
};

const getFileColor = (type: FileItem['type']) => {
  switch (type) {
    case 'document':
      return 'text-[#3b82f6] bg-[#eff6ff]';
    case 'text':
      return 'text-[#6b7280] bg-[#f3f4f6]';
    default:
      return 'text-[#6b7280] bg-[#f3f4f6]';
  }
};


const isValidFileType = (file: File): boolean => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const validMimeTypes = Object.keys(ALLOWED_FILE_TYPES);
  return validMimeTypes.includes(file.type) || ALLOWED_EXTENSIONS.includes(extension);
};

export default function FileManager({ 
  files, 
  onUpload, 
  onDelete, 
  phaseName,
  phaseId,
  collapsed = false,
  onToggleCollapse
}: FileManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const processFile = async (file: File, customFileName?: string) => {
    if (!isValidFileType(file)) {
      setUploadStatus({
        type: 'error',
        message: `File "${file.name}" không được hỗ trợ. Chỉ chấp nhận file .txt, .docx`
      });
      setTimeout(() => setUploadStatus(null), 4000);
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload file lên server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('phaseId', phaseId);
      if (customFileName) {
        formData.append('fileName', customFileName);
      }

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

      onUpload(fileItem);
      setUploadStatus({
        type: 'success',
        message: `Upload "${result.file.name}" thành công!`
      });
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: `Lỗi khi upload "${file.name}". Vui lòng thử lại.`
      });
      setTimeout(() => setUploadStatus(null), 4000);
      throw error; // Re-throw để Modal có thể xử lý
    } finally {
      setIsUploading(false);
    }
  };

  const handleModalConfirm = async (file: File, fileName: string) => {
    await processFile(file, fileName);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      for (const file of Array.from(selectedFiles)) {
        await processFile(file);
      }
    }
    // Reset input để có thể upload lại cùng file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    console.log("fileId: ", fileName);
    setDeletingFileId(fileId);
    try {
      const response = await fetch(`/api/files?fileId=${fileId}&phaseId=${phaseId}&fileName=${fileName}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(fileId);
      } else {
        setUploadStatus({
          type: 'error',
          message: 'Lỗi khi xóa file. Vui lòng thử lại.'
        });
        setTimeout(() => setUploadStatus(null), 3000);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setUploadStatus({
        type: 'error',
        message: 'Lỗi khi xóa file. Vui lòng thử lại.'
      });
      setTimeout(() => setUploadStatus(null), 3000);
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleDownload = (file: FileItem) => {
    if (file.url) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handlePreview = (file: FileItem) => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  // Collapsed view
  if (collapsed) {
    return (
      <div className="bg-white rounded-xl border border-[#e5e7eb] h-full flex flex-col items-center py-3">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-[#f3f4f6] rounded-lg text-[#6b7280] hover:text-[#f97316] transition-colors mb-3"
          title="Mở rộng File Manager"
        >
          <PanelRightOpen size={20} />
        </button>
        <div className="w-8 h-8 bg-[#fff7ed] rounded-lg flex items-center justify-center mb-2">
          <FolderOpen size={16} className="text-[#f97316]" />
        </div>
        <span className="text-xs font-semibold text-[#f97316]">{files.length}</span>
      </div>
    );
  }

  return (
    <>
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onConfirm={handleModalConfirm}
        phaseId={phaseId}
      />

      <div className="bg-white rounded-xl border border-[#e5e7eb] h-full flex flex-col">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".txt,.doc,.docx,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          onChange={handleFileChange}
        />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 hover:bg-[#f3f4f6] rounded-lg text-[#6b7280] hover:text-[#f97316] transition-colors"
              title="Thu gọn File Manager"
            >
              <PanelRightClose size={18} />
            </button>
          )}
          <div>
            <h3 className="font-semibold text-[#1a1a2e] text-sm">Files & Documents</h3>
            <p className="text-xs text-[#6b7280]">{phaseName}</p>
          </div>
        </div>
        <button
          onClick={handleUploadClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea580c] transition-colors"
        >
          <Plus size={16} />
          <span>Upload</span>
        </button>
      </div>

      {/* Upload Status Toast */}
      {uploadStatus && (
        <div className={`mx-3 mt-3 p-3 rounded-lg flex items-center gap-2 text-sm animate-slide-in ${
          uploadStatus.type === 'success' 
            ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]' 
            : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
        }`}>
          {uploadStatus.type === 'success' 
            ? <CheckCircle size={16} className="text-[#10b981] flex-shrink-0" />
            : <AlertCircle size={16} className="text-[#ef4444] flex-shrink-0" />
          }
          <span className="flex-1">{uploadStatus.message}</span>
          <button 
            onClick={() => setUploadStatus(null)}
            className="p-0.5 hover:bg-black/10 rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-3">
        {files.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center h-full text-center py-8 border-2 border-dashed border-[#e5e7eb] rounded-xl cursor-pointer hover:border-[#f97316] hover:bg-[#fff7ed] transition-all"
            onClick={handleUploadClick}
          >
            <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mb-3">
              <Upload size={24} className="text-[#9ca3af]" />
            </div>
            <p className="text-sm text-[#6b7280] mb-1">Click để chọn file</p>
            <p className="text-xs text-[#9ca3af]">Chấp nhận .txt, .docx</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Upload hint */}
            <div 
              className="p-2 border border-dashed border-[#e5e7eb] rounded-lg text-center cursor-pointer hover:border-[#f97316] hover:bg-[#fff7ed] transition-all mb-3"
              onClick={handleUploadClick}
            >
              <p className="text-xs text-[#9ca3af]">
                <span className="text-[#f97316] font-medium">Click</span> để upload thêm file
              </p>
            </div>

            {files.map((file) => {
              const Icon = getFileIcon(file.type);
              const colorClass = getFileColor(file.type);
              
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-[#fafbfc] rounded-lg hover:bg-[#f3f4f6] transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a2e] truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-[#6b7280]">
                      {file.size} • {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.url && (
                      <>
                        <button 
                          onClick={() => handlePreview(file)}
                          className="p-1.5 hover:bg-[#e5e7eb] rounded-lg text-[#6b7280] hover:text-[#1a1a2e] transition-colors"
                          title="Xem file"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleDownload(file)}
                          className="p-1.5 hover:bg-[#e5e7eb] rounded-lg text-[#6b7280] hover:text-[#1a1a2e] transition-colors"
                          title="Tải xuống"
                        >
                          <Download size={16} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleDelete(file.id, file.name)}
                      disabled={deletingFileId === file.id}
                      className="p-1.5 hover:bg-[#fee2e2] rounded-lg text-[#6b7280] hover:text-[#ef4444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={deletingFileId === file.id ? "Đang xóa..." : "Xóa file"}
                    >
                      {deletingFileId === file.id ? (
                        <Loader2 size={16} className="animate-spin text-[#ef4444]" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-3 border-t border-[#e5e7eb] bg-[#fafbfc]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6b7280]">Total files: <span className="font-medium text-[#1a1a2e]">{files.length}</span></span>
          <span className="text-[#9ca3af]">.txt, .docx</span>
        </div>
      </div>
    </div>
    </>
  );
}
