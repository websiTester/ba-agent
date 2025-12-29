'use client'

import { Message, PhaseId } from "@/app/models/types";
import { useAppState } from "@/app/store";
import { Bot, Copy, Download, Loader2, RefreshCw, Save, Sparkles, ThumbsDown, ThumbsUp, User } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { marked } from 'marked';
import { asBlob } from 'html-docx-js-typescript';
import { useEffect, useRef, useState } from "react";
import Mermaid from "./Mermaid";

interface MessageAreaProb {
    messages: Message[],
    phaseName: string,
    phaseDescription: string,
    phasePrompts: Record<PhaseId, string[]>,
    isTyping: boolean,
    isAgentProcessing: boolean,
    setInput: any,
    inputRef: any,
    setIsAgentProcessing: any,
    obsidianThreadIdRef: any,
    onSendMessage: any,
    isObsidianMode: boolean,
    setLastSavedNote: any

}

export default function MessageArea({
    messages,
    phaseName,
    phaseDescription,
    phasePrompts,
    isTyping,
    isAgentProcessing,
    setInput,
    inputRef,
    setIsAgentProcessing,
    obsidianThreadIdRef,
    onSendMessage,
    isObsidianMode,
    setLastSavedNote


}: MessageAreaProb) {

    const phaseId = useAppState(set => set.activePhase);
    const messagesEndRef = useRef<HTMLDivElement>(null);


    const [savingMessageId, setSavingMessageId] = useState<string | null>(null);
    // Store last saved note info for context continuity

    const handlePromptClick = (prompt: string) => {
        if (isTyping || isAgentProcessing) return;
        setInput(prompt);
        inputRef.current?.focus();
    };


    // Function to clean markdown content - remove outer code block wrappers
    const cleanMarkdownContent = (content: string): string => {
        let cleaned = content.trim();

        // Pattern to match content wrapped in code blocks like ```markdown ... ``` or ``` ... ```
        // This handles cases where the LLM wraps the entire response in a code block
        const codeBlockPattern = /^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?```$/;
        const match = cleaned.match(codeBlockPattern);

        if (match) {
            cleaned = match[1].trim();
        }

        return cleaned;
    };



    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };



    // Save message to Obsidian
    const handleSaveToObsidian = async (messageContent: string, messageId: string) => {
        setIsAgentProcessing(true);
        setSavingMessageId(messageId);
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const title = `BA-Agent-${phaseName}-${timestamp}`;

            const response = await fetch('/api/agent/obsidian', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save',
                    content: messageContent,
                    title: title,
                    folder: 'BA-Agent',
                    threadId: obsidianThreadIdRef.current, // Use Obsidian-specific threadId
                    resourceId: `user-${phaseId}`,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log('Save to obsidian successful');

                // Lưu thông tin note vừa tạo để dùng cho các yêu cầu tiếp theo
                setLastSavedNote({ title, content: messageContent });

                // Hiển thị phản hồi từ Obsidian Agent
                const aiResponse = data.response;
                onSendMessage(aiResponse, 'assistant');
            } else {
                console.error('Save to obsidian failed:', data.error);
                alert(`❌ Lỗi: ${data.error || 'Không thể lưu vào Obsidian'}`);
            }
        } catch (error) {
            console.error('Error saving to Obsidian:', error);
            alert('❌ Không thể kết nối với Obsidian. Kiểm tra Obsidian Local REST API plugin.');
        } finally {
            setSavingMessageId(null);
            setIsAgentProcessing(false);
        }
    };



    // Download message as .docx file
    const handleDownload = async (messageContent: string) => {
        try {
            setIsAgentProcessing(true);
            console.log('==========MESSAGE CONTENT==========\n' + messageContent);

            await handleDownloadZip(messageContent);
        } catch (error) {
            console.error('Error downloading docx:', error);
            alert('❌ Không thể tạo file .docx. Vui lòng thử lại.');
        }
        finally {
            setIsAgentProcessing(false);
        }
    };


    const handleDownloadZip = async (content: string) => {
        if (!content.trim()) return;
        setIsAgentProcessing(true);

        try {
            const zip = new JSZip();

            // Regex cắt chuỗi: Cắt tại các dòng bắt đầu bằng #, ##, hoặc ###
            const sections = content.split(/(?=^#{1,3} )/gm);

            let currentH1Folder = null; // Folder cấp 1
            let currentH2Folder = null; // Folder cấp 2

            // Mặc định lưu vào root nếu không có Header
            let targetFolder = zip;
            let fileName = "General_Info";

            for (const section of sections) {
                const trimmedSection = section.trim();
                if (!trimmedSection) continue;

                // Lấy dòng đầu tiên để check header
                const firstLine = trimmedSection.split('\n')[0];

                // --- LOGIC LINH HOẠT HƠN ---

                // 1. Gặp H1 (#) -> Luôn tạo Folder gốc mới
                if (firstLine.startsWith('# ')) {
                    const name = sanitizeName(firstLine.substring(2));
                    currentH1Folder = zip.folder(name);
                    currentH2Folder = null; // Reset H2 khi sang H1 mới

                    targetFolder = currentH1Folder || zip; // Nội dung của H1 nằm trong folder H1
                    fileName = name;
                }

                // 2. Gặp H2 (##) -> Tạo Folder
                else if (firstLine.startsWith('## ')) {
                    const name = sanitizeName(firstLine.substring(3));

                    // Logic mới: Nếu đang ở trong H1 thì tạo sub-folder, nếu không thì tạo folder ở root
                    const parentFolder = currentH1Folder || zip;
                    currentH2Folder = parentFolder.folder(name);

                    targetFolder = currentH2Folder || zip; // Nội dung H2 nằm trong folder H2
                    fileName = name;
                }

                // 3. Gặp H3 (###) -> Xác định là FILE
                else if (firstLine.startsWith('### ')) {
                    const name = sanitizeName(firstLine.substring(4));

                    // File này nằm ở folder gần nhất (ưu tiên H2 -> H1 -> Root)
                    targetFolder = currentH2Folder || currentH1Folder || zip;
                    fileName = name;
                }

                // 4. Nội dung không có Header (Text đầu file)
                else {
                    // Giữ nguyên targetFolder và fileName cũ
                }

                // --- TẠO FILE DOCX ---
                // 1. Parse Markdown -> HTML
                const htmlContent = marked.parse(trimmedSection);

                // 2. Wrap HTML với CSS cho đẹp
                const htmlDoc = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
                h1, h2, h3 { color: #2E74B5; }
                table { border-collapse: collapse; width: 100%; margin: 10px 0; }
                td, th { border: 1px solid #000; padding: 8px; }
                ul, ol { margin-left: 20px; }
              </style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `;

                // 3. Tạo Blob và lưu vào Zip
                // Lưu ý: await asBlob có thể tốn thời gian, nhưng đảm bảo tuần tự
                const docxBlob = await asBlob(htmlDoc);

                // Kiểm tra targetFolder có tồn tại không trước khi ghi
                if (targetFolder) {
                    targetFolder.file(`${fileName}.docx`, docxBlob);
                }
            }

            // Tải về
            const contentBlob = await zip.generateAsync({ type: "blob" });
            saveAs(contentBlob, "Requirements_Export.zip");

        } catch (error) {
            console.error("Lỗi:", error);
            alert("Có lỗi: " + (error as Error).message);
        } finally {
            setIsAgentProcessing(false);
        }
    };

    const sanitizeName = (name: string) => name.replace(/[\/\\?%*:|"<>]/g, '-').trim();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fixMermaidSyntax = (code: string) => {
        // 1. Chuẩn hóa cơ bản
        let processed = code.replace(/\\n/g, '\n'); // Đổi \n thành xuống dòng thật
      
        // 2. Xác định loại biểu đồ để áp dụng luật riêng
        const isUseCase = processed.includes('usecaseDiagram');
        const isClass = processed.includes('classDiagram');
      
        let lines = processed.split('\n');
        
        const fixedLines = lines.map(line => {
          let cleanLine = line.trim();
      
          // --- FIX CHUNG CHO MỌI BIỂU ĐỒ ---
          
          // Fix lỗi AI dùng từ khóa 'as' của PlantUML (cho Actor, Usecase)
          // SAI: actor A as "Label" -> ĐÚNG: actor A["Label"]
          // SAI: usecase U as "Label" -> ĐÚNG: usecase U("Label")
          if (cleanLine.includes(' as ')) {
              // Regex bắt: (loại) (id) as "Label"
              cleanLine = cleanLine.replace(
                  /(actor|usecase|participant)\s+([a-zA-Z0-9_]+)\s+as\s+"([^"]+)"/g, 
                  (match, type, id, label) => {
                      if (type === 'participant') return match; // Sequence dùng 'as' được, giữ nguyên
                      if (type === 'usecase') return `${type} ${id}("${label}")`;
                      return `${type} ${id}["${label}"]`;
                  }
              );
          }
      
          // --- LOGIC RIÊNG CHO USE CASE DIAGRAM ---
          if (isUseCase) {
              // Fix lỗi: AI dùng 'box' (của Sequence) thay vì 'subgraph'
              if (cleanLine.startsWith('box ')) {
                  return cleanLine.replace(/^box\s+/, 'subgraph ');
              }
              
              // Cú pháp 'rectangle' cũng chuyển thành 'subgraph'
              if (cleanLine.startsWith('rectangle ')) {
                   return cleanLine.replace(/^rectangle\s+"?([^"]+)"?\s*\{?/, 'subgraph "$1"');
              }
          }
      
          // --- LOGIC RIÊNG CHO CLASS DIAGRAM ---
          if (isClass) {
              // Fix lỗi Generics: List<String> -> List~String~
              cleanLine = cleanLine.replace(/</g, '~').replace(/>/g, '~');
      
              // Fix lỗi định nghĩa Class có ngoặc kép: class "Khách Hàng" {
              // Mermaid Class Diagram rất ghét dấu ngoặc kép và khoảng trắng trong tên ID class
              // Giải pháp: Xóa ngoặc kép
              if (cleanLine.startsWith('class "')) {
                  cleanLine = cleanLine.replace(/class\s+"([^"]+)"/g, 'class $1');
              }
              
              // Fix lỗi quan hệ có ngoặc kép: "Khách hàng" "1" -- "n" "Đơn hàng"
              // Xóa hết ngoặc kép trong dòng quan hệ để tránh lỗi parse
              if (cleanLine.includes('--') || cleanLine.includes('..')) {
                  cleanLine = cleanLine.replace(/"/g, '');
              }
          }
      
          return cleanLine;
        });
        
        const result = fixedLines.join('\n');
        console.log("RESPONSE: "+result);
        return fixedLines.join('\n');
      };


    return (

        <div className="flex-1 overflow-y-auto p-5 pb-36 space-y-4">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[calc(100%-120px)] text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] rounded-2xl flex items-center justify-center mb-4">
                        <Sparkles size={32} className="text-[#f97316]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1a1a2e] mb-2">
                        Chào mừng đến {phaseName}
                    </h3>
                    <p className="text-sm text-[#6b7280] mb-6 max-w-md">
                        AI Agent sẵn sàng hỗ trợ bạn trong quá trình {phaseDescription.toLowerCase()}.
                        Hãy bắt đầu bằng cách chọn một gợi ý hoặc nhập câu hỏi của bạn.
                    </p>

                    {/* Quick Prompts */}
                    <div className="w-full max-w-lg">
                        <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">
                            Gợi ý câu hỏi
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            {phasePrompts[phaseId]?.map((prompt, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePromptClick(prompt)}
                                    disabled={isTyping || isAgentProcessing}
                                    className={`text-left px-4 py-3 bg-[#fafbfc] border border-[#e5e7eb] rounded-xl text-sm transition-all ${isTyping || isAgentProcessing
                                        ? 'text-[#9ca3af] cursor-not-allowed opacity-60'
                                        : 'text-[#1a1a2e] hover:bg-[#f3f4f6] hover:border-[#f97316] hover:shadow-sm'
                                        }`}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {messages.map((message, index) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 animate-slide-in ${message.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {/* Avatar */}
                            <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${message.role === 'user'
                                    ? 'bg-[#3b82f6]'
                                    : 'bg-gradient-to-br from-[#f97316] to-[#ea580c]'
                                }
                `}>
                                {message.role === 'user'
                                    ? <User size={16} className="text-white" />
                                    : <Bot size={16} className="text-white" />
                                }
                            </div>

                            {/* Message Content */}
                            <div className={`
                  ${message.role === 'user' ? 'max-w-[100%]' : 'max-w-[90%]'} rounded-2xl px-4 py-3
                  ${message.role === 'user'
                                    ? 'bg-[#3b82f6] text-white rounded-tr-md'
                                    : 'bg-[#f3f4f6] text-[#1a1a2e] rounded-tl-md'
                                }
                `}>
                                <div className={`text-sm prose prose-sm max-w-none break-words ${message.role === 'user'
                                    ? 'prose-invert prose-p:text-white prose-headings:text-white prose-strong:text-white prose-li:text-white'
                                    : 'prose-gray prose-p:text-[#1a1a2e] prose-headings:text-[#1a1a2e] prose-strong:text-[#1a1a2e]'
                                    }`}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            // Custom code block styling
                                            code: ({ className, children, node, ...props }) => {

                                                const match = /language-(\w+)/.exec(className || '');
                                                const isMermaid = match && match[1] === 'mermaid';

                                                if (isMermaid) {
                                                    // Lấy code gốc
                                                    const originalCode = String(children).replace(/\n$/, '');

                                                    // --- BƯỚC QUAN TRỌNG: Sửa lỗi cú pháp trước khi render ---
                                                    const sanitizedCode = fixMermaidSyntax(originalCode);

                                                    // Truyền code đã sửa vào component Mermaid
                                                    return <Mermaid chart={sanitizedCode} />;
                                                }

                                                // Check if this is inline code or block code
                                                // Block code is inside <pre>, inline is not
                                                const isInline = node?.position?.start.line === node?.position?.end.line &&
                                                    !className &&
                                                    typeof children === 'string' &&
                                                    !children.includes('\n');

                                                if (isInline) {
                                                    return (
                                                        <code
                                                            className={`px-1.5 py-0.5 rounded text-xs font-mono ${message.role === 'user'
                                                                ? 'bg-blue-500/30 text-white'
                                                                : 'bg-[#f3f4f6] text-[#e11d48]'
                                                                }`}
                                                            {...props}
                                                        >
                                                            {children}
                                                        </code>
                                                    );
                                                }
                                                // Block code - just return the code element, pre will handle styling
                                                return (
                                                    <code className={`${className || ''} text-[13px]`} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            // Custom pre (code block) styling
                                            pre: ({ children }) => (
                                                <pre className={`my-2 p-3 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap ${message.role === 'user'
                                                    ? 'bg-blue-600/50 text-white'
                                                    : 'bg-[#f8f9fa] text-[#1a1a2e] border border-[#e5e7eb]'
                                                    }`}>
                                                    {children}
                                                </pre>
                                            ),
                                            // Custom paragraph styling
                                            p: ({ children }) => (
                                                <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                                            ),
                                            // Custom list styling
                                            ul: ({ children }) => (
                                                <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                                            ),
                                            ol: ({ children }) => (
                                                <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                                            ),
                                            li: ({ children }) => (
                                                <li className="leading-relaxed">{children}</li>
                                            ),
                                            // Custom heading styling
                                            h1: ({ children }) => (
                                                <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>
                                            ),
                                            h2: ({ children }) => (
                                                <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>
                                            ),
                                            h3: ({ children }) => (
                                                <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>
                                            ),
                                            // Custom link styling
                                            a: ({ href, children }) => (
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`underline ${message.role === 'user'
                                                        ? 'text-blue-200 hover:text-white'
                                                        : 'text-[#f97316] hover:text-[#ea580c]'
                                                        }`}
                                                >
                                                    {children}
                                                </a>
                                            ),
                                            // Custom blockquote styling
                                            blockquote: ({ children }) => (
                                                <blockquote className={`border-l-4 pl-3 my-2 italic ${message.role === 'user'
                                                    ? 'border-blue-300 text-blue-100'
                                                    : 'border-[#f97316] text-[#6b7280]'
                                                    }`}>
                                                    {children}
                                                </blockquote>
                                            ),
                                            // Custom table styling
                                            table: ({ children }) => (
                                                <div className="overflow-x-auto my-2">
                                                    <table className="min-w-full border-collapse text-xs">{children}</table>
                                                </div>
                                            ),
                                            th: ({ children }) => (
                                                <th className={`border px-2 py-1 text-left font-semibold ${message.role === 'user'
                                                    ? 'border-blue-400 bg-blue-500/30'
                                                    : 'border-[#e5e7eb] bg-[#f3f4f6]'
                                                    }`}>
                                                    {children}
                                                </th>
                                            ),
                                            td: ({ children }) => (
                                                <td className={`border px-2 py-1 whitespace-pre-wrap ${message.role === 'user'
                                                    ? 'border-blue-400'
                                                    : 'border-[#e5e7eb]'
                                                    }`}>
                                                    {children}
                                                </td>
                                            ),
                                        }}
                                    >
                                        {cleanMarkdownContent(message.content)}
                                    </ReactMarkdown>
                                </div>
                                <div className={`
                    flex items-center gap-2 mt-2 text-xs
                    ${message.role === 'user' ? 'text-blue-200 justify-end' : 'text-[#9ca3af]'}
                  `}>
                                    <span>{formatTime(message.timestamp)}</span>
                                    {message.role === 'assistant' && (
                                        <div className="flex items-center gap-1 ml-2">
                                            <button className="p-1 hover:bg-[#e5e7eb] rounded transition-colors">
                                                <Copy size={12} />
                                            </button>
                                            <button className="p-1 hover:bg-[#e5e7eb] rounded transition-colors">
                                                <RefreshCw size={12} />
                                            </button>
                                            <button className="p-1 hover:bg-[#ecfdf5] hover:text-[#10b981] rounded transition-colors">
                                                <ThumbsUp size={12} />
                                            </button>
                                            <button className="p-1 hover:bg-[#fef2f2] hover:text-[#ef4444] rounded transition-colors">
                                                <ThumbsDown size={12} />
                                            </button>
                                            {/* Download as .docx button */}
                                            <button
                                                onClick={() => handleDownload(message.content)}
                                                className="ml-1 px-2 py-1 bg-[#3b82f6] text-white rounded-md transition-all flex items-center gap-1 shadow-sm hover:bg-[#2563eb] hover:shadow-md"
                                                title="Tải xuống .docx"
                                            >
                                                <Download size={14} />

                                            </button>
                                            {/* Save to Obsidian button - only shows when Obsidian mode is active */}
                                            {isObsidianMode && (
                                                <button
                                                    onClick={() => handleSaveToObsidian(message.content, message.id)}
                                                    disabled={savingMessageId === message.id}
                                                    className={`ml-2 px-2.5 py-1 text-white rounded-md transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md ${savingMessageId === message.id
                                                        ? 'bg-[#9ca3af] cursor-not-allowed'
                                                        : 'bg-[#7c3aed] hover:bg-[#6d28d9]'
                                                        }`}
                                                    title="Save to Obsidian"
                                                >
                                                    {savingMessageId === message.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Save size={14} />
                                                    )}
                                                    <span className="text-xs font-medium">
                                                        {savingMessageId === message.id ? 'Saving...' : 'Save'}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {(isTyping || isAgentProcessing) && (
                        <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isObsidianMode
                                ? 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9]'
                                : 'bg-gradient-to-br from-[#f97316] to-[#ea580c]'
                                }`}>
                                <Bot size={16} className="text-white" />
                            </div>
                            <div className="bg-[#f3f4f6] rounded-2xl rounded-tl-md px-4 py-3">
                                {isAgentProcessing ? (
                                    <div className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                                        <div className="flex items-center gap-2">
                                            <Loader2 size={16} className={`animate-spin ${isObsidianMode ? 'text-[#7c3aed]' : 'text-[#f97316]'}`} />
                                            <span>
                                                {isObsidianMode
                                                    ? 'Obsidian Agent đang xử lý yêu cầu...'
                                                    : 'Đang tìm kiếm thông tin liên quan đến yêu cầu...'
                                                }
                                            </span>
                                        </div>
                                        {isObsidianMode && (
                                            <div className="text-xs text-[#9ca3af] ml-6">
                                                Kết nối với Obsidian vault để xử lý
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                        <span className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                        <span className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </>
            )}
        </div>

    );
}