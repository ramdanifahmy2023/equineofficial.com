import { eq } from 'drizzle-orm'
import { customerUsers } from '../../db/schema'
import { useDatabase } from '../../db/client'
import { createCustomerSession } from '../../utils/customer-auth'
import { verifyPassword } from '../../utils/auth'
import { isValidEmail, isValidPassword } from '../../utils/auth-validation'
import { enforceAuthRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  enforceAuthRateLimit(event, 'customer-login')
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = body.email?.trim().toLowerCase() || ''
  if (!isValidEmail(email) || !isValidPassword(body.password)) throw createError({ statusCode: 400, statusMessage: 'Email atau password tidak valid' })
  const [user] = await useDatabase().select().from(customerUsers).where(eq(customerUsers.email, email)).limit(1)
  if (!user || !body.password || !verifyPassword(body.password, user.passwordHash)) throw createError({ statusCode: 401, statusMessage: 'Email atau password salah' })
  await createCustomerSession(event, user.id)
  return { user: { id: user.id, email: user.email, name: user.name } }
})
