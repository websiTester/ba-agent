'use client';

import { 
  Search, 
  FolderSearch,
  ClipboardCheck,
  FileText,
  Users,
  MessageSquare,
  ChevronLeft,
  LogIn,
  LogOut
} from 'lucide-react';
import { PhaseId } from '../types';
import Link from 'next/link';

export interface User {
  email: string;
}

interface SidebarProps {
  activePhase: PhaseId;
  onPhaseChange: (phase: PhaseId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: User | null;
  onLogout: () => void;
}

const phases = [
  {
    id: 'discovery' as PhaseId,
    name: 'Discovery & Requirements',
    shortName: 'Discovery',
    icon: FolderSearch,
    description: 'Thu thập và xác định yêu cầu',
    badge: null,
  },
  {
    id: 'analysis' as PhaseId,
    name: 'Analysis & Validation',
    shortName: 'Analysis',
    icon: ClipboardCheck,
    description: 'Phân tích và xác nhận',
    badge: null,
  },
  {
    id: 'documentation' as PhaseId,
    name: 'Documentation',
    shortName: 'Docs',
    icon: FileText,
    description: 'Tạo tài liệu BRD, FSD',
    badge: null,
  },
  {
    id: 'communication' as PhaseId,
    name: 'Communication & Handoff',
    shortName: 'Handoff',
    icon: Users,
    description: 'Giao tiếp và bàn giao',
    badge: null,
  }
];

export default function Sidebar({ activePhase, onPhaseChange, collapsed, onToggleCollapse, user, onLogout }: SidebarProps) {
  // Get initials from email
  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    if (name.length >= 2) {
      return name.substring(0, 2).toUpperCase();
    }
    return name.toUpperCase();
  };
  return (
    <aside 
      className={`
        flex flex-col h-screen bg-[#fafbfc] border-r border-[#e5e7eb]
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[70px]' : 'w-[260px]'}
      `}
    >
      {/* Logo & Brand */}
      <div className="relative flex items-center justify-between px-4 py-4 border-b border-[#e5e7eb]">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BA</span>
              </div>
              <span className="font-semibold text-[#1a1a2e] text-lg">BA Agent</span>
            </div>
            <button 
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] transition-all duration-200"
              title="Thu gọn sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center w-full gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BA</span>
            </div>
            <button 
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] transition-all duration-200"
              title="Mở rộng sidebar"
            >
              <ChevronLeft size={18} className="rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-[#6b7280] hover:bg-[#f3f4f6] rounded-lg transition-colors">
            <Search size={18} />
            <span className="text-sm">Search</span>
            <div className="ml-auto flex gap-1">
              <kbd className="px-1.5 py-0.5 text-xs bg-[#e5e7eb] rounded">⌘</kbd>
              <kbd className="px-1.5 py-0.5 text-xs bg-[#e5e7eb] rounded">K</kbd>
            </div>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {/* Quick Chat - thay thế vị trí Home */}
        <div className="mb-2">
          <button
            onClick={() => onPhaseChange('quick-chat')}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
              ${activePhase === 'quick-chat'
                ? 'bg-[#fff7ed] text-[#f97316] border border-[#fed7aa]' 
                : 'text-[#6b7280] hover:bg-[#f3f4f6]'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? 'Quick Chat' : undefined}
          >
            <MessageSquare size={18} className={activePhase === 'quick-chat' ? 'text-[#f97316]' : ''} />
            {!collapsed && <span className="text-sm font-medium">Quick Chat</span>}
          </button>
        </div>

        {!collapsed && (
          <div className="px-3 py-2">
            <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Phases</span>
          </div>
        )}

        <div className="space-y-1">
          {phases.map((phase) => {
            const Icon = phase.icon;
            const isActive = activePhase === phase.id;
            
            return (
              <button
                key={phase.id}
                onClick={() => onPhaseChange(phase.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-[#fff7ed] text-[#f97316] border border-[#fed7aa]' 
                    : 'text-[#6b7280] hover:bg-[#f3f4f6]'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? phase.name : undefined}
              >
                <Icon size={18} className={isActive ? 'text-[#f97316]' : ''} />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium truncate">{phase.shortName}</span>
                    {phase.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-[#3b82f6] text-white rounded-full">
                        {phase.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-3 border-t border-[#e5e7eb] space-y-1">
        {user ? (
          // User is logged in - show user info
          <>
            {!collapsed ? (
              <div className="flex items-center gap-3 px-3 py-3 mt-2 bg-[#f3f4f6] rounded-lg">
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
          // User is not logged in - show login button
          <>
            {!collapsed ? (
              <Link
                href="/login"
                className="flex items-center gap-3 px-3 py-3 mt-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg hover:from-[#4f46e5] hover:to-[#7c3aed] transition-all duration-200"
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
    </aside>
  );
}
