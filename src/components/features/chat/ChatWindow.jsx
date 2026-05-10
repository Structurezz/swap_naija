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

  // ── Messages: React Query cache is the single source of truth ──────────────
  const { data: msgs = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn:  () => getMessages(conversationId),
    staleTime: Infinity, // socket keeps it fresh — no background refetches
  });

  // ── Real-time: append incoming messages from the other party ───────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNew = (msg) => {
      if (msg.conversationId !== conversationId) return;

      // Skip echo of own messages — handled by sendMutation (optimistic → real)
      const isOwn =
        msg.senderId?.id === user?.id ||
        msg.senderId === user?.id;
      if (isOwn) return;

      queryClient.setQueryData(['messages', conversationId], (prev) => {
        if (!prev) return prev;                           // not loaded yet — skip
        if (prev.some(m => m.id === msg.id)) return prev; // dedup
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
      // Swap the temporary optimistic message for the real server response
      queryClient.setQueryData(['messages', conversationId], (prev) =>
        (prev ?? []).map(m => m.id === ctx.tempId ? realMsg : m),
      );
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },

    onError: (_err, _vars, ctx) => {
      // Remove failed optimistic message
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

  // Cleanup typing on unmount / conversation switch
  useEffect(() => () => {
    clearTimeout(typingTimer.current);
    stopTyping();
  }, [stopTyping]);

  // ── Send handler ────────────────────────────────────────────────────────────
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

  // ── Auto-scroll to latest message ───────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: msgs.length > 1 ? 'smooth' : 'instant',
    });
  }, [msgs.length]);

  const typingSet      = typingUsers[conversationId];
  const someoneTyping  = typingSet?.size > 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50/40">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400">
            <span className="text-4xl mb-3">👋</span>
            <p className="text-sm font-medium">Say hello!</p>
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
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:160ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:320ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex-none flex items-center gap-2 p-3 border-t border-gray-100 bg-white"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) handleSend(e);
          }}
          placeholder="Type a message…"
          className="input-field flex-1 !py-2.5"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || sendMutation.isPending}
          className="flex-none bg-primary text-white p-3 rounded-2xl disabled:opacity-40 transition active:scale-95"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;
