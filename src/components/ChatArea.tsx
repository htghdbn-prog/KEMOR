import React, { useState, useRef, useEffect } from 'react';
import { Channel, Message, User, Server, MessageReply } from '../types';
import {
  Hash,
  Search,
  Pin,
  Users,
  Smile,
  Paperclip,
  Send,
  X,
  Trash2,
  Check,
  Reply,
  CornerDownRight,
  Sparkles,
} from 'lucide-react';

interface ChatAreaProps {
  channel: Channel;
  server?: Server;
  messages: Message[];
  currentUser: User;
  onSendMessage: (content: string, attachments?: string[], replyTo?: MessageReply) => void;
  onReactMessage: (messageId: string, emoji: string) => void;
  onPinMessage: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onTyping: () => void;
  typingUsers: string[];
  allUsers: User[];
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  channel,
  server,
  messages,
  currentUser,
  onSendMessage,
  onReactMessage,
  onPinMessage,
  onDeleteMessage,
  onTyping,
  typingUsers,
  allUsers,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [showMembers, setShowMembers] = useState(true);
  const [showPinned, setShowPinned] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const emojiList = ['🔥', '💜', '🎮', '👍', '✨', '😂', '🚀', '💯', '❤️', '👀', '🏆', '⚡'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;

    const replyData: MessageReply | undefined = replyingTo
      ? {
          id: replyingTo.id,
          authorName: replyingTo.authorName,
          content: replyingTo.content.substring(0, 80),
        }
      : undefined;

    onSendMessage(inputText, attachments, replyData);
    setInputText('');
    setAttachments([]);
    setReplyingTo(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAttachments((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const pinnedMessages = messages.filter((m) => m.isPinned);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 h-full bg-[#0a0d14] flex flex-col min-w-0 select-text overflow-hidden">
      {/* Channel Header */}
      <div className="h-12 px-4 border-b border-[#151c28] flex items-center justify-between bg-[#0c1017]/80 backdrop-blur-md z-10 select-none flex-shrink-0">
        <div className="flex items-center space-x-2 truncate">
          <Hash className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <h2 className="font-bold text-sm text-slate-100 truncate tracking-wide">
            {channel.name}
          </h2>
          {channel.topic && (
            <>
              <div className="w-[1px] h-4 bg-[#1e293b] mx-2 hidden sm:block" />
              <p className="text-xs text-slate-400 truncate hidden sm:block max-w-md">
                {channel.topic}
              </p>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2 select-none">
          <button
            onClick={() => setShowPinned(!showPinned)}
            title="Pinned Messages"
            className={`p-1.5 rounded-lg transition-colors relative cursor-pointer ${
              showPinned
                ? 'bg-cyan-600/30 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#131924]'
            }`}
          >
            <Pin className="w-4 h-4" />
            {pinnedMessages.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setShowMembers(!showMembers)}
            title="Toggle Member List"
            className={`p-1.5 rounded-lg transition-colors hidden md:block cursor-pointer ${
              showMembers
                ? 'bg-cyan-600/30 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#131924]'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Messages Popover Header */}
      {showPinned && (
        <div className="bg-[#121724] border-b border-cyan-900/30 p-3 flex flex-col space-y-2 max-h-56 overflow-y-auto animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
            <span className="flex items-center space-x-1">
              <Pin className="w-3.5 h-3.5" />
              <span>Pinned Messages ({pinnedMessages.length})</span>
            </span>
            <button
              onClick={() => setShowPinned(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {pinnedMessages.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No pinned messages yet.</p>
          ) : (
            pinnedMessages.map((m) => (
              <div
                key={m.id}
                className="bg-[#182030] p-2.5 rounded-lg border border-[#1e293b] text-xs flex items-start justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-200 mr-2">{m.authorName}:</span>
                  <span className="text-slate-300">{m.content}</span>
                </div>
                <button
                  onClick={() => onPinMessage(m.id)}
                  title="Unpin"
                  className="text-slate-500 hover:text-rose-400 ml-2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Main Chat Feed */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Welcome Banner */}
            <div className="pt-6 pb-4 border-b border-[#182030]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2 shadow-lg shadow-cyan-500/10">
                <Hash className="w-6 h-6" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white mb-0.5">
                Welcome to #{channel.name}!
              </h1>
              <p className="text-xs text-slate-400">
                This is the start of the #{channel.name} channel. Share messages, esports clips, or jump into voice!
              </p>
            </div>

            {/* Messages list */}
            {messages.map((msg, idx) => {
              const isOwner = msg.authorRole?.includes('OWNER');
              const isBot = msg.authorRole?.includes('BOT') || msg.authorId.includes('bot');

              return (
                <div
                  key={msg.id ? `${msg.id}-${idx}` : `msg-${idx}`}
                  className={`relative group flex items-start space-x-3 px-2 py-1 -mx-2 rounded-xl hover:bg-[#0f1422] transition-colors ${
                    msg.isPinned ? 'bg-cyan-950/15 border-l-2 border-cyan-400 pl-3' : ''
                  }`}
                >
                  {/* Avatar */}
                  <img
                    src={msg.authorAvatar}
                    alt={msg.authorName}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5 border border-[#1e293b]"
                  />

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    {/* Reply Quote Preview */}
                    {msg.replyTo && (
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1 pl-2 border-l-2 border-cyan-500/40">
                        <CornerDownRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        <span className="font-semibold text-slate-300 truncate">
                          @{msg.replyTo.authorName}
                        </span>
                        <span className="truncate text-slate-400">{msg.replyTo.content}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-slate-100 hover:underline cursor-pointer">
                        {msg.authorName}
                      </span>

                      {/* Badges */}
                      {isBot && (
                        <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                          SYSTEM
                        </span>
                      )}
                      {isOwner && !isBot && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                          OWNER
                        </span>
                      )}

                      <span className="text-[11px] text-slate-500">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>

                    {/* Message Body */}
                    {msg.content && (
                      <p className="text-sm text-slate-200 mt-0.5 break-words whitespace-pre-wrap leading-relaxed select-text font-normal">
                        {msg.content}
                      </p>
                    )}

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.attachments.map((att, i) => (
                          <div
                            key={i}
                            className="max-w-md max-h-72 rounded-xl overflow-hidden border border-[#1e293b] bg-black/40 group/img relative"
                          >
                            <img
                              src={att}
                              alt="Attachment"
                              className="w-full h-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => window.open(att, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reactions Row */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {msg.reactions.map((r, i) => {
                          const hasReacted = r.users.includes(currentUser.id);
                          return (
                            <button
                              key={i}
                              onClick={() => onReactMessage(msg.id, r.emoji)}
                              className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                hasReacted
                                  ? 'bg-cyan-600/30 border-cyan-500/50 text-cyan-300'
                                  : 'bg-[#151c2a] border-[#1e293b] text-slate-300 hover:bg-[#1e273a]'
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span>{r.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Hover Floating Action Bar */}
                  <div className="absolute right-3 -top-3 hidden group-hover:flex items-center space-x-1 bg-[#121724] border border-[#232d42] rounded-lg p-0.5 shadow-xl select-none z-10">
                    <button
                      onClick={() => setReplyingTo(msg)}
                      title="Reply"
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-[#1e273a] rounded-md transition-colors cursor-pointer"
                    >
                      <Reply className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)
                      }
                      title="Add Reaction"
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-[#1e273a] rounded-md transition-colors cursor-pointer"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onPinMessage(msg.id)}
                      title={msg.isPinned ? 'Unpin Message' : 'Pin Message'}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        msg.isPinned
                          ? 'text-cyan-400 bg-cyan-500/20'
                          : 'text-slate-400 hover:text-cyan-300 hover:bg-[#1e273a]'
                      }`}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    {(msg.authorId === currentUser.id || currentUser.id === 'kemor-bot') && (
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        title="Delete Message"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#1e273a] rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Quick Reaction Picker Popover */}
                    {showEmojiPicker === msg.id && (
                      <div className="absolute top-8 right-0 bg-[#151c28] border border-[#232d42] rounded-xl p-1.5 shadow-2xl flex items-center space-x-1 z-30">
                        {emojiList.map((em) => (
                          <button
                            key={em}
                            onClick={() => {
                              onReactMessage(msg.id, em);
                              setShowEmojiPicker(null);
                            }}
                            className="p-1 hover:bg-[#232d42] rounded text-base hover:scale-125 transition-transform cursor-pointer"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-1 text-xs text-cyan-400 italic flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          )}

          {/* Reply Active Banner */}
          {replyingTo && (
            <div className="px-4 py-1.5 bg-[#121722] border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-300 animate-in slide-in-from-bottom-2">
              <div className="flex items-center space-x-2 truncate">
                <Reply className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>
                  Replying to <strong className="text-white">@{replyingTo.authorName}</strong>:
                </span>
                <span className="truncate italic text-slate-400 max-w-xs">{replyingTo.content}</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attachment Preview Bar */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 bg-[#121722] border-t border-[#182030] flex items-center space-x-3 overflow-x-auto">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#2a3850] flex-shrink-0 group"
                >
                  <img src={att} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/80 rounded-full text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Rich Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-[#0a0d14] select-none flex-shrink-0">
            <div className="bg-[#121724] border border-[#1e293b] rounded-2xl flex items-center px-3 sm:px-4 py-2.5 focus-within:border-cyan-500/80 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all shadow-inner">
              {/* File Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Photo or Clip"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1a2333] rounded-lg transition-colors mr-1 cursor-pointer flex-shrink-0"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                multiple
                className="hidden"
              />

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message #${channel.name}...`}
                className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none px-2 select-text min-w-0"
              />

              {/* Emoji Picker toggle */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setShowEmojiPicker(showEmojiPicker === 'input' ? null : 'input')
                  }
                  title="Emoji"
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-[#1a2333] rounded-lg transition-colors mr-1 cursor-pointer"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker === 'input' && (
                  <div className="absolute bottom-10 right-0 bg-[#151c28] border border-[#232d42] rounded-xl p-2 shadow-2xl flex flex-wrap gap-1 w-52 z-30">
                    {emojiList.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => {
                          setInputText((prev) => prev + em);
                          setShowEmojiPicker(null);
                        }}
                        className="p-1.5 hover:bg-[#232d42] rounded text-lg hover:scale-125 transition-transform cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() && attachments.length === 0}
                title="Send Message"
                className={`p-2 rounded-xl transition-all flex-shrink-0 cursor-pointer ${
                  inputText.trim() || attachments.length > 0
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/25 hover:opacity-95'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Member Sidebar */}
        {showMembers && (
          <div className="w-56 h-full bg-[#080b12] border-l border-[#151c28] p-3 overflow-y-auto hidden md:block select-none flex-shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
              Online — {allUsers.filter((u) => u.status !== 'offline').length}
            </div>

            <div className="space-y-1">
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2.5 px-2 py-1.5 rounded-lg hover:bg-[#121722] cursor-pointer group transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#1e293b]"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080b12] ${
                        user.status === 'online'
                          ? 'bg-emerald-500'
                          : user.status === 'idle'
                          ? 'bg-amber-500'
                          : user.status === 'dnd'
                          ? 'bg-rose-500'
                          : 'bg-slate-500'
                      }`}
                    />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate flex items-center space-x-1">
                      <span>{user.name}</span>
                      {user.id === 'kemor-bot' && (
                        <span className="text-[9px] bg-indigo-600 text-white px-1 rounded">
                          BOT
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {user.customStatus || `#${user.tag}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
