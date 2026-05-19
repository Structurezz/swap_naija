import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { topupWallet, verifyPayment, getPaymentHistory } from '../api/payments.api';
import { useAuthStore } from '../store/auth.store';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import {
  Wallet as WalletIcon, Plus, ShieldCheck, Zap,
  ArrowDownLeft, ArrowUpRight, Gift, X,
  CheckCircle2, Clock3,
} from 'lucide-react';
import { formatBC } from '../utils/currency';
import { formatDistanceToNow } from 'date-fns';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

const TYPE_META = {
  topup:        { label: 'Barter Credit Top-up',  icon: ArrowDownLeft, credit: true  },
  boost:        { label: 'Listing Boost',          icon: Zap,           credit: false },
  verification: { label: 'Account Verification',  icon: ShieldCheck,   credit: false },
  escrow:       { label: 'Escrow',                 icon: WalletIcon,    credit: false },
  fee:          { label: 'Platform Fee',           icon: WalletIcon,    credit: false },
};

const ESCROW_LABELS = {
  escrow_deposit:           'Escrow Deposit',
  escrow_completion_refund: 'Escrow Refund',
  escrow_cancelled_refund:  'Escrow Cancelled — Refund',
  topup_paid:               'Value Gap Top-up',
  topup_released:           'Top-up Released',
  topup_cancelled_refund:   'Top-up Refund',
};

const TX_FILTERS = ['All', 'Credits', 'Debits'];

function resolvePayment(p) {
  const isRefund = p.status === 'refunded';
  const isCredit = p.paymentType === 'topup' || isRefund;
  const meta = TYPE_META[p.paymentType] || { label: p.paymentType, icon: WalletIcon, credit: false };
  const label = p.paymentType === 'escrow'
    ? (ESCROW_LABELS[p.meta?.type] || (isRefund ? 'Escrow Refund' : 'Escrow Deposit'))
    : meta.label;
  return { isCredit, meta, label };
}

// ─── Balance Card ─────────────────────────────────────────────────────────────
function BalanceCard({ balance, user }) {
  const bc = balance / 100;
  const [whole, frac] = bc.toLocaleString('en-NG', { minimumFractionDigits: 2 }).split('.');

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1D9E75] via-[#16866200] to-[#0d5c4a] p-6 lg:p-8 text-white shadow-xl shadow-primary/20 select-none">
      {/* Card pattern */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/8" />
        <div className="absolute bottom-0 -left-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-white/5" />
        {/* grid dots */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative">
        {/* Top row */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[11px] font-semibold text-white/50 uppercase tracking-widest mb-1">Available Balance</p>
            <div className="flex items-end gap-1.5">
              <span className="font-display font-bold leading-none" style={{ fontSize: 'clamp(2rem,8vw,3.5rem)' }}>{whole}</span>
              <span className="font-bold text-white/40 text-xl mb-0.5">.{frac}</span>
              <span className="font-bold text-white/70 text-base mb-1 ml-0.5">BC</span>
            </div>
            <p className="text-[11px] text-white/35 mt-1">1 BC = ₦1 · Barter Credits</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <WalletIcon size={20} className="text-white" />
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider mb-0.5">Card holder</p>
            <p className="font-semibold text-sm text-white/90">{user?.fullName || 'SwapNaija User'}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-white/40 uppercase tracking-wider mb-0.5">Status</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${user?.verification === 'verified' ? 'bg-green-300' : 'bg-yellow-300'}`} />
              <p className="font-semibold text-sm text-white/90 capitalize">{user?.verification || 'Unverified'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Actions Row ────────────────────────────────────────────────────────
function QuickActions({ onAddCredits }) {
  const actions = [
    { label: 'Add Credits', icon: Plus,        onClick: onAddCredits, primary: true },
    { label: 'Get Verified',icon: ShieldCheck, to: '/verify-account'                },
    { label: 'Boost',       icon: Zap,         to: '/boost'                         },
    { label: 'Invite',      icon: Gift,         to: '/invite'                        },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ label, icon: Icon, onClick, to, primary }) => {
        const cls = `flex flex-col items-center gap-2 py-4 rounded-2xl transition-all ${
          primary
            ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'
            : 'bg-white text-gray-600 border border-gray-100 shadow-sm hover:border-primary/20 hover:text-primary'
        }`;
        const inner = (
          <>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${primary ? 'bg-white/20' : 'bg-gray-50'}`}>
              <Icon size={18} className={primary ? 'text-white' : ''} />
            </div>
            <span className="text-xs font-semibold">{label}</span>
          </>
        );
        return to ? (
          <Link key={label} to={to} className={cls}>{inner}</Link>
        ) : (
          <button key={label} onClick={onClick} className={cls}>{inner}</button>
        );
      })}
    </div>
  );
}

// ─── Stat Strip ──────────────────────────────────────────────────────────────
function StatStrip({ user }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-x divide-gray-100 flex">
      {[
        { label: 'Swaps',    value: user?.swapCount || 0 },
        { label: 'Rating',   value: user?.ratingAvg ? `${user.ratingAvg.toFixed(1)} ★` : '—' },
        { label: 'Listings', value: user?.listingCount || 0 },
        { label: 'Credits',  value: `${(user?.swapCredits || 0).toLocaleString()} BC` },
      ].map(({ label, value }) => (
        <div key={label} className="flex-1 text-center py-4 px-2">
          <p className="font-bold text-base text-gray-900">{value}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Add Credits Sheet ────────────────────────────────────────────────────────
function AddCreditsSheet({ open, onClose, finalAmount, selectedAmount, customAmount, setSelectedAmount, setCustomAmount, onTopUp, loading }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="px-5 pb-8 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-lg text-gray-900">Add Barter Credits</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Secured by Paystack · 1 BC = ₦1 · Instant</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <X size={16} />
                </button>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map(amt => {
                  const active = selectedAmount === amt && !customAmount;
                  return (
                    <button
                      key={amt}
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                      className={`py-3.5 rounded-2xl text-center font-bold transition border-2 ${
                        active ? 'border-primary bg-primary/8 text-primary' : 'border-gray-200 text-gray-600 hover:border-primary/30'
                      }`}
                    >
                      <span className="block text-base">{amt >= 1000 ? `${amt / 1000}k` : amt}</span>
                      <span className="block text-[10px] text-gray-400 font-medium mt-0.5">BC</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">BC</span>
                <input
                  type="number"
                  min="100"
                  placeholder="Custom amount (min. 100)"
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              {/* CTA */}
              <Button fullWidth size="lg" loading={loading} disabled={finalAmount < 100} onClick={onTopUp}>
                <Plus size={17} />
                Add {finalAmount > 0 ? `${finalAmount.toLocaleString()} BC` : '—'} · Pay ₦{finalAmount > 0 ? finalAmount.toLocaleString() : '—'}
              </Button>

              <p className="text-[11px] text-center text-gray-400">🔒 256-bit encrypted · Paystack · No hidden fees</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Desktop Top-up Panel ────────────────────────────────────────────────────
function TopUpPanel({ finalAmount, selectedAmount, customAmount, setSelectedAmount, setCustomAmount, onTopUp, loading }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-gray-50">
        <h2 className="font-display font-bold text-base text-gray-900">Add Barter Credits</h2>
        <p className="text-xs text-gray-400 mt-0.5">1 BC = ₦1 · Paystack · Instant</p>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {PRESET_AMOUNTS.map(amt => {
            const active = selectedAmount === amt && !customAmount;
            return (
              <motion.button
                key={amt} whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                className={`py-4 rounded-2xl text-center font-bold transition border-2 ${
                  active ? 'border-primary bg-primary/8 text-primary' : 'border-gray-200 hover:border-primary/30 text-gray-600'
                }`}
              >
                <span className="block text-xl">{amt.toLocaleString()}</span>
                <span className="block text-[11px] text-gray-400 font-medium mt-0.5">Barter Credits</span>
              </motion.button>
            );
          })}
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">BC</span>
          <input
            type="number" min="100" placeholder="Custom amount"
            value={customAmount}
            onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>
        <Button fullWidth size="lg" loading={loading} disabled={finalAmount < 100} onClick={onTopUp}>
          <Plus size={17} />
          Add {finalAmount > 0 ? `${finalAmount.toLocaleString()} BC` : '—'} via Paystack
        </Button>
        <p className="text-[11px] text-center text-gray-400">🔒 Secured by Paystack · No hidden fees</p>
      </div>

      {/* Quick links */}
      <div className="border-t border-gray-50">
        {[
          { to: '/verify-account', icon: ShieldCheck, label: 'Verify Account',  sub: '1,000 BC', iconBg: 'bg-blue-50',   iconColor: 'text-blue-600'   },
          { to: '/boost',          icon: Zap,         label: 'Boost a Listing', sub: 'From 500 BC', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { to: '/invite',         icon: Gift,        label: 'Invite & Earn',   sub: '500 BC per friend', iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
        ].map(({ to, icon: Icon, label, sub, iconBg, iconColor }) => (
          <Link key={to} to={to} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
            <div className={`w-8 h-8 ${iconBg} rounded-xl flex items-center justify-center flex-none`}>
              <Icon size={15} className={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
            <ArrowUpRight size={14} className="text-gray-300 flex-none" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Transaction List ─────────────────────────────────────────────────────────
function TxList({ isLoading, payments }) {
  const [filter, setFilter] = useState('All');

  const filtered = (payments || []).filter(p => {
    if (filter === 'All') return true;
    const { isCredit } = resolvePayment(p);
    return filter === 'Credits' ? isCredit : !isCredit;
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
        <div>
          <h2 className="font-display font-bold text-base text-gray-900">Transactions</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">{payments?.length || 0} recent · Last 30 days</p>
        </div>
        {/* Filter tabs */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
          {TX_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
              <WalletIcon size={24} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500 text-sm">No transactions</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter === 'All' ? 'Add Barter Credits to get started.' : `No ${filter.toLowerCase()} yet.`}
            </p>
          </div>
        ) : (
          filtered.map((p, i) => {
            const { isCredit, meta, label } = resolvePayment(p);
            const Icon = meta.icon;
            const statusIcon = p.status === 'success'
              ? <CheckCircle2 size={12} className="text-emerald-500" />
              : p.status === 'pending'
              ? <Clock3 size={12} className="text-amber-500" />
              : null;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors"
              >
                {/* Icon */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-none ${isCredit ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                  <Icon size={17} className={isCredit ? 'text-emerald-600' : 'text-gray-500'} />
                </div>
                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{label}
                    {p.listingId?.title && <span className="font-normal text-gray-400"> · {p.listingId.title}</span>}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {statusIcon}
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {/* Amount */}
                <div className="text-right flex-none">
                  <p className={`font-bold text-sm ${isCredit ? 'text-emerald-600' : 'text-gray-800'}`}>
                    {isCredit ? '+' : '−'}{formatBC(p.amountKobo)}
                  </p>
                  <p className={`text-[11px] font-medium capitalize mt-0.5 ${
                    p.status === 'success' ? 'text-emerald-500'
                    : p.status === 'pending' ? 'text-amber-500'
                    : 'text-red-500'
                  }`}>{p.status}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Wallet() {
  const { user, refreshUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const ref = searchParams.get('ref') || searchParams.get('mock_ref');
  useEffect(() => {
    if (!ref) return;
    verifyPayment(ref)
      .then(() => {
        refreshUser();
        queryClient.invalidateQueries(['payment-history']);
        toast.success('Wallet topped up successfully!');
        const dest = localStorage.getItem('wallet_returnTo');
        localStorage.removeItem('wallet_returnTo');
        if (dest) navigate(dest);
        else window.history.replaceState({}, '', '/wallet');
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => getPaymentHistory({ limit: 30 }),
  });

  const topupMutation = useMutation({
    mutationFn: () => {
      const kobo = (customAmount ? parseInt(customAmount) : selectedAmount) * 100;
      return topupWallet({ amountKobo: kobo, email: user?.email });
    },
    onSuccess: (result) => {
      if (result.authorizationUrl) {
        const returnTo = searchParams.get('returnTo');
        if (returnTo) localStorage.setItem('wallet_returnTo', returnTo);
        window.location.href = result.authorizationUrl;
      } else {
        refreshUser();
        queryClient.invalidateQueries(['payment-history']);
        toast.success('Wallet topped up (mock mode)!');
        setSheetOpen(false);
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Top-up failed'),
  });

  const walletBalance = data?.walletBalance ?? user?.walletBalance ?? 0;
  const finalAmount = customAmount ? parseInt(customAmount) || 0 : selectedAmount;

  const topUpSharedProps = {
    finalAmount, selectedAmount, customAmount,
    setSelectedAmount, setCustomAmount,
    onTopUp: () => topupMutation.mutate(),
    loading: topupMutation.isPending,
  };

  return (
    <div className="bg-[#F4F5F7] min-h-screen pb-16">
      <TopBar title="Wallet" showBack />

      {/* ── Mobile ── */}
      <div className="lg:hidden px-4 pt-4 space-y-4">
        <BalanceCard balance={walletBalance} user={user} />
        <QuickActions onAddCredits={() => setSheetOpen(true)} />
        <StatStrip user={user} />
        <TxList isLoading={isLoading} payments={data?.payments} />
      </div>

      {/* ── Desktop ── */}
      <div className="hidden lg:block max-w-6xl mx-auto px-8 py-8">
        {/* Top section: card + actions + stats */}
        <div className="grid grid-cols-[1fr_340px] gap-6 mb-6">
          <div className="space-y-4">
            <BalanceCard balance={walletBalance} user={user} />
            <StatStrip user={user} />
          </div>
          <TopUpPanel {...topUpSharedProps} />
        </div>

        {/* Transactions full width */}
        <TxList isLoading={isLoading} payments={data?.payments} />
      </div>

      {/* Mobile sheet */}
      <AddCreditsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        {...topUpSharedProps}
      />
    </div>
  );
}
