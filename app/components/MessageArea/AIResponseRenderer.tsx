'use client'
import { useState } from 'react';
import CsvTable from "./CsvTable";
import PlantUMLCompoent from "./PlantUml/PlantUmlComponent";

interface AIResponseRendererProb {
    aiResponse: any
}



// Helper function to format agent_source name
const formatAgentSourceName = (agentSource: string) => {
    return agentSource
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default function AIResponseRenderer({ aiResponse }: any) {
    const [activeTab, setActiveTab] = useState(0);

    // Ensure aiResponse is an array
    const responses = Array.isArray(aiResponse) ? aiResponse : [aiResponse];

    // If no valid responses, show empty state
    if (!responses || responses.length === 0) {
        return <div className="p-4 text-gray-500">No data available</div>;
    }

    const currentResponse = responses[activeTab];

    return (
        <div className="h-full flex flex-col">
            {/* Tabs Header */}
            {responses.length > 1 && (
                <div className="flex border-b border-gray-200 bg-white px-4">
                    {responses.map((response: any, index: number) => (
                        <button
                            key={index}
                            onClick={() => setActiveTab(index)}
                            className={`
                                px-6 py-3 text-sm font-medium transition-all duration-200
                                ${activeTab === index
                                    ? 'text-[#1f2937] border-b-2 border-[#f97316]'
                                    : 'text-[#6b7280] hover:text-[#1f2937] hover:bg-gray-50'
                                }
                            `}
                        >
                            {formatAgentSourceName(response.agent_source || `Tab ${index + 1}`)}
                        </button>
                    ))}
                </div>
            )}

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
                {currentResponse.response_type === 'interactive_table' ? (
                    <div className="h-full">
                        <CsvTable aiResponse={currentResponse} />
                    </div>
                ) : currentResponse.response_type === 'diagram_gallery' ? (
                    <PlantUMLCompoent aiResponse={currentResponse} />
                ) : (
                    <div className="p-4 text-gray-500">Unsupported response type</div>
                )}
            </div>
        </div>
    );
}