import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ShieldCheck,
  Leaf,
  Users,
  Sparkles,
  ChevronDown,
  Wallet,
  Check,
  Lock,
  Unlock,
  Car
} from 'lucide-react';
import { CORRIDOR_OPTIONS } from '../data/corridorData';
import ShiftLogView from './ShiftLogView';
import VehicleCapacityView from './VehicleCapacityView';

export default function DriverProfileCard({
  profile,
  isOnline = true,
  onToggleOnline,
  onSaveProfile,
  onSaveVehicleConstraints,
  onExportShiftLog,
}) {
  const [activeTab, setActiveTab] = useState('vehicle'); // 'profile' | 'vehicle' | 'shift_log'

  // Editable Form State initialized from profile
  const [driverName, setDriverName] = useState(profile.name);
  const [phoneNumber] = useState(profile.phone);
  const [languages, setLanguages] = useState(profile.languages);

  // 2. Interactive Seat Inventory Matrix State
  const [seatMatrix, setSeatMatrix] = useState({
    front: true,
    rearLeft: true,
    rearRight: true,
    middle: false,
  });

  const [detourPercent, setDetourPercent] = useState(profile.detourTolerancePercent);
  const [preferredCorridor, setPreferredCorridor] = useState(profile.preferredEndCorridor);
  const [upiVpa, setUpiVpa] = useState(profile.upiVpa);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarIndex, setAvatarIndex] = useState(0);

  // Calculate dynamic available seats count
  const availableSeats = Object.values(seatMatrix).filter(Boolean).length;

  const seatItems = [
    { id: 'front', label: 'Front Seat', desc: 'Passenger Front' },
    { id: 'rearLeft', label: 'Rear Left', desc: 'Window Port' },
    { id: 'rearRight', label: 'Rear Right', desc: 'Window Starboard' },
    { id: 'middle', label: 'Middle (Optional)', desc: 'Rear Center' },
  ];

  const toggleSeat = (id) => {
    if (!isOnline) return;
    setSeatMatrix((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // Prevent 0 seats if desired, or allow toggling freely
      if (Object.values(next).filter(Boolean).length === 0) {
        return prev; // keep at least 1 seat selected
      }
      return next;
    });
  };

  // Sample avatar presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  ];

  const availableLanguages = ['English', 'Hindi', 'Marathi', 'Gujarati'];

  const toggleLanguage = (lang) => {
    if (!isOnline) return;
    if (languages.includes(lang)) {
      if (languages.length > 1) {
        setLanguages(languages.filter((l) => l !== lang));
      }
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const cycleAvatar = () => {
    setAvatarIndex((prev) => (prev + 1) % avatarPresets.length);
  };

  const handleSave = () => {
    if (!isOnline) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onSaveProfile?.({
        name: driverName,
        phone: phoneNumber,
        languages,
        maxPooledPassengers: availableSeats,
        detourTolerancePercent: detourPercent,
        preferredEndCorridor: preferredCorridor,
        upiVpa,
        avatarUrl: avatarPresets[avatarIndex],
      });
    }, 600);
  };

  return (
    <aside
      aria-label="Driver Control Panel"
      className="w-full lg:max-w-[460px] bg-[#1a1a1e] border border-white/10 rounded-3xl p-5 md:p-6 shadow-2xl shadow-black/60 flex flex-col justify-between shrink-0 transition-all duration-300"
    >
      <div>
        {/* 1. Sub-Tab Header */}
        <nav
          aria-label="Driver sections"
          className="flex items-center gap-4 md:gap-5 border-b border-white/10 pb-3 mb-5 overflow-x-auto no-scrollbar"
        >
          <button
            onClick={() => setActiveTab('profile')}
            className={`relative pb-2 text-xs md:text-sm font-bold transition-colors select-none whitespace-nowrap cursor-pointer ${
              activeTab === 'profile' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Profile
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('vehicle')}
            className={`relative pb-2 text-xs md:text-sm font-bold transition-colors select-none whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vehicle' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Vehicle & Capacity
            {activeTab === 'vehicle' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('shift_log')}
            className={`relative pb-2 text-xs md:text-sm font-bold transition-colors select-none whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'shift_log' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Shift Log
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {activeTab === 'shift_log' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
            )}
          </button>
        </nav>

        {/* Sub-Tab View Rendering */}
        {activeTab === 'shift_log' ? (
          <ShiftLogView onExportLog={onExportShiftLog} />
        ) : activeTab === 'vehicle' ? (
          <VehicleCapacityView
            initialVehicle={profile.vehicle}
            isOnline={isOnline}
            onSaveVehicleConstraints={onSaveVehicleConstraints}
          />
        ) : (
          /* Tab 1: Profile View */
          <div className="space-y-5">
            {/* 2. Heading */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[11px] font-extrabold tracking-widest uppercase text-amber-400 flex items-center gap-1.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400" />
                  • DRIVER PREFERENCES
                </div>
                {/* Online Lock Status Badge */}
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  {isOnline ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Unlock className="w-2.5 h-2.5" /> Editing Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Lock className="w-2.5 h-2.5" /> Editing Locked
                    </span>
                  )}
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Captain Profile.
              </h1>
              <p className="text-xs md:text-sm text-neutral-400 italic mt-0.5">
                Set your corridor limits. A fairer payout.
              </p>
            </div>

            {/* Offline Lock Warning Banner */}
            {!isOnline && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-300 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Shift offline. Corridor editing is locked.</span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleOnline?.()}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-bold text-[11px] hover:bg-amber-300 transition-colors shadow-sm cursor-pointer"
                >
                  Go Online
                </button>
              </div>
            )}

            {/* 3. Driver Identity Snapshot */}
            <div className={`p-4 rounded-2xl bg-[#151518] border border-white/10 space-y-4 transition-all duration-200 ${
              !isOnline ? 'opacity-65 pointer-events-none' : ''
            }`}>
              <div className="flex items-center gap-4">
                {/* Circular avatar with quick change button */}
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-md shadow-amber-500/20 bg-neutral-800">
                    <img
                      src={avatarPresets[avatarIndex]}
                      alt="Driver Captain Avatar"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <button
                    onClick={cycleAvatar}
                    disabled={!isOnline}
                    title="Change Avatar"
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center hover:bg-amber-300 shadow-md shadow-black transition-transform active:scale-90"
                  >
                    <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Name & Phone Number snapshot */}
                <div className="flex-1 min-w-0">
                  <label htmlFor="driver-name-input" className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                    Captain Name
                  </label>
                  <input
                    id="driver-name-input"
                    type="text"
                    disabled={!isOnline}
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-[#151518] border border-white/10 text-white rounded-xl px-3.5 py-2 text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                    placeholder="Enter captain name"
                  />

                  {/* Verified phone number badge */}
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    <span className="font-mono text-neutral-300 font-medium">
                      {phoneNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Languages Spoken (Multi-select pill chips) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Languages Spoken
                  </label>
                  <span className="text-[10px] text-neutral-500 italic">Select all that apply</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map((lang) => {
                    const isSelected = languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        disabled={!isOnline}
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 select-none flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-sm shadow-amber-400/20'
                            : 'bg-[#151518] border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                        <span>{lang}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Pooling & Capacity Constraints (Feeds to Batching Engine) */}
            <div className={`space-y-4 transition-all duration-200 ${
              !isOnline ? 'opacity-65 pointer-events-none' : ''
            }`}>
              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    Pooling Constraints
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Batch Engine Feed
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 italic">
                  Set your operating limits. A smoother drive.
                </p>
              </div>

              {/* 2. Interactive Seat Inventory Matrix (Refactored 4-seat layout) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-amber-400" />
                    <span>Seat Inventory Matrix</span>
                  </label>
                  <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {availableSeats} of 4 Available
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#151518] p-2.5 rounded-2xl border border-white/10">
                  {seatItems.map((seat) => {
                    const isSelected = !!seatMatrix[seat.id];
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={!isOnline}
                        onClick={() => toggleSeat(seat.id)}
                        className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all duration-150 select-none cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400/10 text-amber-300 shadow-sm shadow-amber-400/15'
                            : 'border-white/10 bg-[#151518] text-neutral-400 hover:border-white/20 hover:text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">[{seat.label}]</span>
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-neutral-600'}`} />
                        </div>
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-amber-400/80 font-medium' : 'text-neutral-500'}`}>
                          {seat.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1.5 italic">
                  Click chips to toggle inventory. Feeds into real-time batch passenger matching.
                </p>
              </div>

              {/* Maximum Allowed Detour Tolerance */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-neutral-300">
                    Maximum Allowed Detour Tolerance
                  </label>
                  <span className="text-xs font-bold font-mono text-amber-400">
                    +{detourPercent}%
                  </span>
                </div>

                {/* User Card Visual Parity Badge */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#151518] border border-white/10 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Up to {detourPercent}% extra travel time
                      </span>
                      <span className="text-[10px] text-neutral-400 block">
                        Maintains direct corridor efficiency parity
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Protected
                  </span>
                </div>

                {/* Fine-tuning range slider */}
                <div className="px-1">
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="1"
                    disabled={!isOnline}
                    value={detourPercent}
                    onChange={(e) => setDetourPercent(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#222226] rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
                    <span>5% (Strict)</span>
                    <span className="text-amber-400 font-bold">15% (Recommended)</span>
                    <span>25% (Max Earnings)</span>
                  </div>
                </div>
              </div>

              {/* Preferred End Corridor */}
              <div>
                <label htmlFor="end-corridor-select" className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Preferred End Corridor (End-of-Shift Route)
                </label>
                <div className="relative">
                  <select
                    id="end-corridor-select"
                    disabled={!isOnline}
                    value={preferredCorridor}
                    onChange={(e) => setPreferredCorridor(e.target.value)}
                    className="w-full bg-[#151518] border border-white/10 text-white rounded-xl px-4 py-3 text-xs md:text-sm appearance-none focus:outline-none focus:border-amber-400 transition cursor-pointer pr-10"
                  >
                    {CORRIDOR_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.label} className="bg-[#1a1a1e] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 italic">
                  Engine matches return trips terminating near this corridor.
                </p>
              </div>
            </div>

            {/* 5. Payout Details Section */}
            <div className={`border-t border-white/10 pt-3 space-y-3 transition-all duration-200 ${
              !isOnline ? 'opacity-65 pointer-events-none' : ''
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    Payout Details
                  </span>
                  <p className="text-[10px] text-neutral-400 italic">
                    Direct Shapley value disbursements.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                  Verified
                </span>
              </div>

              <div className="relative">
                <label htmlFor="upi-vpa-input" className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  UPI Virtual Payment Address (VPA)
                </label>
                <div className="relative">
                  <input
                    id="upi-vpa-input"
                    type="text"
                    disabled={!isOnline}
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    className="w-full bg-[#151518] border border-white/10 text-white rounded-xl px-4 py-3 text-xs md:text-sm font-mono focus:outline-none focus:border-amber-400 transition"
                    placeholder="name@upi"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    HDFC Linked
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Shapley Yield Estimator Card (Compact comparative payout badge right above submit button) */}
            <div className="p-3.5 rounded-2xl bg-[#151518] border border-amber-400/25 shadow-lg shadow-black/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Shapley Yield Estimator</span>
                </div>
                {/* Amber Synergy Badge */}
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold tracking-wide">
                  +76% Synergy
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* Column 1: Solo Run */}
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Solo Run
                  </span>
                  <div className="text-base md:text-lg font-black text-white font-mono mt-0.5">
                    ~₹950
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-0.5">
                    Single direct commuter
                  </span>
                </div>

                {/* Column 2: Pooled Yield */}
                <div className="p-2.5 rounded-xl bg-amber-500/[0.08] border border-amber-400/30 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    Pooled Yield (3 Riders)
                  </span>
                  <div className="text-base md:text-lg font-black text-amber-400 font-mono mt-0.5">
                    ~₹1,680
                  </div>
                  <span className="text-[10px] text-amber-300/80 mt-0.5 font-medium">
                    Shapley marginal share
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Bottom Action Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={!isOnline || isSaving}
                className={`w-full font-bold py-3.5 rounded-xl transition duration-200 shadow-lg flex items-center justify-center gap-2 select-none ${
                  !isOnline
                    ? 'bg-neutral-800 text-neutral-500 border border-white/5 cursor-not-allowed'
                    : 'bg-amber-400 text-black hover:bg-amber-300 shadow-amber-400/20 active:scale-[0.99] cursor-pointer'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Syncing with Batch Engine...</span>
                  </>
                ) : !isOnline ? (
                  <>
                    <Lock className="w-4 h-4 text-neutral-500" />
                    <span>Go Online to Save Preferences</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Profile Preferences</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer subtle brand watermark */}
      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-500">
        <span>SmartPool Captain OS v2.4</span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-amber-400" />
          Corridor Protocol Compliant
        </span>
      </div>
    </aside>
  );
}
