import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wrench, Phone, Mail, Lock, CheckCircle2, Key, Loader2, LogIn, ChevronDown } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, registerWithEmail } from '../lib/firebase';
import { triggerHaptic } from '../lib/capacitorBridge';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; phone: string; uid: string; avatar?: string }) => void;
  t: (key: string) => string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  t,
}) => {
  const [tab, setTab] = useState<'google' | 'phone' | 'email'>('google');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  // Gemini API Key merge
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('quickfix_custom_api_key') || '');
  const [keySaved, setKeySaved] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('quickfix_custom_api_key', apiKeyInput.trim());
      setKeySaved(true);
      triggerHaptic('success');
      setTimeout(() => setKeySaved(false), 2500);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    triggerHaptic('medium');
    try {
      const gUser = await signInWithGoogle();
      if (gUser) {
        onLoginSuccess({
          uid: gUser.uid,
          name: gUser.displayName || 'Driver',
          email: gUser.email || '',
          phone: gUser.phoneNumber || '',
          avatar: gUser.photoURL || undefined,
        });
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Google Auth failed or was cancelled.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length >= 10) {
      setOtpSent(true);
      triggerHaptic('light');
    } else {
      setError('Please enter a valid 10-digit mobile number.');
    }
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP verification code.');
      return;
    }
    triggerHaptic('success');
    onLoginSuccess({
      uid: `phone_${phone.trim().replace(/\D/g, '')}`,
      name: name.trim() || 'Verified Driver',
      email: `${phone.trim().replace(/\D/g, '')}@quickfix.in`,
      phone: `+91 ${phone.trim()}`,
    });
    onClose();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    triggerHaptic('medium');

    try {
      if (isRegister) {
        const u = await registerWithEmail(email.trim(), password.trim(), name.trim() || undefined);
        onLoginSuccess({
          uid: u.uid,
          name: name.trim() || u.displayName || email.split('@')[0],
          email: u.email || email.trim(),
          phone: '',
        });
      } else {
        const u = await signInWithEmail(email.trim(), password.trim());
        onLoginSuccess({
          uid: u.uid,
          name: u.displayName || email.split('@')[0],
          email: u.email || email.trim(),
          phone: '',
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Email authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none text-slate-100 font-sans">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 text-slate-100 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white bg-slate-800 transition"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white font-sans">
              Sign In to <span className="text-amber-400">QuickFix</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans">24/7 Roadside Assistance & Firebase Sync</p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold font-sans">
          <button
            onClick={() => {
              triggerHaptic('light');
              setTab('google');
            }}
            className={`flex-1 py-2 rounded-xl transition ${
              tab === 'google'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Google
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setTab('email');
            }}
            className={`flex-1 py-2 rounded-xl transition ${
              tab === 'email'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setTab('phone');
            }}
            className={`flex-1 py-2 rounded-xl transition ${
              tab === 'phone'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Phone
          </button>
        </div>

        {/* Tab 1: Google */}
        {tab === 'google' && (
          <div className="space-y-4 py-2 text-center">
            <p className="text-xs text-slate-300 leading-relaxed">
              Sign in with your Google Account for instant verification and cloud sync.
            </p>
            <button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Continue with Google</span>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Email */}
        {tab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">{isRegister ? 'Register' : 'Sign In'}</span>
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-amber-400 underline font-bold"
              >
                {isRegister ? 'Switch to Sign In' : 'New Driver? Register'}
              </button>
            </div>

            {isRegister && (
              <div>
                <label className="block text-slate-300 text-xs mb-1 font-semibold">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-xs mb-1 font-semibold">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs mb-1 font-semibold">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Tab 3: Phone */}
        {tab === 'phone' && (
          <div className="space-y-3">
            {!otpSent ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                <div>
                  <label className="block text-slate-300 text-xs mb-1 font-semibold">Mobile Number</label>
                  <div className="flex gap-2">
                    <span className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-amber-400 font-bold flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter 10-digit mobile"
                      maxLength={10}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500 font-mono"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md"
                >
                  Send OTP Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpVerify} className="space-y-3 animate-in fade-in">
                <div>
                  <label className="block text-slate-300 text-xs mb-1 font-semibold">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-white outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md"
                >
                  Verify OTP & Login
                </button>
              </form>
            )}
          </div>
        )}

        {/* Merge Custom API Key */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-amber-400 font-semibold transition"
          >
            <span className="flex items-center gap-1.5">
              <Key className="w-3 h-3 text-amber-400" />
              <span>Merge / Custom Gemini API Key</span>
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showApiKey ? 'rotate-180' : ''}`} />
          </button>

          {showApiKey && (
            <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs animate-in fade-in">
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Save
                </button>
              </div>
              {keySaved && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> API Key Saved
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
