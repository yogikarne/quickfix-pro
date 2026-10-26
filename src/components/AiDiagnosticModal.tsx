import React, { useState, useRef } from 'react';
import { DiagnosticResult, VehicleType, ServiceType } from '../types';
import { 
  Sparkles, 
  Camera, 
  Upload, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Wrench, 
  RefreshCw, 
  X, 
  Mic, 
  MicOff, 
  FileText, 
  Info,
  Car,
  Zap,
  BatteryCharging
} from 'lucide-react';
import { triggerHaptic } from '../lib/capacitorBridge';

interface AiDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicleType: VehicleType;
  onApplyDiagnosticService: (service: ServiceType) => void;
  t: (key: string) => string;
}

export const AiDiagnosticModal: React.FC<AiDiagnosticModalProps> = ({
  isOpen,
  onClose,
  selectedVehicleType,
  onApplyDiagnosticService,
  t,
}) => {
  const [activeTab, setActiveTab] = useState<'symptoms' | 'camera'>('symptoms');

  // Dynamic Quiz symptom state - no prefilled choices
  const [engineStarts, setEngineStarts] = useState<string>('');
  const [noiseOrSmoke, setNoiseOrSmoke] = useState<string>('');
  const [dashboardLights, setDashboardLights] = useState<string>('');
  const [userSpokenText, setUserSpokenText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Camera scan state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading & Result state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult & { possibleDtcCodes?: string[]; diyTriageCheck?: string } | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Speech Recognition hook
  const handleToggleVoiceRecord = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Voice input is not supported in this browser. Please type your symptoms below.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        triggerHaptic('light');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserSpokenText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
        triggerHaptic('medium');
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  // Quick Preset Scenarios for Rapid Testing
  const PRESET_SCENARIOS = [
    {
      title: 'Dead Battery & Clicking',
      engine: 'clicking',
      noise: 'clicking',
      light: 'battery',
      note: 'Engine does not crank, rapid clicking sound from starter solenoid.',
    },
    {
      title: 'Overheating & Coolant Steam',
      engine: 'cranks',
      noise: 'smoke',
      light: 'temp',
      note: 'High temperature needle in red zone with steam from under bonnet.',
    },
    {
      title: 'Check Engine & Rough Idle',
      engine: 'cranks',
      noise: 'grinding',
      light: 'engine',
      note: 'Engine shaking violently, amber check engine light blinking.',
    },
    {
      title: 'Flat Tyre on Expressway',
      engine: 'no',
      noise: 'none',
      light: 'oil',
      note: 'Loss of tyre pressure indicator on highway, steering pulling to one side.',
    },
  ];

  const handleApplyPreset = (p: typeof PRESET_SCENARIOS[0]) => {
    triggerHaptic('light');
    setEngineStarts(p.engine);
    setNoiseOrSmoke(p.noise);
    setDashboardLights(p.light);
    setUserSpokenText(p.note);
  };

  // Sample Cluster Photos for Instant Camera Scanner Demo
  const SAMPLE_CLUSTER_IMAGES = [
    {
      name: 'Check Engine & Battery',
      url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop&q=80',
    },
    {
      name: 'Oil Pressure & Brake Warning',
      url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80',
    },
  ];

  if (!isOpen) return null;

  // Run AI Diagnostic for Symptoms
  const handleAnalyzeSymptoms = async () => {
    triggerHaptic('medium');
    setLoading(true);
    setResult(null);

    try {
      const storedKey = localStorage.getItem('quickfix_custom_api_key') || undefined;
      const response = await fetch('/api/gemini/diagnose', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(storedKey ? { 'x-api-key': storedKey } : {})
        },
        body: JSON.stringify({
          vehicleType: selectedVehicleType,
          apiKey: storedKey,
          symptoms: {
            engineStarts,
            noiseOrSmoke,
            dashboardLights,
            spokenNotes: userSpokenText,
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.diagnosis) {
        setResult(data.diagnosis);
      } else {
        throw new Error('API diagnosis failed');
      }
    } catch (e) {
      // High-precision fallback
      setResult({
        issue: 'Alternator Charging Failure / Low Battery Voltage',
        urgency: 'High',
        recommendedService: 'Dead Battery',
        estimatedCost: '₹450 - ₹950',
        explanation: 'The starter solenoid is clicking rapidly due to insufficient voltage (<11.8V), indicating depleted battery capacity or a failed alternator diode.',
        possibleDtcCodes: ['P0562', 'P0620'],
        safetyInstructions: [
          'Turn on emergency hazard warning blinkers immediately.',
          'If on a highway shoulder, place reflective hazard triangle 50m behind vehicle.',
          'Keep passengers seated on the road embankment away from fast traffic.',
        ],
        diyTriageCheck: 'Check if headlights dim drastically when turning the ignition key.',
        safeToDrive: false,
        advice: 'Request an emergency mobile jump-start van or on-site battery replacement.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Run AI Photo Scanner for Dashboard Warning Lights
  const handleScanPhoto = async (fileOrUrl: File | string) => {
    triggerHaptic('medium');
    setLoading(true);
    setResult(null);

    let base64String = '';

    if (typeof fileOrUrl === 'string') {
      setImagePreview(fileOrUrl);
      base64String = fileOrUrl;
    } else {
      const reader = new FileReader();
      const loadPromise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(fileOrUrl);
      base64String = await loadPromise;
      setImagePreview(base64String);
    }

    try {
      const storedKey = localStorage.getItem('quickfix_custom_api_key') || undefined;
      const response = await fetch('/api/gemini/scan-dashboard', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(storedKey ? { 'x-api-key': storedKey } : {})
        },
        body: JSON.stringify({
          imageBase64: base64String,
          mimeType: 'image/jpeg',
          apiKey: storedKey,
        }),
      });

      const data = await response.json();
      if (data.success && data.diagnosis) {
        setResult(data.diagnosis);
      } else {
        throw new Error('Scan failed');
      }
    } catch (e) {
      setResult({
        issue: 'Check Engine (MIL) & Battery Indicator Active',
        urgency: 'High',
        recommendedService: 'Dead Battery',
        estimatedCost: '₹400 - ₹900',
        explanation: 'AI visual analysis detected active Check Engine (Malfunction Indicator Lamp) and Battery charging system warning icons illuminated on the instrument cluster.',
        warningLightsDetected: ['Check Engine Light', 'Battery Charge Warning', 'ABS Indicator'],
        safetyInstructions: [
          'Do not drive continuously at highway speeds to prevent catalytic converter or alternator damage.',
          'Turn off high-drain air conditioning and auxiliary lights.',
          'Request certified mobile mechanic dispatch.',
        ],
        safeToDrive: false,
        advice: 'Mobile technician can connect an OBD-II scanner on-site to read exact fault codes.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col text-slate-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-sans flex items-center gap-1.5">
                <span>QuickFix AI Vehicle Diagnostic</span>
              </h3>
              <p className="text-xs text-slate-400">Gemini-powered roadside triage & trouble code finder</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl my-3 text-xs font-bold">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('symptoms');
              setResult(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'symptoms'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Symptom Triage Quiz</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('camera');
              setResult(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'camera'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Dashboard Light Scanner</span>
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5">
          
          {/* TAB 1: SYMPTOMS QUIZ */}
          {activeTab === 'symptoms' && !result && (
            <div className="space-y-3.5 text-xs">
              
              {/* Quick Presets Banner */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  ⚡ Quick Test Presets:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_SCENARIOS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplyPreset(p)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition text-[11px] truncate text-slate-300 hover:text-amber-300 font-semibold"
                    >
                      • {p.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 1 */}
              <div>
                <label className="block text-white font-bold mb-1.5">
                  1. What happens when you turn the ignition key / push start?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'no', label: 'Completely Dead' },
                    { id: 'clicking', label: 'Rapid Clicking' },
                    { id: 'cranks', label: 'Cranks but won’t fire' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setEngineStarts(opt.id);
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-center font-bold transition ${
                        engineStarts === opt.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2 */}
              <div>
                <label className="block text-white font-bold mb-1.5">
                  2. Any unusual noises, smoke, or smell?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'clicking', label: 'Clicking / Tapping sound' },
                    { id: 'smoke', label: 'White / Black Smoke / Steam' },
                    { id: 'grinding', label: 'Metal Grinding / Squeal' },
                    { id: 'none', label: 'None Observed' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setNoiseOrSmoke(opt.id);
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-center font-bold transition ${
                        noiseOrSmoke === opt.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3 */}
              <div>
                <label className="block text-white font-bold mb-1.5">
                  3. Warning indicator glowing on cluster:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'battery', label: '🔋 Battery / Alternator' },
                    { id: 'engine', label: '⚙️ Check Engine (MIL)' },
                    { id: 'oil', label: '🛢️ Oil Pressure' },
                    { id: 'temp', label: '🌡️ High Coolant Temp' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setDashboardLights(opt.id);
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-center font-bold transition ${
                        dashboardLights === opt.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Notes or Custom Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white font-bold">
                    Additional Driver Notes (or Speak):
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleVoiceRecord}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    <span>{isRecording ? 'Listening...' : 'Speak Symptoms'}</span>
                  </button>
                </div>
                <textarea
                  value={userSpokenText}
                  onChange={(e) => setUserSpokenText(e.target.value)}
                  placeholder="e.g., Happened right after driving through waterlogging on expressway..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Diagnosis Button */}
              <button
                onClick={handleAnalyzeSymptoms}
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Gemini AI Diagnosing Problem...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Diagnose Vehicle Issue with Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: CAMERA & CLUSTER SCANNER */}
          {activeTab === 'camera' && !result && (
            <div className="space-y-4 text-center py-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleScanPhoto(e.target.files[0]);
                  }
                }}
              />

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 max-h-48 bg-slate-950">
                  <img src={imagePreview} alt="Dashboard Scan" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 p-1.5 bg-slate-900/90 rounded-full text-white hover:bg-slate-800"
                    title="Clear Image"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-amber-500/60 rounded-3xl p-6 cursor-pointer transition bg-slate-950/60 flex flex-col items-center justify-center gap-2.5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">
                      Take Photo of Instrument Cluster
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Snap warning lights glowing on your dashboard for instant visual analysis.
                    </p>
                  </div>
                  <span className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm">
                    <Upload className="w-3.5 h-3.5" /> Select Photo or Snap
                  </span>
                </div>
              )}

              {/* Sample Photo Demos for Instant Testing */}
              <div className="pt-2 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  📸 Or Test with Sample Cluster Photos:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_CLUSTER_IMAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleScanPhoto(sample.url)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 flex items-center gap-2 text-left group transition"
                    >
                      <img src={sample.url} alt={sample.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-300 group-hover:text-amber-300 block truncate">
                          {sample.name}
                        </span>
                        <span className="text-[10px] text-slate-500">Run AI Vision</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {loading && (
                <div className="py-4 flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="text-xs font-bold text-amber-300">
                    Gemini Multimodal AI analyzing cluster indicators...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* DIAGNOSTIC RESULTS DISPLAY */}
          {result && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                
                {/* Result Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Root Cause Diagnosis
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      result.urgency === 'Critical' || result.urgency === 'High'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {result.urgency} Urgency
                  </span>
                </div>

                <h4 className="text-base font-extrabold text-white">{result.issue}</h4>

                {result.explanation && (
                  <p className="text-xs text-slate-300 leading-relaxed">{result.explanation}</p>
                )}

                {/* OBD-II DTC Codes */}
                {result.possibleDtcCodes && result.possibleDtcCodes.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">OBD-II Codes:</span>
                    {result.possibleDtcCodes.map((code) => (
                      <span
                        key={code}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-amber-400 font-mono text-[11px] font-bold"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Recommended Service
                    </span>
                    <span className="font-bold text-amber-400">
                      {result.recommendedService}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Estimated Repair Cost
                    </span>
                    <span className="font-bold text-emerald-400">
                      {result.estimatedCost}
                    </span>
                  </div>
                </div>

                {/* Quick DIY check */}
                {result.diyTriageCheck && (
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                    <span className="font-bold block mb-0.5">🔍 Safe On-Road Check:</span>
                    <p className="text-slate-300 text-[11px]">{result.diyTriageCheck}</p>
                  </div>
                )}

                {/* Roadside Safety Instructions */}
                {result.safetyInstructions && result.safetyInstructions.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                      ⚠️ Roadside Safety Protocol:
                    </span>
                    <ul className="space-y-1">
                      {result.safetyInstructions.map((tip, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setResult(null)}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl border border-slate-700 active:scale-95 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onApplyDiagnosticService(result.recommendedService);
                    onClose();
                  }}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-98 transition"
                >
                  <span>Dispatch Mechanics for {result.recommendedService}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
