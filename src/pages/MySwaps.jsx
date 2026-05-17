import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getMySwaps, respondToSwap, setDeliveryAddress, submitShipment,
  payEscrowDeposit, confirmSwap, disputeSwap, getEscrowInfo, payTopUp,
} from '../api/swaps.api';
import { startConversation } from '../api/messages.api';
import { createReview } from '../api/reviews.api';
import { formatBC } from '../utils/currency';
import { useAuthStore } from '../store/auth.store';
import SwapCard from '../components/features/swap/SwapCard';
import SwapStatus from '../components/features/swap/SwapStatus';
import ReviewStars from '../components/features/review/ReviewStars';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import Avatar from '../components/ui/Avatar';
import {
  MapPin, Shield, CheckCircle2, AlertTriangle,
  ShieldCheck, Clock, Info, ArrowLeftRight, Coins,
  ChevronLeft, ChevronRight, MessageCircle, Star, Truck, Package,
} from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

const COURIERS = [
  { value: 'gig',      label: 'GIG Logistics' },
  { value: 'kwik',     label: 'Kwik Delivery' },
  { value: 'sendbox',  label: 'Sendbox' },
  { value: 'dhl',      label: 'DHL Nigeria' },
  { value: 'fedex',    label: 'FedEx Nigeria' },
  { value: 'nipost',   label: 'NIPOST' },
  { value: 'red_star', label: 'Red Star Express' },
  { value: 'chisco',   label: 'Chisco Transport' },
  { value: 'abc',      label: 'ABC Transport' },
  { value: 'other',    label: 'Other Courier' },
];

const TABS = [
  { value: '',          label: 'All' },
  { value: 'proposed',  label: 'Pending' },
  { value: 'accepted',  label: 'Accepted' },
  { value: 'in_escrow', label: 'In Escrow' },
  { value: 'shipped',   label: 'Shipped' },
  { value: 'disputed',  label: '⚖️ Disputed' },
  { value: 'completed', label: 'Done' },
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
function SwapDetail({ swap, user, escrowInfo, escrowMutation, confirmMutation, respondMutation, topUpMutation, messageMutation, onAction, onReview, isDesktop }) {
  const navigate     = useNavigate();
  const swapTypeMeta = SWAP_TYPE_LABELS[swap.swapType] || SWAP_TYPE_LABELS.goods_for_goods;
  const isInvolved   = swap.initiatorId?.id === user?.id || swap.receiverId?.id === user?.id;

  const getActions = () => {
    const isInitiator = swap.initiatorId?.id === user?.id;
    const isReceiver  = swap.receiverId?.id  === user?.id;
    const myParty     = isInitiator ? 'initiator' : 'receiver';
    const actions = [];
    if (swap.status === 'proposed') {
      if (isReceiver) actions.push({ label: 'Accept', action: 'accept', variant: 'primary' });
      actions.push({ label: 'Decline', action: 'cancel', variant: 'secondary' });
    }
    if (swap.status === 'accepted') {
      actions.push({ label: 'Cancel', action: 'cancel', variant: 'secondary' });
    }
    if (['accepted', 'in_escrow'].includes(swap.status)) {
      const myAddressSet = swap[`${myParty}AddressSet`];
      if (!myAddressSet) actions.push({ label: 'Set Delivery Address', action: 'address', variant: 'primary' });
    }
    if (swap.status === 'in_escrow') {
      const myShipped = swap[`${myParty}Shipped`];
      if (!myShipped) actions.push({ label: 'Submit Shipment Info', action: 'shipment', variant: 'primary' });
    }
    if (['in_escrow', 'shipped'].includes(swap.status)) {
      const myConfirmed = isInitiator ? swap.initiatorConfirmed : swap.receiverConfirmed;
      if (!myConfirmed) actions.push({ label: 'Confirm Receipt', action: 'confirm', variant: 'primary' });
      actions.push({ label: 'Dispute', action: 'dispute', variant: 'danger' });
    }
    return actions;
  };

  const actions = getActions();
  const otherId   = swap.initiatorId?.id === user?.id ? swap.receiverId?.id : swap.initiatorId?.id;
  const otherUser = swap.initiatorId?.id === user?.id ? swap.receiverId    : swap.initiatorId;

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

      {/* Proposal note */}
      {swap.proposalNote && (
        <p className="text-xs text-gray-500 italic px-1">"{swap.proposalNote}"</p>
      )}

      {/* Dispute info */}
      {swap.status === 'disputed' && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-red-500" />
            <p className="text-xs font-semibold text-red-700">Dispute under mediation</p>
          </div>
          {swap.disputeReason && (
            <p className="text-xs text-red-600 italic">"{swap.disputeReason}"</p>
          )}
          <p className="text-xs text-gray-400">Escrow funds are frozen. ARIA AI mediator is presiding over this case.</p>
          <button
            onClick={() => navigate(`/dispute/${swap.id}`)}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors active:scale-95"
          >
            ⚖️ Enter Court Room
          </button>
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
        <EscrowPanel swap={swap} userId={user?.id} />
      )}

      {/* Delivery addresses */}
      {['accepted', 'in_escrow', 'shipped', 'completed'].includes(swap.status) && (
        <div className="mt-2 bg-gray-50 border border-gray-100 rounded-2xl p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
            <MapPin size={12} />
            Delivery Addresses
          </p>
          <div className="flex gap-2">
            {['initiator', 'receiver'].map(role => {
              const nameKey  = role === 'initiator' ? swap.initiatorId?.fullName : swap.receiverId?.fullName;
              const isSet    = swap[`${role}AddressSet`];
              const addr     = swap[`${role}Address`];
              return (
                <div key={role} className={`flex-1 rounded-xl p-2 text-xs ${isSet ? 'bg-green-50 border border-green-100' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle2 size={11} className={isSet ? 'text-green-600' : 'text-gray-300'} />
                    <span className={`font-medium ${isSet ? 'text-green-700' : 'text-gray-400'}`}>
                      {(nameKey || role).split(' ')[0]}
                    </span>
                  </div>
                  {addr && isSet && (
                    <p className="text-gray-500 leading-relaxed">{addr.addressLine1}, {addr.city}, {addr.state}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shipment tracking */}
      {['in_escrow', 'shipped', 'completed'].includes(swap.status) && (
        <div className="mt-2 bg-blue-50 border border-blue-100 rounded-2xl p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Truck size={12} />
            Shipment Tracking
          </p>
          <div className="flex gap-2">
            {['initiator', 'receiver'].map(role => {
              const shipped  = swap[`${role}Shipped`];
              const shipment = swap[`${role}Shipment`];
              const nameKey  = role === 'initiator' ? swap.initiatorId?.fullName : swap.receiverId?.fullName;
              return (
                <div key={role} className={`flex-1 rounded-xl p-2 text-xs ${shipped ? 'bg-green-50 border border-green-100' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle2 size={11} className={shipped ? 'text-green-600' : 'text-gray-300'} />
                    <span className={`font-medium ${shipped ? 'text-green-700' : 'text-gray-400'}`}>
                      {(nameKey || role).split(' ')[0]}
                    </span>
                  </div>
                  {shipment?.trackingNumber && (
                    <div className="space-y-0.5">
                      <p className="text-gray-600">{shipment.providerLabel}</p>
                      <p className="text-gray-500 font-mono">{shipment.trackingNumber}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
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
      {['in_escrow', 'shipped'].includes(swap.status) && (
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

      {/* Message + Review row */}
      {isInvolved && (
        <div className="flex gap-2 pt-1 flex-wrap border-t border-gray-100 mt-1">
          <Button
            variant="ghost"
            size="sm"
            loading={messageMutation?.isPending}
            onClick={() => messageMutation?.mutate({ otherId, swapId: swap.id })}
          >
            <MessageCircle size={14} />
            Message
          </Button>
          {swap.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReview(swap, otherUser)}
            >
              <Star size={14} />
              Leave Review
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MySwaps() {
  const { user, refreshUser } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab]               = useState('');
  const [page, setPage]             = useState(1);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [activeSwap, setActiveSwap] = useState(null);
  const [addressForm, setAddressForm] = useState({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', landmark: '' });
  const [shipmentForm, setShipmentForm] = useState({ provider: '', providerLabel: '', trackingNumber: '', trackingUrl: '', notes: '' });
  const [disputeReason, setDisputeReason] = useState('');
  const [modal, setModal]           = useState(null); // 'address' | 'shipment' | 'dispute' | 'review'
  const [reviewTarget, setReviewTarget] = useState(null); // { swap, otherUser }
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [expandedSwapId, setExpandedSwapId] = useState(null);
  const qc = useQueryClient();

  const { data: swapData, isLoading } = useQuery({
    queryKey: ['swaps', tab, page],
    queryFn: () => getMySwaps(tab || undefined, page),
    placeholderData: (prev) => prev,
  });

  // Support both old (plain array) and new (paginated object) backend responses
  const swaps      = Array.isArray(swapData) ? swapData          : (swapData?.swaps      ?? []);
  const total      = Array.isArray(swapData) ? swapData.length   : (swapData?.total      ?? 0);
  const totalPages = Array.isArray(swapData) ? 1                 : (swapData?.totalPages ?? 1);

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

  const addressMutation = useMutation({
    mutationFn: ({ id, data }) => setDeliveryAddress(id, data),
    onSuccess: (updatedSwap) => {
      toast.success('Delivery address saved!');
      if (activeSwap?.id === updatedSwap.id) setActiveSwap(updatedSwap);
      invalidate();
      setModal(null);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const shipmentMutation = useMutation({
    mutationFn: ({ id, data }) => submitShipment(id, data),
    onSuccess: (updatedSwap) => {
      toast.success('Shipment submitted!');
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

  const messageMutation = useMutation({
    mutationFn: ({ otherId, swapId }) => startConversation(otherId, swapId),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/chat/${conv.id}`);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Could not open chat'),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ swapId, revieweeId, rating, comment }) =>
      createReview({ swapId, revieweeId, rating, comment }),
    onSuccess: (_, vars) => {
      toast.success('Review submitted! ⭐');
      qc.invalidateQueries({ queryKey: ['reviews', vars.revieweeId] });
      setModal(null);
      setReviewRating(0);
      setReviewComment('');
      setReviewTarget(null);
    },
    onError: (e) => {
      const msg = e.response?.data?.error || 'Failed to submit review';
      toast.error(msg.includes('already') ? 'You already reviewed this swap.' : msg);
    },
  });

  const handleAction = (swap, action) => {
    if (action === 'address')  { setSelectedSwap(swap); setAddressForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', landmark: '' }); setModal('address');  return; }
    if (action === 'shipment') { setSelectedSwap(swap); setShipmentForm({ provider: '', providerLabel: '', trackingNumber: '', trackingUrl: '', notes: '' }); setModal('shipment'); return; }
    if (action === 'dispute')  { setSelectedSwap(swap); setModal('dispute'); return; }
    if (action === 'accept')   respondMutation.mutate({ id: swap.id, action: 'accept' });
    if (action === 'cancel')   respondMutation.mutate({ id: swap.id, action: 'cancel' });
    if (action === 'confirm')  confirmMutation.mutate(swap.id);
  };

  const handleReview = (swap, otherUser) => {
    setReviewTarget({ swap, otherUser });
    setReviewRating(0);
    setReviewComment('');
    setModal('review');
  };

  const sharedDetailProps = {
    user,
    escrowInfo,
    escrowMutation,
    confirmMutation,
    respondMutation,
    topUpMutation,
    messageMutation,
    onAction: handleAction,
    onReview: handleReview,
    addressMutation,
    shipmentMutation,
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

      {/* ── Mobile header ── */}
      <div className="lg:hidden px-4 pt-14 pb-2">
        <h1 className="text-xl font-display font-bold text-ink mb-3">My Swaps {total > 0 && <span className="text-sm font-normal text-gray-400">({total})</span>}</h1>
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
        <div className="lg:grid lg:grid-cols-[380px_1fr] lg:gap-0" style={{ height: 'calc(100vh - 80px)' }}>

          {/* ── Left panel: swap list ── */}
          <div className="lg:border-r lg:border-gray-100 lg:flex lg:flex-col" style={{ minHeight: 0 }}>

            {/* Mobile: expandable summary cards */}
            <div className="lg:hidden px-4 pb-4 space-y-2.5">
              {swaps.map(swap => {
                const swapTypeMeta = SWAP_TYPE_LABELS[swap.swapType] || SWAP_TYPE_LABELS.goods_for_goods;
                const isExpanded   = expandedSwapId === swap.id;
                const isInitiator  = swap.initiatorId?.id === user?.id;
                const myParty      = isInitiator ? 'initiator' : 'receiver';

                const pendingActions = [
                  swap.status === 'proposed' && !isInitiator,
                  ['accepted', 'in_escrow'].includes(swap.status) && !swap[`${myParty}AddressSet`],
                  swap.status === 'in_escrow' && !swap[`${myParty}Shipped`],
                  ['in_escrow', 'shipped'].includes(swap.status) && !(isInitiator ? swap.initiatorConfirmed : swap.receiverConfirmed),
                  swap.status === 'accepted' && !(isInitiator ? swap.initiatorDepositPaid : swap.receiverDepositPaid),
                ].filter(Boolean).length;

                return (
                  <div key={swap.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                    {/* Summary row — tap to expand */}
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedSwapId(isExpanded ? null : swap.id)}
                    >
                      <div className="flex items-start gap-2 px-4 pt-4 pb-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <SwapStatus status={swap.status} />
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {swapTypeMeta.icon} {swapTypeMeta.label}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-ink">
                            {(swap.initiatorId?.fullName || '—').split(' ')[0]} ↔ {(swap.receiverId?.fullName || '—').split(' ')[0]}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-400">
                              {new Date(swap.updatedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                            </span>
                            {swap.status === 'disputed' && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">⚖️ In mediation</span>
                            )}
                            {swap.status !== 'disputed' && pendingActions > 0 && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                {pendingActions} action{pendingActions > 1 ? 's' : ''} needed
                              </span>
                            )}
                            {swap.status === 'completed' && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Completed</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          className={`text-gray-300 flex-none mt-1 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </button>

                    {/* Disputed: court room CTA visible even when collapsed */}
                    {swap.status === 'disputed' && !isExpanded && (
                      <div className="px-4 pb-3">
                        <button
                          onClick={() => navigate(`/dispute/${swap.id}`)}
                          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors active:scale-95"
                        >
                          ⚖️ Enter Court Room
                        </button>
                      </div>
                    )}

                    {/* Expanded full detail */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-4 py-3">
                        <SwapDetail swap={swap} {...sharedDetailProps} isDesktop={false} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mobile pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 pb-4">
                  <button
                    onClick={() => { setPage(p => p - 1); setExpandedSwapId(null); window.scrollTo(0, 0); }}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={15} /> Prev
                  </button>
                  <span className="text-xs text-gray-500">
                    Page {page} of {totalPages} · {total} swaps
                  </span>
                  <button
                    onClick={() => { setPage(p => p + 1); setExpandedSwapId(null); window.scrollTo(0, 0); }}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Desktop: compact clickable rows */}
            <div className="hidden lg:flex lg:flex-col" style={{ flex: 1, minHeight: 0 }}>
              <div className="overflow-y-auto" style={{ flex: 1, minHeight: 0 }}>
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
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {swapTypeMeta.icon} {swapTypeMeta.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-ink truncate">
                          {swap.initiatorId?.fullName} ↔ {swap.receiverId?.fullName}
                        </p>
                        {swap.initiatorShipped && swap.receiverShipped && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                            <Truck size={10} className="flex-none" />
                            Both shipped
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
          <div className="hidden lg:block lg:overflow-y-auto lg:p-8" style={{ minHeight: 0 }}>
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

      {/* Delivery Address Modal */}
      <Modal isOpen={modal === 'address'} onClose={() => setModal(null)} title="Set Delivery Address">
        <div className="space-y-3">
          <p className="text-xs text-gray-500">The other party will ship your item to this address.</p>
          <Input label="Full Name" placeholder="John Doe" value={addressForm.fullName}
            onChange={e => setAddressForm(p => ({ ...p, fullName: e.target.value }))} />
          <Input label="Phone" placeholder="+2348000000000" value={addressForm.phone}
            onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))} />
          <Input label="Address Line 1" placeholder="12 Adeola Odeku Street" value={addressForm.addressLine1}
            onChange={e => setAddressForm(p => ({ ...p, addressLine1: e.target.value }))} />
          <Input label="Address Line 2 (optional)" placeholder="Flat 4B" value={addressForm.addressLine2}
            onChange={e => setAddressForm(p => ({ ...p, addressLine2: e.target.value }))} />
          <Input label="City / Town" placeholder="Lagos Island" value={addressForm.city}
            onChange={e => setAddressForm(p => ({ ...p, city: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <select
              className="input-field"
              value={addressForm.state}
              onChange={e => setAddressForm(p => ({ ...p, state: e.target.value }))}
            >
              <option value="">Select state...</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Input label="Landmark (optional)" placeholder="Near Shoprite" value={addressForm.landmark}
            onChange={e => setAddressForm(p => ({ ...p, landmark: e.target.value }))} />
          <Button
            fullWidth
            loading={addressMutation.isPending}
            disabled={!addressForm.fullName || !addressForm.phone || !addressForm.addressLine1 || !addressForm.city || !addressForm.state}
            onClick={() => addressMutation.mutate({ id: selectedSwap?.id, data: addressForm })}
          >
            <MapPin size={15} />
            Save Address
          </Button>
        </div>
      </Modal>

      {/* Shipment Modal */}
      <Modal isOpen={modal === 'shipment'} onClose={() => setModal(null)} title="Submit Shipment Info">
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Enter your courier and tracking details so the other party can track their delivery.</p>
          <div>
            <label className="block text-sm font-medium mb-1">Courier</label>
            <select
              className="input-field"
              value={shipmentForm.provider}
              onChange={e => {
                const c = COURIERS.find(c => c.value === e.target.value);
                setShipmentForm(p => ({ ...p, provider: e.target.value, providerLabel: c?.label || '' }));
              }}
            >
              <option value="">Select courier...</option>
              {COURIERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <Input label="Tracking Number" placeholder="e.g. GIG-1234567890" value={shipmentForm.trackingNumber}
            onChange={e => setShipmentForm(p => ({ ...p, trackingNumber: e.target.value }))} />
          <Input label="Tracking URL (optional)" placeholder="https://..." value={shipmentForm.trackingUrl}
            onChange={e => setShipmentForm(p => ({ ...p, trackingUrl: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="e.g. Fragile — handle with care"
              value={shipmentForm.notes}
              onChange={e => setShipmentForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <Button
            fullWidth
            loading={shipmentMutation.isPending}
            disabled={!shipmentForm.provider || !shipmentForm.trackingNumber}
            onClick={() => shipmentMutation.mutate({ id: selectedSwap?.id, data: shipmentForm })}
          >
            <Truck size={15} />
            Submit Shipment
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

      {/* Review Modal */}
      <Modal
        isOpen={modal === 'review'}
        onClose={() => { setModal(null); setReviewTarget(null); }}
        title="Leave a Review"
      >
        {reviewTarget && (
          <div className="space-y-5">
            {/* Who you're reviewing */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
              <Avatar
                src={reviewTarget.otherUser?.avatarUrl}
                name={reviewTarget.otherUser?.fullName}
                size="md"
              />
              <div>
                <p className="font-semibold text-sm text-ink">{reviewTarget.otherUser?.fullName}</p>
                <p className="text-xs text-gray-400">Your swap partner</p>
              </div>
            </div>

            {/* Star rating */}
            <div>
              <label className="block text-sm font-medium mb-2">How was the swap?</label>
              <ReviewStars rating={reviewRating} size={36} interactive onChange={setReviewRating} />
              {reviewRating > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {['', 'Poor experience', 'Fair', 'Good', 'Very good', 'Excellent!'][reviewRating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium mb-1">Comment <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Describe how the swap went — was the item as described? Did they show up on time?"
                rows={3}
                className="input-field resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">{reviewComment.length}/500</p>
            </div>

            <Button
              fullWidth
              loading={reviewMutation.isPending}
              disabled={reviewRating === 0}
              onClick={() => reviewMutation.mutate({
                swapId:     reviewTarget.swap.id,
                revieweeId: reviewTarget.otherUser?.id,
                rating:     reviewRating,
                comment:    reviewComment,
              })}
            >
              <Star size={16} />
              Submit Review
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
