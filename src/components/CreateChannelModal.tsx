import React, { useState } from 'react';
import { X, Hash, Volume2 } from 'lucide-react';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel: (name: string, type: 'text' | 'voice', topic: string) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  onCreateChannel,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'text' | 'voice'>('text');
  const [topic, setTopic] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateChannel(name.trim(), type, topic.trim());
    setName('');
    setTopic('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0c1017] border border-[#1e293b] rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-[#1a2333] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white tracking-wide mb-1">Create Channel</h2>
        <p className="text-xs text-slate-400 mb-5">
          in this server for discussions or voice calls.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Channel Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('text')}
                className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                  type === 'text'
                    ? 'border-indigo-400 bg-indigo-600/20 text-white shadow-md'
                    : 'border-[#1e293b] bg-[#121724] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Hash className={`w-5 h-5 mt-0.5 ${type === 'text' ? 'text-indigo-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold text-white">Text Channel</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Post images, chat, code & emojis</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('voice')}
                className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                  type === 'voice'
                    ? 'border-emerald-400 bg-emerald-600/20 text-white shadow-md'
                    : 'border-[#1e293b] bg-[#121724] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Volume2 className={`w-5 h-5 mt-0.5 ${type === 'voice' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold text-white">Voice Room</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">48kHz HD voice & screen share</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Channel Name
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-500">
                {type === 'text' ? '#' : '🔊'}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="new-channel"
                required
                className="w-full bg-[#121724] border border-[#1e293b] rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Channel Topic (Optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What is this channel for?"
              className="w-full bg-[#121724] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-40"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
