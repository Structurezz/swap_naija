import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Phone, Video, MoreHorizontal, Search } from 'lucide-react';
import { getConversation, getConversations } from '../api/messages.api';
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '../store/auth.store';
import TopBar from '../components/layout/TopBar';
import ChatWindow from '../components/features/chat/ChatWindow';
import ChatList from '../components/features/chat/ChatList';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import { getSocket } from '../hooks/useSocket';

export default function ChatThread() {
  const { conversationId } = useParams();
  const { user } = useAuthStore();
  const { setConversations, conversations } = useChatStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Active conversation
  const { data: conv, isLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
  });

  // Sidebar conversations list
  const { data: convListData } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  useEffect(() => {
    if (convListData) setConversations(convListData);
  }, [convListData, setConversations]);

  useEffect(() => {
    const socket = getSocket();
    if (socket && conversationId) {
      socket.emit('conversation:join', conversationId);
      return () => socket.emit('conversation:leave', conversationId);
    }
  }, [conversationId]);

  const allConvs = conversations.length ? conversations : (convListData ?? []);
  const filtered = search.trim()
    ? allConvs.filter(c => {
        const name = (c.participantA?.fullName + ' ' + c.participantB?.fullName).toLowerCase();
        return name.includes(search.toLowerCase());
      })
    : allConvs;

  const other = conv
    ? (conv.participantA?.id === user?.id ? conv.participantB : conv.participantA)
    : null;

  return (
    <>
      {/* ── Mobile layout ── */}
      <div className="lg:hidden bg-bg flex flex-col h-screen">
        <TopBar
          showBack
          title={other?.fullName || 'Chat'}
          rightAction={other ? <Avatar src={other.avatarUrl} name={other.fullName} size="sm" /> : null}
        />
        <div className="flex-1 overflow-hidden">
          {isLoading
            ? <div className="flex justify-center py-12"><Spinner /></div>
            : <ChatWindow conversationId={conversationId} />
          }
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex h-screen">

        {/* Dark sidebar */}
        <div className="w-[360px] flex-none bg-white flex flex-col border-r border-gray-100">

          {/* Sidebar header */}
          <div className="px-6 pt-7 pb-4 flex-none">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => navigate('/chat')}
                className="text-lg font-display font-bold text-gray-900 hover:text-gray-600 transition"
              >
                Messages
              </button>
              {allConvs.filter(c => c.unread > 0).length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-white text-xs font-bold">
                  {allConvs.filter(c => c.unread > 0).length}
                </span>
              )}
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            <ChatList conversations={filtered} activeId={conversationId} />
          </div>
        </div>

        {/* Right — chat panel */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">

          {/* Chat header */}
          {other ? (
            <div className="flex-none flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-100">
              <Avatar src={other.avatarUrl} name={other.fullName} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-gray-900 leading-tight">{other.fullName}</p>
                <p className="text-xs text-gray-400 mt-0.5">SwapNaija · Direct message</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition">
                  <Phone size={16} />
                </button>
                <button className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition">
                  <Video size={16} />
                </button>
                <button className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-none h-[65px] border-b border-gray-100 bg-white" />
          )}

          {/* Chat window */}
          <div className="flex-1 overflow-hidden">
            {isLoading
              ? <div className="flex justify-center py-12"><Spinner /></div>
              : <ChatWindow conversationId={conversationId} />
            }
          </div>
        </div>

      </div>
    </>
  );
}
