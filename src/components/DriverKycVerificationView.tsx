import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Car,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Lock,
  Compass,
  SlidersHorizontal,
  Wallet,
  Shield,
  HelpCircle,
} from 'lucide-react';
import {
  DriverKycData,
  VerificationStatus,
  KycUploadedFile,
} from '../types/kyc';
import { INITIAL_KYC_STATE, MOCK_VERIFIED_KYC_STATE } from '../data/kycData';
import DocumentUploadBox from './DocumentUploadBox';
import { soundFx } from '../utils/audio';

interface DriverKycVerificationViewProps {
  currentTab?: 'console' | 'vehicle' | 'wallet' | 'kyc';
  onSelectTab?: (tab: 'console' | 'vehicle' | 'wallet' | 'kyc') => void;
  hideSubNav?: boolean;
  onStatusChange?: (status: VerificationStatus) => void;
  onKycSubmitted?: (data: DriverKycData) => void;
}

export default function DriverKycVerificationView({
  currentTab = 'kyc',
  onSelectTab,
  hideSubNav = false,
  onStatusChange,
  onKycSubmitted,
}: DriverKycVerificationViewProps) {
  // Main KYC Data State
  const [kycData, setKycData] = useState<DriverKycData>(() => {
    try {
      const stored = localStorage.getItem('smartpool_kyc_data');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return INITIAL_KYC_STATE;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Accordion Expand States
  const [expandedSections, setExpandedSections] = useState({
    dl: true,
    rc: true,
    insurance: true,
  });

  const toggleSection = (section: 'dl' | 'rc' | 'insurance') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // DL Field updates
  const handleDlChange = (field: 'dlNumber' | 'expiryDate', value: string) => {
    setKycData((prev) => ({
      ...prev,
      drivingLicense: {
        ...prev.drivingLicense,
        [field]: value,
      },
    }));
  };

  const handleDlFileSelect = (side: 'front' | 'back', file: KycUploadedFile) => {
    setKycData((prev) => ({
      ...prev,
      drivingLicense: {
        ...prev.drivingLicense,
        [side === 'front' ? 'frontPhoto' : 'backPhoto']: file,
      },
    }));
  };

  const handleDlFileRemove = (side: 'front' | 'back') => {
    setKycData((prev) => ({
      ...prev,
      drivingLicense: {
        ...prev.drivingLicense,
        [side === 'front' ? 'frontPhoto' : 'backPhoto']: null,
      },
    }));
  };

  // RC Field updates
  const handleRcChange = (field: 'registrationNumber' | 'registeredOwner', value: string) => {
    setKycData((prev) => ({
      ...prev,
      vehicleRegistration: {
        ...prev.vehicleRegistration,
        [field]: value,
      },
    }));
  };

  const handleRcFileSelect = (file: KycUploadedFile) => {
    setKycData((prev) => ({
      ...prev,
      vehicleRegistration: {
        ...prev.vehicleRegistration,
        frontPhoto: file,
      },
    }));
  };

  const handleRcFileRemove = () => {
    setKycData((prev) => ({
      ...prev,
      vehicleRegistration: {
        ...prev.vehicleRegistration,
        frontPhoto: null,
      },
    }));
  };

  // Insurance Field updates
  const handleInsuranceChange = (field: 'policyNumber' | 'expiryDate', value: string) => {
    setKycData((prev) => ({
      ...prev,
      commercialInsurance: {
        ...prev.commercialInsurance,
        [field]: value,
      },
    }));
  };

  const handleInsuranceFileSelect = (file: KycUploadedFile) => {
    setKycData((prev) => ({
      ...prev,
      commercialInsurance: {
        ...prev.commercialInsurance,
        documentFile: file,
      },
    }));
  };

  const handleInsuranceFileRemove = () => {
    setKycData((prev) => ({
      ...prev,
      commercialInsurance: {
        ...prev.commercialInsurance,
        documentFile: null,
      },
    }));
  };

  // Quick State Preset Simulation (For Reviewer / Demo)
  const setVerificationStatePreset = (status: VerificationStatus) => {
    let updated: DriverKycData;
    if (status === 'VERIFIED') {
      updated = { ...MOCK_VERIFIED_KYC_STATE };
    } else if (status === 'UNDER_REVIEW') {
      updated = {
        ...kycData,
        verificationStatus: 'UNDER_REVIEW',
        submittedAt: 'Just now',
      };
    } else {
      updated = {
        ...INITIAL_KYC_STATE,
        verificationStatus: 'INCOMPLETE',
      };
    }
    setKycData(updated);
    try {
      localStorage.setItem('smartpool_kyc_data', JSON.stringify(updated));
    } catch {
      // ignore
    }
    onStatusChange?.(status);
  };

  // Submit Action
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const updated: DriverKycData = {
        ...kycData,
        verificationStatus: 'UNDER_REVIEW',
        submittedAt: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setKycData(updated);
      setIsSubmitting(false);
      setSubmissionSuccess(true);
      soundFx.playSuccessChime();

      try {
        localStorage.setItem('smartpool_kyc_data', JSON.stringify(updated));
      } catch {
        // ignore
      }

      onStatusChange?.('UNDER_REVIEW');
      onKycSubmitted?.(updated);

      setTimeout(() => {
        setSubmissionSuccess(false);
      }, 3500);
    }, 900);
  };

  // Calculate completion indicators
  const isDlComplete =
    Boolean(kycData.drivingLicense.dlNumber) &&
    Boolean(kycData.drivingLicense.expiryDate) &&
    Boolean(kycData.drivingLicense.frontPhoto) &&
    Boolean(kycData.drivingLicense.backPhoto);

  const isRcComplete =
    Boolean(kycData.vehicleRegistration.registrationNumber) &&
    Boolean(kycData.vehicleRegistration.registeredOwner) &&
    Boolean(kycData.vehicleRegistration.frontPhoto);

  const isInsuranceComplete =
    Boolean(kycData.commercialInsurance.policyNumber) &&
    Boolean(kycData.commercialInsurance.expiryDate) &&
    Boolean(kycData.commercialInsurance.documentFile);

  const completedCount = [isDlComplete, isRcComplete, isInsuranceComplete].filter(Boolean).length;

  return (
    <div className="w-full lg:w-[460px] xl:w-[480px] shrink-0 flex flex-col gap-4 animate-in fade-in duration-200">
      {/* 1. Sub-Navigation Switcher (if not rendered by parent) */}
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

      {/* 2. Main KYC Card Container: bg-[#1a1a1e] border border-white/10 rounded-3xl p-6 text-white */}
      <div className="bg-[#1a1a1e] border border-white/10 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden text-white space-y-5">
        {/* Subtle radial amber aura */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Simulation Pill Row */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                Captain Verification
                <span className="text-[10px] bg-white/5 text-neutral-400 px-2 py-0.5 rounded-full border border-white/10 font-mono">
                  {completedCount}/3 Docs
                </span>
              </h2>
            </div>
          </div>

          {/* Demo State Switcher */}
          <div className="flex items-center gap-1 bg-[#151518] p-1 rounded-xl border border-white/10 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setVerificationStatePreset('INCOMPLETE')}
              title="Simulate Incomplete Status"
              className={`px-2 py-0.5 rounded-lg transition ${
                kycData.verificationStatus === 'INCOMPLETE'
                  ? 'bg-amber-400 text-black font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => setVerificationStatePreset('UNDER_REVIEW')}
              title="Simulate Review Status"
              className={`px-2 py-0.5 rounded-lg transition ${
                kycData.verificationStatus === 'UNDER_REVIEW'
                  ? 'bg-sky-400 text-black font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => setVerificationStatePreset('VERIFIED')}
              title="Simulate Verified Status"
              className={`px-2 py-0.5 rounded-lg transition ${
                kycData.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-400 text-black font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Verified
            </button>
          </div>
        </div>

        {/* 2. Status Overview Banner */}
        <div className="space-y-2">
          {kycData.verificationStatus === 'INCOMPLETE' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
                  <span>⚠️ Verification Incomplete • Submissions Required</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Regulatory compliance required for carrying pooled passengers across express corridors.
                </p>
              </div>
            </div>
          )}

          {kycData.verificationStatus === 'UNDER_REVIEW' && (
            <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 flex items-start gap-3 shadow-sm">
              <Clock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-0.5">
                <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-sky-400">
                  <span>🕒 Documents Under Review • Typical verification: ~2 hours</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Our safety desk is validating your license, RC, and commercial insurance against the VAHAN database.
                </p>
              </div>
            </div>
          )}

          {kycData.verificationStatus === 'VERIFIED' && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                  <span>✓ Verified Captain • Full Access Granted</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  All corridor compliance checks passed. You are authorized to accept pooled passenger batches on NH48.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 5. Lockout & Dashboard Guard Banner if status !== 'VERIFIED' */}
        {kycData.verificationStatus !== 'VERIFIED' && (
          <div className="p-4 rounded-2xl bg-[#151518] border border-amber-500/30 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Shift Lock Active</span>
                  <span className="text-[10px] text-amber-400 font-extrabold uppercase bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Offline Only
                  </span>
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Going Online is locked until your documents are approved by our safety desk.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Document Submission Accordion / Grid */}
        <form onSubmit={handleSubmitReview} className="space-y-3.5">
          {/* ================= Item 1: Driving License (DL) ================= */}
          <div className="bg-[#151518] border border-white/10 rounded-2xl overflow-hidden transition-all">
            <div
              onClick={() => toggleSection('dl')}
              className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>1. Driving License (DL)</span>
                    {/* Status Pill */}
                    {isDlComplete ? (
                      <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        [ Uploaded ]
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        [ Required ]
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Commercial LMV / Transport license endorsement
                  </p>
                </div>
              </div>

              <div className="text-neutral-400">
                {expandedSections.dl ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>

            {expandedSections.dl && (
              <div className="p-4 pt-1 border-t border-white/5 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      DL Number
                    </label>
                    <input
                      type="text"
                      value={kycData.drivingLicense.dlNumber}
                      onChange={(e) => handleDlChange('dlNumber', e.target.value)}
                      placeholder="e.g. MH12 20180012345"
                      className="w-full bg-[#121214] border border-white/10 text-white rounded-xl py-2 px-3 text-xs focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={kycData.drivingLicense.expiryDate}
                      onChange={(e) => handleDlChange('expiryDate', e.target.value)}
                      className="w-full bg-[#121214] border border-white/10 text-white rounded-xl py-2 px-3 text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Upload boxes for Front & Back photos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <DocumentUploadBox
                    label="DL Front Photo"
                    sublabel="Clear photo showing photo & DL number"
                    currentFile={kycData.drivingLicense.frontPhoto}
                    onFileSelect={(file) => handleDlFileSelect('front', file)}
                    onFileRemove={() => handleDlFileRemove('front')}
                  />

                  <DocumentUploadBox
                    label="DL Back Photo"
                    sublabel="Shows vehicle class & transport badge"
                    currentFile={kycData.drivingLicense.backPhoto}
                    onFileSelect={(file) => handleDlFileSelect('back', file)}
                    onFileRemove={() => handleDlFileRemove('back')}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ================= Item 2: Vehicle Registration Certificate (RC) ================= */}
          <div className="bg-[#151518] border border-white/10 rounded-2xl overflow-hidden transition-all">
            <div
              onClick={() => toggleSection('rc')}
              className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>2. Vehicle Registration Certificate (RC)</span>
                    {isRcComplete ? (
                      <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        [ Uploaded ]
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        [ Required ]
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Smart card or digital Parivahan RC certificate
                  </p>
                </div>
              </div>

              <div className="text-neutral-400">
                {expandedSections.rc ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>

            {expandedSections.rc && (
              <div className="p-4 pt-1 border-t border-white/5 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={kycData.vehicleRegistration.registrationNumber}
                      onChange={(e) => handleRcChange('registrationNumber', e.target.value)}
                      placeholder="e.g. MH 14 JM 8821"
                      className="w-full bg-[#121214] border border-white/10 text-white rounded-xl py-2 px-3 text-xs focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Registered Owner Name
                    </label>
                    <input
                      type="text"
                      value={kycData.vehicleRegistration.registeredOwner}
                      onChange={(e) => handleRcChange('registeredOwner', e.target.value)}
                      placeholder="e.g. Sameer Khan"
                      className="w-full bg-[#121214] border border-white/10 text-white rounded-xl py-2 px-3 text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* RC Card Upload Box */}
                <div className="pt-1">
                  <DocumentUploadBox
                    label="Front Photo of RC Card"
                    sublabel="Clear photo of the physical RC or Parivahan mParivahan screenshot"
                    currentFile={kycData.vehicleRegistration.frontPhoto}
                    onFileSelect={handleRcFileSelect}
                    onFileRemove={handleRcFileRemove}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ================= Item 3: Vehicle Commercial Insurance & PUC ================= */}
          <div className="bg-[#151518] border border-white/10 rounded-2xl overflow-hidden transition-all">
            <div
              onClick={() => toggleSection('insurance')}
              className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>3. Vehicle Commercial Insurance & PUC</span>
                    {isInsuranceComplete ? (
                      <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        [ Uploaded ]
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        [ Required ]
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Comprehensive passenger liability coverage & PUC
                  </p>
                </div>
              </div>

              <div className="text-neutral-400">
                {expandedSections.insurance ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>

            {expandedSections.insurance && (
              <div className="p-4 pt-1 border-t border-white/5 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      value={kycData.commercialInsurance.policyNumber}
                      onChange={(e) => handleInsuranceChange('policyNumber', e.target.value)}
                      placeholder="e.g. HDFC-ERGO-COMM-998231"
                      className="w-full bg-[#121214] border border-white/10 text-white rounded-xl py-2 px-3 text-xs focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={kycData.commercialInsurance.expiryDate}
                      onChange={(e) => handleInsuranceChange('expiryDate', e.target.value)}
                      className="w-full bg-[#121214] border border-white/10 text-white rounded-xl py-2 px-3 text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Insurance File Upload */}
                <div className="pt-1">
                  <DocumentUploadBox
                    label="Insurance Certificate / Policy Document"
                    sublabel="PDF or photo of active commercial policy certificate"
                    currentFile={kycData.commercialInsurance.documentFile}
                    onFileSelect={handleInsuranceFileSelect}
                    onFileRemove={handleInsuranceFileRemove}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submission Feedback Toast / Alert */}
          {submissionSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Documents Submitted!</strong> Our automated safety desk has queued your verification ticket.
              </span>
            </div>
          )}

          {/* 5. Action Button: Full-width amber button: "Submit All Documents for Review" */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-black font-black transition-all shadow-lg shadow-amber-400/25 active:scale-98 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Encrypting & Submitting Documents...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>
                    {kycData.verificationStatus === 'VERIFIED'
                      ? 'Re-Submit Updated Documents for Review'
                      : 'Submit All Documents for Review'}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-neutral-400 inline-flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
              <span>
                Documents are encrypted using AES-256 and verified through DigiLocker & Parivahan APIs.
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
