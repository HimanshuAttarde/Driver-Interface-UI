// Mock Data & Ledger Entries for Driver Earnings & Wallet

export interface RiderContribution {
  id: string;
  name: string;
  routeLeg: string;
  distance: string;
  contributionAmount: number;
  baggage: string;
  shapleySharePercent: number;
}

export interface BatchLedgerItem {
  id: string;
  type: 'POOLED_BATCH' | 'SOLO_BASELINE';
  corridor: string;
  timestamp: string;
  distance: string;
  passengers: number;
  payout: number;
  detourPercent?: string;
  efficiencyBadge?: string;
  riders?: RiderContribution[];
  soloComparison?: {
    grossPayout: number;
    fuelAndTolls: number;
    netProfitSolo: number;
    netProfitPooled: number;
    netGainPercent: number;
  };
}

export const INITIAL_WALLET_STATE = {
  availableBalance: 3840.50,
  linkedUpiVpa: 'sameer@okhdfcbank',
  linkedBankName: 'HDFC Bank Ltd • Fastag Auto-Sweep',
  todayEarnings: 1820,
  poolingEfficiencyGainPercent: 42,
  totalPassengersPooledToday: 7,
  shapleyBreakdown: {
    baseDistance: 1150,
    marginalSeatBonus: 670,
    carbonCongestionIncentive: 80,
    totalToday: 1900,
    soloBaselineToday: 1150,
  },
};

export const RECENT_BATCH_HISTORY: BatchLedgerItem[] = [
  {
    id: 'BATCH-902',
    type: 'POOLED_BATCH',
    corridor: 'Pune (Hinjawadi) ➔ Mumbai (BKC)',
    timestamp: 'Today, 2:45 PM',
    distance: '142 km',
    passengers: 3,
    payout: 1420,
    detourPercent: '+8.2% detour (well within 15% limit)',
    efficiencyBadge: '+45% Synergy Boost',
    riders: [
      {
        id: 'r-1',
        name: 'Sameer K.',
        routeLeg: 'Hinjawadi Flyover ➔ Bandra Kurla Complex',
        distance: '142 km (Full Corridor)',
        contributionAmount: 620,
        baggage: '🎒 1 Cabin Bag',
        shapleySharePercent: 43.6,
      },
      {
        id: 'r-2',
        name: 'Priya M.',
        routeLeg: 'Wakad Bridge ➔ Vashi Toll Plaza',
        distance: '118 km (Shared Mid-Leg)',
        contributionAmount: 480,
        baggage: '🎒 1 Cabin Bag',
        shapleySharePercent: 33.8,
      },
      {
        id: 'r-3',
        name: 'Rohit S.',
        routeLeg: 'Talegaon Toll ➔ Panvel Bypass',
        distance: '74 km (Last-Mile Corridor Insert)',
        contributionAmount: 320,
        baggage: '💼 Laptop Bag',
        shapleySharePercent: 22.6,
      },
    ],
  },
  {
    id: 'SOLO-REF-899',
    type: 'SOLO_BASELINE',
    corridor: 'Pune ➔ Mumbai Non-Pooled Solo (Market Baseline)',
    timestamp: 'Benchmark Reference Model',
    distance: '142 km',
    passengers: 1,
    payout: 980,
    efficiencyBadge: 'Baseline Reference',
    soloComparison: {
      grossPayout: 980,
      fuelAndTolls: 640,
      netProfitSolo: 340,
      netProfitPooled: 780,
      netGainPercent: 129,
    },
  },
  {
    id: 'BATCH-889',
    type: 'POOLED_BATCH',
    corridor: 'Mumbai (Chembur) ➔ Pune (Kiwale Hub)',
    timestamp: 'Yesterday, 7:15 PM',
    distance: '148 km',
    passengers: 3,
    payout: 1450,
    detourPercent: '+7.4% detour (within 15% limit)',
    efficiencyBadge: '+41% Synergy Boost',
    riders: [
      {
        id: 'r-4',
        name: 'Ananya S.',
        routeLeg: 'Chembur Amar Mahal ➔ Vashi Creek Bridge',
        distance: '24 km (Suburban Feeder Leg)',
        contributionAmount: 350,
        baggage: '🎒 1 Bag',
        shapleySharePercent: 24.1,
      },
      {
        id: 'r-5',
        name: 'Kavita R.',
        routeLeg: 'Vashi Hub ➔ Lonavala Food Mall',
        distance: '78 km (Hill Station Drop)',
        contributionAmount: 480,
        baggage: '🎒 1 Cabin Bag',
        shapleySharePercent: 33.1,
      },
      {
        id: 'r-6',
        name: 'Arjun M.',
        routeLeg: 'Chembur Amar Mahal ➔ Pune Kiwale Toll',
        distance: '148 km (Full Express Route)',
        contributionAmount: 620,
        baggage: '🧳 1 Large Suitcase',
        shapleySharePercent: 42.8,
      },
    ],
  },
];
