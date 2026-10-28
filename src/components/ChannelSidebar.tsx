import React, { useState } from 'react';
import { Server, Channel, User, VoiceParticipant } from '../types';
import {
  Hash,
  Volume2,
  Plus,
  ChevronDown,
  Settings,
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  ScreenShare,
  Users,
  UserPlus,
  Shield,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface ChannelSidebarProps {
  server: Server;
  activeChannelId: string;
  onSelectChannel: (channel: Channel) => void;
  onOpenCreateChannel: () => void;
  onOpenSettings: (initialTab?: string) => void;
  onOpenServerSettings: () => void;
  onDeleteChannel?: (channelId: string) => void;
  currentUser: User;
  connectedVoiceChannel: Channel | null;
  voiceParticipants: VoiceParticipant[];
  onDisconnectVoice: () => void;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleScreenShare: () => void;
  onOpenVoiceRoomView: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  server,
  activeChannelId,
  onSelectChannel,
  onOpenCreateChannel,
  onOpenSettings,
  onOpenServerSettings,
  onDeleteChannel,
  currentUser,
  connectedVoiceChannel,
  voiceParticipants,
  onDisconnectVoice,
  isMuted,
  isDeafened,
  isScreenSharing,
  onToggleMute,
  onToggleDeafen,
  onToggleScreenShare,
  onOpenVoiceRoomView,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Group channels by type
  const textChannels = server.channels.filter((c) => c.type === 'text');
  const voiceChannels = server.channels.filter((c) => c.type === 'voice');

  const isOwner = server.ownerId === currentUser.id;
  const userRole = server.roles?.[currentUser.id] || (isOwner ? 'owner' : 'member');
  const canManageChannels = isOwner || userRole === 'admin';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'idle':
        return 'bg-amber-500';
      case 'dnd':
        return 'bg-rose-500';
      default:
        return 'bg-slate-500';
    }
  };

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}?invite=${server.inviteCode || server.id.replace('server-', '')}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
      setDropdownOpen(false);
    }, 1500);
  };

  return (
    <div className="w-60 h-full bg-[#0a0d14] flex flex-col flex-shrink-0 border-r border-[#151c28] select-none">
      {/* Server Header Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full h-12 px-4 flex items-center justify-between border-b border-[#151c28] hover:bg-[#121722] transition-colors group cursor-pointer"
        >
          <div className="flex items-center space-x-2 truncate">
            <span className="text-sm">{server.icon}</span>
            <span className="font-semibold text-sm text-slate-100 truncate tracking-wide">
              {server.name}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Server Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute top-14 left-2 right-2 bg-[#121724] border border-[#1e293b] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                setDropdownOpen(false);
                onOpenServerSettings();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-[#1d273a] rounded-lg transition-colors cursor-pointer"
            >
              <span className="font-medium">Server Settings</span>
              <Settings className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={handleCopyInvite}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-cyan-300 hover:text-white hover:bg-cyan-600/30 rounded-lg transition-colors cursor-pointer mt-1"
            >
              <span>{copiedLink ? 'Copied Invite Link!' : 'Invite People'}</span>
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <UserPlus className="w-3.5 h-3.5" />}
            </button>

            {canManageChannels && (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenCreateChannel();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-indigo-300 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors cursor-pointer mt-1"
              >
                <span className="font-medium">Create Channel</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="h-[1px] bg-[#1e293b] my-1" />
            <div className="px-3 py-1.5 text-[10px] text-slate-400 truncate">
              {server.description || 'KEMOR Esports Community'}
            </div>
          </div>
        )}
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* TEXT CHANNELS */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Text Channels
            </span>
            {canManageChannels && (
              <button
                onClick={onOpenCreateChannel}
                title="Create Text Channel"
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {textChannels.map((channel) => {
              const isActive = activeChannelId === channel.id;
              return (
                <div key={channel.id} className="relative group/ch flex items-center">
                  <button
                    onClick={() => onSelectChannel(channel)}
                    className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-sm transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-[#182030] text-white font-medium shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#121722]'
                    }`}
                  >
                    <Hash className="w-4 h-4 mr-2 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
                    <span className="truncate flex-1 text-left">{channel.name}</span>
                  </button>

                  {canManageChannels && textChannels.length > 1 && onDeleteChannel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete #${channel.name}?`)) onDeleteChannel(channel.id);
                      }}
                      title="Delete Channel"
                      className="absolute right-2 opacity-0 group-hover/ch:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* VOICE CHANNELS */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Voice Rooms (48kHz)
            </span>
            {canManageChannels && (
              <button
                onClick={onOpenCreateChannel}
                title="Create Voice Channel"
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {voiceChannels.map((channel) => {
              const isVoiceConnected = connectedVoiceChannel?.id === channel.id;
              const isSelected = activeChannelId === channel.id;
              const participantsInThisChannel = voiceParticipants.filter(
                (p) => p.channelId === channel.id
              );

              return (
                <div key={channel.id} className="space-y-1">
                  <div className="relative group/vch flex items-center">
                    <button
                      onClick={() => onSelectChannel(channel)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-all group cursor-pointer ${
                        isSelected || isVoiceConnected
                          ? 'bg-[#182030] text-emerald-400 font-medium'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-[#121722]'
                      }`}
                    >
                      <div className="flex items-center truncate flex-1 min-w-0 mr-2">
                        <Volume2
                          className={`w-4 h-4 mr-2 flex-shrink-0 ${
                            isVoiceConnected
                              ? 'text-emerald-400 animate-pulse'
                              : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                        <span className="truncate">{channel.name}</span>
                      </div>

                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {isVoiceConnected ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                            LIVE
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {participantsInThisChannel.length}/{channel.capacity || 10}
                          </span>
                        )}
                      </div>
                    </button>

                    {canManageChannels && voiceChannels.length > 1 && onDeleteChannel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete voice room "${channel.name}"?`)) onDeleteChannel(channel.id);
                        }}
                        title="Delete Voice Room"
                        className="absolute right-2 opacity-0 group-hover/vch:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Connected members under voice channel */}
                  {participantsInThisChannel.length > 0 && (
                    <div className="pl-6 pr-2 space-y-1 py-1">
                      {participantsInThisChannel.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between py-1 px-2 rounded-md bg-[#121724]/60 text-xs text-slate-300"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <div className="relative flex-shrink-0">
                              <img
                                src={
                                  p.avatar ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80'
                                }
                                alt={p.name}
                                className={`w-5 h-5 rounded-full object-cover transition-all ${
                                  p.speaking
                                    ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-[#0c1017]'
                                    : ''
                                }`}
                              />
                              {p.speaking && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                              )}
                            </div>
                            <span className="truncate text-slate-200">
                              {p.name}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1 text-slate-400 flex-shrink-0">
                            {p.isScreenSharing && (
                              <ScreenShare className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                            {p.isMuted && (
                              <MicOff className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            {p.isDeafened && (
                              <Headphones className="w-3.5 h-3.5 text-rose-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Voice Connection Dock (if user is in voice channel) */}
      {connectedVoiceChannel && (
        <div className="p-3 bg-[#121724] border-t border-[#1e293b] flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div
              onClick={onOpenVoiceRoomView}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-emerald-400 group-hover:underline flex items-center space-x-1">
                  <span>Voice Connected</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                  {connectedVoiceChannel.name}
                </div>
              </div>
            </div>

            <button
              onClick={onDisconnectVoice}
              title="Disconnect Voice"
              className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Voice Bar Buttons */}
          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[#1e293b]/60">
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className={`flex items-center justify-center py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-[#182030] text-slate-300 hover:text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onToggleDeafen}
              title={isDeafened ? 'Undeafen' : 'Deafen'}
              className={`flex items-center justify-center py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                isDeafened
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-[#182030] text-slate-300 hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onToggleScreenShare}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              className={`flex items-center justify-center py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                isScreenSharing
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                  : 'bg-[#182030] text-slate-300 hover:text-white'
              }`}
            >
              <ScreenShare className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* User Profile Bar at bottom */}
      <div className="h-14 px-2 bg-[#06080d] border-t border-[#151c28] flex items-center justify-between flex-shrink-0">
        <div
          onClick={() => onOpenSettings('profile')}
          className="flex items-center space-x-2 p-1 rounded-lg hover:bg-[#121724] cursor-pointer transition-colors flex-1 min-w-0 mr-1"
        >
          <div className="relative flex-shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-[#1e293b]"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#06080d] ${getStatusColor(
                currentUser.status
              )}`}
            />
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-slate-100 truncate flex items-center space-x-1">
              <span className="truncate">{currentUser.name}</span>
              {currentUser.isEmailVerified ? (
                <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              #{currentUser.tag}
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-0.5 text-slate-400 flex-shrink-0">
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            className={`p-1.5 rounded-md hover:bg-[#1a2333] transition-colors cursor-pointer ${
              isMuted ? 'text-rose-400' : 'hover:text-slate-200'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggleDeafen}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
            className={`p-1.5 rounded-md hover:bg-[#1a2333] transition-colors cursor-pointer ${
              isDeafened ? 'text-rose-400' : 'hover:text-slate-200'
            }`}
          >
            <Headphones className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenSettings('profile')}
            title="User Settings"
            className="p-1.5 rounded-md hover:text-slate-200 hover:bg-[#1a2333] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
