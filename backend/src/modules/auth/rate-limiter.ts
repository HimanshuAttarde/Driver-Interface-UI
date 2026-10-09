/**
 * In-Memory Rate Limiter
 * 
 * Tracks request counts per key (IP + phone) within sliding windows.
 * Production recommendation: Replace with Redis-backed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private cleanupInterval: NodeJS.Timeout;

  /**
   * @param maxRequests Maximum requests allowed within the window
   * @param windowMs Time window in milliseconds
   */
  constructor(maxRequests: number = 3, windowMs: number = 10 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Periodic cleanup of expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    this.cleanupInterval.unref(); // Don't block process exit
  }

  /**
   * Check if a key is rate-limited. Returns remaining attempts or -1 if blocked.
   */
  check(key: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now - entry.windowStart >= this.windowMs) {
      // Window expired or first request — reset
      this.store.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: this.maxRequests - 1, retryAfterMs: 0 };
    }

    if (entry.count >= this.maxRequests) {
      const retryAfterMs = this.windowMs - (now - entry.windowStart);
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    entry.count++;
    return { allowed: true, remaining: this.maxRequests - entry.count, retryAfterMs: 0 };
  }

  /**
   * Build a composite key from IP and phone number.
   */
  static buildKey(ip: string, phoneNumber: string): string {
    return `otp:${ip}:${phoneNumber}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.windowStart >= this.windowMs) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}
