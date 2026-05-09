import { Star } from 'lucide-react';

function ReviewStars({ rating, size = 16, interactive = false, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          onClick={interactive ? () => onChange?.(star) : undefined}
          className={interactive ? 'hover:scale-110 transition-transform' : ''}
          disabled={!interactive}
        >
          <Star
            size={size}
            className={star <= rating ? 'text-accent fill-accent' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}

export default ReviewStars;
