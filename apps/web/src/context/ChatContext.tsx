'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  phoneNumber: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isOnline: boolean;
  lastSeen: string;
  showLastSeen: boolean;
  showReadReceipts: boolean;
  allowNotifications: boolean;
}

interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
  };
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  isEdited: boolean;
  isDeleted: boolean;
  replyToId: string | null;
  replyTo: {
    id: string;
    content: string;
    sender: {
      id: string;
      username: string;
      displayName: string | null;
    };
  } | null;
  isStarred: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  reactions?: MessageReaction[];
}

interface Chat {
  id: string;
  isGroup: boolean;
  name: string;
  avatarUrl: string | null;
  description: string | null;
  updatedAt: string;
  otherMember: User | null;
  lastMessage: Message | null;
  isPinned: boolean;
  isArchived: boolean;
  unreadCount: number;
  members?: any[];
}

export interface Story {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  text: string;
  mediaUrl?: string;
  time: string;
}

interface ChatContextType {
  user: User | null;
  accessToken: string | null;
  chats: Chat[];
  activeChatId: string | null;
  activeChat: Chat | null;
  messages: Message[];
  contacts: any[];
  onlineUsers: Record<string, boolean>;
  typingUsers: Record<string, boolean>; // userId -> isTyping in active chat
  statuses: Story[];
  incomingCall: { callerId: string; callerName: string; type: 'voice' | 'video'; chatId: string } | null;
  setIncomingCall: (call: any) => void;
  emitCallUser: (type: 'voice' | 'video', recipientId: string, callerName: string) => void;
  emitAcceptCall: () => void;
  emitDeclineCall: () => void;
  emitEndCall: (recipientId: string) => void;
  emitCallSignal: (recipientId: string, signalData: { offer?: any; answer?: any; candidate?: any }) => void;
  isLoading: boolean;
  loginPhone: (phoneNumber: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  checkPhone: (phoneNumber: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
  loginPass: (phoneNumber: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerPass: (phoneNumber: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  selectChat: (chatId: string) => void;
  sendMessage: (content: string, replyToId?: string) => void;
  sendTyping: (isTyping: boolean) => void;
  postStatus: (text: string, mediaUrl?: string) => void;
  fetchContacts: () => Promise<void>;
  fetchChats: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  addContact: (phoneNumber: string, nickname?: string) => Promise<{ success: boolean; error?: string }>;
  searchUsers: (query: string) => Promise<User[]>;
  startChatWithUser: (recipientId: string) => Promise<string | null>;
  togglePin: (chatId: string) => Promise<void>;
  toggleArchive: (chatId: string) => Promise<void>;
  toggleStarMessage: (messageId: string) => Promise<void>;
  deleteMessageForMe: (messageId: string) => Promise<void>;
  deleteMessageEveryone: (messageId: string) => void;
  editMessage: (messageId: string, content: string) => void;
  updateProfileSettings: (data: { displayName?: string; bio?: string; avatarUrl?: string; showLastSeen?: boolean; showReadReceipts?: boolean; allowNotifications?: boolean }) => Promise<void>;
  createGroupChat: (name: string, memberIds: string[], description?: string) => Promise<string | null>;
  addMembersToGroup: (chatId: string, memberIds: string[]) => Promise<boolean>;
  toggleAdminRole: (chatId: string, targetUserId: string, isAdmin: boolean) => Promise<boolean>;
  removeMemberFromGroup: (chatId: string, targetUserId: string) => Promise<boolean>;
  updateGroupDetails: (chatId: string, data: { name?: string; description?: string }) => Promise<boolean>;
  joinGroupViaInvite: (chatId: string) => Promise<string | null>;
  deleteChat: (chatId: string) => Promise<boolean>;
  toggleReaction: (messageId: string, emoji: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

let ringtoneInterval: any = null;
let sharedAudioCtx: AudioContext | null = null;

export const unlockAudio = () => {
  if (typeof window === 'undefined') return;
  try {
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) sharedAudioCtx = new AudioCtxClass();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
  } catch (e) {}
};

if (typeof window !== 'undefined') {
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

export const playNotificationSound = () => {
  try {
    unlockAudio();
    const audioCtx = sharedAudioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.12);

    setTimeout(() => {
      try {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.22);
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.22);
      } catch (e) {}
    }, 70);
  } catch (e) {
    console.warn('Audio chime play error:', e);
  }
};

export const showDesktopNotification = (
  title: string,
  body: string,
  avatarUrl?: string,
  onClick?: () => void
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: avatarUrl || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'friends-whatsapp-' + Date.now(),
      });
      if (onClick) {
        notif.onclick = () => {
          window.focus();
          onClick();
        };
      }
    } catch (e) {
      console.warn('Notification construction error:', e);
    }
  }
};

const playIncomingRingtone = () => {
  if (ringtoneInterval) clearInterval(ringtoneInterval);
  const ring = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {}
  };
  ring();
  ringtoneInterval = setInterval(ring, 1800);
};

export const stopIncomingRingtone = () => {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [statuses, setStatuses] = useState<Story[]>([]);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const activeChatIdRef = useRef<string | null>(null);

  // Sync activeChatId with ref so socket listeners see fresh value
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
    if (activeChatId) {
      setChats((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, unreadCount: 0 } : c))
      );
      setMessages([]);
      fetchMessages(activeChatId);
      // Join socket chat room
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_chat', { chatId: activeChatId });
        socketRef.current.emit('read_all_messages', { chatId: activeChatId });
      }
    }
  }, [activeChatId]);

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId);
    if (chatId) {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
      );
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_chat', { chatId });
        socketRef.current.emit('read_all_messages', { chatId });
      }
    }
  };

  const refreshAllData = async () => {
    try {
      await Promise.allSettled([
        fetchChats(),
        fetchContacts(),
        activeChatIdRef.current ? fetchMessages(activeChatIdRef.current) : Promise.resolve(),
      ]);
      if (socketRef.current?.connected) {
        socketRef.current.emit('get_statuses');
      }
    } catch (e) {}
  };

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('chat_user');
    const storedToken = localStorage.getItem('chat_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
    }
    try {
      const storedStatuses = localStorage.getItem('local_statuses');
      if (storedStatuses) {
        setStatuses(JSON.parse(storedStatuses));
      }
    } catch (e) {}
    setIsLoading(false);
  }, []);

  // Connect WebSockets when authenticated
  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(API_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to real-time chat server');
      fetchChats();
      fetchContacts();
    });

    socket.on('new_message', (message: Message) => {
      const isFromMe = message.senderId === user?.id;

      if (activeChatIdRef.current === message.chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        if (!isFromMe) {
          socket.emit('read_receipt', { chatId: message.chatId, messageId: message.id });
        }
      }

      // 1. Play sound chime and trigger desktop push alert for incoming messages from others
      if (!isFromMe) {
        playNotificationSound();
        const senderName = message.sender?.displayName || message.sender?.username || 'Friends WhatsApp';
        const preview = message.content.startsWith('data:image')
          ? '📷 Photo'
          : message.content.startsWith('data:audio')
          ? '🎙️ Voice note'
          : message.content;
        showDesktopNotification(senderName, preview, message.sender?.avatarUrl || undefined, () => {
          setActiveChatId(message.chatId);
        });

        // 2. Auto-add sender to recipient's contacts without duplicates
        if (message.sender) {
          setContacts((prev) => {
            const exists = prev.some(
              (c) => c.id === message.sender.id || ((message.sender as any).phoneNumber && c.phoneNumber === (message.sender as any).phoneNumber)
            );
            if (exists) return prev;
            return [
              ...prev,
              {
                id: message.sender.id,
                username: message.sender.username,
                displayName: message.sender.displayName || message.sender.username,
                avatarUrl: message.sender.avatarUrl,
                phoneNumber: (message.sender as any).phoneNumber || '',
                bio: '',
                isOnline: true,
                lastSeen: new Date().toISOString(),
              },
            ];
          });
        }
      }

      // 3. Update chat list (or refresh from server if new conversation)
      setChats((prev) => {
        const found = prev.some((c) => c.id === message.chatId);
        if (!found) {
          fetchChats();
          return prev;
        }
        return prev
          .map((chat) => {
            if (chat.id === message.chatId) {
              return {
                ...chat,
                lastMessage: message,
                unreadCount: activeChatIdRef.current === message.chatId ? 0 : chat.unreadCount + 1,
                updatedAt: message.createdAt || new Date().toISOString(),
              };
            }
            return chat;
          })
          .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      });
    });

    socket.on('message_edited', (edited: Message) => {
      if (activeChatIdRef.current === edited.chatId) {
        setMessages((prev) => prev.map((m) => (m.id === edited.id ? edited : m)));
      }
      fetchChats(); // Refresh last message in sidebar
    });

    socket.on('message_deleted_everyone', (deleted: Message) => {
      if (activeChatIdRef.current === deleted.chatId) {
        setMessages((prev) => prev.map((m) => (m.id === deleted.id ? deleted : m)));
      }
      fetchChats();
    });

    socket.on('message_reaction_toggled', (data: { messageId: string; chatId: string; reactions: MessageReaction[] }) => {
      if (activeChatIdRef.current === data.chatId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m))
        );
      }
    });

    socket.on('typing', (data: { chatId: string; userId: string; isTyping: boolean }) => {
      if (activeChatIdRef.current === data.chatId) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.isTyping,
        }));
      }
    });

    socket.on('user_status', (data: { userId: string; isOnline: boolean }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [data.userId]: data.isOnline,
      }));
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.otherMember && chat.otherMember.id === data.userId) {
            return {
              ...chat,
              otherMember: { ...chat.otherMember, isOnline: data.isOnline },
            };
          }
          return chat;
        })
      );
    });

    socket.on('message_read', (data: { chatId: string; messageId: string; userId: string }) => {
      if (activeChatIdRef.current === data.chatId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.messageId ? { ...m, status: 'READ' } : m))
        );
      }
    });

    socket.on('messages_read_bulk', (data: { chatId: string; readerId: string }) => {
      if (activeChatIdRef.current === data.chatId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.senderId !== data.readerId) {
              return { ...m, status: 'READ' };
            }
            return m;
          })
        );
      }
      setChats((prev) =>
        prev.map((chat) => (chat.id === data.chatId ? { ...chat, unreadCount: 0 } : chat))
      );
    });

    socket.on('messages_delivered_bulk', (data: { chatId: string; recipientId: string }) => {
      if (activeChatIdRef.current === data.chatId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.senderId !== data.recipientId && m.status === 'SENT') {
              return { ...m, status: 'DELIVERED' };
            }
            return m;
          })
        );
      }
    });

    socket.on('load_statuses', (loaded: Story[]) => {
      setStatuses((prev) => {
        const map = new Map<string, Story>();
        (loaded || []).forEach((s) => map.set(s.id, s));
        prev.forEach((s) => {
          if (!map.has(s.id)) map.set(s.id, s);
        });
        return Array.from(map.values());
      });
    });
    socket.on('status_posted', (status: Story) => {
      setStatuses((prev) => {
        if (prev.some((s) => s.id === status.id)) return prev;
        const updated = [status, ...prev];
        try {
          localStorage.setItem('local_statuses', JSON.stringify(updated.slice(0, 30)));
        } catch (e) {}
        return updated;
      });
    });

    socket.on('incoming_call', (data: any) => {
      setIncomingCall(data);
      playIncomingRingtone();
    });

    socket.on('call_accepted', (data: any) => {
      window.dispatchEvent(new CustomEvent('call_accepted', { detail: data }));
    });

    socket.on('call_declined', (data: any) => {
      window.dispatchEvent(new CustomEvent('call_declined', { detail: data }));
    });

    socket.on('call_ended', (data: any) => {
      setIncomingCall(null);
      stopIncomingRingtone();
      window.dispatchEvent(new CustomEvent('call_ended', { detail: data }));
    });

    socket.on('call_signal', (data: any) => {
      window.dispatchEvent(new CustomEvent('call_signal', { detail: data }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user?.id]);

  const loginPhone = async (phoneNumber: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      return { success: true, otp: data.otp };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const verifyOtp = async (phoneNumber: string, otp: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid OTP');

      localStorage.setItem('chat_user', JSON.stringify(data.user));
      localStorage.setItem('chat_token', data.accessToken);
      localStorage.setItem('chat_refresh_token', data.refreshToken);

      setUser(data.user);
      setAccessToken(data.accessToken);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const checkPhone = async (phoneNumber: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to check phone number');
      return { success: true, exists: data.exists };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const loginPass = async (phoneNumber: string, pass: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login-pass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to login');

      localStorage.setItem('chat_user', JSON.stringify(data.user));
      localStorage.setItem('chat_token', data.accessToken);
      localStorage.setItem('chat_refresh_token', data.refreshToken);

      setUser(data.user);
      setAccessToken(data.accessToken);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const registerPass = async (phoneNumber: string, pass: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/register-pass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to register');

      localStorage.setItem('chat_user', JSON.stringify(data.user));
      localStorage.setItem('chat_token', data.accessToken);
      localStorage.setItem('chat_refresh_token', data.refreshToken);

      setUser(data.user);
      setAccessToken(data.accessToken);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('chat_refresh_token');
    fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    }).catch(console.error);

    localStorage.removeItem('chat_user');
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_refresh_token');
    setUser(null);
    setAccessToken(null);
    setChats([]);
    setActiveChatId(null);
    setMessages([]);
  };

  const fetchChats = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        // Strict deduplication by otherMember.id for 1-to-1 chats to eliminate duplicate entries
        const seenOtherUsers = new Set<string>();
        const uniqueChats: Chat[] = [];
        for (const c of data) {
          if (!c.isGroup && c.otherMember?.id) {
            if (seenOtherUsers.has(c.otherMember.id)) continue;
            seenOtherUsers.add(c.otherMember.id);
          }
          uniqueChats.push(c);
        }
        setChats(uniqueChats);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  };

  const fetchMessages = async (chatId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const sendMessage = (content: string, replyToId?: string) => {
    if (!socketRef.current || !activeChatId) return;
    socketRef.current.emit(
      'send_message',
      { chatId: activeChatId, content, type: 'TEXT', replyToId }
    );
  };

  const sendTyping = (isTyping: boolean) => {
    if (!socketRef.current || !activeChatId) return;
    socketRef.current.emit('typing', { chatId: activeChatId, isTyping });
  };

  const postStatus = (text: string, mediaUrl?: string) => {
    if (!user) return;
    const newStatus: Story = {
      id: 'status_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      userId: user.id,
      name: user.displayName || user.username,
      avatar: user.avatarUrl || (user.displayName || user.username).slice(0, 2).toUpperCase(),
      text: text || '',
      mediaUrl: mediaUrl || '',
      time: 'Just now'
    };

    // Optimistically update local state & localStorage immediately
    setStatuses((prev) => {
      const filtered = prev.filter((s) => s.id !== newStatus.id);
      const updated = [newStatus, ...filtered];
      try {
        localStorage.setItem('local_statuses', JSON.stringify(updated.slice(0, 30)));
      } catch (e) {}
      return updated;
    });

    if (socketRef.current) {
      socketRef.current.emit('post_status', {
        text: text || '',
        mediaUrl: mediaUrl || '',
        name: user.displayName || user.username,
        avatar: user.avatarUrl || '',
        userId: user.id
      });
    }
  };

  const emitCallUser = (type: 'voice' | 'video', recipientId: string, callerName: string) => {
    if (socketRef.current && activeChatId) {
      socketRef.current.emit('call_user', {
        chatId: activeChatId,
        type,
        recipientId,
        callerName
      });
    }
  };

  const emitAcceptCall = () => {
    if (socketRef.current && incomingCall) {
      socketRef.current.emit('accept_call', {
        callerId: incomingCall.callerId,
        chatId: incomingCall.chatId
      });
      setIncomingCall(null);
      stopIncomingRingtone();
    }
  };

  const emitDeclineCall = () => {
    if (socketRef.current && incomingCall) {
      socketRef.current.emit('decline_call', {
        callerId: incomingCall.callerId,
        chatId: incomingCall.chatId
      });
      setIncomingCall(null);
      stopIncomingRingtone();
    }
  };

  const emitEndCall = (recipientId: string) => {
    if (socketRef.current && activeChatId) {
      socketRef.current.emit('end_call', {
        chatId: activeChatId,
        recipientId
      });
    }
  };

  const emitCallSignal = (recipientId: string, signalData: { offer?: any; answer?: any; candidate?: any }) => {
    if (socketRef.current && activeChatId) {
      socketRef.current.emit('call_signal', {
        chatId: activeChatId,
        recipientId,
        offer: signalData.offer || null,
        answer: signalData.answer || null,
        candidate: signalData.candidate || null
      });
    }
  };

  const fetchContacts = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/users/contacts`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const seen = new Set<string>();
        const uniqueContacts: any[] = [];
        for (const c of data) {
          const key = c.id || c.phoneNumber;
          if (seen.has(key)) continue;
          seen.add(key);
          uniqueContacts.push(c);
        }
        setContacts(uniqueContacts);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const addContact = async (phoneNumber: string, nickname?: string) => {
    try {
      const res = await fetch(`${API_URL}/users/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ phoneNumber, nickname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add contact');
      await fetchContacts();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const searchUsers = async (query: string): Promise<User[]> => {
    if (!accessToken || !query) return [];
    try {
      const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      return res.ok ? data : [];
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  };

  const startChatWithUser = async (recipientId: string): Promise<string | null> => {
    if (!accessToken) return null;
    try {
      const res = await fetch(`${API_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ recipientId }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchChats();
        setActiveChatId(data.id);
        return data.id;
      }
      return null;
    } catch (err) {
      console.error('Error starting chat:', err);
      return null;
    }
  };

  const togglePin = async (chatId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}/pin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        await fetchChats();
      }
    } catch (err) {
      console.error('Error pinning chat:', err);
    }
  };

  const toggleArchive = async (chatId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}/archive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        await fetchChats();
        if (activeChatId === chatId) {
          setActiveChatId(null);
        }
      }
    } catch (err) {
      console.error('Error archiving chat:', err);
    }
  };

  const toggleStarMessage = async (messageId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/chats/messages/${messageId}/star`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isStarred: data.isStarred } : m))
        );
      }
    } catch (err) {
      console.error('Error starring message:', err);
    }
  };

  const deleteMessageForMe = async (messageId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/chats/messages/${messageId}/delete-for-me`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        await fetchChats();
      }
    } catch (err) {
      console.error('Error deleting message for me:', err);
    }
  };

  const deleteMessageEveryone = (messageId: string) => {
    if (!socketRef.current || !activeChatId) return;
    socketRef.current.emit('delete_message_everyone', { chatId: activeChatId, messageId });
  };

  const editMessage = (messageId: string, content: string) => {
    if (!socketRef.current || !activeChatId) return;
    socketRef.current.emit('edit_message', { chatId: activeChatId, messageId, content });
  };

  const updateProfileSettings = async (data: any) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });
      const updatedUser = await res.json();
      if (res.ok) {
        setUser(updatedUser);
        localStorage.setItem('chat_user', JSON.stringify(updatedUser));
      } else {
        throw new Error(updatedUser.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile settings:', err);
    }
  };

  const createGroupChat = async (name: string, memberIds: string[], description?: string): Promise<string | null> => {
    if (!accessToken) return null;
    try {
      const res = await fetch(`${API_URL}/chats/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, memberIds, description }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchChats();
        setActiveChatId(data.id);
        return data.id;
      }
      return null;
    } catch (err) {
      console.error('Error creating group chat:', err);
      return null;
    }
  };

  const addMembersToGroup = async (chatId: string, memberIds: string[]): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ memberIds }),
      });
      if (res.ok) {
        await fetchChats();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adding members to group:', err);
      return false;
    }
  };

  const toggleAdminRole = async (chatId: string, targetUserId: string, isAdmin: boolean): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}/members/${targetUserId}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isAdmin }),
      });
      if (res.ok) {
        await fetchChats();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error toggling admin role:', err);
      return false;
    }
  };

  const removeMemberFromGroup = async (chatId: string, targetUserId: string): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}/members/${targetUserId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        await fetchChats();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error removing member from group:', err);
      return false;
    }
  };

  const updateGroupDetails = async (chatId: string, data: { name?: string; description?: string }): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchChats();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating group details:', err);
      return false;
    }
  };

  const joinGroupViaInvite = async (chatId: string): Promise<string | null> => {
    if (!accessToken) return null;
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const chat = await res.json();
        await fetchChats();
        setActiveChatId(chat.id);
        return chat.id;
      }
      return null;
    } catch (err) {
      console.error('Error joining group via invite:', err);
      return null;
    }
  };

  const deleteChat = async (chatId: string): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (activeChatId === chatId) {
          setActiveChatId(null);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting chat:', err);
      return false;
    }
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    if (!socketRef.current || !activeChatId) return;
    socketRef.current.emit('toggle_reaction', { chatId: activeChatId, messageId, emoji });
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  return (
    <ChatContext.Provider
      value={{
        user,
        accessToken,
        chats,
        activeChatId,
        activeChat,
        messages,
        contacts,
        onlineUsers,
        typingUsers,
        statuses,
        incomingCall,
        setIncomingCall,
        emitCallUser,
        emitAcceptCall,
        emitDeclineCall,
        emitEndCall,
        emitCallSignal,
        isLoading,
        loginPhone,
        verifyOtp,
        checkPhone,
        loginPass,
        registerPass,
        logout,
        selectChat,
        fetchChats,
        refreshAllData,
        sendMessage,
        sendTyping,
        postStatus,
        fetchContacts,
        addContact,
        searchUsers,
        startChatWithUser,
        togglePin,
        toggleArchive,
        toggleStarMessage,
        deleteMessageForMe,
        deleteMessageEveryone,
        editMessage,
        updateProfileSettings,
        createGroupChat,
        addMembersToGroup,
        toggleAdminRole,
        removeMemberFromGroup,
        updateGroupDetails,
        joinGroupViaInvite,
        deleteChat,
        toggleReaction,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
