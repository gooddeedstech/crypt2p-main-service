import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AdminAuthService } from './admin-auth.service';
import { ChangeAdminPasswordDto, ResetAdminPasswordDto } from './dto/admin-password.dto';
import { CreateAdminUserDto, UpdateAdminUserDto } from './dto/admin-user.dto';
import { UserAnalyticsService } from '../analytics/user-analytics.service';

@Controller()
export class AdminAuthMessageController {
  private readonly logger = new Logger(AdminAuthMessageController.name);

  constructor(private readonly adminAuthService: AdminAuthService,
    private readonly userAnalyticsService: UserAnalyticsService,
  ) {}

  /* -----------------------------------------------------------
   👤 Create New Admin (Super Admin Only)
  ------------------------------------------------------------*/
  @MessagePattern({ cmd: 'admin.create' })
  async handleCreateAdmin(@Payload() dto: CreateAdminUserDto) {
    try {
      this.logger.log(`📩 [admin.create] ${dto.email}`);
      return await this.adminAuthService.createAdmin(dto);
    } catch (error: any) {
      this.logger.error(`❌ handleCreateAdmin error: ${error.message}`);
      throw new RpcException(error);
    }
  }

   @MessagePattern({ cmd: 'admin.login' })
  async handleAdminLogin(@Payload() payload: { email: string; password: string }) {
    try {
      return await this.adminAuthService.login(payload.email, payload.password);
    } catch (err) {
      this.logger.error(`❌ handleAdminLogin error: ${err.message}`);
      throw new RpcException(err);
    }
  }

  /* -----------------------------------------------------------
   ⚙️ Update Admin Info
  ------------------------------------------------------------*/
  @MessagePattern({ cmd: 'admin.update' })
  async handleUpdateAdmin(
    @Payload() payload: { id: string; dto: UpdateAdminUserDto },
  ) {
    try {
      this.logger.log(`📩 [admin.update] ${payload.id}`);
      return await this.adminAuthService.updateAdmin(payload.id, payload.dto);
    } catch (error: any) {
      this.logger.error(`❌ handleUpdateAdmin error: ${error.message}`);
      throw new RpcException(error);
    }
  }

  /* -----------------------------------------------------------
   🔑 Change Admin Password (Authenticated)
  ------------------------------------------------------------*/
  @MessagePattern({ cmd: 'admin.change.password' })
  async handleChangePassword(
    @Payload() payload: { userId: string; dto: ChangeAdminPasswordDto },
  ) {
    try {
      this.logger.log(`📩 [admin.change-password] userId=${payload.userId}`);
      return await this.adminAuthService.changeAdminPassword(payload.userId, payload.dto);
    } catch (error: any) {
      this.logger.error(`❌ handleChangePassword error: ${error.message}`);
      throw new RpcException(error);
    }
  }

} 