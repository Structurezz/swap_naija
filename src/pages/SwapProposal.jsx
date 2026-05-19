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

  // ── Mobile compact ────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="relative overflow-hidden" style={{ minHeight: 120 }}>
        {/* Blurred full-bleed background */}
        {imgSrc && (
          <img
            src={imgSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-110"
            style={{ filter: 'blur(18px)', transform: 'scale(1.15)' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg,rgba(0,0,0,0.62) 0%,rgba(0,0,0,0.38) 100%)' }} />

        <div className="relative flex items-center gap-3.5 px-4 py-4">
          {/* Listing image */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-none ring-2 ring-white/30 shadow-lg bg-gray-800">
            {imgSrc ? (
              <img src={imgSrc} alt={listing.title} className="w-full h-full object-cover"
                onError={e => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ArrowLeftRight size={18} className="text-white/40" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Proposing swap for</p>
            <p className="text-sm font-black text-white leading-tight truncate">{listing.title}</p>
            {listing.estimatedValue > 0 && (
              <p className="text-xs font-bold text-primary mt-0.5">{listing.estimatedValue.toLocaleString()} BC</p>
            )}
          </div>

          <div className="flex items-center gap-1 bg-emerald-500/25 border border-emerald-400/40 rounded-full px-2.5 py-1 flex-none">
            <ShieldCheck size={11} className="text-emerald-300" />
            <span className="text-[11px] text-emerald-200 font-bold whitespace-nowrap">Escrow Safe</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop full hero ─────────────────────────────────────────────────────
  return (
    <div className="relative overflow-hidden rounded-3xl mb-6" style={{ minHeight: 200 }}>
      {/* Blurred background image */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(22px)', transform: 'scale(1.12)' }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      {/* Overlay gradient */}
      <div
        className="absolute inset-0"
        style={{ background: imgSrc
          ? 'linear-gradient(120deg,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.45) 60%,rgba(0,0,0,0.28) 100%)'
          : 'linear-gradient(120deg,#0d2818 0%,#0a3d1f 50%,#052e16 100%)'
        }}
      />

      {/* Subtle grid texture overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(255,255,255,1) 31px,rgba(255,255,255,1) 32px),repeating-linear-gradient(90deg,transparent,transparent 31px,rgba(255,255,255,1) 31px,rgba(255,255,255,1) 32px)' }}
      />

      {/* Glow accent */}
      <div className="pointer-events-none absolute -bottom-10 right-20 w-64 h-64 rounded-full bg-primary/30 blur-3xl" />

      {/* Content */}
      <div className="relative flex items-center gap-7 px-8 py-8">

        {/* Large listing image */}
        <div className="relative flex-none">
          <div className="w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-2xl bg-gray-800">
            {imgSrc ? (
              <img src={imgSrc} alt={listing.title} className="w-full h-full object-cover"
                onError={e => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ArrowLeftRight size={36} className="text-white/20" />
              </div>
            )}
          </div>
          {/* Escrow dot */}
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white/30 shadow-lg">
            <ShieldCheck size={13} className="text-white" />
          </div>
        </div>

        {/* Text block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Proposing a swap for</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <h2 className="font-display font-black text-white leading-tight mb-1.5"
            style={{ fontSize: 'clamp(1.25rem,3vw,1.75rem)' }}>
            {listing.title}
          </h2>

          {listing.userId?.fullName && (
            <p className="text-sm text-white/50 mb-3">
              Listed by <span className="text-white/80 font-semibold">{listing.userId.fullName}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {listing.estimatedValue > 0 && (
              <span className="inline-flex items-center gap-1.5 font-black text-sm text-white bg-white/15 border border-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
                {listing.estimatedValue.toLocaleString()}
                <span className="text-white/60 font-normal">BC</span>
              </span>
            )}

            {listing.categoryId?.name && (
              <span className="inline-flex items-center text-xs font-semibold text-white/70 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">
                {listing.categoryId.name}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 rounded-full">
              <ShieldCheck size={11} />
              Escrow Protected
            </span>
          </div>
        </div>

        {/* Right decorative ArrowLeftRight */}
        <div className="hidden xl:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/8 border border-white/10 flex-none">
          <ArrowLeftRight size={28} className="text-white/30" />
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
    <div className="bg-[#F2F3F5] min-h-screen">
      <TopBar title="Propose Swap" showBack />

      {/* Mobile compact hero */}
      <div className="lg:hidden">
        <HeroBanner listing={listing} compact />
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
        <button
          onClick={() => navigate(-1)}
          className="hidden lg:flex items-center gap-2 text-sm text-gray-400 mb-5 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>

        <div className="hidden lg:block">
          <HeroBanner listing={listing} compact={false} />
        </div>

        <div className="lg:grid lg:grid-cols-[55fr_45fr] lg:gap-8 lg:items-start">
          {/* Left col — form */}
          <div>
            <h1 className="hidden lg:block text-xl font-display font-bold text-gray-900 mb-4">Your Proposal</h1>
            <SwapProposalComp listing={listing} currentUserId={user?.id} />
          </div>

          {/* Right col — sidebar pinned below TopBar, never scrolls */}
          <div className="hidden lg:block sticky top-14">
            <DesktopSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
