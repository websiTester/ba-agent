/**
 * FileUpload Component
 * Upload section với drag & drop và file preview
 */

import { UploadCloud, X, FileIcon } from 'lucide-react';
import { ChangeEvent, useRef } from 'react';
import { formatFileSize } from '@/app/utils/formatFileSize';
import { readFileContent } from '@/app/utils/readFileContent';

interface FileUploadProps {
  collapsed: boolean;
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  setFileContent: (content: string) => void;
}

export default function FileUpload({ 
  collapsed, 
  uploadedFiles, 
  setUploadedFiles,
  setFileContent 
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (collapsed) return null;

  // Xử lý khi click nút Upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Xử lý khi file thay đổi
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      setUploadedFiles(fileList);
      await updateFileContent(fileList);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update file content
  async function updateFileContent(fileList: File[]) {
    let content = '';
    for (const file of fileList) {
      const fileText = await readFileContent(file);
      content += `Nội dung file ${file.name}: 
       \n\n ${fileText} 
       \n\n`;
    }
    setFileContent(content);
  }

  // Remove file
  const removeFile = (indexToRemove: number) => {
    const newList = uploadedFiles.filter((_, index) => index !== indexToRemove);
    setUploadedFiles(newList);
    updateFileContent(newList);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <UploadCloud size={14} className="text-[#f97316]" />
        <span className="text-xs font-bold text-[#1f2937]">Upload for Analysis</span>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept=".txt,.doc,.docx,.pdf,.md"
      />

      <div 
        onClick={handleUploadClick}
        className="border-2 border-dashed border-[#e5e7eb] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#f97316] hover:bg-[#fff7ed] transition-all duration-200 group"
      >
        <UploadCloud size={22} className="text-[#f97316] mb-1.5 group-hover:scale-110 transition-transform" />
        <p className="text-xs text-[#1f2937] font-semibold">New Document</p>
        <p className="text-[10px] text-[#9ca3af]">Drag & drop or browse</p>
      </div>

      {/* FILE PREVIEW SECTION */}
      {uploadedFiles.length > 0 && (
        <div className="mt-2 space-y-1">
          {uploadedFiles.map((file: any, index: number) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-1.5 p-1.5 bg-white border border-[#e5e7eb] rounded-md hover:border-[#d1d5db] transition-all"
            >
              <div className="flex-shrink-0 w-6 h-6 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                <FileIcon size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-[#1f2937] truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[8px] text-[#6b7280]">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                title="Remove file"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
