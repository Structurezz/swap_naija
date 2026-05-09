import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';
import { updateMe } from '../api/users.api';
import { useAuthStore } from '../store/auth.store';
import TopBar from '../components/layout/TopBar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

const schema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  username: z.string().min(3).max(60).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only').optional().or(z.literal('')),
  bio: z.string().max(500).optional(),
  locationState: z.string().optional(),
  locationLga: z.string().optional(),
  locationArea: z.string().optional(),
});

const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

export default function EditProfile() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName || '',
      username: user?.username || '',
      bio: user?.bio || '',
      locationState: user?.locationState || '',
      locationLga: user?.locationLga || '',
      locationArea: user?.locationArea || '',
    },
  });

  useEffect(() => {
    if (user) reset({
      fullName: user.fullName || '',
      username: user.username || '',
      bio: user.bio || '',
      locationState: user.locationState || '',
      locationLga: user.locationLga || '',
      locationArea: user.locationArea || '',
    });
  }, [user, reset]);

  // Watch values for live preview on desktop
  const watched = useWatch({ control });

  const previewName = watched.fullName || user?.fullName || 'Your Name';
  const previewUsername = watched.username || user?.username || '';
  const previewBio = watched.bio || user?.bio || '';
  const previewState = watched.locationState || user?.locationState || '';
  const previewLga = watched.locationLga || user?.locationLga || '';
  const previewArea = watched.locationArea || user?.locationArea || '';
  const locationParts = [previewArea, previewLga, previewState].filter(Boolean);

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated) => {
      updateUser(updated);
      qc.invalidateQueries({ queryKey: ['public-profile', user?.id] });
      toast.success('Profile updated!');
      navigate('/profile');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Update failed'),
  });

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Edit Profile" showBack />
      <div className="max-w-md lg:max-w-4xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
        {/* Desktop page heading */}
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-display font-bold text-ink">Edit Profile</h1>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-8 lg:items-start">
          {/* Form */}
          <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
            <Input label="Full Name" error={errors.fullName?.message} {...register('fullName')} />
            <Input label="Username" prefix="@" placeholder="yourhandle" error={errors.username?.message} {...register('username')} />

            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                {...register('bio')}
                rows={3}
                placeholder="Tell others about yourself..."
                className="input-field resize-none"
              />
              {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <select {...register('locationState')} className="input-field">
                <option value="">Select state</option>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <Input label="LGA" placeholder="e.g. Ikeja" {...register('locationLga')} />
            <Input label="Area / Neighbourhood" placeholder="e.g. Allen Avenue" {...register('locationArea')} />

            <Button type="submit" fullWidth loading={mutation.isPending}>Save Changes</Button>
          </form>

          {/* Desktop right panel — live preview */}
          <div className="hidden lg:block lg:sticky lg:top-6">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Preview</p>
              <div className="flex flex-col items-center text-center gap-3">
                <Avatar src={user?.avatarUrl} name={previewName} size="lg" />
                <div>
                  <p className="font-display font-bold text-lg text-ink leading-tight">{previewName}</p>
                  {previewUsername && (
                    <p className="text-sm text-primary mt-0.5">@{previewUsername}</p>
                  )}
                </div>
                {previewBio && (
                  <p className="text-sm text-gray-600 leading-snug text-center">{previewBio}</p>
                )}
                {locationParts.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin size={12} className="flex-none" />
                    <span>{locationParts.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
