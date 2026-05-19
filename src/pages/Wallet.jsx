import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { topupWallet, verifyPayment, getPaymentHistory } from '../api/payments.api';
import { useAuthStore } from '../store/auth.store';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import {
  Eye, EyeOff, Plus, ShieldCheck, Zap, Gift,
  ArrowDownLeft, Wallet as WalletIcon, X,
  ChevronRight, CheckCircle2, Clock3, XCircle,
  Bell, Settings,
} from 'lucide-react';
import { formatBC } from '../utils/currency';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

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
  payments.forEach(p => {
    const d = new Date(p.createdAt);
    let key;
    if (isToday(d)) key = 'Today';
    else if (isYesterday(d)) key = 'Yesterday';
    else key = format(d, 'dd MMM yyyy');
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  return groups;
}

// ─── Chip SVG ────────────────────────────────────────────────────────────────
function Chip() {
  return (
    <svg width="38" height="28" viewBox="0 0 38 28" fill="none">
      <rect x="0.5" y="0.5" width="37" height="27" rx="3.5" fill="#D4AF37" stroke="#B8962E" />
      <rect x="13" y="0.5" width="12" height="27" fill="#C9A227" />
      <rect x="0.5" y="9" width="37" height="10" fill="#C9A227" />
      <rect x="13" y="9" width="12" height="10" fill="#B8962E" />
      <rect x="0.5" y="0.5" width="37" height="27" rx="3.5" stroke="#B8962E" strokeOpacity="0.4" />
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
      style={{ background: 'linear-gradient(135deg, #0A0F1E 0%, #141B35 40%, #1a2340 100%)', minHeight: 200 }}
    >
      {/* Decorative rings */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full border border-white/5" />
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border border-white/5" />
      <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full border border-white/5" />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-primary/12 blur-3xl rounded-full" />

      <div className="relative p-6">
        {/* Top row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase mb-1">SwapNaija</p>
            <p className="text-[10px] text-white/25 tracking-wider">Virtual Wallet</p>
          </div>
          <Chip />
        </div>

        {/* Balance */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2">Available Balance</p>
          <div className="flex items-center gap-3">
            {hidden ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-display font-bold tracking-tight leading-none">•••••••</span>
                <span className="text-white/50 font-bold text-lg">BC</span>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <span className="font-display font-bold text-3xl lg:text-4xl leading-none tracking-tight">{formatted}</span>
                <span className="font-bold text-white/50 text-lg mb-0.5">BC</span>
              </div>
            )}
            <button
              onClick={onToggleHide}
              className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition ml-1"
            >
              {hidden ? <Eye size={14} className="text-white/60" /> : <EyeOff size={14} className="text-white/60" />}
            </button>
          </div>
          <p className="text-[11px] text-white/25 mt-1.5">1 BC = ₦1 · Barter Credits</p>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Card Holder</p>
            <p className="font-semibold text-sm text-white/80 truncate max-w-[160px]">{user?.fullName || 'SwapNaija User'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Status</p>
            <div className="flex items-center gap-1.5 justify-end">
              <span className={`w-1.5 h-1.5 rounded-full ${user?.verification === 'verified' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
              <span className="text-sm font-semibold text-white/80 capitalize">{user?.verification || 'Unverified'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions({ onAdd }) {
  const items = [
    { label: 'Add Money', icon: Plus,        action: onAdd,            bg: 'bg-primary',   iconColor: 'text-white', textColor: 'text-primary' },
    { label: 'Verify',    icon: ShieldCheck, to: '/verify-account',    bg: 'bg-blue-50',   iconColor: 'text-blue-600',   textColor: 'text-blue-600'   },
    { label: 'Boost',     icon: Zap,         to: '/boost',             bg: 'bg-amber-50',  iconColor: 'text-amber-600',  textColor: 'text-amber-600'  },
    { label: 'Invite',    icon: Gift,        to: '/invite',            bg: 'bg-violet-50', iconColor: 'text-violet-600', textColor: 'text-violet-600' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map(({ label, icon: Icon, action, to, bg, iconColor, textColor }) => {
        const inner = (
          <>
            <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-2 ${label === 'Add Money' ? 'shadow-lg shadow-primary/30' : ''}`}>
              <Icon size={20} className={iconColor} />
            </div>
            <span className={`text-xs font-semibold ${label === 'Add Money' ? textColor : 'text-gray-600'}`}>{label}</span>
          </>
        );
        return to ? (
          <Link key={label} to={to} className="flex flex-col items-center">{inner}</Link>
        ) : (
          <button key={label} onClick={action} className="flex flex-col items-center">{inner}</button>
        );
      })}
    </div>
  );
}

// ─── Account Info Strip ───────────────────────────────────────────────────────
function AccountStrip({ user }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4 divide-x divide-gray-100">
        {[
          { label: 'Total Swaps', value: user?.swapCount || 0 },
          { label: 'Rating',      value: user?.ratingAvg ? `${user.ratingAvg.toFixed(1)} ★` : '—' },
          { label: 'Listings',    value: user?.listingCount || 0 },
        ].map(({ label, value }) => (
          <div key={label} className="pr-4 last:pr-0 first:pl-0 pl-4">
            <p className="font-bold text-base text-gray-900">{value}</p>
            <p className="text-[11px] text-gray-400">{label}</p>
          </div>
        ))}
      </div>
      <div className="text-right">
        <p className="text-[11px] text-gray-400 mb-0.5">Swap Credits</p>
        <p className="font-bold text-sm text-primary">{(user?.swapCredits || 0).toLocaleString()} BC</p>
      </div>
    </div>
  );
}

// ─── Add Money Bottom Sheet ───────────────────────────────────────────────────
function AddMoneySheet({ open, onClose, finalAmount, selectedAmount, customAmount, setSelectedAmount, setCustomAmount, onTopUp, loading }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="px-5 pt-4 pb-10 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-xl text-gray-900">Add Money</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Choose amount · Pay securely via Paystack</p>
                </div>
                <button onClick={onClose}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
                  <X size={17} />
                </button>
              </div>

              {/* Amount presets */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Select Amount</p>
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_AMOUNTS.map(amt => {
                    const active = selectedAmount === amt && !customAmount;
                    return (
                      <button key={amt}
                        onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                        className={`py-4 rounded-2xl text-center transition-all border-2 ${
                          active ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-primary/40'
                        }`}
                      >
                        <span className="block font-bold text-base leading-none">
                          {amt >= 1000 ? `${amt / 1000}k` : amt}
                        </span>
                        <span className={`block text-[10px] mt-1 ${active ? 'text-white/70' : 'text-gray-400'}`}>BC</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Or Enter Custom</p>
                <div className="flex items-center gap-3 border-2 border-gray-200 rounded-2xl px-4 py-3.5 focus-within:border-primary transition bg-gray-50">
                  <span className="font-bold text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-lg">BC</span>
                  <input
                    type="number" min="100"
                    placeholder="Enter amount (min. 100)"
                    value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                    className="flex-1 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Summary */}
              {finalAmount >= 100 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Amount (BC)</span>
                    <span className="font-semibold text-gray-900">{finalAmount.toLocaleString()} BC</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">You pay (₦)</span>
                    <span className="font-semibold text-gray-900">₦{finalAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-700">You receive</span>
                    <span className="font-bold text-primary">{finalAmount.toLocaleString()} BC</span>
                  </div>
                </motion.div>
              )}

              {/* Pay button */}
              <Button fullWidth size="lg" loading={loading} disabled={finalAmount < 100} onClick={onTopUp}>
                Proceed to Pay · ₦{finalAmount > 0 ? finalAmount.toLocaleString() : '—'}
              </Button>

              {/* Trust */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-gray-300">
                <span>🔒 SSL Encrypted</span>
                <span>·</span>
                <span>Paystack Secured</span>
                <span>·</span>
                <span>Instant Credit</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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

  const groups = groupByDate(filtered);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
        <div>
          <h3 className="font-display font-bold text-base text-gray-900">Transactions</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">{payments?.length || 0} recent · Last 30 days</p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-xl p-1">
          {['All', 'Credits', 'Debits'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
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
        <div className="flex flex-col items-center py-16 text-center px-6">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
            <WalletIcon size={22} className="text-gray-300" />
          </div>
          <p className="font-semibold text-gray-500 text-sm">No transactions</p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === 'All' ? 'Add Barter Credits to get started.' : `No ${filter.toLowerCase()} yet.`}
          </p>
        </div>
      ) : (
        <div>
          {Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              {/* Date header */}
              <div className="px-5 py-2.5 bg-gray-50/80">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{date}</span>
              </div>
              {/* Items */}
              {items.map((p, i) => {
                const { isCredit, meta, label } = resolvePayment(p);
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.025 }}
                    className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Icon bubble */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-none ${isCredit ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                      <Icon size={18} className={isCredit ? 'text-emerald-600' : 'text-gray-500'} />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{label}
                        {p.listingId?.title && <span className="font-normal text-gray-400"> · {p.listingId.title}</span>}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.status === 'success' && <CheckCircle2 size={11} className="text-emerald-500 flex-none" />}
                        {p.status === 'pending' && <Clock3 size={11} className="text-amber-500 flex-none" />}
                        {p.status === 'failed'  && <XCircle  size={11} className="text-red-500 flex-none" />}
                        <p className="text-[11px] text-gray-400">
                          {format(new Date(p.createdAt), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    {/* Amount */}
                    <div className="text-right flex-none">
                      <p className={`font-bold text-sm ${isCredit ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {isCredit ? '+' : '−'}{formatBC(p.amountKobo)}
                      </p>
                      <p className={`text-[10px] font-medium capitalize mt-0.5 ${
                        p.status === 'success' ? 'text-emerald-500'
                        : p.status === 'pending' ? 'text-amber-500'
                        : 'text-red-500'
                      }`}>{p.status}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Desktop Top-up Panel ─────────────────────────────────────────────────────
function DesktopTopUp({ finalAmount, selectedAmount, customAmount, setSelectedAmount, setCustomAmount, onTopUp, loading }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-gray-50">
        <h3 className="font-display font-bold text-base text-gray-900">Add Money</h3>
        <p className="text-xs text-gray-400 mt-0.5">Top up via Paystack · 1 BC = ₦1</p>
      </div>
      <div className="p-6 space-y-5">
        {/* Presets */}
        <div className="grid grid-cols-2 gap-2.5">
          {PRESET_AMOUNTS.map(amt => {
            const active = selectedAmount === amt && !customAmount;
            return (
              <motion.button key={amt} whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                className={`py-4 rounded-2xl text-center transition border-2 ${
                  active ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 hover:border-primary/40 text-gray-700'
                }`}>
                <span className="block font-bold text-xl">{amt.toLocaleString()}</span>
                <span className={`block text-[11px] mt-0.5 ${active ? 'text-white/70' : 'text-gray-400'}`}>Barter Credits</span>
              </motion.button>
            );
          })}
        </div>

        {/* Custom */}
        <div className="flex items-center gap-3 border-2 border-gray-200 rounded-2xl px-4 py-3 focus-within:border-primary transition bg-gray-50">
          <span className="font-bold text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-lg flex-none">BC</span>
          <input
            type="number" min="100" placeholder="Custom amount"
            value={customAmount}
            onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
            className="flex-1 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none placeholder-gray-400"
          />
        </div>

        {/* Summary box */}
        {finalAmount >= 100 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold">{finalAmount.toLocaleString()} BC</span></div>
            <div className="flex justify-between"><span className="text-gray-500">You pay</span><span className="font-semibold">₦{finalAmount.toLocaleString()}</span></div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-semibold text-gray-700">Credited</span>
              <span className="font-bold text-primary">{finalAmount.toLocaleString()} BC</span>
            </div>
          </motion.div>
        )}

        <Button fullWidth size="lg" loading={loading} disabled={finalAmount < 100} onClick={onTopUp}>
          Proceed · ₦{finalAmount > 0 ? finalAmount.toLocaleString() : '—'}
        </Button>

        <p className="text-center text-[11px] text-gray-300">🔒 Paystack Secured · Instant · No Fees</p>
      </div>

      {/* Quick links */}
      <div className="border-t border-gray-50">
        {[
          { to: '/verify-account', icon: ShieldCheck, label: 'Verify Account',  sub: '1,000 BC', bg: 'bg-blue-50',   ic: 'text-blue-600'   },
          { to: '/boost',          icon: Zap,         label: 'Boost a Listing', sub: 'From 500 BC', bg: 'bg-amber-50', ic: 'text-amber-600' },
          { to: '/invite',         icon: Gift,        label: 'Invite & Earn',   sub: '500 BC / friend', bg: 'bg-violet-50', ic: 'text-violet-600' },
        ].map(({ to, icon: Icon, label, sub, bg, ic }) => (
          <Link key={to} to={to}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-none`}>
              <Icon size={16} className={ic} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
            <ChevronRight size={14} className="text-gray-300 flex-none" />
          </Link>
        ))}
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
  const [hidden, setHidden] = useState(false);

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

  const topUpProps = {
    finalAmount, selectedAmount, customAmount,
    setSelectedAmount, setCustomAmount,
    onTopUp: () => topupMutation.mutate(),
    loading: topupMutation.isPending,
  };

  return (
    <div className="bg-[#F2F3F5] min-h-screen pb-16">
      {/* Custom top bar with notification + settings */}
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

      {/* ── Mobile ── */}
      <div className="lg:hidden px-4 pt-5 space-y-5">
        <VirtualCard balance={walletBalance} user={user} hidden={hidden} onToggleHide={() => setHidden(h => !h)} />
        <QuickActions onAdd={() => setSheetOpen(true)} />
        <AccountStrip user={user} />
        <TxList isLoading={isLoading} payments={data?.payments} />
      </div>

      {/* ── Desktop ── */}
      <div className="hidden lg:block max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-[1fr_360px] gap-7 items-start">
          {/* Left */}
          <div className="space-y-5">
            <VirtualCard balance={walletBalance} user={user} hidden={hidden} onToggleHide={() => setHidden(h => !h)} />
            <QuickActions onAdd={() => setSheetOpen(true)} />
            <AccountStrip user={user} />
            <TxList isLoading={isLoading} payments={data?.payments} />
          </div>
          {/* Right */}
          <div className="sticky top-20">
            <DesktopTopUp {...topUpProps} />
          </div>
        </div>
      </div>

      {/* Bottom sheet (mobile + desktop) */}
      <AddMoneySheet open={sheetOpen} onClose={() => setSheetOpen(false)} {...topUpProps} />
    </div>
  );
}
