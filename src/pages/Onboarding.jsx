import { useState, useEffect } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';
import { Eye, EyeOff, ArrowRightLeft, ShieldCheck, Zap, Users } from 'lucide-react';

const SLIDES = [
  {
    icon: <ArrowRightLeft size={36} className="text-white" />,
    title: 'What is Barter?',
    body: 'Barter is trading what you have for what you need — no cash required. You list an item, find someone who wants it, and swap directly.',
  },
  {
    icon: <ShieldCheck size={36} className="text-white" />,
    title: 'Escrow Protection',
    body: 'Every swap is protected by our escrow system. Items are held securely until both parties confirm — so you never get cheated.',
  },
  {
    icon: <Zap size={36} className="text-white" />,
    title: 'Smart Matching',
    body: 'Our algorithm finds the best swap matches for your listings automatically — saving you time and getting you the best deal.',
  },
  {
    icon: <Users size={36} className="text-white" />,
    title: 'Verified Community',
    body: "Every member is verified. Ratings, reviews, and KYC checks ensure you're always trading with real, trusted Nigerians.",
  },
];

const formSlide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function Onboarding() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [slide, setSlide] = useState(0);
  const [slideDir, setSlideDir] = useState(1);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [form, setForm] = useState({ email: '', password: '', fullName: '', confirmPassword: '', phone: '' });

  const { loginOtpAsync, isLoginOtpPending, registerAsync, isRegistering } = useAuth();

  useEffect(() => {
    const t = setInterval(() => {
      setSlideDir(1);
      setSlide(s => (s + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  if (isAuthenticated()) return <Navigate to="/" replace />;

  const setField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const goSlide = (i) => {
    setSlideDir(i > slide ? 1 : -1);
    setSlide(i);
  };

  const handleLogin = async () => {
    const { default: toast } = await import('react-hot-toast');
    const email = loginEmail.trim().toLowerCase();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { toast.error('Enter a valid email address'); return; }
    if (!loginPassword) { toast.error('Enter your password'); return; }
    try {
      const result = await loginOtpAsync({ email, password: loginPassword });
      navigate('/otp', { state: { email } });
    } catch {}
  };

  const handleRegister = async () => {
    const { default: toast } = await import('react-hot-toast');
    if (!form.fullName.trim()) { toast.error('Enter your full name'); return; }
    if (!form.email.trim()) { toast.error('Enter your email'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.phone && !/^\+234[0-9]{10}$/.test(form.phone)) { toast.error('Phone must be +2348012345678'); return; }
    try {
      const payload = { email: form.email.trim(), password: form.password, fullName: form.fullName.trim() };
      if (form.phone) payload.phone = form.phone;
      await registerAsync(payload);
    } catch {}
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel: info slides ── */}
      <div className="hidden lg:flex lg:w-[55%] bg-primary flex-col relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-12 w-48 h-48 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10 px-12 pt-12 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <ArrowRightLeft size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">SwapNaija</span>
        </div>

        {/* Slides */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={slideDir}>
              <motion.div
                key={slide}
                custom={slideDir}
                variants={{
                  initial: (d) => ({ opacity: 0, x: d * 60 }),
                  animate: { opacity: 1, x: 0 },
                  exit: (d) => ({ opacity: 0, x: d * -60 }),
                }}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-8">
                  {SLIDES[slide].icon}
                </div>
                <h2 className="text-white font-bold text-4xl leading-tight mb-4">
                  {SLIDES[slide].title}
                </h2>
                <p className="text-white/70 text-lg leading-relaxed max-w-md">
                  {SLIDES[slide].body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot indicators */}
          <div className="flex gap-2 mt-12">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === slide ? 'bg-white w-8' : 'bg-white/30 w-2'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 px-12 pb-10">
          <p className="text-white/50 text-sm">Nigeria's #1 Barter & Trade Marketplace</p>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">

        {/* Mobile top bar */}
        <div className="lg:hidden bg-primary px-6 pt-14 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ArrowRightLeft size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-lg">SwapNaija</span>
          </div>
          <p className="text-white/70 text-sm">Nigeria's #1 Barter & Trade Marketplace</p>
        </div>

        {/* Form container */}
        <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md w-full mx-auto lg:mx-0 lg:px-14 lg:py-0 lg:justify-center">

          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => setMode(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mode === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── Login ── */}
            {mode === 'login' && (
              <motion.div key="login" {...formSlide} className="space-y-5">
                <div className="mb-2">
                  <h2 className="font-bold text-2xl text-gray-900">Welcome back</h2>
                  <p className="text-gray-500 mt-1 text-sm">Sign in to continue swapping</p>
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPass ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="flex justify-end -mt-2">
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>

                <Button fullWidth loading={isLoginOtpPending} onClick={handleLogin} disabled={!loginEmail.trim() || !loginPassword}>
                  Continue
                </Button>

                <p className="text-xs text-center text-gray-400">
                  We'll verify your credentials then send a 6-digit code to your email.
                </p>
              </motion.div>
            )}

            {/* ── Register ── */}
            {mode === 'register' && (
              <motion.div key="register" {...formSlide} className="space-y-4">
                <div className="mb-2">
                  <h2 className="font-bold text-2xl text-gray-900">Create account</h2>
                  <p className="text-gray-500 mt-1 text-sm">Join thousands of swappers across Nigeria</p>
                </div>

                <Input label="Full Name" value={form.fullName}
                  onChange={setField('fullName')} placeholder="Amaka Okafor" />
                <Input label="Email Address" type="email" value={form.email}
                  onChange={setField('email')} placeholder="you@example.com" />

                <div className="relative">
                  <Input label="Password" type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={setField('password')} placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <Input label="Confirm Password" type={showConfirmPass ? 'text' : 'password'}
                    value={form.confirmPassword} onChange={setField('confirmPassword')} placeholder="Repeat password" />
                  <button type="button" onClick={() => setShowConfirmPass(v => !v)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <Input label="Phone Number (optional)" type="tel" value={form.phone}
                  onChange={setField('phone')} placeholder="+2348012345678" />

                <Button fullWidth loading={isRegistering} onClick={handleRegister}>
                  Create Account
                </Button>

                <p className="text-xs text-center text-gray-400">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-primary font-semibold">Sign in</button>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center lg:px-14 lg:text-left">
          <p className="text-xs text-gray-400">
            By continuing you agree to our{' '}
            <span className="text-primary font-medium cursor-pointer">Terms of Service</span>
            {' & '}
            <span className="text-primary font-medium cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>

    </div>
  );
}
