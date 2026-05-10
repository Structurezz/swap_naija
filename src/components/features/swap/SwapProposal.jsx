import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getMyListings } from '../../../api/listings.api';
import { proposeSwap } from '../../../api/swaps.api';
import Button from '../../ui/Button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Coins, Shield, AlertCircle } from 'lucide-react';
import { formatBC, bcToKobo } from '../../../utils/currency';

const COLLATERAL_OPTIONS = [
  { value: 5,  label: '5%',  desc: 'Low risk' },
  { value: 10, label: '10%', desc: 'Standard' },
  { value: 15, label: '15%', desc: 'Moderate' },
  { value: 20, label: '20%', desc: 'High commitment' },
  { value: 30, label: '30%', desc: 'Very serious' },
  { value: 50, label: '50%', desc: 'Maximum trust' },
];

const ESCROW_MIN_KOBO = 50000; // ₦500

function calcDeposit(initiatorValue, receiverValue, collateralPct) {
  const maxNaira = Math.max(initiatorValue || 0, receiverValue || 0);
  if (maxNaira <= 0) return ESCROW_MIN_KOBO;
  const depositNaira = Math.round(maxNaira * (collateralPct / 100));
  return Math.max(ESCROW_MIN_KOBO, depositNaira * 100);
}

function SwapProposal({ listing, currentUserId }) {
  const navigate = useNavigate();
  const { register, handleSubmit, watch } = useForm();
  const [topUpPayerRole, setTopUpPayerRole] = useState('none');
  const [collateralPct, setCollateralPct]   = useState(10);

  const { data: myListings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => getMyListings('active'),
  });

  const selectedListingId = watch('initiatorListing');
  const selectedListing   = myListings?.find(l => l.id === selectedListingId);

  const receiverValue  = listing.estimatedValue || 0;
  const initiatorValue = selectedListing?.estimatedValue || 0;
  const minSwapValue   = listing.minSwapValue || 0;
  const meetsThreshold = minSwapValue <= 0 || initiatorValue >= minSwapValue;

  // Value gap
  const gap      = Math.abs(receiverValue - initiatorValue);
  const showGap  = gap > 0 && initiatorValue > 0;

  // Collateral deposit
  const depositKobo  = calcDeposit(initiatorValue, receiverValue, collateralPct);
  const platformFee  = Math.round(depositKobo * 0.02);
  const refundKobo   = depositKobo - platformFee;
  const showEscrow   = initiatorValue > 0 || receiverValue > 0;

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
    const topUpAmountKobo = showGap && topUpPayerRole !== 'none' ? gap * 100 : 0;
    mutation.mutate({
      receiverId:      listing.userId?.id,
      receiverListing: listing.id,
      initiatorListing: data.initiatorListing || undefined,
      proposalNote:     data.proposalNote,
      collateralPercent: collateralPct,
      topUpAmountKobo,
      topUpPayerRole: topUpAmountKobo > 0 ? topUpPayerRole : 'none',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Receiver listing */}
      <div className="card bg-primary-50 border border-primary/20">
        <p className="text-xs text-gray-500 mb-0.5">You want</p>
        <p className="font-semibold">{listing.title}</p>
        {receiverValue > 0 && (
          <p className="text-primary text-sm font-medium mt-0.5">
            {receiverValue.toLocaleString()} BC
          </p>
        )}
      </div>

      {/* Initiator listing */}
      {myListings?.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">Offer one of your listings</label>
          <select {...register('initiatorListing')} className="input-field">
            <option value="">Select a listing to offer (optional)</option>
            {myListings.map(l => (
              <option key={l.id} value={l.id}>
                {l.title}{l.estimatedValue ? ` — ${l.estimatedValue.toLocaleString()} BC` : ''}
              </option>
            ))}
          </select>

          {/* Eligibility threshold warning */}
          {minSwapValue > 0 && selectedListing && !meetsThreshold && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <Shield size={13} className="text-red-500 flex-none mt-0.5" />
              <p className="text-xs text-red-700">
                Your selected item ({initiatorValue.toLocaleString()} BC) doesn't meet the minimum of{' '}
                <span className="font-bold">{minSwapValue.toLocaleString()} BC</span> required for this listing.
              </p>
            </div>
          )}
          {minSwapValue > 0 && !selectedListing && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              This listing requires a swap offer worth at least <span className="font-bold">{minSwapValue.toLocaleString()} BC</span>.
            </p>
          )}
        </div>
      )}

      {/* Escrow collateral section */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-blue-600" />
          <p className="text-sm font-semibold text-blue-800">Escrow Collateral</p>
          <span className="ml-auto text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">2% service fee</span>
        </div>

        <p className="text-xs text-blue-700 leading-relaxed">
          Set how much both parties must stake. Higher % = more commitment, less chance of being ghosted.
        </p>

        {/* Collateral % selector */}
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

        {/* Deposit breakdown */}
        {showEscrow && (
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
        )}
      </div>

      {/* Value gap section */}
      {showGap && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={14} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">Value Gap Detected</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-white rounded-xl p-2">
              <p className="text-gray-400 mb-0.5">Your item</p>
              <p className="font-bold text-ink">{initiatorValue.toLocaleString()} BC</p>
            </div>
            <div className="bg-white rounded-xl p-2">
              <p className="text-gray-400 mb-0.5">Their item</p>
              <p className="font-bold text-ink">{receiverValue.toLocaleString()} BC</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-100 rounded-xl px-3 py-2">
            <Coins size={14} className="text-amber-600 flex-none" />
            <p className="text-xs text-amber-800">
              Difference: <span className="font-bold">{gap.toLocaleString()} BC</span> — held in escrow until swap completes
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Who pays the difference?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTopUpPayerRole('initiator')}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${
                  topUpPayerRole === 'initiator'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300'
                }`}
              >
                You pay ({gap.toLocaleString()} BC)
              </button>
              <button
                type="button"
                onClick={() => setTopUpPayerRole('receiver')}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${
                  topUpPayerRole === 'receiver'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300'
                }`}
              >
                They pay ({gap.toLocaleString()} BC)
              </button>
              <button
                type="button"
                onClick={() => setTopUpPayerRole('none')}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${
                  topUpPayerRole === 'none'
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Add a note</label>
        <textarea
          {...register('proposalNote')}
          placeholder="Introduce yourself and explain your proposal..."
          rows={3}
          className="input-field resize-none"
        />
      </div>

      {minSwapValue > 0 && selectedListing && !meetsThreshold && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <AlertCircle size={14} className="text-red-500 flex-none" />
          <p className="text-xs text-red-700 font-medium">
            Select an item worth at least {minSwapValue.toLocaleString()} BC to proceed
          </p>
        </div>
      )}

      <Button type="submit" fullWidth loading={mutation.isPending} disabled={minSwapValue > 0 && selectedListing != null && !meetsThreshold}>
        Send Swap Proposal
      </Button>
    </form>
  );
}

export default SwapProposal;
