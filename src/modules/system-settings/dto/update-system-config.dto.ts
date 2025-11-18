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
  ngnValue?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  usdValue?: string;
}

export class UpdateSystemConfigDto {
  @ApiProperty({ type: [UpdateSingleConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSingleConfigDto)
  configs: UpdateSingleConfigDto[];
}