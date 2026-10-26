import React, { useState } from 'react';
import { Wrench, Bell, User, Globe, ShieldCheck, Activity, BarChart3, ChevronDown, Smartphone } from 'lucide-react';
import { AppRole, LanguageCode } from '../types';
import { LANGUAGES } from '../data/translations';
import { PWAInstallButton } from './PWAInstallBanner';
import { triggerHaptic } from '../lib/capacitorBridge';

interface NavbarProps {
  currentRole: AppRole | 'landing';
  onSelectRole: (role: AppRole) => void;
  onOpenLanding?: () => void;
  currentLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenAndroid?: () => void;
  userName?: string;
  userRole?: AppRole;
  onLogout?: () => void;
  t: (key: string) => string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  onOpenLanding,
  currentLang,
  onSelectLang,
  unreadCount,
  onOpenNotifications,
  onOpenProfile,
  onOpenAndroid,
  userName,
  userRole,
  onLogout,
  t,
}) => {
  const [langOpen, setLangOpen] = useState(false);
  const activeLangObj = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2.5 shadow-md text-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand Logo - Returns to Common Landing Page */}
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => {
            triggerHaptic('light');
            if (onOpenLanding) onOpenLanding();
            else onSelectRole('customer');
          }}
          title="Return to QuickFix Common Landing Page"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-extrabold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold font-sans tracking-tight text-white group-hover:text-amber-300 transition-colors">
                Quick<span className="text-amber-400">Fix</span>
              </span>
              <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                App
              </span>
            </div>
          </div>
        </div>

        {/* Role Mode Switcher & Portal Selector */}
        <div className="flex items-center p-1 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-semibold">
          {onOpenLanding && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenLanding();
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentRole === 'landing'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="View All Stakeholder Portals"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Landing Page</span>
            </button>
          )}

          <button
            onClick={() => onSelectRole('customer')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentRole === 'customer'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('roleCustomer')}</span>
          </button>
          <button
            onClick={() => onSelectRole('mechanic')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentRole === 'mechanic'
                ? 'bg-blue-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('roleMechanic')}</span>
          </button>
          <button
            onClick={() => onSelectRole('admin')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentRole === 'admin'
                ? 'bg-purple-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('roleAdmin')}</span>
          </button>
        </div>

        {/* Right Actions: Install App, Multilingual, Notifications & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Android App Hub Button */}
          {onOpenAndroid && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenAndroid();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Android Application Hub & APK Build Guide"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Android App</span>
            </button>
          )}

          {/* PWA Install Button */}
          <div className="hidden xs:block">
            <PWAInstallButton compact={true} />
          </div>

          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition-all shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeLangObj.flag}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 text-slate-100">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onSelectLang(lang.code);
                      setLangOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      currentLang === lang.code
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 transition-all active:scale-95 shadow-sm"
            title={t('notifications')}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 transition-all active:scale-95 shadow-sm"
            title={t('profile')}
          >
            <User className="w-4 h-4 text-amber-400" />
            {userName && (
              <span className="hidden sm:inline font-bold text-xs text-white max-w-[100px] truncate">
                {userName}
              </span>
            )}
            {userRole && (
              <span className={`hidden md:inline text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                userRole === 'admin' 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                  : userRole === 'mechanic' 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {userRole}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
