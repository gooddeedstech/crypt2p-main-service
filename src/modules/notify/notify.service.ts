import axios from 'axios'
import amqp from 'amqplib'

export class NotifyService {
  private ch?: amqp.Channel
  private ex = process.env.EVENT_EXCHANGE || 'crypt2p.events'

  async channel() {
    if (this.ch) return this.ch
    const url = process.env.RABBITMQ_URL
    if (!url) return undefined
    const conn = await amqp.connect(url)
    const ch = await conn.createChannel()
    await ch.assertExchange(this.ex, 'topic', { durable: true })
    this.ch = ch
    return ch
  }

  async publish(routingKey: string, payload: any) {
    const ch = await this.channel()
    if (!ch) return
    ch.publish(this.ex, routingKey, Buffer.from(JSON.stringify(payload)), { contentType: 'application/json', persistent: true })
  }

  async callback(event: string, payload: any) {
    const url = process.env.GATEWAY_CALLBACK_URL
    const token = process.env.GATEWAY_CALLBACK_BEARER
    if (!url) return
    await axios.post(url, { event, payload }, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  }
}
