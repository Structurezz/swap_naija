import { useNavigate } from 'react-router-dom';
import { useCreateListing } from '../hooks/useListings';
import TopBar from '../components/layout/TopBar';
import ListingForm from '../components/features/listing/ListingForm';
import { Camera, DollarSign, ArrowLeftRight, Tag, CheckCircle } from 'lucide-react';

const TIPS = [
  { icon: Camera, text: 'Add clear photos (up to 5) from multiple angles' },
  { icon: DollarSign, text: 'Set a fair estimated value to attract serious swappers' },
  { icon: ArrowLeftRight, text: 'Write clearly what you\'re looking to swap for' },
  { icon: Tag, text: 'Be specific about the item\'s condition (new, used, etc.)' },
];

const HOW_STEPS = [
  { step: '1', title: 'Post your listing', desc: 'Describe what you have and what you want.' },
  { step: '2', title: 'Get matched', desc: 'Browse offers or let SwapNaija suggest swaps.' },
  { step: '3', title: 'Swap & done', desc: 'Agree on a deal and complete the exchange safely.' },
];

export default function CreateListing() {
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateListing();

  const handleSubmit = (data) => {
    mutate(data, {
      onSuccess: (listing) => navigate(`/listing/${listing.id}`),
    });
  };

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Create Listing" showBack />
      <div className="max-w-md lg:max-w-5xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
        {/* Desktop page heading */}
        <div className="hidden lg:flex items-center gap-3 mb-6 pt-6 px-0">
          <h1 className="text-2xl font-display font-bold text-ink">New Listing</h1>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 lg:items-start">
          {/* Form */}
          <div>
            <ListingForm onSubmit={handleSubmit} loading={isPending} />
          </div>

          {/* Desktop right panel */}
          <div className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-6">
            {/* Tips card */}
            <div className="bg-primary/5 rounded-2xl shadow-card p-5 border border-primary/10">
              <h3 className="font-display font-bold text-base text-ink mb-4">Tips for a great listing</h3>
              <ul className="space-y-3">
                {TIPS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center flex-none mt-0.5">
                      <Icon size={15} className="text-primary" />
                    </div>
                    <p className="text-sm text-gray-600 leading-snug">{text}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* How swapping works card */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-display font-bold text-base text-ink mb-4">How swapping works</h3>
              <ol className="space-y-3">
                {HOW_STEPS.map(({ step, title, desc }) => (
                  <li key={step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-none mt-0.5">
                      <span className="text-white text-xs font-bold">{step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
