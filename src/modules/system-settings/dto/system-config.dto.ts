import { ApiProperty } from '@nestjs/swagger';

export class SystemConfigDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  setting: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  ngnValue?: number;

  @ApiProperty()
  usdValue?: number;
}