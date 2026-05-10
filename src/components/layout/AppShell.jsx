import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import DesktopSidebar from './DesktopSidebar';
import { useSocket, getSocket } from '../../hooks/useSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '../../store/chat.store';
import { getConversations } from '../../api/messages.api';
import { useAuthStore } from '../../store/auth.store';
import { useEffect } from 'react';

function AppShell() {
  useSocket();
  const { setConversations } = useChatStore();
  const { refreshUser } = useAuthStore();
  const qc = useQueryClient();

  const { data: convs } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (convs) setConversations(convs);
  }, [convs, setConversations]);

  // Real-time swap events — invalidate the swaps cache so MySwaps updates instantly
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const invalidateSwaps = () => {
      qc.invalidateQueries({ queryKey: ['swaps'] });
    };

    const invalidateSwapsAndWallet = () => {
      qc.invalidateQueries({ queryKey: ['swaps'] });
      qc.invalidateQueries({ queryKey: ['payment-history'] });
      refreshUser(); // wallet balance may have changed (escrow, topup, refund)
    };

    socket.on('swap:new',       invalidateSwaps);
    socket.on('swap:updated',   invalidateSwaps);
    socket.on('swap:disputed',  invalidateSwapsAndWallet);

    return () => {
      socket.off('swap:new',      invalidateSwaps);
      socket.off('swap:updated',  invalidateSwaps);
      socket.off('swap:disputed', invalidateSwapsAndWallet);
    };
  }, [qc, refreshUser]);

  return (
    <div className="flex min-h-screen">
      <DesktopSidebar />
      <div className="flex flex-col flex-1 min-h-screen lg:pl-64 min-w-0">
        <main className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

export default AppShell;
