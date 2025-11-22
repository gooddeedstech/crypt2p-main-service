import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PriceCacheService } from './price-cache.service';

interface AssetPrice {
  symbol: string;
  last: number;
  buy: number;
  sell: number;
  currency: string;
  source: string;
}

@Injectable()
export class CoinbaseService {
  constructor(private readonly cache: PriceCacheService) {}

  private readonly logger = new Logger(CoinbaseService.name);

  private readonly ASSETS = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'TRX', 'LTC'];

  private readonly symbolMap: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    USDC: 'usd-coin',
    BNB: 'binancecoin',
    TRX: 'tron',
    LTC: 'litecoin',
  };

  // your profit margin %
  private readonly SPREAD_PERCENT = 0.6; // 0.6%

  // ----------------------------
  // PUBLIC: All prices
  // ----------------------------
  async getAllPrices(): Promise<AssetPrice[]> {
    const cacheKey = 'crypt2p:market:prices';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const prices = await this.fetchFromCoinGeckoBulk();

    await this.cache.set(cacheKey, prices, 30);
    return prices;
  }

  // ----------------------------
  // PUBLIC: Single symbol
  // ----------------------------
  async getPrice(symbol: string): Promise<AssetPrice | null> {
    const all = await this.getAllPrices();
    return all.find((p) => p.symbol === symbol) ?? null;
  }

  // ----------------------------
  // PROVIDER: CoinGecko (ONLY SOURCE)
  // ----------------------------
  private async fetchFromCoinGeckoBulk(): Promise<AssetPrice[]> {
    const ids = Object.values(this.symbolMap).join(',');

    const { data } = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { timeout: 15000 },
    );

    const prices: AssetPrice[] = this.ASSETS.map((symbol) => {
      const coinId = this.symbolMap[symbol];
      const marketPrice = Number(data[coinId]?.usd);

      if (!marketPrice) {
        throw new Error(`CoinGecko missing price for ${symbol}`);
      }

      // ---- Your Spread Logic ----
      const spread = this.SPREAD_PERCENT / 100;

      const buy = marketPrice * (1 + spread);  // user buys from you
      const sell = marketPrice * (1 - spread); // user sells to you

      return {
        symbol,
        last: marketPrice,
        buy: Number(buy.toFixed(2)),
        sell: Number(sell.toFixed(2)),
        currency: 'USD',
        source: 'coingecko',
      };
    });

    return prices;
  }
}