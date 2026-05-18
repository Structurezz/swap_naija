import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, ChevronLeft, ChevronRight, Grid3X3, List, ChevronDown, Shield, Zap, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchListings } from '../api/listings.api';
import { getCategories } from '../api/categories.api';
import TopBar from '../components/layout/TopBar';
import FeaturedCard from '../components/features/listing/FeaturedCard';

const LIMIT = 20;

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'value_desc', label: 'Highest Value' },
  { value: 'value_asc', label: 'Lowest Value' },
];

function SkeletonCard({ viewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="flex gap-3 bg-white rounded-2xl p-3 animate-pulse shadow-card">
        <div className="flex-none w-24 h-24 bg-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-200 rounded-lg w-4/5" />
          <div className="h-4 bg-gray-200 rounded-lg w-2/5" />
          <div className="h-3 bg-gray-200 rounded-lg w-3/5" />
          <div className="h-3 bg-gray-200 rounded-lg w-2/5" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-card">
      <div className="h-44 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded-lg w-4/5" />
        <div className="h-4 bg-gray-200 rounded-lg w-2/5" />
        <div className="h-3 bg-gray-200 rounded-lg w-3/5" />
        <div className="flex justify-between mt-1">
          <div className="h-3 bg-gray-200 rounded-lg w-1/3" />
          <div className="h-3 bg-gray-200 rounded-lg w-1/5" />
        </div>
      </div>
    </div>
  );
}

function PageButton({ page, currentPage, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 rounded-xl text-sm font-medium transition ${
        page === currentPage
          ? 'bg-primary text-white shadow-sm'
          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {page}
    </button>
  );
}

export default function FeaturedListings() {
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['featured', page, categoryId, sort],
    queryFn: () => searchListings({ sort, isBoosted: true, page, limit: LIMIT, categoryId }),
    keepPreviousData: true,
  });

  const listings = data?.listings ?? [];
  const total = data?.total ?? 0;
  const totalPages = data ? Math.ceil(total / LIMIT) : 1;

  const handleCategoryChange = (id) => {
    setCategoryId(id);
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSort(value);
    setPage(1);
    setShowSortMenu(false);
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Sort';

  const pageNumbers = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Featured Listings" showBack />

      {/* Top loading bar */}
      {isFetching && !isLoading && (
        <div className="fixed top-0 left-0 right-0 h-0.5 z-50 overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.8, ease: 'easeInOut', repeat: Infinity }}
            className="h-full w-1/2 bg-primary"
          />
        </div>
      )}

      <div className="max-w-md lg:max-w-7xl mx-auto">

        {/* ─── Desktop Hero ─── */}
        <div className="hidden lg:block lg:mx-8 lg:mt-8 lg:mb-4">
          <div className="relative bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 rounded-3xl px-10 py-10 text-white overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full" />
              <div className="absolute bottom-0 right-20 w-36 h-36 bg-white/5 rounded-full" />
              <div className="absolute top-8 right-40 w-20 h-20 bg-white/10 rounded-full" />
            </div>

            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-none"
                  >
                    <Star size={30} fill="white" className="text-white" />
                  </motion.div>
                  <div>
                    <h1 className="font-display font-bold text-4xl leading-tight">Featured Listings</h1>
                    <p className="text-white/85 text-base mt-0.5">Top picks and boosted listings on SwapNaija</p>
                  </div>
                </div>

                {total > 0 && (
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 mt-4"
                  >
                    <span className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      {total.toLocaleString()} featured listings
                    </span>
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
                  <Shield size={16} />
                  <span className="text-sm font-medium">Verified Sellers</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
                  <Zap size={16} />
                  <span className="text-sm font-medium">Fast Trades</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
                  <Flame size={16} />
                  <span className="text-sm font-medium">Hot Deals</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Mobile Hero ─── */}
        <div className="lg:hidden">
          <div className="flex items-center gap-2 px-4 pt-4">
            <div className="w-9 h-9 bg-amber-100 rounded-2xl flex items-center justify-center flex-none">
              <Star size={18} className="text-amber-500" fill="#F59E0B" />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-lg text-ink leading-none">Featured Listings</h1>
              <p className="text-xs text-gray-500">Top picks on SwapNaija</p>
            </div>
            {total > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                {total.toLocaleString()}
              </span>
            )}
          </div>

          <div className="mx-4 mt-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl px-4 py-3 text-white flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 12, -12, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            >
              <Star size={20} fill="white" className="flex-none" />
            </motion.div>
            <div className="flex-1">
              <p className="font-semibold text-sm leading-none">SwapNaija Featured</p>
              <p className="text-xs opacity-80 mt-0.5">Verified quality items & trusted swappers</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium bg-white/20 rounded-lg px-2 py-1 flex-none">
              <Shield size={10} />
              Verified
            </div>
          </div>
        </div>

        {/* ─── Sticky Controls Bar ─── */}
        <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-sm border-b border-gray-100 mt-4">
          {/* Scrollable category chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 lg:px-8 pt-3 pb-2">
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap transition-all flex-none border ${
                !categoryId
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:text-primary'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => handleCategoryChange(c.id)}
                className={`px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap transition-all flex-none border ${
                  categoryId === c.id
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:text-primary'
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {/* Sort + View toggle row */}
          <div className="flex items-center justify-between px-4 lg:px-8 pb-3">
            <p className="text-xs text-gray-400">
              {isLoading ? 'Loading…' : isFetching ? 'Refreshing…' : total > 0 ? `${total.toLocaleString()} results` : ''}
            </p>

            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setShowSortMenu(s => !s)}
                  className="flex items-center gap-1.5 text-xs lg:text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-1.5 hover:border-gray-300 transition"
                >
                  {currentSortLabel}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-full mt-1.5 bg-white rounded-2xl shadow-card-hover border border-gray-100 overflow-hidden z-30 min-w-[160px]"
                    >
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleSortChange(opt.value)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-gray-50 ${
                            sort === opt.value ? 'text-primary font-semibold bg-primary/5' : 'text-gray-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Grid / List toggle */}
              <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grid view"
                >
                  <Grid3X3 size={15} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  title="List view"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Listing Content ─── */}
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          {isLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3' : 'flex flex-col gap-3'}>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} viewMode={viewMode} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-3">📦</p>
              <p className="font-semibold text-gray-700 text-lg">No featured listings right now</p>
              <p className="text-sm text-gray-400 mt-1">Check back soon — great items are on the way!</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${categoryId}-${sort}-${page}-${viewMode}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3'
                    : 'flex flex-col gap-3'
                }
              >
                {listings.map(listing => (
                  <FeaturedCard key={listing.id} listing={listing} viewMode={viewMode} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* ─── Pagination ─── */}
          {totalPages > 1 && !isLoading && (
            <div className="flex items-center justify-center gap-1.5 pt-6 pb-10 lg:pt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <ChevronLeft size={18} />
              </button>

              {pageNumbers[0] > 1 && (
                <>
                  <PageButton page={1} currentPage={page} onClick={() => setPage(1)} />
                  {pageNumbers[0] > 2 && (
                    <span className="text-gray-400 text-sm w-5 text-center">…</span>
                  )}
                </>
              )}

              {pageNumbers.map(p => (
                <PageButton key={p} page={p} currentPage={page} onClick={() => setPage(p)} />
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="text-gray-400 text-sm w-5 text-center">…</span>
                  )}
                  <PageButton page={totalPages} currentPage={page} onClick={() => setPage(totalPages)} />
                </>
              )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
