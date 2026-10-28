import React, { useEffect, useRef, useState } from 'react';
import { Channel, VoiceParticipant, User } from '../types';
import {
  Mic,
  MicOff,
  Headphones,
  ScreenShare,
  PhoneOff,
  Maximize2,
  Sliders,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  Volume1,
  Shield,
  Zap,
} from 'lucide-react';

interface VoiceRoomViewProps {
  channel: Channel;
  participants: VoiceParticipant[];
  currentUser: User;
  screenStream: MediaStream | null;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleScreenShare: () => void;
  onDisconnect: () => void;
  onOpenSettings: () => void;
  onUpdateParticipantVolume?: (participantId: string, volume: number) => void;
  participantVolumes?: { [userId: string]: number };
}

export const VoiceRoomView: React.FC<VoiceRoomViewProps> = ({
  channel,
  participants,
  currentUser,
  screenStream,
  isMuted,
  isDeafened,
  isScreenSharing,
  onToggleMute,
  onToggleDeafen,
  onToggleScreenShare,
  onDisconnect,
  onOpenSettings,
  onUpdateParticipantVolume,
  participantVolumes = {},
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeVolumeControlUser, setActiveVolumeControlUser] = useState<string | null>(null);

  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const channelParticipants = participants.filter((p) => p.channelId === channel.id);
  const maxCapacity = channel.capacity || 10;

  return (
    <div className="flex-1 h-full w-full bg-[#07090e] flex flex-col relative overflow-hidden select-none">
      {/* Top Bar with Esports Audio Quality Badges */}
      <div className="h-12 px-3 sm:px-6 border-b border-[#151c28] flex items-center justify-between bg-[#0c1017]/80 backdrop-blur-md z-10 flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 truncate">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <div className="flex items-center space-x-1.5 truncate">
            <Volume2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
              {channel.name}
            </h2>
          </div>

          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-[11px] bg-indigo-950/70 border border-indigo-500/30 text-cyan-300 px-2 py-0.5 rounded-full font-mono flex items-center space-x-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Opus 48kHz HD DSP</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-slate-400 flex-shrink-0">
          <div className="flex items-center space-x-1.5 bg-[#121724] px-2.5 py-1 rounded-lg border border-[#1e293b]">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-slate-200">
              {channelParticipants.length} / {maxCapacity} Max
            </span>
          </div>

          <button
            onClick={onOpenSettings}
            className="hidden sm:flex items-center space-x-1 text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-[#182030] transition-colors"
            title="Audio Calibration"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px]">Calibrate</span>
          </button>
        </div>
      </div>

      {/* Main Stage: Screen Share or Grid of Participants */}
      <div className="flex-1 p-3 sm:p-6 flex flex-col overflow-y-auto items-center justify-center relative min-w-0">
        {screenStream ? (
          /* Screen Sharing Theater View */
          <div className="w-full h-full flex flex-col space-y-3 sm:space-y-4 max-w-6xl">
            <div className="relative flex-1 bg-black rounded-2xl overflow-hidden shadow-2xl border border-indigo-950/40 flex items-center justify-center group min-h-[220px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />

              {/* Overlay badges */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center space-x-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping mr-1" />
                <span className="font-semibold truncate max-w-[150px]">{currentUser.name}'s Stream</span>
                <span className="text-[10px] bg-cyan-600 px-1.5 py-0.5 rounded text-white font-mono font-bold">
                  1080p 60FPS
                </span>
              </div>

              {/* Floating controls on video */}
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center space-x-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      } else {
                        videoRef.current.requestFullscreen();
                      }
                    }
                  }}
                  title="Fullscreen"
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onToggleScreenShare}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Stop Sharing
                </button>
              </div>
            </div>

            {/* Bottom thumbnail strip for participants */}
            <div className="h-20 sm:h-24 flex items-center space-x-3 overflow-x-auto py-1 w-full no-scrollbar flex-shrink-0">
              {channelParticipants.map((p) => {
                const isSelf = p.id === currentUser.id;
                const vol = participantVolumes[p.id] ?? 100;
                return (
                  <div
                    key={p.id}
                    className={`h-full min-w-[130px] sm:min-w-[160px] px-3 bg-[#121724] rounded-xl border flex items-center space-x-2.5 transition-all flex-shrink-0 relative ${
                      p.speaking
                        ? 'border-emerald-500 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                        : 'border-[#1e293b]'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          p.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80'
                        }
                        alt={p.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      {p.speaking && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#121724]" />
                      )}
                    </div>
                    <div className="truncate flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {p.name} {isSelf && '(You)'}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                        {p.isMuted && <MicOff className="w-3 h-3 text-rose-400 flex-shrink-0" />}
                        <span className="truncate">{p.speaking ? 'Speaking...' : 'Connected'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Participant Grid View */
          <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-fr">
            {channelParticipants.map((p) => {
              const isSelf = p.id === currentUser.id;
              const vol = participantVolumes[p.id] ?? 100;
              const isControllingVolume = activeVolumeControlUser === p.id;

              return (
                <div
                  key={p.id}
                  className={`relative aspect-[16/10] sm:aspect-video rounded-2xl bg-[#0f1420] border flex flex-col items-center justify-center p-3 sm:p-4 transition-all duration-200 group shadow-xl ${
                    p.speaking
                      ? 'border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#07090e]'
                      : 'border-[#1e293b] hover:border-[#2d3a52]'
                  }`}
                >
                  {/* Avatar with speaking wave */}
                  <div className="relative mb-2 sm:mb-3">
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 transition-all duration-300 ${
                        p.speaking
                          ? 'border-emerald-400 shadow-xl shadow-emerald-500/30 scale-105'
                          : 'border-slate-700'
                      }`}
                    >
                      <img
                        src={
                          p.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Speaking pulse ring */}
                    {p.speaking && (
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-35 pointer-events-none" />
                    )}
                  </div>

                  {/* Name & status badge */}
                  <div className="text-center w-full px-2">
                    <div className="text-xs sm:text-sm font-bold text-white flex items-center justify-center space-x-1.5 truncate">
                      <span className="truncate">{p.name}</span>
                      {isSelf && (
                        <span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-normal flex-shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Top-Right Individual Volume Control Trigger */}
                  {!isSelf && onUpdateParticipantVolume && (
                    <div className="absolute top-2.5 right-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveVolumeControlUser(isControllingVolume ? null : p.id)
                        }
                        title={`Adjust volume for ${p.name} (${vol}%)`}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isControllingVolume
                            ? 'bg-cyan-500 text-black font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-[#1a2333] opacity-60 group-hover:opacity-100'
                        }`}
                      >
                        {vol === 0 ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                        ) : vol < 100 ? (
                          <Volume1 className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Volume Slider Popover */}
                      {isControllingVolume && (
                        <div className="absolute top-8 right-0 bg-[#151c2a] border border-[#26334a] rounded-xl p-3 shadow-2xl z-30 w-44 animate-in fade-in zoom-in-95">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-200 mb-1.5">
                            <span className="truncate">{p.name}</span>
                            <span className="font-mono text-cyan-400">{vol}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={vol}
                            onChange={(e) =>
                              onUpdateParticipantVolume(p.id, Number(e.target.value))
                            }
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom indicators */}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center space-x-1 bg-[#07090e]/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5">
                    {p.isScreenSharing && (
                      <ScreenShare className="w-3 h-3 text-cyan-400" />
                    )}
                    {p.isMuted ? (
                      <MicOff className="w-3 h-3 text-rose-400" />
                    ) : (
                      <Mic
                        className={`w-3 h-3 ${
                          p.speaking ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      />
                    )}
                    {p.isDeafened && (
                      <Headphones className="w-3 h-3 text-rose-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Voice Control Dock (with safe mobile padding) */}
      <div className="h-20 pb-[env(safe-area-inset-bottom)] px-4 sm:px-6 flex items-center justify-center z-20 flex-shrink-0">
        <div className="glass-panel px-4 sm:px-6 py-2 rounded-full flex items-center space-x-2 sm:space-x-3 shadow-2xl shadow-black/90">
          {/* Mute Mic */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400'
                : 'bg-[#182030] text-slate-200 hover:bg-[#253249] hover:text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Deafen */}
          <button
            onClick={onToggleDeafen}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isDeafened
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400'
                : 'bg-[#182030] text-slate-200 hover:bg-[#253249] hover:text-white'
            }`}
          >
            <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Your Screen (1080p 60fps)'}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300'
                : 'bg-[#182030] text-slate-200 hover:bg-[#253249] hover:text-white'
            }`}
          >
            <ScreenShare className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Audio Calibration Shortcut */}
          <button
            onClick={onOpenSettings}
            title="Audio Calibration & Esports DSP Modes"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#182030] text-slate-300 hover:bg-[#253249] hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          </button>

          <div className="w-[1px] h-6 bg-slate-700 mx-1" />

          {/* Disconnect Voice */}
          <button
            onClick={onDisconnect}
            title="Disconnect Voice Room"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all hover:scale-105 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
