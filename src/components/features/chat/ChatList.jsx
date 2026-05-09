import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../../ui/Avatar';
import { useAuthStore } from '../../../store/auth.store';

function ChatList({ conversations }) {
  const { user } = useAuthStore();

  if (!conversations?.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">💬</p>
        <p>No conversations yet</p>
        <p className="text-sm mt-1">Propose a swap to start chatting!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map(conv => {
        const other = conv.participantA?.id === user?.id ? conv.participantB : conv.participantA;
        return (
          <Link
            key={conv.id}
            to={`/chat/${conv.id}`}
            className="flex items-center gap-3 p-4 bg-white rounded-2xl hover:bg-gray-50 transition"
          >
            <div className="relative">
              <Avatar src={other?.avatarUrl} name={other?.fullName} size="md" />
              {conv.unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {conv.unread > 9 ? '9+' : conv.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <p className={`font-medium truncate ${conv.unread > 0 ? 'font-semibold' : ''}`}>
                  {other?.fullName || 'User'}
                </p>
                {conv.lastMsgAt && (
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(conv.lastMsgAt), { addSuffix: false })}
                  </span>
                )}
              </div>
              {conv.lastMessage && (
                <p className={`text-sm truncate ${conv.unread > 0 ? 'text-ink font-medium' : 'text-gray-500'}`}>
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
