import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// Data directory & persistence
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'kemor_data.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface User {
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
  passwordHash?: string;
  salt?: string;
  isEmailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  role?: 'admin' | 'member';
  createdAt: number;
}

interface MessageReply {
  id: string;
  authorName: string;
  content: string;
}

interface Message {
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
  reactions: { emoji: string; count: number; users: string[] }[];
  isPinned?: boolean;
  createdAt: number;
}

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  topic?: string;
  category?: string;
  capacity?: number;
}

interface Server {
  id: string;
  name: string;
  icon: string;
  description: string;
  ownerId: string;
  inviteCode: string;
  channels: Channel[];
  memberIds: string[];
  roles?: { [userId: string]: 'owner' | 'admin' | 'moderator' | 'member' };
  createdAt: number;
}

interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

interface DirectMessage {
  id: string;
  conversationId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  attachments?: string[];
  createdAt: number;
}

interface Session {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

interface DBData {
  users: User[];
  servers: Server[];
  messages: Message[];
  friendRequests: FriendRequest[];
  directMessages: DirectMessage[];
  sessions?: { [token: string]: Session };
}

const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
const botAvatar = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80';

const initialData: DBData = {
  users: [
    {
      id: 'kemor-bot',
      name: 'KEMOR System',
      email: 'bot@kemor.app',
      tag: '0001',
      avatar: botAvatar,
      banner: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
      bio: 'Official KEMOR Platform Guardian & Audio Concierge.',
      status: 'online',
      customStatus: 'Monitoring HD Audio & Low Latency Mesh ⚡',
      isGoogle: false,
      isEmailVerified: true,
      role: 'admin',
      createdAt: Date.now() - 86400000 * 30,
    },
    {
      id: 'demo-alex',
      name: 'Alex Vance',
      email: 'alex@example.com',
      tag: '1337',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      banner: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
      bio: 'Fullstack Dev & Gamer. Streaming Apex & Cyberpunk.',
      status: 'online',
      customStatus: 'Testing High-Fidelity Audio Settings 🎧',
      isGoogle: false,
      isEmailVerified: true,
      role: 'member',
      createdAt: Date.now() - 86400000 * 10,
    },
    {
      id: 'demo-sara',
      name: 'Sara Connor',
      email: 'sara@example.com',
      tag: '4040',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      banner: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
      bio: 'Community Manager @ KEMOR. Feel free to ping for help!',
      status: 'idle',
      customStatus: 'AFK eating ramen 🍜',
      isGoogle: false,
      isEmailVerified: true,
      role: 'member',
      createdAt: Date.now() - 86400000 * 15,
    }
  ],
  servers: [
    {
      id: 'server-kemor-hq',
      name: 'KEMOR Global HQ',
      icon: '💎',
      description: 'The official KEMOR community for voice chats, gaming, and tech discussions.',
      ownerId: 'kemor-bot',
      inviteCode: 'kemor-hq',
      roles: { 'kemor-bot': 'owner', 'demo-alex': 'moderator', 'demo-sara': 'member' },
      memberIds: ['kemor-bot', 'demo-alex', 'demo-sara'],
      createdAt: Date.now() - 86400000 * 30,
      channels: [
        { id: 'ch-announcements', name: 'announcements', type: 'text', topic: 'Official platform news and patch releases.', category: 'INFORMATION' },
        { id: 'ch-general', name: 'general-chat', type: 'text', topic: 'Casual chat, introductions, and tech discussions.', category: 'TEXT CHANNELS' },
        { id: 'ch-gaming-talk', name: 'gaming-talk', type: 'text', topic: 'Esports, Free Fire, scrims, and tactics.', category: 'TEXT CHANNELS' },
        { id: 'ch-team-chat', name: 'team-chat', type: 'text', topic: 'Squad coordination & tournament discussions.', category: 'TEXT CHANNELS' },
        { id: 'ch-media-shares', name: 'media-and-clips', type: 'text', topic: 'Share screenshots, game clips, and setups.', category: 'TEXT CHANNELS' },
        { id: 'ch-help', name: 'help', type: 'text', topic: 'Audio calibration, setup troubleshooting & guidelines.', category: 'INFORMATION' },
        { id: 'ch-voice-lounge', name: 'Lounge Voice 48kHz', type: 'voice', topic: 'Crystal clear 48kHz Opus voice lounge.', category: 'VOICE ROOMS', capacity: 10 },
        { id: 'ch-voice-squad', name: 'Gaming Squad #1', type: 'voice', topic: 'Competitive squad room with screen sharing.', category: 'VOICE ROOMS', capacity: 10 },
        { id: 'ch-voice-rank', name: 'Rank Push Squad', type: 'voice', topic: 'High-focus esports rank push team communication.', category: 'VOICE ROOMS', capacity: 10 },
        { id: 'ch-voice-tdm', name: 'TDM Team 4v4', type: 'voice', topic: 'Instant esports callouts with low latency.', category: 'VOICE ROOMS', capacity: 8 },
        { id: 'ch-voice-chill', name: 'Chill Room', type: 'voice', topic: 'Casual hanging out and music listening.', category: 'VOICE ROOMS', capacity: 12 },
        { id: 'ch-screen-theater', name: 'Screen Share Theater', type: 'voice', topic: 'Ultra-low latency 60fps screen watch parties.', category: 'VOICE ROOMS', capacity: 10 },
      ],
    },
    {
      id: 'server-dev-lounge',
      name: 'Code & Synthetics',
      icon: '⚡',
      description: 'WebRTC developers, AI builders, and UI designers hanging out.',
      ownerId: 'demo-alex',
      inviteCode: 'dev-lounge',
      roles: { 'demo-alex': 'owner', 'kemor-bot': 'admin' },
      memberIds: ['kemor-bot', 'demo-alex'],
      createdAt: Date.now() - 86400000 * 20,
      channels: [
        { id: 'ch-dev-rules', name: 'dev-rules', type: 'text', topic: 'Community standards and code snippet rules.', category: 'INFORMATION' },
        { id: 'ch-dev-general', name: 'dev-talk', type: 'text', topic: 'React, WebRTC, AudioContext, and CSS styling.', category: 'TEXT CHANNELS' },
        { id: 'ch-dev-voice', name: 'Pair Programming Voice', type: 'voice', topic: 'Hop in to pair program or screen share code.', category: 'VOICE ROOMS', capacity: 10 },
      ],
    }
  ],
  messages: [
    {
      id: 'msg-welcome-1',
      channelId: 'ch-announcements',
      serverId: 'server-kemor-hq',
      authorId: 'kemor-bot',
      authorName: 'KEMOR System',
      authorAvatar: botAvatar,
      authorRole: 'PLATFORM OWNER',
      content: 'Welcome to KEMOR! 🚀 Experience crystal-clear real-time voice chat, zero-compression screen sharing, persistent channels, audio calibration with live decibel VU meters, and responsive mobile controls.',
      reactions: [{ emoji: '🔥', count: 12, users: ['demo-alex', 'demo-sara'] }, { emoji: '💜', count: 8, users: ['demo-alex'] }],
      isPinned: true,
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'msg-welcome-2',
      channelId: 'ch-general',
      serverId: 'server-kemor-hq',
      authorId: 'demo-alex',
      authorName: 'Alex Vance',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      authorRole: 'MODERATOR',
      content: 'Hey everyone! Make sure to head over to Settings -> Voice & Audio to test your microphone with the live waveform tester! 🎤 The noise suppression and echo cancellation work directly in the browser.',
      reactions: [{ emoji: '✨', count: 5, users: ['demo-sara'] }],
      createdAt: Date.now() - 3600000 * 5,
    },
    {
      id: 'msg-welcome-3',
      channelId: 'ch-general',
      serverId: 'server-kemor-hq',
      authorId: 'demo-sara',
      authorName: 'Sara Connor',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      content: 'The screen sharing quality is super smooth! Jump into "Screen Share Theater" if anyone wants to stream their desktop or gameplay.',
      reactions: [{ emoji: '🎮', count: 3, users: ['demo-alex'] }],
      createdAt: Date.now() - 3600000 * 2,
    }
  ],
  friendRequests: [
    {
      id: 'fr-1',
      fromId: 'demo-sara',
      toId: 'demo-alex',
      status: 'accepted',
      createdAt: Date.now() - 86400000 * 5,
    }
  ],
  directMessages: [
    {
      id: 'dm-1',
      conversationId: 'dm-alex-sara',
      authorId: 'demo-sara',
      authorName: 'Sara Connor',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      content: 'Hey! Are we jumping into the voice room tonight for the game tournament?',
      createdAt: Date.now() - 1800000,
    }
  ]
};

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function sanitizeUser(user: User) {
  const { passwordHash, salt, verificationToken, resetPasswordToken, resetPasswordExpires, ...safe } = user;
  return safe;
}

function loadDatabase(): DBData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const loaded: DBData = JSON.parse(content);

      // Safe migrations / backfills without erasing user data
      if (!loaded.sessions) loaded.sessions = {};
      if (Array.isArray(loaded.users)) {
        for (const u of loaded.users) {
          if (u.isEmailVerified === undefined) {
            u.isEmailVerified = true;
          }
        }
      }
      if (Array.isArray(loaded.servers)) {
        for (const s of loaded.servers) {
          if (!s.inviteCode) {
            s.inviteCode = s.id.replace('server-', '');
          }
          if (!s.roles) {
            s.roles = { [s.ownerId]: 'owner' };
          }
        }
      }

      saveDatabase(loaded);
      return loaded;
    }
  } catch (err) {
    console.error('Failed to read db file, using initial data:', err);
  }
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DBData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file:', err);
  }
}

let db = loadDatabase();

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // WebSocket Server setup
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Map of connected client websockets
  interface ClientInfo {
    ws: WebSocket;
    userId: string;
    userName: string;
    currentVoiceChannelId?: string;
    isMuted?: boolean;
    isDeafened?: boolean;
    isScreenSharing?: boolean;
    speaking?: boolean;
  }
  const connectedClients = new Map<WebSocket, ClientInfo>();

  function broadcast(data: any, filterFn?: (client: ClientInfo) => boolean) {
    const payload = JSON.stringify(data);
    for (const [ws, info] of connectedClients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        if (!filterFn || filterFn(info)) {
          ws.send(payload);
        }
      }
    }
  }

  wss.on('connection', (ws) => {
    let clientInfo: ClientInfo = {
      ws,
      userId: 'guest-' + Math.random().toString(36).substring(2, 9),
      userName: 'Guest',
    };
    connectedClients.set(ws, clientInfo);

    ws.on('message', (messageRaw) => {
      try {
        const msg = JSON.parse(messageRaw.toString());
        switch (msg.type) {
          case 'auth': {
            clientInfo.userId = msg.userId || clientInfo.userId;
            clientInfo.userName = msg.userName || clientInfo.userName;
            // Update user status to online in db
            const user = db.users.find(u => u.id === clientInfo.userId);
            if (user) {
              user.status = 'online';
              saveDatabase(db);
            }
            broadcast({
              type: 'presence_update',
              userId: clientInfo.userId,
              status: 'online',
            });
            break;
          }
          case 'join_voice': {
            const { channelId, serverId, isMuted, isDeafened } = msg;
            clientInfo.currentVoiceChannelId = channelId;
            clientInfo.isMuted = !!isMuted;
            clientInfo.isDeafened = !!isDeafened;
            clientInfo.speaking = false;

            // Notify everyone in the server/channel
            broadcast({
              type: 'voice_state_changed',
              channelId,
              serverId,
              user: {
                id: clientInfo.userId,
                name: clientInfo.userName,
                channelId,
                isMuted: clientInfo.isMuted,
                isDeafened: clientInfo.isDeafened,
                isScreenSharing: !!clientInfo.isScreenSharing,
                speaking: false,
              },
              action: 'joined',
            });
            break;
          }
          case 'leave_voice': {
            const oldChannelId = clientInfo.currentVoiceChannelId;
            clientInfo.currentVoiceChannelId = undefined;
            clientInfo.isScreenSharing = false;
            clientInfo.speaking = false;
            if (oldChannelId) {
              broadcast({
                type: 'voice_state_changed',
                channelId: oldChannelId,
                user: {
                  id: clientInfo.userId,
                  name: clientInfo.userName,
                },
                action: 'left',
              });
            }
            break;
          }
          case 'voice_update_state': {
            if (msg.isMuted !== undefined) clientInfo.isMuted = msg.isMuted;
            if (msg.isDeafened !== undefined) clientInfo.isDeafened = msg.isDeafened;
            if (msg.isScreenSharing !== undefined) clientInfo.isScreenSharing = msg.isScreenSharing;
            if (msg.speaking !== undefined) clientInfo.speaking = msg.speaking;

            broadcast({
              type: 'voice_state_changed',
              channelId: clientInfo.currentVoiceChannelId,
              user: {
                id: clientInfo.userId,
                name: clientInfo.userName,
                channelId: clientInfo.currentVoiceChannelId,
                isMuted: clientInfo.isMuted,
                isDeafened: clientInfo.isDeafened,
                isScreenSharing: clientInfo.isScreenSharing,
                speaking: clientInfo.speaking,
              },
              action: 'updated',
            });
            break;
          }
          case 'webrtc_signal': {
            // Forward WebRTC SDP offer, answer, or ICE candidate to specific peer or broadcast in voice channel
            const { targetUserId, signal, channelId } = msg;
            broadcast(
              {
                type: 'webrtc_signal',
                fromUserId: clientInfo.userId,
                fromUserName: clientInfo.userName,
                channelId,
                signal,
              },
              (client) => client.userId === targetUserId && client.userId !== clientInfo.userId
            );
            break;
          }
          case 'typing': {
            broadcast(
              {
                type: 'user_typing',
                channelId: msg.channelId,
                userId: clientInfo.userId,
                userName: clientInfo.userName,
              },
              (client) => client.userId !== clientInfo.userId
            );
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      const oldChannelId = clientInfo.currentVoiceChannelId;
      connectedClients.delete(ws);
      if (oldChannelId) {
        broadcast({
          type: 'voice_state_changed',
          channelId: oldChannelId,
          user: { id: clientInfo.userId, name: clientInfo.userName },
          action: 'left',
        });
      }
    });
  });

  // REST API Routes
  const apiRouter = express.Router();

  // Helper middleware to authenticate requests via session token
  const getSessionUser = (req: express.Request): User | null => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token as string);
    if (!token || !db.sessions || !db.sessions[token]) return null;

    const session = db.sessions[token];
    if (session.expiresAt < Date.now()) {
      delete db.sessions[token];
      saveDatabase(db);
      return null;
    }
    return db.users.find(u => u.id === session.userId) || null;
  };

  // 1. REGISTER (Email + Password + Verification link)
  apiRouter.post('/auth/register', (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please sign in instead.' });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const verificationToken = generateToken().substring(0, 16);
    const tag = Math.floor(1000 + Math.random() * 9000).toString();

    const newUser: User = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name: name?.trim() || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      tag,
      avatar: defaultAvatar,
      banner: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      bio: 'New KEMOR operative ready for voice & esports squads.',
      status: 'online',
      customStatus: 'Testing KEMOR HD Voice 🎧',
      isGoogle: false,
      passwordHash,
      salt,
      isEmailVerified: false,
      verificationToken,
      role: 'member',
      createdAt: Date.now(),
    };

    db.users.push(newUser);

    // Auto-join default servers
    const defaultServer = db.servers.find(s => s.id === 'server-kemor-hq');
    if (defaultServer && !defaultServer.memberIds.includes(newUser.id)) {
      defaultServer.memberIds.push(newUser.id);
      if (defaultServer.roles) defaultServer.roles[newUser.id] = 'member';
    }

    // Create persistent session
    const sessionToken = generateToken();
    if (!db.sessions) db.sessions = {};
    db.sessions[sessionToken] = {
      token: sessionToken,
      userId: newUser.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000 * 30, // 30-day session
    };

    saveDatabase(db);

    res.json({
      success: true,
      user: sanitizeUser(newUser),
      sessionToken,
      message: 'Account registered successfully! An email verification link has been generated.',
      verificationToken,
    });
  });

  // 2. LOGIN (Email + Password check)
  apiRouter.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address. Please sign up first.' });
    }

    // Check password
    if (user.passwordHash && user.salt) {
      const computedHash = hashPassword(password, user.salt);
      if (computedHash !== user.passwordHash) {
        return res.status(401).json({ error: 'Incorrect password. Please try again or use Forgot Password.' });
      }
    } else if (user.isGoogle) {
      return res.status(400).json({ error: 'This account was created with Google Sign-In. Please click Sign in with Google.' });
    }

    user.status = 'online';

    // Create session token
    const sessionToken = generateToken();
    if (!db.sessions) db.sessions = {};
    db.sessions[sessionToken] = {
      token: sessionToken,
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000 * 30,
    };

    saveDatabase(db);
    broadcast({ type: 'presence_update', userId: user.id, status: 'online' });

    res.json({
      success: true,
      user: sanitizeUser(user),
      sessionToken,
    });
  });

  // 3. GOOGLE SIGN-IN
  apiRouter.post('/auth/google', (req, res) => {
    const { email, name, avatar } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Google email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      const tag = Math.floor(1000 + Math.random() * 9000).toString();
      user = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        tag,
        avatar: avatar || defaultAvatar,
        banner: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        bio: 'Google authenticated KEMOR user.',
        status: 'online',
        customStatus: 'Exploring KEMOR 🎧',
        isGoogle: true,
        isEmailVerified: true, // Google accounts have pre-verified emails
        role: 'member',
        createdAt: Date.now(),
      };
      db.users.push(user);

      const defaultServer = db.servers.find(s => s.id === 'server-kemor-hq');
      if (defaultServer && !defaultServer.memberIds.includes(user.id)) {
        defaultServer.memberIds.push(user.id);
        if (defaultServer.roles) defaultServer.roles[user.id] = 'member';
      }
    } else {
      user.status = 'online';
      user.isGoogle = true;
      user.isEmailVerified = true;
      if (avatar && avatar !== defaultAvatar) user.avatar = avatar;
      if (name) user.name = name;
    }

    const sessionToken = generateToken();
    if (!db.sessions) db.sessions = {};
    db.sessions[sessionToken] = {
      token: sessionToken,
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000 * 30,
    };

    saveDatabase(db);
    broadcast({ type: 'presence_update', userId: user.id, status: 'online' });

    res.json({
      success: true,
      user: sanitizeUser(user),
      sessionToken,
    });
  });

  // 4. RESTORE SESSION
  apiRouter.get('/auth/session', (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or not found. Please log in.' });
    }
    user.status = 'online';
    saveDatabase(db);
    res.json({ success: true, user: sanitizeUser(user) });
  });

  // 5. LOGOUT
  apiRouter.post('/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.body.token as string);
    if (token && db.sessions && db.sessions[token]) {
      const userId = db.sessions[token].userId;
      const user = db.users.find(u => u.id === userId);
      if (user) {
        user.status = 'offline';
        broadcast({ type: 'presence_update', userId: user.id, status: 'offline' });
      }
      delete db.sessions[token];
      saveDatabase(db);
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  // 6. VERIFY EMAIL
  apiRouter.post('/auth/verify-email', (req, res) => {
    const { userId, token } = req.body;
    const user = db.users.find(u => u.id === userId || (token && u.verificationToken === token));
    if (!user) {
      return res.status(404).json({ error: 'User not found or invalid verification token.' });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    saveDatabase(db);

    res.json({
      success: true,
      user: sanitizeUser(user),
      message: 'Email address has been successfully verified! Full server access granted.',
    });
  });

  // 7. REQUEST PASSWORD RESET
  apiRouter.post('/auth/request-password-reset', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email address.' });
    }

    const resetToken = generateToken().substring(0, 20);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    saveDatabase(db);

    res.json({
      success: true,
      message: `Password reset instructions sent to ${user.email}.`,
      resetToken, // Included for simulated web testing
    });
  });

  // 8. RESET PASSWORD
  apiRouter.post('/auth/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Token and new password (min 6 characters) are required.' });
    }

    const user = db.users.find(u => u.resetPasswordToken === token && (u.resetPasswordExpires || 0) > Date.now());
    if (!user) {
      return res.status(400).json({ error: 'Password reset link is invalid or has expired. Please request a new one.' });
    }

    const salt = generateSalt();
    user.passwordHash = hashPassword(newPassword, salt);
    user.salt = salt;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    saveDatabase(db);

    res.json({
      success: true,
      message: 'Your password has been successfully updated. You can now log in.',
    });
  });

  // Legacy compat route for initial profile sync
  apiRouter.post('/auth/login-or-register', (req, res) => {
    const { email, name, avatar, isGoogle } = req.body;
    let user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user) {
      const tag = Math.floor(1000 + Math.random() * 9000).toString();
      user = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        name: name || (email ? email.split('@')[0] : 'KemorUser'),
        email: email || `${name.toLowerCase().replace(/\s+/g, '')}@kemor.local`,
        tag,
        avatar: avatar || defaultAvatar,
        banner: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        bio: 'Hey there! I am using KEMOR.',
        status: 'online',
        customStatus: 'Exploring KEMOR 🎧',
        isGoogle: !!isGoogle,
        isEmailVerified: true,
        role: 'member',
        createdAt: Date.now(),
      };
      db.users.push(user);
      const defaultServer = db.servers.find(s => s.id === 'server-kemor-hq');
      if (defaultServer && !defaultServer.memberIds.includes(user.id)) {
        defaultServer.memberIds.push(user.id);
      }
      saveDatabase(db);
    }
    res.json({ success: true, user: sanitizeUser(user) });
  });

  apiRouter.get('/users/all', (req, res) => {
    res.json(db.users.map(sanitizeUser));
  });

  apiRouter.put('/users/profile', (req, res) => {
    const { userId, name, avatar, banner, bio, status, customStatus } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (banner) user.banner = banner;
    if (bio !== undefined) user.bio = bio;
    if (status) user.status = status;
    if (customStatus !== undefined) user.customStatus = customStatus;

    saveDatabase(db);
    broadcast({
      type: 'user_profile_updated',
      user: sanitizeUser(user),
    });

    res.json({ success: true, user: sanitizeUser(user) });
  });

  // Servers
  apiRouter.get('/servers', (req, res) => {
    res.json(db.servers);
  });

  apiRouter.post('/servers', (req, res) => {
    const { name, icon, description, ownerId } = req.body;
    if (!name) return res.status(400).json({ error: 'Server name is required' });

    const serverId = 'server-' + Math.random().toString(36).substring(2, 9);
    const inviteCode = Math.random().toString(36).substring(2, 8);
    const newServer: Server = {
      id: serverId,
      name: name.trim(),
      icon: icon || '🌟',
      description: description || 'A community squad on KEMOR.',
      ownerId: ownerId || 'demo-alex',
      inviteCode,
      memberIds: [ownerId || 'demo-alex'],
      roles: { [ownerId || 'demo-alex']: 'owner' },
      createdAt: Date.now(),
      channels: [
        { id: 'ch-' + Math.random().toString(36).substring(2, 8), name: 'welcome', type: 'text', topic: 'Welcome channel', category: 'INFORMATION' },
        { id: 'ch-' + Math.random().toString(36).substring(2, 8), name: 'general-chat', type: 'text', topic: 'General discussion', category: 'TEXT CHANNELS' },
        { id: 'ch-' + Math.random().toString(36).substring(2, 8), name: 'Gaming Squad', type: 'voice', topic: 'Squad voice communication', category: 'VOICE ROOMS', capacity: 10 },
        { id: 'ch-' + Math.random().toString(36).substring(2, 8), name: 'Screen Share', type: 'voice', topic: 'Watch gameplay streams', category: 'VOICE ROOMS', capacity: 10 },
      ],
    };

    db.servers.push(newServer);
    saveDatabase(db);
    broadcast({ type: 'server_created', server: newServer });
    res.json({ success: true, server: newServer });
  });

  // Join Server via Invite Link / Code
  apiRouter.post('/servers/join-invite', (req, res) => {
    const { inviteCode, userId } = req.body;
    if (!inviteCode || !userId) {
      return res.status(400).json({ error: 'Invite code and user ID are required.' });
    }

    const cleanCode = inviteCode.trim().toLowerCase().replace(/^.*\/invite\//, '');
    const server = db.servers.find(s => s.inviteCode.toLowerCase() === cleanCode || s.id.toLowerCase() === cleanCode);
    if (!server) {
      return res.status(404).json({ error: 'Invalid or expired server invitation link.' });
    }

    if (!server.memberIds.includes(userId)) {
      server.memberIds.push(userId);
      if (!server.roles) server.roles = {};
      server.roles[userId] = 'member';
      saveDatabase(db);
      broadcast({ type: 'server_updated', server });
    }

    res.json({ success: true, server });
  });

  // Update Server details
  apiRouter.put('/servers/:id', (req, res) => {
    const server = db.servers.find(s => s.id === req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });

    const { name, icon, description, inviteCode } = req.body;
    if (name) server.name = name.trim();
    if (icon) server.icon = icon;
    if (description !== undefined) server.description = description.trim();
    if (inviteCode) server.inviteCode = inviteCode.trim();

    saveDatabase(db);
    broadcast({ type: 'server_updated', server });
    res.json({ success: true, server });
  });

  // Leave Server
  apiRouter.post('/servers/:id/leave', (req, res) => {
    const server = db.servers.find(s => s.id === req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });

    const { userId } = req.body;
    server.memberIds = server.memberIds.filter(id => id !== userId);
    if (server.roles && server.roles[userId]) {
      delete server.roles[userId];
    }

    saveDatabase(db);
    broadcast({ type: 'server_updated', server });
    res.json({ success: true, serverId: server.id });
  });

  // Delete Server (Owner only)
  apiRouter.delete('/servers/:id', (req, res) => {
    const serverIdx = db.servers.findIndex(s => s.id === req.params.id);
    if (serverIdx === -1) return res.status(404).json({ error: 'Server not found' });

    const [deleted] = db.servers.splice(serverIdx, 1);
    // Also remove channels messages
    const channelIds = deleted.channels.map(c => c.id);
    db.messages = db.messages.filter(m => !channelIds.includes(m.channelId));

    saveDatabase(db);
    broadcast({ type: 'server_deleted', serverId: deleted.id });
    res.json({ success: true, serverId: deleted.id });
  });

  // Create Channel in Server
  apiRouter.post('/servers/:id/channels', (req, res) => {
    const server = db.servers.find(s => s.id === req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });

    const { name, type, topic, category, capacity } = req.body;
    if (!name) return res.status(400).json({ error: 'Channel name is required' });

    const newChannel: Channel = {
      id: 'ch-' + Math.random().toString(36).substring(2, 8),
      name: name.toLowerCase().replace(/\s+/g, '-'),
      type: type === 'voice' ? 'voice' : 'text',
      topic: topic || '',
      category: category || (type === 'voice' ? 'VOICE ROOMS' : 'TEXT CHANNELS'),
      capacity: capacity || 10,
    };

    server.channels.push(newChannel);
    saveDatabase(db);
    broadcast({ type: 'channel_created', serverId: server.id, channel: newChannel });
    res.json({ success: true, channel: newChannel });
  });

  // Rename or Update Channel
  apiRouter.put('/servers/:id/channels/:channelId', (req, res) => {
    const server = db.servers.find(s => s.id === req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });

    const channel = server.channels.find(c => c.id === req.params.channelId);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const { name, topic, capacity } = req.body;
    if (name) channel.name = name.toLowerCase().replace(/\s+/g, '-');
    if (topic !== undefined) channel.topic = topic;
    if (capacity !== undefined) channel.capacity = capacity;

    saveDatabase(db);
    broadcast({ type: 'channel_updated', serverId: server.id, channel });
    res.json({ success: true, channel });
  });

  // Delete Channel
  apiRouter.delete('/servers/:id/channels/:channelId', (req, res) => {
    const server = db.servers.find(s => s.id === req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });

    const chIdx = server.channels.findIndex(c => c.id === req.params.channelId);
    if (chIdx === -1) return res.status(404).json({ error: 'Channel not found' });

    const [deleted] = server.channels.splice(chIdx, 1);
    db.messages = db.messages.filter(m => m.channelId !== deleted.id);

    saveDatabase(db);
    broadcast({ type: 'channel_deleted', serverId: server.id, channelId: deleted.id });
    res.json({ success: true, channelId: deleted.id });
  });

  // Channel Messages
  apiRouter.get('/channels/:id/messages', (req, res) => {
    const messages = db.messages
      .filter(m => m.channelId === req.params.id)
      .sort((a, b) => a.createdAt - b.createdAt);
    res.json(messages);
  });

  apiRouter.post('/channels/:id/messages', (req, res) => {
    const { serverId, authorId, authorName, authorAvatar, authorRole, content, attachments, replyTo } = req.body;
    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Content or attachment is required' });
    }

    const newMessage: Message = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      channelId: req.params.id,
      serverId,
      authorId: authorId || 'usr-anonymous',
      authorName: authorName || 'Anonymous',
      authorAvatar: authorAvatar || defaultAvatar,
      authorRole,
      content: content ? content.trim() : '',
      attachments: attachments || [],
      replyTo: replyTo || undefined,
      reactions: [],
      createdAt: Date.now(),
    };

    db.messages.push(newMessage);
    saveDatabase(db);
    broadcast({ type: 'new_message', message: newMessage });
    res.json({ success: true, message: newMessage });
  });

  apiRouter.post('/messages/:id/reaction', (req, res) => {
    const { emoji, userId } = req.body;
    const msg = db.messages.find(m => m.id === req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    let reaction = msg.reactions.find(r => r.emoji === emoji);
    if (!reaction) {
      reaction = { emoji, count: 1, users: [userId] };
      msg.reactions.push(reaction);
    } else {
      if (reaction.users.includes(userId)) {
        reaction.users = reaction.users.filter(u => u !== userId);
        reaction.count = reaction.users.length;
        if (reaction.count === 0) {
          msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        reaction.users.push(userId);
        reaction.count = reaction.users.length;
      }
    }

    saveDatabase(db);
    broadcast({ type: 'message_updated', message: msg });
    res.json({ success: true, message: msg });
  });

  apiRouter.post('/messages/:id/pin', (req, res) => {
    const msg = db.messages.find(m => m.id === req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    msg.isPinned = !msg.isPinned;
    saveDatabase(db);
    broadcast({ type: 'message_updated', message: msg });
    res.json({ success: true, message: msg });
  });

  apiRouter.delete('/messages/:id', (req, res) => {
    const msgIdx = db.messages.findIndex(m => m.id === req.params.id);
    if (msgIdx === -1) return res.status(404).json({ error: 'Message not found' });

    const [deleted] = db.messages.splice(msgIdx, 1);
    saveDatabase(db);
    broadcast({ type: 'message_deleted', messageId: deleted.id, channelId: deleted.channelId });
    res.json({ success: true, messageId: deleted.id });
  });

  // Direct Messages
  apiRouter.get('/dms/:conversationId', (req, res) => {
    const dms = db.directMessages.filter(d => d.conversationId === req.params.conversationId);
    res.json(dms);
  });

  apiRouter.post('/dms', (req, res) => {
    const { conversationId, authorId, authorName, authorAvatar, content, attachments } = req.body;
    if (!content && (!attachments || !attachments.length)) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const newDM: DirectMessage = {
      id: 'dm-' + Math.random().toString(36).substring(2, 9),
      conversationId,
      authorId,
      authorName,
      authorAvatar: authorAvatar || defaultAvatar,
      content: content ? content.trim() : '',
      attachments: attachments || [],
      createdAt: Date.now(),
    };

    db.directMessages.push(newDM);
    saveDatabase(db);
    broadcast({ type: 'new_dm', dm: newDM });
    res.json({ success: true, dm: newDM });
  });

  // System & Diagnostics endpoint
  apiRouter.get('/system/status', (req, res) => {
    const dbSize = fs.existsSync(DATA_FILE) ? fs.statSync(DATA_FILE).size : 0;
    res.json({
      platform: 'KEMOR Ultra v2.4 (Opus HD Voice & WebRTC Mesh)',
      status: 'online',
      webrtcMeshStatus: 'active',
      audioSampling: '48,000 Hz / Stereo Floating Point',
      screenShareProtocols: ['VP9', 'H.264', 'AV1'],
      activeWebSockets: connectedClients.size,
      totalUsers: db.users.length,
      totalServers: db.servers.length,
      totalMessages: db.messages.length,
      storageSizeBytes: dbSize,
      freeTierLimitations: [
        'Browser local storage & server-side JSON persistence up to 50MB',
        'Direct WebRTC Peer-to-Peer mesh voice: Recommended up to 12 simultaneous audio speakers per voice room without SFU',
        'Screen sharing streams at full device resolution (up to 1080p 60fps) based on client upload bandwidth',
        'Avatars and custom banners are stored natively as base64 or asset URLs with unlimited free updates',
      ]
    });
  });

  app.use('/api', apiRouter);

  // Mount Vite or static server
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`KEMOR Fullstack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start KEMOR server:', err);
  process.exit(1);
});
