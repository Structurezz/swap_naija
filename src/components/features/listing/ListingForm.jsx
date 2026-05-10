import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState, useEffect } from 'react';
import { ImagePlus, X, Star } from 'lucide-react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

const MAX_IMAGES = 8;

const schema = z.object({
  title: z.string().min(3, 'Title too short').max(200),
  description: z.string().min(10, 'Description too short'),
  listingType: z.enum(['goods', 'services', 'both']),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
  estimatedValue: z.coerce.number().min(0).optional(),
  minSwapValue: z.coerce.number().min(0).optional(),
  wantsTitle: z.string().optional(),
  wantsDescription: z.string().optional(),
  locationState: z.string().optional(),
  locationLga: z.string().optional(),
  meetupOption: z.boolean().default(true),
  deliveryOption: z.boolean().default(false),
});

function ListingForm({ onSubmit, loading, defaultValues }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      listingType: 'goods',
      meetupOption: true,
      deliveryOption: false,
      ...defaultValues,
    },
  });

  const listingType = watch('listingType');
  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]); // [{ file: File, preview: string }]

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => images.forEach(img => URL.revokeObjectURL(img.preview));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    const toAdd = files.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...toAdd]);
    e.target.value = ''; // allow re-selecting the same file
  };

  const removeImage = (index) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Drag-and-drop
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const remaining = MAX_IMAGES - images.length;
    if (!files.length || remaining <= 0) return;
    const toAdd = files.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...toAdd]);
  };

  const handleFormSubmit = (data) => {
    onSubmit(data, images.map(img => img.file));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">

      {/* ── Image Upload ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-ink">Photos</label>
          <span className={`text-xs font-medium ${images.length >= MAX_IMAGES ? 'text-primary' : 'text-gray-400'}`}>
            {images.length}/{MAX_IMAGES}
          </span>
        </div>

        <div
          className="grid grid-cols-4 gap-2"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          {/* Filled slots */}
          {images.map((img, i) => (
            <div key={img.preview} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group">
              <img
                src={img.preview}
                alt={`preview-${i}`}
                className="w-full h-full object-cover"
              />
              {/* Cover badge */}
              {i === 0 && (
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                  <Star size={8} fill="currentColor" />
                  Cover
                </div>
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100"
              >
                <X size={11} />
              </button>
            </div>
          ))}

          {/* Add slot */}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition
                ${images.length === 0
                  ? 'col-span-2 row-span-2 border-gray-200 hover:border-primary hover:bg-primary/3'
                  : 'border-gray-200 hover:border-primary hover:bg-primary/3'
                }`}
            >
              <ImagePlus size={images.length === 0 ? 28 : 20} className="text-gray-300" />
              {images.length === 0 && (
                <>
                  <p className="text-sm font-medium text-gray-400">Add photos</p>
                  <p className="text-xs text-gray-300">Up to 8 · 5 MB each</p>
                </>
              )}
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />

        <p className="text-xs text-gray-400 mt-2">
          First photo is the cover · JPG, PNG or WebP · Max 5 MB each
        </p>
      </div>

      {/* ── Listing type ── */}
      <div>
        <label className="block text-sm font-semibold text-ink mb-1">What are you listing?</label>
        <select {...register('listingType')} className="input-field">
          <option value="goods">Physical Item (Goods)</option>
          <option value="services">Service / Skill</option>
          <option value="both">Both Item & Service</option>
        </select>
      </div>

      <Input
        label="Title"
        placeholder="e.g. Samsung Galaxy S21"
        error={errors.title?.message}
        {...register('title')}
      />

      <div>
        <label className="block text-sm font-semibold text-ink mb-1">Description</label>
        <textarea
          {...register('description')}
          placeholder="Describe your item or service in detail..."
          rows={4}
          className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
      </div>

      {listingType !== 'services' && (
        <div>
          <label className="block text-sm font-semibold text-ink mb-1">Condition</label>
          <select {...register('condition')} className="input-field">
            <option value="">Select condition</option>
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      )}

      <Input
        label="Estimated Value (BC)"
        type="number"
        placeholder="e.g. 50000"
        prefix="BC"
        error={errors.estimatedValue?.message}
        {...register('estimatedValue')}
      />

      <div>
        <Input
          label="Minimum Swap Value (BC)"
          type="number"
          placeholder="Leave blank — no restriction"
          prefix="BC"
          error={errors.minSwapValue?.message}
          {...register('minSwapValue')}
        />
        <p className="text-xs text-gray-400 mt-1">Only proposers whose item is worth at least this much can swap with you</p>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-sm mb-3 text-gray-600">What do you want in return?</h3>
        <Input
          label="Looking for"
          placeholder="e.g. iPhone 13 or similar"
          {...register('wantsTitle')}
        />
        <div className="mt-3">
          <label className="block text-sm font-semibold text-ink mb-1">More details (optional)</label>
          <textarea
            {...register('wantsDescription')}
            placeholder="Describe what you're looking to receive..."
            rows={2}
            className="input-field resize-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink mb-1">State</label>
        <Input placeholder="e.g. Lagos" {...register('locationState')} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink mb-1">LGA / Area</label>
        <Input placeholder="e.g. Ikeja" {...register('locationLga')} />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('meetupOption')} className="rounded" />
          Meetup OK
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('deliveryOption')} className="rounded" />
          Delivery OK
        </label>
      </div>

      <Button type="submit" fullWidth loading={loading}>
        {defaultValues ? 'Update Listing' : 'Create Listing'}
      </Button>
    </form>
  );
}

export default ListingForm;
