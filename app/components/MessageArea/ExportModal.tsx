'use client'
import { useState } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle, AlignmentType, TextRun } from 'docx';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTools: string[];
  responses: any[]; // Thêm responses array để lấy data
  onExport: (selectedTool: string) => void;
}

/**
 * Export data to CSV format
 * Converts array of objects to CSV string and triggers download
 */
const exportToCSV = (data: any[], fileName: string) => {
  // 1. Lấy tất cả keys từ object đầu tiên để làm header
  // Filter out các field internal (bắt đầu bằng '_' như _action, _id, etc.)
  const allKeys = Object.keys(data[0]);
  const headers = allKeys.filter(key => !key.startsWith('_'));
  
  // 2. Tạo header row
  const headerRow = headers.join(',');
  
  // 3. Tạo data rows
  const dataRows = data.map((row: any) => {
    return headers.map(header => {
      const value = row[header] || '';
      // Escape giá trị nếu chứa dấu phẩy, dấu ngoặc kép, hoặc xuống dòng
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        // Escape dấu ngoặc kép bằng cách double nó
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });
  
  // 4. Kết hợp header và data rows
  const csvData = [headerRow, ...dataRows].join('\n');

  // Tạo Blob object từ CSV string với UTF-8 BOM để Excel hiển thị đúng tiếng Việt
  const BOM = '\uFEFF'; // UTF-8 BOM (Byte Order Mark)
  const blob = new Blob([BOM + csvData], { 
    type: 'text/csv;charset=utf-8;' 
  });

  // Tạo URL tạm thời cho blob
  const url = window.URL.createObjectURL(blob);

  // Tạo element <a> ẩn để trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;

  // Thêm link vào DOM, click, rồi xóa
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Giải phóng URL object để tránh memory leak
  window.URL.revokeObjectURL(url);
};

/**
 * Export usecase specification to Word format
 * Creates a formatted Word document with tables matching UseCaseTable layout
 * Dynamic rendering - loops through all properties except 'id' and 'name'
 */
const exportUseCaseToWord = async (data: any, fileName: string) => {
  // Helper function to format property name (camelCase to Title Case with spaces)
  const formatPropertyName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Helper function to check if value is an array of objects
  const isArrayOfObjects = (value: any): boolean => {
    return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null;
  };

  // Helper function to get object keys from first item in array
  const getObjectKeys = (arr: any[]): string[] => {
    if (arr.length === 0) return [];
    return Object.keys(arr[0]);
  };

  // Helper function to get cell value as string
  const getCellValueString = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object' && !Array.isArray(value)) {
      return JSON.stringify(value, null, 2);
    }
    if (Array.isArray(value) && !isArrayOfObjects(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  // Helper function to create a row with label and content
  const createRow = (label: string, content: string, isItalic: boolean = true) => {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: label, bold: true })],
          })],
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: 'F9FAFB' },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: content, italics: isItalic })],
          })],
          width: { size: 80, type: WidthType.PERCENTAGE },
        }),
      ],
    });
  };

  // Helper function to create dynamic nested table for array of objects
  const createDynamicNestedTable = (items: any[]) => {
    if (!items || items.length === 0) {
      return new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: 'Empty', italics: true })],
                })],
              }),
            ],
          }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });
    }

    const headers = getObjectKeys(items);
    
    const rows = [
      // Header row with dynamic columns
      new TableRow({
        children: headers.map(header => 
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: formatPropertyName(header), bold: true })],
            })],
            shading: { fill: 'F3F4F6' },
          })
        ),
      }),
      // Data rows
      ...items.map((item: any, index: number) => 
        new TableRow({
          children: headers.map(header => 
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: getCellValueString(item[header]) })],
              })],
              shading: { fill: index % 2 === 0 ? 'FFFFFF' : 'F9FAFB' },
            })
          ),
        })
      ),
    ];

    return new Table({
      rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      },
    });
  };

  // Helper to create row with nested table
  const createRowWithTable = (label: string, table: Table) => {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: label, bold: true })],
          })],
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: 'F9FAFB' },
          verticalAlign: 'top' as any,
        }),
        new TableCell({
          children: [table],
          width: { size: 80, type: WidthType.PERCENTAGE },
        }),
      ],
    });
  };

  // Get all keys except 'id' and 'name'
  const propertyKeys = Object.keys(data).filter(key => key !== 'id' && key !== 'name');

  // Create main table rows dynamically
  const mainTableRows: TableRow[] = [
    // Header row with ID and Name
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: data.id || 'N/A', bold: true })],
          })],
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: 'F9FAFB' },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: data.name || 'Untitled', bold: true })],
          })],
          width: { size: 80, type: WidthType.PERCENTAGE },
          shading: { fill: 'F9FAFB' },
        }),
      ],
    }),
  ];

  // Loop through all properties and create rows dynamically
  propertyKeys.forEach(key => {
    const value = data[key];
    
    // Skip if value is null/undefined
    if (value === null || value === undefined) return;

    const label = formatPropertyName(key);

    if (isArrayOfObjects(value)) {
      // Create row with nested table for array of objects
      mainTableRows.push(createRowWithTable(label, createDynamicNestedTable(value)));
    } else {
      // Create simple row for primitive values or simple arrays
      mainTableRows.push(createRow(label, getCellValueString(value)));
    }
  });

  // Create main table
  const mainTable = new Table({
    rows: mainTableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
    },
  });

  // Create document
  const doc = new Document({
    sections: [{
      children: [mainTable],
    }],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default function ExportModal({ isOpen, onClose, availableTools, responses, onExport }: ExportModalProps) {
  const [selectedTool, setSelectedTool] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportedFileName, setExportedFileName] = useState('');

  if (!isOpen) return null;

  /**
   * Hàm xử lý export khi người dùng click button Export
   * Tự động phát hiện loại data và export theo format phù hợp:
   * - usecase_specification: Export to Word (.docx)
   * - Other types: Export to CSV (.csv)
   */
  const handleExport = async () => {
    if (!selectedTool) return;

    try {
      // Tìm response data của tool được chọn
      const selectedResponse = responses.find(
        (r: any) => r.agent_source === selectedTool
      );

      if (!selectedResponse || !selectedResponse.data) {
        alert('Không tìm thấy dữ liệu để export');
        return;
      }

      // Generate timestamp for filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      
      // Check if this is usecase specification
      if (selectedTool === 'usecase_specification') {
        // Export to Word
        const fileName = `${selectedTool}_${timestamp}.docx`;
        await exportUseCaseToWord(selectedResponse.data, fileName);
        setExportedFileName(fileName);
      } else {
        // Export to CSV
        // Kiểm tra data có phải là array không
        if (!Array.isArray(selectedResponse.data) || selectedResponse.data.length === 0) {
          alert('Dữ liệu không hợp lệ hoặc rỗng');
          return;
        }

        const fileName = `${selectedTool}_${timestamp}.csv`;
        exportToCSV(selectedResponse.data, fileName);
        setExportedFileName(fileName);
      }

      // Gọi callback onExport để parent component biết
      onExport(selectedTool);

      // Hiển thị success message
      setExportSuccess(true);

      // Tự động đóng modal sau 2 giây
      setTimeout(() => {
        setExportSuccess(false);
        setExportedFileName('');
        setSelectedTool('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      alert('Có lỗi xảy ra khi export file. Vui lòng thử lại.');
    }
  };

  return (
    // Overlay backdrop - che phủ toàn màn hình với nền đen mờ
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal container - card trắng bo tròn với shadow */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Tiêu đề và nút đóng */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg">
              <Download size={18} className="text-orange-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">Export Results</h2>
          </div>
          {/* Nút đóng modal */}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors group"
            aria-label="Close modal"
          >
            <X size={18} className="text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Content - Phần chọn tool để export */}
        <div className="px-6 py-5 space-y-4">
          {/* Success Message */}
          {exportSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800">Export thành công!</p>
                  <p className="text-xs text-green-700 mt-1 break-all">{exportedFileName}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Tool to Export
            </label>
            {/* Dropdown select với icon */}
            <div className="relative">
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                disabled={exportSuccess}
                className="w-full appearance-none bg-white border border-orange-200/50 text-gray-700 text-sm rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 transition-all cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-orange-300/70"
              >
                <option value="">Select a tool to export</option>
                {/* Map qua danh sách tools và format tên (thay _ thành space) */}
                {availableTools.map((tool) => (
                  <option key={tool} value={tool}>
                    {tool.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {/* Icon hiển thị bên trong select */}
              <FileText className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
            </div>
          </div>

          {/* Confirmation box - Hiển thị tool đã chọn */}
          {selectedTool && !exportSuccess && (
            <div className="p-3 bg-gradient-to-r from-orange-50/50 to-orange-50/30 border border-orange-200/60 rounded-xl">
              <p className="text-xs text-gray-700">
                <span className="font-semibold">Selected:</span> {selectedTool.replace(/_/g, ' ')}
                <span className="ml-2 text-orange-600">
                  ({selectedTool === 'usecase_specification' ? '.docx' : '.csv'})
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Footer - Các nút action */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-orange-100/50 bg-gradient-to-b from-white to-orange-50/20">
          {/* Nút Cancel - màu xám */}
          <button
            onClick={onClose}
            disabled={exportSuccess}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          {/* Nút Export - màu cam gradient, disable nếu chưa chọn tool */}
          <button
            onClick={handleExport}
            disabled={!selectedTool || exportSuccess}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg hover:from-orange-500 hover:to-orange-600 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow"
          >
            <Download size={16} />
            {selectedTool === 'usecase_specification' ? 'Export to Word' : 'Export to CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
