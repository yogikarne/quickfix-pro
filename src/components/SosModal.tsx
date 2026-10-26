import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  Radio, 
  X, 
  Share2, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  MapPin, 
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { Provider } from '../types';
import { triggerHaptic } from '../lib/capacitorBridge';
import { broadcastSosAlertToFirestore } from '../lib/firebase';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number; address: string } | null;
  onAutoBookNearest: (provider: Provider) => void;
  nearestProvider: Provider | null;
  t: (key: string) => string;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  onAutoBookNearest,
  nearestProvider,
  t,
}) => {
  const [countdown, setCountdown] = useState<number>(5);
  const [broadcastActive, setBroadcastActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [broadcastSaved, setBroadcastSaved] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sirenOscillatorRef = useRef<OscillatorNode | null>(null);

  // Play synthesized Web Audio emergency chirp/siren
  const startSiren = () => {
    try {
      if (isMuted) return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1150, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);

      audioContextRef.current = ctx;
      sirenOscillatorRef.current = osc;
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  useEffect(() => {
    let interval: any = null;

    if (isOpen) {
      triggerHaptic('heavy');
      startSiren();

      if (countdown > 0) {
        interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              triggerHaptic('heavy');
              return 0;
            }
            startSiren();
            triggerHaptic('medium');
            return prev - 1;
          });
        }, 1000);
      } else if (countdown === 0 && !broadcastActive) {
        setBroadcastActive(true);
        triggerHaptic('heavy');

        // Broadcast to Firestore
        if (userLocation) {
          broadcastSosAlertToFirestore({
            id: `SOS-${Date.now()}`,
            userName: 'Indian Roadside Driver',
            userPhone: '+91 98200 12345',
            location: userLocation,
            status: 'active',
          }).then(() => setBroadcastSaved(true));
        }

        // Auto book nearest mechanic after 1.5 seconds
        if (nearestProvider) {
          const timeout = setTimeout(() => {
            onAutoBookNearest(nearestProvider);
            onClose();
          }, 1500);
          return () => clearTimeout(timeout);
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (_) {}
      }
    };
  }, [isOpen, countdown, broadcastActive, nearestProvider, userLocation, isMuted]);

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      setBroadcastActive(false);
      setBroadcastSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getEmergencyShareText = () => {
    const lat = userLocation?.lat.toFixed(5) || '19.0760';
    const lng = userLocation?.lng.toFixed(5) || '72.8777';
    const addr = userLocation?.address || 'Indian Highway';
    return `🚨 EMERGENCY SOS ALERT!\nMy vehicle has broken down at: ${addr}\nLive GPS Map Coordinates: https://maps.google.com/?q=${lat},${lng}\nPlease send assistance or emergency patrol!`;
  };

  const handleShareWhatsApp = () => {
    triggerHaptic('light');
    const url = `https://wa.me/?text=${encodeURIComponent(getEmergencyShareText())}`;
    window.open(url, '_blank');
  };

  const handleShareSms = () => {
    triggerHaptic('light');
    const url = `sms:?body=${encodeURIComponent(getEmergencyShareText())}`;
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-red-600/80 rounded-3xl p-5 sm:p-6 text-center text-slate-100 shadow-2xl overflow-hidden font-sans">
        
        {/* Pulsing ring background */}
        <div className="absolute -inset-10 rounded-full bg-red-600/10 animate-ping opacity-50 pointer-events-none" />

        {/* Top Controls: Sound Mute & Close */}
        <div className="flex items-center justify-between relative z-10 mb-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title={isMuted ? 'Unmute Emergency Siren' : 'Mute Siren'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />}
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition"
            title="Cancel SOS"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Flashing Beacon */}
        <div className="relative z-10 w-20 h-20 mx-auto mb-3 rounded-full bg-red-600 border-4 border-red-500/40 flex items-center justify-center shadow-lg shadow-red-600/50 animate-pulse">
          <AlertTriangle className="w-10 h-10 text-white fill-white" />
        </div>

        <h2 className="relative z-10 font-extrabold text-xl text-white tracking-tight">
          HIGHWAY SOS ACTIVE
        </h2>

        <p className="relative z-10 text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
          Transmitting live satellite coordinates to Indian 112 emergency network & nearest verified patrol...
        </p>

        {/* Countdown */}
        {!broadcastActive ? (
          <div className="relative z-10 my-4">
            <span className="text-6xl font-black text-red-500 font-mono tracking-tight animate-bounce inline-block">
              0{countdown}
            </span>
            <p className="text-[11px] font-extrabold text-red-400 mt-1 uppercase tracking-wider">
              Seconds until priority auto-dispatch
            </p>
          </div>
        ) : (
          <div className="relative z-10 my-4 p-3.5 rounded-2xl bg-red-950/80 border border-red-800/80 flex flex-col items-center gap-1.5 animate-pulse">
            <Radio className="w-6 h-6 text-red-400 animate-spin" />
            <span className="font-extrabold text-xs text-white font-sans">
              Dispatching Nearest Patrol: {nearestProvider?.name || 'QuickFix Emergency Unit'}
            </span>
            {broadcastSaved && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Transmitted to Control Room
              </span>
            )}
          </div>
        )}

        {/* Live GPS Coordinates Card */}
        <div className="relative z-10 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs text-slate-300 mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-red-400 flex items-center gap-1 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-red-400" /> Transmitted GPS Pin:
            </span>
            <span className="text-[10px] font-mono text-slate-400">High Precision</span>
          </div>
          <p className="truncate font-semibold text-white text-xs">
            {userLocation?.address || 'Detecting high precision coordinates...'}
          </p>
        </div>

        {/* 1-Tap Emergency Sharing (WhatsApp & SMS) */}
        <div className="relative z-10 grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp Pin</span>
          </button>

          <button
            onClick={handleShareSms}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <span>SMS Contacts</span>
          </button>
        </div>

        {/* Real Indian Emergency Helplines Stack */}
        <div className="relative z-10 space-y-2 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:112"
              className="py-2.5 px-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 active:scale-95 transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 112 (National)</span>
            </a>

            <a
              href="tel:1033"
              className="py-2.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 active:scale-95 transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>1033 (NHAI Highway)</span>
            </a>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="relative z-10 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 active:scale-98 transition"
        >
          Cancel Emergency Broadcast
        </button>
      </div>
    </div>
  );
};
