import { Asset, AssetType } from '@/entities/assets.entity';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { exhaustAll, firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { AssetListDto } from './dto/asset.dto';
import { SystemConfigService } from '../system-settings/system-config.service';
import { ConfigStatus } from '@/entities/system-config.entity';

@Injectable()
export class BushaAPIService {
  private readonly logger = new Logger(BushaAPIService.name);
  private readonly baseUrl = process.env.BUSHA_BASE_URL || 'https://api.sandbox.busha.co';

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    private readonly http: HttpService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  

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
    const url = `${this.baseUrl}/v1/pairs?currency=NGN`;
    this.logger.log(`📡 GET: ${url}`);

    const res = await firstValueFrom(
      this.http.get(url),
    );

    const raw = res.data?.data ?? res.data; // ✅ handles both shapes
  
    const usdtPair = Array.isArray(raw)
      ? raw.find((p: any) => p.id === 'USDTNGN')
      : raw.id === 'USDTNGN'
      ? raw
      : null;

    if (!usdtPair) {
      throw new RpcException({
        statusCode: 404,
        message: 'USDTNGN pair not found',
      });
    }

  

const marginSetting = await this.systemConfigService.findBySetting('MARGIN');
const isMarginEnabled = marginSetting?.status === ConfigStatus.ENABLED;
const marginValue = Number(marginSetting?.ngnValue || 0);

// ✅ Determine gain based on config status
const gain = isMarginEnabled ? marginValue : 0;

    const result = {
      id: usdtPair.id,
      base: usdtPair.base,
      counter: usdtPair.counter,
      buyPrice: Number(usdtPair.buy_price.amount) + gain,
      sellPrice: Number(usdtPair.sell_price.amount) - gain,
     
    };

    this.logger.log(
      `💰 USDTNGN Prices → Buy: ₦${result.buyPrice}, Sell: ₦${result.sellPrice}`,
    );

    return result;
  } catch (err: any) {
    const errorResponse = {
      message:
        err.response?.data?.message || err.message || 'Failed to list Busha pairs',
      status: err.response?.status || 500,
    };

    this.logger.error('Busha listBuyPairs error:', errorResponse);
    throw new RpcException(errorResponse);
  }
}

async getRateInUSDT(asset: string) {
    try {
      const url = `${this.baseUrl}/v1/pairs`;
      this.logger.log(`📡 Fetching Busha pairs → ${url}`);

      const res = await firstValueFrom(this.http.get(url));
      const pairs = res.data?.data ?? [];

      if (!Array.isArray(pairs) || pairs.length === 0) {
        throw new RpcException({
          statusCode: 404,
          message: 'No pairs found from Busha API',
        });
      }

      // 🧠 Try to find rate where USDT is base or counter
      const pair =
        pairs.find((p: any) => p.id === `USDT${asset}`) ||
        pairs.find((p: any) => p.id === `${asset}USDT`);

      if (!pair) {
        throw new RpcException({
          statusCode: 404,
          message: `No matching USDT pair found for ${asset}`,
        });
      }

      

      // ⚙️ Margin configuration
      const marginSetting = await this.systemConfigService.findBySetting('MARGIN');
      const isMarginEnabled = marginSetting?.status === ConfigStatus.ENABLED;
      const marginValue = Number(marginSetting?.usdValue || 0);
      const gain = isMarginEnabled ? marginValue : 0;

      const rateInfo = {
        id: pair.id,
        base: pair.base,
        counter: pair.counter,
        buyPrice: Number(pair.buy_price.amount) + gain,
        sellPrice: Number(pair.sell_price.amount) - gain,
        minBuy: pair.min_buy_amount.amount ,
      maxBuy: pair.max_buy_amount.amount ,
      minSell: pair.min_sell_amount.amount ,
      maxSell: pair.max_sell_amount.amount ,
      };

      this.logger.log(
        `💱 Rate [${pair.id}] → Buy: ${rateInfo.buyPrice}, Sell: ${rateInfo.sellPrice}`,
      );
      // console.log(rateInfo)
      return rateInfo;
    } catch (err: any) {
      const errorResponse = {
        message:
          err.response?.data?.message || err.message || 'Failed to fetch Busha rates',
        status: err.response?.status || 500,
      };

      this.logger.error('❌ getRateInUSDT error:', errorResponse);
      throw new RpcException(errorResponse);
    }
  }

async listAllActiveAssets(type?: AssetType, asset?: string): Promise<AssetListDto[]> {
  // ✅ 1️⃣ Prepare DB filter
 
  const whereCondition: any = { is_active: true };
  if (type) whereCondition.type = type;
  if(asset) whereCondition.code = asset;

  const assets = await this.assetRepo.find({
    where: whereCondition,
    order: { order: 'ASC' },
  });


  const baseAsset = asset || 'USDT';
  const exchange = await this.listBuyPairs();


  // ✅ 4️⃣ Map response dynamically
const results = await Promise.all(
  assets.map(async (a) => {
    let usdAsset = { buyPrice: 1, sellPrice: 1, minBuy: 1, maxBuy: 2000, minSell: 10, maxSell: 5000 }; // default for USDT/USDC

    // Fetch USD reference rate for non-stable assets
    if (a.code !== 'USDT' && a.code !== 'USDC') {
     
        usdAsset = await this.getRateInUSDT(a.code);
    
    }

    return {
      code: a.code,
      description: a.description,
      networks:
        a.networks?.map((n) => ({ 
          name: n.name,
          value: n.value,
        })) || [],
      usdBuyPrice: usdAsset.buyPrice,
      usdSellPrice: usdAsset.sellPrice,
      ngnBuyPrice: exchange.buyPrice + Number(a.margin),
      ngnSellPrice: exchange.sellPrice + Number(a.margin),
      minBuyValue: usdAsset.minBuy,
      maxBuyValue: usdAsset.maxBuy,
      minSellValue: usdAsset.minSell,
      maxSellValue: usdAsset.maxSell
      // marginApplied: gain,
      // exchangeBase: baseAsset,
    };
  }),
);

return results;
}
}