import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  Users,
  ArrowUpRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Leaf,
  Sparkles,
  Info,
  Compass,
  SlidersHorizontal,
  Receipt,
  Download,
} from 'lucide-react';
import {
  INITIAL_WALLET_STATE,
  RECENT_BATCH_HISTORY,
} from '../data/walletData';
import CashoutModal from './CashoutModal';

interface DriverEarningsWalletViewProps {
  currentTab?: 'console' | 'vehicle' | 'wallet' | 'kyc';
  onSelectTab?: (tab: 'console' | 'vehicle' | 'wallet' | 'kyc') => void;
  hideSubNav?: boolean;
  driverName?: string;
  upiVpa?: string;
  onExportCsv?: () => void;
}

export default function DriverEarningsWalletView({
  currentTab = 'wallet',
  onSelectTab,
  hideSubNav = false,
  driverName = 'Sameer Khan',
  upiVpa = 'sameer@okhdfcbank',
  onExportCsv,
}: DriverEarningsWalletViewProps) {
  // Wallet State
  const [walletBalance, setWalletBalance] = useState<number>(INITIAL_WALLET_STATE.availableBalance);
  const [expandedBatchIds, setExpandedBatchIds] = useState<Record<string, boolean>>({
    'BATCH-902': true, // Expanded by default
  });
  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);
  const [showShapleyInfo, setShowShapleyInfo] = useState(false);

  // Toggle Accordion
  const toggleExpand = (batchId: string) => {
    setExpandedBatchIds((prev) => ({
      ...prev,
      [batchId]: !prev[batchId],
    }));
  };

  const handleCashoutSuccess = (amount: number) => {
    setWalletBalance((prev) => Math.max(0, prev - amount));
    setIsCashoutModalOpen(false);
  };

  const shapley = INITIAL_WALLET_STATE.shapleyBreakdown;
  const totalShapley = shapley.baseDistance + shapley.marginalSeatBonus + shapley.carbonCongestionIncentive;
  const basePct = Math.round((shapley.baseDistance / totalShapley) * 100);
  const bonusPct = Math.round((shapley.marginalSeatBonus / totalShapley) * 100);
  const carbonPct = Math.round((shapley.carbonCongestionIncentive / totalShapley) * 100);

  return (
    <div className="w-full lg:w-[460px] xl:w-[480px] shrink-0 flex flex-col gap-4 animate-in fade-in duration-200">
      {/* 1. Sub-Navigation Switcher: [ Console ] | [ Vehicle ] | [ Wallet ] | [ KYC ] */}
      {!hideSubNav && onSelectTab && (
        <div className="bg-[#1a1a1e] border border-white/10 rounded-2xl p-1.5 shadow-xl flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => onSelectTab('console')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'console'
                ? 'bg-amber-400 text-black shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Console</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('vehicle')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'vehicle'
                ? 'bg-amber-400 text-black shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Vehicle</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('wallet')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'wallet'
                ? 'bg-amber-400 text-black shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('kyc')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'kyc'
                ? 'bg-amber-400 text-black shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KYC</span>
          </button>
        </div>
      )}

      {/* 2. Top Wallet Overview Card */}
      <div className="bg-[#1a1a1e] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" />
            <span className="text-[11px] font-black tracking-wider text-amber-400 uppercase">
              CAPTAIN WALLET • {driverName.toUpperCase()} • NH48 LEDGER
            </span>
          </div>

          {onExportCsv && (
            <button
              onClick={onExportCsv}
              title="Download Shift & Earnings Statement (CSV)"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-neutral-300 hover:text-white transition-colors"
            >
              <Download className="w-3 h-3 text-amber-400" />
              <span>Statement</span>
            </button>
          )}
        </div>

        {/* Big Balance Display */}
        <div className="mt-1">
          <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
            Available for Cashout
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-4xl md:text-5xl font-black text-white tracking-tight font-mono">
              ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              ● Ready
            </span>
          </div>
        </div>

        {/* Instant Cashout CTA Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setIsCashoutModalOpen(true)}
            disabled={walletBalance <= 0}
            className="w-full py-4 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black transition-all shadow-lg shadow-amber-400/25 active:scale-98 flex items-center justify-between gap-3 text-sm group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-black/15 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 stroke-[3] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <span className="tracking-tight">Instant Payout to UPI</span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/10 px-2.5 py-1 rounded-xl text-xs font-mono font-bold">
              <span className="truncate max-w-[130px] sm:max-w-[150px]">{upiVpa}</span>
            </div>
          </button>
        </div>

        {/* Secondary Stats Grid (3 Columns) */}
        <div className="mt-5 grid grid-cols-3 gap-2.5 pt-5 border-t border-white/10">
          {/* Today's Earnings */}
          <div className="bg-[#151518] border border-white/5 rounded-2xl p-3 text-center">
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              Today's Gross
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              ₹{INITIAL_WALLET_STATE.todayEarnings.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Pooling Efficiency Gain */}
          <div className="bg-[#151518] border border-white/5 rounded-2xl p-3 text-center">
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              Efficiency Gain
            </div>
            <div className="inline-flex items-center gap-0.5 text-xs sm:text-sm font-extrabold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-500/20 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+{INITIAL_WALLET_STATE.poolingEfficiencyGainPercent}% vs Solo</span>
            </div>
          </div>

          {/* Total Passengers Pooled */}
          <div className="bg-[#151518] border border-white/5 rounded-2xl p-3 text-center">
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              Pooled Riders
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
              <Users className="w-4 h-4" />
              <span>{INITIAL_WALLET_STATE.totalPassengersPooledToday} Riders</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. The Shapley Transparency Breakdown Card */}
      <div className="bg-[#1a1a1e] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-black text-white tracking-tight">
              Why You Earn More With SmartPool
            </h3>
          </div>

          <button
            onClick={() => setShowShapleyInfo(!showShapleyInfo)}
            title="What is Shapley Value Cost-Sharing?"
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed mb-4">
          Every additional pooled rider adds marginal yield without doubling your fuel or toll costs.
        </p>

        {showShapleyInfo && (
          <div className="bg-[#151518] border border-amber-400/30 rounded-2xl p-3.5 mb-4 text-xs text-neutral-300 space-y-1.5 animate-in fade-in">
            <strong className="text-amber-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Lloyd Shapley Cooperative Game Theory:
            </strong>
            <p className="text-[11px] text-neutral-400">
              Unlike legacy flat-cut ridehailing apps that take 25–30% of each fare, SmartPool redistributes shared highway savings directly to the captain who provides the trunk and seating corridor.
            </p>
          </div>
        )}

        {/* Stacked Comparative Revenue Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-neutral-400">Yield Breakdown</span>
            <span className="text-amber-400 font-mono font-black">
              ₹{totalShapley.toLocaleString('en-IN')} Total
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-black/60 overflow-hidden border border-white/10 flex">
            <div
              title={`Base Distance Run: ₹${shapley.baseDistance} (${basePct}%)`}
              style={{ width: `${basePct}%` }}
              className="bg-neutral-600 transition-all duration-500"
            />
            <div
              title={`Marginal Seat Bonus: +₹${shapley.marginalSeatBonus} (${bonusPct}%)`}
              style={{ width: `${bonusPct}%` }}
              className="bg-amber-400 transition-all duration-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
            />
            <div
              title={`Carbon Incentive: +₹${shapley.carbonCongestionIncentive} (${carbonPct}%)`}
              style={{ width: `${carbonPct}%` }}
              className="bg-emerald-400 transition-all duration-500"
            />
          </div>
        </div>

        {/* 3 Metric Streams */}
        <div className="mt-4 space-y-2.5 pt-3 border-t border-white/5 text-xs">
          {/* Base Distance Run */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#151518] border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-500" />
              <span className="text-neutral-300 font-medium">Base Distance Run (NH 48 corridor)</span>
            </div>
            <span className="font-mono font-bold text-neutral-200">
              ₹{shapley.baseDistance.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Marginal Seat Contribution Bonus */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
              <span className="text-amber-200 font-bold">Marginal Seat Contribution Bonus</span>
            </div>
            <span className="font-mono font-black text-amber-400">
              +₹{shapley.marginalSeatBonus.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Carbon & Congestion Offset Incentive */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
              <span className="text-emerald-200 font-bold flex items-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-400" />
                Carbon & Congestion Offset Incentive
              </span>
            </div>
            <span className="font-mono font-black text-emerald-400">
              +₹{shapley.carbonCongestionIncentive.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Explanatory Footnote */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-start gap-2 text-[11px] text-neutral-400 italic">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>
            "Powered by Shapley Value cost-sharing: you earn a fair cut of every shared kilometer."
          </span>
        </div>
      </div>

      {/* 4. Recent Pooled Batch History (Expandable Trip Cards) */}
      <div className="bg-[#1a1a1e] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-black text-white tracking-tight">
              Recent Batch Ledger
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400">
            {RECENT_BATCH_HISTORY.length} Corridor Batches
          </span>
        </div>

        <div className="space-y-3">
          {RECENT_BATCH_HISTORY.map((batch) => {
            const isExpanded = Boolean(expandedBatchIds[batch.id]);
            const isSolo = batch.type === 'SOLO_BASELINE';

            return (
              <div
                key={batch.id}
                className={`rounded-2xl border transition-all ${
                  isSolo
                    ? 'bg-[#151518]/70 border-white/10 border-dashed'
                    : 'bg-[#151518] border-white/10 hover:border-amber-400/40'
                }`}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => !isSolo && toggleExpand(batch.id)}
                  className={`p-4 flex items-start justify-between gap-3 ${
                    isSolo ? 'cursor-default' : 'cursor-pointer select-none'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {batch.id}
                      </span>

                      {batch.efficiencyBadge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isSolo
                              ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                              : 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                          }`}
                        >
                          {batch.efficiencyBadge}
                        </span>
                      )}

                      <span className="text-[11px] text-neutral-500 font-medium">
                        {batch.timestamp}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white truncate">
                      {batch.corridor}
                    </h4>

                    <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-3">
                      <span>{batch.distance}</span>
                      <span>•</span>
                      <span>{batch.passengers} {batch.passengers === 1 ? 'Passenger' : 'Passengers Pooled'}</span>
                    </div>
                  </div>

                  {/* Payout & Chevron */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div
                      className={`text-lg font-black font-mono tracking-tight ${
                        isSolo ? 'text-neutral-400' : 'text-amber-400'
                      }`}
                    >
                      ₹{batch.payout.toLocaleString('en-IN')}
                    </div>

                    {!isSolo && (
                      <div className="text-neutral-400 text-xs flex items-center gap-1">
                        <span className="text-[10px]">Breakdown</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 2: Solo Baseline Comparison Body */}
                {isSolo && batch.soloComparison && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5 text-xs text-neutral-300">
                    <div className="bg-black/30 rounded-xl p-3 space-y-1.5 border border-white/5">
                      <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                        <span>Solo Gross Fare:</span>
                        <span className="font-mono text-neutral-300">₹{batch.soloComparison.grossPayout}</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                        <span>Fuel + Fastag Toll Costs:</span>
                        <span className="font-mono text-rose-400">-₹{batch.soloComparison.fuelAndTolls}</span>
                      </div>
                      <div className="pt-1.5 border-t border-white/5 flex items-center justify-between font-bold">
                        <span>Net Profit:</span>
                        <span className="font-mono text-white">
                          ₹{batch.soloComparison.netProfitSolo} solo vs{' '}
                          <span className="text-amber-400">₹{batch.soloComparison.netProfitPooled} pooled</span>
                        </span>
                      </div>
                      <div className="text-right text-[10px] text-emerald-400 font-extrabold">
                        +{batch.soloComparison.netGainPercent}% net profit advantage with SmartPool
                      </div>
                    </div>
                  </div>
                )}

                {/* Card 1 & 3: Expandable Accordion Body showing Individual Rider Contributions */}
                {!isSolo && isExpanded && batch.riders && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-2.5 animate-in fade-in">
                    <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Rider Shapley Allocation</span>
                      <span className="text-amber-400 font-normal lowercase">{batch.detourPercent}</span>
                    </div>

                    <div className="space-y-2">
                      {batch.riders.map((rider) => (
                        <div
                          key={rider.id}
                          className="bg-[#121214] border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 font-bold text-neutral-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span className="truncate">{rider.name}</span>
                              <span className="text-[10px] text-neutral-500 font-normal">
                                ({rider.baggage})
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                              {rider.routeLeg}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-amber-300">
                              ₹{rider.contributionAmount}
                            </div>
                            <div className="text-[10px] text-neutral-500">
                              {rider.shapleySharePercent}% share
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cashout Confirmation Modal */}
      <CashoutModal
        isOpen={isCashoutModalOpen}
        onClose={() => setIsCashoutModalOpen(false)}
        availableBalance={walletBalance}
        upiVpa={upiVpa}
        onConfirmPayout={handleCashoutSuccess}
      />
    </div>
  );
}
