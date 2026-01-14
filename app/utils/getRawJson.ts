export function getRawJson(text: string){
    const firstOpen = text.indexOf("{");
    const lastClose = text.lastIndexOf("}");

    if(firstOpen > -1 && lastClose > -1 && firstOpen < lastClose){
        const rawJson = text.substring(firstOpen, lastClose+1);

        // BƯỚC QUAN TRỌNG: Sửa lỗi Bad escaped character
        // Logic: Tìm các dấu \ không đi kèm với các ký tự hợp lệ (" \ / b f n r t u) và nhân đôi nó lên
        const sanitizedJson = rawJson.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
        return sanitizedJson;
    }

    return "Invalid JSON format";
}