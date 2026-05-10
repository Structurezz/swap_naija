import { useQuery } from '@tanstack/react-query';
import { getConversations } from '../api/messages.api';
import { useChatStore } from '../store/chat.store';
import TopBar from '../components/layout/TopBar';
import ChatList from '../components/features/chat/ChatList';
import Spinner from '../components/ui/Spinner';
import { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

export default function Chat() {
  const { setConversations, conversations } = useChatStore();

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  useEffect(() => {
    if (data) setConversations(data);
  }, [data, setConversations]);

  const listContent = isLoading
    ? <div className="flex justify-center py-12"><Spinner size="lg" /></div>
    : <ChatList conversations={conversations.length ? conversations : data} />;

  const conversationCount = conversations.length || data?.length || 0;
  const unreadCount = (conversations.length ? conversations : data || [])
    .filter(c => c.unread > 0).length;

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Messages" />

      {/* ── Mobile layout ── */}
      <div className="lg:hidden max-w-md mx-auto px-4 py-4">
        {listContent}
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex lg:max-w-5xl mx-auto lg:py-6 px-8">
        <div className="flex lg:h-[calc(100vh-48px)] lg:rounded-3xl lg:shadow-card lg:overflow-hidden w-full bg-white">

          {/* LEFT panel: conversation list */}
          <div className="lg:w-[360px] lg:flex-none lg:border-r lg:border-gray-100 lg:flex lg:flex-col">
            <div className="lg:p-5 lg:border-b lg:border-gray-100 flex-none">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-semibold text-lg text-ink">Messages</h2>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              {!isLoading && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {conversationCount} conversation{conversationCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {listContent}
            </div>
          </div>

          {/* RIGHT panel: empty state */}
          <div className="lg:flex-1 lg:flex lg:items-center lg:justify-center lg:bg-gray-50/50">
            <div className="text-center px-8">
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-200" />
              <h3 className="font-display font-semibold text-lg text-ink mb-1">
                Select a conversation
              </h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Choose a conversation from the list to start chatting with your swap partners.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
