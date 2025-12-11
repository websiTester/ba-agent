
interface SettingTabProps{
    activeTab: string;
    setActiveTab: any;
}

export default function SettingTab({activeTab, setActiveTab}: SettingTabProps) {
    return (
        <div className="flex border-b border-[#e5e7eb]">
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'templates'
                    ? 'text-[#f97316] border-b-2 border-[#f97316] bg-[#fff7ed]'
                    : 'text-[#6b7280] hover:text-[#1a1a2e] hover:bg-[#f9fafb]'
                }`}
              >
                Templates List
              </button>
              <button
                onClick={() => setActiveTab('structure')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'structure'
                    ? 'text-[#f97316] border-b-2 border-[#f97316] bg-[#fff7ed]'
                    : 'text-[#6b7280] hover:text-[#1a1a2e] hover:bg-[#f9fafb]'
                }`}
              >
                Template Structure
              </button>
              <button
                onClick={() => setActiveTab('agent')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'agent'
                    ? 'text-[#f97316] border-b-2 border-[#f97316] bg-[#fff7ed]'
                    : 'text-[#6b7280] hover:text-[#1a1a2e] hover:bg-[#f9fafb]'
                }`}
              >
                Agent Info
              </button>
            </div>
    );
}