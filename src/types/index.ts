export interface User {
  id: string;
  name: string;
  email: string;
  tag: string;
  avatar: string;
  banner: string;
  bio: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  isGoogle?: boolean;
  isEmailVerified: boolean;
  role?: 'admin' | 'member';
  createdAt: number;
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  topic?: string;
  category?: string;
  capacity?: number;
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  description: string;
  ownerId: string;
  inviteCode?: string;
  channels: Channel[];
  memberIds: string[];
  roles?: { [userId: string]: 'owner' | 'admin' | 'moderator' | 'member' };
  createdAt: number;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface MessageReply {
  id: string;
  authorName: string;
  content: string;
}

export interface Message {
  id: string;
  channelId: string;
  serverId?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole?: string;
  content: string;
  attachments?: string[];
  replyTo?: MessageReply;
  reactions: MessageReaction[];
  isPinned?: boolean;
  createdAt: number;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  attachments?: string[];
  createdAt: number;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface VoiceParticipant {
  id: string;
  name: string;
  avatar?: string;
  channelId?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  speaking: boolean;
  volumeLevel?: number; // 0 - 100
  stream?: MediaStream;
  customVolume?: number; // 0 - 200
}

export interface AudioSettings {
  inputDeviceId: string;
  outputDeviceId: string;
  inputVolume: number; // 0 to 200
  outputVolume: number; // 0 to 200
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  noiseReductionMode: 'off' | 'standard' | 'ai_cleaner' | 'strong';
  audioPreset: 'esports' | 'ai_cleaner' | 'strong' | 'natural';
  inputMode: 'activity' | 'push_to_talk';
  pushToTalkKey: string;
  sensitivityThreshold: number; // 0 to 100
  screenShareResolution: '720p' | '1080p' | 'source';
  screenShareFrameRate: number; // 30 | 60
}
