import { randomBytes } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { customerSessions, customerUsers } from '../db/schema'
import { useDatabase } from '../db/client'
import { hashPassword, sessionHash, verifyPassword } from './auth'

export const requireCustomer = async (event: any) => {
  const token = getCookie(event, 'equine_customer_session')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Login diperlukan' })
  const [result] = await useDatabase().select({ user: customerUsers }).from(customerSessions).innerJoin(customerUsers, eq(customerSessions.userId, customerUsers.id)).where(and(eq(customerSessions.tokenHash, sessionHash(token)), gt(customerSessions.expiresAt, new Date()))).limit(1)
  if (!result) throw createError({ statusCode: 401, statusMessage: 'Sesi login tidak valid' })
  return result.user
}

export const createCustomerSession = async (event: any, userId: string) => {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await useDatabase().insert(customerSessions).values({ userId, tokenHash: sessionHash(token), expiresAt })
  setCookie(event, 'equine_customer_session', token, { httpOnly: true, secure: !import.meta.dev, sameSite: 'lax', path: '/', expires: expiresAt })
}

