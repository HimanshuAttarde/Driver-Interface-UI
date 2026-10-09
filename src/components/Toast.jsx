import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#1a1a1e] border border-amber-400/30 text-white shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md">
      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-amber-400" />
        ) : type === 'error' ? (
          <AlertCircle className="w-5 h-5 text-rose-400" />
        ) : (
          <Info className="w-5 h-5 text-amber-400" />
        )}
      </div>
      <div className="flex-1 text-sm">
        <p className="font-semibold text-white leading-tight">Preferences Synced</p>
        <p className="text-xs text-neutral-400 mt-0.5">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
