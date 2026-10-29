import { eq } from 'drizzle-orm'
import { customerSessions } from '../../db/schema'
import { useDatabase } from '../../db/client'
import { sessionHash } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'equine_customer_session')
  if (token) await useDatabase().delete(customerSessions).where(eq(customerSessions.tokenHash, sessionHash(token)))
  deleteCookie(event, 'equine_customer_session', { path: '/' })
  return { ok: true }
})
