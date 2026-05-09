import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import TopBar from '../components/layout/TopBar';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function ChangePassword() {
  const { changePasswordAsync, isChangingPassword } = useAuth();
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew]   = useState(false);

  const setField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (form.newPassword !== form.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    try {
      await changePasswordAsync({ currentPassword: form.currentPassword, newPassword: form.newPassword });
    } catch {}
  };

  return (
    <div className="bg-bg min-h-screen">
      <TopBar title="Change Password" showBack />
      <div className="max-w-sm lg:max-w-md mx-auto px-6 py-6 space-y-5">
        <div className="relative">
          <Input label="Current Password" type={showCurr ? 'text' : 'password'}
            value={form.currentPassword} onChange={setField('currentPassword')}
            placeholder="Enter current password" />
          <button type="button" onClick={() => setShowCurr(v => !v)}
            className="absolute right-3 top-9 text-gray-400">
            {showCurr ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="relative">
          <Input label="New Password" type={showNew ? 'text' : 'password'}
            value={form.newPassword} onChange={setField('newPassword')}
            placeholder="Min. 8 characters" />
          <button type="button" onClick={() => setShowNew(v => !v)}
            className="absolute right-3 top-9 text-gray-400">
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <Input label="Confirm New Password" type="password"
          value={form.confirm} onChange={setField('confirm')}
          placeholder="Repeat new password" />

        <Button fullWidth loading={isChangingPassword} onClick={handleSubmit}
          disabled={!form.currentPassword || !form.newPassword || !form.confirm}>
          Update Password
        </Button>
      </div>
    </div>
  );
}
