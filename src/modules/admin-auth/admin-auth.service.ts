import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '@/entities/admin-user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RpcException } from '@nestjs/microservices';
import { ChangeAdminPasswordDto, ResetAdminPasswordDto } from './dto/admin-password.dto';
import { EmailService } from '../email-service/email.service';
import { CreateAdminUserDto, UpdateAdminUserDto } from './dto/admin-user.dto';
import { PasswordReset } from '@/entities/password-reset.entity';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password.trim(), 12);
}

private async verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password.trim(), hash);
}

  async createAdmin(dto: CreateAdminUserDto) {
    try {
      const exists = await this.adminRepo.findOne({ where: { email: dto.email } });
      if (exists)
        throw new RpcException({ message: 'Admin already exists', statusCode: 400 });

      const admin = this.adminRepo.create({
        email: dto.email,
        full_name: `${dto.firstName} ${dto.lastName}` ,
        role: dto.role,
        password_hash: await this.hashPassword(dto.password),
      });
      await this.adminRepo.save(admin);

      this.logger.log(`👤 New admin created: ${admin.email}`);
      return { message: 'Admin created successfully', admin };
    } catch (err) {
      this.logger.error(`❌ createAdmin error: ${err.message}`);
      throw err;
    }
  }

  async login(email: string, password: string) {
    const admin = await this.adminRepo.findOne({ where: { email } });
 
    if (!admin || admin.is_disabled)
      throw new RpcException({ message: 'Invalid credentials', statusCode: 401 });
 
    const isMatch = await this.verifyPassword(password, admin.password_hash);
    if (!isMatch)
      throw new RpcException({ message: 'Invalid credentials', statusCode: 401 });

    const payload = { sub: admin.id, email: admin.email, role: admin.role };
    const token = this.jwtService.sign(payload, { expiresIn: '1d' });

    return {
      message: 'Login successful',
      token,
      admin: { id: admin.id, name: admin.full_name, email: admin.email, role: admin.role },
    };
  }

  async verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return { valid: true, decoded };
    } catch {
      throw new RpcException({ message: 'Invalid or expired token', statusCode: 401 });
    }
  }

   /* -----------------------------------------------------------
   ✅ Update Admin Info
  ------------------------------------------------------------*/
  async updateAdmin(id: string, dto: UpdateAdminUserDto) {
    try {
      const admin = await this.adminRepo.findOne({ where: { id } });
      if (!admin) {
        throw new RpcException({ statusCode: 404, message: 'Admin not found' });
      }

      Object.assign(admin, dto);
      await this.adminRepo.save(admin);

      this.logger.log(`✅ Admin updated: ${admin.email}`);
      return { message: 'Admin details updated successfully', admin };
    } catch (error: any) {
      this.logger.error(`❌ updateAdmin error: ${error.message}`);
      throw new RpcException({ statusCode: 500, message: 'Failed to update admin details' });
    }
  }

  /* -----------------------------------------------------------
   🔑 Change Password (Authenticated)
  ------------------------------------------------------------*/
  async changeAdminPassword(userId: string, dto: ChangeAdminPasswordDto) {
    try {
      const admin = await this.adminRepo.findOne({ where: { id: userId} });
      if (!admin) {
        throw new RpcException({ statusCode: 404, message: 'Admin not found' });
      }

      const isValid = await bcrypt.compare(dto.currentPassword, admin.password_hash);
      if (!isValid) {
        throw new RpcException({ statusCode: 400, message: 'Current password is incorrect' });
      }

      admin.password_hash = await bcrypt.hash(dto.newPassword, 12);
      await this.adminRepo.save(admin);

      this.logger.log(`🔐 Password changed for admin: ${admin.email}`);
      return { message: 'Password changed successfully' };
    } catch (error: any) {
      this.logger.error(`❌ changeAdminPassword error: ${error.message}`);
      throw new RpcException({ statusCode: 500, message: `${error.message}` });
    }
  }

}