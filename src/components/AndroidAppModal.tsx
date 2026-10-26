import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Cpu,
  Shield,
  Layers,
  FileCode,
  Download,
  ExternalLink,
  Vibrate,
  Navigation,
  Camera,
  PhoneCall,
  Wifi,
  Sparkles,
  X
} from 'lucide-react';
import { triggerHaptic, isNativeAndroid } from '../lib/capacitorBridge';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({
  isOpen,
  onClose,
  onInstallPwa,
  canInstallPwa,
}) => {
  const [activeTab, setActiveTab] = useState<'build' | 'permissions' | 'files' | 'test'>('build');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hapticStatus, setHapticStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    triggerHaptic('light');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestHaptic = async (type: 'light' | 'medium' | 'heavy' | 'warning') => {
    triggerHaptic(type);
    setHapticStatus(`Haptic impulse (${type.toUpperCase()}) triggered!`);
    setTimeout(() => setHapticStatus(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <Smartphone className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Android Application Hub</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Package: <code className="text-amber-400 font-mono">com.quickfix.roadside</code> (Target SDK 36 / Android 15)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('build');
              triggerHaptic('light');
            }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'build'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Build & APK Export
          </button>

          <button
            onClick={() => {
              setActiveTab('permissions');
              triggerHaptic('light');
            }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Android Permissions
          </button>

          <button
            onClick={() => {
              setActiveTab('files');
              triggerHaptic('light');
            }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'files'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Project Files
          </button>

          <button
            onClick={() => {
              setActiveTab('test');
              triggerHaptic('light');
            }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'test'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Vibrate className="w-3.5 h-3.5" />
            Hardware Test
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: BUILD & APK */}
          {activeTab === 'build' && (
            <div className="space-y-4">
              {/* Quick Status Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-emerald-300">Native Android Platform Generated</div>
                  <div className="text-slate-300">
                    The app is converted into a native Android project with Capacitor 8, including Gradle scripts, AndroidManifest.xml, hardware plugins, and local caching.
                  </div>
                </div>
              </div>

              {/* Install Direct WebAPK / PWA */}
              {canInstallPwa && onInstallPwa && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      Instant Android Install
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Install directly on Android devices with 1 tap (creates home screen icon with standalone launch).
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      onInstallPwa();
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0"
                  >
                    Install Now
                  </button>
                </div>
              )}

              {/* Build Commands */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Android Build & Run Commands
                </h3>

                {/* Command 1 */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">1. Sync Web Assets to Android Platform</span>
                    <button
                      onClick={() => copyToClipboard('npm run android:sync', 'sync')}
                      className="text-xs flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {copiedKey === 'sync' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'sync' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono bg-slate-900/80 p-2 rounded-lg text-emerald-400 overflow-x-auto">
                    npm run android:sync
                  </pre>
                  <p className="text-[11px] text-slate-400">
                    Compiles React, bundles Tailwind CSS & Workbox, then updates the native <code className="text-slate-300">/android</code> directory.
                  </p>
                </div>

                {/* Command 2 */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">2. Launch in Android Studio</span>
                    <button
                      onClick={() => copyToClipboard('npm run android:open', 'open')}
                      className="text-xs flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {copiedKey === 'open' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'open' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono bg-slate-900/80 p-2 rounded-lg text-emerald-400 overflow-x-auto">
                    npm run android:open
                  </pre>
                  <p className="text-[11px] text-slate-400">
                    Opens Android Studio with full Gradle sync, emulator runner, and layout inspector.
                  </p>
                </div>

                {/* Command 3 */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">3. Compile Debug APK (.apk)</span>
                    <button
                      onClick={() => copyToClipboard('cd android && ./gradlew assembleDebug', 'apk')}
                      className="text-xs flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {copiedKey === 'apk' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'apk' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono bg-slate-900/80 p-2 rounded-lg text-emerald-400 overflow-x-auto">
                    cd android && ./gradlew assembleDebug
                  </pre>
                  <p className="text-[11px] text-slate-400">
                    Generates sideloadable APK in: <code className="text-slate-300">android/app/build/outputs/apk/debug/app-debug.apk</code>.
                  </p>
                </div>

                {/* Command 4 */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">4. Build Google Play Store Bundle (.aab)</span>
                    <button
                      onClick={() => copyToClipboard('cd android && ./gradlew bundleRelease', 'aab')}
                      className="text-xs flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {copiedKey === 'aab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'aab' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono bg-slate-900/80 p-2 rounded-lg text-emerald-400 overflow-x-auto">
                    cd android && ./gradlew bundleRelease
                  </pre>
                  <p className="text-[11px] text-slate-400">
                    Generates Google Play App Bundle ready for release signing and Play Console upload.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                The native Android manifest declares all necessary hardware permissions for emergency roadside response and diagnostics:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Navigation className="w-4 h-4" />
                    <span>GPS High Accuracy</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">ACCESS_FINE_LOCATION</div>
                  <div className="text-[11px] text-slate-300">
                    Pinpoints live coordinates on India roads for mechanic dispatch.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <PhoneCall className="w-4 h-4" />
                    <span>Direct Emergency Dialing</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">CALL_PHONE</div>
                  <div className="text-[11px] text-slate-300">
                    1-tap calling to National Helpline (112), Police (100) & Mechanics.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Camera className="w-4 h-4" />
                    <span>Dashboard AI Scanner</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">CAMERA</div>
                  <div className="text-[11px] text-slate-300">
                    Captures instrument cluster warning lights & vehicle damage photos.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Vibrate className="w-4 h-4" />
                    <span>Haptic Touch Feedback</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">VIBRATE</div>
                  <div className="text-[11px] text-slate-300">
                    Tactile alerts on SOS button press, booking confirmation & status updates.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Wifi className="w-4 h-4" />
                    <span>Network & Offline Cache</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">ACCESS_NETWORK_STATE</div>
                  <div className="text-[11px] text-slate-300">
                    Detects remote highway dead-zones and loads cached map tiles.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Cpu className="w-4 h-4" />
                    <span>Keep Screen Active</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">WAKE_LOCK</div>
                  <div className="text-[11px] text-slate-300">
                    Keeps screen awake during active emergency tracking.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FILES */}
          {activeTab === 'files' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Generated native Android configuration files inside this project:
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400">capacitor.config.ts</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Root</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Defines appId <code className="text-amber-400">com.quickfix.roadside</code>, dark status bar (#0f172a), webDir: dist, and splash screen options.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400">android/app/src/main/AndroidManifest.xml</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Android Native</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Declares Android Activity, Intent filters, hardware features, and permissions for GPS, Camera, Phone, and Vibration.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400">public/.well-known/assetlinks.json</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Digital Asset Links</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Enables Android App Links and Trusted Web Activity (TWA) verification to open links directly in native app without browser prompt.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400">android/app/build.gradle</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Gradle</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Configures Android application build, compileSdk 36, targetSdk 36, and Capacitor Android libraries.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HARDWARE TEST */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Test Android device bridges directly. If using on an Android device, these invoke the hardware vibration motor and status bar:
              </p>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-emerald-400" />
                  Haptic Feedback Tester
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleTestHaptic('light')}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-lg text-xs font-medium transition-all"
                  >
                    Light Tap (15ms)
                  </button>
                  <button
                    onClick={() => handleTestHaptic('medium')}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-lg text-xs font-medium transition-all"
                  >
                    Medium Tap (30ms)
                  </button>
                  <button
                    onClick={() => handleTestHaptic('heavy')}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-lg text-xs font-medium transition-all"
                  >
                    Heavy Tap (60ms)
                  </button>
                  <button
                    onClick={() => handleTestHaptic('warning')}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-lg text-xs font-medium transition-all"
                  >
                    SOS Pulse
                  </button>
                </div>

                {hapticStatus && (
                  <div className="text-xs text-emerald-400 font-medium animate-in fade-in flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {hapticStatus}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Android Hardware Back Button
                </div>
                <p className="text-xs text-slate-300">
                  The native Android back button is wired to dismiss modals first (SOS, Diagnostics, Booking, Profile) before navigating backwards or exiting the app.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Android Platform: Active
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
