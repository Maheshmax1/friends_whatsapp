'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat, playNotificationSound, unlockAudio, Story } from '../context/ChatContext';
import { 
  Send, Phone, Search, UserPlus, LogOut, MessageSquare, 
  Settings, Users, Shield, Compass, Sparkles, Smile, Image as ImageIcon,
  Check, CheckCheck, Loader2, ArrowRight, User, AlertCircle, Plus, X,
  Video, MoreVertical, Trash2, Heart, Copy, Bookmark, Paintbrush, Play,
  Pin, Archive, Star, Reply, CornerUpRight, Edit2, ShieldAlert, Moon, Sun, 
  Database, ArrowLeft, Menu, Camera, ToggleLeft, ToggleRight, Mic, Lock, Smartphone, Ban, AlertTriangle,
  ExternalLink, Bell, Volume2, Info, Eye, Paperclip, Minimize2, PhoneOff, MicOff, VideoOff
} from 'lucide-react';

type ThemeName = 'royal' | 'emerald' | 'ocean' | 'rose' | 'classic-wa' | 'glass-wa';

const compressImage = (base64Str: string, maxWidth = 300, maxHeight = 300): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

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
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'phone' | 'login-password' | 'register-password'>('phone');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI CONFIG STATES
  const [activeTheme, setActiveTheme] = useState<ThemeName>('classic-wa');
  const [chatWallpaper, setChatWallpaper] = useState<string>('wa-doodle');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'appearance' | 'privacy'>('profile');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSharedMedia, setShowSharedMedia] = useState(false); // Collapsible Shared Media sidebar
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

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
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'archived' | 'status'>('chats');
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
  const [callModal, setCallModal] = useState<{ isOpen: boolean; type: 'voice' | 'video'; name: string; isConnected?: boolean; isMinimized?: boolean } | null>(null);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCallVideoOff, setIsCallVideoOff] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [floatingPos, setFloatingPos] = useState({ x: 20, y: 80 });
  const isDraggingFloatingRef = useRef(false);

  // Live call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (callModal && callModal.isConnected) {
      timer = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDurationSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callModal?.isConnected]);

  const formatCallDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // STATUS & STORIES
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [storyCreatorText, setStoryCreatorText] = useState('');
  const [storyCreatorImage, setStoryCreatorImage] = useState('');

  // USER PROFILE ACTION STATES (Mute, Block)
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // SWIPE EVENT TRACKERS (Mobile Gestures)
  const [callStream, setCallStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const partnerVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastNotificationMessageIdRef = useRef<string | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const earlySignalQueueRef = useRef<any[]>([]);

  // Only request/teardown hardware media based on open state and call type
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const isCallOpen = !!callModal?.isOpen;
    const callType = callModal?.type;

    if (!isCallOpen) {
      if (callStream) {
        callStream.getTracks().forEach((track) => track.stop());
        setCallStream(null);
      }
      return;
    }

    const startCallMedia = async () => {
      try {
        const constraints = {
          video: callType === 'video',
          audio: true,
        };
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        setCallStream(activeStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = activeStream;
        }
      } catch (err) {
        console.error('Call media stream request failed:', err);
        alert('Could not access camera or microphone. Please check browser permissions.');
      }
    };

    startCallMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      setCallStream(null);
    };
  }, [callModal?.isOpen, callModal?.type]);

  // Keep local video element synced whenever callStream is set
  useEffect(() => {
    if (localVideoRef.current && callStream) {
      localVideoRef.current.srcObject = callStream;
    }
  }, [callStream, callModal?.isMinimized]);

  // Listen for socket calling events via custom window events
  useEffect(() => {
    const onCallAccepted = () => {
      setCallModal((prev) => (prev ? { ...prev, isConnected: true } : null));
    };

    const onCallDeclined = () => {
      setCallModal(null);
      alert('Call was declined by recipient');
    };

    const onCallEnded = () => {
      setCallModal(null);
    };

    window.addEventListener('call_accepted', onCallAccepted);
    window.addEventListener('call_declined', onCallDeclined);
    window.addEventListener('call_ended', onCallEnded);

    return () => {
      window.removeEventListener('call_accepted', onCallAccepted);
      window.removeEventListener('call_declined', onCallDeclined);
      window.removeEventListener('call_ended', onCallEnded);
    };
  }, []);

  // WebRTC Connection Setup and track binding
  useEffect(() => {
    if (!callModal || !callModal.isConnected || !callStream) {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      iceCandidatesQueueRef.current = [];
      earlySignalQueueRef.current = [];
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    });

    callStream.getTracks().forEach((track) => pc.addTrack(track, callStream));

    pc.ontrack = (event) => {
      console.log('Received remote track', event.streams[0]);
      if (partnerVideoRef.current && event.streams[0]) {
        partnerVideoRef.current.srcObject = event.streams[0];
      }
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const targetId = activeChat?.otherMember?.id || incomingCall?.callerId;
        if (targetId) {
          emitCallSignal(targetId, { candidate: event.candidate });
        }
      }
    };

    peerConnectionRef.current = pc;

    // Process any signals (offers/candidates) that arrived while camera was warming up
    const processEarlySignals = async () => {
      for (const data of earlySignalQueueRef.current) {
        try {
          if (data.offer && pc.signalingState === 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            const targetId = incomingCall?.callerId || activeChat?.otherMember?.id;
            if (targetId) {
              emitCallSignal(targetId, { answer });
            }
          } else if (data.answer && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          } else if (data.candidate) {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
            } else {
              iceCandidatesQueueRef.current.push(data.candidate);
            }
          }
        } catch (err) {
          console.warn('Error processing queued early signal:', err);
        }
      }
      earlySignalQueueRef.current = [];

      // Flush ICE candidates
      if (iceCandidatesQueueRef.current.length > 0 && pc.remoteDescription && pc.remoteDescription.type) {
        for (const cand of iceCandidatesQueueRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }
        iceCandidatesQueueRef.current = [];
      }
    };

    processEarlySignals();

    // Caller initiates the offer
    if (!incomingCall) {
      pc.createOffer().then(async (offer) => {
        await pc.setLocalDescription(offer);
        const targetId = activeChat?.otherMember?.id;
        if (targetId) {
          emitCallSignal(targetId, { offer });
        }
      }).catch(err => console.error('Failed to create offer:', err));
    }

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      iceCandidatesQueueRef.current = [];
      earlySignalQueueRef.current = [];
      setIsCallMuted(false);
      setIsCallVideoOff(false);
    };
  }, [callModal?.isConnected, callStream]);

  // Handle incoming ICE candidates and SDP offers/answers
  useEffect(() => {
    const handleCallSignal = async (e: Event) => {
      const data = (e as CustomEvent).detail;
      const pc = peerConnectionRef.current;

      // If peer connection is not ready yet, queue the signal so it is not lost
      if (!pc) {
        earlySignalQueueRef.current.push(data);
        return;
      }

      try {
        if (data.offer) {
          if (pc.signalingState === 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            const targetId = incomingCall?.callerId || activeChat?.otherMember?.id;
            if (targetId) {
              emitCallSignal(targetId, { answer });
            }
            // Process queued candidates
            if (iceCandidatesQueueRef.current.length > 0) {
              for (const cand of iceCandidatesQueueRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.warn('Delayed candidate failed:', e));
              }
              iceCandidatesQueueRef.current = [];
            }
          } else {
            console.warn('Received offer but signalingState is not stable:', pc.signalingState);
          }
        } else if (data.answer) {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            // Process queued candidates
            if (iceCandidatesQueueRef.current.length > 0) {
              for (const cand of iceCandidatesQueueRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.warn('Delayed candidate failed:', e));
              }
              iceCandidatesQueueRef.current = [];
            }
          } else {
            console.log('Received answer but signalingState is already stable (or not have-local-offer):', pc.signalingState);
          }
        } else if (data.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e => console.warn('Add ICE candidate failed:', e));
          } else {
            iceCandidatesQueueRef.current.push(data.candidate);
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC signaling:', err);
      }
    };

    window.addEventListener('call_signal', handleCallSignal);
    return () => window.removeEventListener('call_signal', handleCallSignal);
  }, [incomingCall, activeChat]);

  const toggleCallAudio = () => {
    if (callStream) {
      const audioTrack = callStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsCallMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCallVideo = () => {
    if (callStream) {
      const videoTrack = callStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCallVideoOff(!videoTrack.enabled);
      }
    }
  };

  // SWIPE EVENT TRACKERS (Mobile Gestures)
  const touchStartCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const [swipedChatId, setSwipedChatId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Request HTML5 notification rights on load and user interaction click
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    const requestOnInteraction = () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
      document.removeEventListener('click', requestOnInteraction);
    };
    document.addEventListener('click', requestOnInteraction);
    return () => document.removeEventListener('click', requestOnInteraction);
  }, []);

  // Desktop/Mobile native push notification + audio chime trigger when tab is backgrounded
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.senderId !== user?.id) {
        if (lastNotificationMessageIdRef.current === lastMessage.id) {
          return;
        }
        lastNotificationMessageIdRef.current = lastMessage.id;

        const isTabHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
        if (isTabHidden) {
          playNotificationSound();

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const senderName = lastMessage.sender.displayName || lastMessage.sender.username || 'Friends WhatsApp';
            const bodyPreview = lastMessage.content.startsWith('data:image') 
              ? '📷 Sent a photo' 
              : lastMessage.content.startsWith('data:audio') 
              ? '🎙️ Sent a voice note' 
              : lastMessage.content;
            try {
              new Notification(senderName, {
                body: bodyPreview,
                icon: lastMessage.sender.avatarUrl || '/favicon.ico'
              });
            } catch (e) {}
          }
        }
      }
    }
  }, [messages, user?.id]);

  // Gentle prompt to configure hardware permissions on load
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.permissions) {
      Promise.all([
        navigator.permissions.query({ name: 'camera' as any }).catch(() => null),
        navigator.permissions.query({ name: 'microphone' as any }).catch(() => null)
      ]).then(([cam, mic]) => {
        if ((cam && cam.state === 'prompt') || (mic && mic.state === 'prompt')) {
          setTimeout(() => {
            setShowPermissionPrompt(true);
          }, 2500);
        }
      });
    }
  }, []);

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

  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setAuthError('');
    setIsSubmitting(true);
    const result = await checkPhone(phoneNumber);
    setIsSubmitting(false);
    if (result.success) {
      if (result.exists) {
        setStep('login-password');
      } else {
        setStep('register-password');
      }
    } else {
      setAuthError(result.error || 'Failed to check phone number');
    }
  };

  const handleLoginWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setAuthError('');
    setIsSubmitting(true);
    const result = await loginPass(phoneNumber, password);
    setIsSubmitting(false);
    if (result.success) {
      // Logged in!
    } else {
      setAuthError(result.error || 'Invalid phone or password');
    }
  };

  const handleRegisterWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setAuthError('');
    setIsSubmitting(true);
    const result = await registerPass(phoneNumber, password);
    setIsSubmitting(false);
    if (result.success) {
      // Registered & logged in!
    } else {
      setAuthError(result.error || 'Failed to register. Choose a stronger password.');
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
    if (!activeChat || !activeChat.otherMember) return;
    emitCallUser(type, activeChat.otherMember.id, user?.displayName || user?.username || 'Halo User');
    setCallModal({
      isOpen: true,
      type,
      name: activeChat.name,
      isConnected: false
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

    // Strict deduplication to ensure no duplicate names or chats appear
    const seenOtherUserIds = new Set<string>();
    const seenChatIds = new Set<string>();
    const deduplicatedResult = result.filter((c) => {
      if (seenChatIds.has(c.id)) return false;
      seenChatIds.add(c.id);

      if (!c.isGroup && c.otherMember?.id) {
        if (seenOtherUserIds.has(c.otherMember.id)) return false;
        seenOtherUserIds.add(c.otherMember.id);
      }
      return true;
    });

    return [...deduplicatedResult].sort((a, b) => {
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
      case 'classic-wa':
        return {
          primary: 'bg-[#00a884] hover:bg-[#008f72] text-white shadow-emerald-500/10',
          bubbleSent: 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-800 dark:text-white',
          textAccent: 'text-[#00a884]',
          borderAccent: 'focus:border-[#00a884] focus:ring-[#00a884]/20',
          ringAccent: 'border-[#00a884]',
          textAccentHover: 'hover:text-[#00a884]',
          activeBg: 'bg-[#00a884]/10 text-[#00a884] border border-[#00a884]/20',
        };
      case 'glass-wa':
        return {
          primary: 'bg-emerald-500/80 hover:bg-emerald-400 text-slate-955 shadow-emerald-500/10 backdrop-blur-md',
          bubbleSent: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-250 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.05)]',
          textAccent: 'text-emerald-400',
          borderAccent: 'focus:border-emerald-500/60 focus:ring-emerald-500/20',
          ringAccent: 'border-emerald-500',
          textAccentHover: 'hover:text-emerald-400',
          activeBg: 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20',
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

  const getThemeLayout = () => {
    if (activeTheme === 'classic-wa') {
      return {
        sidebarBg: 'bg-[#ffffff] dark:bg-[#111b21]',
        sidebarHeader: 'bg-[#f0f2f5] dark:bg-[#202c33]',
        chatHeader: 'bg-[#f0f2f5] dark:bg-[#202c33]',
        chatBg: 'bg-[#efeae2] dark:bg-[#0b141a]',
        inputBg: 'bg-[#f0f2f5] dark:bg-[#202c33]',
        activeChatBg: 'bg-[#f5f6f6] dark:bg-[#2a3942]',
        chatItemHover: 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]',
        textPrimary: 'text-slate-900 dark:text-slate-200',
        textSecondary: 'text-slate-500 dark:text-slate-450',
        border: 'border-[#e9edef] dark:border-[#222e35]',
        sidebarWidth: 'lg:w-[380px]',
      };
    }
    if (activeTheme === 'glass-wa') {
      return {
        sidebarBg: 'bg-slate-950/20 dark:bg-slate-955/20 light:bg-white/80 backdrop-blur-xl',
        sidebarHeader: 'bg-slate-955/40 dark:bg-slate-955/40 light:bg-slate-100/50 backdrop-blur-md',
        chatHeader: 'bg-slate-955/40 dark:bg-slate-955/40 light:bg-slate-100/50 backdrop-blur-md',
        chatBg: 'bg-gradient-to-br from-slate-950 via-indigo-950/10 to-slate-955',
        inputBg: 'bg-slate-955/40 dark:bg-slate-955/40 light:bg-slate-100/50 backdrop-blur-md',
        activeChatBg: 'bg-indigo-900/20 text-indigo-200 border border-indigo-500/20',
        chatItemHover: 'hover:bg-slate-900/60 dark:hover:bg-slate-900/60 light:hover:bg-slate-100/60',
        textPrimary: 'text-white dark:text-white light:text-slate-800',
        textSecondary: 'text-slate-450 dark:text-slate-400 light:text-slate-500',
        border: 'border-slate-900/60 dark:border-slate-900/60 light:border-slate-200',
        sidebarWidth: 'lg:w-[340px]',
      };
    }
    // Default Halo layouts
    return {
      sidebarBg: 'bg-slate-955/70 dark:bg-slate-955/70 light:bg-white/80 backdrop-blur-xl',
      sidebarHeader: '',
      chatHeader: 'bg-slate-955/45 dark:bg-slate-955/45 light:bg-white/85 backdrop-blur-md',
      chatBg: getWallpaperClass(),
      inputBg: 'bg-slate-955/80 dark:bg-slate-955/80 light:bg-white backdrop-blur-xl',
      activeChatBg: 'bg-indigo-950/20 border border-indigo-500/20',
      chatItemHover: 'hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100',
      textPrimary: 'text-white dark:text-white light:text-slate-800',
      textSecondary: 'text-slate-450 dark:text-slate-400 light:text-slate-500',
      border: 'border-slate-900 dark:border-slate-900 light:border-slate-202',
      sidebarWidth: 'lg:w-[340px]',
    };
  };

  // UI styling classes matching themes
  const themeStyle = getThemeClass();
  const themeLayout = getThemeLayout();

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
      <div className="h-dvh w-screen flex items-center justify-center bg-[#0b141a] wa-doodle-bg relative overflow-hidden px-4">
        <div className="w-full max-w-md bg-[#111b21] border border-[#222e35] shadow-2xl rounded-[32px] p-8 relative z-10 text-[#e9edef]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#00a884] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <MessageSquare className="w-8 h-8 text-[#111b21]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#e9edef]">
              WhatsApp Web
            </h1>
            <p className="text-[#8696a0] text-xs mt-1.5 font-normal tracking-wide">End-to-end encrypted messaging</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleCheckPhone} className="space-y-5">
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
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : step === 'login-password' ? (
            <form onSubmit={handleLoginWithPassword} className="space-y-5">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest">Enter Password</label>
                  <button type="button" onClick={() => setStep('phone')} className="text-indigo-400 text-xs hover:underline">
                    Change Number
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-805 focus:border-indigo-500/80 rounded-xl py-3.5 px-4 text-white text-xs outline-none transition-all focus:ring-1 focus:ring-indigo-500/20 font-medium animate-in fade-in"
                />
              </div>

              <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-2xl text-[10px] text-slate-500 text-center leading-relaxed font-light">
                This number is registered. Enter your account password to log in.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-505 text-white rounded-xl py-3.5 text-xs font-semibold transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterWithPassword} className="space-y-5">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest">Set Password</label>
                  <button type="button" onClick={() => setStep('phone')} className="text-indigo-400 text-xs hover:underline">
                    Change Number
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="Choose password for next login"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-805 focus:border-indigo-500/80 rounded-xl py-3.5 px-4 text-white text-xs outline-none transition-all focus:ring-1 focus:ring-indigo-500/20 font-medium animate-in fade-in"
                />
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl text-[10px] text-indigo-300 text-center leading-relaxed font-light">
                This number is not registered. Choose a password now to create your account and use it for future logins.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-505 text-white rounded-xl py-3.5 text-xs font-semibold transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Create Account & Login</span>
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
      <div className="flex-1 flex overflow-hidden relative z-10 h-full w-full bg-[#0b141a]">
        
        {/* 1. AUTHENTIC WHATSAPP LEFTMOST ICON RAIL (DESKTOP) */}
        <div className="hidden md:flex flex-col justify-between items-center w-16 bg-[#202c33] border-r border-[#222e35] py-3 shrink-0 z-30 select-none">
          {/* Top Rail Actions */}
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Chats icon with green badge */}
            <button 
              onClick={() => setActiveTab('chats')}
              className={`relative p-2.5 rounded-xl transition-colors group ${activeTab === 'chats' ? 'bg-[#2a3942] text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]'}`}
              title="Chats"
            >
              <MessageSquare className="w-5 h-5 text-[#00a884]" />
              <span className="absolute -top-1 -right-1 bg-[#25d366] text-[#111b21] font-bold text-[9px] px-1.5 py-0.2 rounded-full">
                99+
              </span>
            </button>

            {/* Status / Stories icon */}
            <button 
              onClick={() => setActiveTab(activeTab === 'status' ? 'chats' : 'status')}
              className={`relative p-2.5 rounded-xl transition-colors ${activeTab === 'status' ? 'bg-[#2a3942] text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]'}`}
              title="Status"
            >
              <Compass className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#25d366]"></span>
            </button>

            {/* Channels / Broadcast */}
            <button 
              onClick={() => alert('Channels available in WhatsApp v2.0!')}
              className="p-2.5 rounded-xl hover:bg-[#2a3942] transition-colors text-[#8696a0] hover:text-[#e9edef]"
              title="Channels"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            {/* Communities */}
            <button 
              onClick={() => setShowGroupWizard(true)}
              className="p-2.5 rounded-xl hover:bg-[#2a3942] transition-colors text-[#8696a0] hover:text-[#e9edef]"
              title="Communities & Groups"
            >
              <Users className="w-5 h-5" />
            </button>

            {/* Meta AI Ring */}
            <button 
              onClick={() => {
                alert('Meta AI Chat assistant connected to Friends WhatsApp!');
              }}
              className="p-2.5 rounded-xl hover:bg-[#2a3942] transition-colors text-cyan-400 group relative"
              title="Meta AI"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#202c33] rounded-full flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                </div>
              </div>
            </button>
          </div>

          {/* Bottom Rail Actions */}
          <div className="flex flex-col items-center gap-3.5 w-full">
            {/* Archived Chats */}
            <button 
              onClick={() => setActiveTab(activeTab === 'archived' ? 'chats' : 'archived')}
              className={`p-2.5 rounded-xl hover:bg-[#2a3942] transition-colors ${activeTab === 'archived' ? 'text-[#00a884] bg-[#2a3942]' : 'text-[#8696a0] hover:text-[#e9edef]'}`}
              title="Archived"
            >
              <Archive className="w-5 h-5" />
            </button>

            {/* Settings */}
            <button 
              onClick={() => setShowSettingsDrawer(true)}
              className="p-2.5 rounded-xl hover:bg-[#2a3942] transition-colors text-[#8696a0] hover:text-[#e9edef]"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Profile Avatar */}
            <button 
              onClick={() => setShowSettingsDrawer(true)}
              className="relative w-8 h-8 rounded-full overflow-hidden border border-[#222e35] hover:ring-2 hover:ring-[#00a884] transition-all"
              title="Profile"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#2a3942] flex items-center justify-center font-bold text-xs text-[#e9edef]">
                  {user.displayName?.slice(0, 2).toUpperCase() || 'U'}
                </div>
              )}
            </button>
          </div>
        </div>
        
        {/* 2. CHATS SIDEBAR (AUTHENTIC WHATSAPP WEB STYLE) */}
        <div className={`w-full ${themeLayout.sidebarWidth} border-r border-[#222e35] bg-[#111b21] flex flex-col h-full overflow-hidden shrink-0 transition-all ${
          mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* WhatsApp Sidebar Header */}
          <div className="p-3.5 px-4 flex items-center justify-between border-b border-[#222e35] bg-[#111b21]">
            <h2 className="text-xl font-bold tracking-tight text-[#e9edef]">WhatsApp</h2>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAddContact(true)} 
                title="New chat"
                className="w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#008f72] text-[#111b21] flex items-center justify-center font-bold transition-transform hover:scale-105 shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button 
                onClick={() => setShowSettingsDrawer(true)} 
                title="Menu"
                className="w-8 h-8 rounded-full hover:bg-[#202c33] flex items-center justify-center text-[#8696a0] hover:text-[#e9edef] transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar & WhatsApp Filter Tabs */}
          <div className="p-3 pb-2.5 bg-[#111b21] border-b border-[#222e35] space-y-2.5">
            <div className="relative flex items-center bg-[#202c33] rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#00a884]">
              <Search className="w-4 h-4 text-[#8696a0] shrink-0 mr-3" />
              <input
                type="text"
                placeholder="Search or start a new chat"
                value={localChatSearch || searchQuery}
                onChange={(e) => {
                  setLocalChatSearch(e.target.value);
                  setSearchQuery(e.target.value);
                }}
                className="w-full bg-transparent text-xs text-[#e9edef] placeholder-[#8696a0] outline-none"
              />
              {(localChatSearch || searchQuery) && (
                <button 
                  onClick={() => { setLocalChatSearch(''); setSearchQuery(''); }}
                  className="text-[#8696a0] hover:text-[#e9edef] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills (All, Unread 122, Favourites, Groups) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs select-none">
              <button
                onClick={() => setActiveTab('chats')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  activeTab === 'chats'
                    ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30'
                    : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('chats')}
                className="px-3 py-1 rounded-full bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] font-medium transition-colors flex items-center gap-1.5"
              >
                <span>Unread</span>
                <span className="text-[10px] bg-[#25d366]/20 text-[#25d366] px-1 rounded-full font-bold">122</span>
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'contacts' ? 'chats' : 'contacts')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  activeTab === 'contacts'
                    ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30'
                    : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                }`}
              >
                Favourites
              </button>
              <button
                onClick={() => setShowGroupWizard(true)}
                className="px-3 py-1 rounded-full bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] font-medium transition-colors"
              >
                Groups
              </button>
            </div>
          </div>

          {/* Search Results Drawer */}
          {searchQuery.trim().length > 1 && (
            <div className="flex-1 overflow-y-auto px-2 border-b border-[#222e35] bg-[#111b21] animate-in slide-in-from-top duration-150">
              <span className="text-[9px] font-bold text-[#00a884] uppercase tracking-widest px-2 block mb-2 mt-2">
                Global Users Found
              </span>
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8696a0]" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-[11px] text-[#8696a0] text-center py-4">No users found</p>
              ) : (
                searchResults.map((resultUser) => (
                  <button
                    key={resultUser.id}
                    onClick={() => {
                      startChatWithUser(resultUser.id);
                      setSearchQuery('');
                      setMobileView('chat');
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#202c33] text-left transition-colors mb-1"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#202c33] border border-[#222e35] flex items-center justify-center text-xs font-semibold text-[#e9edef]">
                      {resultUser.displayName?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-medium text-[#e9edef] truncate">{resultUser.displayName || resultUser.username}</h5>
                      <p className="text-[10px] text-[#8696a0] truncate">{resultUser.phoneNumber}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* WhatsApp Web Desktop Notification Prompt Banner */}
          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
            <div 
              onClick={() => {
                Notification.requestPermission();
              }}
              className="p-3 px-4 bg-[#182229] hover:bg-[#1f2c34] border-b border-[#222e35] flex items-center gap-3 cursor-pointer transition-colors select-none"
            >
              <div className="w-9 h-9 rounded-full bg-[#005c4b]/40 text-[#00a884] flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-[#00a884]" />
              </div>
              <div className="flex-1 min-w-0">
                <h6 className="text-xs font-medium text-[#e9edef] leading-tight">Get notified of new messages</h6>
                <p className="text-[11px] text-[#00a884] hover:underline leading-tight mt-0.5">Turn on desktop notifications &gt;</p>
              </div>
            </div>
          )}

          {/* Active Lists */}
          {searchQuery.trim().length <= 1 && (
            <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-[#222e35]/60">
              {activeTab === 'status' ? (
                <div className="flex-1 overflow-y-auto min-h-0 bg-[#111b21]">
                  {/* Status Header */}
                  <div className="p-3 px-4 flex items-center justify-between border-b border-[#222e35]">
                    <h4 className="text-sm font-semibold text-[#e9edef]">Status</h4>
                    <button
                      onClick={() => {
                        setStoryCreatorText('');
                        setStoryCreatorImage('');
                        setShowStoryCreator(true);
                      }}
                      className="flex items-center gap-1.5 text-xs text-[#00a884] hover:text-[#25d366] font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Status</span>
                    </button>
                  </div>

                  {/* My Status */}
                  {(() => {
                    const myStatuses = statuses.filter((s) => s.userId === user?.id);
                    const hasMyStatus = myStatuses.length > 0;
                    const latestMyStatus = myStatuses[0];

                    return (
                      <div 
                        onClick={() => {
                          if (hasMyStatus) {
                            setActiveStory(latestMyStatus);
                          } else {
                            setStoryCreatorText('');
                            setStoryCreatorImage('');
                            setShowStoryCreator(true);
                          }
                        }}
                        className="flex items-center gap-3.5 p-3 px-4 hover:bg-[#202c33] cursor-pointer transition-colors border-b border-[#222e35]/60"
                      >
                        <div className="relative shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium text-sm text-[#e9edef] overflow-hidden ${
                            hasMyStatus ? 'border-2 border-[#00a884] p-0.5' : 'bg-[#202c33] border border-[#222e35]'
                          }`}>
                            {user?.avatarUrl ? (
                              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <span>{(user?.displayName || user?.username || 'Me').slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setStoryCreatorText('');
                              setStoryCreatorImage('');
                              setShowStoryCreator(true);
                            }}
                            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#00a884] text-[#111b21] rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                            title="Add status"
                          >
                            <Plus className="w-3.5 h-3.5 font-bold" />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="text-[15px] font-normal text-[#e9edef] leading-tight">My Status</h5>
                          <p className="text-xs text-[#8696a0] truncate leading-tight mt-0.5">
                            {hasMyStatus ? `Posted ${latestMyStatus.time} • Tap to view` : 'Tap to add status update'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Recent Updates Header */}
                  <div className="p-2.5 px-4 bg-[#111b21] border-b border-[#222e35]">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8696a0]">
                      Recent updates
                    </span>
                  </div>

                  {/* Contact Updates List */}
                  {(() => {
                    const otherStatuses = statuses.filter((s) => s.userId !== user?.id);
                    if (otherStatuses.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-10 text-[#8696a0] px-4">
                          <Compass className="w-8 h-8 mb-2 opacity-40 text-[#00a884]" />
                          <p className="text-xs text-center">No recent status updates from contacts.</p>
                          <button
                            onClick={() => {
                              setStoryCreatorText('');
                              setStoryCreatorImage('');
                              setShowStoryCreator(true);
                            }}
                            className="mt-3 px-3.5 py-1.5 bg-[#00a884] text-[#111b21] rounded-full text-xs font-semibold hover:bg-[#008f6f] transition-colors"
                          >
                            Post your status update
                          </button>
                        </div>
                      );
                    }

                    return otherStatuses.map((status) => (
                      <div
                        key={status.id}
                        onClick={() => setActiveStory(status)}
                        className="flex items-center gap-3.5 p-3 px-4 hover:bg-[#202c33] cursor-pointer transition-colors border-b border-[#222e35]/40"
                      >
                        <div className="w-12 h-12 rounded-full border-2 border-[#00a884] p-0.5 flex items-center justify-center font-medium text-sm text-[#e9edef] overflow-hidden shrink-0">
                          {status.avatar && status.avatar.startsWith('data:') ? (
                            <img src={status.avatar} alt={status.name} className="w-full h-full object-cover rounded-full" />
                          ) : status.mediaUrl && status.mediaUrl.startsWith('data:image') ? (
                            <img src={status.mediaUrl} alt={status.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="w-full h-full bg-[#202c33] rounded-full flex items-center justify-center">
                              {status.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="text-[15px] font-normal text-[#e9edef] leading-tight truncate">{status.name}</h5>
                          <p className="text-xs text-[#8696a0] truncate leading-tight mt-0.5">
                            {status.time || 'Today'} {status.text ? `• ${status.text}` : ''}
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : activeTab === 'chats' || activeTab === 'archived' ? (
                filteredChatsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#8696a0] px-4 py-8">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-50 text-[#00a884]" />
                    <p className="text-xs text-center font-normal leading-relaxed">No conversations here.</p>
                  </div>
                ) : (
                  filteredChatsList.map((chat) => {
                    const isChatActive = chat.id === activeChatId;
                    const isOnline = chat.otherMember?.isOnline || onlineUsers[chat.otherMember?.id || ''];
                    const isTyping = typingUsers[chat.otherMember?.id || ''];

                    return (
                      <div 
                        key={chat.id}
                        onClick={() => {
                          selectChat(chat.id);
                          setMobileView('chat');
                        }}
                        className={`w-full flex items-center justify-between p-3 px-4 text-left transition-colors cursor-pointer select-none border-b border-[#222e35]/40 ${
                          isChatActive ? 'bg-[#2a3942]' : 'bg-[#111b21] hover:bg-[#202c33]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-full bg-[#202c33] border border-[#222e35] flex items-center justify-center font-medium text-sm text-[#e9edef] relative shrink-0 overflow-hidden">
                            {chat.otherMember?.avatarUrl ? (
                              <img src={chat.otherMember.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{chat.name.slice(0, 2).toUpperCase()}</span>
                            )}
                            {chat.isGroup && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00a884] border border-[#111b21] rounded-full flex items-center justify-center text-[7px] text-[#111b21] font-bold">G</div>
                            )}
                            {isOnline && !chat.isGroup && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] border-2 border-[#111b21] rounded-full animate-pulse"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <h5 className="text-[15px] font-normal truncate leading-tight text-[#e9edef]">
                                {chat.name}
                              </h5>
                              <span className="text-xs text-[#8696a0] shrink-0 ml-2">
                                {chat.lastMessage 
                                  ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                  : ''}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-[#8696a0] truncate leading-tight flex-1">
                                {isTyping ? (
                                  <span className="text-[#25d366] font-normal animate-pulse">typing...</span>
                                ) : chat.lastMessage?.isDeleted ? (
                                  <span className="italic text-[#8696a0]">This message was deleted</span>
                                ) : (
                                  chat.lastMessage?.content || 'No messages yet'
                                )}
                              </p>
                              
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                {chat.isPinned && <Pin className="w-3 h-3 text-[#8696a0]" />}
                                {chat.isArchived && <Archive className="w-3 h-3 text-[#00a884]" />}
                                {chat.lastMessage && !isChatActive && (
                                  <span className="bg-[#25d366] text-[#111b21] font-bold text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                                    1
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                (() => {
                  const uniqueContacts = Array.from(
                    new Map(contacts.map((c) => [c.id || c.phoneNumber, c])).values()
                  );
                  if (uniqueContacts.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full text-[#8696a0] px-4 py-8">
                        <Users className="w-8 h-8 mb-2 opacity-50 text-[#00a884]" />
                        <p className="text-xs text-center font-normal leading-relaxed">No contacts yet.</p>
                      </div>
                    );
                  }
                  return uniqueContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        startChatWithUser(contact.id);
                        setActiveTab('chats');
                        setMobileView('chat');
                      }}
                      className="w-full flex items-center gap-3 p-3 px-4 text-left hover:bg-[#202c33] text-[#e9edef] transition-colors border-b border-[#222e35]/60"
                    >
                      <div className="w-11 h-11 rounded-full bg-[#202c33] border border-[#222e35] flex items-center justify-center font-medium text-xs text-[#e9edef] relative shrink-0">
                        {contact.displayName.slice(0, 2).toUpperCase()}
                        {contact.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] border-2 border-[#111b21] rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-[15px] font-normal truncate leading-none mb-1 text-[#e9edef]">{contact.displayName}</h5>
                        <p className="text-xs text-[#8696a0] truncate leading-none">{contact.phoneNumber}</p>
                      </div>
                    </button>
                  ));
                })()
              )}
            </div>
          )}

          {/* Bottom Windows promo bar */}
          <div className="mt-auto p-3 px-4 bg-[#111b21] border-t border-[#222e35] flex items-center gap-3 select-none">
            <div className="w-7 h-7 rounded-lg bg-[#00a884] text-[#111b21] flex items-center justify-center font-bold text-xs shadow-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-xs text-[#00a884] font-medium">Get WhatsApp for Windows</span>
          </div>
        </div>

        {/* CHAT WINDOW (RIGHT SECTION - Responsive Toggling) */}
        <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${
          mobileView === 'list' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {activeChat ? (
            <div className="flex-1 flex h-full overflow-hidden relative">
              
              {/* Message Panel Area */}
              <div className={`flex-1 flex flex-col h-full overflow-hidden ${themeLayout.chatBg} relative z-10 transition-colors duration-300`}>
                
                {/* Chat Header (WhatsApp Web style) */}
                <div className="p-2.5 px-4 border-b border-[#222e35] bg-[#202c33] flex items-center justify-between relative z-20 shrink-0">
                  <div className="flex items-center gap-3">
                    
                    <button 
                      onClick={() => { selectChat(''); setMobileView('list'); }}
                      className="block lg:hidden p-1.5 rounded-lg hover:bg-[#2a3942] text-[#aebac1] hover:text-[#e9edef] shrink-0 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-[#2a3942] border border-[#222e35] flex items-center justify-center font-medium text-xs cursor-pointer overflow-hidden shrink-0 text-[#e9edef]" onClick={() => setShowSharedMedia(!showSharedMedia)}>
                      {activeChat.otherMember?.avatarUrl ? (
                        <img src={activeChat.otherMember.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{activeChat.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    
                    <div className="cursor-pointer text-left" onClick={() => setShowSharedMedia(!showSharedMedia)}>
                      <h4 className="text-[15px] font-normal leading-tight text-[#e9edef]">{activeChat.name}</h4>
                      <span className="text-xs text-[#8696a0] block truncate">
                        {typingUsers[activeChat.otherMember?.id || ''] ? (
                          <span className="text-[#25d366] font-normal animate-pulse">typing...</span>
                        ) : activeChat.isGroup ? (
                          <span className="text-[#8696a0]">Hari, Joo, Kavinisha, ~Priya, +91 70100 42985...</span>
                        ) : activeChat.otherMember?.isOnline || onlineUsers[activeChat.otherMember?.id || ''] ? (
                          <span className="text-[#25d366] font-normal">online</span>
                        ) : (
                          'offline'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[#aebac1]">
                    <button 
                      onClick={() => handleCall('video')}
                      title="Video call"
                      className="p-2 rounded-full hover:bg-[#2a3942] hover:text-[#e9edef] transition-colors"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleCall('voice')}
                      title="Voice call"
                      className="p-2 rounded-full hover:bg-[#2a3942] hover:text-[#e9edef] transition-colors"
                    >
                      <Phone className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={() => setShowSharedMedia(!showSharedMedia)}
                      title="Search in chat"
                      className="p-2 rounded-full hover:bg-[#2a3942] hover:text-[#e9edef] transition-colors"
                    >
                      <Search className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={() => setShowSharedMedia(!showSharedMedia)}
                      title="Menu"
                      className="p-2 rounded-full hover:bg-[#2a3942] hover:text-[#e9edef] transition-colors"
                    >
                      <MoreVertical className="w-4.5 h-4.5" />
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

{/* Message Bubble Container (WhatsApp Dark Mode) */}
                          <div className={`rounded-lg px-3.5 py-2 shadow-sm relative transition-all duration-150 max-w-[85%] md:max-w-[70%] ${
                            isCurrentUser 
                              ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' 
                              : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                          }`}>
                            {/* Sender Name in group chats (WhatsApp pink/amber colors) */}
                            {activeChat.isGroup && !isCurrentUser && (
                              <div className="flex items-center justify-between gap-3 text-[11px] mb-1 font-medium select-none">
                                <span className="text-[#e542a3]">~ {message.sender.displayName || message.sender.username}</span>
                                <span className="text-[#8696a0] text-[10px]">{(message.sender as any).phoneNumber || message.sender.username}</span>
                              </div>
                            )}

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
                              <span className={`text-[8px] font-light select-none ${
                                isCurrentUser 
                                  ? activeTheme === 'classic-wa' 
                                    ? 'text-slate-500/80 dark:text-[#aebac1]/80' 
                                    : 'text-indigo-200/80' 
                                  : 'text-slate-500 dark:text-[#aebac1]/60'
                              }`}>
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isCurrentUser && (
                                <span>
                                  {message.status === 'READ' ? (
                                    <CheckCheck className={`w-3.5 h-3.5 ${activeTheme === 'classic-wa' ? 'text-[#53bdeb]' : 'text-cyan-200'}`} />
                                  ) : message.status === 'DELIVERED' ? (
                                    <CheckCheck className={`w-3.5 h-3.5 ${activeTheme === 'classic-wa' ? 'text-slate-500/60 dark:text-[#aebac1]/60' : 'opacity-60 text-white'}`} />
                                  ) : (
                                    <Check className={`w-3.5 h-3.5 ${activeTheme === 'classic-wa' ? 'text-slate-500/60 dark:text-[#aebac1]/60' : 'opacity-65 text-white'}`} />
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

                {/* Chat Message Input Box (WhatsApp Web Dark Bar) */}
                {!isRecording && (
                  <form 
                    onSubmit={handleSend} 
                    className="p-2.5 px-4 border-t border-[#222e35] bg-[#202c33] relative z-20 shrink-0 flex items-center gap-2.5"
                  >
                    {/* Paperclip Attach Dropdown Trigger */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        title="Attach Media & Files"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] transition-colors"
                      >
                        <Paperclip className={`w-5 h-5 transition-transform duration-200 ${showAttachmentMenu ? 'rotate-45 text-[#00a884]' : ''}`} />
                      </button>

                      {/* Animated Attachment Slideout Menu */}
                      {showAttachmentMenu && (
                        <>
                          <div 
                            className="fixed inset-0 z-40 bg-transparent" 
                            onClick={() => setShowAttachmentMenu(false)} 
                          />
                          <div className="absolute bottom-12 left-0 w-48 rounded-2xl p-2 bg-[#202c33] border border-[#222e35] shadow-2xl flex flex-col gap-1 z-50 text-[#e9edef]">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAttachmentMenu(false);
                                startCamera();
                              }}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs hover:bg-[#2a3942] transition-colors"
                            >
                              <Camera className="w-4 h-4 text-[#00a884]" />
                              <span>Camera Snapshot</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setShowAttachmentMenu(false);
                                document.getElementById('chat-gallery-input')?.click();
                              }}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs hover:bg-[#2a3942] transition-colors"
                            >
                              <ImageIcon className="w-4 h-4 text-[#00a884]" />
                              <span>Photos & Videos</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setShowAttachmentMenu(false);
                                alert('Document sharing coming soon! 📑');
                              }}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs hover:bg-[#2a3942] transition-colors"
                            >
                              <Lock className="w-4 h-4 text-[#00a884]" />
                              <span>Document File</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Smiley Emoji Trigger */}
                    <button
                      type="button"
                      onClick={() => setMessageInput(prev => prev + ' 😊')}
                      title="Emojis"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    <input 
                      type="file" 
                      id="chat-gallery-input" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.readAsDataURL(file);
                          reader.onload = async () => {
                            const compressed = await compressImage(reader.result as string, 800, 800);
                            sendMessage(compressed, undefined);
                          };
                        }
                      }}
                    />

                    {/* Chat Input Text Box */}
                    <div className="flex-1 relative flex items-center bg-[#2a3942] rounded-lg border-0 transition-colors">
                      <input
                        type="text"
                        placeholder="Type a message"
                        value={messageInput}
                        onChange={handleInputChangeValue}
                        className="w-full bg-transparent py-2 pl-4 pr-10 text-[15px] outline-none text-[#e9edef] placeholder-[#8696a0] font-normal"
                      />
                    </div>

                    {/* Right Action: Send message if typing, or Record mic if empty */}
                    {messageInput.trim() ? (
                      <button
                        type="submit"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[#8696a0] hover:text-[#00a884] hover:bg-[#2a3942] transition-all shrink-0"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        title="Record Voice Note"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] transition-all shrink-0"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    )}
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
/* EMPTY CHAT PLACEHOLDER SCREEN (WhatsApp Web Windows banner) */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none h-full bg-[#222e35] border-b-4 border-[#00a884] text-[#e9edef]">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-[#111b21] border border-[#222e35] flex items-center justify-center shadow-xl">
                  <Smartphone className="w-12 h-12 text-[#00a884]" />
                </div>
              </div>
              <h3 className="text-2xl font-light text-[#e9edef] mb-3">Download WhatsApp for Windows</h3>
              <p className="text-[#8696a0] text-sm max-w-md font-normal leading-relaxed mb-8">
                Make calls, share your screen and get a faster experience when you download the Windows app.
              </p>
              
              <div className="mt-8 flex items-center gap-2 text-xs text-[#8696a0]">
                <Lock className="w-3.5 h-3.5" />
                <span>End-to-end encrypted</span>
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
          className={`absolute top-0 left-0 h-full w-[310px] md:w-[340px] border-r shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-out ${
            showSettingsDrawer ? 'translate-x-0' : '-translate-x-full'
          } ${
            isDarkMode 
              ? 'bg-slate-955/80 border-slate-900/60 backdrop-blur-2xl text-white shadow-indigo-500/5' 
              : 'bg-white/85 border-slate-200/80 backdrop-blur-2xl text-slate-800 shadow-slate-950/5'
          }`}
        >
          {/* Header Area */}
          <div className={`p-4 border-b flex justify-between items-center shrink-0 ${
            isDarkMode ? 'border-slate-900/65' : 'border-slate-250/60'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Settings Center</span>
            <button 
              onClick={() => setShowSettingsDrawer(false)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode ? 'hover:bg-slate-900 text-slate-450 hover:text-white' : 'hover:bg-slate-100 text-slate-550 hover:text-slate-900'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selection Bar */}
          <div className={`p-2 flex gap-1 border-b shrink-0 ${
            isDarkMode ? 'border-slate-900/65' : 'border-slate-250/60'
          }`}>
            {(['profile', 'appearance', 'privacy'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSettingsTab(tab)}
                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                  settingsTab === tab
                    ? isDarkMode 
                      ? 'bg-indigo-650/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    : 'bg-transparent text-slate-450 hover:text-indigo-400 border border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {settingsTab === 'profile' && (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* Profile Identity Card */}
                <div className={`p-4 rounded-3xl border space-y-4 shadow-sm relative overflow-hidden ${
                  isDarkMode ? 'bg-slate-900/30 border-slate-850/50' : 'bg-slate-50/50 border-slate-200/80'
                }`}>
                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest block text-center">My Identity</span>
                  
                  <div className="flex flex-col items-center gap-1.5 relative">
                    <div className="relative group cursor-pointer hover:scale-102 transition-transform">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md shadow-indigo-500/10">
                        {editAvatarUrl ? (
                          <img src={editAvatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-extrabold text-white text-lg">
                            {editDisplayName.slice(0, 2).toUpperCase() || 'HA'}
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <span className="text-[8px] text-slate-500 font-light mt-0.5">Profile Photo</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1">Display Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter display name"
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        className={`w-full border rounded-xl py-2 px-3 text-xs outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-955 border-slate-805 text-white focus:border-indigo-500/60' 
                            : 'bg-white border-slate-200 text-slate-805 focus:border-indigo-500/60 shadow-inner'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1">Bio / Status</label>
                      <input
                        type="text"
                        placeholder="E.g. Hey there! I am using Halo Chat."
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className={`w-full border rounded-xl py-2 px-3 text-xs outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-955 border-slate-805 text-white focus:border-indigo-500/60' 
                            : 'bg-white border-slate-200 text-slate-805 focus:border-indigo-500/60 shadow-inner'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1">Avatar Image Upload</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.readAsDataURL(file);
                              reader.onloadend = async () => {
                                const compressed = await compressImage(reader.result as string, 200, 200);
                                setEditAvatarUrl(compressed);
                              };
                            }
                          }}
                          className="hidden"
                          id="profile-avatar-upload"
                        />
                        <label 
                          htmlFor="profile-avatar-upload"
                          className={`w-full border rounded-xl py-2 px-3 text-xs outline-none transition-colors cursor-pointer flex items-center justify-between ${
                            isDarkMode 
                              ? 'bg-slate-955 border-slate-805 hover:border-indigo-500/50 text-slate-400 hover:text-white' 
                              : 'bg-white border-slate-250 hover:border-indigo-500/50 text-slate-600 hover:text-slate-900 shadow-inner'
                          }`}
                        >
                          <span className="truncate max-w-[190px]">
                            {editAvatarUrl ? 'Image Selected (Base64)' : 'Choose Image File...'}
                          </span>
                          <ImageIcon className="w-4 h-4 shrink-0 text-slate-500" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className={`w-full py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 ${themeStyle.primary}`}
                >
                  {isSavingSettings ? 'Saving Updates...' : 'Save Profile Details'}
                </button>
              </form>
            )}

            {settingsTab === 'appearance' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-3xl border space-y-4 shadow-sm ${
                  isDarkMode ? 'bg-slate-900/30 border-slate-850/50' : 'bg-slate-50/50 border-slate-200/80'
                }`}>
                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest block text-center">Theme Settings</span>
                  
                  {/* Dark Mode Switcher */}
                  <div className={`flex justify-between items-center p-2.5 rounded-xl border ${
                    isDarkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150'
                  }`}>
                    <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-350' : 'text-slate-650'}`}>Dark Interface Mode</span>
                    <button 
                      type="button"
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isDarkMode ? 'hover:bg-slate-900 text-slate-450' : 'hover:bg-slate-50 text-slate-550'
                      }`}
                    >
                      {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    </button>
                  </div>

                  {/* Accents Theme Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Color Accent Theme</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['royal', 'emerald', 'ocean', 'rose', 'classic-wa', 'glass-wa'] as ThemeName[]).map((theme) => (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => setActiveTheme(theme)}
                          className={`py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all border ${
                            activeTheme === theme 
                              ? 'bg-indigo-650/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                              : isDarkMode
                              ? 'bg-slate-950/40 border-slate-850 text-slate-500 hover:text-slate-355'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-850 shadow-sm'
                          }`}
                        >
                          {theme === 'classic-wa' ? 'WA Flat' : theme === 'glass-wa' ? 'WA Glass' : theme}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wallpaper Grid */}
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
                              ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-sm'
                              : isDarkMode
                              ? 'bg-slate-955 border-slate-855 text-slate-500 hover:text-slate-350'
                              : 'bg-white border-slate-200 text-slate-550 hover:text-slate-900 shadow-sm'
                          }`}
                        >
                          {wallpaper.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'privacy' && (
              <div className="space-y-4">
                {/* Privacy Options */}
                {user && (
                  <div className={`p-4 rounded-3xl border space-y-3 shadow-sm ${
                    isDarkMode ? 'bg-slate-900/30 border-slate-850/50' : 'bg-slate-50/50 border-slate-200/80'
                  }`}>
                    <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest block text-center">Privacy & Security</span>
                    
                    <div className="space-y-3.5 pt-1">
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-650'}`}>Show Last Seen status</span>
                        <button 
                          type="button"
                          onClick={() => handleTogglePrivacy('showLastSeen', user.showLastSeen)}
                          className="text-slate-450 hover:text-indigo-400 transition-colors"
                        >
                          {user.showLastSeen ? <ToggleRight className="w-6 h-6 text-indigo-400" /> : <ToggleLeft className="w-6 h-6 opacity-60" />}
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-650'}`}>Read Receipts (Blue Ticks)</span>
                        <button 
                          type="button"
                          onClick={() => handleTogglePrivacy('showReadReceipts', user.showReadReceipts)}
                          className="text-slate-455 hover:text-indigo-400 transition-colors"
                        >
                          {user.showReadReceipts ? <ToggleRight className="w-6 h-6 text-indigo-400" /> : <ToggleLeft className="w-6 h-6 opacity-60" />}
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-650'}`}>Sound & Push Alerts</span>
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

                {/* Hardware Verification Card */}
                <div className={`p-4 rounded-3xl border space-y-3 shadow-sm ${
                  isDarkMode ? 'bg-slate-900/30 border-slate-850/50' : 'bg-slate-50/50 border-slate-200/80'
                }`}>
                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest block text-center">Hardware Access</span>
                  
                  <p className="text-[9px] text-slate-500 text-center font-light leading-normal">
                    Verify camera and microphone hardware loops to troubleshoot device connection lags.
                  </p>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                        stream.getTracks().forEach(track => track.stop());
                        alert('Camera & Microphone access verified successfully! 🟢');
                      } catch (err) {
                        console.error('Permission request failed:', err);
                        alert('Access Blocked! 🔴 Please enable camera and microphone permissions in your browser address bar.');
                      }
                    }}
                    className={`w-full border rounded-xl py-2.5 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      isDarkMode 
                        ? 'bg-slate-950/40 hover:bg-indigo-600/10 border-slate-850 text-slate-350 hover:text-indigo-400 hover:border-indigo-500' 
                        : 'bg-white hover:bg-indigo-50 border-slate-200 text-slate-650 hover:text-indigo-650 hover:border-indigo-400 shadow-sm'
                    }`}
                  >
                    <Video className="w-4 h-4 shrink-0" />
                    <span>Test Camera & Mic Access</span>
                  </button>
                </div>
              </div>
            )}

            {/* Storage Progress Section (Rendered below content in all tabs) */}
            <div className={`p-4 rounded-3xl border space-y-2.5 shadow-sm mt-2 shrink-0 ${
              isDarkMode ? 'bg-slate-900/30 border-slate-850/50' : 'bg-slate-50/50 border-slate-200/80'
            }`}>
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block text-center">Local Data Status</span>
              <div className="flex justify-between items-baseline text-[8px] text-slate-500">
                <span>Disk Storage Used</span>
                <span>124 MB of 5.0 GB</span>
              </div>
              <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                isDarkMode ? 'bg-slate-950/80' : 'bg-slate-200 shadow-inner'
              }`}>
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
          className={`w-36 h-48 border rounded-3xl shadow-2xl z-50 overflow-hidden cursor-move select-none animate-in zoom-in-95 duration-205 flex flex-col relative ${
            isDarkMode 
              ? 'bg-slate-950/80 border-indigo-500/30 backdrop-blur-md shadow-indigo-500/10' 
              : 'bg-white/85 border-slate-200 backdrop-blur-md shadow-slate-400/20'
          }`}
        >
          {callModal.type === 'video' ? (
            <div className="absolute inset-0 z-0 w-full h-full bg-black">
              {/* Partner stream as background */}
              <video 
                ref={partnerVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover transform -scale-x-100" 
              />
              {/* Local stream as small corner bubble */}
              <div className="absolute bottom-12 right-2 w-10 h-14 rounded-lg overflow-hidden border border-indigo-500/50 shadow-lg z-10 bg-slate-900">
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-3 relative z-10">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 animate-pulse ${
                isDarkMode ? 'bg-indigo-600/20 border border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-650'
              }`}>
                <Phone className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold truncate max-w-full block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {callModal.name}
              </span>
              <span className="text-[8px] text-slate-400 block animate-pulse">Voice Call...</span>
            </div>
          )}

          {/* Absolute bottom overlay for control/info */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between z-20 shrink-0 px-3">
            <span className="text-[8px] text-white/90 truncate max-w-[50%] font-bold">{callModal.name}</span>
            <button
              onClick={() => setCallModal(prev => prev ? { ...prev, isMinimized: false } : null)}
              className="p-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-505 text-[8px] text-white font-bold transition-all shadow-md shrink-0"
            >
              Expand
            </button>
          </div>
        </div>
      )}

      {/* REAL CALLING FULL DIALOG (WhatsApp v2.0 Frosted Glass) */}
      {callModal && !callModal.isMinimized && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg h-[620px] max-h-[92vh] flex flex-col rounded-[38px] overflow-hidden shadow-2xl relative border border-white/15 bg-gradient-to-b from-slate-950/90 via-slate-900/90 to-slate-950/95 text-white">
            
            {/* Ambient Background Glow Nodes */}
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '5s' }}></div>
            <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-teal-500/15 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '7s' }}></div>

            {/* Header: WhatsApp encrypted indicator & live timer */}
            <div className="absolute top-5 inset-x-5 z-40 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-[11px] font-medium tracking-wide text-slate-200 shadow-lg">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>End-to-end encrypted</span>
              </div>

              <div className="flex items-center gap-2">
                {callModal.isConnected && (
                  <div className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 text-xs font-mono font-semibold text-emerald-300 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{formatCallDuration(callDurationSeconds)}</span>
                  </div>
                )}
                <button
                  onClick={() => setCallModal(prev => prev ? { ...prev, isMinimized: true } : null)}
                  className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-xl border border-white/10 flex items-center justify-center text-slate-300 transition-colors"
                  title="Minimize (PiP)"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Viewport Area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {callModal.type === 'video' ? (
                <>
                  {/* Main video: Remote Partner stream */}
                  <div className="w-full h-full bg-slate-950 relative flex items-center justify-center">
                    <video 
                      ref={partnerVideoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover transform -scale-x-100" 
                      style={{ filter: 'brightness(98%) contrast(102%)' }}
                    />
                    
                    {/* Connecting state watermark if stream pending */}
                    {!callModal.isConnected && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="relative mb-5">
                          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }}></div>
                          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xl">
                            <Video className="w-10 h-10 text-white animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{callModal.name}</h3>
                        <p className="text-emerald-400 text-xs font-medium tracking-wide animate-pulse">
                          Connecting secure video...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Local video: Sleek floating PiP preview */}
                  <div className="absolute bottom-24 right-5 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-30 bg-slate-900/90 backdrop-blur-md transition-all duration-300">
                    {isCallVideoOff ? (
                      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-1.5 text-center p-2">
                        <VideoOff className="w-6 h-6 text-rose-500" />
                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Camera Off</span>
                      </div>
                    ) : (
                      <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover" 
                      />
                    )}
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[9px] text-white font-semibold uppercase tracking-wider border border-white/10">You</span>
                  </div>
                </>
              ) : (
                /* Voice Call Viewport: Clean WhatsApp avatar with pulsing sound waves */
                <div className="flex flex-col items-center justify-center p-8 text-center relative z-10 w-full">
                  <div className="relative mb-6">
                    <div className="absolute -inset-4 rounded-full border-2 border-emerald-500/20 animate-ping" style={{ animationDuration: '2.5s' }}></div>
                    <div className="absolute -inset-1 rounded-full border border-teal-500/30 animate-pulse"></div>
                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 border-2 border-emerald-400/30 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                      <span className="text-3xl font-bold text-white tracking-wider">{callModal.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{callModal.name}</h3>
                  <span className="text-xs text-emerald-400 font-medium tracking-wide">
                    {callModal.isConnected ? `Voice Connected (${formatCallDuration(callDurationSeconds)})` : 'Ringing...'}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Floating Control Bar Capsule */}
            <div className="p-6 flex justify-center items-center z-40 shrink-0">
              <div className="flex items-center gap-4 bg-slate-900/85 backdrop-blur-2xl border border-white/15 px-6 py-3 rounded-full shadow-2xl">
                {/* Toggle Audio Mic */}
                <button
                  onClick={toggleCallAudio}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isCallMuted
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                  title={isCallMuted ? 'Unmute' : 'Mute'}
                >
                  {isCallMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Toggle Video Camera */}
                {callModal.type === 'video' && (
                  <button
                    onClick={toggleCallVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCallVideoOff
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                    title={isCallVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                  >
                    {isCallVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}

                {/* End Call Button */}
                <button
                  onClick={() => {
                    if (activeChat?.otherMember) {
                      emitEndCall(activeChat.otherMember.id);
                    }
                    setCallModal(null);
                  }}
                  className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white transition-all shadow-xl shadow-rose-600/40 hover:scale-105 active:scale-95"
                  title="Hang Up"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INCOMING CALL RECEIVER (WhatsApp v2.0 Design) */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center px-4 animate-in fade-in duration-300 text-white">
          <div className="w-full max-w-sm flex flex-col items-center p-8 bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-white/15 rounded-[36px] text-center shadow-2xl relative">
            <div className="flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[11px] font-semibold tracking-wide text-emerald-400">
              <Phone className="w-3.5 h-3.5 animate-bounce" />
              <span>Incoming WhatsApp {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call</span>
            </div>

            <div className="relative mb-6 mt-8">
              <div className="absolute -inset-3 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '1.8s' }}></div>
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 border-2 border-emerald-400/30 flex items-center justify-center relative shadow-xl shadow-emerald-500/20">
                <span className="text-2xl font-bold text-white tracking-wider">{incomingCall.callerName.slice(0, 2).toUpperCase()}</span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{incomingCall.callerName}</h3>
            <p className="text-slate-400 text-xs mb-8 animate-pulse font-medium">
              Ringing...
            </p>

            <div className="flex gap-4 w-full">
              <button
                onClick={() => {
                  setCallModal({
                    isOpen: true,
                    type: incomingCall.type,
                    name: incomingCall.callerName,
                    isConnected: true
                  });
                  emitAcceptCall();
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl py-3.5 text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="w-4 h-4" />
                <span>Accept</span>
              </button>
              <button
                onClick={() => {
                  emitDeclineCall();
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl py-3.5 text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ON-LOAD HARDWARE PERMISSIONS REQUEST */}
      {showPermissionPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm flex flex-col items-center p-6 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[32px] text-center shadow-2xl relative text-white">
            <button 
              onClick={() => setShowPermissionPrompt(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center mb-4 mt-2">
              <Video className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>

            <h3 className="text-sm font-bold text-white mb-2">Enable Calling & Media</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-light mb-6">
              Halo Chat needs camera and microphone access to make video/voice calls and snap photos. Click grant to allow browser permissions, or select later.
            </p>

            <div className="flex gap-2.5 w-full">
              <button
                onClick={async () => {
                  setShowPermissionPrompt(false);
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    stream.getTracks().forEach(track => track.stop());
                    alert('Camera & Microphone access verified successfully! 🟢');
                  } catch (err) {
                    console.error('Permission request failed:', err);
                    alert('Access Blocked! 🔴 Please enable permissions in your browser address bar settings.');
                  }
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-semibold transition-all shadow-lg shadow-indigo-600/10"
              >
                Grant Access
              </button>
              <button
                onClick={() => setShowPermissionPrompt(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 text-xs font-semibold transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE STATUS / STORY */}
      {showStoryCreator && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-[#202c33] border border-[#222e35] rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[#e9edef]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#00a884]">New Status Update</h3>
              <button 
                onClick={() => setShowStoryCreator(false)}
                className="w-7 h-7 rounded-full hover:bg-[#2a3942] flex items-center justify-center text-[#8696a0] hover:text-[#e9edef] transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (storyCreatorText.trim() || storyCreatorImage) {
                  postStatus(storyCreatorText.trim(), storyCreatorImage);
                  setShowStoryCreator(false);
                  setStoryCreatorText('');
                  setStoryCreatorImage('');
                }
              }}
              className="space-y-4"
            >
              {/* Image selector */}
              <div>
                <label className="block text-[#8696a0] text-[11px] font-medium uppercase tracking-wider mb-2">Photo / Background</label>
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
                          setStoryCreatorImage(reader.result as string);
                        };
                      }
                    }}
                    className="hidden"
                    id="story-image-upload"
                  />
                  <label 
                    htmlFor="story-image-upload"
                    className="w-full bg-[#111b21] border border-[#222e35] hover:border-[#00a884]/60 rounded-xl py-2.5 px-3.5 text-xs outline-none text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span className="truncate max-w-[200px]">
                      {storyCreatorImage ? 'Photo selected' : 'Choose photo or image...'}
                    </span>
                    <ImageIcon className="w-4 h-4 text-[#00a884]" />
                  </label>
                </div>
                
                {storyCreatorImage && (
                  <div className="mt-3 w-full h-36 rounded-xl overflow-hidden border border-[#222e35] relative shadow-inner">
                    <img src={storyCreatorImage} alt="Story preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setStoryCreatorImage('')}
                      className="absolute top-1.5 right-1.5 bg-black/75 hover:bg-black p-1.5 rounded-full text-[#8696a0] hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Status text */}
              <div>
                <label className="block text-[#8696a0] text-[11px] font-medium uppercase tracking-wider mb-2">Caption or Status Text</label>
                <input
                  type="text"
                  placeholder="Type a status update or caption..."
                  value={storyCreatorText}
                  onChange={(e) => setStoryCreatorText(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#222e35] focus:border-[#00a884] rounded-xl py-2.5 px-3.5 text-xs outline-none transition-all text-[#e9edef] placeholder-[#8696a0]"
                />
              </div>

              <button
                type="submit"
                disabled={!storyCreatorText.trim() && !storyCreatorImage}
                className="w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all mt-2 bg-[#00a884] hover:bg-[#008f6f] text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                Post Status Update
              </button>
            </form>
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

            <div className="absolute top-6 left-4 right-4 flex justify-between items-center z-30 bg-black/20 backdrop-blur-sm p-2 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-indigo-650 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0 border border-indigo-500/30">
                  {activeStory.avatar.length > 2 && activeStory.avatar.startsWith('data:') ? (
                    <img src={activeStory.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{activeStory.avatar.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white leading-none">{activeStory.name}</h4>
                  <span className="text-[9px] text-slate-300 font-light mt-1 block">{activeStory.time}</span>
                </div>
              </div>
              <button 
                onClick={() => setActiveStory(null)} 
                className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 flex items-center justify-center text-white transition-colors border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative bg-slate-950">
              {activeStory.mediaUrl ? (
                <>
                  <img src={activeStory.mediaUrl} alt="Story" className="absolute inset-0 w-full h-full object-cover z-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-black/20 z-10 pointer-events-none" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-955/20 to-slate-950 z-0" />
                  <div className="absolute top-1/3 left-10 text-indigo-500/10 pointer-events-none transform -rotate-12"><MessageSquare className="w-24 h-24" /></div>
                  <div className="absolute bottom-1/3 right-10 text-pink-500/10 pointer-events-none transform rotate-12"><Heart className="w-24 h-24" /></div>
                </>
              )}

              <div className="absolute bottom-12 left-4 right-4 z-20 text-center">
                <p className="text-xs md:text-sm font-normal text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-relaxed select-text bg-slate-900/80 backdrop-blur-md rounded-2xl py-2.5 px-4 inline-block max-w-[90%] border border-slate-800/60 shadow-lg">
                  {activeStory.text}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-955 border-t border-slate-900 flex justify-center text-slate-500 text-[10px] font-light z-30">
              Press Escape or click close button to exit
            </div>
          </div>
        </div>
      )}

      {/* Hidden global audio element to play remote WebRTC streams */}
      <audio ref={remoteAudioRef} autoPlay className="hidden" />

    </div>
  );
}
