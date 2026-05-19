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
  Wallet as WalletIcon, Plus, History, ShieldCheck, Zap,
  ArrowDownLeft, Coins, TrendingUp, Star, ArrowRight,
  CreditCard, RefreshCw, ChevronRight,
} from 'lucide-react';
import { formatBC } from '../utils/currency';
import { formatDistanceToNow } from 'date-fns';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

const TYPE_META = {
  topup:        { label: 'Wallet Top-up',       color: 'text-emerald-600', icon: ArrowDownLeft },
  boost:        { label: 'Listing Boost',        color: 'text-amber-600',   icon: Zap           },
  verification: { label: 'Account Verification', color: 'text-blue-600',    icon: ShieldCheck   },
  escrow:       { label: 'Escrow Fee',           color: 'text-gray-500',    icon: WalletIcon    },
  fee:          { label: 'Platform Fee',         color: 'text-gray-500',    icon: WalletIcon    },
};

const STATUS_VARIANTS = { success: 'success', failed: 'danger', pending: 'warning' };

const ESCROW_LABELS = {
  escrow_deposit:           'Escrow Deposit',
  escrow_completion_refund: 'Escrow Refund',
  escrow_cancelled_refund:  'Escrow Cancelled — Refund',
  topup_paid:               'Value Gap Top-up',
  topup_released:           'Top-up Released',
  topup_cancelled_refund:   'Top-up Refund',
};

function resolvePayment(p) {
  const isRefund = p.status === 'refunded';
  const isCredit = p.paymentType === 'topup' || isRefund;
  const baseMeta = TYPE_META[p.paymentType] || { label: p.paymentType, color: 'text-gray-500', icon: WalletIcon };
  const label = p.paymentType === 'escrow'
    ? (ESCROW_LABELS[p.meta?.type] || (isRefund ? 'Escrow Refund' : 'Escrow Deposit'))
    : baseMeta.label;
  return { isCredit, baseMeta, label };
}

// ─── Balance Hero ──────────────────────────────────────────────────────────────
function BalanceHero({ walletBalance, user, onTopUp }) {
  const bc = walletBalance / 100;
  const [whole, dec] = bc.toLocaleString('en-NG', { minimumFractionDigits: 2 }).split('.');

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#061912] via-[#0b2a1e] to-[#040e0a]">
      {/* Glows */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 right-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl" />
      <div className="pointer-events-none absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-teal-400/8 blur-xl" />

      {/* Floating coin decoration */}
      <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.07] lg:opacity-[0.1]">
        <Coins size={160} className="text-white" />
      </div>

      <div className="relative w-full px-4 py-8 lg:px-10 lg:py-12">
        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <WalletIcon size={14} className="text-white/80" />
          </div>
          <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Barter Credits Balance</span>
        </div>

        {/* Big balance number */}
        <div className="flex items-end gap-2 mb-1">
          <span className="font-display font-bold text-white leading-none" style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}>
            {whole}
          </span>
          <span className="font-display font-bold text-white/40 text-2xl lg:text-3xl mb-1 leading-none">.{dec}</span>
          <span className="font-bold text-primary text-lg lg:text-2xl mb-2 leading-none">BC</span>
        </div>
        <p className="text-white/35 text-xs mb-6">1 BC = ₦1 · Secured by Paystack</p>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-5 mb-6">
          {[
            { label: 'Swaps',    value: user?.swapCount     || 0                                    },
            { label: 'Credits',  value: `${(user?.swapCredits || 0).toLocaleString()} BC`           },
            { label: 'Rating',   value: user?.ratingAvg ? `${user.ratingAvg.toFixed(1)} ★` : '—'  },
            { label: 'Listings', value: user?.listingCount  || 0                                    },
            { label: 'Status',   value: user?.verification  || 'Unverified', cap: true              },
          ].map(({ label, value, cap }) => (
            <div key={label}>
              <p className="text-[10px] text-white/35 uppercase tracking-wider">{label}</p>
              <p className={`font-bold text-sm text-white/90 mt-0.5 ${cap ? 'capitalize' : ''}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onTopUp}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-primary/30"
          >
            <Plus size={15} /> Add Credits
          </button>
          <Link
            to="/verify-account"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
          >
            <ShieldCheck size={15} /> Get Verified
          </Link>
          <Link
            to="/boost"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
          >
            <Zap size={15} /> Boost Listing
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Stat Cards ──────────────────────────────────────────────────────────
function WalletStats({ user }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: 'Completed Swaps',  value: user?.swapCount     || 0,   icon: TrendingUp, color: 'text-primary',   bg: 'bg-primary/8'  },
        { label: 'Swap Credits',     value: `${(user?.swapCredits || 0).toLocaleString()} BC`, icon: Coins, color: 'text-amber-500', bg: 'bg-amber-50'   },
        { label: 'Star Rating',      value: user?.ratingAvg ? `${user.ratingAvg.toFixed(1)} ★` : '—', icon: Star, color: 'text-violet-500', bg: 'bg-violet-50' },
        { label: 'Active Listings',  value: user?.listingCount  || 0,   icon: Zap,        color: 'text-blue-500',  bg: 'bg-blue-50'    },
      ].map(({ label, value, icon: Icon, color, bg }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}>
              <Icon size={14} className={color} />
            </div>
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
          </div>
          <p className={`font-bold text-xl leading-none ${color}`}>{value}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Top-up Panel ──────────────────────────────────────────────────────────────
function TopUpPanel({ finalAmount, selectedAmount, customAmount, setSelectedAmount, setCustomAmount, onTopUp, loading, balance }) {
  const needsTopUp = balance < 100000;
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
            <CreditCard size={14} className="text-primary" />
          </div>
          <h2 className="font-display font-bold text-base text-gray-900">Add Barter Credits</h2>
        </div>
        <p className="text-xs text-gray-400 ml-9">Instantly top up via Paystack · 1 BC = ₦1</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Hint */}
        {needsTopUp && (
          <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
            <span className="text-base flex-none">💡</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              Add credits to <span className="font-semibold">verify your account (1,000 BC)</span> or <span className="font-semibold">boost a listing (from 500 BC)</span>.
            </p>
          </div>
        )}

        {/* Preset grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {PRESET_AMOUNTS.map(amt => {
            const active = selectedAmount === amt && !customAmount;
            return (
              <motion.button
                key={amt}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                className={`relative py-4 rounded-2xl text-center transition-all border-2 overflow-hidden ${
                  active
                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                    : 'border-gray-200 bg-gray-50 hover:border-primary/40 hover:bg-primary/5 text-gray-700'
                }`}
              >
                {active && (
                  <motion.div layoutId="preset-bg" className="absolute inset-0 bg-primary" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10 block font-display font-bold text-xl">{amt.toLocaleString()}</span>
                <span className={`relative z-10 block text-[11px] font-medium mt-0.5 ${active ? 'text-white/70' : 'text-gray-400'}`}>
                  Barter Credits
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Custom */}
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Custom Amount</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">BC</span>
            <input
              type="number"
              min="100"
              placeholder="Enter amount (min. 100)"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
              className="w-full pl-14 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
        </div>

        {/* CTA */}
        <Button
          fullWidth
          size="lg"
          loading={loading}
          disabled={finalAmount < 100}
          onClick={onTopUp}
        >
          <Plus size={17} />
          Add {finalAmount > 0 ? `${finalAmount.toLocaleString()} BC` : '—'} via Paystack
        </Button>

        {/* Trust row */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-gray-300 pt-1">
          <span>🔒 Secured</span>
          <span>·</span>
          <span>Instant</span>
          <span>·</span>
          <span>1 BC = ₦1</span>
        </div>
      </div>

      {/* Quick links */}
      <div className="border-t border-gray-50">
        {[
          { to: '/verify-account', icon: ShieldCheck, label: 'Verify Account',  sub: '1,000 BC', color: 'text-blue-500',   bg: 'bg-blue-50'  },
          { to: '/boost',          icon: Zap,         label: 'Boost a Listing', sub: 'From 500 BC', color: 'text-amber-500', bg: 'bg-amber-50' },
          { to: '/invite',         icon: Star,        label: 'Invite & Earn',   sub: '500 BC per referral', color: 'text-violet-500', bg: 'bg-violet-50' },
        ].map(({ to, icon: Icon, label, sub, color, bg }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition border-b border-gray-50 last:border-0"
          >
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center flex-none`}>
              <Icon size={15} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
            <ChevronRight size={15} className="text-gray-300 flex-none" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Transaction Item ──────────────────────────────────────────────────────────
function TxItem({ p }) {
  const { isCredit, baseMeta, label } = resolvePayment(p);
  const Icon = baseMeta.icon;
  const sign = isCredit ? '+' : '-';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 py-3.5 hover:bg-gray-50/70 -mx-2 px-2 rounded-xl transition-colors group"
    >
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-none ${isCredit ? 'bg-emerald-50' : 'bg-gray-50'}`}>
        <Icon size={16} className={isCredit ? 'text-emerald-600' : baseMeta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800 truncate">
          {label}
          {p.listingId?.title && <span className="font-normal text-gray-400"> · {p.listingId.title}</span>}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
        </p>
      </div>
      <div className="text-right flex-none">
        <p className={`font-bold text-sm ${isCredit ? 'text-emerald-600' : 'text-gray-700'}`}>
          {sign}{formatBC(p.amountKobo)}
        </p>
        <Badge variant={STATUS_VARIANTS[p.status] || 'default'} size="sm">
          {p.status}
        </Badge>
      </div>
    </motion.div>
  );
}

// ─── Transaction History ────────────────────────────────────────────────────────
function TxHistory({ isLoading, payments }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
            <History size={14} className="text-gray-500" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base text-gray-900">Transaction History</h2>
            <p className="text-[11px] text-gray-400">{payments?.length || 0} recent transactions</p>
          </div>
        </div>
        <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">Last 30</span>
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : !payments?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
              <WalletIcon size={28} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">Add Barter Credits to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map(p => <TxItem key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Wallet() {
  const { user, refreshUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);

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
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Top-up failed'),
  });

  const walletBalance = data?.walletBalance ?? user?.walletBalance ?? 0;
  const finalAmount = customAmount ? parseInt(customAmount) || 0 : selectedAmount;

  const topUpProps = {
    finalAmount,
    selectedAmount,
    customAmount,
    setSelectedAmount,
    setCustomAmount,
    onTopUp: () => topupMutation.mutate(),
    loading: topupMutation.isPending,
    balance: walletBalance,
  };

  return (
    <div className="bg-[#F5F6F8] min-h-screen">
      <TopBar title="Wallet" showBack />

      {/* Hero */}
      <BalanceHero walletBalance={walletBalance} user={user} onTopUp={() => setShowTopUp(s => !s)} />

      {/* ── Mobile Layout ── */}
      <div className="lg:hidden px-4 py-5 space-y-5">
        {/* Collapsible top-up on mobile */}
        <AnimatePresence>
          {showTopUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <TopUpPanel {...topUpProps} />
            </motion.div>
          )}
        </AnimatePresence>
        {!showTopUp && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowTopUp(true)}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                <Plus size={16} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-gray-900">Add Barter Credits</p>
                <p className="text-xs text-gray-400">Top up via Paystack · 1 BC = ₦1</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </motion.button>
        )}

        <WalletStats user={user} />
        <TxHistory isLoading={isLoading} payments={data?.payments} />
      </div>

      {/* ── Desktop Layout ── */}
      <div className="hidden lg:block max-w-7xl mx-auto px-8 py-8">
        <WalletStats user={user} />

        <div className="mt-6 grid grid-cols-[380px_1fr] gap-6 items-start">
          {/* Left — top-up + links */}
          <div className="sticky top-4">
            <TopUpPanel {...topUpProps} />
          </div>

          {/* Right — transactions */}
          <TxHistory isLoading={isLoading} payments={data?.payments} />
        </div>
      </div>
    </div>
  );
}
