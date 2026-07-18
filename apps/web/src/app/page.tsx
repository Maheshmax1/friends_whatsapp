'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { 
  Send, Phone, Search, UserPlus, LogOut, MessageSquare, 
  Settings, Users, Shield, Compass, Sparkles, Smile, Image as ImageIcon,
  Check, CheckCheck, Loader2, ArrowRight, User, AlertCircle
} from 'lucide-react';

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

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
    
    // Emit typing status
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
        setDevOtp(result.otp); // Save dev mode OTP to show on screen
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

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-white select-none">
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
      <div className="flex-1 flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md glass bg-slate-900/40 backdrop-blur-2xl border border-slate-800/80 shadow-[0_0_50px_rgba(99,102,241,0.1)] rounded-3xl p-8 relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/5 mb-4">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-100 tracking-tight">
              Halo Chat
            </h1>
            <p className="text-slate-400 text-xs mt-1">Real-time premium communication</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 text-sm font-medium">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Enter phone number (e.g. 9876543210)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/60 rounded-xl py-3 pl-14 pr-4 text-white text-sm outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-medium transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 group disabled:opacity-50"
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
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider">Verification Code</label>
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
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/60 rounded-xl py-3 px-4 text-white text-center text-lg tracking-[0.5em] outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              {devOtp && (
                <div className="p-3 bg-slate-950/80 border border-indigo-500/20 rounded-xl text-center">
                  <span className="text-slate-400 text-xs block mb-1">Development mode code:</span>
                  <span className="text-indigo-300 text-lg font-bold tracking-widest">{devOtp}</span>
                  <p className="text-[10px] text-slate-500 mt-1">(You can also type 123456 to bypass)</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-medium transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Verify & Login</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-[11px] text-slate-500 font-light border-t border-slate-800/40 pt-4 flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-500/50" />
            <span>Secured login session</span>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD SCREEN
  return (
    <div className="flex-1 flex bg-slate-950 text-white relative overflow-hidden select-none">
      
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* DASHBOARD WORKSPACE */}
      <div className="flex-1 flex glass border-none rounded-none overflow-hidden relative z-10">
        
        {/* SIDEBAR (LEFT SECTION) */}
        <div className="w-80 border-r border-slate-900 flex flex-col bg-slate-950/60 backdrop-blur-md">
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shadow-indigo-500/10 relative">
                {user.displayName?.slice(0, 2).toUpperCase() || 'HA'}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></div>
              </div>
              <div className="truncate max-w-[120px]">
                <h4 className="text-xs font-semibold leading-none truncate">{user.displayName || 'Halo User'}</h4>
                <span className="text-[10px] text-slate-400 mt-1 truncate block">{user.phoneNumber}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
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
                className="w-8 h-8 rounded-lg hover:bg-rose-950/30 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Inputs */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 w-4 h-4 my-auto" />
              <input
                type="text"
                placeholder="Search users or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/60 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none transition-all"
              />
            </div>
          </div>

          {/* Search Results Display */}
          {searchQuery.trim().length > 1 && (
            <div className="flex-1 overflow-y-auto px-2 border-b border-slate-900">
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider px-2 block mb-2 mt-1">
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
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-indigo-950/20 text-left transition-colors mb-1"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold">
                      {resultUser.displayName?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h5 className="text-xs font-medium text-slate-200">{resultUser.displayName || resultUser.username}</h5>
                      <p className="text-[10px] text-slate-500">{resultUser.phoneNumber}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Tab Navigation */}
          {searchQuery.trim().length <= 1 && (
            <div className="flex px-3 gap-1 border-b border-slate-900/50 pb-2">
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

          {/* Chat / Contact Lists */}
          {searchQuery.trim().length <= 1 && (
            <div className="flex-1 overflow-y-auto p-2">
              {activeTab === 'chats' ? (
                chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 px-4">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-[11px] text-center font-light leading-relaxed">No active chats. Start one by searching a user or adding a contact!</p>
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
                            ? 'bg-indigo-950/20 border-indigo-500/20 text-white shadow-sm' 
                            : 'hover:bg-slate-900/40 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-semibold text-xs relative">
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
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 px-4">
                    <Users className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-[11px] text-center font-light leading-relaxed">Your contact list is empty. Click user icon in top right to add a contact by phone number!</p>
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
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-semibold text-xs relative">
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

        {/* CHAT DISPLAY WINDOW (RIGHT SECTION) */}
        <div className="flex-1 flex flex-col bg-slate-950/20 backdrop-blur-md relative">
          
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/60 backdrop-blur-sm relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs">
                    {activeChat.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold leading-tight">{activeChat.name}</h4>
                    <span className="text-[9px] text-slate-400">
                      {typingUsers[activeChat.otherMember?.id || ''] ? (
                        <span className="text-indigo-400 font-medium animate-pulse">typing...</span>
                      ) : activeChat.otherMember?.isOnline || onlineUsers[activeChat.otherMember?.id || ''] ? (
                        <span className="text-emerald-400">online</span>
                      ) : (
                        'offline'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleCall('voice')}
                    className="w-8 h-8 rounded-lg hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleCall('video')}
                    className="w-8 h-8 rounded-lg hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-colors animate-pulse"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </button>
                </div>
              </div>

              {/* Chat Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-0 flex flex-col">
                <div className="flex-1"></div> {/* Push content to bottom */}
                {messages.map((message) => {
                  const isCurrentUser = message.senderId === user.id;
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl p-3 shadow-md relative group transition-all ${
                        isCurrentUser 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800/40'
                      }`}>
                        {/* Message content */}
                        <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Timestamp & Status ticks */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[8px] text-slate-400 font-light select-none">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isCurrentUser && (
                            <span className="text-indigo-200">
                              {message.status === 'READ' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                              ) : message.status === 'DELIVERED' ? (
                                <CheckCheck className="w-3.5 h-3.5 opacity-60" />
                              ) : (
                                <Check className="w-3.5 h-3.5 opacity-65" />
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
                    <div className="bg-slate-900 border border-slate-800/40 rounded-2xl rounded-tl-none p-3 max-w-[70%] text-slate-400 flex items-center gap-1">
                      <span className="text-[11px] animate-pulse">typing</span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Message Input Box */}
              <form 
                onSubmit={handleSend} 
                className="p-3 border-t border-slate-900 bg-slate-950/60 backdrop-blur-sm relative z-10 flex items-center gap-2"
              >
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/60 rounded-xl py-3 pl-4 pr-10 text-xs text-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/10"
                  />
                  <button 
                    type="button" 
                    onClick={() => setMessageInput(prev => prev + ' 🚀')}
                    className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <Smile className="w-4.5 h-4.5" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
            </>
          ) : (
            /* EMPTY CHAT PLACEHOLDER SCREEN */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                  <MessageSquare className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600/30 rounded-full animate-ping"></div>
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-2">Select a Conversation</h3>
              <p className="text-slate-500 text-xs max-w-sm font-light leading-relaxed mb-6">
                Choose an active chat from your sidebar or add a contact to start chatting in real-time.
              </p>
              
              <div className="grid grid-cols-2 gap-4 max-w-md w-full">
                <div className="p-4 bg-slate-900/20 border border-slate-900/60 rounded-2xl text-left">
                  <Shield className="w-4 h-4 text-indigo-400 mb-2" />
                  <h4 className="text-xs font-semibold text-slate-300 mb-1">Simulated Encrypted</h4>
                  <p className="text-[10px] text-slate-500 leading-normal font-light">Data exchange runs through verified JWT WebSocket payloads.</p>
                </div>
                <div className="p-4 bg-slate-900/20 border border-slate-900/60 rounded-2xl text-left">
                  <Phone className="w-4 h-4 text-violet-400 mb-2" />
                  <h4 className="text-xs font-semibold text-slate-300 mb-1">Interactive Call UI</h4>
                  <p className="text-[10px] text-slate-500 leading-normal font-light">Test out call interactions directly with mock WebRTC modals.</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: ADD CONTACT */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
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
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl py-2 px-3 text-xs outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Nickname (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bestie"
                  value={contactNickname}
                  onChange={(e) => setContactNickname(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl py-2 px-3 text-xs outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
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
          <div className="w-full max-w-sm flex flex-col items-center p-8 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[32px] text-center shadow-2xl relative">
            <div className="absolute top-4 left-4 flex items-center gap-1.5 p-1 px-2.5 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-[9px] font-medium tracking-wide text-indigo-400 animate-pulse">
              <Shield className="w-3 h-3" />
              <span>Simulated WebRTC</span>
            </div>
            
            {/* Call Icon / Pulsing Graphic */}
            <div className="relative mb-8 mt-4">
              <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="absolute -inset-4 rounded-full border border-indigo-500/10 animate-ping animate-delay-300" style={{ animationDuration: '3s' }}></div>
              <div className="w-20 h-20 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center relative">
                {callModal.type === 'voice' ? (
                  <Phone className="w-8 h-8 text-indigo-400" />
                ) : (
                  <Sparkles className="w-8 h-8 text-indigo-400" />
                )}
              </div>
            </div>

            <h3 className="text-base font-bold text-white mb-1">{callModal.name}</h3>
            <p className="text-slate-400 text-xs mb-8 animate-pulse font-light">
              Connecting simulated {callModal.type} call...
            </p>

            <button
              onClick={() => setCallModal(null)}
              className="w-full max-w-[150px] bg-rose-600 hover:bg-rose-500 text-white rounded-2xl py-3 text-xs font-semibold transition-all shadow-lg shadow-rose-600/10"
            >
              End Call
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
