import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { topupWallet, verifyPayment, getPaymentHistory } from '../api/payments.api';
import { useAuthStore } from '../store/auth.store';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { Wallet as WalletIcon, Plus, History, ShieldCheck, Zap, ArrowDownLeft, Coins } from 'lucide-react';
import { formatBC } from '../utils/currency';
import { formatDistanceToNow } from 'date-fns';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

const TYPE_META = {
  topup:        { label: 'Wallet Top-up',       color: 'text-green-600',  sign: '+', icon: ArrowDownLeft },
  boost:        { label: 'Listing Boost',        color: 'text-amber-600',  sign: '-', icon: Zap },
  verification: { label: 'Account Verification', color: 'text-blue-600',  sign: '-', icon: ShieldCheck },
  escrow:       { label: 'Escrow Fee',           color: 'text-gray-600',   sign: '-', icon: WalletIcon },
  fee:          { label: 'Platform Fee',         color: 'text-gray-600',   sign: '-', icon: WalletIcon },
};

const STATUS_VARIANTS = { success: 'success', failed: 'danger', pending: 'warning' };

export default function Wallet() {
  const { user, refreshUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount]     = useState('');

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
        if (dest) {
          navigate(dest);
        } else {
          window.history.replaceState({}, '', '/wallet');
        }
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

  // Prefer the fresh API value over the potentially stale auth store cache
  const walletBalance = data?.walletBalance ?? user?.walletBalance ?? 0;
  const finalAmount   = customAmount ? parseInt(customAmount) || 0 : selectedAmount;

  const balanceHero = (
    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 lg:p-8 text-white">
      <div className="flex items-center gap-2 mb-4 opacity-80">
        <Coins size={17} />
        <span className="text-sm font-medium">Barter Credits</span>
      </div>
      <p className="text-4xl lg:text-5xl font-display font-bold tracking-tight">
        {(walletBalance / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })} BC
      </p>
      <p className="text-sm opacity-70 mt-1">Available Barter Credits · 1 BC = ₦1</p>
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 mt-5">
        <div className="bg-white/10 rounded-2xl py-2.5 text-center">
          <p className="text-xs opacity-60">Swaps</p>
          <p className="font-bold text-sm">{user?.swapCount || 0}</p>
        </div>
        <div className="bg-white/10 rounded-2xl py-2.5 text-center">
          <p className="text-xs opacity-60">Credits</p>
          <p className="font-bold text-sm">{(user?.swapCredits || 0).toLocaleString()} BC</p>
        </div>
        <div className="bg-white/10 rounded-2xl py-2.5 text-center">
          <p className="text-xs opacity-60">Rating</p>
          <p className="font-bold text-sm">⭐ {user?.ratingAvg?.toFixed(1) || '—'}</p>
        </div>
        <div className="hidden lg:block bg-white/10 rounded-2xl py-2.5 text-center">
          <p className="text-xs opacity-60">Status</p>
          <p className="font-bold text-sm capitalize">{user?.verification || 'Unverified'}</p>
        </div>
        <div className="hidden lg:block bg-white/10 rounded-2xl py-2.5 text-center">
          <p className="text-xs opacity-60">Listings</p>
          <p className="font-bold text-sm">{user?.listingCount || 0}</p>
        </div>
      </div>
    </div>
  );

  const hintBanner = walletBalance < 100000 && (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex gap-3">
      <div className="text-blue-500 text-xl flex-none">💡</div>
      <p className="text-xs text-blue-700">
        Add Barter Credits to <span className="font-semibold">verify your account (1,000 BC)</span> or
        {' '}<span className="font-semibold">boost a listing (from 500 BC)</span>.
      </p>
    </div>
  );

  const topupCard = (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Coins size={16} className="text-primary" />
        <h2 className="font-display font-semibold">Add Barter Credits</h2>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {PRESET_AMOUNTS.map(amt => (
          <button
            key={amt}
            onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
            className={`py-2.5 rounded-xl text-sm font-semibold transition border-2 ${
              selectedAmount === amt && !customAmount
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            {amt.toLocaleString()} BC
          </button>
        ))}
      </div>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">BC</span>
        <input
          type="number"
          min="100"
          placeholder="Custom amount"
          value={customAmount}
          onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
          className="input-field pl-10"
        />
      </div>
      <Button
        fullWidth
        size="lg"
        loading={topupMutation.isPending}
        disabled={finalAmount < 100}
        onClick={() => topupMutation.mutate()}
      >
        <Plus size={18} />
        Add {finalAmount > 0 ? `${finalAmount.toLocaleString()} BC` : '—'} via Paystack
      </Button>
      <p className="text-xs text-center text-gray-400">1 BC = ₦1 · Secured by Paystack · Instant credit</p>
    </div>
  );

  const quickActions = (
    <div className="grid grid-cols-2 gap-3">
      <a href="/verify-account" className="card flex flex-col items-center gap-2 py-4 hover:border-primary hover:border transition cursor-pointer">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <ShieldCheck size={18} className="text-blue-600" />
        </div>
        <p className="font-semibold text-sm text-center">Get Verified</p>
        <p className="text-xs text-gray-500">1,000 BC from wallet</p>
      </a>
      <a href="/swaps" className="card flex flex-col items-center gap-2 py-4 hover:border-primary hover:border transition cursor-pointer">
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
          <Zap size={18} className="text-amber-600" />
        </div>
        <p className="font-semibold text-sm text-center">Boost Listing</p>
        <p className="text-xs text-gray-500">from 500 BC</p>
      </a>
    </div>
  );

  const txHistoryItems = isLoading ? (
    <div className="flex justify-center py-8"><Spinner /></div>
  ) : !data?.payments?.length ? (
    <div className="text-center py-8 text-gray-400">
      <WalletIcon size={32} className="mx-auto mb-2 opacity-30" />
      <p className="text-sm">No transactions yet</p>
      <p className="text-xs mt-1">Add Barter Credits to get started</p>
    </div>
  ) : (
    <div className="space-y-2">
      {data.payments.map(p => {
        const isRefund = p.status === 'refunded';
        const isCredit = p.paymentType === 'topup' || isRefund;
        const baseMeta = TYPE_META[p.paymentType] || { label: p.paymentType, color: 'text-gray-600', icon: WalletIcon };
        const escrowTypeLabel = {
          escrow_deposit:           'Escrow Deposit',
          escrow_completion_refund: 'Escrow Refund',
          escrow_cancelled_refund:  'Escrow Cancelled — Refund',
          topup_paid:               'Value Gap Top-up',
          topup_released:           'Top-up Released',
          topup_cancelled_refund:   'Top-up Refund',
        }[p.meta?.type];
        const label = p.paymentType === 'escrow'
          ? (escrowTypeLabel || (isRefund ? 'Escrow Refund' : 'Escrow Deposit'))
          : baseMeta.label;
        const Icon  = baseMeta.icon;
        const sign  = isCredit ? '+' : '-';
        return (
          <div key={p.id} className="card flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-none ${isCredit ? 'bg-green-50' : 'bg-gray-50'}`}>
              <Icon size={16} className={isCredit ? 'text-green-600' : baseMeta.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {label}
                {p.listingId?.title && <span className="text-gray-400 font-normal"> · {p.listingId.title}</span>}
              </p>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="text-right flex-none">
              <p className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-gray-700'}`}>
                {sign}{formatBC(p.amountKobo)}
              </p>
              <Badge variant={STATUS_VARIANTS[p.status] || 'default'} size="sm">
                {p.status}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Barter Credits" showBack />

      {/* ── Mobile layout ── */}
      <div className="lg:hidden px-4 py-4 space-y-5">
        {balanceHero}
        {hintBanner}
        {topupCard}
        {quickActions}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <History size={16} />
            <h2 className="font-semibold">Transaction History</h2>
          </div>
          {txHistoryItems}
        </section>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex lg:flex-col lg:h-[calc(100vh-64px)] bg-slate-50">

        {/* ── Hero bar ── */}
        <div className="relative bg-[#0c0c0f] text-white overflow-hidden flex-none">
          {/* subtle radial glow */}
          <div className="pointer-events-none absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 right-40 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl" />

          <div className="relative flex items-center justify-between px-10 py-8 gap-10">
            {/* Balance */}
            <div className="flex-none">
              <p className="text-xs font-medium tracking-widest uppercase text-white/40 mb-2">Available Balance</p>
              <div className="flex items-end gap-3">
                <span className="text-6xl font-display font-bold tracking-tight leading-none">
                  {(walletBalance / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-2xl font-semibold text-white/50 mb-1">BC</span>
              </div>
              <p className="text-xs text-white/30 mt-2">Barter Credits · 1 BC = ₦1</p>
            </div>

            {/* Divider */}
            <div className="w-px self-stretch bg-white/10 flex-none" />

            {/* Stats row */}
            <div className="flex items-center gap-4 flex-1 flex-wrap">
              {[
                { label: 'Total Swaps',   value: user?.swapCount   || 0 },
                { label: 'Swap Credits',  value: `${(user?.swapCredits || 0).toLocaleString()} BC` },
                { label: 'Rating',        value: user?.ratingAvg ? `${user.ratingAvg.toFixed(1)} ★` : '—' },
                { label: 'Listings',      value: user?.listingCount || 0 },
                { label: 'Status',        value: user?.verification || 'Unverified', capitalize: true },
              ].map(({ label, value, capitalize }) => (
                <div key={label} className="flex flex-col gap-1 min-w-[80px]">
                  <p className="text-[11px] text-white/35 uppercase tracking-wider">{label}</p>
                  <p className={`text-base font-bold text-white/90 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-3 flex-none">
              <a href="/verify-account"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 hover:bg-white/14 transition text-sm font-medium text-white/80 hover:text-white">
                <ShieldCheck size={15} />
                Verify Account
              </a>
              <a href="/swaps"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 transition text-sm font-semibold text-white">
                <Zap size={15} />
                Boost Listing
              </a>
            </div>
          </div>
        </div>

        {/* ── Content area ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — Top-up panel */}
          <div className="w-[420px] flex-none bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
            <div className="p-8 flex flex-col gap-6 flex-1">
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">Add Barter Credits</h2>
                <p className="text-sm text-gray-400 mt-0.5">Instantly top up via Paystack</p>
              </div>

              {walletBalance < 100000 && (
                <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                  <span className="text-lg flex-none">💡</span>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    You need credits to{' '}
                    <span className="font-semibold">verify your account (1,000 BC)</span> or{' '}
                    <span className="font-semibold">boost a listing (from 500 BC)</span>.
                  </p>
                </div>
              )}

              {/* Preset amounts */}
              <div className="grid grid-cols-2 gap-2.5">
                {PRESET_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                    className={`py-4 rounded-2xl text-sm font-bold transition-all ${
                      selectedAmount === amt && !customAmount
                        ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                    }`}
                  >
                    <span className="block text-lg">{amt.toLocaleString()}</span>
                    <span className="block text-xs opacity-60 font-medium mt-0.5">Barter Credits</span>
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Custom Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">BC</span>
                  <input
                    type="number"
                    min="100"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                    className="w-full pl-16 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <Button
                  fullWidth
                  size="lg"
                  loading={topupMutation.isPending}
                  disabled={finalAmount < 100}
                  onClick={() => topupMutation.mutate()}
                >
                  <Plus size={18} />
                  Add {finalAmount > 0 ? `${finalAmount.toLocaleString()} BC` : '—'} via Paystack
                </Button>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-300">
                  <span>🔒 Secured by Paystack</span>
                  <span>·</span>
                  <span>Instant credit</span>
                  <span>·</span>
                  <span>1 BC = ₦1</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Transaction history */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-50 flex-none">
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">Transaction History</h2>
                <p className="text-sm text-gray-400 mt-0.5">{data?.payments?.length || 0} transactions</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                <History size={12} />
                Last 30
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-4">
              {isLoading ? (
                <div className="flex justify-center py-16"><Spinner /></div>
              ) : !data?.payments?.length ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 text-gray-300">
                  <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                    <WalletIcon size={28} className="opacity-40" />
                  </div>
                  <p className="font-semibold text-gray-400">No transactions yet</p>
                  <p className="text-sm mt-1">Add Barter Credits to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.payments.map(p => {
                    const isRefund = p.status === 'refunded';
                    const isCredit = p.paymentType === 'topup' || isRefund;
                    const baseMeta = TYPE_META[p.paymentType] || { label: p.paymentType, color: 'text-gray-600', icon: WalletIcon };
                    const escrowTypeLabel = {
                      escrow_deposit:           'Escrow Deposit',
                      escrow_completion_refund: 'Escrow Refund',
                      escrow_cancelled_refund:  'Escrow Cancelled — Refund',
                      topup_paid:               'Value Gap Top-up',
                      topup_released:           'Top-up Released',
                      topup_cancelled_refund:   'Top-up Refund',
                    }[p.meta?.type];
                    const label = p.paymentType === 'escrow'
                      ? (escrowTypeLabel || (isRefund ? 'Escrow Refund' : 'Escrow Deposit'))
                      : baseMeta.label;
                    const Icon = baseMeta.icon;
                    const sign = isCredit ? '+' : '-';
                    return (
                      <div key={p.id} className="flex items-center gap-4 py-3.5 hover:bg-gray-50/60 -mx-2 px-2 rounded-xl transition-colors">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-none ${isCredit ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                          <Icon size={16} className={isCredit ? 'text-emerald-600' : baseMeta.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800">
                            {label}
                            {p.listingId?.title && (
                              <span className="font-normal text-gray-400"> · {p.listingId.title}</span>
                            )}
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
