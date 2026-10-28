import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Server,
  Channel,
  Message,
  DirectMessage,
  VoiceParticipant,
  AudioSettings,
  MessageReply,
} from './types';
import { AudioEngine } from './utils/audioEngine';
import {
  playJoinVoiceSound,
  playLeaveVoiceSound,
  playMuteSound,
  playMessageSound,
} from './utils/soundEffects';
import { KemorLogo } from './components/KemorLogo';
import { NavigationRail } from './components/NavigationRail';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChatArea } from './components/ChatArea';
import { VoiceRoomView } from './components/VoiceRoomView';
import { FriendsView } from './components/FriendsView';
import { SettingsModal } from './components/SettingsModal';
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { CreateServerModal } from './components/CreateServerModal';
import { CreateChannelModal } from './components/CreateChannelModal';
import { JoinServerModal } from './components/JoinServerModal';
import { AuthModal } from './components/AuthModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import {
  Menu,
  X,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ArrowRight,
  LogIn,
} from 'lucide-react';

const audioEngine = new AudioEngine();

export default function App() {
  // Current user & authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('kemor_session_token');
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServerId, setActiveServerId] = useState<string | null>('server-kemor-hq');
  const [activeChannelId, setActiveChannelId] = useState<string>('ch-general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Voice & Video State
  const [connectedVoiceChannel, setConnectedVoiceChannel] = useState<Channel | null>(null);
  const [voiceParticipants, setVoiceParticipants] = useState<VoiceParticipant[]>([]);
  const [participantVolumes, setParticipantVolumes] = useState<{ [id: string]: number }>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'voice' | 'friends'>('chat');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('profile');
  const [serverSettingsOpen, setServerSettingsOpen] = useState(false);
  const [createServerOpen, setCreateServerOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [joinServerOpen, setJoinServerOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [emailVerificationDismissed, setEmailVerificationDismissed] = useState(false);

  // Audio Settings
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    inputDeviceId: 'default',
    outputDeviceId: 'default',
    inputVolume: 100,
    outputVolume: 100,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    noiseReductionMode: 'ai_cleaner',
    audioPreset: 'esports',
    inputMode: 'activity',
    pushToTalkKey: 'Space',
    sensitivityThreshold: 15,
    screenShareResolution: '1080p',
    screenShareFrameRate: 60,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioElements = useRef<Map<string, HTMLAudioElement>>(new Map());

  // 1. Session check & restoration on initial load
  useEffect(() => {
    const token = localStorage.getItem('kemor_session_token');

    if (token) {
      fetch(`/api/auth/session?token=${token}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Session invalid');
          return res.json();
        })
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
            setSessionToken(token);
          } else {
            throw new Error('No user returned');
          }
        })
        .catch(() => {
          localStorage.removeItem('kemor_session_token');
          setSessionToken(null);
          // Fallback to demo alex to allow immediate browsing, but flag as unauthenticated
          fetchFallbackUser();
        });
    } else {
      fetchFallbackUser();
    }

    // Check URL for invite code query param (?invite=xyz)
    const urlParams = new URLSearchParams(window.location.search);
    const inviteParam = urlParams.get('invite');
    if (inviteParam) {
      setJoinServerOpen(true);
    }
  }, []);

  const fetchFallbackUser = () => {
    fetch('/api/auth/login-or-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex@example.com',
        name: 'Alex Vance',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.warn('Fallback user error:', err));
  };

  // 2. Fetch servers and all users
  const fetchServersAndUsers = () => {
    fetch('/api/servers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setServers(data);
          if (data.length > 0 && !activeServerId) {
            setActiveServerId(data[0].id);
          }
        }
      })
      .catch((err) => console.warn('Fetch servers error:', err));

    fetch('/api/users/all')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAllUsers(data);
      })
      .catch((err) => console.warn('Fetch users error:', err));
  };

  useEffect(() => {
    fetchServersAndUsers();
  }, [currentUser?.id]);

  // 3. Setup WebSocket Connection & WebRTC Signaling
  useEffect(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'auth',
          userId: currentUser.id,
          userName: currentUser.name,
        })
      );
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'new_message': {
            const newMsg: Message = data.message;
            if (newMsg.channelId === activeChannelId) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              if (newMsg.authorId !== currentUser.id) {
                playMessageSound();
              }
            }
            break;
          }
          case 'message_updated': {
            setMessages((prev) =>
              prev.map((m) => (m.id === data.message.id ? data.message : m))
            );
            break;
          }
          case 'message_deleted': {
            setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
            break;
          }
          case 'voice_state_changed': {
            const { channelId, user, action } = data;
            setVoiceParticipants((prev) => {
              if (action === 'left') {
                // Close peer connection if exists
                const pc = peerConnections.current.get(user.id);
                if (pc) {
                  pc.close();
                  peerConnections.current.delete(user.id);
                }
                const audioEl = remoteAudioElements.current.get(user.id);
                if (audioEl) {
                  audioEl.remove();
                  remoteAudioElements.current.delete(user.id);
                }
                return prev.filter((p) => p.id !== user.id);
              }

              // If new participant joined our voice room and we are in it, initiate WebRTC offer
              if (action === 'joined' && user.id !== currentUser.id && connectedVoiceChannel?.id === channelId) {
                initiatePeerConnection(user.id, channelId);
              }

              const existingIdx = prev.findIndex((p) => p.id === user.id);
              if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = { ...updated[existingIdx], ...user };
                return updated;
              }
              return [...prev, user];
            });
            break;
          }
          case 'webrtc_signal': {
            // Handle incoming WebRTC SDP offer/answer or ICE candidate
            const { fromUserId, signal, channelId } = data;
            if (fromUserId === currentUser.id) return;
            handleIncomingWebRtcSignal(fromUserId, signal, channelId);
            break;
          }
          case 'new_dm': {
            setDirectMessages((prev) => {
              if (prev.some((d) => d.id === data.dm.id)) return prev;
              return [...prev, data.dm];
            });
            if (data.dm.authorId !== currentUser.id) {
              playMessageSound();
            }
            break;
          }
          case 'user_typing': {
            if (data.channelId === activeChannelId) {
              setTypingUsers((prev) =>
                prev.includes(data.userName) ? prev : [...prev, data.userName]
              );
              setTimeout(() => {
                setTypingUsers((prev) => prev.filter((u) => u !== data.userName));
              }, 3000);
            }
            break;
          }
          case 'server_created': {
            setServers((prev) => [...prev, data.server]);
            break;
          }
          case 'server_updated': {
            setServers((prev) =>
              prev.map((s) => (s.id === data.server.id ? data.server : s))
            );
            break;
          }
          case 'server_deleted': {
            setServers((prev) => prev.filter((s) => s.id !== data.serverId));
            if (activeServerId === data.serverId) {
              setActiveServerId(null);
              setCurrentView('friends');
            }
            break;
          }
          case 'channel_created': {
            setServers((prev) =>
              prev.map((s) =>
                s.id === data.serverId
                  ? { ...s, channels: [...s.channels, data.channel] }
                  : s
              )
            );
            break;
          }
          case 'channel_deleted': {
            setServers((prev) =>
              prev.map((s) =>
                s.id === data.serverId
                  ? { ...s, channels: s.channels.filter((c) => c.id !== data.channelId) }
                  : s
              )
            );
            if (activeChannelId === data.channelId) {
              const curServ = servers.find((s) => s.id === data.serverId);
              if (curServ && curServ.channels.length > 0) {
                setActiveChannelId(curServ.channels[0].id);
              }
            }
            break;
          }
          case 'user_profile_updated': {
            setAllUsers((prev) =>
              prev.map((u) => (u.id === data.user.id ? data.user : u))
            );
            if (currentUser && data.user.id === currentUser.id) {
              setCurrentUser(data.user);
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    return () => {
      ws.close();
      // Clean up peer connections
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      remoteAudioElements.current.forEach((el) => el.remove());
      remoteAudioElements.current.clear();
    };
  }, [activeChannelId, currentUser?.id, connectedVoiceChannel?.id]);

  // WebRTC Peer Mesh Helpers
  const createPeerConnection = (targetUserId: string, channelId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Add local microphone audio track if available
    const micStream = audioEngine.getMicStream();
    if (micStream) {
      micStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, micStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'webrtc_signal',
            targetUserId,
            channelId,
            signal: { candidate: event.candidate },
          })
        );
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        let audioEl = remoteAudioElements.current.get(targetUserId);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          document.body.appendChild(audioEl);
          remoteAudioElements.current.set(targetUserId, audioEl);
        }
        audioEl.srcObject = remoteStream;
        const vol = (participantVolumes[targetUserId] ?? 100) / 100;
        audioEl.volume = Math.min(1.0, vol);
      }
    };

    peerConnections.current.set(targetUserId, pc);
    return pc;
  };

  const initiatePeerConnection = async (targetUserId: string, channelId: string) => {
    try {
      const pc = createPeerConnection(targetUserId, channelId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'webrtc_signal',
            targetUserId,
            channelId,
            signal: { type: 'offer', sdp: offer.sdp },
          })
        );
      }
    } catch (err) {
      console.warn('Error creating WebRTC offer:', err);
    }
  };

  const handleIncomingWebRtcSignal = async (fromUserId: string, signal: any, channelId: string) => {
    try {
      let pc = peerConnections.current.get(fromUserId);
      if (!pc) {
        pc = createPeerConnection(fromUserId, channelId);
      }

      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'webrtc_signal',
              targetUserId: fromUserId,
              channelId,
              signal: { type: 'answer', sdp: answer.sdp },
            })
          );
        }
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (err) {
      console.warn('Error handling WebRTC signal:', err);
    }
  };

  // 4. Audio volume & speaking state callback from audioEngine
  useEffect(() => {
    audioEngine.onSpeakingChange = (speaking) => {
      if (!connectedVoiceChannel || !currentUser) return;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'voice_update_state',
            speaking,
          })
        );
      }
      setVoiceParticipants((prev) =>
        prev.map((p) => (p.id === currentUser.id ? { ...p, speaking } : p))
      );
    };
  }, [connectedVoiceChannel, currentUser?.id]);

  // 5. Fetch messages whenever activeChannelId changes
  useEffect(() => {
    if (!activeChannelId) return;
    fetch(`/api/channels/${activeChannelId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch((err) => console.warn('Fetch messages error:', err));
  }, [activeChannelId]);

  // Active Server and Channel Objects
  const activeServer = servers.find((s) => s.id === activeServerId) || null;
  const activeChannel =
    activeServer?.channels.find((c) => c.id === activeChannelId) ||
    activeServer?.channels[0] || {
      id: 'ch-general',
      name: 'general-chat',
      type: 'text' as const,
      topic: 'Default chat',
    };

  // Voice Channel Join & Leave
  const handleJoinVoiceChannel = async (channel: Channel) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    if (connectedVoiceChannel?.id === channel.id) {
      setCurrentView('voice');
      return;
    }

    playJoinVoiceSound();

    await audioEngine.startMicrophone(audioSettings.inputDeviceId);
    audioEngine.setMute(isMuted);

    setConnectedVoiceChannel(channel);
    setCurrentView('voice');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'join_voice',
          channelId: channel.id,
          serverId: activeServerId,
          isMuted,
          isDeafened,
        })
      );
    }

    setVoiceParticipants((prev) => [
      ...prev.filter((p) => p.id !== currentUser.id),
      {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        channelId: channel.id,
        isMuted,
        isDeafened,
        isScreenSharing: false,
        speaking: false,
      },
    ]);
  };

  const handleDisconnectVoice = () => {
    playLeaveVoiceSound();
    audioEngine.stopMicrophone();
    audioEngine.stopScreenShare();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'leave_voice',
        })
      );
    }

    setConnectedVoiceChannel(null);
    setIsScreenSharing(false);
    setScreenStream(null);

    // Clean peer connections
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    remoteAudioElements.current.forEach((el) => el.remove());
    remoteAudioElements.current.clear();

    if (currentUser) {
      setVoiceParticipants((prev) => prev.filter((p) => p.id !== currentUser.id));
    }

    if (currentView === 'voice') {
      setCurrentView('chat');
    }
  };

  const handleToggleMute = () => {
    if (!currentUser) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    playMuteSound(nextMuted);
    audioEngine.setMute(nextMuted);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'voice_update_state',
          isMuted: nextMuted,
        })
      );
    }

    setVoiceParticipants((prev) =>
      prev.map((p) => (p.id === currentUser.id ? { ...p, isMuted: nextMuted } : p))
    );
  };

  const handleToggleDeafen = () => {
    if (!currentUser) return;
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);
    if (!isMuted && nextDeafened) {
      setIsMuted(true);
      audioEngine.setMute(true);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'voice_update_state',
          isDeafened: nextDeafened,
          isMuted: nextDeafened ? true : isMuted,
        })
      );
    }

    setVoiceParticipants((prev) =>
      prev.map((p) => (p.id === currentUser.id ? { ...p, isDeafened: nextDeafened } : p))
    );
  };

  const handleToggleScreenShare = async () => {
    if (!currentUser) return;

    if (isScreenSharing) {
      audioEngine.stopScreenShare();
      setIsScreenSharing(false);
      setScreenStream(null);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'voice_update_state',
            isScreenSharing: false,
          })
        );
      }

      setVoiceParticipants((prev) =>
        prev.map((p) => (p.id === currentUser.id ? { ...p, isScreenSharing: false } : p))
      );
    } else {
      if (!connectedVoiceChannel && activeChannel.type === 'voice') {
        await handleJoinVoiceChannel(activeChannel);
      }

      const stream = await audioEngine.startScreenShare();
      if (stream) {
        setIsScreenSharing(true);
        setScreenStream(stream);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'voice_update_state',
              isScreenSharing: true,
            })
          );
        }

        setVoiceParticipants((prev) =>
          prev.map((p) => (p.id === currentUser.id ? { ...p, isScreenSharing: true } : p))
        );

        setCurrentView('voice');
      }
    }
  };

  // Individual Participant Volume adjustment
  const handleUpdateParticipantVolume = (participantId: string, volume: number) => {
    setParticipantVolumes((prev) => ({ ...prev, [participantId]: volume }));
    const audioEl = remoteAudioElements.current.get(participantId);
    if (audioEl) {
      audioEl.volume = Math.min(1.0, volume / 100);
    }
  };

  // Chat Actions
  const handleSendMessage = (content: string, attachments?: string[], replyTo?: MessageReply) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    fetch(`/api/channels/${activeChannelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverId: activeServerId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        authorRole: currentUser.role === 'admin' ? 'OWNER' : 'MEMBER',
        content,
        attachments,
        replyTo,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      })
      .catch((err) => console.error('Send message error:', err));
  };

  const handleReactMessage = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    fetch(`/api/messages/${messageId}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji, userId: currentUser.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === data.message.id ? data.message : m))
          );
        }
      })
      .catch((err) => console.error('Reaction error:', err));
  };

  const handlePinMessage = (messageId: string) => {
    fetch(`/api/messages/${messageId}/pin`, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === data.message.id ? data.message : m))
          );
        }
      })
      .catch((err) => console.error('Pin error:', err));
  };

  const handleDeleteMessage = (messageId: string) => {
    fetch(`/api/messages/${messageId}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      })
      .catch((err) => console.error('Delete error:', err));
  };

  const handleTyping = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
          channelId: activeChannelId,
        })
      );
    }
  };

  // Direct Message Sending
  const handleSendDirectMessage = (targetUserId: string, content: string) => {
    if (!currentUser) return;
    const conversationId = [currentUser.id, targetUserId].sort().join('_');
    fetch('/api/dms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        content,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.dm) {
          setDirectMessages((prev) => {
            if (prev.some((d) => d.id === data.dm.id)) return prev;
            return [...prev, data.dm];
          });
        }
      })
      .catch((err) => console.error('Send DM error:', err));
  };

  const handleLoadDmMessages = (newDms: DirectMessage[]) => {
    setDirectMessages((prev) => {
      const existingIds = new Set(prev.map((d) => d.id));
      const toAdd = newDms.filter((d) => !existingIds.has(d.id));
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });
  };

  // Profile Update
  const handleUpdateProfile = (updated: Partial<User>) => {
    if (!currentUser) return;
    const newProfile = { ...currentUser, ...updated };
    setCurrentUser(newProfile);

    fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        ...updated,
      }),
    }).catch((err) => console.error('Update profile error:', err));
  };

  // Server Management
  const handleCreateServer = (name: string, icon: string, description: string) => {
    if (!currentUser) return;
    fetch('/api/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        icon,
        description,
        ownerId: currentUser.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.server) {
          setServers((prev) => [...prev, data.server]);
          setActiveServerId(data.server.id);
          setActiveChannelId(data.server.channels[0]?.id || 'ch-general');
          setCurrentView('chat');
        }
      })
      .catch((err) => console.error('Create server error:', err));
  };

  const handleJoinServerByInvite = (inviteCode: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    fetch('/api/servers/join-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode, userId: currentUser.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.server) {
          setServers((prev) => {
            const exists = prev.some((s) => s.id === data.server.id);
            return exists ? prev.map((s) => (s.id === data.server.id ? data.server : s)) : [...prev, data.server];
          });
          setActiveServerId(data.server.id);
          if (data.server.channels.length > 0) {
            setActiveChannelId(data.server.channels[0].id);
          }
          setCurrentView('chat');
        } else {
          alert(data.error || 'Invalid or expired invite link.');
        }
      })
      .catch((err) => alert('Failed to join server: ' + err.message));
  };

  const handleUpdateServer = (serverId: string, data: Partial<Server>) => {
    fetch(`/api/servers/${serverId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.server) {
          setServers((prev) => prev.map((s) => (s.id === serverId ? resData.server : s)));
        }
      })
      .catch((err) => console.error('Update server error:', err));
  };

  const handleDeleteServer = (serverId: string) => {
    fetch(`/api/servers/${serverId}`, { method: 'DELETE' })
      .then(() => {
        setServers((prev) => prev.filter((s) => s.id !== serverId));
        setActiveServerId(null);
        setCurrentView('friends');
      })
      .catch((err) => console.error('Delete server error:', err));
  };

  const handleLeaveServer = (serverId: string) => {
    if (!currentUser) return;
    fetch(`/api/servers/${serverId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    })
      .then(() => {
        setServers((prev) => prev.filter((s) => s.id !== serverId));
        setActiveServerId(null);
        setCurrentView('friends');
      })
      .catch((err) => console.error('Leave server error:', err));
  };

  // Channel Management
  const handleCreateChannel = (name: string, type: 'text' | 'voice', topic: string) => {
    if (!activeServerId) return;
    fetch(`/api/servers/${activeServerId}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, topic }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.channel) {
          setServers((prev) =>
            prev.map((s) =>
              s.id === activeServerId
                ? { ...s, channels: [...s.channels, data.channel] }
                : s
            )
          );
          setActiveChannelId(data.channel.id);
          if (data.channel.type === 'voice') {
            handleJoinVoiceChannel(data.channel);
          } else {
            setCurrentView('chat');
          }
        }
      })
      .catch((err) => console.error('Create channel error:', err));
  };

  const handleDeleteChannel = (channelId: string) => {
    if (!activeServerId) return;
    fetch(`/api/servers/${activeServerId}/channels/${channelId}`, { method: 'DELETE' })
      .then(() => {
        setServers((prev) =>
          prev.map((s) =>
            s.id === activeServerId
              ? { ...s, channels: s.channels.filter((c) => c.id !== channelId) }
              : s
          )
        );
      })
      .catch((err) => console.error('Delete channel error:', err));
  };

  // Direct Call
  const handleStartDirectCall = (targetUser: User) => {
    const dummyVoiceChannel: Channel = {
      id: `call_${[currentUser?.id, targetUser.id].sort().join('_')}`,
      name: `Call with ${targetUser.name}`,
      type: 'voice',
      topic: 'Direct Private Voice Call',
      capacity: 2,
    };
    handleJoinVoiceChannel(dummyVoiceChannel);
  };

  // Auth Callbacks
  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setSessionToken(token);
    localStorage.setItem('kemor_session_token', token);
    fetchServersAndUsers();
  };

  const handleLogout = () => {
    if (sessionToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ token: sessionToken }),
      }).catch(() => {});
    }
    localStorage.removeItem('kemor_session_token');
    setSessionToken(null);
    handleDisconnectVoice();
    setSettingsOpen(false);
    setAuthModalOpen(true);
  };

  const handleVerifyEmail = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <div className="w-screen h-screen h-[100dvh] flex flex-col bg-[#05070c] text-slate-100 overflow-hidden font-sans select-none">
      {/* Unverified Email Warning Banner (only if unverified and not dismissed) */}
      {currentUser && !currentUser.isEmailVerified && !emailVerificationDismissed && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between z-40 text-xs text-amber-200">
          <div className="flex items-center space-x-2 truncate">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="truncate">
              <strong>Email Verification Pending:</strong> Verify your email address ({currentUser.email}) to unlock all server creation & full audio features.
            </span>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            <button
              onClick={() => handleVerifyEmail(currentUser.id)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-md transition-colors cursor-pointer"
            >
              Verify Now
            </button>
            <button
              onClick={() => setEmailVerificationDismissed(true)}
              className="text-amber-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Top Header (only on phones) */}
      <div className="md:hidden h-12 bg-[#0a0d14] border-b border-[#151c28] px-3 flex items-center justify-between z-30 flex-shrink-0">
        <button
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="p-1.5 text-slate-300 hover:text-white cursor-pointer"
        >
          {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <KemorLogo size="sm" showText={false} />

        <div className="flex items-center space-x-1.5">
          {currentUser ? (
            <button
              onClick={() => {
                setSettingsInitialTab('profile');
                setSettingsOpen(true);
              }}
              className="w-7 h-7 rounded-full overflow-hidden border border-[#1e293b] cursor-pointer"
            >
              <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-2 py-1 bg-cyan-600 text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Desktop & Tablet Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Rail (Servers column) */}
        <div
          className={`${
            mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } transition-transform duration-200 fixed md:relative z-40 h-full flex`}
        >
          <NavigationRail
            servers={servers}
            activeServerId={activeServerId}
            onSelectServer={(sId) => {
              setActiveServerId(sId);
              if (sId) {
                const s = servers.find((serv) => serv.id === sId);
                if (s && s.channels.length > 0) {
                  setActiveChannelId(s.channels[0].id);
                  if (s.channels[0].type === 'voice') {
                    setCurrentView('voice');
                  } else {
                    setCurrentView('chat');
                  }
                }
              } else {
                setCurrentView('friends');
              }
              setMobileDrawerOpen(false);
            }}
            onOpenCreateServer={() => setCreateServerOpen(true)}
            onOpenJoinServer={() => setJoinServerOpen(true)}
            onOpenSystemInfo={() => {
              setSettingsInitialTab('system');
              setSettingsOpen(true);
            }}
            currentUser={
              currentUser || {
                id: 'guest',
                name: 'Guest',
                email: '',
                tag: '0000',
                avatar: '',
                banner: '',
                bio: '',
                status: 'online',
                isEmailVerified: false,
                createdAt: Date.now(),
              }
            }
          />

          {/* Channel Sidebar (if inside a server) */}
          {activeServer && currentUser && (
            <ChannelSidebar
              server={activeServer}
              activeChannelId={activeChannelId}
              onSelectChannel={(ch) => {
                setActiveChannelId(ch.id);
                if (ch.type === 'voice') {
                  handleJoinVoiceChannel(ch);
                } else {
                  setCurrentView('chat');
                }
                setMobileDrawerOpen(false);
              }}
              onOpenCreateChannel={() => setCreateChannelOpen(true)}
              onOpenSettings={(tab) => {
                setSettingsInitialTab(tab || 'profile');
                setSettingsOpen(true);
              }}
              onOpenServerSettings={() => setServerSettingsOpen(true)}
              onDeleteChannel={handleDeleteChannel}
              currentUser={currentUser}
              connectedVoiceChannel={connectedVoiceChannel}
              voiceParticipants={voiceParticipants}
              onDisconnectVoice={handleDisconnectVoice}
              isMuted={isMuted}
              isDeafened={isDeafened}
              isScreenSharing={isScreenSharing}
              onToggleMute={handleToggleMute}
              onToggleDeafen={handleToggleDeafen}
              onToggleScreenShare={handleToggleScreenShare}
              onOpenVoiceRoomView={() => setCurrentView('voice')}
            />
          )}
        </div>

        {/* Mobile backdrop for drawer */}
        {mobileDrawerOpen && (
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-30"
          />
        )}

        {/* Center Main Stage */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0c1017]">
          {activeServerId === null || currentView === 'friends' ? (
            currentUser ? (
              <FriendsView
                currentUser={currentUser}
                allUsers={allUsers}
                directMessages={directMessages}
                onSendDirectMessage={handleSendDirectMessage}
                onLoadDmMessages={handleLoadDmMessages}
                onStartDirectCall={handleStartDirectCall}
                onOpenSettings={(tab) => {
                  setSettingsInitialTab(tab || 'profile');
                  setSettingsOpen(true);
                }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <KemorLogo size="xl" showText={true} className="mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Welcome to KEMOR</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6">
                  Experience crystal clear esports voice chat, zero-latency mesh audio, and high-definition screen sharing.
                </p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
                >
                  Sign In or Register
                </button>
              </div>
            )
          ) : currentView === 'voice' && connectedVoiceChannel && currentUser ? (
            <VoiceRoomView
              channel={connectedVoiceChannel}
              participants={voiceParticipants}
              currentUser={currentUser}
              screenStream={screenStream}
              isMuted={isMuted}
              isDeafened={isDeafened}
              isScreenSharing={isScreenSharing}
              onToggleMute={handleToggleMute}
              onToggleDeafen={handleToggleDeafen}
              onToggleScreenShare={handleToggleScreenShare}
              onDisconnect={handleDisconnectVoice}
              onOpenSettings={() => {
                setSettingsInitialTab('voice');
                setSettingsOpen(true);
              }}
              onUpdateParticipantVolume={handleUpdateParticipantVolume}
              participantVolumes={participantVolumes}
            />
          ) : (
            <ChatArea
              channel={activeChannel}
              server={activeServer || undefined}
              messages={messages}
              currentUser={
                currentUser || {
                  id: 'guest',
                  name: 'Guest',
                  email: '',
                  tag: '0000',
                  avatar: '',
                  banner: '',
                  bio: '',
                  status: 'online',
                  isEmailVerified: false,
                  createdAt: Date.now(),
                }
              }
              onSendMessage={handleSendMessage}
              onReactMessage={handleReactMessage}
              onPinMessage={handlePinMessage}
              onDeleteMessage={handleDeleteMessage}
              onTyping={handleTyping}
              typingUsers={typingUsers}
              allUsers={allUsers}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Phones) */}
      <MobileBottomNav
        currentView={currentView}
        hasActiveVoice={!!connectedVoiceChannel}
        onSelectView={(view) => {
          if (view === 'friends') {
            setActiveServerId(null);
            setCurrentView('friends');
          } else {
            setCurrentView(view);
          }
        }}
        onToggleSidebar={() => setMobileDrawerOpen(!mobileDrawerOpen)}
        onOpenSettings={() => {
          if (!currentUser) {
            setAuthModalOpen(true);
          } else {
            setSettingsInitialTab('profile');
            setSettingsOpen(true);
          }
        }}
      />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        currentUser={currentUser}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onVerifyEmail={handleVerifyEmail}
      />

      {currentUser && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          audioSettings={audioSettings}
          onUpdateAudioSettings={(up) => {
            setAudioSettings((prev) => ({ ...prev, ...up }));
            audioEngine.updateSettings(up);
          }}
          audioEngine={audioEngine}
          initialTab={settingsInitialTab}
          onGoogleSignIn={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          onVerifyEmail={handleVerifyEmail}
        />
      )}

      {activeServer && currentUser && (
        <ServerSettingsModal
          isOpen={serverSettingsOpen}
          onClose={() => setServerSettingsOpen(false)}
          server={activeServer}
          currentUser={currentUser}
          allUsers={allUsers}
          onUpdateServer={handleUpdateServer}
          onDeleteServer={handleDeleteServer}
          onLeaveServer={handleLeaveServer}
        />
      )}

      <CreateServerModal
        isOpen={createServerOpen}
        onClose={() => setCreateServerOpen(false)}
        onCreateServer={handleCreateServer}
      />

      <JoinServerModal
        isOpen={joinServerOpen}
        onClose={() => setJoinServerOpen(false)}
        onJoinServer={handleJoinServerByInvite}
      />

      <CreateChannelModal
        isOpen={createChannelOpen}
        onClose={() => setCreateChannelOpen(false)}
        onCreateChannel={handleCreateChannel}
      />
    </div>
  );
}
