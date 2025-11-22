import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class PriceCacheService {
  private redis = new Redis(process.env.REDIS_URL);

  async get(key: string) {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl = 15) {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }
}