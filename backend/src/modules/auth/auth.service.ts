import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, DriverStatus } from '@prisma/client';
import { SmsProvider, ConsoleSmsProvider } from './sms-provider';
import { RateLimiter } from './rate-limiter';
import { BadRequestError, UnauthorizedError } from '../../common/errors/app-error';
import { normalizePhone } from './dto/auth.dto';

// Environment / JWT Configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'smartpool-driver-access-secret-key-32chars!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'smartpool-driver-refresh-secret-key-32chars!';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;

export interface TokenPayload {
  driverId: string;
  role: 'DRIVER';
}

export interface AuthResult {
  success: boolean;
  driver: {
    id: string;
    phoneNumber: string;
    fullName: string;
    status: DriverStatus;
    isVerified: boolean;
    isActive: boolean;
  };
  accessToken: string;
  refreshToken: string;
  isNewDriver: boolean;
}

export class AuthService {
  private prisma: PrismaClient;
  private smsProvider: SmsProvider;
  private rateLimiter: RateLimiter;
  private hasDatabase = false;

  // In-memory fallback stores when DB is unavailable or offline
  private inMemoryDrivers = new Map<string, any>();
  private inMemoryOtps = new Map<string, { otpHash: string; attempts: number; expiresAt: Date }>();
  private inMemorySessions = new Map<string, any>();

  constructor(
    prismaClient: PrismaClient,
    smsProvider: SmsProvider = new ConsoleSmsProvider(),
    rateLimiter: RateLimiter = new RateLimiter()
  ) {
    this.prisma = prismaClient;
    this.smsProvider = smsProvider;
    this.rateLimiter = rateLimiter;
    this.checkDatabaseConnection();
  }

  private async checkDatabaseConnection(): Promise<void> {
    try {
      if (process.env.DATABASE_URL) {
        await this.prisma.$queryRaw`SELECT 1`;
        this.hasDatabase = true;
      }
    } catch {
      this.hasDatabase = false;
    }
  }

  /**
   * Generates a cryptographically secure 6-digit OTP
   */
  private generateSecureOtp(): string {
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0) % 1000000;
    return num.toString().padStart(6, '0');
  }

  /**
   * STEP 1: Send OTP
   * Validates rate limit, generates 6-digit OTP, hashes it, saves it, and sends SMS.
   */
  async sendOtp(rawPhone: string, ipAddress = '127.0.0.1'): Promise<{ success: boolean; message: string; retryAfterMs?: number }> {
    const phoneNumber = normalizePhone(rawPhone);

    // 1. Rate Limit Check (3 per 10 minutes per IP/number)
    const rateKey = RateLimiter.buildKey(ipAddress, phoneNumber);
    const rateCheck = this.rateLimiter.check(rateKey);

    if (!rateCheck.allowed) {
      throw new BadRequestError(
        `Too many OTP requests. Please wait ${Math.ceil(rateCheck.retryAfterMs / 1000 / 60)} minute(s) before trying again.`,
        [{ retryAfterMs: rateCheck.retryAfterMs }]
      );
    }

    // 2. Generate secure 6-digit OTP
    const otp = this.generateSecureOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // 3. Store OTP in Database or Memory
    if (this.hasDatabase) {
      try {
        await (this.prisma as any).otpVerification.deleteMany({
          where: { phoneNumber },
        });

        await (this.prisma as any).otpVerification.create({
          data: {
            phoneNumber,
            otpHash,
            attempts: 0,
            expiresAt,
          },
        });
      } catch {
        // Fallback to in-memory store
        this.inMemoryOtps.set(phoneNumber, { otpHash, attempts: 0, expiresAt });
      }
    } else {
      this.inMemoryOtps.set(phoneNumber, { otpHash, attempts: 0, expiresAt });
    }

    // 4. Dispatch via SMS Provider
    await this.smsProvider.sendOtp(phoneNumber, otp);

    return {
      success: true,
      message: `OTP sent successfully to ${phoneNumber}. Valid for 5 minutes.`,
    };
  }

  /**
   * STEP 2: Verify OTP
   * Validates OTP hash, handles expiration and brute-force attempts,
   * upserts driver record, generates access and refresh tokens, creates session.
   */
  async verifyOtp(
    rawPhone: string,
    otp: string,
    deviceInfo?: string,
    ipAddress = '127.0.0.1'
  ): Promise<AuthResult> {
    const phoneNumber = normalizePhone(rawPhone);

    // 1. Fetch OTP record
    let otpRecord: { id?: string; otpHash: string; attempts: number; expiresAt: Date } | null = null;

    if (this.hasDatabase) {
      try {
        const found = await (this.prisma as any).otpVerification.findFirst({
          where: { phoneNumber },
          orderBy: { createdAt: 'desc' },
        });
        if (found) otpRecord = found;
      } catch {
        otpRecord = this.inMemoryOtps.get(phoneNumber) || null;
      }
    } else {
      otpRecord = this.inMemoryOtps.get(phoneNumber) || null;
    }

    if (!otpRecord) {
      throw new BadRequestError('No OTP request found for this phone number. Please request a new OTP.');
    }

    // Check expiration
    if (new Date() > new Date(otpRecord.expiresAt)) {
      throw new BadRequestError('The OTP has expired. Please request a new one.');
    }

    // Check max attempts
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestError('Too many failed attempts. This OTP is invalidated. Please request a new OTP.');
    }

    // 2. Validate OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isValid) {
      // Increment attempts
      if (this.hasDatabase && otpRecord.id) {
        try {
          await (this.prisma as any).otpVerification.update({
            where: { id: otpRecord.id },
            data: { attempts: { increment: 1 } },
          });
        } catch {
          otpRecord.attempts += 1;
        }
      } else {
        otpRecord.attempts += 1;
      }

      const remaining = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);
      throw new BadRequestError(`Invalid OTP code. ${Math.max(0, remaining)} attempt(s) remaining.`);
    }

    // 3. Clear verified OTP
    if (this.hasDatabase && otpRecord.id) {
      try {
        await (this.prisma as any).otpVerification.delete({
          where: { id: otpRecord.id },
        });
      } catch {
        this.inMemoryOtps.delete(phoneNumber);
      }
    } else {
      this.inMemoryOtps.delete(phoneNumber);
    }

    // 4. Upsert Driver Record
    let driver: any;
    let isNewDriver = false;

    if (this.hasDatabase) {
      try {
        const existing = await this.prisma.driver.findUnique({
          where: { phoneNumber },
        });

        if (existing) {
          driver = existing;
        } else {
          isNewDriver = true;
          driver = await this.prisma.driver.create({
            data: {
              phoneNumber,
              fullName: '',
              status: DriverStatus.PROFILE_INCOMPLETE,
              isVerified: false,
              isActive: true,
            },
          });
        }
      } catch {
        driver = this.getOrSetInMemoryDriver(phoneNumber);
        isNewDriver = driver._isNew || false;
      }
    } else {
      driver = this.getOrSetInMemoryDriver(phoneNumber);
      isNewDriver = driver._isNew || false;
    }

    // 5. Generate Tokens
    const accessToken = this.generateAccessToken(driver.id);
    const refreshToken = this.generateRefreshToken(driver.id);

    // 6. Store Refresh Token Session
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    if (this.hasDatabase) {
      try {
        await (this.prisma as any).driverAuthSession.create({
          data: {
            driverId: driver.id,
            refreshTokenHash,
            deviceInfo: deviceInfo || null,
            ipAddress,
            expiresAt: sessionExpiresAt,
          },
        });
      } catch {
        this.inMemorySessions.set(refreshToken, {
          driverId: driver.id,
          refreshTokenHash,
          expiresAt: sessionExpiresAt,
          isRevoked: false,
        });
      }
    } else {
      this.inMemorySessions.set(refreshToken, {
        driverId: driver.id,
        refreshTokenHash,
        expiresAt: sessionExpiresAt,
        isRevoked: false,
      });
    }

    return {
      success: true,
      driver: {
        id: driver.id,
        phoneNumber: driver.phoneNumber,
        fullName: driver.fullName || 'Captain',
        status: driver.status || DriverStatus.PROFILE_INCOMPLETE,
        isVerified: driver.isVerified ?? false,
        isActive: driver.isActive ?? true,
      },
      accessToken,
      refreshToken,
      isNewDriver,
    };
  }

  /**
   * STEP 3: Refresh Access Token
   */
  async refreshAccessToken(
    refreshToken: string,
    ipAddress = '127.0.0.1'
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required.');
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    // Verify session in DB or Memory
    let sessionFound = false;
    let sessionId: string | null = null;

    if (this.hasDatabase) {
      try {
        const sessions = await (this.prisma as any).driverAuthSession.findMany({
          where: {
            driverId: decoded.driverId,
            isRevoked: false,
            expiresAt: { gt: new Date() },
          },
        });

        for (const s of sessions) {
          const match = await bcrypt.compare(refreshToken, s.refreshTokenHash);
          if (match) {
            sessionFound = true;
            sessionId = s.id;
            break;
          }
        }
      } catch {
        const mem = this.inMemorySessions.get(refreshToken);
        if (mem && !mem.isRevoked && new Date() < mem.expiresAt) {
          sessionFound = true;
        }
      }
    } else {
      const mem = this.inMemorySessions.get(refreshToken);
      if (mem && !mem.isRevoked && new Date() < mem.expiresAt) {
        sessionFound = true;
      }
    }

    if (!sessionFound) {
      throw new UnauthorizedError('Session is invalid or has been revoked.');
    }

    // Rotate refresh token
    const newAccessToken = this.generateAccessToken(decoded.driverId);
    const newRefreshToken = this.generateRefreshToken(decoded.driverId);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (this.hasDatabase && sessionId) {
      try {
        await (this.prisma as any).driverAuthSession.update({
          where: { id: sessionId },
          data: {
            refreshTokenHash: newRefreshTokenHash,
            expiresAt: sessionExpiresAt,
            ipAddress,
          },
        });
      } catch {
        this.inMemorySessions.delete(refreshToken);
        this.inMemorySessions.set(newRefreshToken, {
          driverId: decoded.driverId,
          refreshTokenHash: newRefreshTokenHash,
          expiresAt: sessionExpiresAt,
          isRevoked: false,
        });
      }
    } else {
      this.inMemorySessions.delete(refreshToken);
      this.inMemorySessions.set(newRefreshToken, {
        driverId: decoded.driverId,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: sessionExpiresAt,
        isRevoked: false,
      });
    }

    return {
      accessToken: newAccessToken,
      newRefreshToken,
    };
  }

  /**
   * STEP 4: Logout / Revoke Session
   */
  async logout(refreshToken?: string): Promise<boolean> {
    if (!refreshToken) return true;

    try {
      if (this.hasDatabase) {
        const sessions = await (this.prisma as any).driverAuthSession.findMany({
          where: { isRevoked: false },
        });

        for (const s of sessions) {
          const match = await bcrypt.compare(refreshToken, s.refreshTokenHash);
          if (match) {
            await (this.prisma as any).driverAuthSession.update({
              where: { id: s.id },
              data: { isRevoked: true },
            });
            break;
          }
        }
      } else {
        const mem = this.inMemorySessions.get(refreshToken);
        if (mem) {
          mem.isRevoked = true;
        }
      }
    } catch {
      // Ignore
    }

    return true;
  }

  // Token Generation Helpers
  private generateAccessToken(driverId: string): string {
    const payload: TokenPayload = { driverId, role: 'DRIVER' };
    return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  private generateRefreshToken(driverId: string): string {
    const payload: TokenPayload = { driverId, role: 'DRIVER' };
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  }

  // Fallback in-memory driver creator
  private getOrSetInMemoryDriver(phoneNumber: string): any {
    let driver = this.inMemoryDrivers.get(phoneNumber);
    if (!driver) {
      driver = {
        id: crypto.randomUUID(),
        phoneNumber,
        fullName: 'Captain Sameer',
        status: DriverStatus.PROFILE_INCOMPLETE,
        isVerified: false,
        isActive: true,
        _isNew: true,
      };
      this.inMemoryDrivers.set(phoneNumber, driver);
    } else {
      driver._isNew = false;
    }
    return driver;
  }
}
