/**
 * Returns a random but consistent photo URL for a listing using picsum.photos.
 * The same listing always gets the same image (seeded by listing id or title).
 *
 * @param {object} listing
 * @param {number} [w=400]
 * @param {number} [h=300]
 */
export function getListingPlaceholder(listing, w = 400, h = 300) {
  // Use listing id as seed so the image is stable across renders
  const seed = listing?.id || listing?._id || listing?.title || 'swapnaija';
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}
