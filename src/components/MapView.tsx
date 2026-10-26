import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Provider } from '../types';
import { Navigation2, Layers, ZoomIn, ZoomOut, ExternalLink, Route as RouteIcon } from 'lucide-react';
import { triggerHaptic } from '../lib/capacitorBridge';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCUlxvD9PIOzoevutcXdv91A7LGB_EspN8';

// Subtle dark highway styling for roadside assistance dashboard
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1f2c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1f2c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8e9bb0' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d3dbe8' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7e8b9b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2b3445' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2533' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#a6b4c9' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#d97706' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#92400e' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#252d3d' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0d131f' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d4f68' }],
  },
];

interface MapViewProps {
  userLocation: { lat: number; lng: number; address: string } | null;
  providers: Provider[];
  selectedProviderId: string | null;
  onSelectProvider: (provider: Provider) => void;
  onMapClickPinLocation?: (lat: number, lng: number) => void;
  t: (key: string) => string;
}

// Inner component to handle map camera movements and routes
const MapController: React.FC<{
  userLocation: { lat: number; lng: number; address: string } | null;
  selectedProvider: Provider | null;
}> = ({ userLocation, selectedProvider }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Calculate live route to selected provider using Routes API
  useEffect(() => {
    if (!map || !userLocation) return;

    // Clear previous polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!selectedProvider) return;

    const userLatLng = { lat: userLocation.lat, lng: userLocation.lng };
    const provLatLng = {
      lat: selectedProvider.location.lat,
      lng: selectedProvider.location.lng,
    };

    if (routesLib && (routesLib as any).Route) {
      const request = {
        origin: userLatLng,
        destination: provLatLng,
        travelMode: 'DRIVING' as any,
        fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
      };

      (routesLib as any).Route.computeRoutes(request)
        .then(({ routes }: { routes: any[] }) => {
          if (routes && routes.length > 0) {
            const primaryRoute = routes[0];
            if (typeof primaryRoute.createPolylines === 'function') {
              const newPolylines = primaryRoute.createPolylines();
              newPolylines.forEach((poly: google.maps.Polyline) => {
                poly.setOptions({
                  strokeColor: '#f59e0b',
                  strokeWeight: 5,
                  strokeOpacity: 0.9,
                });
                poly.setMap(map);
              });
              polylinesRef.current = newPolylines;
            }

            if (primaryRoute.viewport) {
              map.fitBounds(primaryRoute.viewport, 60);
              return;
            }
          }
          // Fallback if no path returned
          drawDirectPolyline(userLatLng, provLatLng);
        })
        .catch((err: any) => {
          console.warn('Routes API compute error:', err);
          if (
            err?.message?.includes('OverQuotaMapError') ||
            err?.message?.includes('OVER_QUERY_LIMIT') ||
            err?.status === 429
          ) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
          drawDirectPolyline(userLatLng, provLatLng);
        });
    } else {
      drawDirectPolyline(userLatLng, provLatLng);
    }

    function drawDirectPolyline(
      origin: { lat: number; lng: number },
      dest: { lat: number; lng: number }
    ) {
      if (!map) return;
      const poly = new google.maps.Polyline({
        path: [origin, dest],
        geodesic: true,
        strokeColor: '#f59e0b',
        strokeOpacity: 0.8,
        strokeWeight: 4,
      });
      poly.setMap(map);
      polylinesRef.current.push(poly);

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(dest);
      map.fitBounds(bounds, 60);
    }

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, selectedProvider, userLocation]);

  return null;
};

// Map controls overlay component (recenter, style switch, zoom)
const MapControls: React.FC<{
  userLocation: { lat: number; lng: number } | null;
  mapType: 'roadmap' | 'satellite' | 'hybrid';
  onToggleMapType: () => void;
}> = ({ userLocation, mapType, onToggleMapType }) => {
  const map = useMap();

  const handleRecenter = () => {
    triggerHaptic('light');
    if (map && userLocation) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      map.setZoom(15);
    }
  };

  const handleZoomIn = () => {
    triggerHaptic('light');
    if (map) {
      const current = map.getZoom() || 14;
      map.setZoom(current + 1);
    }
  };

  const handleZoomOut = () => {
    triggerHaptic('light');
    if (map) {
      const current = map.getZoom() || 14;
      map.setZoom(Math.max(1, current - 1));
    }
  };

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
      {/* Recenter Live GPS */}
      <button
        type="button"
        onClick={handleRecenter}
        className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-700/80 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md active:scale-95 transition"
        title="Recenter Live GPS Location"
      >
        <Navigation2 className="w-4 h-4 fill-amber-400" />
      </button>

      {/* Switch Map Layer (Roadmap / Satellite) */}
      <button
        type="button"
        onClick={onToggleMapType}
        className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md active:scale-95 transition"
        title={`Layer: ${mapType === 'satellite' ? 'Roadmap' : 'Satellite'}`}
      >
        <Layers className="w-4 h-4" />
      </button>

      {/* Zoom In */}
      <button
        type="button"
        onClick={handleZoomIn}
        className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md active:scale-95 transition"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {/* Zoom Out */}
      <button
        type="button"
        onClick={handleZoomOut}
        className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md active:scale-95 transition"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
    </div>
  );
};

export const MapView: React.FC<MapViewProps> = ({
  userLocation,
  providers,
  selectedProviderId,
  onSelectProvider,
  onMapClickPinLocation,
}) => {
  const defaultCenter = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lng }
    : { lat: 19.076, lng: 72.8777 };

  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const selectedProvider = providers.find((p) => p.id === selectedProviderId) || null;

  const handleMapClick = useCallback(
    (e: any) => {
      if (e.detail?.latLng && onMapClickPinLocation) {
        triggerHaptic('light');
        onMapClickPinLocation(e.detail.latLng.lat, e.detail.latLng.lng);
      }
    },
    [onMapClickPinLocation]
  );

  const toggleMapType = useCallback(() => {
    triggerHaptic('light');
    setMapType((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'));
  }, []);

  const getGoogleMapsNavUrl = (prov: Provider) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${prov.location.lat},${prov.location.lng}&destination_place_id=${encodeURIComponent(prov.name)}`;
  };

  return (
    <div className="relative w-full h-full min-h-[380px] overflow-hidden bg-slate-950 font-sans">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'routes', 'places', 'geometry']}>
        <Map
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={defaultCenter}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI
          mapTypeId={mapType}
          styles={mapType === 'roadmap' ? DARK_MAP_STYLES : undefined}
          onClick={handleMapClick}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          {/* User Live GPS Marker */}
          {userLocation && (
            <AdvancedMarker
              position={{ lat: userLocation.lat, lng: userLocation.lng }}
              title={userLocation.address || 'Your Live Location'}
              zIndex={999}
            >
              <div className="relative flex items-center justify-center w-8 h-8 pointer-events-none">
                <span className="absolute w-10 h-10 rounded-full bg-amber-500/30 animate-ping" />
                <span className="absolute w-5 h-5 rounded-full bg-amber-400 border-2 border-slate-950 shadow-lg shadow-amber-500/50" />
                <span className="relative w-2 h-2 rounded-full bg-slate-950" />
              </div>
            </AdvancedMarker>
          )}

          {/* Roadside Assistance Provider Markers */}
          {providers.map((prov) => {
            const isSelected = prov.id === selectedProviderId;
            return (
              <AdvancedMarker
                key={prov.id}
                position={{ lat: prov.location.lat, lng: prov.location.lng }}
                title={`${prov.name} • ETA ${prov.etaMinutes}m`}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectProvider(prov);
                }}
                zIndex={isSelected ? 100 : 10}
              >
                <div
                  className={`relative transition-all duration-200 cursor-pointer ${
                    isSelected ? 'scale-125' : 'scale-100 hover:scale-110'
                  }`}
                >
                  {isSelected && (
                    <>
                      <div className="absolute -inset-3 rounded-full bg-amber-500/30 animate-pulse blur-sm" />
                      <div
                        className="absolute -inset-5 rounded-full border border-dashed border-amber-400 animate-spin"
                        style={{ animationDuration: '9s' }}
                      />
                    </>
                  )}
                  <div
                    className={`relative flex items-center justify-center px-2 py-1 rounded-full border ${
                      isSelected
                        ? 'bg-amber-400 border-white shadow-[0_0_18px_rgba(245,158,11,0.7)] text-slate-950 font-black'
                        : 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-md font-bold hover:border-amber-400'
                    } gap-1 text-[11px] backdrop-blur-sm`}
                  >
                    <span className="text-sm">{prov.emoji}</span>
                    <span>{prov.etaMinutes}m</span>
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Route & Viewport Controller */}
          <MapController userLocation={userLocation} selectedProvider={selectedProvider} />

          {/* Interactive Controls Overlay */}
          <MapControls
            userLocation={userLocation}
            mapType={mapType}
            onToggleMapType={toggleMapType}
          />
        </Map>
      </APIProvider>

      {/* Map Relocation Pin Guide */}
      <div className="absolute bottom-3 left-4 z-20 px-3 py-1 bg-slate-950/80 backdrop-blur-md text-amber-300 text-[11px] font-semibold rounded-xl border border-amber-500/20 pointer-events-none shadow-md">
        📍 Tap any spot on Google Maps to relocate emergency dispatch pin
      </div>

      {/* Selected Provider Floating Overlay Badge */}
      {selectedProvider && (
        <div className="absolute top-4 left-4 right-16 z-20 animate-in fade-in slide-in-from-top-2">
          <div className="p-3 bg-slate-950/90 border border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                {selectedProvider.emoji}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-white truncate">
                    {selectedProvider.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <RouteIcon className="w-2.5 h-2.5" />
                    <span>Routing</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="text-emerald-400 font-bold">⏱ {selectedProvider.etaMinutes} mins</span>
                  <span>•</span>
                  <span>📍 {selectedProvider.distanceKm} km away</span>
                  <span>•</span>
                  <span className="text-amber-300 font-semibold">{selectedProvider.priceEstimate}</span>
                </p>
              </div>
            </div>

            <a
              href={getGoogleMapsNavUrl(selectedProvider)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1 shrink-0 active:scale-95 transition shadow-sm"
              title="Launch Google Maps Navigation"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Directions</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
