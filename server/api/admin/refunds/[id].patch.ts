import { eq } from 'drizzle-orm'
import { refunds } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { requireStaff } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event, ['super_admin'])
  const id = getRouterParam(event, 'id') || ''
  const body = await readBody<{ action?: 'approve' | 'complete'; transferReference?: string }>(event)
  const [current] = await useDatabase().select().from(refunds).where(eq(refunds.id, id)).limit(1)
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Refund tidak ditemukan' })
  if (body.action === 'approve' && current.status === 'requested') {
    const [updated] = await useDatabase().update(refunds).set({ status: 'approved', approvedBy: user.id, approvedAt: new Date() }).where(eq(refunds.id, id)).returning()
    return updated
  }
  if (body.action === 'complete' && current.status === 'approved' && body.transferReference?.trim()) {
    const [updated] = await useDatabase().update(refunds).set({ status: 'completed', completedAt: new Date(), transferReference: body.transferReference.trim() }).where(eq(refunds.id, id)).returning()
    return updated
  }
  throw createError({ statusCode: 409, statusMessage: 'Transisi refund tidak valid' })
})
