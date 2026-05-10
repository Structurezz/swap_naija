import { NavLink } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageCircle, LayoutGrid } from 'lucide-react';
import { useChatStore } from '../../store/chat.store';

const navItems = [
  { to: '/',       icon: Home,          label: 'Home',    exact: true },
  { to: '/search', icon: Search,        label: 'Search' },
  { to: '/create', icon: PlusCircle,    label: 'List',    accent: true },
  { to: '/chat',   icon: MessageCircle, label: 'Chat',    badge: 'chat' },
];

function BottomNav({ onMenuOpen }) {
  const { conversations } = useChatStore();
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-bottom z-40 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map(({ to, icon: Icon, label, accent, badge, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative ${accent ? 'bg-primary text-white p-2.5 rounded-2xl -mt-5 shadow-lg' : ''}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  {badge === 'chat' && totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </div>
                {!accent && (
                  <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>{label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Menu button */}
        <button
          onClick={onMenuOpen}
          className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all text-gray-400 active:text-primary"
        >
          <LayoutGrid size={22} strokeWidth={1.8} />
          <span className="text-xs">Menu</span>
        </button>
      </div>
    </nav>
  );
}

export default BottomNav;
