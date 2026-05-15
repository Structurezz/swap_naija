import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyListings } from '../../../api/listings.api';
import { proposeSwap } from '../../../api/swaps.api';
import { useAuthStore } from '../../../store/auth.store';
import Button from '../../ui/Button';
import Avatar from '../../ui/Avatar';
import { IMAGE_FALLBACK_SRC } from '../../../utils/placeholder';
import { formatBC } from '../../../utils/currency';
import {
  ArrowLeftRight, Coins, Shield, AlertCircle,
  CheckCircle2, ChevronDown, Info, Wallet, ArrowDown,
} from 'lucide-react';

const COLLATERAL_OPTIONS = [
  { value: 5,  label: '5%',  desc: 'Low' },
  { value: 10, label: '10%', desc: 'Standard' },
  { value: 15, label: '15%', desc: 'Moderate' },
  { value: 20, label: '20%', desc: 'High' },
  { value: 30, label: '30%', desc: 'Serious' },
  { value: 50, label: '50%', desc: 'Max trust' },
];

const ESCROW_MIN_KOBO = 50000;

function calcDeposit(initiatorValue, receiverValue, collateralPct) {
  const maxNaira = Math.max(initiatorValue || 0, receiverValue || 0);
  if (maxNaira <= 0) return ESCROW_MIN_KOBO;
  return Math.max(ESCROW_MIN_KOBO, Math.round(maxNaira * (collateralPct / 100)) * 100);
}

// ── Small listing thumbnail card ──────────────────────────────────────────────
function ListingCard({ listing, label, highlight }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-3 ${highlight ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50 border border-gray-100'}`}>
      {listing.images?.[0] ? (
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="w-14 h-14 rounded-xl object-cover flex-none"
          onError={(e) => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
        />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center flex-none">
          <span className="text-gray-400 text-xs font-medium">No img</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
        <p className="font-semibold text-sm text-ink truncate">{listing.title}</p>
        {listing.estimatedValue > 0
          ? <p className={`text-sm font-bold mt-0.5 ${highlight ? 'text-primary' : 'text-gray-600'}`}>{listing.estimatedValue.toLocaleString()} BC</p>
          : <p className="text-xs text-gray-400 mt-0.5">No value set</p>
        }
      </div>
      {listing.userId && (
        <Avatar src={listing.userId.avatarUrl} name={listing.userId.fullName} size="xs" />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function SwapProposal({ listing, currentUserId }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { register, handleSubmit, watch } = useForm();
  const [topUpPayerRole, setTopUpPayerRole] = useState('none');
  const [collateralPct, setCollateralPct]   = useState(10);

  const walletBalance = user?.walletBalance ?? 0; // in kobo

  const { data: myListings } = useQuery({
    queryKey: ['my-listings'],
    queryFn:  () => getMyListings('active'),
  });

  const selectedListingId = watch('initiatorListing');
  const selectedListing   = myListings?.find(l => l.id === selectedListingId);

  const receiverValue  = listing.estimatedValue  || 0;   // Naira
  const initiatorValue = selectedListing?.estimatedValue || 0; // Naira
  const minSwapValue   = listing.minSwapValue || 0;
  const meetsThreshold = minSwapValue <= 0 || initiatorValue >= minSwapValue;

  // Value gap
  const gap          = Math.abs(receiverValue - initiatorValue);
  const initiatorOwes = receiverValue > initiatorValue; // initiator's item is worth less
  const receiverOwes  = initiatorValue > receiverValue;
  const hasGap        = gap > 0 && initiatorValue > 0;

  // Escrow
  const depositKobo   = calcDeposit(initiatorValue, receiverValue, collateralPct);
  const platformFee   = Math.round(depositKobo * 0.02);
  const refundKobo    = depositKobo - platformFee;

  // What the initiator must have in wallet
  const myTopUpKobo   = hasGap && topUpPayerRole === 'initiator' ? gap * 100 : 0;
  const totalNeeded   = depositKobo + myTopUpKobo;
  const hasSufficient = walletBalance >= totalNeeded;
  const shortfall     = totalNeeded - walletBalance;

  const mutation = useMutation({
    mutationFn: proposeSwap,
    onSuccess: () => {
      toast.success('Swap proposed!');
      navigate('/swaps');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to propose swap');
    },
  });

  const onSubmit = (data) => {
    const topUpAmountKobo = hasGap && topUpPayerRole !== 'none' ? gap * 100 : 0;
    mutation.mutate({
      receiverId:       listing.userId?.id,
      receiverListing:  listing.id,
      initiatorListing: data.initiatorListing || undefined,
      proposalNote:     data.proposalNote,
      collateralPercent: collateralPct,
      topUpAmountKobo,
      topUpPayerRole: topUpAmountKobo > 0 ? topUpPayerRole : 'none',
    });
  };

  const canSubmit = !mutation.isPending &&
    (minSwapValue <= 0 || !selectedListing || meetsThreshold);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* ── 1. Both listings side-by-side ────────────────────────────────── */}
      <div className="card space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Swap Overview</p>

        <ListingCard listing={listing} label="You want" highlight />

        <div className="flex items-center justify-center gap-2 py-0.5">
          <ArrowLeftRight size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400">in exchange for</span>
        </div>

        {selectedListing ? (
          <ListingCard listing={selectedListing} label="You offer" />
        ) : (
          <div className="flex items-center gap-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-3">
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-none">
              <ChevronDown size={20} className="text-gray-300" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Your offer</p>
              <p className="text-sm text-gray-500 font-medium">Select a listing below</p>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Listing selector ──────────────────────────────────────────── */}
      {myListings?.length > 0 ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Offer one of your listings</label>
          <select {...register('initiatorListing')} className="input-field">
            <option value="">— Nothing specific (service / open offer) —</option>
            {myListings.map(l => (
              <option key={l.id} value={l.id}>
                {l.title}{l.estimatedValue ? ` · ${l.estimatedValue.toLocaleString()} BC` : ''}
              </option>
            ))}
          </select>

          {minSwapValue > 0 && !selectedListing && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <Info size={13} className="text-amber-600 flex-none mt-0.5" />
              <p className="text-xs text-amber-800">
                This listing requires a swap item worth at least{' '}
                <span className="font-bold">{minSwapValue.toLocaleString()} BC</span>.
              </p>
            </div>
          )}
          {minSwapValue > 0 && selectedListing && !meetsThreshold && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle size={13} className="text-red-500 flex-none mt-0.5" />
              <p className="text-xs text-red-700">
                Your item ({initiatorValue.toLocaleString()} BC) is below the{' '}
                <span className="font-bold">{minSwapValue.toLocaleString()} BC</span> minimum.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-sm text-gray-500">
            You have no active listings.{' '}
            <a href="/create-listing" className="text-primary font-medium">Create one first →</a>
          </p>
        </div>
      )}

      {/* ── 3. Value gap ─────────────────────────────────────────────────── */}
      {hasGap && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Coins size={15} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">Value Gap</p>
            <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
              {gap.toLocaleString()} BC difference
            </span>
          </div>

          {/* Visual value bar */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className={`rounded-xl p-2.5 ${initiatorOwes ? 'bg-white border-2 border-amber-300' : 'bg-white border border-gray-100'}`}>
              <p className="text-xs text-gray-400 mb-0.5">Your item</p>
              <p className="font-bold text-ink">{initiatorValue.toLocaleString()} BC</p>
              {initiatorOwes && (
                <p className="text-xs text-amber-600 font-medium mt-0.5">↓ lower value</p>
              )}
            </div>
            <div className={`rounded-xl p-2.5 ${receiverOwes ? 'bg-white border-2 border-amber-300' : 'bg-white border border-gray-100'}`}>
              <p className="text-xs text-gray-400 mb-0.5">Their item</p>
              <p className="font-bold text-ink">{receiverValue.toLocaleString()} BC</p>
              {receiverOwes && (
                <p className="text-xs text-amber-600 font-medium mt-0.5">↓ lower value</p>
              )}
            </div>
          </div>

          <p className="text-xs text-amber-700 leading-relaxed">
            {initiatorOwes
              ? `Your item is worth ${gap.toLocaleString()} BC less. You can cover this gap with Barter Credits, or ask them to accept as-is.`
              : `Their item is worth ${gap.toLocaleString()} BC less. You can ask them to top up, or accept the gap.`
            }
          </p>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Who pays the {gap.toLocaleString()} BC gap?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTopUpPayerRole('initiator')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition border-2 ${
                  topUpPayerRole === 'initiator'
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-amber-300'
                }`}
              >
                I pay
                <span className="block text-xs font-normal opacity-80">{gap.toLocaleString()} BC from my wallet</span>
              </button>
              <button
                type="button"
                onClick={() => setTopUpPayerRole('receiver')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition border-2 ${
                  topUpPayerRole === 'receiver'
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-amber-300'
                }`}
              >
                They pay
                <span className="block text-xs font-normal opacity-80">requires their agreement</span>
              </button>
              <button
                type="button"
                onClick={() => setTopUpPayerRole('none')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition border-2 ${
                  topUpPayerRole === 'none'
                    ? 'border-gray-400 bg-gray-100 text-gray-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                Skip
                <span className="block text-xs font-normal opacity-70">no top-up</span>
              </button>
            </div>
          </div>

          {topUpPayerRole === 'initiator' && (
            <div className="flex items-center gap-2 bg-amber-100 rounded-xl px-3 py-2">
              <ArrowDown size={13} className="text-amber-700 flex-none" />
              <p className="text-xs text-amber-800">
                <span className="font-bold">{gap.toLocaleString()} BC</span> will be held in escrow and released to them when the swap completes.
              </p>
            </div>
          )}
          {topUpPayerRole === 'receiver' && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
              <Info size={13} className="text-blue-600 flex-none" />
              <p className="text-xs text-blue-700">
                They'll see this request when reviewing your proposal. They must accept before paying.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 4. Escrow collateral ─────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-blue-600" />
          <p className="text-sm font-semibold text-blue-800">Escrow Protection</p>
          <span className="ml-auto text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">2% service fee</span>
        </div>

        <p className="text-xs text-blue-700 leading-relaxed">
          Both parties stake Barter Credits. Higher % = stronger commitment, lower ghosting risk.
          You get most back when the swap completes.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {COLLATERAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCollateralPct(opt.value)}
              className={`py-2 rounded-xl text-center transition border-2 ${
                collateralPct === opt.value
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
              }`}
            >
              <p className="text-sm font-bold">{opt.label}</p>
              <p className="text-xs opacity-70">{opt.desc}</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Each party stakes</span>
            <span className="font-bold text-ink">{formatBC(depositKobo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Service fee (2%)</span>
            <span className="text-red-500">−{formatBC(platformFee)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-1.5">
            <span className="text-gray-500">Refunded on completion</span>
            <span className="font-bold text-green-600">+{formatBC(refundKobo)}</span>
          </div>
        </div>
      </div>

      {/* ── 5. Wallet cost summary ───────────────────────────────────────── */}
      <div className={`rounded-2xl p-4 border space-y-3 ${hasSufficient ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2">
          <Wallet size={15} className={hasSufficient ? 'text-green-600' : 'text-red-500'} />
          <p className={`text-sm font-semibold ${hasSufficient ? 'text-green-800' : 'text-red-700'}`}>
            What you'll need from your wallet
          </p>
        </div>

        <div className="bg-white rounded-xl p-3 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Escrow deposit</span>
            <span className="font-semibold">{formatBC(depositKobo)}</span>
          </div>
          {myTopUpKobo > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs">Value gap top-up</span>
              <span className="font-semibold text-amber-600">{formatBC(myTopUpKobo)}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-gray-100 pt-2">
            <span className="font-medium text-xs">Total needed now</span>
            <span className="font-bold text-ink">{formatBC(totalNeeded)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Your balance</span>
            <span className={`font-semibold ${hasSufficient ? 'text-green-600' : 'text-red-500'}`}>
              {formatBC(walletBalance)}
            </span>
          </div>
        </div>

        {hasSufficient ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-600 flex-none" />
            <p className="text-xs text-green-700 font-medium">
              You have enough Barter Credits.
              {refundKobo > 0 && ` ${formatBC(refundKobo)} will be refunded after the swap.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-red-500 flex-none mt-0.5" />
              <p className="text-xs text-red-700">
                You need <span className="font-bold">{formatBC(shortfall)} more</span> to cover the escrow deposit
                {myTopUpKobo > 0 ? ' and top-up' : ''}.
              </p>
            </div>
            <a
              href="/wallet"
              className="block text-center w-full py-2 rounded-xl bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition"
            >
              Top up wallet →
            </a>
          </div>
        )}
      </div>

      {/* ── 6. Note ──────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Add a note <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          {...register('proposalNote')}
          placeholder="Introduce yourself and explain why this is a fair swap…"
          rows={3}
          className="input-field resize-none"
          maxLength={500}
        />
      </div>

      {/* ── 7. Submit ────────────────────────────────────────────────────── */}
      {!hasSufficient && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <AlertCircle size={14} className="text-red-500 flex-none" />
          <p className="text-xs text-red-700 font-medium">
            Add {formatBC(shortfall)} to your wallet before proposing.
          </p>
        </div>
      )}

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={mutation.isPending}
        disabled={!canSubmit || !hasSufficient}
      >
        Send Swap Proposal
      </Button>

      <p className="text-xs text-center text-gray-400">
        The escrow deposit is only charged when both parties accept.
      </p>
    </form>
  );
}

export default SwapProposal;
