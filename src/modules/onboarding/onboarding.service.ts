import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from '@/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PasswordReset } from '@/entities/password-reset.entity';
import { EmailVerification } from '@/entities/email-verification.entity';
import { EmailService } from '../notification/email.service';
import { ConfirmResetDto, LoginDto, LoginPinDto, RegisterDto, StartResetDto } from './dto/dtos';
import { OtpUtil } from '@/common/otp.util';
import { PaystackService } from '../paystack/paystack.service';

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
  const emailExists = await this.users.findOne({
    where: { email: dto.email },
  });

  const verified = await this.verifications.findOne({
    where: { email: dto.email, used: true },
    order: { createdAt: 'DESC' },
  });

  if (!verified) {
    throw new ForbiddenException('Please verify your email first');
  }

  if (emailExists) {
    throw new BadRequestException('Email already exists');
  }

  const phoneExists = await this.users.findOne({
    where: { phoneNumber: dto.phoneNumber },
  });
  if (phoneExists) {
    throw new BadRequestException('Phone number already exists');
  }

  // ✅ Create Paystack Customer Before Inserting User
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
    paystackCustomerCode: customer.customer_code, // ✅ Save here
  });

  await this.users.save(user);

  // ✅ Invalidate used verification code
  verified.used = true;
  await this.verifications.save(verified);

  return {
    message: 'Account created successfully',
    userId: user.id,
    paystackCustomerCode: user.paystackCustomerCode,
  };
}

  /* --------------------------------------------------
   ✅ LOGIN WITH EMAIL + PASSWORD (Primary)
  ---------------------------------------------------*/
  async loginPassword(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email, deletedAt: IsNull() } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.isDisabled) throw new ForbiddenException('Account disabled');

    if (!(await this.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await this.users.save(user);

    return {
      ...this.issueTokens(user),
      pinEnabled: user.pinEnabled,
      emailVerified: user.emailVerified,
    };
  }

  /* --------------------------------------------------
   ✅ SET PIN
  ---------------------------------------------------*/
  async setPin(userId: string, pin: string) {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new BadRequestException('User not found');

    if (!user.emailVerified) throw new ForbiddenException('Verify your email first');

    user.pinHash = await this.hash(pin);
    user.pinEnabled = true;
    user.failedPinAttempts = 0;

    await this.users.save(user);
    return { message: 'PIN set successfully' };
  }

  /* --------------------------------------------------
   ✅ LOGIN WITH PIN
  ---------------------------------------------------*/
  async loginPin(dto: LoginPinDto) {
    const user = await this.users.findOne({ where: { email: dto.email, deletedAt: IsNull() } });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.pinEnabled) throw new ForbiddenException('PIN not set');
    if (user.isDisabled) throw new ForbiddenException('Account disabled');
    if (!user.emailVerified) throw new ForbiddenException('Verify email first');

    // Check lockout
    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      throw new ForbiddenException('PIN temporarily locked, try later');
    }

    if (!(await this.compare(dto.pin, user.pinHash))) {
      user.failedPinAttempts++;

      if (user.failedPinAttempts >= 5) {
        user.pinLockedUntil = new Date(Date.now() + 1000 * 60 * 15); // 15 min
      }
      await this.users.save(user);
      throw new UnauthorizedException('Invalid PIN');
    }

    user.failedPinAttempts = 0;
    user.pinLockedUntil = null;
    user.lastLoginAt = new Date();
    await this.users.save(user);

    return this.issueTokens(user);
  }

  /* --------------------------------------------------
   ✅ START PASSWORD RESET
  ---------------------------------------------------*/
  async startReset(dto: StartResetDto) {
    const user = await this.users.findOneBy({ email: dto.email });
    if (!user) return { message: 'If that email exists, OTP sent' };

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.resets.save({
      userId: user.id,
      codeHash: await this.hash(code),
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    });

    await this.email.sendPasswordReset(user.email, code);

    return { message: 'Reset email sent' };
  }

  /* --------------------------------------------------
   ✅ CONFIRM PASSWORD RESET
  ---------------------------------------------------*/
  async confirmReset(dto: ConfirmResetDto) {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('Invalid email');

    const record = await this.resets.findOne({
      where: { userId: user.id, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!record) throw new UnauthorizedException('Code invalid or expired');
    if (record.expiresAt < new Date()) throw new UnauthorizedException('Code expired');

    if (!(await this.compare(dto.code, record.codeHash))) {
      throw new UnauthorizedException('Invalid code');
    }

    user.passwordHash = await this.hash(dto.newPassword);
    record.used = true;
    await this.users.save(user);
    await this.resets.save(record);

    return { message: 'Password reset successful' };
  }


async startEmailVerification(email: string) {
  const existing = await this.users.findOne({ where: { email } });
  if (existing) {
    throw new BadRequestException('Email already registered');
  }

  const code = OtpUtil.generateOtp();
console.log(code)
  await this.verifications.save({
    email,
    codeHash: await this.hash(code),
    expiresAt: new Date(Date.now() + 1000 * 60 * 15), // Expires in 15 mins
    used: false,
  });

  await this.email.sendOtp(email, code);

  return {
    message: 'OTP sent to email',
    expiresInMinutes: 15,
    status: 'pending_email_verification',
  };
}

async confirmEmailVerification(email: string, code: string) {
  const record = await this.verifications.findOne({
    where: { email, used: false },
    order: { createdAt: 'DESC' },
  });

  if (!record) {
    throw new UnauthorizedException('No verification request found');
  }

  if (record.expiresAt < new Date()) {
    throw new UnauthorizedException('OTP expired, request a new one');
  }

  const valid = await this.compare(code, record.codeHash);
  if (!valid) throw new UnauthorizedException('Invalid OTP');

  record.used = true;
  await this.verifications.save(record);

  return {
    message: 'Email verified successfully',
    email,
    status: 'verified',
  };
}
}