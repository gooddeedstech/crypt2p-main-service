import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class RubiesService {
  private readonly logger = new Logger(RubiesService.name);
  private readonly baseUrl = 'https://api-sme-dev.rubies.ng/dev/baas-transaction';
  private readonly apiKey = process.env.RUBIES_SECRET_KEY!; // put your SK- key here

  constructor(private readonly http: HttpService) {}

  /** ✅ Helper: Common headers */
  private get headers() {
    return {
      'Content-Type': 'application/json',
      Accept: '*/*',
      Authorization: this.apiKey, // exactly as required by docs
    };
  }

  /** 🏦 Get all Banks */
  async getBanks() {
    const url = `${this.baseUrl}/bank-list`;
    const payload = { readAll: 'YES' };

    try {
      this.logger.log(`📡 Fetching Rubies banks from ${url}`);
      const res = await firstValueFrom(this.http.post(url, payload, { headers: this.headers }));
      this.logger.log(`✅ Banks retrieved successfully`);
      return res.data;
    } catch (error: any) {
      this.logger.error(`❌ Rubies getBanks error: ${error.message}`);
      this.logger.error(`📦 Details: ${JSON.stringify(error.response?.data || {}, null, 2)}`);
      throw new RpcException({
        message: 'Failed to fetch Rubies bank list',
        statusCode: error.response?.status || 500,
        details: error.response?.data,
      });
    }
  }

  /** 🔍 Name Enquiry */
  async nameEnquiry(accountBankCode: string, accountNumber: string) {
    const url = `${this.baseUrl}/name-enquiry`;
    const payload = { accountBankCode, accountNumber };

    try {
      this.logger.log(`🔍 Performing Rubies name enquiry for ${accountNumber}`);
      const res = await firstValueFrom(this.http.post(url, payload, { headers: this.headers }));
      return res.data;
    } catch (error: any) {
      this.logger.error(`❌ Rubies nameEnquiry error: ${error.message}`);
      throw new RpcException({
        message: 'Failed to perform name enquiry',
        statusCode: error.response?.status || 500,
        details: error.response?.data,
      });
    }
  }

  /** 💸 Fund Transfer */
  async fundTransfer(dto: any) {
    const url = `${this.baseUrl}/fund-transfer`;

    try {
      this.logger.log(`💸 Initiating Rubies fund transfer: ${JSON.stringify(dto)}`);
      const res = await firstValueFrom(this.http.post(url, dto, { headers: this.headers }));
      return res.data;
    } catch (error: any) {
      this.logger.error(`❌ Rubies fundTransfer error: ${error.message}`);
      throw new RpcException({
        message: 'Failed to initiate fund transfer',
        statusCode: error.response?.status || 500,
        details: error.response?.data,
      });
    }
  }

  /** 🔁 Confirm Transfer (TSQ) */
  async confirmTransfer(reference: string) {
    const url = `${this.baseUrl}/tsq`;
    const payload = { reference };

    try {
      this.logger.log(`🔁 Confirming Rubies transfer → ${reference}`);
      const res = await firstValueFrom(this.http.post(url, payload, { headers: this.headers }));
      return res.data;
    } catch (error: any) {
      this.logger.error(`❌ Rubies confirmTransfer error: ${error.message}`);
      throw new RpcException({
        message: 'Failed to confirm transfer',
        statusCode: error.response?.status || 500,
        details: error.response?.data,
      });
    }
  }
} 