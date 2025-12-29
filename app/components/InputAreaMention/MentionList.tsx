// components/tiptap-ui/MentionList.tsx
import { BookOpenText, Hammer, Loader2 } from 'lucide-react'
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export const MentionList = forwardRef((props: any, ref) => {

  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ 
        id: item.id, 
        label: item.label,
      });
      // 2. GỌI HÀM CẬP NHẬT STATE CỦA BẠN (MỚI)
      if (props.setCurrentMention && item.type === 'tool') {
        props.setCurrentMention(item)
      }
      if (props.setCurrentMentionDoc && item.type === 'file') {
        props.setCurrentMentionDoc(item)
      }
    };

  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))
  console.log("MentionList: "+ props.isLoadingMentionRef.current);

  return (
    // CONTAINER: Nền trắng, bo góc lớn, bóng đổ mềm
    <div className="bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden min-w-[280px] p-1.5 flex flex-col gap-0.5 animation-in fade-in zoom-in-95 duration-100">
      
      {/* HEADER: Tiêu đề nhỏ (Optional) */}
      <div className="px-2 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        Suggested Tools
      </div>

      {props.isLoadingMentionRef.current ? (
        <div className="px-4 py-3 text-gray-400 text-sm italic">
            <Loader2 size={16} className="animate-spin"/>
            <span>Loading Tools...</span>
        </div>
      ) :
      props.items.length ? (
        props.items.map((item: any, index: number) => {
          const isSelected = index === selectedIndex
          return (
            <button
              key={index}
              onClick={() => selectItem(index)}
              className={`
                group flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                ${isSelected 
                  ? 'bg-orange-50 text-orange-700' // ACTIVE: Nền cam nhạt, chữ cam đậm
                  : 'text-gray-600 hover:bg-gray-50' // NORMAL: Chữ xám
                }
              `}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {/* ICON / BADGE */}
                <span className={`
                  flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold border shadow-sm shrink-0
                  bg-blue-50 text-blue-600 border-blue-100
                `}>
                  {item.type === 'tool' ? 
                  <Hammer size={16} /> : 
                  <BookOpenText size={16} />}
                </span>
                
                {/* TEXT LABEL */}
                <span className={`truncate font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                  {item.label}
                </span>
              </div>

              {/* Enter Hint (Chỉ hiện khi select) */}
              {isSelected && (
                <span className="text-[10px] text-orange-400 opacity-60 font-medium px-1">
                  ⏎
                </span>
              )}
            </button>
          )
        })
      ) : (
        <div className="px-4 py-3 text-center text-gray-400 text-sm italic">
          Không tìm thấy tool phù hợp
        </div>
        
      )}
    </div>
  )
})