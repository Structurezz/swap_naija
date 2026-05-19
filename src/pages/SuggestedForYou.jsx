import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles, ChevronLeft, ChevronRight, Brain, Cpu, Target,
  TrendingUp, Zap, RefreshCw, ShieldCheck, Star,
} from 'lucide-react';
import { getSuggested } from '../api/listings.api';
import { useAuthStore } from '../store/auth.store';
import ListingGrid from '../components/features/listing/ListingGrid';
import TopBar from '../components/layout/TopBar';

const LIMIT = 20;

const HOW_IT_WORKS = [
  {
    icon: Brain,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    step: '01',
    title: 'Analyses Your Listings',
    desc: 'Our AI scans everything you\'ve listed — categories, estimated values, condition, and keywords.',
  },
  {
    icon: Target,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    step: '02',
    title: 'Matches Swap Wants',
    desc: 'It cross-references what other swappers are looking for in exchange against what you offer.',
  },
  {
    icon: TrendingUp,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    step: '03',
    title: 'Ranks by Compatibility',
    desc: 'Listings are ranked by value proximity, category alignment, and swap success probability.',
  },
  {
    icon: RefreshCw,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    step: '04',
    title: 'Learns Over Time',
    desc: 'Every swap you make, view, or decline trains the model to improve future recommendations.',
  },
];

const AI_SIGNALS = [
  { label: 'Category Match',    value: '94%', icon: Target,     color: 'text-blue-500',    bg: 'bg-blue-50'    },
  { label: 'Value Alignment',   value: '87%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { label: 'Swap Probability',  value: '79%', icon: Zap,        color: 'text-amber-500',   bg: 'bg-amber-50'   },
  { label: 'Trust Score',       value: '★★★★', icon: Star,      color: 'text-violet-500',  bg: 'bg-violet-50'  },
];

function AiHero({ total, isLoading }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#1a0533] via-[#2d0a5e] to-[#0f1a4a]">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-10 w-48 h-48 rounded-full bg-blue-500/15 blur-2xl" />
      <div className="pointer-events-none absolute top-1/2 right-1/3 w-24 h-24 rounded-full bg-purple-400/10 blur-xl" />

      {/* Floating brain icon — right side decoration */}
      <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 opacity-10 lg:opacity-15">
        <Brain size={140} className="text-white" />
      </div>

      <div className="relative w-full px-4 py-7 lg:px-8 lg:py-10">

        {/* AI badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4 backdrop-blur-sm">
          <Cpu size={12} className="text-violet-300" />
          Powered by SwapNaija AI · Smart Match Engine
        </div>

        {/* Title */}
        <h1 className="font-display font-bold text-white text-2xl lg:text-4xl leading-tight mb-2">
          Suggested For You
        </h1>
        <p className="text-white/60 text-sm lg:text-base max-w-xl mb-5 leading-relaxed">
          Our AI analyses your listings, swap history, and preferences to surface the items most likely to result in a successful trade — just for you.
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 lg:gap-8 border-t border-white/10 pt-4">
          {!isLoading && (
            <div>
              <p className="text-white font-bold text-lg lg:text-2xl leading-none">{total || 0}</p>
              <p className="text-white/45 text-xs mt-0.5">Matches Found</p>
            </div>
          )}
          <div>
            <p className="text-white font-bold text-lg lg:text-2xl leading-none">Real-time</p>
            <p className="text-white/45 text-xs mt-0.5">Match Updates</p>
          </div>
          <div>
            <p className="text-white font-bold text-lg lg:text-2xl leading-none">4 Signals</p>
            <p className="text-white/45 text-xs mt-0.5">AI Factors Used</p>
          </div>
          <div>
            <p className="text-white font-bold text-lg lg:text-2xl leading-none">Personalised</p>
            <p className="text-white/45 text-xs mt-0.5">To Your Profile</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AiSignals() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {AI_SIGNALS.map(({ label, value, icon: Icon, color, bg }) => (
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

function HowItWorks() {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 lg:p-7">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
          <Brain size={16} className="text-violet-600" />
        </div>
        <div>
          <h2 className="font-display font-bold text-base text-gray-900">How the AI Match Engine Works</h2>
          <p className="text-xs text-gray-400">4-step personalisation process</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {HOW_IT_WORKS.map(({ icon: Icon, color, bg, step, title, desc }) => (
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
        <ShieldCheck size={14} className="text-emerald-500 flex-none" />
        <p className="text-xs text-gray-400">
          Matches are recalculated every time you post a listing or another user updates their swap wants.
          Your data is never shared with third parties.
        </p>
      </div>
    </div>
  );
}

export default function SuggestedForYou() {
  const [page, setPage] = useState(1);
  const { user } = useAuthStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['suggested', page],
    queryFn: () => getSuggested({ page, limit: LIMIT }),
    keepPreviousData: true,
  });

  const listings = data?.listings || data?.matches || [];
  const total = data?.total || 0;
  const totalPages = total ? Math.ceil(total / LIMIT) : 1;

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Suggested For You" showBack />

      {/* AI Hero */}
      <AiHero total={total} isLoading={isLoading} />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* AI match signals */}
        <AiSignals />

        {/* How it works */}
        <HowItWorks />

        {/* Results header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900">Your Matches</h2>
            {!isLoading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {total > 0
                  ? `${total} listings the AI thinks you'll love`
                  : 'Post more listings to unlock personalised matches'}
              </p>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 transition px-3 py-1.5 rounded-full"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        {/* Listings */}
        <ListingGrid
          listings={listings}
          loading={isLoading}
          error={isError}
          emptyMessage="No AI matches yet — post some listings so the engine can find your perfect swaps!"
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
            <span className="text-sm font-medium text-gray-700">
              Page {page} of {totalPages}
            </span>
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

        {/* Bottom tip */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4 flex items-start gap-3 mb-4">
          <Sparkles size={18} className="text-violet-500 flex-none mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-violet-900">Improve your matches</p>
            <p className="text-xs text-violet-600 mt-0.5 leading-relaxed">
              The more listings you post with detailed descriptions and accurate estimated values,
              the smarter your AI suggestions become. Complete your profile for even better results.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
