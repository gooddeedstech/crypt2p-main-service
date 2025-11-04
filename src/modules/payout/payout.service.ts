import axios from 'axios'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Payout } from '../../entities/payout.entity'
import { User } from '../../entities/user.entity'

@Injectable()
export class PayoutService {
  private http = axios.create({
    baseURL: 'https://api.paystack.co',
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
  })
  constructor(
    @InjectRepository(Payout) private payouts: Repository<Payout>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  private async ensureRecipient(user: User) {
    const res = await this.http.post('/transferrecipient', {
      type: 'nuban',
      name: user.fullName || 'Crypt2P User',
      account_number: user.bankAccountNo,
      bank_code: user.bankCode,
      currency: 'NGN',
    })
    return res.data?.data?.recipient_code as string
  }

  async sendToBank(params: { userId: string; amountNgn: number; narration: string }) {
    const user = await this.users.findOne({ where: { id: params.userId } })
    if (!user?.bankAccountNo || !user.bankCode) throw new Error('Missing bank details')
    const recipient = await this.ensureRecipient(user)
    const init = await this.http.post('/transfer', {
      source: 'balance',
      amount: Math.round(params.amountNgn * 100),
      recipient,
      reason: params.narration,
    })
    const paystackRef = init.data?.data?.reference
    return this.payouts.save(this.payouts.create({
      userId: user.id, depositId: 'SET_BY_CALLER', amountNgn: String(params.amountNgn), paystackRef, status: 'PROCESSING'
    }))
  }
}
