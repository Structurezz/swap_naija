import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Eye, Repeat2, Bookmark, BookmarkCheck, Share2, TrendingUp, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../../ui/Badge';
import { IMAGE_FALLBACK_SRC, resolveImageUrl, getListingPlaceholder } from '../../../utils/placeholder';

const CONDITION_LABELS = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const CONDITION_VARIANTS = {
  new: 'success',
  like_new: 'primary',
  good: 'info',
  fair: 'warning',
  poor: 'danger',
};

function FeaturedCard({ listing, viewMode = 'grid' }) {
  const [saved, setSaved] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const firstImage = resolveImageUrl(listing.images?.[0]);
  const placeholder = getListingPlaceholder(listing);
  const isTrending = (listing.viewCount || 0) >= 30;

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(s => !s);
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/listing/${listing.id}`;
    if (navigator.share) {
      navigator.share({ title: listing.title, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15 }}
        className="relative"
      >
        <Link
          to={`/listing/${listing.id}`}
          className="flex gap-3 bg-white rounded-2xl p-3 overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="relative flex-none w-24 h-24 rounded-xl overflow-hidden">
            <img
              src={firstImage || placeholder}
              alt={listing.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
            />
            {listing.isBoosted && (
              <span className="absolute top-1 left-1 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold leading-none">
                ⭐
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-ink line-clamp-2 leading-snug flex-1">{listing.title}</h3>
              <div className="flex gap-1 flex-none">
                <button
                  onClick={handleSave}
                  className={`p-1.5 rounded-lg transition ${
                    saved ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400 hover:text-primary hover:bg-primary/10'
                  }`}
                >
                  {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                </button>
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:text-primary hover:bg-primary/10 transition"
                >
                  <Share2 size={14} />
                </button>
              </div>
            </div>

            {listing.estimatedValue && (
              <p className="text-primary text-sm font-bold mt-0.5">
                ₦{listing.estimatedValue.toLocaleString()}
              </p>
            )}

            {listing.wantsTitle && (
              <div className="flex items-center gap-1 mt-1">
                <Repeat2 size={12} className="text-accent flex-shrink-0" />
                <p className="text-xs text-gray-500 truncate">Wants: {listing.wantsTitle}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {listing.locationState && (
                <div className="flex items-center gap-1 text-gray-400">
                  <MapPin size={11} />
                  <span className="text-xs">{listing.locationLga || listing.locationState}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-400">
                <Eye size={11} />
                <span className="text-xs">{listing.viewCount || 0}</span>
              </div>
              {isTrending && (
                <span className="flex items-center gap-0.5 text-orange-500 text-xs font-semibold">
                  <TrendingUp size={11} />
                  Trending
                </span>
              )}
              {listing.condition && (
                <Badge variant={CONDITION_VARIANTS[listing.condition]} size="sm">
                  {CONDITION_LABELS[listing.condition]}
                </Badge>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      <Link
        to={`/listing/${listing.id}`}
        className="block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
      >
        <div className="relative">
          <img
            src={firstImage || placeholder}
            alt={listing.title}
            className="w-full h-44 object-cover"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
          />

          {/* Hover overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent flex items-end justify-center pb-3"
          >
            <span className="bg-white text-ink text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <ExternalLink size={12} />
              View Listing
            </span>
          </motion.div>

          {/* Top-left badge */}
          {listing.isBoosted && (
            <span className="absolute top-2 left-2 bg-accent text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow-sm">
              ⭐ Featured
            </span>
          )}
          {isTrending && !listing.isBoosted && (
            <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm">
              <TrendingUp size={10} />
              Trending
            </span>
          )}

          {/* Condition badge */}
          {listing.condition && (
            <span className="absolute top-2 right-2">
              <Badge variant={CONDITION_VARIANTS[listing.condition]} size="sm">
                {CONDITION_LABELS[listing.condition]}
              </Badge>
            </span>
          )}

          {/* Quick action buttons — appear on hover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.85 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-10 right-2 flex gap-1.5"
          >
            <button
              onClick={handleSave}
              title={saved ? 'Saved' : 'Save listing'}
              className={`p-2 rounded-full shadow-lg transition-colors ${
                saved ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </button>
            <button
              onClick={handleShare}
              title={copied ? 'Link copied!' : 'Share listing'}
              className={`p-2 rounded-full shadow-lg transition-colors ${
                copied ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Share2 size={14} />
            </button>
          </motion.div>
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-sm text-ink line-clamp-2 leading-snug">{listing.title}</h3>

          {listing.estimatedValue && (
            <p className="text-primary text-sm font-bold mt-1">
              ₦{listing.estimatedValue.toLocaleString()}
            </p>
          )}

          {listing.wantsTitle && (
            <div className="flex items-center gap-1 mt-1.5">
              <Repeat2 size={12} className="text-accent flex-shrink-0" />
              <p className="text-xs text-gray-500 truncate">Wants: {listing.wantsTitle}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            {listing.locationState ? (
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin size={11} />
                <span className="text-xs">{listing.locationLga || listing.locationState}</span>
              </div>
            ) : <span />}
            <div className="flex items-center gap-2">
              {isTrending && (
                <span className="flex items-center gap-0.5 text-orange-500 text-xs font-semibold">
                  <TrendingUp size={10} />
                </span>
              )}
              <div className="flex items-center gap-1 text-gray-400">
                <Eye size={11} />
                <span className="text-xs">{listing.viewCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default FeaturedCard;
