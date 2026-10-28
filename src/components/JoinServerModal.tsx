import React, { useState } from 'react';
import { X, UserPlus, Sparkles, ArrowRight } from 'lucide-react';

interface JoinServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinServer: (inviteCode: string) => void;
}

export const JoinServerModal: React.FC<JoinServerModalProps> = ({
  isOpen,
  onClose,
  onJoinServer,
}) => {
  const [inviteInput, setInviteInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    onJoinServer(inviteInput.trim());
    setInviteInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0c1017] border border-[#1e293b] rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-[#1a2333] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xl mx-auto mb-3 shadow-lg shadow-cyan-500/25">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">Join a Server</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter an invite code or link below to join an existing squad server.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Invite Link or Code
            </label>
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="e.g. kemor-hq or https://.../?invite=kemor-hq"
              required
              className="w-full bg-[#121724] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="text-[11px] text-slate-400">
            <strong>Invites look like:</strong> <br />
            <code>kemor-hq</code> or <code>https://.../?invite=dev-lounge</code>
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
              disabled={!inviteInput.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Join Server</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
