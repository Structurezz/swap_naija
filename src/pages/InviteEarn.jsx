import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Gift, Copy, CheckCheck, Share2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyReferrals, applyReferral } from '../api/users.api';
import { useAuthStore } from '../store/auth.store';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';

export default function InviteEarn() {
  const { user } = useAuthStore();
  const [copied, setCopied]       = useState(false);
  const [code, setCode]           = useState('');
  const [applyDone, setApplyDone] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-referrals'],
    queryFn: getMyReferrals,
  });

  const applyMutation = useMutation({
    mutationFn: () => applyReferral(code.trim()),
    onSuccess: (res) => {
      toast.success(res.message || 'Referral applied!');
      setApplyDone(true);
      refetch();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Invalid code'),
  });

  const referralCode = data?.referralCode || '—';
  const referralLink = `${window.location.origin}/onboarding?ref=${referralCode}`;
  const alreadyReferred = !!user?.referredBy;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareWhatsApp = () => {
    const text = `Join me on SwapNaija — Nigeria's best barter marketplace! Use my invite code *${referralCode}* and we both earn ₦200 swap credits. Sign up here: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  /* ── Shared sub-components ──────────────────────────────────────── */

  const HeroBanner = ({ large }) => (
    <div className={`bg-gradient-to-br from-purple-600 to-indigo-600 text-white ${large ? 'lg:rounded-3xl lg:p-10 rounded-3xl p-6' : 'rounded-3xl p-6'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`bg-white/20 rounded-2xl flex items-center justify-center ${large ? 'w-16 h-16' : 'w-12 h-12'}`}>
          <Gift size={large ? 30 : 24} />
        </div>
        <div>
          <h1 className={`font-display font-bold ${large ? 'text-3xl' : 'text-xl'}`}>Invite &amp; Earn</h1>
          <p className={`opacity-80 ${large ? 'text-base mt-1' : 'text-sm'}`}>Share SwapNaija, earn swap credits</p>
        </div>
      </div>
      <div className={`grid grid-cols-2 gap-3 ${large ? 'lg:grid-cols-2' : ''}`}>
        <div className="bg-white/15 rounded-2xl p-3 text-center">
          <p className={`opacity-70 ${large ? 'text-sm' : 'text-xs'}`}>You earn per invite</p>
          <p className={`font-display font-bold ${large ? 'text-3xl' : 'text-xl'}`}>₦200</p>
        </div>
        <div className="bg-white/15 rounded-2xl p-3 text-center">
          <p className={`opacity-70 ${large ? 'text-sm' : 'text-xs'}`}>Your friend earns</p>
          <p className={`font-display font-bold ${large ? 'text-3xl' : 'text-xl'}`}>₦200</p>
        </div>
      </div>
    </div>
  );

  const StatsRow = () => (
    isLoading ? (
      <div className="flex justify-center py-6"><Spinner /></div>
    ) : (
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-display font-bold text-primary">{data?.referralCount || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Friends invited</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-display font-bold text-purple-600">₦{((data?.swapCredits || 0)).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Swap credits</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-display font-bold text-amber-500">
            {(data?.referralCount || 0) * 200 > 0 ? `₦${((data.referralCount) * 200).toLocaleString()}` : '₦0'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Total earned</p>
        </div>
      </div>
    )
  );

  const ReferralCodeCard = () => (
    <div className="card space-y-3">
      <h2 className="font-display font-semibold">Your Referral Code</h2>
      <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border border-dashed border-gray-300">
        <span className="flex-1 font-mono text-xl font-bold text-ink tracking-widest">
          {referralCode}
        </span>
        <button
          onClick={copyCode}
          className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition"
        >
          {copied ? <CheckCheck size={18} /> : <Copy size={18} />}
        </button>
      </div>
      <Button fullWidth variant="secondary" onClick={shareWhatsApp}>
        <Share2 size={16} />
        Share via WhatsApp
      </Button>
    </div>
  );

  const ApplyCodeCard = () => (
    <>
      {!alreadyReferred && !applyDone && (
        <div className="card space-y-3">
          <h2 className="font-display font-semibold">Have a friend's code?</h2>
          <p className="text-sm text-gray-500">Enter it below to earn ₦200 swap credits for both of you.</p>
          <Input
            placeholder="e.g. AB12CD34"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <Button
            fullWidth
            loading={applyMutation.isPending}
            disabled={!code || code.length < 6}
            onClick={() => applyMutation.mutate()}
          >
            Apply Code
          </Button>
        </div>
      )}
      {(alreadyReferred || applyDone) && (
        <div className="card bg-green-50 border border-green-100 flex items-center gap-3">
          <CheckCheck size={20} className="text-green-600 flex-none" />
          <p className="text-sm text-green-700 font-medium">You've already redeemed a referral code — ₦200 credits added!</p>
        </div>
      )}
    </>
  );

  const HowItWorksCard = () => (
    <div className="card space-y-3">
      <h2 className="font-display font-semibold">How it works</h2>
      {[
        ['Share your code with friends', 'Copy your code or share the WhatsApp link.'],
        ['They sign up on SwapNaija', 'They enter your code during or after registration.'],
        ['Both of you get ₦200 credits', 'Credits are added instantly to both accounts.'],
        ['Use credits on future features', 'Swap credits unlock escrow discounts, boosts and more.'],
      ].map(([title, desc], i) => (
        <div key={i} className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center flex-none mt-0.5">{i + 1}</span>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const ReferralsList = () => (
    data?.referrals?.length > 0 ? (
      <section className="space-y-2">
        <h2 className="font-display font-semibold flex items-center gap-2">
          <Users size={16} /> People you invited
        </h2>
        {data.referrals.map(r => (
          <div key={r.id} className="card flex items-center justify-between py-2.5">
            <p className="font-medium text-sm">{r.name}</p>
            <div className="text-right">
              <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(r.joinedAt), { addSuffix: true })}</p>
              <p className="text-xs text-green-600 font-medium">+₦200</p>
            </div>
          </div>
        ))}
      </section>
    ) : null
  );

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Invite & Earn" showBack />

      {/* ── MOBILE layout ─────────────────────────────────────────── */}
      <div className="lg:hidden max-w-md mx-auto px-4 py-4 space-y-5">
        <HeroBanner />
        <StatsRow />
        <ReferralCodeCard />
        <ApplyCodeCard />
        <HowItWorksCard />
        <ReferralsList />
      </div>

      {/* ── DESKTOP layout ────────────────────────────────────────── */}
      <div className="hidden lg:block lg:max-w-5xl lg:mx-auto lg:px-8 lg:py-10">
        {/* Full-width hero */}
        <HeroBanner large />

        {/* Two-column grid below */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:mt-8">

          {/* LEFT: stats + referral code + apply code */}
          <div className="space-y-5">
            <StatsRow />
            <ReferralCodeCard />
            <ApplyCodeCard />
          </div>

          {/* RIGHT: how it works + referrals list */}
          <div className="space-y-5">
            <HowItWorksCard />
            <ReferralsList />
          </div>
        </div>
      </div>
    </div>
  );
}
