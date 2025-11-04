import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Wallet } from '../../entities/wallet.entity'
import { User } from '../../entities/user.entity'
import { BushaClient } from './busha.client'

@Injectable()
export class BushaService {
  private client = new BushaClient()
  constructor(
    @InjectRepository(Wallet) private wallets: Repository<Wallet>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  async createUserAddress(dto: { userId: string; asset: 'BTC'|'ETH'|'USDT'; network?: string }) {
    const user = await this.users.findOne({ where: { id: dto.userId } })
    if (!user) throw new BadRequestException('User not found')

    const existing = await this.wallets.findOne({ where: { user: { id: dto.userId }, asset: dto.asset, network: dto.network ?? 'default' }, relations: ['user'] })
    if (existing) return existing

    const res = await this.client.createAddress({ asset: dto.asset, network: dto.network, label: user.email || user.id })
    const address = res?.data?.address ?? res?.address
    const providerRef = res?.data?.id ?? res?.id

    const wallet = this.wallets.create({ user, asset: dto.asset, network: dto.network ?? 'default', address, providerRef })
    return this.wallets.save(wallet)
  }
}
