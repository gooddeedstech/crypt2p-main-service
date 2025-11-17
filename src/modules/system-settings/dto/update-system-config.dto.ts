import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsUUID, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSingleConfigDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  ngnValue?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  usdValue?: number;
}

export class UpdateSystemConfigDto {
  @ApiProperty({ type: [UpdateSingleConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSingleConfigDto)
  configs: UpdateSingleConfigDto[];
}