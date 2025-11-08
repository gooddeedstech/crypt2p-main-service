import { Asset } from '@/entities/assets.entity';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { AssetListDto } from './dto/asset.dto';

@Injectable()
export class BushaAPIService {
  private readonly logger = new Logger(BushaAPIService.name);
  private readonly baseUrl = process.env.BUSHA_BASE_URL || 'https://api.sandbox.busha.co';

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    private readonly http: HttpService) {}

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

    const result = {
      id: usdtPair.id,
      base: usdtPair.base,
      counter: usdtPair.counter,
      buyPrice: Number(usdtPair.buy_price.amount)+5,
      sellPrice: Number(usdtPair.sell_price.amount)-5,
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

 async listAllActiveAssets(): Promise<AssetListDto[]> {
    const assets = await this.assetRepo.find({
      where: { is_active: true },
      order: { order: 'ASC' },
    });
    const usdtExchange = await this.listBuyPairs()

    return assets.map((a) => ({
      code: a.code,
      description: a.description,
      networks: a.networks?.map((n) => ({
        name: n.name,
        value: n.value,
      })) || [],
      buyPrice: usdtExchange.buyPrice - a.margin,
      sellPrice: usdtExchange.sellPrice - a.margin
    }));
  }
}