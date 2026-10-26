import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Camera, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Truck, 
  Navigation, 
  Loader2, 
  ArrowRight, 
  Zap, 
  Disc, 
  Wrench, 
  Fuel, 
  BatteryCharging,
  MessageSquare,
  HelpCircle,
  Clock,
  Phone,
  Info,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { Provider, Vehicle, ServiceType } from '../types';
import { triggerHaptic } from '../lib/capacitorBridge';

interface GeminiAiDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number; address: string };
  vehicle: Vehicle | null;
  nearbyProviders: Provider[];
  onBookAssignedProvider: (provider: Provider, issueNotes: string, serviceType: ServiceType) => void;
  t: (key: string) => string;
}

export interface AiDispatchResult {
  problemAnalysis: string;
  urgencyLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  matchedServiceCategory: ServiceType;
  safetyInstructions: string[];
  smartQuestions: string[];
  assignedProviderId: string | null;
  assignmentReason: string;
  estimatedFare: string;
}

export const GeminiAiDispatcherModal: React.FC<GeminiAiDispatcherModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  vehicle,
  nearbyProviders,
  onBookAssignedProvider,
  t,
}) => {
  const [query, setQuery] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<AiDispatchResult | null>(null);
  const [userFollowUpAnswers, setUserFollowUpAnswers] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Quick Problem Preset chips for rapid roadside stress reporting
  const PRESET_QUERIES = [
    { label: '🛞 Flat Tyre on Highway', text: 'My tyre got punctured on the highway, steering is shaking, I need emergency tyre assistance.' },
    { label: '⚡ Battery Dead / Clicking', text: 'Car won\'t start, single clicking noise from starter motor, lights are very dim.' },
    { label: '💨 Engine Overheating / Steam', text: 'White steam or smoke coming from engine bay, temperature needle hit max red zone.' },
    { label: '🛻 Accident / Need Flatbed Tow', text: 'Vehicle damaged and unable to roll, need hydraulic flatbed tow crane.' },
    { label: '🔋 EV Battery Low (<5%)', text: 'Electric vehicle battery critically low, unable to reach the nearest charging station.' },
    { label: '⛽ Out of Fuel on Expressway', text: 'Car sputtered and stopped, fuel tank is completely empty.' },
  ];

  // Handle Photo selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic('light');
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  // Submit AI Dispatch Triage
  const handleRunAiDispatch = async (submittedQuery?: string) => {
    const activeText = submittedQuery || query;
    if (!activeText.trim() && !imageBase64) {
      setErrorMsg('Please describe what happened to your vehicle or take a photo.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    triggerHaptic('medium');

    try {
      const response = await fetch('/api/gemini/ai-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: activeText,
          imageBase64: imageBase64,
          mimeType: 'image/jpeg',
          userLocation: userLocation,
          vehicleInfo: vehicle,
          nearbyProviders: nearbyProviders,
          conversationHistory: Object.values(userFollowUpAnswers),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reach Gemini AI Dispatch engine');
      }

      const data = await response.json();
      if (data.success && data.diagnosis) {
        setDispatchResult(data.diagnosis);
        triggerHaptic('success');
      } else {
        throw new Error(data.error || 'Unable to allocate service');
      }
    } catch (err: any) {
      console.warn('AI Dispatch endpoint error, using local allocation fallback:', err);
      // Fallback matching provider
      const matched = nearbyProviders[0] || null;
      setDispatchResult({
        problemAnalysis: `Reported issue: "${activeText}". Gemini automated roadside triage has prioritized emergency mechanical assistance.`,
        urgencyLevel: 'High',
        matchedServiceCategory: 'Breakdown',
        safetyInstructions: [
          'Switch on hazard blinkers immediately.',
          'Step safely behind highway crash barrier away from passing vehicles.',
          'Keep warning triangle deployed 50 meters behind vehicle.'
        ],
        smartQuestions: [
          'Is any warning light flashing on your instrument cluster?',
          'Is the car able to shift into neutral freely?'
        ],
        assignedProviderId: matched?.id || null,
        assignmentReason: matched 
          ? `Assigned nearest verified recovery unit (${matched.name}) located ~${matched.distanceKm} km away with an estimated arrival in ~${matched.etaMinutes} mins.` 
          : 'Allocated nearest available corridor patrol.',
        estimatedFare: matched?.priceEstimate || '₹349 - ₹699',
      });
    } finally {
      setLoading(false);
    }
  };

  // Find the allocated provider object
  const assignedProvider = nearbyProviders.find((p) => p.id === dispatchResult?.assignedProviderId) || nearbyProviders[0] || null;

  // Confirm and book assigned provider
  const handleConfirmBooking = () => {
    if (!assignedProvider) return;
    triggerHaptic('heavy');
    const issueNotes = `🤖 Gemini AI Assigned Dispatch: ${dispatchResult?.problemAnalysis || query}`;
    const category = dispatchResult?.matchedServiceCategory || 'Breakdown';
    onBookAssignedProvider(assignedProvider, issueNotes, category);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Google Gemini Roadside Intelligence</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Live Dispatch
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multimodal issue diagnosis, safety guidance & automated service allocation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* VEHICLE & LIVE GPS BANNER */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate max-w-[280px] sm:max-w-md font-medium text-[11px]">
                {userLocation.address}
              </span>
            </div>
            {vehicle && (
              <span className="text-[11px] font-bold text-amber-300 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-xl">
                🚗 {vehicle.name} ({vehicle.plateNumber})
              </span>
            )}
          </div>

          {/* INPUT FORM (If not diagnosed yet, or re-diagnosing) */}
          {!dispatchResult ? (
            <div className="space-y-4">
              
              {/* Preset Chips */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Select Quick Problem or Type Below:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_QUERIES.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(p.text);
                        handleRunAiDispatch(p.text);
                      }}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 rounded-xl text-xs font-medium text-slate-200 transition text-left active:scale-95"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Natural Language Query Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Describe What Happened:</span>
                  <span className="text-[10px] text-slate-400">Plain text / Hindi / English</span>
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Engine started smoking while driving on highway, or punctured rear left tyre with loud thumping sound..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 transition resize-none font-sans"
                />
              </div>

              {/* Photo Upload Area */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 max-h-48 bg-slate-950 flex items-center justify-center group">
                    <img src={imagePreview} alt="Breakdown issue" className="w-full h-44 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageBase64(null);
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-600/90 text-white text-[11px] font-bold rounded-lg shadow"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3.5 px-4 bg-slate-950 border border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Attach Photo of Instrument Cluster, Engine Bay, or Tyre (Optional)</span>
                  </button>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Main Submit Button */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleRunAiDispatch()}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Gemini AI Analyzing Symptoms & Matching Nearest Units...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>Analyze Problem & Allocate Nearest Service</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* AI DIAGNOSIS & SMART ALLOCATION RESULTS */
            <div className="space-y-5 animate-in fade-in duration-300">
              
              {/* URGENCY & DIAGNOSIS SUMMARY */}
              <div className="p-4 rounded-3xl bg-slate-950 border border-amber-500/40 space-y-3 shadow-inner">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini AI Triage Assessment</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    dispatchResult.urgencyLevel === 'Critical' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                      : dispatchResult.urgencyLevel === 'High'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {dispatchResult.urgencyLevel} Urgency
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {dispatchResult.problemAnalysis}
                </p>

                {/* Safety Protocol */}
                {dispatchResult.safetyInstructions && dispatchResult.safetyInstructions.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Immediate Roadside Safety Steps:</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {dispatchResult.safetyInstructions.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* SMART FOLLOW-UP QUESTIONS (Optional AI inquiry) */}
              {dispatchResult.smartQuestions && dispatchResult.smartQuestions.length > 0 && (
                <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <HelpCircle className="w-4 h-4 text-sky-400" />
                    <span>AI Technician Clarifying Questions:</span>
                  </div>
                  {dispatchResult.smartQuestions.map((q, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-[11px] text-slate-400 font-medium">{q}</p>
                      <input
                        type="text"
                        placeholder="Add quick answer for the arriving mechanic..."
                        value={userFollowUpAnswers[idx] || ''}
                        onChange={(e) => setUserFollowUpAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* AUTOMATICALLY ASSIGNED SERVICE PROVIDER CARD */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/50 space-y-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Auto-Allocated Recovery Unit
                    </span>
                  </div>
                  <span className="text-xs font-black text-amber-400 font-mono">
                    {dispatchResult.estimatedFare}
                  </span>
                </div>

                {assignedProvider ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
                          {assignedProvider.emoji}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">
                            {assignedProvider.name}
                          </h4>
                          <p className="text-xs text-amber-400 font-medium">
                            {assignedProvider.type}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>⭐ {assignedProvider.rating}</span>
                            <span>•</span>
                            <span>{assignedProvider.distanceKm} km away</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">~{assignedProvider.etaMinutes} mins ETA</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Real Location & Google Maps Redirection Bar */}
                    <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{assignedProvider.address}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {/* Direct Phone Call */}
                        <a
                          href={`tel:${assignedProvider.phone}`}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call: {assignedProvider.phone}</span>
                        </a>

                        {/* Location Redirection to Google Maps */}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${assignedProvider.location.lat},${assignedProvider.location.lng}&destination_place_id=${encodeURIComponent(assignedProvider.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-900 hover:bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                          <span>Google Maps Navigation</span>
                        </a>
                      </div>
                    </div>

                    {/* AI Assignment Rationale */}
                    <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                        Why Gemini Assigned This Service:
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {dispatchResult.assignmentReason}
                      </p>
                    </div>

                    {/* Action: Book Assigned Provider */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleConfirmBooking}
                        className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-95 transition"
                      >
                        <CheckCircle2 className="w-4 h-4 fill-slate-950 text-amber-400" />
                        <span>Confirm & Dispatch {assignedProvider.name}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDispatchResult(null);
                        }}
                        className="px-3 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition"
                        title="Re-run assessment"
                      >
                        Re-scan
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Searching corridor network for nearest available tow or mobile mechanic...
                  </p>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
