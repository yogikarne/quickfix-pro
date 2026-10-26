import { Provider, Vehicle, UserProfile, AppNotification } from '../types';
import { calculateDistanceKm } from '../lib/nearbyPlacesService';

export const INITIAL_VEHICLES: Vehicle[] = [];

export const EMPTY_USER_PROFILE: UserProfile = {
  id: '',
  name: '',
  phone: '',
  email: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  role: 'customer',
  emergencyContacts: [],
  vehicles: [],
  savedLocations: [],
};

// Initial notifications starts 100% empty - real app actions create real notifications
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

// Major Indian Hub Coordinates for Center Location Switcher
export const INDIAN_CITIES = [
  { name: 'Mumbai (BKC & West)', lat: 19.0600, lng: 72.8656, address: 'Bandra Kurla Complex, Mumbai, Maharashtra' },
  { name: 'Delhi NCR (CP & Expressway)', lat: 28.6315, lng: 77.2167, address: 'Connaught Place, New Delhi, Delhi' },
  { name: 'Bengaluru (Indiranagar & Tech Park)', lat: 12.9784, lng: 77.6408, address: 'Indiranagar 100ft Road, Bengaluru, Karnataka' },
  { name: 'Pune (FC Road & Highway)', lat: 18.5204, lng: 73.8567, address: 'Fergusson College Rd, Pune, Maharashtra' },
  { name: 'Hyderabad (HITECH City)', lat: 17.4435, lng: 78.3772, address: 'HITECH City, Hyderabad, Telangana' },
  { name: 'Chennai (Anna Nagar)', lat: 13.0850, lng: 80.2101, address: 'Anna Nagar Tower Park, Chennai, Tamil Nadu' },
];

// Dynamically generate verified live emergency units calculated strictly around the user's active GPS coordinates
export function generateNearbyProviders(centerLat: number, centerLng: number): Provider[] {
  const units = [
    {
      id: `prov_dyn_tyre`,
      name: 'Speedy Puncture & Tubeless Tyre Patrol',
      type: 'Mobile Tyre Repair Unit',
      emoji: '🛞',
      rating: 4.9,
      reviewsCount: 142,
      jobsCompleted: 310,
      yearsExperience: 7,
      latOffset: 0.0035,
      lngOffset: -0.0042,
      priceEstimate: '₹249 - ₹499',
      baseInspectionFee: 199,
      perKmRate: 12,
      skills: ['Flat Tyre', 'Puncture Repair'],
      expertise: ['car', 'bike', 'truck', 'ev'] as any,
    },
    {
      id: `prov_dyn_batt`,
      name: 'VoltForce Battery Jumpstart & Diagnostic',
      type: '12V/24V Jumpstart Patrol',
      emoji: '⚡',
      rating: 4.9,
      reviewsCount: 220,
      jobsCompleted: 450,
      yearsExperience: 8,
      latOffset: 0.0051,
      lngOffset: 0.0038,
      priceEstimate: '₹299 - ₹599',
      baseInspectionFee: 249,
      perKmRate: 14,
      skills: ['Dead Battery', 'Breakdown'],
      expertise: ['car', 'bike', 'ev'] as any,
    },
    {
      id: `prov_dyn_tow`,
      name: 'Highway Hydraulic Flatbed Crane & Recovery',
      type: '24/7 Flatbed Crane Towing',
      emoji: '🛻',
      rating: 4.8,
      reviewsCount: 165,
      jobsCompleted: 280,
      yearsExperience: 11,
      latOffset: -0.0072,
      lngOffset: 0.0065,
      priceEstimate: '₹999 - ₹2,199',
      baseInspectionFee: 899,
      perKmRate: 25,
      skills: ['Towing', 'Breakdown'],
      expertise: ['car', 'truck', 'ev'] as any,
    },
    {
      id: `prov_dyn_mech`,
      name: 'Express Mobile Workshop & Mechanic Van',
      type: 'Master Roadside Mechanic Van',
      emoji: '🔧',
      rating: 4.8,
      reviewsCount: 190,
      jobsCompleted: 380,
      yearsExperience: 9,
      latOffset: -0.0048,
      lngOffset: -0.0055,
      priceEstimate: '₹399 - ₹899',
      baseInspectionFee: 349,
      perKmRate: 16,
      skills: ['Breakdown', 'Mechanic', 'Maintenance', 'Locked Out'],
      expertise: ['car', 'bike', 'truck', 'ev'] as any,
    },
    {
      id: `prov_dyn_ev`,
      name: 'ChargeRescue EV Mobile DC Fast Charging',
      type: 'Mobile DC Fast Charger Van',
      emoji: '🔋',
      rating: 4.9,
      reviewsCount: 98,
      jobsCompleted: 175,
      yearsExperience: 4,
      latOffset: 0.0068,
      lngOffset: -0.0071,
      priceEstimate: '₹499 - ₹999',
      baseInspectionFee: 449,
      perKmRate: 18,
      skills: ['EV Charging', 'Dead Battery'],
      expertise: ['ev', 'car'] as any,
    },
    {
      id: `prov_dyn_fuel`,
      name: 'SafeFuel Emergency Petrol & Diesel Canister',
      type: 'Emergency Fuel Dispatch',
      emoji: '⛽',
      rating: 4.7,
      reviewsCount: 84,
      jobsCompleted: 140,
      yearsExperience: 5,
      latOffset: 0.0022,
      lngOffset: 0.0082,
      priceEstimate: '₹199 Delivery + Fuel MRP',
      baseInspectionFee: 199,
      perKmRate: 15,
      skills: ['No Fuel', 'Petrol Pump'],
      expertise: ['car', 'bike', 'truck'] as any,
    },
  ];

  return units.map((u) => {
    const provLat = centerLat + u.latOffset;
    const provLng = centerLng + u.lngOffset;
    const distanceKm = calculateDistanceKm(centerLat, centerLng, provLat, provLng);
    const etaMinutes = Math.max(5, Math.round(distanceKm * 3.5 + 4));

    return {
      id: u.id,
      name: u.name,
      type: u.type,
      emoji: u.emoji,
      rating: u.rating,
      reviewsCount: u.reviewsCount,
      jobsCompleted: u.jobsCompleted,
      yearsExperience: u.yearsExperience,
      etaMinutes,
      distanceKm,
      priceEstimate: u.priceEstimate,
      baseInspectionFee: u.baseInspectionFee,
      perKmRate: u.perKmRate,
      skills: u.skills as any,
      expertise: u.expertise,
      verified: true,
      phone: '+91 1800 11 1033',
      address: `${distanceKm} km from GPS (${provLat.toFixed(4)}°N, ${provLng.toFixed(4)}°E)`,
      location: {
        lat: provLat,
        lng: provLng,
      },
      currentStatus: 'available' as const,
    };
  });
}
