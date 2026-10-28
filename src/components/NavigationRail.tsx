import React from 'react';
import { Server, User } from '../types';
import { KemorLogo } from './KemorLogo';
import { Plus, UserPlus, Info } from 'lucide-react';

interface NavigationRailProps {
  servers: Server[];
  activeServerId: string | null; // null means Direct Messages / Home
  onSelectServer: (serverId: string | null) => void;
  onOpenCreateServer: () => void;
  onOpenJoinServer: () => void;
  onOpenSystemInfo: () => void;
  currentUser: User;
  unreadCount?: number;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  servers,
  activeServerId,
  onSelectServer,
  onOpenCreateServer,
  onOpenJoinServer,
  onOpenSystemInfo,
  currentUser,
  unreadCount = 0,
}) => {
  return (
    <nav
      aria-label="Server navigation"
      className="w-[72px] h-full bg-[#05070c] flex flex-col items-center py-3 select-none flex-shrink-0 z-30 border-r border-[#151c28]"
    >
      {/* KEMOR Home / Direct Messages Button */}
      <div className="relative group flex items-center justify-center w-full my-1">
        {/* Left Indicator Pill */}
        <div
          className={`absolute left-0 w-1 bg-cyan-400 rounded-r-full transition-all duration-200 ${
            activeServerId === null ? 'h-10' : 'h-0 group-hover:h-5'
          }`}
        />
        <button
          onClick={() => onSelectServer(null)}
          title="Direct Messages & Friends"
          className={`relative w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center font-bold text-white shadow-lg cursor-pointer ${
            activeServerId === null
              ? 'bg-gradient-to-br from-cyan-500 via-indigo-600 to-fuchsia-600 rounded-[16px] shadow-cyan-500/25 ring-2 ring-cyan-400'
              : 'bg-[#121724] hover:bg-[#1a2333] text-slate-300 hover:text-white'
          }`}
        >
          <KemorLogo size="sm" showText={false} />
          {unreadCount > 0 && activeServerId !== null && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#05070c]">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="w-8 h-[2px] bg-[#1a2333] my-2 rounded-full" />

      {/* Servers List */}
      <div className="flex-1 w-full flex flex-col items-center space-y-2 overflow-y-auto no-scrollbar">
        {servers.map((server) => {
          const isActive = activeServerId === server.id;
          return (
            <div key={server.id} className="relative group flex items-center justify-center w-full">
              <div
                className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
                  isActive ? 'h-10' : 'h-0 group-hover:h-5'
                }`}
              />
              <button
                onClick={() => onSelectServer(server.id)}
                title={server.name}
                className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center text-lg font-semibold shadow-md overflow-hidden cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-br from-cyan-600 to-indigo-600 text-white rounded-[16px] shadow-cyan-500/20 ring-2 ring-cyan-400'
                    : 'bg-[#121724] hover:bg-[#1b2436] text-slate-200 hover:text-white'
                }`}
              >
                {server.icon.length <= 2 ? (
                  <span className="text-xl">{server.icon}</span>
                ) : (
                  <span className="text-xs uppercase font-bold tracking-wider px-1 text-center">
                    {server.name.slice(0, 3)}
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* Create Server Button */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={onOpenCreateServer}
            title="Create a Server"
            className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 bg-[#121724] hover:bg-emerald-600 text-emerald-400 hover:text-white flex items-center justify-center shadow-md cursor-pointer group"
          >
            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-200" />
          </button>
        </div>

        {/* Join Server with Invite Link Button */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={onOpenJoinServer}
            title="Join Server with Invite Code"
            className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 bg-[#121724] hover:bg-cyan-600 text-cyan-400 hover:text-white flex items-center justify-center shadow-md cursor-pointer group"
          >
            <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110 duration-200" />
          </button>
        </div>
      </div>

      {/* System Status / Architecture info button at bottom */}
      <div className="mt-auto flex flex-col items-center space-y-3 pt-2">
        <button
          onClick={onOpenSystemInfo}
          title="System Architecture & Limitations"
          className="w-10 h-10 rounded-full bg-[#121724] hover:bg-indigo-900/60 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-all border border-[#1e293b] cursor-pointer"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
