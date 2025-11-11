import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class SellCryptoDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  asset: string;

  @ApiProperty({ example: 'TRC20' })
  @IsString()
  network: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  amount: number;

   @ApiProperty({ example: 1450 })
  @IsNumber()
  exchangeRate: number;

  @ApiProperty({ example: 'wallet-id-or-address' })
  @IsString()
  address: string;
}