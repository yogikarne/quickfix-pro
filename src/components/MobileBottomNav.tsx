import React from 'react';
import { Map, Wrench, Sparkles, AlertTriangle, User, WifiOff, List } from 'lucide-react';
import { AppRole } from '../types';
import { triggerHaptic } from '../lib/capacitorBridge';

interface MobileBottomNavProps {
  activeTab: 'map' | 'vendors' | 'ai' | 'sos' | 'profile';
  setActiveTab: (tab: 'map' | 'vendors' | 'ai' | 'sos' | 'profile') => void;
  onOpenSos: () => void;
  onOpenAi: () => void;
  onOpenProfile: () => void;
  providerCount: number;
  isOffline: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSos,
  onOpenAi,
  onOpenProfile,
  providerCount,
  isOffline,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe shadow-2xl">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
        {/* Tab 1: Map View */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('map');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-all ${
            activeTab === 'map'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Map className={`w-5 h-5 ${activeTab === 'map' ? 'scale-110 stroke-[2.5]' : ''}`} />
            {isOffline && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Live Map</span>
        </button>

        {/* Tab 2: Vendor List */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('vendors');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-all ${
            activeTab === 'vendors'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Wrench className={`w-5 h-5 ${activeTab === 'vendors' ? 'scale-110 stroke-[2.5]' : ''}`} />
            {providerCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-amber-500 text-slate-950 font-extrabold text-[9px] px-1 rounded-full min-w-[14px] text-center">
                {providerCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Services</span>
        </button>

        {/* Tab 3: Emergency SOS Center Button */}
        <button
          onClick={() => {
            triggerHaptic('heavy');
            setActiveTab('sos');
            onOpenSos();
          }}
          className="flex flex-col items-center justify-center -mt-5 relative group"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 border-4 border-slate-900 group-active:scale-95 transition-transform">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-[10px] font-extrabold text-red-400 tracking-tight mt-0.5">SOS</span>
        </button>

        {/* Tab 4: AI Diagnostic */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            setActiveTab('ai');
            onOpenAi();
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-all ${
            activeTab === 'ai'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${activeTab === 'ai' ? 'scale-110 stroke-[2.5] text-amber-400' : 'text-slate-400'}`} />
          <span className="text-[10px] tracking-tight">AI Help</span>
        </button>

        {/* Tab 5: Profile / Settings */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('profile');
            onOpenProfile();
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-all ${
            activeTab === 'profile'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'scale-110 stroke-[2.5]' : ''}`} />
          <span className="text-[10px] tracking-tight">Account</span>
        </button>
      </div>
    </div>
  );
};
