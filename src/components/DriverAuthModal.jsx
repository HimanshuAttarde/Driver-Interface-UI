import React, { useState, useRef, useEffect } from 'react';
import { X, ShieldCheck, ArrowRight, Loader2, RefreshCw, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Indian Flag SVG component for the Country Code pill
 */
function IndiaFlagIcon({ className = "w-5 h-3.5" }) {
  return (
    <svg className={`${className} rounded-xs shadow-xs overflow-hidden shrink-0`} viewBox="0 0 30 20" fill="none">
      <rect width="30" height="20" fill="#FFFFFF" />
      <rect width="30" height="6.67" fill="#FF9933" />
      <rect y="13.33" width="30" height="6.67" fill="#128807" />
      <circle cx="15" cy="10" r="2.8" stroke="#000080" strokeWidth="0.6" fill="none" />
      <circle cx="15" cy="10" r="0.6" fill="#000080" />
    </svg>
  );
}

const RESEND_TIMEOUT_SECONDS = 45;
const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000';

export default function DriverAuthModal({
  isOpen = false,
  onClose,
  onAuthSuccess,
}) {
  // Modal State Machine
  const [step, setStep] = useState('PHONE'); // 'PHONE' | 'OTP'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [devDemoOtp, setDevDemoOtp] = useState('');
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT_SECONDS);

  const canResend = countdown === 0;

  // References for OTP input elements
  const inputRefs = useRef([]);
  const phoneInputRef = useRef(null);

  // Focus on initial mount or step change
  useEffect(() => {
    if (isOpen) {
      if (step === 'PHONE') {
        setTimeout(() => phoneInputRef.current?.focus(), 150);
      } else if (step === 'OTP') {
        setTimeout(() => inputRefs.current[0]?.focus(), 150);
      }
    }
  }, [isOpen, step]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  // Phone input validator (10 digits)
  const handlePhoneChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(rawVal);
    setApiError('');

    if (rawVal.length > 0 && rawVal.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
    } else {
      setPhoneError('');
    }
  };

  // STEP 1: Submit Phone Number -> Call /send-otp
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (phoneNumber.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setApiError('');

    const formattedPhone = `+91${phoneNumber}`;

    try {
      // Attempt live backend call
      const response = await fetch(`${API_BASE}/api/v1/driver/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send verification code. Please try again.');
      }

      // Step transition
      setStep('OTP');
      setCountdown(RESEND_TIMEOUT_SECONDS);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
    } catch (err) {
      // Dev / Fallback graceful handling if local backend is offline during frontend preview
      console.warn('API call failed or offline, falling back to client dev mode:', err.message);
      
      // If network unreachable, allow demo testing with sample OTP
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setDevDemoOtp('123456');
        setStep('OTP');
        setCountdown(RESEND_TIMEOUT_SECONDS);
        setCanResend(false);
        setOtpValues(['', '', '', '', '', '']);
      } else {
        setApiError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    await handleSendOtp();
  };

  // OTP inputs handling
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    const newValues = [...otpValues];

    if (!cleaned) {
      newValues[index] = '';
      setOtpValues(newValues);
      return;
    }

    // Handle single digit
    newValues[index] = cleaned.slice(-1);
    setOtpValues(newValues);
    setApiError('');

    // Advance to next box if available
    if (index < 5 && cleaned) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Backspace jump to previous
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Full clipboard paste support
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newValues = [...otpValues];
    for (let i = 0; i < 6; i++) {
      newValues[i] = pastedData[i] || '';
    }
    setOtpValues(newValues);
    setApiError('');

    // Focus last filled or 6th input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // STEP 2: Verify OTP -> Call /verify-otp
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setApiError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setApiError('');

    const formattedPhone = `+91${phoneNumber}`;

    try {
      // Check if dev fallback mock code was triggered
      if (devDemoOtp && fullOtp === devDemoOtp) {
        // Mock successful verify for offline preview
        const mockDriver = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          phoneNumber: formattedPhone,
          fullName: 'Sameer Khan',
          status: 'ACTIVE',
          isVerified: true,
          isActive: true,
        };
        const mockToken = 'mock_jwt_token_header.payload.signature';

        localStorage.setItem('smartpool_access_token', mockToken);
        localStorage.setItem('smartpool_driver_profile', JSON.stringify(mockDriver));

        onAuthSuccess?.({
          driver: mockDriver,
          isNewDriver: false,
          accessToken: mockToken,
        });
        onClose?.();
        return;
      }

      // Live backend call
      const response = await fetch(`${API_BASE}/api/v1/driver/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Receive secure httpOnly refreshToken cookie
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          otp: fullOtp,
          deviceInfo: navigator.userAgent || 'SmartPool Driver Console',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Verification failed. Please try again.');
      }

      // Persist access token & driver info
      if (data.accessToken) {
        localStorage.setItem('smartpool_access_token', data.accessToken);
      }
      if (data.driver) {
        localStorage.setItem('smartpool_driver_profile', JSON.stringify(data.driver));
      }

      // Callback triggers state machine & transitions
      onAuthSuccess?.({
        driver: data.driver,
        isNewDriver: Boolean(data.isNewDriver),
        accessToken: data.accessToken,
      });

      onClose?.();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isOtpComplete = otpValues.every((digit) => digit.length === 1);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {/* Modal Container */}
      <div className="bg-[#1a1a1e] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-white transition-all transform animate-scale-up">
        
        {/* Top-Right Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: PHONE NUMBER ENTRY */}
        {step === 'PHONE' && (
          <div className="space-y-6">
            {/* Header / Eyebrow */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>• CAPTAIN ACCESS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Driver Sign In<span className="text-amber-400">.</span>
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Enter your registered mobile number to manage your corridor.
              </p>
            </div>

            {/* Error Notification */}
            {apiError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-300">
                  Mobile Phone Number
                </label>

                {/* Sunken Phone Input Group */}
                <div
                  className={`flex items-center bg-[#151518] border rounded-xl overflow-hidden transition-all ${
                    phoneError
                      ? 'border-red-500/50'
                      : 'border-white/10 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/30'
                  }`}
                >
                  {/* Country Code Pill (+91 & India Flag) */}
                  <div className="flex items-center gap-2 px-3.5 py-3 bg-white/5 border-r border-white/10 select-none shrink-0">
                    <IndiaFlagIcon className="w-5 h-3.5" />
                    <span className="text-xs font-bold text-neutral-200">+91</span>
                  </div>

                  {/* 10-Digit Input */}
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    disabled={isLoading}
                    className="w-full bg-transparent px-3.5 py-3 text-sm text-white placeholder-neutral-500 font-medium tracking-wider focus:outline-none"
                  />

                  {phoneNumber.length === 10 && !phoneError && (
                    <div className="pr-3 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {phoneError && (
                  <p className="text-[11px] text-red-400 font-medium pl-1">
                    {phoneError}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading || phoneNumber.length !== 10}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-black font-bold text-sm transition-all shadow-lg shadow-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Notice */}
            <div className="pt-2 border-t border-white/5 text-center">
              <p className="text-[11px] text-neutral-500 leading-normal">
                By signing in, you agree to SmartPool corridor safety and detour policies.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
        {step === 'OTP' && (
          <div className="space-y-6">
            {/* Header / Eyebrow */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold tracking-wider uppercase">
                <KeyRound className="w-3.5 h-3.5" />
                <span>• ONE-TIME PASSWORD</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Enter 6-digit code<span className="text-amber-400">.</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400 flex-wrap">
                <span>Sent to +91 {phoneNumber}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('PHONE');
                    setApiError('');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Dev Demo OTP Hint */}
            {devDemoOtp && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center justify-between">
                <span>Demo Code: <strong>{devDemoOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpValues(['1', '2', '3', '4', '5', '6'])}
                  className="text-[11px] bg-amber-400 text-black px-2 py-0.5 rounded font-bold hover:bg-amber-300"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* Error Notification */}
            {apiError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {/* 6-Digit OTP Box Grid */}
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2" onPaste={handlePaste}>
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      disabled={isLoading}
                      className={`w-11 sm:w-12 h-13 sm:h-14 text-center text-xl font-bold bg-[#151518] border rounded-xl text-white transition-all focus:outline-none ${
                        digit
                          ? 'border-amber-400/80 bg-amber-400/5 text-amber-300 shadow-inner'
                          : 'border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Mechanism */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-neutral-500">Didn't receive the code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                ) : (
                  <span className="text-neutral-400 font-medium tabular-nums">
                    Resend code in 00:{countdown < 10 ? `0${countdown}` : countdown}
                  </span>
                )}
              </div>

              {/* Verify & Enter Console Action Button */}
              <button
                type="submit"
                disabled={isLoading || !isOtpComplete}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-black font-bold text-sm transition-all shadow-lg shadow-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Enter Console</span>
                  </>
                )}
              </button>
            </form>

            {/* Back to Phone Step */}
            <div className="text-center pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                ← Back to Phone Number
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
