import React, { useState, useEffect, useRef } from 'react';
import { User, AudioSettings } from '../types';
import { AudioEngine } from '../utils/audioEngine';
import {
  X,
  User as UserIcon,
  Mic,
  Volume2,
  Tv,
  Shield,
  HelpCircle,
  Upload,
  Check,
  Sparkles,
  Smartphone,
  ExternalLink,
  Sliders,
  Radio,
  Image as ImageIcon,
  Key,
  ShieldCheck,
  AlertCircle,
  LogOut,
  Zap,
  Headphones,
  Info,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateProfile: (updated: Partial<User>) => void;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (updated: Partial<AudioSettings>) => void;
  audioEngine: AudioEngine;
  initialTab?: string;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  onVerifyEmail: (userId: string) => Promise<boolean>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  audioSettings,
  onUpdateAudioSettings,
  audioEngine,
  initialTab = 'profile',
  onGoogleSignIn,
  onLogout,
  onVerifyEmail,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [nameInput, setNameInput] = useState(currentUser.name);
  const [bioInput, setBioInput] = useState(currentUser.bio || '');
  const [customStatusInput, setCustomStatusInput] = useState(currentUser.customStatus || '');
  const [statusInput, setStatusInput] = useState(currentUser.status);
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatar);
  const [bannerPreview, setBannerPreview] = useState(currentUser.banner);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyStatusMsg, setVerifyStatusMsg] = useState('');

  // Audio Device Enumeration
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);

  // Mic Testing State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  ];

  const presetBanners = [
    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
    'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  ];

  useEffect(() => {
    if (isOpen) {
      audioEngine.getAvailableDevices().then(({ inputs, outputs }) => {
        setInputDevices(inputs);
        setOutputDevices(outputs);
      });
      setNameInput(currentUser.name);
      setBioInput(currentUser.bio || '');
      setCustomStatusInput(currentUser.customStatus || '');
      setStatusInput(currentUser.status);
      setAvatarPreview(currentUser.avatar);
      setBannerPreview(currentUser.banner);
    } else {
      stopMicTest();
    }
  }, [isOpen]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    onUpdateProfile({
      name: nameInput.trim() || currentUser.name,
      bio: bioInput.trim(),
      customStatus: customStatusInput.trim(),
      status: statusInput,
      avatar: avatarPreview,
      banner: bannerPreview,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const toggleMicTest = async () => {
    if (isTestingMic) {
      stopMicTest();
    } else {
      setIsTestingMic(true);
      await audioEngine.startMicTest((waveData) => {
        drawWaveform(waveData);
      });
      audioEngine.onVolumeChange = (vol) => {
        setMicVolumeLevel(vol);
      };
    }
  };

  const stopMicTest = () => {
    setIsTestingMic(false);
    audioEngine.stopMicTest();
    setMicVolumeLevel(0);
  };

  const drawWaveform = (data: Uint8Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f0ff';
    ctx.beginPath();

    const sliceWidth = canvas.width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  const handleVerifyEmail = async () => {
    setVerifyingEmail(true);
    const ok = await onVerifyEmail(currentUser.id);
    setVerifyingEmail(false);
    if (ok) {
      setVerifyStatusMsg('Email verified successfully!');
      setTimeout(() => setVerifyStatusMsg(''), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 md:backdrop-blur-md flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-150">
      <div className="w-full h-full md:h-[92vh] md:max-h-[760px] md:max-w-4xl bg-[#0c1017] border-0 md:border md:border-[#1e293b] rounded-none md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden pb-[env(safe-area-inset-bottom)] md:pb-0">
        {/* Mobile Top Header (iPhone friendly with notch safe-area) */}
        <div className="md:hidden flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-[#151c28] bg-[#07090e] flex-shrink-0 z-30">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              {activeTab === 'profile' && 'Profile & Avatars'}
              {activeTab === 'voice' && 'Esports Audio & Mic'}
              {activeTab === 'video' && 'Screen Share (1080p)'}
              {activeTab === 'account' && 'Account & Security'}
              {activeTab === 'system' && 'Architecture & Limits'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close Settings"
            className="p-1.5 -mr-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1a2333] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - Horizontal scroll on mobile, left column on desktop */}
        <div className="w-full md:w-60 bg-[#07090e] border-b md:border-b-0 md:border-r border-[#151c28] px-3 py-2 md:p-4 flex flex-row md:flex-col justify-between overflow-x-auto no-scrollbar flex-shrink-0">
          <div className="space-y-0 md:space-y-1 w-full flex md:flex-col space-x-1.5 md:space-x-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 hidden md:block">
              User Settings
            </div>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131924]'
              }`}
            >
              <UserIcon className="w-4 h-4 flex-shrink-0" />
              <span>Profile & Avatars</span>
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                activeTab === 'voice'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131924]'
              }`}
            >
              <Mic className="w-4 h-4 flex-shrink-0 text-cyan-400" />
              <span>Esports Audio & Mic</span>
            </button>

            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131924]'
              }`}
            >
              <Tv className="w-4 h-4 flex-shrink-0" />
              <span>Screen Share (1080p)</span>
            </button>

            <div className="h-[1px] bg-[#1a2333] my-2 hidden md:block" />
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 hidden md:block">
              Account & Security
            </div>

            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131924]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>Account & Security</span>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                activeTab === 'system'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131924]'
              }`}
            >
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              <span>Architecture & Limits</span>
            </button>
          </div>

          <div className="pt-3 hidden md:block">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Right Tab Content */}
        <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto relative flex flex-col min-w-0 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {/* Desktop Close button */}
          <button
            onClick={onClose}
            title="Close Settings"
            className="hidden md:flex absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-full transition-colors z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* TAB 1: Profile & Free Avatar Changes */}
          {activeTab === 'profile' && (
            <div className="space-y-4 sm:space-y-6 max-w-2xl w-full animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">User Profile</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize your avatar freely (unlimited zero-cost uploads), banner, status, and bio.
                </p>
              </div>

              {/* Banner & Avatar Preview Card */}
              <div className="rounded-2xl border border-[#1e293b] overflow-hidden bg-[#121724]">
                <div
                  className="h-24 sm:h-28 w-full transition-all relative flex items-end p-3 sm:p-4"
                  style={{ background: bannerPreview }}
                >
                  <div className="text-[10px] bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-white font-mono">
                    Banner Preview
                  </div>
                </div>

                <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-0 relative">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-8 sm:-mt-10 mb-4 gap-3 sm:gap-4">
                    <div className="relative group self-start">
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-[#121724] shadow-xl ring-2 ring-cyan-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold cursor-pointer"
                      >
                        <Upload className="w-4 h-4 mb-0.5" />
                        <span>CHANGE</span>
                      </button>
                    </div>

                    <div className="flex items-center w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="w-full sm:w-auto px-4 py-2.5 sm:py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Custom Image</span>
                      </button>
                      <input
                        type="file"
                        ref={avatarFileInputRef}
                        onChange={handleAvatarUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Preset Avatars Gallery */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      Or Choose a Quick Preset:
                    </div>
                    <div className="flex items-center space-x-2.5 overflow-x-auto py-1 no-scrollbar">
                      {presetAvatars.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAvatarPreview(url)}
                          className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                            avatarPreview === url
                              ? 'border-cyan-400 scale-110 ring-2 ring-cyan-500/50'
                              : 'border-[#1e293b] opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preset Banners */}
                  <div className="mb-5 sm:mb-6">
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      Banner Color Theme:
                    </div>
                    <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
                      {presetBanners.map((bg, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setBannerPreview(bg)}
                          className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg border transition-all cursor-pointer ${
                            bannerPreview === bg
                              ? 'border-white scale-110 ring-2 ring-cyan-400'
                              : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                          style={{ background: bg }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full bg-[#0a0d14] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                        Custom Status
                      </label>
                      <input
                        type="text"
                        value={customStatusInput}
                        onChange={(e) => setCustomStatusInput(e.target.value)}
                        placeholder="e.g. Free Fire Squad Leader 🏆"
                        className="w-full bg-[#0a0d14] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                        Online Presence Status
                      </label>
                      <select
                        value={statusInput}
                        onChange={(e) => setStatusInput(e.target.value as any)}
                        className="w-full bg-[#0a0d14] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      >
                        <option value="online">🟢 Online</option>
                        <option value="idle">🟡 Idle / Away</option>
                        <option value="dnd">🔴 Do Not Disturb</option>
                        <option value="offline">⚪ Invisible</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                        About Me / Bio
                      </label>
                      <textarea
                        rows={3}
                        value={bioInput}
                        onChange={(e) => setBioInput(e.target.value)}
                        className="w-full bg-[#0a0d14] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 pt-3">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <span>Save Changes</span>
                      </button>

                      {savedSuccess && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center justify-center sm:justify-start space-x-1 animate-in fade-in py-1">
                          <Check className="w-4 h-4" />
                          <span>Profile updated!</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Esports Voice & Audio */}
          {activeTab === 'voice' && (
            <div className="space-y-6 max-w-2xl animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide flex items-center space-x-2">
                  <span>Esports Audio & Microphone</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                    Opus 48kHz HD
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time DSP noise filtering, live waveform VU meter, esports callout clarity, and iPhone/headset calibration.
                </p>
              </div>

              {/* Audio Presets */}
              <div className="p-4 bg-[#121724] border border-[#1e293b] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Esports Audio Presets</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Zero cloud latency</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => audioEngine.setPreset('esports')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      audioSettings.audioPreset === 'esports'
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300 font-bold shadow-md'
                        : 'border-[#1e293b] text-slate-400 hover:text-white hover:bg-[#182030]'
                    }`}
                  >
                    <div className="text-xs">Esports Mode</div>
                    <div className="text-[9px] text-slate-400 mt-1">Free Fire & FPS</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => audioEngine.setPreset('ai_cleaner')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      audioSettings.audioPreset === 'ai_cleaner'
                        ? 'border-indigo-400 bg-indigo-500/15 text-indigo-300 font-bold shadow-md'
                        : 'border-[#1e293b] text-slate-400 hover:text-white hover:bg-[#182030]'
                    }`}
                  >
                    <div className="text-xs">AI Cleaner</div>
                    <div className="text-[9px] text-slate-400 mt-1">Hum + Fan Cut</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => audioEngine.setPreset('strong')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      audioSettings.audioPreset === 'strong'
                        ? 'border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-300 font-bold shadow-md'
                        : 'border-[#1e293b] text-slate-400 hover:text-white hover:bg-[#182030]'
                    }`}
                  >
                    <div className="text-xs">Strong Noise Cut</div>
                    <div className="text-[9px] text-slate-400 mt-1">Noisy Rooms</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => audioEngine.setPreset('natural')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      audioSettings.audioPreset === 'natural'
                        ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300 font-bold shadow-md'
                        : 'border-[#1e293b] text-slate-400 hover:text-white hover:bg-[#182030]'
                    }`}
                  >
                    <div className="text-xs">Natural Voice</div>
                    <div className="text-[9px] text-slate-400 mt-1">Full Spectrum</div>
                  </button>
                </div>
              </div>

              {/* Genuine Noise Reduction Modes */}
              <div className="p-4 bg-[#121724] border border-[#1e293b] rounded-2xl space-y-3">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Noise Reduction Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['off', 'standard', 'ai_cleaner', 'strong'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onUpdateAudioSettings({ noiseReductionMode: m })}
                      className={`p-2.5 rounded-xl border text-xs capitalize transition-all cursor-pointer ${
                        audioSettings.noiseReductionMode === m
                          ? 'border-cyan-400 bg-cyan-500/20 text-white font-bold'
                          : 'border-[#1e293b] text-slate-400 hover:text-white hover:bg-[#182030]'
                      }`}
                    >
                      {m === 'ai_cleaner' ? 'AI Voice Cleaner' : m}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400 bg-[#0a0d14] p-3 rounded-xl border border-[#1a2333]">
                  {audioSettings.noiseReductionMode === 'off' &&
                    'Raw microphone stream with zero audio filtering applied.'}
                  {audioSettings.noiseReductionMode === 'standard' &&
                    'Browser-native WebRTC acoustic echo cancellation and low-frequency cutoff.'}
                  {audioSettings.noiseReductionMode === 'ai_cleaner' &&
                    'Multi-stage hardware DSP: Cuts desk thumps & fan rumble below 85Hz, eliminates 50/60Hz AC hum, applies dynamic compression and +3.5dB vocal harmonics boost for competitive team callouts.'}
                  {audioSettings.noiseReductionMode === 'strong' &&
                    'Aggressive noise attenuation: 120Hz high-pass filter + tight vocal gate to suppress loud room echoes and background chatter.'}
                </div>
              </div>

              {/* Device Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Input Device (Microphone)
                  </label>
                  <select
                    value={audioSettings.inputDeviceId}
                    onChange={(e) => {
                      onUpdateAudioSettings({ inputDeviceId: e.target.value });
                      audioEngine.startMicrophone(e.target.value);
                    }}
                    className="w-full bg-[#0a0d14] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="default">Default System Microphone</option>
                    {inputDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Output Device (Speakers/Headphones)
                  </label>
                  <select
                    value={audioSettings.outputDeviceId}
                    onChange={(e) => onUpdateAudioSettings({ outputDeviceId: e.target.value })}
                    className="w-full bg-[#0a0d14] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="default">Default System Audio Output</option>
                    {outputDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Speaker ${d.deviceId.slice(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Volumes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Input Volume (Gain)</span>
                    <span className="font-mono text-cyan-400">{audioSettings.inputVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={audioSettings.inputVolume}
                    onChange={(e) =>
                      onUpdateAudioSettings({ inputVolume: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Output Volume</span>
                    <span className="font-mono text-cyan-400">{audioSettings.outputVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={audioSettings.outputVolume}
                    onChange={(e) =>
                      onUpdateAudioSettings({ outputVolume: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Real Mic Test Section */}
              <div className="p-4 bg-[#121724] border border-[#1e293b] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                      <Mic className="w-4 h-4 text-cyan-400" />
                      <span>Mic Test ("Let's Check")</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Hear your own voice in real-time and inspect the live frequency waveform.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={toggleMicTest}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                      isTestingMic
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white'
                    }`}
                  >
                    {isTestingMic ? 'Stop Test' : "Let's Check"}
                  </button>
                </div>

                {/* Canvas Waveform & Decibel Meter */}
                <div className="bg-[#0a0d14] p-3 rounded-xl border border-[#1a2333] flex flex-col space-y-2">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={60}
                    className="w-full h-14 bg-black/50 rounded-lg"
                  />

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>DECIBEL LEVEL: {micVolumeLevel}%</span>
                      <span>THRESHOLD: {audioSettings.sensitivityThreshold}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#182030] rounded-full overflow-hidden relative">
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-amber-400 z-10"
                        style={{ left: `${audioSettings.sensitivityThreshold}%` }}
                      />
                      <div
                        className={`h-full transition-all duration-75 rounded-full ${
                          micVolumeLevel > audioSettings.sensitivityThreshold
                            ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400'
                            : 'bg-slate-600'
                        }`}
                        style={{ width: `${micVolumeLevel}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Input Sensitivity Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Voice Activation Sensitivity</span>
                    <span className="font-mono text-cyan-400">
                      {audioSettings.sensitivityThreshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioSettings.sensitivityThreshold}
                    onChange={(e) =>
                      onUpdateAudioSettings({ sensitivityThreshold: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* iPhone & Headsets Advice */}
              <div className="p-4 bg-[#121724] border border-[#1e293b] rounded-2xl space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <Headphones className="w-4 h-4 text-cyan-400" />
                  <span>iPhone & Headsets Support</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  • <strong>Wired Earphones (3.5mm / Lightning):</strong> Best for competitive esports (Free Fire, CS, Valorant). Provides 0ms audio latency and crystal-clear microphone pickup. <br />
                  • <strong>Bluetooth AirPods & Wireless:</strong> Fully supported for voice calls. Note that Bluetooth SBC/AAC codecs add standard ~80–120ms hardware transmission latency. <br />
                  • <strong>iOS Safari Audio Session:</strong> If audio is quiet on iPhone, ensure the hardware mute switch is flipped off and the volume buttons are turned up.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Screen Share */}
          {activeTab === 'video' && (
            <div className="space-y-6 max-w-2xl animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">Screen Share & Streaming</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Stream your gameplay, browser tab, or application at up to 1080p 60FPS with zero cloud billing.
                </p>
              </div>

              <div className="p-4 bg-[#121724] border border-[#1e293b] rounded-2xl space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                    Quality Presets
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onUpdateAudioSettings({ screenShareResolution: '720p', screenShareFrameRate: 30 })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        audioSettings.screenShareResolution === '720p' && audioSettings.screenShareFrameRate === 30
                          ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300 font-bold'
                          : 'border-[#1e293b] text-slate-300 hover:bg-[#182030]'
                      }`}
                    >
                      <div className="text-sm">720p 30fps</div>
                      <div className="text-[10px] text-slate-400 mt-1">Data Saver</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateAudioSettings({ screenShareResolution: '1080p', screenShareFrameRate: 60 })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        audioSettings.screenShareResolution === '1080p' && audioSettings.screenShareFrameRate === 60
                          ? 'border-indigo-400 bg-indigo-500/15 text-indigo-300 font-bold'
                          : 'border-[#1e293b] text-slate-300 hover:bg-[#182030]'
                      }`}
                    >
                      <div className="text-sm">1080p 60fps</div>
                      <div className="text-[10px] text-slate-400 mt-1">Recommended</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateAudioSettings({ screenShareResolution: 'source', screenShareFrameRate: 60 })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        audioSettings.screenShareResolution === 'source'
                          ? 'border-purple-400 bg-purple-500/15 text-purple-300 font-bold'
                          : 'border-[#1e293b] text-slate-300 hover:bg-[#182030]'
                      }`}
                    >
                      <div className="text-sm">Source / 4K</div>
                      <div className="text-[10px] text-slate-400 mt-1">Maximum Crisp</div>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-[#0a0d14] p-3 rounded-xl border border-[#1a2333]">
                  💡 <strong>System Audio:</strong> When streaming from Chrome or Edge on desktop, check the "Share system audio" box to transmit in-game gunshots and audio to your squad.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Account & Security */}
          {activeTab === 'account' && (
            <div className="space-y-6 max-w-2xl animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">Account Security & Verification</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage your authenticated KEMOR identity, email verification, and session security.
                </p>
              </div>

              {/* Account Identity Card */}
              <div className="p-4 bg-[#121724] border border-[#1e293b] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400"
                  />
                  <div className="truncate">
                    <div className="text-sm font-bold text-white flex items-center space-x-2">
                      <span className="truncate">{currentUser.name}</span>
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                        #{currentUser.tag}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">{currentUser.email}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Stable UID: {currentUser.id}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer flex-shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>

              {/* Email Verification Box */}
              <div
                className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                  currentUser.isEmailVerified
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                {currentUser.isEmailVerified ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-xs">
                  <div
                    className={`font-bold ${
                      currentUser.isEmailVerified ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {currentUser.isEmailVerified
                      ? 'Email Address Verified'
                      : 'Email Verification Pending'}
                  </div>
                  <p className="text-slate-400 mt-1 leading-relaxed">
                    {currentUser.isEmailVerified
                      ? 'Your registered email is verified. Your servers, custom channels, direct messages, and cloud session are fully secured.'
                      : 'Please verify your email address to unlock full tournament room creation and server invite permissions.'}
                  </p>

                  {!currentUser.isEmailVerified && (
                    <div className="mt-3 flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={handleVerifyEmail}
                        disabled={verifyingEmail}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {verifyingEmail ? 'Verifying...' : 'Verify Email Address Now'}
                      </button>

                      {verifyStatusMsg && (
                        <span className="text-xs text-emerald-400 font-semibold animate-in fade-in">
                          {verifyStatusMsg}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Data Persistence Note */}
              <div className="p-4 bg-[#121724] border border-[#1e293b] rounded-2xl space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Cloud Persistence & Encryption</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your servers, channels, messages, custom profile avatars, and friendships are permanently backed up to the secure backend storage. Passwords are mathematically salted and hashed with PBKDF2/SHA-512.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: Free-Tier Limitations */}
          {activeTab === 'system' && (
            <div className="space-y-6 max-w-2xl animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">Platform Architecture & Boundaries</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Technical specifications, participant capacities, and zero-cost free-tier boundaries.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-[#121724] border border-[#1e293b] rounded-2xl">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                    1. Voice Room Mesh Capacity
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    KEMOR uses high-definition WebRTC peer-to-peer audio with 48,000 Hz Opus stereo sampling. Default target room capacity is <strong>10 concurrent participants</strong> per voice room under standard peer mesh without needing expensive SFU server relays.
                  </p>
                </div>

                <div className="p-4 bg-[#121724] border border-[#1e293b] rounded-2xl">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    2. Screen Sharing
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Desktop and Android browsers stream at full resolution up to <strong>1080p 60FPS</strong> with zero per-minute billing fees. On iOS Safari, screen sharing from iPhones is restricted by Apple’s WebKit sandbox, but iPhone users can <strong>watch screen streams</strong> and participate in voice without restriction.
                  </p>
                </div>

                <div className="p-4 bg-[#121724] border border-[#1e293b] rounded-2xl">
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
                    3. Cloud Data Persistence
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    User servers, memberships, channels, and conversation histories are persisted server-side. Refreshing the browser or reopening KEMOR restores your active session seamlessly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
