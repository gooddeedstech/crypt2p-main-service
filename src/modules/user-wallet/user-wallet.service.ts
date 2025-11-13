import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWallet } from '@/entities/user-wallet.entity';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class UserWalletService {
  private readonly logger = new Logger(UserWalletService.name);

  constructor(
    @InjectRepository(UserWallet)
    private readonly walletRepo: Repository<UserWallet>,
  ) {}

  /* --------------------------------------------------
   ✅ CREATE WALLET
  ---------------------------------------------------*/
  async createWallet(
    userId: string,
    asset: string,
    network: string,
    address: string,
    isDefault = false,
  ) {
    try {
      // Prevent duplicate wallet for same asset + network
      const existing = await this.walletRepo.findOne({
        where: { userId, asset, network, address },
      });

      if (existing) {
        throw new RpcException({
          statusCode: 400,
          message: `A wallet for ${asset} (${network}) already exists.`,
        });
      }

      // If this wallet is default, reset previous default
      if (isDefault) {
        await this.walletRepo.update({ userId }, { isDefault: false });
      }

      const wallet = this.walletRepo.create({
        userId,
        asset,
        network,
        address,
        isDefault,
      });

      await this.walletRepo.save(wallet);

      this.logger.log(`💳 Created wallet ${asset} (${network}) for user ${userId}`);
      return { message: 'Wallet created successfully', data: wallet };
    } catch (error: any) {
      this.logger.error(`❌ createWallet error: ${error.message}`);
      throw new RpcException({
        statusCode: error.statusCode || 500,
        message: error.message || 'Failed to create wallet',
      });
    }
  }

  /* --------------------------------------------------
   ✅ GET ALL WALLETS FOR USER
  ---------------------------------------------------*/
  async findAllByUser(userId: string) {
    try {
      const wallets = await this.walletRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      return { message: 'User wallets retrieved', count: wallets.length, data: wallets };
    } catch (error: any) {
      this.logger.error(`❌ findAllByUser error: ${error.message}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to fetch user wallets',
      });
    }
  }

  /* --------------------------------------------------
   ✅ GET WALLET BY ID
  ---------------------------------------------------*/
  async findById( id: string) {
    try {
      const wallet = await this.walletRepo.findOne({ where: { id } });

      if (!wallet) {
        throw new RpcException({
          statusCode: 404,
          message: 'Wallet not found or does not belong to this user',
        });
      }

      return { message: 'Wallet retrieved successfully', data: wallet };
    } catch (error: any) {
      this.logger.error(`❌ findById error: ${error.message}`);
      throw new RpcException({
        statusCode: error.statusCode || 500,
        message: error.message || 'Failed to fetch wallet',
      });
    }
  }

  /* --------------------------------------------------
   ✅ DELETE WALLET
  ---------------------------------------------------*/
  async deleteWallet( id: string) {
    try {
      const record = await this.walletRepo.findOne({ where: { id } });
      if (!record) {
        throw new RpcException({
          statusCode: 404,
          message: 'Wallet not found or does not belong to user',
        });
      }

      await this.walletRepo.remove(record);

      this.logger.log(`🗑️ Deleted wallet ${id} `);
      return { message: 'Wallet deleted successfully' };
    } catch (error: any) {
      this.logger.error(`❌ deleteWallet error: ${error.message}`);
      throw new RpcException({
        statusCode: error.statusCode || 500,
        message: error.message || 'Failed to delete wallet',
      });
    }
  }
}