import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { topupWallet, verifyPayment, getPaymentHistory } from '../api/payments.api';
import { getMySwaps } from '../api/swaps.api';
import { useAuthStore } from '../store/auth.store';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import {
  Eye, EyeOff, Plus, ShieldCheck, Zap, Gift,
  ArrowDownLeft, Wallet as WalletIcon, X,
  CheckCircle2, Clock3, XCircle, Bell, Settings,
  ChevronRight, ArrowUpRight, Delete,
  ArrowLeftRight, Package, AlertTriangle, Star, TrendingUp,
} from 'lucide-react';
import { formatBC } from '../utils/currency';
import { format, isToday, isYesterday } from 'date-fns';
import { resolveImageUrl, IMAGE_FALLBACK_SRC } from '../utils/placeholder';

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

function resolvePayment(p) {
  const isRefund = p.status === 'refunded';
  const isCredit = p.paymentType === 'topup' || isRefund;
  const meta = TYPE_META[p.paymentType] || { label: p.paymentType, icon: WalletIcon, credit: false };
  const label = p.paymentType === 'escrow'
    ? (ESCROW_LABELS[p.meta?.type] || (isRefund ? 'Escrow Refund' : 'Escrow Deposit'))
    : meta.label;
  return { isCredit, meta, label };
}

function groupByDate(payments) {
  const groups = {};
  (payments || []).forEach(p => {
    const d = new Date(p.createdAt);
    const key = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'dd MMM yyyy');
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  return groups;
}

// ─── Chip SVG ─────────────────────────────────────────────────────────────────
function Chip() {
  return (
    <svg width="38" height="28" viewBox="0 0 38 28" fill="none">
      <rect x="0.5" y="0.5" width="37" height="27" rx="3.5" fill="#D4AF37" stroke="#B8962E" />
      <rect x="13" y="0.5" width="12" height="27" fill="#C9A227" />
      <rect x="0.5" y="9" width="37" height="10" fill="#C9A227" />
      <rect x="13" y="9" width="12" height="10" fill="#B8962E" />
    </svg>
  );
}

// ─── Virtual Card ─────────────────────────────────────────────────────────────
function VirtualCard({ balance, user, hidden, onToggleHide }) {
  const bc = balance / 100;
  const formatted = bc.toLocaleString('en-NG', { minimumFractionDigits: 2 });
  return (
    <div
      className="relative rounded-[24px] overflow-hidden text-white select-none"
      style={{ background: 'linear-gradient(135deg,#0A0F1E 0%,#141B35 50%,#0d1a2e 100%)', minHeight: 196 }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full border border-white/[0.04]" />
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full border border-white/[0.04]" />
        <div className="absolute -bottom-16 -left-12 w-52 h-52 rounded-full border border-white/[0.04]" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-48 h-24 bg-primary/10 blur-3xl rounded-full" />
      </div>
      <div className="relative p-5 lg:p-6 flex flex-col h-full" style={{ minHeight: 196 }}>
        {/* Top */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">SwapNaija</p>
            <p className="text-[10px] text-white/20 tracking-wider mt-0.5">Virtual Wallet</p>
          </div>
          <Chip />
        </div>
        {/* Balance */}
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-1.5">Available Balance</p>
          <div className="flex items-center gap-2.5">
            {hidden ? (
              <span className="font-display font-bold text-3xl tracking-tight leading-none">● ● ● ●</span>
            ) : (
              <>
                <span className="font-display font-bold leading-none tracking-tight" style={{ fontSize: 'clamp(1.8rem,6vw,2.8rem)' }}>
                  {formatted}
                </span>
                <span className="font-bold text-white/45 text-lg mb-0.5">BC</span>
              </>
            )}
            <button onClick={onToggleHide}
              className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition flex-none">
              {hidden ? <Eye size={13} className="text-white/50" /> : <EyeOff size={13} className="text-white/50" />}
            </button>
          </div>
          <p className="text-[10px] text-white/20 mt-1">1 BC = ₦1</p>
        </div>
        {/* Bottom */}
        <div className="flex items-end justify-between mt-4">
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Holder</p>
            <p className="font-semibold text-sm text-white/75 truncate max-w-[140px]">{user?.fullName || 'SwapNaija User'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Status</p>
            <div className="flex items-center gap-1.5 justify-end">
              <span className={`w-1.5 h-1.5 rounded-full ${user?.verification === 'verified' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
              <span className="text-sm font-semibold text-white/75 capitalize">{user?.verification || 'Unverified'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions({ onAdd }) {
  const actions = [
    { label: 'Add Money',   icon: Plus,        onClick: onAdd,         primary: true },
    { label: 'Verify',      icon: ShieldCheck, to: '/verify-account'               },
    { label: 'Boost',       icon: Zap,         to: '/boost'                        },
    { label: 'Invite',      icon: Gift,        to: '/invite'                       },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ label, icon: Icon, onClick, to, primary }) => {
        const wrap = `flex flex-col items-center gap-2`;
        const btn = (
          <>
            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center ${
              primary ? 'bg-primary shadow-lg shadow-primary/25' : 'bg-white border border-gray-100 shadow-sm'
            }`} style={{ width: 52, height: 52 }}>
              <Icon size={20} className={primary ? 'text-white' : 'text-gray-600'} />
            </div>
            <span className="text-xs font-semibold text-gray-600">{label}</span>
          </>
        );
        return to
          ? <Link key={label} to={to} className={wrap}>{btn}</Link>
          : <button key={label} onClick={onClick} className={wrap}>{btn}</button>;
      })}
    </div>
  );
}

// ─── Swap Activity Scroll ─────────────────────────────────────────────────────
const SWAP_STATUS_CFG = {
  proposed:  { label: 'Proposed',  dot: '#94a3b8', cls: 'bg-slate-100 text-slate-500',    Icon: Clock3         },
  accepted:  { label: 'Accepted',  dot: '#7c3aed', cls: 'bg-violet-100 text-violet-600',  Icon: CheckCircle2   },
  in_escrow: { label: 'In Escrow', dot: '#2563eb', cls: 'bg-blue-100 text-blue-600',      Icon: ShieldCheck    },
  shipped:   { label: 'Shipped',   dot: '#d97706', cls: 'bg-amber-100 text-amber-600',    Icon: Package        },
  completed: { label: 'Completed', dot: '#10b981', cls: 'bg-emerald-100 text-emerald-600',Icon: CheckCircle2   },
  cancelled: { label: 'Cancelled', dot: '#94a3b8', cls: 'bg-slate-100 text-slate-400',    Icon: XCircle        },
  disputed:  { label: 'Disputed',  dot: '#ef4444', cls: 'bg-red-100 text-red-500',        Icon: AlertTriangle  },
};

function SwapCard({ swap, userId, index }) {
  const isInitiator  = swap.initiatorId?.id === userId;
  const myListing    = isInitiator ? swap.initiatorListing : swap.receiverListing;
  const theirListing = isInitiator ? swap.receiverListing  : swap.initiatorListing;
  const partner      = isInitiator ? swap.receiverId : swap.initiatorId;

  const cfg      = SWAP_STATUS_CFG[swap.status] || SWAP_STATUS_CFG.proposed;
  const myImg    = myListing?.images?.[0]    ? resolveImageUrl(myListing.images[0])    : null;
  const theirImg = theirListing?.images?.[0] ? resolveImageUrl(theirListing.images[0]) : null;
  const bgImg    = myImg || theirImg;
  const topVal   = Math.max(myListing?.estimatedValue || 0, theirListing?.estimatedValue || 0);
  const valLabel = topVal >= 1000
    ? `${(topVal / 1000).toFixed(topVal % 1000 === 0 ? 0 : 1)}k`
    : topVal > 0 ? String(topVal) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay: index * 0.07, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.14 } }}
      whileTap={{ scale: 0.97 }}
      className="w-[188px] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
    >
      {/* Blurred image header */}
      <div className="relative h-[66px] overflow-hidden bg-gray-200">
        {bgImg && (
          <img src={bgImg} alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'blur(9px)', transform: 'scale(1.3)' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0 bg-black/48" />

        {/* Status dot + label */}
        <div className="absolute top-2 left-2.5 flex items-center gap-1.5">
          <span className="w-[7px] h-[7px] rounded-full flex-none" style={{ backgroundColor: cfg.dot }} />
          <span className="text-[9px] font-black text-white/80 uppercase tracking-wide">{cfg.label}</span>
        </div>

        {/* Two item thumbnails + arrow — centered */}
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white/50 bg-gray-700 shadow-lg flex-none">
            {myImg
              ? <img src={myImg} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }} />
              : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-white/30" /></div>
            }
          </div>
          <div className="w-[22px] h-[22px] rounded-full bg-white/90 flex items-center justify-center shadow-sm flex-none">
            <ArrowLeftRight size={9} className="text-gray-600" />
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white/50 bg-gray-700 shadow-lg flex-none">
            {theirImg
              ? <img src={theirImg} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }} />
              : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-white/30" /></div>
            }
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2">
        {/* Item titles */}
        <div>
          <p className="text-[12px] font-bold text-gray-900 leading-tight truncate">
            {myListing?.title || 'Open offer'}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <ArrowLeftRight size={8} className="text-gray-300 flex-none" />
            <p className="text-[10px] text-gray-400 truncate leading-tight">
              {theirListing?.title || 'Any item'}
            </p>
          </div>
        </div>

        {/* Partner */}
        {partner && (
          <div className="flex items-center gap-1.5">
            <div className="w-[18px] h-[18px] rounded-full bg-primary/15 flex items-center justify-center flex-none">
              <span className="text-[8px] font-black text-primary leading-none">
                {partner.fullName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium truncate flex-1 min-w-0">
              {partner.fullName?.split(' ')[0] || 'User'}
            </p>
            {(partner.ratingAvg || 0) > 0 && (
              <div className="flex items-center gap-0.5 flex-none">
                <Star size={9} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] text-gray-400 font-semibold">{partner.ratingAvg.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        {/* Status badge + value */}
        <div className="flex items-center justify-between gap-1">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${cfg.cls}`}>
            <cfg.Icon size={8} />
            {cfg.label}
          </span>
          {valLabel && (
            <span className="text-[11px] font-bold text-gray-700">{valLabel} BC</span>
          )}
        </div>

        {/* Date */}
        <p className="text-[10px] text-gray-300 font-medium">
          {format(new Date(swap.createdAt), 'dd MMM yyyy')}
        </p>
      </div>
    </motion.div>
  );
}

function BigSwapsScroll({ userId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['my-swaps-highlight'],
    queryFn: () => getMySwaps(undefined, 1, 10),
    staleTime: 60_000,
  });

  const swaps = data?.swaps ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={13} className="text-primary" />
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Swap Activity</p>
        </div>
        <div className="flex gap-3 overflow-hidden -mx-4 px-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-[188px] flex-none h-[172px] bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!swaps.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={13} className="text-primary" />
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Swap Activity</p>
        </div>
        <Link to="/swaps" className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
          See all <ArrowUpRight size={11} />
        </Link>
      </div>
      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {swaps.map((swap, i) => (
          <Link key={swap.id} to={`/swaps/${swap.id}`} className="flex-none">
            <SwapCard swap={swap} userId={userId} index={i} />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Strip ──────────────────────────────────────────────────────────────
function StatStrip({ user }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm grid grid-cols-4 divide-x divide-gray-100">
      {[
        { label: 'Swaps',    value: user?.swapCount || 0 },
        { label: 'Rating',   value: user?.ratingAvg ? `${user.ratingAvg.toFixed(1)}★` : '—' },
        { label: 'Listings', value: user?.listingCount || 0 },
        { label: 'Credits',  value: `${(user?.swapCredits || 0).toLocaleString()}` },
      ].map(({ label, value }) => (
        <div key={label} className="py-4 text-center">
          <p className="font-bold text-[15px] text-gray-900">{value}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Numpad Add Money Modal ───────────────────────────────────────────────────
const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

function AddMoneyModal({ open, onClose, onTopUp, loading }) {
  const [raw, setRaw] = useState('');
  const amount = parseInt(raw) || 0;

  const press = (key) => {
    if (key === 'del') { setRaw(r => r.slice(0, -1)); return; }
    if (key === '00') { setRaw(r => (r ? r + '00' : r)); return; }
    if (raw.length >= 7) return;
    setRaw(r => r + key);
  };

  const handleQuick = (amt) => setRaw(String(amt));

  const display = amount > 0
    ? amount.toLocaleString('en-NG')
    : '0';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-50 lg:inset-0 lg:flex lg:items-center lg:justify-center lg:p-4"
          >
            <div className="bg-white w-full lg:max-w-sm lg:rounded-[28px] rounded-t-[28px] shadow-2xl overflow-hidden">
              {/* Handle (mobile only) */}
              <div className="flex justify-center pt-3 pb-1 lg:hidden">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-4 pb-2">
                <h2 className="font-display font-bold text-lg text-gray-900">Add Money</h2>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-gray-500">
                  <X size={16} />
                </button>
              </div>

              {/* Amount display */}
              <div className="px-6 pt-4 pb-5 text-center border-b border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Enter Amount (BC)</p>
                <div className="flex items-end justify-center gap-2 min-h-[56px]">
                  <span className="font-bold text-gray-400 text-xl mb-1">BC</span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={display}
                      initial={{ y: -8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 8, opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className={`font-display font-bold leading-none ${amount > 0 ? 'text-gray-900' : 'text-gray-300'}`}
                      style={{ fontSize: amount > 9999 ? '2.2rem' : '2.8rem' }}
                    >
                      {display}
                    </motion.span>
                  </AnimatePresence>
                </div>
                {amount > 0 && (
                  <p className="text-xs text-gray-400 mt-1">= ₦{amount.toLocaleString()} via Paystack</p>
                )}
                {amount > 0 && amount < 100 && (
                  <p className="text-xs text-red-400 mt-1">Minimum is 100 BC</p>
                )}
              </div>

              {/* Quick amounts */}
              <div className="px-5 pt-4 pb-2 flex gap-2 flex-wrap justify-center">
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} onClick={() => handleQuick(a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                      amount === a ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-600 border-transparent hover:border-primary/30'
                    }`}>
                    {a >= 1000 ? `${a / 1000}k` : a} BC
                  </button>
                ))}
              </div>

              {/* Numpad */}
              <div className="px-5 py-3">
                <div className="grid grid-cols-3 gap-1">
                  {['1','2','3','4','5','6','7','8','9','00','0','del'].map(k => (
                    <button key={k} onClick={() => press(k)}
                      className={`h-14 rounded-2xl font-bold text-lg flex items-center justify-center transition-all active:scale-95 ${
                        k === 'del'
                          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                      }`}>
                      {k === 'del' ? <Delete size={18} /> : k}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-8 pt-2 space-y-3">
                <Button fullWidth size="lg" loading={loading} disabled={amount < 100} onClick={() => onTopUp(amount)}>
                  Pay ₦{amount > 0 ? amount.toLocaleString() : '—'}
                </Button>
                <p className="text-center text-[11px] text-gray-300">🔒 Paystack · SSL Encrypted · Instant</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Transaction List ─────────────────────────────────────────────────────────
function TxList({ isLoading, payments, total, page, totalPages, onPage }) {
  const [filter, setFilter] = useState('All');

  const filtered = (payments || []).filter(p => {
    if (filter === 'All') return true;
    const { isCredit } = resolvePayment(p);
    return filter === 'Credits' ? isCredit : !isCredit;
  });

  const groups = groupByDate(filtered);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
        <div>
          <h3 className="font-display font-bold text-base text-gray-900">Transactions</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {total ?? 0} total
          </p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-xl p-1">
          {['All', 'Credits', 'Debits'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
            <WalletIcon size={22} className="text-gray-300" />
          </div>
          <p className="font-semibold text-gray-500 text-sm">No transactions</p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === 'All' ? 'Add Barter Credits to get started.' : `No ${filter.toLowerCase()} yet.`}
          </p>
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filter}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {Object.entries(groups).map(([date, items]) => (
                <div key={date}>
                  <div className="px-5 py-2.5 bg-gray-50/80">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{date}</span>
                  </div>
                  {items.map((p, i) => {
                    const { isCredit, meta, label } = resolvePayment(p);
                    const Icon = meta.icon;
                    return (
                      <div key={p.id}
                        className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-none ${isCredit ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                          <Icon size={18} className={isCredit ? 'text-emerald-600' : 'text-gray-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {label}
                            {p.listingId?.title && <span className="font-normal text-gray-400"> · {p.listingId.title}</span>}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {p.status === 'success' && <CheckCircle2 size={11} className="text-emerald-500 flex-none" />}
                            {p.status === 'pending' && <Clock3 size={11} className="text-amber-500 flex-none" />}
                            {p.status === 'failed'  && <XCircle  size={11} className="text-red-400 flex-none" />}
                            <p className="text-[11px] text-gray-400">{format(new Date(p.createdAt), 'h:mm a')}</p>
                          </div>
                        </div>
                        <div className="text-right flex-none">
                          <p className={`font-bold text-sm ${isCredit ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {isCredit ? '+' : '−'}{formatBC(p.amountKobo)}
                          </p>
                          <p className={`text-[10px] font-medium capitalize mt-0.5 ${
                            p.status === 'success' ? 'text-emerald-500'
                            : p.status === 'pending' ? 'text-amber-500'
                            : 'text-red-400'
                          }`}>{p.status}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50 bg-gray-50/50">
              <p className="text-xs text-gray-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPage(page - 1)}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-30 transition border border-transparent hover:border-gray-200"
                >
                  <ChevronRight size={15} className="rotate-180" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce((acc, n, idx, arr) => {
                    if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, i) =>
                    n === '…' ? (
                      <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => onPage(n)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                          n === page
                            ? 'bg-primary text-white'
                            : 'text-gray-500 hover:bg-white hover:text-gray-800 border border-transparent hover:border-gray-200'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )
                }

                <button
                  onClick={() => onPage(page + 1)}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-30 transition border border-transparent hover:border-gray-200"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Wallet() {
  const { user, refreshUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [txPage, setTxPage] = useState(1);

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
    queryKey: ['payment-history', txPage],
    queryFn: () => getPaymentHistory({ limit: 10, page: txPage }),
    keepPreviousData: true,
  });

  const topupMutation = useMutation({
    mutationFn: (amount) => {
      return topupWallet({ amountKobo: amount * 100, email: user?.email });
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
        setModalOpen(false);
        setTxPage(1);
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Top-up failed'),
  });

  const walletBalance = data?.walletBalance ?? user?.walletBalance ?? 0;

  return (
    <div className="bg-[#F2F3F5] min-h-screen pb-20">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 h-14 sticky top-0 z-30">
        <h1 className="font-display font-bold text-base text-gray-900">My Wallet</h1>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
            <Bell size={17} />
          </button>
          <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
            <Settings size={17} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 lg:px-8 pt-5 space-y-4 pb-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
          {/* Left col */}
          <div className="space-y-4">
            <VirtualCard balance={walletBalance} user={user} hidden={hidden} onToggleHide={() => setHidden(h => !h)} />
            <QuickActions onAdd={() => setModalOpen(true)} />
            <StatStrip user={user} />
            <BigSwapsScroll userId={user?.id} />
          </div>
          {/* Right col — transactions (desktop) */}
          <div className="hidden lg:block">
            <TxList
              isLoading={isLoading}
              payments={data?.payments}
              total={data?.total ?? 0}
              page={txPage}
              totalPages={data?.pages ?? 1}
              onPage={setTxPage}
            />
          </div>
        </div>
        {/* Transactions (mobile) */}
        <div className="lg:hidden">
          <TxList
            isLoading={isLoading}
            payments={data?.payments}
            total={data?.total ?? 0}
            page={txPage}
            totalPages={data?.pages ?? 1}
            onPage={setTxPage}
          />
        </div>
      </div>

      {/* Add Money modal */}
      <AddMoneyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onTopUp={(amount) => topupMutation.mutate(amount)}
        loading={topupMutation.isPending}
      />
    </div>
  );
}
