import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Zap, ChevronLeft, ChevronRight, LayoutGrid, List,
  SlidersHorizontal, Clock, TrendingUp, DollarSign,
  MapPin, ArrowRightLeft, Bookmark, Share2, Flame,
  CheckCheck, Package,
} from 'lucide-react';
import { searchListings } from '../api/listings.api';
import { getCategories } from '../api/categories.api';
import TopBar from '../components/layout/TopBar';
import { resolveImageUrl, getListingPlaceholder, IMAGE_FALLBACK_SRC } from '../utils/placeholder';

const LIMIT = 20;

const SORT_OPTIONS = [
  { value: 'newest',      label: 'Just Dropped',    icon: Zap,        desc: 'Most recent first'     },
  { value: 'popular',     label: 'Most Viewed',     icon: TrendingUp, desc: 'Trending this week'    },
  { value: 'value_desc',  label: 'Highest Value',   icon: DollarSign, desc: 'Premium listings first' },
  { value: 'value_asc',   label: 'Budget Friendly', icon: Package,    desc: 'Lower value first'     },
];

// ─── Animated lightning bolt (hero icon) ───────────────────────────────────────
function ZapIcon({ size = 32 }) {
  return (
    <motion.div
      animate={{
        filter: [
          'drop-shadow(0 0 0px #fff)',
          'drop-shadow(0 0 8px #fff8)',
          'drop-shadow(0 0 0px #fff)',
        ],
        scale: [1, 1.12, 1],
      }}
      transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
    >
      <Zap size={size} className="text-white fill-white" />
    </motion.div>
  );
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard({ viewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl p-3.5 flex gap-4 animate-pulse">
        <div className="w-24 h-24 bg-gray-100 rounded-xl flex-none" />
        <div className="flex-1 py-1 space-y-2.5">
          <div className="h-3.5 bg-gray-100 rounded-lg w-4/5" />
          <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
          <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-100" />
      <div className="p-3.5 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded-lg w-4/5" />
        <div className="h-3 bg-gray-100 rounded-lg w-2/5" />
        <div className="h-4 bg-gray-100 rounded-lg w-1/3 mt-2" />
      </div>
    </div>
  );
}

// ─── Drop card (grid) ──────────────────────────────────────────────────────────
function DropCard({ listing, index }) {
  const [saved, setSaved] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const reduced = useReducedMotion();
  const img = resolveImageUrl(listing.images?.[0]) || getListingPlaceholder(listing);
  const hoursOld = listing.createdAt
    ? (Date.now() - new Date(listing.createdAt).getTime()) / 36e5
    : 99;
  const isHot = (listing.viewCount ?? 0) >= 20;

  const handleShare = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(window.location.origin + `/listing/${listing.id}`);
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 2000);
  };

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.045, 0.35), duration: 0.3, ease: 'easeOut' }}
    >
      <Link
        to={`/listing/${listing.id}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/20 shadow-[0_1px_4px_rgba(0,0,0,.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,.1)] transition-all duration-300"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
          <img
            src={img}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            onError={e => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="bg-white text-ink text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <ArrowRightLeft size={11} strokeWidth={2.5} />
              View Swap
            </span>
          </div>

          {/* Top-left badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {hoursOld < 3 && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full"
              >
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 0.9 }}
                >⚡</motion.span>
                NEW
              </motion.span>
            )}
            {isHot && (
              <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                <Flame size={9} /> HOT
              </span>
            )}
          </div>

          {/* Top-right actions */}
          <div className="absolute top-2.5 right-2.5 flex gap-1.5 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={e => { e.preventDefault(); setSaved(s => !s); }}
              className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition ${
                saved ? 'bg-primary text-white' : 'bg-white/90 text-gray-600 hover:bg-white'
              }`}
            >
              <Bookmark size={12} fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleShare}
              className="w-7 h-7 rounded-full bg-white/90 text-gray-600 hover:bg-white flex items-center justify-center shadow-md backdrop-blur-sm transition"
            >
              {shareFeedback
                ? <CheckCheck size={11} className="text-primary" />
                : <Share2 size={11} />
              }
            </button>
          </div>

          {/* Condition pill */}
          {listing.condition && (
            <span className="absolute bottom-2.5 right-2.5 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm capitalize opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {listing.condition}
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="p-3.5">
          <h3 className="font-semibold text-[13px] text-ink leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors duration-200">
            {listing.title}
          </h3>
          {listing.estimatedValue ? (
            <p className="text-primary font-bold text-sm">
              ₦{listing.estimatedValue.toLocaleString()}
            </p>
          ) : (
            <p className="text-gray-400 text-xs italic">Value not listed</p>
          )}
          {listing.locationState && (
            <div className="flex items-center gap-1 mt-2 text-gray-400">
              <MapPin size={10} />
              <span className="text-[11px]">{listing.locationState}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Drop card (list) ──────────────────────────────────────────────────────────
function DropListCard({ listing, index }) {
  const [saved, setSaved] = useState(false);
  const reduced = useReducedMotion();
  const img = resolveImageUrl(listing.images?.[0]) || getListingPlaceholder(listing);
  const hoursOld = listing.createdAt
    ? (Date.now() - new Date(listing.createdAt).getTime()) / 36e5
    : 99;

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.3), duration: 0.28, ease: 'easeOut' }}
    >
      <Link
        to={`/listing/${listing.id}`}
        className="group flex gap-4 bg-white rounded-2xl p-3.5 border border-gray-100 hover:border-primary/20 shadow-[0_1px_4px_rgba(0,0,0,.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,.08)] transition-all duration-300"
      >
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-none">
          <img
            src={img}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
            onError={e => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
          />
          {hoursOld < 3 && (
            <span className="absolute top-1 left-1 bg-amber-400 text-amber-950 text-[8px] font-black px-1.5 py-0.5 rounded-full">NEW</span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-sm text-ink leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200 mb-1">
            {listing.title}
          </h3>
          {listing.estimatedValue && (
            <p className="text-primary font-bold text-sm mb-1">₦{listing.estimatedValue.toLocaleString()}</p>
          )}
          {listing.locationState && (
            <div className="flex items-center gap-1 text-gray-400">
              <MapPin size={10} /><span className="text-xs">{listing.locationState}</span>
            </div>
          )}
          {listing.wantsInReturn && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              Wants: <span className="text-gray-600 font-medium">{listing.wantsInReturn}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-end justify-between flex-none">
          <button
            onClick={e => { e.preventDefault(); setSaved(s => !s); }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
              saved ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary'
            }`}
          >
            <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
          </button>
          {listing.condition && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{listing.condition}</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Animated category chip ────────────────────────────────────────────────────
function CategoryChip({ cat, active, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-none transition-colors duration-200 ${
        active
          ? 'text-white'
          : 'bg-white text-gray-500 border border-gray-200 hover:border-primary/30 hover:text-primary'
      }`}
    >
      {active && (
        <motion.div
          layoutId="cat-active"
          className="absolute inset-0 rounded-full bg-primary"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <motion.span
        className="relative z-10 text-[13px] leading-none"
        animate={active ? { rotate: [0, -8, 8, 0] } : {}}
        transition={{ duration: 0.35 }}
      >
        {cat.icon || '📦'}
      </motion.span>
      <span className="relative z-10">{cat.name}</span>
    </motion.button>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }) {
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 py-10">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 rounded-xl bg-white border border-gray-200 disabled:opacity-30 hover:border-primary/30 hover:text-primary flex items-center justify-center transition-colors"
      >
        <ChevronLeft size={16} />
      </motion.button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
        ) : (
          <motion.button
            key={p}
            whileTap={{ scale: 0.9 }}
            onClick={() => onPage(p)}
            className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
              p === page
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/30 hover:text-primary'
            }`}
          >
            {p}
          </motion.button>
        )
      )}

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 rounded-xl bg-white border border-gray-200 disabled:opacity-30 hover:border-primary/30 hover:text-primary flex items-center justify-center transition-colors"
      >
        <ChevronRight size={16} />
      </motion.button>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function FreshDrops() {
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef(null);
  const topRef = useRef(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['fresh-drops', page, categoryId, sort],
    queryFn: () => searchListings({ sort, page, limit: LIMIT, categoryId }),
    keepPreviousData: true,
  });

  const listings = data?.listings ?? [];
  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  const handlePage = (p) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCat = (id) => { setCategoryId(id); setPage(1); };
  const handleSort = (v) => { setSort(v); setPage(1); setShowSort(false); };

  useEffect(() => {
    const h = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const allCats = [{ id: '', name: 'All', icon: '✨' }, ...categories.map(c => ({ id: c.id, name: c.name, icon: c.icon }))];
  const activeSort = SORT_OPTIONS.find(o => o.value === sort);

  return (
    <div ref={topRef} className="min-h-screen bg-[#F7F7F5]">
      {/* Loading bar */}
      <AnimatePresence>
        {(isLoading || isFetching) && (
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-primary to-amber-400 z-50 origin-left"
          />
        )}
      </AnimatePresence>

      <TopBar title="Fresh Drops" showBack />

      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <div className="relative bg-[#0F0F0F] overflow-hidden">
        {/* BG glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative w-full px-4 lg:px-8 py-8 lg:py-12">
          <div className="flex items-center gap-5">
            {/* Icon */}
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-amber-400/15 border border-amber-400/25 flex items-center justify-center flex-none">
              <ZapIcon size={28} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-display font-bold text-2xl lg:text-4xl text-white tracking-tight">Fresh Drops</h1>
                {/* Live pill */}
                <motion.span
                  animate={{ opacity: [1, 0.55, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold px-2.5 py-1 rounded-full"
                >
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  LIVE
                </motion.span>
              </div>
              <p className="text-white/50 text-sm">The latest listings from across Nigeria — updated in real time</p>
            </div>

            {/* Total count */}
            {data && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden sm:flex flex-col items-end flex-none"
              >
                <span className="font-display font-bold text-2xl lg:text-3xl text-white">{data.total.toLocaleString()}</span>
                <span className="text-white/40 text-xs">listings</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-4 lg:px-8">

        {/* ─── Controls ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 py-4">
          {/* Sort */}
          <div className="relative" ref={sortRef}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSort(s => !s)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-primary/30 shadow-sm transition-colors"
            >
              {activeSort && <activeSort.icon size={14} className="text-primary" />}
              <span className="hidden sm:inline">{activeSort?.label}</span>
              <motion.div
                animate={{ rotate: showSort ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft size={14} className="rotate-90 text-gray-400" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20"
                >
                  {SORT_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      onClick={() => handleSort(value)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition ${
                        sort === value ? 'bg-primary/6 text-primary' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-none mt-0.5 ${sort === value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon size={13} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-none">{label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm gap-0.5">
            {[{ m: 'grid', I: LayoutGrid }, { m: 'list', I: List }].map(({ m, I }) => (
              <motion.button
                key={m}
                whileTap={{ scale: 0.88 }}
                onClick={() => setViewMode(m)}
                className={`relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                  viewMode === m ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {viewMode === m && (
                  <motion.div layoutId="vp" className="absolute inset-0 bg-primary/10 rounded-lg" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <I size={14} className="relative z-10" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* ─── Category chips ─────────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-2">
          {allCats.map(cat => (
            <CategoryChip
              key={cat.id}
              cat={cat}
              active={categoryId === cat.id}
              onClick={() => handleCat(cat.id)}
            />
          ))}
        </div>

        {/* Active sort label */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400">
            {data ? `${data.total.toLocaleString()} listings` : ''}
            {categoryId && categories.find(c => c.id === categoryId) ? ` · ${categories.find(c => c.id === categoryId).name}` : ''}
          </p>
          <p className="text-xs text-gray-400 hidden sm:block">
            Sorted by <span className="text-primary font-medium">{activeSort?.label}</span>
          </p>
        </div>

        {/* ─── Grid / List ────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${categoryId}-${sort}-${viewMode}-${page}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {isLoading ? (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4'
                : 'space-y-3'
              }>
                {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} viewMode={viewMode} />)}
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-5"
                >
                  <Zap size={28} className="text-amber-500" />
                </motion.div>
                <p className="font-bold text-lg text-ink mb-1">Nothing here yet</p>
                <p className="text-sm text-gray-400 max-w-xs">Be the first to drop something — start a listing and hit the top of the feed.</p>
                <Link
                  to="/create"
                  className="mt-5 bg-primary text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-primary-600 transition"
                >
                  + Create Listing
                </Link>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4'
                : 'space-y-3'
              }>
                {listings.map((l, i) =>
                  viewMode === 'grid'
                    ? <DropCard key={l.id} listing={l} index={i} />
                    : <DropListCard key={l.id} listing={l} index={i} />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ─── Pagination ─────────────────────────────────────────────────────── */}
        {totalPages > 1 && !isLoading && (
          <Pagination page={page} totalPages={totalPages} onPage={handlePage} />
        )}
      </div>
    </div>
  );
}
