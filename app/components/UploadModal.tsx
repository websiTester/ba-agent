'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { ALLOWED_FILE_TYPES, ALLOWED_EXTENSIONS } from '../models/types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File, fileName: string) => Promise<void>;
  phaseId: string;
}

const isValidFileType = (file: File): boolean => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const validMimeTypes = Object.keys(ALLOWED_FILE_TYPES);
  return validMimeTypes.includes(file.type) || ALLOWED_EXTENSIONS.includes(extension);
};

export default function UploadModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  phaseId 
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setFileName('');
      setError(null);
    }
  }, [isOpen]);

  // Update fileName when file is selected
  useEffect(() => {
    if (selectedFile && !fileName) {
      // Extract name without extension
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setFileName(nameWithoutExt);
    }
  }, [selectedFile, fileName]);

  const handleFileSelect = (file: File) => {
    if (!isValidFileType(file)) {
      setError(`File "${file.name}" không được hỗ trợ. Chỉ chấp nhận file .txt, .docx`);
      setSelectedFile(null);
      setFileName('');
      return;
    }

    setError(null);
    setSelectedFile(file);
    // Extract name without extension
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setFileName(nameWithoutExt);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input để có thể chọn lại cùng file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file để upload');
      return;
    }

    if (!fileName.trim()) {
      setError('Vui lòng nhập tên file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Get file extension
      const extension = selectedFile.name.split('.').pop() || '';
      const finalFileName = `${fileName.trim()}.${extension}`;
      
      // Create a new File object with custom name
      const renamedFile = new File([selectedFile], finalFileName, {
        type: selectedFile.type,
        lastModified: selectedFile.lastModified,
      });

      await onConfirm(renamedFile, finalFileName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi upload file. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="px-6 py-4 border-b border-[#e5e7eb]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1a1a2e]">Upload File</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#f3f4f6] rounded-lg text-[#6b7280] hover:text-[#1a1a2e] transition-colors"
              disabled={isUploading}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* File Name Input */}
          <div>
            <label className="block text-sm font-medium text-[#6b7280] mb-2">
              Tên file
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Nhập tên file..."
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent text-sm text-[#1a1a2e]"
              disabled={isUploading || !selectedFile}
            />
            {selectedFile && (
              <p className="mt-1 text-xs text-[#9ca3af]">
                Định dạng: {selectedFile.name.split('.').pop()?.toUpperCase()}
              </p>
            )}
          </div>
        </div>

        {/* File Upload Section */}
        <div className="flex-1 overflow-y-auto p-6">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.doc,.docx,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
          />

          {selectedFile ? (
            <div className="border border-[#e5e7eb] rounded-lg p-4 bg-[#fafbfc]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#eff6ff] rounded-lg flex items-center justify-center">
                  <FileText size={24} className="text-[#3b82f6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a2e] truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFileName('');
                    setError(null);
                  }}
                  className="p-1.5 hover:bg-[#fee2e2] rounded-lg text-[#6b7280] hover:text-[#ef4444] transition-colors"
                  disabled={isUploading}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all border-[#e5e7eb] hover:border-[#f97316] hover:bg-[#fff7ed]"
              onClick={handleBrowseClick}
            >
              <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload size={24} className="text-[#9ca3af]" />
              </div>
              <p className="text-sm font-medium text-[#6b7280] mb-1">
                Click để chọn file
              </p>
              <p className="text-xs text-[#9ca3af]">Chấp nhận .txt, .docx</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="text-[#ef4444] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#991b1b] flex-1">{error}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#e5e7eb] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1a1a2e] transition-colors"
            disabled={isUploading}
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedFile || !fileName.trim() || isUploading}
            className="px-4 py-2 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea580c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang upload...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Xác nhận</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

