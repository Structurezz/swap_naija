import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import TopBar from '../components/layout/TopBar';

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
};

export default function ForgotPassword() {
  const [step, setStep]           = useState('email');  // 'email' | 'code'
  const [email, setEmail]         = useState('');
  const [code, setCode]           = useState('');
  const [newPassword, setNew]     = useState('');
  const [confirm, setConfirm]     = useState('');
  const [devCode, setDevCode]     = useState(null);

  const { forgotPasswordAsync, isSendingReset, resetPasswordAsync, isResetting } = useAuth();

  const handleSendCode = async () => {
    try {
      const result = await forgotPasswordAsync(email);
      if (result?.code) setDevCode(result.code);
      setStep('code');
    } catch {}
  };

  const handleReset = async () => {
    if (newPassword !== confirm) {
      const { default: toast } = await import('react-hot-toast');
      toast.error('Passwords do not match');
      return;
    }
    try {
      await resetPasswordAsync({ email, code, newPassword });
    } catch {}
  };

  return (
    <div className="min-h-screen bg-bg">
      <TopBar title="Reset Password" showBack />
      <div className="max-w-sm mx-auto px-6 py-8">
        <AnimatePresence mode="wait">

          {step === 'email' && (
            <motion.div key="email" {...slide} className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-2xl">Forgot password?</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Enter your registered email and we'll send a reset code.
                </p>
              </div>
              <Input label="Email address" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <Button fullWidth loading={isSendingReset} onClick={handleSendCode}
                disabled={!email.includes('@')}>
                Send Reset Code
              </Button>
              <p className="text-sm text-center text-gray-500">
                Remembered it?{' '}
                <Link to="/onboarding" className="text-primary font-medium">Sign in</Link>
              </p>
            </motion.div>
          )}

          {step === 'code' && (
            <motion.div key="code" {...slide} className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-2xl">Enter reset code</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Check your inbox at <span className="font-medium">{email}</span>
                </p>
                {devCode && (
                  <p className="text-xs text-primary mt-1 bg-primary-50 px-3 py-1 rounded-lg inline-block">
                    Dev code: {devCode}
                  </p>
                )}
              </div>
              <Input label="6-digit code" type="text" inputMode="numeric" maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456" />
              <Input label="New Password" type="password" value={newPassword}
                onChange={(e) => setNew(e.target.value)} placeholder="Min. 8 characters" />
              <Input label="Confirm Password" type="password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />
              <Button fullWidth loading={isResetting} onClick={handleReset}
                disabled={code.length !== 6 || newPassword.length < 8}>
                Reset Password
              </Button>
              <button onClick={() => setStep('email')}
                className="w-full text-sm text-gray-500 text-center">
                ← Change email
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
