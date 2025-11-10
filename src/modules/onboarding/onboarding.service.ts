import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';

import { User } from '@/entities/user.entity';
import { PasswordReset } from '@/entities/password-reset.entity';
import { EmailVerification } from '@/entities/email-verification.entity';
import { EmailService } from '../notification/email.service';
import { PaystackService } from '../paystack/paystack.service';
import {
  ChangePasswordDto,
  ConfirmResetDto,
  LoginDto,
  LoginPinDto,
  RegisterDto,
  StartResetDto,
} from './dto/dtos';
import { OtpUtil } from '@/common/otp.util';
import { ChangePinDto, UpdateProfileDto } from './dto/user-update.dto';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(PasswordReset)
    private readonly resets: Repository<PasswordReset>,
    @InjectRepository(EmailVerification)
    private readonly verifications: Repository<EmailVerification>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly paystack: PaystackService,
  ) {}

  private async hash(value: string): Promise<string> {
    return bcrypt.hash(value, 12);
  }

  private async compare(value: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(value, hashed);
  }

  private issueTokens(user: User) {
    const payload = { id: user.id, email: user.email };
    return {
      token: this.jwt.sign(payload, {
        expiresIn: this.config.get('JWT_EXPIRES') || '1d',
      }),
    };
  }

  /* --------------------------------------------------
   ✅ REGISTER USER
  ---------------------------------------------------*/
  async register(dto: RegisterDto) {
    try {
      const emailExists = await this.users.findOne({
        where: { email: dto.email },
      });

      const verified = await this.verifications.findOne({
        where: { email: dto.email, used: true },
        order: { createdAt: 'DESC' },
      });

      if (!verified) {
        throw new RpcException({
          statusCode: 403,
          message: 'Please verify your email first',
        });
      }

      if (emailExists) {
        throw new RpcException({
          statusCode: 400,
          message: 'Email already exists',
        });
      }

      const phoneExists = await this.users.findOne({
        where: { phoneNumber: dto.phoneNumber },
      });

      if (phoneExists) {
        throw new RpcException({
          statusCode: 400,
          message: 'Phone number already exists',
        });
      }

      const customer = await this.paystack.createCustomer(
        dto.email,
        dto.phoneNumber,
        dto.firstName,
        dto.lastName,
      );

      const user = this.users.create({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        passwordHash: await this.hash(dto.password),
        country: dto.country,
        dob: dto.dob ? new Date(dto.dob) : null,
        gender: dto.gender ?? null,
        paystackCustomerCode: customer.customer_code,
      });

      await this.users.save(user);

      verified.used = true;
      await this.verifications.save(verified);

      return {
        message: 'Account created successfully',
        userId: user.id,
        paystackCustomerCode: user.paystackCustomerCode,
      };
    } catch (error) {
      this.logger.error('Register error:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Registration failed. Please try again.',
      });
    }
  }

  /* --------------------------------------------------
   ✅ LOGIN WITH EMAIL + PASSWORD
  ---------------------------------------------------*/
  async loginPassword(dto: LoginDto) {
    try {
      const user = await this.users.findOne({
        where: { email: dto.email, deletedAt: IsNull() },
      });

      if (!user) {
        throw new RpcException({
          statusCode: 401,
          message: 'Invalid login credentials',
        });
      }

      if (user.isDisabled) {
        throw new RpcException({
          statusCode: 403,
          message: 'Account disabled',
        });
      }

      if (!(await this.compare(dto.password, user.passwordHash))) {
        throw new RpcException({
          statusCode: 401,
          message: 'Invalid login credentials',
        });
      }

      user.lastLoginAt = new Date();
      await this.users.save(user);

      return {
        ...this.issueTokens(user),
        user,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error('loginPassword error', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Unexpected error occurred',
      });
    }
  }

  /* --------------------------------------------------
   ✅ SET PIN
  ---------------------------------------------------*/
  async setPin(userId: string, pin: string) {
    try {
       console.log(userId)
      const user = await this.users.findOneBy({ id: userId });
     
      if (!user) {
        throw new RpcException({
          statusCode: 404,
          message: 'User not found',
        });
      }

      user.pinHash = await this.hash(pin);
      user.pinEnabled = true;
      user.failedPinAttempts = 0;

      await this.users.save(user);
      return { message: 'PIN set successfully' };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error('setPin error', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to set PIN',
      });
    }
  }

  /* --------------------------------------------------
   ✅ LOGIN WITH PIN
  ---------------------------------------------------*/
  async loginPin(dto: LoginPinDto) {
    try {
      const user = await this.users.findOne({
        where: { email: dto.email, deletedAt: IsNull() },
      });

      if (!user) {
        throw new RpcException({
          statusCode: 401,
          message: 'Invalid login credentials',
        });
      }

      if (!user.pinEnabled) {
        throw new RpcException({
          statusCode: 403,
          message: 'PIN not set',
        });
      }

      if (user.isDisabled) {
        throw new RpcException({
          statusCode: 403,
          message: 'Account disabled',
        });
      }

      if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
        const remainingMs = user.pinLockedUntil.getTime() - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

        throw new RpcException({
          statusCode: 403,
          message: `PIN temporarily locked, try again in ${remainingMinutes} minute(s)`,
        });
      }

      const isValid = await this.compare(dto.pin, user.pinHash);
      if (!isValid) {
        user.failedPinAttempts = (user.failedPinAttempts || 0) + 1;
        if (user.failedPinAttempts >= 5) {
          user.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        await this.users.save(user);

        throw new RpcException({
          statusCode: 401,
          message: 'Invalid PIN',
        });
      }

      user.failedPinAttempts = 0;
      user.pinLockedUntil = null;
      user.lastLoginAt = new Date();
      await this.users.save(user);

      return { ...this.issueTokens(user),
        user };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error('loginPin error', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Unexpected error occurred',
      });
    }
  }

  /* --------------------------------------------------
   ✅ START PASSWORD RESET
  ---------------------------------------------------*/
  async startReset(dto: StartResetDto) {
    try {
      const user = await this.users.findOneBy({ email: dto.email });
      if (!user) {
        throw new RpcException({
          statusCode: 401,
          message: 'User Account Not Found. Thanks.',
        });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await this.resets.save({
        userId: user.id,
        codeHash: await this.hash(code),
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      });

      await this.email.sendPasswordReset(user.email, code);
      return { message: 'Reset email sent' };
    } catch (error) {
      this.logger.error('startReset error', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to start password reset',
      });
    }
  }

  /* --------------------------------------------------
   ✅ CONFIRM PASSWORD RESET
  ---------------------------------------------------*/
  async confirmReset(dto: ConfirmResetDto) {
    try {
      const user = await this.users.findOne({ where: { email: dto.email } });
      if (!user) {
        throw new RpcException({
          statusCode: 400,
          message: 'Invalid email',
        });
      }

      const record = await this.resets.findOne({
        where: { userId: user.id, used: false },
        order: { createdAt: 'DESC' },
      });

      if (!record) {
        throw new RpcException({
          statusCode: 401,
          message: 'Code invalid or expired',
        });
      }

      if (record.expiresAt < new Date()) {
        throw new RpcException({
          statusCode: 401,
          message: 'Code expired',
        });
      }

      if (!(await this.compare(dto.code, record.codeHash))) {
        throw new RpcException({
          statusCode: 401,
          message: 'Invalid code',
        });
      }

      user.passwordHash = await this.hash(dto.newPassword);
      record.used = true;
      await this.users.save(user);
      await this.resets.save(record);

      return { message: 'Password reset successful' };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error('confirmReset error', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to confirm reset',
      });
    }
  }

  /* --------------------------------------------------
   ✅ EMAIL VERIFICATION
  ---------------------------------------------------*/
  async startEmailVerification(email: string) {
    try {
      const existing = await this.users.findOne({ where: { email } });
      if (existing) {
        throw new RpcException({
          statusCode: 400,
          message: 'Email already registered',
        });
      }

      const code = OtpUtil.generateOtp();
      console.log(code)
      await this.verifications.save({
        email,
        codeHash: await this.hash(code),
        expiresAt: new Date(Date.now() + 1000 * 60 * 15),
        used: false,
      });

      await this.email.sendOtp(email, code);

      return {
        message: 'OTP sent to email',
        expiresInMinutes: 15,
        status: 'pending_email_verification',
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error('startEmailVerification error', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to start email verification',
      });
    }
  }

  async confirmEmailVerification(email: string, code: string) {
    try {
      const record = await this.verifications.findOne({
        where: { email, used: false },
        order: { createdAt: 'DESC' },
      });

      if (!record) {
        throw new RpcException({
          statusCode: 401,
          message: 'No verification request found',
        });
      }

      if (record.expiresAt < new Date()) {
        throw new RpcException({
          statusCode: 401,
          message: 'OTP expired, request a new one',
        });
      }

      const valid = await this.compare(code, record.codeHash);
      if (!valid) {
        throw new RpcException({
          statusCode: 401,
          message: 'Invalid OTP',
        });
      }

      record.used = true;
      await this.verifications.save(record);

      return {
        message: 'Email verified successfully',
        email,
        status: 'verified',
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error('confirmEmailVerification error', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Email verification failed',
      });
    }
  }

   async changePassword(userId: string, dto: ChangePasswordDto) {
    try {
      const user = await this.users.findOne({ where: { id: userId } });
      if (!user)
        throw new RpcException({ statusCode: 404, message: 'User not found' });

      const valid = await this.compare(dto.currentPassword, user.passwordHash);
      if (!valid)
        throw new RpcException({ statusCode: 400, message: 'Current password is incorrect' });

      user.passwordHash = await this.hash(dto.newPassword);
      await this.users.save(user);

      return { message: 'Password changed successfully' };
    } catch (err) {
      if (err instanceof RpcException) throw err;
      throw new RpcException({ statusCode: 500, message: 'Error changing password' });
    }
  }

  /** 🔢 Change PIN — RPC safe */
  async changePin(userId: string, dto: ChangePinDto) {
    try {
      const user = await this.users.findOne({ where: { id: userId } });
      if (!user)
        throw new RpcException({ statusCode: 404, message: 'User not found' });
      if (!user.pinEnabled)
        throw new RpcException({ statusCode: 400, message: 'PIN not set' });

      const valid = await this.compare(dto.oldPin, user.pinHash);
      if (!valid)
        throw new RpcException({ statusCode: 400, message: 'Old PIN is incorrect' });

      user.pinHash = await this.hash(dto.newPin);
      user.failedPinAttempts = 0;
      await this.users.save(user);

      return { message: 'PIN changed successfully' };
    } catch (err) {
      if (err instanceof RpcException) throw err;
      throw new RpcException({ statusCode: 500, message: 'Error changing PIN' });
    }
  }

  /** 🧍 Update profile — RPC safe */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      const user = await this.users.findOne({ where: { id: userId } });
      if (!user)
        throw new RpcException({ statusCode: 404, message: 'User not found' });

      Object.assign(user, dto);
      if (dto.dob) user.dob = new Date(dto.dob);

      await this.users.save(user);
      return { message: 'Profile updated successfully', user };
    } catch (err) {
      if (err instanceof RpcException) throw err;
      throw new RpcException({ statusCode: 500, message: 'Error updating profile' });
    }
  }


  async findById(userId: string) {
  const user = await this.users.findOne({ where: { id: userId } });
  if (!user) throw new RpcException({ message: 'User not found', statusCode: 404 });
  return user;
}

  
}