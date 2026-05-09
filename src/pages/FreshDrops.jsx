import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchListings } from '../api/listings.api';
import { getCategories } from '../api/categories.api';
import ListingGrid from '../components/features/listing/ListingGrid';
import TopBar from '../components/layout/TopBar';

const LIMIT = 20;

export default function FreshDrops() {
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['fresh-drops', page, categoryId],
    queryFn: () => searchListings({ sort: 'newest', page, limit: LIMIT, categoryId }),
    keepPreviousData: true,
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Fresh Drops" showBack />

      <div className="max-w-md lg:max-w-7xl mx-auto">
        {/* Desktop hero header */}
        <div className="hidden lg:flex items-end justify-between mb-6 pt-8 px-8">
          <div className="flex items-end gap-4">
            <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center flex-none">
              <Zap size={28} className="text-yellow-500" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-ink leading-tight">⚡ Fresh Drops</h1>
              <p className="text-sm text-gray-500 mt-0.5">The newest listings on SwapNaija, updated in real time</p>
            </div>
          </div>
          {data && (
            <span className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 shadow-sm">
              {data.total} listings
            </span>
          )}
        </div>

        {/* Mobile header */}
        <div className="flex items-center gap-2 px-4 pt-4 lg:hidden">
          <div className="w-8 h-8 bg-yellow-100 rounded-xl flex items-center justify-center flex-none">
            <Zap size={16} className="text-yellow-500" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-ink">Fresh Drops</h1>
            <p className="text-xs text-gray-500">The newest listings on SwapNaija</p>
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
            <p className="text-xs text-gray-500 lg:hidden">{data.total} listings</p>
          )}

          <ListingGrid
            listings={data?.listings}
            loading={isLoading}
            emptyMessage="No fresh listings yet"
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
