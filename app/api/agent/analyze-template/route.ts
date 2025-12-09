import { getTemplateAnalyzeResult } from "@/app/mastra/template-analyze-agent";
import { NextRequest, NextResponse } from "next/server";
import { success } from "zod/v4";

export async function POST(request: NextRequest) {
    const { template } = await request.json();
    const response = await getTemplateAnalyzeResult(template);
    return NextResponse.json({ 
        success: true,
        response,
     });
}