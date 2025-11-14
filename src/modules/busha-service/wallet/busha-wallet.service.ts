import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { CryptoTransaction, CryptoTransactionStatus, CryptoTransactionType } from '@/entities/crypto-transaction.entity';
import { Repository } from 'typeorm';
import { BushaAPIService } from '../busha-api.service';
import { User } from '@/entities/user.entity';
import { BankDetail } from '@/entities/bank-detail.entity';

@Injectable()
export class BushaWalletService {
  private readonly logger = new Logger(BushaWalletService.name);
  private readonly baseUrl = 'https://api.busha.co'; // ✅ Busha base URL
  private readonly apiKey = process.env.BUSHA_SECRET_KEY;

  constructor(
    private readonly http: HttpService,
    @InjectRepository(CryptoTransaction)
    private readonly deposits: Repository<CryptoTransaction>,
     @InjectRepository(BankDetail)
    private readonly bankRepo: Repository<BankDetail>,
    private readonly bushaAPIService: BushaAPIService,
) {}

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * ✅ Step 1: Create a quote for a crypto deposit
   */
 async createQuote(asset: string, amount: string, network: string) {
  try {
    const url = `${this.baseUrl}/v1/quotes`;
    const payload = {
      source_currency: asset,
      target_currency: asset,
      source_amount: amount,
      pay_in: {
        type: 'address',
        network,
        address: { address: 'placeholder' }, // ✅ required field
      },
    };

    this.logger.log(`📤 Creating Busha quote: ${JSON.stringify(payload)}`);

    const res = await firstValueFrom(
      this.http.post(url, payload, { headers: this.authHeaders() }),
    );

    this.logger.log(`✅ Quote created successfully: ${JSON.stringify(res.data)}`);
    return res.data?.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message;
    const details = error.response?.data;
    this.logger.error(`❌ Quote creation failed: ${message}`, details);

    throw new RpcException({
      statusCode: error.response?.status || 500,
      message: `Busha quote error: ${message}`,
    });
  }
}

  /**
   * ✅ Step 2: Create transfer → get deposit address
   */
  async createDepositWallet(quoteId: string) {
    try {
      const url = `${this.baseUrl}/v1/transfers`;
      const payload = { quote_id: quoteId };

      this.logger.log(`📤 Creating transfer for quote ${quoteId}`);
      const res = await firstValueFrom(
        this.http.post(url, payload, { headers: this.authHeaders() }),
      );

      const data = res.data?.data;
      this.logger.log(`✅ Deposit wallet generated: ${data.pay_in.address}`);

      return {
        address: data.pay_in.address,
        network: data.pay_in.network,
        expiresAt: data.pay_in.expires_at,
        status: data.status,
        transferId: data.id,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      this.logger.error(`❌ Transfer creation failed: ${message}`);
      throw new RpcException({
        statusCode: error.response?.status || 500,
        message: `Busha transfer error: ${message}`,
      });
    }
  }

  /**
   * ✅ Combined Helper
   * Creates both Quote + Transfer and returns a wallet address
   */
 async generateDepositWallet(userId: string, asset: string, amount: string, network: string, bankId: string) {
  try {
    // ✅ Step 1: Create quote + transfer
    const quote = await this.createQuote(asset, amount, network);
    const transfer = await this.createDepositWallet(quote.id);

    // ✅ Step 2: Save deposit record

     const pair = await this.bushaAPIService.listAllActiveAssets(undefined, asset);

     
      const rate = pair[0].ngnBuyPrice; 
let bank_id
      if(bankId){
        bank_id = bankId
      }
      else{
        const bank = await this.bankRepo.findOne({
        where: { userId: userId }
      })
          bank_id  = bank.id;
      }

     const numericAmount = Number(amount);
    const numericRate = Number(rate);
    let convertedAmount = 0
   if (asset !== 'USDT' && asset !== 'USDC') {
  // 🧠 Asset is NOT a stablecoin → get its rate in USDT
  const usdRate = await this.bushaAPIService.getRateInUSDT(asset);

  // 💰 Convert from asset → USDT → NGN
  convertedAmount = numericAmount * (numericRate * usdRate.sellPrice);
  this.logger.log(`💱 Conversion via USD rate: ${asset} → USDT → NGN = ${convertedAmount}`);
} else {
  // 🧾 Asset is already a stablecoin (USDT or USDC)
  convertedAmount = numericAmount * numericRate;
  this.logger.log(`💵 Direct conversion: ${asset} → NGN = ${convertedAmount}`);
}
    
    if (isNaN(numericAmount) || isNaN(numericRate)) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid amount or exchange rate provided',
      });
    }

    const deposit = this.deposits.create({
      user_id: userId,
      asset,
      network,
      exchangeRate: numericRate,
      amount: numericAmount,
      convertedAmount: convertedAmount,
      quote_id: quote.id,
      transfer_id: transfer.transferId,
      bank_id: bank_id,
      address: transfer.address,
      expires_at: transfer.expiresAt,
      status: CryptoTransactionStatus.PENDING,
      type: CryptoTransactionType.CRYPTO_TO_CASH,
      metadata: { busha: { quote, transfer } },
    });

    await this.deposits.save(deposit);

    this.logger.log(`💾 Deposit record created for ${asset} → ${deposit.id}`);

    // ✅ Step 3: Return data to client
    return {
      id: deposit.id,
      asset,
      network,
      amount,
      exchangeRate: numericRate,
      convertedAmount,
      address: deposit.address,
      expiresAt: deposit.expires_at,
      status: deposit.status,
    };
  } catch (error) {
    this.logger.error(`❌ Failed to generate deposit wallet`, error);
    throw error;
  }
}
}