import { useState } from 'react';
import { resolveImageUrl } from '../../utils/placeholder';

function Avatar({ src, name, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const colors = ['bg-primary', 'bg-accent', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500'];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;

  const resolvedSrc = resolveImageUrl(src);

  if (resolvedSrc && !imgError) {
    return (
      <img
        src={resolvedSrc}
        alt={name || 'Avatar'}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${colors[colorIdx]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}

export default Avatar;
