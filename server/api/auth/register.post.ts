import { eq } from 'drizzle-orm'
import { customerUsers } from '../../db/schema'
import { useDatabase } from '../../db/client'
import { createCustomerSession } from '../../utils/customer-auth'
import { hashPassword } from '../../utils/auth'
import { isValidEmail, isValidPassword } from '../../utils/auth-validation'
import { enforceAuthRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  enforceAuthRateLimit(event, 'customer-register')
  const body = await readBody<{ email?: string; password?: string; name?: string; phone?: string }>(event)
  const email = body.email?.trim().toLowerCase() || ''
  if (!isValidEmail(email) || !isValidPassword(body.password) || !body.name?.trim() || !body.phone?.trim()) throw createError({ statusCode: 400, statusMessage: 'Data akun tidak valid' })
  const [user] = await useDatabase().insert(customerUsers).values({ email, name: body.name.trim(), phone: body.phone.trim(), passwordHash: hashPassword(body.password) }).onConflictDoNothing({ target: customerUsers.email }).returning()
  if (!user) throw createError({ statusCode: 409, statusMessage: 'Email sudah terdaftar' })
  await createCustomerSession(event, user.id)
  return { user: { id: user.id, email: user.email, name: user.name } }
})
