import { formatDistanceToNow } from 'date-fns';

function ChatMessage({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm ${
            isOwn
              ? 'bg-primary text-white rounded-br-sm'
              : 'bg-white text-ink shadow-sm rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          {isOwn && message.isRead && <span className="ml-1 text-primary">✓✓</span>}
        </span>
      </div>
    </div>
  );
}

export default ChatMessage;
