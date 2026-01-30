/**
 * Custom hook cho API calls trong Sidebar
 */

import { useAppState } from '@/app/store';
import { API_URL, TIME_OUT } from '../constants';
import { SelectedToolItem } from '../types';

export const useSidebarApi = () => {
  const setIsAgentProcessing = useAppState(state => state.setIsAgentProcessing);
  const phaseId = useAppState(state => state.activePhase);

  /**
   * Fetch tools từ backend theo phaseId
   */
  const fetchTools = async (activePhase: string, setIsLoadingTools: (loading: boolean) => void, setToolData: (data: any[]) => void, setTools: (tools: any[]) => void) => {
    setIsLoadingTools(true);
    try {
      const toolResponse = await fetch(`${API_URL}/${activePhase}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const toolData = await toolResponse.json();
      setToolData(toolData);

      const mentionTools = toolData.map((tool: any) => {
        return {
          label: tool.toolName,
          description: tool.toolDescription,
          type: 'tool',
          toolPrompt: tool.toolPrompt
        }
      });

      setTools(mentionTools);
      setIsLoadingTools(false);

    } catch (error) {
      console.error('Error fetching tools:', error);
      setIsLoadingTools(false);
    }
  };

  /**
   * Gọi agent để xử lý message
   */
  const callAgent = async (message: string, documentContent: string = '', selectedToolsItem: SelectedToolItem[]) => {
    console.log("Calling Agent with message: " + message);
    console.log(`Selected tool: ${selectedToolsItem}`);
    setIsAgentProcessing(true);
    try {
      const response = await fetch('/api/agent/ui-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          documentContent,
          selectedTools: selectedToolsItem,
          threadId: `user-${phaseId}`,
          phaseId: phaseId,
        }),
        signal: AbortSignal.timeout(TIME_OUT)
      });

      const result = await response.json();
      const aiResponse = result.response;
      
      console.log(`RESPONSE: ${aiResponse}`);
      return aiResponse;
    } catch (error) {
      console.error('Discovery Agent Error:', error);
      throw error;
    } finally {
      setIsAgentProcessing(false);
    }
  };

  return {
    fetchTools,
    callAgent,
  };
};
