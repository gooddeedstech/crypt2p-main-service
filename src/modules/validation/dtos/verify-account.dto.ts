import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyAccountDto {
  @ApiProperty({ example: '057' })
  @IsString()
  bankCode: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  @Length(10, 10, { message: 'Account number must be 10 digits' })
  accountNumber: string;
}