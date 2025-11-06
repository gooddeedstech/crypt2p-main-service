import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BushaAPIService {
  private readonly logger = new Logger(BushaAPIService.name);
  private readonly baseUrl = process.env.BUSHA_BASE_URL || 'https://api.sandbox.busha.co';

  constructor(private readonly http: HttpService) {}

  private authHeaders() {
    const key = process.env.BUSHA_SECRET_KEY;
    if (!key) {
      throw new HttpException('Busha API Key missing', 500);
    }
    return { Authorization: `Bearer ${key}` };
  }

  /** ✅ List supported crypto pairs with NGN prices */
  async listBuyPairs() {
    try {
      const url = `${this.baseUrl}/v1/pairs?type=crypto`;
      this.logger.log(`📡 GET: ${url}`);

      const res = await firstValueFrom(
        this.http.get(url, { headers: this.authHeaders() }),
      );

      const items = res.data?.items ?? [];
      console.log(JSON.stringify(res.data))
      // 🧮 Flatten to asset structure
      return res.data

    } catch (err: any) {
      this.logger.error('Busha listBuyPairs error:', err.response?.data || err.message);
      throw new HttpException(
        err.response?.data?.message || 'Failed to list Busha pairs',
        err.response?.status || 500,
      );
    }
  }

  /** ✅ Single asset price lookup */
  async getPrice(symbol: string) {
    const pairs = await this.listBuyPairs();
    const match = pairs.find(p => p.asset === symbol);

    if (!match) {
      throw new HttpException('Asset not found', 404);
    }  

    return match;
  }
}