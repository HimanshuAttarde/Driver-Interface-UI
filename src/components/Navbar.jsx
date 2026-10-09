import React from 'react';
import { Route, Car, Navigation, Shuffle, Zap } from 'lucide-react';

export default function Navbar({
  activeMode = 'driver',
  onModeChange,
  isOnline = true,
  onToggleOnline,
  driverInitials = 'SK',
  driverName = 'Sameer Khan',
  isInTrip = true,
  currentOccupancy = 2,
  maxCapacity = 3,
  corridorName = 'Pune ➔ Mumbai NH48',
}) {
  const modes = [
    { id: 'passenger', label: 'Ride', icon: Car, emoji: '🚗' },
    { id: 'driver', label: 'Drive', icon: Navigation, emoji: '🚀' },
    { id: 'dispatch', label: 'Dispatch', icon: Shuffle, emoji: '🔀' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0f0f11]/95 backdrop-blur-md border-b border-white/10 px-4 md:px-7 py-3 transition-colors">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-3">
        
        {/* Brand Logo & In-Trip Telemetry Eyebrow */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              <Route className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex items-baseline">
              <span className="text-xl md:text-2xl font-black tracking-tight text-white lowercase">
                smartpool<span className="text-amber-400">.</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Captain
              </span>
            </div>
          </div>

          {/* 1. Status Header: Pulsing amber pill: ● IN TRIP • Corridors Active (Pune ➔ Mumbai NH48) */}
          {isInTrip && (
            <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm shadow-amber-500/10 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              <span>IN TRIP • Corridors Active ({corridorName})</span>
            </div>
          )}
        </div>

        {/* Center: Segmented Pill Switcher (Keeps [ Drive ] active) */}
        <nav
          aria-label="Experience Switcher"
          className="flex items-center bg-[#151518] p-1 rounded-full border border-white/10 shadow-inner"
        >
          {modes.map((item) => {
            const isActive = activeMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onModeChange?.(item.id)}
                className={`relative flex items-center gap-1.5 px-3.5 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 select-none cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-400/25 font-bold scale-[1.02]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-xs md:text-sm">{item.emoji}</span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-black/40 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Top-Right Status: Occupancy Pill, Shift Toggle & Driver Badge */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* 1. Occupancy Pill: Show live seat status: 👥 Seats: 2/3 Occupied */}
          {isInTrip ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#151518] border border-white/10 text-xs font-bold text-neutral-200 shadow-inner">
              <span className="text-amber-400 text-sm">👥</span>
              <span>
                Seats:{' '}
                <strong className="text-white">
                  {currentOccupancy}/{maxCapacity}
                </strong>{' '}
                Occupied
              </span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#151518] border border-white/10 text-neutral-300 text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-neutral-400">Batching:</span>
              <span className="text-white font-medium">NH48 Active</span>
            </div>
          )}

          {/* Online/Offline Shift Toggle */}
          <div className="relative">
            <button
              onClick={() => onToggleOnline?.()}
              title={isOnline ? "Shift active: click to Go Offline" : "Shift offline: click to Go Online"}
              className={`flex items-center gap-2 px-3 py-1.5 md:px-3.5 md:py-1.5 rounded-full text-xs font-bold border transition-all duration-200 select-none cursor-pointer active:scale-95 ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-sm shadow-emerald-500/10 hover:bg-emerald-500/20'
                  : 'bg-[#151518] text-neutral-400 border-white/10 hover:text-white hover:border-amber-400/40 hover:bg-white/5'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isOnline ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-500" />
                )}
              </span>
              <span className="hidden sm:inline-block">
                {isOnline ? "You're Online" : "Go Online"}
              </span>
            </button>
          </div>

          {/* Driver Avatar Badge Pill */}
          <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-[#1a1a1e] border border-white/10 shadow-sm hover:border-amber-400/40 transition-colors">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-extrabold text-xs md:text-sm flex items-center justify-center shadow-inner">
              {driverInitials}
            </div>
            <div className="hidden md:flex flex-col text-left leading-tight pr-1">
              <span className="text-xs font-bold text-white truncate max-w-[90px]">{driverName}</span>
              <span className="text-[10px] text-amber-400 font-medium">Captain</span>
            </div>
          </div>

        </div>

      </div>

      {/* Mobile Sub-Header Pill for In-Trip status on small viewports */}
      {isInTrip && (
        <div className="xl:hidden mt-2 pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-bold truncate">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="truncate">IN TRIP • Corridors Active ({corridorName})</span>
          </div>
          <span className="text-neutral-400 text-[11px] shrink-0">
            {currentOccupancy}/{maxCapacity} Seats
          </span>
        </div>
      )}
    </header>
  );
}
