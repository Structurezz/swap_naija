import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Zap, TrendingUp, Eye, Search, Plus, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMyListings } from '../api/listings.api';
import TopBar from '../components/layout/TopBar';
import Spinner from '../components/ui/Spinner';
import { getListingPlaceholder } from '../utils/placeholder';

const BENEFITS = [
  { icon: TrendingUp, label: '10× more visibility',       color: 'text-amber-500',  bg: 'bg-amber-50'  },
  { icon: Eye,        label: 'Featured on Home page',      color: 'text-blue-500',   bg: 'bg-blue-50'   },
  { icon: Search,     label: 'Priority in category feeds', color: 'text-purple-500', bg: 'bg-purple-50' },
];

const PAGE_SIZE = 9;

export default function BoostSelect() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => getMyListings(),
  });

  const allListings  = data?.listings ?? data ?? [];
  const total        = allListings.length;
  const totalPages   = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start        = (page - 1) * PAGE_SIZE;
  const listings     = allListings.slice(start, start + PAGE_SIZE);

  const goTo = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Boost a Listing" showBack />

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-500 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 left-10 w-32 h-32 rounded-full bg-white/10" />
        <div className="max-w-5xl mx-auto px-5 py-6 lg:px-10 lg:py-8 relative">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Zap size={12} fill="currentColor" />
            Instant Activation · From ₦500
          </div>
          <h1 className="font-display font-bold text-white text-2xl lg:text-3xl leading-tight mb-1.5">
            Boost Your Listing
          </h1>
          <p className="text-white/80 text-sm lg:text-base max-w-lg mb-4">
            Pick a listing below and get up to <span className="font-bold text-white">10× more views</span>.
            Boosted listings appear at the top of search and on the Featured homepage section.
          </p>
          <div className="flex flex-wrap gap-3">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                <Icon size={12} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-5">

        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900">Select a Listing to Boost</h2>
            {!isLoading && total > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {total} listing{total !== 1 ? 's' : ''} · page {page} of {totalPages}
              </p>
            )}
          </div>
          <Link
            to="/create"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition px-3 py-1.5 rounded-full"
          >
            <Plus size={13} />
            New Listing
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : allListings.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl py-16 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center">
              <Zap size={28} className="text-amber-500" />
            </div>
            <div>
              <p className="font-display font-bold text-lg text-gray-900">No listings yet</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Create a listing first — then come back here to boost it and get more views.
              </p>
            </div>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-2xl hover:bg-primary/90 transition"
            >
              <Plus size={16} />
              Create a Listing
            </Link>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => {
                const isBoosted = listing.isBoosted && listing.boostExpires && new Date(listing.boostExpires) > new Date();
                const placeholder = getListingPlaceholder(listing);
                return (
                  <div
                    key={listing.id}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative">
                      <img
                        src={listing.images?.[0] || placeholder}
                        alt={listing.title}
                        className="w-full h-44 object-cover"
                        onError={(e) => { e.currentTarget.src = placeholder; }}
                      />
                      {isBoosted && (
                        <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Zap size={9} fill="currentColor" /> Boosted
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="font-bold text-sm text-gray-900 truncate">{listing.title}</p>
                      {listing.estimatedValue && (
                        <p className="text-primary text-xs font-semibold mt-0.5">
                          ₦{listing.estimatedValue.toLocaleString()}
                        </p>
                      )}
                      {listing.category?.name && (
                        <p className="text-gray-400 text-xs mt-0.5">{listing.category.name}</p>
                      )}

                      <div className="mt-3">
                        {isBoosted ? (
                          <div className="flex items-center gap-2 text-xs text-amber-600 font-medium bg-amber-50 rounded-xl px-3 py-2">
                            <CheckCircle2 size={13} />
                            Boosted until {new Date(listing.boostExpires).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                          </div>
                        ) : (
                          <Link
                            to={`/boost/${listing.id}`}
                            className="flex items-center justify-center gap-1.5 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm py-2.5 rounded-xl transition active:scale-95"
                          >
                            <Zap size={14} fill="currentColor" />
                            Boost This Listing
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2 pb-8">
                <button
                  onClick={() => goTo(page - 1)}
                  disabled={page === 1}
                  className="p-2 lg:px-4 lg:py-2 rounded-xl bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1.5 text-sm font-medium"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden lg:inline">Prev</span>
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isActive = p === page;
                    const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                    const showEllipsisBefore = p === page - 2 && page > 3;
                    const showEllipsisAfter  = p === page + 2 && page < totalPages - 2;
                    if (showEllipsisBefore || showEllipsisAfter) {
                      return <span key={p} className="px-1 text-gray-400 text-sm">…</span>;
                    }
                    if (!show) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => goTo(p)}
                        className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
                          isActive
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goTo(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 lg:px-4 lg:py-2 rounded-xl bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1.5 text-sm font-medium"
                >
                  <span className="hidden lg:inline">Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
