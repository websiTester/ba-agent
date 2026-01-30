/**
 * Helper functions cho Sidebar
 */

/**
 * Lấy initials từ email
 * @param email - Email address
 * @returns Initials (2 ký tự đầu của username)
 */
export const getInitials = (email: string): string => {
  const name = email.split('@')[0];
  if (name.length >= 2) {
    return name.substring(0, 2).toUpperCase();
  }
  return name.toUpperCase();
};
