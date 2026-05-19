import { Link } from 'react-router-dom';
import { ArrowRightLeft, MapPin, Package, Shield, Coins, Info, Truck, CheckCircle2 } from 'lucide-react';
import Avatar from '../../ui/Avatar';
import { resolveImageUrl, IMAGE_FALLBACK_SRC, getListingPlaceholder } from '../../../utils/placeholder';

const CONDITION_LABELS = { new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair', poor: 'Poor' };
const SWAP_TYPE_LABELS = {
  goods_for_goods:     'Goods ↔ Goods',
  goods_for_service:   'Goods ↔ Service',
  service_for_goods:   'Service ↔ Goods',
  service_for_service: 'Service ↔ Service',
};

const fmt  = (naira) => `₦${Number(naira || 0).toLocaleString()}`;
const kobo = (k)     => fmt(k / 100);

// ─── Single listing tile ──────────────────────────────────────────────────────
function ListingTile({ listing, label }) {
  const image = listing?.images?.[0]
    ? resolveImageUrl(listing.images[0])
    : getListingPlaceholder(listing || {});

  return (
    <div className="flex-1 min-w-0 space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>

      {listing ? (
        <>
          <Link to={`/listing/${listing.id}`} onClick={e => e.stopPropagation()} className="block">
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 hover:opacity-90 transition max-w-[120px]">
              <img
                src={image}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={e => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
              />
            </div>
          </Link>
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{listing.title}</p>
          {listing.estimatedValue && (
            <p className="text-sm font-bold text-primary">{fmt(listing.estimatedValue)}</p>
          )}
          {listing.condition && (
            <span className="inline-block text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
              {CONDITION_LABELS[listing.condition] || listing.condition}
            </span>
          )}
          {listing.locationState && (
            <p className="flex items-center gap-1 text-[11px] text-gray-400">
              <MapPin size={10} />{listing.locationState}
            </p>
          )}
          {listing.wantsTitle && (
            <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg leading-snug">
              <span className="font-semibold">Wants:</span> {listing.wantsTitle}
            </p>
          )}
        </>
      ) : (
        <div className="w-[120px] aspect-square rounded-xl bg-gray-100 flex items-center justify-center border border-dashed border-gray-200">
          <Package size={20} className="text-gray-300" />
        </div>
      )}
    </div>
  );
}

// ─── Term row helper ──────────────────────────────────────────────────────────
function TermRow({ icon: Icon, label, value, valueClass = 'text-gray-800', sublabel }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Icon size={13} className="text-gray-400 flex-none mt-0.5" />
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          {sublabel && <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>}
        </div>
      </div>
      <p className={`text-xs font-semibold whitespace-nowrap ${valueClass}`}>{value}</p>
    </div>
  );
}

// ─── Main SwapCard ────────────────────────────────────────────────────────────
function SwapCard({ swap, currentUserId }) {
  const isInitiator  = swap.initiatorId?.id === currentUserId;
  const myListing    = isInitiator ? swap.initiatorListing : swap.receiverListing;
  const theirListing = isInitiator ? swap.receiverListing  : swap.initiatorListing;

  // ── Financial calculations ──
  const myValue    = (isInitiator ? swap.initiatorListing?.estimatedValue : swap.receiverListing?.estimatedValue)  || 0;
  const theirValue = (isInitiator ? swap.receiverListing?.estimatedValue  : swap.initiatorListing?.estimatedValue) || 0;
  const valueDiff  = Math.abs(myValue - theirValue);
  const higherSide = myValue > theirValue ? 'you' : theirValue > myValue ? 'them' : 'equal';

  const depositKobo      = swap.escrowDepositKobo || 0;
  const platformFeeKobo  = Math.round(depositKobo * 0.02);
  const refundKobo       = depositKobo - platformFeeKobo;
  const collateralPct    = swap.collateralPercent || 10;

  const hasTopUp         = swap.topUpAmountKobo > 0 && swap.topUpPayerRole !== 'none';
  const iTopUpPayer      = swap.topUpPayerRole === (isInitiator ? 'initiator' : 'receiver');
  const topUpLabel       = iTopUpPayer ? 'You pay top-up' : `${(isInitiator ? swap.receiverId : swap.initiatorId)?.fullName?.split(' ')[0] || 'They'} pays top-up`;

  return (
    <div className="space-y-4">

      {/* ── Parties ── */}
      <div className="flex items-center gap-2">
        <Avatar src={swap.initiatorId?.avatarUrl} name={swap.initiatorId?.fullName} size="xs" />
        <span className="text-xs text-gray-600 font-medium">{swap.initiatorId?.fullName?.split(' ')[0]}</span>
        <ArrowRightLeft size={12} className="text-gray-300 flex-none" />
        <Avatar src={swap.receiverId?.avatarUrl} name={swap.receiverId?.fullName} size="xs" />
        <span className="text-xs text-gray-600 font-medium">{swap.receiverId?.fullName?.split(' ')[0]}</span>
        {swap.swapType && (
          <span className="ml-auto text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {SWAP_TYPE_LABELS[swap.swapType] || swap.swapType}
          </span>
        )}
      </div>

      {/* ── Listings ── */}
      <div className="flex items-start gap-3">
        <ListingTile listing={myListing}    label="You offer" />
        <div className="flex-none flex flex-col items-center pt-10 gap-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowRightLeft size={14} className="text-primary" />
          </div>
          {valueDiff > 0 && (
            <span className="text-[10px] text-gray-400 font-medium">
              {fmt(valueDiff)} gap
            </span>
          )}
        </div>
        <ListingTile listing={theirListing} label="They offer" />
      </div>

      {/* ── Value comparison ── */}
      {(myValue > 0 || theirValue > 0) && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Value Comparison</p>
          <div className="flex gap-2">
            <div className="flex-1 text-center bg-white rounded-lg p-2 border border-gray-100">
              <p className="text-[11px] text-gray-400 mb-0.5">Your item</p>
              <p className="text-sm font-bold text-gray-900">{fmt(myValue)}</p>
            </div>
            <div className="flex-1 text-center bg-white rounded-lg p-2 border border-gray-100">
              <p className="text-[11px] text-gray-400 mb-0.5">Their item</p>
              <p className="text-sm font-bold text-gray-900">{fmt(theirValue)}</p>
            </div>
          </div>
          {higherSide !== 'equal' && valueDiff > 0 && (
            <p className="text-[11px] text-gray-500 text-center">
              {higherSide === 'you' ? 'Your item is worth more' : 'Their item is worth more'} by{' '}
              <span className="font-semibold text-gray-700">{fmt(valueDiff)}</span>
            </p>
          )}
        </div>
      )}

      {/* ── Value gap top-up ── */}
      {hasTopUp && (
        <div className={`rounded-xl p-3 space-y-1.5 border ${iTopUpPayer ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-100'}`}>
          <div className="flex items-center gap-2">
            <Coins size={13} className={iTopUpPayer ? 'text-amber-600' : 'text-blue-500'} />
            <p className={`text-xs font-semibold ${iTopUpPayer ? 'text-amber-800' : 'text-blue-700'}`}>
              Value Gap Top-Up
            </p>
          </div>
          <p className={`text-xs ${iTopUpPayer ? 'text-amber-700' : 'text-blue-600'}`}>
            <span className="font-semibold">{topUpLabel}</span> — {kobo(swap.topUpAmountKobo)}
          </p>
          <p className={`text-[11px] ${iTopUpPayer ? 'text-amber-600' : 'text-blue-500'}`}>
            Held in escrow and released to the other party on swap completion.
          </p>
          {swap.topUpPaid && (
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle2 size={12} className="text-green-600" />
              <p className="text-[11px] text-green-700 font-medium">Top-up already paid</p>
            </div>
          )}
        </div>
      )}

      {/* ── Escrow protection terms ── */}
      {depositKobo > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <Shield size={13} className="text-green-600" />
            <p className="text-xs font-semibold text-green-800">Escrow Protection Terms</p>
          </div>
          <div className="space-y-2 divide-y divide-green-100">
            <TermRow
              icon={Shield}
              label="Collateral rate"
              sublabel="% of highest item value"
              value={`${collateralPct}%`}
              valueClass="text-green-700"
            />
            <div className="pt-2">
              <TermRow
                icon={Coins}
                label="Deposit per party"
                sublabel="Held in escrow until swap completes"
                value={kobo(depositKobo)}
                valueClass="text-green-700"
              />
            </div>
            <div className="pt-2">
              <TermRow
                icon={CheckCircle2}
                label="Refund on completion"
                sublabel="Returned to your wallet"
                value={kobo(refundKobo)}
                valueClass="text-green-700"
              />
            </div>
            <div className="pt-2">
              <TermRow
                icon={Info}
                label="Platform fee"
                sublabel="SwapNaija protection fee (2%)"
                value={kobo(platformFeeKobo)}
                valueClass="text-gray-500"
              />
            </div>
          </div>
          {swap.agreedValue > 0 && (
            <div className="pt-1 border-t border-green-100">
              <TermRow
                icon={Coins}
                label="Agreed swap value"
                value={fmt(swap.agreedValue)}
                valueClass="text-green-700"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Delivery instructions ── */}
      {swap.deliveryInstructions && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 flex gap-2">
          <Truck size={13} className="text-gray-400 flex-none mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Delivery instructions</p>
            <p className="text-xs text-gray-700">{swap.deliveryInstructions}</p>
          </div>
        </div>
      )}

      {/* ── Proposal note ── */}
      {swap.proposalNote && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Proposal note</p>
          <p className="text-sm text-gray-700 italic leading-relaxed">"{swap.proposalNote}"</p>
        </div>
      )}

    </div>
  );
}

export default SwapCard;
