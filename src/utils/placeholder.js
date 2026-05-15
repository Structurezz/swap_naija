// Grey SVG used when an image URL is broken (onError fallback)
export const IMAGE_FALLBACK_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='%23f3f4f6'/%3E%3C/svg%3E";

const API_ORIGIN = import.meta.env.VITE_API_URL || 'https://swapnigeria-production.up.railway.app';

/**
 * Resolve a stored image URL to an absolute URL.
 * Images are saved as /api/files/<id>; prefix with backend origin.
 */
export function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return url;
}

/**
 * Returns a stable picsum placeholder for listings that have no images.
 * The same listing always gets the same photo (seeded by its id).
 */
export function getListingPlaceholder(listing, w = 400, h = 300) {
  const seed = listing?.id || listing?._id || listing?.title || 'swapnaija';
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}
