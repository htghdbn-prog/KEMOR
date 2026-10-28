import React, { useState } from 'react';
import { User, DirectMessage } from '../types';
import {
  MessageSquare,
  UserPlus,
  Users,
  Search,
  Phone,
  Video,
  MoreVertical,
  Check,
  X,
  Send,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface FriendsViewProps {
  currentUser: User;
  allUsers: User[];
  directMessages: DirectMessage[];
  onSendDirectMessage: (targetUserId: string, content: string) => void;
  onLoadDmMessages?: (messages: DirectMessage[]) => void;
  onStartDirectCall: (targetUser: User) => void;
  onOpenSettings: (tab?: string) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  currentUser,
  allUsers,
  directMessages,
  onSendDirectMessage,
  onLoadDmMessages,
  onStartDirectCall,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'dms' | 'pending' | 'add'>('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDmUser, setActiveDmUser] = useState<User | null>(null);
  const [dmInput, setDmInput] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addSuccessMsg, setAddSuccessMsg] = useState('');

  // Other users except current
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id && u.id !== 'kemor-bot');

  const filteredUsers = otherUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.tag.includes(searchQuery);

    if (activeTab === 'online') {
      return matchesSearch && u.status !== 'offline';
    }
    return matchesSearch;
  });

  const getConversationId = (u1: string, u2: string) => {
    return [u1, u2].sort().join('_');
  };

  const currentDmId = activeDmUser ? getConversationId(currentUser.id, activeDmUser.id) : null;

  // Deduplicate direct messages by ID to guarantee unique React keys
  const currentDmMessages = React.useMemo(() => {
    if (!currentDmId) return [];
    const seen = new Set<string>();
    return directMessages.filter((m) => {
      if (m.conversationId !== currentDmId) return false;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [directMessages, currentDmId]);

  // Load conversation history from backend when active DM opens
  React.useEffect(() => {
    if (!currentDmId || !onLoadDmMessages) return;
    fetch(`/api/dms/${currentDmId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          onLoadDmMessages(data);
        }
      })
      .catch((err) => console.warn('Fetch DMs error:', err));
  }, [currentDmId, onLoadDmMessages]);

  const handleSendDm = () => {
    if (!activeDmUser || !dmInput.trim()) return;
    onSendDirectMessage(activeDmUser.id, dmInput.trim());
    setDmInput('');
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendInput.trim()) return;
    setAddSuccessMsg(`Friend request sent to "${addFriendInput.trim()}"!`);
    setAddFriendInput('');
    setTimeout(() => setAddSuccessMsg(''), 4000);
  };

  return (
    <div className="flex-1 h-full w-full max-w-full bg-[#0c1017] flex flex-col overflow-hidden select-none">
      {/* Top Bar with Friends Tabs */}
      <div className="h-12 px-3 sm:px-6 border-b border-[#151c28] flex items-center justify-between bg-[#0e131d]/60 backdrop-blur-sm z-10 flex-shrink-0 min-w-0">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-slate-100 font-bold text-xs sm:text-sm tracking-wide flex-shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            <span>Friends</span>
          </div>

          <div className="w-[1px] h-4 bg-[#1e293b] flex-shrink-0 hidden sm:block" />

          {/* Navigation Tabs - Horizontally scrollable without clipping on mobile */}
          <div className="flex items-center space-x-1 text-xs font-semibold overflow-x-auto no-scrollbar py-1 min-w-0 flex-1">
            <button
              onClick={() => {
                setActiveTab('online');
                setActiveDmUser(null);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'online' && !activeDmUser
                  ? 'bg-[#1e273a] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Online ({otherUsers.filter((u) => u.status !== 'offline').length})
            </button>

            <button
              onClick={() => {
                setActiveTab('all');
                setActiveDmUser(null);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'all' && !activeDmUser
                  ? 'bg-[#1e273a] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({otherUsers.length})
            </button>

            {/* Direct Messages Tab visible on small screens so mobile users have quick access */}
            <button
              onClick={() => {
                setActiveTab('dms');
                setActiveDmUser(null);
              }}
              className={`md:hidden px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'dms' && !activeDmUser
                  ? 'bg-[#1e273a] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DMs ({otherUsers.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('pending');
                setActiveDmUser(null);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'pending' && !activeDmUser
                  ? 'bg-[#1e273a] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending
            </button>

            <button
              onClick={() => {
                setActiveTab('add');
                setActiveDmUser(null);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors font-bold whitespace-nowrap flex-shrink-0 ${
                activeTab === 'add' && !activeDmUser
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
              }`}
            >
              Add Friend
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden w-full max-w-full">
        {/* Left DM Sidebar / Conversations list - Visible on Desktop; on mobile, shown when DMs tab is active */}
        <div
          className={`${
            activeDmUser ? 'hidden md:flex' : activeTab === 'dms' ? 'flex w-full' : 'hidden md:flex'
          } md:w-64 h-full bg-[#0a0d14] border-r border-[#151c28] p-3 flex-col space-y-3 flex-shrink-0 min-w-0`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center justify-between">
            <span>Direct Messages</span>
            <span className="text-[10px] text-slate-500 font-normal">{otherUsers.length} conversations</span>
          </div>

          <div className="space-y-1 overflow-y-auto flex-1">
            {otherUsers.map((user) => {
              const isSelected = activeDmUser?.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => setActiveDmUser(user)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-[#182030] text-white shadow-sm ring-1 ring-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121722]'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#1e293b]"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0d14] ${
                        user.status === 'online'
                          ? 'bg-emerald-500'
                          : user.status === 'idle'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                  <div className="truncate text-left flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {user.customStatus || `@${user.name.toLowerCase()}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active View: Direct Message Conversation or Friends Directory */}
        {activeDmUser ? (
          /* Direct Message Chat View */
          <div className="flex-1 flex flex-col h-full bg-[#0c1017] min-w-0 w-full">
            {/* DM Header */}
            <div className="h-12 px-3 sm:px-6 border-b border-[#151c28] flex items-center justify-between bg-[#0e131d]/60 flex-shrink-0 min-w-0">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                {/* Back button on mobile to return to friends / conversation list */}
                <button
                  onClick={() => setActiveDmUser(null)}
                  className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Back to Friends"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative flex-shrink-0">
                  <img
                    src={activeDmUser.avatar}
                    alt={activeDmUser.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${
                      activeDmUser.status === 'online'
                        ? 'bg-emerald-500'
                        : activeDmUser.status === 'idle'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
                <div className="truncate min-w-0">
                  <h3 className="text-sm font-bold text-slate-100 truncate">{activeDmUser.name}</h3>
                  <span className="text-[10px] text-slate-400">#{activeDmUser.tag}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => onStartDirectCall(activeDmUser)}
                  title="Start Voice Call"
                  className="p-2 bg-[#182030] hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* DM Messages Feed */}
            <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 min-w-0">
              <div className="pb-4 sm:pb-6 border-b border-[#182030]">
                <img
                  src={activeDmUser.avatar}
                  alt={activeDmUser.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-indigo-500/40 mb-3"
                />
                <h2 className="text-lg sm:text-xl font-bold text-white">{activeDmUser.name}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  This is the beginning of your direct message history with {activeDmUser.name}.
                </p>
              </div>

              {currentDmMessages.map((dm, idx) => (
                <div key={dm.id ? `${dm.id}-${idx}` : `dm-${idx}`} className="flex items-start space-x-3 min-w-0">
                  <img
                    src={dm.authorAvatar}
                    alt={dm.authorName}
                    className="w-8 h-8 rounded-full object-cover border border-[#1e293b] flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-slate-200">
                        {dm.authorName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(dm.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-0.5 select-text break-words leading-relaxed">
                      {dm.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* DM Input Bar */}
            <div className="p-2 sm:p-4 bg-[#0c1017] flex-shrink-0">
              <div className="bg-[#121724] border border-[#1e293b] rounded-2xl flex items-center px-3 sm:px-4 py-2 focus-within:border-indigo-500/80">
                <input
                  type="text"
                  value={dmInput}
                  onChange={(e) => setDmInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendDm()}
                  placeholder={`Message @${activeDmUser.name}...`}
                  className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none px-1 sm:px-2 min-w-0"
                />
                <button
                  onClick={handleSendDm}
                  disabled={!dmInput.trim()}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'add' ? (
          /* Add Friend Tab */
          <div className="flex-1 p-4 sm:p-8 max-w-2xl min-w-0 overflow-y-auto">
            <h2 className="text-base font-bold uppercase tracking-wider text-white mb-2">
              Add Friend
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              You can add friends with their KEMOR Tag. It's case-sensitive!
            </p>

            <form onSubmit={handleAddFriend} className="space-y-4">
              <div className="bg-[#121724] border border-[#1e293b] rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center p-2 sm:px-4 sm:py-3 gap-2 focus-within:border-emerald-500/80 transition-all">
                <input
                  type="text"
                  value={addFriendInput}
                  onChange={(e) => setAddFriendInput(e.target.value)}
                  placeholder="Enter a Username#0000 or email"
                  className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none px-2 py-1"
                />
                <button
                  type="submit"
                  disabled={!addFriendInput.trim()}
                  className="px-4 py-2 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex-shrink-0"
                >
                  Send Friend Request
                </button>
              </div>

              {addSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>{addSuccessMsg}</span>
                </div>
              )}
            </form>
          </div>
        ) : activeTab === 'dms' ? (
          /* On mobile, if DMs tab is selected and on desktop where sidebar handles it */
          <div className="hidden md:flex flex-1 items-center justify-center text-slate-500 text-xs italic">
            Select a conversation from the left Direct Messages list.
          </div>
        ) : (
          /* Online or All Friends Directory - Responsive single-column cards on mobile */
          <div className="flex-1 p-3 sm:p-6 flex flex-col overflow-y-auto space-y-3 sm:space-y-4 min-w-0 w-full">
            {/* Search Input */}
            <div className="bg-[#121724] border border-[#1e293b] rounded-xl flex items-center px-3 py-2 w-full max-w-md">
              <Search className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full min-w-0"
              />
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {activeTab === 'online' ? 'Online Friends' : 'All Friends'} — {filteredUsers.length}
            </div>

            <div className="space-y-2 w-full">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  No friends found matching your search.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 bg-[#121724] border border-[#1a2333] hover:border-[#26344d] rounded-2xl flex items-center justify-between group transition-all w-full min-w-0 gap-2"
                  >
                    {/* User info: Avatar + Names */}
                    <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#1e293b]"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#121724] ${
                            user.status === 'online'
                              ? 'bg-emerald-500'
                              : user.status === 'idle'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white flex items-center space-x-1.5 truncate">
                          <span className="truncate">{user.name}</span>
                          <span className="text-xs text-slate-400 font-normal flex-shrink-0">#{user.tag}</span>
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {user.customStatus || user.bio}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons: Direct Message and Start Call */}
                    <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                      <button
                        onClick={() => setActiveDmUser(user)}
                        title="Send Direct Message"
                        className="p-2 sm:p-2.5 bg-[#182030] hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onStartDirectCall(user)}
                        title="Start Voice Call"
                        className="p-2 sm:p-2.5 bg-[#182030] hover:bg-emerald-600 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
