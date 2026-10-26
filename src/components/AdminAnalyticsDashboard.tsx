import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Wrench, 
  ShieldCheck, 
  Clock, 
  Star, 
  Activity, 
  AlertTriangle, 
  IndianRupee,
  Navigation,
  Radio,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { triggerHaptic } from '../lib/capacitorBridge';
import { UserProfile } from '../types';

interface AdminAnalyticsDashboardProps {
  user?: UserProfile | null;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({ user }) => {
  const [selectedCorridor, setSelectedCorridor] = useState<string>('all');

  const CORRIDORS = [
    { id: 'all', name: 'All National Corridors' },
    { id: 'mumbai_pune', name: 'Mumbai-Pune Expressway (NH-48)' },
    { id: 'delhi_jaipur', name: 'Delhi-Jaipur Highway (NH-48)' },
    { id: 'blr_che', name: 'Bengaluru-Chennai Expressway (NH-44)' },
    { id: 'hyd_orr', name: 'Hyderabad Outer Ring Road (ORR)' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6 animate-in fade-in font-sans select-none text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-lg sm:text-xl text-white font-sans flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <span>National Operations & Dispatch Control Room 🇮🇳</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Officer on Duty:{' '}
            <span className="text-white font-bold">{user?.name || 'Chief Dispatch Officer'}</span>{' '}
            ({user?.adminBadgeId || 'Badge #NCR-1033'}) •{' '}
            <span className="text-amber-300 font-semibold">{user?.controlRoomStation || 'NHAI Central Command Sector 1'}</span>
          </p>
        </div>

        {/* Corridor filter & live ping */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCorridor}
            onChange={(e) => {
              triggerHaptic('light');
              setSelectedCorridor(e.target.value);
            }}
            className="bg-slate-900 border border-slate-700 text-xs text-amber-300 font-bold rounded-xl px-3 py-2 outline-none focus:border-amber-500 cursor-pointer"
          >
            {CORRIDORS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-2 shrink-0">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">112 Dispatch Online</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            National Dispatches
          </span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">18,420</span>
          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +22.4% vs last month
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Avg Dispatch Arrival Time
          </span>
          <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">6.2 mins</span>
          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
            ⚡ 2.8m faster than SLA
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Driver Satisfaction Rating
          </span>
          <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">4.92 ★</span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
            Across 14,890 verified trips
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Rescue Vans
          </span>
          <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">480 Vans</span>
          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
            ● 96% Units On Patrol
          </span>
        </div>
      </div>

      {/* Category Breakdown & Live SOS Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Most Requested Services */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider">
              Most Requested Roadside Emergencies
            </h3>
            <span className="text-[10px] text-slate-400">Live Breakdown</span>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { category: 'Flat Tyre & Puncture Repair', count: 6150, percent: 38, color: 'bg-amber-400' },
              { category: 'Dead Battery Jump Start', count: 4420, percent: 27, color: 'bg-blue-400' },
              { category: 'Highway Towing & Flatbed Crane', count: 3280, percent: 20, color: 'bg-purple-400' },
              { category: 'Emergency Fuel & Mobile EV Charging', count: 1540, percent: 9, color: 'bg-emerald-400' },
              { category: 'Key Lockout Recovery', count: 1030, percent: 6, color: 'bg-rose-400' },
            ].map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-slate-300 font-semibold">
                  <span>{item.category}</span>
                  <span className="text-white font-mono font-bold">{item.count} ({item.percent}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time System Dispatch Logs */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider">
              Live Dispatch Feed & SOS Triggers
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { time: '1 min ago', msg: '🚨 SOS Alert: Tata Harrier breakdown on Mumbai-Pune Expressway km 42', type: 'sos' },
              { time: '4 mins ago', msg: '✅ Dispatch #IN-8920 Completed by Ravi Auto Care (₹450 Paid via UPI)', type: 'done' },
              { time: '11 mins ago', msg: '🤖 Gemini AI Diagnostic completed for Mahindra XUV700 Battery failure', type: 'ai' },
              { time: '19 mins ago', msg: '⚡ Mobile Fast DC Charger Unit Alpha deployed near Bengaluru Airport Toll', type: 'dispatch' },
              { time: '28 mins ago', msg: '🚛 Flatbed Towing dispatched on Delhi-Gurugram Expressway for accident clearance', type: 'dispatch' },
            ].map((log, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <span className="text-[10px] font-mono text-amber-400 shrink-0 mt-0.5">{log.time}</span>
                <span className="text-slate-200 font-medium leading-relaxed">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
