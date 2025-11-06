import { IsEmail, IsString } from 'class-validator';
export class VerifyBvnDto {
  @IsEmail()
  email: string;

  @IsString()
  bvn: string;

  @IsString()
  accountNumber: string;

  @IsString()
  bankCode: string;
}