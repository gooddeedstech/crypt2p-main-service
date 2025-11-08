import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, IsEmail } from 'class-validator';

export class VerifyBvnDto {

   @ApiProperty({
    example: 'samuel@example.com',
    description: 'User email associated with the Paystack customer record',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  @ApiProperty({
    example: 'NG',
    description: 'Country code (always NG for Nigeria)',
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    example: 'bank_account',
    description: 'Type of verification (bank_account for BVN verification)',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    example: '0123456789',
    description: 'User’s bank account number (10 digits)',
  })
  @IsString()
  @Length(10, 10, { message: 'Account number must be 10 digits' })
  account_number: string;

  @ApiProperty({
    example: '200123456677',
    description: 'User’s BVN number (11 digits)',
  })
  @IsString()
  @Length(11, 11, { message: 'BVN must be 11 digits' })
  bvn: string;

  @ApiProperty({
    example: '007',
    description: 'Bank code for the selected bank (e.g. Access = 044, Polaris = 076)',
  })
  @IsString()
  @IsNotEmpty()
  bank_code: string;

  @ApiProperty({
    example: 'Asta',
    description: 'First name of the user (used for cross-verification)',
  })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({
    example: 'Lavista',
    description: 'Last name of the user (used for cross-verification)',
  })
  @IsString()
  @IsNotEmpty()
  last_name: string;
}