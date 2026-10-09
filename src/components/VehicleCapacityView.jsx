import React, { useState } from 'react';
import {
  Car,
  CheckCircle2,
  Zap,
  Fuel,
  Flame,
  Leaf,
  Plus,
  Minus,
  Sparkles,
  Package,
  Luggage,
  Wind,
} from 'lucide-react';

export default function VehicleCapacityView({
  initialVehicle,
  isOnline = true,
  onSaveVehicleConstraints,
}) {
  // Section 1: Vehicle Identification State
  const [make, setMake] = useState(initialVehicle?.make || 'Tata');
  const [model, setModel] = useState(initialVehicle?.model || 'Nexon EV Max');
  const [plateNumber, setPlateNumber] = useState(
    initialVehicle?.plateNumber || 'MH 12 RN 8820'
  );
  const [fuelType, setFuelType] = useState(initialVehicle?.fuelType || 'EV'); // 'EV' | 'PETROL' | 'CNG' | 'DIESEL'

  // Section 2: Luggage & Boot Space Matrix State
  // Tiers: 'ZERO_LUGGAGE' | 'CABIN_BAGS_ONLY' | 'LARGE_SUITCASES'
  const [bootTier, setBootTier] = useState(
    initialVehicle?.bootTier || 'LARGE_SUITCASES'
  );
  const [cabinBags, setCabinBags] = useState(initialVehicle?.cabinBags ?? 2);
  const [largeBags, setLargeBags] = useState(initialVehicle?.largeBags ?? 1);

  // Section 3: Cabin Comfort & Preferences
  const [hasAC, setHasAC] = useState(initialVehicle?.hasAC ?? true);
  const [isSaving, setIsSaving] = useState(false);

  // Fuel Options
  const fuelOptions = [
    { id: 'EV', label: 'EV', icon: Zap, color: 'text-emerald-400' },
    { id: 'PETROL', label: 'Petrol', icon: Fuel, color: 'text-amber-400' },
    { id: 'CNG', label: 'CNG', icon: Flame, color: 'text-cyan-400' },
    { id: 'DIESEL', label: 'Diesel', icon: Fuel, color: 'text-rose-400' },
  ];

  // Boot Tiers Configuration
  const tierConfigs = [
    {
      id: 'ZERO_LUGGAGE',
      label: 'No Luggage',
      caption: 'Backpacks only',
      desc: 'Trunk full or CNG cylinder. Riders restricted to lap backpacks.',
      maxCabin: 0,
      maxLarge: 0,
      icon: Package,
    },
    {
      id: 'CABIN_BAGS_ONLY',
      label: 'Cabin Bags Only',
      caption: 'Up to 2 small trolley bags',
      desc: 'Compact trunk space. Accepts cabin trolley bags, zero large suitcases.',
      maxCabin: 3,
      maxLarge: 0,
      icon: Luggage,
    },
    {
      id: 'LARGE_SUITCASES',
      label: 'Full Trunk',
      caption: 'Accommodates large suitcases',
      desc: 'Spacious sedan/SUV trunk. Accepts large travel luggage and bags.',
      maxCabin: 3,
      maxLarge: 2,
      icon: Luggage,
    },
  ];

  // Handle tier switch with auto bag adjustments
  const handleSelectTier = (tierId) => {
    if (!isOnline) return;
    setBootTier(tierId);
    if (tierId === 'ZERO_LUGGAGE') {
      setCabinBags(0);
      setLargeBags(0);
    } else if (tierId === 'CABIN_BAGS_ONLY') {
      setCabinBags((prev) => (prev === 0 ? 2 : Math.min(prev, 3)));
      setLargeBags(0);
    } else if (tierId === 'LARGE_SUITCASES') {
      setCabinBags((prev) => (prev === 0 ? 2 : prev));
      setLargeBags((prev) => (prev === 0 ? 1 : prev));
    }
  };

  // Stepper handlers
  const adjustCabinBags = (delta) => {
    if (!isOnline || bootTier === 'ZERO_LUGGAGE') return;
    setCabinBags((prev) => Math.max(0, Math.min(3, prev + delta)));
  };

  const adjustLargeBags = (delta) => {
    if (!isOnline || bootTier !== 'LARGE_SUITCASES') return;
    setLargeBags((prev) => Math.max(0, Math.min(2, prev + delta)));
  };

  // Submit handler
  const handleSave = () => {
    if (!isOnline) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onSaveVehicleConstraints?.({
        make,
        model,
        plateNumber: plateNumber.trim().toUpperCase(),
        fuelType,
        bootTier,
        cabinBags,
        largeBags,
        hasAC,
      });
    }, 600);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Eyebrow & Title */}
      <div>
        <div className="text-[11px] font-extrabold tracking-widest uppercase text-amber-400 flex items-center gap-1.5 mb-1 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400" />
          • VEHICLE ATTRIBUTES
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
          Vehicle & Capacity.
        </h2>
        <p className="text-xs md:text-sm text-neutral-400 italic mt-0.5">
          Trunk slots & cabin comfort constraints feed into the batching engine.
        </p>
      </div>

      {/* Section 1: Vehicle Identification Card */}
      <div className={`p-4 rounded-2xl bg-[#151518] border border-white/10 space-y-4 transition-all duration-200 ${
        !isOnline ? 'opacity-65 pointer-events-none' : ''
      }`}>
        
        {/* Vehicle Overview Badge */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#1a1a1f] to-[#22222a] border border-white/10 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
              <Car className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs md:text-sm text-white tracking-tight">
                  {make} {model}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono font-medium">
                  • {plateNumber}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                  {fuelType === 'EV' ? '⚡ EV Max' : fuelType}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                  Fastag Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Registration Inputs Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              Make
            </label>
            <input
              type="text"
              disabled={!isOnline}
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="w-full bg-[#121214] border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-400 transition"
              placeholder="e.g. Tata"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              Model
            </label>
            <input
              type="text"
              disabled={!isOnline}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#121214] border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-400 transition"
              placeholder="e.g. Nexon EV"
            />
          </div>
        </div>

        {/* License Plate Input */}
        <div>
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
            License Plate Number (HSRP Registration)
          </label>
          <input
            type="text"
            disabled={!isOnline}
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
            className="w-full bg-[#121214] border border-white/10 text-white rounded-xl px-3.5 py-2 text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-amber-400 transition"
            placeholder="MH 12 RN 8820"
          />
        </div>

        {/* Fuel Type Selector Pills */}
        <div>
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
            Fuel Type
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {fuelOptions.map((f) => {
              const isSelected = fuelType === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  type="button"
                  disabled={!isOnline}
                  onClick={() => setFuelType(f.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs font-bold border transition-all select-none cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-sm shadow-amber-400/20'
                      : 'border-white/10 bg-[#121214] text-neutral-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : f.color}`} />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Luggage & Boot Space Matrix (Core Algorithmic Constraint) */}
      <div className={`space-y-3.5 transition-all duration-200 ${
        !isOnline ? 'opacity-65 pointer-events-none' : ''
      }`}>
        <div className="border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Luggage className="w-3.5 h-3.5 text-amber-400" />
              Trunk Capacity Allocation
            </span>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Batching Constraint
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 italic mt-0.5">
            The batching engine only groups riders whose luggage fits your available trunk space.
          </p>
        </div>

        {/* 3 Segmented Tier Cards */}
        <div className="grid grid-cols-3 gap-2">
          {tierConfigs.map((t) => {
            const isSelected = bootTier === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                disabled={!isOnline}
                onClick={() => handleSelectTier(t.id)}
                className={`p-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between select-none cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/10 text-amber-300 shadow-md shadow-amber-400/15 ring-1 ring-amber-400/40'
                    : 'border-white/10 bg-[#151518] text-neutral-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-neutral-600'}`} />
                  </div>
                  <div className="text-[11px] font-extrabold leading-tight">
                    [{t.label}]
                  </div>
                </div>
                <div className={`text-[9px] mt-1 line-clamp-2 ${isSelected ? 'text-amber-300/80 font-medium' : 'text-neutral-500'}`}>
                  {t.caption}
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Bag Counters: Cabin Bags & Large Bags Steppers */}
        <div className="p-3.5 rounded-2xl bg-[#151518] border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-neutral-300 uppercase tracking-wider">
              Allocated Baggage Slots
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {bootTier === 'ZERO_LUGGAGE'
                ? 'Backpacks Only'
                : `${cabinBags} Cabin + ${largeBags} Large`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Cabin Bags Stepper */}
            <div className={`p-2.5 rounded-xl bg-[#121214] border border-white/5 flex items-center justify-between ${
              bootTier === 'ZERO_LUGGAGE' ? 'opacity-40 pointer-events-none' : ''
            }`}>
              <div>
                <span className="text-xs font-bold text-white block">Cabin Bags</span>
                <span className="text-[10px] text-neutral-500 block">Trolley / Duffel</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!isOnline || cabinBags <= 0 || bootTier === 'ZERO_LUGGAGE'}
                  onClick={() => adjustCabinBags(-1)}
                  className="w-6 h-6 rounded-lg bg-[#222228] text-white flex items-center justify-center hover:bg-amber-400 hover:text-black transition-colors disabled:opacity-40"
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>
                <span className="text-sm font-extrabold font-mono text-white w-4 text-center">
                  {cabinBags}
                </span>
                <button
                  type="button"
                  disabled={!isOnline || cabinBags >= 3 || bootTier === 'ZERO_LUGGAGE'}
                  onClick={() => adjustCabinBags(1)}
                  className="w-6 h-6 rounded-lg bg-[#222228] text-white flex items-center justify-center hover:bg-amber-400 hover:text-black transition-colors disabled:opacity-40"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Large Bags Stepper */}
            <div className={`p-2.5 rounded-xl bg-[#121214] border border-white/5 flex items-center justify-between ${
              bootTier !== 'LARGE_SUITCASES' ? 'opacity-40 pointer-events-none' : ''
            }`}>
              <div>
                <span className="text-xs font-bold text-white block">Large Bags</span>
                <span className="text-[10px] text-neutral-500 block">Full Suitcases</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!isOnline || largeBags <= 0 || bootTier !== 'LARGE_SUITCASES'}
                  onClick={() => adjustLargeBags(-1)}
                  className="w-6 h-6 rounded-lg bg-[#222228] text-white flex items-center justify-center hover:bg-amber-400 hover:text-black transition-colors disabled:opacity-40"
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>
                <span className="text-sm font-extrabold font-mono text-white w-4 text-center">
                  {largeBags}
                </span>
                <button
                  type="button"
                  disabled={!isOnline || largeBags >= 2 || bootTier !== 'LARGE_SUITCASES'}
                  onClick={() => adjustLargeBags(1)}
                  className="w-6 h-6 rounded-lg bg-[#222228] text-white flex items-center justify-center hover:bg-amber-400 hover:text-black transition-colors disabled:opacity-40"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Cabin Comfort & Preferences */}
      <div className={`space-y-3 transition-all duration-200 ${
        !isOnline ? 'opacity-65 pointer-events-none' : ''
      }`}>
        <div className="border-t border-white/10 pt-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cabin Comfort & Service Quality</span>
          </div>

          {/* Toggle Switch for AC */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#151518] border border-white/10 mb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Wind className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Air Conditioning (AC) Always Active
                </span>
                <span className="text-[10px] text-neutral-400 block">
                  Guarantees climate-controlled travel on NH48
                </span>
              </div>
            </div>

            {/* Custom Interactive Toggle Switch */}
            <button
              type="button"
              disabled={!isOnline}
              onClick={() => setHasAC(!hasAC)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                hasAC ? 'bg-amber-400' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-black transform transition-transform duration-200 ${
                  hasAC ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Detour & Wait Guarantee note */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#151518] border border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Leaf className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  ≤ 15% Detour Guarantee Active
                </span>
                <span className="text-[10px] text-neutral-400 block">
                  Route algorithm preserves mainline expressway efficiency
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Guaranteed
            </span>
          </div>
        </div>
      </div>

      {/* Section 5: Bottom Action Button */}
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
              <span>Updating Capacity Constraints...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>Save Vehicle Constraints</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
