import { jsonrepair } from 'jsonrepair';
import z, { ZodType } from 'zod';
import { InnerAnalysisSchema, RawAgentResponseSchema } from '../models/schema/ai-response-schema';

export function safeJsonParse<T>(text: string, schema: ZodType<T,any, any>){
    try {
        // Bước 1: Sửa lỗi cú pháp JSON (dùng thư viện jsonrepair)
        const cleanText = jsonrepair(text);

        // Bước 2: Parse thành Object thô
        const objectJson = JSON.parse(cleanText);

        // Bước 3: Dùng Zod Schema để validate & ép kiểu (An toàn tuyệt đối)
        const result = schema.parse(objectJson)
        return result;
    } catch (error) {
        console.log("Cannot parse JSON: "+error);
    }
}


export function parseAgentResponseTwoSteps(rawJsonString: string){
    try {
        // --- BƯỚC 1: Parse lớp vỏ (Outer) ---
        // Dùng jsonrepair cho lớp vỏ trước để đảm bảo JSON hợp lệ
        const cleanOuter = jsonrepair(rawJsonString);

        console.log("cleanOuter: "+cleanOuter);
        const rawObj = JSON.parse(cleanOuter);
        
        // Validate lớp vỏ bằng Zod
        const outerResult = RawAgentResponseSchema.parse(rawObj);
        console.log("outerResult: "+outerResult);
        // --- BƯỚC 2: Parse lớp lõi (Inner) ---
        // Lấy string JSON từ trường text
        const innerJsonString = outerResult.data.output[0].text;
        
        // Clean và Parse string lồng bên trong
        const cleanInner = jsonrepair(innerJsonString);
        const innerObj = JSON.parse(cleanInner);

        // Validate lớp lõi bằng Zod
        const innerResult = InnerAnalysisSchema.parse(innerObj);

        // --- BƯỚC 3: Ghép lại thành kết quả hoàn chỉnh ---
        // Trả về object mới với cấu trúc đẹp, dễ dùng
        return {
            status: outerResult.status,
            tool_used: outerResult.tool_used,
            message: outerResult.message,
            data: {
                output: [{
                    extras: outerResult.data.output[0].extras,
                    parsedContent: innerResult // Dữ liệu đã sạch sẽ nằm ở đây
                }]
            }
        };

    } catch (error) {
        console.error("❌ Lỗi khi parse Agent Response:", error);
        
        // Log chi tiết để biết lỗi ở bước nào
        if (error instanceof z.ZodError) {
            console.error("Chi tiết lỗi Validation:", error.issues);
        }
        return null;
    }
}