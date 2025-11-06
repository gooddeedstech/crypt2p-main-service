import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);

  constructor(private readonly config: ConfigService) {}

  async createCustomer(email: string, phone: string, firstName: string, lastName: string) {
    const PAYSTACK_SECRET = this.config.get<string>('PAYSTACK_SECRET_KEY');

    try {
      const response = await axios.post(
        'https://api.paystack.co/customer',
        {
          email,
          phone,
          first_name: firstName,
          last_name: lastName,
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.data; // ✅ returns: { customer_code, id, ... }

    } catch (error) {
      this.logger.error('Paystack Customer Creation Failed:', error.response?.data ?? error);
      throw error;
    }
  }
}