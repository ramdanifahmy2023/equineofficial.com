import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { staffSessions, staffUsers } from '../db/schema'
import { useDatabase } from '../db/client'

export const hashPassword = (password: string, salt = randomBytes(16).toString('hex')) => `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
export const verifyPassword = (password: string, stored: string) => {
  const [salt, digest] = stored.split(':')
  if (!salt || !digest || !/^[0-9a-f]{128}$/i.test(digest)) return false
  const actual = scryptSync(password, salt, 64)
  return timingSafeEqual(actual, Buffer.from(digest, 'hex'))
}
export const sessionHash = (token: string) => createHash('sha256').update(token).digest('hex')

export const requireStaff = async (event: any, roles?: string[]) => {
  const token = getCookie(event, 'equine_staff_session')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Login diperlukan' })
  const db = useDatabase()
  const [result] = await db.select({ user: staffUsers }).from(staffSessions).innerJoin(staffUsers, eq(staffSessions.userId, staffUsers.id)).where(and(eq(staffSessions.tokenHash, sessionHash(token)), gt(staffSessions.expiresAt, new Date()), eq(staffUsers.active, 1))).limit(1)
  if (!result || (roles && !roles.includes(result.user.role))) throw createError({ statusCode: 403, statusMessage: 'Akses ditolak' })
  return result.user
}
