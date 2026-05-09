import Avatar from '../../ui/Avatar';
import Badge from '../../ui/Badge';
import ReviewStars from '../review/ReviewStars';
import TrustBadge from './TrustBadge';

function ProfileCard({ user, children }) {
  return (
    <div className="card text-center">
      <div className="flex flex-col items-center gap-3">
        <Avatar src={user.avatarUrl} name={user.fullName} size="xl" />
        <div>
          <h2 className="font-display font-bold text-xl">{user.fullName || 'SwapNaija User'}</h2>
          {user.username && <p className="text-gray-500 text-sm">@{user.username}</p>}
        </div>

        <div className="flex items-center gap-2">
          <ReviewStars rating={Math.round(user.ratingAvg || 0)} size={16} />
          <span className="text-sm text-gray-600">
            {user.ratingAvg?.toFixed(1) || '—'} ({user.ratingCount || 0})
          </span>
        </div>

        <TrustBadge verification={user.verification} />

        <div className="flex gap-4 text-center text-sm">
          <div>
            <p className="font-bold text-lg">{user.swapCount || 0}</p>
            <p className="text-gray-500">Swaps</p>
          </div>
          {user.locationState && (
            <div>
              <p className="font-semibold">{user.locationState}</p>
              <p className="text-gray-500">Location</p>
            </div>
          )}
        </div>

        {user.bio && (
          <p className="text-sm text-gray-600 text-center max-w-xs">{user.bio}</p>
        )}

        {children}
      </div>
    </div>
  );
}

export default ProfileCard;
