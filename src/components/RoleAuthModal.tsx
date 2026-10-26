import React, { useState } from 'react';
import { 
  X, 
  Wrench, 
  Car, 
  BarChart3, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ArrowRight, 
  Truck, 
  Key, 
  ShieldAlert,
  ChevronDown,
  MapPin
} from 'lucide-react';
import { AppRole, UserProfile, Vehicle, VehicleType } from '../types';
import { reverseGeocode } from '../lib/nearbyPlacesService';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  registerWithEmail, 
  saveUserProfileToFirestore 
} from '../lib/firebase';
import { triggerHaptic } from '../lib/capacitorBridge';

interface RoleAuthModalProps {
  isOpen: boolean;
  targetRole: AppRole;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  onRoleChange?: (role: AppRole) => void;
  t: (key: string) => string;
}

export const RoleAuthModal: React.FC<RoleAuthModalProps> = ({
  isOpen,
  targetRole,
  onClose,
  onSuccess,
  onRoleChange,
}) => {
  const [activeRole, setActiveRole] = useState<AppRole>(targetRole);
  const [step, setStep] = useState<'auth' | 'details'>('auth');
  const [authMethod, setAuthMethod] = useState<'google' | 'email' | 'phone'>('google');
  const [isRegistering, setIsRegistering] = useState<boolean>(true);

  // Auth inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Authenticated state
  const [authUid, setAuthUid] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhoto, setAuthPhoto] = useState('');

  // Common Profile Inputs
  const [fullName, setFullName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // DRIVER (CUSTOMER) Inputs
  const [emergencyContact, setEmergencyContact] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('Tata Motors');
  const [vehicleModel, setVehicleModel] = useState('Nexon EV');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleColor, setVehicleColor] = useState('White');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [vehicleFuel, setVehicleFuel] = useState<'Petrol' | 'Diesel' | 'EV' | 'Hybrid'>('Petrol');

  // MECHANIC / PARTNER Inputs
  const [workshopName, setWorkshopName] = useState('');
  const [fleetType, setFleetType] = useState('Hydraulic Flatbed Tow Crane');
  const [serviceCapability, setServiceCapability] = useState('Breakdown & Towing');

  // CONTROL ROOM (ADMIN) Inputs
  const [officerBadge, setOfficerBadge] = useState('');
  const [division, setDivision] = useState('NHAI Central Dispatch');
  const [adminPin, setAdminPin] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = (r: AppRole) => {
    triggerHaptic('light');
    setActiveRole(r);
    if (onRoleChange) onRoleChange(r);
    setErrorMsg(null);
  };

  // Google Sign-In
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
        setFullName(gUser.displayName || '');
        if (gUser.phoneNumber) setContactPhone(gUser.phoneNumber);
        setStep('details');
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
        const u = await registerWithEmail(email.trim(), password.trim(), fullName || undefined);
        setAuthUid(u.uid);
        setAuthEmail(u.email || '');
        setStep('details');
      } else {
        const u = await signInWithEmail(email.trim(), password.trim());
        setAuthUid(u.uid);
        setAuthEmail(u.email || '');
        setStep('details');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile OTP
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
      setErrorMsg('Please enter the OTP verification code.');
      return;
    }
    triggerHaptic('success');
    const genUid = `phone_${phone.trim().replace(/\D/g, '')}`;
    setAuthUid(genUid);
    setAuthEmail(`${phone.trim().replace(/\D/g, '')}@quickfix.in`);
    setContactPhone(`+91 ${phone.trim()}`);
    setStep('details');
  };

  // Final Role Profile Creation & Validation
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (activeRole === 'customer') {
      if (!vehicleBrand.trim() || !vehicleModel.trim()) {
        setErrorMsg('Please enter your vehicle brand and model.');
        return;
      }
      if (!vehiclePlate.trim()) {
        setErrorMsg('Please enter your vehicle number plate.');
        return;
      }
    }

    if (activeRole === 'mechanic') {
      if (!workshopName.trim()) {
        setErrorMsg('Please enter your workshop or tow agency name.');
        return;
      }
    }

    if (activeRole === 'admin') {
      // Security PIN verification for National Control Room
      if (adminPin.trim() !== '1033' && adminPin.trim().length < 4) {
        setErrorMsg('Invalid Security Clearance PIN. (Demo Highway Officer PIN: 1033)');
        return;
      }
    }

    setIsLoading(true);
    triggerHaptic('success');

    const primaryVehicle: Vehicle = {
      id: `v_${Date.now()}`,
      name: `${vehicleBrand.trim()} ${vehicleModel.trim()}`.trim() || `${activeRole.toUpperCase()} Support Unit`,
      type: vehicleType,
      plateNumber: vehiclePlate.trim().toUpperCase() || 'MH 02 AB 1234',
      fuelType: vehicleFuel,
      color: vehicleColor || 'White',
      isDefault: true,
    };

    const emergencyContactsList: string[] = ['112 (National Emergency Helpline)', '1033 (NHAI Highway Patrol)'];
    if (emergencyContact.trim()) {
      emergencyContactsList.unshift(
        emergencyContact.trim().startsWith('+91')
          ? emergencyContact.trim()
          : `+91 ${emergencyContact.trim()}`
      );
    }

    const finalProfile: UserProfile = {
      id: authUid || `usr_${activeRole}_${Date.now()}`,
      name: fullName.trim(),
      phone: contactPhone.trim().startsWith('+91') ? contactPhone.trim() : `+91 ${contactPhone.trim() || '9876543210'}`,
      email: authEmail || `${fullName.toLowerCase().replace(/\s+/g, '')}@quickfix.in`,
      avatar:
        authPhoto ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      role: activeRole,
      workshopName: activeRole === 'mechanic' ? workshopName.trim() : undefined,
      vehicleFleetType: activeRole === 'mechanic' ? fleetType : undefined,
      serviceCategory: activeRole === 'mechanic' ? serviceCapability : undefined,
      isPartnerVerified: activeRole === 'mechanic' ? true : undefined,
      adminBadgeId: activeRole === 'admin' ? officerBadge.trim() || 'NCR-1033' : undefined,
      controlRoomStation: activeRole === 'admin' ? division.trim() : undefined,
      emergencyContacts: emergencyContactsList,
      vehicles: [primaryVehicle],
      savedLocations: [
        {
          name: 'Primary Operational Hub',
          address: city.trim() || 'Mumbai, Maharashtra',
          lat: 19.076,
          lng: 72.8777,
        },
      ],
    };

    try {
      await saveUserProfileToFirestore(finalProfile);
    } catch (err) {
      console.warn('Firestore profile save warning:', err);
    }

    setIsLoading(false);
    onSuccess(finalProfile);
  };

  const roleAccentColor =
    activeRole === 'admin'
      ? 'border-purple-500/50 text-purple-400 bg-purple-500/10'
      : activeRole === 'mechanic'
      ? 'border-blue-500/50 text-blue-400 bg-blue-500/10'
      : 'border-amber-500/50 text-amber-400 bg-amber-500/10';

  const roleButtonColor =
    activeRole === 'admin'
      ? 'bg-purple-500 hover:bg-purple-400 text-slate-950'
      : activeRole === 'mechanic'
      ? 'bg-blue-500 hover:bg-blue-400 text-slate-950'
      : 'bg-amber-500 hover:bg-amber-400 text-slate-950';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md text-slate-100 overflow-y-auto select-none font-sans">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 my-auto relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white bg-slate-800 transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Top Header with Role Selector */}
        <div className="space-y-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${
              activeRole === 'admin' ? 'bg-purple-500 text-slate-950' : activeRole === 'mechanic' ? 'bg-blue-500 text-slate-950' : 'bg-amber-500 text-slate-950'
            }`}>
              {activeRole === 'admin' ? <BarChart3 className="w-6 h-6" /> : activeRole === 'mechanic' ? <Wrench className="w-6 h-6" /> : <Car className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  Quick<span className="text-amber-400">Fix</span> Portal Access
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${roleAccentColor}`}>
                  {activeRole === 'admin' ? 'Control Room' : activeRole === 'mechanic' ? 'Partner View' : 'Driver View'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === 'auth' ? 'Step 1: Authenticate identity' : 'Step 2: Role profile & verification setup'}
              </p>
            </div>
          </div>

          {/* Role Switcher Tabs */}
          <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => handleRoleSelect('customer')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeRole === 'customer'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Driver</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('mechanic')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeRole === 'mechanic'
                  ? 'bg-blue-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Mechanic</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeRole === 'admin'
                  ? 'bg-purple-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Control Room</span>
            </button>
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
        {step === 'auth' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Method Tabs */}
            <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthMethod('google')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authMethod === 'google' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authMethod === 'email' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('phone')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authMethod === 'phone' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Phone (+91)
              </button>
            </div>

            {authMethod === 'google' && (
              <div className="space-y-4 py-2 text-center">
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Sign in with verified Google account to authenticate with Firebase Cloud for the{' '}
                  <strong className="text-white">
                    {activeRole === 'admin' ? 'National Control Room' : activeRole === 'mechanic' ? 'Mechanic Partner Portal' : 'Driver Rescue Portal'}
                  </strong>.
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
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {authMethod === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">
                    {isRegistering ? 'Register Portal Account' : 'Sign In with Email'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-amber-400 hover:text-amber-300 font-bold underline"
                  >
                    {isRegistering ? 'Already have account? Sign In' : 'New here? Register'}
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
                      placeholder="account@quickfix.in"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500"
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
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 font-extrabold text-xs rounded-xl shadow-md transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 ${roleButtonColor}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>{isRegistering ? 'Register & Continue' : 'Sign In & Continue'}</span>
                  )}
                </button>
              </form>
            )}

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
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={`w-full py-3 font-extrabold text-xs rounded-xl shadow-md transition active:scale-98 ${roleButtonColor}`}
                    >
                      Send Verification OTP
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3 animate-in fade-in">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-300 text-xs font-semibold">Enter 6-Digit OTP</label>
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
                      className={`w-full py-3 font-extrabold text-xs rounded-xl shadow-md transition active:scale-98 ${roleButtonColor}`}
                    >
                      Verify & Proceed to Profile Setup
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PROFILE DETAILS DIFFERENTIATED PER ROLE */}
        {step === 'details' && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4 animate-in fade-in">
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${roleAccentColor}`}>
              <div>
                <span className="text-xs font-bold block">
                  {activeRole === 'admin'
                    ? 'National Control Room Clearance'
                    : activeRole === 'mechanic'
                    ? 'Service Partner Verification'
                    : 'Driver Account Verification'}
                </span>
                <span className="text-[11px] text-slate-300">{authEmail || 'Verified Session'}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verified
              </span>
            </div>

            {/* Common details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Current Location with Auto-Detect Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 text-xs font-semibold">
                  Current Operational Location / City
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      setIsDetectingLocation(true);
                      triggerHaptic('light');
                      navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                          const lat = pos.coords.latitude;
                          const lng = pos.coords.longitude;
                          const addr = await reverseGeocode(lat, lng);
                          setCity(addr);
                          setIsDetectingLocation(false);
                          triggerHaptic('success');
                        },
                        () => {
                          setIsDetectingLocation(false);
                        },
                        { enableHighAccuracy: true, timeout: 8000 }
                      );
                    }
                  }}
                  disabled={isDetectingLocation}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 active:scale-95 transition"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{isDetectingLocation ? 'Detecting GPS...' : '📍 Auto-Detect My Live Location'}</span>
                </button>
              </div>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Shamshabad, Hyderabad or Bandra, Mumbai"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* ROLE SPECIFIC FIELDS */}

            {/* 1. DRIVER PROFILE */}
            {activeRole === 'customer' && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" />
                  <span>Vehicle & Emergency Setup</span>
                </h4>

                {/* Brand & Model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Vehicle Brand / Make</label>
                    <input
                      type="text"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      placeholder="e.g. Tata, Mahindra, Maruti Suzuki, Hyundai"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Vehicle Model</label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="e.g. Nexon EV, Thar 4x4, Swift, Creta"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* Plate Number & Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Vehicle Registration / Plate No.</label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="e.g. TS 08 EA 1234 / MH 02 EV 9900"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Vehicle Color</label>
                    <input
                      type="text"
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
                      placeholder="e.g. White, Black, Silver, Red"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Vehicle Type & Fuel */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Vehicle Type</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-amber-500"
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
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-amber-500"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="EV">Electric (EV)</option>
                      <option value="Hybrid">Hybrid / CNG</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Emergency SOS Phone (Family / Contact)</label>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+91 98200 99999"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* 2. MECHANIC / PARTNER PROFILE */}
            {activeRole === 'mechanic' && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Workshop & Service Fleet Unit</span>
                </h4>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Workshop / Towing Agency Name</label>
                  <input
                    type="text"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    placeholder="e.g. Express Highway Towing & Recovery"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Fleet Unit Equipment</label>
                    <select
                      value={fleetType}
                      onChange={(e) => setFleetType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-blue-500"
                    >
                      <option value="Hydraulic Flatbed Tow Crane">Hydraulic Flatbed Tow Crane</option>
                      <option value="Mobile Breakdown Van">Mobile Breakdown Workshop Van</option>
                      <option value="Two-Wheeler Mobile Tech">Two-Wheeler Mobile Tech</option>
                      <option value="EV DC Fast Charging Van">EV DC Fast Charging Van</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Primary Capability</label>
                    <select
                      value={serviceCapability}
                      onChange={(e) => setServiceCapability(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-blue-500"
                    >
                      <option value="Breakdown & Towing">Breakdown & Towing</option>
                      <option value="Flat Tyre & Puncture">Flat Tyre & Puncture</option>
                      <option value="Dead Battery Jumpstart">Dead Battery Jumpstart</option>
                      <option value="EV Mobile Fast Charging">EV Mobile Fast Charging</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Operating Highway / City Hub</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai (Western Express Highway & BKC)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* 3. NATIONAL CONTROL ROOM (ADMIN) PROFILE */}
            {activeRole === 'admin' && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>National Highway Dispatch Security Clearance</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Officer Badge ID</label>
                    <input
                      type="text"
                      value={officerBadge}
                      onChange={(e) => setOfficerBadge(e.target.value)}
                      placeholder="e.g. NCR-1033"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Dispatch Division</label>
                    <input
                      type="text"
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      placeholder="NHAI Central Dispatch Sector 1"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-300 text-xs font-semibold">Security PIN Clearance</label>
                    <span className="text-[10px] text-purple-400 font-mono">Demo PIN: 1033</span>
                  </div>
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="Enter Security PIN (1033)"
                    maxLength={6}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-center text-sm font-mono tracking-widest text-white outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 font-extrabold text-sm rounded-2xl shadow-lg transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 ${roleButtonColor}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Configuring Portal Credentials...</span>
                </>
              ) : (
                <>
                  <span>
                    {activeRole === 'admin'
                      ? 'Authorize & Enter Control Room'
                      : activeRole === 'mechanic'
                      ? 'Verify & Enter Partner Portal'
                      : 'Save Profile & Enter Driver Portal'}
                  </span>
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
