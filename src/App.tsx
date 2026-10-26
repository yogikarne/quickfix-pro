import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  Vehicle, 
  Provider, 
  Booking, 
  AppNotification, 
  AppRole, 
  LanguageCode, 
  ServiceType, 
  VehicleType 
} from './types';
import { 
  EMPTY_USER_PROFILE, 
  INITIAL_NOTIFICATIONS
} from './data/mockData';
import { 
  fetchLiveNearbyOverpassServices, 
  reverseGeocode,
  forwardGeocode
} from './lib/nearbyPlacesService';
import { 
  saveCachedMapAndServices, 
  loadCachedMapAndServices, 
  formatCacheTime 
} from './lib/cacheService';
import { TRANSLATIONS } from './data/translations';

// Components
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { VendorList } from './components/VendorList';
import { AiDiagnosticModal } from './components/AiDiagnosticModal';
import { SosModal } from './components/SosModal';
import { BookingFlowModal } from './components/BookingFlowModal';
import { ProfileDrawer } from './components/ProfileDrawer';
import { NotificationCenter } from './components/NotificationCenter';
import { MechanicDashboard } from './components/MechanicDashboard';
import { AdminAnalyticsDashboard } from './components/AdminAnalyticsDashboard';
import { AppSplashPreview } from './components/AppSplashPreview';
import { LandingPage } from './components/LandingPage';
import { RoleAuthModal } from './components/RoleAuthModal';
import { GeminiAiDispatcherModal } from './components/GeminiAiDispatcherModal';
import { AuthModal } from './components/AuthModal';
import { AuthOnboardingScreen } from './components/AuthOnboardingScreen';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AndroidAppModal } from './components/AndroidAppModal';
import { initializeNativeAndroid, triggerHaptic } from './lib/capacitorBridge';
import { usePWAInstall } from './lib/usePWAInstall';

// Firebase
import { 
  testFirebaseConnection, 
  db, 
  auth, 
  syncBookingToFirestore, 
  updateFirestoreBookingStatus, 
  saveUserProfileToFirestore,
  fetchUserProfileFromFirestore,
  logoutUser
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, onSnapshot, addDoc } from 'firebase/firestore';

import { 
  Wrench, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  MapPin, 
  Navigation, 
  Car, 
  Lock, 
  CheckCircle2, 
  Search, 
  Globe,
  LogIn,
  RotateCcw,
  Zap,
  LocateFixed,
  Loader2,
  WifiOff,
  HardDrive,
  ArrowRight
} from 'lucide-react';

export default function App() {
  // Splash & Preview State
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // App View & Role State ('landing' | 'customer' | 'mechanic' | 'admin')
  const [viewMode, setViewMode] = useState<'landing' | 'customer' | 'mechanic' | 'admin'>('landing');
  const [role, setRole] = useState<AppRole>('customer');
  const [lang, setLang] = useState<LanguageCode>('en');

  // Mobile App Navigation Tab State
  const [mobileTab, setMobileTab] = useState<'map' | 'vendors' | 'ai' | 'sos' | 'profile'>('map');

  // Dynamic Auth & Role-based Access State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isRoleAuthOpen, setIsRoleAuthOpen] = useState<boolean>(false);
  const [isGeminiDispatcherOpen, setIsGeminiDispatcherOpen] = useState<boolean>(false);
  const [targetAuthRole, setTargetAuthRole] = useState<AppRole>('customer');
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState<boolean>(false);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setGmpQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('quickfix_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id) {
          if (!parsed.role) {
            parsed.role = 'customer';
          }
          return parsed;
        }
      } catch (_) {}
    }
    return null;
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => {
    const saved = localStorage.getItem('quickfix_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.vehicles?.[0]?.id) return parsed.vehicles[0].id;
      } catch (_) {}
    }
    return '';
  });

  // Load initial cached map view and service list if present in LocalStorage
  const cachedData = loadCachedMapAndServices();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address: string }>(() => {
    if (cachedData?.userLocation) {
      return cachedData.userLocation;
    }
    return {
      lat: 19.0760,
      lng: 72.8777,
      address: 'Detecting Live GPS Location...',
    };
  });

  const [addressSearchQuery, setAddressSearchQuery] = useState<string>('');
  const [isSearchingAddress, setIsSearchingAddress] = useState<boolean>(false);

  // Providers & Selected Vendor for HIGHLIGHTING - Strictly real-world places
  const [providers, setProviders] = useState<Provider[]>(() => {
    if (cachedData?.providers && cachedData.providers.length > 0) {
      return cachedData.providers;
    }
    return [];
  });
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(() => {
    if (cachedData?.providers && cachedData.providers.length > 0) {
      return cachedData.providers[0].id;
    }
    return null;
  });
  const [activeServiceFilter, setActiveServiceFilter] = useState<ServiceType | 'All'>('All');
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);

  // Offline / Connectivity & Cache State
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastCacheTime, setLastCacheTime] = useState<number | null>(cachedData?.cachedAt || null);

  // Listen to browser network connectivity changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load real live nearby POIs from Google Maps / OSM Overpass & cache result
  const refreshLiveNearbyServices = async (lat: number, lng: number, customLocationObj?: { lat: number; lng: number; address: string }) => {
    setIsFetchingLive(true);
    const locObj = customLocationObj || { lat, lng, address: userLocation.address };
    try {
      const livePois = await fetchLiveNearbyOverpassServices(lat, lng);
      setProviders(livePois);
      if (livePois.length > 0) {
        setSelectedProviderId(livePois[0].id);
        saveCachedMapAndServices(locObj, livePois);
        setLastCacheTime(Date.now());
      } else {
        setSelectedProviderId(null);
      }
    } catch (e) {
      console.warn('Error loading real live places:', e);
      setProviders([]);
      setSelectedProviderId(null);
    } finally {
      setIsFetchingLive(false);
    }
  };

  // Request Live GPS Location with High Precision
  const handleEnableLiveGps = () => {
    if (navigator.geolocation) {
      setIsFetchingLive(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const addr = await reverseGeocode(lat, lng);
          const newLoc = {
            lat,
            lng,
            address: addr,
          };
          setUserLocation(newLoc);
          await refreshLiveNearbyServices(lat, lng, newLoc);
        },
        async (_err) => {
          console.warn('Live GPS permission error or unavailable, using current location');
          await refreshLiveNearbyServices(userLocation.lat, userLocation.lng, userLocation);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    } else {
      refreshLiveNearbyServices(userLocation.lat, userLocation.lng, userLocation);
    }
  };

  // Auto-trigger Live GPS acquisition on app mount!
  useEffect(() => {
    handleEnableLiveGps();
  }, []);

  // Handle Search Location submit
  const handleSearchAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressSearchQuery.trim()) return;

    setIsSearchingAddress(true);
    try {
      const result = await forwardGeocode(addressSearchQuery);
      if (result) {
        const newLoc = {
          lat: result.lat,
          lng: result.lng,
          address: result.address,
        };
        setUserLocation(newLoc);
        await refreshLiveNearbyServices(result.lat, result.lng, newLoc);
      } else {
        const notif: AppNotification = {
          id: `N-${Date.now()}`,
          title: 'Location Not Found',
          message: 'Please try searching a city, landmark, highway, or PIN code in India.',
          timestamp: 'Just now',
          read: false,
          type: 'system',
        };
        setNotifications((prev) => [notif, ...prev]);
      }
    } catch (err) {
      console.error('Error searching address:', err);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Handle Map Pin Click Location move
  const handleMapClickPinLocation = async (lat: number, lng: number) => {
    setIsFetchingLive(true);
    const addr = await reverseGeocode(lat, lng);
    const newLoc = {
      lat,
      lng,
      address: addr,
    };
    setUserLocation(newLoc);
    await refreshLiveNearbyServices(lat, lng, newLoc);
  };

  // Modals & Panels Visibility
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);

  // PWA & Android install hook
  const { isInstallable, install } = usePWAInstall();

  // Native Android hardware back-button & status bar handling
  useEffect(() => {
    initializeNativeAndroid(() => {
      // Prioritize closing open modals when Android back button is tapped
      if (isAndroidModalOpen) {
        setIsAndroidModalOpen(false);
        return true;
      }
      if (isSosOpen) {
        setIsSosOpen(false);
        return true;
      }
      if (isAiModalOpen) {
        setIsAiModalOpen(false);
        return true;
      }
      if (isBookingModalOpen) {
        setIsBookingModalOpen(false);
        return true;
      }
      if (isProfileOpen) {
        setIsProfileOpen(false);
        return true;
      }
      if (isNotificationsOpen) {
        setIsNotificationsOpen(false);
        return true;
      }
      if (isAuthModalOpen) {
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    });
  }, [
    isAndroidModalOpen,
    isSosOpen,
    isAiModalOpen,
    isBookingModalOpen,
    isProfileOpen,
    isNotificationsOpen,
    isAuthModalOpen,
  ]);

  // Active Booking & History State
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);

  // Notifications List State
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Firebase Auth & Firestore Sync
  useEffect(() => {
    testFirebaseConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const profile = await fetchUserProfileFromFirestore(authUser.uid);
          if (profile && profile.vehicles && profile.vehicles.length > 0) {
            setUser(profile as UserProfile);
            setSelectedVehicleId(profile.vehicles[0].id);
            localStorage.setItem('quickfix_active_user', JSON.stringify(profile));
          } else {
            // Partial user authenticated but needs profile completion
            setUser((prev) => {
              if (prev && prev.vehicles && prev.vehicles.length > 0) return prev;
              return {
                id: authUser.uid,
                name: authUser.displayName || '',
                email: authUser.email || '',
                phone: authUser.phoneNumber || '',
                avatar: authUser.photoURL || '',
                emergencyContacts: [],
                vehicles: [],
                savedLocations: [],
              };
            });
          }
        } catch (e) {
          console.warn('Error syncing profile from Firestore:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Get active vehicle object safely
  const currentVehicle: Vehicle = user?.vehicles?.find((v) => v.id === selectedVehicleId) || user?.vehicles?.[0] || {
    id: 'v_user',
    name: 'Vehicle',
    type: 'car',
    plateNumber: '',
    fuelType: 'Petrol',
    color: 'Standard',
  };

  // Translation helper function
  const t = (key: string): string => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  // Handlers for Dispatching / Booking Services
  const handleBookProvider = (provider: Provider, customIssue?: string, customServiceType?: ServiceType) => {
    triggerHaptic('medium');
    const defaultService: ServiceType = provider.skills[0] || 'Mechanic';
    const chosenService = customServiceType || (activeServiceFilter !== 'All' ? activeServiceFilter : defaultService);

    const baseFee = provider.baseInspectionFee || 299;
    const distanceFee = Math.round(provider.distanceKm * provider.perKmRate);
    const emergencySurcharge = 150;
    const total = baseFee + distanceFee + emergencySurcharge;

    const newBooking: Booking = {
      id: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
      provider: provider,
      serviceType: chosenService,
      vehicle: currentVehicle,
      userLocation: userLocation,
      status: 'sent',
      otpCode: Math.floor(1000 + Math.random() * 9000).toString(),
      createdAt: new Date().toISOString(),
      costBreakdown: {
        baseFee,
        distanceFee,
        emergencySurcharge,
        promoDiscount: 0,
        total,
      },
      paymentStatus: 'pending',
    };

    setActiveBooking(newBooking);
    setIsBookingModalOpen(true);

    // Sync to Firestore for real-world persistence and mechanic dispatch
    syncBookingToFirestore(newBooking);

    const newNotif: AppNotification = {
      id: `N-${Date.now()}`,
      title: 'Emergency Service Requested',
      message: `Dispatching ${provider.name} for ${newBooking.serviceType}. ETA ~${provider.etaMinutes} mins.`,
      timestamp: 'Just now',
      read: false,
      type: 'sos',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Handle Emergency SOS Auto-Dispatch
  const handleSosAutoBook = () => {
    triggerHaptic('heavy');
    const nearest = providers[0];
    if (nearest) {
      handleBookProvider(nearest, '🚨 CRITICAL SOS EMERGENCY DISPATCH: Vehicle breakdown on live coordinates.', 'Towing');
      setIsSosOpen(false);
    } else {
      const notif: AppNotification = {
        id: `N-${Date.now()}`,
        title: 'Emergency Patrol Search',
        message: 'Locating emergency patrol nearby... Please ensure location permissions are enabled.',
        timestamp: 'Just now',
        read: false,
        type: 'sos',
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  // Handle Update Booking Status
  const handleUpdateBookingStatus = (status: Booking['status']) => {
    if (!activeBooking) return;
    const updated = { ...activeBooking, status };
    setActiveBooking(updated);
    updateFirestoreBookingStatus(activeBooking.id, status);
  };

  // Handle Payment & Confirmation
  const handlePayAndConfirm = (paymentMethod: 'UPI' | 'Card' | 'Cash') => {
    if (!activeBooking) return;
    triggerHaptic('success');

    const confirmedBooking: Booking = {
      ...activeBooking,
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod,
    };

    setActiveBooking(confirmedBooking);
    setBookingHistory((prev) => [confirmedBooking, ...prev]);
    syncBookingToFirestore(confirmedBooking);

    const doneNotif: AppNotification = {
      id: `N-${Date.now()}`,
      title: 'Service Completed & Paid',
      message: `₹${confirmedBooking.costBreakdown.total} paid via ${paymentMethod} to ${confirmedBooking.provider.name}.`,
      timestamp: 'Just now',
      read: false,
      type: 'update',
    };
    setNotifications((prev) => [doneNotif, ...prev]);

    setTimeout(() => {
      setIsBookingModalOpen(false);
    }, 1500);
  };

  // Handle Submit Review
  const handleSubmitReview = (rating: number, _comment: string) => {
    if (!activeBooking) return;
    const reviewNotif: AppNotification = {
      id: `N-${Date.now()}`,
      title: 'Review Submitted',
      message: `Thank you for your ${rating}-star review! Your feedback helps drivers stay safe across India.`,
      timestamp: 'Just now',
      read: false,
      type: 'system',
    };
    setNotifications((prev) => [reviewNotif, ...prev]);
    setActiveBooking(null);
    setIsBookingModalOpen(false);
  };

  // Unread notification count
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (_) {}
    localStorage.removeItem('quickfix_active_user');
    setUser(null);
    setSelectedVehicleId('');
    setViewMode('landing');
    setRole('customer');
    triggerHaptic('medium');
  };

  // Handle Role Portal Navigation & Authentication
  const handleSelectRolePortal = (selectedRole: AppRole) => {
    triggerHaptic('medium');
    setRole(selectedRole);

    // If user is not authenticated yet, prompt role authentication modal for this role
    if (!user || !user.id) {
      setTargetAuthRole(selectedRole);
      setIsRoleAuthOpen(true);
      return;
    }

    // Role differentiation security checks:
    if (selectedRole === 'admin' && user.role !== 'admin' && !user.adminBadgeId) {
      setTargetAuthRole('admin');
      setIsRoleAuthOpen(true);
      return;
    }

    if (selectedRole === 'mechanic' && user.role !== 'mechanic' && !user.workshopName) {
      setTargetAuthRole('mechanic');
      setIsRoleAuthOpen(true);
      return;
    }

    // If switching to customer without vehicles
    if (selectedRole === 'customer' && (!user.vehicles || user.vehicles.length === 0)) {
      setTargetAuthRole('customer');
      setIsRoleAuthOpen(true);
      return;
    }

    // Role authorized, switch into portal
    setViewMode(selectedRole);
  };

  const handleRoleAuthSuccess = (newProfile: UserProfile) => {
    setUser(newProfile);
    setRole(newProfile.role);
    setViewMode(newProfile.role);
    if (newProfile.vehicles && newProfile.vehicles.length > 0) {
      setSelectedVehicleId(newProfile.vehicles[0].id);
    }
    localStorage.setItem('quickfix_active_user', JSON.stringify(newProfile));
    setIsRoleAuthOpen(false);
  };

  if (showSplash) {
    return (
      <AppSplashPreview 
        onComplete={() => setShowSplash(false)} 
        onStart={() => setShowSplash(false)} 
        cityName={userLocation.address.split(',')[0] || 'Live Location'}
      />
    );
  }

  return (
    <div className="min-h-screen h-[100dvh] flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden font-sans select-none">
      {/* Google Maps Quota Exceeded Sticky Banner */}
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Mobile Application Install Banner */}
      <PWAInstallBanner />

      {/* Main Top Navigation Header (Shown in partner & admin control consoles; customer view uses full-screen floating map HUD) */}
      {(viewMode === 'mechanic' || viewMode === 'admin') && (
        <Navbar
          currentRole={viewMode}
          onSelectRole={handleSelectRolePortal}
          onOpenLanding={() => setViewMode('landing')}
          currentLang={lang}
          onSelectLang={setLang}
          unreadCount={unreadNotificationsCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenProfile={() => {
            setMobileTab('profile');
            setIsProfileOpen(true);
          }}
          onOpenAndroid={() => setIsAndroidModalOpen(true)}
          userName={user?.name}
          userRole={user?.role}
          onLogout={handleLogout}
          t={t}
        />
      )}

      {/* OFFLINE / CACHE BANNER BAR (Operational View Only) */}
      {viewMode !== 'landing' && (isOffline || lastCacheTime) && (
        <div className="bg-slate-900 border-b border-amber-500/20 px-3 py-1.5 text-xs text-amber-300 flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2 truncate">
            {isOffline ? (
              <span className="flex items-center gap-1.5 font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                <WifiOff className="w-3.5 h-3.5" />
                Offline Mode
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                Offline Cache Saved
              </span>
            )}
            <span className="truncate text-slate-300 text-[11px]">
              {lastCacheTime ? `Cached: ${formatCacheTime(lastCacheTime)}` : 'Live offline context loaded'}
            </span>
          </div>
          <button
            onClick={handleEnableLiveGps}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline shrink-0"
          >
            Refresh GPS
          </button>
        </div>
      )}

      {/* MAIN BODY DEPENDING ON VIEW MODE & ROLE */}
      {viewMode === 'landing' ? (
        <LandingPage
          currentUser={user}
          onSelectRolePortal={handleSelectRolePortal}
          onSelectService={(service) => {
            triggerHaptic('medium');
            setActiveServiceFilter(service);
            setViewMode('customer');
            setRole('customer');
          }}
          onLaunchAiDiagnosis={() => {
            triggerHaptic('light');
            setViewMode('customer');
            setRole('customer');
            setIsGeminiDispatcherOpen(true);
          }}
          onLaunchSos={() => {
            triggerHaptic('heavy');
            setViewMode('customer');
            setRole('customer');
            setIsSosOpen(true);
          }}
          onOpenAndroid={() => setIsAndroidModalOpen(true)}
          onLogout={handleLogout}
          t={t}
        />
      ) : viewMode === 'customer' ? (
        <>
          <main className="flex-1 w-full mx-auto p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 relative pb-20 md:pb-4 overflow-y-auto">
            {/* Left Column: Interactive Google Map as Hero & Floating HUD */}
            <div className={`lg:col-span-7 flex flex-col gap-2 relative ${mobileTab === 'map' ? 'block' : 'hidden md:flex'}`}>
              
              {/* Interactive Google Map Container */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl h-[460px] sm:h-[520px] lg:h-[calc(100vh-2.5rem)] bg-slate-900 group">
                <MapView
                  userLocation={userLocation}
                  providers={providers}
                  selectedProviderId={selectedProviderId}
                  onSelectProvider={(prov) => setSelectedProviderId(prov.id)}
                  onMapClickPinLocation={handleMapClickPinLocation}
                  t={t}
                />

                {/* FLOATING SLEEK TOP HUD (Inside Map) */}
                <div className="absolute top-3 inset-x-3 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
                  
                  {/* Left Pill: Brand + GPS Search */}
                  <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-xl pointer-events-auto">
                    {/* Brand Pill -> Exit to Landing */}
                    <button
                      onClick={() => setViewMode('landing')}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 shadow transition active:scale-95 shrink-0"
                      title="Return to Landing Page"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">QuickFix</span>
                    </button>

                    {/* Search Address Bar */}
                    <form onSubmit={handleSearchAddressSubmit} className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 focus-within:border-amber-500 transition-all w-44 sm:w-60">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
                      <input
                        type="text"
                        value={addressSearchQuery}
                        onChange={(e) => setAddressSearchQuery(e.target.value)}
                        placeholder="Search location in India..."
                        className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isSearchingAddress}
                        className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg transition"
                      >
                        {isSearchingAddress ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Go'}
                      </button>
                    </form>

                    {/* Locate Me GPS Button */}
                    <button
                      onClick={handleEnableLiveGps}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 active:scale-95 transition"
                      title="Locate My Live GPS"
                    >
                      <LocateFixed className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>

                  {/* Right Pill: Gemini Dispatcher + Vehicle + Profile */}
                  <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-xl pointer-events-auto self-end sm:self-auto">
                    {/* Gemini AI Trigger */}
                    <button
                      onClick={() => {
                        setMobileTab('ai');
                        setIsGeminiDispatcherOpen(true);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span className="hidden sm:inline">Gemini AI Dispatch</span>
                      <span className="sm:hidden">AI</span>
                    </button>

                    {/* Vehicle Switcher Pill */}
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-[11px] font-bold text-amber-300 outline-none cursor-pointer max-w-[110px] sm:max-w-[160px] truncate"
                    >
                      {(user?.vehicles || []).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>

                    {/* Profile Button */}
                    <button
                      onClick={() => setIsProfileOpen(true)}
                      className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center transition active:scale-95"
                      title="Open Profile Drawer"
                    >
                      {user?.name ? user.name[0].toUpperCase() : '👤'}
                    </button>
                  </div>

                </div>

                {/* FLOATING SOS EMERGENCY DISPATCH FAB BUTTON */}
                <button
                  onClick={() => {
                    setMobileTab('sos');
                    setIsSosOpen(true);
                  }}
                  className="absolute bottom-4 right-4 z-20 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold font-sans text-xs tracking-wider rounded-2xl shadow-xl shadow-red-600/40 flex items-center gap-2 border-2 border-slate-900 animate-pulse transition-all active:scale-95"
                >
                  <AlertTriangle className="w-5 h-5 fill-white text-rose-500" />
                  <span>{t('sos')}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Search & Nearby Vendor Cards */}
            <div className={`lg:col-span-5 flex flex-col gap-4 ${mobileTab === 'vendors' || mobileTab === 'map' ? 'block' : 'hidden md:flex'}`}>
              
              {/* Google Gemini AI Smart Auto-Allocation Banner */}
              <div 
                onClick={() => {
                  triggerHaptic('medium');
                  setIsGeminiDispatcherOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-amber-950/40 border border-amber-500/40 cursor-pointer hover:border-amber-400 transition-all shadow-lg flex items-center justify-between gap-3 text-slate-100 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs text-white">
                        Gemini AI Smart Dispatcher
                      </h4>
                      <span className="text-[9px] uppercase font-black bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md border border-amber-500/30">
                        Auto-Assign
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium line-clamp-1">
                      Describe issue or snap photo — Gemini AI auto-allocates nearest recovery unit
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1.5 bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1 shrink-0 shadow transition">
                  <span>Start</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Active Booking Banner Quick Link */}
              {activeBooking && (
                <div
                  onClick={() => setIsBookingModalOpen(true)}
                  className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-all shadow-md flex items-center justify-between gap-3 text-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                    <div>
                      <h4 className="font-bold text-xs text-white font-sans">
                        Live Emergency Job #{activeBooking.id.slice(-6)}
                      </h4>
                      <p className="text-[11px] text-amber-300 font-medium">
                        Status: {(activeBooking.status || 'SENT').toUpperCase()} • {activeBooking.provider.name}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl font-sans">
                    Track
                  </span>
                </div>
              )}

              {/* Vendor List */}
              <VendorList
                providers={providers}
                selectedProviderId={selectedProviderId}
                onSelectProvider={(prov) => setSelectedProviderId(prov.id)}
                onBookProvider={(prov) => handleBookProvider(prov)}
                activeServiceFilter={activeServiceFilter}
                onSelectServiceFilter={setActiveServiceFilter}
                selectedVehicleType={currentVehicle.type}
                userLocation={userLocation}
                isFetchingLive={isFetchingLive}
                onRefreshLivePlaces={() => refreshLiveNearbyServices(userLocation.lat, userLocation.lng)}
                t={t}
              />
            </div>
          </main>
        </>
      ) : viewMode === 'mechanic' ? (
        <main className="flex-1 py-4 px-3 sm:px-6 pb-20 md:pb-6 overflow-y-auto">
          <MechanicDashboard
            user={user}
            activeBooking={activeBooking}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onSimulateIncomingJob={() => {
              const prov = providers[0];
              if (prov) handleBookProvider(prov, 'Simulated Highway Breakdown', 'Mechanic');
            }}
            t={t}
          />
        </main>
      ) : (
        <main className="flex-1 py-4 px-3 sm:px-6 pb-20 md:pb-6 overflow-y-auto">
          <AdminAnalyticsDashboard user={user} />
        </main>
      )}

      {/* MOBILE BOTTOM TAB BAR (Customer View Only) */}
      {viewMode === 'customer' && (
        <MobileBottomNav
          activeTab={mobileTab}
          setActiveTab={setMobileTab}
          onOpenSos={() => setIsSosOpen(true)}
          onOpenAi={() => setIsGeminiDispatcherOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          providerCount={providers.length}
          isOffline={isOffline}
        />
      )}

      {/* MODALS & DRAWERS */}
      <GeminiAiDispatcherModal
        isOpen={isGeminiDispatcherOpen}
        onClose={() => setIsGeminiDispatcherOpen(false)}
        userLocation={userLocation}
        vehicle={currentVehicle}
        nearbyProviders={providers}
        onBookAssignedProvider={(provider, notes, serviceType) => {
          handleBookProvider(provider, notes, serviceType);
        }}
        t={t}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(loggedUser) => {
          setUser((prev) => ({
            ...prev,
            id: loggedUser.uid,
            name: loggedUser.name,
            email: loggedUser.email,
            phone: loggedUser.phone,
            avatar: loggedUser.avatar || prev.avatar,
          }));
        }}
        t={t}
      />

      <AiDiagnosticModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        selectedVehicleType={currentVehicle.type}
        onApplyDiagnosticService={(service) => {
          setActiveServiceFilter(service);
          setIsAiModalOpen(false);
          setMobileTab('vendors');
        }}
        t={t}
      />

      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        userLocation={userLocation}
        onAutoBookNearest={handleSosAutoBook}
        nearestProvider={providers[0] || null}
        t={t}
      />

      <BookingFlowModal
        booking={activeBooking}
        onClose={() => setIsBookingModalOpen(false)}
        onUpdateBookingStatus={handleUpdateBookingStatus}
        onPayAndConfirm={handlePayAndConfirm}
        onSubmitReview={handleSubmitReview}
        t={t}
      />

      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user || EMPTY_USER_PROFILE}
        onUpdateUser={setUser}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={setSelectedVehicleId}
        bookingHistory={bookingHistory}
        onOpenAndroid={() => setIsAndroidModalOpen(true)}
        onOpenLanding={() => setViewMode('landing')}
        onSwitchRole={handleSelectRolePortal}
        onLogout={handleLogout}
        t={t}
      />

      <RoleAuthModal
        isOpen={isRoleAuthOpen}
        targetRole={targetAuthRole}
        onClose={() => setIsRoleAuthOpen(false)}
        onSuccess={handleRoleAuthSuccess}
        onRoleChange={(r) => setTargetAuthRole(r)}
        t={t}
      />

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        t={t}
      />

      {/* Android Native Hub & Build Modal */}
      <AndroidAppModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        onInstallPwa={install}
        canInstallPwa={isInstallable}
      />
    </div>
  );
}
