import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { getSuggested } from '../api/listings.api';
import ListingGrid from '../components/features/listing/ListingGrid';
import TopBar from '../components/layout/TopBar';

const LIMIT = 20;

export default function SuggestedForYou() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['suggested', page],
    queryFn: () => getSuggested({ page, limit: LIMIT }),
    keepPreviousData: true,
  });

  // API returns { listings, total } or { matches, total } depending on shape
  const listings = data?.listings || data?.matches || [];
  const total = data?.total || 0;
  const totalPages = total ? Math.ceil(total / LIMIT) : 1;

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Suggested For You" showBack />

      <div className="max-w-md lg:max-w-7xl mx-auto">
        {/* Desktop hero header */}
        <div className="hidden lg:flex items-end justify-between mb-6 pt-8 px-8">
          <div className="flex items-end gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center flex-none">
              <Sparkles size={28} className="text-purple-500" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-ink leading-tight">Suggested For You</h1>
              <p className="text-sm text-gray-500 mt-0.5">Listings matched to what you want to swap</p>
            </div>
          </div>
          {!isLoading && !isError && total > 0 && (
            <span className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 shadow-sm">
              {total} suggestions
            </span>
          )}
        </div>

        {/* Mobile header */}
        <div className="flex items-center gap-2 px-4 pt-4 lg:hidden">
          <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center flex-none">
            <Sparkles size={16} className="text-purple-500" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-ink">Suggested For You</h1>
            <p className="text-xs text-gray-500">Listings matched to what you want to swap</p>
          </div>
        </div>

        {/* Desktop info banner */}
        <div className="hidden lg:block mx-8 mb-4">
          <div className="bg-purple-50 border border-purple-100 rounded-2xl px-6 py-4 flex items-center gap-4">
            <Sparkles size={24} className="text-purple-500 flex-none" />
            <p className="text-sm text-purple-700 leading-relaxed">
              These are based on what others want in exchange for their listings, matched against yours.
              The more listings you post, the better your suggestions get.
            </p>
          </div>
        </div>

        <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 lg:space-y-6">
          {/* Mobile info banner */}
          <div className="bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 flex gap-2.5 lg:hidden">
            <Info size={15} className="text-purple-500 flex-none mt-0.5" />
            <p className="text-xs text-purple-700">
              These are based on what others want in exchange for their listings, matched against yours.
              The more listings you post, the better your suggestions.
            </p>
          </div>

          {/* Results count — mobile only */}
          {!isLoading && !isError && (
            <p className="text-xs text-gray-500 lg:hidden">{total} suggested listings</p>
          )}

          <ListingGrid
            listings={listings}
            loading={isLoading}
            error={isError}
            emptyMessage="No suggestions yet — post some listings to get personalised matches!"
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 lg:gap-4 pt-4 pb-8 lg:py-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 lg:px-5 lg:py-2.5 rounded-xl lg:rounded-2xl bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition lg:flex lg:items-center lg:gap-1.5 lg:text-sm lg:font-medium"
              >
                <ChevronLeft size={18} />
                <span className="hidden lg:inline">Previous</span>
              </button>
              <span className="text-sm lg:text-base font-medium text-ink">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 lg:px-5 lg:py-2.5 rounded-xl lg:rounded-2xl bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition lg:flex lg:items-center lg:gap-1.5 lg:text-sm lg:font-medium"
              >
                <span className="hidden lg:inline">Next</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
