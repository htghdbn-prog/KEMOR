import React, { useState } from 'react';
import { Server, User } from '../types';
import {
  X,
  Settings,
  Shield,
  Users,
  Link,
  Copy,
  Check,
  Trash2,
  LogOut,
  Crown,
  Sparkles,
} from 'lucide-react';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: Server;
  currentUser: User;
  allUsers: User[];
  onUpdateServer: (serverId: string, data: Partial<Server>) => void;
  onDeleteServer: (serverId: string) => void;
  onLeaveServer: (serverId: string) => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  isOpen,
  onClose,
  server,
  currentUser,
  allUsers,
  onUpdateServer,
  onDeleteServer,
  onLeaveServer,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'invites'>('overview');
  const [name, setName] = useState(server.name);
  const [icon, setIcon] = useState(server.icon);
  const [description, setDescription] = useState(server.description || '');
  const [inviteCode, setInviteCode] = useState(server.inviteCode || server.id.replace('server-', ''));
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const isOwner = server.ownerId === currentUser.id;
  const userRole = server.roles?.[currentUser.id] || (isOwner ? 'owner' : 'member');
  const canManage = isOwner || userRole === 'admin';

  const icons = ['🎮', '⚡', '💎', '🔥', '🚀', '🎧', '👾', '👑', '🌌', '💻', '🎯', '🏆'];

  const inviteUrl = `${window.location.origin}?invite=${inviteCode}`;

  const handleSaveOverview = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateServer(server.id, {
      name: name.trim() || server.name,
      icon,
      description: description.trim(),
      inviteCode: inviteCode.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const serverMembers = allUsers.filter((u) => server.memberIds.includes(u.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 md:backdrop-blur-md flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-150">
      <div className="w-full h-full md:h-[85vh] md:max-h-[680px] md:max-w-3xl bg-[#0c1017] border-0 md:border md:border-[#1e293b] rounded-none md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative pb-[env(safe-area-inset-bottom)] md:pb-0">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-4 md:top-4 md:right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-[#1a2333] transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Sidebar */}
        <div className="w-full md:w-56 bg-[#07090e] border-b md:border-b-0 md:border-r border-[#151c28] px-3 py-2 md:p-4 flex md:flex-col justify-between overflow-x-auto no-scrollbar flex-shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-4">
          <div className="space-y-0 md:space-y-1 w-full flex md:flex-col space-x-1.5 md:space-x-0">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:block">
              {server.name}
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131924]'
              }`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'roles'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131924]'
              }`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>Members & Roles</span>
            </button>

            <button
              onClick={() => setActiveTab('invites')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'invites'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131924]'
              }`}
            >
              <Link className="w-4 h-4 flex-shrink-0 text-cyan-400" />
              <span>Invites & Links</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#1a2333] hidden md:block space-y-2">
            {!isOwner && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to leave ${server.name}?`)) {
                    onLeaveServer(server.id);
                    onClose();
                  }
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Server</span>
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`DANGER: Are you sure you want to permanently delete "${server.name}"? This cannot be undone.`)) {
                    onDeleteServer(server.id);
                    onClose();
                  }
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Server</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-xl animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">Server Overview</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize your server appearance and public details.
                </p>
              </div>

              <form onSubmit={handleSaveOverview} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Server Icon
                  </label>
                  <div className="flex items-center space-x-2 overflow-x-auto py-1">
                    {icons.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${
                          icon === ic
                            ? 'border-indigo-400 bg-indigo-600/30 scale-110 shadow-md ring-2 ring-indigo-500/40'
                            : 'border-[#1e293b] bg-[#121724] hover:bg-[#182030]'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Server Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    disabled={!canManage}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#121724] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    disabled={!canManage}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#121724] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                {canManage && (
                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Save Changes
                    </button>
                    {savedSuccess && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1 animate-in fade-in">
                        <Check className="w-4 h-4" />
                        <span>Server updated!</span>
                      </span>
                    )}
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4 max-w-xl animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Members ({serverMembers.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  All active participants in {server.name}. Server owners and admins have moderation privileges.
                </p>
              </div>

              <div className="space-y-2">
                {serverMembers.map((member) => {
                  const isMemberOwner = server.ownerId === member.id;
                  const memberRole = server.roles?.[member.id] || (isMemberOwner ? 'owner' : 'member');
                  return (
                    <div
                      key={member.id}
                      className="p-3 bg-[#121724] border border-[#1e293b] rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#232f45]"
                        />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate flex items-center space-x-1.5">
                            <span>{member.name}</span>
                            {isMemberOwner && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400">#{member.tag}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isMemberOwner
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : memberRole === 'admin'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : memberRole === 'moderator'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-[#1e293b] text-slate-400'
                          }`}
                        >
                          {isMemberOwner ? 'OWNER' : memberRole.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'invites' && (
            <div className="space-y-6 max-w-xl animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">Invite Links</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Share this secure link with your esports squad or friends to invite them to this server.
                </p>
              </div>

              <div className="p-4 bg-[#121724] border border-[#1e293b] rounded-2xl space-y-3">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Invite Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="flex-1 bg-[#0a0f1d] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer flex-shrink-0"
                  >
                    {copiedInvite ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedInvite ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400">
                  Invite Code: <span className="font-mono text-white bg-black/40 px-2 py-0.5 rounded">{inviteCode}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
