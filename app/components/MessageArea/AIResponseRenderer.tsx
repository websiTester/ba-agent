'use client'
import { useState, useEffect, useRef } from 'react';
import { Sparkles, Download, Plus, SquareTerminal } from 'lucide-react';
import CsvTable from "./CsvTable";
import PlantUMLCompoent from "./PlantUml/PlantUmlComponent";
import RefineModal from './RefineModal';
import ExportModal from './ExportModal';
import { useAppState } from '@/app/store';
import TabLoading from './TabLoading';
import UseCaseTable from './Usecase/UseCaseTable';

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

export default function AIResponseRenderer({ handleAIResponse, aiResponse }: any) {
    const [activeTab, setActiveTab] = useState(0);
    const [showRefineModal, setShowRefineModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const csvTableRef = useRef<any>(null);
    
    // Ensure aiResponse is an array
    const responses = Array.isArray(aiResponse) ? aiResponse : [aiResponse];
    const [isToolProcessing, setIsToolProcessing] = useState<boolean[]>([]);
    const phaseId = useAppState(state => state.activePhase);
    const selectedActionItem = useAppState(state => state.selectedActionItem);

    // Sync isToolProcessing array length with responses length
    useEffect(() => {
        setIsToolProcessing(prev => {
            // If length changed, create new array with correct length
            if (prev.length !== responses.length) {
                return Array(responses.length).fill(false);
            }
            return prev;
        });
    }, [responses.length]);

    // If no valid responses, show empty state
    if (!responses || responses.length === 0) {
        //return <UseCaseTable/>
        return <div className="p-4 text-gray-500">No data available</div>;
    }

    const currentResponse = responses[activeTab];
    
    // Get available tool names
    const availableTools = responses.map((r: any) => r.agent_source || 'Unknown');

    // Check if current response is CSV format
    const isCsvFormat = currentResponse?.data_format === 'csv';

    const handleRefine = async (userInput: string, selectedTools: string[]) => {
        console.log('Refining with input:', userInput);
        console.log('Selected tools:', selectedTools);
        console.log('Active tab:', activeTab);
        
        // Set loading state for the active tab
        setIsToolProcessing(prev => {
            const newState = [...prev];
            newState[activeTab] = true;
            console.log('Setting loading state:', newState);
            return newState;
        });

        try {
            // Append tool information to user input
            let refinedInput = userInput;
            selectedTools.forEach((tool: string) => {
                refinedInput += `\n\nUsing tool ${tool} to handle user request`;
            });
            
            const response = await callAgent(refinedInput);
            console.log('Refine response received:', response);
            handleAIResponse(response);
        } catch (error) {
            console.error('Refine error:', error);
        } finally {
            // Reset loading state
            setIsToolProcessing(prev => {
                const newState = [...prev];
                newState[activeTab] = false;
                console.log('Clearing loading state:', newState);
                return newState;
            });
        }
    };

    const callAgent = async (message: string) => {
        console.log("Calling Agent with message: "+message);
        try {
            const response = await fetch('/api/agent/ui-analyze', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message,
                threadId: `user-${phaseId}`,
                phaseId: phaseId,
              })
            });

            // Check if response is ok
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to get response from agent');
            }
            
            console.log('RESPONSE:', result.response);
            return result.response;
        } catch (error: any) {
          console.error('Agent Error:', error);
          
          // Show user-friendly error message
          if (error.message.includes('timeout') || error.message.includes('Timeout')) {
              alert('Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại hoặc đơn giản hóa yêu cầu của bạn.');
          } else {
              alert(`Lỗi: ${error.message || 'Không thể kết nối đến AI agent'}`);
          }
          
          throw error;
        }
      };

    const handleExport = (selectedTool: string) => {
        console.log('Exporting tool:', selectedTool);
        // TODO: Implement export logic
    };

    const handleAddNewRow = () => {
        if (csvTableRef.current && csvTableRef.current.addNewRow) {
            csvTableRef.current.addNewRow();
        }
    };

    /**
     * Generate markdown content from table data
     * Converts rows to a formatted markdown table
     */
    const generateMarkdownFromData = (rows: any[]): string => {
        if (!rows || rows.length === 0) return '';

        // Get all column headers (exclude internal fields starting with _)
        const headers = Object.keys(rows[0]).filter(key => !key.startsWith('_'));
        
        // Create markdown table header
        let markdown ="";
        if(currentResponse?.agent_source === 'requirement_analysis'){
             markdown +=`
**Role:** Act as a Senior Frontend Architect and Expert UI/UX Designer.

**Context:**I have a list of Functional Requirements (provided below). I need you to establish the project foundation, folder structure, and the main UI Shell (Home Page).

**Tech Stack:**
- Framework: Next.js 15 (App Router).
- Language: TypeScript.
- Styling: Tailwind CSS.
- Icons: Lucide React.
- UI Components: Use a style similar to Shadcn/UI (Radix UI primitives).
- State Management: React Context or Zustand (if necessary).

**Task 1: Project Architecture & Folder Structure**
Analyze the provided Functional Requirements to identify the core "Domains" or "Features" of the application.
- Propose a detailed **Feature-based** or **Domain-driven** folder structure within the \`src/\` directory.
- **Requirement:** Instead of grouping by file type (e.g., all components in one folder), group by feature (e.g., \`src/components/features/auth\`, \`src/components/features/dashboard\`, \`src/components/features/orders\`).
- Briefly explain the rationale behind your structure based on the specific requirements.

**Task 2: UI Shell & Home Page Implementation**
Generate the code for the App Shell (Layout) and the Home Page (\`page.tsx\`).
The UI must include:
1.  **Sidebar (Left):**
    - Logo and App Name.
    - Navigation Menu: The links must correspond to the functional modules you identified in the Requirements.
    - Responsive design (collapsible on mobile/desktop).
2.  **Header (Top):**
    - Search bar.
    - User Profile (Avatar/Name).
    - Notification bell or Theme toggle.
3.  **Footer (Bottom):**
    - Copyright and secondary links.
4.  **Main Content (Home Page):**
    - Create a **Summary Dashboard**.
    - Display distinct Cards/Widgets showing key metrics or quick actions relevant to the Requirements (e.g., "Recent Activity," "Pending Tasks," or specific domain stats).

**Coding Guidelines:**
- **Architecture:** Use Next.js App Router conventions. Implement the Sidebar, Header, and Footer in a root \`layout.tsx\` file so they persist across navigation.
- **Modularity:** Separate components into distinct files (e.g., \`Sidebar.tsx\`, \`Header.tsx\`) and import them.
- **Data:** Use **Mock Data** (const variables) to ensure the UI renders with realistic content immediately.
- **Styling:** Use Tailwind CSS for a modern, clean, and professional look (consistent spacing, rounded corners, subtle shadows).

---
**INPUT DATA (FUNCTIONAL REQUIREMENTS):**
        `;
        markdown += '\n\n';
        markdown += '## Requirements Table\n\n';
        
        } else {
        // Get feature name and requirement info from selectedActionItem
        const featureName = selectedActionItem?.rowData?.['Requirement Name'] || 
                           selectedActionItem?.rowData?.['Name'] || 
                           selectedActionItem?.rowData?.['name'] || 
                           '[NAME OF THE FEATURE]';
        console.log('selectedActionItem:', selectedActionItem);
        console.log('Generating UI prompt for feature:', featureName);
        // Build requirement info from rowData
        let requirementInfo = '[Information about the selected requirement]';
        if (selectedActionItem?.rowData) {
            const rowData = selectedActionItem.rowData;
            
            // Extract all non-empty fields, excluding internal fields (starting with _)
            const infoLines = Object.entries(rowData)
                .filter(([key, value]) => value && !key.startsWith('_'))
                .map(([key, value]) => `- **${key}:** ${value}`);
            
            if (infoLines.length > 0) {
                requirementInfo = infoLines.join('\n');
            }
        }

        markdown +=`
**Role:** Act as a Senior Frontend Architect and Expert UI/UX Designer.

**Task:** I need you to implement the UI for a specific functional requirement: **${featureName}**.
Requirement information: 
${requirementInfo}

Based on the **List of UI Elements** provided below, please generate the full code for this page.

**Tech Stack:**
- Framework: Next.js 15 (App Router).
- Language: TypeScript.
- Styling: Tailwind CSS.
- Icons: Lucide React.
- UI Components: Use a style similar to Shadcn/UI (Radix UI primitives).
- State Management: React Context or Zustand (if necessary).

**Instructions:**

1.  **File Location:**
    - Identify the correct directory for this feature based on the "Feature-based" folder structure you proposed earlier (e.g., \`src/app/(dashboard)/[feature-name]/page.tsx\` or \`src/components/features/[feature-name]/...\`).
    - State the file path clearly at the top of your response.

2.  **UI Composition & Layout:**
    - Do not just list the elements vertically. Organize them into a logical layout (e.g., Filters on top, Data Table in the center, Action buttons in the top-right).
    - Map the provided "UI Elements" to modern UI components (e.g., map a "List" to a Data Table or Grid of Cards; map "Input" to a Label + Input field).
    - Use a **Card-based layout** if appropriate to group related information.

3.  **Code Implementation:**
    - **Imports:** Use Lucide React for icons.
    - **Types:** Define a TypeScript Interface for the data represented in this view.
    - **Mock Data:** Create a \`const\` array with realistic mock data so the UI is populated and visualized immediately.
    - **Interactivity:** Since this is a UI implementation, ensure hover states and active states are styled (e.g., \`hover:bg-gray-100\`).

**Input Data:**
**List of UI Elements:**

        `;

        markdown += '\n\n';
        markdown += '## UI Specification Table\n\n';


        }
       
        
        // Add table headers
        markdown += '| ' + headers.join(' | ') + ' |\n';
        markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
        
        // Add table rows
        rows.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Escape pipe characters and newlines in cell content
                return String(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
            });
            markdown += '| ' + values.join(' | ') + ' |\n';
        });
        
        return markdown;
    };

    /**
     * Handler for UI Prompt button - downloads markdown file
     */
    const handleUIPrompt = () => {
        if (csvTableRef.current && csvTableRef.current.getRowData) {
            const rows = csvTableRef.current.getRowData();
            const markdownContent = generateMarkdownFromData(rows);
            
            // Create blob and download file
            const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `requirements_${new Date().toISOString().split('T')[0]}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    const handleUIRequirementPrompt = () => {

    }

    return (
        <>
            <div className="h-full flex flex-col">
                {/* Tabs Header with Action Buttons */}
                <div className="flex items-center justify-between border-b border-orange-100/50 bg-white px-4">
                    {/* Tabs */}
                    <div className="flex">
                        {responses.length > 1 ? (
                            responses.map((response: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveTab(index)}
                                    className={`
                                        px-6 py-3 text-sm font-medium transition-all duration-200
                                        ${activeTab === index
                                            ? 'text-gray-800 border-b-2 border-orange-500'
                                            : 'text-gray-500 hover:text-gray-800 hover:bg-orange-50/30'
                                        }
                                    `}
                                >
                                    {formatAgentSourceName(response.agent_source || `Tab ${index + 1}`)}
                                </button>
                            ))
                        ) : (
                            <div className="px-6 py-3 text-sm font-medium text-gray-800 border-b-2 border-orange-500">
                                {formatAgentSourceName(responses[0]?.agent_source || 'Results')}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Add New Row Button - Only show for CSV format */}
                        {isCsvFormat  && (
                            <button
                                onClick={handleAddNewRow}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                                <Plus size={16} />
                                Add Row
                            </button>
                        )}
                        {/* UI Prompt Button - Only show for requirement_analysis */}
                        {(currentResponse?.agent_source === 'requirement_analysis' || 
                            currentResponse?.agent_source === 'ui_ux_analysis'
                        ) && (
                            <button
                                onClick={handleUIPrompt}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                                <SquareTerminal size={16} />
                                Get UI Prompt
                            </button>
                        )}

                        <button
                            onClick={() => setShowRefineModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                            <Sparkles size={16} />
                            Refine
                        </button>
                        {(isCsvFormat||currentResponse?.agent_source=="usecase_specification") && (
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                            <Download size={16} />
                            Export
                        </button>
                        )}
                        
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-auto relative">
                    {(() => {
                        console.log('Render check - activeTab:', activeTab, 'isToolProcessing:', isToolProcessing, 'isProcessing:', isToolProcessing[activeTab]);
                        return (
                            <>
                                {/* Always render content */}
                                {currentResponse.response_type === 'interactive_table' ? (
                                    <div className="h-full">
                                        <CsvTable ref={csvTableRef} aiResponse={currentResponse} />
                                    </div>
                                ) : currentResponse.response_type === 'diagram_gallery' ? (
                                    <PlantUMLCompoent aiResponse={currentResponse} />
                                ): currentResponse.response_type === 'usecase_table' ? (
                                    <UseCaseTable data={currentResponse.data} />
                                ) : (
                                    <div className="p-4 text-gray-500">Unsupported response type</div>
                                )}
                                
                                {/* Overlay loading when processing */}
                                <TabLoading 
                                    message="AI agent đang refine câu trả lời của tab này" 
                                    isVisible={isToolProcessing[activeTab] || false}
                                />
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Modals */}
            <RefineModal
                handleAIResponse={handleAIResponse}
                isOpen={showRefineModal}
                onClose={() => setShowRefineModal(false)}
                availableTools={availableTools}
                onRefine={handleRefine}
            />

            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                availableTools={availableTools}
                responses={responses}
                onExport={handleExport}
            />
        </>
    );
}