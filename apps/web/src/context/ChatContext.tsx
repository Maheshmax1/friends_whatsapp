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
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
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
  unreadCount: number;
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
  isLoading: boolean;
  loginPhone: (phoneNumber: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  selectChat: (chatId: string) => void;
  sendMessage: (content: string) => void;
  sendTyping: (isTyping: boolean) => void;
  fetchContacts: () => Promise<void>;
  addContact: (phoneNumber: string, nickname?: string) => Promise<{ success: boolean; error?: string }>;
  searchUsers: (query: string) => Promise<User[]>;
  startChatWithUser: (recipientId: string) => Promise<string | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

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
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const activeChatIdRef = useRef<string | null>(null);

  // Sync activeChatId with ref so socket listeners see fresh value
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
    if (activeChatId) {
      setMessages([]);
      fetchMessages(activeChatId);
      // Join socket chat room
      if (socketRef.current) {
        socketRef.current.emit('join_chat', { chatId: activeChatId });
      }
    }
  }, [activeChatId]);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('chat_user');
    const storedToken = localStorage.getItem('chat_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
    }
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
      // If message is in active chat, append it
      if (activeChatIdRef.current === message.chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        // Send read receipt if we are not the sender
        if (message.senderId !== user?.id) {
          socket.emit('read_receipt', { chatId: message.chatId, messageId: message.id });
        }
      }

      // Update active chat's last message in the list
      setChats((prev) =>
        prev
          .map((chat) => {
            if (chat.id === message.chatId) {
              return {
                ...chat,
                lastMessage: message,
                unreadCount: activeChatIdRef.current === message.chatId ? 0 : chat.unreadCount + 1,
              };
            }
            return chat;
          })
          .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      );
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
      // Also update isOnline inside active chats
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
      return { success: true, otp: data.otp }; // OTP only returned in dev mode
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
      if (res.ok) setChats(data);
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

  const sendMessage = (content: string) => {
    if (!socketRef.current || !activeChatId) return;
    socketRef.current.emit(
      'send_message',
      { chatId: activeChatId, content, type: 'TEXT' }
    );
  };

  const sendTyping = (isTyping: boolean) => {
    if (!socketRef.current || !activeChatId) return;
    socketRef.current.emit('typing', { chatId: activeChatId, isTyping });
  };

  const fetchContacts = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/users/contacts`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setContacts(data);
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
        isLoading,
        loginPhone,
        verifyOtp,
        logout,
        selectChat: setActiveChatId,
        sendMessage,
        sendTyping,
        fetchContacts,
        addContact,
        searchUsers,
        startChatWithUser,
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
