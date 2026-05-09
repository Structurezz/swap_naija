import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Zap, CheckCircle2, TrendingUp, Eye, Search, Lock, Wallet, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getListing } from '../api/listings.api';
import { initiateBoost, getBoostPlans } from '../api/payments.api';
import { useAuthStore } from '../store/auth.store';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { getListingPlaceholder } from '../utils/placeholder';

const BENEFITS = [
  { icon: TrendingUp, label: '10× more visibility',       desc: 'Boosted listings appear at the top of search results.' },
  { icon: Eye,        label: 'Featured on Home page',      desc: 'Your listing appears in the Featured section seen by all users.' },
  { icon: Search,     label: 'Priority in category feeds', desc: 'Ranked first in your category browsing page.' },
];

const FALLBACK_PLANS = [
  { id: '7d',  amountKobo: 50000,  days: 7,  label: '7 days – ₦500' },
  { id: '30d', amountKobo: 150000, days: 30, label: '30 days – ₦1,500' },
];

export default function BoostListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState('7d');

  const { data: listing, isLoading: loadingListing } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListing(id),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['boost-plans'],
    queryFn: getBoostPlans,
    staleTime: Infinity,
  });

  const activePlans   = plans.length ? plans : FALLBACK_PLANS;
  const currentPlan   = activePlans.find(p => p.id === selectedPlan) || activePlans[0];
  const walletBalance = user?.walletBalance ?? 0;
  const canAfford     = walletBalance >= (currentPlan?.amountKobo || 0);

  const mutation = useMutation({
    mutationFn: () => initiateBoost(id, { plan: selectedPlan }),
    onSuccess: (result) => {
      refreshUser();
      toast.success(result.message || 'Listing boosted!');
      navigate(`/listing/${id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Boost failed'),
  });

  if (loadingListing) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!listing) return <div className="text-center py-20 text-gray-400">Listing not found</div>;

  const isBoosted   = listing.isBoosted && listing.boostExpires && new Date(listing.boostExpires) > new Date();
  const placeholder = getListingPlaceholder(listing);

  /* ── Shared pieces ──────────────────────────────────────────────── */

  const PurchasePanel = () => (
    <div className="space-y-5">
      {/* Plan selection */}
      <div className="space-y-2">
        <h2 className="font-display font-semibold">Choose a plan</h2>
        {activePlans.map(plan => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition ${
              selectedPlan === plan.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="text-left">
              <p className="font-semibold text-sm">{plan.days} Days</p>
              <p className="text-xs text-gray-500">Top placement for {plan.days} days</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-ink">₦{(plan.amountKobo / 100).toLocaleString()}</p>
              <p className="text-xs text-gray-400">from wallet</p>
            </div>
          </button>
        ))}
      </div>

      {/* Wallet balance check */}
      <div className={`rounded-2xl px-4 py-3 flex items-center justify-between ${canAfford ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
        <div className="flex items-center gap-2">
          <Wallet size={15} className={canAfford ? 'text-green-600' : 'text-red-500'} />
          <div>
            <p className={`text-sm font-semibold ${canAfford ? 'text-green-700' : 'text-red-700'}`}>
              {canAfford ? 'Sufficient balance' : 'Insufficient balance'}
            </p>
            <p className="text-xs text-gray-500">
              Wallet: ₦{(walletBalance / 100).toLocaleString()} · Cost: ₦{(currentPlan?.amountKobo / 100).toLocaleString()}
            </p>
          </div>
        </div>
        {!canAfford && (
          <Link to="/wallet">
            <Button size="sm" variant="primary">Top Up</Button>
          </Link>
        )}
      </div>

      {/* Lock note */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Lock size={12} className="flex-none" />
        Deducted instantly from your SwapNaija wallet balance.
      </div>

      {/* CTA */}
      {canAfford ? (
        <Button fullWidth size="lg" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          <Zap size={18} />
          Boost for {currentPlan?.days} Days — ₦{(currentPlan?.amountKobo / 100).toLocaleString()}
        </Button>
      ) : (
        <Link to="/wallet">
          <Button fullWidth size="lg" variant="secondary">
            <Wallet size={18} />
            Top Up Wallet First
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Boost Listing" showBack />

      {/* ── MOBILE layout ─────────────────────────────────────────── */}
      <div className="lg:hidden max-w-md mx-auto px-4 py-4 space-y-5">
        {/* Listing preview */}
        <div className="card flex items-center gap-3 p-3">
          <img
            src={listing.images?.[0] || placeholder}
            alt={listing.title}
            className="w-16 h-16 rounded-xl object-cover flex-none"
            onError={(e) => { e.currentTarget.src = placeholder; }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{listing.title}</p>
            {listing.estimatedValue && (
              <p className="text-primary text-xs font-medium">₦{listing.estimatedValue.toLocaleString()}</p>
            )}
            {isBoosted && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 rounded-full px-2 py-0.5 mt-1">
                <Zap size={10} fill="currentColor" /> Boosted until {new Date(listing.boostExpires).toLocaleDateString('en-NG')}
              </span>
            )}
          </div>
        </div>

        {isBoosted ? (
          <div className="card bg-amber-50 border border-amber-100 text-center py-6 space-y-2">
            <CheckCircle2 size={32} className="text-amber-500 mx-auto" />
            <p className="font-display font-bold text-ink">This listing is already boosted</p>
            <p className="text-sm text-gray-500">Active until {new Date(listing.boostExpires).toLocaleDateString('en-NG', { day: 'numeric', month: 'long' })}.</p>
          </div>
        ) : (
          <>
            {/* Hero banner */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-5 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <div>
                  <h1 className="font-display font-bold text-lg">Boost This Listing</h1>
                  <p className="text-sm opacity-80">Get seen by more swappers</p>
                </div>
              </div>
              <p className="text-sm opacity-90">
                Boosted listings get up to <span className="font-bold">10× more views</span> and appear at the top
                of search results and the Featured section on the Home page.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              {BENEFITS.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center flex-none">
                    <Icon size={15} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <PurchasePanel />
          </>
        )}
      </div>

      {/* ── DESKTOP layout ────────────────────────────────────────── */}
      <div className="hidden lg:block lg:max-w-5xl lg:mx-auto lg:px-8 lg:py-8">
        {/* Back nav */}
        <button
          onClick={() => navigate(-1)}
          className="hidden lg:flex items-center gap-2 text-sm text-gray-500 hover:text-ink cursor-pointer mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {isBoosted ? (
          /* Already boosted — full-width centered state */
          <div className="card bg-amber-50 border border-amber-100 text-center py-16 space-y-3 max-w-lg mx-auto">
            <CheckCircle2 size={48} className="text-amber-500 mx-auto" />
            <p className="font-display font-bold text-ink text-xl">This listing is already boosted</p>
            <p className="text-gray-500">Active until {new Date(listing.boostExpires).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
            <button
              onClick={() => navigate(`/listing/${id}`)}
              className="text-sm text-primary font-medium hover:underline mt-2"
            >
              View listing
            </button>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-8 lg:items-start">

            {/* LEFT: listing preview + hero banner + benefits */}
            <div className="space-y-6">
              {/* Listing preview */}
              <div className="card flex items-center gap-5 p-5">
                <img
                  src={listing.images?.[0] || placeholder}
                  alt={listing.title}
                  className="w-full h-48 object-cover rounded-2xl"
                  style={{ maxWidth: '200px' }}
                  onError={(e) => { e.currentTarget.src = placeholder; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-xl text-ink truncate">{listing.title}</p>
                  {listing.estimatedValue && (
                    <p className="text-primary font-semibold text-base mt-1">₦{listing.estimatedValue.toLocaleString()}</p>
                  )}
                  {listing.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{listing.description}</p>
                  )}
                </div>
              </div>

              {/* Hero banner */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-7 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h1 className="font-display font-bold text-2xl">Boost This Listing</h1>
                    <p className="text-sm opacity-80">Get seen by more swappers</p>
                  </div>
                </div>
                <p className="text-base opacity-90 leading-relaxed">
                  Boosted listings get up to <span className="font-bold">10× more views</span> and appear at the top
                  of search results and the Featured section on the Home page.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                {BENEFITS.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center flex-none">
                      <Icon size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-ink">{label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: sticky purchase panel */}
            <div className="lg:sticky lg:top-8">
              <PurchasePanel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
