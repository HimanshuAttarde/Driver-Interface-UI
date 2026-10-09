import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ActiveManifestCockpit from './components/ActiveManifestCockpit';
import DriverProfileCard from './components/DriverProfileCard';
import CorridorMap from './components/CorridorMap';
import Toast from './components/Toast';
import {
  DEFAULT_DRIVER_PROFILE,
  ACTIVE_TRIP_MANIFEST,
} from './data/corridorData';
import { ArrowLeft, Car, Shuffle } from 'lucide-react';

export default function App() {
  const [activeMode, setActiveMode] = useState('driver'); // 'passenger' | 'driver' | 'dispatch'
  const [isOnline, setIsOnline] = useState(true);
  const [isInTrip] = useState(true); // Active Trip Cockpit Mode
  const [leftViewMode, setLeftViewMode] = useState('cockpit'); // 'cockpit' | 'setup'
  const [driverProfile, setDriverProfile] = useState(DEFAULT_DRIVER_PROFILE);
  const [tripManifest, setTripManifest] = useState(ACTIVE_TRIP_MANIFEST);
  const [currentOccupancy, setCurrentOccupancy] = useState(ACTIVE_TRIP_MANIFEST.currentOccupancy);
  const [focusedStop, setFocusedStop] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

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
        driverInitials="SK"
        driverName={driverProfile.name}
        isInTrip={isInTrip}
        currentOccupancy={currentOccupancy}
        maxCapacity={tripManifest.maxCapacity}
        corridorName={tripManifest.corridorName}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 md:px-7 py-4 md:py-6 flex flex-col">
        {activeMode === 'driver' ? (
          /* Two-Column Split Layout for Driver Interface */
          <div className="flex-1 flex flex-col lg:flex-row gap-5 lg:gap-6 min-h-[calc(100vh-105px)]">
            
            {/* Left Column: Replaced by Active Ride Manifest & Multi-Stop Tracking Cockpit during active trip */}
            {leftViewMode === 'cockpit' ? (
              <ActiveManifestCockpit
                manifest={tripManifest}
                occupancy={currentOccupancy}
                onVerifyBoarding={handleVerifyBoarding}
                onNavigateToStop={handleNavigateToStop}
                onTriggerSOS={handleTriggerSOS}
                onSwitchToSetupView={() => setLeftViewMode('setup')}
              />
            ) : (
              <div className="w-full lg:w-[440px] shrink-0 flex flex-col gap-3">
                {/* Back to Active Cockpit banner */}
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
                />
              </div>
            )}

            {/* Right Column: Interactive Map & Live Multi-Stop Corridor View */}
            <CorridorMap
              driverProfile={driverProfile}
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

      {/* Floating Notification Toast */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
