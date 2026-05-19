import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyListings } from '../../../api/listings.api';
import { proposeSwap } from '../../../api/swaps.api';
import { useAuthStore } from '../../../store/auth.store';
import Button from '../../ui/Button';
import Spinner from '../../ui/Spinner';
import Avatar from '../../ui/Avatar';
import { IMAGE_FALLBACK_SRC, resolveImageUrl } from '../../../utils/placeholder';
import { formatBC } from '../../../utils/currency';
import {
  ArrowLeftRight, Coins, Shield, AlertCircle,
  CheckCircle2, ChevronDown, Info, Wallet,
  ChevronLeft, ChevronRight, Plus, Search, X,
  ArrowRight, TrendingDown,
} from 'lucide-react';

const PICKER_LIMIT = 6;

const COLLATERAL_OPTIONS = [
  { value: 5,  label: '5%',  desc: 'Low' },
  { value: 10, label: '10%', desc: 'Standard' },
  { value: 15, label: '15%', desc: 'Moderate' },
  { value: 20, label: '20%', desc: 'High' },
  { value: 30, label: '30%', desc: 'Serious' },
  { value: 50, label: '50%', desc: 'Max trust' },
];

const ESCROW_MIN_KOBO = 50000;

function calcDeposit(initiatorValue, receiverValue, collateralPct) {
  const maxNaira = Math.max(initiatorValue || 0, receiverValue || 0);
  if (maxNaira <= 0) return ESCROW_MIN_KOBO;
  return Math.max(ESCROW_MIN_KOBO, Math.round(maxNaira * (collateralPct / 100)) * 100);
}

// ── Overview card ─────────────────────────────────────────────────────────────
function OverviewCard({ listing, label, highlight, placeholder }) {
  if (placeholder) {
    return (
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex flex-col"
      >
        <div className="h-20 bg-gray-100 flex items-center justify-center">
          <ChevronDown size={28} className="text-gray-300" />
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
          <p className="text-sm font-medium text-gray-400">Select what you'll offer below</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden border-2 bg-gray-50 ${highlight ? 'border-primary/40' : 'border-gray-200'}`}>
      <div className="relative h-20 bg-gray-100">
        {listing.images?.[0] ? (
          <img
            src={resolveImageUrl(listing.images[0])}
            alt={listing.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-300 text-xs">No image</span>
          </div>
        )}
        {/* Light gradient overlay for readability */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50 to-transparent" />
      </div>
      <div className="p-3 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{listing.title}</p>
          {listing.estimatedValue > 0 ? (
            <p className={`text-xs font-bold mt-1 ${highlight ? 'text-primary' : 'text-gray-600'}`}>
              {listing.estimatedValue.toLocaleString()} BC
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">No value set</p>
          )}
        </div>
        {listing.userId && (
          <Avatar src={listing.userId.avatarUrl} name={listing.userId.fullName} size="xs" />
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function SwapProposal({ listing, currentUserId }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { register, handleSubmit, watch } = useForm();
  const noteValue = watch('proposalNote', '');
  const [topUpPayerRole, setTopUpPayerRole] = useState('none');
  const [collateralPct, setCollateralPct]   = useState(10);

  const walletBalance = user?.walletBalance ?? 0;

  const [pickerPage, setPickerPage] = useState(1);
  const [pickerSearch, setPickerSearch] = useState('');

  const { data: pickerData, isLoading: pickerLoading } = useQuery({
    queryKey: ['my-listings-picker', pickerPage, pickerSearch],
    queryFn:  () => getMyListings({ page: pickerPage, limit: PICKER_LIMIT, q: pickerSearch || undefined }),
    keepPreviousData: true,
  });
  const pickerListings = pickerData?.listings ?? [];
  const pickerTotal    = pickerData?.total ?? 0;
  const pickerPages    = pickerData?.pages ?? 1;

  const handlePickerSearch = (val) => {
    setPickerSearch(val);
    setPickerPage(1);
  };

  const [selectedListingId, setSelectedListingId] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);

  const receiverValue  = listing.estimatedValue  || 0;
  const initiatorValue = selectedListing?.estimatedValue || 0;
  const minSwapValue   = listing.minSwapValue || 0;
  const meetsThreshold = minSwapValue <= 0 || initiatorValue >= minSwapValue;

  const gap           = Math.abs(receiverValue - initiatorValue);
  const initiatorOwes = receiverValue > initiatorValue;
  const receiverOwes  = initiatorValue > receiverValue;
  const hasGap        = gap > 0 && initiatorValue > 0;

  const depositKobo   = calcDeposit(initiatorValue, receiverValue, collateralPct);
  const platformFee   = Math.round(depositKobo * 0.02);
  const refundKobo    = depositKobo - platformFee;

  const myTopUpKobo   = hasGap && topUpPayerRole === 'initiator' ? gap * 100 : 0;
  const totalNeeded   = depositKobo + myTopUpKobo;
  const hasSufficient = walletBalance >= totalNeeded;
  const shortfall     = totalNeeded - walletBalance;

  const mutation = useMutation({
    mutationFn: proposeSwap,
    onSuccess: () => {
      toast.success('Swap proposed!');
      navigate('/swaps');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to propose swap');
    },
  });

  const onSubmit = (data) => {
    const topUpAmountKobo = hasGap && topUpPayerRole !== 'none' ? gap * 100 : 0;
    mutation.mutate({
      receiverId:       listing.userId?.id,
      receiverListing:  listing.id,
      initiatorListing: selectedListingId || undefined,
      proposalNote:     data.proposalNote,
      collateralPercent: collateralPct,
      topUpAmountKobo,
      topUpPayerRole: topUpAmountKobo > 0 ? topUpPayerRole : 'none',
    });
  };

  const canSubmit = !mutation.isPending &&
    (minSwapValue <= 0 || !selectedListing || meetsThreshold);

  const totalValue   = initiatorValue + receiverValue;
  const initiatorPct = totalValue > 0 ? Math.round((initiatorValue / totalValue) * 100) : 50;
  const receiverPct  = 100 - initiatorPct;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* ── 1. Swap Overview ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3"
      >
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Swap Overview</p>

        <div className="grid grid-cols-2 gap-3">
          <OverviewCard listing={listing} label="You want" highlight />
          {selectedListing
            ? <OverviewCard listing={selectedListing} label="You offer" />
            : <OverviewCard listing={null} label="You offer" placeholder />
          }
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-gray-100" />
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
            <ArrowLeftRight size={12} className="text-primary" />
            <span className="text-xs text-primary font-semibold">for</span>
          </div>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
      </motion.div>

      {/* ── 2. Listing picker ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-2xl bg-white border-t-[3px] border-t-primary border border-gray-100 overflow-hidden shadow-sm"
      >
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">What will you offer?</p>
              {!pickerLoading && pickerTotal > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {pickerTotal} listing{pickerTotal !== 1 ? 's' : ''} available
                </p>
              )}
            </div>
            <Link
              to="/create"
              className="flex items-center gap-1 text-xs text-primary font-bold bg-primary/8 hover:bg-primary/15 px-3 py-1.5 rounded-xl transition"
            >
              <Plus size={12} /> New listing
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={pickerSearch}
              onChange={e => handlePickerSearch(e.target.value)}
              placeholder="Search your listings…"
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white transition"
            />
            <AnimatePresence>
              {pickerSearch && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={() => handlePickerSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Open offer option */}
          <button
            type="button"
            onClick={() => { setSelectedListingId(''); setSelectedListing(null); }}
            className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 border-2 transition text-left ${
              !selectedListingId
                ? 'border-primary bg-primary/5'
                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-none transition ${
              !selectedListingId ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              <ArrowLeftRight size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${!selectedListingId ? 'text-primary' : 'text-gray-700'}`}>
                Open offer / service
              </p>
              <p className="text-xs text-gray-400 mt-0.5">No specific item — describe in the note below</p>
            </div>
            <AnimatePresence>
              {!selectedListingId && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <CheckCircle2 size={18} className="text-primary flex-none" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Listing grid */}
          {pickerLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : pickerListings.length === 0 && pickerTotal === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-4 py-6 text-center">
              <p className="text-sm text-gray-500 mb-2">You have no listings yet.</p>
              <Link to="/create" className="text-xs text-primary font-bold">Create a listing first →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {pickerListings.map(l => {
                const isSelected = selectedListingId === l.id;
                return (
                  <motion.button
                    key={l.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedListingId(l.id); setSelectedListing(l); }}
                    className={`relative rounded-2xl overflow-hidden border-2 transition text-left ${
                      isSelected ? 'border-primary' : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="relative h-24 bg-gray-100">
                      {l.images?.[0] ? (
                        <img
                          src={resolveImageUrl(l.images[0])}
                          alt={l.title}
                          className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-gray-300 text-xs">No img</span>
                        </div>
                      )}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-primary/15 flex items-center justify-center"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                              <CheckCircle2 size={16} className="text-white" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="p-2 bg-white">
                      <p className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-primary' : 'text-gray-800'}`}>
                        {l.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {l.estimatedValue ? `${l.estimatedValue.toLocaleString()} BC` : 'No value'}
                        {l.status && l.status !== 'active' && (
                          <span className="ml-1 text-amber-500 capitalize">{l.status}</span>
                        )}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pickerPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPickerPage(p => Math.max(1, p - 1))}
                disabled={pickerPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span className="text-xs text-gray-400 px-1">{pickerPage} / {pickerPages}</span>
              <button
                type="button"
                onClick={() => setPickerPage(p => Math.min(pickerPages, p + 1))}
                disabled={pickerPage === pickerPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Validation hints */}
      <AnimatePresence>
        {minSwapValue > 0 && !selectedListing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5"
          >
            <Info size={13} className="text-amber-600 flex-none mt-0.5" />
            <p className="text-xs text-amber-800">
              This listing requires a swap item worth at least{' '}
              <span className="font-bold">{minSwapValue.toLocaleString()} BC</span>.
            </p>
          </motion.div>
        )}
        {minSwapValue > 0 && selectedListing && !meetsThreshold && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"
          >
            <AlertCircle size={13} className="text-red-500 flex-none mt-0.5" />
            <p className="text-xs text-red-700">
              Your item ({initiatorValue.toLocaleString()} BC) is below the{' '}
              <span className="font-bold">{minSwapValue.toLocaleString()} BC</span> minimum.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. Value gap ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {hasGap && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl bg-amber-50 border border-amber-200 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Coins size={16} className="text-amber-600" />
                  </div>
                  <p className="text-sm font-bold text-amber-900">Value Gap</p>
                </div>
                <span className="text-sm font-black text-amber-800 bg-amber-200 px-3 py-1 rounded-full">
                  {gap.toLocaleString()} BC
                </span>
              </div>

              {/* Value comparison bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-amber-700 mb-1">
                  <span>Your item</span>
                  <span>Their item</span>
                </div>
                <div className="flex rounded-full overflow-hidden h-3 bg-amber-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${initiatorPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="bg-primary h-full"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${receiverPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="bg-amber-400 h-full"
                  />
                </div>
                <div className="flex justify-between">
                  <div className="text-center">
                    <p className="text-base font-black text-gray-900">{initiatorValue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">BC</p>
                    {initiatorOwes && (
                      <div className="flex items-center gap-0.5 text-xs text-amber-600 mt-0.5">
                        <TrendingDown size={10} /> lower
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-base font-black text-gray-900">{receiverValue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">BC</p>
                    {receiverOwes && (
                      <div className="flex items-center gap-0.5 text-xs text-amber-600 mt-0.5">
                        <TrendingDown size={10} /> lower
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-amber-800 leading-relaxed">
                {initiatorOwes
                  ? `Your item is worth ${gap.toLocaleString()} BC less. Cover this gap with Barter Credits, or ask them to accept as-is.`
                  : `Their item is worth ${gap.toLocaleString()} BC less. Ask them to top up, or accept the difference.`
                }
              </p>

              {/* Payer role buttons */}
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wide">
                  Who pays the {gap.toLocaleString()} BC gap?
                </p>
                <div className="flex gap-2">
                  {[
                    { key: 'initiator', label: 'I pay', sub: `${gap.toLocaleString()} BC from my wallet` },
                    { key: 'receiver',  label: 'They pay', sub: 'requires their agreement' },
                    { key: 'none',      label: 'Skip', sub: 'no top-up' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setTopUpPayerRole(opt.key)}
                      className={`flex-1 py-2.5 px-2 rounded-2xl text-xs font-bold transition border-2 ${
                        topUpPayerRole === opt.key
                          ? opt.key === 'none'
                            ? 'border-gray-400 bg-gray-100 text-gray-700'
                            : 'border-amber-500 bg-amber-500 text-white'
                          : 'border-amber-200 bg-white text-amber-700 hover:border-amber-400'
                      }`}
                    >
                      {opt.label}
                      <span className="block text-xs font-normal opacity-70 mt-0.5 leading-tight">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {topUpPayerRole === 'initiator' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-xl px-3 py-2.5"
                  >
                    <Info size={13} className="text-amber-700 flex-none" />
                    <p className="text-xs text-amber-800">
                      <span className="font-bold">{gap.toLocaleString()} BC</span> will be held in escrow and released to them when the swap completes.
                    </p>
                  </motion.div>
                )}
                {topUpPayerRole === 'receiver' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5"
                  >
                    <Info size={13} className="text-blue-600 flex-none" />
                    <p className="text-xs text-blue-700">
                      They'll see this request when reviewing your proposal. They must accept before paying.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 4. Escrow collateral ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <Shield size={16} className="text-blue-600" />
            </div>
            <p className="text-sm font-bold text-gray-900">Escrow Protection</p>
          </div>
          <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full font-medium">2% service fee</span>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Both parties stake Barter Credits. Higher % = stronger commitment, lower ghosting risk.
          You get most back when the swap completes.
        </p>

        {/* Collateral pills — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {COLLATERAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCollateralPct(opt.value)}
              className={`flex-none px-4 py-2.5 rounded-2xl text-center transition border-2 whitespace-nowrap ${
                collateralPct === opt.value
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <p className="text-sm font-bold">{opt.label}</p>
              <p className="text-xs opacity-70">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* Breakdown */}
        <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2 border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Each party stakes</span>
            <span className="text-sm font-bold text-gray-900">{formatBC(depositKobo)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Service fee (2%)</span>
            <span className="text-xs text-red-500">−{formatBC(platformFee)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-gray-200 pt-2">
            <span className="text-xs text-gray-500">Refunded on completion</span>
            <span className="text-sm font-bold text-emerald-600">+{formatBC(refundKobo)}</span>
          </div>
        </div>
      </motion.div>

      {/* ── 5. Wallet cost summary ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className={`rounded-2xl p-4 border space-y-3 ${
          hasSufficient ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Wallet size={16} className={hasSufficient ? 'text-emerald-600' : 'text-red-500'} />
          <p className={`text-sm font-bold ${hasSufficient ? 'text-emerald-800' : 'text-red-700'}`}>
            What you'll need from your wallet
          </p>
        </div>

        {/* Balance meter */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Your balance</span>
            <span className={`font-bold ${hasSufficient ? 'text-emerald-700' : 'text-red-600'}`}>
              {formatBC(walletBalance)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (walletBalance / Math.max(totalNeeded, 1)) * 100)}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className={`h-full rounded-full ${hasSufficient ? 'bg-emerald-500' : 'bg-red-400'}`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>0 BC</span>
            <span>Needed: {formatBC(totalNeeded)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 space-y-2 border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Escrow deposit</span>
            <span className="text-sm font-semibold text-gray-900">{formatBC(depositKobo)}</span>
          </div>
          {myTopUpKobo > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Value gap top-up</span>
              <span className="text-sm font-semibold text-amber-600">{formatBC(myTopUpKobo)}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-gray-100 pt-2">
            <span className="text-xs font-semibold text-gray-700">Total needed now</span>
            <span className="text-sm font-black text-gray-900">{formatBC(totalNeeded)}</span>
          </div>
        </div>

        {hasSufficient ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500 flex-none" />
            <p className="text-xs text-emerald-700 font-medium">
              You have enough Barter Credits.
              {refundKobo > 0 && ` ${formatBC(refundKobo)} refunded after the swap.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-red-500 flex-none mt-0.5" />
              <p className="text-xs text-red-700">
                You need <span className="font-bold">{formatBC(shortfall)} more</span> to cover the escrow deposit
                {myTopUpKobo > 0 ? ' and top-up' : ''}.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── 6. Note ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="space-y-1.5"
      >
        <label className="block text-sm font-semibold text-gray-800">
          Add a note <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <textarea
            {...register('proposalNote')}
            placeholder="Introduce yourself and explain why this is a fair swap…"
            rows={4}
            maxLength={500}
            className="w-full rounded-2xl px-4 py-3 text-sm bg-white border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition resize-none min-h-[100px]"
          />
          <span className="absolute bottom-3 right-3 text-xs text-gray-300 font-medium">
            {(noteValue || '').length}/500
          </span>
        </div>
      </motion.div>

      {/* ── 7. Submit ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="space-y-3"
      >
        {!hasSufficient && (
          <a
            href="/wallet"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white border-2 border-red-300 text-red-600 text-sm font-bold hover:bg-red-50 transition"
          >
            <Wallet size={16} />
            Top up wallet — add {formatBC(shortfall)}
          </a>
        )}

        <button
          type="submit"
          disabled={!canSubmit || !hasSufficient || mutation.isPending}
          className="relative w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-base transition disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #10b981 100%)' }}
        >
          {mutation.isPending ? (
            <Spinner size="sm" color="white" />
          ) : (
            <>
              Send Swap Proposal
              <ArrowRight size={18} />
            </>
          )}
          {!mutation.isPending && canSubmit && hasSufficient && (
            <motion.div
              className="absolute inset-0 bg-white/10"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
              style={{ skewX: '-15deg' }}
            />
          )}
        </button>

        <p className="text-xs text-center text-gray-400">
          The escrow deposit is only charged when both parties accept.
        </p>
      </motion.div>
    </form>
  );
}

export default SwapProposal;
