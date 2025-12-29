import { getAgentByName, getAgents, updateAgentByName } from "@/app/db/agents";
import { reloadAnalysisAgent } from "@/app/mastra/analysis-agent";
import { reloadCommunicationAgent } from "@/app/mastra/communication-agent";
import { reloadDiscoveryAgent } from "@/app/mastra/discovery-agent";
import { reloadDocumentAgent } from "@/app/mastra/document-agent";
import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config();
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const refreshUrl = `${baseUrl}/agent_response/refresh_agent`;

// Get agent by name or get all agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agentName');

    if (agentName) {
      const agent = await getAgentByName(agentName);
      if (!agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }
      return NextResponse.json(agent);
    }

    const agents = await getAgents();
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching agent:", error);
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 });
  }
}

// Update agent by name
export async function PUT(request: NextRequest) {
  try {
    const { agentName, instructions, agentModel } = await request.json();
    
    if (!agentName) {
      return NextResponse.json({ error: "Agent name is required" }, { status: 400 });
    }

    if(instructions){
      console.log("Update instruction");
      await updateAgentByName(agentName, { instructions });
    }
    if(agentModel){
      console.log("Update model");
      await updateAgentByName(agentName, { model: agentModel });
    }

    await fetch(refreshUrl, {method: "PUT"})

    // Reload agent để sử dụng instructions mới

    if(agentName === "Discovery & Requirements Agent") {
      await reloadDiscoveryAgent();
    } else if(agentName === "Analysis & Validation Agent") {
      await reloadAnalysisAgent();
    } else if(agentName === "Documentation Agent") {
      await reloadDocumentAgent();
    } else if(agentName === "Communication & Handoff Agent") {
      await reloadCommunicationAgent();
    }
    
    return NextResponse.json({ success: true, message: "Agent updated successfully" });
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}

