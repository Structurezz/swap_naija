import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  ShieldCheck, CheckCircle2, Star, TrendingUp, Lock, Wallet,
  BadgeCheck, Crown, Upload, X, Eye, FileText,
  Clock, AlertCircle, ImageIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { initiateVerify, submitKyc } from '../api/payments.api';
import { useAuthStore } from '../store/auth.store';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const COST_KOBO = 100000; // 1,000 BC

const ID_TYPES = [
  { value: 'nin',             label: 'National ID (NIN)',         hint: '11-digit NIN slip number' },
  { value: 'passport',        label: 'International Passport',    hint: 'Passport number (e.g. A12345678)' },
  { value: 'drivers_license', label: "Driver's License",          hint: 'License number on the card' },
  { value: 'voters_card',     label: "Voter's Card",              hint: 'VIN number on the card' },
];

const STANDARD_BENEFITS = [
  { icon: BadgeCheck, label: 'Verified badge on profile',    desc: 'Blue checkmark builds instant trust with swap partners.' },
  { icon: Eye,        label: 'Priority in search results',   desc: 'Verified listings rank higher and get more views.' },
  { icon: Star,       label: 'Higher swap acceptance rate',  desc: 'Swappers accept offers from verified users 3× more often.' },
];

const PREMIUM_BENEFITS = [
  { icon: Crown,      label: 'Premium gold badge',           desc: 'Stand out with an exclusive gold verified badge.' },
  { icon: ShieldCheck,label: 'Maximum trust score',          desc: 'ID-verified users get the highest trust rating on the platform.' },
  { icon: TrendingUp, label: 'Top of search ranking',        desc: 'Premium profiles always rank above standard verified.' },
  { icon: Star,       label: 'All Standard benefits',        desc: 'Includes everything from the Standard plan.' },
];

function TierBadge({ tier }) {
  if (tier === 'premium') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">
        <Crown size={14} /> Premium Verified
      </span>
    );
  }
  if (tier === 'verified') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
        <BadgeCheck size={14} /> Standard Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-sm font-semibold">
      Not Verified
    </span>
  );
}

function KycForm({ onClose, onSuccess }) {
  const [idType, setIdType]         = useState('');
  const [idNumber, setIdNumber]     = useState('');
  const [docPreview, setDocPreview] = useState(null);
  const [docData, setDocData]       = useState(null);
  const fileRef = useRef(null);

  const mutation = useMutation({
    mutationFn: () => submitKyc({ idType, idNumber, docUrl: docData }),
    onSuccess: (data) => {
      toast.success("KYC submitted! We'll review within 24–48 hours.");
      onSuccess(data);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Submission failed'),
  });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDocData(ev.target.result);
      setDocPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const canSubmit = idType && idNumber.trim().length >= 5 && docData;
  const selectedIdType = ID_TYPES.find(t => t.value === idType);

  return (
    <div className="space-y-5 p-1">
      {/* ID type */}
      <div>
        <p className="text-sm font-semibold text-ink mb-2">Select ID Type</p>
        <div className="grid grid-cols-2 gap-2">
          {ID_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setIdType(t.value)}
              className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all
                ${idType === t.value
                  ? 'border-amber-500 bg-amber-50 text-amber-700 font-semibold'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ID number */}
      <div>
        <label className="block text-sm font-semibold text-ink mb-1.5">
          ID Number
          {selectedIdType && <span className="ml-2 text-xs text-gray-400 font-normal">({selectedIdType.hint})</span>}
        </label>
        <input
          type="text"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          placeholder="Enter your ID number"
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
        />
      </div>

      {/* Document upload */}
      <div>
        <p className="text-sm font-semibold text-ink mb-1.5">Upload ID Photo</p>
        {docPreview ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <img src={docPreview} alt="ID preview" className="w-full h-40 object-cover" />
            <button
              type="button"
              onClick={() => { setDocPreview(null); setDocData(null); }}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-amber-300 hover:text-amber-500 transition-colors"
          >
            <ImageIcon size={28} />
            <span className="text-sm font-medium">Click to upload a photo of your ID</span>
            <span className="text-xs">JPG, PNG · Max 5 MB</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3.5 py-3">
        <Lock size={14} className="flex-none mt-0.5 text-gray-400" />
        <p className="text-xs text-gray-500">
          Your ID is stored securely and only used for verification. It will never be shared with other users.
        </p>
      </div>

      <button
        type="button"
        disabled={!canSubmit || mutation.isPending}
        onClick={() => mutation.mutate()}
        className="w-full flex items-center justify-center gap-2 px-8 py-4 text-base font-medium rounded-2xl bg-amber-500 hover:bg-amber-600 text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText size={16} />
        {mutation.isPending ? 'Submitting…' : 'Submit for Review'}
      </button>
    </div>
  );
}

export default function VerifyAccount() {
  const { user, refreshUser } = useAuthStore();
  const [kycModalOpen, setKycModalOpen] = useState(false);

  const verification  = user?.verification ?? 'basic';
  const kyc           = user?.kyc;
  const walletBalance = user?.walletBalance ?? 0;
  const canAfford     = walletBalance >= COST_KOBO;

  const isVerified = verification === 'verified';
  const isPremium  = verification === 'premium';
  const kycPending = kyc?.status === 'pending' && !isPremium;

  const verifyMutation = useMutation({
    mutationFn: initiateVerify,
    onSuccess: () => {
      refreshUser();
      toast.success('Account verified successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Verification failed'),
  });

  const handleKycSuccess = () => {
    refreshUser();
  };

  const StandardCard = () => (
    <div className={`rounded-3xl border overflow-hidden ${isVerified || isPremium ? 'border-primary/30' : 'border-gray-200'}`}>
      {/* Card header */}
      <div className={`px-6 py-5 ${isVerified || isPremium ? 'bg-gradient-to-br from-primary to-green-600' : 'bg-gradient-to-br from-primary/90 to-primary/60'} text-white`}>
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
            <BadgeCheck size={22} />
          </div>
          {(isVerified || isPremium) && (
            <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 size={12} /> Active
            </span>
          )}
        </div>
        <h3 className="font-display font-bold text-xl">Standard Verified</h3>
        <p className="text-sm opacity-80 mt-0.5">Verified blue badge · Instant</p>
        <div className="mt-4 bg-white/15 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm opacity-80">One-time fee</span>
          <span className="text-2xl font-display font-bold">1,000 BC</span>
        </div>
      </div>

      {/* Benefits */}
      <div className="px-5 py-4 bg-white space-y-3">
        {STANDARD_BENEFITS.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-none">
              <Icon size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 bg-white">
        {isPremium ? (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 text-gray-400 text-sm">
            <CheckCircle2 size={15} /> Included in Premium
          </div>
        ) : isVerified ? (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold">
            <CheckCircle2 size={15} /> Current Plan
          </div>
        ) : canAfford ? (
          <Button fullWidth loading={verifyMutation.isPending} onClick={() => verifyMutation.mutate()}>
            <BadgeCheck size={15} />
            Get Verified — 1,000 BC
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-center text-red-500 flex items-center justify-center gap-1">
              <AlertCircle size={12} />
              Wallet: {(walletBalance / 100).toLocaleString()} BC — need 1,000 BC
            </div>
            <Link to="/wallet?returnTo=/verify-account">
              <Button fullWidth variant="secondary">
                <Wallet size={15} /> Top Up Wallet
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  const PremiumCard = () => (
    <div className={`rounded-3xl border overflow-hidden ${isPremium ? 'border-amber-400' : kycPending ? 'border-amber-200' : 'border-gray-200'}`}>
      {/* Card header */}
      <div className={`px-6 py-5 text-white relative overflow-hidden
        ${isPremium ? 'bg-gradient-to-br from-amber-500 to-orange-600'
          : kycPending ? 'bg-gradient-to-br from-amber-400/80 to-orange-500/80'
          : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="flex items-center justify-between mb-3 relative">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
            <Crown size={22} />
          </div>
          <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">Free · ID Required</span>
        </div>
        <h3 className="font-display font-bold text-xl relative">Premium Verified</h3>
        <p className="text-sm opacity-80 mt-0.5 relative">Gold badge · Maximum trust</p>
        <div className="mt-4 bg-white/15 rounded-2xl px-4 py-3 relative">
          <p className="text-sm opacity-80">ID verification — 24–48 hr review</p>
        </div>
      </div>

      {/* Benefits */}
      <div className="px-5 py-4 bg-white space-y-3">
        {PREMIUM_BENEFITS.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-none">
              <Icon size={14} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 bg-white">
        {isPremium ? (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 text-amber-700 text-sm font-semibold">
            <Crown size={15} /> Premium Active
          </div>
        ) : kycPending ? (
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 text-amber-700 text-sm font-semibold">
              <Clock size={15} /> Under Review
            </div>
            <p className="text-xs text-center text-gray-400">
              Submitted {kyc?.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : ''}
            </p>
          </div>
        ) : kyc?.status === 'rejected' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold">
              <AlertCircle size={14} /> Rejected — {kyc.rejectionReason || 'Please resubmit'}
            </div>
            <button
              type="button"
              onClick={() => setKycModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-2xl border border-amber-300 text-amber-700 hover:bg-amber-50 transition-all active:scale-95"
            >
              <Upload size={15} /> Resubmit KYC
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setKycModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-2xl bg-amber-500 hover:bg-amber-600 text-white transition-all active:scale-95"
          >
            <Crown size={15} />
            Apply for Premium
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Verify Account" showBack />

      {/* Hero banner */}
      <div className="bg-[#0A1628] px-4 py-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-1">
          <TierBadge tier={verification} />
        </div>
        <h1 className="font-display font-bold text-2xl text-white">
          {isPremium ? 'You\'re Premium Verified' : isVerified ? 'You\'re Verified' : 'Get Verified'}
        </h1>
        <p className="text-sm text-white/60 max-w-xs mx-auto">
          {isPremium
            ? 'Your identity has been confirmed. You have maximum trust on SwapNaija.'
            : isVerified
              ? 'Upgrade to Premium for a gold badge and ID-verified trust status.'
              : 'Choose a verification tier to build trust with swap partners.'}
        </p>
      </div>

      {/* ── MOBILE layout ───────────────────────────────────────────── */}
      <div className="lg:hidden max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Comparison hint */}
        {!isPremium && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
            <Crown size={14} className="text-amber-600 flex-none" />
            <p className="text-xs text-amber-700">
              <strong>Premium</strong> is free — just submit a government-issued ID for review.
            </p>
          </div>
        )}

        <StandardCard />
        <PremiumCard />

        {/* Disclaimer */}
        <div className="flex items-start gap-2 text-xs text-gray-400 px-1">
          <Lock size={12} className="flex-none mt-0.5" />
          <p>Standard verification deducts 1,000 BC from your SwapNaija wallet. Premium KYC is free and reviewed within 24–48 hours.</p>
        </div>
      </div>

      {/* ── DESKTOP layout ─────────────────────────────────────────── */}
      <div className="hidden lg:block max-w-5xl mx-auto px-8 py-10">
        {!isPremium && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-8">
            <Crown size={15} className="text-amber-600 flex-none" />
            <p className="text-sm text-amber-700">
              <strong>Premium is free</strong> — just submit a government-issued ID. Our team reviews within 24–48 hours.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 items-start">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">1</div>
              <h2 className="font-display font-semibold text-ink text-lg">Standard Verified</h2>
            </div>
            <StandardCard />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold">2</div>
              <h2 className="font-display font-semibold text-ink text-lg">Premium Verified</h2>
            </div>
            <PremiumCard />
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-gray-400 mt-6">
          <Lock size={12} className="flex-none mt-0.5" />
          <p>Standard verification deducts 1,000 BC from your wallet. Premium KYC is free and reviewed within 24–48 hours. No card details are stored.</p>
        </div>
      </div>

      {/* KYC Modal */}
      <Modal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        title="Premium KYC Verification"
        size="sm"
      >
        <KycForm onClose={() => setKycModalOpen(false)} onSuccess={handleKycSuccess} />
      </Modal>
    </div>
  );
}
