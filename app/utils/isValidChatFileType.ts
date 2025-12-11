const ALLOWED_CHAT_FILE_TYPES = [
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  
  const ALLOWED_CHAT_EXTENSIONS = ['.txt', '.docx', '.doc'];
  

export const isValidChatFileType = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ALLOWED_CHAT_FILE_TYPES.includes(file.type) || ALLOWED_CHAT_EXTENSIONS.includes(extension);
  };