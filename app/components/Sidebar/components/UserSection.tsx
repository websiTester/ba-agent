/**
 * UserSection Component
 * Bottom section hiển thị user info và logout button
 */

import { LogIn, LogOut } from 'lucide-react';
import Link from 'next/link';
import { User } from '../types';
import { getInitials } from '../utils/helpers';

interface UserSectionProps {
  collapsed: boolean;
  user: User | null;
  onLogout: () => void;
}

export default function UserSection({ collapsed, user, onLogout }: UserSectionProps) {
  return (
    <div className="px-3 py-3 border-t border-[#e5e7eb] space-y-1 bg-[#fafbfc] flex-shrink-0">
      {user ? (
        <>
          {!collapsed ? (
            <div className="flex items-center gap-3 px-3 py-3 mt-1 bg-[#f3f4f6] rounded-lg">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-medium text-sm">
                {getInitials(user.email)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a1a2e] truncate">
                  {user.email.split('@')[0]}
                </p>
                <p className="text-xs text-[#6b7280] truncate">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#6b7280] hover:text-[#ef4444] transition-all duration-200"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-medium text-sm">
                {getInitials(user.email)}
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#6b7280] hover:text-[#ef4444] transition-all duration-200"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {!collapsed ? (
            <Link
              href="/login"
              className="flex items-center gap-3 px-3 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg hover:from-[#4f46e5] hover:to-[#7c3aed] transition-all duration-200 shadow-sm"
            >
              <LogIn size={18} />
              <span className="text-sm font-medium">Đăng nhập</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center p-2.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg hover:from-[#4f46e5] hover:to-[#7c3aed] transition-all duration-200"
              title="Đăng nhập"
            >
              <LogIn size={18} />
            </Link>
          )}
        </>
      )}
    </div>
  );
}
