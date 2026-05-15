// Grey SVG used as fallback when an image URL is broken
export const IMAGE_FALLBACK_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='%23f3f4f6'/%3E%3C/svg%3E";

// Kept for backward-compat — same grey SVG regardless of listing
export function getListingPlaceholder() {
  return IMAGE_FALLBACK_SRC;
}
