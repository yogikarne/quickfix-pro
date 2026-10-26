export type VehicleType = 'car' | 'bike' | 'ev' | 'truck';

export interface Vehicle {
  id: string;
  name: string; // e.g. "Tata Nexon EV" or "Mahindra Thar 4x4"
  type: VehicleType;
  plateNumber: string;
  fuelType: 'Petrol' | 'Diesel' | 'EV' | 'Hybrid';
  color: string;
  isDefault?: boolean;
}

export type ServiceType = 
  | 'Breakdown'
  | 'Mechanic'
  | 'Petrol Pump'
  | 'Towing'
  | 'Toll Plaza'
  | 'Puncture Repair'
  | 'Dead Battery'
  | 'Flat Tyre'
  | 'No Fuel'
  | 'Locked Out'
  | 'EV Charging'
  | 'Maintenance';

export interface Provider {
  id: string;
  name: string;
  type: string; // e.g. "Mobile Mechanic", "Towing & Recovery"
  emoji: string;
  rating: number;
  reviewsCount: number;
  jobsCompleted: number;
  yearsExperience: number;
  etaMinutes: number;
  distanceKm: number;
  priceEstimate: string; // e.g. "₹299 - ₹699"
  baseInspectionFee: number;
  perKmRate: number;
  skills: ServiceType[];
  expertise: VehicleType[];
  verified: boolean;
  phone: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  currentStatus: 'available' | 'busy' | 'offline';
  photoUrl?: string;
}

export interface Booking {
  id: string;
  provider: Provider;
  serviceType: ServiceType;
  vehicle: Vehicle;
  userLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'sent' | 'accepted' | 'en_route' | 'in_progress' | 'completed' | 'cancelled';
  otpCode: string;
  createdAt: string;
  costBreakdown: {
    baseFee: number;
    distanceFee: number;
    emergencySurcharge: number;
    promoDiscount: number;
    total: number;
  };
  paymentStatus: 'pending' | 'paid';
  paymentMethod?: string;
  rating?: number;
  reviewText?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'promo' | 'system' | 'update' | 'sos';
  read: boolean;
  actionUrl?: string;
}

export type AppRole = 'customer' | 'mechanic' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  role: AppRole;
  // Mechanic / Partner specific details
  workshopName?: string;
  serviceCategory?: string; // e.g. "Mobile Mechanic", "Flatbed Towing", "EV Fast Charging"
  vehicleFleetType?: string; // e.g. "Hydraulic Tow Truck", "Mobile Workshop Van"
  operatingCity?: string;
  isPartnerVerified?: boolean;
  // Admin / Control Room specific details
  adminBadgeId?: string;
  controlRoomStation?: string;
  // Driver specific details
  emergencyContacts: string[];
  vehicles: Vehicle[];
  savedLocations: Array<{ name: string; address: string; lat: number; lng: number }>;
}

export type LanguageCode = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'kn' | 'es' | 'fr';

export interface DiagnosticResult {
  issue: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendedService: ServiceType;
  estimatedCost: string;
  explanation?: string;
  safetyInstructions: string[];
  warningLightsDetected?: string[];
  safeToDrive?: boolean;
  advice?: string;
}
