import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from '../../../api/client';
import ReviewStars from './ReviewStars';
import Button from '../../ui/Button';

function ReviewForm({ swapId, revieweeId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      axios.post('/reviews', { swapId, revieweeId, rating, comment }).then(r => r.data.data),
    onSuccess: () => {
      toast.success('Review submitted!');
      queryClient.invalidateQueries({ queryKey: ['reviews', revieweeId] });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rating</label>
        <ReviewStars rating={rating} size={28} interactive onChange={setRating} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was the swap experience?"
          rows={3}
          className="input-field resize-none"
        />
      </div>

      <Button
        fullWidth
        onClick={() => mutation.mutate()}
        loading={mutation.isPending}
        disabled={rating === 0}
      >
        Submit Review
      </Button>
    </div>
  );
}

export default ReviewForm;
