import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { staffSessions, staffUsers } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { sessionHash, verifyPassword } from '../../../utils/auth'
import { isValidEmail, isValidPassword } from '../../../utils/auth-validation'
import { enforceAuthRateLimit } from '../../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  enforceAuthRateLimit(event, 'admin-login')
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = body.email?.trim().toLowerCase() || ''
  if (!isValidEmail(email) || !isValidPassword(body.password)) throw createError({ statusCode: 400, statusMessage: 'Email atau password tidak valid' })
  const db = useDatabase()
  const [user] = await db.select().from(staffUsers).where(eq(staffUsers.email, email)).limit(1)
  if (!user || !user.active || !verifyPassword(body.password, user.passwordHash)) throw createError({ statusCode: 401, statusMessage: 'Email atau password salah' })
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
  await db.insert(staffSessions).values({ userId: user.id, tokenHash: sessionHash(token), expiresAt })
  setCookie(event, 'equine_staff_session', token, { httpOnly: true, secure: !import.meta.dev, sameSite: 'strict', path: '/', expires: expiresAt })
  return { user: { name: user.name, email: user.email, role: user.role } }
})
