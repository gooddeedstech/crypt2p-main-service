import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../../entities/user.entity'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private users: Repository<User>) {}
  create(data: Partial<User>) { return this.users.save(this.users.create(data)) }
  updateBank(id: string, bankAccountNo: string, bankCode: string) {
    return this.users.update({ id }, { bankAccountNo, bankCode })
  }
}
