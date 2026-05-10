import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { getMessages, sendMessage } from '../../../api/messages.api';
import { useChatStore } from '../../../store/chat.store';
import { useAuthStore } from '../../../store/auth.store';
import { getSocket } from '../../../hooks/useSocket';
import ChatMessage from './ChatMessage';
import Spinner from '../../ui/Spinner';

function ChatWindow({ conversationId }) {
  const { user } = useAuthStore();
  const { typingUsers } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const typingTimer = useRef(null);
  const queryClient = useQueryClient();

  // ── Messages ────────────────────────────────────────────────────────────────
  const { data: msgs = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn:  () => getMessages(conversationId),
    staleTime: Infinity,
  });

  // ── Real-time incoming messages ─────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNew = (msg) => {
      if (msg.conversationId !== conversationId) return;
      const isOwn = msg.senderId?.id === user?.id || msg.senderId === user?.id;
      if (isOwn) return;
      queryClient.setQueryData(['messages', conversationId], (prev) => {
        if (!prev) return prev;
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('message:new', handleNew);
    return () => socket.off('message:new', handleNew);
  }, [conversationId, queryClient, user?.id]);

  // ── Send with optimistic update ─────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (content) => sendMessage(conversationId, content),

    onMutate: async (content) => {
      const tempId = `opt-${Date.now()}`;
      const optimistic = {
        id:            tempId,
        conversationId,
        content,
        senderId:      { id: user?.id, fullName: user?.fullName, avatarUrl: user?.avatarUrl },
        createdAt:     new Date().toISOString(),
        isRead:        false,
        _pending:      true,
      };
      queryClient.setQueryData(
        ['messages', conversationId],
        (prev) => [...(prev ?? []), optimistic],
      );
      return { tempId };
    },

    onSuccess: (realMsg, _, ctx) => {
      queryClient.setQueryData(['messages', conversationId], (prev) =>
        (prev ?? []).map(m => m.id === ctx.tempId ? realMsg : m),
      );
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },

    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['messages', conversationId], (prev) =>
        (prev ?? []).filter(m => m.id !== ctx.tempId),
      );
    },
  });

  // ── Typing indicator ────────────────────────────────────────────────────────
  const stopTyping = useCallback(() => {
    getSocket()?.emit('typing:stop', { conversationId });
  }, [conversationId]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    getSocket()?.emit('typing:start', { conversationId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 2000);
  };

  useEffect(() => () => {
    clearTimeout(typingTimer.current);
    stopTyping();
  }, [stopTyping]);

  // ── Send ────────────────────────────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    setInput('');
    clearTimeout(typingTimer.current);
    stopTyping();
    sendMutation.mutate(text);
    inputRef.current?.focus();
  };

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: msgs.length > 1 ? 'smooth' : 'instant',
    });
  }, [msgs.length]);

  const typingSet     = typingUsers[conversationId];
  const someoneTyping = typingSet?.size > 0;

  return (
    <div className="flex flex-col h-full">

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-0.5" style={{ background: '#f7f8fa' }}>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 text-gray-300">
            <span className="text-4xl mb-3">👋</span>
            <p className="text-sm font-medium text-gray-400">Say hello!</p>
            <p className="text-xs mt-1 text-gray-400">Start the conversation below.</p>
          </div>
        ) : (
          msgs.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwn={msg.senderId?.id === user?.id || msg.senderId === user?.id}
            />
          ))
        )}

        {/* Typing indicator */}
        {someoneTyping && (
          <div className="flex justify-start py-1">
            <div className="bg-white shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:160ms]" />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:320ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="flex-none flex items-center gap-3 px-4 py-3 bg-white border-t border-gray-100"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
          placeholder="Type a message…"
          autoComplete="off"
          className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || sendMutation.isPending}
          className="flex-none w-10 h-10 bg-primary disabled:opacity-35 text-white rounded-2xl flex items-center justify-center transition active:scale-95 hover:bg-primary/90"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;
