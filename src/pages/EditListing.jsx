import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useListing, useUpdateListing } from '../hooks/useListings';
import { uploadListingImages, deleteListing } from '../api/listings.api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import TopBar from '../components/layout/TopBar';
import ListingForm from '../components/features/listing/ListingForm';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Trash2 } from 'lucide-react';

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: listing, isLoading } = useListing(id);
  const { mutateAsync, isPending } = useUpdateListing();
  const [uploading, setUploading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (data, images) => {
    try {
      await mutateAsync({ id, data });
      if (images.length > 0) {
        setUploading(true);
        const formData = new FormData();
        images.forEach(file => formData.append('images', file));
        await uploadListingImages(id, formData);
        setUploading(false);
      }
      navigate(`/listing/${id}`);
    } catch {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteListing(id);
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['public-profile'] });
      toast.success('Listing deleted');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete listing');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!listing) return <div className="text-center py-20">Listing not found</div>;

  const defaultValues = {
    title:              listing.title,
    description:        listing.description,
    categoryId:         listing.categoryId?.id || listing.categoryId || '',
    listingType:        listing.listingType || 'goods',
    condition:          listing.condition || '',
    estimatedValue:     listing.estimatedValue || '',
    minSwapValue:       listing.minSwapValue || '',
    wantsTitle:         listing.wantsTitle || '',
    wantsCategoryId:    listing.wantsCategoryId?.id || listing.wantsCategoryId || '',
    wantsDescription:   listing.wantsDescription || '',
    wantsValueMin:      listing.wantsValueMin || '',
    wantsValueMax:      listing.wantsValueMax || '',
    locationState:      listing.locationState || '',
    locationLga:        listing.locationLga || '',
    locationArea:       listing.locationArea || '',
  };

  return (
    <div className="bg-bg min-h-screen">
      <TopBar
        title="Edit Listing"
        showBack
        rightAction={
          <button
            onClick={() => setShowDelete(true)}
            className="p-2 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 transition"
          >
            <Trash2 size={20} />
          </button>
        }
      />

      <div className="max-w-md lg:max-w-2xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
        <ListingForm
          onSubmit={handleSubmit}
          loading={isPending || uploading}
          defaultValues={defaultValues}
        />
      </div>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Listing">
        <div className="space-y-4">
          <div className="bg-red-50 rounded-xl p-3 text-sm text-red-600">
            This will permanently delete <span className="font-semibold">"{listing.title}"</span> and all its data. This cannot be undone.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" fullWidth onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>
              Delete Listing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
