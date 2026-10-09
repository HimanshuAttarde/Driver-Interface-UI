/**
 * SMS Provider Interface
 * 
 * Pluggable SMS gateway abstraction for OTP delivery.
 * In development, uses ConsoleSmsProvider (logs OTP to stdout).
 * In production, swap with Twilio, MSG91, Gupshup, etc.
 */

export interface SmsProvider {
  sendOtp(phoneNumber: string, otp: string): Promise<boolean>;
}

// ─────────────────────────────────────────────────────
// CONSOLE PROVIDER (Development / Sandbox)
// ─────────────────────────────────────────────────────

export class ConsoleSmsProvider implements SmsProvider {
  async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║  📲 OTP DELIVERY (DEV MODE)              ║`);
    console.log(`╠══════════════════════════════════════════╣`);
    console.log(`║  Phone : ${phoneNumber.padEnd(30)}║`);
    console.log(`║  OTP   : ${otp.padEnd(30)}║`);
    console.log(`║  TTL   : 5 minutes                      ║`);
    console.log(`╚══════════════════════════════════════════╝\n`);
    return true;
  }
}

// ─────────────────────────────────────────────────────
// MOCK PROVIDER (Unit Tests)
// ─────────────────────────────────────────────────────

export class MockSmsProvider implements SmsProvider {
  public lastOtp: string = '';
  public lastPhone: string = '';
  public callCount: number = 0;

  async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    this.lastPhone = phoneNumber;
    this.lastOtp = otp;
    this.callCount++;
    return true;
  }

  reset(): void {
    this.lastOtp = '';
    this.lastPhone = '';
    this.callCount = 0;
  }
}
