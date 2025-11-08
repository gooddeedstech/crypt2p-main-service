import { ApiProperty } from '@nestjs/swagger';

export class AssetNetworkDto {
  @ApiProperty({ example: 'USDT-BEP20 (BSC)' })
  name: string;

  @ApiProperty({ example: 'BEP20' })
  value: string;
}

export class AssetListDto {
  @ApiProperty({ example: 'USDT' })
  code: string;

  @ApiProperty({ example: 'Tether' })
  description: string;

  @ApiProperty({ type: [AssetNetworkDto] })
  networks: AssetNetworkDto[];
}