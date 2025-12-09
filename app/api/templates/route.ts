import { getAgentByName, updateAgentByName } from "@/app/db/agents";
import { createTemplate, deleteTemplate, getAllTemplates, getTemplatesByAgentId, setDefaultTemplate, updateTemplate, Template } from "@/app/db/templates";
import { reloadAnalysisAgent } from "@/app/mastra/analysis-agent";
import { reloadCommunicationAgent } from "@/app/mastra/communication-agent";
import { reloadDiscoveryAgent } from "@/app/mastra/discovery-agent";
import { reloadDocumentAgent } from "@/app/mastra/document-agent";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    let templates;
    if (agentId) {
      templates = await getTemplatesByAgentId(agentId);
    } else {
      templates = await getAllTemplates();
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}




export async function POST(request: NextRequest) {
  try {
    const { agentId, templateName, pair, isDefault } = await request.json();
    const templateData = { agentId, templateName, pair, isDefault };
    const result = await createTemplate(templateData);
    
    // Return the full template with the generated _id
    const createdTemplate = {
      _id: result.insertedId,
      ...templateData
    };
    
    return NextResponse.json(createdTemplate);
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { _id, templateName, pair, isDefault, createdBy, updatedAt } = await request.json();
    
    if (!_id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // const updateData: Partial<Template> = { 
    //   templateName, 
    //   pair, 
    //   isDefault,
    //   // Add createdBy if user is logged in
    //   ...(createdBy && { createdBy }),
    //   // Add updatedAt timestamp
    //   ...(updatedAt && { updatedAt: new Date(updatedAt) }),
    // };
    
    const updateData = { templateName, pair, isDefault };
    await updateTemplate(_id, updateData);
    
    return NextResponse.json({ success: true, _id, ...updateData });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    const result =await deleteTemplate(templateId??"");

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
}

// Set default template
export async function PATCH(request: NextRequest) {
  try {
    const { template, agentName } = await request.json();

    if (!template) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    await setDefaultTemplate(template._id);

    // Load current agent instructions from database
    const currentAgent = await getAgentByName(agentName);
    
    if (!currentAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Generate new requirements XML from template
    const newRequirements = `<requirements>
${template.pair
  .map(
    (pair: { header: string; content: string }) => `    <requirement>
      <name>${pair.header}</name>
      <description>${pair.header}: [${pair.content}]</description>
    </requirement>`
  )
  .join('\n')}
</requirements>`;

    // Replace old requirements section with new requirements in current instructions
    // Regex to match <requirements>...</requirements> section (including multiline content)
    const requirementsRegex = /<requirements>[\s\S]*?<\/requirements>/;
    
    let updatedInstructions: string;
    
    if (requirementsRegex.test(currentAgent.instructions)) {
      // Replace existing requirements section
      updatedInstructions = currentAgent.instructions.replace(requirementsRegex, newRequirements);
    } else {
      // If no requirements section exists, append before </instructions> or at the end
      const instructionsEndRegex = /<\/instructions>/;
      if (instructionsEndRegex.test(currentAgent.instructions)) {
        updatedInstructions = currentAgent.instructions.replace(instructionsEndRegex, `${newRequirements}\n</instructions>`);
      } else {
        // Append at the end if no </instructions> tag
        updatedInstructions = currentAgent.instructions + '\n' + newRequirements;
      }
    }

    // Update agent with new instructions
    await updateAgentByName(agentName, { instructions: updatedInstructions });
    console.log(`[Agent] Updated instructions`);
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

    return NextResponse.json({ success: true, message: "Default template updated", updatedInstructions });
  } catch (error) {
    console.error("Error setting default template:", error);
    return NextResponse.json({ error: "Failed to set default template" }, { status: 500 });
  }
}