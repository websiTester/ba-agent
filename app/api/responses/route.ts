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
