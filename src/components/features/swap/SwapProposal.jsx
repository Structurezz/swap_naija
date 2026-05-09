import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getMyListings } from '../../../api/listings.api';
import { proposeSwap } from '../../../api/swaps.api';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { useNavigate } from 'react-router-dom';

function SwapProposal({ listing, currentUserId }) {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  const { data: myListings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => getMyListings('active'),
  });

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
    mutation.mutate({
      receiverId: listing.userId?.id,
      receiverListing: listing.id,
      initiatorListing: data.initiatorListing || undefined,
      proposalNote: data.proposalNote,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="card bg-primary-50 border border-primary/20">
        <p className="text-sm text-gray-600">Proposing swap for:</p>
        <p className="font-semibold">{listing.title}</p>
        {listing.estimatedValue && (
          <p className="text-primary text-sm">₦{listing.estimatedValue.toLocaleString()}</p>
        )}
      </div>

      {myListings?.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Offer one of your listings</label>
          <select {...register('initiatorListing')} className="input-field">
            <option value="">Select a listing to offer (optional)</option>
            {myListings.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
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
