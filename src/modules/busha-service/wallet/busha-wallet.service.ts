import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { CryptoDeposit, DepositStatus, DepositType } from '@/entities/crypto-deposit.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BushaWalletService {
  private readonly logger = new Logger(BushaWalletService.name);
  private readonly baseUrl = 'https://api.busha.co'; // ✅ Busha base URL
  private readonly apiKey = process.env.BUSHA_SECRET_KEY;

  constructor(
    private readonly http: HttpService,
    @InjectRepository(CryptoDeposit)
    private readonly deposits: Repository<CryptoDeposit>,
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
 async generateDepositWallet(userId: string, asset: string, amount: string, network: string) {
  try {
    // ✅ Step 1: Create quote + transfer
    const quote = await this.createQuote(asset, amount, network);
    return quote
    //const transfer = await this.createDepositWallet(quote.id);

    // // ✅ Step 2: Save deposit record
    // const deposit = this.deposits.create({
    //   user_id: userId,
    //   asset,
    //   network,
    //   amount: Number(amount),
    //   quote_id: quote.id,
    //   transfer_id: transfer.transferId,
    //   address: transfer.address,
    //   expires_at: transfer.expiresAt,
    //   status: DepositStatus.PENDING,
    //   type: DepositType.CRYPTO_TO_CASH,
    //   metadata: { busha: { quote, transfer } },
    // });

    // await this.deposits.save(deposit);

    // this.logger.log(`💾 Deposit record created for ${asset} → ${deposit.id}`);

    // // ✅ Step 3: Return data to client
    // return {
    //   id: deposit.id,
    //   asset,
    //   network,
    //   amount,
    //   address: deposit.address,
    //   expiresAt: deposit.expires_at,
    //   status: deposit.status,
    // };
  } catch (error) {
    this.logger.error(`❌ Failed to generate deposit wallet`, error);
    throw error;
  }
}
}