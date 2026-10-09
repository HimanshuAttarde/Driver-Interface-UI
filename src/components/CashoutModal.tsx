import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Building2,
  Clock,
  Check,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface CashoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  upiVpa: string;
  bankName?: string;
  onConfirmPayout: (amount: number) => void;
}

export default function CashoutModal({
  isOpen,
  onClose,
  availableBalance,
  upiVpa,
  bankName = 'HDFC Bank Ltd • Fastag Auto-Sweep',
  onConfirmPayout,
}: CashoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsProcessing(true);
    const mockUtr = `UPI/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setUtrNumber(mockUtr);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      soundFx.playSuccessChime();

      // Trigger balance deduction callback after slight delay
      setTimeout(() => {
        onConfirmPayout(availableBalance);
      }, 1200);
    }, 800);
  };

  const handleModalClose = () => {
    if (isProcessing) return;
    setIsSuccess(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm Instant UPI Cashout"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-[#1a1a1e] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-white overflow-hidden">
        {/* Amber accent glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        {!isProcessing && !isSuccess && (
          <button
            onClick={handleModalClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {isSuccess ? (
          /* ================= SUCCESS STATE ================= */
          <div className="py-6 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5] animate-bounce" />
              </div>
              <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Transfer Dispatched (IMPS 24x7)
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Payout Transferred!
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                <span className="text-amber-400 font-extrabold text-sm">₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>{' '}
                credited instantly to <span className="text-white font-bold">{upiVpa}</span>.
              </p>
            </div>

            {/* Transaction Receipt Card */}
            <div className="w-full bg-[#151518] border border-emerald-500/30 rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span>UTR Reference:</span>
                <span className="font-mono text-white font-bold">{utrNumber}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Destination VPA:</span>
                <span className="font-mono text-amber-300 font-bold">{upiVpa}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Settlement Speed:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Instant Zero-Hop
                </span>
              </div>
            </div>

            <button
              onClick={handleModalClose}
              className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-sm transition-all shadow-lg active:scale-98"
            >
              Done & Return to Ledger
            </button>
          </div>
        ) : (
          /* ================= CONFIRMATION MODAL STATE ================= */
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-black uppercase tracking-wider mb-2">
                <Zap className="w-3 h-3 fill-amber-400" />
                INSTANT ZERO-HOP DISBURSAL
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Confirm Instant Cashout
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Your earned Shapley corridor payout will be dispatched directly via IMPS.
              </p>
            </div>

            {/* Big Payout Amount Display */}
            <div className="bg-[#151518] border border-white/10 rounded-2xl p-5 text-center shadow-inner">
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Total Transfer Amount
              </div>
              <div className="text-4xl font-black text-amber-400 tracking-tight mt-1 font-mono">
                ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Platform Fee: ₹0 (Zero deduction promo)
              </div>
            </div>

            {/* Transfer Details Breakdown */}
            <div className="bg-[#151518]/70 border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                  Beneficiary VPA:
                </span>
                <span className="text-white font-mono font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  {upiVpa}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  Settlement SLA:
                </span>
                <span className="text-emerald-400 font-bold">
                  Instant (&lt; 15 seconds)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Destination Bank:</span>
                <span className="text-neutral-300 font-medium truncate max-w-[190px]">
                  {bankName}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isProcessing}
                className="w-[35%] py-3.5 px-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white font-bold transition text-xs sm:text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing || availableBalance <= 0}
                className="w-[65%] py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-extrabold transition shadow-lg shadow-amber-400/25 active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Processing IMPS...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Transfer</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
