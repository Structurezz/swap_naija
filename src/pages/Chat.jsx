import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConversations } from '../api/messages.api';
import { useChatStore } from '../store/chat.store';
import TopBar from '../components/layout/TopBar';
import ChatList from '../components/features/chat/ChatList';
import Spinner from '../components/ui/Spinner';
import { MessageCircle, Search } from 'lucide-react';

export default function Chat() {
  const { setConversations, conversations } = useChatStore();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  useEffect(() => {
    if (data) setConversations(data);
  }, [data, setConversations]);

  const allConvs = conversations.length ? conversations : (data ?? []);
  const filtered = search.trim()
    ? allConvs.filter(c => {
        const name = (c.participantA?.fullName + ' ' + c.participantB?.fullName).toLowerCase();
        return name.includes(search.toLowerCase());
      })
    : allConvs;

  const unreadCount = allConvs.filter(c => c.unread > 0).length;

  const mobileList = isLoading
    ? <div className="flex justify-center py-12"><Spinner size="lg" /></div>
    : <ChatList conversations={filtered} />;

  return (
    <div className="bg-bg min-h-screen lg:min-h-0">
      {/* ── Mobile TopBar ── */}
      <div className="lg:hidden">
        <TopBar title="Messages" />
        <div className="px-4 py-4">{mobileList}</div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex h-screen">

        {/* Dark sidebar */}
        <div className="w-[360px] flex-none bg-white flex flex-col border-r border-gray-100">

          {/* Sidebar header */}
          <div className="px-6 pt-7 pb-4 flex-none">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-display font-bold text-gray-900">Messages</h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-white text-xs font-bold">
                  {unreadCount}
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

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading
              ? <div className="flex justify-center py-12"><Spinner /></div>
              : <ChatList conversations={filtered} />
            }
          </div>

          {/* Footer hint */}
          {!isLoading && allConvs.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex-none">
              <p className="text-xs text-gray-400 text-center">
                {allConvs.length} conversation{allConvs.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Right — empty state */}
        <div className="flex-1 bg-[#f7f8fa] flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center">
            <MessageCircle size={34} className="text-gray-200" />
          </div>
          <div className="text-center">
            <h3 className="font-display font-semibold text-gray-800 text-lg">No conversation open</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xs leading-relaxed">
              Pick a conversation from the left to start chatting with your swap partners.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
