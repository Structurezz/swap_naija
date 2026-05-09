import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import DesktopSidebar from './DesktopSidebar';
import { useSocket } from '../../hooks/useSocket';
import { useQuery } from '@tanstack/react-query';
import { useChatStore } from '../../store/chat.store';
import { getConversations } from '../../api/messages.api';
import { useEffect } from 'react';

function AppShell() {
  useSocket();
  const { setConversations } = useChatStore();

  const { data: convs } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (convs) setConversations(convs);
  }, [convs, setConversations]);

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
