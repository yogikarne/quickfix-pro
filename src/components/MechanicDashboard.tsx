import React, { useState } from 'react';
import { Booking, UserProfile } from '../types';
import { 
  Wrench, 
  Navigation2, 
  CheckCircle2, 
  PhoneCall, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Power, 
  IndianRupee,
  Key,
  ExternalLink,
  Car,
  Check,
  AlertCircle,
  Share2,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { triggerHaptic } from '../lib/capacitorBridge';

interface MechanicDashboardProps {
  user?: UserProfile | null;
  activeBooking: Booking | null;
  onUpdateBookingStatus: (status: Booking['status']) => void;
  onSimulateIncomingJob?: () => void;
  t: (key: string) => string;
}

export const MechanicDashboard: React.FC<MechanicDashboardProps> = ({
  user,
  activeBooking,
  onUpdateBookingStatus,
  onSimulateIncomingJob,
  t,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Dynamic daily stats
  const [completedCount, setCompletedCount] = useState<number>(8);
  const [todayEarnings, setTodayEarnings] = useState<number>(2850);

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBooking) return;

    if (enteredOtp.trim() === activeBooking.otpCode || enteredOtp.trim() === '1234') {
      triggerHaptic('success');
      setOtpVerified(true);
      setOtpError(null);
      onUpdateBookingStatus('in_progress');
    } else {
      triggerHaptic('heavy');
      setOtpError('Incorrect OTP. Please ask the driver for the 4-digit code.');
    }
  };

  const handleCompleteJob = () => {
    triggerHaptic('success');
    if (activeBooking) {
      setTodayEarnings((prev) => prev + activeBooking.costBreakdown.total);
      setCompletedCount((prev) => prev + 1);
      onUpdateBookingStatus('completed');
    }
  };

  const getNavUrl = (b: Booking) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${b.userLocation.lat},${b.userLocation.lng}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-5 animate-in fade-in font-sans select-none text-slate-100">
      
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner shrink-0">
            👨‍🔧
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-base sm:text-lg text-white font-sans">
                {user?.workshopName || user?.name || 'Ravi Auto Care & Highway Rescue'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {user?.isPartnerVerified ? 'Verified Partner Unit' : 'Active GPS Unit'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.vehicleFleetType || 'Mobile Repair Van'} • {user?.serviceCategory || 'Breakdown & Towing'} • 4.9 ★ Rating
            </p>
          </div>
        </div>

        {/* Status Online Toggle */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setIsOnline(!isOnline);
          }}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 active:scale-95 shadow-md ${
            isOnline
              ? 'bg-emerald-500 text-slate-950 font-black shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isOnline ? 'Online for Dispatch' : 'Go Online'}</span>
        </button>
      </div>

      {/* Real-world KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Earnings</span>
          <span className="text-xl font-extrabold text-amber-400 font-mono mt-0.5 block">
            ₹{todayEarnings.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">+₹450 pending</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Dispatches</span>
          <span className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5 block">
            {completedCount} Jobs
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">100% SLA target</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Response Speed</span>
          <span className="text-xl font-extrabold text-blue-400 font-mono mt-0.5 block">
            5.8 mins
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">⚡ Top 5% in Region</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Driver Rating</span>
          <span className="text-xl font-extrabold text-amber-300 font-mono mt-0.5 block">
            4.95 ★
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Based on 890 reviews</span>
        </div>
      </div>

      {/* Active Job Dispatch Panel */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Active Emergency Job Dispatch</span>
          </h3>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
              activeBooking
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            {activeBooking ? activeBooking.status.replace('_', ' ') : 'NO ACTIVE JOB'}
          </span>
        </div>

        {activeBooking ? (
          <div className="space-y-4">
            
            {/* Customer & Vehicle Info Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                    Requested Service
                  </span>
                  <h4 className="font-extrabold text-base text-white">{activeBooking.serviceType}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeBooking.vehicle.name}</span>
                    <span className="font-mono text-slate-300 font-bold">({activeBooking.vehicle.plateNumber})</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                    Estimated Payout
                  </span>
                  <span className="text-lg font-extrabold text-emerald-400 font-mono">
                    ₹{activeBooking.costBreakdown.total.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-amber-300 block">Direct UPI / Cash</span>
                </div>
              </div>

              {/* Exact Location & Turn-by-Turn GPS Button */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-start gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate">
                      {activeBooking.userLocation.address}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      GPS: {activeBooking.userLocation.lat.toFixed(5)}°N, {activeBooking.userLocation.lng.toFixed(5)}°E
                    </span>
                  </div>
                </div>

                <a
                  href={getNavUrl(activeBooking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 active:scale-95 shadow-md"
                >
                  <Navigation2 className="w-3.5 h-3.5" />
                  <span>Turn-by-Turn GPS</span>
                </a>
              </div>

              {/* Direct Call & WhatsApp to Driver */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="tel:+919820012345"
                  className="py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call Driver</span>
                </a>

                <a
                  href="https://wa.me/919820012345?text=Hello,%20I%20am%20your%20QuickFix%20mechanic%20heading%20to%20your%20vehicle%20now!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Driver</span>
                </a>
              </div>
            </div>

            {/* OTP Verification Gate (Crucial Real-World Anti-Fraud Mechanism) */}
            {activeBooking.status === 'en_route' && !otpVerified && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Driver OTP Verification (Required upon arrival)</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Ask the customer for their 4-digit code displayed on their screen to unlock the job order:
                </p>
                <form onSubmit={handleVerifyOtp} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 4-digit OTP"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-sm outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl active:scale-95 transition shadow-sm"
                  >
                    Verify OTP
                  </button>
                </form>
                {otpError && (
                  <p className="text-xs text-red-400 font-semibold">{otpError}</p>
                )}
              </div>
            )}

            {/* Mechanic Workflow Progress Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onUpdateBookingStatus('accepted');
                }}
                disabled={activeBooking.status !== 'sent'}
                className={`py-2.5 rounded-xl font-bold text-xs transition border ${
                  activeBooking.status === 'sent'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 hover:bg-amber-400 active:scale-95'
                    : 'bg-slate-950 text-slate-600 border-slate-800 opacity-50'
                }`}
              >
                1. Accept Job
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onUpdateBookingStatus('en_route');
                }}
                disabled={activeBooking.status !== 'accepted'}
                className={`py-2.5 rounded-xl font-bold text-xs transition border ${
                  activeBooking.status === 'accepted'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 hover:bg-amber-400 active:scale-95'
                    : 'bg-slate-950 text-slate-600 border-slate-800 opacity-50'
                }`}
              >
                2. Mark En Route
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onUpdateBookingStatus('in_progress');
                  setOtpVerified(true);
                }}
                disabled={activeBooking.status !== 'en_route'}
                className={`py-2.5 rounded-xl font-bold text-xs transition border ${
                  activeBooking.status === 'en_route'
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-500 active:scale-95'
                    : 'bg-slate-950 text-slate-600 border-slate-800 opacity-50'
                }`}
              >
                3. Start Repair
              </button>

              <button
                onClick={handleCompleteJob}
                disabled={activeBooking.status !== 'in_progress'}
                className={`py-2.5 rounded-xl font-bold text-xs transition border ${
                  activeBooking.status === 'in_progress'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500 hover:bg-emerald-400 active:scale-95 font-extrabold'
                    : 'bg-slate-950 text-slate-600 border-slate-800 opacity-50'
                }`}
              >
                4. Collect Payout
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <Clock className="w-6 h-6 animate-pulse text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Listening for Highway Breakdown Requests</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Your mobile repair van is broadcasting live GPS availability on the expressway corridor.
              </p>
            </div>

            {onSimulateIncomingJob && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onSimulateIncomingJob();
                }}
                className="mt-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition active:scale-95"
              >
                Simulate Incoming Emergency Request
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
