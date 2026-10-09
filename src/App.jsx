import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ActiveManifestCockpit from './components/ActiveManifestCockpit';
import DriverProfileCard from './components/DriverProfileCard';
import CorridorMap from './components/CorridorMap';
import DriverAuthModal from './components/DriverAuthModal';
import DynamicRideOfferHUD from './components/DynamicRideOfferHUD';
import DriverEarningsWalletView from './components/DriverEarningsWalletView';
import DriverKycVerificationView from './components/DriverKycVerificationView';
import Toast from './components/Toast';
import {
  DEFAULT_DRIVER_PROFILE,
  ACTIVE_TRIP_MANIFEST,
  DYNAMIC_RIDE_OFFERS,
} from './data/corridorData';
import {
  ArrowLeft,
  Car,
  Shuffle,
  Compass,
  SlidersHorizontal,
  Wallet,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export default function App() {
  const [activeMode, setActiveMode] = useState('driver'); // 'passenger' | 'driver' | 'dispatch'
  const [verificationStatus, setVerificationStatus] = useState(() => {
    try {
      const stored = localStorage.getItem('smartpool_kyc_data');
      if (stored) {
        return JSON.parse(stored).verificationStatus || 'INCOMPLETE';
      }
    } catch {
      // fallback
    }
    return 'INCOMPLETE';
  });

  // When unverified driver logs in, display KYC automatically
  const [leftViewMode, setLeftViewMode] = useState(() => {
    try {
      const stored = localStorage.getItem('smartpool_kyc_data');
      if (stored && JSON.parse(stored).verificationStatus === 'VERIFIED') {
        return 'cockpit';
      }
    } catch {
      // fallback
    }
    return 'kyc'; // 'cockpit' | 'vehicle' | 'wallet' | 'kyc'
  });

  const [isOnline, setIsOnline] = useState(() => {
    try {
      const stored = localStorage.getItem('smartpool_kyc_data');
      if (stored && JSON.parse(stored).verificationStatus !== 'VERIFIED') {
        return false;
      }
    } catch {
      // fallback
    }
    return false; // Offline by default when KYC incomplete
  });
  const [isInTrip] = useState(true); // Active Trip Cockpit Mode
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const storedToken = localStorage.getItem('smartpool_access_token');
      return Boolean(storedToken);
    } catch {
      return true;
    }
  });

  const [driverProfile, setDriverProfile] = useState(() => {
    try {
      const storedProfile = localStorage.getItem('smartpool_driver_profile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        return {
          ...DEFAULT_DRIVER_PROFILE,
          name: parsed.fullName || DEFAULT_DRIVER_PROFILE.name,
          phone: parsed.phoneNumber || DEFAULT_DRIVER_PROFILE.phone,
        };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_DRIVER_PROFILE;
  });

  const [tripManifest, setTripManifest] = useState(ACTIVE_TRIP_MANIFEST);
  const [currentOccupancy, setCurrentOccupancy] = useState(ACTIVE_TRIP_MANIFEST.currentOccupancy);
  const [focusedStop, setFocusedStop] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeOffer, setActiveOffer] = useState(null);

  // Auto-schedule an incoming dynamic ride offer when in trip cockpit and online
  useEffect(() => {
    if (!isInTrip || !isOnline) return;

    // Trigger initial match offer after 2.5s for seamless interactive presentation
    const timer = setTimeout(() => {
      setActiveOffer(DYNAMIC_RIDE_OFFERS[0]);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isInTrip, isOnline]);

  // Handle Accepting Dynamic Corridor Offer
  const handleAcceptOffer = (offerId) => {
    const offer =
      activeOffer ||
      DYNAMIC_RIDE_OFFERS.find((o) => o.offerId === offerId) ||
      DYNAMIC_RIDE_OFFERS[0];

    if (!offer) return;

    // 1. Create Pickup Stop for the new matched passenger
    const newPickupStop = {
      id: `stop-pickup-${Date.now()}`,
      stopNumber: 2,
      totalStops: tripManifest.stops.length + 2,
      type: 'PICKUP',
      pinLabel: `P3: ${(offer.riderName || 'Ananya').split(' ')[0]}`,
      shortLabel: 'P3',
      riderName: offer.riderName || 'Ananya S.',
      phone: offer.phone || '+91 98334 21890',
      bags: 1,
      bagType: offer.luggageType || '🎒 1 Cabin Bag',
      locationName: offer.pickupLocation || 'Hinjawadi Flyover, Bay 2',
      eta: '4 mins',
      distance: offer.pickupDistance || '800m away',
      otp: offer.otp || '6218',
      lat: offer.pickupCoords ? offer.pickupCoords[0] : 18.5992,
      lng: offer.pickupCoords ? offer.pickupCoords[1] : 73.7395,
      status: 'QUEUED',
      detourTag: `+${offer.detourTimeMins || 4} min detour (+${offer.detourDistKm || 1.2} km)`,
      yieldBadge: `+₹${offer.payoutAmount || 185} Synergy`,
    };

    // 2. Create Dropoff Stop along the corridor
    const newDropoffStop = {
      id: `stop-dropoff-${Date.now()}`,
      stopNumber: tripManifest.stops.length + 2,
      totalStops: tripManifest.stops.length + 2,
      type: 'DROPOFF',
      pinLabel: `D3: ${(offer.riderName || 'Ananya').split(' ')[0]}`,
      shortLabel: 'D3',
      riderName: offer.riderName || 'Ananya S.',
      phone: offer.phone || '+91 98334 21890',
      bags: 1,
      bagType: offer.luggageType || '🎒 1 Cabin Bag',
      locationName: offer.dropoffLocation || 'Vashi Plaza, Navi Mumbai',
      eta: '1h 38m',
      distance: '136 km',
      otp: null,
      lat: offer.dropoffCoords ? offer.dropoffCoords[0] : 19.0680,
      lng: offer.dropoffCoords ? offer.dropoffCoords[1] : 72.9995,
      status: 'QUEUED',
      detourTag: offer.dropoffNote || 'Along active NH 48 corridor',
      yieldBadge: `Final Shapley Disbursal`,
    };

    // 3. Insert stops sequentially into active manifest queue
    setTripManifest((prev) => {
      const activeIdx = prev.stops.findIndex((s) => s.status === 'ACTIVE');
      const updatedStops = [...prev.stops];

      // Insert pickup right after active stop
      const insertPickupAt = activeIdx >= 0 ? activeIdx + 1 : 1;
      updatedStops.splice(insertPickupAt, 0, newPickupStop);

      // Insert dropoff before the final hub (Chembur Hub)
      const insertDropoffAt = Math.max(1, updatedStops.length - 1);
      updatedStops.splice(insertDropoffAt, 0, newDropoffStop);

      // Re-sequence sequential numbers
      const sequencedStops = updatedStops.map((stop, index) => ({
        ...stop,
        stopNumber: index + 1,
        totalStops: updatedStops.length,
      }));

      const newPooledSynergy = prev.pooledSynergy + (offer.payoutAmount || 185);
      const newEstEarnings = prev.estEarnings + (offer.payoutAmount || 185);

      return {
        ...prev,
        stops: sequencedStops,
        pooledSynergy: newPooledSynergy,
        estEarnings: newEstEarnings,
      };
    });

    // Update occupancy count
    setCurrentOccupancy((prev) =>
      Math.min(tripManifest.maxCapacity, prev + (offer.seatCount || 1))
    );

    // Focus on the newly inserted pickup stop so map flies to it
    setFocusedStop(newPickupStop);
    setActiveOffer(null);

    setToastMessage(
      `⚡ Corridor Match Accepted! ${offer.riderName || 'Ananya'} (+₹${offer.payoutAmount || 185}) inserted into active manifest queue within 15% detour limit.`
    );
  };

  // Handle Declining Dynamic Offer
  const handleDeclineOffer = (_offerId) => {
    setActiveOffer(null);
    setToastMessage(
      '🚫 Corridor offer declined. Cascading immediately to next vehicle along NH48.'
    );
  };

  // Handle Timeout (15s Elapsed)
  const handleTimeoutOffer = (_offerId) => {
    setActiveOffer(null);
    setToastMessage(
      '⏱️ Corridor offer timed out (15s limit). Cascading to next available vehicle along NH48.'
    );
  };

  // Handle Manual Simulation trigger from Cockpit
  const handleSimulateOffer = () => {
    const isFirst = !tripManifest.stops.some((s) => s.riderName?.includes('Ananya'));
    const template = isFirst ? DYNAMIC_RIDE_OFFERS[0] : DYNAMIC_RIDE_OFFERS[1];
    setActiveOffer({
      ...template,
      offerId: `OFFER-NH48-${Date.now().toString().slice(-4)}`,
    });
    setToastMessage(
      '⚡ Incoming pooled corridor match identified! 15 seconds to accept before cascade.'
    );
  };

  // Handle successful passwordless OTP verification
  const handleAuthSuccess = ({ driver, isNewDriver }) => {
    setIsAuthenticated(true);

    if (driver?.fullName) {
      setDriverProfile((prev) => ({
        ...prev,
        name: driver.fullName,
        phone: driver.phoneNumber || prev.phone,
      }));
    }

    if (isNewDriver) {
      // New driver needs initial onboarding & vehicle capacity setup
      setLeftViewMode('setup');
      setActiveMode('driver');
      setToastMessage(
        `🎉 Welcome to smartpool! OTP verified for ${driver.phoneNumber}. Please configure your vehicle capacity matrix.`
      );
    } else {
      // Existing active driver goes directly to active drive console
      setLeftViewMode('cockpit');
      setActiveMode('driver');
      setToastMessage(
        `⚡ Captain ${driver.fullName || 'Sameer'} authenticated! Corridor dispatch & Shapley yield matrix synced.`
      );
    }
  };

  // Handle saving preferences
  const handleSaveProfile = (updatedData) => {
    setDriverProfile((prev) => ({
      ...prev,
      ...updatedData,
    }));
    setToastMessage(
      `Saved! Max ${updatedData.maxPooledPassengers} seats, ${updatedData.detourTolerancePercent}% detour tolerance synced with NH48 batch engine.`
    );
  };

  // Handle saving vehicle & luggage constraints
  const handleSaveVehicleConstraints = (vehicleData) => {
    setDriverProfile((prev) => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        ...vehicleData,
      },
      vehicleModel: `${vehicleData.make} ${vehicleData.model}`,
      vehicleNumber: vehicleData.plateNumber,
    }));
    setToastMessage(
      `Vehicle constraints synced! ${vehicleData.make} ${vehicleData.model} • ${vehicleData.cabinBags} cabin + ${vehicleData.largeBags} large bags capacity indexed.`
    );
  };

  // Handle Shift Log export
  const handleExportShiftLog = () => {
    setToastMessage('Shift statement generated! Downloading NH48 Shapley report (CSV)...');
    const csvContent =
      "data:text/csv;charset=utf-8,BatchID,Route,Passengers,ShapleyPayout,Detour\nSP-944,Pune-Mumbai,3,1420,8.6%\nSP-902,Pune-Mumbai,3,1450,11.2%\nSP-896,Mumbai-Lonavala,2,1080,6.5%";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartpool_shift_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleOnline = () => {
    if (!isOnline && verificationStatus !== 'VERIFIED') {
      setToastMessage(
        '⚠️ Shift Lock Active: Going Online is locked until your documents are approved by our safety desk.'
      );
      setLeftViewMode('kyc');
      return;
    }

    setIsOnline((prev) => {
      const next = !prev;
      setToastMessage(
        next
          ? 'Captain Status: Online. Ready to receive corridor batch dispatches.'
          : 'Captain Status: Standby. Paused from automatic pooling dispatches.'
      );
      return next;
    });
  };

  // Boarding OTP verification & Stop Progression
  const handleVerifyBoarding = (stopId, _otpCode) => {
    const targetStop = tripManifest.stops.find((s) => s.id === stopId);
    if (!targetStop) return;

    const isPickup = targetStop.type === 'PICKUP';

    setTripManifest((prev) => {
      const updatedStops = prev.stops.map((stop) => {
        if (stop.id === stopId) {
          return { ...stop, status: 'COMPLETED' };
        }
        return stop;
      });

      // Find next pending/queued stop and promote it to ACTIVE
      let foundNext = false;
      const finalStops = updatedStops.map((stop) => {
        if (!foundNext && stop.status === 'QUEUED') {
          foundNext = true;
          return { ...stop, status: 'ACTIVE' };
        }
        return stop;
      });

      return {
        ...prev,
        stops: finalStops,
      };
    });

    if (isPickup) {
      setCurrentOccupancy((prev) => Math.min(tripManifest.maxCapacity, prev + 1));
      setToastMessage(
        `🎉 OTP Verified! ${targetStop.riderName} boarded. Live occupancy: 3/3 seats full. Detour within 15% guaranteed.`
      );
    } else {
      setCurrentOccupancy((prev) => Math.max(0, prev - 1));
      setToastMessage(
        `Drop-off complete for ${targetStop.riderName} at ${targetStop.locationName}! Seats freed up.`
      );
    }
  };

  // Map centering / navigation action
  const handleNavigateToStop = (stop) => {
    setFocusedStop(stop);
    setToastMessage(
      `🧭 Map focused on Stop ${stop.stopNumber || stop.shortLabel}: ${stop.locationName || stop.location} (${stop.eta} away)`
    );
  };

  // Emergency SOS dispatch trigger
  const handleTriggerSOS = () => {
    setToastMessage(
      '🚨 EMERGENCY SOS ACTIVATED: Highway Patrol & NH48 Quick-Response Team dispatched to your GPS telemetry coordinates (Lat 18.5985, Lng 73.7380).'
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. Shared Top Navigation Bar */}
      <Navbar
        activeMode={activeMode}
        onModeChange={(mode) => {
          if (mode === 'passenger' || mode === 'dispatch') {
            setActiveMode(mode);
          } else {
            setActiveMode('driver');
          }
        }}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        driverInitials={driverProfile.name.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'SK'}
        driverName={driverProfile.name}
        isInTrip={isInTrip}
        currentOccupancy={currentOccupancy}
        maxCapacity={tripManifest.maxCapacity}
        corridorName={tripManifest.corridorName}
        isAuthenticated={isAuthenticated}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenWallet={() => setLeftViewMode('wallet')}
        verificationStatus={verificationStatus}
        onOpenKyc={() => setLeftViewMode('kyc')}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 md:px-7 py-4 md:py-6 flex flex-col">
        {activeMode === 'driver' ? (
          /* Two-Column Split Layout for Driver Interface */
          <div className="flex-1 flex flex-col lg:flex-row gap-5 lg:gap-6 min-h-[calc(100vh-105px)]">
            
            {/* Left Column: Sub-Navigation [ Console ] | [ Vehicle ] | [ Wallet ] | [ KYC & Docs ] */}
            <div className="w-full lg:w-[460px] xl:w-[480px] shrink-0 flex flex-col gap-4">
              {/* 1. Layout & Sub-Navigation Tabs */}
              <div className="bg-[#1a1a1e] border border-white/10 rounded-2xl p-1.5 shadow-xl flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => setLeftViewMode('cockpit')}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    leftViewMode === 'cockpit'
                      ? 'bg-amber-400 text-black shadow-md font-extrabold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Console</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeftViewMode('vehicle')}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    leftViewMode === 'vehicle'
                      ? 'bg-amber-400 text-black shadow-md font-extrabold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Vehicle</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeftViewMode('wallet')}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    leftViewMode === 'wallet'
                      ? 'bg-amber-400 text-black shadow-md font-extrabold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeftViewMode('kyc')}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
                    leftViewMode === 'kyc'
                      ? 'bg-amber-400 text-black shadow-md font-extrabold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {verificationStatus === 'VERIFIED' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>KYC</span>
                  {verificationStatus !== 'VERIFIED' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse absolute top-1.5 right-1.5" />
                  )}
                </button>
              </div>

              {/* View 1: Active Ride Manifest & Multi-Stop Tracking Cockpit */}
              {leftViewMode === 'cockpit' && (
                <ActiveManifestCockpit
                  manifest={tripManifest}
                  occupancy={currentOccupancy}
                  onVerifyBoarding={handleVerifyBoarding}
                  onNavigateToStop={handleNavigateToStop}
                  onTriggerSOS={handleTriggerSOS}
                  onSwitchToSetupView={() => setLeftViewMode('vehicle')}
                  onSwitchToWalletView={() => setLeftViewMode('wallet')}
                  onSimulateOffer={handleSimulateOffer}
                />
              )}

              {/* View 2: Vehicle Setup & Captain Configuration */}
              {leftViewMode === 'vehicle' && (
                <div className="w-full flex flex-col gap-3">
                  <button
                    onClick={() => setLeftViewMode('cockpit')}
                    className="w-full py-2.5 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-between font-bold text-xs transition-all shadow-md active:scale-98"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Return to Active Ride Manifest Cockpit</span>
                    </span>
                    <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded-full font-black">
                      LIVE TRIP
                    </span>
                  </button>

                  <DriverProfileCard
                    profile={driverProfile}
                    isOnline={isOnline}
                    onToggleOnline={handleToggleOnline}
                    onSaveProfile={handleSaveProfile}
                    onSaveVehicleConstraints={handleSaveVehicleConstraints}
                    onExportShiftLog={handleExportShiftLog}
                    verificationStatus={verificationStatus}
                    onOpenKyc={() => setLeftViewMode('kyc')}
                  />
                </div>
              )}

              {/* View 3: Driver Earnings, Shapley Ledger & Wallet */}
              {leftViewMode === 'wallet' && (
                <DriverEarningsWalletView
                  currentTab="wallet"
                  hideSubNav={true}
                  driverName={driverProfile.name}
                  upiVpa={driverProfile.upiVpa || 'sameer@okhdfcbank'}
                  onExportCsv={handleExportShiftLog}
                />
              )}

              {/* View 4: Driver KYC & Document Verification */}
              {leftViewMode === 'kyc' && (
                <DriverKycVerificationView
                  currentTab="kyc"
                  hideSubNav={true}
                  onStatusChange={(status) => {
                    setVerificationStatus(status);
                    setToastMessage(
                      status === 'VERIFIED'
                        ? '🎉 Captain Verified! Full corridor access unlocked. You may now go Online.'
                        : status === 'UNDER_REVIEW'
                        ? '🕒 Documents Under Review! Typical verification: ~2 hours.'
                        : '⚠️ Verification Incomplete: Submissions required before going online.'
                    );
                  }}
                  onKycSubmitted={() => {
                    setVerificationStatus('UNDER_REVIEW');
                  }}
                />
              )}
            </div>

            {/* Right Column: Interactive Map & Live Multi-Stop Corridor View */}
            <CorridorMap
              driverProfile={driverProfile}
              manifest={tripManifest}
              preferredCorridor={driverProfile.preferredEndCorridor}
              isOnline={isOnline}
              isInTrip={isInTrip}
              focusedStop={focusedStop}
              onStopClick={handleNavigateToStop}
            />
          </div>
        ) : (
          /* Friendly Mode Switcher Placeholder if user clicks Ride or Dispatch */
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="max-w-md w-full bg-[#1a1a1e] border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                {activeMode === 'passenger' ? (
                  <Car className="w-7 h-7" />
                ) : (
                  <Shuffle className="w-7 h-7" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white capitalize">
                {activeMode === 'passenger' ? 'Passenger Ride Portal' : 'Admin Dispatch Console'}
              </h2>
              <p className="text-xs text-neutral-400">
                You are currently previewing the Driver Interface Portal for Captains. Switch back to Drive mode to view the active multi-stop manifest queue and live corridor cockpit.
              </p>
              <button
                onClick={() => setActiveMode('driver')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm transition-colors shadow-lg shadow-amber-400/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Captain Drive Portal</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Real-time Dynamic Ride Offer HUD / Modal */}
      {activeOffer && (
        <DynamicRideOfferHUD
          offer={activeOffer}
          onAccept={handleAcceptOffer}
          onDecline={handleDeclineOffer}
          onTimeout={handleTimeoutOffer}
        />
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* Driver Passwordless OTP Authentication Modal */}
      <DriverAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
