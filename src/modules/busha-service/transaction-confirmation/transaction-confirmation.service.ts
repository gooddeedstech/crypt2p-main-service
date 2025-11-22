import { CryptoTransaction, CryptoTransactionStatus, CryptoTransactionType, ExchangeTransactionStatus } from "@/entities/crypto-transaction.entity";
import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BushaAPIService } from "../busha-api.service";
import { SystemConfigService } from "@/modules/system-settings/system-config.service";
import { firstValueFrom } from "rxjs";
import { RubiesTransferDto } from "@/modules/rubies/dto/rubies-transfer.dto";
import { User } from "@/entities/user.entity";
import { RubiesService } from "@/modules/rubies/rubies.service";
import { LedgerService } from "@/modules/transaction-ledger/transaction-ledger.service";

@Injectable()
export class BushaTransactionService {
  private readonly logger = new Logger(BushaTransactionService.name);
  private readonly baseUrl = 'https://api.busha.co';
  private readonly apiKey = process.env.BUSHA_SECRET_KEY;

  constructor(
    private readonly http: HttpService,
    @InjectRepository(CryptoTransaction)
    private readonly txRepo: Repository<CryptoTransaction>,
     @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly rubiesService: RubiesService,
     private readonly ledgerService: LedgerService,
     private readonly bushaAPIService: BushaAPIService,
     private readonly systemConfigService: SystemConfigService
    
  ) {}

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

async confirmBushaTransaction(transferId: string) {
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

    // ✅ 3. Status handling
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

      // ✅ Decide direction by transaction type
      if (tx.type === CryptoTransactionType.CASH_TO_CRYPTO) {
        this.logger.log(`🚀 CASH_TO_CRYPTO → Sending crypto for ${transferId}`);
        await this.sendCryptoToUser(tx);
      } 
      else if (tx.type === CryptoTransactionType.CRYPTO_TO_CASH) {
        this.logger.log(`💸 CRYPTO_TO_CASH → Sending Naira to user for ${transferId}`);
        await this.sendNairaToUser(tx);
      }

      return { success: true, message: 'Transfer processed successfully' };
    }

    // ✅ Unknown status
    this.logger.warn(`⚠️ Unhandled Busha status: ${status}`);
    return { ignored: true, status };

  } catch (err: any) {
    this.logger.error(`❌ Busha confirmation error: ${err.message}`);

    throw new RpcException({
      message: err.message || 'Failed to confirm Busha transfer',
    });
  }
}

private async sendNairaToUser(tx: CryptoTransaction) {
  try {
    // ✅ Only proceed if crypto was successfully received
    if (tx.status !== CryptoTransactionStatus.SUCCESSFUL) {
      return;
    }


    // ✅ Load deposit linked to this transaction
    const deposit = await this.txRepo.findOne({
      where: { transfer_id: tx.transfer_id },
      relations: ['bank'],
    });

    if (!deposit) {
      throw new RpcException({ message: 'Deposit record not found' });
    }

    // ✅ Load user
    const user = await this.usersRepo.findOne({
      where: { id: deposit.user_id },
    });

    if (!user) {
      throw new RpcException({ message: 'User not found' });
    }

    // ✅ Prepare Rubies fund transfer payload
    const transferDto: RubiesTransferDto = {
      amount: Number(deposit.convertedAmount),
      bankCode: deposit.bank.bankCode,
      bankName: deposit.bank.bankName,
      creditAccountName: `${user.firstName} ${user.lastName}`,
      creditAccountNumber: deposit.bank.accountNumber,

      // Business account
      debitAccountName: 'Gooddeeds Technology Enterprise LTD',
      debitAccountNumber: '1000001179',

      narration: `Payout From Gooddeeds Tech LTD`,
      reference: `REF-${Date.now()}-${deposit.id}`,
      sessionId: Date.now().toString(),
    };

    // ✅ Reward the user
    user.rewardPoint = (Number(user.rewardPoint) + 1).toString();
    await this.usersRepo.save(user);

    // ✅ Send funds via Rubies
    const fundTransfer = await this.rubiesService.fundTransfer(transferDto);

    // ✅ Save Rubies response
    deposit.exchange_data = fundTransfer;

    if (fundTransfer?.responseCode === '00') {
      // ✅ Debit ledger
      const desc = `Payout for ${deposit.amount} ${deposit.asset} @ ${deposit.exchangeRate}`;

      const debit = {
        userId: deposit.user_id,
        description: desc,
        amount: Number(deposit.convertedAmount),
      };

      await this.ledgerService.debit(debit);

      deposit.exchange_status = ExchangeTransactionStatus.SUCCESSFUL;
      deposit.exchange_confirmed_at = new Date();

      this.logger.log(`✅ Rubies payout completed → ${deposit.id}`);
    } else {
      deposit.exchange_status = ExchangeTransactionStatus.FAILED;
      deposit.exchange_confirmed_at = new Date();

      this.logger.warn(`❌ Rubies payout failed → ${deposit.id}`);
    }

    // ✅ Save updates
    await this.txRepo.save(deposit);

    return fundTransfer;
  } catch (error: any) {
    this.logger.error(`❌ sendNairaToUser failed: ${error.message}`);

    throw new RpcException({
      message: 'Failed to send Naira to user',
    });
  }
}

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