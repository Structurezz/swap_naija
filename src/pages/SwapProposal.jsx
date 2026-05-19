import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowLeftRight, ShieldCheck, Package, Coins,
  Shield, Send, AlertTriangle, ShieldAlert, EyeOff, UserX,
  Lock, Clock, BadgeCheck, ChevronDown,
} from 'lucide-react';
import { useListing } from '../hooks/useListings';
import { useAuthStore } from '../store/auth.store';
import TopBar from '../components/layout/TopBar';
import SwapProposalComp from '../components/features/swap/SwapProposal';
import Spinner from '../components/ui/Spinner';
import { resolveImageUrl, IMAGE_FALLBACK_SRC } from '../utils/placeholder';

const HOW_STEPS = [
  {
    icon: Package,
    color: 'text-violet-600',
    bg: 'bg-violet-100',
    title: "Pick what you'll offer",
    desc: 'Select one of your active listings or describe an open offer in the note',
  },
  {
    icon: Coins,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    title: 'Review value & gap',
    desc: 'Compare item values and decide who covers any difference',
  },
  {
    icon: Shield,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    title: 'Set escrow protection',
    desc: 'Both parties stake Barter Credits as a commitment guarantee',
  },
  {
    icon: Send,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    title: 'Send your proposal',
    desc: 'The other trader reviews and accepts or counter-proposes',
  },
];

const PRECAUTIONS = [
  { icon: ShieldAlert, text: 'Never exchange items outside SwapNaija escrow — you lose all protection' },
  { icon: EyeOff,     text: "Don't share personal details (address, bank info) before escrow is deposited" },
  { icon: UserX,      text: 'Report users who ask for upfront payments or rush you to skip steps' },
  { icon: Lock,       text: 'Your escrow deposit is only charged when BOTH parties accept' },
  { icon: Clock,      text: 'Proposals expire after 7 days if not accepted — you can re-propose' },
  { icon: BadgeCheck, text: 'Verified traders have a proven swap history — prefer them for high-value items' },
];

// ── Hero banner ───────────────────────────────────────────────────────────────
function HeroBanner({ listing, compact }) {
  const imgSrc = listing.images?.[0] ? resolveImageUrl(listing.images[0]) : null;

  if (compact) {
    return (
      <div className="relative overflow-hidden px-4 py-4 bg-gradient-to-r from-primary/8 via-emerald-50 to-white border-b border-gray-100">
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 flex-none bg-gray-100">
            {imgSrc ? (
              <img src={imgSrc} alt={listing.title} className="w-full h-full object-cover"
                onError={e => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ArrowLeftRight size={16} className="text-gray-300" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">Proposing swap for</p>
            <p className="text-sm font-bold text-gray-900 truncate">{listing.title}</p>
            {listing.estimatedValue > 0 && (
              <p className="text-xs text-primary font-semibold mt-0.5">{listing.estimatedValue.toLocaleString()} BC</p>
            )}
          </div>
          <div className="flex-none">
            <div className="flex items-center gap-1 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-1">
              <ShieldCheck size={10} className="text-emerald-600" />
              <span className="text-xs text-emerald-700 font-semibold whitespace-nowrap">Escrow Safe</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-primary/8 via-emerald-50/60 to-white border border-primary/15">
      <div className="pointer-events-none absolute -top-8 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 opacity-5">
        <ArrowLeftRight size={120} className="text-primary" />
      </div>

      <div className="relative px-8 py-7 flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white flex-none bg-gray-100 shadow-md">
          {imgSrc ? (
            <img src={imgSrc} alt={listing.title} className="w-full h-full object-cover"
              onError={e => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ArrowLeftRight size={28} className="text-gray-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Proposing a swap for</p>
          <h2 className="text-xl font-display font-black text-gray-900 leading-tight truncate">{listing.title}</h2>
          {listing.userId && (
            <p className="text-sm text-gray-400 mt-0.5">
              by <span className="text-gray-700 font-medium">{listing.userId.fullName || 'Unknown'}</span>
            </p>
          )}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            {listing.estimatedValue > 0 && (
              <span className="text-sm font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                {listing.estimatedValue.toLocaleString()} BC
              </span>
            )}
            <div className="flex items-center gap-1.5 bg-emerald-100 border border-emerald-200 rounded-full px-3 py-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span className="text-xs text-emerald-700 font-semibold">Escrow Protected · Safe Trade</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Safety accordion ──────────────────────────────────────────────────────────
function SafetyAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-amber-100 overflow-hidden bg-amber-50">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-amber-100/60 transition"
      >
        <div className="w-7 h-7 rounded-lg bg-amber-200 flex items-center justify-center flex-none">
          <AlertTriangle size={14} className="text-amber-700" />
        </div>
        <span className="text-sm font-bold text-amber-900 flex-1">Stay Safe — Read Before Sending</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-amber-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-amber-100"
          >
            <ul className="px-4 py-3 space-y-2.5 bg-white">
              {PRECAUTIONS.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <p.icon size={13} className="text-amber-500 flex-none mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed">{p.text}</p>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Desktop sidebar ───────────────────────────────────────────────────────────
function DesktopSidebar() {
  return (
    <div className="space-y-4">
      {/* Section A — How it works */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">How a Swap Proposal Works</p>

        <div className="space-y-4">
          {HOW_STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="flex items-start gap-3"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-none ${step.bg}`}>
                <step.icon size={16} className={step.color} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-gray-300 tabular-nums">0{i + 1}</span>
                  <p className="text-sm font-bold text-gray-900">{step.title}</p>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section B — Safety accordion */}
      <SafetyAccordion />

      {/* Section C — Escrow explainer */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
            <ShieldCheck size={15} className="text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-emerald-800">Protected by SwapNaija Escrow</p>
        </div>

        <ul className="space-y-1.5">
          {[
            'Funds locked until both parties confirm',
            'Dispute resolution included',
            '98% refund on successful completion',
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-none" />
              <p className="text-xs text-emerald-700">{item}</p>
            </li>
          ))}
        </ul>

        <Link
          to="/how-it-works"
          className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:text-emerald-700 transition"
        >
          Learn how escrow works →
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SwapProposalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: listing, isLoading } = useListing(id);

  if (isLoading) {
    return (
      <div className="bg-bg min-h-screen">
        <TopBar title="Propose Swap" showBack />
        <div className="flex justify-center items-center py-32">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="bg-bg min-h-screen">
        <TopBar title="Propose Swap" showBack />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <ArrowLeftRight size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Listing not found</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm text-primary font-semibold">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F2F3F5] flex flex-col" style={{ height: '100dvh' }}>
      <TopBar title="Propose Swap" showBack />

      {/* ── Mobile layout ── */}
      <div className="lg:hidden flex-1 overflow-y-auto">
        <HeroBanner listing={listing} compact />
        <div className="px-4 py-4">
          <SwapProposalComp listing={listing} currentUserId={user?.id} />
        </div>
      </div>

      {/* ── Desktop layout: two fixed-height columns ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">

        {/* Left col — scrollable form */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-10 py-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-gray-400 mb-5 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>

            <HeroBanner listing={listing} compact={false} />

            <h1 className="text-xl font-display font-bold text-gray-900 mb-4">Your Proposal</h1>
            <SwapProposalComp listing={listing} currentUserId={user?.id} />
          </div>
        </div>

        {/* Right col — sidebar, never scrolls with the page */}
        <div className="w-[400px] flex-none border-l border-gray-200 bg-white overflow-y-auto">
          <div className="px-6 py-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Swap Guide</p>
            <DesktopSidebar />
          </div>
        </div>

      </div>
    </div>
  );
}
