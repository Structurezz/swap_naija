import { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  X, Home, Search, PlusCircle, MessageCircle, User,
  ArrowRightLeft, Wallet, Zap, Star, Sparkles,
  ShieldCheck, Gift, LogOut,
} from 'lucide-react';
import { useChatStore } from '../../store/chat.store';
import { useAuthStore } from '../../store/auth.store';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import TrustBadge from '../features/profile/TrustBadge';

const MAIN_NAV = [
  { to: '/',       icon: Home,           label: 'Home',        exact: true },
  { to: '/search', icon: Search,         label: 'Search' },
  { to: '/swaps',  icon: ArrowRightLeft, label: 'My Swaps' },
  { to: '/chat',   icon: MessageCircle,  label: 'Messages',    badge: 'chat' },
  { to: '/wallet', icon: Wallet,         label: 'Wallet' },
  { to: '/profile',icon: User,           label: 'Profile' },
];

const DISCOVER_NAV = [
  { to: '/fresh-drops',    icon: Zap,        label: 'Fresh Drops' },
  { to: '/featured',       icon: Star,        label: 'Featured' },
  { to: '/suggested',      icon: Sparkles,    label: 'Suggested For You' },
  { to: '/verify-account', icon: ShieldCheck, label: 'Verify Account' },
  { to: '/invite',         icon: Gift,        label: 'Invite & Earn' },
];

function MobileMenuDrawer({ open, onClose }) {
  const { conversations } = useChatStore();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else      document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-medium ${
      isActive
        ? 'bg-primary/8 text-primary'
        : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
    }`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`lg:hidden fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[90vh] flex flex-col ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-none">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-none">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatarUrl} name={user?.fullName} size="sm" />
            <div>
              <p className="font-semibold text-sm text-gray-900 leading-tight">{user?.fullName || 'Account'}</p>
              <TrustBadge verification={user?.verification} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {/* Main */}
          <div className="space-y-0.5">
            {MAIN_NAV.map(({ to, icon: Icon, label, badge, exact }) => (
              <NavLink key={to} to={to} end={exact} onClick={onClose} className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                    <span className="flex-1">{label}</span>
                    {badge === 'chat' && totalUnread > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {totalUnread > 9 ? '9+' : totalUnread}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Discover */}
          <div className="mt-4 mb-1 px-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Discover</p>
          </div>
          <div className="space-y-0.5">
            {DISCOVER_NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} onClick={onClose} className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Create listing CTA */}
          <div className="px-1 pt-4 pb-2">
            <Link
              to="/create"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full bg-primary text-white font-semibold rounded-2xl px-4 py-3.5 hover:bg-primary/90 transition"
            >
              <PlusCircle size={18} />
              New Listing
            </Link>
          </div>

          {/* Logout */}
          <button
            onClick={() => { logout(); onClose(); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition mt-1 mb-4"
          >
            <LogOut size={18} strokeWidth={1.8} />
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}

export default MobileMenuDrawer;
