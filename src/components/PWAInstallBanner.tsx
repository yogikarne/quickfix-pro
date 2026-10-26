import React, { useState } from 'react';
import { usePWAInstall } from '../lib/usePWAInstall';
import { Download, Smartphone, X, Check, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-semibold text-white shadow-md hover:from-amber-600 hover:to-orange-700 active:scale-95 transition-all ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm'
        }`}
      >
        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 font-medium hover:bg-slate-700 active:scale-95 transition-all ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">Install QuickFix App</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                To install QuickFix as a standalone Mobile App on your iPhone or iPad:
              </p>

              <div className="space-y-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-bold text-amber-400 border border-amber-500/30">
                    1
                  </span>
                  <p className="text-slate-200">
                    Tap the <strong className="text-amber-400 font-semibold">Share</strong> button in Safari toolbar (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" />).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-bold text-amber-400 border border-amber-500/30">
                    2
                  </span>
                  <p className="text-slate-200">
                    Scroll down and tap <strong className="text-amber-400 font-semibold">Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-400" />).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-bold text-amber-400 border border-amber-500/30">
                    3
                  </span>
                  <p className="text-slate-200">
                    Open QuickFix directly from your phone screen for instant offline map & 24/7 SOS rescue!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 text-xs transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || dismissed) return null;
  if (!isInstallable && !isIOS) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 border-b border-amber-500/30 px-3 py-2 text-xs text-slate-200 shadow-md flex items-center justify-between gap-2 z-40 relative">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4 text-amber-400" />
        </div>
        <div className="truncate">
          <div className="font-bold text-amber-300 truncate">QuickFix Mobile App</div>
          <div className="text-[11px] text-slate-300 truncate hidden xs:block">Install for offline GPS & faster emergency response</div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isInstallable && (
          <button
            onClick={install}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs shadow transition active:scale-95 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
        )}

        {isIOS && (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-semibold px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Install iOS
          </button>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                Install QuickFix on iOS
              </h3>
              <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Tap <Share2 className="w-3.5 h-3.5 inline text-blue-400 mx-0.5" /> <strong>Share</strong> in Safari, then select <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-0.5" /> <strong>Add to Home Screen</strong>.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-amber-500 text-slate-950 font-bold py-2 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
