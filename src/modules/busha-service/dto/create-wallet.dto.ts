import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  asset: string;

  @ApiProperty({ example: 'TRC20' })
  @IsString()
  network: string;

  @ApiProperty({ example: 'TY4D1nfpA6F3q8zW7fUedVHVWv...' })
  @IsString()
  address: string;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}