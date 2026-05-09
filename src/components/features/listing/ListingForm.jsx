import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

const schema = z.object({
  title: z.string().min(3, 'Title too short').max(200),
  description: z.string().min(10, 'Description too short'),
  listingType: z.enum(['goods', 'services', 'both']),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
  estimatedValue: z.coerce.number().min(0).optional(),
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1">What are you listing?</label>
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
        <label className="block text-sm font-medium text-ink mb-1">Description</label>
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
          <label className="block text-sm font-medium text-ink mb-1">Condition</label>
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
        label="Estimated Value (₦)"
        type="number"
        placeholder="e.g. 50000"
        prefix="₦"
        error={errors.estimatedValue?.message}
        {...register('estimatedValue')}
      />

      <div className="border-t pt-4">
        <h3 className="font-semibold text-sm mb-3 text-gray-600">What do you want in return?</h3>
        <Input
          label="Looking for"
          placeholder="e.g. iPhone 13 or similar"
          {...register('wantsTitle')}
        />
        <div className="mt-3">
          <label className="block text-sm font-medium text-ink mb-1">More details (optional)</label>
          <textarea
            {...register('wantsDescription')}
            placeholder="Describe what you're looking to receive..."
            rows={2}
            className="input-field resize-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">State</label>
        <Input placeholder="e.g. Lagos" {...register('locationState')} />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">LGA / Area</label>
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
