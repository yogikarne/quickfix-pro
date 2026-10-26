import React, { useState, useEffect, useMemo } from 'react';
import { Booking } from '../types';
import { 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Star, 
  Key, 
  CreditCard, 
  ArrowRight, 
  X, 
  AlertCircle, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink,
  Navigation,
  ShieldCheck,
  Fuel,
  Wrench,
  DollarSign
} from 'lucide-react';
import { triggerHaptic } from '../lib/capacitorBridge';

interface BookingFlowModalProps {
  booking: Booking | null;
  onClose: () => void;
  onUpdateBookingStatus: (status: Booking['status']) => void;
  onPayAndConfirm: (method: 'UPI' | 'Card' | 'Cash') => void;
  onSubmitReview: (rating: number, reviewText: string) => void;
  t: (key: string) => string;
}

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({
  booking,
  onClose,
  onUpdateBookingStatus,
  onPayAndConfirm,
  onSubmitReview,
  t,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Dynamic live ETA countdown for real-world feel
  const [dynamicEta, setDynamicEta] = useState<number>(() => booking?.provider.etaMinutes || 12);
  const [dynamicDistance, setDynamicDistance] = useState<number>(() => booking?.provider.distanceKm || 2.4);

  // Review state
  const [rating, setRating] = useState(5);
  const [selectedFeedbackTags, setSelectedFeedbackTags] = useState<string[]>(['Prompt Arrival', 'Fair Pricing']);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (booking) {
      setDynamicEta(booking.provider.etaMinutes);
      setDynamicDistance(booking.provider.distanceKm);
    }
  }, [booking?.id]);

  // Live ETA simulation countdown when status is 'en_route'
  useEffect(() => {
    if (!booking || booking.status !== 'en_route') return;

    const interval = setInterval(() => {
      setDynamicEta((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 1;
        }
        return prev - 1;
      });
      setDynamicDistance((prev) => {
        const next = Math.max(0.2, prev - 0.3);
        return Math.round(next * 10) / 10;
      });
    }, 12000);

    return () => clearInterval(interval);
  }, [booking?.status]);

  if (!booking) return null;

  const { provider, serviceType, vehicle, status, costBreakdown, otpCode } = booking;

  const STATUS_STEPS = [
    { key: 'sent', label: 'Emergency Request Dispatched', desc: 'Signal broadcast to nearest mobile unit' },
    { key: 'accepted', label: 'Partner Confirmed Dispatch', desc: `${provider.name} accepted your location` },
    { key: 'en_route', label: `Mechanic En Route (${dynamicEta} mins away)`, desc: `Vehicle is ~${dynamicDistance} km away with live GPS tracking` },
    { key: 'in_progress', label: 'Inspection & Repair Underway', desc: 'Technician on-site performing diagnosis and fix' },
    { key: 'completed', label: 'Service Completed Safely', desc: 'Quality verified and job finished' },
  ];

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === status);

  const appliedDiscount = promoApplied ? 100 : costBreakdown.promoDiscount;
  const finalTotal = Math.max(150, costBreakdown.total - appliedDiscount);

  const copyToClipboard = (text: string, type: 'otp' | 'upi') => {
    navigator.clipboard?.writeText(text);
    triggerHaptic('light');
    if (type === 'otp') {
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    } else {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleShareTrackingWhatsApp = () => {
    triggerHaptic('light');
    const msg = `🚗 QuickFix Roadside Tracking:\nMechanic ${provider.name} is dispatched for my ${vehicle.name} (${serviceType})!\nETA: ~${dynamicEta} mins (${dynamicDistance} km away).\nLocation: ${booking.userLocation.address}\nOTP: ${otpCode}`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const FEEDBACK_TAGS = ['Prompt Arrival', 'Fair Pricing', 'Clean Work', 'Polite Technician', 'Fixed on Spot'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-slate-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white font-sans">{t('activeJob')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                #{booking.id.slice(-6)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {serviceType} • {vehicle.name} (<span className="font-mono text-slate-300">{vehicle.plateNumber}</span>)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1 my-3.5 space-y-4">
          
          {/* Provider Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                {provider.emoji}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{provider.name}</h4>
                <p className="text-xs text-slate-400">{provider.type}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-amber-400">
                  <span className="flex items-center gap-0.5 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {provider.rating}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{provider.jobsCompleted} Completed</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-semibold">{provider.yearsExperience} yrs exp</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${provider.phone}`}
                className="p-3 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                title="Call Mechanic"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Call</span>
              </a>
              <button
                onClick={handleShareTrackingWhatsApp}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold transition-all active:scale-95"
                title="Share Tracking on WhatsApp"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* OTP Security Code */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-300 block">Driver Verification OTP</span>
                <span className="text-[11px] text-slate-400">Share this code with technician upon arrival</span>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(otpCode, 'otp')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold font-mono text-base rounded-xl border border-amber-500/40 tracking-widest flex items-center gap-2 active:scale-95 transition"
              title="Click to copy OTP"
            >
              <span>{otpCode}</span>
              {copiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>

          {/* Live Tracking Status Timeline */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Live Dispatch Milestones
              </h5>
              {status === 'en_route' && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ~{dynamicEta} mins ({dynamicDistance} km)
                </span>
              )}
            </div>

            <div className="space-y-3.5 relative pl-6 border-l-2 border-slate-800 mt-2">
              {STATUS_STEPS.map((step, idx) => {
                const isDone = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="relative">
                    <div
                      className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : isCurrent
                          ? 'bg-amber-500 text-slate-950 font-black animate-pulse shadow-md shadow-amber-500/40 ring-4 ring-amber-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>

                    <div>
                      <span
                        className={`text-xs font-bold font-sans ${
                          isDone
                            ? 'text-emerald-400'
                            : isCurrent
                            ? 'text-amber-300'
                            : 'text-slate-500'
                        }`}
                      >
                        {step.label}
                      </span>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Advance Status Controls */}
            {status !== 'completed' && (
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    if (status === 'sent') onUpdateBookingStatus('accepted');
                    else if (status === 'accepted') onUpdateBookingStatus('en_route');
                    else if (status === 'en_route') onUpdateBookingStatus('in_progress');
                    else if (status === 'in_progress') onUpdateBookingStatus('completed');
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Simulate Step: {status === 'sent' ? 'Accept Job' : status === 'accepted' ? 'Start Journey' : status === 'en_route' ? 'Technician Arrived' : 'Complete Repair'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Transparent Fair Rupee Pricing Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <h5 className="font-bold uppercase tracking-wider text-slate-400">
                Transparent Fee Breakdown (₹ INR)
              </h5>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                No Hidden Surcharges
              </span>
            </div>

            <div className="flex justify-between text-slate-300">
              <span>Base On-Site Inspection / Call-out</span>
              <span className="font-mono">₹{costBreakdown.baseFee.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Highway Transport ({provider.distanceKm} km @ ₹{provider.perKmRate}/km)</span>
              <span className="font-mono">₹{costBreakdown.distanceFee.toFixed(0)}</span>
            </div>
            {costBreakdown.emergencySurcharge > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Express Emergency Dispatch Priority</span>
                <span className="font-mono">+₹{costBreakdown.emergencySurcharge.toFixed(0)}</span>
              </div>
            )}

            {/* Promo Code Input */}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="PROMO CODE (TRY QUICKFIX20)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white uppercase outline-none focus:border-amber-500 font-sans"
              />
              <button
                onClick={() => {
                  triggerHaptic('light');
                  if (promoCode.trim().toUpperCase() === 'QUICKFIX20') {
                    setPromoApplied(true);
                  }
                }}
                className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-xl text-xs border border-amber-500/40 active:scale-95"
              >
                Apply
              </button>
            </div>

            {promoApplied && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Promotional Monsoon Discount</span>
                <span className="font-mono">-₹100</span>
              </div>
            )}

            <div className="flex justify-between text-white font-extrabold text-sm pt-2 border-t border-slate-800">
              <span>Estimated Payable Amount</span>
              <span className="text-amber-400 font-mono text-base">₹{finalTotal.toFixed(0)}</span>
            </div>
          </div>

          {/* Secure Indian Payment Section (If Pending) */}
          {booking.paymentStatus === 'pending' && status === 'completed' && (
            <div className="p-4 rounded-2xl bg-slate-950 border-2 border-amber-500/40 space-y-3.5">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Select Payment Method
                </h5>
                <span className="text-[10px] text-slate-400">Pay directly to mechanic</span>
              </div>

              {/* Payment Tabs */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'UPI', label: 'UPI QR / App' },
                  { id: 'Cash', label: 'Cash on Spot' },
                  { id: 'Card', label: 'Card / POS' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedPayMethod(m.id as any);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      selectedPayMethod === m.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-extrabold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* UPI Details Display with QR & One-Click Link */}
              {selectedPayMethod === 'UPI' && (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-300 text-xs font-semibold">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>Scan via GPay / PhonePe / Paytm / BHIM</span>
                  </div>

                  {/* Generated QR Code representation */}
                  <div className="mx-auto w-32 h-32 bg-white p-2 rounded-2xl shadow-inner flex flex-col items-center justify-center border-2 border-amber-500/50">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=quickfix.partner@okhdfcbank&pn=${encodeURIComponent(provider.name)}&am=${finalTotal}&cu=INR`)}`} 
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <span className="font-mono text-slate-300 text-[11px] truncate">quickfix.partner@okhdfcbank</span>
                    <button
                      onClick={() => copyToClipboard('quickfix.partner@okhdfcbank', 'upi')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-md text-[10px] font-bold flex items-center gap-1"
                    >
                      {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                    </button>
                  </div>

                  <a
                    href={`upi://pay?pa=quickfix.partner@okhdfcbank&pn=${encodeURIComponent(provider.name)}&am=${finalTotal}&cu=INR`}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Installed UPI App</span>
                  </a>
                </div>
              )}

              {/* Confirm Payment Button */}
              <button
                onClick={() => {
                  triggerHaptic('success');
                  onPayAndConfirm(selectedPayMethod);
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
              >
                Confirm ₹{finalTotal.toFixed(0)} Paid via {selectedPayMethod}
              </button>
            </div>
          )}

          {/* Post-Service Rating & Review Form */}
          {status === 'completed' && booking.paymentStatus === 'paid' && !reviewSubmitted && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 text-center">
                Rate Mechanic Service
              </h5>

              {/* Star Rating */}
              <div className="flex items-center gap-2 justify-center py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      triggerHaptic('light');
                      setRating(star);
                    }}
                    className="p-1 transition-transform hover:scale-125 active:scale-95"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Quick feedback tags */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {FEEDBACK_TAGS.map((tag) => {
                  const isSelected = selectedFeedbackTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedFeedbackTags((prev) =>
                          isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                        );
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience (promptness, behavior, equipment)..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
              />

              <button
                onClick={() => {
                  triggerHaptic('success');
                  onSubmitReview(rating, `${reviewText} [${selectedFeedbackTags.join(', ')}]`);
                  setReviewSubmitted(true);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98"
              >
                Submit Driver Feedback
              </button>
            </div>
          )}

          {reviewSubmitted && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h5 className="font-bold text-sm text-emerald-300">Thank you for your review!</h5>
              <p className="text-xs text-slate-400">Your feedback keeps highway travel safer across India.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
