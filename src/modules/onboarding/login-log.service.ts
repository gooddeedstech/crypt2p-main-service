import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginLog, LoginMethod, LoginStatus } from '@/entities/login-log.entity';

@Injectable()
export class LoginLogService {
  private readonly logger = new Logger(LoginLogService.name);

  constructor(
    @InjectRepository(LoginLog)
    private readonly logRepo: Repository<LoginLog>,
  ) {}

  /** ✅ Record a user login event */
  async recordLogin(
    user_id: string,
    method: LoginMethod,
    status: LoginStatus,
    failure_reason?: string,
  ) {
    try {
   
      const log = this.logRepo.create({
        user_id,
        method,
        status,
        failure_reason,
      });

      await this.logRepo.save(log);

      this.logger.log(`📜 LoginLog → ${user_id} (${method}) → ${status}`);
      return log;
    } catch (err) {
      this.logger.error(`❌ Failed to record login: ${err.message}`);
      throw err;
    }
  }

  /** 🕐 Find recent login logs (limit 20) */
  async findByUserRecentLog(userId: string) {
    try {
      return await this.logRepo.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
        take: 20,
      });
    } catch (err) {
      this.logger.error(`❌ Failed to fetch recent logs for user ${userId}: ${err.message}`);
      throw err;
    }
  }

  /** 📜 Find all login logs for a user */
  async findByUserAllLog(userId: string) {
    try {
      return await this.logRepo.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
      });
    } catch (err) {
      this.logger.error(`❌ Failed to fetch all logs for user ${userId}: ${err.message}`);
      throw err;
    }
  }
}