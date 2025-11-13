import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateLedgerEntryDto, DebitLedgerEntryDto } from './dto/create-ledger.dto';
import { LedgerService } from './transaction-ledger.service';
import { LedgerQueryDto } from './dto/query-ledger.dto';


@Controller()
export class LedgerMessageController {
  constructor(private readonly ledgerService: LedgerService) {}

  @MessagePattern({ cmd: 'ledger.credit' })
  credit(@Payload() dto: CreateLedgerEntryDto) {
    return this.ledgerService.credit(dto);
  }

  @MessagePattern({ cmd: 'ledger.debit' })
  debit(@Payload() dto: DebitLedgerEntryDto) {
    return this.ledgerService.debit(dto);
  }

  @MessagePattern({ cmd: 'ledger.list' })
  list(@Payload() query: LedgerQueryDto) {
    return this.ledgerService.listLedger(query);
  }
}