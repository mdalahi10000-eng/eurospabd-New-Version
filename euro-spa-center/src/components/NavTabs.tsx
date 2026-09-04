export type TabType = 'overview' | 'services' | 'photos' | 'reviews' | 'location';

interface NavTabsProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export function NavTabs({ activeTab, onSelectTab }: NavTabsProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'services', label: 'SERVICES' },
    { id: 'photos', label: 'PHOTOS' },
    { id: 'reviews', label: 'REVIEWS' },
    { id: 'location', label: 'LOCATION' }
  ];

  return (
    <nav className="w-full border-b border-gray-200 bg-white sticky top-0 z-20">
      <div className="flex items-center justify-between sm:justify-start sm:gap-2 overflow-x-auto no-scrollbar px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 sm:flex-initial text-center py-3 px-3 text-xs sm:text-sm font-bold tracking-wider whitespace-nowrap transition-colors cursor-pointer relative ${
                isActive 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

