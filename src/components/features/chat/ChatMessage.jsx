import { isToday, isYesterday, format } from 'date-fns';

function formatMsgTime(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d))     return format(d, 'HH:mm');
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`;
  return format(d, 'MMM d, HH:mm');
}

function ChatMessage({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[72%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
            isOwn
              ? `bg-primary text-white rounded-2xl rounded-br-sm${message._pending ? ' opacity-50' : ''}`
              : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-2xl rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-[11px] text-gray-400 select-none">
            {message._pending ? 'Sending…' : formatMsgTime(message.createdAt)}
          </span>
          {isOwn && !message._pending && (
            <span className={`text-[11px] select-none ${message.isRead ? 'text-primary' : 'text-gray-300'}`}>
              {message.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
