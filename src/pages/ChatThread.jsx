import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { getConversation } from '../api/messages.api';
import { useAuthStore } from '../store/auth.store';
import TopBar from '../components/layout/TopBar';
import ChatWindow from '../components/features/chat/ChatWindow';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import { getSocket } from '../hooks/useSocket';

export default function ChatThread() {
  const { conversationId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: conv, isLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
  });

  useEffect(() => {
    const socket = getSocket();
    if (socket && conversationId) {
      socket.emit('conversation:join', conversationId);
      return () => socket.emit('conversation:leave', conversationId);
    }
  }, [conversationId]);

  const other = conv
    ? (conv.participantA?.id === user?.id ? conv.participantB : conv.participantA)
    : null;

  return (
    <>
      {/* ── MOBILE layout ─────────────────────────────────────────── */}
      <div className="lg:hidden bg-bg flex flex-col h-screen">
        <TopBar
          showBack
          title={other?.fullName || 'Chat'}
          rightAction={other ? <Avatar src={other.avatarUrl} name={other.fullName} size="sm" /> : null}
        />
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <ChatWindow conversationId={conversationId} />
          )}
        </div>
      </div>

      {/* ── DESKTOP layout ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-col lg:h-screen lg:max-w-4xl lg:mx-auto lg:py-4 lg:px-0">
        {/* Breadcrumb / back link */}
        <button
          onClick={() => navigate(-1)}
          className="hidden lg:flex items-center gap-2 text-sm text-gray-500 hover:text-ink cursor-pointer mb-3 px-1"
        >
          <ArrowLeft size={15} />
          {other?.fullName ? `Back · ${other.fullName}` : 'Back to messages'}
        </button>

        {/* Chat window container */}
        <div className="flex-1 bg-white rounded-3xl shadow-card overflow-hidden flex flex-col">
          {/* Header */}
          {other && (
            <div className="border-b border-gray-100 p-4 flex items-center gap-3 flex-none">
              <Avatar src={other.avatarUrl} name={other.fullName} size="lg" />
              <div>
                <p className="font-display font-semibold text-lg text-ink leading-tight">{other.fullName}</p>
                <p className="text-xs text-gray-400 mt-0.5">SwapNaija · Direct message</p>
              </div>
            </div>
          )}

          {/* Chat area */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <ChatWindow conversationId={conversationId} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
