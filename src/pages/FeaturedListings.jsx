import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Star, ChevronLeft, ChevronRight, ShieldCheck, Zap,
  TrendingUp, DollarSign, RefreshCw, Award, BadgeCheck, Flame,
} from 'lucide-react';
import { searchListings } from '../api/listings.api';
import { getCategories } from '../api/categories.api';
import ListingGrid from '../components/features/listing/ListingGrid';
import TopBar from '../components/layout/TopBar';
import { Link } from 'react-router-dom';

const LIMIT = 20;

const SORT_OPTIONS = [
  { value: 'popular',    label: 'Most Popular'   },
  { value: 'newest',     label: 'Newest First'   },
  { value: 'value_desc', label: 'Highest Value'  },
  { value: 'value_asc',  label: 'Lowest Value'   },
];

const FEAT_SIGNALS = [
  { label: 'Featured Now',    value: '—',   icon: Star,       color: 'text-amber-500',   bg: 'bg-amber-50'    },
  { label: 'Verified Sellers',value: '89%', icon: ShieldCheck,color: 'text-emerald-500', bg: 'bg-emerald-50'  },
  { label: 'Avg Value',       value: '₦120k',icon: DollarSign, color: 'text-blue-500',    bg: 'bg-blue-50'     },
  { label: 'Swap Success',    value: '91%', icon: TrendingUp, color: 'text-violet-500',  bg: 'bg-violet-50'   },
];

const WHAT_FEATURED_MEANS = [
  {
    icon: Award,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    step: '01',
    title: 'Boosted by the Trader',
    desc: 'Traders pay a small boost fee to get their listing elevated into the Featured feed for maximum visibility.',
  },
  {
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    step: '02',
    title: 'Quality Reviewed',
    desc: 'Boosted listings are checked for accurate descriptions, clear photos, and fair value before going live.',
  },
  {
    icon: Zap,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    step: '03',
    title: 'Higher Visibility',
    desc: 'Featured items appear at the top of search results and in the dedicated Featured feed for 7–30 days.',
  },
  {
    icon: Flame,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    step: '04',
    title: 'Faster Swaps',
    desc: 'Featured listings receive up to 5× more proposals than standard listings in the same category.',
  },
];

function FeaturedHero({ total, isLoading }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#1a0e00] via-[#2b1800] to-[#0f0800]">
      {/* Glows */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-10 w-48 h-48 rounded-full bg-orange-400/15 blur-2xl" />
      <div className="pointer-events-none absolute top-1/2 right-1/3 w-24 h-24 rounded-full bg-yellow-300/10 blur-xl" />

      {/* Floating decoration */}
      <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 opacity-10 lg:opacity-15">
        <Star size={140} className="text-amber-300" />
      </div>

      <div className="relative max-w-5xl mx-auto px-5 py-7 lg:px-10 lg:py-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4 backdrop-blur-sm">
          <Star size={12} className="text-amber-300" fill="#fde68a" />
          Hand-picked & boosted listings · Highest quality on SwapNaija
        </div>

        <h1 className="font-display font-bold text-white text-2xl lg:text-4xl leading-tight mb-2">
          Featured Listings
        </h1>
        <p className="text-white/60 text-sm lg:text-base max-w-xl mb-5 leading-relaxed">
          The best of SwapNaija — boosted by traders, quality-reviewed by our team, and optimised for fast,
          successful swaps. Premium items from verified community members.
        </p>

        <div className="flex flex-wrap gap-4 lg:gap-8 border-t border-white/10 pt-4">
          {!isLoading && (
            <div>
              <p className="text-white font-bold text-lg lg:text-2xl leading-none">{total || 0}</p>
              <p className="text-white/45 text-xs mt-0.5">Featured Listings</p>
            </div>
          )}
          <div>
            <p className="text-white font-bold text-lg lg:text-2xl leading-none">Quality</p>
            <p className="text-white/45 text-xs mt-0.5">Reviewed Items</p>
          </div>
          <div>
            <p className="text-white font-bold text-lg lg:text-2xl leading-none">5×</p>
            <p className="text-white/45 text-xs mt-0.5">More Proposals</p>
          </div>
          <div>
            <p className="text-white font-bold text-lg lg:text-2xl leading-none">91%</p>
            <p className="text-white/45 text-xs mt-0.5">Swap Success Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedSignals({ total }) {
  const signals = [
    { ...FEAT_SIGNALS[0], value: total ? total.toLocaleString() : '—' },
    ...FEAT_SIGNALS.slice(1),
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {signals.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className={`${bg} rounded-2xl p-4 flex flex-col gap-2`}>
          <div className="flex items-center gap-2">
            <Icon size={16} className={color} />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
          </div>
          <p className={`font-bold text-lg ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function WhatFeaturedMeans() {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 lg:p-7">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
          <Star size={16} className="text-amber-500" fill="#F59E0B" />
        </div>
        <div>
          <h2 className="font-display font-bold text-base text-gray-900">What Makes a Listing "Featured"?</h2>
          <p className="text-xs text-gray-400">Quality-reviewed · Trader-boosted · High swap success</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {WHAT_FEATURED_MEANS.map(({ icon: Icon, color, bg, step, title, desc }) => (
          <div key={step} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-none ${bg}`}>
                <Icon size={20} className={color} />
              </div>
              <span className="text-xs font-black text-gray-200 tabular-nums">{step}</span>
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 mb-1">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-50 flex items-center gap-2">
        <BadgeCheck size={14} className="text-emerald-500 flex-none" />
        <p className="text-xs text-gray-400">
          All featured listings carry a quality badge and are backed by SwapNaija's escrow protection.
          Dispute resolution is prioritised for featured traders.
        </p>
      </div>
    </div>
  );
}

export default function FeaturedListings() {
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('popular');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['featured', page, categoryId, sort],
    queryFn: () => searchListings({ sort, isBoosted: true, page, limit: LIMIT, categoryId }),
    keepPreviousData: true,
  });

  const listings = data?.listings ?? [];
  const total = data?.total ?? 0;
  const totalPages = total ? Math.ceil(total / LIMIT) : 1;

  const handleCat = (id) => { setCategoryId(id); setPage(1); };
  const handleSort = (v) => { setSort(v); setPage(1); };

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Featured Listings" showBack />

      {/* Hero */}
      <FeaturedHero total={total} isLoading={isLoading} />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* Signal cards */}
        <FeaturedSignals total={total} />

        {/* What featured means */}
        <WhatFeaturedMeans />

        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900">Featured Listings</h2>
            {!isLoading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {total > 0 ? `${total.toLocaleString()} featured listings` : 'No featured listings right now'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={e => handleSort(e.target.value)}
              className="text-xs lg:text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 transition px-3 py-1.5 rounded-full"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mt-2">
          <button
            onClick={() => handleCat('')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-none border transition ${
              !categoryId ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-primary/30'
            }`}
          >
            ⭐ All
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => handleCat(c.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-none border transition ${
                categoryId === c.id ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-primary/30'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* Listings */}
        <ListingGrid
          listings={listings}
          loading={isLoading}
          error={isError}
          emptyMessage="No featured listings right now — check back soon or boost your own listing to get featured!"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pb-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 lg:px-5 lg:py-2.5 rounded-xl bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1.5 text-sm font-medium"
            >
              <ChevronLeft size={16} />
              <span className="hidden lg:inline">Previous</span>
            </button>
            <span className="text-sm font-medium text-gray-700">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 lg:px-5 lg:py-2.5 rounded-xl bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1.5 text-sm font-medium"
            >
              <span className="hidden lg:inline">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Bottom tip — boost CTA */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 mb-4">
          <Star size={18} className="text-amber-500 flex-none mt-0.5" fill="#F59E0B" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-amber-900">Want your listing to appear here?</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Boost any listing to get it featured in this feed, pushed to the top of search results, and seen by
              thousands of active traders. Boosts start from just 500 BC.
            </p>
          </div>
          <Link
            to="/boost"
            className="flex-none text-xs font-bold text-amber-700 bg-amber-200 hover:bg-amber-300 transition px-3 py-1.5 rounded-full whitespace-nowrap"
          >
            Boost a Listing →
          </Link>
        </div>

      </div>
    </div>
  );
}
