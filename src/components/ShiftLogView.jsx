import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Leaf,
  Clock,
  ArrowRight,
  Download,
} from 'lucide-react';
import { SHIFT_LOG_DATA } from '../data/corridorData';

export default function ShiftLogView({ onExportLog }) {
  const [selectedBatch, setSelectedBatch] = useState(SHIFT_LOG_DATA.batches[0]);

  return (
    <div className="space-y-6">
      {/* Eyebrow & Title */}
      <div>
        <div className="text-[11px] font-bold tracking-widest uppercase text-amber-400 flex items-center gap-1.5 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          LIVE SHIFT TELEMETRY
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Shift Log.</h2>
        <p className="text-xs text-neutral-400 italic mt-0.5">
          Real-time batch dispatch history & Shapley value allocations.
        </p>
      </div>

      {/* Overview Stat Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#151518] border border-white/10 hover:border-amber-400/30 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Shift Payout</span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
              {SHIFT_LOG_DATA.stats.poolingBonus}
            </span>
          </div>
          <div className="text-xl font-black text-white">{SHIFT_LOG_DATA.stats.totalShiftEarnings}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Shapley marginal revenue</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151518] border border-white/10 hover:border-amber-400/30 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Pool Efficiency</span>
            <Users className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white">
            {SHIFT_LOG_DATA.stats.totalPassengers} <span className="text-xs text-neutral-400 font-normal">riders</span>
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Across {SHIFT_LOG_DATA.stats.completedBatches} corridor batches</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151518] border border-white/10 hover:border-amber-400/30 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Avg Detour</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400">{SHIFT_LOG_DATA.stats.avgDetour}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Strictly &le; 15% tolerance</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151518] border border-white/10 hover:border-amber-400/30 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>CO₂ Reduced</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white">{SHIFT_LOG_DATA.stats.co2Saved}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Expressway pooling impact</div>
        </div>
      </div>

      {/* Historical Batches List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Completed Batches Today
          </span>
          <span className="text-[11px] text-neutral-500">
            {SHIFT_LOG_DATA.batches.length} Records
          </span>
        </div>

        <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
          {SHIFT_LOG_DATA.batches.map((batch) => {
            const isSelected = selectedBatch.batchId === batch.batchId;
            return (
              <div
                key={batch.batchId}
                onClick={() => setSelectedBatch(batch)}
                className={`p-3.5 rounded-2xl cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-[#1e1e24] border-amber-400/50 shadow-md shadow-amber-400/10'
                    : 'bg-[#151518] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {batch.batchId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      {batch.status}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white">
                    {batch.shapleyPayout}
                  </span>
                </div>

                <div className="text-xs text-neutral-200 font-medium flex items-center gap-1.5">
                  <span>{batch.route}</span>
                </div>

                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-neutral-400" />
                    {batch.occupancy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    {batch.time}
                  </span>
                  <span className="text-emerald-400 font-medium">
                    +{batch.marginalCostDiff} bonus
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Batch Rider Manifest details */}
      {selectedBatch && (
        <div className="p-3.5 rounded-2xl bg-[#151518] border border-white/10 space-y-2">
          <div className="text-xs font-bold text-neutral-300 flex items-center justify-between">
            <span>Riders in {selectedBatch.batchId}</span>
            <span className="text-[11px] text-amber-400 font-mono">Detour: {selectedBatch.detourTaken}</span>
          </div>
          <div className="space-y-1.5">
            {selectedBatch.riders.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/5">
                <span className="font-semibold text-white">{r.name}</span>
                <span className="text-neutral-400 text-[11px]">
                  {r.pickup} <ArrowRight className="inline w-2.5 h-2.5 text-neutral-500 mx-0.5" /> {r.drop}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export / Download Action */}
      <button
        onClick={() => onExportLog?.()}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#222226] hover:bg-[#2c2c32] text-neutral-200 font-semibold text-xs border border-white/10 transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-amber-400" />
        <span>Export Shift Statement (CSV / PDF)</span>
      </button>
    </div>
  );
}
