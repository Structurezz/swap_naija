import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRightLeft } from 'lucide-react';
import Badge from '../../ui/Badge';
import Avatar from '../../ui/Avatar';
import SwapStatus from './SwapStatus';

function SwapCard({ swap, currentUserId }) {
  const isInitiator = swap.initiatorId?.id === currentUserId;
  const otherUser = isInitiator ? swap.receiverId : swap.initiatorId;
  const myListing = isInitiator ? swap.initiatorListing : swap.receiverListing;
  const theirListing = isInitiator ? swap.receiverListing : swap.initiatorListing;

  return (
    <Link to={`/swaps`} className="block card hover:shadow-card-hover transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <Avatar src={otherUser?.avatarUrl} name={otherUser?.fullName} size="sm" />
        <div className="flex-1">
          <p className="font-semibold text-sm">{otherUser?.fullName || 'User'}</p>
          <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(swap.updatedAt), { addSuffix: true })}</p>
        </div>
        <SwapStatus status={swap.status} />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 bg-gray-50 rounded-xl p-2 text-center">
          <p className="text-xs text-gray-400">You offer</p>
          <p className="font-medium truncate">{myListing?.title || swap.proposalNote || 'Proposal'}</p>
        </div>
        <ArrowRightLeft size={16} className="text-primary flex-shrink-0" />
        <div className="flex-1 bg-primary-50 rounded-xl p-2 text-center">
          <p className="text-xs text-gray-400">They offer</p>
          <p className="font-medium truncate">{theirListing?.title || '—'}</p>
        </div>
      </div>
    </Link>
  );
}

export default SwapCard;
