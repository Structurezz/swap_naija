import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Filter, X, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { searchListings } from '../api/listings.api';
import { getCategories } from '../api/categories.api';
import { useListingsStore } from '../store/listings.store';
import ListingGrid from '../components/features/listing/ListingGrid';

const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

export default function Search() {
  const { filters, setFilter, setFilters, resetFilters, setPage } = useListingsStore();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(filters.q || '');

  useEffect(() => {
    const urlCategoryId = searchParams.get('categoryId');
    const urlSort       = searchParams.get('sort');
    const updates = {};
    if (urlCategoryId) updates.categoryId = urlCategoryId;
    if (urlSort)       updates.sort = urlSort;
    if (Object.keys(updates).length) setFilters(updates);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => searchListings(filters),
    keepPreviousData: true,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });

  useEffect(() => {
    const t = setTimeout(() => setFilter('q', search), 400);
    return () => clearTimeout(t);
  }, [search, setFilter]);

  const hasActiveFilters = filters.categoryId || filters.locationState || filters.listingType || filters.condition;
  const activeCategoryName = categories.find(c => c.id === filters.categoryId)?.name;
  const totalPages = data ? Math.ceil(data.total / filters.limit) : 1;

  const FilterSidebar = () => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Category</p>
        <select
          value={filters.categoryId}
          onChange={(e) => setFilter('categoryId', e.target.value)}
          className="input-field py-2 text-sm w-full"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Type</p>
        <div className="flex flex-wrap gap-2">
          {['goods', 'services', 'both'].map(t => (
            <button
              key={t}
              onClick={() => setFilter('listingType', filters.listingType === t ? '' : t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filters.listingType === t
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">State</p>
        <select
          value={filters.locationState}
          onChange={(e) => setFilter('locationState', e.target.value)}
          className="input-field py-2 text-sm w-full"
        >
          <option value="">All States</option>
          {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Sort by</p>
        <select
          value={filters.sort}
          onChange={(e) => setFilter('sort', e.target.value)}
          className="input-field py-2 text-sm w-full"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="value_asc">Value: Low to High</option>
          <option value="value_desc">Value: High to Low</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="w-full text-sm text-red-500 font-medium py-2 rounded-xl border border-red-100 hover:bg-red-50 transition"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-bg min-h-screen">
      {/* Sticky search bar */}
      <div className="bg-white sticky top-0 z-30 border-b border-gray-100 shadow-sm">
        <div className="lg:max-w-7xl mx-auto px-4 lg:px-8 pt-10 lg:pt-0 pb-3 lg:py-4">
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3 lg:py-2.5">
              <SearchIcon size={18} className="text-gray-400 flex-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listings..."
                className="bg-transparent flex-1 outline-none text-sm"
                autoFocus
              />
              {search && (
                <button onClick={() => { setSearch(''); setFilter('q', ''); }}>
                  <X size={16} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`lg:hidden p-3 rounded-2xl transition ${
                showFilters || hasActiveFilters ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Filter size={18} />
            </button>
          </div>

          {/* Active category chip */}
          {filters.categoryId && activeCategoryName && (
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                {activeCategoryName}
                <button onClick={() => setFilter('categoryId', '')}><X size={12} /></button>
              </span>
            </div>
          )}

          {/* Mobile filter panel */}
          {showFilters && (
            <div className="mt-3 lg:hidden pb-2">
              <FilterSidebar />
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="lg:max-w-7xl mx-auto px-4 lg:px-8">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">

          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-[73px] lg:self-start lg:max-h-screen lg:overflow-y-auto pt-4 lg:pt-6 pb-8">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-2 mb-5">
                <SlidersHorizontal size={15} className="text-primary" />
                <h2 className="text-sm font-semibold text-ink font-display">Filters</h2>
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Results */}
          <div className="lg:pt-6 py-4 lg:py-0 pb-10">
            {data && (
              <p className="text-xs text-gray-400 mb-4 lg:mb-5">
                {data.total === 0
                  ? 'No listings found'
                  : `${data.total.toLocaleString()} listing${data.total !== 1 ? 's' : ''} found`}
              </p>
            )}

            <ListingGrid
              listings={data?.listings}
              loading={isLoading}
              emptyMessage={search ? `No results for "${search}"` : 'No listings found'}
            />

            {/* Pagination */}
            {data && data.total > filters.limit && (
              <div className="flex items-center justify-center gap-3 pt-8 pb-4">
                <button
                  onClick={() => setPage(Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                  className="p-2 rounded-xl bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-medium text-ink">
                  Page {filters.page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, filters.page + 1))}
                  disabled={filters.page >= totalPages}
                  className="p-2 rounded-xl bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
