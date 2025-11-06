import * as crypto from 'crypto'
import * as argon2 from 'argon2'
import { randomBytes, createHash } from 'crypto'
export function hmacSha256Hex(secret: string, raw: Buffer | string) {
  return crypto.createHmac('sha256', secret).update(raw).digest('hex')
}
export function safeTimingEqual(a: string, b: string) {
  const s1 = Buffer.from(a); const s2 = Buffer.from(b)
  if (s1.length !== s2.length) return false
  return crypto.timingSafeEqual(s1, s2)
}

export async function hashPassword(pw: string) { return argon2.hash(pw, { type: argon2.argon2id }) }
export async function verifyPassword(hash: string, pw: string) { return argon2.verify(hash, pw) }
export function hashToken(token: string) { return createHash('sha256').update(token).digest('hex') }
export function randomNumericCode(len = 6) {
  const digits = '0123456789'
  let out = ''
  for (let i=0;i<len;i++) out += digits[Math.floor(Math.random()*digits.length)]
  return out
}
export function randomToken(len = 48) {
  return randomBytes(len).toString('base64url')
}

