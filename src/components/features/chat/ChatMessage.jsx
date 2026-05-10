import { isToday, isYesterday, format } from 'date-fns';

function formatMsgTime(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d))     return format(d, 'HH:mm');
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`;
  return format(d, 'MMM d, HH:mm');
}

function ChatMessage({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1.5`}>
      <div className={`max-w-[78%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
            isOwn
              ? `bg-primary text-white rounded-br-sm${message._pending ? ' opacity-60' : ''}`
              : 'bg-white text-ink shadow-sm border border-gray-100 rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>

        <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5 px-1 select-none">
          {message._pending
            ? <span className="italic">Sending…</span>
            : formatMsgTime(message.createdAt)
          }
          {isOwn && !message._pending && (
            <span className={message.isRead ? 'text-primary' : 'text-gray-300'}>
              {message.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

export default ChatMessage;
