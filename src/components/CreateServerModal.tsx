import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateServer: (name: string, icon: string, description: string) => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({
  isOpen,
  onClose,
  onCreateServer,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎮');
  const [description, setDescription] = useState('');

  const icons = ['🎮', '⚡', '💎', '🔥', '🚀', '🎧', '👾', '👑', '🌌', '💻'];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateServer(name.trim(), icon, description.trim());
    setName('');
    setDescription('');
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

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl mx-auto mb-3 shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">Create Your Server</h2>
          <p className="text-xs text-slate-400 mt-1">
            Your server is where you and your squad hang out, voice chat, and share screens.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                      ? 'border-indigo-400 bg-indigo-600/30 scale-110 shadow-md'
                      : 'border-[#1e293b] bg-[#121724] hover:bg-[#182030]'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Server Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cyber Squad, Chill Lounge"
              required
              className="w-full bg-[#121724] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this server about?"
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
              Create Server
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
