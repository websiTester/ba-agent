import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config();

// Backend Python URL - sử dụng BASE_URL từ .env
const backendUrl = process.env.BASE_URL || "http://127.0.0.1:8000";

/**
 * GET - Lấy tất cả AI responses theo phaseId
 * 
 * Query params:
 * - phaseId: ID của phase cần lấy responses
 * 
 * Returns:
 * - success: boolean
 * - phase_id: string
 * - count: number
 * - data: array of AI responses
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phaseId = searchParams.get('phaseId');

    if (!phaseId) {
      return NextResponse.json(
        { error: "phaseId is required" }, 
        { status: 400 }
      );
    }

    console.log(`[API] Fetching AI responses for phase: ${phaseId}`);

    // Gọi API đến backend Python
    const response = await fetch(
      `${backendUrl}/agent_response/get_responses_by_phase/${phaseId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    console.log(`[API] ✅ Loaded ${data.count || 0} responses for phase: ${phaseId}`);

    return NextResponse.json(data);
    
  } catch (error) {
    console.error("[API] Error fetching AI responses:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch AI responses",
        data: []
      }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE - Xóa AI response theo phaseId và agent_source
 * 
 * Query params:
 * - phaseId: ID của phase
 * - agentSource: Tên của agent source cần xóa
 * 
 * Returns:
 * - success: boolean
 * - message: string
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phaseId = searchParams.get('phaseId');
    const agentSource = searchParams.get('agentSource');

    if (!phaseId || !agentSource) {
      return NextResponse.json(
        { error: "phaseId and agentSource are required" }, 
        { status: 400 }
      );
    }

    console.log(`[API] Deleting AI response for phase: ${phaseId}, agent_source: ${agentSource}`);

    // Gọi API đến backend Python
    const response = await fetch(
      `${backendUrl}/agent_response/delete_response/${phaseId}/${agentSource}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    console.log(`[API] ✅ Deleted response for phase: ${phaseId}, agent_source: ${agentSource}`);

    return NextResponse.json({
      success: true,
      message: `Deleted response for ${agentSource}`,
      ...data
    });
    
  } catch (error) {
    console.error("[API] Error deleting AI response:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to delete AI response"
      }, 
      { status: 500 }
    );
  }
}
