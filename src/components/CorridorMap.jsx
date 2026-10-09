import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plus,
  Minus,
  Crosshair,
  LocateFixed,
  ShieldCheck,
  CornerUpLeft,
  Compass,
} from 'lucide-react';
import {
  CORRIDOR_POLYLINE,
  CORRIDOR_WAYPOINTS,
  DETOUR_BUFFER_POLYGON,
  MULTI_STOP_ROUTE_POLYLINE,
  MULTI_STOP_MARKERS,
  ACTIVE_TRIP_MANIFEST,
} from '../data/corridorData';

export default function CorridorMap({
  driverProfile,
  preferredCorridor: _preferredCorridor = 'Pune Expressway → Mumbai Hub',
  isOnline: _isOnline = true,
  isInTrip = true,
  focusedStop = null,
  onStopClick = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerGroupRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const stopMarkersMapRef = useRef(new Map());
  const onStopClickRef = useRef(onStopClick);

  useEffect(() => {
    onStopClickRef.current = onStopClick;
  });

  // Vehicle position index along the active route
  const [vehiclePositionIndex, setVehiclePositionIndex] = useState(0); // Starts near Hinjawadi Ingress
  const [isSimulatingMove] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center to encompass Pune -> Wakad -> Expressway -> Mumbai
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      fadeAnimation: true,
      zoomAnimation: true,
    }).setView([18.78, 73.35], 10);

    mapInstanceRef.current = map;

    // CartoDB Dark Matter Tiles (High contrast, modern dark theme)
    const tileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
        detectRetina: true,
      }
    ).addTo(map);

    tileLayer.on('tileerror', () => {
      console.warn('Map tile fallback activated');
    });

    // Resize observer to ensure responsive map sizing
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    // Route Layer Group
    const layerGroup = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = layerGroup;

    // Active route coordinates
    const routeCoords = isInTrip ? MULTI_STOP_ROUTE_POLYLINE : CORRIDOR_POLYLINE;

    // 1. Neon background glow line
    L.polyline(routeCoords, {
      color: '#f59e0b',
      weight: 12,
      opacity: 0.25,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layerGroup);

    // 2. Main sharp polyline
    L.polyline(routeCoords, {
      color: '#f59e0b',
      weight: 4.5,
      opacity: 0.95,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layerGroup);

    // 3. Inner neon highlight
    L.polyline(routeCoords, {
      color: '#ffffff',
      weight: 1.5,
      opacity: 0.85,
      lineCap: 'round',
    }).addTo(layerGroup);

    // 4. Map 15% Detour Catchment Buffer Zone
    L.polygon(DETOUR_BUFFER_POLYGON, {
      color: '#f59e0b',
      weight: 1.5,
      dashArray: '6, 6',
      opacity: 0.7,
      fillColor: '#f59e0b',
      fillOpacity: 0.12,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layerGroup).bindTooltip(
      '<div style="font-family: inherit; font-size: 12px; color: #ffffff;"><strong style="color: #f59e0b;">15% Detour Catchment Buffer Zone</strong><br/><span style="color: #9ca3af; font-size: 11px;">Stops strictly constrained within 15% tolerance</span></div>',
      { sticky: true }
    );

    // 5. Numbered Custom Stop Markers (P1, P2, D1, D2)
    stopMarkersMapRef.current.clear();

    MULTI_STOP_MARKERS.forEach((stop) => {
      const isPickup = stop.type === 'PICKUP';
      const bgColor = isPickup ? '#f59e0b' : '#10b981';
      const glowColor = isPickup ? 'rgba(245, 158, 11, 0.8)' : 'rgba(16, 185, 129, 0.8)';

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker-wrapper',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            user-select: none;
          ">
            <!-- Pulsing outer ring -->
            <div style="
              position: relative;
              width: 34px;
              height: 34px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: ${isPickup ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'};
                animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></span>
              <div style="
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: ${bgColor};
                border: 2px solid #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #0f0f11;
                font-weight: 900;
                font-size: 11px;
                box-shadow: 0 0 16px ${glowColor};
              ">
                ${stop.shortLabel}
              </div>
            </div>

            <!-- Attached High-Contrast Badge Label -->
            <div style="
              background: #1a1a1e;
              border: 1px solid ${isPickup ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)'};
              color: #ffffff;
              padding: 3px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 800;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
              white-space: nowrap;
              letter-spacing: -0.2px;
            ">
              <span style="color: ${bgColor};">${stop.type === 'PICKUP' ? 'PICKUP' : 'DROPOFF'}</span> • ${stop.rider.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [160, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([stop.lat, stop.lng], {
        icon: stopIcon,
        zIndexOffset: 800,
      }).addTo(layerGroup);

      // Popup Content
      const popupDiv = document.createElement('div');
      popupDiv.innerHTML = `
        <div style="font-family: inherit; font-size: 12px; color: #ffffff; min-width: 190px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-weight: 900; color: ${bgColor}; font-size: 13px;">${stop.label}</span>
            <span style="background: ${isPickup ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}; border: 1px solid ${isPickup ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}; color: ${bgColor}; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 9999px;">
              ${stop.type}
            </span>
          </div>
          <div style="font-weight: 700; color: #f3f4f6; margin-bottom: 2px;">${stop.location}</div>
          <div style="color: #9ca3af; font-size: 11px; margin-bottom: 4px;">Rider: ${stop.rider} • ${stop.bags}</div>
          <div style="font-size: 10px; color: ${isPickup ? '#f59e0b' : '#10b981'}; font-weight: 700;">
            ETA: ${stop.eta} • ${stop.status}
          </div>
        </div>
      `;

      marker.bindPopup(popupDiv);
      marker.on('click', () => {
        onStopClickRef.current?.(stop);
      });

      stopMarkersMapRef.current.set(stop.id, marker);
    });

    // 6. Intermediate Corridor Landmarks
    CORRIDOR_WAYPOINTS.forEach((wp) => {
      const dotIcon = L.divIcon({
        className: 'intermediate-dot',
        html: `
          <div style="
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #2a2a30;
            border: 1.5px solid #f59e0b;
            box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
          "></div>
        `,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const wpMarker = L.marker([wp.lat, wp.lng], { icon: dotIcon }).addTo(layerGroup);
      wpMarker.bindTooltip(
        `<div style="font-size: 11px; font-weight: 700; color: #fff;">${wp.name}<br/><span style="color: #9ca3af; font-size: 10px;">${wp.km} • ${wp.desc}</span></div>`,
        { direction: 'top', offset: [0, -6] }
      );
    });

    // Fit Initial Bounds to the multi-stop route
    const bounds = L.latLngBounds(routeCoords);
    map.fitBounds(bounds, { padding: [70, 70] });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isInTrip]);

  // Live Driver Vehicle Marker (Moving vehicle icon with heading bearing)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const route = isInTrip ? MULTI_STOP_ROUTE_POLYLINE : CORRIDOR_POLYLINE;
    const currentCoords = route[vehiclePositionIndex] || route[0];
    const nextCoords = route[Math.min(route.length - 1, vehiclePositionIndex + 1)] || currentCoords;

    // Calculate heading angle in degrees
    const dLat = nextCoords[0] - currentCoords[0];
    const dLng = nextCoords[1] - currentCoords[1];
    const headingDegrees = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI);

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng(currentCoords);
      // Update heading angle on the inner icon
      const iconElement = document.getElementById('captain-heading-arrow');
      if (iconElement) {
        iconElement.style.transform = `rotate(${headingDegrees}deg)`;
      }
    } else {
      const vehicleIcon = L.divIcon({
        className: 'captain-vehicle-wrapper',
        html: `
          <div style="
            position: relative;
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <!-- Pulsing outer sonar -->
            <span style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: rgba(245, 158, 11, 0.4);
              animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
            
            <!-- Vehicle Main Shield -->
            <div style="
              position: relative;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: #f59e0b;
              border: 2.5px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #0f0f11;
              box-shadow: 0 0 20px rgba(245, 158, 11, 0.95);
            ">
              <!-- Directional Heading Pointer -->
              <div id="captain-heading-arrow" style="
                transform: rotate(${headingDegrees}deg);
                transition: transform 0.4s ease;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                </svg>
              </div>
            </div>
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const marker = L.marker(currentCoords, {
        icon: vehicleIcon,
        zIndexOffset: 1200,
      }).addTo(map);

      marker.bindTooltip(
        `<div style="font-weight: 800; color: #ffffff;">Captain ${driverProfile?.name || 'Sameer'}<br/><span style="color: #f59e0b; font-size: 11px;">En Route Stop 1 • 64 km/h</span></div>`,
        { direction: 'top', offset: [0, -22] }
      );

      vehicleMarkerRef.current = marker;
    }
  }, [vehiclePositionIndex, driverProfile, isInTrip]);

  // Subtle vehicle movement animation along corridor
  useEffect(() => {
    if (!isSimulatingMove) return;
    const route = isInTrip ? MULTI_STOP_ROUTE_POLYLINE : CORRIDOR_POLYLINE;

    const interval = setInterval(() => {
      setVehiclePositionIndex((prev) => (prev + 1) % route.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isSimulatingMove, isInTrip]);

  // React to focusedStop changes (e.g. driver clicks "Navigate Here")
  useEffect(() => {
    if (!focusedStop || !mapInstanceRef.current) return;

    mapInstanceRef.current.setView([focusedStop.lat, focusedStop.lng], 14, {
      animate: true,
      duration: 1.2,
    });

    const marker = stopMarkersMapRef.current.get(focusedStop.id || focusedStop.shortLabel);
    if (marker) {
      marker.openPopup();
    }
  }, [focusedStop]);

  // Controls Callbacks
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleCenterCorridor = () => {
    if (!mapInstanceRef.current) return;
    const route = isInTrip ? MULTI_STOP_ROUTE_POLYLINE : CORRIDOR_POLYLINE;
    const bounds = L.latLngBounds(route);
    mapInstanceRef.current.fitBounds(bounds, { padding: [70, 70] });
  };

  const handleLocateCaptain = () => {
    if (!mapInstanceRef.current) return;
    const route = isInTrip ? MULTI_STOP_ROUTE_POLYLINE : CORRIDOR_POLYLINE;
    const currentCoords = route[vehiclePositionIndex] || route[0];
    mapInstanceRef.current.setView(currentCoords, 14, { animate: true });
  };

  const turnInfo = ACTIVE_TRIP_MANIFEST.turnInstruction;

  return (
    <section
      aria-label="Multi-Stop Live Corridor Cockpit Map"
      className="relative w-full h-[560px] lg:h-full min-h-[520px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0d0e11] flex-1 flex flex-col"
    >
      {/* Full-height Leaflet Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-0 cursor-grab active:cursor-grabbing"
      />

      {/* 1. Floating Card Over Map (Top Left): Current Turn Instruction Banner */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto max-w-[calc(100%-90px)] sm:max-w-md">
        <div className="bg-[#1a1a1e]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/80 transition-all hover:border-amber-400/40">
          <div className="flex items-start gap-3">
            {/* Turn maneuver icon pill */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
              <CornerUpLeft className="w-5 h-5 stroke-[2.8]" />
            </div>

            {/* Instruction text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 uppercase tracking-wider">
                  Next Maneuver • {turnInfo.distance}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {turnInfo.speedLimit}
                </span>
              </div>

              {/* Exact instruction prompt */}
              <h2 className="text-sm md:text-base font-black text-white tracking-tight mt-1 leading-snug">
                {turnInfo.instruction}
              </h2>

              <p className="text-[11px] text-neutral-400 font-medium truncate mt-0.5">
                {turnInfo.target} • <span className="text-amber-300">{turnInfo.lane}</span>
              </p>
            </div>
          </div>

          {/* Quick Expressway Telemetry Micro-Pill */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Speed: 64 km/h (Expressway Ingress)</span>
            </span>
            <span className="text-amber-400 font-mono font-bold">
              {turnInfo.totalDistance} • {turnInfo.totalTime}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top-Right Map Controls (Zoom in/out, centering) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-[#1a1a1e]/95 backdrop-blur-md border border-white/10 rounded-2xl p-1 shadow-xl shadow-black/60 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:text-amber-400 hover:bg-white/10 transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
          <div className="w-full h-px bg-white/10" />
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:text-amber-400 hover:bg-white/10 transition-colors"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Locate Captain Pill Button */}
        <button
          onClick={handleLocateCaptain}
          title="Center on Captain Vehicle"
          className="w-9 h-9 rounded-2xl bg-[#1a1a1e]/95 backdrop-blur-md border border-white/10 flex items-center justify-center text-amber-400 hover:text-white hover:bg-amber-400/20 transition-all shadow-xl shadow-black/60 active:scale-95"
        >
          <LocateFixed className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Fit Entire Multi-Stop Corridor Bounds */}
        <button
          onClick={handleCenterCorridor}
          title="Fit Entire Multi-Stop Route"
          className="w-9 h-9 rounded-2xl bg-[#1a1a1e]/95 backdrop-blur-md border border-white/10 flex items-center justify-center text-neutral-300 hover:text-amber-400 hover:bg-white/10 transition-all shadow-xl shadow-black/60 active:scale-95"
        >
          <Crosshair className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* 3. Bottom Floating Banner Card (Sequential Multi-Stop Queue Status) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-[92%] max-w-xl">
        <div className="bg-[#1a1a1e]/95 backdrop-blur-md border border-white/10 hover:border-amber-400/30 rounded-2xl md:rounded-full py-2.5 px-4 md:px-5 shadow-2xl shadow-black/80 flex items-center gap-3 transition-all duration-200">
          <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0">
            <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <p className="text-xs md:text-sm text-neutral-200 font-medium leading-snug flex-1">
            <strong className="text-white font-bold">Sequential Corridor Queue:</strong>{' '}
            <span className="text-amber-400 font-bold">P1</span> (Sameer) ➔{' '}
            <span className="text-amber-400 font-bold">P2</span> (Priya) ➔{' '}
            <span className="text-emerald-400 font-bold">D1</span> (Vashi) ➔{' '}
            <span className="text-emerald-400 font-bold">D2</span> (Chembur)
          </p>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 whitespace-nowrap">
            <ShieldCheck className="w-3 h-3" />
            15% Detour Verified
          </span>
        </div>
      </div>

      {/* Stop Legend Pill on bottom right */}
      <div className="hidden lg:flex absolute bottom-5 right-5 z-10 items-center gap-3 px-3 py-1.5 rounded-full bg-[#151518]/90 border border-white/10 text-[10px] text-neutral-400 backdrop-blur-sm pointer-events-none">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
          <span className="text-white font-semibold">Pickups (P1, P2)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
          <span className="text-white font-semibold">Drop-offs (D1, D2)</span>
        </span>
      </div>
    </section>
  );
}
