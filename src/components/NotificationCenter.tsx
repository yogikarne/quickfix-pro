import React from 'react';
import { AppNotification } from '../types';
import { Bell, Sparkles, AlertCircle, Info, Check, X, Tag, CheckCheck } from 'lucide-react';
import { triggerHaptic } from '../lib/capacitorBridge';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  t: (key: string) => string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-md animate-in fade-in select-none text-slate-100 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-5 shadow-2xl flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm text-white">{t('notifications')}</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onMarkAllRead();
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2.5 my-4">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 border border-slate-800 rounded-2xl">
                No new roadside alerts or notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    !n.read
                      ? 'bg-slate-950 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                      {n.type === 'promo' ? (
                        <Tag className="w-4 h-4 text-emerald-400" />
                      ) : n.type === 'sos' ? (
                        <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />
                      ) : (
                        <Info className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="font-extrabold text-xs text-white truncate">{n.title}</h5>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-500 font-mono mt-1.5 block">
                        {n.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
          QuickFix Real-Time Telemetry & Alert Stream
        </div>
      </div>
    </div>
  );
};
