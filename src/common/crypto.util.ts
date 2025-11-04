import * as crypto from 'crypto'
export function hmacSha256Hex(secret: string, raw: Buffer | string) {
  return crypto.createHmac('sha256', secret).update(raw).digest('hex')
}
export function safeTimingEqual(a: string, b: string) {
  const s1 = Buffer.from(a); const s2 = Buffer.from(b)
  if (s1.length !== s2.length) return false
  return crypto.timingSafeEqual(s1, s2)
}
