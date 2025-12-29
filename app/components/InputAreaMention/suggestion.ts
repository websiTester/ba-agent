import React from 'react'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { MentionList } from './MentionList'
import { MentionDB } from '@/app/models/mentionDB'


// const tools: Mention[] = [
//   { id: '1', label: 'Analyze-UI/UX', description: 'Tool to analyze UI/UX of the project' , type: 'tool'},
//   { id: '2',label: 'Analyze-FSD', description: 'Tool to analyze FSD of the project' , type: 'tool'},
//   { id: '3',label: 'Analyze-Data-Model', description: 'Tool to analyze Data Model of the project' , type: 'tool'},
// ]


// THAY ĐỔI Ở ĐÂY: Export một hàm thay vì object
// Hàm này nhận vào 'setMentionOpen' để báo tin cho thằng cha


export const createSuggestion = (
  setMentionOpen: (isOpen: boolean) => void,
  setCurrentMention: (mention: any) => void,
  setCurrentMentionDoc: (mentionDoc: any) => void,
  isLoadingMentionRef: React.RefObject<boolean>,
  mentionsRef: React.RefObject<MentionDB[]>

) => ({
  items: ({ query }: { query: string }) => {
    // Sử dụng .current để lấy data mới nhất từ ref
    return mentionsRef.current?.filter(item => item.label.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5) || []
  },

  render: () => {
    let component: any
    let popup: any

    return {
      onStart: (props: any) => {
        // --- BÁO CÁO: MENU ĐANG MỞ ---
        setMentionOpen(true) 
        
        component = new ReactRenderer(MentionList, {
          props: { 
            ...props, 
            isLoadingMentionRef,
            setCurrentMention,
            setCurrentMentionDoc,// <--- QUAN TRỌNG: Truyền xuống dưới với tên đúng
          },
          editor: props.editor,
        })

        if (!props.clientRect) return

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },

      onUpdate(props: any) {
        component.updateProps(props)
        if (!props.clientRect) return
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide()
          return true
        }
        return component.ref?.onKeyDown(props)
      },

      onExit() {
        // --- BÁO CÁO: MENU ĐÃ ĐÓNG ---
        setMentionOpen(false)
        
        popup[0].destroy()
        component.destroy()
      },
    }
  },
})