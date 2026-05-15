// Grey SVG used as fallback when an image URL is broken
export const IMAGE_FALLBACK_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='%23f3f4f6'/%3E%3C/svg%3E";

const API_ORIGIN = import.meta.env.VITE_API_URL || '';

/**
 * Resolve a stored image URL to an absolute URL.
 * Stored images are saved as /api/files/<id> (relative).
 * Prefix with the backend origin so the browser fetches from the right server.
 */
export function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return url;
}

// Kept for backward-compat
export function getListingPlaceholder() {
  return IMAGE_FALLBACK_SRC;
}
