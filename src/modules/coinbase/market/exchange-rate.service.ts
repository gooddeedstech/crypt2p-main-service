import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  private fallbackRate = 1500;

  async getUsdToNgn(): Promise<number> {

    // 1. Try Frankfurter (works very well in Nigeria)
    try {
      const { data } = await axios.get(
        'https://api.frankfurter.app/latest?from=USD&to=NGN',
        { timeout: 10000 }
      );

      const rate = Number(data?.rates?.NGN);
      if (rate) return rate;
    } catch {
      this.logger.warn('Frankfurter USD→NGN failed');
    }

    // 2. Try CoinGecko (crypto accurate FX)
    try {
      const { data } = await axios.get(
        'https://api.coingecko.com/api/v3/exchange_rates',
        { timeout: 10000 }
      );

      const usd = Number(data?.rates?.usd?.value);
      const ngn = Number(data?.rates?.ngn?.value);

      if (usd && ngn) {
        return ngn / usd;
      }
    } catch {
      this.logger.warn('CoinGecko exchange rate failed');
    }

    // 3. Last resort fallback
    return this.fallbackRate;
  }
}