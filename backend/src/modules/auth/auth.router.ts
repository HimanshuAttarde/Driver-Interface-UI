import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();
  const controller = new AuthController(authService);

  /**
   * @route   POST /api/v1/driver/auth/send-otp
   * @desc    Request a 6-digit one-time password
   */
  router.post('/send-otp', controller.sendOtp);

  /**
   * @route   POST /api/v1/driver/auth/verify-otp
   * @desc    Verify OTP and obtain JWT tokens
   */
  router.post('/verify-otp', controller.verifyOtp);

  /**
   * @route   POST /api/v1/driver/auth/refresh
   * @desc    Rotate refresh token and get a new access token
   */
  router.post('/refresh', controller.refreshToken);

  /**
   * @route   POST /api/v1/driver/auth/logout
   * @desc    Revoke current refresh session and clear cookie
   */
  router.post('/logout', controller.logout);

  return router;
}
