import { Asset, AssetType } from '@/entities/assets.entity';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
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
const marginValue = Number(marginSetting?.value || 0);

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

async listAllActiveAssets(type?: AssetType, asset?: string): Promise<AssetListDto[]> {
  // ✅ 1️⃣ Prepare DB filter
  console.log(asset)
  const whereCondition: any = { is_active: true };
  if (type) whereCondition.type = type;
  if(asset) whereCondition.code = asset;

  const assets = await this.assetRepo.find({
    where: whereCondition,
    order: { order: 'ASC' },
  });

  // ✅ 2️⃣ Determine exchange pair based on requested asset
  const baseAsset = asset || 'USDT';
  const exchange = await this.listBuyPairs();

  // ✅ 3️⃣ Fetch margin configuration from SystemConfig
  const marginSetting = await this.systemConfigService.findBySetting('MARGIN');
  const isMarginEnabled = marginSetting?.status === ConfigStatus.ENABLED;
  const globalMargin = Number(marginSetting?.value || 0);

  // ✅ 4️⃣ Map response dynamically
  return assets.map((a) => {
    const gain = isMarginEnabled ? (a.margin ?? globalMargin) : 0;

    return {
      code: a.code,
      description: a.description,
      networks:
        a.networks?.map((n) => ({
          name: n.name,
          value: n.value,
        })) || [],
      buyPrice: exchange.buyPrice - gain,
      sellPrice: exchange.sellPrice - gain,
      // marginApplied: gain,
      // exchangeBase: baseAsset,
    };
  });
}
}