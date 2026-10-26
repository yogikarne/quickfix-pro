import React, { useState } from 'react';
import { UserProfile, Vehicle, VehicleType, Booking, AppRole } from '../types';
import { 
  User, 
  Car, 
  Plus, 
  ShieldCheck, 
  History, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  X, 
  Trash2, 
  Smartphone,
  Battery,
  AlertTriangle,
  FileText,
  Share2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { triggerHaptic } from '../lib/capacitorBridge';
import { saveUserProfileToFirestore } from '../lib/firebase';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  selectedVehicleId: string;
  onSelectVehicle: (id: string) => void;
  bookingHistory: Booking[];
  onOpenAndroid?: () => void;
  onOpenLanding?: () => void;
  onSwitchRole?: (role: AppRole) => void;
  onLogout?: () => void;
  t: (key: string) => string;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  selectedVehicleId,
  onSelectVehicle,
  bookingHistory,
  onOpenAndroid,
  onOpenLanding,
  onSwitchRole,
  onLogout,
  t,
}) => {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'history' | 'emergency'>('vehicles');

  // New vehicle form state
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>('car');
  const [newPlate, setNewPlate] = useState('');
  const [newFuel, setNewFuel] = useState<'Petrol' | 'Diesel' | 'EV' | 'Hybrid'>('Petrol');

  // New emergency contact form state
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState('');

  if (!isOpen) return null;

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleName.trim() || !newPlate.trim()) return;

    triggerHaptic('success');
    const newV: Vehicle = {
      id: `v_${Date.now()}`,
      name: newVehicleName.trim(),
      type: newVehicleType,
      plateNumber: newPlate.trim().toUpperCase(),
      fuelType: newFuel,
      color: 'Custom',
    };

    const updatedUser = {
      ...user,
      vehicles: [...user.vehicles, newV],
    };

    onUpdateUser(updatedUser);
    saveUserProfileToFirestore(updatedUser);
    onSelectVehicle(newV.id);

    setNewVehicleName('');
    setNewPlate('');
    setShowAddVehicle(false);
  };

  const handleDeleteVehicle = (id: string) => {
    if (user.vehicles.length <= 1) {
      triggerHaptic('heavy');
      return;
    }
    triggerHaptic('light');
    const updatedVehicles = user.vehicles.filter((v) => v.id !== id);
    const updatedUser = { ...user, vehicles: updatedVehicles };
    onUpdateUser(updatedUser);
    saveUserProfileToFirestore(updatedUser);
    if (selectedVehicleId === id) {
      onSelectVehicle(updatedVehicles[0].id);
    }
  };

  const handleAddEmergencyContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactPhone.trim()) return;
    triggerHaptic('success');

    const formatted = newContactPhone.startsWith('+91') 
      ? newContactPhone.trim() 
      : `+91 ${newContactPhone.trim()}`;

    const updatedUser = {
      ...user,
      emergencyContacts: [...user.emergencyContacts, formatted],
    };
    onUpdateUser(updatedUser);
    saveUserProfileToFirestore(updatedUser);
    setNewContactPhone('');
    setShowAddContact(false);
  };

  const handleDeleteEmergencyContact = (idx: number) => {
    triggerHaptic('light');
    const updatedContacts = user.emergencyContacts.filter((_, i) => i !== idx);
    const updatedUser = { ...user, emergencyContacts: updatedContacts };
    onUpdateUser(updatedUser);
    saveUserProfileToFirestore(updatedUser);
  };

  const handleTestEmergencyAlert = (phoneNum: string) => {
    triggerHaptic('light');
    const cleanPhone = phoneNum.replace(/[^0-9]/g, '');
    const msg = `🚨 QuickFix SOS Test Alert from ${user.name}: This is a verified test of my roadside emergency beacon.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-md animate-in fade-in font-sans select-none text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-5 sm:p-6 flex flex-col justify-between shadow-2xl">
        
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <h3 className="font-extrabold text-base text-white font-sans flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              <span>{t('profile')} & Garage</span>
            </h3>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
              title="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="space-y-2.5 my-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
            <div className="flex items-center gap-3.5">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40 shadow-sm shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-extrabold text-base text-white truncate">{user.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    user.role === 'admin' 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                      : user.role === 'mechanic' 
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {user.role === 'admin' ? 'Control Room' : user.role === 'mechanic' ? 'Partner Tech' : 'Driver'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{user.phone}</span>
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate">{user.email}</span>
                </p>
              </div>
            </div>

            {/* Specialized Role Details */}
            {user.role === 'mechanic' && user.workshopName && (
              <div className="pt-2 border-t border-slate-900 text-xs text-blue-300 flex items-center justify-between">
                <span>🏢 {user.workshopName}</span>
                <span className="text-[10px] text-slate-400">{user.vehicleFleetType}</span>
              </div>
            )}

            {user.role === 'admin' && (
              <div className="pt-2 border-t border-slate-900 text-xs text-purple-300 flex items-center justify-between">
                <span>🏛️ {user.controlRoomStation || 'NHAI Central Dispatch'}</span>
                <span className="font-mono text-[10px] text-amber-400">{user.adminBadgeId || 'NCR-1033'}</span>
              </div>
            )}

            {/* Portal Switcher Buttons */}
            {onOpenLanding && (
              <div className="pt-2 border-t border-slate-900 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                    onOpenLanding();
                  }}
                  className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-850 text-amber-400 rounded-xl text-[11px] font-bold border border-slate-800 transition text-center"
                >
                  🌐 Landing Page
                </button>
                {onSwitchRole && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      onClose();
                      onSwitchRole(user.role === 'customer' ? 'mechanic' : 'customer');
                    }}
                    className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl text-[11px] font-bold border border-slate-800 transition text-center"
                  >
                    Switch Portal ➔
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl my-3 text-xs font-bold">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('vehicles');
              }}
              className={`flex-1 py-2 rounded-xl transition ${
                activeTab === 'vehicles'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Garage ({user.vehicles.length})
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('history');
              }}
              className={`flex-1 py-2 rounded-xl transition ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              History ({bookingHistory.length})
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('emergency');
              }}
              className={`flex-1 py-2 rounded-xl transition ${
                activeTab === 'emergency'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SOS Contacts
            </button>
          </div>

          {/* TAB 1: VEHICLE GARAGE */}
          {activeTab === 'vehicles' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Registered Indian Vehicles
                </span>
                <button
                  onClick={() => setShowAddVehicle(!showAddVehicle)}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Vehicle</span>
                </button>
              </div>

              {/* Add Vehicle Form */}
              {showAddVehicle && (
                <form
                  onSubmit={handleAddVehicle}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs animate-in fade-in"
                >
                  <h5 className="font-extrabold text-white">Register Vehicle to Garage</h5>
                  <div>
                    <label className="text-slate-400 block mb-1">Make & Model</label>
                    <input
                      type="text"
                      placeholder="e.g., Tata Nexon EV, Mahindra Thar, or RE Classic 350"
                      value={newVehicleName}
                      onChange={(e) => setNewVehicleName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Number Plate</label>
                      <input
                        type="text"
                        placeholder="MH 02 AB 1234"
                        value={newPlate}
                        onChange={(e) => setNewPlate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-mono uppercase"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Vehicle Type</label>
                      <select
                        value={newVehicleType}
                        onChange={(e) => setNewVehicleType(e.target.value as VehicleType)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="car">Car / SUV</option>
                        <option value="bike">Motorcycle / Scooter</option>
                        <option value="ev">Electric Vehicle (EV)</option>
                        <option value="truck">Commercial Truck</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl shadow-md active:scale-95 transition"
                  >
                    Save Vehicle to QuickFix Garage
                  </button>
                </form>
              )}

              {/* Vehicles List with Health Status Badges */}
              <div className="space-y-2.5">
                {user.vehicles.map((v) => {
                  const isSelected = v.id === selectedVehicleId;
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        triggerHaptic('light');
                        onSelectVehicle(v.id);
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-slate-950 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                            <Car className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-extrabold text-xs text-white truncate">{v.name}</h5>
                              {isSelected && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  Active Vehicle
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              <span className="font-mono text-white font-bold">{v.plateNumber}</span> • {v.fuelType}
                            </p>
                          </div>
                        </div>

                        {user.vehicles.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVehicle(v.id);
                            }}
                            className="p-2 text-slate-500 hover:text-red-400 transition"
                            title="Remove vehicle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Vehicle Health Checks Mini Row */}
                      <div className="pt-2 border-t border-slate-900 grid grid-cols-3 gap-1.5 text-[10px]">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Battery 12.6V
                        </span>
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-500" /> PUC Valid
                        </span>
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-400" /> Insured
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SERVICE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-2.5">
              {bookingHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-950 border border-slate-800 rounded-2xl">
                  No emergency roadside dispatches recorded yet.
                </div>
              ) : (
                bookingHistory.map((b) => (
                  <div key={b.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{b.serviceType}</span>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">Provider: {b.provider.name}</p>
                    <div className="flex justify-between text-[11px] pt-1.5 border-t border-slate-800 text-slate-400">
                      <span>Vehicle: {b.vehicle.name}</span>
                      <span className="font-bold text-amber-400 font-mono">₹{b.costBreakdown.total.toFixed(0)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: EMERGENCY CONTACTS */}
          {activeTab === 'emergency' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Emergency SOS Recipients
                </span>
                <button
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Contact</span>
                </button>
              </div>

              <p className="text-slate-400 leading-relaxed text-[11px]">
                These verified phone numbers automatically receive your exact GPS coordinates and breakdown details when you trigger Emergency SOS.
              </p>

              {showAddContact && (
                <form onSubmit={handleAddEmergencyContact} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <input
                    type="tel"
                    placeholder="Enter 10-digit mobile (e.g. 9820012345)"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    Save SOS Contact
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {user.emergencyContacts.map((contact, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-white font-mono text-xs">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>{contact}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTestEmergencyAlert(contact)}
                        className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1"
                        title="Send WhatsApp Test Alert"
                      >
                        <Share2 className="w-3 h-3" /> Test
                      </button>

                      <button
                        onClick={() => handleDeleteEmergencyContact(i)}
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                        title="Remove contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="space-y-2.5 pt-4 border-t border-slate-800">
          {onLogout && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
                onLogout();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-700 text-red-400 hover:text-red-300 transition text-xs font-bold shadow-sm flex items-center justify-center gap-2"
            >
              <span>Sign Out of QuickFix</span>
            </button>
          )}

          {onOpenAndroid && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
                onOpenAndroid();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition text-xs font-bold shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Android App & Native APK Hub</span>
              </div>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded font-bold uppercase">
                Capacitor Native
              </span>
            </button>
          )}

          <p className="text-[10px] text-slate-500 text-center font-mono">
            QuickFix Roadside Assistance • Production Build • Firebase Synced
          </p>
        </div>
      </div>
    </div>
  );
};
