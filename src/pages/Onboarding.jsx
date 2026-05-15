import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';
import { Eye, EyeOff } from 'lucide-react';

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
};

export default function Onboarding() {
  const { isAuthenticated } = useAuthStore();
  const [tab, setTab]       = useState('phone');   // 'phone' | 'email'
  const [mode, setMode]     = useState('login');    // 'login' | 'register'
  const [showPass, setShowPass] = useState(false);

  // Phone OTP state
  const [step, setStep]     = useState('phone');
  const [phone, setPhone]   = useState('+234');
  const [otp, setOtp]       = useState('');
  const [devCode, setDevCode] = useState(null);

  // Email/password state
  const [form, setForm]     = useState({ email: '', password: '', fullName: '', confirmPassword: '', phone: '+234' });
  const [pushEnabled, setPushEnabled] = useState(false);

  const {
    sendOtpAsync, isSendingOtp,
    verifyOtpAsync, isVerifying,
    loginEmailAsync, isLoggingIn,
    registerAsync, isRegistering,
  } = useAuth();

  if (isAuthenticated()) return <Navigate to="/" replace />;

  const setField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSendOtp = async () => {
    try {
      const result = await sendOtpAsync(phone);
      if (result.code) setDevCode(result.code);
      setStep('otp');
    } catch {}
  };

  const handleVerify = async () => {
    try { await verifyOtpAsync({ phone, code: otp }); } catch {}
  };

  const handleEmailLogin = async () => {
    try { await loginEmailAsync({ email: form.email, password: form.password }); } catch {}
  };

  const handlePushToggle = async (checked) => {
    if (checked && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === 'granted');
    } else {
      setPushEnabled(checked);
    }
  };

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      const { toast } = await import('react-hot-toast');
      toast.error('Passwords do not match');
      return;
    }
    try {
      const payload = { email: form.email, password: form.password, fullName: form.fullName };
      if (form.phone && form.phone !== '+234') payload.phone = form.phone;
      await registerAsync(payload);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Hero */}
      <div className="bg-primary text-white px-6 pt-16 pb-10">
        <div className="text-4xl mb-3">🔄</div>
        <h1 className="font-display font-bold text-3xl">SwapNaija</h1>
        <p className="text-primary-100 mt-1">Nigeria's #1 Barter & Trade Marketplace</p>
      </div>

      <div className="flex-1 px-6 py-6 max-w-sm mx-auto w-full">
        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          {['phone', 'email'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setStep('phone'); setMode('login'); }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t ? 'bg-white text-ink shadow-sm' : 'text-gray-500'
              }`}
            >
              {t === 'phone' ? '📱 Phone OTP' : '✉️ Email'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Phone OTP flow ── */}
          {tab === 'phone' && step === 'phone' && (
            <motion.div key="phone" {...slide} className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-2xl">Welcome back</h2>
                <p className="text-gray-500 mt-1 text-sm">Enter your Nigerian phone number</p>
              </div>
              <Input label="Phone Number" type="tel" value={phone}
                onChange={(e) => setPhone(e.target.value)} placeholder="+2348012345678" />
              <Button fullWidth loading={isSendingOtp} onClick={handleSendOtp}>
                Send OTP
              </Button>
              <p className="text-xs text-center text-gray-400">
                By continuing, you agree to our Terms of Service
              </p>
            </motion.div>
          )}

          {tab === 'phone' && step === 'otp' && (
            <motion.div key="otp" {...slide} className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-2xl">Enter OTP</h2>
                <p className="text-gray-500 mt-1 text-sm">We sent a code to {phone}</p>
                {devCode && (
                  <p className="text-xs text-primary mt-1 bg-primary-50 px-3 py-1 rounded-lg inline-block">
                    Dev OTP: {devCode}
                  </p>
                )}
              </div>
              <Input label="6-digit OTP" type="text" inputMode="numeric" maxLength={6}
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456" />
              <Button fullWidth loading={isVerifying} onClick={handleVerify} disabled={otp.length !== 6}>
                Verify & Login
              </Button>
              <button onClick={() => { setStep('phone'); setDevCode(null); }}
                className="w-full text-sm text-gray-500 text-center">
                ← Change number
              </button>
            </motion.div>
          )}

          {/* ── Email flow ── */}
          {tab === 'email' && mode === 'login' && (
            <motion.div key="email-login" {...slide} className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-2xl">Sign in</h2>
                <p className="text-gray-500 mt-1 text-sm">Use your email and password</p>
              </div>
              <Input label="Email" type="email" value={form.email}
                onChange={setField('email')} placeholder="you@example.com" />
              <div className="relative">
                <Input label="Password" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={setField('password')} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-9 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="text-right -mt-2">
                <Link to="/forgot-password" className="text-sm text-primary font-medium">
                  Forgot password?
                </Link>
              </div>
              <Button fullWidth loading={isLoggingIn} onClick={handleEmailLogin}>
                Sign In
              </Button>
              <p className="text-sm text-center text-gray-500">
                Don't have an account?{' '}
                <button onClick={() => setMode('register')} className="text-primary font-medium">
                  Register
                </button>
              </p>
            </motion.div>
          )}

          {tab === 'email' && mode === 'register' && (
            <motion.div key="email-register" {...slide} className="space-y-4">
              <div>
                <h2 className="font-display font-bold text-2xl">Create account</h2>
                <p className="text-gray-500 mt-1 text-sm">Join thousands of swappers</p>
              </div>
              <Input label="Full Name" value={form.fullName}
                onChange={setField('fullName')} placeholder="Amaka Okafor" />
              <Input label="Email" type="email" value={form.email}
                onChange={setField('email')} placeholder="you@example.com" />
              <div className="relative">
                <Input label="Password" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={setField('password')} placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-9 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Input label="Confirm Password" type="password"
                value={form.confirmPassword} onChange={setField('confirmPassword')}
                placeholder="Repeat password" />
              <Input label="Phone Number (optional)" type="tel" value={form.phone}
                onChange={setField('phone')} placeholder="+2348012345678" />
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={pushEnabled}
                    onChange={(e) => handlePushToggle(e.target.checked)}
                  />
                  <div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-colors">
                    {pushEnabled && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  <span className="font-medium text-ink">Enable push notifications</span>
                  <br />
                  <span className="text-xs text-gray-400">Get alerts for new matches, swap updates, and messages</span>
                </span>
              </label>
              <Button fullWidth loading={isRegistering} onClick={handleRegister}>
                Create Account
              </Button>
              <p className="text-sm text-center text-gray-500">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-primary font-medium">
                  Sign in
                </button>
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
