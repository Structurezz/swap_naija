import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import Avatar from '../../ui/Avatar';
import { useAuthStore } from '../../../store/auth.store';

function ChatList({ conversations, activeId, dark = false }) {
  const { user } = useAuthStore();

  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
          <MessageCircle size={22} className={dark ? 'text-white/25' : 'text-gray-300'} />
        </div>
        <p className={`text-sm font-medium ${dark ? 'text-white/50' : 'text-gray-400'}`}>No conversations yet</p>
        <p className={`text-xs mt-1 ${dark ? 'text-white/25' : 'text-gray-400'}`}>Propose a swap to start chatting!</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {conversations.map(conv => {
        const other = conv.participantA?.id === user?.id ? conv.participantB : conv.participantA;
        const isActive = conv.id === activeId;
        return (
          <Link
            key={conv.id}
            to={`/chat/${conv.id}`}
            className={`flex items-center gap-3 px-3 py-3 mx-2 rounded-2xl transition-all ${
              dark
                ? isActive
                  ? 'bg-white/12'
                  : 'hover:bg-white/6'
                : isActive
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50'
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-none">
              <Avatar src={other?.avatarUrl} name={other?.fullName} size="md" />
              {conv.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1">
                  {conv.unread > 9 ? '9+' : conv.unread}
                </span>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline gap-2">
                <p className={`truncate text-sm ${
                  conv.unread > 0
                    ? dark ? 'font-semibold text-white' : 'font-semibold text-gray-900'
                    : dark ? 'font-medium text-white/70' : 'font-medium text-gray-700'
                }`}>
                  {other?.fullName || 'User'}
                </p>
                {conv.lastMsgAt && (
                  <span className={`text-[11px] flex-shrink-0 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                    {formatDistanceToNow(new Date(conv.lastMsgAt), { addSuffix: false })}
                  </span>
                )}
              </div>
              {conv.lastMessage && (
                <p className={`text-xs truncate mt-0.5 ${
                  conv.unread > 0
                    ? dark ? 'text-white/65 font-medium' : 'text-gray-700 font-medium'
                    : dark ? 'text-white/30' : 'text-gray-400'
                }`}>
                  {conv.lastMessage}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default ChatList;
