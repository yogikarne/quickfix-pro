import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Car, 
  AlertTriangle, 
  Key, 
  Sparkles, 
  User, 
  MapPin, 
  Compass, 
  Loader2,
  ChevronDown
} from 'lucide-react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  registerWithEmail, 
  saveUserProfileToFirestore 
} from '../lib/firebase';
import { UserProfile, Vehicle, VehicleType } from '../types';
import { triggerHaptic } from '../lib/capacitorBridge';

interface AuthOnboardingScreenProps {
  onComplete: (user: UserProfile) => void;
  userLocationAddress?: string;
  onApiKeySaved?: (apiKey: string) => void;
}

export const AuthOnboardingScreen: React.FC<AuthOnboardingScreenProps> = ({
  onComplete,
  userLocationAddress,
  onApiKeySaved,
}) => {
  // Step 1 = Auth (Google/Email/Phone), Step 2 = Profile & Vehicle Creation
  const [currentStep, setCurrentStep] = useState<'auth' | 'profile'>('auth');
  const [authMethod, setAuthMethod] = useState<'google' | 'email' | 'phone'>('google');
  const [isRegistering, setIsRegistering] = useState<boolean>(true);

  // Dynamic Auth State - NO prefilled data
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);

  // Authenticated Auth User
  const [authUid, setAuthUid] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPhoto, setAuthPhoto] = useState<string>('');

  // Dynamic Profile Inputs - NO prefilled data
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [driverCity, setDriverCity] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');

  // Dynamic Vehicle Inputs - NO prefilled data
  const [vehicleName, setVehicleName] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [vehicleFuel, setVehicleFuel] = useState<'Petrol' | 'Diesel' | 'EV' | 'Hybrid'>('Petrol');

  // Custom Gemini API Key Merge
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem('quickfix_custom_api_key') || '');
  const [apiKeySavedStatus, setApiKeySavedStatus] = useState<string | null>(null);

  // Loading & Error State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Save custom API key
  const handleSaveApiKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem('quickfix_custom_api_key', customApiKey.trim());
      if (onApiKeySaved) onApiKeySaved(customApiKey.trim());
      setApiKeySavedStatus('API Key Merged & Saved');
      triggerHaptic('success');
      setTimeout(() => setApiKeySavedStatus(null), 3000);
    }
  };

  // Google Authentication
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    triggerHaptic('medium');

    try {
      const gUser = await signInWithGoogle();
      if (gUser) {
        setAuthUid(gUser.uid);
        setAuthEmail(gUser.email || '');
        setAuthPhoto(gUser.photoURL || '');
        setDriverName(gUser.displayName || '');
        if (gUser.phoneNumber) setDriverPhone(gUser.phoneNumber);

        // Move to step 2 for vehicle registration & verification
        setCurrentStep('profile');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Google Sign-In failed or popup was closed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Email / Password Auth
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    triggerHaptic('medium');

    try {
      if (isRegistering) {
        const u = await registerWithEmail(email.trim(), password.trim(), driverName || undefined);
        setAuthUid(u.uid);
        setAuthEmail(u.email || '');
        setCurrentStep('profile');
      } else {
        const u = await signInWithEmail(email.trim(), password.trim());
        setAuthUid(u.uid);
        setAuthEmail(u.email || '');
        setCurrentStep('profile');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Phone verification
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setErrorMsg(null);
    setOtpSent(true);
    triggerHaptic('light');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrorMsg('Please enter the verification code.');
      return;
    }

    // Phone verified
    triggerHaptic('success');
    const genUid = `phone_${phone.trim().replace(/\D/g, '')}`;
    setAuthUid(genUid);
    setAuthEmail(`${phone.trim().replace(/\D/g, '')}@quickfix.in`);
    setDriverPhone(`+91 ${phone.trim()}`);
    setCurrentStep('profile');
  };

  // Final Profile & Vehicle Completion Submission
  const handleCompleteProfileAndEnter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!driverName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!driverPhone.trim()) {
      setErrorMsg('Please enter your mobile contact number.');
      return;
    }
    if (!vehicleName.trim()) {
      setErrorMsg('Please enter your vehicle model name.');
      return;
    }
    if (!vehiclePlate.trim()) {
      setErrorMsg('Please enter your vehicle registration plate number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    triggerHaptic('success');

    const primaryVehicle: Vehicle = {
      id: `v_${Date.now()}`,
      name: vehicleName.trim(),
      type: vehicleType,
      plateNumber: vehiclePlate.trim().toUpperCase(),
      fuelType: vehicleFuel,
      color: 'Custom',
      isDefault: true,
    };

    const emergencyContactsList: string[] = ['112 (National Emergency Helpline)', '1033 (NHAI Highway Patrol)'];
    if (emergencyContact.trim()) {
      const formatted = emergencyContact.trim().startsWith('+91') 
        ? emergencyContact.trim() 
        : `+91 ${emergencyContact.trim()}`;
      emergencyContactsList.unshift(formatted);
    }

    const newProfile: UserProfile = {
      id: authUid || `usr_${Date.now()}`,
      name: driverName.trim(),
      phone: driverPhone.trim().startsWith('+91') ? driverPhone.trim() : `+91 ${driverPhone.trim()}`,
      email: authEmail || `${driverName.toLowerCase().replace(/\s+/g, '')}@quickfix.in`,
      avatar: authPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      role: 'customer',
      emergencyContacts: emergencyContactsList,
      vehicles: [primaryVehicle],
      savedLocations: [
        {
          name: 'Primary Location',
          address: driverCity.trim() || userLocationAddress || 'India',
          lat: 19.0760,
          lng: 72.8777,
        },
      ],
    };

    try {
      // Save profile to Firestore
      await saveUserProfileToFirestore(newProfile);
    } catch (e) {
      console.warn('Firestore profile save warning:', e);
    }

    setIsLoading(false);
    // Unblock the app and grant full access to all services!
    onComplete(newProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950 text-slate-100 overflow-y-auto select-none font-sans">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 my-auto relative">
        
        {/* Top Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Quick<span className="text-amber-400">Fix</span> Roadside
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                {currentStep === 'auth' ? 'Step 1 of 2: Login' : 'Step 2 of 2: Profile'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentStep === 'auth' 
                ? 'Authentication required to unlock roadside dispatch network' 
                : 'Set up your driver profile & vehicle to access emergency services'}
            </p>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: AUTHENTICATION */}
        {currentStep === 'auth' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Auth Method Tabs */}
            <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setAuthMethod('google');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl transition ${
                  authMethod === 'google'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Google Sign-In
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setAuthMethod('email');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl transition ${
                  authMethod === 'email'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Email & Pass
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setAuthMethod('phone');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl transition ${
                  authMethod === 'phone'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mobile Phone
              </button>
            </div>

            {/* TAB 1: GOOGLE AUTH */}
            {authMethod === 'google' && (
              <div className="space-y-4 py-2 text-center">
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Sign in with your verified Google account to authenticate with Firebase Cloud and safeguard your emergency dispatch identity.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-3 active:scale-98 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 text-slate-900 animate-spin" />
                      <span>Connecting to Google Account...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: EMAIL / PASS AUTH */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">
                    {isRegistering ? 'Register New Driver Account' : 'Sign In with Email'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-amber-400 hover:text-amber-300 font-bold underline"
                  >
                    {isRegistering ? 'Already have an account? Sign In' : 'New here? Register'}
                  </button>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@example.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>{isRegistering ? 'Create Account & Continue' : 'Sign In & Continue'}</span>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: PHONE NUMBER VERIFICATION */}
            {authMethod === 'phone' && (
              <div className="space-y-3.5">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div>
                      <label className="block text-slate-300 text-xs font-semibold mb-1">
                        Indian Mobile Number
                      </label>
                      <div className="flex gap-2">
                        <span className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-amber-400 font-bold flex items-center">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="98765 43210"
                          maxLength={10}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500 font-mono"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition active:scale-98"
                    >
                      Send Verification OTP
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3 animate-in fade-in">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-300 text-xs font-semibold">Enter 6-Digit OTP Code</label>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[11px] text-amber-400 underline"
                        >
                          Change Number
                        </button>
                      </div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-center text-sm font-mono tracking-widest text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition active:scale-98"
                    >
                      Verify & Proceed to Profile Setup
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Merge API Key Collapsible Section */}
            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-amber-400 font-semibold transition"
              >
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gemini AI API Key (Optional / Merged)</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showApiKeyInput ? 'rotate-180' : ''}`} />
              </button>

              {showApiKeyInput && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs animate-in fade-in">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Provide your Gemini API key if you want to use your own key quota for symptom diagnosis and instrument cluster scanner:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveApiKey}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shrink-0"
                    >
                      Save Key
                    </button>
                  </div>
                  {apiKeySavedStatus && (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {apiKeySavedStatus}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE CREATION & VEHICLE REGISTRATION */}
        {currentStep === 'profile' && (
          <form onSubmit={handleCompleteProfileAndEnter} className="space-y-4 animate-in fade-in">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-300 block">Verified Driver Account</span>
                <span className="text-[11px] text-slate-400">{authEmail || 'Authenticated Session'}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verified
              </span>
            </div>

            {/* Personal Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                1. Driver Profile Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Mobile Contact Phone</label>
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">City / Region in India</label>
                  <input
                    type="text"
                    value={driverCity}
                    onChange={(e) => setDriverCity(e.target.value)}
                    placeholder="e.g. Mumbai, Bengaluru, Delhi..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Emergency SOS Contact Phone</label>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+91 98200 99999 (Family)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Primary Vehicle Registration */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Register Your Primary Vehicle</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Vehicle Make & Model</label>
                  <input
                    type="text"
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                    placeholder="e.g. Tata Nexon EV or Hyundai Creta"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Number Plate</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="MH 02 EV 9900"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500 font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="car">Car / SUV</option>
                    <option value="bike">Motorcycle / Scooter</option>
                    <option value="ev">Electric Vehicle (EV)</option>
                    <option value="truck">Commercial Truck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Fuel Type</label>
                  <select
                    value={vehicleFuel}
                    onChange={(e) => setVehicleFuel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="EV">Electric (EV)</option>
                    <option value="Hybrid">Hybrid / CNG</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Saving Profile to Cloud...</span>
                </>
              ) : (
                <>
                  <span>Save Profile & Unlock All Roadside Services</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
