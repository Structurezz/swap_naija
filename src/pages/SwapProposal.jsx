import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useListing } from '../hooks/useListings';
import { useAuthStore } from '../store/auth.store';
import TopBar from '../components/layout/TopBar';
import SwapProposalComp from '../components/features/swap/SwapProposal';
import Spinner from '../components/ui/Spinner';

export default function SwapProposalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: listing, isLoading } = useListing(id);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!listing) return <div className="text-center py-20">Listing not found</div>;

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Propose Swap" showBack />
      <div className="max-w-md lg:max-w-3xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
        {/* Desktop back link */}
        <div
          onClick={() => navigate(-1)}
          className="hidden lg:flex items-center gap-2 text-sm text-gray-400 mb-4 cursor-pointer hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </div>

        {/* Desktop page heading */}
        <h1 className="hidden lg:block text-2xl font-display font-bold text-ink mb-6">Propose a Swap</h1>

        <SwapProposalComp listing={listing} currentUserId={user?.id} />
      </div>
    </div>
  );
}
