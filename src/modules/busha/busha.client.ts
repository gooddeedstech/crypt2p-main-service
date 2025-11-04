import axios, { AxiosInstance } from 'axios'
export class BushaClient {
  private http: AxiosInstance
  constructor(apiKey = process.env.BUSHA_SECRET_KEY!, baseURL = process.env.BUSHA_BASE_URL || 'https://api.commerce.busha.co') {
    this.http = axios.create({ baseURL, headers: { Authorization: `Bearer ${apiKey}` }, timeout: 15000 })
  }
  createAddress(params: { asset: 'BTC'|'ETH'|'USDT'; network?: string; label?: string }) { return this.http.post('/addresses', params).then(r => r.data) }
  createQuote(params: { side: 'SELL'|'BUY'; fromAsset: string; amount: string; to: 'NGN'|'USDT' }) { return this.http.post('/quotes', params).then(r => r.data) }
  executeTrade(params: { quoteId: string }) { return this.http.post('/trades', params).then(r => r.data) }
  getDeposit(id: string) { return this.http.get(`/deposits/${id}`).then(r => r.data) }
}
