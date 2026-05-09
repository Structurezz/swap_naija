import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Eye, Repeat2, Zap, LayoutGrid } from 'lucide-react';
import Badge from '../../ui/Badge';
import Avatar from '../../ui/Avatar';
import Button from '../../ui/Button';
import { getListingPlaceholder } from '../../../utils/placeholder';
import { getPublicProfile } from '../../../api/users.api';

const CONDITION_LABELS = { new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair', poor: 'Poor' };

function OwnerListings({ ownerId, currentListingId }) {
  const { data } = useQuery({
    queryKey: ['public-profile', ownerId],
    queryFn: () => getPublicProfile(ownerId),
    enabled: !!ownerId,
    staleTime: 60_000,
  });

  const others = (data?.listings || []).filter(l => l.id !== currentListingId);
  if (!others.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid size={15} className="text-gray-500" />
          <h2 className="font-display font-semibold text-sm">More from this swapper</h2>
        </div>
        <Link to={`/profile/${ownerId}`} className="text-xs text-primary font-medium">
          See all →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 xl:grid-cols-4">
        {others.slice(0, 8).map(l => {
          const ph = getListingPlaceholder(l);
          return (
            <Link
              key={l.id}
              to={`/listing/${l.id}`}
              className="flex-none w-36 lg:w-auto bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-sm transition"
            >
              <img
                src={l.images?.[0] || ph}
                alt={l.title}
                className="w-full h-24 object-cover"
                onError={(e) => { e.currentTarget.src = ph; }}
              />
              <div className="p-2">
                <p className="text-xs font-semibold truncate">{l.title}</p>
                {l.estimatedValue && (
                  <p className="text-xs text-primary font-medium mt-0.5">
                    ₦{l.estimatedValue.toLocaleString()}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ListingDetail({ listing, onSwap, currentUserId }) {
  const isOwner = listing.userId?.id === currentUserId;
  const placeholder = getListingPlaceholder(listing, 600, 400);

  return (
    <div className="space-y-4">
      {/* Images */}
      {listing.images?.length > 0 ? (
        <div className="overflow-x-auto flex gap-2 pb-1">
          {listing.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Image ${i + 1}`}
              className="w-72 h-56 object-cover rounded-2xl flex-shrink-0"
              onError={(e) => { e.currentTarget.src = placeholder; }}
            />
          ))}
        </div>
      ) : (
        <img
          src={placeholder}
          alt={listing.title}
          className="w-full h-56 object-cover rounded-2xl"
        />
      )}

      {/* Main info */}
      <div className="card">
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-display font-bold text-xl flex-1">{listing.title}</h1>
          {listing.condition && (
            <Badge variant="primary">{CONDITION_LABELS[listing.condition]}</Badge>
          )}
        </div>

        {listing.estimatedValue && (
          <p className="text-primary font-bold text-xl mt-1">₦{listing.estimatedValue.toLocaleString()}</p>
        )}

        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
          {listing.locationState && (
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {[listing.locationArea, listing.locationLga, listing.locationState].filter(Boolean).join(', ')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye size={14} />
            {listing.viewCount || 0} views
          </span>
        </div>

        <p className="text-gray-700 mt-3 text-sm leading-relaxed">{listing.description}</p>

        <div className="flex gap-2 mt-3">
          {listing.meetupOption && <Badge variant="success">Meetup</Badge>}
          {listing.deliveryOption && <Badge variant="info">Delivery</Badge>}
        </div>
      </div>

      {/* Wants */}
      {listing.wantsTitle && (
        <div className="card border border-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <Repeat2 size={16} className="text-accent" />
            <h2 className="font-semibold text-sm">Looking For</h2>
          </div>
          <p className="font-medium">{listing.wantsTitle}</p>
          {listing.wantsDescription && (
            <p className="text-sm text-gray-600 mt-1">{listing.wantsDescription}</p>
          )}
          {(listing.wantsValueMin || listing.wantsValueMax) && (
            <p className="text-xs text-gray-500 mt-1">
              Value range: ₦{listing.wantsValueMin?.toLocaleString() || 0} — ₦{listing.wantsValueMax?.toLocaleString() || '∞'}
            </p>
          )}
        </div>
      )}

      {/* Owner */}
      {listing.userId && (
        <div className="card">
          <Link to={`/profile/${listing.userId.id}`} className="flex items-center gap-3">
            <Avatar src={listing.userId.avatarUrl} name={listing.userId.fullName} size="md" />
            <div className="flex-1">
              <p className="font-semibold">{listing.userId.fullName || 'SwapNaija User'}</p>
              <p className="text-xs text-gray-500">
                ⭐ {listing.userId.ratingAvg?.toFixed(1) || '—'} · {listing.userId.locationState || ''}
              </p>
            </div>
            <span className="text-primary text-sm font-medium">View Profile →</span>
          </Link>
        </div>
      )}

      {/* Actions */}
      {isOwner ? (
        <Link to={`/boost/${listing.id}`}>
          <Button fullWidth variant="secondary" size="lg">
            <Zap size={18} className="text-amber-500" />
            {listing.isBoosted ? 'Renew Boost' : 'Boost This Listing'}
          </Button>
        </Link>
      ) : (
        <Button fullWidth onClick={onSwap} size="lg">
          Propose Swap
        </Button>
      )}

      {/* Other listings by same swapper */}
      {listing.userId?.id && (
        <OwnerListings ownerId={listing.userId.id} currentListingId={listing.id} />
      )}
    </div>
  );
}

export default ListingDetail;
