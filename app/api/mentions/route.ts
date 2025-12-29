import { getAllMentions } from "@/app/db/tools";
import { NextRequest, NextResponse } from "next/server";

// GET - Lấy tất cả mentions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phaseId = searchParams.get('phaseId');

    const mentions = await getAllMentions();
    
    // Nếu có phaseId, filter theo phaseId
    const filteredMentions = phaseId 
      ? mentions.filter(m => m.phaseId === phaseId || !m.phaseId) // Lấy mentions của phase đó + mentions global
      : mentions;

    // Chuyển đổi ObjectId thành string để gửi qua JSON
    const formattedMentions = filteredMentions.map(mention => ({
      id: mention._id?.toString(),
      label: mention.label,
      description: mention.description,
      type: mention.type,
      fileId: mention.fileId,
      phaseId: mention.phaseId,
      toolId: mention.toolId,
    }));

    return NextResponse.json(formattedMentions);
  } catch (error) {
    console.error("Error fetching mentions:", error);
    return NextResponse.json({ error: "Failed to fetch mentions" }, { status: 500 });
  }
}

