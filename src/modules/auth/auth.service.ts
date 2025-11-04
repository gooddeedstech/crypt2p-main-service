import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../../entities/user.entity'
import * as bcrypt from 'bcryptjs'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService
  ) {}

  async register(email: string, password: string, fullName?: string) {
    const exists = await this.users.findOne({ where: { email } })
    if (exists) throw new BadRequestException('Email already in use')
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await this.users.save(this.users.create({ email, passwordHash, fullName }))
    return { id: user.id, email: user.email }
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email } })
    if (!user) throw new BadRequestException('Invalid credentials')
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) throw new BadRequestException('Invalid credentials')
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email })
    return { access_token: token, user: { id: user.id, email: user.email } }
  }
}
