export function parseJson(jsonString: string) {

    
    // 1. Tìm vị trí bắt đầu và kết thúc của mảng JSON
    const firstBracketIndex = jsonString.indexOf('[');
    const lastBracketIndex = jsonString.lastIndexOf(']');
    if (firstBracketIndex === -1 || lastBracketIndex === -1) {
        return null;
    }

    // 2. Lấy nội dung của mảng JSON
    // +1 ở lastBracket để lấy cả ký tự ] cuối cùng
    let jsonContent = jsonString.substring(firstBracketIndex, lastBracketIndex + 1);

    jsonContent = jsonContent
    .replace(/[\u0000-\u0019]+/g, "") // Loại bỏ các ký tự điều khiển rác (trừ các ký tự space thông thường)
    .replace(/\n/g, "\\n")            // Escape ký tự xuống dòng (nếu có)
    .replace(/\r/g, "\\r")            // Escape ký tự về đầu dòng (nếu có)
    .replace(/\t/g, "\\t");           // Escape ký tự Tab
    return JSON.parse(jsonContent);
}