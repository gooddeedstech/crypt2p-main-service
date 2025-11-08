import * as crypto from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class BushaHmacUtil {
  private readonly secret = process.env.BUSHA_WEBHOOK_SECRET || '';

  verifySignature(rawBody: string, receivedSignature: string): boolean {
    if (!this.secret) {
      throw new Error('BUSHA_WEBHOOK_SECRET not configured');
    }

    if (!receivedSignature) {
      throw new UnauthorizedException('Missing Busha signature header');
    }

    // 1️⃣ Compute expected HMAC using your webhook secret
    const hmac = crypto.createHmac('sha256', Buffer.from(this.secret));
    hmac.update(rawBody);
    const expected = hmac.digest();

    // 2️⃣ Decode Busha’s base64 signature
    let actual: Buffer;
    try {
      actual = Buffer.from(receivedSignature, 'base64');
    } catch {
      throw new UnauthorizedException('Invalid Busha signature encoding');
    }

    // 3️⃣ Compare securely
    const isValid = crypto.timingSafeEqual(actual, expected);
    if (!isValid) throw new UnauthorizedException('Invalid Busha webhook signature');

    return true;
  }
}