'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { 
  Send, Phone, Search, UserPlus, LogOut, MessageSquare, 
  Settings, Users, Shield, Compass, Sparkles, Smile, Image as ImageIcon,
  Check, CheckCheck, Loader2, ArrowRight, User, AlertCircle, Plus, X,
  Video, MoreVertical, Trash2, Heart, Copy, Bookmark, Paintbrush, Play
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
    startChatWithUser
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
  const [showSettings, setShowSettings] = useState(false);

  // Dashboard States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactNickname, setContactNickname] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
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

  // Handle user search
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
    sendMessage(messageInput.trim());
    setMessageInput('');
    sendTyping(false);
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

  // Theme styling helpers
  const getThemeClass = () => {
    switch (activeTheme) {
      case 'emerald':
        return {
          primary: 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-500/10',
          bubbleSent: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950',
          textAccent: 'text-emerald-400',
          borderAccent: 'focus:border-emerald-500/60 focus:ring-emerald-500/20',
          ringAccent: 'border-emerald-500'
        };
      case 'ocean':
        return {
          primary: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/10',
          bubbleSent: 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white',
          textAccent: 'text-cyan-400',
          borderAccent: 'focus:border-cyan-500/60 focus:ring-cyan-500/20',
          ringAccent: 'border-cyan-500'
        };
      case 'rose':
        return {
          primary: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/10',
          bubbleSent: 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white',
          textAccent: 'text-rose-400',
          borderAccent: 'focus:border-rose-500/60 focus:ring-rose-500/20',
          ringAccent: 'border-rose-500'
        };
      case 'royal':
      default:
        return {
          primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10',
          bubbleSent: 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white',
          textAccent: 'text-indigo-400',
          borderAccent: 'focus:border-indigo-500/60 focus:ring-indigo-500/20',
          ringAccent: 'border-indigo-500'
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
        {/* Animated Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }}></div>

        <div className="w-full max-w-md glass bg-slate-900/30 backdrop-blur-3xl border border-slate-800/80 shadow-[0_0_50px_rgba(99,102,241,0.15)] rounded-[32px] p-8 relative z-10 transition-all duration-300">
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

          <div className="mt-8 text-center text-[10px] text-slate-500 font-light border-t border-slate-850/60 pt-4 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-500/40" />
            <span>Secured login session</span>
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD SCREEN (h-screen fixed viewport)
  return (
    <div className="h-screen w-screen flex bg-slate-950 text-white relative overflow-hidden select-none">
      
      {/* Decorative Blur Background Orbs */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>
      <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-violet-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '15s' }}></div>

      {/* DASHBOARD WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative z-10 h-full w-full">
        
        {/* SIDEBAR (LEFT SECTION - fixed height) */}
        <div className="w-[340px] border-r border-slate-900 flex flex-col bg-slate-950/70 backdrop-blur-xl h-full overflow-hidden shrink-0">
          
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-indigo-500/10 relative">
                {user.displayName?.slice(0, 2).toUpperCase() || 'HA'}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></div>
              </div>
              <div className="truncate max-w-[130px]">
                <h4 className="text-xs font-semibold leading-none truncate">{user.displayName || 'Halo User'}</h4>
                <span className="text-[10px] text-slate-400 mt-1 truncate block font-light">{user.phoneNumber}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                title="Settings & Themes"
                className={`w-8 h-8 rounded-lg hover:bg-slate-900 flex items-center justify-center transition-colors ${showSettings ? 'text-indigo-400 bg-slate-900' : 'text-slate-400'}`}
              >
                <Paintbrush className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowAddContact(true)} 
                title="Add Contact"
                className="w-8 h-8 rounded-lg hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button 
                onClick={logout} 
                title="Logout"
                className="w-8 h-8 rounded-lg hover:bg-rose-950/20 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Theme Settings Drawer */}
          {showSettings && (
            <div className="p-4 bg-slate-900/40 border-b border-slate-900/80 space-y-4 animate-in slide-in-from-top duration-200">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Select Theme Accent</span>
                <div className="flex gap-2">
                  {(['royal', 'emerald', 'ocean', 'rose'] as ThemeName[]).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setActiveTheme(theme)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border ${
                        activeTheme === theme 
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Chat Wallpaper</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'mesh-indigo', label: 'Indigo Glow' },
                    { id: 'mesh-violet', label: 'Violet Twilight' },
                    { id: 'solid-slate', label: 'Dark Slate' },
                    { id: 'solid-dark', label: 'Deep Black' }
                  ].map((wallpaper) => (
                    <button
                      key={wallpaper.id}
                      onClick={() => setChatWallpaper(wallpaper.id)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] truncate transition-all border ${
                        chatWallpaper === wallpaper.id
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {wallpaper.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Status Stories Row (WhatsApp Status style) */}
          <div className="p-3 border-b border-slate-900/60">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Status Updates</span>
            <div className="flex gap-3 overflow-x-auto pb-1 select-none">
              {/* Add Story mock */}
              <div className="flex flex-col items-center shrink-0 cursor-pointer group">
                <div className="w-12 h-12 rounded-full border border-dashed border-slate-700 flex items-center justify-center mb-1 group-hover:border-indigo-500 transition-colors">
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <span className="text-[9px] text-slate-400 font-light truncate max-w-[50px]">My Status</span>
              </div>
              
              {/* Contact stories */}
              {stories.map((story) => (
                <div 
                  key={story.id} 
                  onClick={() => setActiveStory(story)}
                  className="flex flex-col items-center shrink-0 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-full border-2 ${themeStyle.ringAccent} p-0.5 mb-1 hover:scale-105 transition-transform`}>
                    <div className="w-full h-full rounded-full bg-slate-850 flex items-center justify-center font-bold text-xs text-indigo-300 bg-slate-900">
                      {story.avatar}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-300 font-light truncate max-w-[50px]">{story.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Search Inputs */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 w-4 h-4 my-auto pointer-events-none" />
              <input
                type="text"
                placeholder="Search users or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-900 focus:border-indigo-500/50 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          {/* Search Results Drawer */}
          {searchQuery.trim().length > 1 && (
            <div className="flex-1 overflow-y-auto px-2 border-b border-slate-900/60 bg-slate-950/40">
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
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-indigo-950/20 text-left transition-colors mb-1.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/20 flex items-center justify-center text-xs font-semibold">
                      {resultUser.displayName?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-medium text-slate-200 truncate">{resultUser.displayName || resultUser.username}</h5>
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
                onClick={() => setActiveTab('chats')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'chats' 
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'contacts' 
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Contacts ({contacts.length})
              </button>
            </div>
          )}

          {/* Active Lists (constrained height inside sidebar) */}
          {searchQuery.trim().length <= 1 && (
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
              {activeTab === 'chats' ? (
                chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 px-4 py-8">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-[11px] text-center font-light leading-relaxed">No active chats. Search above to find users or add contacts!</p>
                  </div>
                ) : (
                  chats.map((chat) => {
                    const isChatActive = chat.id === activeChatId;
                    const isOnline = chat.otherMember?.isOnline || onlineUsers[chat.otherMember?.id || ''];
                    const isTyping = typingUsers[chat.otherMember?.id || ''];

                    return (
                      <button
                        key={chat.id}
                        onClick={() => selectChat(chat.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all mb-1.5 border border-transparent ${
                          isChatActive 
                            ? 'bg-indigo-950/20 border-indigo-500/20 text-white' 
                            : 'hover:bg-slate-900/40 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-semibold text-xs relative">
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
                          <p className="text-[11px] text-slate-500 truncate leading-tight">
                            {isTyping ? (
                              <span className="text-indigo-400 font-medium animate-pulse">typing...</span>
                            ) : (
                              chat.lastMessage?.content || 'No messages yet'
                            )}
                          </p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                            {chat.unreadCount}
                          </div>
                        )}
                      </button>
                    );
                  })
                )
              ) : (
                contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 px-4 py-8">
                    <Users className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-[11px] text-center font-light leading-relaxed">No contacts yet. Click user plus icon in header to add!</p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        startChatWithUser(contact.id);
                        setActiveTab('chats');
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl text-left hover:bg-slate-900/40 text-slate-300 hover:text-white transition-all mb-1.5"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-semibold text-xs relative">
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

        {/* CHAT WINDOW (RIGHT SECTION - fixed height) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {activeChat ? (
            <div className={`flex-1 flex flex-col h-full overflow-hidden ${getWallpaperClass()} relative z-10 transition-colors duration-300`}>
              
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-900/60 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl relative z-20 shrink-0">
                <div className="flex items-center gap-3">
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
                    className="w-9 h-9 rounded-xl hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleCall('video')}
                    className="w-9 h-9 rounded-xl hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors animate-pulse"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Message History (constrained scroll area) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 flex flex-col min-h-0 bg-transparent">
                <div className="flex-1"></div> {/* Push content to bottom */}
                {messages.map((message) => {
                  const isCurrentUser = message.senderId === user.id;
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-100`}
                    >
                      <div className={`max-w-[65%] rounded-2xl px-4 py-2.5 shadow-md relative transition-all duration-200 ${
                        isCurrentUser 
                          ? `${themeStyle.bubbleSent} rounded-tr-none` 
                          : 'bg-slate-900/90 backdrop-blur-md text-slate-200 rounded-tl-none border border-slate-800/80 shadow-lg shadow-black/10'
                      }`}>
                        {/* Message content */}
                        <p className="text-xs leading-relaxed break-words whitespace-pre-wrap font-light">{message.content}</p>
                        
                        {/* Timestamp & Status ticks */}
                        <div className="flex items-center justify-end gap-1.5 mt-1.5">
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
                      </div>
                    </div>
                  );
                })}
                {typingUsers[activeChat.otherMember?.id || ''] && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-805/80 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[60%] text-slate-400 flex items-center gap-1.5">
                      <span className="text-[11px] font-light animate-pulse">typing</span>
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Message Input Box */}
              <form 
                onSubmit={handleSend} 
                className="p-4 border-t border-slate-900/60 bg-slate-950/80 backdrop-blur-xl relative z-20 shrink-0 flex items-center gap-3"
              >
                <div className="flex-1 relative flex items-center bg-slate-900/60 border border-slate-800 rounded-2xl focus-within:border-indigo-500/40 transition-colors">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={handleInputChange}
                    className="w-full bg-transparent py-3.5 pl-4 pr-10 text-xs text-white outline-none placeholder-slate-500 font-light"
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
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
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
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none h-full bg-slate-950">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                  <MessageSquare className="w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600/30 rounded-full animate-ping"></div>
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">Welcome to Halo Chat</h3>
              <p className="text-slate-500 text-xs max-w-sm font-light leading-relaxed mb-8">
                Select a conversation from the sidebar or search for active users by phone number to start chatting.
              </p>
              
              <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
                <div className="p-4 bg-slate-900/10 border border-slate-900/60 rounded-2xl text-left">
                  <Shield className="w-4 h-4 text-indigo-400 mb-2" />
                  <h4 className="text-xs font-semibold text-slate-350 mb-1">Encrypted Sessions</h4>
                  <p className="text-[10px] text-slate-500 leading-normal font-light">Secure handshake via JWT tokens over SSL-encrypted WebSocket channels.</p>
                </div>
                <div className="p-4 bg-slate-900/10 border border-slate-900/60 rounded-2xl text-left">
                  <Phone className="w-4 h-4 text-violet-400 mb-2" />
                  <h4 className="text-xs font-semibold text-slate-350 mb-1">Real-Time Sync</h4>
                  <p className="text-[10px] text-slate-500 leading-normal font-light">Online indicators, typing status, and read receipts update instantly.</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: ADD CONTACT */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/60 rounded-xl py-2.5 px-3.5 text-xs outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Nickname (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Best Friend"
                  value={contactNickname}
                  onChange={(e) => setContactNickname(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/60 rounded-xl py-2.5 px-3.5 text-xs outline-none transition-all"
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
          <div className="w-full max-w-sm flex flex-col items-center p-8 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-850 rounded-[32px] text-center shadow-2xl relative">
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

      {/* STORY VIEWER FULLSCREEN MODAL */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none animate-in fade-in duration-300">
          <div className="w-full max-w-lg h-full max-h-[85vh] md:max-h-[90vh] bg-slate-950 border border-slate-900 md:rounded-3xl flex flex-col relative overflow-hidden shadow-2xl">
            {/* Top progress indicator bar */}
            <div className="absolute top-3 left-4 right-4 flex gap-1 z-30">
              <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${storyProgress}%` }}></div>
              </div>
            </div>

            {/* Header info */}
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

            {/* Text story content or image wallpaper */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-indigo-900/40 via-purple-950/20 to-slate-950 relative">
              {/* Floating aesthetic icons in background */}
              <div className="absolute top-1/3 left-10 text-indigo-500/10 pointer-events-none transform -rotate-12"><MessageSquare className="w-24 h-24" /></div>
              <div className="absolute bottom-1/3 right-10 text-pink-500/10 pointer-events-none transform rotate-12"><Heart className="w-24 h-24" /></div>

              <div className="max-w-md relative z-10 space-y-4">
                <p className="text-xl md:text-2xl font-extrabold text-white leading-relaxed select-text">
                  "{activeStory.text}"
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-900 flex justify-center text-slate-500 text-[10px] font-light">
              Press Escape or click close button to exit
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
