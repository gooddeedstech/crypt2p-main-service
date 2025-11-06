import * as crypto from 'crypto';

export class OtpUtil {
  /**
   * Generates a 6-digit secure OTP.
   */
  static generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }
}