import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImagePlus, X, Star, ChevronDown } from 'lucide-react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { getCategories } from '../../../api/categories.api';

const MAX_IMAGES = 8;

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

const schema = z.object({
  title:              z.string().min(3, 'Title must be at least 3 characters').max(200),
  description:        z.string().min(10, 'Description must be at least 10 characters'),
  categoryId:         z.string().optional(),
  listingType:        z.enum(['goods', 'services', 'both']),
  condition:          z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
  estimatedValue:     z.coerce.number().min(0, 'Must be 0 or more').optional(),
  minSwapValue:       z.coerce.number().min(0).optional(),
  wantsTitle:         z.string().max(200).optional(),
  wantsCategoryId:    z.string().optional(),
  wantsDescription:   z.string().optional(),
  wantsValueMin:      z.coerce.number().min(0).optional(),
  wantsValueMax:      z.coerce.number().min(0).optional(),
  locationState:      z.string().optional(),
  locationLga:        z.string().optional(),
  locationArea:       z.string().optional(),
});

const SelectField = ({ label, error, children, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-ink">{label}</label>}
    <div className="relative">
      <select
        className={`input-field appearance-none pr-9 ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

function ListingForm({ onSubmit, loading, defaultValues }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { listingType: 'goods', ...defaultValues },
  });

  const listingType = watch('listingType');
  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });

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
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

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

      {/* ── Photos ── */}
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
          {images.map((img, i) => (
            <div key={img.preview} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group">
              <img src={img.preview} alt={`preview-${i}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                  <Star size={8} fill="currentColor" />
                  Cover
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100"
              >
                <X size={11} />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition
                ${images.length === 0
                  ? 'col-span-2 row-span-2 border-gray-200 hover:border-primary hover:bg-primary/5'
                  : 'border-gray-200 hover:border-primary hover:bg-primary/5'
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
        <p className="text-xs text-gray-400 mt-2">First photo is the cover · JPG, PNG or WebP · Max 5 MB each</p>
      </div>

      {/* ── What are you listing? ── */}
      <SelectField label="What are you listing?" {...register('listingType')}>
        <option value="goods">Physical Item (Goods)</option>
        <option value="services">Service / Skill</option>
        <option value="both">Both Item & Service</option>
      </SelectField>

      {/* ── Category ── */}
      <SelectField
        label="Category"
        error={errors.categoryId?.message}
        {...register('categoryId')}
      >
        <option value="">Select a category</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.icon ? `${cat.icon} ` : ''}{cat.name}</option>
        ))}
      </SelectField>

      {/* ── Title ── */}
      <Input
        label="Title"
        placeholder="e.g. Samsung Galaxy S21 Ultra"
        error={errors.title?.message}
        {...register('title')}
      />

      {/* ── Description ── */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-ink">Description</label>
        <textarea
          {...register('description')}
          placeholder="Describe your item or service — brand, size, specs, any defects..."
          rows={4}
          className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
      </div>

      {/* ── Condition (goods only) ── */}
      {listingType !== 'services' && (
        <SelectField
          label="Condition"
          error={errors.condition?.message}
          {...register('condition')}
        >
          <option value="">Select condition</option>
          <option value="new">New</option>
          <option value="like_new">Like New</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </SelectField>
      )}

      {/* ── Value ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-ink">Estimated Value</label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-500 text-sm font-medium select-none">₦</span>
            <input
              type="number"
              min="0"
              placeholder="50000"
              className={`input-field pl-8 ${errors.estimatedValue ? 'border-red-400' : ''}`}
              {...register('estimatedValue')}
            />
          </div>
          {errors.estimatedValue && <p className="text-xs text-red-500">{errors.estimatedValue.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-ink">Min. Swap Value</label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-500 text-sm font-medium select-none">₦</span>
            <input
              type="number"
              min="0"
              placeholder="Any"
              className="input-field pl-8"
              {...register('minSwapValue')}
            />
          </div>
          <p className="text-xs text-gray-400">Min value a swapper's item must have</p>
        </div>
      </div>

      {/* ── Location ── */}
      <div>
        <p className="text-sm font-semibold text-ink mb-2">Your Location</p>
        <div className="space-y-3">
          <SelectField
            label="State"
            error={errors.locationState?.message}
            {...register('locationState')}
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="LGA"
              placeholder="e.g. Ikeja"
              error={errors.locationLga?.message}
              {...register('locationLga')}
            />
            <Input
              label="Area / Neighbourhood"
              placeholder="e.g. Allen Ave"
              error={errors.locationArea?.message}
              {...register('locationArea')}
            />
          </div>
        </div>
      </div>

      {/* ── What do you want in return? ── */}
      <div className="border-t pt-5">
        <p className="text-sm font-semibold text-ink mb-3">What do you want in return?</p>
        <div className="space-y-3">
          <Input
            label="What you're looking for"
            placeholder="e.g. iPhone 13, MacBook Pro, Tailoring services..."
            {...register('wantsTitle')}
          />

          <SelectField
            label="Preferred category (optional)"
            {...register('wantsCategoryId')}
          >
            <option value="">Any category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon ? `${cat.icon} ` : ''}{cat.name}</option>
            ))}
          </SelectField>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-ink">More details (optional)</label>
            <textarea
              {...register('wantsDescription')}
              placeholder="Any specific requirements, brand preference, condition..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-ink">Min value (₦)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-500 text-sm font-medium select-none">₦</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="input-field pl-8"
                  {...register('wantsValueMin')}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-ink">Max value (₦)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-500 text-sm font-medium select-none">₦</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Any"
                  className="input-field pl-8"
                  {...register('wantsValueMax')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delivery notice ── */}
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
        <span>🚚</span>
        <span>All swaps are delivered — you'll add shipment details after a swap is accepted.</span>
      </div>

      <Button type="submit" fullWidth loading={loading}>
        {defaultValues ? 'Update Listing' : 'Post Listing'}
      </Button>

    </form>
  );
}

export default ListingForm;
