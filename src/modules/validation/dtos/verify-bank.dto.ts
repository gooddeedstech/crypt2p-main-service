import { ApiProperty } from '@nestjs/swagger';

export class VerifyBankDto {
  @ApiProperty({ example: 'nigeria', required: false })
  country?: string = 'nigeria';
}