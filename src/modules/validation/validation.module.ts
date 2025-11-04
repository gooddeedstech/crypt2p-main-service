import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ValidationService } from './validation.service';


import { ValidationLog } from '@/entities/validation-log.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { FraudService } from '../fraud/fraud.service';
import { AuditLog } from '@/entities/audit-log.entity';
import { ValidationMessageController } from './validation.message.controller';



@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      ValidationLog,
      AuditLog
    ]),
  ],

  controllers: [
    ValidationMessageController, 
  ],

  providers: [
    ValidationService,
    AuditLogService,
    FraudService,
  ],

  exports: [
    ValidationService, // ✅ used by other modules if needed
  ],
})
export class ValidationModule {}