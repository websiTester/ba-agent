import { jsonrepair } from "jsonrepair";
import z from "zod";

export const APIResultSchema = z.object({
    success: z.boolean(),
    response: z.string(),
    threadId: z.string()
})



// ---------------------------------------------------------
// 1. Định nghĩa Schema cho nội dung bên trong (Inner JSON)
// ---------------------------------------------------------

// Schema cho từng yêu cầu (dùng chung cho FR và NFR)
const RequirementItemSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    description: z.string(),
    rationale: z.string().optional(), // AI có thể đôi khi quên trường này
  });
  
  export const InnerAnalysisSchema = z.object({
    analysis_summary: z.string().optional(),
    functional_requirements: z.array(RequirementItemSchema).default([]),
    non_functional_requirements: z.array(RequirementItemSchema).default([]),
  });


// Type cho dữ liệu nghiệp vụ đã sạch
export type InnerAnalysisData = z.infer<typeof InnerAnalysisSchema>;

// ==========================================
// 2. OUTER SCHEMA: Dữ liệu thô từ API (Vỏ bọc)
// ==========================================
export const RawAgentResponseSchema = z.object({
  status: z.string(),
  tool_used: z.string().optional(),
  message: z.string().optional(),
  data: z.object({
    output: z.array(
      z.object({
        extras: z.object({
          signature: z.string().optional(),
        }).optional(),
        
        // --- THAY ĐỔI Ở ĐÂY ---
        // Chúng ta chỉ validate nó là string, KHÔNG transform/parse tại đây nữa
        text: z.string(), 
      })
    ).min(1, "Output array cannot be empty"),
  }),
});

// Type cho response thô
export type RawAgentResponse = z.infer<typeof RawAgentResponseSchema>;