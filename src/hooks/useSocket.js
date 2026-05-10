import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { useChatStore } from '../store/chat.store';

let socketInstance = null;

export function useSocket() {
  const { accessToken } = useAuthStore();
  const { updateConversation, setTyping } = useChatStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return;

    if (!socketInstance) {
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/';
      socketInstance = io(SOCKET_URL, {
        auth: { token: accessToken },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
      });
    }

    socketRef.current = socketInstance;

    // Keep conversation list up-to-date when a new message arrives
    const onMessageNew = (msg) => {
      updateConversation(msg.conversationId, {
        lastMessage: msg.content,
        lastMsgAt: msg.createdAt,
      });
    };

    const onConvUpdated  = (data) => updateConversation(data.conversationId, data);
    const onTypingStart  = ({ conversationId, userId }) => setTyping(conversationId, userId, true);
    const onTypingStop   = ({ conversationId, userId }) => setTyping(conversationId, userId, false);

    socketInstance.on('message:new',         onMessageNew);
    socketInstance.on('conversation:updated', onConvUpdated);
    socketInstance.on('typing:start',         onTypingStart);
    socketInstance.on('typing:stop',          onTypingStop);

    return () => {
      // Pass the exact handler reference so we only remove what we added
      socketInstance?.off('message:new',         onMessageNew);
      socketInstance?.off('conversation:updated', onConvUpdated);
      socketInstance?.off('typing:start',         onTypingStart);
      socketInstance?.off('typing:stop',          onTypingStop);
    };
  }, [accessToken, updateConversation, setTyping]);

  return socketRef.current;
}

export function getSocket() {
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
