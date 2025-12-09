import { mastra } from ".";
import { generateThreadId } from "./discovery-agent";

export async function processRequest(
    userMessage: string,
    documentContent?: string,
    threadId?: string,
    resourceId: string = 'default-user'
  ): Promise<string> {

    // Format prompt for orchestration agent
    let prompt = `Người dùng yêu cầu: ${userMessage}\n`;
    
    if (documentContent && documentContent.length > 0) {
      prompt += `\nInput đầu vào bao gồm reference_standards và user_document.\n`;
      prompt += `Nội dung input đầu vào:\n${documentContent}\n`;
    }
    
    prompt += `\nHãy sử dụng tool phù hợp để xử lý yêu cầu này.`;
  
    console.log('[OrchestrationService] Prompt:', prompt);

    // Generate response - use the agent instance directly (avoid circular dependency with mastra)
    const agent = mastra.getAgent('orchestrationAgent');
    const response = await agent.generate(prompt, {
      threadId: threadId || generateThreadId(),
      resourceId: resourceId,
    });
  
    console.log(`[OrchestrationAgent] Response generated`);
    return response.text;
  }