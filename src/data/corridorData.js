// Corridor and expressway data for Pune - Mumbai Yashwantrao Chavan Expressway (NH48)

export const CORRIDOR_WAYPOINTS = [
  { id: 'pune-kiwale', name: 'Pune (Kiwale Interchange)', km: 'Km 0', lat: 18.6477, lng: 73.7438, type: 'HUB', desc: 'Southern Terminal Hub' },
  { id: 'talegaon', name: 'Talegaon Toll Plaza', km: 'Km 18', lat: 18.7351, lng: 73.6749, type: 'TOLL', desc: 'Fastag Corridor Ingress' },
  { id: 'kamshet', name: 'Kamshet Tunnels', km: 'Km 35', lat: 18.7612, lng: 73.5789, type: 'TUNNEL', desc: 'Twin Tube Expressway' },
  { id: 'lonavala', name: 'Lonavala Interchange', km: 'Km 58', lat: 18.7557, lng: 73.4091, type: 'INTERCHANGE', desc: 'Hill Station Feeder Gate' },
  { id: 'khandala', name: 'Khandala Ghats Crest', km: 'Km 64', lat: 18.7698, lng: 73.3762, type: 'GHAT', desc: 'Bhor Ghat Summit Zone' },
  { id: 'khalapur', name: 'Khalapur Food Mall', km: 'Km 72', lat: 18.8315, lng: 73.2847, type: 'REST_STOP', desc: 'Official Pool Rebalancing Point' },
  { id: 'shedung', name: 'Shedung Toll Plaza', km: 'Km 98', lat: 18.9456, lng: 73.1423, type: 'TOLL', desc: 'Northern Toll Gateway' },
  { id: 'panvel', name: 'Panvel Interchange', km: 'Km 115', lat: 18.9894, lng: 73.1175, type: 'INTERCHANGE', desc: 'Navi Mumbai Expressway Junction' },
  { id: 'vashi', name: 'Vashi Creek Bridge', km: 'Km 135', lat: 19.0664, lng: 72.9982, type: 'BRIDGE', desc: 'Mumbai Entrance Corridor' },
  { id: 'chembur', name: 'Mumbai (Chembur Amar Mahal Hub)', km: 'Km 148', lat: 19.0521, lng: 72.9245, type: 'HUB', desc: 'Northern Terminal Hub' },
];

export const CORRIDOR_POLYLINE = [
  [18.6477, 73.7438], // Kiwale (Pune)
  [18.6721, 73.7225], // Dehu Road Bypass
  [18.7011, 73.7028], // Urse Toll Plaza
  [18.7351, 73.6749], // Talegaon Toll
  [18.7495, 73.6421], // Somatane Phata
  [18.7612, 73.5789], // Kamshet Tunnel
  [18.7523, 73.4568], // Malavli Viaduct
  [18.7557, 73.4091], // Lonavala Interchange
  [18.7698, 73.3762], // Khandala Ghats Crest
  [18.7754, 73.3512], // Bhor Ghat
  [18.7845, 73.3289], // Madap Tunnel
  [18.8105, 73.2891], // Adoshi Tunnel
  [18.8315, 73.2847], // Khalapur Food Mall
  [18.8789, 73.1895], // Chowk / Karjat Junction
  [18.9456, 73.1423], // Shedung Toll
  [18.9894, 73.1175], // Panvel Interchange
  [19.0145, 73.0821], // Kharghar Hills Bypass
  [19.0345, 73.0456], // CBD Belapur
  [19.0664, 72.9982], // Vashi Plaza & Creek Bridge
  [19.0589, 72.9645], // Mankhurd Highway Link
  [19.0521, 72.9245], // Chembur Amar Mahal Hub
];

export const DEFAULT_DRIVER_PROFILE = {
  name: 'Sameer Khan',
  phone: '+91 98765 43210',
  isPhoneVerified: true,
  rating: 4.94,
  totalTrips: 1240,
  vehicleModel: 'Tata Nexon EV Max • Dark Edition',
  vehicleNumber: 'MH 14 JM 8821',
  languages: ['English', 'Hindi', 'Marathi'],
  maxPooledPassengers: 3,
  detourTolerancePercent: 15,
  preferredEndCorridor: 'Pune Expressway → Mumbai Hub',
  upiVpa: 'sameer@okhdfcbank',
  isUpiVerified: true,
  status: 'Online / Ready',
  engineStatus: 'Engine online',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  vehicle: {
    make: 'Tata',
    model: 'Nexon EV Max',
    plateNumber: 'MH 12 RN 8820',
    fuelType: 'EV',
    bootTier: 'LARGE_SUITCASES',
    cabinBags: 2,
    largeBags: 1,
    hasAC: true,
    isVerified: true,
  },
};

export const CORRIDOR_OPTIONS = [
  { id: 'pune-mumbai', label: 'Pune Expressway → Mumbai Hub', desc: 'Kiwale to Chembur (148 km)' },
  { id: 'mumbai-pune', label: 'Mumbai Hub → Pune Expressway', desc: 'Chembur to Kiwale (148 km)' },
  { id: 'pune-lonavala', label: 'Pune Kiwale ⇄ Lonavala Loop', desc: 'Commuter Short Haul (58 km)' },
  { id: 'panvel-vashi', label: 'Panvel ⇄ Vashi Navi Mumbai Hub', desc: 'Suburban Feeder (28 km)' },
];

export const SHIFT_LOG_DATA = {
  stats: {
    totalShiftEarnings: '₹3,420',
    poolingBonus: '+22.4%',
    completedBatches: 3,
    totalPassengers: 9,
    kilometersLogged: '148 km',
    mainlineShare: '91.8%',
    avgDetour: '8.4%',
    co2Saved: '34.2 kg',
  },
  batches: [
    {
      batchId: 'SP-BATCH-902',
      time: '18:45 - 20:55',
      route: 'Kiwale (Pune) → Chembur (Mumbai)',
      riders: [
        { name: 'Rahul S.', pickup: 'Urse Toll', drop: 'Vashi Creek' },
        { name: 'Priya K.', pickup: 'Lonavala Exit', drop: 'Chembur Hub' },
        { name: 'Amit G.', pickup: 'Somatane', drop: 'Panvel Bypass' },
      ],
      occupancy: '3 / 3 seats',
      shapleyPayout: '₹1,450',
      marginalCostDiff: '+₹290',
      detourTaken: '11.2%',
      status: 'Completed',
    },
    {
      batchId: 'SP-BATCH-896',
      time: '15:10 - 17:05',
      route: 'Chembur (Mumbai) → Lonavala Food Mall',
      riders: [
        { name: 'Sneha M.', pickup: 'Chembur', drop: 'Khalapur' },
        { name: 'Vikram D.', pickup: 'Vashi Hub', drop: 'Lonavala' },
      ],
      occupancy: '2 / 3 seats',
      shapleyPayout: '₹1,080',
      marginalCostDiff: '+₹180',
      detourTaken: '6.5%',
      status: 'Completed',
    },
    {
      batchId: 'SP-BATCH-889',
      time: '11:20 - 13:10',
      route: 'Talegaon Toll → Panvel Interchange',
      riders: [
        { name: 'Arjun N.', pickup: 'Talegaon', drop: 'Shedung Toll' },
        { name: 'Deepa V.', pickup: 'Kamshet', drop: 'Panvel Hub' },
        { name: 'Farhan Q.', pickup: 'Lonavala', drop: 'Kharghar' },
        { name: 'Kavita R.', pickup: 'Khalapur', drop: 'Panvel' },
      ],
      occupancy: '4 / 4 seats',
      shapleyPayout: '₹890',
      marginalCostDiff: '+₹210',
      detourTaken: '7.8%',
      status: 'Completed',
    },
  ],
};

// 15% Detour Catchment Buffer Polygon Generator along the NH48 route
export function generateDetourBufferPolygon(route, offsetDegrees = 0.038) {
  const left = [];
  const right = [];
  for (let i = 0; i < route.length; i++) {
    const prev = route[Math.max(0, i - 1)];
    const next = route[Math.min(route.length - 1, i + 1)];
    const dLat = next[0] - prev[0];
    const dLng = next[1] - prev[1];
    const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
    // Perpendicular normal vector
    const normLat = -dLng / len;
    const normLng = dLat / len;

    left.push([route[i][0] + normLat * offsetDegrees, route[i][1] + normLng * offsetDegrees]);
    right.push([route[i][0] - normLat * offsetDegrees, route[i][1] - normLng * offsetDegrees]);
  }
  return [...left, ...right.reverse()];
}

export const DETOUR_BUFFER_POLYGON = generateDetourBufferPolygon(CORRIDOR_POLYLINE, 0.036);

// 2 Mock Pickup Pins strictly placed inside the 15% Detour Catchment Buffer
export const MOCK_PICKUP_PINS = [
  {
    id: 'P1',
    label: 'P1',
    name: 'Talegaon Phata Ingress',
    km: 'Km 22',
    lat: 18.736,
    lng: 73.652,
    detourPercent: '+5.8%',
    rider: 'Ananya S. (To Mumbai)',
    status: 'Matched in 15% Catchment',
  },
  {
    id: 'P2',
    label: 'P2',
    name: 'Khalapur Food Mall Service Gate',
    km: 'Km 74',
    lat: 18.839,
    lng: 73.268,
    detourPercent: '+7.4%',
    rider: 'Rohan K. (To Chembur)',
    status: 'Matched in 15% Catchment',
  },
];

// Active Multi-Stop Ride Manifest & Sequential Queue (Cockpit Mode)
export const ACTIVE_TRIP_MANIFEST = {
  tripBatchId: 'SP-BATCH-944',
  corridorName: 'Pune ➔ Mumbai NH48',
  status: 'IN_TRIP',
  basePayout: 1080,
  pooledSynergy: 340,
  estEarnings: 1420,
  currentOccupancy: 2,
  maxCapacity: 3,
  turnInstruction: {
    instruction: 'Turn left in 300m toward Mumbai Expressway Entry',
    distance: '300m',
    target: 'Mumbai Expressway (NH48) Ingress Ramp',
    lane: 'Lanes 1 & 2 • Fastag Express',
    totalDistance: '146 km',
    totalTime: '1h 52m',
    speedLimit: '100 km/h',
  },
  stops: [
    {
      id: 'stop-1',
      stopNumber: 1,
      totalStops: 4,
      type: 'PICKUP',
      pinLabel: 'P1: Sameer',
      shortLabel: 'P1',
      riderName: 'Sameer K.',
      phone: '+91 98230 45671',
      bags: 1,
      bagType: '🎒 1 Bag',
      locationName: 'Hinjawadi Flyover, Bay 3',
      eta: '4 mins',
      distance: '1.8 km',
      otp: '4821',
      lat: 18.5985,
      lng: 73.7380,
      status: 'ACTIVE',
      detourTag: 'Scheduled Ingress Point',
      yieldBadge: 'Primary Hub',
    },
    {
      id: 'stop-2',
      stopNumber: 2,
      totalStops: 4,
      type: 'PICKUP',
      pinLabel: 'P2: Priya',
      shortLabel: 'P2',
      riderName: 'Priya M.',
      phone: '+91 98450 11928',
      bags: 1,
      bagType: '🎒 1 Bag',
      locationName: 'Wakad Bridge',
      eta: '11 mins',
      distance: '4.6 km',
      otp: '7392',
      lat: 18.6045,
      lng: 73.7635,
      status: 'QUEUED',
      detourTag: '+6 min detour, +₹280 yield',
      yieldBadge: '+₹280 Synergy',
    },
    {
      id: 'stop-3',
      stopNumber: 3,
      totalStops: 4,
      type: 'DROPOFF',
      pinLabel: 'D1: Sameer',
      shortLabel: 'D1',
      riderName: 'Sameer K.',
      phone: '+91 98230 45671',
      bags: 1,
      bagType: '🎒 1 Bag',
      locationName: 'Vashi Toll Plaza',
      eta: '1h 35m',
      distance: '134 km',
      otp: null,
      lat: 19.0664,
      lng: 72.9982,
      status: 'QUEUED',
      detourTag: 'Expressway Mainline Exit',
      yieldBadge: 'Seat Frees Up',
    },
    {
      id: 'stop-4',
      stopNumber: 4,
      totalStops: 4,
      type: 'DROPOFF',
      pinLabel: 'D2: Priya',
      shortLabel: 'D2',
      riderName: 'Priya M.',
      phone: '+91 98450 11928',
      bags: 1,
      bagType: '🎒 1 Bag',
      locationName: 'Chembur Hub',
      eta: '1h 52m',
      distance: '146 km',
      otp: null,
      lat: 19.0521,
      lng: 72.9245,
      status: 'QUEUED',
      detourTag: 'Terminal Hub Destination',
      yieldBadge: 'Final Shapley Disbursal',
    },
  ],
};

// Complete multi-stop sequential polyline passing Driver -> Stop 1 -> Stop 2 -> Stop 3 -> Stop 4
export const MULTI_STOP_ROUTE_POLYLINE = [
  [18.5870, 73.7310], // Vehicle Current Position (near Hinjawadi Ingress)
  [18.5985, 73.7380], // Stop 1: Hinjawadi Flyover, Bay 3 (P1)
  [18.6045, 73.7635], // Stop 2: Wakad Bridge (P2)
  [18.6250, 73.7550], // Link to Highway
  [18.6477, 73.7438], // Pune Kiwale Toll Plaza
  [18.6721, 73.7225], // Dehu Road Bypass
  [18.7011, 73.7028], // Urse Toll Plaza
  [18.7351, 73.6749], // Talegaon Toll
  [18.7495, 73.6421], // Somatane Phata
  [18.7612, 73.5789], // Kamshet Tunnel
  [18.7523, 73.4568], // Malavli Viaduct
  [18.7557, 73.4091], // Lonavala Interchange
  [18.7698, 73.3762], // Khandala Ghats Crest
  [18.7754, 73.3512], // Bhor Ghat
  [18.7845, 73.3289], // Madap Tunnel
  [18.8105, 73.2891], // Adoshi Tunnel
  [18.8315, 73.2847], // Khalapur Food Mall
  [18.8789, 73.1895], // Chowk / Karjat Junction
  [18.9456, 73.1423], // Shedung Toll
  [18.9894, 73.1175], // Panvel Interchange
  [19.0145, 73.0821], // Kharghar Hills Bypass
  [19.0345, 73.0456], // CBD Belapur
  [19.0664, 72.9982], // Stop 3: Vashi Toll Plaza (D1)
  [19.0589, 72.9645], // Mankhurd Highway Link
  [19.0521, 72.9245], // Stop 4: Chembur Hub (D2)
];

// Numbered Custom Stop Markers
export const MULTI_STOP_MARKERS = [
  {
    id: 'P1',
    label: 'P1: Sameer',
    shortLabel: 'P1',
    rider: 'Sameer K.',
    type: 'PICKUP',
    location: 'Hinjawadi Flyover, Bay 3',
    lat: 18.5985,
    lng: 73.7380,
    eta: '4 mins (1.8 km)',
    color: '#f59e0b', // Amber
    theme: 'amber',
    bags: '🎒 1 Bag',
    status: 'Next Stop',
  },
  {
    id: 'P2',
    label: 'P2: Priya',
    shortLabel: 'P2',
    rider: 'Priya M.',
    type: 'PICKUP',
    location: 'Wakad Bridge',
    lat: 18.6045,
    lng: 73.7635,
    eta: '11 mins (4.6 km)',
    color: '#f59e0b', // Amber
    theme: 'amber',
    bags: '🎒 1 Bag',
    status: 'Queued (+₹280 yield)',
  },
  {
    id: 'D1',
    label: 'D1: Sameer',
    shortLabel: 'D1',
    rider: 'Sameer K.',
    type: 'DROPOFF',
    location: 'Vashi Toll Plaza',
    lat: 19.0664,
    lng: 72.9982,
    eta: '1h 35m (134 km)',
    color: '#10b981', // Green/Muted
    theme: 'emerald',
    bags: '🎒 1 Bag',
    status: 'Queued (Mainline Drop)',
  },
  {
    id: 'D2',
    label: 'D2: Priya',
    shortLabel: 'D2',
    rider: 'Priya M.',
    type: 'DROPOFF',
    location: 'Chembur Hub',
    lat: 19.0521,
    lng: 72.9245,
    eta: '1h 52m (146 km)',
    color: '#10b981', // Green/Muted
    theme: 'emerald',
    bags: '🎒 1 Bag',
    status: 'Queued (Terminal Hub)',
  },
];


