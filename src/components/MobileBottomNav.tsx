import React from 'react';
import { Compass, Hash, Volume2, Users, Settings } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: 'chat' | 'voice' | 'friends';
  hasActiveVoice: boolean;
  onSelectView: (view: 'chat' | 'voice' | 'friends') => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  unreadCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  hasActiveVoice,
  onSelectView,
  onToggleSidebar,
  onOpenSettings,
  unreadCount = 0,
}) => {
  return (
    <div className="md:hidden min-h-14 pb-[env(safe-area-inset-bottom)] bg-[#07090e] border-t border-[#151c28] flex items-center justify-around px-2 z-40 flex-shrink-0 select-none">
      {/* Drawer / Channels button */}
      <button
        onClick={onToggleSidebar}
        title="Servers & Channels"
        className="flex flex-col items-center justify-center p-1.5 text-slate-400 hover:text-white transition-colors min-w-[50px]"
      >
        <Hash className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 font-medium">Channels</span>
      </button>

      {/* Friends & DMs */}
      <button
        onClick={() => onSelectView('friends')}
        title="Friends & DMs"
        className={`flex flex-col items-center justify-center p-1.5 transition-colors relative min-w-[50px] ${
          currentView === 'friends' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Friends</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full" />
        )}
      </button>

      {/* Active Voice / Stage */}
      {hasActiveVoice && (
        <button
          onClick={() => onSelectView('voice')}
          title="Active Voice & Stream"
          className={`flex flex-col items-center justify-center p-1.5 transition-colors relative min-w-[50px] ${
            currentView === 'voice'
              ? 'text-emerald-400 font-bold'
              : 'text-emerald-500/80 hover:text-emerald-400'
          }`}
        >
          <div className="relative">
            <Volume2 className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-[10px] mt-0.5">Voice</span>
        </button>
      )}

      {/* Current Chat View */}
      <button
        onClick={() => onSelectView('chat')}
        title="Chat"
        className={`flex flex-col items-center justify-center p-1.5 transition-colors min-w-[50px] ${
          currentView === 'chat' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Chat</span>
      </button>

      {/* Profile & Settings */}
      <button
        onClick={onOpenSettings}
        title="Settings"
        className="flex flex-col items-center justify-center p-1.5 text-slate-400 hover:text-white transition-colors min-w-[50px]"
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 font-medium">Settings</span>
      </button>
    </div>
  );
};
