import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Navigation, Radio, CheckCircle, Zap, ArrowRight } from 'lucide-react';

interface AppSplashPreviewProps {
  onComplete?: () => void;
  onStart?: () => void;
  cityName?: string;
  isFirebaseConnected?: boolean;
}

export const AppSplashPreview: React.FC<AppSplashPreviewProps> = ({
  onComplete,
  onStart,
  cityName = 'Detecting GPS...',
  isFirebaseConnected = true,
}) => {
  const [step, setStep] = useState<number>(0);

  const handleFinish = () => {
    if (typeof onComplete === 'function') {
      onComplete();
    } else if (typeof onStart === 'function') {
      onStart();
    }
  };

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 700);
    const timer2 = setTimeout(() => setStep(2), 1500);
    const timer3 = setTimeout(() => setStep(3), 2300);
    const timer4 = setTimeout(() => {
      handleFinish();
    }, 3100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete, onStart]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.4 } }}
        className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none overflow-hidden font-sans"
      >
        {/* Background Subtle Radar Circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <motion.div
            animate={{ scale: [0.8, 1.8], opacity: [0.8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
            className="w-96 h-96 rounded-full border-2 border-amber-500"
          />
          <motion.div
            animate={{ scale: [0.5, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, ease: 'easeOut' }}
            className="w-72 h-72 rounded-full border-2 border-emerald-500"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-sm w-full text-center space-y-5">
          {/* Logo Badge */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500 text-slate-950 shadow-2xl shadow-amber-500/30 font-black border-2 border-amber-400"
          >
            <Wrench className="w-10 h-10" />
          </motion.div>

          <div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans"
            >
              Quick<span className="text-amber-400">Fix</span> <span className="text-sm px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">India 🇮🇳</span>
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs text-slate-400 mt-1 font-sans"
            >
              24/7 National Emergency Roadside & Highway Rescue
            </motion.p>
          </div>

          {/* Loading Steps Box */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-3 shadow-xl"
          >
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <Navigation className={`w-4 h-4 ${step >= 0 ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
              <span className="flex-1 font-mono">
                {step === 0 && `Locking Indian GPS Location...`}
                {step >= 1 && `GPS Locked: ${cityName}`}
              </span>
              {step >= 1 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <Radio className={`w-4 h-4 ${step >= 1 ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
              <span className="flex-1 font-mono">
                {step < 2 ? 'Scanning nearby verified mobile mechanics...' : 'Active Dispatches: 18 Vans Nearby'}
              </span>
              {step >= 2 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <Zap className={`w-4 h-4 ${step >= 2 ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
              <span className="flex-1 font-mono">
                {step < 3 ? 'Syncing Firebase Cloud Database & 112 SOS...' : 'Firebase Cloud Synced'}
              </span>
              {step >= 3 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: step === 0 ? '25%' : step === 1 ? '50%' : step === 2 ? '85%' : '100%' }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 h-full rounded-full"
            />
          </div>

          {/* Direct Skip Button */}
          <div className="pt-2">
            <button
              onClick={handleFinish}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto active:scale-95"
            >
              <span>Enter Roadside Console</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          <p className="text-[10px] text-slate-500 font-sans">
            Powered by Firebase Cloud Firestore • NHAI Highway Patrol Approved
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
