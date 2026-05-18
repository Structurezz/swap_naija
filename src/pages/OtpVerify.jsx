import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Mail, ShieldCheck, Zap, Users, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

const SLIDES = [
  {
    icon: <ShieldCheck size={36} className="text-white" />,
    title: 'Secure Verification',
    body: 'Your one-time code ensures only you can access your account — no passwords floating around.',
  },
  {
    icon: <Mail size={36} className="text-white" />,
    title: 'Check Your Inbox',
    body: 'We sent a 6-digit code to your email. It expires in 10 minutes, so enter it quickly.',
  },
  {
    icon: <Zap size={36} className="text-white" />,
    title: 'Smart Matching',
    body: 'Once signed in, our algorithm finds the best swap matches for your listings automatically.',
  },
  {
    icon: <Users size={36} className="text-white" />,
    title: 'Trusted Community',
    body: 'Join thousands of verified Nigerians trading daily on SwapNaija — safe, fast, and fair.',
  },
];

export default function OtpVerify() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email || '';

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_TIMEOUT);
  const [slide, setSlide] = useState(0);
  const [slideDir, setSlideDir] = useState(1);
  const inputRefs = useRef([]);

  const { sendEmailOtpAsync, isSendingEmailOtp, verifyEmailOtpAsync, isVerifyingEmailOtp } = useAuth();

  useEffect(() => {
    if (!email) { navigate('/onboarding', { replace: true }); return; }
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  useEffect(() => {
    const t = setInterval(() => {
      setSlideDir(1);
      setSlide(s => (s + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (val, idx) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    if (digit && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
    if (next.every(d => d) && next.join('').length === OTP_LENGTH) submitOtp(next.join(''));
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    text.split('').forEach((d, i) => { next[i] = d; });
    setDigits(next);
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
    if (text.length === OTP_LENGTH) submitOtp(text);
  };

  const submitOtp = async (code) => {
    try {
      await verifyEmailOtpAsync({ email, code });
    } catch {
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    const { default: toast } = await import('react-hot-toast');
    if (code.length < OTP_LENGTH) { toast.error('Enter the 6-digit code'); return; }
    submitOtp(code);
  };

  const handleResend = async () => {
    try {
      await sendEmailOtpAsync(email);
      setTimer(RESEND_TIMEOUT);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      const { default: toast } = await import('react-hot-toast');
      toast.success('New code sent to your email');
    } catch {}
  };

  const goSlide = (i) => {
    setSlideDir(i > slide ? 1 : -1);
    setSlide(i);
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[55%] bg-primary flex-col relative overflow-hidden">
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
          </div>

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

        <div className="relative z-10 px-12 pb-10">
          <p className="text-white/50 text-sm">Nigeria's #1 Barter & Trade Marketplace</p>
        </div>
      </div>

      {/* ── Right panel ── */}
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

        {/* Form */}
        <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md w-full mx-auto lg:mx-0 lg:px-14">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Back */}
            <button
              onClick={() => navigate('/onboarding')}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </button>

            {/* Icon + heading */}
            <div>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <Mail size={26} className="text-primary" />
              </div>
              <h2 className="font-bold text-2xl text-gray-900">Check your email</h2>
              <p className="text-gray-500 mt-1 text-sm">
                We sent a 6-digit code to{' '}
                <span className="text-primary font-semibold">{email}</span>
              </p>
            </div>

            {/* OTP inputs */}
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(r) => (inputRefs.current[idx] = r)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all
                    ${digit ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-gray-50 text-gray-900'}
                    focus:border-primary focus:bg-primary/5`}
                  style={{ width: '44px', height: '52px' }}
                />
              ))}
            </div>

            <Button
              fullWidth
              loading={isVerifyingEmailOtp}
              onClick={handleVerify}
              disabled={digits.join('').length < OTP_LENGTH}
            >
              Verify & Sign In
            </Button>

            <div className="text-center text-sm text-gray-500">
              Didn't get the code?{' '}
              {timer > 0 ? (
                <span className="text-gray-400 font-medium">Resend in {timer}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={isSendingEmailOtp}
                  className="text-primary font-semibold hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
            </div>

          </motion.div>
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
