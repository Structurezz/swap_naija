import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchListings } from '../api/listings.api';
import { getCategories } from '../api/categories.api';
import ListingGrid from '../components/features/listing/ListingGrid';
import TopBar from '../components/layout/TopBar';

const LIMIT = 20;

export default function FeaturedListings() {
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['featured', page, categoryId],
    queryFn: () => searchListings({ sort: 'popular', isBoosted: true, page, limit: LIMIT, categoryId }),
    keepPreviousData: true,
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Featured Listings" showBack />

      <div className="max-w-md lg:max-w-7xl mx-auto">
        {/* Desktop hero banner */}
        <div className="hidden lg:block lg:mx-8 lg:mb-6 lg:mt-8 lg:rounded-3xl bg-gradient-to-r from-amber-400 to-orange-500 px-10 py-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Star size={32} fill="white" className="flex-none" />
                <h1 className="font-display font-bold text-4xl leading-tight">Featured Listings</h1>
              </div>
              <p className="text-white/85 text-base mt-1">Top picks and boosted listings on SwapNaija</p>
              {data && (
                <span className="inline-block bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mt-3">
                  {data.total} featured listings
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile header */}
        <div className="flex items-center gap-2 px-4 pt-4 lg:hidden">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-none">
            <Star size={16} className="text-amber-500" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-ink">Featured Listings</h1>
            <p className="text-xs text-gray-500">Top picks and boosted listings on SwapNaija</p>
          </div>
          {data && (
            <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
              {data.total}
            </span>
          )}
        </div>

        {/* Mobile featured strip */}
        <div className="mx-4 mt-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl px-4 py-3 text-white flex items-center gap-3 lg:hidden">
          <Star size={20} className="flex-none" fill="white" />
          <div>
            <p className="font-semibold text-sm">SwapNaija Featured</p>
            <p className="text-xs opacity-80">Verified quality items & trusted swappers</p>
          </div>
        </div>

        {/* Sticky category chips bar — desktop */}
        <div className="hidden lg:block sticky top-0 z-10 bg-bg border-b border-gray-100 px-8 py-3">
          <div className="flex flex-row flex-wrap gap-2">
            <button
              onClick={() => { setCategoryId(''); setPage(1); }}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                !categoryId ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => { setCategoryId(c.id); setPage(1); }}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  categoryId === c.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 lg:space-y-6">
          {/* Category chips — mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:hidden">
            <button
              onClick={() => { setCategoryId(''); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-none ${
                !categoryId ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => { setCategoryId(c.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-none ${
                  categoryId === c.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {/* Results count — mobile only */}
          {data && (
            <p className="text-xs text-gray-500 lg:hidden">{data.total} featured listings</p>
          )}

          <ListingGrid
            listings={data?.listings}
            loading={isLoading}
            emptyMessage="No featured listings right now — check back soon!"
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
