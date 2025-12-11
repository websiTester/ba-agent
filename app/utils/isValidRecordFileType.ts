const ALLOWED_RECORD_EXTENSIONS = ['.mp3', '.mp4', '.wav'];

export const isValidRecordFileType = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ALLOWED_RECORD_EXTENSIONS.includes(extension);
  };