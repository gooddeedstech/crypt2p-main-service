import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateFeeDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  asset: string;

  @ApiProperty({ example: 0.5 })
  @IsNumber()
  fee: number;
}

export class UpdateFeeDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  asset: string;

  @ApiProperty({ example: 0.75 })
  @IsNumber()
  fee: number;
}