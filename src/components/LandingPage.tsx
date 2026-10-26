import React, { useState } from 'react';
import { 
  Wrench, 
  Car, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  MapPin, 
  Navigation, 
  Truck, 
  BarChart3, 
  Radio, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  Activity, 
  Clock, 
  Zap, 
  Lock, 
  Globe, 
  Smartphone,
  ChevronRight,
  BatteryCharging,
  Fuel,
  Disc,
  LifeBuoy,
  Users,
  Compass,
  Check,
  ShieldAlert
} from 'lucide-react';
import { AppRole, UserProfile, ServiceType } from '../types';
import { triggerHaptic } from '../lib/capacitorBridge';

interface LandingPageProps {
  currentUser: UserProfile | null;
  onSelectRolePortal: (role: AppRole) => void;
  onSelectService: (service: ServiceType) => void;
  onLaunchAiDiagnosis: () => void;
  onLaunchSos: () => void;
  onOpenAndroid?: () => void;
  onLogout?: () => void;
  t: (key: string) => string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onSelectRolePortal,
  onSelectService,
  onLaunchAiDiagnosis,
  onLaunchSos,
  onOpenAndroid,
  onLogout,
  t,
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'how' | 'radar'>('services');

  // Emergency Services Catalog with Direct Launch Actions
  const EMERGENCY_SERVICES: Array<{
    id: ServiceType;
    title: string;
    tagline: string;
    price: string;
    eta: string;
    icon: React.ReactNode;
    color: string;
    bgGlow: string;
    badge: string;
    features: string[];
    actionLabel: string;
  }> = [
    {
      id: 'Flat Tyre',
      title: 'Flat Tyre & Puncture',
      tagline: 'Tubeless patch, puncture repair, and spare tyre wheel mount on-site.',
      price: 'From ₹299',
      eta: '10 - 15 Mins',
      icon: <Disc className="w-6 h-6 text-amber-400" />,
      color: 'border-amber-500/40 hover:border-amber-400',
      bgGlow: 'from-amber-500/10 via-slate-900 to-slate-950',
      badge: 'Most Requested',
      features: ['Tubeless mushroom plug repair', 'Stepney spare wheel replacement', 'High-pressure air inflation', 'Nitrogen top-up capability'],
      actionLabel: 'Request Tyre Tech',
    },
    {
      id: 'Dead Battery',
      title: 'Battery Jumpstart',
      tagline: '12V/24V high-cranking jumpstart, terminal cleanup, and alternator diagnostic.',
      price: 'From ₹349',
      eta: '8 - 12 Mins',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      color: 'border-yellow-500/40 hover:border-yellow-400',
      bgGlow: 'from-yellow-500/10 via-slate-900 to-slate-950',
      badge: 'Rapid Response',
      features: ['Heavy-duty 12V/24V booster jump', 'Battery health & CCA load test', 'Alternator voltage verification', 'Terminal corrosion scrubbing'],
      actionLabel: 'Request Jumpstart',
    },
    {
      id: 'Towing',
      title: 'Hydraulic Flatbed Tow',
      tagline: 'Zero-drag hydraulic crane bed for luxury cars, SUVs, accident & breakdowns.',
      price: 'From ₹1,199',
      eta: '15 - 20 Mins',
      icon: <Truck className="w-6 h-6 text-sky-400" />,
      color: 'border-sky-500/40 hover:border-sky-400',
      bgGlow: 'from-sky-500/10 via-slate-900 to-slate-950',
      badge: 'Zero-Damage Tow',
      features: ['Full flatbed tilt-tray loading', 'Low-clearance & AWD safe', 'Direct garage/dealer drop-off', 'Expressway toll support'],
      actionLabel: 'Dispatch Tow Truck',
    },
    {
      id: 'EV Charging',
      title: 'Mobile EV Fast Charge',
      tagline: 'Mobile DC emergency charger dispatch providing 25-30 km range rescue.',
      price: 'From ₹599',
      eta: '15 - 20 Mins',
      icon: <BatteryCharging className="w-6 h-6 text-emerald-400" />,
      color: 'border-emerald-500/40 hover:border-emerald-400',
      bgGlow: 'from-emerald-500/10 via-slate-900 to-slate-950',
      badge: 'EV Specialized',
      features: ['CCS2 & Type-2 high-speed charge', 'HV battery temperature check', '30 kW portable fast charger', 'Top-up to nearest fast hub'],
      actionLabel: 'Dispatch EV Charger',
    },
    {
      id: 'Breakdown',
      title: 'Mechanical Breakdown',
      tagline: 'Engine overheating, clutch wire, belt snaps, and brake system triage.',
      price: 'From ₹449',
      eta: '12 - 18 Mins',
      icon: <Wrench className="w-6 h-6 text-rose-400" />,
      color: 'border-rose-500/40 hover:border-rose-400',
      bgGlow: 'from-rose-500/10 via-slate-900 to-slate-950',
      badge: 'Master Mechanic',
      features: ['OBD-II live ECU diagnostic scan', 'Coolant leak & hose temporary fix', 'Alternator/starter testing', 'Brake binding release'],
      actionLabel: 'Dispatch Mechanic',
    },
    {
      id: 'No Fuel',
      title: 'Emergency Fuel Delivery',
      tagline: 'Direct delivery of 5L - 10L sealed petrol or diesel right to your GPS marker.',
      price: 'From ₹199 + Fuel',
      eta: '12 - 15 Mins',
      icon: <Fuel className="w-6 h-6 text-orange-400" />,
      color: 'border-orange-500/40 hover:border-orange-400',
      bgGlow: 'from-orange-500/10 via-slate-900 to-slate-950',
      badge: 'Highway Safe',
      features: ['Certified explosive-safe Jerrycan', 'Petrol & High-Speed Diesel (HSD)', 'Funnel fuel intake filling', 'Primer pump bleed if required'],
      actionLabel: 'Order Fuel Delivery',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      
      {/* PROFESSIONAL UNIFIED HEADER (Eliminates redundant double navbars) */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3 transition-all shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Highway Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/25">
              <Wrench className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">
                  Quick<span className="text-amber-400">Fix</span>
                </span>
                <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  24/7 Network
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                National Roadside Assistance & Fleet Operations
              </p>
            </div>
          </div>

          {/* Center Navigation Shortcuts */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-1 text-xs font-bold text-slate-300">
            <a 
              href="#services" 
              className="px-3 py-1.5 rounded-xl hover:text-white hover:bg-slate-800 transition"
            >
              Emergency Services
            </a>
            <a 
              href="#how-it-works" 
              className="px-3 py-1.5 rounded-xl hover:text-white hover:bg-slate-800 transition"
            >
              How It Works
            </a>
            <a 
              href="#portals" 
              className="px-3 py-1.5 rounded-xl hover:text-white hover:bg-slate-800 transition"
            >
              Stakeholder Portals
            </a>
            <button
              onClick={() => onSelectRolePortal('admin')}
              className="px-3 py-1.5 rounded-xl text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 transition flex items-center gap-1"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Control Room</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Android APK Modal Trigger */}
            {onOpenAndroid && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenAndroid();
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                title="Download Android APK"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Android App</span>
              </button>
            )}

            {/* Direct Instant SOS Beacon */}
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onLaunchSos();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-red-600/30 active:scale-95 transition animate-pulse"
              title="Immediate SOS Highway Broadcast"
            >
              <AlertTriangle className="w-3.5 h-3.5 fill-white text-rose-500" />
              <span>SOS 112/1033</span>
            </button>

            {/* Enter Driver Console */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                onSelectRolePortal('customer');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/25 active:scale-95 transition"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Open Driver App</span>
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION WITH LIVE MAP TELEMETRY */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-48 right-10 w-[350px] h-[250px] bg-blue-500/10 blur-[110px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
          
          {/* Live System Indicator */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-400 text-xs font-black shadow-inner backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>24/7 Roadside Rescue Active Across 32 Expressways & NH</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none">
            Breakdown on Highway? <br className="hidden sm:inline" />
            Help Arrives in <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 underline decoration-amber-500/40">11 Minutes.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            One-tap roadside dispatch for punctured tyres, dead battery jumpstarts, zero-drag flatbed towing, and emergency EV fast charging with live Google Maps tracking.
          </p>

          {/* Dual Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                triggerHaptic('medium');
                onSelectRolePortal('customer');
              }}
              className="px-6 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl flex items-center gap-2.5 shadow-xl shadow-amber-500/30 active:scale-95 transition"
            >
              <Navigation className="w-4 h-4 fill-slate-950" />
              <span>Locate Nearest Mechanic on Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onLaunchAiDiagnosis();
              }}
              className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-extrabold text-sm rounded-2xl flex items-center gap-2.5 shadow-lg active:scale-95 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Run AI Vehicle Diagnostics</span>
            </button>
          </div>

          {/* Current User Session Card if Logged In */}
          {currentUser && (
            <div className="p-3 bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl max-w-md mx-auto text-xs flex items-center justify-between shadow-xl backdrop-blur-md transition">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                  {currentUser.role === 'admin' ? '🏛️' : currentUser.role === 'mechanic' ? '👨‍🔧' : '🚗'}
                </div>
                <div className="text-left truncate">
                  <span className="font-extrabold text-white block truncate">{currentUser.name}</span>
                  <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                    Active Session: {(currentUser.role || 'customer').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectRolePortal(currentUser.role || 'customer')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs active:scale-95 transition"
                >
                  Enter Portal
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs active:scale-95 transition"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Live Highway Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-left">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Avg Highway Arrival</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">11.4 min</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                <span>Certified Recovery Fleets</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono mt-0.5">4,820+</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Digital Transparent Tariff</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">Zero Surge</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                <span>Emergency Integration</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-0.5">1033 / 112</div>
            </div>
          </div>

        </div>
      </section>

      {/* MATCHING SERVICES DIRECT LAUNCH SECTION */}
      <section id="services" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 scroll-mt-20">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-black tracking-widest uppercase text-amber-400">
            One-Tap Matching Roadside Services
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Choose What Happened to Your Vehicle
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Select a service below to instantly launch the live map with nearby specialized patrols filtered and ready to dispatch to your exact GPS pin.
          </p>
        </div>

        {/* 6 Specialized Matching Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {EMERGENCY_SERVICES.map((srv) => (
            <div
              key={srv.id}
              className={`p-6 rounded-3xl bg-gradient-to-b ${srv.bgGlow} border ${srv.color} shadow-2xl relative flex flex-col justify-between group transition-all hover:-translate-y-1`}
            >
              <div className="space-y-4">
                {/* Header row with Icon, Price & ETA */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    {srv.icon}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 block mb-1">
                      {srv.badge}
                    </span>
                    <span className="text-xs font-black text-amber-400 font-mono block">
                      {srv.price}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ETA ~{srv.eta}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {srv.tagline}
                  </p>
                </div>

                {/* Features list */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                  {srv.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-300 text-[11px]">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Action Button -> Launches Matching Service Directly! */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    onSelectService(srv.id);
                  }}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/30 hover:border-amber-500 font-black text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-98 transition shadow-md group-hover:shadow-amber-500/20"
                >
                  <span>{srv.actionLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS - 3 STEP DIVISION */}
      <section id="how-it-works" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-900 scroll-mt-20">
        <div className="text-center space-y-2 max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black tracking-widest uppercase text-amber-400">
            Frictionless Rescue Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            How QuickFix Dispatches Assistance in 3 Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 relative">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">
              01
            </div>
            <h3 className="text-base font-extrabold text-white">Share GPS Pin or Search Highway</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No need to know exact mile markers. Tap "My Live GPS" or type the highway milestone. Google Maps Routes pins your exact stranded spot.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 relative">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm">
              02
            </div>
            <h3 className="text-base font-extrabold text-white">Instant AI Triage & Nearest Dispatch</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scan dashboard warning lights with Gemini AI or select your breakdown category. The system pings verified cranes, vans, and techs within 15 km.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 relative">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm">
              03
            </div>
            <h3 className="text-base font-extrabold text-white">OTP Verification & Transparent Settlement</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mechanic arrives in ~11 mins. Verify with a secure 4-digit code. Pay via transparent UPI or card with zero arbitrary highway surge fee.
            </p>
          </div>
        </div>
      </section>

      {/* DEDICATED STAKEHOLDER PORTALS (Proper Classification & Differentiation) */}
      <section id="portals" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-900 space-y-8 scroll-mt-20">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-black tracking-widest uppercase text-amber-400">
            Multi-Stakeholder Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Specialized Consoles per Role
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Purpose-built workspaces ensuring segregation between civilian drivers, field recovery fleets, and central command dispatchers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* DRIVER PORTAL */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-amber-500/40 hover:border-amber-400 transition-all flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-500/25">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Motorist & Commuter</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                For car owners, motorcyclists, commercial transporters, and EV drivers needing immediate recovery.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">✓ Live Google Maps tracking radar</li>
                <li className="flex items-center gap-2">✓ Gemini AI cluster warning scanner</li>
                <li className="flex items-center gap-2">✓ One-tap emergency SOS broadcast</li>
              </ul>
            </div>

            <button
              onClick={() => onSelectRolePortal('customer')}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <span>Launch Driver App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* MECHANIC / PARTNER PORTAL */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-blue-500/40 hover:border-blue-400 transition-all flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 text-slate-950 flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-500/25">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Mechanic & Tow Operator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                For independent technicians, crane operators, mobile van workshops, and authorized garages.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">✓ Live incident dispatch radar feed</li>
                <li className="flex items-center gap-2">✓ Step-by-step navigation to motorist</li>
                <li className="flex items-center gap-2">✓ Digital payouts with zero commission delay</li>
              </ul>
            </div>

            <button
              onClick={() => onSelectRolePortal('mechanic')}
              className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <span>Partner Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* CONTROL ROOM (ADMIN) */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/40 hover:border-purple-400 transition-all flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500 text-slate-950 flex items-center justify-center text-2xl font-black shadow-lg shadow-purple-500/25">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">National Control Room</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                For highway patrol operations, central dispatch officers, corridor managers, and NHAI liaisons.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">✓ Real-time national highway incident telemetry</li>
                <li className="flex items-center gap-2">✓ 112 & NHAI 1033 escalation bridge</li>
                <li className="flex items-center gap-2">✓ Response time SLAs and safety audit trail</li>
              </ul>
            </div>

            <button
              onClick={() => onSelectRolePortal('admin')}
              className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <span>Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-white">QuickFix Roadside Network</span>
              <span className="text-[11px] text-slate-400 block">India's Unified 24/7 Highway Emergency Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-300 font-semibold">
            <span className="text-rose-400 font-bold">🚨 112 Emergency</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">🛣️ NHAI 1033 Patrol</span>
            <span>•</span>
            <span>Google Maps Platform</span>
            <span>•</span>
            <span>Firebase Security</span>
          </div>

          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} QuickFix. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};
