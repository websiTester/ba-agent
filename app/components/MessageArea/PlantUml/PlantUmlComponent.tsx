"use client";

import React, { useState, useEffect } from 'react';
import plantumlEncoder from 'plantuml-encoder';
import { Code2, EyeOff } from 'lucide-react';

interface PlantUMLCompoentProps {
    aiResponse: any;
}

export default function PlantUMLCompoent({ aiResponse }: PlantUMLCompoentProps) {
    const [activeTab, setActiveTab] = useState<number>(0);
    const [code, setCode] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [titleList, setTitleList] = useState<string[]>([]);
    const [codeList, setCodeList] = useState<string[]>([]);
    const [isCodeEdited, setIsCodeEdited] = useState(false);

    // --- LOGIC RENDER: Encode text thành URL ảnh ---
    useEffect(() => {
        try {
            const encoded = plantumlEncoder.encode(code);
            const url = `http://www.plantuml.com/plantuml/svg/${encoded}`;
            setImageUrl(url);
        } catch (error) {
            console.error("Lỗi encode:", error);
        }
    }, [code]);

    useEffect(() => {
        const data = aiResponse?.data;
        if (data) {
            const title = data.map((item: any) => item.title);
            const plantUmlCode = data.map((item: any) => item.code.replace(/\\n/g, '\n').trim());
            console.log('PlantUmlComponent - Extracted Titles:', title);
            console.log('PlantUmlComponent - Extracted Codes:', plantUmlCode);
            setTitleList(title);
            setCodeList(plantUmlCode);
            setCode(plantUmlCode[0] || '');
        }
    }, [aiResponse]);

    const handleTabChange = (index: number) => {
        setActiveTab(index);
        setCode(codeList[index]);
    };

    return (
        <div className="flex flex-col w-full h-[100vh] border border-orange-100 rounded-xl overflow-hidden shadow-sm bg-white">

            {/* HEADER & TABS */}
            <div className="flex flex-col gap-3 px-4 py-3 border-b border-orange-100/50 bg-gradient-to-r from-orange-50/30 to-orange-50/50">
                {/* Row 1: Title + View Code Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        <h3 className="text-sm font-semibold text-gray-800 m-0">Diagrams</h3>
                    </div>

                    {/* VIEW CODE BUTTON */}
                    <button
                        onClick={() => setIsCodeEdited(!isCodeEdited)}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm border flex-shrink-0
                            ${isCodeEdited
                                ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300'
                            }
                        `}
                    >
                        {isCodeEdited ? (
                            <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                            <Code2 className="w-3.5 h-3.5" />
                        )}
                        <span>{isCodeEdited ? 'Hide Code' : 'View Code'}</span>
                    </button>
                </div>

                {/* Row 2: Diagram Tabs (2 per row) */}
                <div className="grid grid-cols-2 gap-2">
                    {titleList && titleList.map((title, index) => (
                        <button
                            key={index}
                            onClick={() => handleTabChange(index)}
                            style={getTabStyle(activeTab === index)}
                        >
                            {title}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT: SPLIT VIEW */}
            <div className="flex flex-1 overflow-hidden min-h-0">

                {/* CODE EDITOR */}
                {isCodeEdited && (
                    <div className="w-2/5 flex flex-col border-r border-orange-100/50">
                        
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="flex-1 w-full p-3 font-mono text-xs border-none outline-none resize-none bg-gray-900 text-gray-300"
                        />
                    </div>
                )}
                
                {/* DIAGRAM PREVIEW */}
                <div className={`${isCodeEdited ? 'w-3/5' : 'w-full'} flex flex-col bg-white overflow-hidden`}>
                    <div className="flex-1 overflow-auto p-5 flex justify-center items-start">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt="PlantUML Diagram"
                                className="max-w-full h-auto shadow-md border border-gray-200 rounded-lg"
                            />
                        ) : (
                            <div className="flex items-center justify-center py-12">
                                <p className="text-sm text-gray-400">Loading diagram...</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    fontSize: '12px',
    fontFamily: 'inherit',
    border: isActive ? '1px solid #fb923c' : '1px solid #fed7aa',
    borderRadius: '8px',
    cursor: 'pointer',
    background: isActive ? 'linear-gradient(to right, #fb923c, #f97316)' : '#ffffff',
    color: isActive ? '#ffffff' : '#6b7280',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: isActive ? '0 2px 4px rgba(251, 146, 60, 0.2)' : 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%'
});