/**
 * RunAgentButton Component
 * Button để trigger agent processing
 */

import { Send, Loader2, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

interface RunAgentButtonProps {
  collapsed: boolean;
  isAgentProcessing: boolean;
  onProcessRequest: () => void;
}

export default function RunAgentButton({ 
  collapsed, 
  isAgentProcessing, 
  onProcessRequest 
}: RunAgentButtonProps) {
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);

  const handleClick = async () => {
    // Kiểm tra API key từ database
    try {
      const response = await fetch('http://127.0.0.1:8000/apikeys/apikey', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!data.api_key) {
          // Không có API key, hiển thị thông báo
          setShowApiKeyWarning(true);
          return;
        }
      }
      
      // Có API key, tiếp tục xử lý
      onProcessRequest();
    } catch (error) {
      console.error('Error checking API key:', error);
      // Hiển thị thông báo lỗi
      setShowApiKeyWarning(true);
    }
  };

  if (collapsed) return null;

  return (
    <>
      <button 
        onClick={handleClick}
        disabled={isAgentProcessing}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#fb923c] to-[#f97316] text-white rounded-lg hover:from-[#f97316] hover:to-[#ea580c] transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none font-semibold"
      >
        {isAgentProcessing ? (
          <>
            <Loader2 size={18} className='animate-spin' />
            <span className="text-xs">Processing...</span>
          </>
        ) : (
          <>
            <Send size={18} />
            <span className="text-xs">Run Discovery Agent</span>
          </>
        )}
      </button>

      {/* API Key Warning Modal */}
      {showApiKeyWarning && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowApiKeyWarning(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg">
                  <AlertCircle size={18} className="text-orange-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">Yêu cầu API Key</h3>
              </div>
              <button 
                onClick={() => setShowApiKeyWarning(false)}
                className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors group"
                aria-label="Close"
              >
                <X size={18} className="text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                Bạn cần thêm API Key trước khi có thể sử dụng tính năng này. 
                Vui lòng mở phần cài đặt và thêm API Key của bạn.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-orange-100/50 bg-gradient-to-b from-white to-orange-50/20">
              <button
                onClick={() => setShowApiKeyWarning(false)}
                className="flex-1 py-2.5 px-4 text-sm font-medium text-white bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 rounded-xl shadow-sm hover:shadow transition-all"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
