import React, { useState, useMemo } from 'react';
import { Provider, ServiceType, VehicleType } from '../types';
import { 
  GMAPS_SEARCH_CATEGORIES, 
  getDirectGmapsSearchUrl 
} from '../lib/nearbyPlacesService';
import { 
  ExternalLink, 
  Star, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Search, 
  Sparkles, 
  Navigation, 
  Wrench, 
  Battery, 
  Key, 
  Fuel, 
  Disc, 
  Zap, 
  Truck, 
  AlertTriangle, 
  IndianRupee,
  RefreshCw,
  PhoneCall,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { triggerHaptic } from '../lib/capacitorBridge';

interface VendorListProps {
  providers: Provider[];
  selectedProviderId: string | null;
  onSelectProvider: (provider: Provider) => void;
  onBookProvider: (provider: Provider) => void;
  activeServiceFilter: ServiceType | 'All';
  onSelectServiceFilter: (service: ServiceType | 'All') => void;
  selectedVehicleType: VehicleType;
  userLocation: { lat: number; lng: number; address: string };
  isFetchingLive: boolean;
  onRefreshLivePlaces: () => void;
  t: (key: string) => string;
}

export const VendorList: React.FC<VendorListProps> = ({
  providers,
  selectedProviderId,
  onSelectProvider,
  onBookProvider,
  activeServiceFilter,
  onSelectServiceFilter,
  selectedVehicleType,
  userLocation,
  isFetchingLive,
  onRefreshLivePlaces,
  t,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'eta' | 'rating' | 'price'>('distance');

  const SERVICE_CHIPS: { label: ServiceType | 'All'; icon: React.ReactNode }[] = [
    { label: 'All', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
    { label: 'Mechanic', icon: <Wrench className="w-3.5 h-3.5 text-blue-400" /> },
    { label: 'Petrol Pump', icon: <Fuel className="w-3.5 h-3.5 text-amber-500" /> },
    { label: 'Towing', icon: <Truck className="w-3.5 h-3.5 text-purple-400" /> },
    { label: 'Puncture Repair', icon: <Disc className="w-3.5 h-3.5 text-slate-300" /> },
    { label: 'Dead Battery', icon: <Battery className="w-3.5 h-3.5 text-amber-400" /> },
    { label: 'EV Charging', icon: <Zap className="w-3.5 h-3.5 text-emerald-400" /> },
    { label: 'Locked Out', icon: <Key className="w-3.5 h-3.5 text-blue-400" /> },
  ];

  // Memoized filter and sort for maximum runtime efficiency
  const filteredAndSortedProviders = useMemo(() => {
    let list = providers.filter((p) => {
      // Service filter
      if (activeServiceFilter !== 'All' && !p.skills.includes(activeServiceFilter)) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchType = p.type.toLowerCase().includes(q);
        const matchAddress = p.address.toLowerCase().includes(q);
        const matchSkill = p.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchName && !matchType && !matchAddress && !matchSkill) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
      if (sortBy === 'eta') return a.etaMinutes - b.etaMinutes;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price') return a.baseInspectionFee - b.baseInspectionFee;
      return 0;
    });
  }, [providers, activeServiceFilter, searchQuery, sortBy]);

  const getGoogleMapsNavUrl = (prov: Provider) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${prov.location.lat},${prov.location.lng}&destination_place_id=${encodeURIComponent(prov.name)}`;
  };

  return (
    <div className="flex flex-col gap-3.5 font-sans select-none text-slate-100">
      
      {/* 1-Click GMaps Search Shortcuts Carousel */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Search Live Google Maps Near Me</span>
          </h4>
          <span className="text-[10px] text-slate-400">Direct Navigation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {GMAPS_SEARCH_CATEGORIES.map((cat) => {
            const url = getDirectGmapsSearchUrl(cat.query, userLocation.lat, userLocation.lng);
            return (
              <a
                key={cat.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 transition flex items-center gap-2 text-left group"
              >
                <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">
                  {cat.iconEmoji}
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 block truncate">
                    {cat.title}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    GMaps <ExternalLink className="w-2.5 h-2.5 text-amber-400" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Search Input & Sort Selector */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mechanics, petrol pumps, towing, puncture repair..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 transition outline-none"
          />
        </div>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-amber-300 font-bold outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="distance">Nearest (km)</option>
          <option value="eta">Fastest (ETA)</option>
          <option value="rating">Top Rated (★)</option>
          <option value="price">Lowest Price (₹)</option>
        </select>
      </div>

      {/* Emergency Service Chips Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {SERVICE_CHIPS.map((chip) => {
          const isSelected = activeServiceFilter === chip.label;
          return (
            <button
              key={chip.label}
              onClick={() => {
                triggerHaptic('light');
                onSelectServiceFilter(chip.label);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {chip.icon}
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* List Header */}
      <div className="flex items-center justify-between text-xs">
        <h3 className="font-extrabold text-white flex items-center gap-2">
          <span>{t('nearbyVendors')}</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
            {filteredAndSortedProviders.length} Verified
          </span>
        </h3>
        <span className="text-[11px] text-slate-400">
          Around {userLocation.address.split(',')[0]}
        </span>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 gap-3">
        {filteredAndSortedProviders.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2.5">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-white">No matching services found</p>
            <p className="text-xs text-slate-400">
              Try switching your filter or search on live Google Maps.
            </p>
            <button
              onClick={() => {
                triggerHaptic('light');
                onSelectServiceFilter('All');
                setSearchQuery('');
              }}
              className="mt-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700"
            >
              Show All Roadside Partners
            </button>
          </div>
        ) : (
          filteredAndSortedProviders.map((prov) => {
            const isSelected = prov.id === selectedProviderId;

            return (
              <div
                key={prov.id}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectProvider(prov);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-2 border-amber-500 shadow-xl ring-2 ring-amber-500/20'
                    : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 shadow-sm'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {prov.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-sm text-white truncate">{prov.name}</h4>
                        {prov.verified && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> {t('verified')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{prov.type}</p>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{prov.rating}</span>
                    <span className="text-[10px] text-slate-500">({prov.reviewsCount})</span>
                  </div>
                </div>

                {/* Address */}
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{prov.address}</span>
                </p>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-3 gap-2 my-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div>
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {t('eta')}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {prov.etaMinutes} mins
                    </span>
                  </div>
                  <div className="border-x border-slate-800">
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {t('distance')}
                    </span>
                    <span className="text-xs font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                      <Navigation className="w-3 h-3 text-amber-400" /> {prov.distanceKm} km
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {t('cost')}
                    </span>
                    <span className="text-xs font-bold text-amber-300 font-mono flex items-center justify-center gap-0.5 mt-0.5">
                      {prov.priceEstimate}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Direct phone call */}
                    <a
                      href={`tel:${prov.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      title="Call Mechanic"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Call</span>
                    </a>

                    {/* Google Maps link */}
                    <a
                      href={getGoogleMapsNavUrl(prov)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      title="Open Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        onSelectProvider(prov);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      {isSelected ? 'Highlighted' : 'Map Pin'}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('medium');
                        onBookProvider(prov);
                      }}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition active:scale-95"
                    >
                      {t('bookNow')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
