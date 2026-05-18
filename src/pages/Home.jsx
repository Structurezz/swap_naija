import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon, ChevronRight, ArrowRight, BadgeCheck, Zap, Gift,
  ShieldCheck, Users, TrendingUp, Star, Wallet, Package, Clock, Award,
} from 'lucide-react';
import { getHomeFeed, getSuggested } from '../api/listings.api';
import { useAuthStore } from '../store/auth.store';
import ListingCard from '../components/features/listing/ListingCard';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';

// ─── Hero banner data ──────────────────────────────────────────────────────────
const BANNERS = [
  {
    id: 1,
    tag: 'Welcome to SwapNaija',
    title: 'Swap Smarter,\nNot Harder',
    subtitle: 'Nigeria\'s #1 peer-to-peer barter marketplace. List your item in 60 seconds and find your perfect trade today.',
    cta: 'Start Swapping',
    ctaSecondary: 'Browse Items',
    ctaSecondaryHref: '/search',
    href: '/create',
    gradient: 'from-[#0f7a5a] via-primary to-[#1db87d]',
    accentColor: 'rgba(255,255,255,0.12)',
    stats: [
      { value: '10,000+', label: 'Active Swappers' },
      { value: '50,000+', label: 'Items Listed' },
      { value: '₦0', label: 'Listing Fee' },
    ],
    badge: '🔥 Trending now',
    emoji: '🔄',
    pattern: true,
  },
  {
    id: 2,
    tag: 'Discover New Items',
    title: 'Fresh Drops\nEvery Day',
    subtitle: 'Electronics, fashion, furniture, phones, and more — hundreds of new listings added daily by verified swappers.',
    cta: 'Browse All Items',
    ctaSecondary: 'Fresh Drops',
    ctaSecondaryHref: '/fresh-drops',
    href: '/search',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    accentColor: 'rgba(255,255,255,0.12)',
    stats: [
      { value: '500+', label: 'New Today' },
      { value: '20+', label: 'Categories' },
      { value: '4.8★', label: 'Avg Rating' },
    ],
    badge: '⚡ 500+ new today',
    emoji: '🛍️',
    pattern: true,
  },
  {
    id: 3,
    tag: 'Trade With Confidence',
    title: 'Escrow Protection\nFor Every Swap',
    subtitle: 'SwapNaija holds both parties\' deposits in secure escrow until the deal is confirmed — zero risk, maximum trust.',
    cta: 'How It Works',
    ctaSecondary: 'Top Up Wallet',
    ctaSecondaryHref: '/wallet',
    href: '/wallet',
    gradient: 'from-indigo-600 via-purple-600 to-violet-700',
    accentColor: 'rgba(255,255,255,0.12)',
    stats: [
      { value: '100%', label: 'Secure Escrow' },
      { value: '< 24h', label: 'Dispute Resolution' },
      { value: '99.2%', label: 'Success Rate' },
    ],
    badge: '🔒 Bank-grade security',
    emoji: '🛡️',
    pattern: true,
  },
  {
    id: 4,
    tag: 'Build Your Reputation',
    title: 'Get Verified\n& Stand Out',
    subtitle: 'A verified badge boosts your swap acceptance rate by 3×. One-time fee of ₦1,000 from your wallet — badge is permanent.',
    cta: 'Get Verified',
    ctaSecondary: 'See Benefits',
    ctaSecondaryHref: '/verify-account',
    href: '/verify-account',
    gradient: 'from-blue-600 via-blue-500 to-cyan-500',
    accentColor: 'rgba(255,255,255,0.12)',
    stats: [
      { value: '3×', label: 'More Swap Offers' },
      { value: 'Top', label: 'Search Ranking' },
      { value: '₦1,000', label: 'One-Time Only' },
    ],
    badge: '✅ Permanent badge',
    emoji: '🏅',
    pattern: true,
  },
  {
    id: 5,
    tag: 'Grow Your Reach',
    title: 'Boost & Get\n10× More Views',
    subtitle: 'Boosted listings appear at the top of search and on the Featured homepage section — seen by thousands of active swappers.',
    cta: 'Boost a Listing',
    ctaSecondary: 'View Plans',
    ctaSecondaryHref: '/swaps',
    href: '/swaps',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
    accentColor: 'rgba(255,255,255,0.12)',
    stats: [
      { value: '10×', label: 'More Visibility' },
      { value: 'From', label: '₦500 only' },
      { value: '7–30', label: 'Day Plans' },
    ],
    badge: '🚀 Instant activation',
    emoji: '⚡',
    pattern: true,
  },
];

// ─── Ad cards data ─────────────────────────────────────────────────────────────
const AD_CARDS = [
  {
    icon: BadgeCheck,
    bg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-100',
    title: 'Get Verified',
    desc: 'Earn a verified badge and get 3× more swap offers from trusted users.',
    tag: '₦1,000 one-time',
    tagColor: 'bg-blue-100 text-blue-700',
    href: '/verify-account',
    highlight: true,
  },
  {
    icon: Zap,
    bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-100',
    title: 'Boost Your Listing',
    desc: 'Get 10× more views. Your listing appears first in search and on the homepage.',
    tag: 'From ₦500',
    tagColor: 'bg-amber-100 text-amber-700',
    href: '/swaps',
    highlight: false,
  },
  {
    icon: Gift,
    bg: 'bg-gradient-to-br from-purple-500 to-violet-600',
    lightBg: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-100',
    title: 'Invite & Earn Credits',
    desc: 'Share your referral link. Earn swap credits for every friend who joins.',
    tag: 'Free rewards',
    tagColor: 'bg-purple-100 text-purple-700',
    href: '/invite',
    highlight: false,
  },
  {
    icon: ShieldCheck,
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-100',
    title: 'Swap With Escrow',
    desc: 'Both parties are protected. Funds held in escrow until you confirm delivery.',
    tag: '100% secure',
    tagColor: 'bg-emerald-100 text-emerald-700',
    href: '/wallet',
    highlight: false,
  },
  {
    icon: TrendingUp,
    bg: 'bg-gradient-to-br from-rose-500 to-pink-600',
    lightBg: 'bg-rose-50',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-100',
    title: 'Top Up & Trade',
    desc: 'Add Barter Credits to your wallet to unlock escrow, boosts and verification.',
    tag: 'Instant credit',
    tagColor: 'bg-rose-100 text-rose-700',
    href: '/wallet',
    highlight: false,
  },
  {
    icon: Users,
    bg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
    lightBg: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-100',
    title: 'Join the Community',
    desc: '10,000+ swappers in Lagos, Abuja, Kano and all across Nigeria.',
    tag: '10k+ members',
    tagColor: 'bg-indigo-100 text-indigo-700',
    href: '/search',
    highlight: false,
  },
];

// ─── Mid-page promo strips ─────────────────────────────────────────────────────
const PROMO_STRIPS = [
  {
    emoji: '🇳🇬',
    title: 'Made for Nigeria',
    desc: 'Swap goods and services with people near you — Lagos, Abuja, Kano and everywhere in between.',
    href: '/search',
    cta: 'Explore',
    bg: 'from-green-50 to-emerald-50',
    border: 'border-emerald-100',
    ctaColor: 'text-emerald-700',
  },
  {
    emoji: '🤝',
    title: 'Have Something to Swap?',
    desc: 'List your item for free and reach thousands of active traders across Nigeria in minutes.',
    href: '/create',
    cta: 'List Now',
    bg: 'from-primary/10 to-primary/5',
    border: 'border-primary/20',
    ctaColor: 'text-primary',
  },
];

// ─── HeroBanner ───────────────────────────────────────────────────────────────
function HeroBanner() {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const b = BANNERS[active];

  return (
    <div className="relative overflow-hidden">
      {/* Slide */}
      <div className={`bg-gradient-to-br ${b.gradient} relative overflow-hidden`} key={b.id}>

        {/* Background pattern circles */}
        <div className="pointer-events-none absolute -top-10 -right-10 w-64 h-64 rounded-full opacity-10 bg-white" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 w-48 h-48 rounded-full opacity-10 bg-white" />

        {/* Large emoji — fixed to the right */}
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[90px] lg:text-[130px] select-none opacity-30 lg:opacity-40 leading-none">
          {b.emoji}
        </div>

        <div className="max-w-md lg:max-w-5xl mx-auto lg:mx-0 px-4 pt-3 pb-3 lg:px-10 lg:py-5 relative">

          {/* Badge tag */}
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              {b.badge}
            </span>
          </div>

          {/* Tag label */}
          <p className="text-white/55 text-[10px] font-medium uppercase tracking-widest mb-0.5">{b.tag}</p>

          {/* Title */}
          <h2 className="font-display font-bold text-white text-lg lg:text-2xl whitespace-pre-line leading-tight mb-1.5">
            {b.title}
          </h2>

          {/* Subtitle */}
          <p className="text-white/75 text-xs lg:text-sm mb-3 max-w-sm lg:max-w-lg leading-relaxed">
            {b.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => navigate(b.href)}
              className="bg-white text-ink font-bold text-xs px-4 py-2 rounded-xl hover:bg-gray-50 transition-all active:scale-95 inline-flex items-center gap-1.5 shadow-md"
            >
              {b.cta} <ArrowRight size={12} />
            </button>
            {b.ctaSecondary && (
              <button
                onClick={() => navigate(b.ctaSecondaryHref)}
                className="bg-white/15 border border-white/30 text-white font-semibold text-xs px-4 py-2 rounded-xl hover:bg-white/25 transition-all active:scale-95 inline-flex items-center gap-1.5"
              >
                {b.ctaSecondary}
              </button>
            )}
          </div>

          {/* Stats strip */}
          <div className="flex gap-4 lg:gap-8 border-t border-white/15 pt-2">
            {b.stats.map(s => (
              <div key={s.label}>
                <p className="text-white font-bold text-sm leading-none">{s.value}</p>
                <p className="text-white/50 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress + dots bar */}
      <div className="bg-white px-5 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5 flex-1">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'bg-primary flex-[2]' : 'bg-gray-200 flex-1'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400 font-medium tabular-nums flex-none">
          {active + 1} / {BANNERS.length}
        </span>
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

// ─── Ad card grid ──────────────────────────────────────────────────────────────
function AdCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {AD_CARDS.map(({ icon: Icon, bg, lightBg, textColor, borderColor, title, desc, tag, tagColor, href, highlight }) => (
        <Link
          key={title}
          to={href}
          className={`group relative bg-white rounded-2xl border ${borderColor} p-4 flex flex-col gap-3 hover:shadow-lg transition-all duration-200 overflow-hidden ${highlight ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
        >
          {/* Subtle background glow */}
          <div className={`pointer-events-none absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${lightBg} blur-xl`} />

          <div className="flex items-start justify-between gap-2 relative">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-none ${bg} shadow-sm`}>
              <Icon size={28} className="text-white" />
            </div>
            {highlight && (
              <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">POPULAR</span>
            )}
          </div>

          <div className="relative flex-1">
            <p className="font-bold text-sm text-gray-900 mb-1">{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </div>

          <div className="flex items-center justify-between relative">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${tagColor}`}>{tag}</span>
            <span className={`${textColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
              <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Mid-page promo strips ─────────────────────────────────────────────────────
function PromoStrips() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {PROMO_STRIPS.map(strip => (
        <div key={strip.title} className={`bg-gradient-to-r ${strip.bg} border ${strip.border} rounded-2xl p-4 flex items-center gap-4`}>
          <div className="text-4xl select-none flex-none">{strip.emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-gray-900">{strip.title}</p>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{strip.desc}</p>
          </div>
          <Link
            to={strip.href}
            className={`flex-none text-xs font-semibold ${strip.ctaColor} whitespace-nowrap flex items-center gap-1 hover:underline`}
          >
            {strip.cta} <ChevronRight size={14} />
          </Link>
        </div>
      ))}
    </div>
  );
}

// ─── Trust bar ─────────────────────────────────────────────────────────────────
function TrustBar() {
  const items = [
    { icon: ShieldCheck, label: 'Escrow Protected', color: 'text-emerald-600' },
    { icon: Star,        label: 'Verified Sellers',  color: 'text-amber-500'  },
    { icon: Clock,       label: 'Fast Matching',      color: 'text-blue-500'   },
    { icon: Award,       label: 'Top-Rated Swaps',   color: 'text-purple-600' },
  ];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
      <div className="flex items-center justify-around gap-2">
        {items.map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex flex-col items-center gap-1 text-center">
            <Icon size={18} className={color} />
            <span className="text-[10px] font-semibold text-gray-500 leading-tight">{label}</span>
          </div>
        ))}
      </div>
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

              {/* ── Trust bar ── */}
          <TrustBar />

          {/* ── Ad cards ── */}
          <section>
            <SectionHeader title="Explore SwapNaija" icon="✨" />
            <AdCards />
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

          {/* ── Promo strips ── */}
          <PromoStrips />

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
          <div className="bg-gradient-to-br from-primary via-primary to-[#0f7a5a] rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative text-center">
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="font-display font-bold text-xl mb-2">Have something to swap?</h3>
              <p className="text-white/75 text-sm mb-5 max-w-xs mx-auto leading-relaxed">
                List your item for free and reach thousands of active traders across Nigeria in under 60 seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link
                  to="/create"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all active:scale-95 shadow-lg"
                >
                  <Package size={16} /> List an Item — Free
                </Link>
                <Link
                  to="/search"
                  className="inline-flex items-center justify-center gap-2 bg-white/15 border border-white/25 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-white/25 transition-all active:scale-95"
                >
                  Browse Listings <ArrowRight size={16} />
                </Link>
              </div>
              <p className="text-white/40 text-xs mt-4">No card required · Instant listing · Free forever</p>
            </div>
          </div>

          <div className="h-4" />
        </div>
      )}
    </div>
  );
}
