'use client'
import { AlertTriangle, X } from 'lucide-react';

interface DeleteAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

/**
 * DeleteAlert Component
 * 
 * Custom alert dialog để xác nhận xóa item
 * Thay thế cho window.confirm() với UI chuyên nghiệp, gọn gàng
 * 
 * @features
 * - Compact, clean design
 * - Smooth animations
 * - Keyboard support (ESC to close)
 * - Accessible
 */
export default function DeleteAlert({ isOpen, onClose, onConfirm, itemName }: DeleteAlertProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Handle ESC key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-50 animate-in fade-in duration-150"
        onClick={handleCancel}
      />

      {/* Alert Dialog - Compact & Clean */}
      <div 
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in-95 fade-in duration-150"
        onKeyDown={handleKeyDown}
      >
        <div className="bg-white rounded-lg shadow-xl w-[420px] max-w-[90vw] p-5">
          {/* Header - Compact */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-[15px] font-semibold text-gray-900 leading-tight">
                Delete this item?
              </h3>
              <p className="text-[13px] text-gray-500 mt-1 leading-snug">
                This action cannot be undone.
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="flex-shrink-0 -mt-1 -mr-1 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Item Name - Inline & Subtle */}
          {itemName && (
            <div className="mb-4 px-3 py-2 bg-gray-50 rounded text-[13px] text-gray-600">
              <span className="font-medium">Item:</span> {itemName}
            </div>
          )}

          {/* Actions - Compact */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-1.5 text-[13px] font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
