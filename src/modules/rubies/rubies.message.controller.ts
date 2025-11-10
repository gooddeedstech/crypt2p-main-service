import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RubiesService } from './rubies.service';
import { RubiesBankMapperService } from './ rubies-bank-mapper.service';

@Controller()
export class RubiesMessageController {
  private readonly logger = new Logger(RubiesMessageController.name);

  constructor(private readonly rubiesService: RubiesService,
    private readonly mapper: RubiesBankMapperService
  ) {}

  @MessagePattern({ cmd: 'rubies.bank.list' })
  async handleGetBanks() {
    return this.rubiesService.getBanks();
  }

  @MessagePattern({ cmd: 'rubies.name.enquiry' })
  async handleNameEnquiry(@Payload() payload: { accountBankCode: string; accountNumber: string }) {
    return this.rubiesService.nameEnquiry(payload.accountBankCode, payload.accountNumber);
  }

  @MessagePattern({ cmd: 'rubies.fund.transfer' })
  async handleFundTransfer(@Payload() payload: any) {
    return this.rubiesService.fundTransfer(payload);
  }

  @MessagePattern({ cmd: 'rubies.transfer.confirm' })
  async handleConfirmTransfer(@Payload() payload: { reference: string }) {
    return this.rubiesService.confirmTransfer(payload.reference);
  }

//   @MessagePattern({ cmd: 'rubies.webhook' })
//   async handleWebhook(@Payload() payload: any) {
//     return this.rubiesService.handleWebhook(payload);
//   }


@MessagePattern({ cmd: 'rubies.bank.map' })
  async handleMapBank(@Payload() payload: { paystackCode: string }) {
    this.logger.log(`🔁 Mapping Paystack → Rubies code for: ${payload.paystackCode}`);
    const rubiesCode = await this.mapper.getRubiesBankCode(payload.paystackCode);
    return { paystackCode: payload.paystackCode, rubiesCode };
  }

  @MessagePattern({ cmd: 'rubies.bank.mappings' })
  async handleAllMappings() {
    this.logger.log('📋 Fetching all Paystack → Rubies mappings');
    return this.mapper.getAllMappedBanks();
  }
}