import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getMySwaps, respondToSwap, setMeetup, payEscrowDeposit,
  confirmSwap, disputeSwap, getEscrowInfo, payTopUp,
} from '../api/swaps.api';
import { formatBC } from '../utils/currency';
import { useAuthStore } from '../store/auth.store';
import SwapCard from '../components/features/swap/SwapCard';
import SwapStatus from '../components/features/swap/SwapStatus';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import {
  MapPin, Shield, CheckCircle2, AlertTriangle,
  ShieldCheck, Clock, Info, ArrowLeftRight, Coins,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const TABS = [
  { value: '',           label: 'All' },
  { value: 'proposed',   label: 'Pending' },
  { value: 'accepted',   label: 'Accepted' },
  { value: 'in_escrow',  label: 'In Escrow' },
  { value: 'meetup_set', label: 'Meetup' },
  { value: 'completed',  label: 'Done' },
];

const SWAP_TYPE_LABELS = {
  goods_for_goods:    { label: 'Goods \u2194 Goods',     icon: '📦' },
  goods_for_service:  { label: 'Goods \u2194 Service',   icon: '🔧' },
  service_for_goods:  { label: 'Service \u2194 Goods',   icon: '🔧' },
  service_for_service:{ label: 'Service \u2194 Service', icon: '🤝' },
};

// ─── Escrow status panel ──────────────────────────────────────────────────────
function EscrowPanel({ swap, userId, onPayDeposit, paying }) {
  const isInitiator = swap.initiatorId?.id === userId;

  const myPaid    = isInitiator ? swap.initiatorDepositPaid : swap.receiverDepositPaid;
  const theirPaid = isInitiator ? swap.receiverDepositPaid  : swap.initiatorDepositPaid;
  const otherName = isInitiator
    ? swap.receiverId?.fullName  || 'Other party'
    : swap.initiatorId?.fullName || 'Other party';

  const depositKobo    = swap.escrowDepositKobo || 100000;
  const platformFeeKobo = Math.round(depositKobo * 0.02);
  const refundKobo     = depositKobo - platformFeeKobo;

  const depositBC      = formatBC(depositKobo);
  const refundBC       = formatBC(refundKobo);
  const platformFeeBC  = formatBC(platformFeeKobo);

  if (swap.status === 'in_escrow') {
    return (
      <div className="mt-3 bg-green-50 border border-green-200 rounded-2xl p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-green-600" />
          <p className="text-xs font-semibold text-green-700">Escrow Active — Both deposits secured</p>
        </div>
        <p className="text-xs text-green-600">
          {refundBC} will be refunded to each party on completion.
          SwapNaija keeps {platformFeeBC} per party as a protection fee.
        </p>
      </div>
    );
  }

  if (swap.status !== 'accepted') return null;

  return (
    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-2xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Shield size={14} className="text-blue-600" />
        <p className="text-xs font-semibold text-blue-700">Escrow Protection — {depositBC} per party</p>
      </div>
      <p className="text-xs text-blue-600 leading-relaxed">
        Both parties deposit {depositBC} in Barter Credits. Swap completes → you get {refundBC} back.
        No-show or dispute → SwapNaija mediates and can penalise the bad actor.
      </p>

      <div className="flex gap-2 pt-1">
        <div className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-medium ${myPaid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {myPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          You
        </div>
        <div className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-medium ${theirPaid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {theirPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          {otherName.split(' ')[0]}
        </div>
      </div>

      {!myPaid && (
        <Button fullWidth size="sm" loading={paying} onClick={onPayDeposit}>
          <Shield size={14} />
          Pay {depositBC} Escrow Deposit
        </Button>
      )}
      {myPaid && !theirPaid && (
        <p className="text-xs text-center text-gray-500 pt-0.5">Waiting for {otherName.split(' ')[0]} to pay their deposit...</p>
      )}
    </div>
  );
}

// ─── Top-up panel (value gap Barter Credits) ──────────────────────────────────
function TopUpPanel({ swap, userId, onPayTopUp, paying }) {
  if (!swap.topUpAmountKobo || swap.topUpAmountKobo <= 0 || swap.topUpPayerRole === 'none') return null;
  if (!['accepted', 'in_escrow'].includes(swap.status)) return null;

  const isInitiator = swap.initiatorId?.id === userId;
  const myRole      = isInitiator ? 'initiator' : 'receiver';
  const amIThePayer = swap.topUpPayerRole === myRole;
  const otherName   = isInitiator
    ? swap.receiverId?.fullName  || 'Other party'
    : swap.initiatorId?.fullName || 'Other party';

  const amountBC = formatBC(swap.topUpAmountKobo);

  if (swap.topUpPaid) {
    return (
      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2">
        <CheckCircle2 size={14} className="text-amber-600 flex-none" />
        <p className="text-xs text-amber-800">
          Value gap top-up of <span className="font-semibold">{amountBC}</span> paid and held in escrow.
          Released to the other party on swap completion.
        </p>
      </div>
    );
  }

  if (amIThePayer) {
    return (
      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Coins size={14} className="text-amber-600" />
          <p className="text-xs font-semibold text-amber-800">Value Gap Top-Up Required</p>
        </div>
        <p className="text-xs text-amber-700">
          Your item is worth less than the other party's. Pay <span className="font-bold">{amountBC}</span> from your Barter Credits.
          This is held in escrow and transferred to them on swap completion.
        </p>
        <Button fullWidth size="sm" loading={paying} onClick={() => onPayTopUp(swap.id)}
          className="bg-amber-500 hover:bg-amber-600 text-white">
          <Coins size={13} />
          Pay {amountBC} Top-Up
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 bg-amber-50 border border-amber-100 rounded-2xl p-3 flex items-center gap-2">
      <Clock size={13} className="text-amber-500 flex-none" />
      <p className="text-xs text-amber-700">
        Waiting for {otherName.split(' ')[0]} to pay the <span className="font-semibold">{amountBC}</span> value-gap top-up.
      </p>
    </div>
  );
}

// ─── Confirmation status ──────────────────────────────────────────────────────
function ConfirmPanel({ swap, userId }) {
  const isInitiator    = swap.initiatorId?.id === userId;
  const myConfirmed    = isInitiator ? swap.initiatorConfirmed : swap.receiverConfirmed;
  const theirName      = isInitiator ? swap.receiverId?.fullName : swap.initiatorId?.fullName;
  const theirConfirmed = isInitiator ? swap.receiverConfirmed : swap.initiatorConfirmed;

  if (!myConfirmed && !theirConfirmed) return null;

  return (
    <div className="mt-2 flex gap-2">
      <div className={`flex-1 text-center text-xs px-2 py-1.5 rounded-xl font-medium ${myConfirmed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
        {myConfirmed ? '✓ You confirmed' : 'You: pending'}
      </div>
      <div className={`flex-1 text-center text-xs px-2 py-1.5 rounded-xl font-medium ${theirConfirmed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
        {theirConfirmed ? `✓ ${(theirName || 'Them').split(' ')[0]} confirmed` : `${(theirName || 'Them').split(' ')[0]}: pending`}
      </div>
    </div>
  );
}

// ─── Swap detail body — shared by mobile inline and desktop right panel ───────
function SwapDetail({ swap, user, escrowInfo, escrowMutation, confirmMutation, respondMutation, topUpMutation, onAction, isDesktop }) {
  const swapTypeMeta = SWAP_TYPE_LABELS[swap.swapType] || SWAP_TYPE_LABELS.goods_for_goods;
  const isInvolved   = swap.initiatorId?.id === user?.id || swap.receiverId?.id === user?.id;

  const getActions = () => {
    const isInitiator = swap.initiatorId?.id === user?.id;
    const isReceiver  = swap.receiverId?.id  === user?.id;
    const actions = [];
    if (swap.status === 'proposed') {
      if (isReceiver) actions.push({ label: 'Accept', action: 'accept', variant: 'primary' });
      actions.push({ label: 'Decline', action: 'cancel', variant: 'secondary' });
    }
    if (swap.status === 'accepted') {
      actions.push({ label: 'Set Meetup', action: 'meetup', variant: 'primary' });
      actions.push({ label: 'Cancel', action: 'cancel', variant: 'secondary' });
    }
    if (['meetup_set', 'in_escrow'].includes(swap.status)) {
      const myConfirmed = isInitiator ? swap.initiatorConfirmed : swap.receiverConfirmed;
      if (!myConfirmed) actions.push({ label: 'Confirm Receipt', action: 'confirm', variant: 'primary' });
      actions.push({ label: 'Dispute', action: 'dispute', variant: 'danger' });
    }
    if (swap.status === 'in_escrow') {
      actions.push({ label: 'Set Meetup', action: 'meetup', variant: 'secondary' });
    }
    return actions;
  };

  const actions = getActions();

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <SwapStatus status={swap.status} />
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
            {swapTypeMeta.icon} {swapTypeMeta.label}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(swap.updatedAt).toLocaleDateString('en-NG')}
        </span>
      </div>

      <SwapCard swap={swap} currentUserId={user?.id} />

      {/* Meetup info */}
      {swap.meetupLocation && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
          <MapPin size={12} className="flex-none" />
          <span className="truncate">{swap.meetupLocation}</span>
          {swap.meetupScheduled && (
            <span className="flex-none text-gray-400 ml-auto">
              {new Date(swap.meetupScheduled).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      {/* Proposal note */}
      {swap.proposalNote && (
        <p className="text-xs text-gray-500 italic px-1">"{swap.proposalNote}"</p>
      )}

      {/* Dispute info */}
      {swap.status === 'disputed' && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 space-y-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-red-500" />
            <p className="text-xs font-semibold text-red-700">Dispute under review</p>
          </div>
          <p className="text-xs text-red-600">{swap.disputeReason}</p>
          <p className="text-xs text-gray-400">SwapNaija team will contact both parties within 24 hours. Escrow funds are frozen.</p>
        </div>
      )}

      {/* Escrow panel (accepted swaps) */}
      {isInvolved && swap.status === 'accepted' && (
        <EscrowPanel
          swap={swap}
          userId={user?.id}
          paying={escrowMutation.isPending}
          onPayDeposit={() => escrowMutation.mutate(swap.id)}
        />
      )}

      {/* Active escrow badge */}
      {swap.status === 'in_escrow' && (
        <EscrowPanel
          swap={swap}
          userId={user?.id}
        />
      )}

      {/* Value-gap top-up panel */}
      {isInvolved && (
        <TopUpPanel
          swap={swap}
          userId={user?.id}
          paying={topUpMutation?.isPending}
          onPayTopUp={(id) => topUpMutation?.mutate(id)}
        />
      )}

      {/* Confirmation status */}
      {['meetup_set', 'in_escrow'].includes(swap.status) && (
        <ConfirmPanel swap={swap} userId={user?.id} />
      )}

      {/* Completed escrow refund note */}
      {swap.status === 'completed' && swap.escrowActive && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex items-center gap-2">
          <ShieldCheck size={13} className="text-green-600 flex-none" />
          <p className="text-xs text-green-700">
            Escrow deposit refunded — {formatBC(Math.round((swap.escrowDepositKobo || 100000) * 0.98))} returned to your Barter Credits.
          </p>
        </div>
      )}

      {/* Action buttons */}
      {actions.length > 0 && (
        <div className="flex gap-2 pt-1 flex-wrap">
          {actions.map(a => (
            <Button
              key={a.action}
              variant={a.variant}
              size="sm"
              onClick={() => onAction(swap, a.action)}
              loading={
                (respondMutation.isPending && (a.action === 'accept' || a.action === 'cancel')) ||
                (confirmMutation.isPending && a.action === 'confirm')
              }
            >
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MySwaps() {
  const { user, refreshUser } = useAuthStore();
  const [tab, setTab]               = useState('');
  const [page, setPage]             = useState(1);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [activeSwap, setActiveSwap] = useState(null);
  const [meetupForm, setMeetupForm] = useState({ location: '', date: '' });
  const [disputeReason, setDisputeReason] = useState('');
  const [modal, setModal]           = useState(null); // 'meetup' | 'dispute'
  const qc = useQueryClient();

  const { data: swapData, isLoading } = useQuery({
    queryKey: ['swaps', tab, page],
    queryFn: () => getMySwaps(tab || undefined, page),
    keepPreviousData: true,
  });

  const swaps      = swapData?.swaps      ?? [];
  const total      = swapData?.total      ?? 0;
  const totalPages = swapData?.totalPages ?? 1;

  const { data: escrowInfo } = useQuery({
    queryKey: ['escrow-info'],
    queryFn: getEscrowInfo,
    staleTime: Infinity,
  });

  // Keep activeSwap in sync whenever the swaps list refreshes after a mutation
  useEffect(() => {
    if (!activeSwap || !swaps.length) return;
    const fresh = swaps.find(s => s.id === activeSwap.id);
    if (fresh) setActiveSwap(fresh);
  }, [swaps]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalidate = () => qc.invalidateQueries({ queryKey: ['swaps'] });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }) => respondToSwap(id, action),
    onSuccess: (updatedSwap) => {
      toast.success('Updated!');
      if (activeSwap?.id === updatedSwap.id) setActiveSwap(updatedSwap);
      invalidate();
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const meetupMutation = useMutation({
    mutationFn: ({ id, data }) => setMeetup(id, data),
    onSuccess: (updatedSwap) => {
      toast.success('Meetup set!');
      if (activeSwap?.id === updatedSwap.id) setActiveSwap(updatedSwap);
      invalidate();
      setModal(null);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const escrowMutation = useMutation({
    mutationFn: (id) => payEscrowDeposit(id),
    onSuccess: (updatedSwap) => {
      toast.success(updatedSwap.status === 'in_escrow'
        ? '🛡️ Escrow active! Both deposits secured.'
        : 'Deposit paid! Waiting for the other party.');
      if (activeSwap?.id === updatedSwap.id) setActiveSwap(updatedSwap);
      invalidate();
      qc.invalidateQueries({ queryKey: ['payment-history'] });
      refreshUser();
    },
    onError: (e) => {
      const msg = e.response?.data?.error || 'Error';
      if (msg.toLowerCase().includes('insufficient')) {
        toast.error(msg + ' Go to Wallet to top up.');
      } else {
        toast.error(msg);
      }
    },
  });

  const confirmMutation = useMutation({
    mutationFn: confirmSwap,
    onSuccess: (updatedSwap) => {
      if (updatedSwap.status === 'completed') {
        toast.success('🎉 Swap completed! Escrow refund added to your Barter Credits.');
        qc.invalidateQueries({ queryKey: ['payment-history'] });
        refreshUser();
      } else {
        toast.success('Confirmed! Waiting for the other party.');
      }
      if (activeSwap?.id === updatedSwap.id) setActiveSwap(updatedSwap);
      invalidate();
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const topUpMutation = useMutation({
    mutationFn: (id) => payTopUp(id),
    onSuccess: (updatedSwap) => {
      toast.success('Top-up paid! Barter Credits held in escrow.');
      if (activeSwap?.id === updatedSwap.id) setActiveSwap(updatedSwap);
      invalidate();
      qc.invalidateQueries({ queryKey: ['payment-history'] });
      refreshUser();
    },
    onError: (e) => {
      const msg = e.response?.data?.error || 'Error';
      if (msg.toLowerCase().includes('insufficient')) {
        toast.error(msg + ' Go to Wallet to top up your Barter Credits.');
      } else {
        toast.error(msg);
      }
    },
  });

  const disputeMutation = useMutation({
    mutationFn: ({ id, reason }) => disputeSwap(id, reason),
    onSuccess: () => {
      toast.success('Dispute raised. SwapNaija team will review within 24h.');
      invalidate();
      setModal(null);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const handleAction = (swap, action) => {
    if (action === 'meetup')  { setSelectedSwap(swap); setModal('meetup');  return; }
    if (action === 'dispute') { setSelectedSwap(swap); setModal('dispute'); return; }
    if (action === 'accept')  respondMutation.mutate({ id: swap.id, action: 'accept' });
    if (action === 'cancel')  respondMutation.mutate({ id: swap.id, action: 'cancel' });
    if (action === 'confirm') confirmMutation.mutate(swap.id);
  };

  const sharedDetailProps = {
    user,
    escrowInfo,
    escrowMutation,
    confirmMutation,
    respondMutation,
    topUpMutation,
    onAction: handleAction,
  };

  // Tab strip used in both mobile header area and desktop header
  const TabStrip = ({ className = '' }) => (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide ${className}`}>
      {TABS.map(t => (
        <button
          key={t.value}
          onClick={() => { setTab(t.value); setPage(1); setActiveSwap(null); }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
            tab === t.value ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-bg min-h-screen">

      {/* ── Desktop page header (hidden on mobile) ── */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-8 mb-6">
        <h1 className="text-2xl font-display font-bold text-ink">My Swaps</h1>
        <TabStrip />
      </div>

      {/* ── Mobile tab strip ── */}
      <div className="lg:hidden px-4 pt-14 pb-2">
        <TabStrip />
      </div>

      {/* ── Body ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : !swaps.length ? (
        <div className="text-center py-20 text-gray-400 px-4">
          <p className="text-5xl mb-3">🤝</p>
          <p className="text-base font-medium text-gray-500">No swaps yet</p>
          <p className="text-sm mt-1 text-gray-400">When you propose or receive a swap, it'll show up here.</p>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[380px_1fr] lg:gap-0 lg:h-[calc(100vh-80px)]">

          {/* ── Left panel: swap list ── */}
          <div className="lg:border-r lg:border-gray-100 lg:flex lg:flex-col lg:overflow-hidden">

            {/* Mobile: full-detail cards */}
            <div className="lg:hidden px-4 pb-4 space-y-3">
              {swaps.map(swap => (
                <div key={swap.id} className="card space-y-2">
                  <SwapDetail swap={swap} {...sharedDetailProps} isDesktop={false} />
                </div>
              ))}

              {/* Mobile pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 pb-4">
                  <button
                    onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={15} /> Prev
                  </button>
                  <span className="text-xs text-gray-500">
                    Page {page} of {totalPages} · {total} swaps
                  </span>
                  <button
                    onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Desktop: compact clickable rows */}
            <div className="hidden lg:flex lg:flex-col lg:h-full">
              <div className="flex-1 overflow-y-auto">
                {swaps.map(swap => {
                  const swapTypeMeta = SWAP_TYPE_LABELS[swap.swapType] || SWAP_TYPE_LABELS.goods_for_goods;
                  const isActive = activeSwap?.id === swap.id;

                  return (
                    <button
                      key={swap.id}
                      onClick={() => setActiveSwap(isActive ? null : swap)}
                      className={`w-full text-left px-5 py-4 flex items-start gap-3 transition border-l-2 border-b border-b-gray-50 hover:bg-gray-50/60 ${
                        isActive
                          ? 'border-l-primary bg-primary/5'
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <SwapStatus status={swap.status} />
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {swapTypeMeta.icon} {swapTypeMeta.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-ink truncate">
                          {swap.initiatorId?.fullName} ↔ {swap.receiverId?.fullName}
                        </p>
                        {swap.meetupLocation && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                            <MapPin size={10} className="flex-none" />
                            {swap.meetupLocation}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-none pt-0.5">
                        {new Date(swap.updatedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Desktop pagination — pinned to bottom of left panel */}
              {totalPages > 1 && (
                <div className="flex-none border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-white">
                  <span className="text-xs text-gray-400">
                    {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setPage(p => p - 1); setActiveSwap(null); }}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                      .reduce((acc, n, i, arr) => {
                        if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                        acc.push(n);
                        return acc;
                      }, [])
                      .map((n, i) =>
                        n === '…' ? (
                          <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">…</span>
                        ) : (
                          <button
                            key={n}
                            onClick={() => { setPage(n); setActiveSwap(null); }}
                            className={`w-7 h-7 rounded-lg text-xs font-medium transition ${
                              page === n
                                ? 'bg-primary text-white'
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            {n}
                          </button>
                        )
                      )}
                    <button
                      onClick={() => { setPage(p => p + 1); setActiveSwap(null); }}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel: swap detail (desktop only) ── */}
          <div className="hidden lg:block lg:overflow-y-auto lg:p-8 lg:h-full">
            {activeSwap ? (
              <div className="max-w-2xl space-y-4">
                {/* Swap type heading */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <span className="text-3xl">
                    {(SWAP_TYPE_LABELS[activeSwap.swapType] || SWAP_TYPE_LABELS.goods_for_goods).icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink font-display">
                      {(SWAP_TYPE_LABELS[activeSwap.swapType] || SWAP_TYPE_LABELS.goods_for_goods).label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(activeSwap.updatedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <SwapStatus status={activeSwap.status} />
                </div>

                {/* Both parties side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-gray-400 mb-1">Initiator</p>
                    <p className="text-sm font-semibold text-ink">{activeSwap.initiatorId?.fullName || '—'}</p>
                    {activeSwap.initiatorId?.locationState && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin size={10} />{activeSwap.initiatorId.locationState}
                      </p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-gray-400 mb-1">Receiver</p>
                    <p className="text-sm font-semibold text-ink">{activeSwap.receiverId?.fullName || '—'}</p>
                    {activeSwap.receiverId?.locationState && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin size={10} />{activeSwap.receiverId.locationState}
                      </p>
                    )}
                  </div>
                </div>

                <div className="card">
                  <SwapDetail swap={activeSwap} {...sharedDetailProps} isDesktop={true} />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-24">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <ArrowLeftRight size={28} className="text-gray-300" />
                </div>
                <p className="text-base font-medium text-gray-500">No swap selected</p>
                <p className="text-sm mt-1 text-gray-400">Click a swap on the left to view its details</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Meetup Modal */}
      <Modal isOpen={modal === 'meetup'} onClose={() => setModal(null)} title="Set Meetup Details">
        <div className="space-y-4">
          {selectedSwap?.escrowActive && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-start gap-2">
              <ShieldCheck size={15} className="text-green-600 flex-none mt-0.5" />
              <p className="text-xs text-green-700">Escrow is active. Both deposits are secured. Confirm receipt after the exchange.</p>
            </div>
          )}
          <Input
            label="Meetup Location"
            placeholder="e.g. Lagos Island, near Access Bank"
            value={meetupForm.location}
            onChange={(e) => setMeetupForm(p => ({ ...p, location: e.target.value }))}
          />
          <Input
            label="Date & Time"
            type="datetime-local"
            value={meetupForm.date}
            onChange={(e) => setMeetupForm(p => ({ ...p, date: e.target.value }))}
          />
          <Button
            fullWidth
            loading={meetupMutation.isPending}
            disabled={!meetupForm.location || !meetupForm.date}
            onClick={() => meetupMutation.mutate({
              id: selectedSwap?.id,
              data: {
                meetupLocation: meetupForm.location,
                meetupScheduled: new Date(meetupForm.date).toISOString(),
              },
            })}
          >
            Confirm Meetup
          </Button>
        </div>
      </Modal>

      {/* Dispute Modal */}
      <Modal isOpen={modal === 'dispute'} onClose={() => setModal(null)} title="Raise a Dispute">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Info size={14} className="text-amber-600" />
              <p className="text-xs font-semibold text-amber-700">Before raising a dispute</p>
            </div>
            <p className="text-xs text-amber-600">
              Try messaging the other party first. If you raise a dispute, all escrow funds are frozen and
              SwapNaija will review within 24 hours. The party found at fault may lose their deposit.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Describe the issue</label>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="What went wrong? e.g. Item was not as described, other party didn't show up..."
              rows={4}
              className="input-field resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{disputeReason.length}/1000 · min 10 characters</p>
          </div>
          <Button
            fullWidth
            variant="danger"
            loading={disputeMutation.isPending}
            disabled={disputeReason.length < 10}
            onClick={() => disputeMutation.mutate({ id: selectedSwap?.id, reason: disputeReason })}
          >
            <AlertTriangle size={16} />
            Submit Dispute
          </Button>
        </div>
      </Modal>
    </div>
  );
}
