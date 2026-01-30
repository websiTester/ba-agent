'use client'
import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppState } from "@/app/store";


// --- 1. COMPONENT MENU 3 CHẤM (KEBAB MENU) ---
export const ActionMenuRenderer = (params: any) => {
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
    const setSelectedActionItem = useAppState(state => state.setSelectedActionItem);
  
    // Always render the button, even if data is not complete
    const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Lấy toạ độ nút bấm ngay lập tức
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 5, // Hiển thị ngay dưới nút
        left: rect.left, // Dịch sang trái để không bị tràn màn hình
      });
    };
  
    const handleAction = (action: string) => {
      setMenuPos(null); // Đóng menu
      console.log('Trigger action:', action, 'on row:', params.data);

      // Lưu item được chọn vào AppState
      setSelectedActionItem({
        action: action,
        rowData: params.data
      });

      // Gọi hàm từ context truyền vào
      //Context này được set trong CsvTable component và tự động truyền xuống đây
      if (params.context && params.context.onTriggerAction) {
        params.context.onTriggerAction(action, params.data);
      }
    };
  
    return (
      <div className="flex justify-center items-center h-full">
        {/* 1. NÚT 3 CHẤM */}
        <button
          onClick={handleOpen}
          className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12a.75.75 0 110-1.5.75.75 0 010 1.5zM12 17.25a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </button>
  
        {/* 2. PORTAL MENU (Chỉ render khi menuPos có dữ liệu) */}
        {menuPos && typeof document !== 'undefined' && createPortal(
          <>
            {/* A. BACKDROP VÔ HÌNH: Click vào đây để đóng menu */}
            <div 
              className="fixed inset-0 z-[9998]" 
              onClick={() => setMenuPos(null)} 
            />
            
            {/* B. MENU CHÍNH */}
            <div
              className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-xl w-40 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <div className="py-1">
                <button onClick={() => handleAction('diagram')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2">
                  <span className="text-xs">📊</span> Diagram
                </button>
                <button onClick={() => handleAction('frs')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-2">
                  <span className="text-xs">📄</span> FSD
                </button>

                {params.data?.HasUI=="true" && (
                  <button onClick={() => handleAction('uiux')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 flex items-center gap-2">
                  <span className="text-xs">🎨</span> Đặc tả UI
                </button>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    );
  };