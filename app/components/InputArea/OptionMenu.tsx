'use client';

import { ChevronRight, Settings, Sparkles } from "lucide-react";


interface OptionMenuProps {
    isObsidianMode: boolean;
    setIsObsidianMode: any;
    setIsSettingsOpen: any;
    setIsOptionsMenuOpen: any
}

export default function OptionMenu({
    isObsidianMode,
    setIsObsidianMode,
    setIsSettingsOpen,
    setIsOptionsMenuOpen
}: OptionMenuProps) {
    return (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl border border-[#e5e7eb] shadow-xl z-50 overflow-hidden animate-scale-in">
                        {/* Menu Header */}
                        <div className="px-4 py-3 border-b border-[#e5e7eb] bg-[#fafbfc]">
                          <p className="text-sm font-medium text-[#1a1a2e]">Tùy chọn</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {/* Save File Toggle */}
                          <div className="px-4 py-3 hover:bg-[#f9fafb] transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  isObsidianMode ? 'bg-[#7c3aed]' : 'bg-[#f3f4f6]'
                                }`}>
                                  <Sparkles size={16} className={isObsidianMode ? 'text-white' : 'text-[#6b7280]'} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[#1a1a2e]">Obsidian Agent</p>
                                  <p className="text-xs text-[#6b7280]">Kết nối với Obsidian vault</p>
                                </div>
                              </div>
                              {/* Toggle Switch */}
                              <button
                                type="button"
                                onClick={() => setIsObsidianMode(!isObsidianMode)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${
                                  isObsidianMode ? 'bg-[#7c3aed]' : 'bg-[#e5e7eb]'
                                }`}
                              >
                                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                                  isObsidianMode ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                          </div>
                          
                

                          {/* Divider */}
                          <div className="my-1 border-t border-[#e5e7eb]" />

                          {/* Settings */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsSettingsOpen(true);
                              setIsOptionsMenuOpen(false);
                            }}
                            className="w-full px-4 py-3 hover:bg-[#f9fafb] transition-colors flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#f3f4f6] flex items-center justify-center">
                              <Settings size={16} className="text-[#6b7280]" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-[#1a1a2e]">Settings</p>
                              <p className="text-xs text-[#6b7280]">Quản lý templates và agent</p>
                            </div>
                            <ChevronRight size={16} className="ml-auto text-[#9ca3af]" />
                          </button>
                        </div>
                      </div>
    );
}