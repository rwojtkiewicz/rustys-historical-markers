import React from 'react';
import { Car, Map, Route, Bookmark, Settings } from 'lucide-react';
import { UserSettings } from '../types';

interface BottomNavProps {
  activeTab: UserSettings['activeTab'];
  setActiveTab: (tab: UserSettings['activeTab']) => void;
  savedCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
}) => {
  const tabs = [
    { id: 'drive' as const, label: 'Drive Alert', icon: Car },
    { id: 'map' as const, label: 'Map View', icon: Map },
    { id: 'route' as const, label: 'Routes', icon: Route },
    { id: 'saved' as const, label: 'Saved', icon: Bookmark, badge: savedCount },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around z-20 shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition relative min-w-[58px] ${
              isActive
                ? 'text-amber-400 font-semibold bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400 scale-110' : ''}`} />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
