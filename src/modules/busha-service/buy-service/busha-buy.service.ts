import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { CryptoTransaction, CryptoTransactionStatus, CryptoTransactionType } from '@/entities/crypto-transaction.entity';
import { RpcException } from '@nestjs/microservices';
import { BushaAPIService } from '../busha-api.service';
import { FeesService } from '@/modules/fees/fees.service';
import { SystemConfigService } from '@/modules/system-settings/system-config.service';
import { ConfigStatus } from '@/entities/system-config.entity';
import { v4 as uuidv4 } from 'uuid';

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
     private readonly systemConfigService: SystemConfigService
    
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

      if (!pair || !pair.length || !pair[0].ngnBuyPrice) {
        throw new RpcException({
          statusCode: 404,
          message: `Unable to retrieve exchange rate for ${asset}`,
        });
      }

      const feeSetting = await this.systemConfigService.findBySetting('MARGIN');
      const isFeeEnabled = feeSetting?.status === ConfigStatus.ENABLED;
      const feeValue = isFeeEnabled ? Number(feeSetting?.usdValue || 0) : 0;
      const rate = Number(pair[0].ngnBuyPrice);
      const convertedAmount = Number((amount / rate).toFixed(2));
      const amountPlusFees = amount + (feeValue * rate)

    const payload = {
    source_currency: "NGN",
    target_currency: "NGN",
    source_amount: amountPlusFees,
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
        expires_at: buyData.pay_in.expires_at,
      });

     const transfer =  await this.txRepo.save(tx);

     this.trackBushaTransferUntilFinal(transfer.transfer_id)

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
async confirmBushaNaira(transferId: string) {
  try {
    if (!transferId) {
      throw new RpcException({ message: 'Missing transfer ID' });
    }

    // ✅ 1. Fetch LIVE transfer status from Busha
    const url = `${this.baseUrl}/v1/transfers/${transferId}`;

    const res = await firstValueFrom(
      this.http.get(url, { headers: this.authHeaders() }),
    );

    const bushaTransfer = res.data?.data;
    const status = bushaTransfer?.status?.toLowerCase();

    // ✅ 2. Locate your local transaction
    const tx = await this.txRepo.findOne({
      where: { transfer_id: transferId },
    });

    if (!tx) {
      throw new RpcException({ message: 'Transaction not found' });
    }

    // ✅ 3. Status Handling
    if (status === 'pending') {
      tx.status = CryptoTransactionStatus.PENDING;
      await this.txRepo.save(tx);

      return { success: true, message: 'Still awaiting customer transfer' };
    }

    if (status === 'processing') {
      tx.status = CryptoTransactionStatus.PROCESSING;
      await this.txRepo.save(tx);

      return { success: true, message: 'Funds received, processing' };
    }

    if (status === 'cancelled') {
      tx.status = CryptoTransactionStatus.CANCELLED;
      await this.txRepo.save(tx);

      return { success: false, message: 'Transfer was cancelled' };
    }

    if (status === 'funds_received') {
      // ✅ Prevent double-processing
      if (tx.status === CryptoTransactionStatus.SUCCESSFUL) {
        return { success: true, message: 'Already confirmed before' };
      }

      tx.status = CryptoTransactionStatus.SUCCESSFUL;
      tx.confirmed_at = new Date();
      tx.metadata = {
        ...tx.metadata,
        busha_status_check: bushaTransfer,
      };

      await this.txRepo.save(tx);

      this.logger.log(`✅ Naira confirmed for ${transferId}. Sending crypto...`);

      // ✅ Trigger crypto send
      await this.sendCryptoToUser(tx);

      return { success: true, message: 'Crypto successfully sent' };
    }

    // ✅ Unknown/unsupported status
    this.logger.warn(`⚠️ Unhandled Busha status: ${status}`);
    return { ignored: true, status };

  } catch (err: any) {
    this.logger.error(`❌ Busha confirmation error: ${err.message}`);

    throw new RpcException({
      message: err.message || 'Failed to confirm Busha transfer',
    });
  }
}

async trackBushaTransferUntilFinal(transferId: string) {
  const INTERVAL = 15000; // check every 15 seconds
  const MAX_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  const startTime = Date.now();

  const timer = setInterval(async () => {
    try {
      const elapsed = Date.now() - startTime;

      // ✅ Stop after 30 mins and auto-cancel
      if (elapsed >= MAX_DURATION_MS) {
        clearInterval(timer);

        this.logger.warn(`⏳ Transfer ${transferId} timed out after 30 minutes`);

        // Auto-cancel in your DB
        const tx = await this.txRepo.findOne({
          where: { transfer_id: transferId },
        });

        if (tx && tx.status === CryptoTransactionStatus.PENDING) {
          tx.status = CryptoTransactionStatus.CANCELLED;
          tx.metadata = {
            ...tx.metadata,
            auto_cancelled: true,
            cancelled_at: new Date().toISOString(),
          };
          await this.txRepo.save(tx);
        }

        return;
      }

      this.logger.log(`🔍 Checking Busha status: ${transferId}`);

      const result = await this.confirmBushaNaira(transferId);

      // ✅ Stop tracking once final state is reached
      if (
        result?.message?.includes('successfully') ||
        result?.message?.includes('cancelled') ||
        result?.message?.includes('Already confirmed')
      ) {
        clearInterval(timer);
        this.logger.log(`✅ Stopped tracking ${transferId}`);
      }
    } catch (err: any) {
      this.logger.error(
        `❌ Tracking failed for ${transferId}: ${err.message}`,
      );
    }
  }, INTERVAL);
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

    // ✅ Update transaction with full Busha response
    tx.transfer_id = data.id;
    tx.status =
      data.status === 'completed' || data.status === 'delivered'
        ? CryptoTransactionStatus.SUCCESSFUL
        : CryptoTransactionStatus.PROCESSING;

    tx.metadata = {
      ...tx.metadata,
      busha_send: {
        id: data.id,
        status: data.status,
        tx_hash: data.blockchain_tx_hash || null,
        network: data.network,
        raw: data,
      },
    };

    tx.exchange_confirmed_at =
      tx.status === CryptoTransactionStatus.SUCCESSFUL ? new Date() : null;

    await this.txRepo.save(tx);

  } catch (err: any) {
    this.logger.error(`❌ Failed to send crypto: ${err.message}`);

    // ✅ Mark internally as failed
    tx.status = CryptoTransactionStatus.FAILED;
    tx.metadata = {
      ...tx.metadata,
      busha_error: err?.response?.data || err.message,
    };

    await this.txRepo.save(tx);

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