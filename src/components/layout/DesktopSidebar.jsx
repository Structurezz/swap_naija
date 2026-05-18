import { NavLink, Link } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageCircle, User, ArrowRightLeft, Wallet, Zap, Sparkles, Star, ShieldCheck, Gift } from 'lucide-react';
import { useChatStore } from '../../store/chat.store';

const mainNavItems = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/swaps', icon: ArrowRightLeft, label: 'My Swaps' },
  { to: '/chat', icon: MessageCircle, label: 'Messages', badge: 'chat' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
];

const discoverNavItems = [
  { to: '/fresh-drops',    icon: Zap,        label: 'Fresh Drops' },
  { to: '/featured',       icon: Star,        label: 'Featured' },
  { to: '/suggested',      icon: Sparkles,    label: 'Suggested For You' },
  { to: '/verify-account', icon: ShieldCheck, label: 'Verify Account' },
  { to: '/invite',         icon: Gift,        label: 'Invite & Earn' },
];

function DesktopSidebar() {
  const { conversations } = useChatStore();
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 z-40">
      {/* Brand */}
      <div className="flex items-center px-6 h-16 border-b border-gray-100">
        <img src="/swapnaija-logo.png" alt="SwapNaija" className="h-9 w-auto" />
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNavItems.map(({ to, icon: Icon, label, badge, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
                {badge === 'chat' && totalUnread > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Discover section */}
        <div className="pt-3 pb-1 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Discover</p>
        </div>
        {discoverNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Create listing CTA */}
      <div className="px-4 py-5 border-t border-gray-100">
        <Link
          to="/create"
          className="flex items-center justify-center gap-2 w-full bg-primary text-white font-medium rounded-2xl px-4 py-3 hover:bg-primary-600 transition-colors"
        >
          <PlusCircle size={18} />
          New Listing
        </Link>
      </div>
    </aside>
  );
}

export default DesktopSidebar;
