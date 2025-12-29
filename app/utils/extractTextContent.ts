// Helper: Extract text content from file based on type (chỉ hỗ trợ txt và docx)
export async function extractTextContent(file: File, buffer: Buffer): Promise<string> {
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();
  
    try {
      // Plain text file (.txt)
      if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
        return buffer.toString('utf-8');
      }
  
      // Word document (.docx, .doc)
      if (mimeType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      }
  
      // Fallback: try to read as text
      return buffer.toString('utf-8');
    } catch (error) {
      console.error('Error extracting text content:', error);
      return '';
    }
  }