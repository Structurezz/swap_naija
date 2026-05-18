import { useMutation } from '@tanstack/react-query';
import { ShieldCheck, CheckCircle2, Eye, Star, TrendingUp, Lock, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { initiateVerify } from '../api/payments.api';
import { useAuthStore } from '../store/auth.store';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';

const COST_KOBO = 100000; // ₦1,000

const BENEFITS = [
  { icon: ShieldCheck, color: 'text-primary',    label: 'Verified badge on your profile',  desc: 'A blue checkmark that builds instant trust with swap partners.' },
  { icon: Eye,         color: 'text-blue-500',   label: 'Priority in search results',      desc: 'Verified listings rank higher and get more views.' },
  { icon: Star,        color: 'text-amber-500',  label: 'Higher swap acceptance rate',     desc: 'Swappers accept offers from verified users 3× more often.' },
  { icon: TrendingUp,  color: 'text-green-500',  label: 'Unlocks premium features',        desc: 'Early access to escrow, advanced filters and more.' },
];

export default function VerifyAccount() {
  const { user, refreshUser } = useAuthStore();
  const isVerified    = user?.verification === 'verified';
  const walletBalance = user?.walletBalance ?? 0;
  const canAfford     = walletBalance >= COST_KOBO;

  const mutation = useMutation({
    mutationFn: initiateVerify,
    onSuccess: () => {
      refreshUser();
      toast.success('Account verified successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Verification failed'),
  });

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Verify Account" showBack />

      {/* ── MOBILE layout ─────────────────────────────────────────── */}
      <div className="lg:hidden max-w-md mx-auto px-4 py-4 space-y-5">
        {/* Benefits */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-ink">What you get</h2>
          {BENEFITS.map(({ icon: Icon, color, label, desc }) => (
            <div key={label} className="card flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-none">
                <Icon size={18} className={color} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              {isVerified && <CheckCircle2 size={16} className="text-primary flex-none mt-1" />}
            </div>
          ))}
        </div>

        {/* How it works */}
        {!isVerified && (
          <div className="card space-y-3">
            <h2 className="font-display font-semibold text-ink">How it works</h2>
            {[
              ['Top up your wallet', 'Add at least ₦1,000 to your SwapNaija wallet.'],
              ['Tap "Get Verified"', '₦1,000 is deducted instantly from your wallet balance.'],
              ['Badge added immediately', 'Your profile shows a verified badge right away.'],
            ].map(([title, desc], i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-none mt-0.5">{i + 1}</span>
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hero card */}
        <div className={`rounded-3xl p-6 text-white ${isVerified ? 'bg-gradient-to-br from-primary to-green-600' : 'bg-gradient-to-br from-primary to-primary/70'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">Identity Verification</h1>
              <p className="text-sm opacity-80">Build trust on SwapNaija</p>
            </div>
          </div>
          {isVerified ? (
            <div className="flex items-center gap-3 bg-white/20 rounded-2xl px-4 py-3">
              <CheckCircle2 size={20} />
              <div>
                <p className="font-semibold">You're verified!</p>
                <p className="text-xs opacity-80">
                  Since {user?.verifiedAt
                    ? new Date(user.verifiedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'recently'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-white/20 rounded-2xl px-4 py-3">
              <div>
                <p className="font-semibold">One-time fee</p>
                <p className="text-xs opacity-70">Deducted from your wallet</p>
              </div>
              <span className="text-2xl font-display font-bold">₦1,000</span>
            </div>
          )}
        </div>

        {/* Wallet balance check */}
        {!isVerified && (
          <div className={`rounded-2xl px-4 py-3 flex items-center justify-between ${canAfford ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
            <div className="flex items-center gap-2">
              <Wallet size={16} className={canAfford ? 'text-green-600' : 'text-red-500'} />
              <div>
                <p className={`text-sm font-semibold ${canAfford ? 'text-green-700' : 'text-red-700'}`}>
                  {canAfford ? 'Sufficient balance' : 'Insufficient balance'}
                </p>
                <p className="text-xs text-gray-500">
                  Wallet: ₦{(walletBalance / 100).toLocaleString()} · Needed: ₦1,000
                </p>
              </div>
            </div>
            {!canAfford && (
              <Link to="/wallet?returnTo=/verify-account">
                <Button size="sm" variant="primary">Top Up</Button>
              </Link>
            )}
          </div>
        )}

        {/* Lock disclaimer */}
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <Lock size={13} className="flex-none mt-0.5" />
          <p>This is a one-time fee deducted from your SwapNaija wallet. No card details are stored.</p>
        </div>

        {/* CTA */}
        {!isVerified ? (
          canAfford ? (
            <Button fullWidth size="lg" loading={mutation.isPending} onClick={() => mutation.mutate()}>
              <ShieldCheck size={18} />
              Get Verified — ₦1,000 from Wallet
            </Button>
          ) : (
            <Link to="/wallet?returnTo=/verify-account">
              <Button fullWidth size="lg" variant="secondary">
                <Wallet size={18} />
                Top Up Wallet First
              </Button>
            </Link>
          )
        ) : (
          <div className="flex items-center justify-center gap-2 py-4">
            <CheckCircle2 size={20} className="text-primary" />
            <span className="font-semibold text-primary">Account Verified</span>
          </div>
        )}
      </div>

      {/* ── DESKTOP layout ────────────────────────────────────────── */}
      <div className="hidden lg:block lg:max-w-5xl lg:mx-auto lg:px-8 lg:py-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">

          {/* LEFT column */}
          <div className="space-y-8">
            {/* Heading */}
            <div>
              <h1 className="text-4xl font-display font-bold text-ink mb-2">Get Verified</h1>
              <p className="text-gray-500 text-lg">Build trust and get discovered faster</p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-ink text-lg">What you get</h2>
              {BENEFITS.map(({ icon: Icon, color, label, desc }) => (
                <div key={label} className="card flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center flex-none">
                    <Icon size={22} className={color} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base text-ink">{label}</p>
                    <p className="text-sm text-gray-500 mt-1">{desc}</p>
                  </div>
                  {isVerified && <CheckCircle2 size={18} className="text-primary flex-none mt-1" />}
                </div>
              ))}
            </div>

            {/* How it works */}
            {!isVerified && (
              <div className="card space-y-4">
                <h2 className="font-display font-semibold text-ink text-lg">How it works</h2>
                {[
                  ['Top up your wallet', 'Add at least ₦1,000 to your SwapNaija wallet.'],
                  ['Click "Get Verified"', '₦1,000 is deducted instantly from your wallet balance.'],
                  ['Badge added immediately', 'Your profile shows a verified badge right away.'],
                ].map(([title, desc], i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-none mt-0.5">{i + 1}</span>
                    <div>
                      <p className="font-semibold text-sm text-ink">{title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT sticky column */}
          <div className="space-y-5 lg:sticky lg:top-8">

            {isVerified ? (
              /* Already verified — big success state */
              <div className="bg-gradient-to-br from-primary to-green-600 rounded-3xl lg:p-8 p-6 text-white text-center space-y-5">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck size={40} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl mb-1">You're Verified!</h2>
                  <p className="opacity-80">
                    Since {user?.verifiedAt
                      ? new Date(user.verifiedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'recently'}
                  </p>
                </div>
                <div className="bg-white/20 rounded-2xl px-5 py-4 flex items-center justify-center gap-3">
                  <CheckCircle2 size={22} />
                  <span className="font-semibold text-lg">Verified Account</span>
                </div>
                <p className="text-sm opacity-70">All benefits are active on your profile</p>
              </div>
            ) : (
              <>
                {/* Hero gradient card */}
                <div className="bg-gradient-to-br from-primary to-primary/70 rounded-3xl lg:p-8 p-6 text-white">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-2xl">Identity Verification</h2>
                      <p className="text-sm opacity-80">Build trust on SwapNaija</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white/20 rounded-2xl px-5 py-4">
                    <div>
                      <p className="font-semibold text-base">One-time fee</p>
                      <p className="text-sm opacity-70">Deducted from your wallet</p>
                    </div>
                    <span className="text-3xl font-display font-bold">₦1,000</span>
                  </div>
                </div>

                {/* Wallet balance check */}
                <div className={`rounded-2xl px-4 py-3.5 flex items-center justify-between ${canAfford ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                  <div className="flex items-center gap-2">
                    <Wallet size={17} className={canAfford ? 'text-green-600' : 'text-red-500'} />
                    <div>
                      <p className={`text-sm font-semibold ${canAfford ? 'text-green-700' : 'text-red-700'}`}>
                        {canAfford ? 'Sufficient balance' : 'Insufficient balance'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Wallet: ₦{(walletBalance / 100).toLocaleString()} · Needed: ₦1,000
                      </p>
                    </div>
                  </div>
                  {!canAfford && (
                    <Link to="/wallet?returnTo=/verify-account">
                      <Button size="sm" variant="primary">Top Up</Button>
                    </Link>
                  )}
                </div>

                {/* CTA */}
                {canAfford ? (
                  <Button fullWidth size="lg" loading={mutation.isPending} onClick={() => mutation.mutate()}>
                    <ShieldCheck size={18} />
                    Get Verified — ₦1,000 from Wallet
                  </Button>
                ) : (
                  <Link to="/wallet?returnTo=/verify-account">
                    <Button fullWidth size="lg" variant="secondary">
                      <Wallet size={18} />
                      Top Up Wallet First
                    </Button>
                  </Link>
                )}

                {/* Lock disclaimer */}
                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <Lock size={13} className="flex-none mt-0.5" />
                  <p>This is a one-time fee deducted from your SwapNaija wallet. No card details are stored.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
