import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankDetail } from '@/entities/bank-detail.entity';
import { RpcException } from '@nestjs/microservices';
import { User } from '@/entities/user.entity';

@Injectable()
export class BankDetailService {
  private readonly logger = new Logger(BankDetailService.name);

  constructor(
    @InjectRepository(BankDetail)
    private readonly bankRepo: Repository<BankDetail>,
     @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ✅ CREATE BANK DETAIL
  async createBankDetail(
    userId: string,
    bankName: string,
    bankCode: string,
    accountNumber: string,
    accountName: string,
    isPrimary = false,
  ) {
    try {
      const existing = await this.bankRepo.findOne({ where: { userId, accountNumber } });
      if (existing) {
        throw new RpcException({
          statusCode: 400,
          message: 'Bank account already exists for this user',
        });
      }

      if (isPrimary) await this.bankRepo.update({ userId }, { isPrimary: false });

      const user = await this.userRepo.findOne({ where: { id: userId } });

const detail = this.bankRepo.create({
  userId,
  user, // full object
  bankName,
  bankCode,
  accountNumber,
  accountName,
  isPrimary,
});

      await this.bankRepo.save(detail);
      this.logger.log(`🏦 Bank added for user ${userId}: ${bankName} - ${accountNumber}`);
      return {
  statusCode: 200,
  message: 'Bank detail added successfully',
  data: detail,
};
    } catch (error: any) {
      this.logger.error(`❌ createBankDetail error: ${error.message}`);
      throw new RpcException({
        statusCode: error.statusCode || 500,
        message: error.message || 'Failed to create bank detail',
      });
    }
  }

  // ✅ FIND ALL BANK DETAILS FOR USER
  async findAllByUser(userId: string) {
    try {
      const banks = await this.bankRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      return { message: 'User bank details retrieved', count: banks.length, data: banks };
    } catch (error: any) {
      this.logger.error(`❌ findAllByUser error: ${error.message}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to fetch user bank details',
      });
    }
  }

  // ✅ FIND SINGLE BANK DETAIL BY ID
  async findById(id: string) {
    try {
      const bank = await this.bankRepo.findOne({ where: { id } });

      if (!bank) {
        throw new RpcException({
          statusCode: 404,
          message: 'Bank detail not found or does not belong to this user',
        });
      }

      return { message: 'Bank detail retrieved successfully', data: bank };
    } catch (error: any) {
      this.logger.error(`❌ findById error: ${error.message}`);
      throw new RpcException({
        statusCode: error.statusCode || 500,
        message: error.message || 'Failed to fetch bank detail',
      });
    }
  }

  // ✅ DELETE BANK DETAIL
  async deleteBankDetail(id: string) {
    try {
      const record = await this.bankRepo.findOne({ where: { id } });
      if (!record) {
        throw new RpcException({
          statusCode: 404,
          message: 'Bank detail not found or does not belong to user',
        });
      }

      await this.bankRepo.remove(record);
      this.logger.log(`🗑️ Deleted bank detail ${id}`);
      return { message: 'Bank detail deleted successfully' };
    } catch (error: any) {
      this.logger.error(`❌ deleteBankDetail error: ${error.message}`);
      throw new RpcException({
        statusCode: error.statusCode || 500,
        message: error.message || 'Failed to delete bank detail',
      });
    }
  }
}