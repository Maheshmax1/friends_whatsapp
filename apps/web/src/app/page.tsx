'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { 
  Send, Phone, Search, UserPlus, LogOut, MessageSquare, 
  Settings, Users, Shield, Compass, Sparkles, Smile, Image as ImageIcon,
  Check, CheckCheck, Loader2, ArrowRight, User, AlertCircle, Plus, X,
  Video, MoreVertical, Trash2, Heart, Copy, Bookmark, Paintbrush, Play,
  Pin, Archive, Star, Reply, CornerUpRight, Edit2, ShieldAlert, Moon, Sun, 
  Database, ArrowLeft, Menu, Camera, ToggleLeft, ToggleRight, Mic, Lock, Smartphone, Ban, AlertTriangle,
  ExternalLink, Bell, Volume2, Info, Eye, Paperclip
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
    statuses,
    postStatus,
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
    updateProfileSettings,
    createGroupChat,
    toggleReaction
  } = useChat();

  // APP LOCK (1. PIN/Biometric lock feature on load)
  const [appLocked, setAppLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);

  // AUTH STATES
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  // UI CONFIG STATES
  const [activeTheme, setActiveTheme] = useState<ThemeName>('royal');
  const [chatWallpaper, setChatWallpaper] = useState<string>('mesh-indigo');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSharedMedia, setShowSharedMedia] = useState(false); // Collapsible Shared Media sidebar

  // PROFILE EDIT STATES
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // VIEWPORT NAVIGATION STATES (Mobile Toggling)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // DASHBOARD NAVIGATION STATES
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'archived'>('chats');
  const [showAddContact, setShowAddContact] = useState(false);

  // FILTER CHATS IN SIDEBAR
  const [localChatSearch, setLocalChatSearch] = useState('');

  // MESSAGE SELECTION & INTERACTION STATES
  const [messageInput, setMessageInput] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<any | null>(null);
  const [messageInfoMessage, setMessageInfoMessage] = useState<any | null>(null); // Message Info Modal

  // Contact Dialog States
  const [contactPhone, setContactPhone] = useState('');
  const [contactNickname, setContactNickname] = useState('');

  // GROUP CHAT CREATION WIZARD STATES
  const [showGroupWizard, setShowGroupWizard] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  // AUDIO RECORDING STATES (Voice Notes)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceWaveforms, setVoiceWaveforms] = useState<number[]>([]);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // CAMERA snapshot capturing
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);

  // DRAG & DROP ATTACHMENT OVERLAY
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // PICTURE IN PICTURE CALL BUBBLE (Floating call screen)
  const [callModal, setCallModal] = useState<{ isOpen: boolean; type: 'voice' | 'video'; name: string; isMinimized?: boolean } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [floatingPos, setFloatingPos] = useState({ x: 20, y: 80 });
  const isDraggingFloatingRef = useRef(false);

  // STATUS & STORIES
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // USER PROFILE ACTION STATES (Mute, Block)
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // SWIPE EVENT TRACKERS (Mobile Gestures)
  const [callStream, setCallStream] = useState<MediaStream | null>(null);
  const callVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCallMedia = async () => {
      if (callModal) {
        try {
          const constraints = {
            video: callModal.type === 'video',
            audio: true
          };
          activeStream = await navigator.mediaDevices.getUserMedia(constraints);
          setCallStream(activeStream);
          setTimeout(() => {
            if (callVideoRef.current && activeStream) {
              callVideoRef.current.srcObject = activeStream;
            }
          }, 300);
        } catch (err) {
          console.error('Call media stream request failed:', err);
        }
      }
    };

    startCallMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      setCallStream(null);
    };
  }, [callModal]);

  // SWIPE EVENT TRACKERS (Mobile Gestures)
  const touchStartCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const [swipedChatId, setSwipedChatId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Request HTML5 notification rights on load
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Desktop native push notification trigger (HTML5 Notification API)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.senderId !== user?.id && document.visibilityState === 'hidden') {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(lastMessage.sender.displayName || lastMessage.sender.username || 'Halo Chat', {
            body: lastMessage.content,
            icon: '/favicon.ico'
          });
        }
      }
    }
  }, [messages, user?.id]);

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
      root.classList.remove('light');
    } else {
      root.classList.add('light');
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    await updateProfileSettings({
      displayName: editDisplayName,
      bio: editBio,
      avatarUrl: editAvatarUrl
    });
    setIsSavingSettings(false);
    setShowSettingsDrawer(false);
    alert('Profile updated successfully!');
  };

  const handleTogglePrivacy = async (field: 'showLastSeen' | 'showReadReceipts' | 'allowNotifications', currentVal: boolean) => {
    await updateProfileSettings({
      [field]: !currentVal
    });
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

  // KEYBOARD SHORTCUTS: Global keydown listener (6. Keyboard shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Esc key closes drawers and modals
      if (e.key === 'Escape') {
        setShowSettingsDrawer(false);
        setActiveStory(null);
        setShowAddContact(false);
        setShowGroupWizard(false);
        setForwardingMessage(null);
        setMessageInfoMessage(null);
        setShowSharedMedia(false);
        setReplyingToMessage(null);
        setEditingMessage(null);
        setMessageInput('');
        if (callModal) {
          // Minimize call instead of closing
          setCallModal(prev => prev ? { ...prev, isMinimized: true } : null);
        }
      }

      // 2. Ctrl + F focuses local search input
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const localSearchInput = document.querySelector('input[placeholder="Search active chats..."]') as HTMLInputElement;
        localSearchInput?.focus();
      }

      // 3. Up Arrow to edit last sent message
      if (e.key === 'ArrowUp' && document.activeElement?.getAttribute('placeholder') === 'Type a message...' && messageInput === '') {
        const mySentMessages = messages.filter((m) => m.senderId === user?.id && !m.isDeleted);
        if (mySentMessages.length > 0) {
          e.preventDefault();
          const lastMsg = mySentMessages[mySentMessages.length - 1];
          setEditingMessage(lastMsg);
          setMessageInput(lastMsg.content);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [messages, messageInput, user?.id, callModal]);

  // DRAG & DROP ATTACHMENTS (5. Drag and Drop Overlay)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      sendMessage(`[File Attachment] Sent: ${files[0].name} (${Math.round(files[0].size / 1024)} KB)`);
    }
  };

  // APP PIN CODE VERIFICATION
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1111') {
      setAppLocked(false);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // SIMULATED FINGERPRINT SCAN
  const handleFingerprintScan = () => {
    setIsScanningFingerprint(true);
    setTimeout(() => {
      setIsScanningFingerprint(false);
      setAppLocked(false);
    }, 1500);
  };

  // TOUCH GESTURE EVENTS: Swipe-to-Reply & Swipe-to-Action Chat List (Mobile Gestures)
  const handleTouchStart = (e: React.TouchEvent, type: 'bubble' | 'chatItem', id: string) => {
    const touch = e.touches[0];
    touchStartCoordsRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent, type: 'bubble' | 'chatItem', dataObject: any) => {
    if (!touchStartCoordsRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartCoordsRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartCoordsRef.current.y);
    
    // Ignore vertical scrolling swipes
    if (deltaY < 30) {
      if (type === 'bubble' && deltaX > 65) {
        // Swipe Right to Reply
        setReplyingToMessage(dataObject);
        setEditingMessage(null);
        alert(`Replying to message by: ${dataObject.sender.displayName || dataObject.sender.username}`);
      }
      
      if (type === 'chatItem') {
        if (deltaX < -55) {
          // Swipe Left to reveal controls
          setSwipedChatId(dataObject.id);
        } else if (deltaX > 45) {
          // Swipe Right to hide controls
          setSwipedChatId(null);
        }
      }
    }
    touchStartCoordsRef.current = null;
  };

  // CAMERA FEED MANAGEMENT
  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera stream access failed:', err);
      alert('Camera access denied or device has no camera.');
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const captureSnapshot = () => {
    if (cameraVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = cameraVideoRef.current.videoWidth || 640;
      canvas.height = cameraVideoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(cameraVideoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        // Send base64 camera image immediately in chat
        sendMessage(dataUrl);
        stopCamera();
      }
    }
  };

  // VOICE NOTE AUDIO RECORDER (10. Voice Notes)
  const startVoiceRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingDuration(0);
      setVoiceWaveforms([]);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          sendMessage(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();

      recordIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
        // Generate values for canvas voice note visualization
        setVoiceWaveforms((prev) => [...prev, Math.floor(Math.random() * 50) + 15]);
      }, 1000);
    } catch (err) {
      console.error('Microphone stream access failed:', err);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = (shouldSend: boolean) => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (shouldSend) {
        mediaRecorderRef.current.stop();
      } else {
        // Cancel - stop media recorder without saving chunks
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.stop();
        // Stop audio tracks
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }

    setIsRecording(false);
    setRecordingDuration(0);
    setVoiceWaveforms([]);
  };

  // Render wave visualization on microphone record
  useEffect(() => {
    if (isRecording && waveCanvasRef.current) {
      const canvas = waveCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = activeTheme === 'emerald' ? '#10b981' : '#6366f1';
        
        const barWidth = 3;
        const gap = 2;
        const totalBars = voiceWaveforms.length;
        const startX = Math.max(0, canvas.width - (totalBars * (barWidth + gap)));

        voiceWaveforms.forEach((height, i) => {
          const x = startX + i * (barWidth + gap);
          const y = (canvas.height - height) / 2;
          ctx.fillRect(x, y, barWidth, height);
        });
      }
    }
  }, [voiceWaveforms, isRecording, activeTheme]);

  // GROUP CREATION WIZARD CONTROLS (11. Group Chat Management)
  const handleToggleWizardContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const handleGroupWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedContacts.length === 0) return;
    const groupId = await createGroupChat(groupName.trim(), selectedContacts, groupDescription);
    if (groupId) {
      setGroupName('');
      setGroupDescription('');
      setSelectedContacts([]);
      setShowGroupWizard(false);
      alert('Group Chat created successfully!');
    }
  };

  // DRAG MOVEMENT FOR FLOATING PIP CALL DIALOG
  const handleFloatingCallMouseDown = (e: React.MouseEvent) => {
    if (!callModal) return;
    isDraggingFloatingRef.current = true;
    setDragOffset({
      x: e.clientX - floatingPos.x,
      y: e.clientY - floatingPos.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingFloatingRef.current) return;
      setFloatingPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      isDraggingFloatingRef.current = false;
    };

    if (callModal?.isMinimized) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [callModal, dragOffset, floatingPos]);

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
          primary: 'bg-rose-505 hover:bg-rose-455 text-white shadow-rose-500/10',
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
        return 'bg-slate-955';
      case 'solid-slate':
        return 'bg-slate-900';
      case 'mesh-violet':
        return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-955/40 via-slate-950 to-slate-950';
      case 'mesh-indigo':
      default:
        return 'bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950';
    }
  };

  // UI styling classes matching themes
  const themeStyle = getThemeClass();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    sendTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1500);
  };

  const handleInputChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
  };

  // APP PIN CODE LOCK SCREEN LAYOUT (Rendered on load if lock active)
  if (appLocked) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-slate-955 relative overflow-hidden px-4">
        {/* Glow decoration */}
        <div className="absolute top-1/3 left-1/3 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse"></div>

        <div className="w-full max-w-sm glass bg-slate-900/40 backdrop-blur-3xl border border-slate-805/80 shadow-[0_0_50px_rgba(99,102,241,0.12)] rounded-[32px] p-8 relative z-10 text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <Lock className="w-7 h-7 text-white" />
          </div>
          
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-violet-100 mb-1">Halo Chat Locked</h2>
          <p className="text-[11px] text-slate-500 font-light mb-8">Enter access code or scan biometric fingerprint</p>

          <form onSubmit={handlePinSubmit} className="w-full space-y-4">
            <input
              type="password"
              maxLength={4}
              required
              placeholder="••••"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              className="w-full bg-slate-950/80 border border-slate-805 focus:border-indigo-500/80 rounded-xl py-3 text-center text-xl tracking-[1em] outline-none text-white font-bold"
            />
            {pinError && (
              <span className="text-[10px] text-rose-400 block font-light">Incorrect PIN. Try again.</span>
            )}
            <button
              type="submit"
              className={`w-full py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${themeStyle.primary}`}
            >
              Verify PIN Code
            </button>
          </form>

          <div className="w-full flex items-center justify-center my-6 gap-2">
            <div className="h-[1px] bg-slate-850 flex-1"></div>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">or</span>
            <div className="h-[1px] bg-slate-850 flex-1"></div>
          </div>

          {/* Fingerprint click simulation (4. App Lock) */}
          <button 
            type="button"
            onClick={handleFingerprintScan}
            disabled={isScanningFingerprint}
            className={`w-16 h-16 rounded-full border border-slate-800 hover:border-indigo-500/50 flex items-center justify-center transition-colors group relative ${
              isScanningFingerprint ? 'bg-indigo-900/20 border-indigo-500' : 'bg-slate-950/40'
            }`}
          >
            {isScanningFingerprint ? (
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            ) : (
              <Smartphone className="w-7 h-7 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            )}
          </button>
          <span className="text-[9px] text-slate-500 mt-2 block font-light">Click sensor to scan (PIN is 1111)</span>
        </div>
      </div>
    );
  }

  // AUTH SCREEN
  if (!user) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
        <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }}></div>

        <div className="w-full max-w-md glass bg-slate-900/30 backdrop-blur-3xl border border-slate-800/80 shadow-[0_0_50px_rgba(99,102,241,0.15)] rounded-[32px] p-8 relative z-10 text-white">
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
                    className="w-full bg-slate-950/80 border border-slate-805 focus:border-indigo-500/80 rounded-xl py-3.5 pl-14 pr-4 text-white text-xs outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl py-3.5 text-xs font-semibold transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 group disabled:opacity-50"
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
                  className="w-full bg-slate-950/80 border border-slate-805 focus:border-indigo-500/80 rounded-xl py-3.5 px-4 text-white text-center text-sm tracking-[0.5em] outline-none transition-all focus:ring-1 focus:ring-indigo-500/20 font-bold"
                />
              </div>

              {devOtp && (
                <div className="p-4 bg-slate-950/80 border border-indigo-500/20 rounded-2xl text-center">
                  <span className="text-slate-400 text-xs block mb-1">Development mode code:</span>
                  <span className="text-indigo-300 text-sm font-extrabold tracking-widest">{devOtp}</span>
                  <p className="text-[10px] text-slate-500 mt-1.5">(Or enter 123456 to bypass immediately)</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-505 text-white rounded-xl py-3.5 text-xs font-semibold transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 disabled:opacity-50"
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

  // MAIN SYSTEM INTERFACE
  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="h-dvh w-screen flex bg-slate-950 text-white relative overflow-hidden select-none dark:bg-slate-950 light:bg-slate-50 light:text-slate-900 transition-colors duration-300"
    >
      {/* 5. DRAG & DROP attachment visual overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center pointer-events-none animate-in fade-in duration-200">
          <div className="w-24 h-24 rounded-full border border-dashed border-indigo-500 flex items-center justify-center mb-6 animate-pulse">
            <Paperclip className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Send Media File</h2>
          <p className="text-slate-400 text-xs mt-1 font-light">Drop attachments anywhere to send them instantly</p>
        </div>
      )}

      {/* DASHBOARD WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative z-10 h-full w-full">
        
        {/* SIDEBAR (LEFT SECTION) */}
        <div className={`w-full lg:w-[340px] border-r border-slate-900 dark:border-slate-900 light:border-slate-202 flex flex-col bg-slate-950/70 backdrop-blur-xl dark:bg-slate-950/70 light:bg-white/80 h-full overflow-hidden shrink-0 transition-all ${
          mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-900/60 dark:border-slate-900/60 light:border-slate-100">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSettingsDrawer(true)}
                className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-900 light:bg-slate-250 border border-slate-805 dark:border-slate-805 light:border-slate-300 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-indigo-500/10 relative hover:scale-105 transition-transform overflow-hidden shrink-0"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user.displayName?.slice(0, 2).toUpperCase() || 'HA'}</span>
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse"></div>
              </button>
              <div className="truncate max-w-[110px]">
                <h4 className="text-xs font-semibold leading-none truncate dark:text-white light:text-slate-800">{user.displayName || 'Halo User'}</h4>
                <span className="text-[10px] text-slate-450 mt-1 truncate block font-light dark:text-slate-400 light:text-slate-500">{user.phoneNumber}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowGroupWizard(true)} 
                title="Create Group"
                className="w-8 h-8 rounded-lg hover:bg-slate-905 dark:hover:bg-slate-905 light:hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors"
              >
                <Users className="w-4.5 h-4.5" />
              </button>
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
                className="w-8 h-8 rounded-lg hover:bg-rose-955/20 dark:hover:bg-rose-955/20 light:hover:bg-rose-100 flex items-center justify-center text-slate-400 hover:text-rose-455 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Stories Row (WhatsApp Status style) */}
          <div className="p-3 border-b border-slate-900/60 dark:border-slate-900/60 light:border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Status Updates</span>
            <div className="flex gap-3 overflow-x-auto pb-1 select-none">
              <div 
                onClick={() => {
                  const text = window.prompt("Post a new status update:");
                  if (text && text.trim()) {
                    postStatus(text.trim());
                  }
                }}
                className="flex flex-col items-center shrink-0 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full border border-dashed border-slate-700 flex items-center justify-center mb-1 group-hover:border-indigo-500 transition-colors">
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <span className="text-[9px] text-slate-400 font-light truncate max-w-[50px]">My Status</span>
              </div>
              
              {statuses.map((story) => (
                <div 
                  key={story.id} 
                  onClick={() => setActiveStory(story as any)}
                  className="flex flex-col items-center shrink-0 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-full border-2 ${themeStyle.ringAccent} p-0.5 mb-1 hover:scale-105 transition-transform`}>
                    <div className="w-full h-full rounded-full bg-slate-855 flex items-center justify-center font-bold text-xs text-indigo-300 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 overflow-hidden shrink-0">
                      {story.avatar.length > 2 && story.avatar.startsWith('data:') ? (
                        <img src={story.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{story.avatar.slice(0, 2).toUpperCase()}</span>
                      )}
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
                ref={searchInputRef}
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
            <div className="flex-1 overflow-y-auto px-2 border-b border-slate-900/60 dark:border-slate-900/60 light:border-slate-100 bg-slate-950/40 animate-in slide-in-from-top duration-150">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest px-2 block mb-2 mt-2">
                Global Users Found
              </span>
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-550" />
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
                    : 'text-slate-500 hover:text-slate-350 dark:hover:text-slate-355 light:hover:text-slate-700'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => { setActiveTab('contacts'); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'contacts' 
                    ? themeStyle.activeBg
                    : 'text-slate-500 hover:text-slate-355 dark:hover:text-slate-355 light:hover:text-slate-700'
                }`}
              >
                Contacts
              </button>
              <button
                onClick={() => { setActiveTab('archived'); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'archived' 
                    ? themeStyle.activeBg
                    : 'text-slate-500 hover:text-slate-355 dark:hover:text-slate-355 light:hover:text-slate-700'
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
                    const isSwiped = swipedChatId === chat.id;

                    return (
                      <div 
                        key={chat.id}
                        onTouchStart={(e) => handleTouchStart(e, 'chatItem', chat.id)}
                        onTouchEnd={(e) => handleTouchEnd(e, 'chatItem', chat)}
                        className="relative overflow-hidden mb-1.5 rounded-2xl group/item select-none"
                      >
                        {/* Swipe Hidden Controls Drawer (2. Swipe-action Chat List) */}
                        {isSwiped && (
                          <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-end pr-2 gap-1.5 z-0 transition-opacity animate-in fade-in duration-100">
                            <button
                              onClick={() => togglePin(chat.id)}
                              className="h-8 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white flex items-center gap-1 shadow-md shadow-indigo-600/10"
                            >
                              <Pin className="w-3.5 h-3.5" />
                              <span>{chat.isPinned ? 'Unpin' : 'Pin'}</span>
                            </button>
                            <button
                              onClick={() => toggleArchive(chat.id)}
                              className="h-8 p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-[10px] font-bold text-white flex items-center gap-1 shadow-md shadow-cyan-600/10"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              <span>{chat.isArchived ? 'Active' : 'Archive'}</span>
                            </button>
                          </div>
                        )}

                        {/* Slide panel */}
                        <div 
                          className={`w-full flex items-center justify-between p-3 rounded-2xl text-left border border-transparent bg-slate-950 dark:bg-slate-950 light:bg-white relative z-10 transition-transform duration-200 ${
                            isChatActive 
                              ? 'bg-indigo-950/20 dark:bg-indigo-950/20 light:bg-indigo-50 border-indigo-500/20 text-white dark:text-white light:text-slate-800' 
                              : 'hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900'
                          } ${isSwiped ? '-translate-x-[150px]' : 'translate-x-0'}`}
                        >
                          <button
                            onClick={() => {
                              selectChat(chat.id);
                              setMobileView('chat');
                            }}
                            className="flex-1 flex items-center gap-3 min-w-0"
                          >
                            <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-900 light:bg-slate-250 border border-slate-805 dark:border-slate-805 light:border-slate-300 flex items-center justify-center font-semibold text-xs relative shrink-0 overflow-hidden">
                              {chat.otherMember?.avatarUrl ? (
                                <img src={chat.otherMember.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span>{chat.name.slice(0, 2).toUpperCase()}</span>
                              )}
                              {chat.isGroup && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 border border-slate-950 rounded-full flex items-center justify-center text-[7px] text-white">G</div>
                              )}
                              {isOnline && !chat.isGroup && (
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
                          
                          {/* Pin details / archive indicators */}
                          <div className="flex gap-1 items-center shrink-0 ml-1.5">
                            {chat.isPinned && <Pin className="w-3 h-3 text-indigo-400" />}
                            {chat.isArchived && <Archive className="w-3 h-3 text-cyan-400" />}
                          </div>
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
          mobileView === 'list' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {activeChat ? (
            <div className="flex-1 flex h-full overflow-hidden relative">
              
              {/* Message Panel Area */}
              <div className={`flex-1 flex flex-col h-full overflow-hidden ${getWallpaperClass()} relative z-10 transition-colors duration-300`}>
                
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-900/60 dark:border-slate-900/60 light:border-slate-205 flex items-center justify-between bg-slate-955/80 backdrop-blur-xl dark:bg-slate-955/80 light:bg-white relative z-20 shrink-0">
                  <div className="flex items-center gap-3">
                    
                    <button 
                      onClick={() => { selectChat(''); setMobileView('list'); }}
                      className="block lg:hidden p-1.5 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-800 shrink-0 transition-colors"
                    >
                      <ArrowLeft className="w-4.5 h-4.5" />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center font-bold text-xs cursor-pointer overflow-hidden shrink-0" onClick={() => setShowSharedMedia(!showSharedMedia)}>
                      {activeChat.otherMember?.avatarUrl ? (
                        <img src={activeChat.otherMember.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{activeChat.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="cursor-pointer" onClick={() => setShowSharedMedia(!showSharedMedia)}>
                      <h4 className="text-xs font-semibold leading-tight">{activeChat.name}</h4>
                      <span className="text-[9px] text-slate-405">
                        {typingUsers[activeChat.otherMember?.id || ''] ? (
                          <span className="text-indigo-400 font-medium animate-pulse">typing...</span>
                        ) : activeChat.isGroup ? (
                          <span className="text-slate-500">Group conversation</span>
                        ) : activeChat.otherMember?.isOnline || onlineUsers[activeChat.otherMember?.id || ''] ? (
                          <span className="text-emerald-400 font-medium">online</span>
                        ) : (
                          'offline'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setShowSharedMedia(!showSharedMedia)}
                      title="Shared Files & Media"
                      className="w-9 h-9 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                      <Paperclip className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={() => handleCall('voice')}
                      className="w-9 h-9 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleCall('video')}
                      className="w-9 h-9 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 flex items-center justify-center text-slate-450 hover:text-indigo-400 transition-colors"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Chat Message History */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 flex flex-col min-h-0 bg-transparent select-none">
                  <div className="flex-1"></div>
                  {messages.map((message) => {
                    const isCurrentUser = message.senderId === user.id;
                    const isStarred = message.isStarred;
                    const isReplying = message.replyTo !== null;
                    const messageReactions = message.reactions || [];

                    return (
                      <div 
                        key={message.id} 
                        onTouchStart={(e) => handleTouchStart(e, 'bubble', message.id)}
                        onTouchEnd={(e) => handleTouchEnd(e, 'bubble', message)}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-100`}
                        onMouseEnter={() => setHoveredMessageId(message.id)}
                        onMouseLeave={() => {
                          setHoveredMessageId(null);
                          setActiveMenuMessageId(null);
                        }}
                      >
                        <div className="relative group max-w-[85%] md:max-w-[65%] flex items-center gap-2">
                          
                          {/* Action overlay shortcuts */}
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

                          {/* Message Bubble Container */}
                          <div className={`rounded-2xl px-4 py-2.5 shadow-md relative transition-all duration-200 ${
                            isCurrentUser 
                              ? `${themeStyle.bubbleSent} rounded-tr-none` 
                              : 'bg-slate-900/90 dark:bg-slate-900/90 light:bg-white text-slate-200 dark:text-slate-200 light:text-slate-800 rounded-tl-none border border-slate-800/80 dark:border-slate-800/80 light:border-slate-202 shadow-lg shadow-black/10'
                          }`}>
                            
                            {isStarred && (
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400 absolute top-2 right-2" />
                            )}

                            {/* Reply Header Quote Block */}
                            {isReplying && message.replyTo && (
                              <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-4 border-indigo-400 text-left text-[10px] opacity-80 cursor-pointer max-w-full truncate">
                                <span className="font-semibold block text-indigo-300 leading-none">
                                  {message.replyTo.sender.displayName || message.replyTo.sender.username}
                                </span>
                                <span className="text-slate-350 block mt-0.5 truncate leading-tight">
                                  {message.replyTo.content}
                                </span>
                              </div>
                            )}

                             {/* Main message text */}
                             {message.isDeleted ? (
                               <p className="text-xs leading-relaxed italic text-slate-455 flex items-center gap-1.5">
                                 <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                                 <span>This message was deleted</span>
                               </p>
                             ) : message.content.startsWith('data:image') ? (
                               <div className="max-w-[240px] overflow-hidden rounded-xl shadow-md border border-slate-800/40 my-1 cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.open(message.content, '_blank')}>
                                 <img src={message.content} alt="Snapshot" className="w-full h-full object-cover" />
                               </div>
                             ) : message.content.startsWith('data:audio') ? (
                               <div className="py-2 px-1 select-none">
                                 <audio src={message.content} controls className="max-w-full h-9 outline-none text-xs custom-audio" style={{ filter: isDarkMode ? 'invert(90%) hue-rotate(180deg)' : 'none' }} />
                               </div>
                             ) : (
                               <p className="text-xs leading-relaxed break-words whitespace-pre-wrap font-light">
                                 {message.content}
                               </p>
                             )}
                            
                            {/* Timestamp, status checks & badges */}
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

                            {/* 9. FLOATING EMOJI REACTION BADGE COUNTS */}
                            {messageReactions.length > 0 && (
                              <div className="absolute -bottom-2 right-3 flex gap-0.5 bg-slate-900/95 dark:bg-slate-900/95 light:bg-white border border-slate-805 dark:border-slate-805 light:border-slate-200 rounded-full px-1.5 py-0.5 text-[9px] shadow-md z-30 select-none">
                                {Array.from(new Set(messageReactions.map(r => r.emoji))).slice(0, 3).map((emoji, idx) => (
                                  <span key={idx}>{emoji}</span>
                                ))}
                                <span className="text-[8px] font-bold text-indigo-400 ml-1">{messageReactions.length}</span>
                              </div>
                            )}

                            {/* Message actions context menu */}
                            {activeMenuMessageId === message.id && (
                              <div className="absolute right-0 top-full mt-1.5 z-40 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-2xl space-y-1 w-36 animate-in fade-in zoom-in-95 duration-100 text-white">
                                <div className="flex justify-around p-1 border-b border-slate-800/60 pb-1.5 mb-1.5 select-none">
                                  {['❤️', '👍', '😂', '🔥', '😢'].map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => { toggleReaction(message.id, emoji); setActiveMenuMessageId(null); }}
                                      className="hover:scale-125 transition-transform text-xs"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
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
                                  onClick={() => { setMessageInfoMessage(message); setActiveMenuMessageId(null); }}
                                  className="w-full text-left p-1.5 px-2.5 rounded-lg hover:bg-slate-800 text-[10px] flex items-center gap-2"
                                >
                                  <Info className="w-3 h-3" />
                                  <span>Message Info</span>
                                </button>
                                <button
                                  onClick={() => { deleteMessageForMe(message.id); setActiveMenuMessageId(null); }}
                                  className="w-full text-left p-1.5 px-2.5 rounded-lg hover:bg-slate-800 hover:text-rose-455 text-rose-350 text-[10px] flex items-center gap-2 border-t border-slate-800/40 pt-1.5 mt-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete for Me</span>
                                </button>
                                {isCurrentUser && !message.isDeleted && (
                                  <button
                                    onClick={() => { deleteMessageEveryone(message.id); setActiveMenuMessageId(null); }}
                                    className="w-full text-left p-1.5 px-2.5 rounded-lg hover:bg-slate-800 hover:text-rose-455 text-rose-400 text-[10px] flex items-center gap-2"
                                  >
                                    <ShieldAlert className="w-3 h-3" />
                                    <span>Delete for All</span>
                                  </button>
                                )}
                              </div>
                            )}

                          </div>

                          {/* 9. HOVER / LONG-PRESS EMOJI REACTION SELECTION PILL (Float panel) */}
                          {hoveredMessageId === message.id && (
                            <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 rounded-full px-2 py-1 shadow-xl hidden lg:flex gap-1.5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-100 select-none">
                              {['❤️', '👍', '😂', '🔥', '😢'].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(message.id, emoji)}
                                  className="hover:scale-125 transition-transform text-xs"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

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
                      className="w-6 h-6 rounded-full hover:bg-slate-900 flex items-center justify-center text-slate-450 hover:text-white shrink-0"
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
                      className="w-6 h-6 rounded-full hover:bg-slate-900 flex items-center justify-center text-slate-450 hover:text-white shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 10. MICROPHONE VOICE NOTE RECORDER INTERFACE */}
                {isRecording && (
                  <div className="px-4 py-3 bg-slate-955/95 border-t border-slate-900 flex justify-between items-center relative z-20 shrink-0 select-none animate-in slide-in-from-bottom duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-rose-600 rounded-full animate-ping"></div>
                      <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">
                        Recording ({recordingDuration}s)
                      </span>
                    </div>
                    
                    {/* glowing canvas waves */}
                    <canvas 
                      ref={waveCanvasRef}
                      width={120}
                      height={24}
                      className="mx-4 flex-1 h-6 bg-slate-950/20 border border-slate-900 rounded-lg pointer-events-none"
                    />

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => stopVoiceRecording(false)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-rose-350 hover:text-rose-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => stopVoiceRecording(true)}
                        className={`px-3 py-1.5 ${themeStyle.primary} rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors`}
                      >
                        Send Audio
                      </button>
                    </div>
                  </div>
                )}

                {/* Chat Message Input Box */}
                {!isRecording && (
                  <form 
                    onSubmit={handleSend} 
                    className="p-4 border-t border-slate-900/60 dark:border-slate-900/60 light:border-slate-202 bg-slate-950/80 backdrop-blur-xl dark:bg-slate-955/80 light:bg-white relative z-20 shrink-0 flex items-center gap-3"
                  >
                    {/* Capture snapshots */}
                    <button
                      type="button"
                      onClick={startCamera}
                      title="Take Snapshot"
                      className="w-11 h-11 bg-slate-900 border border-slate-850 hover:border-indigo-500/50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0"
                    >
                      <Camera className="w-5 h-5" />
                    </button>

                    <div className="flex-1 relative flex items-center bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-slate-805 dark:border-slate-805 light:border-slate-200 rounded-2xl focus-within:border-indigo-500/40 transition-colors">
                      <input
                        type="text"
                        placeholder={editingMessage ? 'Modify message...' : 'Type a message...'}
                        value={messageInput}
                        onChange={handleInputChangeValue}
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

                    {/* Microphone button (10. Voice Notes) */}
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      title="Record Voice Note"
                      className="w-11 h-11 bg-slate-900 border border-slate-850 hover:border-indigo-500/50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0"
                    >
                      <Mic className="w-5 h-5" />
                    </button>

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
                )}
              </div>

              {/* ======================================================== */}
              {/* 16. USER INFORMATION & COLLAPSIBLE RIGHT SIDEBAR */}
              {/* ======================================================== */}
              {showSharedMedia && (
                <div className="w-[300px] md:w-[320px] border-l border-slate-900 dark:border-slate-900 light:border-slate-202 bg-slate-955/95 backdrop-blur-3xl h-full flex flex-col shrink-0 relative z-20 animate-in slide-in-from-right duration-200 select-none text-white overflow-hidden">
                  
                  {/* Header */}
                  <div className="p-4 border-b border-slate-900 dark:border-slate-900 light:border-slate-200 flex justify-between items-center shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                      {activeChat.isGroup ? 'Group Information' : 'User Information'}
                    </span>
                    <button 
                      onClick={() => setShowSharedMedia(false)}
                      className="w-7 h-7 rounded-full hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Body Content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
                    
                    {/* 1. Profile Picture & Core Status */}
                    <div className="flex flex-col items-center text-center pb-4 border-b border-slate-900/60 dark:border-slate-900/60 light:border-slate-100">
                      <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center font-bold text-2xl shadow-xl shadow-indigo-500/5 overflow-hidden shrink-0">
                          {activeChat.otherMember?.avatarUrl ? (
                            <img src={activeChat.otherMember.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span>{activeChat.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        {/* Online Status Dot */}
                        {!activeChat.isGroup && (
                          <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-slate-950 rounded-full ${
                            activeChat.otherMember?.isOnline || onlineUsers[activeChat.otherMember?.id || '']
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-slate-600'
                          }`} />
                        )}
                      </div>
                      
                      <h4 className="text-sm font-bold text-slate-100 leading-tight">{activeChat.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {activeChat.isGroup 
                          ? 'Group Chat' 
                          : activeChat.otherMember?.phoneNumber || 'No phone number'}
                      </p>
                      
                      {/* Last Seen Status Text */}
                      <span className="text-[9px] mt-2 block px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-850 font-light">
                        {activeChat.isGroup ? (
                          'Group conversation'
                        ) : activeChat.otherMember?.isOnline || onlineUsers[activeChat.otherMember?.id || ''] ? (
                          <span className="text-emerald-400 font-semibold">Online Status: Active Now</span>
                        ) : (
                          <span className="text-slate-400">Last Seen: Yesterday, 10:15 PM</span>
                        )}
                      </span>
                    </div>

                    {/* 2. Biography / About Card */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">About</span>
                      <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-850 dark:border-slate-850 light:bg-slate-50 light:border-slate-200">
                        <p className="text-xs text-slate-350 dark:text-slate-350 light:text-slate-700 leading-relaxed font-light break-words">
                          {activeChat.isGroup 
                            ? (activeChat.description || 'No group description set.')
                            : (activeChat.otherMember?.bio || 'Hey there! I am using Halo Chat.')}
                        </p>
                      </div>
                    </div>

                    {/* 3. Mute Notifications Switch */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/30 border border-slate-850 dark:border-slate-850 light:bg-slate-50 light:border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <Bell className={`w-4 h-4 ${isMuted ? 'text-indigo-400 animate-swing' : 'text-slate-405'}`} />
                        <div className="text-left">
                          <span className="text-xs font-semibold block text-slate-200 dark:text-slate-200 light:text-slate-800 leading-none">Mute Notifications</span>
                          <span className="text-[9px] text-slate-500 font-light mt-1 block">Silence alerts for this conversation</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsMuted(!isMuted)} 
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-250 outline-none shrink-0 ${
                          isMuted ? 'bg-indigo-500' : 'bg-slate-800 dark:bg-slate-800 light:bg-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-250 ${
                          isMuted ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* 4. Shared Media & Attachments */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Shared Media</span>
                        <span className="text-[9px] text-indigo-400 font-medium cursor-pointer hover:underline">See all</span>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Mock attachments */}
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3].map((num) => (
                            <div key={num} className="aspect-square bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-indigo-500/20 rounded-xl flex flex-col items-center justify-center text-slate-650 hover:text-indigo-400 transition-colors cursor-pointer group">
                              <ImageIcon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                              <span className="text-[8px] mt-1">img_{num}.jpg</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="space-y-1.5">
                          <a href="https://railway.app" target="_blank" className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-850 text-[10px] flex items-center justify-between text-indigo-300 hover:text-indigo-400 transition-colors">
                            <span className="truncate max-w-[180px]">railway.app (Stellar Spirit)</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* 5. Shared Mutual Groups */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Mutual Groups</span>
                      <div className="space-y-1.5">
                        <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-850 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-[10px] text-indigo-400 shrink-0">
                            HC
                          </div>
                          <div className="text-left min-w-0">
                            <h5 className="text-[11px] font-semibold text-slate-200 truncate leading-none">Halo Chat Developers</h5>
                            <span className="text-[9px] text-slate-500 mt-1 block">4 members</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-850 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-[10px] text-emerald-400 shrink-0">
                            PR
                          </div>
                          <div className="text-left min-w-0">
                            <h5 className="text-[11px] font-semibold text-slate-200 truncate leading-none">Premium Projects</h5>
                            <span className="text-[9px] text-slate-500 mt-1 block">12 members</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 6. Danger Zone Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-900/60 dark:border-slate-900/60 light:border-slate-100">
                      <button 
                        onClick={() => {
                          const confirm = window.confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${activeChat.name}?`);
                          if (confirm) {
                            setIsBlocked(!isBlocked);
                            alert(`User has been ${isBlocked ? 'unblocked' : 'blocked'}.`);
                          }
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors`}
                      >
                        <Ban className="w-4 h-4" />
                        <span>{isBlocked ? 'Unblock Contact' : 'Block Contact'}</span>
                      </button>

                      <button 
                        onClick={() => {
                          const confirm = window.confirm(`Report ${activeChat.name} for spam or inappropriate activity?`);
                          if (confirm) {
                            alert("Thank you. The report has been sent to system administrators.");
                          }
                        }}
                        className="w-full py-2.5 px-4 rounded-xl border border-slate-855 hover:bg-slate-900 text-slate-400 hover:text-slate-350 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Report Contact</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          ) : (
            /* EMPTY CHAT PLACEHOLDER SCREEN */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none h-full bg-slate-955 dark:bg-slate-955 light:bg-slate-100">
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
                  <p className="text-[10px] text-slate-500 leading-normal font-light">Online indicators, typing status, and message reactions update instantly.</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* SETTINGS DRAWER */}
      {/* ======================================================== */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          showSettingsDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div onClick={() => setShowSettingsDrawer(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
        
        <div 
          className={`absolute top-0 left-0 h-full w-[290px] md:w-[320px] bg-slate-950/98 dark:bg-slate-955/98 light:bg-white/98 backdrop-blur-2xl border-r border-slate-900 dark:border-slate-900 light:border-slate-200 shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-out ${
            showSettingsDrawer ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-slate-900 dark:border-slate-900 light:border-slate-100 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Settings & Profile</span>
            <button 
              onClick={() => setShowSettingsDrawer(false)}
              className="w-7 h-7 rounded-full hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0 text-slate-200 dark:text-slate-200 light:text-slate-800">
            
            {/* Redesigned Profile Card */}
            <form onSubmit={handleSaveSettings} className="bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-50 border border-slate-850 dark:border-slate-850 light:border-slate-200 p-4 rounded-[24px] space-y-4 shadow-sm">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block text-center">My Identity</span>
              
              <div className="flex flex-col items-center gap-1.5 relative">
                <div className="relative group cursor-pointer hover:scale-102 transition-transform">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md shadow-indigo-500/10">
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-extrabold text-white text-lg">
                      {editDisplayName.slice(0, 2).toUpperCase() || 'HA'}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <span className="text-[8px] text-slate-500 font-light mt-0.5">Click to update photo</span>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter display name"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full bg-slate-955 dark:bg-slate-955 light:bg-white border border-slate-805 focus:border-indigo-500/60 rounded-xl py-2 px-3 text-xs outline-none text-white dark:text-white light:text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Bio / Status</label>
                  <input
                    type="text"
                    placeholder="E.g. Hey there! I am using Halo Chat."
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-slate-955 dark:bg-slate-955 light:bg-white border border-slate-805 focus:border-indigo-500/60 rounded-xl py-2 px-3 text-xs outline-none text-white dark:text-white light:text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Avatar Image Upload</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.readAsDataURL(file);
                          reader.onloadend = () => {
                            setEditAvatarUrl(reader.result as string);
                          };
                        }
                      }}
                      className="hidden"
                      id="profile-avatar-upload"
                    />
                    <label 
                      htmlFor="profile-avatar-upload"
                      className="w-full bg-slate-955 dark:bg-slate-955 light:bg-white border border-slate-805 hover:border-indigo-500/50 rounded-xl py-2.5 px-3 text-xs outline-none text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate max-w-[190px]">
                        {editAvatarUrl ? 'Image Selected (Base64)' : 'Choose Image File...'}
                      </span>
                      <ImageIcon className="w-4 h-4 shrink-0 text-slate-500" />
                    </label>
                  </div>
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
              
              <div className="flex justify-between items-center bg-slate-950/40 dark:bg-slate-955/40 light:bg-white p-2.5 rounded-xl border border-slate-850 dark:border-slate-850 light:border-slate-100">
                <span className="text-[10px] font-medium text-slate-350 dark:text-slate-355 light:text-slate-650">Dark Interface Mode</span>
                <button 
                  type="button"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-50 flex items-center justify-center text-slate-450 transition-colors"
                >
                  {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-505 uppercase tracking-wider block mb-1">Color Accent Theme</span>
                <div className="flex gap-1.5">
                  {(['royal', 'emerald', 'ocean', 'rose'] as ThemeName[]).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setActiveTheme(theme)}
                      className={`flex-1 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                        activeTheme === theme 
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950/40 dark:bg-slate-955/40 light:bg-white border-slate-850 dark:border-slate-850 light:border-slate-200 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-505 uppercase tracking-wider block mb-1">Select Wallpaper</span>
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
                          : 'bg-slate-950/40 dark:bg-slate-955/40 light:bg-white border-slate-855 dark:border-slate-855 light:border-slate-200 text-slate-500 hover:text-slate-350'
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
                      className="text-slate-450 hover:text-indigo-400 transition-colors"
                    >
                      {user.showLastSeen ? <ToggleRight className="w-6 h-6 text-indigo-400" /> : <ToggleLeft className="w-6 h-6 opacity-60" />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600">Read Receipts (Blue Ticks)</span>
                    <button 
                      type="button"
                      onClick={() => handleTogglePrivacy('showReadReceipts', user.showReadReceipts)}
                      className="text-slate-455 hover:text-indigo-400 transition-colors"
                    >
                      {user.showReadReceipts ? <ToggleRight className="w-6 h-6 text-indigo-400" /> : <ToggleLeft className="w-6 h-6 opacity-60" />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600">Sound & Push Alerts</span>
                    <button 
                      type="button"
                      onClick={() => handleTogglePrivacy('allowNotifications', user.allowNotifications)}
                      className="text-slate-455 hover:text-indigo-400 transition-colors"
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
              <div className="flex justify-between items-baseline text-[9px] text-slate-505">
                <span>Disk Storage Used</span>
                <span>124 MB of 5.0 GB</span>
              </div>
              <div className="w-full bg-slate-950/80 dark:bg-slate-955/80 light:bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-500 h-full w-[2.5%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALS & PORTALS */}
      {/* ======================================================== */}

      {/* 11. GROUP CREATION WIZARD MODAL */}
      {showGroupWizard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] text-white">
            <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-2.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Create Group Chat</h3>
              <button 
                type="button"
                onClick={() => setShowGroupWizard(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGroupWizardSubmit} className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="space-y-3 shrink-0">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Group Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Squad Goals 💥"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-805 rounded-xl py-2 px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Group Description</label>
                  <input
                    type="text"
                    placeholder="What is this group about?"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-805 rounded-xl py-2 px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Contacts Selection */}
              <div className="flex-1 flex flex-col min-h-0">
                <span className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-2 shrink-0">Select Group Members</span>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {contacts.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-4">Add some contacts first to create groups</p>
                  ) : (
                    contacts.map((contact) => {
                      const isSelected = selectedContacts.includes(contact.id);
                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => handleToggleWizardContact(contact.id)}
                          className={`w-full p-2.5 rounded-2xl text-left text-xs flex items-center justify-between transition-colors ${
                            isSelected 
                              ? 'bg-indigo-900/20 border border-indigo-500/30 text-indigo-200' 
                              : 'bg-slate-950/40 hover:bg-slate-800 border border-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                              {contact.displayName.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{contact.displayName}</span>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-indigo-600 border-indigo-500' : 'border-slate-700'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-850 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGroupWizard(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!groupName.trim() || selectedContacts.length === 0}
                  className={`px-4 py-2 ${themeStyle.primary} rounded-xl text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Assemble Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CAMERA RECORD SNAPSHOT MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-805 rounded-[32px] overflow-hidden p-6 shadow-2xl relative">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 text-center">Camera Snapshot</h3>
            
            <div className="aspect-video bg-black rounded-2xl overflow-hidden relative border border-slate-800 mb-6">
              <video 
                ref={cameraVideoRef}
                autoPlay 
                playsInline
                className="w-full h-full object-cover transform -scale-x-100"
              />
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={stopCamera}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={captureSnapshot}
                className={`px-5 py-2.5 ${themeStyle.primary} rounded-2xl text-xs font-bold uppercase tracking-wider`}
              >
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. MESSAGE INFO MODAL (timestamps for sent, delivered, read) */}
      {messageInfoMessage && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-100 text-white">
            <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-455">Message Details</h3>
              <button 
                onClick={() => setMessageInfoMessage(null)}
                className="w-6 h-6 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-black/30 border border-slate-850 rounded-2xl text-xs mb-6 max-h-24 overflow-y-auto italic font-light">
              "{messageInfoMessage.content}"
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs border-b border-slate-850 pb-2">
                <span className="text-slate-500 font-medium">Created Sent</span>
                <span className="text-slate-300">
                  {new Date(messageInfoMessage.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-850 pb-2">
                <span className="text-slate-500 font-medium">Delivered Status</span>
                <span className="text-slate-300">
                  {messageInfoMessage.status === 'DELIVERED' || messageInfoMessage.status === 'READ' ? 'Delivered' : 'Pending Server'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-550 font-medium">Read Status</span>
                <span className={`font-semibold ${messageInfoMessage.status === 'READ' ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {messageInfoMessage.status === 'READ' ? 'Read (Blue Tick)' : 'Unread'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. DRAGGABLE PICTURE IN PICTURE SIMULATED CALL SCREEN OVERLAY */}
      {callModal && callModal.isMinimized && (
        <div 
          onMouseDown={handleFloatingCallMouseDown}
          style={{ 
            top: `${floatingPos.y}px`, 
            left: `${floatingPos.x}px`,
            position: 'fixed'
          }}
          className="w-32 h-44 bg-gradient-to-tr from-slate-900 to-slate-950 border border-indigo-500/40 rounded-2xl shadow-2xl z-50 flex flex-col items-center justify-center p-3 text-center cursor-move select-none animate-in zoom-in-95 duration-200"
        >
          {callModal.type === 'video' ? (
            <div className="w-full h-24 rounded-lg overflow-hidden border border-indigo-500/20 mb-2 relative shrink-0">
              <video ref={callVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center mb-2 animate-pulse">
              <Phone className="w-4.5 h-4.5 text-indigo-400" />
            </div>
          )}
          <span className="text-[10px] font-bold text-white truncate max-w-full block mb-1">{callModal.name}</span>
          <span className="text-[8px] text-slate-500 block mb-3 animate-pulse">On call...</span>
          <button
            onClick={() => setCallModal(prev => prev ? { ...prev, isMinimized: false } : null)}
            className="p-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[8px] text-white font-bold"
          >
            Expand
          </button>
        </div>
      )}

      {/* MOCK CALLING FULL DIALOG (Visible when not PiP minimized) */}
      {callModal && !callModal.isMinimized && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm flex flex-col items-center p-8 bg-gradient-to-b from-slate-900 to-slate-955 border border-slate-855 rounded-[32px] text-center shadow-2xl relative">
            <div className="absolute top-4 left-4 flex items-center gap-1.5 p-1 px-2.5 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-[9px] font-medium tracking-wide text-indigo-400 animate-pulse">
              <Shield className="w-3 h-3" />
              <span>Simulated WebRTC</span>
            </div>
            
            <div className="relative mb-8 mt-4">
              {callModal.type === 'video' ? (
                <div className="w-48 h-48 rounded-2xl overflow-hidden border border-indigo-500/30 relative">
                  <video ref={callVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping" style={{ animationDuration: '2s' }}></div>
                  <div className="w-20 h-20 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center relative">
                    <Phone className="w-8 h-8 text-indigo-400" />
                  </div>
                </>
              )}
            </div>

            <h3 className="text-base font-bold text-white mb-1">{callModal.name}</h3>
            <p className="text-slate-405 text-xs mb-8 animate-pulse font-light">
              Connecting simulated {callModal.type} call...
            </p>

            <div className="flex gap-2 w-full">
              <button
                onClick={() => setCallModal(prev => prev ? { ...prev, isMinimized: true } : null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl py-3 text-xs font-semibold transition-all"
              >
                Minimize (PiP)
              </button>
              <button
                onClick={() => setCallModal(null)}
                className="flex-1 bg-rose-600 hover:bg-rose-505 text-white rounded-2xl py-3 text-xs font-semibold transition-all"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* MODAL: FORWARD MESSAGE */}
      {forwardingMessage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[70vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-405">Forward Message</h3>
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

      {/* STORY VIEWER MODAL */}
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
