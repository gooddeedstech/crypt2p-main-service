import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { CryptoTransaction, CryptoTransactionStatus, CryptoTransactionType } from '@/entities/crypto-transaction.entity';
import { RpcException } from '@nestjs/microservices';
import { BushaAPIService } from '../busha-api.service';
import { FeesService } from '@/modules/fees/fees.service';

@Injectable()
export class BushaBuyService {
  private readonly logger = new Logger(BushaBuyService.name);
  private readonly baseUrl = 'https://api.busha.co';
  private readonly apiKey = process.env.BUSHA_SECRET_KEY;

  constructor(
    private readonly http: HttpService,
    @InjectRepository(CryptoTransaction)
    private readonly txRepo: Repository<CryptoTransaction>,
     private readonly bushaAPIService: BushaAPIService,
     private readonly feesService: FeesService
    
  ) {}

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /** ✅ Step 1: Create a pending Naira deposit record */
  async createBuyRequest(
    userId: string,
    asset: string,
    amount: number,
    walletAddress: string,
    network: string,
  ) {
    try {
      if (!userId || !asset || !amount || !walletAddress || !network) {
        throw new RpcException({
          statusCode: 400,
          message: 'Missing required parameters',
        });
      }

      // ✅ Fetch current Busha pair price for this asset
      const pair = await this.bushaAPIService.listAllActiveAssets(undefined, asset);

      if (!pair || !pair.length || !pair[0].buyPrice) {
        throw new RpcException({
          statusCode: 404,
          message: `Unable to retrieve exchange rate for ${asset}`,
        });
      }
      const feeData = await this.feesService.findByAsset(asset);
      const rate = Number(pair[0].buyPrice);
      const convertedAmount = Number((amount / rate).toFixed(2));
      const amountPlusFees = amount + feeData.fee

    const payload = {
    source_currency: "NGN",
    target_currency: "NGN",
    source_amount: amountPlusFees,
    pay_in: {
      type: "temporary_bank_account"
    }
  }
    const url = `${this.baseUrl}/v1/quotes`;

    const res = await firstValueFrom(
    this.http.post(url, payload, { headers: this.authHeaders() }),
  );
  const quoteId = res.data.data.id

    const url2 = `${this.baseUrl}/v1/transfers`;
 const payload2 = { quote_id: quoteId };
     const res2 = await firstValueFrom(
    this.http.post(url2, payload2, { headers: this.authHeaders() }),
  );
  const buyData = res2.data?.data;


      // ✅ Create pending transaction
      const tx = this.txRepo.create({
        user_id: userId,
        asset,
        network,
        amount: amountPlusFees,
        convertedAmount,
        exchangeRate: rate,
        quote_id: quoteId,
        transfer_id: buyData.id,
        metadata: buyData,
        address: walletAddress,
        status: CryptoTransactionStatus.PENDING,
        type: CryptoTransactionType.CASH_TO_CRYPTO,
      });

      await this.txRepo.save(tx);

      this.logger.log(`💰 Buy request created: ${tx.id} for ₦${amount} → ${convertedAmount} ${asset}`);

      return {
       
          ...buyData.pay_in,
          ...tx
      
      };
    } catch (error: any) {
      this.logger.error(`❌ createBuyRequest error: ${error.message}`);

      throw new RpcException({
        statusCode: error.statusCode || 500,
        message: error.message || 'Failed to create buy request',
        error: error.response?.data || null,
      });
    }
  }

  /** ✅ Step 2: Busha webhook confirmation (Naira received) */
  async processBushaNairaWebhook(payload: any) {
    try {
      const { event, data } = payload;
      if (event !== 'transfer.funds_received') return { ignored: true };

      const reference =  data.id;
      const tx = await this.txRepo.findOne({ where: { transfer_id: reference } });
      if (!tx) throw new RpcException({ message: 'Transaction not found' });

      tx.status = CryptoTransactionStatus.SUCCESSFUL;
      tx.confirmed_at = new Date();
      await this.txRepo.save(tx);

      this.logger.log(`✅ Naira confirmed for ${reference}. Sending crypto...`);
      await this.sendCryptoToUser(tx);

      return { success: true };
    } catch (err: any) {
      this.logger.error(`❌ Webhook processing error: ${err.message}`);
      throw new RpcException({ message: err.message });
    }
  }

  /** ✅ Step 3: Send crypto to user after confirmation */
  private async sendCryptoToUser(tx: CryptoTransaction) {
    try {
      const url = `${this.baseUrl}/v1/transfers`;
      const payload = {
        quote_id: await this.createQuote(tx.asset, tx.amount, tx.network),
        pay_out: {
          type: 'address',
          address: tx.address,
          network: tx.network,
        },
      };

      const res = await firstValueFrom(
        this.http.post(url, payload, { headers: this.authHeaders() }),
      );
      const data = res.data?.data;
      this.logger.log(`🚀 Crypto sent to ${tx.address}: ${data.status}`);

      tx.metadata = { ...tx.metadata, busha_send: data };
      await this.txRepo.save(tx);
    } catch (err: any) {
      this.logger.error(`❌ Failed to send crypto: ${err.message}`);
      throw new RpcException({ message: 'Crypto transfer failed' });
    }
  }

  /** ✅ Create quote (Naira → crypto) */
  private async createQuote(asset: string, nairaAmount: number, network: string): Promise<string> {
  const url = `${this.baseUrl}/v1/quotes`;
  const payload = {
    source_currency: 'NGN',
    target_currency: asset,
    source_amount: nairaAmount.toString(),
    pay_out: { type: 'address', network }, // dynamically use user's selected network
  };

  const res = await firstValueFrom(
    this.http.post(url, payload, { headers: this.authHeaders() }),
  );

  const quoteId = res.data?.data?.id;
  this.logger.log(`🧾 Created Busha quote (${network}) → ${quoteId}`);
  return quoteId;
}
}