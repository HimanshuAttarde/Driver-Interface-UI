import { z } from 'zod';

// ─────────────────────────────────────────────────────
// PHONE NUMBER VALIDATION
// ─────────────────────────────────────────────────────

/**
 * Accepts:
 * - E.164 format: +919876543210
 * - Raw 10-digit Indian mobile: 9876543210
 * Normalises to E.164 (+91 prefix) internally.
 */
const phoneNumberSchema = z
  .string()
  .trim()
  .refine(
    (val) => /^\+?[1-9]\d{9,14}$/.test(val),
    { message: 'Invalid phone number. Use E.164 format (e.g., +919876543210) or 10-digit number.' }
  );

// ─────────────────────────────────────────────────────
// SEND OTP
// ─────────────────────────────────────────────────────

export const SendOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export type SendOtpDto = z.infer<typeof SendOtpSchema>;

// ─────────────────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────────────────

export const VerifyOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
  otp: z
    .string()
    .trim()
    .length(6, { message: 'OTP must be exactly 6 digits.' })
    .regex(/^\d{6}$/, { message: 'OTP must contain only digits.' }),
  deviceInfo: z.string().max(256).optional(),
});

export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;

// ─────────────────────────────────────────────────────
// NORMALIZED PHONE HELPER
// ─────────────────────────────────────────────────────

/**
 * Normalises a raw phone string to E.164 format.
 * Assumes Indian (+91) if no country code present.
 */
export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return `+${cleaned}`;
}
