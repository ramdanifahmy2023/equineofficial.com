import { eq } from 'drizzle-orm'
import { staffSessions } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { sessionHash } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'equine_staff_session')
  if (token) await useDatabase().delete(staffSessions).where(eq(staffSessions.tokenHash, sessionHash(token)))
  deleteCookie(event, 'equine_staff_session', { path: '/' })
  return { ok: true }
})
