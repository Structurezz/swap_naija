import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Eye, Repeat2, Zap, LayoutGrid, Shield,
  MessageCircle, Pencil, Star, ChevronLeft, ChevronRight,
  CheckCircle2, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../ui/Badge';
import Avatar from '../../ui/Avatar';
import Button from '../../ui/Button';
import { IMAGE_FALLBACK_SRC, resolveImageUrl, getListingPlaceholder } from '../../../utils/placeholder';
import { getPublicProfile } from '../../../api/users.api';
import { startConversation } from '../../../api/messages.api';

const CONDITION_LABELS = { new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair', poor: 'Poor' };
const CONDITION_STYLES = {
  new:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  like_new: 'bg-blue-50   text-blue-700   border border-blue-200',
  good:     'bg-amber-50  text-amber-700  border border-amber-200',
  fair:     'bg-orange-50 text-orange-700 border border-orange-200',
  poor:     'bg-red-50    text-red-700    border border-red-200',
};

// ─── Image gallery ────────────────────────────────────────────────────────────
function ImageGallery({ images, placeholder, title }) {
  const [active, setActive] = useState(0);
  const imgs = images?.length ? images.map(resolveImageUrl) : [placeholder];

  const prev = () => setActive(i => Math.max(0, i - 1));
  const next = () => setActive(i => Math.min(imgs.length - 1, i + 1));

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative overflow-hidden rounded-3xl bg-gray-100 aspect-[4/3] group">
        <img
          key={active}
          src={imgs[active]}
          alt={title}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
        />

        {imgs.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={active === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              disabled={active === imgs.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active ? 'bg-white w-5' : 'bg-white/50 w-1.5'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Image count pill */}
        {imgs.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {active + 1} / {imgs.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {imgs.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-none w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active
                  ? 'border-primary shadow-sm'
                  : 'border-transparent opacity-55 hover:opacity-90'
              }`}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── More from this swapper ───────────────────────────────────────────────────
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid size={15} className="text-gray-400" />
          <h2 className="font-semibold text-sm text-gray-900">More from this swapper</h2>
        </div>
        <Link to={`/profile/${ownerId}`} className="text-xs text-primary font-semibold hover:underline">
          See all →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4">
        {others.slice(0, 8).map(l => (
          <Link
            key={l.id}
            to={`/listing/${l.id}`}
            className="flex-none w-36 lg:w-auto bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-card transition-shadow"
          >
            <img
              src={resolveImageUrl(l.images?.[0]) || getListingPlaceholder(l)}
              alt={l.title}
              className="w-full h-24 object-cover"
              onError={(e) => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
            />
            <div className="p-2.5">
              <p className="text-xs font-semibold truncate text-gray-900">{l.title}</p>
              {l.estimatedValue && (
                <p className="text-xs text-primary font-semibold mt-0.5">
                  ₦{l.estimatedValue.toLocaleString()}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ListingDetail({ listing, onSwap, currentUserId }) {
  const isOwner = listing.userId?.id === currentUserId;
  const placeholder = getListingPlaceholder(listing, 600, 400);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: messageOwner, isPending: isMessaging } = useMutation({
    mutationFn: () => startConversation({ recipientId: listing.userId?.id, listingId: listing.id }),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/chat/${conv.id}`);
    },
    onError: () => toast.error('Could not start conversation'),
  });

  const location = [listing.locationArea, listing.locationLga, listing.locationState]
    .filter(Boolean).join(', ');

  return (
    <div className="lg:grid lg:grid-cols-[1fr_420px] lg:gap-10 space-y-5 lg:space-y-0">

      {/* ── Left: image gallery ── */}
      <div className="space-y-5">
        <ImageGallery
          images={listing.images}
          placeholder={placeholder}
          title={listing.title}
        />

        {/* More listings — desktop only here */}
        {listing.userId?.id && (
          <div className="hidden lg:block">
            <OwnerListings ownerId={listing.userId.id} currentListingId={listing.id} />
          </div>
        )}
      </div>

      {/* ── Right: details ── */}
      <div className="space-y-4">

        {/* Title + badges */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {listing.condition && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CONDITION_STYLES[listing.condition]}`}>
                {CONDITION_LABELS[listing.condition]}
              </span>
            )}
            {listing.isBoosted && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Zap size={11} className="fill-amber-500 text-amber-500" />
                Featured
              </span>
            )}
          </div>

          <h1 className="font-display font-bold text-2xl text-gray-900 leading-snug">
            {listing.title}
          </h1>

          {listing.estimatedValue && (
            <p className="text-primary font-bold text-2xl mt-1">
              ₦{listing.estimatedValue.toLocaleString()}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
            {location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-gray-400" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Eye size={14} className="text-gray-400" />
              {listing.viewCount || 0} views
            </span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Description */}
        <div>
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-2">
            Description
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            {listing.description || 'No description provided.'}
          </p>
        </div>

        {/* Looking For */}
        {listing.wantsTitle && (
          <>
            <hr className="border-gray-100" />
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                  <Repeat2 size={14} className="text-amber-600" />
                </div>
                <h2 className="font-semibold text-sm text-amber-800">Looking to swap for</h2>
              </div>
              <p className="font-semibold text-gray-900">{listing.wantsTitle}</p>
              {listing.wantsDescription && (
                <p className="text-sm text-gray-600 mt-1">{listing.wantsDescription}</p>
              )}
              {(listing.wantsValueMin || listing.wantsValueMax) && (
                <p className="text-xs text-amber-700 mt-2 font-medium">
                  Value range: ₦{listing.wantsValueMin?.toLocaleString() || 0}
                  {' — '}
                  ₦{listing.wantsValueMax?.toLocaleString() || '∞'}
                </p>
              )}
            </div>
          </>
        )}

        {/* Owner */}
        {listing.userId && (
          <>
            <hr className="border-gray-100" />
            <div>
              <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">
                Swapper
              </h2>
              <Link
                to={`/profile/${listing.userId.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition group"
              >
                <Avatar src={listing.userId.avatarUrl} name={listing.userId.fullName} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">
                      {listing.userId.fullName || 'SwapNaija User'}
                    </p>
                    {listing.userId.isVerified && (
                      <CheckCircle2 size={14} className="text-primary flex-none" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs text-gray-500">
                      {listing.userId.ratingAvg?.toFixed(1) || 'No ratings'} · {listing.userId.locationState || 'Nigeria'}
                    </span>
                  </div>
                </div>
                <span className="text-primary text-xs font-semibold group-hover:underline whitespace-nowrap">
                  View →
                </span>
              </Link>
            </div>
          </>
        )}

        {/* Swap requirement notice */}
        {!isOwner && listing.minSwapValue > 0 && (
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
            <Shield size={15} className="text-blue-500 flex-none mt-0.5" />
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Swap requirement:</span> Your item must be worth at least{' '}
              <span className="font-bold">₦{listing.minSwapValue.toLocaleString()}</span> to propose a swap.
            </p>
          </div>
        )}

        {/* Actions */}
        {isOwner ? (
          <div className="flex gap-3 pt-1">
            <Link to={`/listing/${listing.id}/edit`} className="flex-1">
              <Button fullWidth variant="outline" size="md">
                <Pencil size={15} />
                Edit Listing
              </Button>
            </Link>
            <Link to={`/boost/${listing.id}`} className="flex-1">
              <Button fullWidth variant="secondary" size="md">
                <Zap size={15} className="text-amber-500" />
                {listing.isBoosted ? 'Renew Boost' : 'Boost'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            <Button fullWidth onClick={onSwap} size="lg">
              <Repeat2 size={18} />
              Propose Swap
            </Button>
            <Button
              fullWidth
              variant="outline"
              size="md"
              onClick={() => messageOwner()}
              loading={isMessaging}
            >
              <MessageCircle size={16} />
              Message Swapper
            </Button>
          </div>
        )}
      </div>

      {/* More listings — mobile only */}
      {listing.userId?.id && (
        <div className="lg:hidden pt-2">
          <OwnerListings ownerId={listing.userId.id} currentListingId={listing.id} />
        </div>
      )}
    </div>
  );
}
