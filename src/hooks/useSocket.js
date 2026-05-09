import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { useChatStore } from '../store/chat.store';

let socketInstance = null;

export function useSocket() {
  const { accessToken } = useAuthStore();
  const { addMessage, updateConversation, setTyping } = useChatStore();
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

    socketInstance.on('message:new', (msg) => {
      addMessage(msg.conversationId, msg);
      updateConversation(msg.conversationId, {
        lastMessage: msg.content,
        lastMsgAt: msg.createdAt,
      });
    });

    socketInstance.on('conversation:updated', (data) => {
      updateConversation(data.conversationId, data);
    });

    socketInstance.on('typing:start', ({ conversationId, userId }) => {
      setTyping(conversationId, userId, true);
    });

    socketInstance.on('typing:stop', ({ conversationId, userId }) => {
      setTyping(conversationId, userId, false);
    });

    return () => {
      socketInstance?.off('message:new');
      socketInstance?.off('conversation:updated');
      socketInstance?.off('typing:start');
      socketInstance?.off('typing:stop');
    };
  }, [accessToken, addMessage, updateConversation, setTyping]);

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
