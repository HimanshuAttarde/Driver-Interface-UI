import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { SendOtpSchema, VerifyOtpSchema } from './dto/auth.dto';
import { BadRequestError } from '../../common/errors/app-error';

const COOKIE_NAME = 'smartpool_driver_refresh';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/v1/driver/auth/send-otp
   */
  sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = SendOtpSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new BadRequestError('Validation failed', parseResult.error.errors);
      }

      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const result = await this.authService.sendOtp(parseResult.data.phoneNumber, clientIp);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/driver/auth/verify-otp
   */
  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = VerifyOtpSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new BadRequestError('Validation failed', parseResult.error.errors);
      }

      const { phoneNumber, otp, deviceInfo } = parseResult.data;
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = deviceInfo || (req.headers['user-agent'] as string) || 'smartpool-portal';

      const result = await this.authService.verifyOtp(phoneNumber, otp, userAgent, clientIp);

      // Set Refresh Token in secure HTTP-only cookie
      res.cookie(COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/api/v1/driver/auth',
      });

      res.status(200).json({
        success: true,
        driver: result.driver,
        accessToken: result.accessToken,
        isNewDriver: result.isNewDriver,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/driver/auth/refresh
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      const { accessToken, newRefreshToken } = await this.authService.refreshAccessToken(token, clientIp);

      // Rotate cookie
      res.cookie(COOKIE_NAME, newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/api/v1/driver/auth',
      });

      res.status(200).json({
        success: true,
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/driver/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
      await this.authService.logout(token);

      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/driver/auth',
      });

      res.status(200).json({
        success: true,
        message: 'Successfully logged out.',
      });
    } catch (err) {
      next(err);
    }
  };
}
