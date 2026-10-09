import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  Navigation,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

export default function ActiveManifestCockpit({
  manifest,
  occupancy: _occupancy,
  onVerifyBoarding,
  onNavigateToStop,
  onTriggerSOS,
  onSwitchToSetupView,
}) {
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Active stop is the first stop with status === 'ACTIVE', or next non-completed
  const activeStop = manifest.stops.find((s) => s.status === 'ACTIVE') || manifest.stops[0];
  const queuedStops = manifest.stops.filter((s) => s.id !== activeStop?.id);

  const handleVerifyOtp = (e) => {
    e?.preventDefault();
    if (!activeStop) return;

    if (otpInput.length !== 4) {
      setOtpError('Please enter a 4-digit verification code.');
      return;
    }

    if (activeStop.otp && otpInput !== activeStop.otp) {
      setOtpError(`Incorrect OTP. Passenger code is ${activeStop.otp}`);
      return;
    }

    setOtpError(null);
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      onVerifyBoarding?.(activeStop.id, otpInput);
      setOtpInput('');
    }, 400);
  };

  const handleAutoFillOtp = () => {
    if (activeStop?.otp) {
      setOtpInput(activeStop.otp);
      setOtpError(null);
    }
  };

  return (
    <div className="w-full lg:w-[440px] shrink-0 flex flex-col gap-4">
      {/* 1. Header Card with Live Payout Tracker */}
      <div className="bg-[#1a1a1e] rounded-3xl border border-white/10 p-5 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header & Switcher */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" />
            <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
              COCKPIT MODE • NH48
            </span>
          </div>

          {/* Quick toggle to return to Driver Setup/Vehicle Matrix */}
          {onSwitchToSetupView && (
            <button
              onClick={onSwitchToSetupView}
              title="Open Vehicle & Profile Settings"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-[11px] font-medium transition-all"
            >
              <SlidersHorizontal className="w-3 h-3 text-amber-400" />
              <span>Setup & Vehicle</span>
            </button>
          )}
        </div>

        <h1 className="text-xl font-black text-white tracking-tight">
          Active Manifest Queue
        </h1>
        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
          Stops are algorithmically ordered strictly within the{' '}
          <span className="text-amber-400 font-medium">15% detour limit</span>.
        </p>

        {/* Current Live Payout Tracker (Dark Sunken Card) */}
        <div className="mt-4 bg-[#151518] border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-inner">
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
              <span>Est. Earnings</span>
              <span className="text-[10px] text-neutral-500 font-mono">
                ({manifest.tripBatchId})
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span>₹{manifest.estEarnings.toLocaleString('en-IN')}</span>
              <span className="text-xs text-neutral-400 font-normal">total</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full shadow-sm">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>+₹{manifest.pooledSynergy} Pooled Synergy</span>
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">
              Base ₹{manifest.basePayout} • Shapley Share
            </span>
          </div>
        </div>

        {/* Live Trip Progress Bar */}
        <div className="mt-3.5 flex items-center justify-between text-[11px] text-neutral-400 mb-1.5 font-medium">
          <span>
            Batch Progress:{' '}
            <strong className="text-white">
              Stop {activeStop?.stopNumber || 1} of {manifest.stops.length}
            </strong>
          </span>
          <span className="text-amber-400 font-mono font-bold">
            {Math.round(((activeStop?.stopNumber - 1) / manifest.stops.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(25, ((activeStop?.stopNumber || 1) / manifest.stops.length) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* 2. Current Active Stop Card (Highlighted with Amber Border & Glow) */}
      {activeStop && (
        <div className="bg-[#1a1a1e] rounded-3xl border-2 border-amber-400/90 shadow-[0_0_30px_rgba(245,158,11,0.22)] p-5 relative overflow-hidden transition-all duration-300">
          {/* Subtle top indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />

          {/* Stop Type Badge */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-black text-xs font-black tracking-wide uppercase shadow-md shadow-amber-400/20">
              <span className="w-2 h-2 rounded-full bg-black animate-ping" />
              <span>
                NEXT STOP: {activeStop.type} (Stop {activeStop.stopNumber} of {activeStop.totalStops})
              </span>
            </span>

            <span className="text-[11px] text-neutral-400 font-mono font-medium">
              Bay {activeStop.stopNumber}
            </span>
          </div>

          {/* Rider Info Row */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-400/40 flex items-center justify-center text-amber-300 font-extrabold text-sm shadow-inner">
                {activeStop.riderName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {activeStop.riderName}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                    {activeStop.bagType}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Pooled Passenger • Bound for Mumbai
                </p>
              </div>
            </div>

            {/* Quick Actions: Call / Chat */}
            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${activeStop.phone}`}
                title="Call Passenger"
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-amber-400 hover:text-black border border-white/10 flex items-center justify-center text-neutral-300 transition-colors active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => alert(`Opening encrypted chat with ${activeStop.riderName}...`)}
                title="Chat with Passenger"
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-amber-400 hover:text-black border border-white/10 flex items-center justify-center text-neutral-300 transition-colors active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Location & ETA Block */}
          <div className="mt-3.5 space-y-1">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {activeStop.locationName}
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold mt-0.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>ETA: {activeStop.eta} ({activeStop.distance})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Boarding Action: 4-digit OTP Form */}
          {activeStop.type === 'PICKUP' ? (
            <div className="mt-4 pt-3.5 border-t border-white/10">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-neutral-300">
                  Passenger Boarding OTP
                </span>
                {activeStop.otp && (
                  <button
                    type="button"
                    onClick={handleAutoFillOtp}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline cursor-pointer"
                  >
                    Demo OTP: {activeStop.otp}
                  </button>
                )}
              </div>

              <form onSubmit={handleVerifyOtp} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, ''));
                      setOtpError(null);
                    }}
                    placeholder="Enter 4-digit code"
                    className="w-full bg-[#151518] border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white rounded-xl px-3.5 py-2.5 text-center font-mono text-base tracking-widest outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || otpInput.length !== 4}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-400/20 active:scale-95 shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{isVerifying ? 'Verifying...' : 'Verify & Board'}</span>
                </button>
              </form>

              {otpError && (
                <p className="text-[11px] text-rose-400 font-medium mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {otpError}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-200">
                  Drop-Off Concluding Stop
                </span>
                <p className="text-[11px] text-neutral-400">
                  Verify passenger arrival at destination hub.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onVerifyBoarding?.(activeStop.id, 'DROPOFF')}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Complete Drop-Off</span>
              </button>
            </div>
          )}

          {/* Action Row: Navigate Here button */}
          <div className="mt-3.5 flex gap-2">
            <button
              type="button"
              onClick={() => onNavigateToStop?.(activeStop)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 text-neutral-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
              <span>Navigate Here (Center Map)</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Upcoming Queued Stops (Vertical Timeline / Step List) */}
      <div className="bg-[#1a1a1e] rounded-3xl border border-white/10 p-5 shadow-2xl flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-tight uppercase">
              Upcoming Queued Stops
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 border border-white/10">
              {queuedStops.length} En Route
            </span>
          </div>

          <span className="text-[10px] text-amber-400/90 font-mono font-medium">
            Strict Detour ≤ 15%
          </span>
        </div>

        {/* Step List connected by vertical dashed line */}
        <div className="relative pl-6 space-y-4 my-1">
          {/* Vertical dashed timeline bar */}
          <div className="absolute left-[11px] top-2 bottom-3 w-px border-l-2 border-dashed border-amber-500/30" />

          {queuedStops.map((stop) => {
            const isPickup = stop.type === 'PICKUP';

            return (
              <div
                key={stop.id}
                onClick={() => onNavigateToStop?.(stop)}
                className="group relative cursor-pointer select-none"
              >
                {/* Timeline node marker */}
                <div
                  className={`absolute -left-[23px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-black transition-transform group-hover:scale-110 shadow-sm ${
                    isPickup
                      ? 'bg-[#1a1a1e] border-amber-400 text-amber-400 shadow-amber-500/20'
                      : 'bg-[#1a1a1e] border-emerald-400 text-emerald-400 shadow-emerald-500/20'
                  }`}
                >
                  {stop.stopNumber}
                </div>

                {/* Stop Card */}
                <div className="bg-[#151518] hover:bg-[#1f1f24] border border-white/5 hover:border-amber-400/30 rounded-2xl p-3.5 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          isPickup
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {stop.type}
                      </span>
                      <span className="text-xs font-bold text-white">
                        • {stop.riderName}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                      Queued
                    </span>
                  </div>

                  {/* Location & Detour Info */}
                  <div className="mt-1.5">
                    <div className="text-xs font-semibold text-neutral-200 group-hover:text-amber-300 transition-colors">
                      at {stop.locationName}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400">
                      <span className="text-amber-400/90 font-mono text-[10px]">
                        ({stop.detourTag})
                      </span>
                      <span>•</span>
                      <span>ETA: {stop.eta}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Emergency / SOS Button at the bottom of the card */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onTriggerSOS}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-extrabold transition-all shadow-lg shadow-red-500/5 active:scale-95 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Emergency / SOS Highway Patrol</span>
          </button>
          <p className="text-[10px] text-center text-neutral-500 mt-1.5">
            Instant 24x7 SOS dispatch to NH48 Highway Police & SmartPool incident team.
          </p>
        </div>
      </div>
    </div>
  );
}
