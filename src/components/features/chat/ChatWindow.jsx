import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { getMessages, sendMessage } from '../../../api/messages.api';
import { useChatStore } from '../../../store/chat.store';
import { useAuthStore } from '../../../store/auth.store';
import ChatMessage from './ChatMessage';
import Spinner from '../../ui/Spinner';

function ChatWindow({ conversationId }) {
  const { user } = useAuthStore();
  const { messages: storedMessages, setMessages, addMessage } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    onSuccess: (msgs) => setMessages(conversationId, msgs),
  });

  const msgs = storedMessages[conversationId] || data || [];

  const sendMutation = useMutation({
    mutationFn: (content) => sendMessage(conversationId, content),
    onSuccess: (msg) => {
      addMessage(conversationId, msg);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMutation.mutate(text);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          msgs.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwn={msg.senderId?.id === user?.id || msg.senderId === user?.id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="input-field flex-1"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || sendMutation.isPending}
          className="bg-primary text-white p-3 rounded-2xl disabled:opacity-50 transition active:scale-95"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;
