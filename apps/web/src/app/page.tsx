'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { 
  Send, Phone, Search, UserPlus, LogOut, MessageSquare, 
  Settings, Users, Shield, Compass, Sparkles, Smile, Image as ImageIcon,
  Check, CheckCheck, Loader2, ArrowRight, User, AlertCircle, Plus, X,
  Video, MoreVertical, Trash2, Heart, Copy, Bookmark, Paintbrush, Play,
  Pin, Archive, Star, Reply, CornerUpRight, Edit2, ShieldAlert, Moon, Sun, 
  Database, ArrowLeft, Menu, Camera, ToggleLeft, ToggleRight
} from 'lucide-react';

type ThemeName = 'royal' | 'emerald' | 'ocean' | 'rose';

interface Story {
  id: string;
  name: string;
  avatar: string;
  mediaUrl: string;
  text: string;
  time: string;
}

export default function Home() {
  const {
    user,
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
    selectChat,
    sendMessage,
    sendTyping,
    addContact,
    searchUsers,
    startChatWithUser,
    togglePin,
    toggleArchive,
    toggleStarMessage,
    deleteMessageForMe,
    deleteMessageEveryone,
    editMessage,
    updateProfileSettings
  } = useChat();

  // Auth States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  // UI Customization States
  const [activeTheme, setActiveTheme] = useState<ThemeName>('royal');
  const [chatWallpaper, setChatWallpaper] = useState<string>('mesh-indigo');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Slide-out Drawer Side Navigation Menu (Controls profile & settings)
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Profile Edit States
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Responsive Toggling State ('list' shows chat list, 'chat' shows message history)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Dashboard Navigation States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'archived'>('chats');
  const [showAddContact, setShowAddContact] = useState(false);

  // Chat Filtering
  const [localChatSearch, setLocalChatSearch] = useState('');

  // Message Interaction States
  const [messageInput, setMessageInput] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<any | null>(null);

  // Contact Dialog States
  const [contactPhone, setContactPhone] = useState('');
  const [contactNickname, setContactNickname] = useState('');
  const [callModal, setCallModal] = useState<{ isOpen: boolean; type: 'voice' | 'video'; name: string } | null>(null);
  
  // Status/Stories States
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mock Stories (WhatsApp Status style)
  const stories: Story[] = [
    { id: '1', name: 'Rihz', avatar: 'RZ', mediaUrl: '', text: 'Weekend vibes only! 🥂✨', time: '2h ago' },
    { id: '2', name: 'Abishek', avatar: 'AB', mediaUrl: '', text: 'Building the next big thing... 🚀💻', time: '5h ago' },
    { id: '3', name: 'Sanjay', avatar: 'SJ', mediaUrl: '', text: 'Sunset at the beach 🌅🌊', time: '12h ago' },
    { id: '4', name: 'Dharani', avatar: 'DH', mediaUrl: '', text: 'Coffee, code, repeat. ☕️🔋', time: '20h ago' },
  ];

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Load profile editing values when settings drawer opens
  useEffect(() => {
    if (user && showSettingsDrawer) {
      setEditDisplayName(user.displayName || '');
      setEditBio(user.bio || '');
      setEditAvatarUrl(user.avatarUrl || '');
    }
  }, [user, showSettingsDrawer]);

  // Sync Dark/Light Mode with HTML document class
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle active chat selection change to toggle view on mobile
  useEffect(() => {
    if (activeChatId) {
      setMobileView('chat');
    } else {
      setMobileView('list');
    }
  }, [activeChatId]);

  // Story Progress Timer
  useEffect(() => {
    if (!activeStory) return;
    setStoryProgress(0);
    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setActiveStory(null);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [activeStory]);

  // Handle global user search
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setIsSearching(true);
      const delayDebounce = setTimeout(async () => {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Handle typing status emitting
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    sendTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    if (editingMessage) {
      editMessage(editingMessage.id, messageInput.trim());
      setEditingMessage(null);
    } else {
      sendMessage(messageInput.trim(), replyingToMessage?.id);
      setReplyingToMessage(null);
    }

    setMessageInput('');
    sendTyping(false);
  };

  // Profile update save handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    await updateProfileSettings({
      displayName: editDisplayName,
      bio: editBio,
      avatarUrl: editAvatarUrl
    });
    setIsSavingSettings(false);
    setShowSettingsDrawer(false); // Close drawer on save
    alert('Profile updated successfully!');
  };

  // Toggle privacy switch helper
  const handleTogglePrivacy = async (field: 'showLastSeen' | 'showReadReceipts' | 'allowNotifications', currentVal: boolean) => {
    await updateProfileSettings({
      [field]: !currentVal
    });
  };

  // Auth Functions
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setAuthError('');
    setIsSubmitting(true);
    const result = await loginPhone(phoneNumber);
    setIsSubmitting(false);
    if (result.success) {
      setStep('otp');
      if (result.otp) {
        setDevOtp(result.otp);
      }
    } else {
      setAuthError(result.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setAuthError('');
    setIsSubmitting(true);
    const result = await verifyOtp(phoneNumber, otp);
    setIsSubmitting(false);
    if (result.success) {
      // Logged in!
    } else {
      setAuthError(result.error || 'Invalid OTP code');
    }
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPhone.trim()) return;
    const res = await addContact(contactPhone, contactNickname);
    if (res.success) {
      setContactPhone('');
      setContactNickname('');
      setShowAddContact(false);
    } else {
      alert(res.error || 'User not found or database error');
    }
  };

  const handleCall = (type: 'voice' | 'video') => {
    if (!activeChat) return;
    setCallModal({
      isOpen: true,
      type,
      name: activeChat.name,
    });
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Message copied to clipboard');
  };

  const handleSelectForwardTarget = (chatId: string) => {
    if (!forwardingMessage) return;
    sendMessage(forwardingMessage.content, undefined);
    alert('Message forwarded successfully');
    setForwardingMessage(null);
  };

  // Theme Accent Selectors
  const getThemeClass = () => {
    switch (activeTheme) {
      case 'emerald':
        return {
          primary: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/10',
          bubbleSent: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950',
          textAccent: 'text-emerald-400',
          borderAccent: 'focus:border-emerald-500/60 focus:ring-emerald-500/20',
          ringAccent: 'border-emerald-500',
          textAccentHover: 'hover:text-emerald-400',
          activeBg: 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20',
        };
      case 'ocean':
        return {
          primary: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/10',
          bubbleSent: 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white',
          textAccent: 'text-cyan-400',
          borderAccent: 'focus:border-cyan-500/60 focus:ring-cyan-500/20',
          ringAccent: 'border-cyan-500',
          textAccentHover: 'hover:text-cyan-400',
          activeBg: 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20',
        };
      case 'rose':
        return {
          primary: 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/10',
          bubbleSent: 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white',
          textAccent: 'text-rose-455',
          borderAccent: 'focus:border-rose-500/60 focus:ring-rose-500/20',
          ringAccent: 'border-rose-500',
          textAccentHover: 'hover:text-rose-455',
          activeBg: 'bg-rose-600/10 text-rose-400 border border-rose-500/20',
        };
      case 'royal':
      default:
        return {
          primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10',
          bubbleSent: 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white',
          textAccent: 'text-indigo-400',
          borderAccent: 'focus:border-indigo-500/60 focus:ring-indigo-500/20',
          ringAccent: 'border-indigo-500',
          textAccentHover: 'hover:text-indigo-400',
          activeBg: 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20',
        };
    }
  };

  const getWallpaperClass = () => {
    switch (chatWallpaper) {
      case 'solid-dark':
        return 'bg-slate-950';
      case 'solid-slate':
        return 'bg-slate-900';
      case 'mesh-violet':
        return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/40 via-slate-950 to-slate-950';
      case 'mesh-indigo':
      default:
        return 'bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950';
    }
  };

  const themeStyle = getThemeClass();

  // Filtered Chats Calculations
  const getFilteredChats = () => {
    let result = chats;
    if (activeTab === 'archived') {
      result = chats.filter((c) => c.isArchived);
    } else {
      result = chats.filter((c) => !c.isArchived);
    }

    if (localChatSearch.trim()) {
      const q = localChatSearch.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }

    return [...result].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
  };

  const filteredChatsList = getFilteredChats();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white select-none overflow-hidden">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full border border-indigo-500/30 animate-ping"></div>
          <div className="absolute w-16 h-16 rounded-full border border-violet-500/50 animate-pulse"></div>
          <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <p className="mt-8 text-slate-400 text-sm tracking-wider font-light">LOADING HALO CHAT...</p>
      </div>
    );
  }

  // AUTH SCREEN
  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
        <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }}></div>

        <div className="w-full max-w-md glass bg-slate-900/30 backdrop-blur-3xl border border-slate-800/80 shadow-[0_0_50px_rgba(99,102,241,0.15)] rounded-[32px] p-8 relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-violet-100 to-pink-200 tracking-tight">
              Halo Chat
            </h1>
            <p className="text-slate-400 text-xs mt-1.5 font-light tracking-wide">Premium Encrypted Communication</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Enter phone number (e.g. 9876543210)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 rounded-xl py-3.5 pl-14 pr-4 text-white text-sm outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl py-3.5 text-sm font-semibold transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest">Verification Code</label>
                  <button type="button" onClick={() => setStep('phone')} className="text-indigo-400 text-xs hover:underline">
                    Change Number
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 rounded-xl py-3.5 px-4 text-white text-center text-lg tracking-[0.5em] outline-none transition-all focus:ring-1 focus:ring-indigo-500/20 font-bold"
                />
              </div>

              {devOtp && (
                <div className="p-4 bg-slate-950/80 border border-indigo-500/20 rounded-2xl text-center">
                  <span className="text-slate-400 text-xs block mb-1">Development mode code:</span>
                  <span className="text-indigo-300 text-xl font-extrabold tracking-widest">{devOtp}</span>
                  <p className="text-[10px] text-slate-500 mt-1.5">(Or enter 123456 to bypass immediately)</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl py-3.5 text-sm font-semibold transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Verify & Login</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD SCREEN (h-screen fixed viewport)
  return (
    <div className="h-screen w-screen flex bg-slate-950 text-white relative overflow-hidden select-none dark:bg-slate-950 light:bg-slate-50 light:text-slate-900 transition-colors duration-300">
      
      {/* Decorative Background Orbs */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>
      <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-violet-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '15s' }}></div>

      {/* DASHBOARD WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative z-10 h-full w-full">
        
        {/* SIDEBAR (LEFT SECTION - Responsive Width) */}
        <div className={`w-full md:w-[340px] border-r border-slate-900 dark:border-slate-900 light:border-slate-200 flex flex-col bg-slate-950/70 backdrop-blur-xl dark:bg-slate-950/70 light:bg-white/80 h-full overflow-hidden shrink-0 transition-all ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-900/60 dark:border-slate-900/60 light:border-slate-100">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSettingsDrawer(true)}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-indigo-500/10 relative hover:scale-105 transition-transform"
              >
                {user.displayName?.slice(0, 2).toUpperCase() || 'HA'}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></div>
              </button>
              <div className="truncate max-w-[130px]">
                <h4 className="text-xs font-semibold leading-none truncate dark:text-white light:text-slate-800">{user.displayName || 'Halo User'}</h4>
                <span className="text-[10px] text-slate-450 mt-1 truncate block font-light dark:text-slate-400 light:text-slate-500">{user.phoneNumber}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowSettingsDrawer(true)} 
                title="Settings & Profile"
                className="w-8 h-8 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowAddContact(true)} 
                title="Add Contact"
                className="w-8 h-8 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-800 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button 
                onClick={logout} 
                title="Logout"
                className="w-8 h-8 rounded-lg hover:bg-rose-950/20 dark:hover:bg-rose-950/20 light:hover:bg-rose-100 flex items-center justify-center text-slate-400 hover:text-rose-455 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Stories Row (WhatsApp Status style) */}
          <div className="p-3 border-b border-slate-900/60 dark:border-slate-900/60 light:border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Status Updates</span>
            <div className="flex gap-3 overflow-x-auto pb-1 select-none">
              <div className="flex flex-col items-center shrink-0 cursor-pointer group">
                <div className="w-12 h-12 rounded-full border border-dashed border-slate-700 flex items-center justify-center mb-1 group-hover:border-indigo-500 transition-colors">
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <span className="text-[9px] text-slate-400 font-light truncate max-w-[50px]">My Status</span>
              </div>
              
              {stories.map((story) => (
                <div 
                  key={story.id} 
                  onClick={() => setActiveStory(story)}
                  className="flex flex-col items-center shrink-0 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-full border-2 ${themeStyle.ringAccent} p-0.5 mb-1 hover:scale-105 transition-transform`}>
                    <div className="w-full h-full rounded-full bg-slate-855 flex items-center justify-center font-bold text-xs text-indigo-300 bg-slate-900 dark:bg-slate-900 light:bg-slate-100">
                      {story.avatar}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-300 dark:text-slate-300 light:text-slate-700 font-light truncate max-w-[50px]">{story.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Search Inputs (Filters local chats + global search) */}
          <div className="p-3 space-y-2">
            <div className="relative">
              <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-505 w-4 h-4 my-auto pointer-events-none" />
              <input
                type="text"
                placeholder="Search active chats..."
                value={localChatSearch}
                onChange={(e) => setLocalChatSearch(e.target.value)}
                className="w-full bg-slate-900/50 dark:bg-slate-900/50 light:bg-slate-50 border border-slate-900 dark:border-slate-900 light:border-slate-200 focus:border-indigo-500/50 rounded-xl py-2 pl-10 pr-4 text-xs text-white dark:text-white light:text-slate-800 outline-none transition-all focus:ring-1 focus:ring-indigo-500/10"
              />
            </div>
            
            <div className="relative">
              <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-505 w-4 h-4 my-auto pointer-events-none" />
              <input
                type="text"
                placeholder="Search global directory (add contacts)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 dark:bg-slate-900/50 light:bg-slate-50 border border-slate-900 dark:border-slate-900 light:border-slate-200 focus:border-indigo-500/50 rounded-xl py-2 pl-10 pr-4 text-xs text-white dark:text-white light:text-slate-800 outline-none transition-all focus:ring-1 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          {/* Search Results Drawer */}
          {searchQuery.trim().length > 1 && (
            <div className="flex-1 overflow-y-auto px-2 border-b border-slate-900/60 dark:border-slate-900/60 light:border-slate-100 bg-slate-950/40">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest px-2 block mb-2 mt-2">
                Global Users Found
              </span>
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-4">No users found</p>
              ) : (
                searchResults.map((resultUser) => (
                  <button
                    key={resultUser.id}
                    onClick={() => {
                      startChatWithUser(resultUser.id);
                      setSearchQuery('');
                      setMobileView('chat');
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-indigo-950/20 text-left transition-colors mb-1.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/20 flex items-center justify-center text-xs font-semibold">
                      {resultUser.displayName?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-medium text-slate-200 dark:text-slate-200 light:text-slate-700 truncate">{resultUser.displayName || resultUser.username}</h5>
                      <p className="text-[10px] text-slate-500 truncate">{resultUser.phoneNumber}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Tab Navigation */}
          {searchQuery.trim().length <= 1 && (
            <div className="flex px-3 gap-1 pb-2">
              <button
                onClick={() => { setActiveTab('chats'); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'chats' 
                    ? themeStyle.activeBg
                    : 'text-slate-500 hover:text-slate-300 dark:hover:text-slate-355 light:hover:text-slate-700'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => { setActiveTab('contacts'); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'contacts' 
                    ? themeStyle.activeBg
                    : 'text-slate-500 hover:text-slate-300 dark:hover:text-slate-355 light:hover:text-slate-700'
                }`}
              >
                Contacts
              </button>
              <button
                onClick={() => { setActiveTab('archived'); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'archived' 
                    ? themeStyle.activeBg
                    : 'text-slate-500 hover:text-slate-300 dark:hover:text-slate-355 light:hover:text-slate-700'
                }`}
              >
                Archived
              </button>
            </div>
          )}

          {/* Active Lists */}
          {searchQuery.trim().length <= 1 && (
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
              {activeTab === 'chats' || activeTab === 'archived' ? (
                filteredChatsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 px-4 py-8">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-[11px] text-center font-light leading-relaxed">No conversations here.</p>
                  </div>
                ) : (
                  filteredChatsList.map((chat) => {
                    const isChatActive = chat.id === activeChatId;
                    const isOnline = chat.otherMember?.isOnline || onlineUsers[chat.otherMember?.id || ''];
                    const isTyping = typingUsers[chat.otherMember?.id || ''];

                    return (
                      <div 
                        key={chat.id}
                        className={`group/item w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all mb-1.5 border border-transparent ${
                          isChatActive 
                            ? 'bg-indigo-950/20 dark:bg-indigo-950/20 light:bg-indigo-50 border-indigo-500/20 text-white dark:text-white light:text-slate-800' 
                            : 'hover:bg-slate-900/40 dark:hover:bg-slate-900/40 light:hover:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900'
                        }`}
                      >
                        <button
                          onClick={() => {
                            selectChat(chat.id);
                            setMobileView('chat');
                          }}
                          className="flex-1 flex items-center gap-3 min-w-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-900 light:bg-slate-250 border border-slate-805 dark:border-slate-805 light:border-slate-300 flex items-center justify-center font-semibold text-xs relative">
                            {chat.name.slice(0, 2).toUpperCase()}
                            {isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <h5 className="text-xs font-semibold truncate leading-none">{chat.name}</h5>
                              <span className="text-[9px] text-slate-500 shrink-0">
                                {chat.lastMessage 
                                  ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                  : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                              {isTyping ? (
                                <span className="text-indigo-400 font-medium animate-pulse">typing...</span>
                              ) : chat.lastMessage?.isDeleted ? (
                                <span className="italic text-slate-550">This message was deleted</span>
                              ) : (
                                chat.lastMessage?.content || 'No messages yet'
                              )}
                            </p>
                          </div>
                        </button>
                        
                        <div className="opacity-0 group-hover/item:opacity-100 flex gap-1 shrink-0 ml-1.5 transition-opacity">
                          <button
                            onClick={() => togglePin(chat.id)}
                            title={chat.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                            className={`w-6 h-6 rounded flex items-center justify-center hover:bg-slate-900 text-slate-450 ${chat.isPinned ? 'text-indigo-400' : ''}`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleArchive(chat.id)}
                            title={chat.isArchived ? 'Unarchive Chat' : 'Archive Chat'}
                            className={`w-6 h-6 rounded flex items-center justify-center hover:bg-slate-900 text-slate-455 ${chat.isArchived ? 'text-indigo-400' : ''}`}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 px-4 py-8">
                    <Users className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-[11px] text-center font-light leading-relaxed">No contacts yet.</p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        startChatWithUser(contact.id);
                        setActiveTab('chats');
                        setMobileView('chat');
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl text-left hover:bg-slate-900/40 dark:hover:bg-slate-900/40 light:hover:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-all mb-1.5"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-900 light:bg-slate-200 border border-slate-800 dark:border-slate-800 light:border-slate-300 flex items-center justify-center font-semibold text-xs relative">
                        {contact.displayName.slice(0, 2).toUpperCase()}
                        {contact.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-semibold truncate leading-none mb-1">{contact.displayName}</h5>
                        <p className="text-[10px] text-slate-500 truncate leading-none">{contact.phoneNumber}</p>
                      </div>
                    </button>
                  ))
                )
              )}
            </div>
          )}
        </div>

        {/* CHAT WINDOW (RIGHT SECTION - Responsive Toggling) */}
        <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}>
          
          {activeChat ? (
            <div className={`flex-1 flex flex-col h-full overflow-hidden ${getWallpaperClass()} relative z-10 transition-colors duration-300`}>
              
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-900/60 dark:border-slate-900/60 light:border-slate-205 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl dark:bg-slate-950/80 light:bg-white relative z-20 shrink-0">
                <div className="flex items-center gap-3">
                  
                  {/* Mobile Back Button */}
                  <button 
                    onClick={() => { selectChat(''); setMobileView('list'); }}
                    className="block md:hidden p-1.5 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-800 shrink-0 transition-colors"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center font-bold text-xs">
                    {activeChat.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold leading-tight">{activeChat.name}</h4>
                    <span className="text-[9px] text-slate-400">
                      {typingUsers[activeChat.otherMember?.id || ''] ? (
                        <span className="text-indigo-400 font-medium animate-pulse">typing...</span>
                      ) : activeChat.otherMember?.isOnline || onlineUsers[activeChat.otherMember?.id || ''] ? (
                        <span className="text-emerald-400 font-medium">online</span>
                      ) : (
                        'offline'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleCall('voice')}
                    className="w-9 h-9 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-800 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleCall('video')}
                    className="w-9 h-9 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors animate-pulse"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 flex flex-col min-h-0 bg-transparent">
                <div className="flex-1"></div>
                {messages.map((message) => {
                  const isCurrentUser = message.senderId === user.id;
                  const isStarred = message.isStarred;
                  const isReplying = message.replyTo !== null;
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-100`}
                      onMouseEnter={() => setHoveredMessageId(message.id)}
                      onMouseLeave={() => {
                        setHoveredMessageId(null);
                        setActiveMenuMessageId(null);
                      }}
                    >
                      <div className="relative group max-w-[85%] md:max-w-[65%] flex items-center gap-2">
                        
                        {isCurrentUser && hoveredMessageId === message.id && (
                          <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setReplyingToMessage(message); setEditingMessage(null); }}
                              title="Reply"
                              className="w-6 h-6 rounded-full bg-slate-900/80 hover:bg-indigo-600 flex items-center justify-center text-white"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => { setEditingMessage(message); setMessageInput(message.content); setReplyingToMessage(null); }}
                              title="Edit"
                              className="w-6 h-6 rounded-full bg-slate-900/80 hover:bg-indigo-600 flex items-center justify-center text-white"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setActiveMenuMessageId(activeMenuMessageId === message.id ? null : message.id)}
                              className="w-6 h-6 rounded-full bg-slate-900/80 hover:bg-slate-800 flex items-center justify-center text-white"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className={`rounded-2xl px-4 py-2.5 shadow-md relative transition-all duration-200 ${
                          isCurrentUser 
                            ? `${themeStyle.bubbleSent} rounded-tr-none` 
                            : 'bg-slate-900/90 dark:bg-slate-900/90 light:bg-white text-slate-200 dark:text-slate-200 light:text-slate-800 rounded-tl-none border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 shadow-lg shadow-black/10'
                        }`}>
                          
                          {isStarred && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 absolute top-2 right-2" />
                          )}

                          {isReplying && message.replyTo && (
                            <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-4 border-indigo-400 text-left text-[10px] opacity-80 cursor-pointer max-w-full truncate">
                              <span className="font-semibold block text-indigo-300 leading-none">
                                {message.replyTo.sender.displayName || message.replyTo.sender.username}
                              </span>
                              <span className="text-slate-350 block mt-0.5 truncate leading-tight text-slate-350 dark:text-slate-300 light:text-slate-650">
                                {message.replyTo.content}
                              </span>
                            </div>
                          )}

                          {message.isDeleted ? (
                            <p className="text-xs leading-relaxed italic text-slate-405 flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                              <span>This message was deleted</span>
                            </p>
                          ) : (
                            <p className="text-xs leading-relaxed break-words whitespace-pre-wrap font-light">
                              {message.content}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-end gap-1.5 mt-1.5">
                            {message.isEdited && !message.isDeleted && (
                              <span className="text-[7px] opacity-60 uppercase font-bold tracking-wider">edited</span>
                            )}
                            <span className={`text-[8px] font-light select-none ${isCurrentUser ? 'text-indigo-200/80' : 'text-slate-500'}`}>
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isCurrentUser && (
                              <span>
                                {message.status === 'READ' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-cyan-200" />
                                ) : message.status === 'DELIVERED' ? (
                                  <CheckCheck className="w-3.5 h-3.5 opacity-60 text-white" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 opacity-65 text-white" />
                                )}
                              </span>
                            )}
                          </div>

                          {activeMenuMessageId === message.id && (
                            <div className="absolute right-0 top-full mt-1.5 z-40 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-2xl space-y-1 w-36 animate-in fade-in zoom-in-95 duration-100 text-white">
                              <button
                                onClick={() => { handleCopyMessage(message.content); setActiveMenuMessageId(null); }}
                                className="w-full text-left p-1.5 px-2.5 rounded-lg hover:bg-slate-800 text-[10px] flex items-center gap-2"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy Text</span>
                              </button>
                              <button
                                onClick={() => { setForwardingMessage(message); setActiveMenuMessageId(null); }}
                                className="w-full text-left p-1.5 px-2.5 rounded-lg hover:bg-slate-800 text-[10px] flex items-center gap-2"
                              >
                                <CornerUpRight className="w-3 h-3" />
                                <span>Forward</span>
                              </button>
                              <button
                                onClick={() => { toggleStarMessage(message.id); setActiveMenuMessageId(null); }}
                                className="w-full text-left p-1.5 px-2.5 rounded-lg hover:bg-slate-800 text-[10px] flex items-center gap-2"
                              >
                                <Star className="w-3 h-3" />
                                <span>{isStarred ? 'Unstar' : 'Star message'}</span>
                              </button>
                              <button
                                onClick={() => { deleteMessageForMe(message.id); setActiveMenuMessageId(null); }}
                                className="w-full text-left p-1.5 px-2.5 rounded-lg hover:bg-slate-800 hover:text-rose-400 text-rose-300 text-[10px] flex items-center gap-2 border-t border-slate-800/40 pt-1.5 mt-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete for Me</span>
                              </button>
                              {isCurrentUser && !message.isDeleted && (
                                <button
                                  onClick={() => { deleteMessageEveryone(message.id); setActiveMenuMessageId(null); }}
                                  className="w-full text-left p-1.5 px-2.5 rounded-lg hover:bg-slate-800 hover:text-rose-450 text-rose-400 text-[10px] flex items-center gap-2"
                                >
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>Delete for All</span>
                                </button>
                              )}
                            </div>
                          )}

                        </div>

                        {!isCurrentUser && hoveredMessageId === message.id && (
                          <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setReplyingToMessage(message); setEditingMessage(null); }}
                              title="Reply"
                              className="w-6 h-6 rounded-full bg-slate-900/80 hover:bg-indigo-600 flex items-center justify-center text-white"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setActiveMenuMessageId(activeMenuMessageId === message.id ? null : message.id)}
                              className="w-6 h-6 rounded-full bg-slate-900/80 hover:bg-slate-800 flex items-center justify-center text-white"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
                {typingUsers[activeChat.otherMember?.id || ''] && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-805/80 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[60%] text-slate-400 flex items-center gap-1.5 animate-pulse">
                      <span className="text-[11px] font-light">typing</span>
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Action Previews */}
              {replyingToMessage && (
                <div className="px-4 py-2 bg-slate-955/90 border-t border-slate-900 flex justify-between items-center relative z-20 shrink-0">
                  <div className="border-l-4 border-indigo-500 pl-3 py-1 flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">Replying to Message</span>
                    <p className="text-[11px] text-slate-300 truncate font-light mt-0.5">
                      {replyingToMessage.content}
                    </p>
                  </div>
                  <button 
                    onClick={() => setReplyingToMessage(null)}
                    className="w-6 h-6 rounded-full hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {editingMessage && (
                <div className="px-4 py-2 bg-slate-955/90 border-t border-slate-900 flex justify-between items-center relative z-20 shrink-0">
                  <div className="border-l-4 border-amber-500 pl-3 py-1 flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-amber-505 uppercase tracking-wider block">Editing Message</span>
                    <p className="text-[11px] text-slate-300 truncate font-light mt-0.5">
                      {editingMessage.content}
                    </p>
                  </div>
                  <button 
                    onClick={() => { setEditingMessage(null); setMessageInput(''); }}
                    className="w-6 h-6 rounded-full hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Chat Message Input Box */}
              <form 
                onSubmit={handleSend} 
                className="p-4 border-t border-slate-900/60 dark:border-slate-900/60 light:border-slate-200 bg-slate-950/80 backdrop-blur-xl dark:bg-slate-950/80 light:bg-white relative z-20 shrink-0 flex items-center gap-3"
              >
                <div className="flex-1 relative flex items-center bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-slate-805 dark:border-slate-805 light:border-slate-200 rounded-2xl focus-within:border-indigo-500/40 transition-colors">
                  <input
                    type="text"
                    placeholder={editingMessage ? 'Modify message...' : 'Type a message...'}
                    value={messageInput}
                    onChange={handleInputChange}
                    className="w-full bg-transparent py-3.5 pl-4 pr-10 text-xs text-white dark:text-white light:text-slate-850 outline-none placeholder-slate-500 font-light"
                  />
                  <button 
                    type="button" 
                    onClick={() => setMessageInput(prev => prev + ' 🚀')}
                    className="absolute right-3.5 text-slate-500 hover:text-slate-350 transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                    messageInput.trim() 
                      ? `${themeStyle.primary}` 
                      : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-850'
                  }`}
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
            </div>
          ) : (
            /* EMPTY CHAT PLACEHOLDER SCREEN */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none h-full bg-slate-950 dark:bg-slate-950 light:bg-slate-100">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                  <MessageSquare className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600/30 rounded-full animate-ping"></div>
              </div>
              <h3 className="text-lg font-bold text-slate-200 dark:text-slate-250 light:text-slate-800 mb-2 font-semibold">Welcome to Halo Chat</h3>
              <p className="text-slate-500 text-xs max-w-sm font-light leading-relaxed mb-8">
                Select a conversation from the sidebar or search for active users by phone number to start chatting.
              </p>
              
              <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
                <div className="p-4 bg-slate-900/10 dark:bg-slate-900/10 light:bg-white border border-slate-900 dark:border-slate-900 light:border-slate-200 rounded-2xl text-left shadow-sm">
                  <Shield className="w-4 h-4 text-indigo-400 mb-2" />
                  <h4 className="text-xs font-semibold text-slate-350 dark:text-slate-300 light:text-slate-700 mb-1">Encrypted Sessions</h4>
                  <p className="text-[10px] text-slate-500 leading-normal font-light">Secure handshake via JWT tokens over SSL-encrypted WebSocket channels.</p>
                </div>
                <div className="p-4 bg-slate-900/10 dark:bg-slate-900/10 light:bg-white border border-slate-900 dark:border-slate-900 light:border-slate-200 rounded-2xl text-left shadow-sm">
                  <Phone className="w-4 h-4 text-violet-400 mb-2" />
                  <h4 className="text-xs font-semibold text-slate-350 dark:text-slate-300 light:text-slate-700 mb-1">Real-Time Sync</h4>
                  <p className="text-[10px] text-slate-500 leading-normal font-light">Online indicators, typing status, and read receipts update instantly.</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* 📱 MOBILE SIDEBAR DRAWER MENU: SLIDES FROM LEFT (z-50) */}
      {/* ======================================================== */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          showSettingsDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop overlay */}
        <div 
          onClick={() => setShowSettingsDrawer(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />
        
        {/* Drawer Panel content */}
        <div 
          className={`absolute top-0 left-0 h-full w-[290px] md:w-[320px] bg-slate-950/98 dark:bg-slate-950/98 light:bg-white/98 backdrop-blur-2xl border-r border-slate-900 dark:border-slate-900 light:border-slate-200 shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-out ${
            showSettingsDrawer ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-900 dark:border-slate-900 light:border-slate-100 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Settings & Profile</span>
            <button 
              onClick={() => setShowSettingsDrawer(false)}
              className="w-7 h-7 rounded-full hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body (Scrollable settings) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0 text-slate-200 dark:text-slate-200 light:text-slate-800">
            
            {/* 🔴 NEW PROFILE DESIGN (Separated Card style with Avatar upload mock) */}
            <form onSubmit={handleSaveSettings} className="bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-50 border border-slate-850 dark:border-slate-850 light:border-slate-200 p-4 rounded-[24px] space-y-4 shadow-sm">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block text-center">My Identity</span>
              
              {/* Circular Avatar Selector Mock */}
              <div className="flex flex-col items-center gap-1.5 relative">
                <div className="relative group cursor-pointer hover:scale-102 transition-transform">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md shadow-indigo-500/10">
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-extrabold text-white text-lg">
                      {editDisplayName.slice(0, 2).toUpperCase() || 'HA'}
                    </div>
                  </div>
                  {/* Camera overlay */}
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <span className="text-[8px] text-slate-500 font-light mt-0.5">Click to update photo</span>
              </div>

              {/* Input details */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter display name"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-805 dark:border-slate-805 light:border-slate-200 focus:border-indigo-500/60 rounded-xl py-2 px-3 text-xs outline-none text-white dark:text-white light:text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Bio / Status</label>
                  <input
                    type="text"
                    placeholder="E.g. Hey there! I am using Halo Chat."
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-805 dark:border-slate-805 light:border-slate-200 focus:border-indigo-500/60 rounded-xl py-2 px-3 text-xs outline-none text-white dark:text-white light:text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Avatar Image Link</label>
                  <input
                    type="text"
                    placeholder="https://example.com/avatar.jpg"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="w-full bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-805 dark:border-slate-805 light:border-slate-200 focus:border-indigo-500/60 rounded-xl py-2 px-3 text-xs outline-none text-white dark:text-white light:text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${themeStyle.primary}`}
              >
                {isSavingSettings ? 'Saving Updates...' : 'Save Profile Details'}
              </button>
            </form>

            {/* Appearance settings */}
            <div className="bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-50 border border-slate-850 dark:border-slate-850 light:border-slate-200 p-4 rounded-[24px] space-y-4 shadow-sm">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block text-center">Appearance</span>
              
              <div className="flex justify-between items-center bg-slate-950/40 dark:bg-slate-950/40 light:bg-white p-2.5 rounded-xl border border-slate-850 dark:border-slate-850 light:border-slate-100">
                <span className="text-[10px] font-medium text-slate-350 dark:text-slate-350 light:text-slate-650">Dark Interface Mode</span>
                <button 
                  type="button"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
                >
                  {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Color Accent Theme</span>
                <div className="flex gap-1.5">
                  {(['royal', 'emerald', 'ocean', 'rose'] as ThemeName[]).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setActiveTheme(theme)}
                      className={`flex-1 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                        activeTheme === theme 
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950/40 dark:bg-slate-950/40 light:bg-white border-slate-850 dark:border-slate-850 light:border-slate-200 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Wallpaper</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'mesh-indigo', label: 'Indigo Glow' },
                    { id: 'mesh-violet', label: 'Violet Twilight' },
                    { id: 'solid-slate', label: 'Dark Slate' },
                    { id: 'solid-dark', label: 'Deep Black' }
                  ].map((wallpaper) => (
                    <button
                      key={wallpaper.id}
                      type="button"
                      onClick={() => setChatWallpaper(wallpaper.id)}
                      className={`py-1.5 px-2 rounded-lg text-[9px] truncate transition-all border ${
                        chatWallpaper === wallpaper.id
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950/40 dark:bg-slate-950/40 light:bg-white border-slate-855 dark:border-slate-855 light:border-slate-200 text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      {wallpaper.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Privacy settings */}
            {user && (
              <div className="bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-50 border border-slate-850 dark:border-slate-850 light:border-slate-200 p-4 rounded-[24px] space-y-4 shadow-sm">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block text-center">Privacy settings</span>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600">Show Last Seen status</span>
                    <button 
                      type="button"
                      onClick={() => handleTogglePrivacy('showLastSeen', user.showLastSeen)}
                      className="text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      {user.showLastSeen ? <ToggleRight className="w-6 h-6 text-indigo-400" /> : <ToggleLeft className="w-6 h-6 opacity-60" />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600">Read Receipts (Blue Ticks)</span>
                    <button 
                      type="button"
                      onClick={() => handleTogglePrivacy('showReadReceipts', user.showReadReceipts)}
                      className="text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      {user.showReadReceipts ? <ToggleRight className="w-6 h-6 text-indigo-400" /> : <ToggleLeft className="w-6 h-6 opacity-60" />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600">Sound & Push Alerts</span>
                    <button 
                      type="button"
                      onClick={() => handleTogglePrivacy('allowNotifications', user.allowNotifications)}
                      className="text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      {user.allowNotifications ? <ToggleRight className="w-6 h-6 text-indigo-400" /> : <ToggleLeft className="w-6 h-6 opacity-60" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Storage Progress */}
            <div className="bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-50 border border-slate-850 dark:border-slate-850 light:border-slate-200 p-4 rounded-[24px] space-y-3 shadow-sm">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block text-center">Local Data Status</span>
              <div className="flex justify-between items-baseline text-[9px] text-slate-500">
                <span>Disk Storage Used</span>
                <span>124 MB of 5.0 GB</span>
              </div>
              <div className="w-full bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-500 h-full w-[2.5%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALS & OVERLAYS */}
      {/* ======================================================== */}

      {/* MODAL: ADD CONTACT */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">Add Contact</h3>
            <form onSubmit={handleAddContactSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +919876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-850 focus:border-indigo-500/60 rounded-xl py-2.5 px-3.5 text-xs outline-none transition-all text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Nickname (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Best Friend"
                  value={contactNickname}
                  onChange={(e) => setContactNickname(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-850 focus:border-indigo-500/60 rounded-xl py-2.5 px-3.5 text-xs outline-none transition-all text-white"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-705 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 ${themeStyle.primary} rounded-xl text-xs font-semibold transition-colors`}
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CALLING DIALOG */}
      {callModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm flex flex-col items-center p-8 bg-gradient-to-b from-slate-900 to-slate-955 border border-slate-855 rounded-[32px] text-center shadow-2xl relative">
            <div className="absolute top-4 left-4 flex items-center gap-1.5 p-1 px-2.5 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-[9px] font-medium tracking-wide text-indigo-400 animate-pulse">
              <Shield className="w-3 h-3" />
              <span>Simulated WebRTC</span>
            </div>
            
            <div className="relative mb-8 mt-4">
              <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="absolute -inset-4 rounded-full border border-indigo-500/10 animate-ping animate-delay-300" style={{ animationDuration: '3s' }}></div>
              <div className="w-20 h-20 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center relative">
                {callModal.type === 'voice' ? (
                  <Phone className="w-8 h-8 text-indigo-400" />
                ) : (
                  <Video className="w-8 h-8 text-indigo-400 animate-pulse" />
                )}
              </div>
            </div>

            <h3 className="text-base font-bold text-white mb-1">{callModal.name}</h3>
            <p className="text-slate-400 text-xs mb-8 animate-pulse font-light">
              Connecting simulated {callModal.type} call...
            </p>

            <button
              onClick={() => setCallModal(null)}
              className="w-full max-w-[150px] bg-rose-600 hover:bg-rose-505 text-white rounded-2xl py-3 text-xs font-semibold transition-all shadow-lg shadow-rose-600/10"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* MODAL: FORWARD MESSAGE DIALOG */}
      {forwardingMessage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[70vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Forward Message</h3>
              <button 
                onClick={() => setForwardingMessage(null)}
                className="w-6 h-6 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="mb-4 p-2 rounded-xl bg-black/30 border border-slate-850 text-slate-300 text-xs truncate max-w-full font-light italic">
              "{forwardingMessage.content}"
            </div>

            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2 font-semibold">Select Recipient Chat</span>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectForwardTarget(c.id)}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 text-left text-xs flex items-center gap-3 text-slate-200 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STORY VIEWER FULLSCREEN MODAL */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none animate-in fade-in duration-300">
          <div className="w-full max-w-lg h-full max-h-[85vh] md:max-h-[90vh] bg-slate-955 border border-slate-900 md:rounded-3xl flex flex-col relative overflow-hidden shadow-2xl">
            <div className="absolute top-3 left-4 right-4 flex gap-1 z-30">
              <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${storyProgress}%` }}></div>
              </div>
            </div>

            <div className="absolute top-6 left-4 right-4 flex justify-between items-center z-30">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-slate-950 text-xs">
                  {activeStory.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white leading-none">{activeStory.name}</h4>
                  <span className="text-[9px] text-slate-400 font-light mt-1 block">{activeStory.time}</span>
                </div>
              </div>
              <button 
                onClick={() => setActiveStory(null)} 
                className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-indigo-900/40 via-purple-955/20 to-slate-950 relative">
              <div className="absolute top-1/3 left-10 text-indigo-500/10 pointer-events-none transform -rotate-12"><MessageSquare className="w-24 h-24" /></div>
              <div className="absolute bottom-1/3 right-10 text-pink-500/10 pointer-events-none transform rotate-12"><Heart className="w-24 h-24" /></div>

              <div className="max-w-md relative z-10 space-y-4">
                <p className="text-xl md:text-2xl font-extrabold text-white leading-relaxed select-text">
                  "{activeStory.text}"
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-955 border-t border-slate-900 flex justify-center text-slate-500 text-[10px] font-light">
              Press Escape or click close button to exit
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
