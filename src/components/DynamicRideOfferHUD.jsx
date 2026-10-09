import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap,
  Clock,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Compass,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

/**
 * DynamicRideOfferHUD Component
 *
 * Real-time floating modal HUD that displays a dynamic ride offer
 * along the active NH48 corridor with a 15-second countdown timer,
 * financial Shapley yield breakdown, detour guarantee matrix,
 * keyboard controls, and audio cue feedback.
 */
export default function DynamicRideOfferHUD({
  offer,
  onAccept,
  onDecline,
  onTimeout,
}) {
  const [remainingMs, setRemainingMs] = useState(() => (offer?.expiresInSeconds || 15) * 1000);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const totalDurationMs = (offer?.expiresInSeconds || 15) * 1000;
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const hasPlayedChimeRef = useRef(false);

  // Sound effect trigger (audio chime/ping when the offer first mounts)
  useEffect(() => {
    if (!hasPlayedChimeRef.current) {
      hasPlayedChimeRef.current = true;
      soundFx.playRadarChime();
    }
  }, []);

  // Handle Decline
  const handleDecline = useCallback(() => {
    if (isAccepted || isDeclining || !offer) return;
    setIsDeclining(true);
    soundFx.playDeclineChime();
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      onDecline?.(offer.offerId);
    }, 220);
  }, [isAccepted, isDeclining, offer, onDecline]);

  // Handle Accept
  const handleAccept = useCallback(() => {
    if (isAccepted || isDeclining || !offer) return;
    setIsAccepted(true);
    soundFx.playSuccessChime();
    if (timerRef.current) clearInterval(timerRef.current);

    // Show quick success checkmark animation before updating manifest queue
    setTimeout(() => {
      onAccept?.(offer.offerId);
    }, 950);
  }, [isAccepted, isDeclining, offer, onAccept]);

  // Handle Timeout
  const handleTimeout = useCallback(() => {
    if (isAccepted || isDeclining || !offer) return;
    setIsDeclining(true);
    soundFx.playDeclineChime();
    if (timerRef.current) clearInterval(timerRef.current);
    onTimeout?.(offer.offerId);
  }, [isAccepted, isDeclining, offer, onTimeout]);

  // 15-second countdown progress timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    const intervalMs = 50;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const left = Math.max(0, totalDurationMs - elapsed);
      setRemainingMs(left);

      if (left <= 0) {
        clearInterval(timerRef.current);
        handleTimeout();
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalDurationMs, handleTimeout]);

  // Keyboard shortcuts: Spacebar or Enter to accept, Esc to decline
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is interacting with text inputs
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleDecline();
      } else if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleAccept();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAccept, handleDecline]);

  if (!offer) return null;

  const secondsRemaining = Math.max(0, Math.ceil(remainingMs / 1000));
  const progressPercent = Math.max(0, Math.min(100, (remainingMs / totalDurationMs) * 100));
  const isExpiringSoon = secondsRemaining <= 4;

  const currentSeats = offer.currentSeats || 2;
  const totalSeats = offer.totalSeats || 3;
  const newSeats = Math.min(totalSeats, currentSeats + (offer.seatCount || 1));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New Pooled Corridor Match Offer"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm pointer-events-auto transition-all duration-300"
    >
      {/* High-priority floating alert modal container */}
      <div
        className={`bg-[#1a1a1e]/95 backdrop-blur-xl border-2 ${
          isExpiringSoon ? 'border-amber-400' : 'border-amber-500/40'
        } rounded-3xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(245,158,11,0.25)] text-white z-50 relative overflow-hidden transition-all duration-300 transform ${
          isAccepted ? 'scale-[1.02] border-emerald-400' : 'scale-100'
        }`}
      >
        {/* Ambient background glow accents */}
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ================= SUCCESS CHECKMARK STATE ================= */}
        {isAccepted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5] animate-bounce" />
              </div>
              <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Match Accepted & Stop Inserted
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Stop Inserted into Active Manifest
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                <span className="text-white font-bold">{offer.pickupLocation}</span> added to sequential stop queue. Updating NH48 corridor route...
              </p>
            </div>

            <div className="bg-[#151518] border border-emerald-500/30 rounded-2xl p-3 w-full max-w-xs flex items-center justify-between text-xs">
              <span className="text-neutral-400">Added Payout:</span>
              <span className="text-emerald-400 font-extrabold text-sm">
                +₹{offer.payoutAmount}
              </span>
            </div>
          </div>
        ) : (
          /* ================= ACTIVE OFFER HUD STATE ================= */
          <div className="space-y-5">
            {/* 2. Top Header & 15-Second Countdown Timer */}
            <div>
              <div className="flex items-center justify-between gap-3">
                {/* Eyebrow: Pulsing amber indicator */}
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                  </span>
                  <span className="text-[11px] font-black tracking-wider text-amber-400 uppercase flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-amber-400" />
                    NEW POOLED CORRIDOR MATCH
                  </span>
                </div>

                {/* 15s Countdown Display */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black font-mono transition-colors ${
                    isExpiringSoon
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <Clock className={`w-3.5 h-3.5 ${isExpiringSoon ? 'text-rose-400' : 'text-amber-400'}`} />
                  <span>{secondsRemaining}s remaining</span>
                </div>
              </div>

              {/* Linear Countdown Progress Bar shrinking smoothly 100% -> 0% */}
              <div className="mt-2.5 w-full bg-black/50 border border-white/10 rounded-full h-2 p-0.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-75 ease-linear shadow-sm ${
                    isExpiringSoon
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                      : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 3. Financial & Yield Impact Card (The Shapley Pitch) */}
            <div className="bg-[#151518] border border-white/10 hover:border-amber-500/30 rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between gap-3">
                {/* Prominent Earnings Badge */}
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    Additional Corridor Yield
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                      +₹{offer.payoutAmount}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">
                      instant payout
                    </span>
                  </div>
                </div>

                {/* Sub-badge: Amber pill showing synergy percentage */}
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-black">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>+{offer.synergyPercentage || 28}% batch synergy</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Guaranteed payout
                  </span>
                </div>
              </div>

              {/* Seat Occupancy Delta & Luggage Tag */}
              <div className="mt-3.5 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs">
                {/* Visual Seat Pill */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-neutral-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="font-semibold text-white">
                    +{offer.seatCount || 1} Passenger
                  </span>
                  <span className="text-neutral-400">
                    (Seats: {newSeats}/{totalSeats} filled)
                  </span>
                </div>

                {/* Luggage Tag */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-neutral-300">
                  <span className="font-semibold text-neutral-200">
                    {offer.luggageType || '🎒 1 Cabin Bag'}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    • Trunk Verified
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Corridor & Detour Impact Matrix */}
            <div className="space-y-2.5">
              {/* Detour Metric Card (15% Guarantee) */}
              <div className="bg-[#151518]/80 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-neutral-400 font-medium">Detour Added: </span>
                    <strong className="text-white font-black">
                      +{offer.detourTimeMins || 4} mins (+{offer.detourDistKm || 1.2} km)
                    </strong>
                  </div>
                </div>

                {/* Small green shield icon: Within 15% corridor detour limit */}
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-bold shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Within 15% corridor limit</span>
                </div>
              </div>

              {/* Waypoint Preview Stepper */}
              <div className="bg-[#151518]/60 border border-white/10 rounded-2xl p-3.5 space-y-3">
                {/* Pickup Location */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-amber-400/30">
                    P
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                        PICKUP • {offer.riderName || 'Ananya'}
                      </span>
                      <span className="text-[11px] font-bold text-neutral-400">
                        {offer.pickupDistance || '800m away'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white truncate mt-0.5">
                      {offer.pickupLocation || 'Hinjawadi Flyover, Bay 2'}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                <div className="ml-3 pl-3 border-l-2 border-dashed border-amber-500/30 py-0.5">
                  <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-amber-400/60" />
                    <span>Direct highway corridor ingress</span>
                  </div>
                </div>

                {/* Dropoff Location */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-400 text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-emerald-400/30">
                    D
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                        DROP-OFF DESTINATION
                      </span>
                      <span className="text-[11px] text-neutral-400 font-medium">
                        Expressway Route
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white truncate mt-0.5">
                      {offer.dropoffLocation || 'Vashi Plaza, Navi Mumbai'}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {offer.dropoffNote || 'Along active NH 48 corridor'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Interactive Action Controls (Bottom button split) */}
            <div className="pt-2 flex items-center gap-3">
              {/* Reject Button (Left, ~35% width) */}
              <button
                type="button"
                onClick={handleDecline}
                disabled={isAccepted}
                className="w-[35%] py-4 px-3 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 text-gray-400 hover:text-white font-semibold transition active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
              >
                <span>Decline</span>
                <span className="text-[10px] font-mono text-neutral-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 hidden sm:inline">
                  Esc
                </span>
              </button>

              {/* Accept Button (Right, ~65% width) */}
              <button
                type="button"
                onClick={handleAccept}
                disabled={isAccepted}
                className="w-[65%] py-4 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold transition shadow-lg shadow-amber-400/25 active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 animate-pulse hover:animate-none"
              >
                <Zap className="w-4 h-4 fill-black shrink-0" />
                <span className="truncate">Accept & Insert Stop (+₹{offer.payoutAmount})</span>
                <span className="text-[10px] font-mono bg-black/15 text-black px-1.5 py-0.5 rounded font-black hidden sm:inline">
                  ↵ Space
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
