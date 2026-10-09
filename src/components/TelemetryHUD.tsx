import React from 'react';
import {
  Compass,
  Gauge,
  Lock,
  Unlock,
  Radio,
  AlertTriangle,
} from 'lucide-react';
import { TelemetryStatus, CameraMode } from '../types/telemetry';

interface TelemetryHUDProps {
  status: TelemetryStatus;
  speedKmh: number;
  accuracyMeters: number;
  corridorStatus: string;
  isReconnecting: boolean;
  bufferedPingsCount: number;
  cameraMode: CameraMode;
  onToggleCameraMode: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

/**
 * TelemetryHUD Component
 *
 * Floating translucent telemetry bar positioned on top-right of the map:
 * - Live GPS Status & accuracy badge with pulsing indicator
 * - Dynamic Speed indicator (km/h)
 * - Corridor Status ("On-Route (NH 48 Expressway)")
 * - Reconnection warning pill with buffered ping counter
 * - Camera mode toggles ("Free Pan" vs "Lock to Driver")
 * - Geolocation simulator toggle ("Live GPS" vs "NH 48 Sim")
 */
export default function TelemetryHUD({
  status,
  speedKmh,
  accuracyMeters,
  corridorStatus,
  isReconnecting,
  bufferedPingsCount,
  cameraMode,
  onToggleCameraMode,
  isSimulating,
  onToggleSimulation,
}: TelemetryHUDProps) {
  const isGpsActive = status === 'active';
  const isDenied = status === 'denied';

  return (
    <div className="absolute top-4 right-16 z-30 flex flex-col items-end gap-2 pointer-events-auto max-w-[calc(100%-80px)] sm:max-w-none">
      {/* 1. Main Floating Translucent Pill Badge Over Map */}
      <div className="bg-[#1a1a1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-full p-1.5 sm:px-3 sm:py-1.5 shadow-2xl shadow-black/80 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 text-xs text-white transition-all hover:border-amber-400/40">
        {/* GPS Status & Accuracy */}
        <div className="flex items-center gap-2 px-1">
          <span className="relative flex h-2.5 w-2.5">
            {isGpsActive ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </>
            ) : isSimulating ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              </>
            ) : isDenied ? (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neutral-400" />
            )}
          </span>

          <span className="font-bold tracking-tight text-neutral-200 text-[11px] sm:text-xs whitespace-nowrap">
            {isGpsActive
              ? `GPS Active (±${accuracyMeters}m)`
              : isSimulating
              ? `Simulated GPS (±${accuracyMeters}m)`
              : isDenied
              ? 'GPS Permission Denied'
              : 'GPS Connecting...'}
          </span>
        </div>

        <div className="hidden sm:block w-px h-4 bg-white/10" />

        {/* Speed Badge */}
        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
          <Gauge className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-black text-amber-300 font-mono text-[11px] sm:text-xs tracking-tight">
            {speedKmh} km/h
          </span>
        </div>

        <div className="hidden sm:block w-px h-4 bg-white/10" />

        {/* Corridor Status */}
        <div className="flex items-center gap-1.5 text-neutral-300 text-[11px] sm:text-xs font-semibold whitespace-nowrap px-1">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate max-w-[130px] sm:max-w-none">{corridorStatus}</span>
        </div>

        {/* Mode & Simulator Quick Toggles */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Simulation Toggle */}
          <button
            type="button"
            onClick={onToggleSimulation}
            title={isSimulating ? 'Switch to Real Device GPS' : 'Switch to NH48 Highway Simulator'}
            className={`px-2 py-1 rounded-xl border text-[10px] font-bold tracking-wider transition-all flex items-center gap-1 ${
              isSimulating
                ? 'bg-amber-400/15 border-amber-400/35 text-amber-300 hover:bg-amber-400/25'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Radio className="w-3 h-3 text-amber-400" />
            <span>{isSimulating ? 'SIM NH48' : 'DEVICE GPS'}</span>
          </button>

          {/* Camera Lock Mode Toggle */}
          <button
            type="button"
            onClick={onToggleCameraMode}
            title={cameraMode === 'locked' ? 'Camera Locked to Driver' : 'Free Camera Pan Mode'}
            className={`px-2 py-1 rounded-xl border text-[10px] font-bold tracking-wider transition-all flex items-center gap-1 ${
              cameraMode === 'locked'
                ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {cameraMode === 'locked' ? (
              <>
                <Lock className="w-3 h-3 stroke-[2.5]" />
                <span className="hidden sm:inline">LOCKED</span>
              </>
            ) : (
              <>
                <Unlock className="w-3 h-3 stroke-[2.5]" />
                <span className="hidden sm:inline">FREE PAN</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Reconnection Warning Pill (Appears if Socket is Offline / Buffering) */}
      {isReconnecting && (
        <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/40 rounded-full px-3 py-1 shadow-lg shadow-black/60 flex items-center gap-2 text-amber-300 text-[11px] font-bold animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Reconnecting GPS telemetry...</span>
          {bufferedPingsCount > 0 && (
            <span className="bg-amber-400/20 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-200">
              {bufferedPingsCount} pings buffered
            </span>
          )}
        </div>
      )}
    </div>
  );
}
