import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
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
        window.history.replaceState({}, '', '/wallet');
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
        window.location.href = result.authorizationUrl;
      } else {
        refreshUser();
        queryClient.invalidateQueries(['payment-history']);
        toast.success('Wallet topped up (mock mode)!');
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Top-up failed'),
  });

  const walletBalance = user?.walletBalance ?? data?.walletBalance ?? 0;
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
        const meta = TYPE_META[p.paymentType] || { label: p.paymentType, color: 'text-gray-600', sign: '-', icon: WalletIcon };
        const Icon = meta.icon;
        const isCredit = p.paymentType === 'topup';
        return (
          <div key={p.id} className="card flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-none ${isCredit ? 'bg-green-50' : 'bg-gray-50'}`}>
              <Icon size={16} className={meta.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {meta.label}
                {p.listingId?.title && <span className="text-gray-400 font-normal"> · {p.listingId.title}</span>}
              </p>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="text-right flex-none">
              <p className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-gray-700'}`}>
                {meta.sign}{formatBC(p.amountKobo)}
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
      <div className="lg:hidden max-w-md mx-auto px-4 py-4 space-y-5">
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
      <div className="hidden lg:block lg:max-w-5xl mx-auto lg:py-8 px-8 space-y-6">
        {balanceHero}
        {hintBanner}
        <div className="lg:grid lg:grid-cols-[1fr_420px] lg:gap-8 lg:items-start">
          {/* LEFT: top-up + quick actions */}
          <div className="space-y-4">
            {topupCard}
            {quickActions}
          </div>
          {/* RIGHT: transaction history — scrollable panel */}
          <div className="card flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <History size={16} className="text-gray-500" />
              <h2 className="font-display font-semibold">Transaction History</h2>
            </div>
            <div className="lg:max-h-[70vh] lg:overflow-y-auto space-y-2 pr-0.5">
              {txHistoryItems}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
