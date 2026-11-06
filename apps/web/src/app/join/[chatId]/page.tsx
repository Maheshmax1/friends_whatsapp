'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessageSquare, Users, Loader2, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params?.chatId as string;

  const [groupInfo, setGroupInfo] = useState<{ id: string; name: string; description: string | null; avatarUrl: string | null; memberCount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('chat_token') : null;
    setIsLoggedIn(Boolean(token));

    if (!chatId) return;

    const fetchGroup = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/chats/preview/${chatId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setGroupInfo(data);
        } else {
          // Fallback basic info if preview is restricted
          setGroupInfo({
            id: chatId,
            name: 'WhatsApp Group',
            description: 'You were invited to join this group.',
            avatarUrl: null,
            memberCount: 1,
          });
        }
      } catch (e) {
        setError('Failed to load group details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroup();
  }, [chatId, API_URL]);

  const handleJoin = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('chat_token') : null;
    if (!token) {
      // Redirect to login page with join param
      router.push(`/?join=${chatId}`);
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        router.push(`/?chat=${chatId}`);
      } else {
        router.push(`/?join=${chatId}`);
      }
    } catch (err) {
      router.push(`/?chat=${chatId}`);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#111b21] flex flex-col items-center justify-center p-4 text-[#e9edef] select-none relative">
      {/* Top Banner */}
      <div className="h-52 bg-[#00a884] w-full absolute top-0 left-0 right-0 z-0 flex items-start p-8 md:px-24">
        <div className="flex items-center gap-3 text-white">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">WhatsApp Group Invite</span>
        </div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-[#202c33] border border-[#2a3942] rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#00a884]" />
            <p className="text-xs text-[#8696a0]">Checking invite link...</p>
          </div>
        ) : error ? (
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center font-bold text-xl">
              ✕
            </div>
            <h3 className="text-base font-semibold text-[#e9edef]">{error}</h3>
            <p className="text-xs text-[#8696a0]">This invite link may have expired or is invalid.</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-[#00a884] text-[#111b21] rounded-xl text-xs font-semibold hover:bg-[#008f6f] transition-colors"
            >
              Go to WhatsApp
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-4">
            {/* Group Avatar */}
            <div className="w-24 h-24 rounded-full bg-[#111b21] border-2 border-[#00a884] flex items-center justify-center text-2xl font-bold text-[#00a884] shadow-xl overflow-hidden">
              {groupInfo?.avatarUrl ? (
                <img src={groupInfo.avatarUrl} alt={groupInfo.name} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-10 h-10 text-[#00a884]" />
              )}
            </div>

            {/* Title & Info */}
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#e9edef]">{groupInfo?.name || 'WhatsApp Group'}</h2>
              <p className="text-xs text-[#8696a0]">
                {groupInfo?.memberCount ? `${groupInfo.memberCount} participants` : 'Group conversation'}
              </p>
            </div>

            {groupInfo?.description && (
              <div className="w-full p-3 bg-[#111b21] rounded-2xl border border-[#222e35] text-xs text-[#8696a0] max-h-24 overflow-y-auto">
                {groupInfo.description}
              </div>
            )}

            <p className="text-xs text-[#8696a0] pt-2">
              You were invited to join this WhatsApp group.
            </p>

            {/* Actions */}
            <div className="w-full pt-4 space-y-2.5">
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full py-3 bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] rounded-2xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isJoining ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#111b21]" />
                ) : (
                  <>
                    <span>{isLoggedIn ? 'Join Group' : 'Log in to Join Group'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full py-2.5 text-xs text-[#8696a0] hover:text-[#e9edef] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
