import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Edit, LogOut, Plus, Lock, Trash2, ShieldCheck, Gift,
  Star, ArrowLeftRight, MapPin, CalendarDays, LayoutGrid,
  MessageSquare, Bell, Wallet as WalletIcon, ChevronRight,
  Eye, EyeOff, User, KeyRound, CheckCircle2, TrendingUp,
  Copy, Share2, CheckCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicProfile } from '../api/users.api';
import { initiateVerify } from '../api/payments.api';
import { useAuthStore } from '../store/auth.store';
import { useAuth } from '../hooks/useAuth';
import ProfileCard from '../components/features/profile/ProfileCard';
import ListingGrid from '../components/features/listing/ListingGrid';
import ReviewStars from '../components/features/review/ReviewStars';
import TrustBadge from '../components/features/profile/TrustBadge';
import TopBar from '../components/layout/TopBar';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { formatDistanceToNow } from 'date-fns';

// ─── Settings sections ────────────────────────────────────────────────────────
const NAV = [
  { id: 'profile',       label: 'Profile',        icon: User,        group: 'Account' },
  { id: 'security',      label: 'Security',        icon: KeyRound,    group: 'Account' },
  { id: 'verification',  label: 'Verification',    icon: ShieldCheck, group: 'Account' },
  { id: 'notifications', label: 'Notifications',   icon: Bell,        group: 'Preferences' },
  { id: 'wallet',        label: 'Wallet',          icon: WalletIcon,  group: 'Finances' },
  { id: 'referrals',     label: 'Invite & Earn',   icon: Gift,        group: 'Finances' },
];

// ─── Section: Profile ─────────────────────────────────────────────────────────
function SectionProfile({ user }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-ink mb-1">Profile</h2>
        <p className="text-sm text-gray-500">Your public identity on SwapNaija</p>
      </div>
      <div className="flex items-center gap-5 p-5 bg-gray-50 rounded-2xl">
        <Avatar src={user.avatarUrl} name={user.fullName} size="xl" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-lg text-ink">{user.fullName}</p>
          {user.username && <p className="text-sm text-gray-500">@{user.username}</p>}
          {user.bio && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{user.bio}</p>}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {user.locationState && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={11} />{user.locationState}
              </span>
            )}
            {user.createdAt && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <CalendarDays size={11} />
                Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
        <Link to="/profile/edit">
          <Button variant="outline" size="sm"><Edit size={14} /> Edit</Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Swaps', value: user.swapCount || 0, icon: ArrowLeftRight, color: 'text-primary' },
          { label: 'Rating', value: user.ratingAvg?.toFixed(1) || '—', icon: Star, color: 'text-amber-500' },
          { label: 'Reviews', value: user.ratingCount || 0, icon: MessageSquare, color: 'text-blue-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-50 rounded-2xl p-4 text-center">
            <Icon size={18} className={`${color} mx-auto mb-1.5`} />
            <p className="text-xl font-display font-bold text-ink">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Security ────────────────────────────────────────────────────────
function SectionSecurity() {
  const { changePasswordAsync, isChangingPassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]         = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew]   = useState(false);

  const setField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (form.newPassword !== form.confirm) { toast.error('New passwords do not match'); return; }
    if (form.newPassword.length < 8)       { toast.error('Min. 8 characters');           return; }
    try {
      await changePasswordAsync({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-ink mb-1">Security</h2>
        <p className="text-sm text-gray-500">Manage your password and account access</p>
      </div>

      {/* Change password */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-sm">Change Password</h3>
        <div className="relative">
          <Input label="Current Password" type={showCurr ? 'text' : 'password'}
            value={form.currentPassword} onChange={setField('currentPassword')}
            placeholder="Enter current password" />
          <button type="button" onClick={() => setShowCurr(v => !v)}
            className="absolute right-3 top-9 text-gray-400">
            {showCurr ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <div className="relative">
          <Input label="New Password" type={showNew ? 'text' : 'password'}
            value={form.newPassword} onChange={setField('newPassword')}
            placeholder="Min. 8 characters" />
          <button type="button" onClick={() => setShowNew(v => !v)}
            className="absolute right-3 top-9 text-gray-400">
            {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <Input label="Confirm New Password" type="password"
          value={form.confirm} onChange={setField('confirm')}
          placeholder="Repeat new password" />
        <Button
          loading={isChangingPassword}
          disabled={!form.currentPassword || !form.newPassword || !form.confirm}
          onClick={handleSubmit}
        >
          Update Password
        </Button>
      </div>

      {/* Forgot password */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">Forgot your password?</p>
          <p className="text-xs text-gray-400 mt-0.5">Reset it via email with a verification code</p>
        </div>
        <Link to="/forgot-password">
          <Button variant="outline" size="sm">Reset <ChevronRight size={14} /></Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Section: Verification ────────────────────────────────────────────────────
function SectionVerification({ user }) {
  const { refreshUser } = useAuthStore();
  const isVerified   = user?.verification === 'verified';
  const walletBal    = user?.walletBalance ?? 0;
  const canAfford    = walletBal >= 100000;

  const mutation = useMutation({
    mutationFn: initiateVerify,
    onSuccess: () => { refreshUser(); toast.success('Account verified!'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Verification failed'),
  });

  const BENEFITS = [
    { icon: ShieldCheck, color: 'text-primary',   label: 'Verified badge on your profile' },
    { icon: Eye,         color: 'text-blue-500',  label: 'Priority in search results' },
    { icon: Star,        color: 'text-amber-500', label: '3× higher swap acceptance rate' },
    { icon: TrendingUp,  color: 'text-green-500', label: 'Unlocks premium features' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-ink mb-1">Identity Verification</h2>
        <p className="text-sm text-gray-500">Build trust and rank higher in search</p>
      </div>

      {/* Status card */}
      <div className={`rounded-2xl p-5 flex items-center gap-4 ${isVerified ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50 border border-gray-200'}`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isVerified ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
          <ShieldCheck size={22} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{isVerified ? 'Account Verified' : 'Not Verified'}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isVerified
              ? `Verified ${user.verifiedAt ? new Date(user.verifiedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}`
              : 'One-time ₦1,000 fee from your wallet'}
          </p>
        </div>
        <TrustBadge verification={user.verification} />
      </div>

      {/* Benefits */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">What you get</p>
        {BENEFITS.map(({ icon: Icon, color, label }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon size={16} className={color} />
            <p className="text-sm text-gray-700 flex-1">{label}</p>
            {isVerified && <CheckCircle2 size={15} className="text-primary flex-none" />}
          </div>
        ))}
      </div>

      {!isVerified && (
        <div className={`rounded-2xl px-4 py-3 flex items-center justify-between ${canAfford ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
          <div>
            <p className={`text-sm font-semibold ${canAfford ? 'text-green-700' : 'text-amber-700'}`}>
              {canAfford ? 'Sufficient balance' : 'Insufficient balance'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Wallet: ₦{(walletBal / 100).toLocaleString()} · Needed: ₦1,000
            </p>
          </div>
          {canAfford
            ? <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Get Verified — ₦1,000</Button>
            : <Link to="/wallet"><Button variant="secondary" size="sm">Top Up Wallet</Button></Link>
          }
        </div>
      )}
    </div>
  );
}

// ─── Section: Notifications ───────────────────────────────────────────────────
const NOTIF_DEFAULTS = {
  swapUpdates: true, newMessages: true, escrowAlerts: true,
  newMatches: false, marketing: false,
};

function SectionNotifications() {
  const [prefs, setPrefs] = useState(() => {
    try { return { ...NOTIF_DEFAULTS, ...JSON.parse(localStorage.getItem('swapnaija_notifs') || '{}') }; }
    catch { return NOTIF_DEFAULTS; }
  });

  const toggle = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem('swapnaija_notifs', JSON.stringify(next));
  };

  const ITEMS = [
    { key: 'swapUpdates',  label: 'Swap updates',        desc: 'When a swap is accepted, declined, or completed' },
    { key: 'newMessages',  label: 'New messages',         desc: 'When someone sends you a chat message' },
    { key: 'escrowAlerts', label: 'Escrow alerts',        desc: 'Deposit confirmations and release notifications' },
    { key: 'newMatches',   label: 'New swap suggestions', desc: 'When SwapNaija finds a potential match for you' },
    { key: 'marketing',    label: 'Tips & promotions',    desc: 'Product updates, swap tips and feature releases' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-ink mb-1">Notifications</h2>
        <p className="text-sm text-gray-500">Choose what you want to be notified about</p>
      </div>

      <div className="card divide-y divide-gray-100 !p-0 overflow-hidden">
        {ITEMS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between px-5 py-4">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium text-ink">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-none ${prefs[key] ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Notification preferences are saved locally on this device.
      </p>
    </div>
  );
}

// ─── Section: Wallet ──────────────────────────────────────────────────────────
function SectionWallet({ user }) {
  const navigate = useNavigate();
  const walletBal = user?.walletBalance ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-ink mb-1">Wallet</h2>
        <p className="text-sm text-gray-500">Your SwapNaija balance and spending</p>
      </div>

      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-white">
        <p className="text-sm font-medium opacity-75 mb-2">Available balance</p>
        <p className="text-4xl font-display font-bold tracking-tight">
          ₦{(walletBal / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/10 rounded-2xl py-3 text-center">
            <p className="text-xs opacity-60">Swap Credits</p>
            <p className="font-bold">₦{(user?.swapCredits || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white/10 rounded-2xl py-3 text-center">
            <p className="text-xs opacity-60">Total Swaps</p>
            <p className="font-bold">{user?.swapCount || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/wallet')} className="card flex flex-col items-center gap-2 py-4 hover:border-primary border border-transparent transition">
          <Plus size={20} className="text-primary" />
          <p className="font-semibold text-sm">Top Up</p>
          <p className="text-xs text-gray-400">Add funds via Paystack</p>
        </button>
        <button onClick={() => navigate('/wallet')} className="card flex flex-col items-center gap-2 py-4 hover:border-primary border border-transparent transition">
          <WalletIcon size={20} className="text-gray-500" />
          <p className="font-semibold text-sm">Transactions</p>
          <p className="text-xs text-gray-400">View history</p>
        </button>
      </div>
    </div>
  );
}

// ─── Section: Referrals ───────────────────────────────────────────────────────
function SectionReferrals({ user }) {
  const [copied, setCopied] = useState(false);
  const code = user?.referralCode || '—';
  const link = `${window.location.origin}/onboarding?ref=${code}`;

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareWhatsApp = () => {
    const text = `Join me on SwapNaija — Nigeria's best barter marketplace! Use my invite code *${code}* and we both earn ₦200 swap credits. Sign up: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-ink mb-1">Invite & Earn</h2>
        <p className="text-sm text-gray-500">Share your code and earn ₦200 swap credits per invite</p>
      </div>

      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-6 text-white">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <p className="text-xs opacity-70">You earn per invite</p>
            <p className="text-2xl font-display font-bold">₦200</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <p className="text-xs opacity-70">Total invites</p>
            <p className="text-2xl font-display font-bold">{user?.referralCount || 0}</p>
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Your referral code</p>
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border border-dashed border-gray-300">
          <span className="flex-1 font-mono text-xl font-bold text-ink tracking-widest">{code}</span>
          <button onClick={copyCode} className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition">
            {copied ? <CheckCheck size={18} /> : <Copy size={18} />}
          </button>
        </div>
        <div className="flex gap-2">
          <Button fullWidth variant="secondary" onClick={shareWhatsApp}>
            <Share2 size={15} /> Share via WhatsApp
          </Button>
          <Link to="/invite" className="flex-none">
            <Button variant="outline">View all</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Profile() {
  const { userId } = useParams();
  const { user: me } = useAuthStore();
  const { logout, deleteAccount, isDeletingAccount } = useAuth();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword]   = useState('');
  const [activeSection, setActiveSection]     = useState('profile');
  const [activeTab, setActiveTab]             = useState('listings');

  const targetId = userId || me?.id;
  const isMe = !userId || userId === me?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['public-profile', targetId],
    queryFn: () => getPublicProfile(targetId),
    enabled: !!targetId,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return <div className="text-center py-20">User not found</div>;

  const { user, listings, reviews } = data;

  const deleteModal = (
    <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
      <div className="space-y-4">
        <div className="bg-red-50 rounded-xl p-3 text-sm text-red-600">
          This is permanent and cannot be undone. All your listings, swaps and messages will be deleted.
        </div>
        <Input label="Confirm your password (if set)" type="password" value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)} placeholder="Leave blank if you use phone login" />
        <Button fullWidth variant="danger" loading={isDeletingAccount}
          onClick={() => deleteAccount(deletePassword || undefined)}>
          Permanently Delete My Account
        </Button>
      </div>
    </Modal>
  );

  // ── Public profile (not me) ───────────────────────────────────────────────
  if (!isMe) {
    return (
      <div className="bg-bg min-h-screen">
        <TopBar title={user.fullName} showBack />

        {/* Mobile */}
        <div className="lg:hidden max-w-md mx-auto px-4 py-4 space-y-4">
          <ProfileCard user={user} />
          {listings?.length > 0 && (
            <section>
              <h2 className="font-display font-semibold mb-3">Listings</h2>
              <ListingGrid listings={listings} />
            </section>
          )}
          {reviews?.length > 0 && (
            <section>
              <h2 className="font-display font-semibold mb-3">Reviews ({reviews.length})</h2>
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="card">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar src={r.reviewerId?.avatarUrl} name={r.reviewerId?.fullName} size="sm" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{r.reviewerId?.fullName}</p>
                        <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
                      </div>
                      <ReviewStars rating={r.rating} size={14} />
                    </div>
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Desktop public profile */}
        <div className="hidden lg:block">
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/8 to-accent/12">
            <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute top-0 right-1/3 w-56 h-56 rounded-full bg-accent/10 blur-3xl" />
          </div>
          <div className="max-w-5xl mx-auto px-8">
            <div className="relative -mt-12 mb-6">
              <div className="bg-white rounded-3xl shadow-card px-8 pt-5 pb-6">
                <div className="flex items-start gap-5">
                  <div className="relative -mt-12 flex-none">
                    <div className="w-24 h-24 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden">
                      <Avatar src={user.avatarUrl} name={user.fullName} size="xl" className="!w-24 !h-24 !rounded-2xl !text-3xl" />
                    </div>
                    {user.verification === 'verified' && (
                      <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-primary rounded-full flex items-center justify-center ring-2 ring-white">
                        <ShieldCheck size={13} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-2xl font-display font-bold text-ink">{user.fullName}</h1>
                      <TrustBadge verification={user.verification} />
                    </div>
                    {user.username && <p className="text-gray-400 text-sm">@{user.username}</p>}
                    {user.bio && <p className="text-sm text-gray-600 mt-1.5 max-w-lg">{user.bio}</p>}
                    <div className="flex items-center gap-4 mt-2">
                      {user.locationState && <span className="inline-flex items-center gap-1 text-xs text-gray-400"><MapPin size={11} />{user.locationState}</span>}
                      {user.createdAt && <span className="text-xs text-gray-400">Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-0 mt-5 -mx-8 border-t border-gray-100 px-8 pt-4">
                  {[
                    { label: 'Swaps', value: user.swapCount || 0 },
                    { label: 'Rating', value: user.ratingAvg?.toFixed(1) || '—' },
                    { label: 'Listings', value: listings?.length || 0 },
                    { label: 'Reviews', value: reviews?.length || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex-1 text-center border-r border-gray-100 last:border-r-0">
                      <p className="text-xl font-display font-bold text-ink">{value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-1 mb-6 border-b border-gray-200">
              {[
                { key: 'listings', label: `Listings (${listings?.length || 0})` },
                { key: 'reviews',  label: `Reviews (${reviews?.length || 0})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${activeTab === key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-ink'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="pb-12">
              {activeTab === 'listings' && <ListingGrid listings={listings} emptyMessage="No listings yet" />}
              {activeTab === 'reviews' && (
                <div className="grid grid-cols-2 gap-4">
                  {reviews?.map(r => (
                    <div key={r.id} className="card">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar src={r.reviewerId?.avatarUrl} name={r.reviewerId?.fullName} size="sm" />
                        <div className="flex-1"><p className="font-medium text-sm">{r.reviewerId?.fullName}</p><p className="text-xs text-gray-400">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p></div>
                        <ReviewStars rating={r.rating} size={14} />
                      </div>
                      {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Own profile = Settings ────────────────────────────────────────────────
  const groups = [...new Set(NAV.map(n => n.group))];

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':       return <SectionProfile user={user} />;
      case 'security':      return <SectionSecurity />;
      case 'verification':  return <SectionVerification user={user} />;
      case 'notifications': return <SectionNotifications />;
      case 'wallet':        return <SectionWallet user={user} />;
      case 'referrals':     return <SectionReferrals user={user} />;
      default:              return null;
    }
  };

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Profile" rightAction={
        <Link to="/profile/edit" className="p-2 rounded-full hover:bg-gray-100">
          <Edit size={20} />
        </Link>
      } />

      {/* ── Mobile settings list ── */}
      <div className="lg:hidden max-w-md mx-auto px-4 py-4 space-y-1">
        {/* User header */}
        <div className="flex items-center gap-4 px-1 py-4 mb-2">
          <Avatar src={user.avatarUrl} name={user.fullName} size="xl" />
          <div>
            <p className="font-display font-bold text-lg text-ink">{user.fullName}</p>
            {user.username && <p className="text-sm text-gray-500">@{user.username}</p>}
            <TrustBadge verification={user.verification} />
          </div>
        </div>

        {groups.map(group => (
          <div key={group} className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1 mb-1">{group}</p>
            <div className="card !p-0 overflow-hidden divide-y divide-gray-100">
              {NAV.filter(n => n.group === group).map(({ id, label, icon: Icon }) => (
                <Link key={id}
                  to={id === 'wallet' ? '/wallet' : id === 'referrals' ? '/invite' : id === 'verification' ? '/verify-account' : id === 'security' ? '/change-password' : '/profile/edit'}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center flex-none">
                    <Icon size={16} className="text-gray-500" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-ink">{label}</span>
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Logout & delete */}
        <div className="card !p-0 overflow-hidden divide-y divide-gray-100 mt-4">
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-gray-50 transition">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center flex-none">
              <LogOut size={16} className="text-gray-500" />
            </div>
            <span className="text-sm font-medium text-ink">Log Out</span>
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-gray-50 transition">
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-none">
              <Trash2 size={16} className="text-red-500" />
            </div>
            <span className="text-sm font-medium text-red-500">Delete Account</span>
          </button>
        </div>
      </div>

      {/* ── Desktop settings layout ── */}
      <div className="hidden lg:flex lg:max-w-5xl lg:mx-auto lg:px-8 lg:py-10 lg:gap-8 lg:min-h-[calc(100vh-40px)]">

        {/* Left nav sidebar */}
        <aside className="w-64 flex-none sticky top-8 self-start">
          {/* User card */}
          <div className="flex items-center gap-3 mb-6 p-1">
            <Avatar src={user.avatarUrl} name={user.fullName} size="lg" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-ink truncate">{user.fullName}</p>
              {user.username && <p className="text-xs text-gray-400">@{user.username}</p>}
              <TrustBadge verification={user.verification} />
            </div>
          </div>

          {/* Nav groups */}
          <nav className="space-y-5">
            {groups.map(group => (
              <div key={group}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 mb-1">{group}</p>
                <div className="space-y-0.5">
                  {NAV.filter(n => n.group === group).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveSection(id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeSection === id
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-ink'
                      }`}
                    >
                      <Icon size={16} strokeWidth={activeSection === id ? 2.5 : 1.8} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Danger */}
            <div className="pt-2 border-t border-gray-100 space-y-0.5">
              <button onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-ink transition">
                <LogOut size={16} strokeWidth={1.8} />
                Log Out
              </button>
              <button onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition">
                <Trash2 size={16} strokeWidth={1.8} />
                Delete Account
              </button>
            </div>
          </nav>
        </aside>

        {/* Right content panel */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-3xl shadow-card p-8 min-h-[500px]">
            {renderSection()}
          </div>
        </main>
      </div>

      {deleteModal}
    </div>
  );
}
