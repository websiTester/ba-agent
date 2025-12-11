// Function to read file content based on type
export const readFileContent = async (file: File): Promise<string> => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (file.type === 'text/plain' || extension === '.txt') {
      return await readTxtFile(file);
    } else if (file.type.includes('word') || extension === '.docx' || extension === '.doc') {
      return await readDocxFile(file);
    }
    
    throw new Error('Định dạng file không được hỗ trợ. Chỉ hỗ trợ .txt và .docx');
  };


// Function to read TXT file
const readTxtFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Không thể đọc file TXT'));
      reader.readAsText(file);
    });
  };
  
  // Function to read DOCX file
  const readDocxFile = async (file: File): Promise<string> => {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };