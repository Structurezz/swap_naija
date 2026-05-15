import { Link } from 'react-router-dom';
import { MapPin, Eye, Repeat2, ImageOff } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../../ui/Badge';
import { IMAGE_FALLBACK_SRC } from '../../../utils/placeholder';

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

function ListingCard({ listing }) {
  const firstImage = listing.images?.[0];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      <Link to={`/listing/${listing.id}`} className="block card p-0 overflow-hidden">
        <div className="relative">
          {firstImage ? (
            <img
              src={firstImage}
              alt={listing.title}
              className="w-full h-40 object-cover"
              loading="lazy"
              onError={(e) => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
            />
          ) : (
            <div className="w-full h-40 bg-gray-100 flex flex-col items-center justify-center gap-1.5">
              <ImageOff size={24} className="text-gray-300" />
              <span className="text-xs text-gray-300 font-medium">No photo</span>
            </div>
          )}
          {listing.isBoosted && (
            <span className="absolute top-2 left-2 bg-accent text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              Boosted
            </span>
          )}
          {listing.condition && (
            <span className="absolute top-2 right-2">
              <Badge variant={CONDITION_VARIANTS[listing.condition]} size="sm">
                {CONDITION_LABELS[listing.condition]}
              </Badge>
            </span>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-sm truncate">{listing.title}</h3>

          {listing.estimatedValue && (
            <p className="text-primary text-xs font-semibold mt-0.5">
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
            {listing.locationState && (
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin size={11} />
                <span className="text-xs">{listing.locationLga || listing.locationState}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-gray-400 ml-auto">
              <Eye size={11} />
              <span className="text-xs">{listing.viewCount || 0}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default ListingCard;
