import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Sparkles, ChevronRight, ArrowRight, BadgeCheck, Zap, Gift } from 'lucide-react';
import { getHomeFeed, getSuggested } from '../api/listings.api';
import { useAuthStore } from '../store/auth.store';
import ListingCard from '../components/features/listing/ListingCard';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';

// ─── Hero banner data ──────────────────────────────────────────────────────────
const BANNERS = [
  {
    id: 1,
    title: 'Swap Smarter,\nNot Harder',
    subtitle: 'List your item in 60 seconds and find your perfect trade today.',
    cta: 'List Now',
    href: '/create',
    gradient: 'from-primary to-primary-700',
    emoji: '🔄',
  },
  {
    id: 2,
    title: '1,000+ Items\nWaiting for You',
    subtitle: 'Electronics, fashion, furniture and more — all available to swap.',
    cta: 'Browse All',
    href: '/search',
    gradient: 'from-accent to-amber-600',
    emoji: '🛍️',
  },
  {
    id: 3,
    title: 'Trade Safely\nWith Escrow',
    subtitle: 'SwapNaija escrow protects both parties until the deal is confirmed.',
    cta: 'Learn More',
    href: '/wallet',
    gradient: 'from-indigo-500 to-purple-600',
    emoji: '🔒',
  },
];

// ─── Campaign widgets ──────────────────────────────────────────────────────────
const CAMPAIGNS = [
  {
    icon: BadgeCheck,
    color: 'bg-blue-50 text-blue-600',
    title: 'Verify Your Account',
    desc: 'Get a verified badge and build trust with other swappers.',
    href: '/verify-account',
  },
  {
    icon: Gift,
    color: 'bg-purple-50 text-purple-600',
    title: 'Invite & Earn',
    desc: 'Invite friends to SwapNaija and earn swap credits.',
    href: '/invite',
  },
  {
    icon: Zap,
    color: 'bg-amber-50 text-amber-600',
    title: 'Boost Your Listing',
    desc: 'Get 10× more visibility by boosting your listing today.',
    href: '/swaps',
  },
];

// ─── HeroBanner ───────────────────────────────────────────────────────────────
function HeroBanner() {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const b = BANNERS[active];

  return (
    <div className="relative overflow-hidden">
      <div className={`bg-gradient-to-r ${b.gradient} px-5 py-6 lg:py-8 transition-all duration-500`}>
        <div className="max-w-md lg:max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">SwapNaija</p>
            <h2 className="font-display font-bold text-white text-xl lg:text-3xl whitespace-pre-line leading-tight mb-2">
              {b.title}
            </h2>
            <p className="text-white/80 text-sm mb-4 max-w-xs">{b.subtitle}</p>
            <button
              onClick={() => navigate(b.href)}
              className="bg-white text-ink font-semibold text-sm px-5 py-2.5 rounded-2xl hover:bg-gray-50 transition-all active:scale-95 inline-flex items-center gap-1.5"
            >
              {b.cta} <ArrowRight size={14} />
            </button>
          </div>
          <div className="text-6xl lg:text-8xl select-none">{b.emoji}</div>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 py-2 bg-white">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`rounded-full transition-all ${i === active ? 'w-5 h-2 bg-primary' : 'w-2 h-2 bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Category pills ────────────────────────────────────────────────────────────
function CategoryRow({ categories }) {
  const scrollRef = useRef(null);
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-md lg:max-w-none mx-auto px-4 lg:px-8 py-3">
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
          <Link
            to="/search"
            className="flex-none snap-start flex flex-col items-center gap-1 px-3 py-2 bg-primary/10 rounded-2xl min-w-[60px]"
          >
            <span className="text-xl">🔍</span>
            <span className="text-xs font-medium text-primary whitespace-nowrap">All</span>
          </Link>
          {categories.map(cat => (
            <Link
              key={cat.category.id}
              to={`/search?categoryId=${cat.category.id}`}
              className="flex-none snap-start flex flex-col items-center gap-1 px-3 py-2 bg-gray-50 hover:bg-primary/10 rounded-2xl min-w-[60px] transition-colors group"
            >
              <span className="text-xl">{cat.category.icon}</span>
              <span className="text-xs font-medium text-gray-600 group-hover:text-primary whitespace-nowrap">
                {cat.category.name.split(' ')[0]}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Horizontal scroll row ─────────────────────────────────────────────────────
function ListingRow({ listings }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
      {listings.map(listing => (
        <div key={listing.id} className="flex-none w-44 lg:w-56 snap-start">
          <ListingCard listing={listing} />
        </div>
      ))}
    </div>
  );
}

// ─── Campaign widget row ───────────────────────────────────────────────────────
function CampaignWidgets() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide lg:grid lg:grid-cols-3">
      {CAMPAIGNS.map(({ icon: Icon, color, title, desc, href }) => (
        <Link
          key={title}
          to={href}
          className="flex-none w-60 lg:w-auto bg-white rounded-2xl shadow-card p-4 flex items-start gap-3 hover:shadow-card-hover transition-shadow"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-none ${color}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Mid-page promo banner ─────────────────────────────────────────────────────
function PromoBanner() {
  return (
    <div className="bg-gradient-to-r from-accent/20 to-amber-100 rounded-2xl p-4 flex items-center gap-4">
      <div className="text-4xl">🇳🇬</div>
      <div className="flex-1">
        <p className="font-display font-bold text-sm">Made for Nigeria</p>
        <p className="text-xs text-gray-600 mt-0.5">
          Swap goods and services with people near you — Lagos, Abuja, Kano and everywhere.
        </p>
      </div>
      <Link to="/search" className="flex-none text-xs font-semibold text-accent whitespace-nowrap flex items-center gap-1">
        Explore <ChevronRight size={14} />
      </Link>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, href, label = 'See all' }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <h2 className="font-display font-semibold text-base">{title}</h2>
      </div>
      {href && (
        <Link to={href} className="text-primary text-xs font-medium flex items-center gap-0.5">
          {label} <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

// ─── Home page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuthStore();
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  const { data: feed, isLoading } = useQuery({
    queryKey: ['home-feed'],
    queryFn: getHomeFeed,
    staleTime: 2 * 60 * 1000,
  });

  const { data: suggested } = useQuery({
    queryKey: ['suggested'],
    queryFn: getSuggested,
  });

  return (
    <div className="bg-bg min-h-screen">

      {/* ── Sticky header ── */}
      <div className="bg-white px-4 lg:px-8 pt-10 lg:pt-4 pb-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md lg:max-w-none mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Hello, {firstName} 👋</p>
              <h1 className="font-display font-bold text-xl">What will you swap today?</h1>
            </div>
            <Link to="/profile">
              <Avatar src={user?.avatarUrl} name={user?.fullName} size="md" />
            </Link>
          </div>
          <Link to="/search" className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3 text-gray-400">
            <SearchIcon size={18} />
            <span className="text-sm">Search listings, services...</span>
          </Link>
        </div>
      </div>

      {/* ── Hero banner carousel ── */}
      <HeroBanner />

      {/* ── Category pills ── */}
      {feed?.categories?.length > 0 && <CategoryRow categories={feed.categories} />}

      {/* ── Discover quick links ── */}
      <div className="max-w-md lg:max-w-none mx-auto px-4 lg:px-8 pt-4">
        <div className="grid grid-cols-3 gap-3">
          <Link to="/fresh-drops" className="flex flex-col items-center gap-1.5 bg-yellow-50 rounded-2xl py-3 px-2 border border-yellow-100 hover:bg-yellow-100 transition">
            <span className="text-xl">⚡</span>
            <span className="text-xs font-semibold text-yellow-700">Fresh Drops</span>
          </Link>
          <Link to="/featured" className="flex flex-col items-center gap-1.5 bg-amber-50 rounded-2xl py-3 px-2 border border-amber-100 hover:bg-amber-100 transition">
            <span className="text-xl">⭐</span>
            <span className="text-xs font-semibold text-amber-700">Featured</span>
          </Link>
          <Link to="/suggested" className="flex flex-col items-center gap-1.5 bg-purple-50 rounded-2xl py-3 px-2 border border-purple-100 hover:bg-purple-100 transition">
            <span className="text-xl">✨</span>
            <span className="text-xs font-semibold text-purple-700">For You</span>
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      )}

      {feed && (
        <div className="max-w-md lg:max-w-none mx-auto px-4 lg:px-8 py-5 space-y-8">

          {/* ── Campaign widgets ── */}
          <section>
            <SectionHeader title="For You" icon="✨" />
            <CampaignWidgets />
          </section>

          {/* ── Suggested for you ── */}
          {suggested?.matches?.length > 0 && (
            <section>
              <SectionHeader icon="🎯" title="Suggested for You" href="/suggested" />
              <ListingRow listings={suggested.matches.slice(0, 8)} />
            </section>
          )}

          {/* ── Boosted / Featured ── */}
          {feed.boosted?.length > 0 && (
            <section>
              <SectionHeader icon="⚡" title="Featured Listings" href="/featured" />
              <ListingRow listings={feed.boosted} />
            </section>
          )}

          {/* ── Fresh drops ── */}
          {feed.fresh?.length > 0 && (
            <section>
              <SectionHeader icon="🆕" title="Fresh Drops" href="/fresh-drops" />
              <ListingRow listings={feed.fresh} />
            </section>
          )}

          {/* ── Promo banner ── */}
          <PromoBanner />

          {/* ── Per-category sections ── */}
          {feed.categories?.map(({ category, listings }) => (
            listings.length > 0 && (
              <section key={category.id}>
                <SectionHeader
                  icon={category.icon}
                  title={category.name}
                  href={`/search?categoryId=${category.id}`}
                />
                <ListingRow listings={listings} />
              </section>
            )
          ))}

          {/* ── Bottom promo ── */}
          <div className="bg-primary rounded-3xl p-6 text-white text-center">
            <div className="text-4xl mb-3">🤝</div>
            <h3 className="font-display font-bold text-lg mb-1">Have something to swap?</h3>
            <p className="text-primary-100 text-sm mb-4">
              List your item for free and reach thousands of traders across Nigeria.
            </p>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all active:scale-95"
            >
              <span>List an Item</span> <ArrowRight size={16} />
            </Link>
          </div>

          <div className="h-4" />
        </div>
      )}
    </div>
  );
}
