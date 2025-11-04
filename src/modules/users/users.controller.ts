import { Body, Controller, Param, Patch, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UsersService } from './users.service'

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}
  @Post() create(@Body() dto: { email: string; passwordHash?: string; fullName?: string }) { return this.svc.create(dto) }
  @Patch(':id/bank') bank(@Param('id') id: string, @Body() dto: { bankAccountNo: string; bankCode: string }) {
    return this.svc.updateBank(id, dto.bankAccountNo, dto.bankCode)
  }
}
