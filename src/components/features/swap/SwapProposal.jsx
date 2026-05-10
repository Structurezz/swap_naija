import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getMyListings } from '../../../api/listings.api';
import { proposeSwap } from '../../../api/swaps.api';
import Button from '../../ui/Button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Coins } from 'lucide-react';

function SwapProposal({ listing, currentUserId }) {
  const navigate = useNavigate();
  const { register, handleSubmit, watch } = useForm();
  const [topUpPayerRole, setTopUpPayerRole] = useState('none');

  const { data: myListings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => getMyListings('active'),
  });

  const selectedListingId = watch('initiatorListing');
  const selectedListing = myListings?.find(l => l.id === selectedListingId);

  // Compute value gap
  const receiverValue  = listing.estimatedValue || 0;
  const initiatorValue = selectedListing?.estimatedValue || 0;
  const gap            = Math.abs(receiverValue - initiatorValue);
  const showGap        = gap > 0 && initiatorValue > 0;
  const defaultPayer   = receiverValue > initiatorValue ? 'initiator' : 'receiver';

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
      receiverId: listing.userId?.id,
      receiverListing: listing.id,
      initiatorListing: data.initiatorListing || undefined,
      proposalNote: data.proposalNote,
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
        {listing.estimatedValue > 0 && (
          <p className="text-primary text-sm font-medium mt-0.5">
            {listing.estimatedValue.toLocaleString()} BC
          </p>
        )}
      </div>

      {/* Initiator listing */}
      {myListings?.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Offer one of your listings</label>
          <select {...register('initiatorListing')} className="input-field">
            <option value="">Select a listing to offer (optional)</option>
            {myListings.map(l => (
              <option key={l.id} value={l.id}>
                {l.title}{l.estimatedValue ? ` — ${l.estimatedValue.toLocaleString()} BC` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

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
            {topUpPayerRole !== 'none' && (
              <p className="text-xs text-gray-400 mt-1.5 text-center">
                The {topUpPayerRole === 'initiator' ? 'paying party (you)' : 'receiving party'} will be asked to pay {gap.toLocaleString()} BC after acceptance. Escrow holds it until completion.
              </p>
            )}
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

      <Button type="submit" fullWidth loading={mutation.isPending}>
        Send Swap Proposal
      </Button>
    </form>
  );
}

export default SwapProposal;
